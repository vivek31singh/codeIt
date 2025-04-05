"use client";

import React, { useState, useEffect } from "react";
import { motion } from "framer-motion";
import { Play, UserPlus2 } from "lucide-react";
import gql from "graphql-tag";
import { useMutation } from "@apollo/client";
import { supabase } from "@/lib/supabase/supabaseClient";
import { useUser } from "@/lib/store/useUser";
import { SidebarTrigger } from "@/components/ui/sidebar";
import dynamic from "next/dynamic";
import { Prism as SyntaxHighlighter } from "react-syntax-highlighter";
import { dracula } from "react-syntax-highlighter/dist/cjs/styles/prism";
import {
  ResizableHandle,
  ResizablePanel,
  ResizablePanelGroup,
} from "@/components/ui/resizable";
import {
  Sheet,
  SheetContent,
  SheetHeader,
  SheetTitle,
  SheetTrigger,
} from "@/components/ui/sheet";

// inivite functionality imports
import { toast } from "sonner";
import * as Y from "yjs";

// websocket
import AnimatedTooltip from "@/components/reusable/animatedTooltip";
import { useRouter } from "next/navigation";
import { useSocket } from "@/lib/store/useSocket";
import Image from "next/image";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
// import Image from "next/image";

const MonacoEditor = dynamic(() => import("@monaco-editor/react"), {
  ssr: false,
});

const RUNCODE = gql`
  mutation runCode($id: String!, $language: String!, $code: String!) {
    runCode(id: $id, language: $language, code: $code) {
      output
      error
    }
  }
`;

const ydoc = new Y.Doc();
const yText = ydoc.getText("monaco");
// const provider = new WebrtcProvider("monaco-room", ydoc, {
//   signaling: ["ws://localhost:5555"], // Alternative signaling server
// });

// provider.on("status", (event) => {
//   console.log("WebRTC status:", event.connected); // "connected" or "disconnected"
// });

// const awareness = provider.awareness; // Enable WebRTC awareness

// awareness.on("change", () => {
//   console.log("Awareness state changed:", Array.from(awareness.getStates().values()));
// });

interface Member {
  fullname: string;
  profileImg: string;
  socketId: string;
  userId: string;
}

