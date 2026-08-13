/**
 * Local API client for Shwe Meza.
 *
 * PocketBase-ready: swap the internals for the PocketBase SDK later
 * without touching UI code.
 */

import {
  hashPassword,
  verifyPassword,
  signPrivileges,
  verifyPrivileges,
  encryptSensitive,
  decryptSensitive,
  type PasswordRecord,
} from "./crypto";



export type User = {
  id: string;
  username: string;
  displayName: string;
  bio: string;
  avatar: string | null; // data URL
  verified?: boolean;
  isAdmin?: boolean;
};

export type Media =
  | { kind: "image"; url: string }
  | { kind: "video"; url: string }
  | { kind: "audio"; url: string; duration?: number }
  | { kind: "file"; url: string; name: string; size: number };

export type Post = {
  id: string;
  authorId: string;
  text: string;
  media: Media[];
  createdAt: number;
};

export type Comment = {
  id: string;
  postId: string;
  authorId: string;
  text: string;
  createdAt: number;
};

export type Notification = {
  id: string;
  userId: string;
  actorId: string;
  kind: "like" | "comment";
  postId: string;
  createdAt: number;
  read: boolean;
};

export type Conversation = {
  id: string;
  kind: "dm" | "group";
  name?: string;
  memberIds: string[];
  createdAt: number;
  updatedAt: number;
};

export type Message = {
  id: string;
  conversationId: string;
  authorId: string;
  text: string;
  media?: Media;
  createdAt: number;
};

export type ReportReason = "spam" | "harassment" | "inappropriate" | "misinformation" | "other";
export type Report = {
  id: string;
  postId: string;
  reporterId: string;
  reason: ReportReason;
  detail?: string;
  status: "pending" | "resolved" | "dismissed";
  createdAt: number;
};

export type GoldRequest = {
  id: string;
  userId: string;
  reason: string;
  proof?: string; // data URL (legacy)
  dob?: string; // ISO yyyy-mm-dd
  idImage?: string; // data URL — NRC / Driver's License
  selfieVideo?: string; // data URL — verification video
  status: "pending" | "approved" | "rejected";
  createdAt: number;
};


export type Ad = {
  id: string;
  title: string;
  image: string; // data URL or http
  link: string;
  createdAt: number;
};

export type AppSettings = {
  appName: string;
  tagline: string;
  allowSignups: boolean;
  maintenance: boolean;
  maintenanceMessage: string;
  allowPosting: boolean;
  allowMedia: boolean;
  showAds: boolean;
  defaultLang: "en" | "mm";
};

const K = {
  users: "shwe_users",
  passwords: "shwe_pw",
  priv: "shwe_priv",
  posts: "shwe_posts",
  comments: "shwe_comments",
  likes: "shwe_likes",
  notes: "shwe_notes",
  conversations: "shwe_convs",
  messages: "shwe_msgs",
  reports: "shwe_reports",
  gold: "shwe_gold",
  ads: "shwe_ads",
  saved: "shwe_saved",
  biometric: "shwe_biometric",
  banned: "shwe_banned",
  settings: "shwe_settings",
  session: "shwe_session",
  seeded: "shwe_seeded_v2",
};




const listeners = new Set<() => void>();
export function subscribe(fn: () => void) {
  listeners.add(fn);
  return () => listeners.delete(fn);
}
function emit() {
  listeners.forEach((f) => f());
}

function read<T>(key: string, fallback: T): T {
  if (typeof window === "undefined") return fallback;
  try {
    const raw = localStorage.getItem(key);
    return raw ? (JSON.parse(raw) as T) : fallback;
  } catch {
    return fallback;
  }
}
function write<T>(key: string, value: T) {
  if (typeof window === "undefined") return;
  localStorage.setItem(key, JSON.stringify(value));
  emit();
}

const uid = () => Math.random().toString(36).slice(2, 10) + Date.now().toString(36);

/* -------------------- seed -------------------- */
const MIGRATED_KEY = "shwe_secure_migrated_v1";

