"use client";

import { useEffect, useRef, useState } from "react";
import { cn } from "@/lib/utils";

export interface MenuItem { label: string; onSelect: () => void; danger?: boolean; icon?: React.ReactNode }

/** Dropdown menu. Closes on Esc, outside click, or after an item is picked. */
export function Menu({
  trigger, items, label, className, triggerClassName, align = "right", up = false, children,
}: {
  /** Open above the trigger (e.g. inside an overflow-hidden card). */
  up?: boolean;
  trigger: React.ReactNode;
  triggerClassName?: string;
  items?: MenuItem[];
  label: string;
  className?: string;
  align?: "left" | "right";
  /** Custom panel content instead of `items`. */
  children?: React.ReactNode;
}) {
  const [open, setOpen] = useState(false);
  const root = useRef<HTMLDivElement>(null);

  useEffect(() => {
    if (!open) return;
    const onDown = (e: MouseEvent) => !root.current?.contains(e.target as Node) && setOpen(false);
    const onKey = (e: KeyboardEvent) => e.key === "Escape" && setOpen(false);
    document.addEventListener("mousedown", onDown);
    document.addEventListener("keydown", onKey);
    return () => {
      document.removeEventListener("mousedown", onDown);
      document.removeEventListener("keydown", onKey);
    };
  }, [open]);

  return (
    <div ref={root} className={cn("relative", className)}>
      <button type="button" aria-label={label} aria-haspopup="menu" aria-expanded={open} onClick={() => setOpen((v) => !v)} className={triggerClassName}>
        {trigger}
      </button>
      {open && (
        <div
          role="menu"
          className={cn(
            "absolute z-40 min-w-44 overflow-hidden rounded-xl border border-border bg-card py-1 text-sm shadow-pop",
            align === "right" ? "right-0" : "left-0",
            up ? "bottom-full mb-1.5" : "top-full mt-1.5",
          )}
        >
          {children ??
            items?.map((it) => (
              <button
                key={it.label}
                type="button"
                role="menuitem"
                onClick={() => { setOpen(false); it.onSelect(); }}
                className={cn("flex w-full items-center gap-2 px-3.5 py-2 text-left hover:bg-muted", it.danger && "text-destructive")}
              >
                {it.icon}
                {it.label}
              </button>
            ))}
        </div>
      )}
    </div>
  );
}
