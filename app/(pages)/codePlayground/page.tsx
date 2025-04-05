"use client";

import { SidebarTrigger } from "@/components/ui/sidebar";
import { useSocket } from "@/lib/store/useSocket";
import { useUser } from "@/lib/store/useUser";
import { motion } from "framer-motion";
import { useRouter } from "next/navigation";
import React from "react";

interface CreateRoomResponse {
  roomId: string;
  inviteCode: string;
  success: boolean;
}

interface JoinRoomResponse extends CreateRoomResponse {
  message: string;
}

const Page = () => {
  const router = useRouter();

  // socket stuff
  const { socket } = useSocket();

  // user stuff
  const { user } = useUser();

  const [inviteCode, setInviteCode] = React.useState("");

  const handleCreateRoom = () => {
    // make a socket.emit to create a room
    socket?.emit(
      "EVENT",
      {
        type: "CREATE_ROOM",
        payload: {
          userId: user?.userId,
          fullname: user?.fullName,
          profileImg: user?.profileImg,
        },
      },
      ({ roomId, inviteCode, success }: CreateRoomResponse) => {
        if (success) {
          router.push(`/codePlayground/codeEditor/${roomId}/${inviteCode}`);
        }
      }
    );
  };

  const handleInviteCodeInput = (e: React.ChangeEvent<HTMLInputElement>) => {
    setInviteCode(e.target.value);
  };

  const handleJoinRoom = () => {
    if (!inviteCode) {
      return;
    }

    // make a socket.emit to join a room and notify the admin of the room
    socket?.emit(
      "EVENT",
      {
        type: "REQUEST_JOIN_ROOM",
        payload: {
          inviteCode: inviteCode,
          userId: user?.userId,
          fullname: user?.fullName,
          profileImg: user?.profileImg,
        },
      },
      ({ message }: JoinRoomResponse) => {
        console.log("message", message);
        if (message === "Join request sent") {
          router.push(`/codePlayground/waitingRoom`);
        }

        // handle other messages here and show a toast or something to user if needed
      }
    );
  };

  return (
    <motion.main
      initial={{ x: -100, opacity: 0 }}
      animate={{ x: 0, opacity: 1 }}
      transition={{ duration: 0.5 }}
      className="bg-white w-full transition ease duration-300 ml-0 overflow-hidden"
    >
      <div className="w-full flex flex-col items-center justify-between space-y-2">
        <div className="relative pb-16 pt-6 sm:pb-24 lg:pb-32 h-screen w-full">
          <div className="w-full flex items-center justify-between">
            <SidebarTrigger />
          </div>
          <main className="mx-auto mt-16 max-w-7xl px-6 sm:mt-24 lg:mt-32">
            <div className="flex items-center justify-center w-full">
              <div className="sm:text-center md:mx-auto md:max-w-2xl lg:col-span-6 lg:text-left space-y-6">
                <h1 className="capitalize">
                  <span className="block text-base font-semibold text-gray-500 sm:text-lg lg:text-base xl:text-lg">
                    coding playground
                  </span>
                  <span className="mt-1 block text-4xl font-bold tracking-tight sm:text-5xl xl:text-6xl">
                    <span className="block text-gray-900">
                      Practice coding fundamentals
                    </span>
                    <span className="block text-indigo-600">
                      with peers & mentors
                    </span>
                  </span>
                </h1>
                <p className="mt-3 text-base text-gray-500 sm:mt-5 sm:text-xl lg:text-lg xl:text-xl">
                  Practice coding fundamentals such as algorithms, data
                  structures with peers and mentors in real-time.
                </p>
                <div className="flex flex-col sm:flex-row items-center space-x-2 sm:space-x-6 space-y-4 sm:space-y-0 text-sm">
                  <button
                    className="px-4 py-2 rounded-xl bg-blue-500 text-white"
                    onClick={handleCreateRoom}
                  >
                    new room
                  </button>
                  <span className="text-gray-500 text-sm sm:text-lg font-semibold">
                    or
                  </span>

                  <div className="flex items-center space-x-2">
                    <input
                      className="border px-4 py-2 rounded-xl"
                      type="text"
                      placeholder="Enter invite Code"
                      value={inviteCode}
                      onChange={handleInviteCodeInput}
                    />
                    <button
                      className="px-4 py-2 rounded-xl bg-green-500 text-white"
                      onClick={handleJoinRoom}
                    >
                      Join Room
                    </button>
                  </div>
                </div>
              </div>
            </div>
          </main>
        </div>
      </div>
    </motion.main>
  );
};

export default Page;

// ------------------------
