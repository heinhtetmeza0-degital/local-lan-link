import type { User } from "@/lib/api";
import { initials } from "@/lib/format";
import { cn } from "@/lib/utils";

export function UserAvatar({
  user,
  size = 40,
  className,
}: {
  user: Pick<User, "displayName" | "avatar"> | null | undefined;
  size?: number;
  className?: string;
}) {
  const name = user?.displayName ?? "?";
  return (
    <div
      className={cn(
        "shrink-0 grid place-items-center rounded-full overflow-hidden bg-accent text-accent-foreground font-semibold",
        className,
      )}
      style={{ width: size, height: size, fontSize: size * 0.4 }}
    >
      {user?.avatar ? (
        <img src={user.avatar} alt={name} className="w-full h-full object-cover" />
      ) : (
        <span>{initials(name)}</span>
      )}
    </div>
  );
}
