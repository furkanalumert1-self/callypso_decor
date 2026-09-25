"use client";

import { useState } from "react";
import { Heart, ArrowLeftRight } from "lucide-react";
import { RoomScene, type RoomStyle } from "@/components/room-scene";
import { useLang } from "@/components/i18n/language-provider";
import { gallery, styles } from "@/lib/demo/data";
import { cn } from "@/lib/utils";

export default function GalleryPage() {
  const { lang, t } = useLang();
  const [filter, setFilter] = useState<RoomStyle | "all">("all");

  const m = {
    tr: { title: "Galeri", sub: "Topluluğun ve senin kaydettiğin görünümler. Bir karta dokun, öncesi/sonrası geç.",
      all: "Tümü", before: "Önce", after: "Sonra" },
    en: { title: "Gallery", sub: "Looks the community and you have saved. Tap a card to flip before/after.",
      all: "All", before: "Before", after: "After" },
  }[lang];

  const shown = filter === "all" ? gallery : gallery.filter((g) => g.style === filter);

  return (
    <div className="mx-auto max-w-7xl space-y-6">
      <div>
        <h1 className="font-display text-3xl font-semibold tracking-tight">{m.title}</h1>
        <p className="mt-1 max-w-xl text-sm text-muted-foreground">{m.sub}</p>
      </div>

      {/* style filter */}
      <div className="flex flex-wrap gap-1.5">
        <button
          onClick={() => setFilter("all")}
          className={cn("rounded-full px-3.5 py-1.5 text-[13px] font-medium transition", filter === "all" ? "bg-foreground text-background" : "bg-muted text-muted-foreground hover:text-foreground")}
        >
          {m.all}
        </button>
        {styles.map((s) => (
          <button
            key={s.id}
            onClick={() => setFilter(s.id)}
            className={cn("rounded-full px-3.5 py-1.5 text-[13px] font-medium transition", filter === s.id ? "bg-foreground text-background" : "bg-muted text-muted-foreground hover:text-foreground")}
          >
            {t(s.name)}
          </button>
        ))}
      </div>

      {/* masonry-ish grid */}
      <div className="grid grid-cols-2 gap-4 sm:grid-cols-3 lg:grid-cols-4">
        {shown.map((g) => (
          <Tile key={g.id} item={g} before={m.before} after={m.after} roomLabel={t(g.room)} title={t(g.title)} />
        ))}
      </div>
    </div>
  );
}

function Tile({
  item, before, after, roomLabel, title,
}: { item: { style: RoomStyle; likes: number }; before: string; after: string; roomLabel: string; title: string }) {
  const [reveal, setReveal] = useState(true);
  return (
    <figure className="group overflow-hidden rounded-2xl border border-border bg-card shadow-soft transition-all hover:-translate-y-0.5 hover:shadow-pop">
      <div className="relative">
        <RoomScene style={item.style} furnished={reveal} className="aspect-[4/5] w-full" />
        <button
          onClick={() => setReveal((v) => !v)}
          className="absolute left-2.5 top-2.5 inline-flex items-center gap-1.5 rounded-full bg-white/92 px-2.5 py-1 text-[11px] font-semibold text-foreground shadow-sm ring-1 ring-black/5 backdrop-blur transition hover:scale-105"
        >
          <ArrowLeftRight className="h-3 w-3 text-primary" /> {reveal ? after : before}
        </button>
        <span className="absolute bottom-2.5 right-2.5 inline-flex items-center gap-1 rounded-full bg-black/45 px-2 py-0.5 text-[10px] font-medium text-white backdrop-blur">
          <Heart className="h-2.5 w-2.5 fill-current" />{item.likes}
        </span>
      </div>
      <figcaption className="flex items-center justify-between p-3">
        <p className="truncate text-sm font-medium">{title}</p>
        <span className="shrink-0 text-[11px] text-muted-foreground">{roomLabel}</span>
      </figcaption>
    </figure>
  );
}
