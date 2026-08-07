/**
 * Hybrid PocketBase sync for Shwe Meza.
 *
 * The app keeps working entirely offline on localStorage (that is what makes
 * offline/PWA mode possible). When a PocketBase server URL is configured and
 * reachable, every record is mirrored to it so all devices on the LAN share the
 * same data — posts, chats, uploaded images/videos/voice notes included.
 *
 * PocketBase setup (one collection only):
 *
 *   Collection name: shwe_records   (type: Base)
 *   Fields:
 *     store   text     required
 *     lid     text     required   (Unique index on: store + lid)
 *     data    json     required
 *     ts      number   required
 *   API rules: leave all rules empty (public) for a trusted LAN,
 *   or set them to an admin/user rule if your network is shared.
 */

const URL_KEY = "shwe_pb_url";
const LAST_SYNC_KEY = "shwe_pb_last_sync";
const COLLECTION = "shwe_records";

/** localStorage stores that hold arrays of records with an `id`. */
const LIST_STORES = [
  "shwe_users",
  "shwe_posts",
  "shwe_comments",
  "shwe_notes",
  "shwe_convs",
  "shwe_msgs",
  "shwe_reports",
  "shwe_gold",
  "shwe_ads",
] as const;

/** Stores saved as a single blob (maps / credential tables). */
const BLOB_STORES = ["shwe_likes", "shwe_saved", "shwe_pw", "shwe_priv"] as const;

type Row = { id?: string; store: string; lid: string; data: unknown; ts: number };

export type SyncResult = { pushed: number; pulled: number; error?: string };

/* -------------------- config -------------------- */
export function getServerUrl(): string {
  if (typeof window === "undefined") return "";
  return localStorage.getItem(URL_KEY) ?? "";
}

export function setServerUrl(url: string) {
  const clean = url.trim().replace(/\/+$/, "");
  if (clean) localStorage.setItem(URL_KEY, clean);
  else localStorage.removeItem(URL_KEY);
}

export function getLastSync(): number {
  if (typeof window === "undefined") return 0;
  return Number(localStorage.getItem(LAST_SYNC_KEY) ?? 0);
}

export function isConfigured(): boolean {
  return getServerUrl().length > 0;
}

/* -------------------- transport -------------------- */
async function pb<T>(path: string, init?: RequestInit): Promise<T> {
  const base = getServerUrl();
  if (!base) throw new Error("No PocketBase server URL configured");
  const res = await fetch(base + path, {
    ...init,
    headers: { "Content-Type": "application/json", ...(init?.headers ?? {}) },
  });
  if (!res.ok) throw new Error(`${res.status} ${res.statusText} — ${await res.text()}`);
  return (await res.json()) as T;
}

/** Quick reachability + collection check. */
export async function testConnection(): Promise<{ ok: boolean; message: string }> {
  try {
    await pb<{ code: number }>("/api/health");
  } catch (e) {
    return { ok: false, message: e instanceof Error ? e.message : "Server unreachable" };
  }
  try {
    await pb(`/api/collections/${COLLECTION}/records?perPage=1`);
    return { ok: true, message: "Connected" };
  } catch {
    return {
      ok: false,
      message: `Server reachable, but the "${COLLECTION}" collection is missing. Create it in the PocketBase admin UI.`,
    };
  }
}

/* -------------------- local helpers -------------------- */
function readLocal<T>(key: string, fallback: T): T {
  try {
    const raw = localStorage.getItem(key);
    return raw ? (JSON.parse(raw) as T) : fallback;
  } catch {
    return fallback;
  }
}

function writeLocal(key: string, value: unknown) {
  localStorage.setItem(key, JSON.stringify(value));
}

