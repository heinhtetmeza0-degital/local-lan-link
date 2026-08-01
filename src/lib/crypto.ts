/**
 * Lightweight synchronous crypto helpers for Shwe Meza.
 *
 * The app is a LAN-first, client-only build (localStorage backing store), so
 * this module provides a *secure abstraction layer* that mirrors what the
 * PocketBase backend will do server-side later:
 *   - passwords are salted + stretched, never stored in plain text
 *   - privileged flags (isAdmin / verified) are integrity-signed (HMAC)
 *   - sensitive KYC blobs are encrypted at rest instead of raw data URLs
 *
 * Everything is synchronous so the existing api.ts call signatures stay intact.
 */

/* ------------------------- SHA-256 (sync, compact) ------------------------- */

const K = new Uint32Array([
  0x428a2f98, 0x71374491, 0xb5c0fbcf, 0xe9b5dba5, 0x3956c25b, 0x59f111f1, 0x923f82a4, 0xab1c5ed5,
  0xd807aa98, 0x12835b01, 0x243185be, 0x550c7dc3, 0x72be5d74, 0x80deb1fe, 0x9bdc06a7, 0xc19bf174,
  0xe49b69c1, 0xefbe4786, 0x0fc19dc6, 0x240ca1cc, 0x2de92c6f, 0x4a7484aa, 0x5cb0a9dc, 0x76f988da,
  0x983e5152, 0xa831c66d, 0xb00327c8, 0xbf597fc7, 0xc6e00bf3, 0xd5a79147, 0x06ca6351, 0x14292967,
  0x27b70a85, 0x2e1b2138, 0x4d2c6dfc, 0x53380d13, 0x650a7354, 0x766a0abb, 0x81c2c92e, 0x92722c85,
  0xa2bfe8a1, 0xa81a664b, 0xc24b8b70, 0xc76c51a3, 0xd192e819, 0xd6990624, 0xf40e3585, 0x106aa070,
  0x19a4c116, 0x1e376c08, 0x2748774c, 0x34b0bcb5, 0x391c0cb3, 0x4ed8aa4a, 0x5b9cca4f, 0x682e6ff3,
  0x748f82ee, 0x78a5636f, 0x84c87814, 0x8cc70208, 0x90befffa, 0xa4506ceb, 0xbef9a3f7, 0xc67178f2,
]);

function rotr(x: number, n: number) {
  return (x >>> n) | (x << (32 - n));
}

export function sha256Bytes(input: Uint8Array): Uint8Array {
  const h = new Uint32Array([
    0x6a09e667, 0xbb67ae85, 0x3c6ef372, 0xa54ff53a, 0x510e527f, 0x9b05688c, 0x1f83d9ab, 0x5be0cd19,
  ]);
  const bitLen = input.length * 8;
  const withPad = new Uint8Array((((input.length + 9) >> 6) + 1) << 6);
  withPad.set(input);
  withPad[input.length] = 0x80;
  const dv = new DataView(withPad.buffer);
  dv.setUint32(withPad.length - 4, bitLen >>> 0);
  dv.setUint32(withPad.length - 8, Math.floor(bitLen / 0x100000000));

  const w = new Uint32Array(64);
  for (let off = 0; off < withPad.length; off += 64) {
    for (let i = 0; i < 16; i++) w[i] = dv.getUint32(off + i * 4);
    for (let i = 16; i < 64; i++) {
      const s0 = rotr(w[i - 15], 7) ^ rotr(w[i - 15], 18) ^ (w[i - 15] >>> 3);
      const s1 = rotr(w[i - 2], 17) ^ rotr(w[i - 2], 19) ^ (w[i - 2] >>> 10);
      w[i] = (w[i - 16] + s0 + w[i - 7] + s1) >>> 0;
    }
    let [a, b, c, d, e, f, g, hh] = h;
    for (let i = 0; i < 64; i++) {
      const S1 = rotr(e, 6) ^ rotr(e, 11) ^ rotr(e, 25);
      const ch = (e & f) ^ (~e & g);
      const t1 = (hh + S1 + ch + K[i] + w[i]) >>> 0;
      const S0 = rotr(a, 2) ^ rotr(a, 13) ^ rotr(a, 22);
      const maj = (a & b) ^ (a & c) ^ (b & c);
      const t2 = (S0 + maj) >>> 0;
      hh = g; g = f; f = e;
      e = (d + t1) >>> 0;
      d = c; c = b; b = a;
      a = (t1 + t2) >>> 0;
    }
    h[0] = (h[0] + a) >>> 0; h[1] = (h[1] + b) >>> 0; h[2] = (h[2] + c) >>> 0; h[3] = (h[3] + d) >>> 0;
    h[4] = (h[4] + e) >>> 0; h[5] = (h[5] + f) >>> 0; h[6] = (h[6] + g) >>> 0; h[7] = (h[7] + hh) >>> 0;
  }
  const out = new Uint8Array(32);
  const odv = new DataView(out.buffer);
  for (let i = 0; i < 8; i++) odv.setUint32(i * 4, h[i]);
  return out;
}

const enc = new TextEncoder();
const toBytes = (s: string) => enc.encode(s);
const toHex = (b: Uint8Array) => Array.from(b, (x) => x.toString(16).padStart(2, "0")).join("");

export function sha256Hex(text: string): string {
  return toHex(sha256Bytes(toBytes(text)));
}

/* ------------------------------- HMAC-SHA256 ------------------------------- */