/** One-time upgrade of older installs: hash passwords, sign privileged flags. */
function ensureSecureMigration() {
  if (typeof window === "undefined") return;
  if (localStorage.getItem(MIGRATED_KEY)) return;
  localStorage.setItem(MIGRATED_KEY, "1");
  // rewrites any plain-text password as a salted hash
  readPasswords();
  const rawUsers = read<User[]>(K.users, []);
  const store = readPrivStore();
  for (const u of rawUsers) {
    if (store[u.id]) continue;
    if (u.isAdmin || u.verified) setPrivileges(u.id, { isAdmin: !!u.isAdmin, verified: !!u.verified });
  }
  // strip the now-untrusted flags from the raw user records
  write(
    K.users,
    rawUsers.map(({ isAdmin: _a, verified: _v, ...rest }) => rest),
  );
}

function ensureSeed() {
  if (typeof window === "undefined") return;
  if (localStorage.getItem(K.seeded)) {
    ensureSecureMigration();
    return;
  }

  const users: User[] = [
    { id: "u_alex", username: "alex", displayName: "Alex Rivera", bio: "Network admin. Coffee-fueled.", avatar: null },
    { id: "u_maya", username: "maya", displayName: "Maya Chen", bio: "Design + photography on the LAN.", avatar: null },
    { id: "u_thura", username: "thura", displayName: "Thura Aung", bio: "မင်္ဂလာပါ။", avatar: null },
  ];
  const posts: Post[] = [
    {
      id: "p_" + uid(),
      authorId: "u_maya",
      text: "First post on our shiny new social ✨ welcome everyone!",
      media: [],
      createdAt: Date.now() - 1000 * 60 * 60 * 3,
    },
    {
      id: "p_" + uid(),
      authorId: "u_thura",
      text: "မင်္ဂလာပါ! Shwe Meza ကို ကြိုဆိုပါတယ်။",
      media: [],
      createdAt: Date.now() - 1000 * 60 * 45,
    },
  ];
  write(K.users, users);
  write(K.passwords, {
    alex: hashPassword("demo"),
    maya: hashPassword("demo"),
    thura: hashPassword("demo"),
  });
  write(K.priv, {});
  write(K.posts, posts);
  write(K.comments, [] as Comment[]);
  write(K.likes, {} as Record<string, string[]>);
  write(K.notes, [] as Notification[]);
  write(K.conversations, [] as Conversation[]);
  write(K.messages, [] as Message[]);
  write(K.reports, [] as Report[]);
  write(K.gold, [] as GoldRequest[]);
  write(K.ads, [] as Ad[]);
  localStorage.setItem(K.seeded, "1");
  // Owner account privileges are written through the signed store only.
  setPrivileges("u_alex", { isAdmin: true, verified: true });

}

/* -------------------- credentials (hashed, never plain text) -------------------- */
type StoredPasswords = Record<string, PasswordRecord>;

function readPasswords(): StoredPasswords {
  const raw = read<Record<string, unknown>>(K.passwords, {});
  let migrated = false;
  const out: StoredPasswords = {};
  for (const [username, value] of Object.entries(raw)) {
    if (typeof value === "string") {
      // legacy plain-text password found — upgrade to a salted hash immediately
      out[username] = hashPassword(value);
      migrated = true;
    } else {
      out[username] = value as PasswordRecord;
    }
  }
  if (migrated) write(K.passwords, out);
  return out;
}

/* -------------------- privileged flags (integrity signed) -------------------- */
type PrivRecord = { isAdmin: boolean; verified: boolean; sig: string };

function readPrivStore(): Record<string, PrivRecord> {
  return read<Record<string, PrivRecord>>(K.priv, {});
}
function privilegesFor(userId: string): { isAdmin: boolean; verified: boolean } {
  const rec = readPrivStore()[userId];
  if (!rec || !verifyPrivileges(userId, !!rec.isAdmin, !!rec.verified, rec.sig)) {
    // Tampered or missing signature => no privileges at all.
    return { isAdmin: false, verified: false };
  }
  return { isAdmin: !!rec.isAdmin, verified: !!rec.verified };
}
function setPrivileges(userId: string, patch: { isAdmin?: boolean; verified?: boolean }) {
  const store = readPrivStore();
  const current = privilegesFor(userId);
  const isAdminFlag = patch.isAdmin ?? current.isAdmin;
  const verifiedFlag = patch.verified ?? current.verified;
  store[userId] = {
    isAdmin: isAdminFlag,
    verified: verifiedFlag,
    sig: signPrivileges(userId, isAdminFlag, verifiedFlag),
  };
  write(K.priv, store);
}

