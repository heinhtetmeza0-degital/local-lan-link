import type { Lang } from "./i18n";

const units: Record<Lang, { s: string; m: string; h: string; d: string }> = {
  en: { s: "s", m: "m", h: "h", d: "d" },
  mm: { s: "စက္ကန့်", m: "မိနစ်", h: "နာရီ", d: "ရက်" },
};

export function timeAgo(ts: number, lang: Lang = "en"): string {
  const u = units[lang];
  const s = Math.max(1, Math.floor((Date.now() - ts) / 1000));
  if (s < 60) return `${s}${lang === "mm" ? " " : ""}${u.s}`;
  const m = Math.floor(s / 60);
  if (m < 60) return `${m}${lang === "mm" ? " " : ""}${u.m}`;
  const h = Math.floor(m / 60);
  if (h < 24) return `${h}${lang === "mm" ? " " : ""}${u.h}`;
  const d = Math.floor(h / 24);
  if (d < 7) return `${d}${lang === "mm" ? " " : ""}${u.d}`;
  return new Date(ts).toLocaleDateString(lang === "mm" ? "my" : "en");
}

export function initials(name: string): string {
  return name
    .split(/\s+/)
    .map((p) => p[0])
    .filter(Boolean)
    .slice(0, 2)
    .join("")
    .toUpperCase();
}
