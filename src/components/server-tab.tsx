import { useEffect, useState } from "react";
import { Server, RefreshCw, CheckCircle2, XCircle, CloudOff } from "lucide-react";
import { toast } from "sonner";
import {
  getServerUrl,
  setServerUrl,
  testConnection,
  syncNow,
  getLastSync,
  isConfigured,
} from "@/lib/pocketbase";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";

export function ServerTab() {
  const [url, setUrl] = useState("");
  const [status, setStatus] = useState<{ ok: boolean; message: string } | null>(null);
  const [busy, setBusy] = useState(false);
  const [last, setLast] = useState(0);

  useEffect(() => {
    setUrl(getServerUrl());
    setLast(getLastSync());
  }, []);

  const save = async () => {
    setServerUrl(url);
    if (!isConfigured()) {
      setStatus(null);
      toast.success("Server URL cleared — using this device only");
      return;
    }
    setBusy(true);
    const res = await testConnection();
    setStatus(res);
    setBusy(false);
    if (res.ok) toast.success("Connected to your server");
    else toast.error(res.message);
  };

  const sync = async () => {
    setBusy(true);
    const res = await syncNow();
    setBusy(false);
    setLast(getLastSync());
    if (res.error) toast.error(res.error);
    else toast.success(`Synced — ${res.pushed} sent, ${res.pulled} received`);
  };

  return (
    <div className="space-y-4">
      <div className="rounded-2xl bg-card shadow-card p-4 space-y-3">
        <div className="flex items-center gap-2">
          <Server className="h-4 w-4 text-primary" />
          <h2 className="font-semibold">My server (PocketBase)</h2>
        </div>
        <p className="text-sm text-muted-foreground">
          Point Shwe Meza at your own PocketBase server so every post, chat and uploaded file is
          stored on your LAN and shared across all devices. Leave it empty to keep data on this
          device only.
        </p>
        <Input
          value={url}
          onChange={(e) => setUrl(e.target.value)}
          placeholder="http://192.168.1.10:8090"
          inputMode="url"
          autoCapitalize="none"
          spellCheck={false}
        />
        <div className="flex gap-2">
          <Button onClick={save} disabled={busy} className="flex-1">
            Save &amp; test
          </Button>
          <Button onClick={sync} disabled={busy || !url.trim()} variant="secondary" className="flex-1">
            <RefreshCw className={busy ? "h-4 w-4 animate-spin" : "h-4 w-4"} /> Sync now
          </Button>
        </div>

        {status && (
          <div
            className={
              status.ok
                ? "flex items-start gap-2 text-sm text-primary"
                : "flex items-start gap-2 text-sm text-destructive"
            }
          >
            {status.ok ? (
              <CheckCircle2 className="h-4 w-4 mt-0.5 shrink-0" />
            ) : (
              <XCircle className="h-4 w-4 mt-0.5 shrink-0" />
            )}
            <span>{status.message}</span>
          </div>
        )}

        <p className="text-xs text-muted-foreground flex items-center gap-1.5">
          <CloudOff className="h-3.5 w-3.5" />
          {last
            ? `Last sync: ${new Date(last).toLocaleString()}`
            : "Not synced yet — data is stored on this device."}
        </p>
      </div>

      <div className="rounded-2xl bg-card shadow-card p-4 space-y-2">
        <h3 className="font-semibold text-sm">PocketBase setup</h3>
        <p className="text-xs text-muted-foreground">
          In the PocketBase admin UI create one Base collection named{" "}
          <code className="font-mono">shwe_records</code> with these fields:
        </p>
        <ul className="text-xs text-muted-foreground list-disc pl-5 space-y-0.5">
          <li>
            <code className="font-mono">store</code> — text, required
          </li>
          <li>
            <code className="font-mono">lid</code> — text, required
          </li>
          <li>
            <code className="font-mono">data</code> — json, required
          </li>
          <li>
            <code className="font-mono">ts</code> — number, required
          </li>
        </ul>
        <p className="text-xs text-muted-foreground">
          Add a unique index on <code className="font-mono">store + lid</code>. On a trusted LAN you
          can leave the API rules public.
        </p>
      </div>
    </div>
  );
}