/* -------------------- auth -------------------- */
export function getCurrentUserId(): string | null {
  if (typeof window === "undefined") return null;
  return localStorage.getItem(K.session);
}

export function signUp(input: {
  username: string;
  password: string;
  displayName: string;
  bio?: string;
  avatar?: string | null;
}): User {
  ensureSeed();
  const username = input.username.trim().toLowerCase();
  if (!/^[a-z0-9_]{3,20}$/.test(username))
    throw new Error("Username must be 3-20 chars: letters, numbers, underscore.");
  if (input.password.length < 4) throw new Error("Password must be at least 4 characters.");
  const users = read<User[]>(K.users, []);
  if (users.some((u) => u.username === username)) throw new Error("Username already taken.");
  const user: User = {
    id: "u_" + uid(),
    username,
    displayName: input.displayName.trim() || username,
    bio: input.bio?.trim() ?? "",
    avatar: input.avatar ?? null,
  };
  const pw = readPasswords();
  pw[username] = hashPassword(input.password);
  write(K.users, [...users, user]);
  write(K.passwords, pw);
  setPrivileges(user.id, { isAdmin: false, verified: false });
  localStorage.setItem(K.session, user.id);
  emit();
  return user;
}

export function signIn(username: string, password: string): User {
  ensureSeed();
  const u = username.trim().toLowerCase();
  const pw = readPasswords();
  const users = read<User[]>(K.users, []);
  const user = users.find((x) => x.username === u);
  if (!user || !verifyPassword(password, pw[u])) throw new Error("Invalid username or password.");
  if (isBanned(user.id)) throw new Error("This account has been suspended by the app owner.");
  localStorage.setItem(K.session, user.id);
  emit();
  return user;
}


export function signOut() {
  localStorage.removeItem(K.session);
  emit();
}

export function changePassword(current: string, next: string) {
  const me = getCurrentUserId();
  if (!me) throw new Error("Not signed in");
  const user = getUser(me);
  if (!user) throw new Error("Not signed in");
  if (next.length < 4) throw new Error("Password must be at least 4 characters.");
  const pw = readPasswords();
  if (!verifyPassword(current, pw[user.username]))
    throw new Error("Current password is incorrect.");
  pw[user.username] = hashPassword(next);
  write(K.passwords, pw);
}

/* -------------------- users -------------------- */
export function getUsers(): User[] {
  ensureSeed();
  // Privileged flags always come from the signed store, never from the raw
  // user record, so editing localStorage cannot grant admin/verified status.
  return read<User[]>(K.users, []).map((u) => {
    const priv = privilegesFor(u.id);
    return { ...u, isAdmin: priv.isAdmin, verified: priv.verified };
  });
}
export function getUser(id: string): User | undefined {
  return getUsers().find((u) => u.id === id);
}
export function getUserByUsername(username: string): User | undefined {
  return getUsers().find((u) => u.username === username.toLowerCase());
}
export function updateProfile(patch: Partial<Omit<User, "id" | "username">>) {
  const me = getCurrentUserId();
  if (!me) throw new Error("Not signed in");
  // Never let a profile update carry privileged flags.
  const { isAdmin: _ignoredAdmin, verified: _ignoredVerified, ...safe } = patch;
  void _ignoredAdmin;
  void _ignoredVerified;
  const users = read<User[]>(K.users, []).map((u) => (u.id === me ? { ...u, ...safe } : u));
  write(K.users, users);
}
export function searchUsers(q: string): User[] {
  const s = q.trim().toLowerCase();
  if (!s) return [];
  return getUsers().filter(
    (u) => u.username.includes(s) || u.displayName.toLowerCase().includes(s),
  );
}
export function isAdmin(userId: string | null | undefined): boolean {
  if (!userId) return false;
  return privilegesFor(userId).isAdmin;
}


