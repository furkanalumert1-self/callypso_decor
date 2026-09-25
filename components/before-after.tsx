"use client";

import { useState } from "react";
import { ArrowLeftRight } from "lucide-react";
import { RoomScene, type RoomStyle } from "@/components/room-scene";
import { cn } from "@/lib/utils";

/**
 * BeforeAfter — an interactive reveal between an empty room (before) and a
 * styled, furnished room (after). Toggling flips the scene; the toggle pill
 * shows the current state. Used in project cards, the dashboard hero and the
 * landing product-preview.
 */
export function BeforeAfter({
  style,
  className,
  aspect = "aspect-[4/3]",
  labels,
  defaultAfter = true,
  images,
}: {
  style: RoomStyle;
  className?: string;
  aspect?: string;
  labels: { before: string; after: string };
  defaultAfter?: boolean;
  /** Real photos (uploaded before / generated after) instead of the SVG scene. */
  images?: { before: string; after?: string };
}) {
  const [after, setAfter] = useState(defaultAfter);
  return (
    <div className={cn("relative overflow-hidden", className)}>
      {images ? (
        // eslint-disable-next-line @next/next/no-img-element -- data URLs / remote AI results
        <img
          src={after && images.after ? images.after : images.before}
          alt={after ? labels.after : labels.before}
          className={cn(aspect, "w-full object-cover")}
        />
      ) : (
        <RoomScene style={style} furnished={after} className={cn(aspect, "w-full transition-opacity duration-300")} />
      )}
      <button
        type="button"
        onClick={() => setAfter((v) => !v)}
        className="absolute left-2.5 top-2.5 inline-flex items-center gap-1.5 rounded-full bg-white/92 px-2.5 py-1 text-[11px] font-semibold text-foreground shadow-sm ring-1 ring-black/5 backdrop-blur transition hover:scale-105"
        aria-label={after ? labels.after : labels.before}
      >
        <ArrowLeftRight className="h-3 w-3 text-primary" />
        {after ? labels.after : labels.before}
      </button>
      {/* progress dots */}
      <div className="absolute bottom-2.5 left-1/2 flex -translate-x-1/2 gap-1.5">
        <span className={cn("h-1.5 w-1.5 rounded-full transition", !after ? "bg-white" : "bg-white/40")} />
        <span className={cn("h-1.5 w-1.5 rounded-full transition", after ? "bg-white" : "bg-white/40")} />
      </div>
    </div>
  );
}
