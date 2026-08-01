/**
 * Builds a static bundle for the native (Capacitor) shells.
 *
 * Shwe Meza is a client-only LAN app (all data lives in localStorage), so the
 * native app only needs the compiled client bundle plus a minimal HTML shell.
 *
 *   1. vite build            -> dist/client (assets) + dist/server (manifest)
 *   2. read the client entry from the build manifest
 *   3. write dist/mobile/    -> index.html + assets, ready for `npx cap sync`
 */
import { spawn } from "node:child_process";
import { cp, mkdir, writeFile, rm, readdir, readFile } from "node:fs/promises";
import path from "node:path";

const root = process.cwd();
const clientDir = path.join(root, "dist", "client");
const serverDir = path.join(root, "dist", "server");
const outDir = path.join(root, "dist", "mobile");

function run(cmd, args) {
  return new Promise((resolve, reject) => {
    const p = spawn(cmd, args, { stdio: "inherit", shell: process.platform === "win32" });
    p.on("exit", (code) => (code === 0 ? resolve() : reject(new Error(`${cmd} exited ${code}`))));
  });
}

console.log("→ building web app…");
await run("npx", ["vite", "build"]);

const serverFiles = await readdir(serverDir);
const manifestFile = serverFiles.find((f) => f.startsWith("_tanstack-start-manifest_"));
if (!manifestFile) throw new Error("Could not locate the TanStack Start manifest in dist/server");
const manifest = await readFile(path.join(serverDir, manifestFile), "utf8");

const entry = manifest.match(/src:\s*"(\/assets\/[^"]+\.js)"/)?.[1];
if (!entry) throw new Error("Could not determine the client entry script");

const assets = await readdir(path.join(clientDir, "assets"));
const cssFiles = assets.filter((f) => f.endsWith(".css")).map((f) => `/assets/${f}`);

const html = `<!DOCTYPE html>
<html lang="en">
  <head>
    <meta charset="UTF-8" />
    <meta name="viewport" content="width=device-width, initial-scale=1.0, viewport-fit=cover" />
    <title>Shwe Meza</title>
    <meta name="description" content="Shwe Meza — LAN social network and messenger." />
    <link rel="icon" href="/favicon.ico" />
    <link rel="preconnect" href="https://fonts.googleapis.com" />
    <link rel="preconnect" href="https://fonts.gstatic.com" crossorigin />
    <link
      href="https://fonts.googleapis.com/css2?family=Padauk:wght@400;700&family=Noto+Sans+Myanmar:wght@400;600;700&display=swap"
      rel="stylesheet"
    />
${cssFiles.map((href) => `    <link rel="stylesheet" href="${href}" />`).join("\n")}
  </head>
  <body>
    <script type="module" src="${entry}"></script>
  </body>
</html>
`;

await rm(outDir, { recursive: true, force: true });
await mkdir(outDir, { recursive: true });
await cp(clientDir, outDir, { recursive: true });
await writeFile(path.join(outDir, "index.html"), html, "utf8");
console.log("✔ static native bundle ready at dist/mobile");
