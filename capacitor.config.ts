import type { CapacitorConfig } from "@capacitor/cli";

const config: CapacitorConfig = {
  appId: "com.heinhtetsoe.shwemeza",
  appName: "Shwe Meza",
  // Produced by `npm run build:mobile` (scripts/build-mobile.mjs)
  webDir: "dist/mobile",
  android: {
    allowMixedContent: true,
  },
  ios: {
    contentInset: "always",
  },
  server: {
    // Allow plain-HTTP LAN hosts when the app talks to a local PocketBase server.
    androidScheme: "http",
    cleartext: true,
  },
};

export default config;
