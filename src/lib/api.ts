/**
 * Local API client for Shwe Meza.
 *
 * PocketBase-ready: swap the internals for the PocketBase SDK later
 * without touching UI code. Collections would map to:
 *   users, posts, comments, likes, notifications,
 *   conversations, messages.
 */

export type User = {
  id: string;
  username: string;
  displayName: string;
  bio: string;
  avatar: string | null; // data URL
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
  name?: string; // group name
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

const K = {
  users: "shwe_users",
  passwords: "shwe_pw",
  posts: "shwe_posts",
  comments: "shwe_comments",
  likes: "shwe_likes",
  notes: "shwe_notes",
  conversations: "shwe_convs",
  messages: "shwe_msgs",
  session: "shwe_session",
  seeded: "shwe_seeded",
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
function ensureSeed() {
  if (typeof window === "undefined") return;
  if (localStorage.getItem(K.seeded)) return;
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
  write(K.passwords, { alex: "demo", maya: "demo", thura: "demo" } as Record<string, string>);
  write(K.posts, posts);
  write(K.comments, [] as Comment[]);
  write(K.likes, {} as Record<string, string[]>);
  write(K.notes, [] as Notification[]);
  write(K.conversations, [] as Conversation[]);
  write(K.messages, [] as Message[]);
  localStorage.setItem(K.seeded, "1");
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
  const pw = read<Record<string, string>>(K.passwords, {});
  pw[username] = input.password;
  write(K.users, [...users, user]);
  write(K.passwords, pw);
  localStorage.setItem(K.session, user.id);
  emit();
  return user;
}

export function signIn(username: string, password: string): User {
  ensureSeed();
  const u = username.trim().toLowerCase();
  const pw = read<Record<string, string>>(K.passwords, {});
  const users = read<User[]>(K.users, []);
  const user = users.find((x) => x.username === u);
  if (!user || pw[u] !== password) throw new Error("Invalid username or password.");
  localStorage.setItem(K.session, user.id);
  emit();
  return user;
}

export function signOut() {
  localStorage.removeItem(K.session);
  emit();
}

/* -------------------- users -------------------- */
export function getUsers(): User[] {
  ensureSeed();
  return read<User[]>(K.users, []);
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
  const users = getUsers().map((u) => (u.id === me ? { ...u, ...patch } : u));
  write(K.users, users);
}
export function searchUsers(q: string): User[] {
  const s = q.trim().toLowerCase();
  if (!s) return [];
  return getUsers().filter(
    (u) => u.username.includes(s) || u.displayName.toLowerCase().includes(s),
  );
}

/* -------------------- posts -------------------- */
export function getPosts(): Post[] {
  ensureSeed();
  return read<Post[]>(K.posts, []).sort((a, b) => b.createdAt - a.createdAt);
}
export function getPostsByUser(userId: string): Post[] {
  return getPosts().filter((p) => p.authorId === userId);
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
  const posts = read<Post[]>(K.posts, []).filter((p) => !(p.id === id && p.authorId === me));
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
