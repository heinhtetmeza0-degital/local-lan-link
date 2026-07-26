import { useEffect, useRef, useState } from "react";
import { Mic, Square, Trash2, Play, Pause } from "lucide-react";
import { toast } from "sonner";
import { blobToDataUrl } from "@/lib/api";
import { useT } from "@/lib/i18n";

export type VoiceResult = { url: string; duration: number };

export function VoiceRecorder({
  onDone,
  compact = false,
}: {
  onDone: (v: VoiceResult | null) => void;
  compact?: boolean;
}) {
  const { t } = useT();
  const [recording, setRecording] = useState(false);
  const [elapsed, setElapsed] = useState(0);
  const [preview, setPreview] = useState<VoiceResult | null>(null);
  const [playing, setPlaying] = useState(false);
  const mediaRef = useRef<MediaRecorder | null>(null);
  const chunksRef = useRef<Blob[]>([]);
  const timerRef = useRef<number | null>(null);
  const startedAtRef = useRef(0);
  const audioRef = useRef<HTMLAudioElement | null>(null);

  useEffect(() => () => {
    if (timerRef.current) window.clearInterval(timerRef.current);
    mediaRef.current?.stream.getTracks().forEach((t) => t.stop());
  }, []);

  async function start() {
    try {
      const stream = await navigator.mediaDevices.getUserMedia({ audio: true });
      const rec = new MediaRecorder(stream);
      chunksRef.current = [];
      rec.ondataavailable = (e) => e.data.size && chunksRef.current.push(e.data);
      rec.onstop = async () => {
        stream.getTracks().forEach((t) => t.stop());
        const blob = new Blob(chunksRef.current, { type: rec.mimeType || "audio/webm" });
        const url = await blobToDataUrl(blob);
        const duration = Math.max(1, Math.round((Date.now() - startedAtRef.current) / 1000));
        const res = { url, duration };
        setPreview(res);
        onDone(res);
      };
      mediaRef.current = rec;
      startedAtRef.current = Date.now();
      setElapsed(0);
      rec.start();
      setRecording(true);
      timerRef.current = window.setInterval(() => {
        setElapsed(Math.round((Date.now() - startedAtRef.current) / 1000));
      }, 250);
    } catch {
      toast.error(t("micDenied"));
    }
  }
  function stop() {
    mediaRef.current?.stop();
    setRecording(false);
    if (timerRef.current) window.clearInterval(timerRef.current);
  }
  function clear() {
    setPreview(null);
    onDone(null);
  }
  function toggle() {
    if (!audioRef.current) return;
    if (audioRef.current.paused) {
      audioRef.current.play();
      setPlaying(true);
    } else {
      audioRef.current.pause();
      setPlaying(false);
    }
  }

  const fmt = (s: number) =>
    `${Math.floor(s / 60)}:${String(s % 60).padStart(2, "0")}`;

  if (preview) {
    return (
      <div className={`flex items-center gap-2 rounded-full bg-muted px-3 py-2 ${compact ? "text-xs" : "text-sm"}`}>
        <button type="button" onClick={toggle} className="h-8 w-8 rounded-full bg-primary text-primary-foreground grid place-items-center">
          {playing ? <Pause className="h-4 w-4" /> : <Play className="h-4 w-4" />}
        </button>
        <div className="flex-1 h-1.5 rounded-full bg-background overflow-hidden">
          <div className="h-full w-full bg-primary/30" />
        </div>
        <span className="tabular-nums text-muted-foreground">{fmt(preview.duration)}</span>
        <audio ref={audioRef} src={preview.url} onEnded={() => setPlaying(false)} className="hidden" />
        <button type="button" onClick={clear} className="p-1 text-muted-foreground hover:text-destructive">
          <Trash2 className="h-4 w-4" />
        </button>
      </div>
    );
  }

  return (
    <button
      type="button"
      onClick={recording ? stop : start}
      className={
        "inline-flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-sm " +
        (recording ? "bg-destructive/10 text-destructive animate-pulse" : "hover:bg-accent text-muted-foreground")
      }
    >
      {recording ? <Square className="h-4 w-4 fill-current" /> : <Mic className="h-4 w-4 text-rose-500" />}
      <span>{recording ? `${t("recording")} ${fmt(elapsed)}` : t("voice")}</span>
    </button>
  );
}

export function VoicePlayer({ url, duration }: { url: string; duration?: number }) {
  const [playing, setPlaying] = useState(false);
  const [cur, setCur] = useState(0);
  const ref = useRef<HTMLAudioElement | null>(null);
  const total = duration ?? 0;
  const fmt = (s: number) => `${Math.floor(s / 60)}:${String(Math.floor(s % 60)).padStart(2, "0")}`;
  return (
    <div className="flex items-center gap-2 rounded-full bg-muted px-3 py-2 min-w-[180px] max-w-xs">
      <button
        onClick={() => {
          const a = ref.current;
          if (!a) return;
          if (a.paused) { a.play(); setPlaying(true); } else { a.pause(); setPlaying(false); }
        }}
        className="h-8 w-8 rounded-full bg-primary text-primary-foreground grid place-items-center shrink-0"
      >
        {playing ? <Pause className="h-4 w-4" /> : <Play className="h-4 w-4" />}
      </button>
      <div className="flex-1 h-1.5 rounded-full bg-background overflow-hidden">
        <div
          className="h-full bg-primary transition-all"
          style={{ width: total ? `${Math.min(100, (cur / total) * 100)}%` : "0%" }}
        />
      </div>
      <span className="tabular-nums text-xs text-muted-foreground">
        {fmt(playing ? cur : total)}
      </span>
      <audio
        ref={ref}
        src={url}
        onTimeUpdate={(e) => setCur((e.target as HTMLAudioElement).currentTime)}
        onEnded={() => { setPlaying(false); setCur(0); }}
        className="hidden"
      />
    </div>
  );
}
