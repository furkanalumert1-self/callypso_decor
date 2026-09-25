"use client";

import Link from "next/link";
import { useState } from "react";
import {
  ArrowUpRight, Plus, Sparkles, Heart, ImagePlus, TrendingUp, ArrowLeftRight,
  Layers, CircleCheckBig, Ruler, Check, Loader2, ShoppingBag, Wallet,
  Bookmark, PieChart,
} from "lucide-react";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { KpiCard } from "@/components/app/kpi-card";
import { Icon } from "@/components/ui/icon";
import { RoomScene, type RoomStyle } from "@/components/room-scene";
import { BeforeAfter } from "@/components/before-after";
import { useLang } from "@/components/i18n/language-provider";
import {
  activity, costMeta, costRows, gallery, kpis, looks14d, moodboards, projects,
  reno, renderJobs, renoMeta, shopProducts, shopTotal, statusLabel, statusTone,
  studio, styleUsage, styles,
} from "@/lib/demo/data";
import { formatRelative } from "@/lib/utils";

/* Looks-generated sparkline (last 14 days). */
function Sparkline({ data }: { data: number[] }) {
  const w = 280, h = 60, max = Math.max(...data), min = Math.min(...data);
  const pts = data.map((v, i) => [(i / (data.length - 1)) * w, h - ((v - min) / (max - min || 1)) * (h - 8) - 4]);
  const line = pts.map((p, i) => `${i ? "L" : "M"}${p[0].toFixed(1)} ${p[1].toFixed(1)}`).join(" ");
  const area = `${line} L${w} ${h} L0 ${h} Z`;
  return (
    <svg viewBox={`0 0 ${w} ${h}`} className="h-[60px] w-full" preserveAspectRatio="none">
      <defs>
        <linearGradient id="odaspark" x1="0" y1="0" x2="0" y2="1">
          <stop offset="0" stopColor="var(--color-primary)" stopOpacity="0.3" />
          <stop offset="1" stopColor="var(--color-primary)" stopOpacity="0" />
        </linearGradient>
      </defs>
      <path d={area} fill="url(#odaspark)" />
      <path d={line} fill="none" stroke="var(--color-primary)" strokeWidth="2.5" strokeLinecap="round" />
      <circle cx={pts[pts.length - 1][0]} cy={pts[pts.length - 1][1]} r="3.5" fill="var(--color-primary)" />
    </svg>
  );
}

