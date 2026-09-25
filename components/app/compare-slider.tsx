"use client";

import { useState } from "react";
import { cn } from "@/lib/utils";

/** Drag-to-compare before/after for two pixel-aligned images. */
export function CompareSlider({
  before, after, labels, className,
}: { before: string; after: string; labels: { before: string; after: string }; className?: string }) {
  const [pos, setPos] = useState(50);
  return (
    <div className={cn("relative select-none overflow-hidden", className)}>
      {/* eslint-disable-next-line @next/next/no-img-element -- data URLs / AI result */}
      <img src={after} alt={labels.after} className="block w-full" draggable={false} />
      {/* eslint-disable-next-line @next/next/no-img-element -- data URL */}
      <img
        src={before}
        alt={labels.before}
        draggable={false}
        className="absolute inset-0 h-full w-full object-cover"
        style={{ clipPath: `inset(0 ${100 - pos}% 0 0)` }}
      />
      <div className="pointer-events-none absolute inset-y-0 w-0.5 bg-white shadow-[0_0_6px_rgba(0,0,0,0.4)]" style={{ left: `${pos}%` }}>
        <span className="absolute top-1/2 left-1/2 grid h-8 w-8 -translate-x-1/2 -translate-y-1/2 place-items-center rounded-full bg-white text-xs font-bold text-foreground shadow">⇆</span>
      </div>
      <span className="pointer-events-none absolute left-2.5 top-2.5 rounded-full bg-black/50 px-2 py-0.5 text-[11px] font-medium text-white">{labels.before}</span>
      <span className="pointer-events-none absolute right-2.5 top-2.5 rounded-full bg-primary px-2 py-0.5 text-[11px] font-medium text-primary-foreground">{labels.after}</span>
      <input
        type="range"
        min={0}
        max={100}
        value={pos}
        onChange={(e) => setPos(Number(e.target.value))}
        aria-label={`${labels.before} / ${labels.after}`}
        className="absolute inset-0 h-full w-full cursor-ew-resize opacity-0"
      />
    </div>
  );
}
