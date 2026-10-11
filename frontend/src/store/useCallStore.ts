import { create } from "zustand";
import type { Socket } from "socket.io-client";
import { axiosInstance } from "../lib/axios";
import { useAuthStore } from "./useAuthStore";
import toast from "react-hot-toast";

export interface CallPeer {
  _id: string;
  fullName: string;
  profilePic?: string;
}

export interface IncomingCall {
  from: string;
  fromName?: string;
  callType: "voice" | "video";
  offer: RTCSessionDescriptionInit;
}

interface ActiveCall {
  peer: CallPeer;
  type: "voice" | "video";
  direction: "incoming" | "outgoing";
  status: "ringing" | "connected";
  startedAt: number;
}

interface CallState {
  incoming: IncomingCall | null;
  active: ActiveCall | null;
  muted: boolean;
  cameraOff: boolean;
  localStream: MediaStream | null;
  remoteStream: MediaStream | null;
  subscribeToCalls: (socket: Socket, selfId: string) => void;
  startCall: (peer: CallPeer, type: "voice" | "video") => Promise<void>;
  acceptCall: () => Promise<void>;
  declineCall: () => void;
  hangup: (status?: "answered" | "declined" | "missed") => Promise<void>;
  toggleMute: () => void;
  toggleCamera: () => void;
  fetchRecents: () => Promise<any[]>;
}

let pc: RTCPeerConnection | null = null;
let socketRef: Socket | null = null;
let selfIdRef = "";

const rtcConfig: RTCConfiguration = {
  iceServers: [{ urls: "stun:stun.l.google.com:19302" }],
};

function newPC(peerId: string, onRemote: (s: MediaStream) => void): RTCPeerConnection {
  const peer = new RTCPeerConnection(rtcConfig);
  peer.onicecandidate = (e) => {
    if (e.candidate && socketRef) {
      socketRef.emit("call:ice", { to: peerId, candidate: e.candidate });
    }
  };
  peer.ontrack = (e) => {
    onRemote(e.streams[0]);
  };
  return peer;
}

async function userMedia(type: "voice" | "video"): Promise<MediaStream> {
  return navigator.mediaDevices.getUserMedia({
    audio: true,
    video: type === "video" ? { width: { ideal: 1280 }, height: { ideal: 720 } } : false,
  });
}

function stopTracks(s: MediaStream | null) {
  s?.getTracks().forEach((t) => t.stop());
}

function teardown() {
  try { pc?.close(); } catch { /* ignore */ }
  pc = null;
}

