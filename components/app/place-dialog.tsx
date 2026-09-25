"use client";

import { useRef, useState } from "react";
import { Upload, Loader2, Download, RefreshCw, Save, Share2, ShieldCheck, TriangleAlert, X, Check, MapPin } from "lucide-react";
import { Dialog } from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { toast } from "@/components/ui/toast";
import { CompareSlider } from "@/components/app/compare-slider";
import { useLang } from "@/components/i18n/language-provider";
import { roomLiving } from "@/lib/demo/data";
import { categoryLabel } from "@/lib/demo/products";
import { createProject, useProducts, useProjects, type Product } from "@/lib/data";
import { alignTo, copyText, demoPlace, downloadImage, fileToDataUrl, imageAspect, toJpeg } from "@/lib/image";
import { cn, formatTry } from "@/lib/utils";

const MAX = 3;
type Spot = { x: number; y: number };
type Check = {
  structure_preserved: boolean;
  changes: string[];
  products: { name: string; faithful: boolean; note: string }[];
} | null;

/**
 * Furniture-firm flow: put specific catalogue products into a customer's room
 * photo. Pick room → pick up to 3 products → tap the photo to mark where each
 * goes → generate → before/after, fidelity check, price list, save/share.
 */
export function PlaceDialog({
  open, onClose, initialProductIds = [],
}: { open: boolean; onClose: () => void; initialProductIds?: string[] }) {
  const { lang, t } = useLang();
  const { products } = useProducts();
  const { projects } = useProjects();
  const input = useRef<HTMLInputElement>(null);
  const [room, setRoom] = useState<string | null>(null);
  const [selected, setSelected] = useState<string[]>(initialProductIds.slice(0, MAX));
  const [spots, setSpots] = useState<Record<string, Spot>>({});
  const [active, setActive] = useState(0);
  const [note, setNote] = useState("");
  const [pending, setPending] = useState(false);
  const [saving, setSaving] = useState(false);
  const [variant, setVariant] = useState(0);
  const [result, setResult] = useState<{ image: string; demo: boolean; check: Check } | null>(null);

  const m = {
    tr: {
      title: "Salona yerleştir", s1: "1 · Salon fotoğrafı", upload: "Müşterinin salon fotoğrafını yükle", fromProjects: "veya projelerden seç",
      change: "Fotoğrafı değiştir", s2: `2 · Ürünler (en fazla ${MAX})`, noProducts: "Katalogda ürün yok — önce ürün ekle.",
      s3: "3 · Konum", s3hint: "Fotoğrafa dokunarak seçili ürünün yerini işaretle (opsiyonel).", placing: "Yerleştirilen", clear: "Temizle",
      auto: "otomatik", note: "Ek not (opsiyonel)", notePh: "ör. kanepeyi sağ duvara, halıyı ortaya", generate: "Yerleştir", generating: "Yerleştiriliyor…",
      regenerate: "Yeniden üret", download: "İndir", share: "Teklif özetini kopyala", save: "Projelere kaydet", before: "Önce", after: "Sonra",
      total: "Toplam", demo: "Demo sonucu — gerçek yerleştirme için FAL_KEY ekle", done: "Ürünler yerleştirildi", max: `En fazla ${MAX} ürün seçebilirsin`,
      needRoom: "Önce salon fotoğrafı yükle", needProduct: "En az bir ürün seç", saved: "Projelere kaydedildi", copied: "Teklif özeti panoya kopyalandı",
      dlFail: "İndirme başarısız", badFile: "Lütfen 15 MB'den küçük bir görsel seç", kept: "Oda yapısı korundu", drift: "Oda yapısı değişmiş:",
      faithful: "katalogla uyumlu", unfaithful: "katalogdan farklı", driftToast: "Sonuç odayı ya da ürünleri değiştirmiş olabilir — yeniden üretmeyi dene",
      demoTag: "Demo · ürün yerleştirme", place: "Ürün yerleştirme", summary: "Callypso Decor — ürün yerleştirme teklifi",
    },
    en: {
      title: "Place in room", s1: "1 · Room photo", upload: "Upload the customer's room photo", fromProjects: "or pick from projects",
      change: "Change photo", s2: `2 · Products (up to ${MAX})`, noProducts: "No products in the catalogue — add one first.",
      s3: "3 · Position", s3hint: "Tap the photo to mark where the selected product goes (optional).", placing: "Placing", clear: "Clear",
      auto: "auto", note: "Extra note (optional)", notePh: "e.g. sofa on the right wall, rug in the middle", generate: "Place products", generating: "Placing…",
      regenerate: "Regenerate", download: "Download", share: "Copy quote summary", save: "Save to projects", before: "Before", after: "After",
      total: "Total", demo: "Demo result — add FAL_KEY for real placement", done: "Products placed", max: `You can pick up to ${MAX} products`,
      needRoom: "Upload a room photo first", needProduct: "Pick at least one product", saved: "Saved to projects", copied: "Quote summary copied",
      dlFail: "Download failed", badFile: "Please pick an image under 15 MB", kept: "Room structure preserved", drift: "Room structure changed:",
      faithful: "matches catalogue", unfaithful: "differs from catalogue", driftToast: "The result may have changed the room or the products — try regenerating",
      demoTag: "Demo · product placement", place: "Product placement", summary: "Callypso Decor — product placement quote",
    },
  }[lang];

  const chosen = selected.map((id) => products.find((p) => p.id === id)).filter((p): p is Product => !!p);
  const total = chosen.reduce((sum, p) => sum + p.price, 0);
  const roomsFromProjects = projects.filter((p) => p.imageBefore).slice(0, 6);

  function reset() {
    setRoom(null); setSpots({}); setActive(0); setNote(""); setResult(null); setVariant(0); setPending(false);
  }
  function close() {
    reset();
    setSelected(initialProductIds.slice(0, MAX));
    onClose();
  }

  async function pickFile(file?: File | null) {
    if (!file) return;
    if (!file.type.startsWith("image/") || file.size > 15 * 1024 * 1024) return toast(m.badFile, "error");
    setRoom(await fileToDataUrl(file));
    setSpots({});
    setResult(null);
  }

  function toggle(id: string) {
    setResult(null);
    if (selected.includes(id)) {
      const next = selected.filter((x) => x !== id);
      setSelected(next);
      setActive((a) => Math.min(a, Math.max(0, next.length - 1)));
      return;
    }
    if (selected.length >= MAX) return toast(m.max, "info");
    const next = [...selected, id];
    setSelected(next);
    // point the marker at the first product that doesn't have a spot yet
    const firstFree = next.findIndex((x) => !spots[x]);
    setActive(firstFree === -1 ? next.length - 1 : firstFree);
  }

  function mark(e: React.MouseEvent<HTMLDivElement>) {
    const current = chosen[active];
    if (!current) return;
    const r = e.currentTarget.getBoundingClientRect();
    const spot = { x: (e.clientX - r.left) / r.width, y: (e.clientY - r.top) / r.height };
    const nextSpots = { ...spots, [current.id]: spot };
    setSpots(nextSpots);
    setResult(null);
    // move on to the next product still without a spot (wrapping), else stay
    for (let k = 1; k < chosen.length; k++) {
      const i = (active + k) % chosen.length;
      if (!nextSpots[chosen[i].id]) { setActive(i); break; }
    }
  }

  async function generate(nextVariant: number) {
    if (!room) return toast(m.needRoom, "error");
    if (!chosen.length) return toast(m.needProduct, "error");
    setPending(true);
    try {
      const productImages = await Promise.all(chosen.map((p) => toJpeg(p.image, 768)));
      const res = await fetch("/api/place", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          room,
          aspect: await imageAspect(room),
          note,
          variant: nextVariant,
          products: chosen.map((p, i) => ({
            name: p.name, category: p.category, width: p.width, depth: p.depth, height: p.height,
            image: productImages[i], spot: spots[p.id],
          })),
        }),
      });
      const data = (await res.json().catch(() => ({}))) as { demo?: boolean; image?: string; error?: string; check?: Check };
      if (!res.ok || data.error) throw new Error(data.error || `HTTP ${res.status}`);
      if (data.demo) {
        const image = await demoPlace(room, chosen.map((p, i) => ({ image: productImages[i], category: p.category, spot: spots[p.id] })), m.demoTag);
        setResult({ image, demo: true, check: null });
        toast(m.demo, "info");
      } else {
        const image = await alignTo(data.image!, room);
        const check = data.check ?? null;
        setResult({ image, demo: false, check });
        const bad = check && (!check.structure_preserved || check.products.some((p) => !p.faithful));
        toast(bad ? m.driftToast : m.done, bad ? "error" : "success");
      }
      setVariant(nextVariant);
    } catch (e) {
      toast(e instanceof Error ? e.message : String(e), "error");
    } finally {
      setPending(false);
    }
  }

  async function download() {
    if (!result) return;
    try {
      await downloadImage(result.image, `callypso-decor-yerlesim-${variant + 1}`);
    } catch {
      toast(m.dlFail, "error");
    }
  }

  async function share() {
    const lines = [
      m.summary,
      ...chosen.map((p) => `• ${p.name}${p.sku ? ` (${p.sku})` : ""} — ${formatTry(p.price, lang)}`),
      `${m.total}: ${formatTry(total, lang)}`,
    ];
    await copyText(lines.join("\n"));
    toast(m.copied);
  }

  async function save() {
    if (!room || !result) return;
    setSaving(true);
    try {
      await createProject({
        room: roomLiving, place: note.trim() || `${m.place} · ${chosen.map((p) => p.name).join(", ")}`.slice(0, 120),
        style: "modern", status: "ready", variants: variant + 1, saved: 1,
        imageBefore: room, imageAfter: result.image,
        products: chosen.map((p) => ({ id: p.id, name: p.name, sku: p.sku, price: p.price })),
      });
      toast(m.saved);
      close();
    } catch (e) {
      toast(e instanceof Error ? e.message : String(e), "error");
    } finally {
      setSaving(false);
    }
  }

  const label = "label-mono text-muted-foreground";

  return (
    <Dialog open={open} onClose={close} title={m.title} className="sm:max-w-3xl">
      <div className="space-y-5 p-5">
        {/* result */}
        {result && room ? (
          <>
            <div className="overflow-hidden rounded-xl ring-1 ring-border">
              <CompareSlider key={result.image} before={room} after={result.image} labels={{ before: m.before, after: m.after }} />
            </div>
            {result.check && (
              <div className={cn("space-y-1.5 rounded-lg px-3 py-2 text-xs", result.check.structure_preserved ? "bg-muted" : "bg-destructive/10")}>
                <p className={cn("flex items-start gap-1.5 font-medium", !result.check.structure_preserved && "text-destructive")}>
                  {result.check.structure_preserved ? <ShieldCheck className="mt-0.5 h-3.5 w-3.5 shrink-0 text-success" /> : <TriangleAlert className="mt-0.5 h-3.5 w-3.5 shrink-0" />}
                  {result.check.structure_preserved ? m.kept : `${m.drift} ${result.check.changes.join(" · ")}`}
                </p>
                {result.check.products.map((p) => (
                  <p key={p.name} className={cn("flex items-start gap-1.5", !p.faithful && "text-destructive")}>
                    {p.faithful ? <Check className="mt-0.5 h-3.5 w-3.5 shrink-0 text-success" /> : <X className="mt-0.5 h-3.5 w-3.5 shrink-0" />}
                    <span><span className="font-medium">{p.name}</span> — {p.faithful ? m.faithful : `${m.unfaithful}${p.note ? `: ${p.note}` : ""}`}</span>
                  </p>
                ))}
              </div>
            )}
          </>
        ) : (
          <>
            {/* step 1: room */}
            <div className="space-y-2">
              <p className={label}>{m.s1}</p>
              {room ? (
                <div className="space-y-2">
                  <div className="relative cursor-crosshair overflow-hidden rounded-xl ring-1 ring-border" onClick={mark}>
                    {/* eslint-disable-next-line @next/next/no-img-element -- local data URL */}
                    <img src={room} alt={m.before} className="block w-full select-none" draggable={false} />
                    {chosen.map((p, i) =>
                      spots[p.id] ? (
                        <span
                          key={p.id}
                          className="pointer-events-none absolute grid h-7 w-7 -translate-x-1/2 -translate-y-full place-items-center rounded-full bg-primary text-xs font-bold text-primary-foreground shadow-lg ring-2 ring-white"
                          style={{ left: `${spots[p.id].x * 100}%`, top: `${spots[p.id].y * 100}%` }}
                        >
                          {i + 1}
                        </span>
                      ) : null,
                    )}
                    {pending && (
                      <div className="absolute inset-0 grid place-items-center bg-background/60 backdrop-blur-sm">
                        <p className="inline-flex items-center gap-2 text-sm font-medium"><Loader2 className="h-4 w-4 animate-spin" /> {m.generating}</p>
                      </div>
                    )}
                  </div>
                  <button type="button" onClick={() => input.current?.click()} className="text-xs font-medium text-muted-foreground hover:text-foreground">{m.change}</button>
                </div>
              ) : (
                <div className="space-y-3">
                  <button
                    type="button"
                    onClick={() => input.current?.click()}
                    onDragOver={(e) => e.preventDefault()}
                    onDrop={(e) => { e.preventDefault(); pickFile(e.dataTransfer.files?.[0]); }}
                    className="flex h-40 w-full flex-col items-center justify-center gap-2 rounded-xl border-2 border-dashed border-border bg-muted/40 text-sm font-medium hover:border-primary/60"
                  >
                    <Upload className="h-5 w-5 text-primary" /> {m.upload}
                  </button>
                  {roomsFromProjects.length > 0 && (
                    <div>
                      <p className="mb-1.5 text-xs text-muted-foreground">{m.fromProjects}</p>
                      <div className="flex gap-2 overflow-x-auto pb-1">
                        {roomsFromProjects.map((p) => (
                          <button key={p.id} type="button" onClick={() => setRoom(p.imageBefore!)} className="shrink-0 overflow-hidden rounded-lg ring-1 ring-border hover:ring-primary">
                            {/* eslint-disable-next-line @next/next/no-img-element -- stored data URL */}
                            <img src={p.imageBefore} alt={p.place} className="h-16 w-24 object-cover" />
                          </button>
                        ))}
                      </div>
                    </div>
                  )}
                </div>
              )}
              <input ref={input} type="file" accept="image/*" className="hidden" onChange={(e) => { pickFile(e.target.files?.[0]); e.target.value = ""; }} />
            </div>

            {/* step 2: products */}
            <div className="space-y-2">
              <p className={label}>{m.s2}</p>
              {products.length === 0 ? (
                <p className="text-sm text-muted-foreground">{m.noProducts}</p>
              ) : (
                <div className="grid grid-cols-3 gap-2 sm:grid-cols-5">
                  {products.map((p) => {
                    const idx = selected.indexOf(p.id);
                    return (
                      <button
                        key={p.id}
                        type="button"
                        onClick={() => toggle(p.id)}
                        aria-pressed={idx >= 0}
                        className={cn("relative overflow-hidden rounded-lg bg-white text-left ring-1 transition", idx >= 0 ? "ring-2 ring-primary" : "ring-border hover:ring-primary/50")}
                      >
                        {/* eslint-disable-next-line @next/next/no-img-element -- catalogue data URL */}
                        <img src={p.image} alt={p.name} className="aspect-[4/3] w-full object-contain" />
                        <p className="truncate bg-card px-1.5 py-1 text-[11px] font-medium">{p.name}</p>
                        {idx >= 0 && (
                          <span className="absolute right-1 top-1 grid h-5 w-5 place-items-center rounded-full bg-primary text-[10px] font-bold text-primary-foreground">{idx + 1}</span>
                        )}
                      </button>
                    );
                  })}
                </div>
              )}
            </div>

            {/* step 3: position */}
            {room && chosen.length > 0 && (
              <div className="space-y-2">
                <p className={label}>{m.s3}</p>
                <p className="text-xs text-muted-foreground">{m.s3hint}</p>
                <div className="flex flex-wrap gap-1.5">
                  {chosen.map((p, i) => (
                    <button
                      key={p.id}
                      type="button"
                      onClick={() => setActive(i)}
                      className={cn("inline-flex items-center gap-1.5 rounded-full px-3 py-1.5 text-[13px] font-medium", active === i ? "bg-foreground text-background" : "bg-muted text-muted-foreground")}
                    >
                      <MapPin className="h-3.5 w-3.5" /> {i + 1}. {p.name}
                      <span className="opacity-70">· {spots[p.id] ? "✓" : m.auto}</span>
                    </button>
                  ))}
                  {Object.keys(spots).length > 0 && (
                    <button type="button" onClick={() => { setSpots({}); setActive(0); }} className="px-2 text-xs font-medium text-muted-foreground hover:text-foreground">{m.clear}</button>
                  )}
                </div>
                <input
                  value={note}
                  onChange={(e) => setNote(e.target.value)}
                  placeholder={m.notePh}
                  aria-label={m.note}
                  className="w-full rounded-lg border border-border bg-card px-3 py-2 text-sm outline-none focus:ring-2 focus:ring-ring/40"
                />
              </div>
            )}
          </>
        )}

        {/* price list */}
        {chosen.length > 0 && (
          <div className="rounded-xl border border-border">
            {chosen.map((p, i) => (
              <div key={p.id} className="flex items-center gap-3 border-b border-border px-3 py-2 text-sm last:border-b-0">
                <span className="grid h-5 w-5 shrink-0 place-items-center rounded-full bg-muted text-[10px] font-bold">{i + 1}</span>
                <span className="min-w-0 flex-1 truncate">
                  {p.name} <span className="text-xs text-muted-foreground">· {t(categoryLabel[p.category])}{p.sku ? ` · ${p.sku}` : ""}</span>
                </span>
                <span className="tabular-nums">{formatTry(p.price, lang)}</span>
              </div>
            ))}
            <div className="flex justify-between bg-muted/50 px-3 py-2 text-sm font-semibold">
              <span>{m.total}</span>
              <span className="tabular-nums">{formatTry(total, lang)}</span>
            </div>
          </div>
        )}
      </div>

      <div className="sticky bottom-0 flex flex-wrap justify-end gap-2 border-t border-border bg-background px-5 py-3.5">
        {result ? (
          <>
            <Button variant="outline" onClick={share}><Share2 className="h-4 w-4" /> {m.share}</Button>
            <Button variant="outline" onClick={download} disabled={pending}><Download className="h-4 w-4" /> {m.download}</Button>
            <Button variant="outline" onClick={() => generate(variant + 1)} disabled={pending}>
              {pending ? <Loader2 className="h-4 w-4 animate-spin" /> : <RefreshCw className="h-4 w-4" />} {m.regenerate}
            </Button>
            <Button onClick={save} disabled={pending || saving}>{saving ? <Loader2 className="h-4 w-4 animate-spin" /> : <Save className="h-4 w-4" />} {m.save}</Button>
          </>
        ) : (
          <Button onClick={() => generate(0)} disabled={!room || !chosen.length || pending}>
            {pending && <Loader2 className="h-4 w-4 animate-spin" />} {pending ? m.generating : m.generate}
          </Button>
        )}
      </div>
    </Dialog>
  );
}
