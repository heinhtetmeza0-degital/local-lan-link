import { useState } from "react";
import { Link } from "@tanstack/react-router";
import { Heart, MessageCircle, Send, Trash2 } from "lucide-react";
import {
  type Post,
  addComment,
  deletePost,
  getComments,
  getCurrentUserId,
  getLikes,
  getUser,
  toggleLike,
} from "@/lib/api";
import { UserAvatar } from "./user-avatar";
import { timeAgo } from "@/lib/format";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { useApiSubscription } from "@/lib/use-api";
import { cn } from "@/lib/utils";

export function PostCard({ post }: { post: Post }) {
  useApiSubscription();
  const author = getUser(post.authorId);
  const me = getCurrentUserId();
  const likes = getLikes(post.id);
  const liked = me ? likes.includes(me) : false;
  const comments = getComments(post.id);
  const [open, setOpen] = useState(false);
  const [text, setText] = useState("");

  const submit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!text.trim()) return;
    addComment(post.id, text);
    setText("");
    setOpen(true);
  };

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
            <div className="font-semibold truncate">{author?.displayName ?? "Unknown"}</div>
            <div className="text-xs text-muted-foreground">
              @{author?.username} · {timeAgo(post.createdAt)}
            </div>
          </div>
        </Link>
        {me === post.authorId && (
          <button
            onClick={() => deletePost(post.id)}
            className="ml-auto text-muted-foreground hover:text-destructive p-2 rounded-full"
            aria-label="Delete post"
          >
            <Trash2 className="h-4 w-4" />
          </button>
        )}
      </header>

      {post.text && (
        <p className="px-4 pb-3 whitespace-pre-wrap leading-relaxed">{post.text}</p>
      )}

      {post.media.length > 0 && (
        <div
          className={cn(
            "grid gap-0.5 bg-border",
            post.media.length === 1 ? "grid-cols-1" : "grid-cols-2",
          )}
        >
          {post.media.map((m, i) =>
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
          <span className="text-sm font-medium">{likes.length || ""} Like</span>
        </button>
        <button
          onClick={() => setOpen((v) => !v)}
          className="flex-1 inline-flex items-center justify-center gap-2 py-2 rounded-lg hover:bg-accent transition-colors"
        >
          <MessageCircle className="h-5 w-5" />
          <span className="text-sm font-medium">
            {comments.length || ""} Comment
          </span>
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
                    <div className="text-xs font-semibold">{cu?.displayName}</div>
                    <div className="text-sm whitespace-pre-wrap">{c.text}</div>
                  </div>
                  <div className="text-[10px] text-muted-foreground mt-1 ml-2">
                    {timeAgo(c.createdAt)}
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
                placeholder="Write a comment…"
                className="rounded-full bg-background"
              />
              <Button type="submit" size="icon" className="rounded-full" disabled={!text.trim()}>
                <Send className="h-4 w-4" />
              </Button>
            </form>
          )}
        </div>
      )}
    </article>
  );
}
