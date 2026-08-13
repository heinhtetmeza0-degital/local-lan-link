import { createFileRoute, Link } from "@tanstack/react-router";
import { useState } from "react";
import {
  Database,
  Flag,
  Gauge,
  Megaphone,
  MessageSquare,
  ShieldCheck,
  SlidersHorizontal,
  Trash2,
  Users,
} from "lucide-react";
import { toast } from "sonner";
import {
  adminDeleteComment,
  adminDeletePost,
  adminDeleteUser,
  adminSetPassword,
  approveGold,
  createAd,
  deleteAd,
  deletePost,
  exportAllData,
  factoryReset,
  fileToDataUrl,
  getAds,
  getAdminStats,
  getAllComments,
  getAppSettings,
  getGoldRequests,
  getPost,
  getPosts,
  getReports,
  getUser,
  getUsers,
  importAllData,
  isAdmin,
  isBanned,
  rejectGold,
  setReportStatus,
  setUserAdmin,
  setUserBanned,
  setUserVerified,
  updateAppSettings,
  wipeContent,
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
      { title: "Owner Control Centre — Shwe Meza" },
      { name: "description", content: "Full owner control: users, content, app settings, moderation, Gold Marks, ads and data for Shwe Meza." },
      { property: "og:title", content: "Owner Control Centre — Shwe Meza" },
      { property: "og:description", content: "Full owner control for Shwe Meza." },
      { name: "robots", content: "noindex" },
    ],
  }),
  component: AdminPage,
});

type Tab = "overview" | "users" | "content" | "mod" | "gold" | "ads" | "settings" | "data";

function AdminPage() {
  useApiSubscription();
  const { t, lang } = useT();
  const mm = lang === "mm";
  const me = useCurrentUser();
  const [tab, setTab] = useState<Tab>("overview");

  if (!me) return null;
  if (!isAdmin(me.id)) {
    return (
      <div className="rounded-2xl bg-card shadow-card p-8 text-center">
        <p className="font-semibold">Admins only.</p>
        <Link to="/" className="text-primary underline text-sm mt-2 inline-block">← Home</Link>
      </div>
    );
  }

  const tabs: Array<{ k: Tab; label: string; icon: typeof Users }> = [
    { k: "overview", label: mm ? "ခြုံငုံ" : "Overview", icon: Gauge },
    { k: "users", label: mm ? "အသုံးပြုသူများ" : "Users", icon: Users },
    { k: "content", label: mm ? "အကြောင်းအရာ" : "Content", icon: MessageSquare },
    { k: "mod", label: t("moderation"), icon: Flag },
    { k: "gold", label: t("goldApprovals"), icon: Users },
    { k: "ads", label: t("adsManager"), icon: Megaphone },
    { k: "settings", label: mm ? "အက်ပ်ဆက်တင်" : "App settings", icon: SlidersHorizontal },
    { k: "data", label: mm ? "ဒေတာ" : "Data", icon: Database },
  ];

  return (
    <div className="space-y-4">
      <div className="rounded-2xl bg-gradient-to-br from-amber-400 to-amber-600 text-white shadow-card p-4">
        <h1 className="text-xl font-bold flex items-center gap-2">
          <ShieldCheck className="h-5 w-5" />
          {mm ? "ပိုင်ရှင် ထိန်းချုပ်ရေးစင်တာ" : "Owner Control Centre"}
        </h1>
        <p className="text-sm text-white/85">@{me.username}</p>
      </div>

      <div className="flex gap-1 bg-card rounded-2xl p-1 shadow-card text-xs font-medium overflow-x-auto">
        {tabs.map((it) => (
          <button
            key={it.k}
            onClick={() => setTab(it.k)}
            className={cn(
              "py-2 px-3 rounded-xl inline-flex items-center gap-1.5 whitespace-nowrap",
              tab === it.k ? "bg-primary text-primary-foreground" : "text-muted-foreground",
            )}
          >
            {it.k === "gold" ? <GoldBadge size={14} /> : <it.icon className="h-4 w-4" />}
            {it.label}
          </button>
        ))}
      </div>

      {tab === "overview" && <OverviewTab />}
      {tab === "users" && <UsersTab meId={me.id} />}
      {tab === "content" && <ContentTab />}
      {tab === "mod" && <ModerationTab />}
      {tab === "gold" && <GoldTab />}
      {tab === "ads" && <AdsTab />}
      {tab === "settings" && <SettingsTab />}
      {tab === "data" && <DataTab />}
    </div>
  );
}

