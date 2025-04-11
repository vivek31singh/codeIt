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
            admin: {
              userId: payload.userId,
              socketId: admin,
            },
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

      case "REFRESH_SOCKET_ID":
        try {
          const { roomId, userId } = payload || {};

          if (!roomId || !userId) {
            callback({ message: "Invalid payload" });
            return;
          }

          const room = await redis.hgetall(`rooms:${roomId}`);

          if (!room) {
            callback({ message: "Room does not exist" });
            return;
          }

          if (room.admin.userId === userId) {
            room.admin.socketId = socket.id;
          }

          const member = (room.members ?? []).find(
            (member) => member?.userId === userId
          );

          if (member.socketId === socket.id) {
            callback({ message: "Socket ID already refreshed" });
          }

          room.members = (room.members ?? []).map((member) => {
            if (member.userId === userId) {
              return {
                ...member,
                socketId: socket.id,
              };
            }
            return member;
          });

          await redis.hset(`rooms:${roomId}`, room);

          const waitingRoom = await redis.lrange(
            `waitingRooms:${roomId}`,
            0,
            -1
          );

          if (room.admin.socketId === socket.id) {
            callback({
              message: "Socket ID refreshed successfully",
              waitingRoom,
            });
          }

          callback({ message: "Socket ID refreshed successfully" });
        } catch (err) {
          console.log("Error in REFRESH_SOCKET_ID:", err);
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
          socket.to(requestedRoom.admin.socketId).emit("EVENT", {
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
          const { userId: joiningUser, roomId: joiningRoomId, offer } = payload;

          if (!joiningUser || !joiningRoomId) {
            callback({ message: "Invalid join request" });
            return;
          }

          const joiningRoom = await redis.hgetall(joiningRoomId);

          if (!joiningRoom) {
            callback({ message: "Room does not exist" });
            return;
          }

          if (joiningRoom.admin.socketId !== socket.id) {
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
              offer,
            },
          });

          callback({ message: "Join request aceepted successfully" });
        } catch (error) {
          console.error("Error in ACCEPT_JOIN_REQUEST:", error);
          callback({ message: "An error occurred. Please try again." });
        }

        break;

      case "SEND_ADMIN_ICE_CANDIDATE":
        const { from, to, roomId, candidate } = payload;

        if (!from || !to || !roomId || !candidate) {
          return;
        }

        const waitingRoom = await redis.lrange(`waitingRooms:${roomId}`, 0, -1);

        if (!waitingRoom?.length) {
          return;
        }

        const waitingUser = waitingRoom?.find((user) => user?.userId === to);

        if (!waitingUser) {
          return;
        }

        socket.to(waitingUser?.user).emit("EVENT", {
          type: "ADMIN_CANDIDATE",
          payload: {
            from,
            roomId,
            candidate,
          },
        });

        break;

      case "SEND_USER_ICE_CANDIDATE":
        const { from: sender, roomId: userRoomId, candidate: userCandidate } = payload;

        if (!sender || !userRoomId || !userCandidate) {
          return;
        }

        const room = await redis.hgetall(`rooms:${userRoomId}`);

        if (!room) {
          return;
        }

        const admin = room?.admin?.socketId;

        if(!admin) {
          return;
        }

        socket.to(admin).emit("EVENT", {
          type: "USER_CANDIDATE",
          payload: {
            candidate: userCandidate,
          },
        });
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

          if (joiningRoom.admin.socketId !== socket.id) {
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

          // remove user from waiting room

          const waitingRoomWithoutRejectedUser = waitingRoom.filter(
            (user) => user.userId !== waitingUser?.userId
          );
          await redis.del(`waitingRooms:${waitingRoomId}`);

          if (waitingRoomWithoutRejectedUser.length > 0) {
            const stringifiedWaitingRoomWithoutRejectedUser =
              waitingRoomWithoutRejectedUser.map((user) =>
                JSON.stringify(user)
              );
            await redis.rpush(
              `waitingRooms:${waitingRoomId}`,
              ...stringifiedWaitingRoomWithoutRejectedUser
            );
          }

          socket.to(waitingUser?.user).emit("EVENT", {
            type: "JOIN_REQUEST_RESULT",
            payload: {
              joinRequestAccepted: false,
            },
          });

          callback({
            message: "Join request rejected successfully",
            WaitingRoom: waitingRoomWithoutRejectedUser,
          });
        } catch (error) {
          console.error("Error in REJECT_JOIN_REQUEST:", error);
          callback({ message: "An error occurred. Please try again." });
        }

        break;

      case "JOIN_ROOM":
        try {
          const {
            userId: joiningUser,
            roomId: joiningRoomId,
            answer,
          } = payload;

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

          const updatedWaitingRoom = waitingRoom.filter(
            (user) => user.userId !== joiningUser
          );

          await redis.del(waitingRoomId);

          if (updatedWaitingRoom.length > 0) {
            const stringifiedWaitingRoom = updatedWaitingRoom.map((user) =>
              JSON.stringify(user)
            );
            await redis.rpush(waitingRoomId, ...stringifiedWaitingRoom);
          }

          const joiningRoom = await redis.hgetall(joiningRoomId);

          socket.to(joiningRoom?.admin.socketId).emit("EVENT", {
            type: "INCOMING_ANSWER",
            payload: {
              message: "Incoming answer",
              answer,
            },
          });

          socket.to(joiningRoom?.admin.socketId).emit("EVENT", {
            type: "UPDATED_ROOM_MEMBERS",
            payload: {
              message: "Updated room members successfully",
              roomMembers: joinedRoom.members,
              waitingRoom: updatedWaitingRoom,
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
