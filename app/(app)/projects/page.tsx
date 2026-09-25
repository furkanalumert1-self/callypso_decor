"use client";

import { useEffect, useState } from "react";
import { Plus, Search, FolderOpen, Download } from "lucide-react";
import { Button } from "@/components/ui/button";
import { toast } from "@/components/ui/toast";
import { NewRoomDialog } from "@/components/app/new-room-dialog";
import { ProjectCard, ProjectGridSkeleton } from "@/components/app/project-card";
import { useLang } from "@/components/i18n/language-provider";
import { statusLabel, type ProjectStatus } from "@/lib/demo/data";
import { useProjects } from "@/lib/data";
import { downloadCsv } from "@/lib/image";
import { cn } from "@/lib/utils";

const FILTERS: (ProjectStatus | "all")[] = ["all", "styling", "ready", "approved"];
type Sort = "recent" | "name" | "variants";

export default function ProjectsPage() {
  const { lang, t } = useLang();
  const { projects, loading } = useProjects();
  const [filter, setFilter] = useState<ProjectStatus | "all">("all");
  const [query, setQuery] = useState("");
  const [sort, setSort] = useState<Sort>("recent");
  const [creating, setCreating] = useState(false);

  const m = {
    tr: { title: "Projeler", sub: "Yüklediğin odalar ve onların yeni hâlleri. Bir karta dokunarak öncesi/sonrası geç.",
      newRoom: "Yeni oda", all: "Tümü", search: "Oda ya da yer ara…", sort: "Sırala", recent: "En yeni", name: "Ada göre", variants: "Varyant sayısı",
      export: "CSV", exported: "CSV indirildi", emptyTitle: "Henüz proje yok", emptyBody: "İlk odanın fotoğrafını yükle, yeni hâlini saniyeler içinde gör.",
      noMatch: "Eşleşen proje yok", noMatchBody: "Filtreyi ya da aramayı değiştir.", clear: "Filtreleri temizle",
      cols: ["Oda", "Yer", "Stil", "Durum", "Varyant", "Favori", "Güncellendi"] },
    en: { title: "Projects", sub: "The rooms you uploaded and their new looks. Tap a card to flip before/after.",
      newRoom: "New room", all: "All", search: "Search room or place…", sort: "Sort", recent: "Most recent", name: "Name", variants: "Variants",
      export: "CSV", exported: "CSV downloaded", emptyTitle: "No projects yet", emptyBody: "Upload a photo of your first room and see its new look in seconds.",
      noMatch: "No matching projects", noMatchBody: "Try another filter or search.", clear: "Clear filters",
      cols: ["Room", "Place", "Style", "Status", "Variants", "Saved", "Updated"] },
  }[lang];

  // Shared links (/projects#<id>) scroll to and highlight the card once loaded.
  useEffect(() => {
    if (loading) return;
    let timer: ReturnType<typeof setTimeout>;
    const focus = () => {
      const el = window.location.hash && document.getElementById(decodeURIComponent(window.location.hash.slice(1)));
      if (!el) return;
      el.scrollIntoView({ behavior: "smooth", block: "center" });
      el.classList.add("ring-2", "ring-primary");
      clearTimeout(timer);
      timer = setTimeout(() => el.classList.remove("ring-2", "ring-primary"), 2000);
    };
    focus();
    window.addEventListener("hashchange", focus);
    return () => { window.removeEventListener("hashchange", focus); clearTimeout(timer); };
  }, [loading]);

  const filterLabel = (f: ProjectStatus | "all") => (f === "all" ? m.all : t(statusLabel[f]));
  const q = query.trim().toLocaleLowerCase(lang);
  const shown = projects
    .filter((p) => filter === "all" || p.status === filter)
    .filter((p) => !q || [p.room.tr, p.room.en, p.place, p.styleName.tr, p.styleName.en].some((s) => s.toLocaleLowerCase(lang).includes(q)))
    .sort((a, b) =>
      sort === "name" ? t(a.room).localeCompare(t(b.room), lang) : sort === "variants" ? b.variants - a.variants : b.updated.localeCompare(a.updated),
    );

  function exportCsv() {
    downloadCsv(
      [m.cols, ...shown.map((p) => [t(p.room), p.place, t(p.styleName), t(statusLabel[p.status]), p.variants, p.saved, p.updated])],
      "callypso-decor-projects",
    );
    toast(m.exported);
  }

  return (
    <div className="mx-auto max-w-7xl space-y-6">
      {/* header */}
      <div className="flex flex-wrap items-end justify-between gap-4">
        <div>
          <h1 className="font-display text-3xl font-semibold tracking-tight">{m.title}</h1>
          <p className="mt-1 max-w-xl text-sm text-muted-foreground">{m.sub}</p>
        </div>
        <div className="flex gap-2">
          <Button variant="outline" className="gap-2" onClick={exportCsv} disabled={!shown.length}><Download className="h-4 w-4" /> {m.export}</Button>
          <Button className="gap-2" onClick={() => setCreating(true)}><Plus className="h-4 w-4" /> {m.newRoom}</Button>
        </div>
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
        <div className="flex w-full items-center gap-2 sm:ml-auto sm:w-auto">
          <select
            aria-label={m.sort}
            value={sort}
            onChange={(e) => setSort(e.target.value as Sort)}
            className="rounded-full border border-border bg-card px-3 py-2 text-sm outline-none focus:ring-2 focus:ring-ring/40"
          >
            <option value="recent">{m.recent}</option>
            <option value="name">{m.name}</option>
            <option value="variants">{m.variants}</option>
          </select>
          <div className="relative flex-1 sm:flex-none">
            <Search className="pointer-events-none absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-muted-foreground" />
            <input
              type="search"
              value={query}
              onChange={(e) => setQuery(e.target.value)}
              placeholder={m.search}
              className="w-full rounded-full border border-border bg-card py-2 pl-9 pr-4 text-sm outline-none transition focus:ring-2 focus:ring-ring/40 sm:w-64"
            />
          </div>
        </div>
      </div>

      {/* grid */}
      {loading ? (
        <div className="grid grid-cols-1 gap-4 sm:grid-cols-2 lg:grid-cols-3"><ProjectGridSkeleton count={6} /></div>
      ) : shown.length ? (
        <div className="grid grid-cols-1 gap-4 sm:grid-cols-2 lg:grid-cols-3">
          {shown.map((p) => <ProjectCard key={p.id} p={p} />)}
        </div>
      ) : (
        <div className="flex flex-col items-center gap-3 rounded-2xl border border-dashed border-border px-6 py-16 text-center">
          <span className="grid h-12 w-12 place-items-center rounded-full bg-muted text-muted-foreground"><FolderOpen className="h-5 w-5" /></span>
          <p className="font-display text-lg font-semibold">{projects.length ? m.noMatch : m.emptyTitle}</p>
          <p className="max-w-sm text-sm text-muted-foreground">{projects.length ? m.noMatchBody : m.emptyBody}</p>
          {projects.length ? (
            <Button variant="outline" onClick={() => { setFilter("all"); setQuery(""); }}>{m.clear}</Button>
          ) : (
            <Button className="gap-2" onClick={() => setCreating(true)}><Plus className="h-4 w-4" /> {m.newRoom}</Button>
          )}
        </div>
      )}

      <NewRoomDialog open={creating} onClose={() => setCreating(false)} />
    </div>
  );
}