function OverviewTab() {
  const { lang } = useT();
  const mm = lang === "mm";
  const s = getAdminStats();
  const cells: Array<[string, number]> = [
    [mm ? "အသုံးပြုသူ" : "Users", s.users],
    [mm ? "ပို့စ်" : "Posts", s.posts],
    [mm ? "မှတ်ချက်" : "Comments", s.comments],
    [mm ? "စာတို" : "Messages", s.messages],
    [mm ? "တိုင်ကြားချက်" : "Open reports", s.reports],
    [mm ? "Gold တောင်းဆိုမှု" : "Gold pending", s.gold],
    [mm ? "ပိတ်ပင်ထားသူ" : "Banned", s.banned],
  ];
  return (
    <div className="grid grid-cols-2 sm:grid-cols-3 gap-3">
      {cells.map(([label, value]) => (
        <div key={label} className="rounded-2xl bg-card shadow-card p-4">
          <div className="text-2xl font-black">{value}</div>
          <div className="text-xs text-muted-foreground">{label}</div>
        </div>
      ))}
    </div>
  );
}

function UsersTab({ meId }: { meId: string }) {
  const { lang } = useT();
  const mm = lang === "mm";
  const [q, setQ] = useState("");
  const users = getUsers().filter(
    (u) =>
      !q.trim() ||
      u.username.includes(q.toLowerCase()) ||
      u.displayName.toLowerCase().includes(q.toLowerCase()),
  );

  const act = (fn: () => void, msg: string) => {
    try { fn(); toast.success(msg); } catch (e) { toast.error((e as Error).message); }
  };

  return (
    <div className="space-y-3">
      <Input value={q} onChange={(e) => setQ(e.target.value)} placeholder={mm ? "အသုံးပြုသူ ရှာရန်" : "Search users"} />
      {users.map((u) => {
        const banned = isBanned(u.id);
        return (
          <div key={u.id} className="rounded-2xl bg-card shadow-card p-4 space-y-3">
            <div className="flex items-center gap-3">
              <UserAvatar user={u} size={40} />
              <div className="min-w-0">
                <div className="font-semibold flex items-center gap-1 truncate">
                  {u.displayName}
                  {u.verified && <GoldBadge size={12} />}
                </div>
                <div className="text-xs text-muted-foreground">@{u.username}</div>
              </div>
              <div className="ml-auto flex gap-1 text-[10px] font-semibold">
                {u.isAdmin && <span className="rounded-full bg-primary/10 text-primary px-2 py-0.5">OWNER</span>}
                {banned && <span className="rounded-full bg-destructive/10 text-destructive px-2 py-0.5">BANNED</span>}
              </div>
            </div>
            <div className="flex flex-wrap gap-2">
              <Button size="sm" variant="secondary" onClick={() => act(() => setUserVerified(u.id, !u.verified), "Updated")}>
                {u.verified ? (mm ? "Gold ဖြုတ်" : "Remove gold") : (mm ? "Gold ပေး" : "Give gold")}
              </Button>
              <Button size="sm" variant="secondary" onClick={() => act(() => setUserAdmin(u.id, !u.isAdmin), "Updated")}>
                {u.isAdmin ? (mm ? "Admin ဖြုတ်" : "Remove admin") : (mm ? "Admin ခန့်" : "Make admin")}
              </Button>
              <Button
                size="sm"
                variant="secondary"
                onClick={() => {
                  const pw = window.prompt(mm ? "စကားဝှက်အသစ်" : "New password");
                  if (pw) act(() => adminSetPassword(u.id, pw), "Password reset");
                }}
              >
                {mm ? "စကားဝှက် ပြင်" : "Reset password"}
              </Button>
              <Button size="sm" variant={banned ? "secondary" : "destructive"} onClick={() => act(() => setUserBanned(u.id, !banned), "Updated")}>
                {banned ? (mm ? "ပြန်ဖွင့်" : "Unban") : (mm ? "ပိတ်ပင်" : "Ban")}
              </Button>
              {u.id !== meId && (
                <Button
                  size="sm"
                  variant="ghost"
                  onClick={() => {
                    if (window.confirm(mm ? "ဒီအကောင့်ကို အပြီးဖျက်မှာလား?" : `Permanently delete @${u.username}?`))
                      act(() => adminDeleteUser(u.id), "User deleted");
                  }}
                >
                  <Trash2 className="h-4 w-4" />
                </Button>
              )}
            </div>
          </div>
        );
      })}
    </div>
  );
}

