"use client";

import React, { useState, useEffect, useCallback } from "react";
import { motion } from "framer-motion";
import { EllipsisVertical, Play, UserPlus2 } from "lucide-react";
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

import { Menu, MenuButton, MenuItem, MenuItems } from "@headlessui/react";
import { EllipsisVerticalIcon } from "@heroicons/react/20/solid";

// inivite functionality imports
import { toast } from "sonner";

// websocket
import AnimatedTooltip from "@/components/reusable/animatedTooltip";
import { useRouter } from "next/navigation";
import { useSocket } from "@/lib/store/useSocket";
import Image from "next/image";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { usePeer } from "@/lib/store/usePeer";

// code sharing imports
import { yText, awareness } from "@/lib/webrtc/setupYjsSync";
import { MonacoBinding } from "y-monaco";

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

interface Member {
  fullname: string;
  profileImg: string;
  socketId: string;
  userId: string;
}

interface WaitingMember
  extends Pick<Member, "fullname" | "profileImg" | "userId"> {
  user: string;
  roomId: string;
}

const Page = ({ params }: { params: Promise<{ slug: string[] }> }) => {
  const router = useRouter();
  const { user } = useUser();

  // socket related stuff
  const { socket } = useSocket();

  // get roomId from url and store it in a state
  const [roomId, setRoomId] = useState("");
  const [inviteCode, setInviteCode] = useState("");
  const [roomMembers, setRoomMembers] = useState<Member[]>([]);
  const [waitingRoomMembers, setWaitingRoomMembers] = useState<WaitingMember[]>(
    []
  );
  const [selectedMembersList, setSelectedMembersList] =
    useState("joinedMemberList");
  useEffect(() => {
    (async function () {
      const { slug } = (await params) ?? [];
      if (!slug) {
        return;
      }

      setRoomId(slug[0] || "");
      setInviteCode(slug[1] || "");
    })();
  }, [params, user, router]);

  // WEBRTC CODE

  const { createOffer, setAnswer, addIceCandidate } = usePeer();

  const acceptInvite = useCallback(
    async ({ userId, roomId }: { userId: string; roomId: string }) => {
      if (!socket || !user) return;

      const offer = await createOffer({
        from: user.userId,
        to: userId,
        roomId,
        socket,
      });

      socket?.emit(
        "EVENT",
        {
          type: "ACCEPT_JOIN_REQUEST",
          payload: {
            userId,
            roomId,
            offer,
          },
        },
        ({ message }: { message: string }) => {
          console.log("accept response", message);
        }
      );
    },
    [socket, user, createOffer]
  );

  const declineInvite = useCallback(
    ({ userId, roomId }: { userId: string; roomId: string }) => {
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
        ({
          message,
          waitingRoom,
        }: {
          message: string;
          waitingRoom: WaitingMember[];
        }) => {
          console.log("decline response", message);
          setWaitingRoomMembers(waitingRoom);
        }
      );
    },
    [socket]
  );

  useEffect(() => {
    if (!socket) return;
    socket?.on("EVENT", async ({ type, payload }) => {
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
          const { message, roomMembers, updatedWaitingRoomMembers } = payload;
          if (message === "Updated room members successfully") {
            setRoomMembers(roomMembers);
            console.log(
              "updated waiting room members",
              updatedWaitingRoomMembers
            );
            setWaitingRoomMembers(updatedWaitingRoomMembers);
          }
          break;

        case "INCOMING_ANSWER":
          const { answer } = payload;

          if (!answer) {
            return;
          }
          await setAnswer(answer);
          break;

        case "USER_CANDIDATE":
          const { candidate } = payload;

          if (!candidate) {
            return;
          }

          await addIceCandidate(candidate);
          break;
        default:
          break;
      }
    });

    return () => {
      socket.off("EVENT");
    };
  }, [socket, user, acceptInvite, declineInvite, setAnswer, addIceCandidate]);

  useEffect(() => {
    if (!socket) {
      return;
    }
    if (roomId && user?.userId) {
      socket.emit(
        "EVENT",
        {
          type: "REFRESH_SOCKET_ID",
          payload: {
            roomId,
            userId: user?.userId,
          },
        },
        ({
          message,
          waitingRoom,
        }: {
          message: string;
          waitingRoom: WaitingMember[];
        }) => {
          if (message === "Socket ID refreshed successfully") {
            setWaitingRoomMembers(waitingRoom);
          }
        }
      );
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
  }, [socket, roomId, user?.userId]);

  const [runCode] = useMutation(RUNCODE);
  const [loading, setLoading] = useState(false);
  const [output, setOutput] = useState("");
  const [error, setError] = useState("");

  const [code, setCode] = useState(yText.toString());

  const [selectedLanguage, setSelectedLanguage] = useState("typescript");

  const toggleSelectedLanguage = (language: string) => {
    setSelectedLanguage(language);
  };

  // CODE SHARING LOGIC

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
    setCode(yText.toString());
  }, []);

  useEffect(() => {
    const observer = () => {
      const updatedText = yText.toString();
      localStorage.setItem("userCode", updatedText);
      setCode(updatedText);
    };

    yText.observe(observer);

    return () => {
      yText.unobserve(observer);
      console.log("🔁 yText observer cleaned up");
    };
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

  const ActionMenu = ({ member }: { member: WaitingMember }) => {
    return (
      <Menu as="div" className="relative inline-block text-left">
        <div>
          <MenuButton className="flex items-center rounded-full bg-gray-100 text-gray-400 hover:text-gray-600 focus:outline-none focus:ring-2 focus:ring-indigo-500 focus:ring-offset-2 focus:ring-offset-gray-100">
            <span className="sr-only">Open options</span>
            <EllipsisVerticalIcon aria-hidden="true" className="size-5" />
          </MenuButton>
        </div>

        <MenuItems
          transition
          className="absolute right-0 z-10 mt-2 w-56 origin-top-right rounded-md bg-white shadow-lg ring-1 ring-black/5 transition focus:outline-none data-[closed]:scale-95 data-[closed]:transform data-[closed]:opacity-0 data-[enter]:duration-100 data-[leave]:duration-75 data-[enter]:ease-out data-[leave]:ease-in"
        >
          <div className="py-1">
            <MenuItem>
              <a
                href="#"
                className="block px-4 py-2 text-sm text-gray-700 data-[focus]:bg-gray-100 data-[focus]:text-gray-900 data-[focus]:outline-none"
                onClick={() => {
                  acceptInvite({
                    userId: member?.userId,
                    roomId: member?.roomId,
                  });
                }}
              >
                Accept Invite
              </a>
            </MenuItem>
            <MenuItem>
              <a
                href="#"
                className="block px-4 py-2 text-sm text-gray-700 data-[focus]:bg-gray-100 data-[focus]:text-gray-900 data-[focus]:outline-none"
                onClick={() =>
                  declineInvite({
                    userId: member?.userId,
                    roomId: member?.roomId,
                  })
                }
              >
                Decline Invite
              </a>
            </MenuItem>
          </div>
        </MenuItems>
      </Menu>
    );
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
          <button
            className={`p-2 rounded-lg ${
              loading ? "bg-gray-400" : "bg-blue-500"
            } text-white shadow-md flex items-center justify-center cursor-pointer px-6 py-3 text-md`}
            onClick={() => toggleSelectedLanguage("javasscript")}
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

                <>
                  <main className="flex items-center justify-start w-full border-b space-x-2">
                    <h6
                      className="py-4 text-sm capitalize cursor-pointer text-text-primary"
                      onClick={() => setSelectedMembersList("joinedMemberList")}
                    >
                      joined members
                    </h6>
                    <h6
                      className="py-4 text-sm capitalize cursor-pointer text-text-primary"
                      onClick={() => setSelectedMembersList("waitingList")}
                    >
                      waiting list
                    </h6>
                  </main>

                  <ul className="flex flex-col items-center justify-center w-full">
                    {selectedMembersList === "joinedMemberList" &&
                    roomMembers.length ? (
                      roomMembers.map((member, index) => (
                        <li
                          key={member.userId ?? index}
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
                          <EllipsisVertical
                            size={22}
                            onClick={() => {
                              console.log("clicked", member);
                            }}
                          />
                        </li>
                      ))
                    ) : selectedMembersList === "waitingList" &&
                      waitingRoomMembers?.length ? (
                      waitingRoomMembers?.map((member) => (
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
                          <ActionMenu member={member} />
                        </li>
                      ))
                    ) : (
                      <h1>show that no users have joined</h1>
                    )}
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
                onMount={(editor) => {
                  const model = editor.getModel();
                  if (!model) {
                    console.error("❌ Monaco model not found");
                    return;
                  }

                  try {
                    new MonacoBinding(
                      yText, // your Y.Text instance
                      model, // Monaco model
                      new Set([editor]), // All editor instances (just one here)
                      awareness // your Awareness instance
                    );
                    console.log("✅ MonacoBinding applied");
                  } catch (err) {
                    console.error("❌ MonacoBinding failed:", err);
                  }
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
                  <SyntaxHighlighter
                    language={selectedLanguage}
                    style={dracula}
                  >
                    {output}
                  </SyntaxHighlighter>
                )}
                {error && (
                  <SyntaxHighlighter
                    language={selectedLanguage}
                    style={dracula}
                  >
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
