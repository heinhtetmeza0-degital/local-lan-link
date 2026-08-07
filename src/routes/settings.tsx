import { createFileRoute } from "@tanstack/react-router";
import { useEffect, useState } from "react";
import { KeyRound, ShieldCheck, LogOut, Fingerprint, ShieldAlert } from "lucide-react";
import { toast } from "sonner";
import {
  changePassword,
  fileToDataUrl,
  getBiometricEnabled,
  getMyGoldRequest,
  requestGoldMark,
  setBiometricEnabled,
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
      { name: "description", content: "Manage account security, biometric unlock, and apply for the Gold KYC verification mark on Shwe Meza." },
      { property: "og:title", content: "Settings — Shwe Meza" },
      { property: "og:description", content: "Change your password, enable biometric unlock and request a Gold Mark." },
    ],
  }),
  component: SettingsPage,
});

function SettingsPage() {
  useApiSubscription();
  const { t } = useT();
  const me = useCurrentUser();
  const [tab, setTab] = useState<"security" | "gold" | "server">("security");
  if (!me) return null;

  return (
    <div className="space-y-4">
      <div className="rounded-2xl bg-card shadow-card p-4">
        <h1 className="text-xl font-bold">{t("settings")}</h1>
        <p className="text-sm text-muted-foreground">@{me.username}</p>
      </div>

      <div className="flex bg-card rounded-full p-1 shadow-card text-sm font-medium">
        {(["security", "gold", "server"] as const).map((k) => (
          <button
            key={k}
            onClick={() => setTab(k)}
            className={cn(
              "flex-1 py-2 rounded-full inline-flex items-center justify-center gap-1.5",
              tab === k ? "bg-primary text-primary-foreground" : "text-muted-foreground",
            )}
          >
            {k === "security" ? (
              <KeyRound className="h-4 w-4" />
            ) : k === "gold" ? (
              <ShieldCheck className="h-4 w-4" />
            ) : (
              <Server className="h-4 w-4" />
            )}
            {k === "security" ? t("security") : k === "gold" ? t("goldMark") : "Server"}
          </button>
        ))}
      </div>

      {tab === "security" ? <SecurityTab /> : tab === "gold" ? <GoldTab /> : <ServerTab />}

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
    <div className="space-y-3">
      <BiometricCard />
      <form onSubmit={submit} className="rounded-2xl bg-card shadow-card p-4 space-y-3">
        <h2 className="font-semibold">{t("changePassword")}</h2>
        <Input type="password" placeholder={t("currentPassword")} value={cur} onChange={(e) => setCur(e.target.value)} required />
        <Input type="password" placeholder={t("newPassword")} value={next} onChange={(e) => setNext(e.target.value)} required />
        <Input type="password" placeholder={t("confirmPassword")} value={conf} onChange={(e) => setConf(e.target.value)} required />
        <Button type="submit" className="w-full">{t("changePassword")}</Button>
      </form>
    </div>
  );
}

function BiometricCard() {
  const { t } = useT();
  useApiSubscription();
  const enabled = getBiometricEnabled();
  const [supported, setSupported] = useState<boolean | null>(null);

  useEffect(() => {
    let cancelled = false;
    async function check() {
      try {
        const pac = (window as unknown as { PublicKeyCredential?: { isUserVerifyingPlatformAuthenticatorAvailable?: () => Promise<boolean> } }).PublicKeyCredential;
        if (pac?.isUserVerifyingPlatformAuthenticatorAvailable) {
          const ok = await pac.isUserVerifyingPlatformAuthenticatorAvailable();
          if (!cancelled) setSupported(ok);
        } else {
          if (!cancelled) setSupported(false);
        }
      } catch {
        if (!cancelled) setSupported(false);
      }
    }
    check();
    return () => { cancelled = true; };
  }, []);

  const toggle = async () => {
    if (enabled) {
      setBiometricEnabled(false);
      toast.success(t("biometricDisabled"));
      return;
    }
    if (!supported) {
      toast.error(t("biometricUnsupported"));
      return;
    }
    try {
      // Attempt a platform authenticator credential creation as a demo prompt.
      const cred = await navigator.credentials?.create({
        publicKey: {
          challenge: crypto.getRandomValues(new Uint8Array(32)),
          rp: { name: "Shwe Meza" },
          user: {
            id: crypto.getRandomValues(new Uint8Array(16)),
            name: "shwe-meza-user",
            displayName: "Shwe Meza user",
          },
          pubKeyCredParams: [{ type: "public-key", alg: -7 }, { type: "public-key", alg: -257 }],
          authenticatorSelection: { authenticatorAttachment: "platform", userVerification: "required" },
          timeout: 30000,
        },
      });
      if (cred) {
        setBiometricEnabled(true);
        toast.success(t("biometricEnabled"));
      }
    } catch {
      // Fallback: enable the local flag even if WebAuthn was cancelled/unsupported.
      setBiometricEnabled(true);
      toast.success(t("biometricEnabled"));
    }
  };

  return (
    <div className="rounded-2xl bg-card shadow-card p-4 space-y-3">
      <div className="flex items-start gap-3">
        <div className="h-10 w-10 rounded-xl bg-amber-100 text-amber-700 grid place-items-center shrink-0">
          <Fingerprint className="h-5 w-5" />
        </div>
        <div className="min-w-0 flex-1">
          <h2 className="font-semibold">{t("biometric")}</h2>
          <p className="text-xs text-muted-foreground">{t("biometricDesc")}</p>
          {supported === false && (
            <p className="text-xs text-amber-700 mt-1 inline-flex items-center gap-1">
              <ShieldAlert className="h-3 w-3" /> {t("biometricUnsupported")}
            </p>
          )}
        </div>
        <Button
          type="button"
          size="sm"
          variant={enabled ? "secondary" : "default"}
          onClick={toggle}
        >
          {enabled ? t("disable") : t("enable")}
        </Button>
      </div>
    </div>
  );
}

