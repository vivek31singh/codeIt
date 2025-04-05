import express from "express";
import { PrismaClient } from "@prisma/client";
import http from "http";
import { Server } from "socket.io";

// redis imports
import redis from "./lib/redisClient.js";

//  unique id genrerator imports
import { v4 as uuidv4 } from "uuid";
import { nanoid } from "nanoid";

const app = express();
const server = http.createServer(app);

const io = new Server(server, {
  cors: {
    origin: "*", // Update for production
    methods: ["GET", "POST"],
  },
});

io.on("connection", (socket) => {
  console.log("User connected:", socket.id);

  socket.on("EVENT", async ({ type, payload }, callback) => {
    switch (type) {
      case "CREATE_ROOM":
        try {
          const roomId = uuidv4(); // Unique Room ID
          const inviteCode = nanoid(6).toUpperCase(); // Short & User-Friendly Invite Code
          const admin = socket.id;

          const existingRoom = await redis.exists(`rooms:${roomId}`);

          if (existingRoom) {
            callback({ success: false, message: "Room already exists" });
            return;
          }

          await redis.hset(`rooms:${roomId}`, {
            admin,
            roomId: `rooms:${roomId}`,
            inviteCode,
            members: [
              {
                userId: payload.userId,
                fullname: payload.fullname,
                profileImg: payload.profileImg,
                socketId: socket.id,
              },
            ],
          });

          socket.join(roomId);
          if (callback) {
            callback({
              success: true,
              roomId,
              inviteCode,
            });
          }
        } catch (error) {
          console.error("Error in CREATE_ROOM:", error);
          callback({ message: "An error occurred. Please try again." });
        }
        break;

      case "REQUEST_JOIN_ROOM":
        try {
          const _inviteCode = payload?.inviteCode || "";

          if (!_inviteCode) {
            callback({ message: "Invalid invite code" });
            return;
          }

          // Fetch all room keys matching pattern "rooms:*"
          const allRooms = await redis.keys("rooms:*");

          // Find the requested room based on invite code
          let requestedRoom = null;
          for (const room of allRooms) {
            const roomData = await redis.hgetall(room);
            if (roomData.inviteCode === _inviteCode) {
              requestedRoom = roomData;
              break;
            }
          }

          if (!requestedRoom || !requestedRoom.roomId) {
            callback({ message: "Room does not exist" });
            return;
          }

          const requestedRoomId = requestedRoom.roomId.split(":")[1];
          const user = socket.id;

          // Check if user is already in the waiting room
          const waitingRoomKey = `waitingRooms:${requestedRoomId}`;
          const waitingUsers = await redis.lrange(waitingRoomKey, 0, -1);
          const userAlreadyExists = waitingUsers.some((userEntry) => {
            try {
              return userEntry.userId === payload.userId;
            } catch (error) {
              console.error("JSON parsing error:", error, "Value:", userEntry);
              return false; // Ignore corrupted entries
            }
          });

          // Check if user has already joined the room

          const userAlreadyExistsInRequestedRoom = (
            requestedRoom?.members ?? []
          ).some((member) => member?.userId === payload.userId);

          if (userAlreadyExists) {
            callback({
              message: "You have already requested to join this room",
            });
            return;
          }

          if (userAlreadyExistsInRequestedRoom) {
            callback({
              message: "You have already joined this room",
            });
            return;
          }

          // Store user request in waiting room
          const userEntry = JSON.stringify({
            user,
            roomId: `rooms:${requestedRoomId}`,
            userId: payload.userId,
            fullname: payload.fullname,
            profileImg: payload.profileImg,
          });

          const moveUserToWaitingRoom = await redis.rpush(
            waitingRoomKey,
            userEntry
          );
          if (!moveUserToWaitingRoom) {
            callback({ message: "Failed to move user to waiting room" });
            return;
          }

          // Fetch updated waiting room users
          const updatedWaitingRoomData = await redis.lrange(
            waitingRoomKey,
            0,
            -1
          );

          // Notify room admin
          socket.to(requestedRoom.admin).emit("EVENT", {
            type: "SEND_JOIN_REQUEST",
            payload: {
              user,
              roomId: `rooms:${requestedRoomId}`,
              userId: payload.userId,
              fullname: payload.fullname,
              profileImg: payload.profileImg,
              waitingRoom: updatedWaitingRoomData,
            },
          });

          callback({ message: "Join request sent" });
        } catch (error) {
          console.error("Error in REQUEST_JOIN_ROOM:", error);
          callback({ message: "An error occurred. Please try again." });
        }
        break;

      case "ACCEPT_JOIN_REQUEST":
        try {
          const { userId: joiningUser, roomId: joiningRoomId } = payload;

          if (!joiningUser || !joiningRoomId) {
            callback({ message: "Invalid join request" });
            return;
          }

          const joiningRoom = await redis.hgetall(joiningRoomId);

          if (!joiningRoom) {
            callback({ message: "Room does not exist" });
            return;
          }

          if (joiningRoom.admin !== socket.id) {
            callback({ message: "You are not the admin of this room" });
            return;
          }

          if (
            joiningRoom.members.find((member) => member.userId === joiningUser)
          ) {
            callback({ message: "User already in room" });
            return;
          }

          // Add user to room

          const waitingRoomId = joiningRoomId?.split(":")[1];
          const waitingRoom = await redis.lrange(
            `waitingRooms:${waitingRoomId}`,
            0,
            -1
          );

          if (!waitingRoom?.length) {
            callback({ message: "Waiting room does not exist" });
            return;
          }

          const waitingUser = waitingRoom?.find(
            (user) => user?.userId === joiningUser
          );

          if (!waitingUser) {
            callback({ message: "User not found in waiting room" });
            return;
          }

          socket.to(waitingUser?.user).emit("EVENT", {
            type: "JOIN_REQUEST_RESULT",
            payload: {
              joinRequestAccepted: true,
              user: waitingUser?.user,
              userId: waitingUser?.userId,
              roomId: waitingUser?.roomId,
            },
          });

          callback({ message: "Join request aceepted successfully" });
        } catch (error) {
          console.error("Error in ACCEPT_JOIN_REQUEST:", error);
          callback({ message: "An error occurred. Please try again." });
        }

        break;

      case "REJECT_JOIN_REQUEST":
        try {
          const { userId: joiningUser, roomId: joiningRoomId } = payload;

          if (!joiningUser || !joiningRoomId) {
            callback({ message: "Invalid reject request" });
            return;
          }

          const joiningRoom = await redis.hgetall(joiningRoomId);

          if (!joiningRoom) {
            callback({ message: "Room does not exist" });
            return;
          }

          if (joiningRoom.admin !== socket.id) {
            callback({ message: "You are not the admin of this room" });
            return;
          }

          // i have a bug here, the user is the socket id not the actual userid from db, remove all instances of this bug thoroughly

          console.log("joining user", joiningUser);
          if (
            joiningRoom.members.find((member) => member.userId === joiningUser)
          ) {
            callback({ message: "User already in room" });
            return;
          }

          // Add user to room

          const waitingRoomId = joiningRoomId?.split(":")[1];
          const waitingRoom = await redis.lrange(
            `waitingRooms:${waitingRoomId}`,
            0,
            -1
          );

          if (!waitingRoom?.length) {
            callback({ message: "Waiting room does not exist" });
            return;
          }

          const waitingUser = waitingRoom?.find(
            (user) => user?.userId === joiningUser
          );

          if (!waitingUser) {
            callback({ message: "User not found in waiting room" });
            return;
          }

          // remove user from waiting room

          const removedUser = await redis.lrem(
            `waitingRooms:${waitingRoomId}`,
            0,
            JSON.stringify(waitingUser)
          );

          if (!removedUser) {
            callback({ message: "User not found in waiting room" });
            return;
          }

          socket.to(waitingUser?.user).emit("EVENT", {
            type: "JOIN_REQUEST_RESULT",
            payload: {
              joinRequestAccepted: false,
            },
          });

          callback({ message: "Join request rejected successfully" });
        } catch (error) {
          console.error("Error in REJECT_JOIN_REQUEST:", error);
          callback({ message: "An error occurred. Please try again." });
        }

        break;

      case "JOIN_ROOM":
        try {
          const { userId: joiningUser, roomId: joiningRoomId } = payload;

          if (!joiningUser || !joiningRoomId) {
            callback({ message: "Invalid join request" });
            return;
          }

          const joiningRoomExists = await redis.exists(joiningRoomId);

          if (!joiningRoomExists) {
            callback({ message: "Room does not exist" });
            return;
          }

          // Add user to room
          socket.join(joiningRoomId?.split(":")[1]);

          const waitingRoomId = `waitingRooms:${joiningRoomId?.split(":")[1]}`;

          const waitingRoom = await redis.lrange(waitingRoomId, 0, -1);

          if (!waitingRoom?.length) {
            callback({ message: "Waiting room does not exist" });
            return;
          }

          const waitingUser = waitingRoom.find(
            (user) => user.userId === joiningUser
          );

          if (!waitingUser) {
            callback({ message: "User not found in waiting room" });
            return;
          }

          const joinedRoom = await redis.hgetall(joiningRoomId);

          if (!joinedRoom?.members) {
            joinedRoom.members = [];
          }

          joinedRoom.members.push({
            userId: waitingUser.userId,
            fullname: waitingUser.fullname,
            profileImg: waitingUser.profileImg,
            socketId: waitingUser.user,
          });

          await redis.hmset(joiningRoomId, {
            members: JSON.stringify(joinedRoom.members),
          });

          // Remove the user from the waiting room properly
          const removedUser = await redis.lrem(
            waitingRoomId,
            0,
            JSON.stringify(waitingUser)
          );

          if (removedUser === 0) {
            callback({ message: "User not found in waiting room" });
            return;
          }

          const joiningRoom = await redis.hgetall(joiningRoomId);

          socket.to(joiningRoom?.admin).emit("EVENT", {
            type: "UPDATED_ROOM_MEMBERS",
            payload: {
              message: "Updated room members successfully",
              roomMembers: joinedRoom.members,
            },
          });

          callback({
            message: "Join request accepted successfully",
            roomId: joiningRoomId?.split(":")[1],
          });
        } catch (err) {
          console.log("Error in JOIN_ROOM:", err);
          callback({ message: "An error occurred. Please try again." });
        }
        break;

      case "GET_ROOM_MEMBERS":
        try {
          const { roomId } = payload;

          const roomExists = await redis.exists(`rooms:${roomId}`);

          if (!roomExists) {
            callback({ message: "Room does not exist" });
            return;
          }

          const room = await redis.hgetall(`rooms:${roomId}`);

          callback({
            message: "Room members retrieved successfully",
            roomMembers: room?.members || [],
          });
        } catch (err) {
          console.log("Error in GET_ROOM_MEMBERS:", err);
          callback({ message: "An error occurred. Please try again." });
        }
        break;
      default:
        break;
    }
  });

  // // ✅ JOIN Room
  // socket.on("JOIN", ({ room, username, userId, profileImg }) => {
  //   console.log("User joined room:", username, room);
  //   socket.join(room); // Add user to room

  //   if (!rooms[room]) {
  //     rooms[room] = [];
  //   }

  //   let existingUser = rooms[room].find((user) => user.userId === userId);
  //   if (existingUser) {
  //     existingUser.username = username;
  //     existingUser.profileImg = profileImg;
  //   } else {
  //     rooms[room].push({ username, userId, profileImg, socketId: socket.id });
  //   }

  //   // Notify only users in this room
  //   io.to(room).emit("NEW_USER_JOINED", {
  //     members: rooms[room],
  //     admin: rooms[room][0],
  //     newUser: { username, userId, profileImg, socketId: socket.id },
  //   });
  // });

  // // ✅ Send a message in a specific room
  // socket.on("SEND_MESSAGE", ({ room, message, sender }) => {
  //   console.log(`Message from ${sender} in room ${room}: ${message}`);

  //   // Send message only to users in the room
  //   io.to(room).emit("RECEIVE_MESSAGE", { sender, message });
  // });

  // // ✅ Handle User Disconnect
  // socket.on("disconnect", () => {
  //   console.log("User disconnected:", socket.id);

  //   for (const room in rooms) {
  //     rooms[room] = rooms[room].filter((user) => user.socketId !== socket.id);
  //     io.to(room).emit("NEW_USER_JOINED", rooms[room]);

  //     if (rooms[room].length === 0) {
  //       delete rooms[room];
  //     }
  //   }
  // });
});
const prisma = new PrismaClient();

setInterval(async () => {
  try {
    await prisma.$queryRaw`SELECT 1;`;
    console.log("Supabase DB kept alive");
  } catch (err) {
    console.error("Database keep-alive failed:", err);
  }
}, 60000);

const PORT = 3001;
server.listen(PORT, () => {
  console.log(`WebSocket server running on http://localhost:${PORT}`);
});
