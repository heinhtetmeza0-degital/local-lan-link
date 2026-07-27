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
        "bg-gradient-to-br from-amber-300 via-amber-500 to-amber-700",
        className,
      )}
      style={{ width: size, height: size }}
      aria-label="Shwe Meza"
    >
      <svg
        viewBox="0 0 48 48"
        width={size}
        height={size}
        role="img"
        aria-hidden="true"
        className="block"
      >
        {/* Sun */}
        <circle cx="34" cy="14" r="3.2" fill="#fff8e1" opacity="0.9" />
        {/* Back mountain */}
        <path
          d="M2 38 L18 14 L28 30 L36 20 L46 38 Z"
          fill="#fffdf5"
          opacity="0.35"
        />
        {/* Front two mountains — the 'M' */}
        <path
          d="M2 40 L14 16 L24 32 L34 12 L46 40 Z"
          fill="#ffffff"
        />
        {/* River — the 'S' flowing between the peaks */}
        <path
          d="M8 40 C 16 34, 20 40, 24 36 S 34 32, 42 40"
          fill="none"
          stroke="#0ea5e9"
          strokeWidth="2.4"
          strokeLinecap="round"
        />
        <path
          d="M10 42 C 18 38, 22 44, 26 40 S 34 36, 42 42"
          fill="none"
          stroke="#38bdf8"
          strokeWidth="1.4"
          strokeLinecap="round"
          opacity="0.75"
        />
      </svg>
    </span>
  );
}
