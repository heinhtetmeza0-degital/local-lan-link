import { createFileRoute, notFound, useNavigate } from "@tanstack/react-router";
import { useState } from "react";
import { Camera, Pencil, Check, X } from "lucide-react";
import {
  fileToDataUrl,
  getCurrentUserId,
  getPostsByUser,
  getUserByUsername,
  openDirectConversation,
  updateProfile,
} from "@/lib/api";
import { useApiSubscription } from "@/lib/use-api";
import { UserAvatar } from "@/components/user-avatar";
import { PostCard } from "@/components/post-card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { useT } from "@/lib/i18n";
import { CallButtons, CallModal } from "@/components/call-modal";
import { GoldBadge } from "@/components/gold-badge";
import { MessageCircle } from "lucide-react";

export const Route = createFileRoute("/profile/$username")({
  head: ({ params }) => ({
    meta: [
      { title: `@${params.username} — Shwe Meza` },
      { name: "description", content: `Profile and posts by @${params.username} on Shwe Meza.` },
      { property: "og:title", content: `@${params.username} — Shwe Meza` },
      { property: "og:description", content: `Profile and posts by @${params.username} on Shwe Meza.` },
    ],
  }),
  component: ProfilePage,
});

function ProfilePage() {
  useApiSubscription();
  const { t } = useT();
  const navigate = useNavigate();
  const { username } = Route.useParams();
  const found = getUserByUsername(username);
  if (!found) throw notFound();
  const user = found;
  const me = getCurrentUserId();
  const isMe = me === user.id;
  const posts = getPostsByUser(user.id);
  const photos = posts.flatMap((p) => p.media.filter((m) => m.kind === "image")) as { url: string }[];

  const [tab, setTab] = useState<"posts" | "photos">("posts");
  const [editing, setEditing] = useState(false);
  const [dn, setDn] = useState(user.displayName);
  const [bio, setBio] = useState(user.bio);
  const [call, setCall] = useState<"audio" | "video" | null>(null);

  function save() {
    updateProfile({ displayName: dn.trim() || user.displayName, bio: bio.trim() });
    setEditing(false);
  }
  async function onAvatar(f?: File) {
    if (!f) return;
    updateProfile({ avatar: await fileToDataUrl(f) });
  }
  function openChat() {
    const c = openDirectConversation(user.id);
    navigate({ to: "/chat/$id", params: { id: c.id } });
  }

  return (
    <div className="space-y-4">
      <section className="rounded-2xl bg-card shadow-card overflow-hidden">
        <div className="h-28 bg-gradient-to-br from-amber-400 via-amber-500 to-primary" />
        <div className="px-4 pb-4">
          <div className="flex items-end -mt-10 gap-3">
            <label className="relative">
              <div className="rounded-full ring-4 ring-card">
                <UserAvatar user={user} size={88} />
              </div>
              {isMe && (
                <>
                  <span className="absolute bottom-1 right-1 h-7 w-7 rounded-full bg-primary text-primary-foreground grid place-items-center shadow cursor-pointer">
                    <Camera className="h-3.5 w-3.5" />
                  </span>
                  <input type="file" accept="image/*" className="hidden"
                    onChange={(e) => onAvatar(e.target.files?.[0])} />
                </>
              )}
            </label>
            {isMe && !editing && (
              <Button size="sm" variant="secondary" className="ml-auto rounded-full"
                onClick={() => setEditing(true)}>
                <Pencil className="h-3.5 w-3.5 mr-1" /> {t("edit")}
              </Button>
            )}
          </div>
          {editing ? (
            <div className="mt-3 space-y-2">
              <Input value={dn} onChange={(e) => setDn(e.target.value)} placeholder={t("displayName")} />
              <Input value={bio} onChange={(e) => setBio(e.target.value)} placeholder={t("bio")} />
              <div className="flex gap-2">
                <Button size="sm" onClick={save}><Check className="h-4 w-4 mr-1" /> {t("save")}</Button>
                <Button size="sm" variant="ghost" onClick={() => setEditing(false)}>
                  <X className="h-4 w-4 mr-1" /> {t("cancel")}
                </Button>
              </div>
            </div>
          ) : (
            <div className="mt-3">
              <h1 className="text-xl font-bold flex items-center gap-1.5">
                {user.displayName}
                {user.verified && <GoldBadge size={18} />}
              </h1>
              <p className="text-sm text-muted-foreground">@{user.username}</p>
              {user.bio && <p className="mt-2 text-sm">{user.bio}</p>}
              <div className="mt-3 flex gap-6 text-sm">
                <div><span className="font-semibold">{posts.length}</span>{" "}
                  <span className="text-muted-foreground">{t("posts")}</span></div>
                <div><span className="font-semibold">{photos.length}</span>{" "}
                  <span className="text-muted-foreground">{t("photos")}</span></div>
              </div>
              {!isMe && (
                <div className="mt-4 flex flex-wrap gap-2">
                  <button
                    onClick={openChat}
                    className="inline-flex items-center gap-1.5 rounded-full bg-primary text-primary-foreground hover:opacity-90 px-3 py-2 text-sm font-medium"
                  >
                    <MessageCircle className="h-4 w-4" /> {t("message")}
                  </button>
                  <CallButtons
                    onAudio={() => setCall("audio")}
                    onVideo={() => setCall("video")}
                  />
                </div>
              )}
            </div>
          )}
        </div>
      </section>

      <div className="flex bg-card rounded-full p-1 shadow-card text-sm font-medium">
        <button onClick={() => setTab("posts")}
          className={`flex-1 py-2 rounded-full ${tab === "posts" ? "bg-primary text-primary-foreground" : "text-muted-foreground"}`}>
          {t("posts")}
        </button>
        <button onClick={() => setTab("photos")}
          className={`flex-1 py-2 rounded-full ${tab === "photos" ? "bg-primary text-primary-foreground" : "text-muted-foreground"}`}>
          {t("photos")}
        </button>
      </div>

      {tab === "posts" && (
        <div className="space-y-4">
          {posts.length === 0 ? (
            <div className="rounded-2xl bg-card shadow-card p-8 text-center text-muted-foreground">
              {t("noPostsYet")}
            </div>
          ) : posts.map((p) => <PostCard key={p.id} post={p} />)}
        </div>
      )}

      {tab === "photos" && (
        photos.length === 0 ? (
          <div className="rounded-2xl bg-card shadow-card p-8 text-center text-muted-foreground">
            {t("noPhotosYet")}
          </div>
        ) : (
          <div className="grid grid-cols-3 gap-1 rounded-2xl overflow-hidden">
            {photos.map((m, i) => (
              <img key={i} src={m.url} alt="" className="aspect-square object-cover w-full" />
            ))}
          </div>
        )
      )}

      {call && !isMe && (
        <CallModal peer={user} kind={call} onClose={() => setCall(null)} />
      )}
    </div>
  );
}
