import { createFileRoute, Link, notFound } from "@tanstack/react-router";
import { useEffect, useRef, useState } from "react";
import { ArrowLeft, Image as ImageIcon, Paperclip, Phone, Send, Video } from "lucide-react";
import {
  fileToDataUrl,
  getConversation,
  getCurrentUserId,
  getMessages,
  getUser,
  sendMessage,
  type Media,
  type User,
} from "@/lib/api";
import { useApiSubscription } from "@/lib/use-api";
import { UserAvatar } from "@/components/user-avatar";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import { useT } from "@/lib/i18n";
import { timeAgo } from "@/lib/format";
import { VoiceRecorder, VoicePlayer } from "@/components/voice-recorder";
import { CallModal } from "@/components/call-modal";

export const Route = createFileRoute("/chat/$id")({
  head: () => ({
    meta: [
      { title: "Chat — Shwe Meza" },
      { name: "description", content: "Direct messaging on Shwe Meza." },
      { property: "og:title", content: "Chat — Shwe Meza" },
      { property: "og:description", content: "Direct messaging on Shwe Meza." },
    ],
  }),
  component: ChatPage,
});

function ChatPage() {
  useApiSubscription();
  const { t, lang } = useT();
  const { id } = Route.useParams();
  const conv = getConversation(id);
  if (!conv) throw notFound();
  const meId = getCurrentUserId();
  if (!meId) return null;

  const peerId = conv.kind === "dm" ? conv.memberIds.find((x) => x !== meId) : null;
  const peer = peerId ? getUser(peerId) : null;
  const title = conv.kind === "group" ? conv.name ?? "Group" : peer?.displayName ?? "Unknown";
  const subtitle =
    conv.kind === "group"
      ? `${conv.memberIds.length} ${t("members")}`
      : t("online");

  const msgs = getMessages(conv.id);
  const [text, setText] = useState("");
  const [call, setCall] = useState<"audio" | "video" | null>(null);
  const imgRef = useRef<HTMLInputElement>(null);
  const fileRef = useRef<HTMLInputElement>(null);
  const bottomRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    bottomRef.current?.scrollIntoView({ behavior: "smooth", block: "end" });
  }, [msgs.length]);

  function send(mediaOverride?: Media) {
    if (!text.trim() && !mediaOverride) return;
    sendMessage(conv!.id, mediaOverride ? "" : text, mediaOverride);
    setText("");
  }
  async function onImage(f?: File) {
    if (!f) return;
    const url = await fileToDataUrl(f);
    send({ kind: f.type.startsWith("video") ? "video" : "image", url });
  }
  async function onFile(f?: File) {
    if (!f) return;
    const url = await fileToDataUrl(f);
    send({ kind: "file", url, name: f.name, size: f.size });
  }

  return (
    <div className="-mx-3 sm:-mx-4 -my-4 min-h-[calc(100vh-3.5rem)] flex flex-col bg-background">
      <header className="sticky top-14 z-20 bg-background/95 backdrop-blur border-b border-border">
        <div className="flex items-center gap-3 px-3 py-2">
          <Link to="/messages" className="p-2 -ml-2 rounded-full hover:bg-accent">
            <ArrowLeft className="h-5 w-5" />
          </Link>
          {conv.kind === "dm" && peer ? (
            <Link to="/profile/$username" params={{ username: peer.username }} className="flex items-center gap-2 min-w-0">
              <UserAvatar user={peer} size={36} />
              <div className="min-w-0">
                <div className="font-semibold truncate leading-tight">{title}</div>
                <div className="text-[11px] text-emerald-600 flex items-center gap-1">
                  <span className="h-1.5 w-1.5 rounded-full bg-emerald-500" /> {subtitle}
                </div>
              </div>
            </Link>
          ) : (
            <div className="flex items-center gap-2 min-w-0">
              <div className="h-9 w-9 rounded-full bg-primary/15 text-primary grid place-items-center">
                <span className="text-sm font-bold">{title[0]?.toUpperCase()}</span>
              </div>
              <div className="min-w-0">
                <div className="font-semibold truncate leading-tight">{title}</div>
                <div className="text-[11px] text-muted-foreground">{subtitle}</div>
              </div>
            </div>
          )}
          <div className="ml-auto flex items-center gap-1">
            <button
              onClick={() => peer && setCall("audio")}
              disabled={!peer}
              className="p-2 rounded-full hover:bg-accent text-primary disabled:opacity-40"
              aria-label={t("call")}
            >
              <Phone className="h-5 w-5" />
            </button>
            <button
              onClick={() => peer && setCall("video")}
              disabled={!peer}
              className="p-2 rounded-full hover:bg-accent text-primary disabled:opacity-40"
              aria-label={t("videoCall")}
            >
              <Video className="h-5 w-5" />
            </button>
          </div>
        </div>
      </header>

      <div className="flex-1 overflow-y-auto px-3 py-4 space-y-2">
        {msgs.map((m, i) => {
          const mine = m.authorId === meId;
          const author = getUser(m.authorId);
          const prev = msgs[i - 1];
          const showAvatar = !mine && (!prev || prev.authorId !== m.authorId);
          return (
            <div key={m.id} className={`flex gap-2 ${mine ? "justify-end" : "justify-start"}`}>
              {!mine && (
                <div className="w-8 shrink-0">
                  {showAvatar && <UserAvatar user={author} size={32} />}
                </div>
              )}
              <div className={`max-w-[75%] ${mine ? "items-end" : "items-start"} flex flex-col gap-1`}>
                {!mine && showAvatar && conv.kind === "group" && (
                  <div className="text-[10px] text-muted-foreground ml-2">{author?.displayName}</div>
                )}
                {m.media?.kind === "image" && (
                  <img src={m.media.url} alt="" className="rounded-2xl max-h-72 object-cover" />
                )}
                {m.media?.kind === "video" && (
                  <video src={m.media.url} controls className="rounded-2xl max-h-72" />
                )}
                {m.media?.kind === "audio" && (
                  <VoicePlayer url={m.media.url} duration={m.media.duration} />
                )}
                {m.media?.kind === "file" && (
                  <a
                    href={m.media.url}
                    download={m.media.name}
                    className={`flex items-center gap-2 rounded-2xl px-3 py-2 text-sm ${mine ? "bg-primary text-primary-foreground" : "bg-muted"}`}
                  >
                    <Paperclip className="h-4 w-4" />
                    <span className="truncate max-w-[180px]">{m.media.name}</span>
                  </a>
                )}
                {m.text && (
                  <div
                    className={`rounded-2xl px-3.5 py-2 text-sm whitespace-pre-wrap break-words ${
                      mine
                        ? "bg-primary text-primary-foreground rounded-br-md"
                        : "bg-muted rounded-bl-md"
                    }`}
                  >
                    {m.text}
                  </div>
                )}
                <div className={`text-[10px] text-muted-foreground ${mine ? "mr-2" : "ml-2"}`}>
                  {timeAgo(m.createdAt, lang)}
                </div>
              </div>
            </div>
          );
        })}
        <div ref={bottomRef} />
      </div>

      <form
        onSubmit={(e) => { e.preventDefault(); send(); }}
        className="sticky bottom-0 md:bottom-0 z-20 bg-background/95 backdrop-blur border-t border-border p-2 pb-[max(0.5rem,env(safe-area-inset-bottom))]"
      >
        <div className="flex items-center gap-1">
          <button type="button" onClick={() => imgRef.current?.click()} className="p-2 rounded-full hover:bg-accent text-emerald-500" aria-label="Image">
            <ImageIcon className="h-5 w-5" />
          </button>
          <button type="button" onClick={() => fileRef.current?.click()} className="p-2 rounded-full hover:bg-accent text-muted-foreground" aria-label="File">
            <Paperclip className="h-5 w-5" />
          </button>
          <VoiceRecorder
            compact
            onDone={(v) => v && send({ kind: "audio", url: v.url, duration: v.duration })}
          />
          <Input
            value={text}
            onChange={(e) => setText(e.target.value)}
            placeholder={t("typeMessage")}
            className="flex-1 rounded-full bg-muted border-0"
          />
          <Button type="submit" size="icon" className="rounded-full" disabled={!text.trim()}>
            <Send className="h-4 w-4" />
          </Button>
          <input ref={imgRef} type="file" accept="image/*,video/*" className="hidden" onChange={(e) => onImage(e.target.files?.[0])} />
          <input ref={fileRef} type="file" className="hidden" onChange={(e) => onFile(e.target.files?.[0])} />
        </div>
      </form>

      {call && peer && (
        <CallModal peer={peer as User} kind={call} onClose={() => setCall(null)} />
      )}
    </div>
  );
}