/* -------------------- posts -------------------- */
export function getPosts(): Post[] {
  ensureSeed();
  return read<Post[]>(K.posts, []).sort((a, b) => b.createdAt - a.createdAt);
}
export function getPostsByUser(userId: string): Post[] {
  return getPosts().filter((p) => p.authorId === userId);
}
export function getPost(id: string): Post | undefined {
  return read<Post[]>(K.posts, []).find((p) => p.id === id);
}
export function createPost(text: string, media: Media[] = []): Post {
  const me = getCurrentUserId();
  if (!me) throw new Error("Not signed in");
  if (!text.trim() && media.length === 0) throw new Error("Post is empty");
  const post: Post = {
    id: "p_" + uid(),
    authorId: me,
    text: text.trim(),
    media,
    createdAt: Date.now(),
  };
  write(K.posts, [post, ...read<Post[]>(K.posts, [])]);
  return post;
}
export function deletePost(id: string) {
  const me = getCurrentUserId();
  const admin = isAdmin(me);
  const posts = read<Post[]>(K.posts, []).filter(
    (p) => !(p.id === id && (admin || p.authorId === me)),
  );
  write(K.posts, posts);
}

/* -------------------- likes -------------------- */
export function getLikes(postId: string): string[] {
  return read<Record<string, string[]>>(K.likes, {})[postId] ?? [];
}
export function toggleLike(postId: string) {
  const me = getCurrentUserId();
  if (!me) throw new Error("Not signed in");
  const all = read<Record<string, string[]>>(K.likes, {});
  const cur = all[postId] ?? [];
  const has = cur.includes(me);
  all[postId] = has ? cur.filter((x) => x !== me) : [...cur, me];
  write(K.likes, all);
  if (!has) {
    const post = read<Post[]>(K.posts, []).find((p) => p.id === postId);
    if (post && post.authorId !== me) addNotification(post.authorId, me, "like", postId);
  }
}

/* -------------------- comments -------------------- */
export function getComments(postId: string): Comment[] {
  return read<Comment[]>(K.comments, [])
    .filter((c) => c.postId === postId)
    .sort((a, b) => a.createdAt - b.createdAt);
}
export function addComment(postId: string, text: string): Comment {
  const me = getCurrentUserId();
  if (!me) throw new Error("Not signed in");
  if (!text.trim()) throw new Error("Empty comment");
  const c: Comment = {
    id: "c_" + uid(),
    postId,
    authorId: me,
    text: text.trim(),
    createdAt: Date.now(),
  };
  write(K.comments, [...read<Comment[]>(K.comments, []), c]);
  const post = read<Post[]>(K.posts, []).find((p) => p.id === postId);
  if (post && post.authorId !== me) addNotification(post.authorId, me, "comment", postId);
  return c;
}

/* -------------------- notifications -------------------- */
function addNotification(userId: string, actorId: string, kind: Notification["kind"], postId: string) {
  const n: Notification = {
    id: "n_" + uid(),
    userId,
    actorId,
    kind,
    postId,
    createdAt: Date.now(),
    read: false,
  };
  write(K.notes, [n, ...read<Notification[]>(K.notes, [])]);
}
export function getNotifications(userId: string): Notification[] {
  return read<Notification[]>(K.notes, [])
    .filter((n) => n.userId === userId)
    .sort((a, b) => b.createdAt - a.createdAt);
}
export function unreadCount(userId: string): number {
  return getNotifications(userId).filter((n) => !n.read).length;
}
export function markAllRead(userId: string) {
  const all = read<Notification[]>(K.notes, []).map((n) =>
    n.userId === userId ? { ...n, read: true } : n,
  );
  write(K.notes, all);
}

