import { useEffect, useRef } from "react";
import { PhoneOff, Mic, MicOff, Video, VideoOff, Phone, PhoneIncoming } from "lucide-react";
import Avatar from "./Avatar";
import { useCallStore } from "../store/useCallStore";

const CallOverlay = () => {
  const {
    incoming, active, muted, cameraOff,
    acceptCall, declineCall, hangup, toggleMute, toggleCamera,
    localStream, remoteStream,
  } = useCallStore();
  const localVideoRef = useRef<HTMLVideoElement>(null);
  const remoteVideoRef = useRef<HTMLVideoElement>(null);

  useEffect(() => {
    if (localVideoRef.current && localStream) localVideoRef.current.srcObject = localStream;
  }, [localStream, active]);

  useEffect(() => {
    if (remoteVideoRef.current && remoteStream) remoteVideoRef.current.srcObject = remoteStream;
  }, [remoteStream, active]);

  // ---- incoming call ----
  if (incoming && !active) {
    return (
      <div className="fixed inset-0 z-[300] bg-black/85 backdrop-blur flex flex-col items-center justify-center gap-6 p-8">
        <div className="flex items-center gap-2 text-white/70 text-sm font-medium">
          <PhoneIncoming size={16} className="text-primary" />
          Incoming {incoming.callType} call
        </div>
        <Avatar user={{ _id: incoming.from, fullName: incoming.fromName ?? "Unknown" }} className="size-24" />
        <h2 className="text-white text-2xl font-bold">{incoming.fromName ?? "Unknown"}</h2>
        <div className="flex gap-8 mt-4">
          <button
            onClick={declineCall}
            className="size-16 rounded-full bg-red-500 text-white flex items-center justify-center shadow-xl hover:scale-105 transition-transform"
            aria-label="Decline"
          >
            <PhoneOff size={26} />
          </button>
          <button
            onClick={acceptCall}
            className="size-16 rounded-full bg-green-500 text-white flex items-center justify-center shadow-xl hover:scale-105 transition-transform animate-pulse"
            aria-label="Accept"
          >
            <Phone size={26} />
          </button>
        </div>
      </div>
    );
  }

  // ---- active call ----
  if (!active) return null;
  const isVideo = active.type === "video";

  return (
    <div className="fixed inset-0 z-[300] bg-neutral-950 flex flex-col">
      {isVideo ? (
        <div className="flex-1 relative overflow-hidden">
          {remoteStream ? (
            <video ref={remoteVideoRef} autoPlay playsInline className="absolute inset-0 w-full h-full object-cover" />
          ) : (
            <div className="absolute inset-0 flex flex-col items-center justify-center gap-3">
              <Avatar user={active.peer} className="size-24" />
              <p className="text-white/70">{active.status === "ringing" ? "Ringing…" : "Connecting…"}</p>
            </div>
          )}
          {localStream && !cameraOff && (
            <video ref={localVideoRef} autoPlay playsInline muted className="absolute bottom-24 right-4 w-28 h-40 object-cover rounded-2xl border border-white/20 bg-black" />
          )}
          <div className="absolute top-0 left-0 right-0 p-4 bg-gradient-to-b from-black/60 to-transparent">
            <p className="text-white font-semibold text-center">{active.peer.fullName}</p>
            <p className="text-white/60 text-xs text-center">{active.status === "ringing" ? "Ringing…" : "Connected"}</p>
          </div>
        </div>
      ) : (
        <div className="flex-1 flex flex-col items-center justify-center gap-4">
          <Avatar user={active.peer} className="size-28" />
          <h2 className="text-white text-2xl font-bold">{active.peer.fullName}</h2>
          <p className="text-white/60">{active.status === "ringing" ? "Ringing…" : "Connected"}</p>
        </div>
      )}

      <div className="flex items-center justify-center gap-6 pb-12 pt-4">
        <button
          onClick={toggleMute}
          className={`size-14 rounded-full flex items-center justify-center transition-all ${muted ? "bg-red-500 text-white" : "bg-white/15 text-white"}`}
          aria-label={muted ? "Unmute" : "Mute"}
        >
          {muted ? <MicOff size={22} /> : <Mic size={22} />}
        </button>
        {isVideo && (
          <button
            onClick={toggleCamera}
            className={`size-14 rounded-full flex items-center justify-center transition-all ${cameraOff ? "bg-red-500 text-white" : "bg-white/15 text-white"}`}
            aria-label={cameraOff ? "Camera on" : "Camera off"}
          >
            {cameraOff ? <VideoOff size={22} /> : <Video size={22} />}
          </button>
        )}
        <button
          onClick={() => hangup()}
          className="size-16 rounded-full bg-red-500 text-white flex items-center justify-center shadow-xl hover:scale-105 transition-transform"
          aria-label="End call"
        >
          <PhoneOff size={26} />
        </button>
      </div>
    </div>
  );
};

export default CallOverlay;
