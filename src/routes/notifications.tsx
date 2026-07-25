import { createFileRoute, Link } from "@tanstack/react-router";
import { useEffect } from "react";
import { Heart, MessageCircle } from "lucide-react";
import {
  getCurrentUserId,
  getNotifications,
  getUser,
  markAllRead,
} from "@/lib/api";
import { useApiSubscription } from "@/lib/use-api";
import { UserAvatar } from "@/components/user-avatar";
import { timeAgo } from "@/lib/format";

export const Route = createFileRoute("/notifications")({
  head: () => ({
    meta: [
      { title: "Notifications — LANbook" },
      { name: "description", content: "See who liked and commented on your posts." },
      { property: "og:title", content: "Notifications — LANbook" },
      { property: "og:description", content: "See who liked and commented on your posts." },
    ],
  }),
  component: NotificationsPage,
});

function NotificationsPage() {
  useApiSubscription();
  const me = getCurrentUserId();
  useEffect(() => { if (me) markAllRead(me); }, [me]);
  if (!me) return null;
  const notes = getNotifications(me);
  return (
    <div className="space-y-4">
      <h1 className="text-xl font-bold px-1">Notifications</h1>
      <div className="rounded-2xl bg-card shadow-card divide-y divide-border overflow-hidden">
        {notes.length === 0 && (
          <div className="p-8 text-center text-muted-foreground text-sm">
            No notifications yet.
          </div>
        )}
        {notes.map((n) => {
          const actor = getUser(n.actorId);
          const Icon = n.kind === "like" ? Heart : MessageCircle;
          const color = n.kind === "like" ? "text-[var(--color-like)]" : "text-primary";
          return (
            <Link
              key={n.id}
              to="/"
              className="flex items-center gap-3 p-3 hover:bg-accent"
            >
              <div className="relative">
                <UserAvatar user={actor} size={44} />
                <span className={`absolute -bottom-1 -right-1 h-6 w-6 grid place-items-center rounded-full bg-background border border-border ${color}`}>
                  <Icon className={`h-3.5 w-3.5 ${n.kind === "like" ? "fill-current" : ""}`} />
                </span>
              </div>
              <div className="min-w-0 flex-1">
                <p className="text-sm">
                  <span className="font-semibold">{actor?.displayName}</span>{" "}
                  {n.kind === "like" ? "liked your post" : "commented on your post"}.
                </p>
                <p className="text-xs text-muted-foreground">{timeAgo(n.createdAt)}</p>
              </div>
            </Link>
          );
        })}
      </div>
    </div>
  );
}
