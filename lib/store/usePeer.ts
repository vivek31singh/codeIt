import { create } from "zustand";
import { Socket } from "socket.io-client";
import { setupYjsSync } from "../webrtc/setupYjsSync";

interface CreateOfferType {
  from: string;
  to: string;
  roomId: string;
  socket: Socket;
}

interface addAndGenerateCandidateType {
  candidate: RTCIceCandidateInit;
  from: string;
  roomId: string;
  socket: Socket;
}

interface PeerState {
  peer: RTCPeerConnection | null;
  dataChannel: RTCDataChannel | null;
  adminIceCandidates: RTCIceCandidateInit[];
  connect: () => void;
  disconnect: () => void;
  createOffer: (
    CreateOfferType: CreateOfferType
  ) => Promise<RTCSessionDescriptionInit | undefined>;
  createAnswer: (
    offer: RTCSessionDescriptionInit
  ) => Promise<RTCSessionDescriptionInit | undefined>;
  setAnswer: (answer: RTCSessionDescriptionInit) => Promise<void>;

  addAndGenerateCandidate: (
    addAndGenerateCandidateType: addAndGenerateCandidateType
  ) => Promise<void>;
  addIceCandidate: (candidate: RTCIceCandidateInit) => Promise<void>;
}

export const usePeer = create<PeerState>((set, get) => ({
  peer: null,
  dataChannel: null,
  adminIceCandidates: [],

  connect: () => {
    const { peer } = get();

    if (!peer) {
      const newPeer = new RTCPeerConnection({
        iceServers: [
          {
            urls: [
              "stun:stun.l.google.com:19302",
              "stun:global.stun.twilio.com:3478",
            ],
          },
        ],
      });

      set({ peer: newPeer });
    }
  },

  disconnect: () => {
    const { peer } = get();

    if (peer) {
      peer.close();
      set({ peer: null });
    }
  },

  createOffer: async ({ from, to, roomId, socket }) => {
    const { peer } = get();

    if (!peer) {
      return;
    }

    const dataChannel = peer.createDataChannel("yjs-codeplayground");
    dataChannel.binaryType = "arraybuffer";

    setupYjsSync(dataChannel);
    set({
      dataChannel: dataChannel,
    });

    peer.onicecandidate = (event) => {
      if (event.candidate) {
        socket?.emit("EVENT", {
          type: "SEND_ADMIN_ICE_CANDIDATE",
          payload: {
            from,
            to,
            roomId: roomId.split(":")[1],
            candidate: event.candidate,
          },
        });
      }
    };

    const offer = await peer.createOffer();
    await peer.setLocalDescription(offer);

    return offer;
  },

  createAnswer: async (offer) => {
    const { peer, adminIceCandidates } = get();

    if (!peer || !offer) {
      return;
    }

    peer.ondatachannel = (event) => {
      if (event.channel.label === "yjs-codeplayground") {
        const channel = event.channel;
        channel.binaryType = "arraybuffer";
        set({
          dataChannel: channel,
        });

        channel.onopen = () => {
          console.log("✅ DataChannel open on user side");
          setupYjsSync(channel); // 👈 hook it up to Yjs right away
        };

        channel.onerror = (e) => console.error("❌ DataChannel error", e);
      }
    };

    await peer?.setRemoteDescription(offer);

    const answer = await peer?.createAnswer();

    for (const candidate of adminIceCandidates) {
      await peer?.addIceCandidate(candidate);
    }
    set({ adminIceCandidates: [] }); // clear after applying

    await peer?.setLocalDescription(answer);
    return answer;
  },

  setAnswer: async (answer) => {
    const { peer } = get();

    if (!peer || !answer) {
      return;
    }

    await peer?.setRemoteDescription(answer);
  },

  addAndGenerateCandidate: async ({ candidate, from, roomId, socket }) => {
    const { peer } = get();

    if (!peer) {
      console.warn("[ICE] ❌ Peer connection is null.");
      return;
    }

    if (!candidate || !from || !roomId || !socket) {
      return;
    }

    try {
      if (peer.remoteDescription === null) {
        set((state) => ({
          adminIceCandidates: [...state.adminIceCandidates, candidate],
        }));
      }

      // Setup ICE gathering for this peer (only once)

      peer.onicecandidate = (event) => {
        if (event.candidate) {
          socket.emit("EVENT", {
            type: "SEND_USER_ICE_CANDIDATE",
            payload: {
              from,
              roomId,
              candidate: event.candidate,
            },
          });
        }
      };
    } catch (error) {
      console.error("[ICE] ❌ Error adding ICE candidate:", error);
    }
  },

  addIceCandidate: async (candidate) => {
    const { peer } = get();
    if (!peer || !candidate) {
      return;
    }

    if (peer.remoteDescription === null) {
      // The remote description is not set yet, try to add the candidate after a delay
      setTimeout(async () => {
        if (peer.remoteDescription !== null) {
          await peer?.addIceCandidate(candidate);
        }
      }, 100);
    } else {
      await peer?.addIceCandidate(candidate);
    }
  },
}));
