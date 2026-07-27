import type { Ad } from "@/lib/api";
import { useT } from "@/lib/i18n";
import { Megaphone } from "lucide-react";

export function SponsoredCard({ ad }: { ad: Ad }) {
  const { t } = useT();
  const href = ad.link || "#";
  return (
    <article className="rounded-2xl bg-card text-card-foreground shadow-card overflow-hidden">
      <div className="flex items-center gap-2 px-4 py-3 text-xs font-semibold text-amber-700">
        <Megaphone className="h-3.5 w-3.5" />
        {t("sponsored")}
      </div>
      <a href={href} target="_blank" rel="noreferrer noopener" className="block">
        <img src={ad.image} alt={ad.title} className="w-full max-h-[420px] object-cover" />
        <div className="p-4">
          <div className="font-semibold">{ad.title}</div>
          {ad.link && (
            <div className="text-xs text-muted-foreground truncate mt-0.5">{ad.link}</div>
          )}
        </div>
      </a>
    </article>
  );
}
