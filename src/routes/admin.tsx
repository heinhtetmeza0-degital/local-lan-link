import { createFileRoute, Link } from "@tanstack/react-router";
import { useState } from "react";
import { Flag, Megaphone, ShieldCheck, Trash2 } from "lucide-react";
import { toast } from "sonner";
import {
  approveGold,
  createAd,
  deleteAd,
  deletePost,
  fileToDataUrl,
  getAds,
  getGoldRequests,
  getPost,
  getReports,
  getUser,
  isAdmin,
  rejectGold,
  setReportStatus,
} from "@/lib/api";
import { useApiSubscription, useCurrentUser } from "@/lib/use-api";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { UserAvatar } from "@/components/user-avatar";
import { GoldBadge } from "@/components/gold-badge";
import { useT } from "@/lib/i18n";
import { cn } from "@/lib/utils";

export const Route = createFileRoute("/admin")({
  head: () => ({
    meta: [
      { title: "Admin Dashboard — Shwe Meza" },
      { name: "description", content: "Moderate posts, approve Gold Mark requests and manage sponsored ads on Shwe Meza." },
      { property: "og:title", content: "Admin Dashboard — Shwe Meza" },
      { property: "og:description", content: "Admin tools for Shwe Meza." },
      { name: "robots", content: "noindex" },
    ],
  }),
  component: AdminPage,
});

function AdminPage() {
  useApiSubscription();
  const { t } = useT();
  const me = useCurrentUser();
  const [tab, setTab] = useState<"mod" | "gold" | "ads">("mod");

  if (!me) return null;
  if (!isAdmin(me.id)) {
    return (
      <div className="rounded-2xl bg-card shadow-card p-8 text-center">
        <p className="font-semibold">Admins only.</p>
        <Link to="/" className="text-primary underline text-sm mt-2 inline-block">← Home</Link>
      </div>
    );
  }

  return (
    <div className="space-y-4">
      <div className="rounded-2xl bg-gradient-to-br from-amber-400 to-amber-600 text-white shadow-card p-4">
        <h1 className="text-xl font-bold flex items-center gap-2">
          <ShieldCheck className="h-5 w-5" /> {t("adminDashboard")}
        </h1>
        <p className="text-sm text-white/85">@{me.username}</p>
      </div>

      <div className="flex bg-card rounded-full p-1 shadow-card text-xs font-medium overflow-x-auto">
        {[
          { k: "mod" as const, label: t("moderation"), icon: Flag },
          { k: "gold" as const, label: t("goldApprovals"), icon: GoldBadge },
          { k: "ads" as const, label: t("adsManager"), icon: Megaphone },
        ].map((it) => (
          <button
            key={it.k}
            onClick={() => setTab(it.k)}
            className={cn(
              "flex-1 py-2 px-2 rounded-full inline-flex items-center justify-center gap-1.5 whitespace-nowrap",
              tab === it.k ? "bg-primary text-primary-foreground" : "text-muted-foreground",
            )}
          >
            {it.k === "gold" ? <GoldBadge size={14} /> : <it.icon className="h-4 w-4" />}
            {it.label}
          </button>
        ))}
      </div>

      {tab === "mod" && <ModerationTab />}
      {tab === "gold" && <GoldTab />}
      {tab === "ads" && <AdsTab />}
    </div>
  );
}

function ModerationTab() {
  const { t } = useT();
  const reports = getReports();
  if (reports.length === 0)
    return <Empty text={t("noReports")} />;
  return (
    <div className="space-y-3">
      <h2 className="font-semibold text-sm text-muted-foreground">{t("reportedPosts")}</h2>
      {reports.map((r) => {
        const post = getPost(r.postId);
        const reporter = getUser(r.reporterId);
        return (
          <div key={r.id} className="rounded-2xl bg-card shadow-card p-4 space-y-3">
            <div className="flex items-center gap-2 text-xs">
              <span className="rounded-full bg-destructive/10 text-destructive px-2 py-0.5 font-semibold">
                {t(("reason_" + r.reason) as never)}
              </span>
              <span className={cn(
                "rounded-full px-2 py-0.5 font-semibold",
                r.status === "pending" && "bg-amber-100 text-amber-800",
                r.status === "resolved" && "bg-emerald-100 text-emerald-800",
                r.status === "dismissed" && "bg-muted text-muted-foreground",
              )}>{r.status}</span>
              <span className="text-muted-foreground ml-auto">
                {t("reportedBy")} @{reporter?.username ?? "?"}
              </span>
            </div>
            {r.detail && <p className="text-sm italic">"{r.detail}"</p>}
            {post ? (
              <div className="rounded-xl bg-muted/40 p-3">
                <div className="text-xs text-muted-foreground mb-1">
                  @{getUser(post.authorId)?.username ?? "?"}
                </div>
                {post.text && <p className="text-sm whitespace-pre-wrap">{post.text}</p>}
                {post.media[0]?.kind === "image" && (
                  <img src={post.media[0].url} alt="" className="mt-2 rounded-lg max-h-56" />
                )}
              </div>
            ) : (
              <p className="text-xs text-muted-foreground">(post removed)</p>
            )}
            <div className="flex flex-wrap gap-2">
              {post && (
                <Button
                  size="sm"
                  variant="destructive"
                  onClick={() => { deletePost(r.postId); setReportStatus(r.id, "resolved"); toast.success(t("deletePost")); }}
                >
                  <Trash2 className="h-4 w-4 mr-1" /> {t("deletePost")}
                </Button>
              )}
              {r.status === "pending" && (
                <>
                  <Button size="sm" variant="secondary" onClick={() => setReportStatus(r.id, "resolved")}>
                    {t("resolve")}
                  </Button>
                  <Button size="sm" variant="ghost" onClick={() => setReportStatus(r.id, "dismissed")}>
                    {t("dismiss")}
                  </Button>
                </>
              )}
            </div>
          </div>
        );
      })}
    </div>
  );
}

