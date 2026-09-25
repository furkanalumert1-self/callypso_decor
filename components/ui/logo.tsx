import { cn } from "@/lib/utils";
import appConfig from "@/app.config";

/** Callypso Decor logomark — an armchair inside a framed room arch, in warm terracotta. */
export function LogoMark({ className }: { className?: string }) {
  return (
    <svg viewBox="0 0 40 40" className={className} role="img" aria-label={appConfig.name}>
      <defs>
        <linearGradient id="og" x1="0" y1="0" x2="1" y2="1">
          <stop offset="0" stopColor="#e2a06a" />
          <stop offset="0.5" stopColor="#c97a4a" />
          <stop offset="1" stopColor="#9c4f2c" />
        </linearGradient>
        <linearGradient id="osage" x1="0" y1="0" x2="0" y2="1">
          <stop offset="0" stopColor="#cfe3cc" />
          <stop offset="1" stopColor="#a9cda0" />
        </linearGradient>
      </defs>
      <rect width="40" height="40" rx="11" fill="url(#og)" />
      <rect width="40" height="40" rx="11" fill="#fff" opacity="0.06" />
      {/* room arch frame */}
      <path d="M11 29 V18 a9 9 0 0 1 18 0 V29" fill="none" stroke="#fff" strokeWidth="2.2" strokeLinecap="round" opacity="0.92" />
      {/* sage rug */}
      <ellipse cx="20" cy="30.4" rx="9.4" ry="1.7" fill="url(#osage)" opacity="0.85" />
      {/* armchair */}
      <path d="M14.5 29 V24.2 a2 2 0 0 1 2-2 h7 a2 2 0 0 1 2 2 V29" fill="#fff" opacity="0.95" />
      <rect x="13.4" y="24.6" width="2.6" height="4.4" rx="1.3" fill="#fff" opacity="0.95" />
      <rect x="24" y="24.6" width="2.6" height="4.4" rx="1.3" fill="#fff" opacity="0.95" />
      <rect x="16.2" y="25.4" width="7.6" height="2.8" rx="1.2" fill="url(#og)" opacity="0.55" />
    </svg>
  );
}

export function Logo({
  className,
  withWordmark = true,
  onDark = false,
}: {
  className?: string;
  withWordmark?: boolean;
  onDark?: boolean;
}) {
  return (
    <span className={cn("inline-flex min-w-0 items-center gap-2.5", className)}>
      <LogoMark className="h-8 w-8 shrink-0 drop-shadow-sm" />
      {withWordmark && (
        <span
          className={cn(
            "truncate font-display text-lg font-semibold tracking-tight",
            onDark ? "text-sidebar-foreground" : "text-foreground",
          )}
        >
          {appConfig.name}
        </span>
      )}
    </span>
  );
}
