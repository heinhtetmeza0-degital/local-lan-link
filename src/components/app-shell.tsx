import { Link, useRouterState } from "@tanstack/react-router";
import { Bell, Home, LogOut, Search, User as UserIcon, Users } from "lucide-react";
import type { ReactNode } from "react";
import { UserAvatar } from "./user-avatar";
import { signOut, unreadCount, type User } from "@/lib/api";
import { useApiSubscription } from "@/lib/use-api";
import { cn } from "@/lib/utils";

export function AppShell({ me, children }: { me: User; children: ReactNode }) {
  useApiSubscription();
  const pathname = useRouterState({ select: (s) => s.location.pathname });
  const unread = unreadCount(me.id);

  const nav = [
    { to: "/", label: "Home", icon: Home, match: (p: string) => p === "/" },
    { to: "/search", label: "Search", icon: Search, match: (p: string) => p === "/search" },
    {
      to: "/notifications",
      label: "Alerts",
      icon: Bell,
      match: (p: string) => p === "/notifications",
      badge: unread,
    },
    {
      to: `/profile/${me.username}` as const,
      label: "Profile",
      icon: UserIcon,
      match: (p: string) => p.startsWith("/profile"),
    },
  ] as const;

  return (
    <div className="min-h-screen">
      <header className="sticky top-0 z-30 bg-background/80 backdrop-blur border-b border-border">
        <div className="max-w-2xl mx-auto flex items-center gap-3 px-4 h-14">
          <Link to="/" className="flex items-center gap-2 font-bold">
            <span className="h-8 w-8 rounded-xl bg-primary text-primary-foreground grid place-items-center">
              <Users className="h-4 w-4" />
            </span>
            <span className="hidden sm:inline">LANbook</span>
          </Link>
          <nav className="ml-auto hidden md:flex items-center gap-1">
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
          <button
            onClick={signOut}
            className="ml-auto md:ml-0 text-muted-foreground hover:text-foreground p-2 rounded-lg"
            aria-label="Sign out"
          >
            <LogOut className="h-5 w-5" />
          </button>
          <Link to={`/profile/${me.username}`}>
            <UserAvatar user={me} size={32} />
          </Link>
        </div>
      </header>

      <main className="max-w-2xl mx-auto px-3 sm:px-4 py-4 pb-24 md:pb-8">{children}</main>

      <nav className="md:hidden fixed bottom-0 inset-x-0 z-30 bg-background/95 backdrop-blur border-t border-border">
        <div className="max-w-2xl mx-auto grid grid-cols-4">
          {nav.map((n) => {
            const active = n.match(pathname);
            return (
              <Link
                key={n.to}
                to={n.to}
                className={cn(
                  "relative flex flex-col items-center justify-center gap-0.5 py-2.5 text-[11px] font-medium",
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
