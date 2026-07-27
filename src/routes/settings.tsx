import { createFileRoute } from "@tanstack/react-router";
import { useState } from "react";
import { KeyRound, ShieldCheck, LogOut } from "lucide-react";
import { toast } from "sonner";
import {
  changePassword,
  fileToDataUrl,
  getMyGoldRequest,
  requestGoldMark,
  signOut,
} from "@/lib/api";
import { useApiSubscription, useCurrentUser } from "@/lib/use-api";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { useT } from "@/lib/i18n";
import { GoldBadge } from "@/components/gold-badge";
import { cn } from "@/lib/utils";

export const Route = createFileRoute("/settings")({
  head: () => ({
    meta: [
      { title: "Settings — Shwe Meza" },
      { name: "description", content: "Manage account security and apply for the Gold verification mark on Shwe Meza." },
      { property: "og:title", content: "Settings — Shwe Meza" },
      { property: "og:description", content: "Change your password and request a Gold Mark." },
    ],
  }),
  component: SettingsPage,
});

function SettingsPage() {
  useApiSubscription();
  const { t } = useT();
  const me = useCurrentUser();
  const [tab, setTab] = useState<"security" | "gold">("security");
  if (!me) return null;

  return (
    <div className="space-y-4">
      <div className="rounded-2xl bg-card shadow-card p-4">
        <h1 className="text-xl font-bold">{t("settings")}</h1>
        <p className="text-sm text-muted-foreground">@{me.username}</p>
      </div>

      <div className="flex bg-card rounded-full p-1 shadow-card text-sm font-medium">
        {(["security", "gold"] as const).map((k) => (
          <button
            key={k}
            onClick={() => setTab(k)}
            className={cn(
              "flex-1 py-2 rounded-full inline-flex items-center justify-center gap-1.5",
              tab === k ? "bg-primary text-primary-foreground" : "text-muted-foreground",
            )}
          >
            {k === "security" ? <KeyRound className="h-4 w-4" /> : <ShieldCheck className="h-4 w-4" />}
            {k === "security" ? t("security") : t("goldMark")}
          </button>
        ))}
      </div>

      {tab === "security" ? <SecurityTab /> : <GoldTab />}

      <button
        onClick={signOut}
        className="w-full flex items-center justify-center gap-2 rounded-2xl bg-card shadow-card p-3 text-sm font-medium text-destructive hover:bg-destructive/10"
      >
        <LogOut className="h-4 w-4" /> {t("signOut")}
      </button>

      <p className="pt-2 text-center text-xs text-muted-foreground">{t("credit")}</p>
    </div>
  );
}

function SecurityTab() {
  const { t } = useT();
  const [cur, setCur] = useState("");
  const [next, setNext] = useState("");
  const [conf, setConf] = useState("");

  const submit = (e: React.FormEvent) => {
    e.preventDefault();
    if (next !== conf) { toast.error(t("passwordMismatch")); return; }
    try {
      changePassword(cur, next);
      toast.success(t("passwordUpdated"));
      setCur(""); setNext(""); setConf("");
    } catch (err) {
      toast.error((err as Error).message);
    }
  };

  return (
    <form onSubmit={submit} className="rounded-2xl bg-card shadow-card p-4 space-y-3">
      <h2 className="font-semibold">{t("changePassword")}</h2>
      <Input type="password" placeholder={t("currentPassword")} value={cur} onChange={(e) => setCur(e.target.value)} required />
      <Input type="password" placeholder={t("newPassword")} value={next} onChange={(e) => setNext(e.target.value)} required />
      <Input type="password" placeholder={t("confirmPassword")} value={conf} onChange={(e) => setConf(e.target.value)} required />
      <Button type="submit" className="w-full">{t("changePassword")}</Button>
    </form>
  );
}

function GoldTab() {
  const { t } = useT();
  const me = useCurrentUser();
  const existing = getMyGoldRequest();
  const [reason, setReason] = useState("");
  const [proof, setProof] = useState<string | undefined>();

  const submit = async (e: React.FormEvent) => {
    e.preventDefault();
    try {
      requestGoldMark(reason, proof);
      toast.success(t("goldRequestSubmitted"));
      setReason(""); setProof(undefined);
    } catch (err) {
      toast.error((err as Error).message);
    }
  };

  if (me?.verified) {
    return (
      <div className="rounded-2xl bg-card shadow-card p-6 text-center space-y-2">
        <GoldBadge size={40} />
        <p className="font-semibold">{t("alreadyVerified")}</p>
      </div>
    );
  }

  return (
    <div className="space-y-3">
      {existing && (
        <div className="rounded-2xl bg-card shadow-card p-4 text-sm">
          <div className="font-semibold">{t("goldStatus")}</div>
          <div className="mt-1">
            <span
              className={cn(
                "inline-flex items-center rounded-full px-2 py-0.5 text-xs font-semibold",
                existing.status === "pending" && "bg-amber-100 text-amber-800",
                existing.status === "approved" && "bg-emerald-100 text-emerald-800",
                existing.status === "rejected" && "bg-red-100 text-red-800",
              )}
            >
              {existing.status === "pending" && t("statusPending")}
              {existing.status === "approved" && t("statusApproved")}
              {existing.status === "rejected" && t("statusRejected")}
            </span>
          </div>
        </div>
      )}
      <form onSubmit={submit} className="rounded-2xl bg-card shadow-card p-4 space-y-3">
        <h2 className="font-semibold flex items-center gap-2">
          <GoldBadge size={16} /> {t("applyGoldMark")}
        </h2>
        <p className="text-xs text-muted-foreground">{t("goldMarkDesc")}</p>
        <textarea
          value={reason}
          onChange={(e) => setReason(e.target.value)}
          rows={4}
          required
          placeholder={t("reasonPh")}
          className="w-full rounded-xl bg-background border border-border px-3 py-2 text-sm"
        />
        <div>
          <label className="text-xs text-muted-foreground">{t("proofOptional")}</label>
          <input
            type="file"
            accept="image/*"
            onChange={async (e) => {
              const f = e.target.files?.[0];
              if (f) setProof(await fileToDataUrl(f));
            }}
            className="mt-1 block w-full text-sm"
          />
          {proof && <img src={proof} alt="" className="mt-2 max-h-40 rounded-lg" />}
        </div>
        <Button type="submit" className="w-full">{t("submit")}</Button>
      </form>
    </div>
  );
}
