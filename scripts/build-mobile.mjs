/**
 * Builds a static bundle for the native (Capacitor) shells.
 *
 * Shwe Meza is a client-only LAN app (all data lives in localStorage), so the
 * native app only needs a prerendered HTML shell plus the client assets.
 *
 *   1. vite build          -> dist/client (assets) + dist/server (SSR entry)
 *   2. prerender "/"       -> real app shell HTML with hashed asset URLs
 *   3. write dist/mobile/  -> index.html + assets, ready for `npx cap sync`
 */
import { spawn } from "node:child_process";
import { cp, mkdir, writeFile, rm } from "node:fs/promises";
import path from "node:path";
import { pathToFileURL } from "node:url";

const root = process.cwd();
const clientDir = path.join(root, "dist", "client");
const outDir = path.join(root, "dist", "mobile");

function run(cmd, args) {
  return new Promise((resolve, reject) => {
    const p = spawn(cmd, args, { stdio: "inherit", shell: process.platform === "win32" });
    p.on("exit", (code) => (code === 0 ? resolve() : reject(new Error(`${cmd} exited ${code}`))));
  });
}

console.log("→ building web app…");
await run("npx", ["vite", "build"]);

console.log("→ prerendering app shell…");
const entryUrl = pathToFileURL(path.join(root, "dist", "server", "index.mjs")).href;
const mod = await import(entryUrl);
const handler = mod.default ?? mod;
const response = await handler.fetch(new Request("http://localhost/"), {}, { waitUntil() {} });
if (!response.ok) throw new Error(`Prerender failed with status ${response.status}`);
let html = await response.text();

// The native shell is served from the app bundle, so drop server-only hints.
html = html.replace(/<link rel="modulepreload"[^>]*crossorigin[^>]*>/g, (m) => m);

await rm(outDir, { recursive: true, force: true });
await mkdir(outDir, { recursive: true });
await cp(clientDir, outDir, { recursive: true });
await writeFile(path.join(outDir, "index.html"), html, "utf8");
console.log("✔ static native bundle ready at dist/mobile");
