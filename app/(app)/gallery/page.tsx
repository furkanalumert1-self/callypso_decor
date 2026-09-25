"use client";

import { useState } from "react";
import { Heart, ArrowLeftRight, ImageOff } from "lucide-react";
import { RoomScene, type RoomStyle } from "@/components/room-scene";
import { useLang } from "@/components/i18n/language-provider";
import { gallery, styles } from "@/lib/demo/data";
import { toggleLike, useLikes } from "@/lib/data";
import { toast } from "@/components/ui/toast";
import { cn } from "@/lib/utils";

export default function GalleryPage() {
  const { lang, t } = useLang();
  const [filter, setFilter] = useState<RoomStyle | "all">("all");
  const likes = useLikes();

  const m = {
    tr: { title: "Galeri", sub: "Topluluğun ve senin kaydettiğin görünümler. Bir karta dokun, öncesi/sonrası geç.",
      all: "Tümü", before: "Önce", after: "Sonra", like: "Beğen", liked: "Favorilere eklendi", unliked: "Favorilerden çıkarıldı",
      favs: "Favorilerim", empty: "Bu filtrede görünüm yok", emptyFav: "Henüz favori yok — bir kartın kalbine dokun." },
    en: { title: "Gallery", sub: "Looks the community and you have saved. Tap a card to flip before/after.",
      all: "All", before: "Before", after: "After", like: "Like", liked: "Added to favourites", unliked: "Removed from favourites",
      favs: "My favourites", empty: "No looks for this filter", emptyFav: "No favourites yet — tap the heart on a card." },
  }[lang];

  const [favsOnly, setFavsOnly] = useState(false);
  const shown = (filter === "all" ? gallery : gallery.filter((g) => g.style === filter)).filter((g) => !favsOnly || likes.includes(g.id));

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
        <button
          onClick={() => setFavsOnly((v) => !v)}
          aria-pressed={favsOnly}
          className={cn("inline-flex items-center gap-1.5 rounded-full px-3.5 py-1.5 text-[13px] font-medium transition sm:ml-auto", favsOnly ? "bg-primary text-primary-foreground" : "bg-muted text-muted-foreground hover:text-foreground")}
        >
          <Heart className={cn("h-3.5 w-3.5", favsOnly && "fill-current")} /> {m.favs} ({likes.length})
        </button>
      </div>

      {/* masonry-ish grid */}
      <div className="grid grid-cols-2 gap-4 sm:grid-cols-3 lg:grid-cols-4">
        {shown.map((g) => (
          <Tile
            key={g.id}
            item={g}
            before={m.before}
            after={m.after}
            roomLabel={t(g.room)}
            title={t(g.title)}
            liked={likes.includes(g.id)}
            likeLabel={m.like}
            onLike={() => toast(toggleLike(g.id) ? m.liked : m.unliked)}
          />
        ))}
      </div>
      {!shown.length && (
        <div className="flex flex-col items-center gap-2 rounded-2xl border border-dashed border-border px-6 py-14 text-center text-sm text-muted-foreground">
          <ImageOff className="h-5 w-5" />
          {favsOnly && !likes.length ? m.emptyFav : m.empty}
        </div>
      )}
    </div>
  );
}

function Tile({
  item, before, after, roomLabel, title, liked, likeLabel, onLike,
}: {
  item: { style: RoomStyle; likes: number }; before: string; after: string; roomLabel: string; title: string;
  liked: boolean; likeLabel: string; onLike: () => void;
}) {
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
        <button
          type="button"
          onClick={onLike}
          aria-pressed={liked}
          aria-label={likeLabel}
          className={cn("absolute bottom-2.5 right-2.5 inline-flex items-center gap-1 rounded-full px-2 py-0.5 text-[10px] font-medium text-white backdrop-blur transition hover:scale-105", liked ? "bg-primary" : "bg-black/45")}
        >
          <Heart className="h-2.5 w-2.5 fill-current" />{item.likes + (liked ? 1 : 0)}
        </button>
      </div>
      <figcaption className="flex items-center justify-between p-3">
        <p className="truncate text-sm font-medium">{title}</p>
        <span className="shrink-0 text-[11px] text-muted-foreground">{roomLabel}</span>
      </figcaption>
    </figure>
  );
}
