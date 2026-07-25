import { createFileRoute } from "@tanstack/react-router";
import { CreatePost } from "@/components/create-post";
import { PostCard } from "@/components/post-card";
import { getCurrentUserId, getPosts, getUser } from "@/lib/api";
import { useApiSubscription } from "@/lib/use-api";

export const Route = createFileRoute("/")({
  head: () => ({
    meta: [
      { title: "Home Feed — LANbook" },
      { name: "description", content: "Your LANbook feed: fresh posts from everyone on the network." },
      { property: "og:title", content: "Home Feed — LANbook" },
      { property: "og:description", content: "Your LANbook feed: fresh posts from everyone on the network." },
    ],
  }),
  component: Feed,
});

function Feed() {
  useApiSubscription();
  const meId = getCurrentUserId();
  const me = meId ? getUser(meId) : null;
  const posts = getPosts();
  if (!me) return null;
  return (
    <div className="space-y-4">
      <CreatePost me={me} />
      {posts.length === 0 ? (
        <div className="rounded-2xl bg-card shadow-card p-8 text-center text-muted-foreground">
          No posts yet — be the first to share something.
        </div>
      ) : (
        posts.map((p) => <PostCard key={p.id} post={p} />)
      )}
    </div>
  );
}
