import { cn } from "@/lib/utils";
import logoAsset from "@/assets/shwe-meza-logo.png.asset.json";

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