function ContentTab() {
  const { lang } = useT();
  const mm = lang === "mm";
  const [view, setView] = useState<"posts" | "comments">("posts");
  const posts = getPosts();
  const comments = view === "comments" ? getAllComments() : [];

  return (
    <div className="space-y-3">
      <div className="flex gap-2">
        <Button size="sm" variant={view === "posts" ? "default" : "secondary"} onClick={() => setView("posts")}>
          {mm ? "ပို့စ်များ" : "Posts"} ({posts.length})
        </Button>
        <Button size="sm" variant={view === "comments" ? "default" : "secondary"} onClick={() => setView("comments")}>
          {mm ? "မှတ်ချက်များ" : "Comments"}
        </Button>
      </div>

      {view === "posts" &&
        (posts.length === 0 ? (
          <Empty text={mm ? "ပို့စ် မရှိပါ" : "No posts"} />
        ) : (
          posts.map((p) => (
            <div key={p.id} className="rounded-2xl bg-card shadow-card p-4 space-y-2">
              <div className="text-xs text-muted-foreground">
                @{getUser(p.authorId)?.username ?? "?"} · {new Date(p.createdAt).toLocaleString()}
              </div>
              {p.text && <p className="text-sm whitespace-pre-wrap">{p.text}</p>}
              {p.media[0]?.kind === "image" && <img src={p.media[0].url} alt="" className="rounded-lg max-h-48" />}
              <Button size="sm" variant="destructive" onClick={() => { adminDeletePost(p.id); toast.success("Deleted"); }}>
                <Trash2 className="h-4 w-4 mr-1" /> {mm ? "ဖျက်မည်" : "Delete"}
              </Button>
            </div>
          ))
        ))}

      {view === "comments" &&
        (comments.length === 0 ? (
          <Empty text={mm ? "မှတ်ချက် မရှိပါ" : "No comments"} />
        ) : (
          comments.map((c) => (
            <div key={c.id} className="rounded-2xl bg-card shadow-card p-4 flex items-start gap-3">
              <div className="min-w-0 flex-1">
                <div className="text-xs text-muted-foreground">@{getUser(c.authorId)?.username ?? "?"}</div>
                <p className="text-sm whitespace-pre-wrap">{c.text}</p>
              </div>
              <Button size="sm" variant="ghost" onClick={() => { adminDeleteComment(c.id); toast.success("Deleted"); }}>
                <Trash2 className="h-4 w-4" />
              </Button>
            </div>
          ))
        ))}
    </div>
  );
}

