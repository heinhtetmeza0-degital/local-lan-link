import { cn } from "@/lib/utils";
// Bundled locally so the logo also renders offline / inside the native apps.
import logoUrl from "@/assets/shwe-meza-logo-512.png";


/**
 * Shwe Meza logo — golden 'M' mountains with a blue 'S' river flowing between them,
 * rendered from the official brand asset.
 */
export function ShweMezaLogo({ size = 36, className }: { size?: number; className?: string }) {
  return (
    <img
      src={logoAsset.url}
      alt="Shwe Meza"
      width={size}
      height={size}
      className={cn("shrink-0 rounded-2xl object-cover shadow-pop", className)}
      style={{ width: size, height: size }}
      loading="lazy"
      decoding="async"
    />
  );
}