/* -------------------- conversations & messages -------------------- */
export function getConversations(userId: string): Conversation[] {
  ensureSeed();
  return read<Conversation[]>(K.conversations, [])
    .filter((c) => c.memberIds.includes(userId))
    .sort((a, b) => b.updatedAt - a.updatedAt);
}
export function getConversation(id: string): Conversation | undefined {
  return read<Conversation[]>(K.conversations, []).find((c) => c.id === id);
}
function saveConversation(c: Conversation) {
  const all = read<Conversation[]>(K.conversations, []);
  const idx = all.findIndex((x) => x.id === c.id);
  if (idx >= 0) all[idx] = c;
  else all.unshift(c);
  write(K.conversations, all);
}
export function openDirectConversation(otherUserId: string): Conversation {
  const me = getCurrentUserId();
  if (!me) throw new Error("Not signed in");
  const pair = [me, otherUserId].sort();
  const id = "dm_" + pair.join("_");
  const existing = getConversation(id);
  if (existing) return existing;
  const c: Conversation = {
    id,
    kind: "dm",
    memberIds: pair,
    createdAt: Date.now(),
    updatedAt: Date.now(),
  };
  saveConversation(c);
  return c;
}
export function createGroup(name: string, memberIds: string[]): Conversation {
  const me = getCurrentUserId();
  if (!me) throw new Error("Not signed in");
  const members = Array.from(new Set([me, ...memberIds]));
  if (members.length < 2) throw new Error("Add at least one member");
  const c: Conversation = {
    id: "g_" + uid(),
    kind: "group",
    name: name.trim() || "Group",
    memberIds: members,
    createdAt: Date.now(),
    updatedAt: Date.now(),
  };
  saveConversation(c);
  return c;
}
export function getMessages(conversationId: string): Message[] {
  return read<Message[]>(K.messages, [])
    .filter((m) => m.conversationId === conversationId)
    .sort((a, b) => a.createdAt - b.createdAt);
}
export function sendMessage(conversationId: string, text: string, media?: Media): Message {
  const me = getCurrentUserId();
  if (!me) throw new Error("Not signed in");
  if (!text.trim() && !media) throw new Error("Empty message");
  const m: Message = {
    id: "m_" + uid(),
    conversationId,
    authorId: me,
    text: text.trim(),
    media,
    createdAt: Date.now(),
  };
  write(K.messages, [...read<Message[]>(K.messages, []), m]);
  const conv = getConversation(conversationId);
  if (conv) saveConversation({ ...conv, updatedAt: Date.now() });
  return m;
}
export function lastMessage(conversationId: string): Message | undefined {
  const list = getMessages(conversationId);
  return list[list.length - 1];
}

/* -------------------- reports -------------------- */
export function reportPost(postId: string, reason: ReportReason, detail?: string): Report {
  const me = getCurrentUserId();
  if (!me) throw new Error("Not signed in");
  const r: Report = {
    id: "r_" + uid(),
    postId,
    reporterId: me,
    reason,
    detail: detail?.trim() || undefined,
    status: "pending",
    createdAt: Date.now(),
  };
  write(K.reports, [r, ...read<Report[]>(K.reports, [])]);
  return r;
}
export function getReports(status?: Report["status"]): Report[] {
  const all = read<Report[]>(K.reports, []);
  return (status ? all.filter((r) => r.status === status) : all).sort(
    (a, b) => b.createdAt - a.createdAt,
  );
}
export function setReportStatus(id: string, status: Report["status"]) {
  if (!isAdmin(getCurrentUserId())) throw new Error("Admin only");
  const all = read<Report[]>(K.reports, []).map((r) => (r.id === id ? { ...r, status } : r));
  write(K.reports, all);
}

/* -------------------- gold verification -------------------- */
export function requestGoldMark(input: {
  reason: string;
  dob?: string;
  idImage?: string;
  selfieVideo?: string;
  proof?: string;
}): GoldRequest {
  const me = getCurrentUserId();
  if (!me) throw new Error("Not signed in");
  if (!input.reason.trim()) throw new Error("Please provide a reason");
  if (!input.dob) throw new Error("Date of birth is required");
  if (!input.idImage) throw new Error("ID document image is required");
  if (!input.selfieVideo) throw new Error("Selfie verification video is required");
  const g: GoldRequest = {
    id: "g_" + uid(),
    userId: me,
    reason: input.reason.trim(),
    // Sensitive KYC data is encrypted at rest — never stored as raw data URLs.
    dob: encryptSensitive(input.dob),
    idImage: encryptSensitive(input.idImage),
    selfieVideo: encryptSensitive(input.selfieVideo),
    proof: input.proof ? encryptSensitive(input.proof) : undefined,
    status: "pending",
    createdAt: Date.now(),
  };
  write(K.gold, [g, ...read<GoldRequest[]>(K.gold, [])]);
  return g;
}

/** Only the reviewing admin (or the owner) may see decrypted KYC material. */
function revealKyc(g: GoldRequest, allowed: boolean): GoldRequest {
  if (!allowed) {
    return { ...g, dob: undefined, idImage: undefined, selfieVideo: undefined, proof: undefined };
  }
  return {
    ...g,
    dob: decryptSensitive(g.dob),
    idImage: decryptSensitive(g.idImage),
    selfieVideo: decryptSensitive(g.selfieVideo),
    proof: decryptSensitive(g.proof),
  };
}

