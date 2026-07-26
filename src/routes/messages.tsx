import { createFileRoute, Link, useNavigate } from "@tanstack/react-router";
import { useState } from "react";
import { Plus, Users as UsersIcon, X, Check } from "lucide-react";
import {
  createGroup,
  getConversations,
  getCurrentUserId,
  getUser,
  getUsers,
  lastMessage,
} from "@/lib/api";
import { useApiSubscription } from "@/lib/use-api";
import { UserAvatar } from "@/components/user-avatar";
import { timeAgo } from "@/lib/format";
import { useT } from "@/lib/i18n";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";

export const Route = createFileRoute("/messages")({
  head: () => ({
    meta: [
      { title: "Chats — Shwe Meza" },
      { name: "description", content: "Direct and group chats on your local network." },
      { property: "og:title", content: "Chats — Shwe Meza" },
      { property: "og:description", content: "Direct and group chats on your local network." },
    ],
  }),
  component: MessagesPage,
});

function MessagesPage() {
  useApiSubscription();
  const { t, lang } = useT();
  const navigate = useNavigate();
  const meId = getCurrentUserId();
  const [creating, setCreating] = useState(false);
  const [groupName, setGroupName] = useState("");
  const [selected, setSelected] = useState<Set<string>>(new Set());

  if (!meId) return null;
  const convs = getConversations(meId);
  const others = getUsers().filter((u) => u.id !== meId);

  function toggle(id: string) {
    setSelected((s) => {
      const n = new Set(s);
      if (n.has(id)) n.delete(id);
      else n.add(id);
      return n;
    });
  }
  function makeGroup() {
    if (selected.size === 0) return;
    const g = createGroup(groupName || "Group", Array.from(selected));
    setCreating(false);
    setSelected(new Set());
    setGroupName("");
    navigate({ to: "/chat/$id", params: { id: g.id } });
  }

  return (
    <div className="space-y-4">
      <div className="flex items-center gap-2">
        <h1 className="text-xl font-bold">{t("chats")}</h1>
        <button
          onClick={() => setCreating((v) => !v)}
          className="ml-auto inline-flex items-center gap-1.5 rounded-full bg-primary text-primary-foreground px-3 py-1.5 text-sm font-medium"
        >
          {creating ? <X className="h-4 w-4" /> : <Plus className="h-4 w-4" />}
          {t("newGroup")}
        </button>
      </div>

      {creating && (
        <div className="rounded-2xl bg-card shadow-card p-4 space-y-3">
          <Input
            value={groupName}
            onChange={(e) => setGroupName(e.target.value)}
            placeholder={t("groupName")}
          />
          <div className="text-xs font-semibold text-muted-foreground">
            {t("selectMembers")}
          </div>
          <div className="grid grid-cols-2 gap-2">
            {others.map((u) => {
              const on = selected.has(u.id);
              return (
                <button
                  key={u.id}
                  onClick={() => toggle(u.id)}
                  className={`flex items-center gap-2 rounded-xl border p-2 text-left ${on ? "border-primary bg-primary/5" : "border-border"}`}
                >
                  <UserAvatar user={u} size={32} />
                  <div className="min-w-0 flex-1">
                    <div className="text-sm font-semibold truncate">{u.displayName}</div>
                    <div className="text-xs text-muted-foreground truncate">@{u.username}</div>
                  </div>
                  {on && <Check className="h-4 w-4 text-primary" />}
                </button>
              );
            })}
          </div>
          <Button onClick={makeGroup} disabled={selected.size === 0} className="w-full rounded-full">
            {t("create")}
          </Button>
        </div>
      )}

      <div className="rounded-2xl bg-card shadow-card divide-y divide-border overflow-hidden">
        {convs.length === 0 && (
          <div className="p-8 text-center text-muted-foreground text-sm">{t("noChats")}</div>
        )}
        {convs.map((c) => {
          const last = lastMessage(c.id);
          const peerId = c.kind === "dm" ? c.memberIds.find((x) => x !== meId) : null;
          const peer = peerId ? getUser(peerId) : null;
          const title = c.kind === "group" ? c.name ?? "Group" : peer?.displayName ?? "Unknown";
          const previewText =
            last?.media
              ? last.media.kind === "image" ? t("sentAnImage")
              : last.media.kind === "video" ? t("sentAVideo")
              : last.media.kind === "audio" ? t("sentAVoice")
              : t("sentAFile")
              : last?.text ?? "…";
          return (
            <Link
              key={c.id}
              to="/chat/$id"
              params={{ id: c.id }}
              className="flex items-center gap-3 p-3 hover:bg-accent"
            >
              {c.kind === "group" ? (
                <div className="h-11 w-11 rounded-full bg-primary/15 text-primary grid place-items-center shrink-0">
                  <UsersIcon className="h-5 w-5" />
                </div>
              ) : (
                <UserAvatar user={peer} size={44} />
              )}
              <div className="min-w-0 flex-1">
                <div className="flex items-center gap-2">
                  <div className="font-semibold truncate">{title}</div>
                  {last && (
                    <div className="ml-auto text-[10px] text-muted-foreground shrink-0">
                      {timeAgo(last.createdAt, lang)}
                    </div>
                  )}
                </div>
                <div className="text-xs text-muted-foreground truncate">{previewText}</div>
              </div>
            </Link>
          );
        })}
      </div>
    </div>
  );
}
