import { io, Socket } from "socket.io-client";
import { create } from "zustand";

 interface SocketState {
  socket: Socket | null;
  connect: () => void;
  disconnect: () => void;
}

const SOCKET_SERVER_URL = process.env.NEXT_PUBLIC_WSS_URL ?? "";

export const useSocket = create<SocketState>((set, get) => ({
  socket: null,

  connect: () => {
    let { socket } = get();

    if (!socket) {
      socket = io(SOCKET_SERVER_URL, { autoConnect: true, reconnection: true });

      set({ socket });

      socket.on("connect", () => {
        console.log("Socket connected:", socket?.id);
      });

      socket.on("disconnect", () => {
        console.log("Socket disconnected");
      });
    }
  },

  disconnect: () => {
    const { socket } = get();
    if (socket) {
      socket.off(); // Remove all listeners before disconnecting
      socket.disconnect();
      set({ socket: null });
    }
  },
}));
