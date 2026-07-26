import { useEffect, useState } from "react";
import { Phone, PhoneOff, Mic, MicOff, Video, VideoOff } from "lucide-react";
import type { User } from "@/lib/api";
import { UserAvatar } from "./user-avatar";
import { useT } from "@/lib/i18n";

export function CallModal({
  peer,
  kind,
  onClose,
}: {
  peer: User;
  kind: "audio" | "video";
  onClose: () => void;
}) {
  const { t } = useT();
  const [muted, setMuted] = useState(false);
  const [camOff, setCamOff] = useState(false);
  const [connected, setConnected] = useState(false);
  const [secs, setSecs] = useState(0);

  useEffect(() => {
    const c = window.setTimeout(() => setConnected(true), 1500);
    return () => window.clearTimeout(c);
  }, []);
  useEffect(() => {
    if (!connected) return;
    const i = window.setInterval(() => setSecs((s) => s + 1), 1000);
    return () => window.clearInterval(i);
  }, [connected]);

  const fmt = (s: number) =>
    `${Math.floor(s / 60)}:${String(s % 60).padStart(2, "0")}`;

  return (
    <div className="fixed inset-0 z-50 bg-black text-white flex flex-col">
      {kind === "video" && !camOff && (
        <div className="absolute inset-0 bg-gradient-to-br from-slate-800 via-slate-900 to-black" />
      )}
      <div className="relative flex-1 flex flex-col items-center justify-center gap-4 px-6 text-center">
        <UserAvatar user={peer} size={120} className="ring-4 ring-white/10" />
        <div>
          <h2 className="text-2xl font-bold">{peer.displayName}</h2>
          <p className="text-white/70 mt-1">
            {connected ? `${t("callConnected")} · ${fmt(secs)}` : t("incomingCall")}
          </p>
        </div>
        {kind === "video" && camOff && (
          <p className="text-xs text-white/60">{t("cameraOff")}</p>
        )}
      </div>

      <div className="relative pb-10 pt-4 flex items-center justify-center gap-6">
        <button
          onClick={() => setMuted((v) => !v)}
          className={`h-14 w-14 rounded-full grid place-items-center ${muted ? "bg-white text-black" : "bg-white/15 hover:bg-white/25"}`}
          aria-label={muted ? t("unmute") : t("mute")}
        >
          {muted ? <MicOff className="h-6 w-6" /> : <Mic className="h-6 w-6" />}
        </button>
        {kind === "video" && (
          <button
            onClick={() => setCamOff((v) => !v)}
            className={`h-14 w-14 rounded-full grid place-items-center ${camOff ? "bg-white text-black" : "bg-white/15 hover:bg-white/25"}`}
            aria-label={t("camera")}
          >
            {camOff ? <VideoOff className="h-6 w-6" /> : <Video className="h-6 w-6" />}
          </button>
        )}
        <button
          onClick={onClose}
          className="h-16 w-16 rounded-full grid place-items-center bg-red-600 hover:bg-red-700"
          aria-label={t("endCall")}
        >
          <PhoneOff className="h-7 w-7" />
        </button>
      </div>
    </div>
  );
}

export function CallButtons({
  onAudio,
  onVideo,
}: {
  onAudio: () => void;
  onVideo: () => void;
}) {
  const { t } = useT();
  return (
    <div className="flex gap-2">
      <button
        onClick={onAudio}
        className="inline-flex items-center gap-1.5 rounded-full bg-secondary hover:bg-accent text-secondary-foreground px-3 py-2 text-sm font-medium"
      >
        <Phone className="h-4 w-4" /> {t("call")}
      </button>
      <button
        onClick={onVideo}
        className="inline-flex items-center gap-1.5 rounded-full bg-secondary hover:bg-accent text-secondary-foreground px-3 py-2 text-sm font-medium"
      >
        <Video className="h-4 w-4" /> {t("videoCall")}
      </button>
    </div>
  );
}
