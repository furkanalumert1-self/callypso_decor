"use client";

import { useState } from "react";
import { Plus, Layers, Heart, CircleCheckBig, Search } from "lucide-react";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { RoomScene } from "@/components/room-scene";
import { BeforeAfter } from "@/components/before-after";
import { useLang } from "@/components/i18n/language-provider";
import { projects, statusLabel, statusTone, type ProjectStatus } from "@/lib/demo/data";
import { cn } from "@/lib/utils";

const FILTERS: (ProjectStatus | "all")[] = ["all", "styling", "ready", "approved"];

export default function ProjectsPage() {
  const { lang, t } = useLang();
  const [filter, setFilter] = useState<ProjectStatus | "all">("all");

  const m = {
    tr: { title: "Projeler", sub: "Yüklediğin odalar ve onların yeni hâlleri. Bir karta dokunarak öncesi/sonrası geç.",
      newRoom: "Yeni oda", all: "Tümü", before: "Önce", after: "Sonra", variants: "varyant", saved: "favori", search: "Oda ya da yer ara…" },
    en: { title: "Projects", sub: "The rooms you uploaded and their new looks. Tap a card to flip before/after.",
      newRoom: "New room", all: "All", before: "Before", after: "After", variants: "variants", saved: "saved", search: "Search room or place…" },
  }[lang];

  const filterLabel = (f: ProjectStatus | "all") => (f === "all" ? m.all : t(statusLabel[f]));
  const shown = filter === "all" ? projects : projects.filter((p) => p.status === filter);

  return (
    <div className="mx-auto max-w-7xl space-y-6">
      {/* header */}
      <div className="flex flex-wrap items-end justify-between gap-4">
        <div>
          <h1 className="font-display text-3xl font-semibold tracking-tight">{m.title}</h1>
          <p className="mt-1 max-w-xl text-sm text-muted-foreground">{m.sub}</p>
        </div>
        <Button className="gap-2"><Plus className="h-4 w-4" /> {m.newRoom}</Button>
      </div>

      {/* controls */}
      <div className="flex flex-wrap items-center gap-3">
        <div className="flex flex-wrap gap-1.5">
          {FILTERS.map((f) => (
            <button
              key={f}
              onClick={() => setFilter(f)}
              className={cn(
                "rounded-full px-3.5 py-1.5 text-[13px] font-medium transition",
                filter === f ? "bg-foreground text-background" : "bg-muted text-muted-foreground hover:text-foreground",
              )}
            >
              {filterLabel(f)}
            </button>
          ))}
        </div>
        <div className="relative ml-auto hidden sm:block">
          <Search className="pointer-events-none absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-muted-foreground" />
          <input
            placeholder={m.search}
            className="w-64 rounded-full border border-border bg-card py-2 pl-9 pr-4 text-sm outline-none transition focus:ring-2 focus:ring-ring/40"
          />
        </div>
      </div>

      {/* grid */}
      <div className="grid grid-cols-1 gap-4 sm:grid-cols-2 lg:grid-cols-3">
        {shown.map((p) => (
          <article key={p.id} className="group overflow-hidden rounded-2xl border border-border bg-card shadow-soft transition-all hover:-translate-y-0.5 hover:shadow-pop">
            <div className="relative">
              {p.status === "uploaded" ? (
                <div className="relative">
                  <RoomScene style={p.style} furnished={false} className="aspect-[4/3] w-full" />
                  <span className="absolute left-2.5 top-2.5 rounded-full bg-black/45 px-2 py-0.5 text-[10px] font-medium text-white backdrop-blur">{m.before}</span>
                </div>
              ) : (
                <BeforeAfter style={p.style} labels={{ before: m.before, after: m.after }} />
              )}
              <Badge tone={statusTone[p.status]} className="absolute right-2.5 top-2.5 shadow-sm">{t(statusLabel[p.status])}</Badge>
            </div>
            <div className="p-4">
              <div className="flex items-center justify-between gap-2">
                <p className="truncate font-medium">{t(p.room)}</p>
                <span className="shrink-0 text-xs text-muted-foreground">{t(p.styleName)}</span>
              </div>
              <p className="text-xs text-muted-foreground">{p.place}</p>
              <div className="mt-3 flex items-center gap-3 border-t border-border pt-3 text-xs text-muted-foreground">
                <span className="inline-flex items-center gap-1"><Layers className="h-3.5 w-3.5" />{p.variants} {m.variants}</span>
                <span className="inline-flex items-center gap-1"><Heart className="h-3.5 w-3.5" />{p.saved} {m.saved}</span>
                {p.status === "approved" && <CircleCheckBig className="ml-auto h-3.5 w-3.5 text-success" />}
              </div>
            </div>
          </article>
        ))}
      </div>
    </div>
  );
}