function SettingsTab() {
  const { lang } = useT();
  const mm = lang === "mm";
  const s = getAppSettings();
  const [appName, setAppName] = useState(s.appName);
  const [tagline, setTagline] = useState(s.tagline);
  const [msg, setMsg] = useState(s.maintenanceMessage);

  const toggle = (patch: Parameters<typeof updateAppSettings>[0]) => {
    try { updateAppSettings(patch); toast.success("Saved"); } catch (e) { toast.error((e as Error).message); }
  };

  const switches: Array<{ key: keyof typeof s; label: string; value: boolean }> = [
    { key: "allowSignups", label: mm ? "အကောင့်အသစ် ဖွင့်ခွင့်" : "Allow new sign-ups", value: s.allowSignups },
    { key: "allowPosting", label: mm ? "ပို့စ်တင်ခွင့်" : "Allow posting", value: s.allowPosting },
    { key: "allowMedia", label: mm ? "ဓာတ်ပုံ/ဗီဒီယို တင်ခွင့်" : "Allow media uploads", value: s.allowMedia },
    { key: "showAds", label: mm ? "ကြော်ငြာ ပြရန်" : "Show sponsored ads", value: s.showAds },
    { key: "maintenance", label: mm ? "ပြုပြင်ထိန်းသိမ်းမုဒ်" : "Maintenance mode", value: s.maintenance },
  ];

  return (
    <div className="space-y-4">
      <div className="rounded-2xl bg-card shadow-card p-4 space-y-3">
        <h2 className="font-semibold text-sm">{mm ? "အက်ပ် အမည်" : "Branding"}</h2>
        <Input value={appName} onChange={(e) => setAppName(e.target.value)} placeholder="App name" />
        <Input value={tagline} onChange={(e) => setTagline(e.target.value)} placeholder="Tagline" />
        <Button size="sm" onClick={() => toggle({ appName, tagline })}>{mm ? "သိမ်းမည်" : "Save"}</Button>
      </div>

      <div className="rounded-2xl bg-card shadow-card p-4 space-y-2">
        <h2 className="font-semibold text-sm">{mm ? "ခွင့်ပြုချက်များ" : "Permissions"}</h2>
        {switches.map((sw) => (
          <label key={String(sw.key)} className="flex items-center justify-between gap-3 py-2 text-sm">
            <span>{sw.label}</span>
            <input
              type="checkbox"
              checked={sw.value}
              onChange={(e) => toggle({ [sw.key]: e.target.checked })}
              className="h-5 w-5 accent-[hsl(var(--primary))]"
            />
          </label>
        ))}
        <Input value={msg} onChange={(e) => setMsg(e.target.value)} placeholder={mm ? "ပြုပြင်နေကြောင်း စာသား" : "Maintenance message"} />
        <Button size="sm" variant="secondary" onClick={() => toggle({ maintenanceMessage: msg })}>
          {mm ? "စာသား သိမ်းမည်" : "Save message"}
        </Button>
      </div>
    </div>
  );
}

function DataTab() {
  const { lang } = useT();
  const mm = lang === "mm";
  const [text, setText] = useState("");

  const download = () => {
    try {
      const blob = new Blob([exportAllData()], { type: "application/json" });
      const a = document.createElement("a");
      a.href = URL.createObjectURL(blob);
      a.download = `shwe-meza-backup-${new Date().toISOString().slice(0, 10)}.json`;
      a.click();
      URL.revokeObjectURL(a.href);
    } catch (e) {
      toast.error((e as Error).message);
    }
  };

  return (
    <div className="space-y-4">
      <div className="rounded-2xl bg-card shadow-card p-4 space-y-3">
        <h2 className="font-semibold text-sm">{mm ? "ဒေတာ အရန်သိမ်းခြင်း" : "Backup & restore"}</h2>
        <Button size="sm" onClick={download}>{mm ? "ဒေတာအားလုံး ဒေါင်းလုဒ်" : "Export all data"}</Button>
        <input
          type="file"
          accept="application/json"
          className="block w-full text-sm"
          onChange={async (e) => {
            const f = e.target.files?.[0];
            if (f) setText(await f.text());
          }}
        />
        <Button
          size="sm"
          variant="secondary"
          disabled={!text}
          onClick={() => {
            try { importAllData(text); toast.success("Restored"); } catch (err) { toast.error((err as Error).message); }
          }}
        >
          {mm ? "ပြန်လည်ထည့်သွင်း" : "Restore backup"}
        </Button>
      </div>

      <div className="rounded-2xl bg-card shadow-card p-4 space-y-3">
        <h2 className="font-semibold text-sm text-destructive">{mm ? "အန္တရာယ်ရှိသော လုပ်ဆောင်ချက်" : "Danger zone"}</h2>
        <Button
          size="sm"
          variant="destructive"
          onClick={() => {
            if (window.confirm(mm ? "ပို့စ်၊ မှတ်ချက်၊ ချက်အားလုံး ဖျက်မှာလား?" : "Delete all posts, comments and chats?")) {
              try { wipeContent(); toast.success("Content wiped"); } catch (e) { toast.error((e as Error).message); }
            }
          }}
        >
          {mm ? "အကြောင်းအရာအားလုံး ဖျက်" : "Wipe all content"}
        </Button>
        <Button
          size="sm"
          variant="destructive"
          onClick={() => {
            if (window.confirm(mm ? "အကောင့်များအပါအဝင် အားလုံး ဖျက်မှာလား?" : "Factory reset EVERYTHING including accounts?")) {
              try { factoryReset(); window.location.reload(); } catch (e) { toast.error((e as Error).message); }
            }
          }}
        >
          {mm ? "စက်ရုံထုတ် အခြေအနေ ပြန်ထား" : "Factory reset"}
        </Button>
      </div>
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
