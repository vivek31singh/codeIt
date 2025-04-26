"use client";

import React, { useEffect, useState } from "react";
import { useSocket } from "@/lib/store/useSocket";
import { useRouter } from "next/navigation";
import { useUser } from "@/lib/store/useUser";
import { usePeer } from "@/lib/store/usePeer";

const WaitingRoom = () => {
    const { socket } = useSocket();
    const router = useRouter();
    const [joinRequestResult, setJoinRequestResult] = useState<boolean | null>(
      null
    );
  
    const { createAnswer, addAndGenerateCandidate } = usePeer();
  
    useEffect(() => {
      if (!socket) {
        return;
      }
  
      socket.on("EVENT", async ({ type, payload }) => {
        switch (type) {
          case "JOIN_REQUEST_RESULT":
            try {
              const { joinRequestAccepted, userId, roomId, offer } = payload;
  
              const answer = await createAnswer(offer);
  
              if (joinRequestAccepted) {
                setJoinRequestResult(true);
                socket.emit(
                  "EVENT",
                  {
                    type: "JOIN_ROOM",
                    payload: {
                      userId,
                      roomId,
                      answer,
                    },
                  },
                  ({ message, roomId }: { message: string; roomId: string }) => {
                    if (message === "Join request accepted successfully") {
                      router.push(`/codePlayground/codeEditor/${roomId}`);
                      return;
                    } else {
                      console.log(
                        "message in JOIN_REQUEST_ACCEPTED Event:",
                        message
                      );
                    }
                  }
                );
              } else {
                setJoinRequestResult(false);
                console.log("Join request rejected");
  
                return;
              }
            } catch (err) {
              console.log("Error in JOIN_REQUEST_RESULT:", err);
            }
  
            break;
  
          case "ADMIN_CANDIDATE":
            const {candidate, roomId, from} = payload;
            
            await addAndGenerateCandidate({candidate, from, roomId, socket});
            break;
  
          default:
            break;
        }
      });
  
      return () => {
        socket.off("EVENT"); // Clean up
      };
    }, [socket, router, createAnswer, addAndGenerateCandidate]);
  
    const { user } = useUser();
  
    return (
      <div className="flex items-center justify-center min-h-screen bg-gradient-to-br from-indigo-100 via-white to-white px-4 py-16">
        <div className="w-full max-w-md bg-white rounded-3xl shadow-2xl p-8 border border-gray-200 transition-all duration-300">
          {/* Heading */}
          <h2 className="text-4xl font-bold text-center text-indigo-700 tracking-wide">
            Waiting Room
          </h2>
  
          {/* Status Message */}
          <p className="mt-4 text-center text-gray-600 text-base">
            {joinRequestResult === null &&
              "Please wait while the admin reviews your request..."}
            {joinRequestResult === true &&
              "You're accepted! Redirecting you to the room..."}
            {joinRequestResult === false &&
              "Your request was rejected. You can try again."}
          </p>
  
          {/* Status Icon */}
          <div className="mt-6 flex justify-center">
            {joinRequestResult === null && (
              <svg
                className="w-12 h-12 text-indigo-500 animate-spin"
                xmlns="http://www.w3.org/2000/svg"
                fill="none"
                viewBox="0 0 24 24"
              >
                <circle
                  className="opacity-25"
                  cx="12"
                  cy="12"
                  r="10"
                  stroke="currentColor"
                  strokeWidth="4"
                ></circle>
                <path
                  className="opacity-75"
                  fill="currentColor"
                  d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"
                ></path>
              </svg>
            )}
  
            {joinRequestResult === true && (
              <svg
                className="w-12 h-12 text-green-500 animate-bounce"
                xmlns="http://www.w3.org/2000/svg"
                fill="currentColor"
                viewBox="0 0 20 20"
              >
                <path
                  fillRule="evenodd"
                  d="M16.707 5.293a1 1 0 010 1.414L9 14.414 5.293 10.707a1 1 0 011.414-1.414L9 11.586l6.293-6.293a1 1 0 011.414 0z"
                  clipRule="evenodd"
                />
              </svg>
            )}
  
            {joinRequestResult === false && (
              <svg
                className="w-12 h-12 text-red-500"
                fill="none"
                stroke="currentColor"
                viewBox="0 0 24 24"
                xmlns="http://www.w3.org/2000/svg"
              >
                <path
                  strokeLinecap="round"
                  strokeLinejoin="round"
                  strokeWidth="2"
                  d="M6 18L18 6M6 6l12 12"
                />
              </svg>
            )}
          </div>
  
          {/* User Info */}
          <div className="mt-8 bg-gray-50 border border-gray-200 rounded-xl p-5 text-sm text-gray-800 space-y-1">
            <p>
              <span className="font-medium">👤 Name:</span> {user?.fullName}
            </p>
            <p>
              <span className="font-medium">📧 Email:</span> {user?.email}
            </p>
          </div>
  
          {/* Tips */}
          {joinRequestResult === null && (
            <div className="mt-6 text-xs text-center text-gray-500">
              <p>🔄 This page will auto-refresh when the admin responds.</p>
              <p>🕓 Please don’t close this tab.</p>
            </div>
          )}
  
          {/* CTA - Try Again */}
          {joinRequestResult === false && (
            <div className="mt-6 text-center">
              <button
                onClick={() => router.push("/codePlayground")}
                className="inline-block px-5 py-2 text-sm font-medium text-white bg-indigo-600 hover:bg-indigo-700 rounded-lg shadow-md transition"
              >
                Try Again
              </button>
            </div>
          )}
        </div>
      </div>
    );
};

export default WaitingRoom;
