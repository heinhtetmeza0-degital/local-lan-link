import { createFileRoute } from "@tanstack/react-router";
import { CreatePost } from "@/components/create-post";
import { PostCard } from "@/components/post-card";
import { SponsoredCard } from "@/components/sponsored-card";
import { getAds, getAppSettings, getCurrentUserId, getPosts, getUser } from "@/lib/api";
import { useApiSubscription } from "@/lib/use-api";
import { useT } from "@/lib/i18n";

export const Route = createFileRoute("/")({
  head: () => ({
    meta: [
      { title: "Shwe Meza — Social on your local network" },
      { name: "description", content: "Shwe Meza (ရွှေမဲဇာ) — a bilingual EN/MM social space with posts, chat, voice notes and calls on your LAN." },
      { property: "og:title", content: "Shwe Meza — Social on your local network" },
      { property: "og:description", content: "Shwe Meza (ရွှေမဲဇာ) — a bilingual EN/MM social space with posts, chat, voice notes and calls on your LAN." },
    ],
  }),
  component: Feed,
});

function Feed() {
  useApiSubscription();
  const { t } = useT();
  const meId = getCurrentUserId();
  const me = meId ? getUser(meId) : null;
  const settings = getAppSettings();
  const posts = getPosts();
  const ads = settings.showAds ? getAds() : [];
  if (!me) return null;


  const items: Array<{ kind: "post"; id: string; node: React.ReactNode } | { kind: "ad"; id: string; node: React.ReactNode }> = [];
  posts.forEach((p, i) => {
    items.push({ kind: "post", id: p.id, node: <PostCard post={p} /> });
    // Inject an ad after every 3 posts, cycling through available ads.
    if (ads.length && (i + 1) % 3 === 0) {
      const ad = ads[Math.floor(i / 3) % ads.length];
      items.push({ kind: "ad", id: "ad-" + i + "-" + ad.id, node: <SponsoredCard ad={ad} /> });
    }
  });

  return (
    <div className="space-y-4">
      {settings.allowPosting ? (
        <CreatePost me={me} />
      ) : (
        <div className="rounded-2xl bg-card shadow-card p-4 text-sm text-muted-foreground text-center">
          ပို့စ်တင်ခြင်း ယာယီ ပိတ်ထားပါသည် / Posting is currently disabled by the owner.
        </div>
      )}

      {posts.length === 0 && ads.length === 0 ? (
        <div className="rounded-2xl bg-card shadow-card p-8 text-center text-muted-foreground">
          {t("noPostsFeed")}
        </div>
      ) : (
        <>
          {ads.length > 0 && posts.length === 0 && <SponsoredCard ad={ads[0]} />}
          {items.map((it) => (
            <div key={it.kind + ":" + it.id}>{it.node}</div>
          ))}
        </>
      )}
    </div>
  );
}
