import { Link, useRouterState } from "@tanstack/react-router";
import { Bell, Home, MessageCircle, Search, Settings as SettingsIcon, Shield, User as UserIcon } from "lucide-react";
import type { ReactNode } from "react";
import { UserAvatar } from "./user-avatar";
import { GoldBadge } from "./gold-badge";
import { ShweMezaLogo } from "./logo";
import { getAppSettings, isAdmin, unreadCount, type User } from "@/lib/api";
import { useApiSubscription } from "@/lib/use-api";
import { cn } from "@/lib/utils";
import { LangToggle, useT } from "@/lib/i18n";

export function AppShell({ me, children }: { me: User; children: ReactNode }) {
  useApiSubscription();
  const { t } = useT();
  const pathname = useRouterState({ select: (s) => s.location.pathname });
  const unread = unreadCount(me.id);
  const admin = isAdmin(me.id);
  const settings = getAppSettings();
  const locked = settings.maintenance && !admin;


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
      to: "/profile/$username",
      params: { username: me.username },
      label: t("profile"),
      icon: UserIcon,
      match: (p: string) => p.startsWith("/profile"),
    },
  ] as const;


  return (
    <div className="min-h-screen flex flex-col">
      <header className="sticky top-0 z-30 bg-background/85 backdrop-blur border-b border-border">
        <div className="max-w-2xl mx-auto grid grid-cols-[auto_1fr_auto] items-center gap-2 px-3 sm:px-4 h-14">
          <Link to="/" className="flex items-center gap-2 font-bold min-w-0">
            <ShweMezaLogo size={36} />
            <span className="leading-tight">
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
                  params={"params" in n ? n.params : undefined}

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

          <div className="flex items-center gap-1 justify-self-end">
            <LangToggle />
            {admin && (
              <Link
                to="/admin"
                className={cn(
                  "p-2 rounded-lg",
                  pathname.startsWith("/admin")
                    ? "text-primary bg-accent"
                    : "text-muted-foreground hover:text-foreground",
                )}
                title={t("admin")}
                aria-label={t("admin")}
              >
                <Shield className="h-5 w-5" />
              </Link>
            )}
            <Link
              to="/settings"
              className={cn(
                "p-2 rounded-lg",
                pathname.startsWith("/settings")
                  ? "text-primary bg-accent"
                  : "text-muted-foreground hover:text-foreground",
              )}
              title={t("settings")}
              aria-label={t("settings")}
            >
              <SettingsIcon className="h-5 w-5" />
            </Link>
            <Link to="/profile/$username" params={{ username: me.username }} className="relative">
              <UserAvatar user={me} size={32} />
              {me.verified && (
                <span className="absolute -bottom-0.5 -right-0.5 bg-card rounded-full p-[1px]">
                  <GoldBadge size={12} />
                </span>
              )}
            </Link>
          </div>
        </div>
      </header>

      <main className="max-w-2xl mx-auto w-full px-3 sm:px-4 py-4 pb-24 md:pb-8 flex-1">
        {locked ? (
          <div className="rounded-2xl bg-card shadow-card p-8 text-center space-y-2">
            <h2 className="font-bold text-lg">{settings.appName}</h2>
            <p className="text-sm text-muted-foreground whitespace-pre-wrap">{settings.maintenanceMessage}</p>
          </div>
        ) : (
          children
        )}
      </main>


      <footer className="hidden md:block max-w-2xl mx-auto w-full px-4 py-4 text-center text-xs text-muted-foreground">
        {t("credit")}
      </footer>

      <nav className="md:hidden fixed bottom-0 inset-x-0 z-30 bg-background/95 backdrop-blur border-t border-border">
        <div className="max-w-2xl mx-auto grid grid-cols-5">
          {nav.map((n) => {
            const active = n.match(pathname);
            return (
              <Link
                key={n.to}
                to={n.to}
                params={"params" in n ? n.params : undefined}

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