export default function OdaDashboard() {
  const { lang, t } = useLang();
  const featured = projects.find((p) => p.status === "approved") ?? projects[0];
  const totalLooks = looks14d.reduce((a, b) => a + b, 0);
  const [activeReno, setActiveReno] = useState<RoomStyle>(reno[0].style);

  const m = {
    tr: {
      eyebrow: "Genel · Bugün", body: "Evinin yeni hâli hazırlanıyor. Yeni bir oda fotoğrafı yükle; Callypso Decor onu seçtiğin stilde yeniden döşesin.",
      newRoom: "Yeni oda", queue: "tasarım kuyrukta", featured: "Öne çıkan dönüşüm", reveal: "Öncesi / sonrası",
      before: "Önce", after: "Sonra",
      roomsM: "oda bu ay", looksM: "görünüm", saved: "kaydedildi",
      projects: "Projelerin", all: "Tümü",
      explore: "Stilleri keşfet", exploreAll: "Tüm stiller",
      perf: "Üretilen görünümler", last14: "son 14 gün", gallery: "Son galeri", activity: "Son hareketler",
      variants: "varyant", savedShort: "favori", motifs: "Dokular", applied: "Uygulandı",
      baGallery: "Öncesi / sonrası galerisi", baSub: "Son dönüştürdüğün odalar",
      jobs: "Üretim kuyruğu", jobsSub: "şu an işleniyor", jobRendering: "İşleniyor", jobQueued: "Sırada", jobDone: "Hazır",
      usage: "Stil kullanımı", usageSub: "bu ay", usageTop: "en çok",
      shop: "Görünümü satın al", shopSub: "Cihangir · İskandinav salon", shopTotalLbl: "Tahmini sepet", shopView: "Listeyi gör",
      moods: "Kaydedilen panolar", moodsAll: "Tümü", moodSaved: "kayıt",
    },
    en: {
      eyebrow: "Overview · Today", body: "Your home's new look is on its way. Upload a new room photo and let Callypso Decor restyle it in the style you pick.",
      newRoom: "New room", queue: "designs in the queue", featured: "Featured transformation", reveal: "Before / after",
      before: "Before", after: "After",
      roomsM: "rooms this month", looksM: "looks", saved: "saved",
      projects: "Your projects", all: "All",
      explore: "Explore styles", exploreAll: "All styles",
      perf: "Looks generated", last14: "last 14 days", gallery: "Latest gallery", activity: "Recent activity",
      variants: "variants", savedShort: "saved", motifs: "Materials", applied: "Applied",
      baGallery: "Before / after gallery", baSub: "Rooms you restyled recently",
      jobs: "Render queue", jobsSub: "processing now", jobRendering: "Rendering", jobQueued: "Queued", jobDone: "Ready",
      usage: "Style usage", usageSub: "this month", usageTop: "top",
      shop: "Shop the look", shopSub: "Cihangir · Scandinavian living room", shopTotalLbl: "Estimated basket", shopView: "View list",
      moods: "Saved moodboards", moodsAll: "All", moodSaved: "saved",
    },
  }[lang];

  const heroStats = [
    { icon: ImagePlus, value: studio.roomsThisMonth, label: m.roomsM },
    { icon: Layers, value: studio.looksGenerated, label: m.looksM },
    { icon: Heart, value: studio.savedDelta, label: m.saved, good: true },
  ];

  return (
    <div className="mx-auto max-w-7xl space-y-8">
      {/* ── Hero ─────────────────────────────────────────────────────── */}
      <section className="relative overflow-hidden rounded-3xl ring-1 ring-border shadow-soft" style={{ background: "var(--grad-hero)" }}>
        <span className="blob -left-12 -top-20 h-64 w-64 bg-primary/25 drift" aria-hidden />
        <span className="blob right-1/3 top-10 h-40 w-40" aria-hidden style={{ background: "color-mix(in oklch, var(--color-serif) 32%, transparent)" }} />
        <div className="relative grid gap-7 p-7 lg:grid-cols-[1.05fr_1fr] lg:p-9">
          <div className="flex flex-col">
            <p className="label-mono flex items-center gap-2 text-muted-foreground">
              <span className="h-1.5 w-1.5 rounded-full bg-primary pulse-dot" /> {m.eyebrow}
            </p>
            <h1 className="mt-3 font-display text-[34px] font-semibold leading-[1.05] tracking-tight lg:text-[44px]">
              {t(studio.greeting)} <span className="display-accent font-normal">{studio.inQueue} {m.queue}.</span>
            </h1>
            <p className="mt-3 max-w-md text-sm leading-relaxed text-muted-foreground">{m.body}</p>
            <div className="mt-5">
              <Link href="/projects"><Button size="lg" className="gap-2"><Plus className="h-4 w-4" /> {m.newRoom}</Button></Link>
            </div>
            <div className="mt-auto grid grid-cols-3 gap-3 pt-7">
              {heroStats.map((s) => (
                <div key={s.label} className="rounded-xl bg-card/70 p-3 ring-1 ring-border backdrop-blur">
                  <s.icon className="h-4 w-4 text-primary" />
                  <p className={`mt-2 font-display text-xl font-semibold tabular-nums ${s.good ? "text-success" : ""}`}>{s.value}</p>
                  <p className="text-[11px] leading-tight text-muted-foreground">{s.label}</p>
                </div>
              ))}
            </div>
          </div>

          {/* Featured before/after reveal */}
          <div>
            <div className="overflow-hidden rounded-2xl bg-card shadow-pop ring-1 ring-border">
              <div className="relative">
                <BeforeAfter style={featured.style} aspect="aspect-[16/10]" labels={{ before: m.before, after: m.after }} />
                <span className="absolute right-3 top-3 inline-flex items-center gap-1 rounded-full bg-black/45 px-2.5 py-1 text-[11px] font-medium text-white backdrop-blur">
                  <Sparkles className="h-3 w-3" /> {m.featured}
                </span>
              </div>
              <div className="flex items-center justify-between p-4">
                <div className="min-w-0">
                  <p className="truncate font-medium">{t(featured.room)}</p>
                  <p className="text-xs text-muted-foreground">{featured.place}</p>
                </div>
                <Badge tone="primary">{t(featured.styleName)}</Badge>
              </div>
            </div>
            <p className="mt-2 text-center label-mono text-muted-foreground">
              <ArrowLeftRight className="mr-1 inline h-3 w-3" /> {m.reveal}
            </p>
          </div>
        </div>
      </section>

      {/* ── KPIs ─────────────────────────────────────────────────────── */}
      <section className="grid grid-cols-2 gap-4 lg:grid-cols-4">
        {kpis.map((k) => (
          <KpiCard key={k.icon} label={t(k.label)} value={k.value} delta={k.delta} hint={t(k.hint)} icon={k.icon} tone={k.tone} />
        ))}
      </section>

      {/* ── Render queue + style usage ───────────────────────────────── */}
      <section className="grid grid-cols-1 gap-5 lg:grid-cols-[1.5fr_1fr]">
        <div className="rounded-2xl border border-border bg-card p-6 shadow-soft">
          <div className="mb-4 flex items-center gap-2">
            <span className="grid h-8 w-8 place-items-center rounded-lg bg-primary/10 text-primary"><Layers className="h-4 w-4" /></span>
            <div className="flex-1">
              <h2 className="font-display text-lg font-semibold tracking-tight">{m.jobs}</h2>
              <p className="text-xs text-muted-foreground">{renderJobs.filter((j) => j.state === "rendering").length} {m.jobsSub}</p>
            </div>
            <span className="grid h-7 w-7 animate-spin place-items-center text-primary" style={{ animationDuration: "2.4s" }}><Loader2 className="h-4 w-4" /></span>
          </div>
          <ul className="space-y-3">
            {renderJobs.map((j) => {
              const label = j.state === "done" ? m.jobDone : j.state === "queued" ? m.jobQueued : m.jobRendering;
              const tone = j.state === "done" ? "success" : j.state === "queued" ? "neutral" : "warning";
              return (
                <li key={j.id} className="flex items-center gap-3 rounded-xl border border-border bg-muted/30 p-3">
                  <span className="h-12 w-16 shrink-0 overflow-hidden rounded-lg ring-1 ring-border"><RoomScene style={j.style} furnished={j.state !== "queued"} className="h-full w-full" /></span>
                  <div className="min-w-0 flex-1">
                    <div className="flex items-center justify-between gap-2">
                      <p className="truncate text-sm font-medium">{t(j.room)}</p>
                      <Badge tone={tone as "success" | "neutral" | "warning"}>{label}</Badge>
                    </div>
                    <p className="text-[11px] text-muted-foreground">{t(j.styleName)} · {t(j.eta)}</p>
                    <div className="mt-1.5 h-1.5 overflow-hidden rounded-full bg-muted">
                      <div className="h-full rounded-full bg-primary transition-all" style={{ width: `${j.progress}%` }} />
                    </div>
                  </div>
                </li>
              );
            })}
          </ul>
        </div>

        <div className="rounded-2xl border border-border bg-card p-6 shadow-soft">
          <div className="mb-4 flex items-center gap-2">
            <span className="grid h-8 w-8 place-items-center rounded-lg bg-primary/10 text-primary"><PieChart className="h-4 w-4" /></span>
            <div className="flex-1">
              <h2 className="font-display text-lg font-semibold tracking-tight">{m.usage}</h2>
              <p className="text-xs text-muted-foreground">{m.usageSub}</p>
            </div>
          </div>
          {/* stacked bar */}
          <div className="flex h-3 overflow-hidden rounded-full">
            {styleUsage.map((s) => (
              <span key={s.style} style={{ width: `${s.pct}%`, background: s.swatch }} />
            ))}
          </div>
          <ul className="mt-4 space-y-2.5">
            {styleUsage.map((s, i) => (
              <li key={s.style} className="flex items-center gap-3 text-sm">
                <span className="h-3 w-3 shrink-0 rounded-full ring-1 ring-black/5" style={{ background: s.swatch }} />
                <span className="flex-1 truncate">{t(s.name)}</span>
                {i === 0 && <span className="rounded-full bg-primary/10 px-1.5 py-0.5 text-[10px] font-semibold text-primary">{m.usageTop}</span>}
                <span className="font-display font-semibold tabular-nums text-muted-foreground">{s.pct}%</span>
              </li>
            ))}
          </ul>
        </div>
      </section>

      {/* ── Projects (signature before/after cards) ──────────────────── */}
      <section>
        <div className="mb-3 flex items-end justify-between">
          <h2 className="font-display text-xl font-semibold tracking-tight">{m.projects}</h2>
          <Link href="/projects" className="inline-flex items-center gap-1 text-sm font-medium text-muted-foreground hover:text-foreground">{m.all} <ArrowUpRight className="h-3.5 w-3.5" /></Link>
        </div>
        <div className="grid grid-cols-1 gap-4 sm:grid-cols-2 lg:grid-cols-3">
          {projects.map((p) => (
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
                  <span className="inline-flex items-center gap-1"><Heart className="h-3.5 w-3.5" />{p.saved} {m.savedShort}</span>
                  {p.status === "approved" && <CircleCheckBig className="ml-auto h-3.5 w-3.5 text-success" />}
                </div>
              </div>
            </article>
          ))}
        </div>
      </section>

      {/* ── Renovation explorer + performance ────────────────────────── */}
      <section className="grid grid-cols-1 gap-5 lg:grid-cols-[1.6fr_1fr]">
        <div className="rounded-2xl border border-border bg-card p-6 shadow-soft">
          <div className="mb-4 flex items-center gap-2">
            <span className="grid h-8 w-8 place-items-center rounded-lg bg-primary/10 text-primary"><Ruler className="h-4 w-4" /></span>
            <div>
              <h2 className="font-display text-lg font-semibold tracking-tight">{t(renoMeta.title)}</h2>
              <p className="text-xs text-muted-foreground">{t(renoMeta.sub)}</p>
            </div>
          </div>
          <div className="grid gap-4 sm:grid-cols-[1.4fr_1fr]">
            <div className="overflow-hidden rounded-xl border border-border">
              <RoomScene style={activeReno} className="aspect-[16/10] w-full" />
            </div>
            <ul className="space-y-2">
              {reno.map((v) => {
                const on = v.style === activeReno;
                return (
                  <li key={v.id}>
                    <button
                      onClick={() => setActiveReno(v.style)}
                      className={`flex w-full items-center gap-3 rounded-xl border px-3 py-2.5 text-left transition ${on ? "border-primary/40 bg-primary/5" : "border-border hover:bg-muted"}`}
                    >
                      <span className="h-7 w-7 shrink-0 rounded-md ring-1 ring-black/5" style={{ background: v.swatch }} />
                      <span className="min-w-0 flex-1">
                        <span className="block truncate text-sm font-medium">{t(v.label)}</span>
                        <span className="block text-[11px] text-muted-foreground">{t(v.note)}</span>
                      </span>
                      {on && <Check className="h-4 w-4 shrink-0 text-primary" />}
                    </button>
                  </li>
                );
              })}
            </ul>
          </div>
        </div>

        <div className="rounded-2xl border border-border bg-card p-6 shadow-soft">
          <div className="flex items-start justify-between">
            <div>
              <h2 className="font-display text-lg font-semibold tracking-tight">{m.perf}</h2>
              <p className="text-sm text-muted-foreground">{m.last14}</p>
            </div>
            <div className="text-right">
              <p className="font-display text-2xl font-semibold tabular-nums">{totalLooks}</p>
              <p className="inline-flex items-center gap-0.5 text-xs font-semibold text-success"><TrendingUp className="h-3 w-3" />+31%</p>
            </div>
          </div>
          <div className="mt-4"><Sparkline data={looks14d} /></div>
        </div>
      </section>

      {/* ── Style explorer ───────────────────────────────────────────── */}
      <section>
        <div className="mb-3 flex items-end justify-between">
          <h2 className="font-display text-xl font-semibold tracking-tight">{m.explore}</h2>
          <Link href="/styles" className="inline-flex items-center gap-1 text-sm font-medium text-muted-foreground hover:text-foreground">{m.exploreAll} <ArrowUpRight className="h-3.5 w-3.5" /></Link>
        </div>
        <div className="grid grid-cols-1 gap-4 sm:grid-cols-2 lg:grid-cols-3">
          {styles.map((s) => (
            <div key={s.id} className="overflow-hidden rounded-2xl border border-border bg-card shadow-soft transition hover:-translate-y-0.5 hover:shadow-pop">
              <RoomScene style={s.id} className="aspect-[16/10] w-full" />
              <div className="p-4">
                <div className="flex items-center justify-between">
                  <p className="font-semibold tracking-tight">{t(s.name)}</p>
                  <div className="flex gap-1">
                    {s.palette.map((hex) => (
                      <span key={hex} className="h-3.5 w-3.5 rounded-full ring-1 ring-black/5" style={{ background: hex }} />
                    ))}
                  </div>
                </div>
                <p className="mt-1.5 text-xs leading-relaxed text-muted-foreground">{t(s.motifs)}</p>
              </div>
            </div>
          ))}
        </div>
      </section>

      {/* ── Before / after project gallery (RoomScene pairs) ─────────── */}
      <section>
        <div className="mb-3">
          <h2 className="font-display text-xl font-semibold tracking-tight">{m.baGallery}</h2>
          <p className="text-sm text-muted-foreground">{m.baSub}</p>
        </div>
        <div className="grid grid-cols-1 gap-4 sm:grid-cols-2 lg:grid-cols-3">
          {projects.filter((p) => p.status !== "uploaded").slice(0, 3).map((p) => (
            <article key={`ba-${p.id}`} className="overflow-hidden rounded-2xl border border-border bg-card shadow-soft">
              <div className="grid grid-cols-2">
                <div className="relative border-r border-border">
                  <RoomScene style={p.style} furnished={false} className="aspect-[4/3] w-full" />
                  <span className="absolute left-2 top-2 rounded-full bg-black/45 px-2 py-0.5 text-[10px] font-medium text-white backdrop-blur">{m.before}</span>
                </div>
                <div className="relative">
                  <RoomScene style={p.style} className="aspect-[4/3] w-full" />
                  <span className="absolute right-2 top-2 rounded-full bg-primary px-2 py-0.5 text-[10px] font-medium text-primary-foreground">{m.after}</span>
                </div>
              </div>
              <div className="flex items-center justify-between p-3.5">
                <div className="min-w-0">
                  <p className="truncate text-sm font-medium">{t(p.room)}</p>
                  <p className="text-[11px] text-muted-foreground">{p.place}</p>
                </div>
                <Badge tone="primary">{t(p.styleName)}</Badge>
              </div>
            </article>
          ))}
        </div>
      </section>

      {/* ── Shop the look + room cost estimate ───────────────────────── */}
      <section className="grid grid-cols-1 gap-5 lg:grid-cols-2">
        <div className="rounded-2xl border border-border bg-card p-6 shadow-soft">
          <div className="mb-4 flex items-center gap-2">
            <span className="grid h-8 w-8 place-items-center rounded-lg bg-primary/10 text-primary"><ShoppingBag className="h-4 w-4" /></span>
            <div className="flex-1">
              <h2 className="font-display text-lg font-semibold tracking-tight">{m.shop}</h2>
              <p className="text-xs text-muted-foreground">{m.shopSub}</p>
            </div>
          </div>
          <ul className="space-y-2.5">
            {shopProducts.map((s) => (
              <li key={s.id} className="flex items-center gap-3 rounded-xl bg-muted/40 p-3 ring-1 ring-border/60">
                <span className="grid h-10 w-10 shrink-0 place-items-center rounded-lg bg-card text-foreground/70 ring-1 ring-border"><Icon name={s.icon} className="h-[18px] w-[18px]" /></span>
                <div className="min-w-0 flex-1">
                  <p className="truncate text-sm font-medium">{t(s.name)}</p>
                  <p className="text-[11px] text-muted-foreground">{t(s.meta)}</p>
                </div>
                <span className="font-display text-sm font-semibold tabular-nums">{s.price}</span>
              </li>
            ))}
          </ul>
          <div className="mt-4 flex items-center justify-between border-t border-border pt-4">
            <p className="text-sm font-medium">{m.shopTotalLbl}</p>
            <span className="font-display text-xl font-semibold tabular-nums text-primary">{shopTotal}</span>
          </div>
        </div>

        <div className="rounded-2xl border border-border bg-card p-6 shadow-soft">
          <div className="mb-4 flex items-center gap-2">
            <span className="grid h-8 w-8 place-items-center rounded-lg bg-primary/10 text-primary"><Wallet className="h-4 w-4" /></span>
            <div className="flex-1">
              <h2 className="font-display text-lg font-semibold tracking-tight">{t(costMeta.title)}</h2>
              <p className="text-xs text-muted-foreground">{t(costMeta.sub)}</p>
            </div>
          </div>
          <div className="rounded-xl bg-gradient-to-br from-primary/10 to-transparent p-4 ring-1 ring-border">
            <p className="label-mono text-muted-foreground">{t(costMeta.totalLabel)}</p>
            <p className="font-display text-3xl font-semibold tabular-nums text-primary">{costMeta.total}</p>
          </div>
          <ul className="mt-4 space-y-3">
            {costRows.map((r) => (
              <li key={r.id}>
                <div className="flex items-center justify-between text-sm">
                  <span className="text-muted-foreground">{t(r.label)}</span>
                  <span className="font-medium tabular-nums">{r.value}</span>
                </div>
                <div className="mt-1.5 h-1.5 overflow-hidden rounded-full bg-muted">
                  <div className="h-full rounded-full bg-primary/70" style={{ width: `${r.pct}%` }} />
                </div>
              </li>
            ))}
          </ul>
        </div>
      </section>

      {/* ── Saved moodboards strip ───────────────────────────────────── */}
      <section>
        <div className="mb-3 flex items-end justify-between">
          <h2 className="font-display text-xl font-semibold tracking-tight">{m.moods}</h2>
          <Link href="/gallery" className="inline-flex items-center gap-1 text-sm font-medium text-muted-foreground hover:text-foreground">{m.moodsAll} <ArrowUpRight className="h-3.5 w-3.5" /></Link>
        </div>
        <div className="grid grid-cols-1 gap-4 sm:grid-cols-2 lg:grid-cols-4">
          {moodboards.map((mb) => (
            <article key={mb.id} className="group overflow-hidden rounded-2xl border border-border bg-card shadow-soft transition hover:-translate-y-0.5 hover:shadow-pop">
              <div className="grid grid-cols-3 gap-px bg-border">
                {mb.styles.map((st) => (
                  <RoomScene key={st} style={st} className="aspect-square w-full" />
                ))}
              </div>
              <div className="flex items-center justify-between p-3.5">
                <p className="truncate text-sm font-medium">{t(mb.title)}</p>
                <span className="inline-flex shrink-0 items-center gap-1 text-xs text-muted-foreground"><Bookmark className="h-3.5 w-3.5" />{mb.saved} {m.moodSaved}</span>
              </div>
            </article>
          ))}
        </div>
      </section>

      {/* ── Gallery strip + activity ─────────────────────────────────── */}
      <section className="grid grid-cols-1 gap-5 lg:grid-cols-[1.6fr_1fr]">
        <div>
          <div className="mb-3 flex items-end justify-between">
            <h2 className="font-display text-xl font-semibold tracking-tight">{m.gallery}</h2>
            <Link href="/gallery" className="inline-flex items-center gap-1 text-sm font-medium text-muted-foreground hover:text-foreground">{m.all} <ArrowUpRight className="h-3.5 w-3.5" /></Link>
          </div>
          <div className="grid grid-cols-2 gap-3 sm:grid-cols-3">
            {gallery.slice(0, 6).map((g) => (
              <div key={g.id} className="group overflow-hidden rounded-xl border border-border shadow-soft transition hover:-translate-y-0.5">
                <div className="relative">
                  <RoomScene style={g.style} className="aspect-square w-full" />
                  <span className="absolute bottom-1.5 right-1.5 inline-flex items-center gap-1 rounded-full bg-black/45 px-1.5 py-0.5 text-[10px] font-medium text-white backdrop-blur">
                    <Heart className="h-2.5 w-2.5 fill-current" />{g.likes}
                  </span>
                </div>
              </div>
            ))}
          </div>
        </div>

        <div className="rounded-2xl border border-border bg-card p-6 shadow-soft">
          <h2 className="font-display text-lg font-semibold tracking-tight">{m.activity}</h2>
          <ul className="mt-4 space-y-4">
            {activity.map((a) => (
              <li key={a.id} className="flex items-start gap-3">
                <span className="mt-1.5 h-2 w-2 shrink-0 rounded-full bg-primary" />
                <div className="min-w-0 text-sm">
                  <p className="leading-snug"><span className="font-medium">{a.who}</span> <span className="text-muted-foreground">{t(a.action)}</span> <span className="font-medium">{a.target}</span></p>
                  <p className="text-xs text-muted-foreground">{formatRelative(a.at)}</p>
                </div>
              </li>
            ))}
          </ul>
        </div>
      </section>
    </div>
  );
}