const Page = ({ params }: { params: { slug: string[] } }) => {
  const router = useRouter();
  const { user } = useUser();

  // socket related stuff
  const { socket } = useSocket();

  // get roomId from url and store it in a state
  const [roomId, setRoomId] = useState("");
  const [inviteCode, setInviteCode] = useState("");
  const [roomMembers, setRoomMembers] = useState<Member[]>([]);
  const [waitingRoomMembers, setWaitingRoomMembers] = useState<Member[]>([]);
const [selectedMembersList, setSelectedMembersList] = useState("joinedMemberList");
  useEffect(() => {
    (async function () {
      const { slug } = (await params) ?? [];
      if (!slug) {
        return;
      }

      if (!user) {
        router.push("/login");
        return;
      }
      setRoomId(slug[0] || "");
      setInviteCode(slug[1] || "");
    })();
  }, [params, user, router]);

  const acceptInvite = ({
    userId,
    roomId,
  }: {
    userId: string;
    roomId: string;
  }) => {
    if (!socket) return;

    socket?.emit(
      "EVENT",
      {
        type: "ACCEPT_JOIN_REQUEST",
        payload: {
          userId,
          roomId,
        },
      },
      ({ message }: { message: string }) => {
        console.log("accept response", message);
      }
    );
  };

  const declineInvite = ({
    userId,
    roomId,
  }: {
    userId: string;
    roomId: string;
  }) => {
    if (!socket) return;

    socket?.emit(
      "EVENT",
      {
        type: "REJECT_JOIN_REQUEST",
        payload: {
          userId,
          roomId,
        },
      },
      ({ message }: { message: string }) => {
        console.log("decline response", message);
      }
    );
  };

  useEffect(() => {
    if (!socket) return;
    socket?.on("EVENT", ({ type, payload }) => {
      switch (type) {
        case "SEND_JOIN_REQUEST":
          const { userId, fullname, profileImg, waitingRoom, roomId } = payload;

          setWaitingRoomMembers(waitingRoom);

          toast(
            <div className="flex flex-col space-y-3 p-3">
              <div className="flex items-start justify-between space-x-3">
                <Image
                  src={
                    profileImg ||
                    `https://placehold.co/600x400?text=${
                      fullname?.charAt(0) || "U"
                    }`
                  }
                  alt="admin"
                  width={40}
                  height={40}
                  className="w-12 h-12 rounded-full object-cover border border-gray-300"
                />

                {/* Text Content */}
                <div className="flex-1 text-left">
                  <p className="text-sm font-medium">
                    {fullname || "User"} wants to join!
                  </p>
                  <p className="text-xs text-gray-600">
                    {fullname || "User"} wants to join the playground! Do you
                    accept?
                  </p>
                </div>
              </div>

              <div className="flex justify-end space-x-3">
                <button
                  className="px-3 py-1 text-xs font-medium bg-gray-200 hover:bg-gray-300 text-gray-800 rounded transition"
                  onClick={() => {
                    console.log("decline clicked for user", user);
                    declineInvite({ userId, roomId });
                  }}
                >
                  Decline
                </button>
                <button
                  className="px-3 py-1 text-xs bg-blue-500 text-white rounded hover:bg-blue-600 transition"
                  onClick={() => {
                    console.log("accept clicked for user", user);

                    acceptInvite({ userId, roomId });
                  }}
                >
                  Accept
                </button>
              </div>
            </div>
          );

          break;

        case "UPDATED_ROOM_MEMBERS":
          const { message, roomMembers } = payload;
          if (message === "Updated room members successfully") {
            setRoomMembers(roomMembers);
          }
          break;

        default:
          break;
      }
    });

    return () => {
      socket.off("EVENT"); // Clean up
    };
  }, [socket, user]);

  useEffect(() => {
    if (!socket) {
      return;
    }
    if (roomId) {
      socket.emit(
        "EVENT",
        {
          type: "GET_ROOM_MEMBERS",
          payload: {
            roomId,
          },
        },
        ({
          message,
          roomMembers,
        }: {
          message: string;
          roomMembers: Member[];
        }) => {
          if (message === "Room members retrieved successfully") {
            setRoomMembers(roomMembers);
          }
        }
      );
    }
  }, [socket, roomId]);

  // useEffect(() => {
  //   const timeout = setTimeout(() => {
  //     if (!user) {
  //       router.push("/login");
  //     }
  //   }, 6000);

  //   return () => clearTimeout(timeout);
  // }, [user, router]);

  // -----------------------------------------------------------------------
  // websocket
  // const SOCKET_SERVER_URL = process.env.NEXT_PUBLIC_WSS_URL;

  // const [socket, setSocket] = useState<Socket | null>(null);
  // const [members, setMembers] = useState<Member[] | null>(null);

  //   useEffect(() => {
  //     const newSocket = io(SOCKET_SERVER_URL, { autoConnect: true });
  //     setSocket(newSocket);

  //     newSocket.on("connect", () => {
  //       newSocket.emit("JOIN", {
  //         userId: user?.userId,
  //         username: user?.fullName,
  //         profileImg: user?.profileImg,
  //         room: roomId,
  //       });

  //       newSocket.on("NEW_USER_JOINED", ({ members, newUser, admin }) => {
  //         setMembers(members);
  //         if (
  //           admin?.userId === user?.userId &&
  //           admin?.username &&
  //           admin?.profileImg
  //         ) {
  //           toast(
  //             <div className="flex flex-col space-y-3 p-3">
  //               <div className="flex items-start justify-between space-x-3">
  //                 {/* Image on the left */}
  //                 {members.length === 1 ? (
  //                   <>
  //                     {admin?.profileImg && (
  //                       <Image
  //                         src={
  //                           admin?.profileImg ||
  //                           `https://placehold.co/600x400?text=${
  //                             admin?.username?.charAt(0) || "U"
  //                           }`
  //                         }
  //                         alt="admin"
  //                         width={40}
  //                         height={40}
  //                         className="w-12 h-12 rounded-full object-cover border border-gray-300"
  //                       />
  //                     )}
  //                     {/* Text Content */}
  //                     <div className="flex-1 text-left">
  //                       <p className="text-sm font-medium">
  //                         {`Welcome ${
  //                           user?.fullName || "Coder"
  //                         }! Invite friends to the playground.`}
  //                       </p>
  //                       <p className="text-xs text-gray-600">
  //                         Share the invite link with friends or collaborators.
  //                       </p>
  //                     </div>
  //                   </>
  //                 ) : (
  //                   <>
  //                     {newUser?.profileImg && (
  //                       <Image
  //                         src={
  //                           newUser?.profileImg ||
  //                           `https://placehold.co/600x400?text=${
  //                             admin?.username?.charAt(0) || "U"
  //                           }`
  //                         }
  //                         alt="newUser"
  //                         width={40}
  //                         height={40}
  //                         className="w-12 h-12 rounded-full object-cover border border-gray-300"
  //                       />
  //                     )}
  //                     {/* Text Content */}
  //                     <div className="flex-1 text-left">
  //                       <p className="text-sm font-medium">
  //                         {newUser?.username || "User"} wants to join!
  //                       </p>
  //                       <p className="text-xs text-gray-600">
  //                         {newUser?.username || "User"} wants to join the
  //                         playground! Do you accept?
  //                       </p>
  //                     </div>
  //                   </>
  //                 )}
  //               </div>

  //               {/* Buttons Section */}
  //               {user?.userId !== newUser?.userId && (
  //                 <div className="flex justify-end space-x-3">
  //                   <button
  //                     className="px-3 py-1 text-xs font-medium bg-gray-200 hover:bg-gray-300 text-gray-800 rounded transition"
  //                     onClick={() => {}}
  //                   >
  //                     Decline
  //                   </button>
  //                   <button
  //                     className="px-3 py-1 text-xs bg-blue-500 text-white rounded hover:bg-blue-600 transition"
  //                     onClick={() => {}}
  //                   >
  //                     Accept
  //                   </button>
  //                 </div>
  //               )}
  //             </div>
  //           );
  //         } else {
  //           toast.info(
  //             <div className="flex flex-col space-y-3 p-2">
  //               <div className="flex items-center text-primary">
  //                 <div className="w-full flex flex-col items-start justify-center">
  //                   <p className="text-sm font-medium">
  //                     {user?.userId === newUser?.userId && members.length === 1
  //                       ? `Welcome ${
  //                           user?.fullName || "coder"
  //                         }! Invite friends or collaborators to the playground.`
  //                       : `
  // ${newUser?.username || "New user"} wants to join!
  // `}
  //                   </p>
  //                   <p className="text-xs font-medium">
  //                     {user?.userId === newUser?.userId
  //                       ? "Share the invite link with friends or collaborators to join the playground."
  //                       : `  ${newUser?.username || "New user"} wants to join the
  //                   playground! Do you accept?`}
  //                   </p>
  //                 </div>
  //               </div>
  //               {user?.userId !== newUser?.userId && (
  //                 <div className="flex justify-end space-x-2">
  //                   <button
  //                     className="px-3 py-1 text-xs font-medium bg-gray-200 hover:bg-gray-300 text-gray-800 rounded transition-colors"
  //                     onClick={() => {
  //                       // toast.dismiss();
  //                       // newSocket.emit("DECLINE_NEW_USER", {
  //                       //   userId: newUser?.userId,
  //                       //   room: roomId,
  //                       // });
  //                     }}
  //                   >
  //                     Decline
  //                   </button>
  //                   <button
  //                     className="px-3 py-1 text-xs bg-blue-500 text-white rounded hover:bg-blue-600 transition-colors"
  //                     onClick={() => {
  //                       // toast.dismiss();
  //                       // newSocket.emit("ACCEPT_NEW_USER", {
  //                       //   userId: newUser?.userId,
  //                       //   room: roomId,
  //                       // });
  //                     }}
  //                   >
  //                     Accept
  //                   </button>
  //                 </div>
  //               )}
  //             </div>
  //           );
  //         }
  //       });
  //     });

  //     // ✅ Listen for messages in the room
  //     newSocket.on("RECEIVE_MESSAGE", ({ sender, message }) => {
  //       // setMessages((prev) => [...prev, { sender, message }]);
  //       console.log(`Message from ${sender}: ${message}`);
  //     });

  //     newSocket.on("disconnect", () => {
  //       console.log("Disconnected from server");
  //     });

  //     return () => {
  //       newSocket.disconnect();
  //     };
  //   }, [user, SOCKET_SERVER_URL, roomId]);

  //   members?.map((member) => console.log("members old one", member?.userId));

  //   socket?.emit("SEND_MESSAGE", {
  //     room: roomId,
  //     message: "Hello Room!",
  //     sender: user?.fullName,
  //   });

  // -----------------------------------------------------------------------

  const [runCode] = useMutation(RUNCODE);
  const [loading, setLoading] = useState(false);
  const [output, setOutput] = useState("");
  const [error, setError] = useState("");

  const [code, setCode] = useState(yText.toString());
  const [selectedLanguage, setSelectedLanguage] = useState("typescript");

  // ✅ Load saved code from localStorage & update Yjs
  useEffect(() => {
    const savedCode = localStorage.getItem("userCode") || "";
    if (yText.toString() !== savedCode) {
      yText.delete(0, yText.toString().length);
      yText.insert(0, savedCode);
      setCode(savedCode);
    }
  }, []);

  // ✅ Sync Monaco Editor when Yjs updates
  useEffect(() => {
    const updateEditor = () => setCode(yText.toString());
    yText.observe(updateEditor);
    return () => yText.unobserve(updateEditor);
  }, []);

  const handleRunCode = async () => {
    if (loading) return;
    setLoading(true);

    const { data: authData, error: authError } = await supabase.auth.getUser();
    if (authError || authData?.user?.aud !== "authenticated") {
      setLoading(false);
      return;
    }

    const { data, errors } = await runCode({
      variables: {
        id: user?.userId,
        language: selectedLanguage,
        code: code,
      },
    });

    if (!errors) {
      setOutput(data.runCode.output);
      setError(data.runCode.error);
    }

    setLoading(false);
  };
  return (
    <motion.main
      initial={{ x: -100, opacity: 0 }}
      animate={{ x: 0, opacity: 1 }}
      transition={{ duration: 0.5 }}
      className="bg-white w-full transition ease duration-300 ml-0 overflow-hidden"
    >
      <div className="w-full flex items-center justify-between px-4 py-2">
        <SidebarTrigger />
        <div className="flex items-center justify-between space-x-6">
          <button
            className={`p-2 rounded-lg
               
            //  text-text-primary hover:text-blue-600 transition ease-in duration-300 border flex items-center justify-center cursor-pointer px-6 py-3 text-md`}
            onClick={() =>
              navigator.share({
                title: "Collaborate with me in Code Editor!",
                text: `Hey! I'm working on a project in Code Editor and I'd love for you to join me. Click here to join the playground: ${inviteCode}`,
                url: inviteCode,
              })
            }
          >
            <UserPlus2 className="mr-1" /> Invite
          </button>
          <button
            className={`p-2 rounded-lg ${
              loading ? "bg-gray-400" : "bg-blue-500"
            } text-white shadow-md flex items-center justify-center cursor-pointer px-6 py-3 text-md`}
            onClick={handleRunCode}
          >
            {loading ? (
              "Running..."
            ) : (
              <>
                <Play className="mr-1" /> Run
              </>
            )}
          </button>

          <Sheet>
            <SheetTrigger>
              <AnimatedTooltip data={roomMembers || []} />
            </SheetTrigger>
            <SheetContent>
              <SheetHeader>
                <SheetTitle>Room Members</SheetTitle>
                {/* <SheetDescription>
                  This sheet shows all the users that have joined the room as well as the users that are waiting to be joined in the waiting room.
                </SheetDescription> */}
                <>
                  <main className="flex items-center justify-start w-full border-b space-x-2">
                    <h6 className="py-4 text-sm capitalize cursor-pointer text-text-primary" onClick={()=> setSelectedMembersList("joinedMemberList")}>
                      joined members
                    </h6>
                    <h6 className="py-4 text-sm capitalize cursor-pointer text-text-primary" onClick={()=> setSelectedMembersList("waitingList")}>
                      waiting list
                    </h6>
                  </main>

                  <ul className="flex flex-col items-center justify-center w-full">
                    { selectedMembersList === "joinedMemberList" && roomMembers.length ?
                      roomMembers.map((member) => (
                        <li
                          key={member.userId}
                          className="border-b w-full flex items-center justify-between"
                        >
                          <div className="flex items-center justify-center space-x-2 py-2">
                            <Avatar>
                              <AvatarImage src={member?.profileImg} />
                              <AvatarFallback>
                                {member?.fullname?.charAt(0) || "U"}
                              </AvatarFallback>
                            </Avatar>
                            <div className="flex flex-col items-center justify-center">
                              <p className="shrink-0 text-sm p-2">
                                {member?.fullname}
                              </p>
                            </div>
                          </div>
                          <p>actions</p>
                        </li>
                      )): selectedMembersList === "waitingList" && waitingRoomMembers.length ? waitingRoomMembers.map((member) => (
                        <li
                          key={member.userId}
                          className="border-b w-full flex items-center justify-between"
                        >
                          <div className="flex items-center justify-center space-x-2 py-2">
                            <Avatar>
                              <AvatarImage src={member?.profileImg} />
                              <AvatarFallback>
                                {member?.fullname?.charAt(0) || "U"}
                              </AvatarFallback>
                            </Avatar>
                            <div className="flex flex-col items-center justify-center">
                              <p className="shrink-0 text-sm p-2">
                                {member?.fullname}
                              </p>
                            </div>
                          </div>
                          <p>actions</p>
                        </li>
                      )): <h1>show that no users have joined</h1>}
                  </ul>
                </>
              </SheetHeader>
            </SheetContent>
          </Sheet>
        </div>
      </div>
      <div className="w-full flex flex-col bg-gray-200 items-center justify-between h-screen space-y-2">
        <ResizablePanelGroup
          direction="horizontal"
          className="rounded-lg w-full"
        >
          <ResizablePanel defaultSize={50}>
            <div className="flex h-full items-center justify-center border">
              <MonacoEditor
                height="100%"
                language={selectedLanguage}
                theme="vs-dark"
                options={{
                  fontSize: 16,
                  minimap: { enabled: false },
                  scrollBeyondLastLine: false,
                  automaticLayout: true,
                }}
                value={code} // ✅ Ensures state updates reflect in the editor
                onChange={(value) => {
                  yText.delete(0, yText.toString().length);
                  yText.insert(0, value ?? "");
                  localStorage.setItem("userCode", value ?? "");
                }}
              />
            </div>
          </ResizablePanel>
          <ResizableHandle />
          <ResizablePanel defaultSize={50}>
            <div className="h-full flex flex-col">
              <div className="bg-gray-700 text-white p-2 border-b">
                <span className="font-semibold">Console</span>
              </div>
              <div className="flex-1 overflow-y-auto p-2 text-black">
                {output && (
                  <SyntaxHighlighter language={selectedLanguage} style={dracula}>
                    {output}
                  </SyntaxHighlighter>
                )}
                {error && (
                  <SyntaxHighlighter language={selectedLanguage} style={dracula}>
                    {error}
                  </SyntaxHighlighter>
                )}
              </div>
            </div>
          </ResizablePanel>
        </ResizablePanelGroup>
      </div>
    </motion.main>
  );
};

export default Page;
