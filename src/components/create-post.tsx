import { useRef, useState } from "react";
import { Image as ImageIcon, Film, X, Send } from "lucide-react";
import { Button } from "@/components/ui/button";
import { UserAvatar } from "./user-avatar";
import { createPost, fileToDataUrl, type Media, type User } from "@/lib/api";
import { toast } from "sonner";
import { useT } from "@/lib/i18n";
import { VoiceRecorder, VoicePlayer, type VoiceResult } from "./voice-recorder";

export function CreatePost({ me }: { me: User }) {
  const { t } = useT();
  const [text, setText] = useState("");
  const [media, setMedia] = useState<Media[]>([]);
  const [voice, setVoice] = useState<VoiceResult | null>(null);
  const [busy, setBusy] = useState(false);
  const imgRef = useRef<HTMLInputElement>(null);
  const vidRef = useRef<HTMLInputElement>(null);

  async function onFiles(kind: "image" | "video", files: FileList | null) {
    if (!files) return;
    const items: Media[] = [];
    for (const f of Array.from(files)) {
      try {
        const url = await fileToDataUrl(f);
        items.push({ kind, url });
      } catch {
        toast.error("Could not read file");
      }
    }
    setMedia((m) => [...m, ...items].slice(0, 4));
  }

  async function submit(e: React.FormEvent) {
    e.preventDefault();
    const all: Media[] = [...media];
    if (voice) all.push({ kind: "audio", url: voice.url, duration: voice.duration });
    if (!text.trim() && all.length === 0) return;
    setBusy(true);
    try {
      createPost(text, all);
      setText("");
      setMedia([]);
      setVoice(null);
      toast.success(t("posted"));
    } catch (err) {
      toast.error(err instanceof Error ? err.message : t("failed"));
    } finally {
      setBusy(false);
    }
  }

  return (
    <form
      onSubmit={submit}
      className="rounded-2xl bg-card shadow-card p-4 space-y-3"
    >
      <div className="flex gap-3">
        <UserAvatar user={me} size={40} />
        <textarea
          value={text}
          onChange={(e) => setText(e.target.value)}
          placeholder={`${t("whatsOnMind")}, ${me.displayName.split(" ")[0]}?`}
          rows={2}
          className="flex-1 resize-none bg-muted rounded-2xl px-4 py-2.5 outline-none focus:ring-2 focus:ring-ring text-sm"
        />
      </div>

      {media.length > 0 && (
        <div className="grid grid-cols-2 gap-2">
          {media.map((m, i) => (
            <div key={i} className="relative rounded-xl overflow-hidden bg-muted">
              {m.kind === "image" ? (
                <img src={m.url} className="w-full h-32 object-cover" alt="" />
              ) : m.kind === "video" ? (
                <video src={m.url} className="w-full h-32 object-cover" />
              ) : null}
              <button
                type="button"
                onClick={() => setMedia((x) => x.filter((_, j) => j !== i))}
                className="absolute top-1 right-1 h-6 w-6 grid place-items-center rounded-full bg-background/80 backdrop-blur"
              >
                <X className="h-3.5 w-3.5" />
              </button>
            </div>
          ))}
        </div>
      )}

      {voice && (
        <VoicePlayer url={voice.url} duration={voice.duration} />
      )}

      <div className="flex items-center justify-between border-t border-border pt-3 gap-2 flex-wrap">
        <div className={getAppSettings().allowMedia ? "flex gap-1 flex-wrap" : "hidden"}>

          <button
            type="button"
            onClick={() => imgRef.current?.click()}
            className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-lg hover:bg-accent text-sm text-muted-foreground"
          >
            <ImageIcon className="h-4 w-4 text-emerald-500" />
            {t("photo")}
          </button>
          <button
            type="button"
            onClick={() => vidRef.current?.click()}
            className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-lg hover:bg-accent text-sm text-muted-foreground"
          >
            <Film className="h-4 w-4 text-sky-500" />
            {t("video")}
          </button>
          {!voice && <VoiceRecorder onDone={setVoice} />}
          <input
            ref={imgRef}
            type="file"
            accept="image/*"
            multiple
            className="hidden"
            onChange={(e) => onFiles("image", e.target.files)}
          />
          <input
            ref={vidRef}
            type="file"
            accept="video/*"
            className="hidden"
            onChange={(e) => onFiles("video", e.target.files)}
          />
        </div>
        <Button
          type="submit"
          disabled={busy || (!text.trim() && media.length === 0 && !voice)}
          className="rounded-full"
        >
          <Send className="h-4 w-4 mr-1" />
          {t("post")}
        </Button>
      </div>
    </form>
  );
}
