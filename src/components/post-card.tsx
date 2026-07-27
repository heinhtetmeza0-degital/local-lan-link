import { useEffect, useRef, useState } from "react";
import { Link } from "@tanstack/react-router";
import { Flag, Heart, MessageCircle, MoreHorizontal, Send, Share2, Trash2 } from "lucide-react";
import {
  type Post,
  addComment,
  deletePost,
  getComments,
  getCurrentUserId,
  getLikes,
  getUser,
  isAdmin,
  toggleLike,
} from "@/lib/api";
import { UserAvatar } from "./user-avatar";
import { GoldBadge } from "./gold-badge";
import { ReportDialog } from "./report-dialog";
import { timeAgo } from "@/lib/format";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { useApiSubscription } from "@/lib/use-api";
import { cn } from "@/lib/utils";
import { useT } from "@/lib/i18n";
import { VoicePlayer } from "./voice-recorder";
import { toast } from "sonner";

export function PostCard({ post }: { post: Post }) {
  useApiSubscription();
  const { t, lang } = useT();
  const author = getUser(post.authorId);
  const me = getCurrentUserId();
  const admin = isAdmin(me);
  const likes = getLikes(post.id);
  const liked = me ? likes.includes(me) : false;
  const comments = getComments(post.id);
  const [open, setOpen] = useState(false);
  const [text, setText] = useState("");
  const [menu, setMenu] = useState(false);
  const [reporting, setReporting] = useState(false);
  const menuRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    if (!menu) return;
    const onDoc = (e: MouseEvent) => {
      if (menuRef.current && !menuRef.current.contains(e.target as Node)) setMenu(false);
    };
    document.addEventListener("mousedown", onDoc);
    return () => document.removeEventListener("mousedown", onDoc);
  }, [menu]);

  const submit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!text.trim()) return;
    addComment(post.id, text);
    setText("");
    setOpen(true);
  };

  const share = async () => {
    const url = typeof window !== "undefined" ? window.location.origin + "/" : "";
    try {
      if (navigator.share) {
        await navigator.share({ title: "Shwe Meza", text: post.text || "Shwe Meza", url });
      } else {
        await navigator.clipboard?.writeText(url + " " + (post.text || ""));
        toast.success(t("linkCopied"));
      }
    } catch { /* cancelled */ }
  };

  const canDelete = me === post.authorId || admin;

  return (
    <article className="rounded-2xl bg-card text-card-foreground shadow-card overflow-hidden">
      <header className="flex items-center gap-3 p-4">
        <Link
          to="/profile/$username"
          params={{ username: author?.username ?? "" }}
          className="flex items-center gap-3 min-w-0"
        >
          <UserAvatar user={author} size={40} />
          <div className="min-w-0">
            <div className="font-semibold truncate flex items-center gap-1">
              <span className="truncate">{author?.displayName ?? "Unknown"}</span>
              {author?.verified && <GoldBadge size={14} />}
            </div>
            <div className="text-xs text-muted-foreground">
              @{author?.username} · {timeAgo(post.createdAt, lang)}
            </div>
          </div>
        </Link>
        <div className="ml-auto relative" ref={menuRef}>
          <button
            onClick={() => setMenu((v) => !v)}
            className="text-muted-foreground hover:text-foreground p-2 rounded-full hover:bg-accent"
            aria-label="Post options"
          >
            <MoreHorizontal className="h-4 w-4" />
          </button>
          {menu && (
            <div className="absolute right-0 top-full mt-1 w-56 rounded-xl bg-popover shadow-pop border border-border z-20 py-1">
              {me && me !== post.authorId && (
                <button
                  onClick={() => { setMenu(false); setReporting(true); }}
                  className="w-full text-left px-3 py-2 text-sm hover:bg-accent flex items-center gap-2"
                >
                  <Flag className="h-4 w-4" /> {t("reportPost")}
                </button>
              )}
              {canDelete && (
                <button
                  onClick={() => { setMenu(false); deletePost(post.id); }}
                  className="w-full text-left px-3 py-2 text-sm hover:bg-accent flex items-center gap-2 text-destructive"
                >
                  <Trash2 className="h-4 w-4" /> {t("deletePost")}
                </button>
              )}
              {!me || (me === post.authorId && !canDelete) ? null : null}
            </div>
          )}
        </div>
      </header>

      {post.text && (
        <p className="px-4 pb-3 whitespace-pre-wrap leading-relaxed">{post.text}</p>
      )}

      {post.media.some((m) => m.kind === "audio") && (
        <div className="px-4 pb-3 space-y-2">
          {post.media
            .filter((m) => m.kind === "audio")
            .map((m, i) => (
              <VoicePlayer key={i} url={(m as { url: string }).url} duration={(m as { duration?: number }).duration} />
            ))}
        </div>
      )}

      {post.media.filter((m) => m.kind === "image" || m.kind === "video").length > 0 && (
        <div
          className={cn(
            "grid gap-0.5 bg-border",
            post.media.filter((m) => m.kind === "image" || m.kind === "video").length === 1
              ? "grid-cols-1"
              : "grid-cols-2",
          )}
        >
          {post.media
            .filter((m) => m.kind === "image" || m.kind === "video")
            .map((m, i) =>
              m.kind === "image" ? (
                <img key={i} src={m.url} alt="" className="w-full max-h-[520px] object-cover" />
              ) : (
                <video key={i} src={m.url} controls className="w-full max-h-[520px] bg-black" />
              ),
            )}
        </div>
      )}

      <div className="flex items-center gap-1 px-2 py-2 border-t border-border">
        <button
          onClick={() => me && toggleLike(post.id)}
          className={cn(
            "flex-1 inline-flex items-center justify-center gap-2 py-2 rounded-lg hover:bg-accent transition-colors",
            liked && "text-[var(--color-like)]",
          )}
        >
          <Heart className={cn("h-5 w-5", liked && "fill-current")} />
          <span className="text-sm font-medium">{likes.length || ""} {t("like")}</span>
        </button>
        <button
          onClick={() => setOpen((v) => !v)}
          className="flex-1 inline-flex items-center justify-center gap-2 py-2 rounded-lg hover:bg-accent transition-colors"
        >
          <MessageCircle className="h-5 w-5" />
          <span className="text-sm font-medium">{comments.length || ""} {t("comment")}</span>
        </button>
        <button
          onClick={share}
          className="flex-1 inline-flex items-center justify-center gap-2 py-2 rounded-lg hover:bg-accent transition-colors"
        >
          <Share2 className="h-5 w-5" />
          <span className="text-sm font-medium">{t("share")}</span>
        </button>
      </div>

      {open && (
        <div className="border-t border-border p-4 space-y-3 bg-muted/30">
          {comments.map((c) => {
            const cu = getUser(c.authorId);
            return (
              <div key={c.id} className="flex gap-2">
                <UserAvatar user={cu} size={32} />
                <div className="min-w-0 flex-1">
                  <div className="rounded-2xl bg-background px-3 py-2">
                    <div className="text-xs font-semibold flex items-center gap-1">
                      {cu?.displayName}
                      {cu?.verified && <GoldBadge size={11} />}
                    </div>
                    <div className="text-sm whitespace-pre-wrap">{c.text}</div>
                  </div>
                  <div className="text-[10px] text-muted-foreground mt-1 ml-2">
                    {timeAgo(c.createdAt, lang)}
                  </div>
                </div>
              </div>
            );
          })}
          {me && (
            <form onSubmit={submit} className="flex items-center gap-2 pt-1">
              <Input
                value={text}
                onChange={(e) => setText(e.target.value)}
                placeholder={t("writeComment")}
                className="rounded-full bg-background"
              />
              <Button type="submit" size="icon" className="rounded-full" disabled={!text.trim()}>
                <Send className="h-4 w-4" />
              </Button>
            </form>
          )}
        </div>
      )}

      {reporting && <ReportDialog postId={post.id} onClose={() => setReporting(false)} />}
    </article>
  );
}
