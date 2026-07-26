import { createFileRoute, Link } from "@tanstack/react-router";
import { useState } from "react";
import { Search as SearchIcon } from "lucide-react";
import { getCurrentUserId, searchUsers, getUsers } from "@/lib/api";
import { UserAvatar } from "@/components/user-avatar";
import { Input } from "@/components/ui/input";
import { useT } from "@/lib/i18n";

export const Route = createFileRoute("/search")({
  head: () => ({
    meta: [
      { title: "Find people — Shwe Meza" },
      { name: "description", content: "Search for anyone on your LAN by name or username." },
      { property: "og:title", content: "Find people — Shwe Meza" },
      { property: "og:description", content: "Search for anyone on your LAN by name or username." },
    ],
  }),
  component: SearchPage,
});

function SearchPage() {
  const { t } = useT();
  const [q, setQ] = useState("");
  const me = getCurrentUserId();
  const results = q.trim() ? searchUsers(q) : getUsers();
  const list = results.filter((u) => u.id !== me);

  return (
    <div className="space-y-4">
      <div className="relative">
        <SearchIcon className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
        <Input
          value={q}
          onChange={(e) => setQ(e.target.value)}
          placeholder={t("searchPeople")}
          className="pl-9 h-11 rounded-full bg-card"
          autoFocus
        />
      </div>
      <h2 className="text-sm font-semibold text-muted-foreground px-1">
        {q.trim() ? `${t("results")} (${list.length})` : t("peopleOnNetwork")}
      </h2>
      <div className="rounded-2xl bg-card shadow-card divide-y divide-border overflow-hidden">
        {list.length === 0 && (
          <div className="p-6 text-center text-muted-foreground text-sm">{t("noneFound")}</div>
        )}
        {list.map((u) => (
          <Link
            key={u.id}
            to="/profile/$username"
            params={{ username: u.username }}
            className="flex items-center gap-3 p-3 hover:bg-accent"
          >
            <UserAvatar user={u} size={44} />
            <div className="min-w-0 flex-1">
              <div className="font-semibold truncate">{u.displayName}</div>
              <div className="text-xs text-muted-foreground truncate">@{u.username}</div>
            </div>
          </Link>
        ))}
      </div>
    </div>
  );
}