export const useCallStore = create<CallState>((set, get) => ({
  incoming: null,
  active: null,
  muted: false,
  cameraOff: false,
  localStream: null,
  remoteStream: null,

  subscribeToCalls: (socket: Socket, selfId: string) => {
    socketRef = socket;
    selfIdRef = selfId;
    socket.off("call:incoming");
    socket.off("call:answered");
    socket.off("call:ice");
    socket.off("call:declined");
    socket.off("call:ended");
    socket.off("call:ringing");

    socket.on("call:incoming", (data: IncomingCall) => {
      if (get().active || get().incoming) return; // busy: ignore
      set({ incoming: data });
    });

    socket.on("call:answered", async (data: { from: string; answer: RTCSessionDescriptionInit }) => {
      if (pc && data.answer) {
        try {
          await pc.setRemoteDescription(new RTCSessionDescription(data.answer));
          set((s) => (s.active ? { active: { ...s.active, status: "connected" as const } } : s));
        } catch (e) {
          console.error("setRemoteDescription failed:", e);
        }
      }
    });

    socket.on("call:ice", async (data: { from: string; candidate: RTCIceCandidateInit }) => {
      if (pc && data.candidate) {
        try {
          await pc.addIceCandidate(new RTCIceCandidate(data.candidate));
        } catch (e) {
          console.error("addIceCandidate failed:", e);
        }
      }
    });

    socket.on("call:declined", () => {
      toast("Call declined", { icon: "📵" });
      stopTracks(get().localStream);
      teardown();
      set({ active: null, localStream: null, remoteStream: null });
    });

    socket.on("call:ended", () => {
      const { active } = get();
      if (active?.status === "connected") {
        const secs = Math.round((Date.now() - active.startedAt) / 1000);
        axiosInstance.post("/calls/log", {
          peerId: active.peer._id,
          type: active.type,
          status: "answered",
          durationSec: secs,
        }).catch(() => {});
      }
      stopTracks(get().localStream);
      teardown();
      set({ active: null, incoming: null, localStream: null, remoteStream: null, muted: false, cameraOff: false });
    });

    socket.on("call:ringing", () => {
      set((s) => (s.active ? { active: { ...s.active, status: "ringing" as const } } : s));
    });
  },

  startCall: async (peer: CallPeer, type: "voice" | "video") => {
    if (get().active || get().incoming) {
      toast.error("You're already on a call");
      return;
    }
    try {
      const stream = await userMedia(type);
      const peerConn = newPC(peer._id, (remote) => set({ remoteStream: remote }));
      stream.getTracks().forEach((t) => peerConn.addTrack(t, stream));
      const offer = await peerConn.createOffer();
      await peerConn.setLocalDescription(offer);
      pc = peerConn;
      const fromName = useAuthStore.getState().authUser?.fullName;
      socketRef?.emit("call:invite", { to: peer._id, callType: type, offer, fromName });
      set({
        active: { peer, type, direction: "outgoing", status: "ringing", startedAt: Date.now() },
        localStream: stream,
        muted: false,
        cameraOff: false,
      });
    } catch (e) {
      console.error("startCall failed:", e);
      toast.error("Couldn't access microphone/camera");
    }
  },

  acceptCall: async () => {
    const inc = get().incoming;
    if (!inc) return;
    try {
      const stream = await userMedia(inc.callType);
      const peerConn = newPC(inc.from, (remote) => set({ remoteStream: remote }));
      stream.getTracks().forEach((t) => peerConn.addTrack(t, stream));
      await peerConn.setRemoteDescription(new RTCSessionDescription(inc.offer));
      const answer = await peerConn.createAnswer();
      await peerConn.setLocalDescription(answer);
      pc = peerConn;
      socketRef?.emit("call:answer", { to: inc.from, answer });
      set({
        active: {
          peer: { _id: inc.from, fullName: inc.fromName ?? "Unknown" },
          type: inc.callType,
          direction: "incoming",
          status: "connected",
          startedAt: Date.now(),
        },
        incoming: null,
        localStream: stream,
        muted: false,
        cameraOff: false,
      });
    } catch (e) {
      console.error("acceptCall failed:", e);
      toast.error("Couldn't access microphone/camera");
      set({ incoming: null });
    }
  },

  declineCall: () => {
    const inc = get().incoming;
    if (inc) {
      socketRef?.emit("call:decline", { to: inc.from });
      axiosInstance.post("/calls/log", {
        peerId: inc.from,
        type: inc.callType,
        status: "declined",
        durationSec: 0,
      }).catch(() => {});
    }
    set({ incoming: null });
  },

  hangup: async (status: "answered" | "declined" | "missed" = "answered") => {
    const { active } = get();
    if (active) {
      socketRef?.emit("call:hangup", { to: active.peer._id });
      const secs = active.status === "connected" ? Math.round((Date.now() - active.startedAt) / 1000) : 0;
      try {
        await axiosInstance.post("/calls/log", {
          peerId: active.peer._id,
          type: active.type,
          status,
          durationSec: secs,
        });
      } catch { /* ignore */ }
    }
    stopTracks(get().localStream);
    teardown();
    set({ active: null, incoming: null, localStream: null, remoteStream: null, muted: false, cameraOff: false });
  },

  toggleMute: () => {
    const { localStream, muted } = get();
    localStream?.getAudioTracks().forEach((t) => { t.enabled = muted; });
    set({ muted: !muted });
  },

  toggleCamera: () => {
    const { localStream, cameraOff } = get();
    localStream?.getVideoTracks().forEach((t) => { t.enabled = cameraOff; });
    set({ cameraOff: !cameraOff });
  },

  fetchRecents: async () => {
    try {
      const res = await axiosInstance.get("/calls/recents");
      return res.data ?? [];
    } catch {
      return [];
    }
  },
}));

export { selfIdRef };