export function getGoldRequests(status?: GoldRequest["status"]): GoldRequest[] {
  const me = getCurrentUserId();
  const admin = isAdmin(me);
  const all = read<GoldRequest[]>(K.gold, []);
  return (status ? all.filter((g) => g.status === status) : all)
    .sort((a, b) => b.createdAt - a.createdAt)
    .map((g) => revealKyc(g, admin || g.userId === me));
}
export function getMyGoldRequest(): GoldRequest | undefined {
  const me = getCurrentUserId();
  if (!me) return undefined;
  return getGoldRequests().find((g) => g.userId === me);
}
export function approveGold(id: string) {
  if (!isAdmin(getCurrentUserId())) throw new Error("Admin only");
  const reqs = read<GoldRequest[]>(K.gold, []);
  const target = reqs.find((r) => r.id === id);
  if (!target) return;
  const updated = reqs.map((r) => (r.id === id ? { ...r, status: "approved" as const } : r));
  setPrivileges(target.userId, { verified: true });
  write(K.gold, updated);
}

export function rejectGold(id: string) {
  if (!isAdmin(getCurrentUserId())) throw new Error("Admin only");
  const updated = read<GoldRequest[]>(K.gold, []).map((r) =>
    r.id === id ? { ...r, status: "rejected" as const } : r,
  );
  write(K.gold, updated);
}

/* -------------------- ads -------------------- */
export function getAds(): Ad[] {
  ensureSeed();
  return read<Ad[]>(K.ads, []).sort((a, b) => b.createdAt - a.createdAt);
}
export function createAd(input: { title: string; image: string; link: string }): Ad {
  if (!isAdmin(getCurrentUserId())) throw new Error("Admin only");
  if (!input.title.trim() || !input.image) throw new Error("Title and image are required");
  const ad: Ad = {
    id: "ad_" + uid(),
    title: input.title.trim(),
    image: input.image,
    link: input.link.trim(),
    createdAt: Date.now(),
  };
  write(K.ads, [ad, ...read<Ad[]>(K.ads, [])]);
  return ad;
}
export function deleteAd(id: string) {
  if (!isAdmin(getCurrentUserId())) throw new Error("Admin only");
  write(K.ads, read<Ad[]>(K.ads, []).filter((a) => a.id !== id));
}

/* -------------------- saved posts -------------------- */
export function getSaved(): Record<string, string[]> {
  return read<Record<string, string[]>>(K.saved, {});
}
export function isPostSaved(postId: string): boolean {
  const me = getCurrentUserId();
  if (!me) return false;
  return (getSaved()[me] ?? []).includes(postId);
}
export function toggleSavePost(postId: string) {
  const me = getCurrentUserId();
  if (!me) throw new Error("Not signed in");
  const all = getSaved();
  const cur = all[me] ?? [];
  all[me] = cur.includes(postId) ? cur.filter((x) => x !== postId) : [postId, ...cur];
  write(K.saved, all);
}
export function getSavedPosts(userId: string): Post[] {
  const ids = getSaved()[userId] ?? [];
  const posts = read<Post[]>(K.posts, []);
  return ids
    .map((id) => posts.find((p) => p.id === id))
    .filter((p): p is Post => Boolean(p));
}

/* -------------------- biometric setting -------------------- */
export function getBiometricEnabled(): boolean {
  const me = getCurrentUserId();
  if (!me) return false;
  const map = read<Record<string, boolean>>(K.biometric, {});
  return !!map[me];
}
export function setBiometricEnabled(enabled: boolean) {
  const me = getCurrentUserId();
  if (!me) throw new Error("Not signed in");
  const map = read<Record<string, boolean>>(K.biometric, {});
  map[me] = enabled;
  write(K.biometric, map);
}


/* -------------------- helpers -------------------- */
export function fileToDataUrl(file: File): Promise<string> {
  return new Promise((resolve, reject) => {
    const r = new FileReader();
    r.onload = () => resolve(r.result as string);
    r.onerror = reject;
    r.readAsDataURL(file);
  });
}
export function blobToDataUrl(blob: Blob): Promise<string> {
  return new Promise((resolve, reject) => {
    const r = new FileReader();
    r.onload = () => resolve(r.result as string);
    r.onerror = reject;
    r.readAsDataURL(blob);
  });
}
