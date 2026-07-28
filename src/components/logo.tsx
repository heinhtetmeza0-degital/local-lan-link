import { cn } from "@/lib/utils";

/**
 * Shwe Meza logo — two mountain peaks (M) with a river (S) flowing between them.
 * Rendered as a compact SVG mark; sized by the wrapper.
 */
export function ShweMezaLogo({ size = 36, className }: { size?: number; className?: string }) {
  return (
    <span
      className={cn(
        "shrink-0 grid place-items-center rounded-2xl shadow-pop overflow-hidden",
        "bg-gradient-to-br from-slate-900 via-slate-800 to-slate-950 ring-1 ring-amber-500/30",
        className,
      )}
      style={{ width: size, height: size }}
      aria-label="Shwe Meza"
    >
      <svg
        viewBox="0 0 48 48"
        width={Math.round(size * 0.82)}
        height={Math.round(size * 0.82)}
        role="img"
        aria-hidden="true"
        className="block"
      >
        <defs>
          <linearGradient id="smGold" x1="0" y1="0" x2="0" y2="1">
            <stop offset="0%" stopColor="#fde68a" />
            <stop offset="55%" stopColor="#f59e0b" />
            <stop offset="100%" stopColor="#b45309" />
          </linearGradient>
          <linearGradient id="smRiver" x1="0" y1="0" x2="1" y2="0">
            <stop offset="0%" stopColor="#38bdf8" />
            <stop offset="100%" stopColor="#0284c7" />
          </linearGradient>
        </defs>
        {/* Back mountain silhouette */}
        <path
          d="M2 40 L18 14 L28 30 L36 20 L46 40 Z"
          fill="url(#smGold)"
          opacity="0.45"
        />
        {/* Front two mountains — the 'M' */}
        <path
          d="M2 42 L14 14 L24 32 L34 10 L46 42 Z"
          fill="url(#smGold)"
        />
        {/* River — the 'S' flowing between the peaks */}
        <path
          d="M8 40 C 16 32, 20 42, 24 36 S 34 30, 42 40"
          fill="none"
          stroke="url(#smRiver)"
          strokeWidth="3"
          strokeLinecap="round"
        />
        <path
          d="M10 43 C 18 38, 22 45, 26 41 S 34 37, 42 43"
          fill="none"
          stroke="#7dd3fc"
          strokeWidth="1.4"
          strokeLinecap="round"
          opacity="0.85"
        />
      </svg>
    </span>
  );
}