function localRows(): Row[] {
  const rows: Row[] = [];
  const now = Date.now();
  for (const store of LIST_STORES) {
    for (const item of readLocal<Array<Record<string, unknown>>>(store, [])) {
      const lid = String(item["id"] ?? "");
      if (!lid) continue;
      rows.push({
        store,
        lid,
        data: item,
        ts: Number(item["updatedAt"] ?? item["createdAt"] ?? now),
      });
    }
  }
  for (const store of BLOB_STORES) {
    const raw = localStorage.getItem(store);
    if (raw === null) continue;
    rows.push({ store, lid: "__blob__", data: readLocal<unknown>(store, null), ts: now });
  }
  return rows;
}

/* -------------------- sync -------------------- */
async function fetchAllRemote(): Promise<Row[]> {
  const out: Row[] = [];
  let page = 1;
  for (;;) {
    const res = await pb<{ items: Row[]; totalPages: number }>(
      `/api/collections/${COLLECTION}/records?perPage=500&page=${page}`,
    );
    out.push(...res.items);
    if (page >= res.totalPages) break;
    page += 1;
  }
  return out;
}

/**
 * Two-way sync, last-write-wins per record.
 * Local data always stays usable — a failed sync never wipes anything.
 */
export async function syncNow(): Promise<SyncResult> {
  if (!isConfigured()) return { pushed: 0, pulled: 0, error: "No server URL configured" };
  let remote: Row[];
  try {
    remote = await fetchAllRemote();
  } catch (e) {
    return { pushed: 0, pulled: 0, error: e instanceof Error ? e.message : "Sync failed" };
  }

  const remoteMap = new Map<string, Row>();
  for (const r of remote) remoteMap.set(`${r.store}::${r.lid}`, r);

  // --- push local records that are new or newer ---
  let pushed = 0;
  for (const row of localRows()) {
    const key = `${row.store}::${row.lid}`;
    const existing = remoteMap.get(key);
    try {
      if (!existing) {
        await pb(`/api/collections/${COLLECTION}/records`, {
          method: "POST",
          body: JSON.stringify(row),
        });
        pushed += 1;
      } else if (row.ts > existing.ts) {
        await pb(`/api/collections/${COLLECTION}/records/${existing.id}`, {
          method: "PATCH",
          body: JSON.stringify({ data: row.data, ts: row.ts }),
        });
        remoteMap.set(key, { ...existing, ...row });
        pushed += 1;
      }
    } catch {
      /* keep syncing the rest */
    }
  }

  // --- pull remote records that we do not have (or that are newer) ---
  let pulled = 0;
  for (const store of LIST_STORES) {
    const local = readLocal<Array<Record<string, unknown>>>(store, []);
    const byId = new Map(local.map((i) => [String(i["id"] ?? ""), i]));
    let changed = false;
    for (const r of remote) {
      if (r.store !== store) continue;
      const mine = byId.get(r.lid);
      const mineTs = mine ? Number(mine["updatedAt"] ?? mine["createdAt"] ?? 0) : -1;
      if (!mine || r.ts > mineTs) {
        byId.set(r.lid, r.data as Record<string, unknown>);
        changed = true;
        pulled += 1;
      }
    }
    if (changed) writeLocal(store, Array.from(byId.values()));
  }
  for (const store of BLOB_STORES) {
    const r = remoteMap.get(`${store}::__blob__`);
    if (!r) continue;
    const localRaw = localStorage.getItem(store);
    const merged =
      localRaw && typeof r.data === "object" && r.data !== null
        ? { ...(r.data as Record<string, unknown>), ...(readLocal<Record<string, unknown>>(store, {})) }
        : r.data;
    writeLocal(store, merged);
    pulled += 1;
  }

  localStorage.setItem(LAST_SYNC_KEY, String(Date.now()));
  window.dispatchEvent(new Event("shwe-synced"));
  return { pushed, pulled };
}

let timer: ReturnType<typeof setInterval> | null = null;

/** Background sync every 20s while the server is configured and we are online. */
export function startAutoSync() {
  if (typeof window === "undefined" || timer) return;
  const run = () => {
    if (!isConfigured() || !navigator.onLine) return;
    void syncNow();
  };
  run();
  timer = setInterval(run, 20_000);
  window.addEventListener("online", run);
}
