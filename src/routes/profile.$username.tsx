import { createFileRoute, notFound } from "@tanstack/react-router";
import { useState } from "react";
import { Camera, Pencil, Check, X } from "lucide-react";
import {
  fileToDataUrl,
  getCurrentUserId,
  getPostsByUser,
  getUserByUsername,
  updateProfile,
} from "@/lib/api";
import { useApiSubscription } from "@/lib/use-api";
import { UserAvatar } from "@/components/user-avatar";
import { PostCard } from "@/components/post-card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";

export const Route = createFileRoute("/profile/$username")({
  head: ({ params }) => ({
    meta: [
      { title: `@${params.username} — LANbook` },
      { name: "description", content: `Profile and posts by @${params.username} on LANbook.` },
      { property: "og:title", content: `@${params.username} — LANbook` },
      { property: "og:description", content: `Profile and posts by @${params.username} on LANbook.` },
    ],
  }),
  component: ProfilePage,
});

function ProfilePage() {
  useApiSubscription();
  const { username } = Route.useParams();
  const user = getUserByUsername(username);
  if (!user) throw notFound();
  const me = getCurrentUserId();
  const isMe = me === user.id;
  const posts = getPostsByUser(user.id);
  const photos = posts.flatMap((p) => p.media.filter((m) => m.kind === "image"));

  const [tab, setTab] = useState<"posts" | "photos">("posts");
  const [editing, setEditing] = useState(false);
  const [dn, setDn] = useState(user.displayName);
  const [bio, setBio] = useState(user.bio);

  function save() {
    updateProfile({ displayName: dn.trim() || user.displayName, bio: bio.trim() });
    setEditing(false);
  }
  async function onAvatar(f?: File) {
    if (!f) return;
    updateProfile({ avatar: await fileToDataUrl(f) });
  }

  return (
    <div className="space-y-4">
      <section className="rounded-2xl bg-card shadow-card overflow-hidden">
        <div className="h-28 bg-gradient-to-br from-primary/80 via-primary to-accent-foreground" />
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
                <Pencil className="h-3.5 w-3.5 mr-1" /> Edit
              </Button>
            )}
          </div>
          {editing ? (
            <div className="mt-3 space-y-2">
              <Input value={dn} onChange={(e) => setDn(e.target.value)} placeholder="Display name" />
              <Input value={bio} onChange={(e) => setBio(e.target.value)} placeholder="Bio" />
              <div className="flex gap-2">
                <Button size="sm" onClick={save}><Check className="h-4 w-4 mr-1" /> Save</Button>
                <Button size="sm" variant="ghost" onClick={() => setEditing(false)}>
                  <X className="h-4 w-4 mr-1" /> Cancel
                </Button>
              </div>
            </div>
          ) : (
            <div className="mt-3">
              <h1 className="text-xl font-bold">{user.displayName}</h1>
              <p className="text-sm text-muted-foreground">@{user.username}</p>
              {user.bio && <p className="mt-2 text-sm">{user.bio}</p>}
              <div className="mt-3 flex gap-6 text-sm">
                <div><span className="font-semibold">{posts.length}</span>{" "}
                  <span className="text-muted-foreground">Posts</span></div>
                <div><span className="font-semibold">{photos.length}</span>{" "}
                  <span className="text-muted-foreground">Photos</span></div>
              </div>
            </div>
          )}
        </div>
      </section>

      <div className="flex bg-card rounded-full p-1 shadow-card text-sm font-medium">
        <button onClick={() => setTab("posts")}
          className={`flex-1 py-2 rounded-full ${tab === "posts" ? "bg-primary text-primary-foreground" : "text-muted-foreground"}`}>
          Posts
        </button>
        <button onClick={() => setTab("photos")}
          className={`flex-1 py-2 rounded-full ${tab === "photos" ? "bg-primary text-primary-foreground" : "text-muted-foreground"}`}>
          Photos
        </button>
      </div>

      {tab === "posts" && (
        <div className="space-y-4">
          {posts.length === 0 ? (
            <div className="rounded-2xl bg-card shadow-card p-8 text-center text-muted-foreground">
              No posts yet.
            </div>
          ) : posts.map((p) => <PostCard key={p.id} post={p} />)}
        </div>
      )}

      {tab === "photos" && (
        photos.length === 0 ? (
          <div className="rounded-2xl bg-card shadow-card p-8 text-center text-muted-foreground">
            No photos yet.
          </div>
        ) : (
          <div className="grid grid-cols-3 gap-1 rounded-2xl overflow-hidden">
            {photos.map((m, i) => (
              <img key={i} src={m.url} alt="" className="aspect-square object-cover w-full" />
            ))}
          </div>
        )
      )}
    </div>
  );
}
