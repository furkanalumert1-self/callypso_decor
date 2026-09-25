"use client";

import { ArrowRight } from "lucide-react";
import { Button } from "@/components/ui/button";
import { RoomScene } from "@/components/room-scene";
import { BeforeAfter } from "@/components/before-after";
import { useLang } from "@/components/i18n/language-provider";
import { styles } from "@/lib/demo/data";

export default function StylesPage() {
  const { lang, t } = useLang();
  const m = {
    tr: { title: "Stiller", sub: "Bir his seç — Oda aynı odayı o stilin paleti, dokusu ve mobilya diliyle yeniden döşer.",
      before: "Önce", after: "Sonra", motifs: "Dokular", apply: "Bu stilde dene" },
    en: { title: "Styles", sub: "Pick a feeling — Oda restyles the same room in that style's palette, texture and furniture language.",
      before: "Before", after: "After", motifs: "Materials", apply: "Try this style" },
  }[lang];

  return (
    <div className="mx-auto max-w-7xl space-y-6">
      <div>
        <h1 className="font-display text-3xl font-semibold tracking-tight">{m.title}</h1>
        <p className="mt-1 max-w-xl text-sm text-muted-foreground">{m.sub}</p>
      </div>

      <div className="grid grid-cols-1 gap-5 md:grid-cols-2 lg:grid-cols-3">
        {styles.map((s) => (
          <article key={s.id} className="group flex flex-col overflow-hidden rounded-3xl border border-border bg-card shadow-soft transition-all hover:-translate-y-0.5 hover:shadow-pop">
            <BeforeAfter style={s.id} labels={{ before: m.before, after: m.after }} />
            <div className="flex flex-1 flex-col p-5">
              <div className="flex items-center justify-between">
                <h2 className="font-display text-lg font-semibold tracking-tight">{t(s.name)}</h2>
                <div className="flex gap-1">
                  {s.palette.map((hex) => (
                    <span key={hex} className="h-4 w-4 rounded-full ring-1 ring-black/5" style={{ background: hex }} />
                  ))}
                </div>
              </div>
              <p className="mt-2 flex-1 text-sm leading-relaxed text-muted-foreground">{t(s.blurb)}</p>
              <div className="mt-4 border-t border-border pt-3">
                <p className="label-mono text-muted-foreground">{m.motifs}</p>
                <p className="mt-1.5 text-[13px] text-foreground/80">{t(s.motifs)}</p>
              </div>
              <Button variant="outline" className="mt-4 w-full gap-2">{m.apply} <ArrowRight className="h-4 w-4" /></Button>
            </div>
          </article>
        ))}
      </div>

      {/* empty-room → style gallery strip */}
      <div className="overflow-hidden rounded-3xl border border-border bg-muted/40 p-6">
        <p className="label-mono mb-4 text-muted-foreground">{lang === "tr" ? "Aynı oda, altı dünya" : "One room, six worlds"}</p>
        <div className="grid grid-cols-2 gap-3 sm:grid-cols-3 lg:grid-cols-6">
          {styles.map((s) => (
            <div key={s.id} className="overflow-hidden rounded-xl shadow-soft ring-1 ring-border">
              <RoomScene style={s.id} className="aspect-[4/3] w-full" />
              <p className="bg-card px-2 py-1.5 text-center text-[11px] font-medium">{t(s.name)}</p>
            </div>
          ))}
        </div>
      </div>
    </div>
  );
}
