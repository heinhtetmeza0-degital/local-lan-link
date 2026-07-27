import { cn } from "@/lib/utils";

export function GoldBadge({ size = 14, className }: { size?: number; className?: string }) {
  return (
    <svg
      viewBox="0 0 24 24"
      width={size}
      height={size}
      className={cn("inline-block align-middle", className)}
      aria-label="Verified"
    >
      <defs>
        <linearGradient id="goldGrad" x1="0" x2="1" y1="0" y2="1">
          <stop offset="0%" stopColor="#fde68a" />
          <stop offset="55%" stopColor="#f59e0b" />
          <stop offset="100%" stopColor="#b45309" />
        </linearGradient>
      </defs>
      <path
        fill="url(#goldGrad)"
        d="M12 1.6l2.2 2.4 3.2-.5.6 3.2 2.9 1.5-1.2 3 1.2 3-2.9 1.5-.6 3.2-3.2-.5L12 20.4l-2.2-2.4-3.2.5-.6-3.2L3.1 13.8l1.2-3-1.2-3 2.9-1.5.6-3.2 3.2.5z"
      />
      <path
        d="M8.5 12.2l2.4 2.4 4.6-4.8"
        fill="none"
        stroke="#fff"
        strokeWidth="2"
        strokeLinecap="round"
        strokeLinejoin="round"
      />
    </svg>
  );
}