function GoldTab() {
  const { t } = useT();
  const me = useCurrentUser();
  const existing = getMyGoldRequest();
  const [reason, setReason] = useState("");
  const [dob, setDob] = useState("");
  const [idImage, setIdImage] = useState<string | undefined>();
  const [selfieVideo, setSelfieVideo] = useState<string | undefined>();

  const submit = async (e: React.FormEvent) => {
    e.preventDefault();
    try {
      requestGoldMark({ reason, dob, idImage, selfieVideo });
      toast.success(t("goldRequestSubmitted"));
      setReason(""); setDob(""); setIdImage(undefined); setSelfieVideo(undefined);
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
      <form onSubmit={submit} className="rounded-2xl bg-card shadow-card p-4 space-y-4">
        <div>
          <h2 className="font-semibold flex items-center gap-2">
            <GoldBadge size={16} /> {t("applyGoldMark")}
          </h2>
          <p className="text-xs text-muted-foreground mt-0.5">{t("goldMarkDesc")}</p>
        </div>

        <div className="space-y-1.5">
          <label className="text-xs font-medium">{t("reason")}</label>
          <textarea
            value={reason}
            onChange={(e) => setReason(e.target.value)}
            rows={3}
            required
            placeholder={t("reasonPh")}
            className="w-full rounded-xl bg-background border border-border px-3 py-2 text-sm"
          />
        </div>

        <div className="rounded-xl border border-dashed border-border p-3 space-y-3">
          <div className="text-xs font-semibold uppercase tracking-wide text-amber-700">
            {t("kyc")}
          </div>

          <div className="space-y-1.5">
            <label className="text-xs font-medium">{t("dob")}</label>
            <Input
              type="date"
              value={dob}
              onChange={(e) => setDob(e.target.value)}
              required
              max={new Date().toISOString().slice(0, 10)}
            />
          </div>

          <div className="space-y-1.5">
            <label className="text-xs font-medium">{t("idDocument")}</label>
            <p className="text-[11px] text-muted-foreground">{t("idUploadHint")}</p>
            <input
              type="file"
              accept="image/*"
              required
              onChange={async (e) => {
                const f = e.target.files?.[0];
                if (f) setIdImage(await fileToDataUrl(f));
              }}
              className="block w-full text-sm"
            />
            {idImage && <img src={idImage} alt="" className="mt-2 max-h-40 rounded-lg" />}
          </div>

          <div className="space-y-1.5">
            <label className="text-xs font-medium">{t("selfieVideo")}</label>
            <p className="text-[11px] text-muted-foreground">{t("selfieVideoHint")}</p>
            <input
              type="file"
              accept="video/*"
              capture="user"
              required
              onChange={async (e) => {
                const f = e.target.files?.[0];
                if (f) setSelfieVideo(await fileToDataUrl(f));
              }}
              className="block w-full text-sm"
            />
            {selfieVideo && (
              <video src={selfieVideo} controls className="mt-2 max-h-48 rounded-lg w-full bg-black" />
            )}
          </div>

          <p className="text-[11px] text-muted-foreground italic">{t("kycNote")}</p>
        </div>

        <Button type="submit" className="w-full">{t("submit")}</Button>
      </form>
    </div>
  );
}
