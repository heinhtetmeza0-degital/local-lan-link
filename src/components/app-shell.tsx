import { Link, useRouterState } from "@tanstack/react-router";
import { Bell, Home, LogOut, MessageCircle, Search, User as UserIcon } from "lucide-react";
import type { ReactNode } from "react";
import { UserAvatar } from "./user-avatar";
import { signOut, unreadCount, type User } from "@/lib/api";
import { useApiSubscription } from "@/lib/use-api";
import { cn } from "@/lib/utils";
import { LangToggle, useT } from "@/lib/i18n";

export function AppShell({ me, children }: { me: User; children: ReactNode }) {
  useApiSubscription();
  const { t } = useT();
  const pathname = useRouterState({ select: (s) => s.location.pathname });
  const unread = unreadCount(me.id);

  const nav = [
    { to: "/", label: t("home"), icon: Home, match: (p: string) => p === "/" },
    { to: "/search", label: t("search"), icon: Search, match: (p: string) => p === "/search" },
    { to: "/messages", label: t("messages"), icon: MessageCircle, match: (p: string) => p.startsWith("/messages") || p.startsWith("/chat") },
    {
      to: "/notifications",
      label: t("alerts"),
      icon: Bell,
      match: (p: string) => p === "/notifications",
      badge: unread,
    },
    {
      to: `/profile/${me.username}` as const,
      label: t("profile"),
      icon: UserIcon,
      match: (p: string) => p.startsWith("/profile"),
    },
  ] as const;

  return (
    <div className="min-h-screen">
      <header className="sticky top-0 z-30 bg-background/85 backdrop-blur border-b border-border">
        <div className="max-w-2xl mx-auto grid grid-cols-[auto_1fr_auto] items-center gap-2 px-3 sm:px-4 h-14">
          <Link to="/" className="flex items-center gap-2 font-bold min-w-0">
            <span className="h-9 w-9 shrink-0 rounded-2xl bg-gradient-to-br from-amber-400 to-amber-600 text-white grid place-items-center shadow-pop">
              <span className="text-sm font-black">ရ</span>
            </span>
            <span className="hidden xs:inline sm:inline leading-tight">
              <span className="block text-sm font-black tracking-tight">Shwe Meza</span>
              <span className="block text-[10px] font-medium text-muted-foreground mm-font">ရွှေမဲဇာ</span>
            </span>
          </Link>

          <nav className="hidden md:flex items-center gap-1 justify-center">
            {nav.map((n) => {
              const active = n.match(pathname);
              return (
                <Link
                  key={n.to}
                  to={n.to}
                  className={cn(
                    "relative px-3 py-2 rounded-lg text-sm font-medium inline-flex items-center gap-2",
                    active ? "text-primary bg-accent" : "text-muted-foreground hover:bg-accent",
                  )}
                >
                  <n.icon className="h-4 w-4" />
                  {n.label}
                  {"badge" in n && n.badge ? (
                    <span className="ml-1 h-4 min-w-4 px-1 rounded-full bg-destructive text-destructive-foreground text-[10px] grid place-items-center">
                      {n.badge}
                    </span>
                  ) : null}
                </Link>
              );
            })}
          </nav>

          <div className="flex items-center gap-2 justify-self-end">
            <LangToggle />
            <button
              onClick={signOut}
              className="text-muted-foreground hover:text-foreground p-2 rounded-lg"
              aria-label={t("signOut")}
              title={t("signOut")}
            >
              <LogOut className="h-5 w-5" />
            </button>
            <Link to={`/profile/${me.username}`}>
              <UserAvatar user={me} size={32} />
            </Link>
          </div>
        </div>
      </header>

      <main className="max-w-2xl mx-auto px-3 sm:px-4 py-4 pb-24 md:pb-8">{children}</main>

      <nav className="md:hidden fixed bottom-0 inset-x-0 z-30 bg-background/95 backdrop-blur border-t border-border">
        <div className="max-w-2xl mx-auto grid grid-cols-5">
          {nav.map((n) => {
            const active = n.match(pathname);
            return (
              <Link
                key={n.to}
                to={n.to}
                className={cn(
                  "relative flex flex-col items-center justify-center gap-0.5 py-2.5 text-[10px] font-medium",
                  active ? "text-primary" : "text-muted-foreground",
                )}
              >
                <n.icon className={cn("h-5 w-5", active && "scale-110 transition-transform")} />
                {n.label}
                {"badge" in n && n.badge ? (
                  <span className="absolute top-1.5 right-[calc(50%-18px)] h-4 min-w-4 px-1 rounded-full bg-destructive text-destructive-foreground text-[10px] grid place-items-center">
                    {n.badge}
                  </span>
                ) : null}
              </Link>
            );
          })}
        </div>
      </nav>
    </div>
  );
}