function GoldTab() {
  const { t } = useT();
  const requests = getGoldRequests();
  if (requests.length === 0) return <Empty text={t("noRequests")} />;
  return (
    <div className="space-y-3">
      {requests.map((r) => {
        const u = getUser(r.userId);
        return (
          <div key={r.id} className="rounded-2xl bg-card shadow-card p-4 space-y-3">
            <div className="flex items-center gap-3">
              <UserAvatar user={u} size={40} />
              <div className="min-w-0">
                <div className="font-semibold flex items-center gap-1">
                  {u?.displayName}
                  {u?.verified && <GoldBadge size={12} />}
                </div>
                <div className="text-xs text-muted-foreground">@{u?.username}</div>
              </div>
              <span className={cn(
                "ml-auto text-xs rounded-full px-2 py-0.5 font-semibold",
                r.status === "pending" && "bg-amber-100 text-amber-800",
                r.status === "approved" && "bg-emerald-100 text-emerald-800",
                r.status === "rejected" && "bg-red-100 text-red-800",
              )}>{r.status}</span>
            </div>
            <p className="text-sm whitespace-pre-wrap">{r.reason}</p>
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 text-xs">
              {r.dob && (
                <div className="rounded-lg bg-muted/50 p-2">
                  <div className="text-muted-foreground">{t("dob")}</div>
                  <div className="font-semibold">{r.dob}</div>
                </div>
              )}
              {r.idImage && (
                <div className="rounded-lg bg-muted/50 p-2">
                  <div className="text-muted-foreground mb-1">{t("idDocument")}</div>
                  <img src={r.idImage} alt="" className="rounded-md max-h-40 w-full object-contain bg-black/5" />
                </div>
              )}
              {r.selfieVideo && (
                <div className="rounded-lg bg-muted/50 p-2 sm:col-span-2">
                  <div className="text-muted-foreground mb-1">{t("selfieVideo")}</div>
                  <video src={r.selfieVideo} controls className="rounded-md max-h-56 w-full bg-black" />
                </div>
              )}
              {r.proof && (
                <div className="rounded-lg bg-muted/50 p-2 sm:col-span-2">
                  <div className="text-muted-foreground mb-1">{t("proofOptional")}</div>
                  <img src={r.proof} alt="" className="rounded-md max-h-40" />
                </div>
              )}
            </div>
            {r.status === "pending" && (
              <div className="flex gap-2">
                <Button size="sm" onClick={() => { approveGold(r.id); toast.success(t("statusApproved")); }}>
                  {t("approve")}
                </Button>
                <Button size="sm" variant="ghost" onClick={() => rejectGold(r.id)}>
                  {t("reject")}
                </Button>
              </div>
            )}

          </div>
        );
      })}
    </div>
  );
}

function AdsTab() {
  const { t } = useT();
  const ads = getAds();
  const [title, setTitle] = useState("");
  const [link, setLink] = useState("");
  const [image, setImage] = useState<string | undefined>();

  const submit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!image) { toast.error("Image required"); return; }
    try {
      createAd({ title, link, image });
      setTitle(""); setLink(""); setImage(undefined);
      toast.success(t("addAd"));
    } catch (err) {
      toast.error((err as Error).message);
    }
  };

  return (
    <div className="space-y-3">
      <form onSubmit={submit} className="rounded-2xl bg-card shadow-card p-4 space-y-3">
        <h2 className="font-semibold flex items-center gap-2">
          <Megaphone className="h-4 w-4" /> {t("newAd")}
        </h2>
        <Input placeholder={t("adTitle")} value={title} onChange={(e) => setTitle(e.target.value)} required />
        <Input placeholder={t("adLink")} value={link} onChange={(e) => setLink(e.target.value)} />
        <div>
          <label className="text-xs text-muted-foreground">{t("adImage")}</label>
          <input
            type="file"
            accept="image/*"
            required
            onChange={async (e) => {
              const f = e.target.files?.[0];
              if (f) setImage(await fileToDataUrl(f));
            }}
            className="mt-1 block w-full text-sm"
          />
          {image && <img src={image} alt="" className="mt-2 rounded-lg max-h-40" />}
        </div>
        <Button type="submit" className="w-full">{t("addAd")}</Button>
      </form>

      {ads.length === 0 ? <Empty text={t("noAds")} /> : (
        <div className="space-y-3">
          {ads.map((ad) => (
            <div key={ad.id} className="rounded-2xl bg-card shadow-card overflow-hidden">
              <img src={ad.image} alt={ad.title} className="w-full max-h-48 object-cover" />
              <div className="p-3 flex items-center gap-2">
                <div className="min-w-0 flex-1">
                  <div className="font-semibold truncate">{ad.title}</div>
                  {ad.link && <div className="text-xs text-muted-foreground truncate">{ad.link}</div>}
                </div>
                <Button size="sm" variant="ghost" onClick={() => deleteAd(ad.id)}>
                  <Trash2 className="h-4 w-4" />
                </Button>
              </div>
            </div>
          ))}
        </div>
      )}
    </div>
  );
}

function Empty({ text }: { text: string }) {
  return (
    <div className="rounded-2xl bg-card shadow-card p-8 text-center text-muted-foreground text-sm">
      {text}
    </div>
  );
}
