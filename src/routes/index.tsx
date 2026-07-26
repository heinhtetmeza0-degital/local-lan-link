import { createFileRoute } from "@tanstack/react-router";
import { CreatePost } from "@/components/create-post";
import { PostCard } from "@/components/post-card";
import { getCurrentUserId, getPosts, getUser } from "@/lib/api";
import { useApiSubscription } from "@/lib/use-api";
import { useT } from "@/lib/i18n";

export const Route = createFileRoute("/")({
  head: () => ({
    meta: [
      { title: "Shwe Meza — Social on your local network" },
      { name: "description", content: "Shwe Meza (ရွှေမဲဇာ) — a bilingual EN/MM social space with posts, chat, voice notes and calls on your LAN." },
      { property: "og:title", content: "Shwe Meza — Social on your local network" },
      { property: "og:description", content: "Bilingual EN/MM social + messenger for your LAN." },
    ],
  }),
  component: Feed,
});

function Feed() {
  useApiSubscription();
  const { t } = useT();
  const meId = getCurrentUserId();
  const me = meId ? getUser(meId) : null;
  const posts = getPosts();
  if (!me) return null;
  return (
    <div className="space-y-4">
      <CreatePost me={me} />
      {posts.length === 0 ? (
        <div className="rounded-2xl bg-card shadow-card p-8 text-center text-muted-foreground">
          {t("noPostsFeed")}
        </div>
      ) : (
        posts.map((p) => <PostCard key={p.id} post={p} />)
      )}
    </div>
  );
}
