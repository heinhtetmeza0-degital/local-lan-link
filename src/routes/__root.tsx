import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
import {
  Outlet,
  createRootRouteWithContext,
  useRouter,
  HeadContent,
  Scripts,
  useHydrated,
} from "@tanstack/react-router";
import { useEffect, type ReactNode } from "react";

import appCss from "../styles.css?url";
import { reportLovableError } from "../lib/lovable-error-reporting";
import { AuthScreen } from "@/components/auth-screen";
import { AppShell } from "@/components/app-shell";
import { useCurrentUser } from "@/lib/use-api";
import { Toaster } from "@/components/ui/sonner";
import { LanguageProvider } from "@/lib/i18n";
import { registerServiceWorker } from "@/lib/register-sw";
import { startAutoSync } from "@/lib/pocketbase";

function NotFoundComponent() {
  return (
    <div className="flex min-h-screen items-center justify-center bg-background px-4">
      <div className="max-w-md text-center">
        <h1 className="text-7xl font-bold text-foreground">404</h1>
        <p className="mt-4 text-muted-foreground">Page not found.</p>
        <a href="/" className="mt-6 inline-block text-primary underline">Go home</a>
      </div>
    </div>
  );
}

function ErrorComponent({ error, reset }: { error: Error; reset: () => void }) {
  const router = useRouter();
  useEffect(() => {
    reportLovableError(error, { boundary: "tanstack_root_error_component" });
  }, [error]);
  return (
    <div className="flex min-h-screen items-center justify-center bg-background px-4">
      <div className="max-w-md text-center">
        <h1 className="text-xl font-semibold text-foreground">Something went wrong</h1>
        <p className="mt-2 text-sm text-muted-foreground">{error.message}</p>
        <button
          onClick={() => { router.invalidate(); reset(); }}
          className="mt-6 rounded-md bg-primary px-4 py-2 text-sm text-primary-foreground"
        >Try again</button>
      </div>
    </div>
  );
}

export const Route = createRootRouteWithContext<{ queryClient: QueryClient }>()({
  head: () => ({
    meta: [
      { charSet: "utf-8" },
      { name: "viewport", content: "width=device-width, initial-scale=1, viewport-fit=cover" },
      { title: "Shwe Meza — Social on your local network" },
      { name: "description", content: "Shwe Meza (ရွှေမဲဇာ) — a bilingual EN/MM social space with posts, chat, voice notes and calls on your LAN." },
      { name: "author", content: "Shwe Meza" },
      { property: "og:title", content: "Shwe Meza — Social on your local network" },
      { property: "og:description", content: "Shwe Meza (ရွှေမဲဇာ) — a bilingual EN/MM social space with posts, chat, voice notes and calls on your LAN." },
      { property: "og:type", content: "website" },
      { name: "twitter:card", content: "summary_large_image" },
      { name: "twitter:title", content: "Shwe Meza — Social on your local network" },
      { name: "twitter:description", content: "Shwe Meza (ရွှေမဲဇာ) — a bilingual EN/MM social space with posts, chat, voice notes and calls on your LAN." },
      { property: "og:image", content: "https://storage.googleapis.com/gpt-engineer-file-uploads/HMymPl364NeTKt5Vd7K9kSgSxEm1/social-images/social-1785581749908-social-image.webp" },
      { name: "twitter:image", content: "https://storage.googleapis.com/gpt-engineer-file-uploads/HMymPl364NeTKt5Vd7K9kSgSxEm1/social-images/social-1785581749908-social-image.webp" },
      { name: "theme-color", content: "#0b0f14" },
      { name: "mobile-web-app-capable", content: "yes" },
      { name: "apple-mobile-web-app-capable", content: "yes" },
      { name: "apple-mobile-web-app-status-bar-style", content: "black-translucent" },
      { name: "apple-mobile-web-app-title", content: "Shwe Meza" },
    ],
    links: [
      { rel: "stylesheet", href: appCss },
      { rel: "icon", href: "/favicon.png", type: "image/png" },
      { rel: "manifest", href: "/manifest.webmanifest" },
      { rel: "apple-touch-icon", href: "/apple-touch-icon.png" },
      { rel: "preconnect", href: "https://fonts.googleapis.com" },
      { rel: "preconnect", href: "https://fonts.gstatic.com", crossOrigin: "anonymous" },
      {
        rel: "stylesheet",
        href: "https://fonts.googleapis.com/css2?family=Padauk:wght@400;700&family=Noto+Sans+Myanmar:wght@400;500;700&family=Inter:wght@400;500;600;700;800;900&display=swap",
      },
    ],
  }),
  shellComponent: RootShell,
  component: RootComponent,
  notFoundComponent: NotFoundComponent,
  errorComponent: ErrorComponent,
});

function RootShell({ children }: { children: ReactNode }) {
  return (
    <html lang="en">
      <head><HeadContent /></head>
      <body>
        {children}
        <Scripts />
      </body>
    </html>
  );
}

function AuthGate() {
  const hydrated = useHydrated();
  const me = useCurrentUser();
  // The session lives in localStorage, which the server cannot read — wait for
  // hydration so the first client render matches the server HTML.
  if (!hydrated) return <div className="min-h-screen bg-background" aria-hidden />;
  if (!me) return <AuthScreen />;
  return (
    <AppShell me={me}>
      <Outlet />
    </AppShell>
  );
}

function RootComponent() {
  const { queryClient } = Route.useRouteContext();
  useEffect(() => {
    registerServiceWorker();
    startAutoSync();
  }, []);
  return (
    <LanguageProvider>
      <QueryClientProvider client={queryClient}>
        <AuthGate />
        <Toaster />
      </QueryClientProvider>
    </LanguageProvider>
  );
}