export function hmacSha256(keyText: string, message: string): string {
  const raw = toBytes(keyText);
  const key: Uint8Array = raw.length > 64 ? sha256Bytes(raw) : raw;

  const block = new Uint8Array(64);
  block.set(key);
  const inner = new Uint8Array(64);
  const outer = new Uint8Array(64);
  for (let i = 0; i < 64; i++) {
    inner[i] = block[i] ^ 0x36;
    outer[i] = block[i] ^ 0x5c;
  }
  const msg = toBytes(message);
  const i1 = new Uint8Array(64 + msg.length);
  i1.set(inner);
  i1.set(msg, 64);
  const ih = sha256Bytes(i1);
  const o1 = new Uint8Array(96);
  o1.set(outer);
  o1.set(ih, 64);
  return toHex(sha256Bytes(o1));
}

/* --------------------------- password hashing ----------------------------- */

const ITERATIONS = 6000;

export type PasswordRecord = { algo: "sha256-iter"; salt: string; iter: number; hash: string };

export function randomSalt(bytes = 16): string {
  const buf = new Uint8Array(bytes);
  if (typeof crypto !== "undefined" && crypto.getRandomValues) crypto.getRandomValues(buf);
  else for (let i = 0; i < bytes; i++) buf[i] = Math.floor(Math.random() * 256);
  return toHex(buf);
}

function stretch(password: string, salt: string, iter: number): string {
  let cur = sha256Hex(`${salt}:${password}`);
  for (let i = 0; i < iter; i++) cur = sha256Hex(`${cur}:${salt}:${i & 1023}`);
  return cur;
}

export function hashPassword(password: string): PasswordRecord {
  const salt = randomSalt();
  return { algo: "sha256-iter", salt, iter: ITERATIONS, hash: stretch(password, salt, ITERATIONS) };
}

export function verifyPassword(password: string, record: PasswordRecord | undefined): boolean {
  if (!record || typeof record !== "object" || !record.salt) return false;
  const candidate = stretch(password, record.salt, record.iter ?? ITERATIONS);
  // constant-time-ish comparison
  if (candidate.length !== record.hash.length) return false;
  let diff = 0;
  for (let i = 0; i < candidate.length; i++) diff |= candidate.charCodeAt(i) ^ record.hash.charCodeAt(i);
  return diff === 0;
}

/* --------------------- device key + symmetric encryption ------------------- */

const DEVICE_KEY_STORE = "shwe_device_key";

export function getDeviceKey(): string {
  if (typeof window === "undefined") return "shwe-meza-ssr-key";
  let k = localStorage.getItem(DEVICE_KEY_STORE);
  if (!k) {
    k = randomSalt(32);
    localStorage.setItem(DEVICE_KEY_STORE, k);
  }
  return k;
}

function keystream(key: string, length: number): Uint8Array {
  const out = new Uint8Array(length);
  let offset = 0;
  let counter = 0;
  while (offset < length) {
    const block = sha256Bytes(toBytes(`${key}:${counter++}`));
    out.set(block.subarray(0, Math.min(32, length - offset)), offset);
    offset += 32;
  }
  return out;
}

function b64encode(bytes: Uint8Array): string {
  let s = "";
  for (let i = 0; i < bytes.length; i += 0x8000)
    s += String.fromCharCode(...bytes.subarray(i, i + 0x8000));
  return btoa(s);
}
function b64decode(text: string): Uint8Array {
  const bin = atob(text);
  const out = new Uint8Array(bin.length);
  for (let i = 0; i < bin.length; i++) out[i] = bin.charCodeAt(i);
  return out;
}

const CIPHER_PREFIX = "enc:v1:";

/** Encrypts sensitive text (KYC data URLs, DOB) at rest. */
export function encryptSensitive(plain: string): string {
  if (!plain) return plain;
  if (typeof window === "undefined") return plain;
  const iv = randomSalt(8);
  const key = `${getDeviceKey()}:${iv}`;
  const data = toBytes(plain);
  const ks = keystream(key, data.length);
  const out = new Uint8Array(data.length);
  for (let i = 0; i < data.length; i++) out[i] = data[i] ^ ks[i];
  const mac = hmacSha256(getDeviceKey(), `${iv}:${b64encode(out)}`).slice(0, 32);
  return `${CIPHER_PREFIX}${iv}:${mac}:${b64encode(out)}`;
}

/** Decrypts a value produced by encryptSensitive; returns undefined if tampered. */
export function decryptSensitive(value: string | undefined): string | undefined {
  if (!value) return value;
  if (!value.startsWith(CIPHER_PREFIX)) return value; // legacy plain value
  const [iv, mac, payload] = value.slice(CIPHER_PREFIX.length).split(":");
  if (!iv || !mac || !payload) return undefined;
  if (hmacSha256(getDeviceKey(), `${iv}:${payload}`).slice(0, 32) !== mac) return undefined;
  const data = b64decode(payload);
  const ks = keystream(`${getDeviceKey()}:${iv}`, data.length);
  const out = new Uint8Array(data.length);
  for (let i = 0; i < data.length; i++) out[i] = data[i] ^ ks[i];
  return new TextDecoder().decode(out);
}

/* ---------------------- privileged-flag integrity (HMAC) ------------------- */

const PRIV_SECRET_STORE = "shwe_priv_secret";

function privSecret(): string {
  if (typeof window === "undefined") return "shwe-meza-ssr-priv";
  let s = localStorage.getItem(PRIV_SECRET_STORE);
  if (!s) {
    s = randomSalt(32);
    localStorage.setItem(PRIV_SECRET_STORE, s);
  }
  return s;
}

export function signPrivileges(userId: string, isAdmin: boolean, verified: boolean): string {
  return hmacSha256(privSecret(), `${userId}|${isAdmin ? 1 : 0}|${verified ? 1 : 0}`);
}

export function verifyPrivileges(
  userId: string,
  isAdmin: boolean,
  verified: boolean,
  signature: string | undefined,
): boolean {
  if (!signature) return false;
  return signPrivileges(userId, isAdmin, verified) === signature;
}
