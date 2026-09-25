"use client";

import { useRef, useState } from "react";
import { Upload, Loader2, Download, RefreshCw, Save, ImageIcon, ShieldCheck, TriangleAlert } from "lucide-react";
import { Dialog } from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { toast } from "@/components/ui/toast";
import { CompareSlider } from "@/components/app/compare-slider";
import type { RoomStyle } from "@/components/room-scene";
import { useLang } from "@/components/i18n/language-provider";
import { roomLiving, roomBedroom, roomKitchen, roomStudy, roomKids, roomBath, styles } from "@/lib/demo/data";
import { createProject } from "@/lib/data";
import { fileToDataUrl, demoRestyle, downloadImage, alignTo } from "@/lib/image";
import { cn } from "@/lib/utils";

const ROOMS = [roomLiving, roomBedroom, roomKitchen, roomStudy, roomKids, roomBath];

/** Upload → preview → generate → before/after → download / save / regenerate. */
export function NewRoomDialog({
  open, onClose, defaultStyle,
}: { open: boolean; onClose: () => void; defaultStyle?: RoomStyle }) {
  const { lang, t } = useLang();
  const input = useRef<HTMLInputElement>(null);
  const [before, setBefore] = useState<string | null>(null);
  const [room, setRoom] = useState(0);
  const [style, setStyle] = useState<RoomStyle>(defaultStyle ?? "iskandinav");
  const [place, setPlace] = useState("");
  const [mode, setMode] = useState<"furnish" | "renovate">("furnish");
  const [result, setResult] = useState<{ image: string; demo: boolean; check: { structure_preserved: boolean; changes: string[] } | null; preserved: string[] } | null>(null);
  const [variant, setVariant] = useState(0);
  const [pending, setPending] = useState(false);
  const [saving, setSaving] = useState(false);
  const [dragging, setDragging] = useState(false);
  const [lastDefault, setLastDefault] = useState(defaultStyle);

  // Re-sync the preselected style when the dialog is reopened from another card.
  if (defaultStyle !== lastDefault) {
    setLastDefault(defaultStyle);
    if (defaultStyle) setStyle(defaultStyle);
  }

  const m = {
    tr: {
      title: "Yeni oda", drop: "Odanın fotoğrafını sürükle ya da seç", hint: "JPG, PNG veya WEBP · en fazla 15 MB",
      change: "Fotoğrafı değiştir", room: "Oda tipi", style: "Stil", place: "Yer / etiket (opsiyonel)", placeholder: "ör. Kadıköy · Daire",
      generate: "Tasarımı üret", generating: "Üretiliyor…", regenerate: "Yeniden üret", download: "İndir", save: "Projelere kaydet",
      before: "Önce", after: "Sonra", demo: "Demo sonucu — gerçek AI için FAL_KEY ekle", done: "Yeni görünüm hazır",
      saved: "Projelere kaydedildi", savedMemory: "Kaydedildi (tarayıcı depolaması dolu — yalnızca bu oturumda kalır)",
      badFile: "Lütfen 15 MB'den küçük bir görsel seç", readFail: "Fotoğraf okunamadı", dlFail: "İndirme başarısız", noPhoto: "Önce bir fotoğraf yükle",
      demoTag: "Demo", mode: "Dönüşüm", furnish: "Sadece döşe (oda aynen kalır)", renovate: "Duvar ve zemini de yenile",
      kept: "Oda yapısı korundu (Claude kontrolü)", drift: "Oda yapısı değişmiş — yeniden üretmeyi dene:", driftToast: "Sonuç odanın yapısını değiştirmiş",
      preserved: "Korunması istenen öğeler",
    },
    en: {
      title: "New room", drop: "Drag a photo of your room here, or browse", hint: "JPG, PNG or WEBP · up to 15 MB",
      change: "Change photo", room: "Room type", style: "Style", place: "Place / tag (optional)", placeholder: "e.g. Kadıköy · Flat",
      generate: "Generate design", generating: "Generating…", regenerate: "Regenerate", download: "Download", save: "Save to projects",
      before: "Before", after: "After", demo: "Demo result — add FAL_KEY for real AI", done: "Your new look is ready",
      saved: "Saved to projects", savedMemory: "Saved (browser storage is full — kept for this session only)",
      badFile: "Please pick an image under 15 MB", readFail: "Couldn't read that photo", dlFail: "Download failed", noPhoto: "Upload a photo first",
      demoTag: "Demo", mode: "Transformation", furnish: "Furnish only (room stays as is)", renovate: "Also refresh walls & floor",
      kept: "Room structure preserved (checked by Claude)", drift: "The room's structure changed — try regenerating:", driftToast: "The result changed the room's structure",
      preserved: "Elements asked to keep",
    },
  }[lang];

  const styleDef = styles.find((s) => s.id === style)!;

  function reset() {
    setBefore(null); setResult(null); setVariant(0); setPlace(""); setPending(false);
  }
  function close() {
    reset();
    onClose();
  }

  async function pick(file?: File | null) {
    if (!file) return;
    if (!file.type.startsWith("image/") || file.size > 15 * 1024 * 1024) return toast(m.badFile, "error");
    try {
      setBefore(await fileToDataUrl(file));
      setResult(null);
      setVariant(0);
    } catch {
      toast(m.readFail, "error");
    }
  }

  async function generate(nextVariant: number) {
    if (!before) return toast(m.noPhoto, "error");
    setPending(true);
    try {
      const res = await fetch("/api/generate", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ image: before, style, room: ROOMS[room].en, mode, variant: nextVariant }),
      });
      const data = (await res.json().catch(() => ({}))) as {
        demo?: boolean; image?: string; error?: string; preserved?: string[];
        check?: { structure_preserved: boolean; changes: string[] } | null;
      };
      if (!res.ok || data.error) throw new Error(data.error || `HTTP ${res.status}`);
      if (data.demo) {
        const image = await demoRestyle(before, styleDef.palette, `${m.demoTag} · ${t(styleDef.name)}`, nextVariant);
        setResult({ image, demo: true, check: null, preserved: [] });
        toast(m.demo, "info");
      } else {
        // Pixel-align the result to the upload so the slider lines up.
        const image = await alignTo(data.image!, before);
        const check = data.check ?? null;
        setResult({ image, demo: false, check, preserved: data.preserved ?? [] });
        if (check && !check.structure_preserved) toast(m.driftToast, "error");
        else toast(m.done);
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
      await downloadImage(result.image, `callypso-decor-${style}-${variant + 1}`);
    } catch {
      toast(m.dlFail, "error");
    }
  }

  async function save() {
    if (!before || !result) return;
    setSaving(true);
    try {
      const { persisted } = await createProject({
        room: ROOMS[room], place: place.trim() || t(ROOMS[room]), style, status: "ready",
        variants: variant + 1, saved: 1, imageBefore: before, imageAfter: result.image,
      });
      toast(persisted ? m.saved : m.savedMemory, persisted ? "success" : "info");
      close();
    } catch (e) {
      toast(e instanceof Error ? e.message : String(e), "error");
    } finally {
      setSaving(false);
    }
  }

  const chip = (active: boolean) =>
    cn("rounded-full px-3 py-1.5 text-[13px] font-medium transition", active ? "bg-foreground text-background" : "bg-muted text-muted-foreground hover:text-foreground");

  return (
    <Dialog open={open} onClose={close} title={m.title} className="sm:max-w-2xl">
      <div className="space-y-5 p-5">
        {/* upload / preview / result */}
        {result && before ? (
          <div className="overflow-hidden rounded-xl ring-1 ring-border">
            <CompareSlider key={result.image} before={before} after={result.image} labels={{ before: m.before, after: m.after }} />
          </div>
        ) : null}
        {result && before && !result.demo && (result.check || result.preserved.length > 0) && (
          <div
            className={cn(
              "flex items-start gap-2 rounded-lg px-3 py-2 text-xs",
              result.check && !result.check.structure_preserved ? "bg-destructive/10 text-destructive" : "bg-muted text-foreground",
            )}
          >
            {result.check && !result.check.structure_preserved ? (
              <TriangleAlert className="mt-0.5 h-3.5 w-3.5 shrink-0" />
            ) : result.check ? (
              <ShieldCheck className="mt-0.5 h-3.5 w-3.5 shrink-0 text-success" />
            ) : null}
            <div className="space-y-1">
              {result.check && (
                <p className="font-medium">
                  {result.check.structure_preserved ? m.kept : m.drift}
                  {!result.check.structure_preserved && result.check.changes.length > 0 && (
                    <span className="font-normal"> {result.check.changes.join(" · ")}</span>
                  )}
                </p>
              )}
              {result.preserved.length > 0 && (
                <p className="text-muted-foreground">{m.preserved}: {result.preserved.join(" · ")}</p>
              )}
            </div>
          </div>
        )}
        {result && before ? null : before ? (
          <div className="relative overflow-hidden rounded-xl ring-1 ring-border">
            {/* eslint-disable-next-line @next/next/no-img-element -- local data URL preview */}
            <img src={before} alt={m.before} className="aspect-[4/3] w-full object-cover" />
            <span className="absolute left-2.5 top-2.5 rounded-full bg-black/45 px-2 py-0.5 text-[11px] font-medium text-white">{m.before}</span>
            {pending && (
              <div className="absolute inset-0 grid place-items-center bg-background/60 backdrop-blur-sm">
                <p className="inline-flex items-center gap-2 text-sm font-medium"><Loader2 className="h-4 w-4 animate-spin" /> {m.generating}</p>
              </div>
            )}
          </div>
        ) : (
          <button
            type="button"
            onClick={() => input.current?.click()}
            onDragOver={(e) => { e.preventDefault(); setDragging(true); }}
            onDragLeave={() => setDragging(false)}
            onDrop={(e) => { e.preventDefault(); setDragging(false); pick(e.dataTransfer.files?.[0]); }}
            className={cn(
              "flex aspect-[4/3] w-full flex-col items-center justify-center gap-2 rounded-xl border-2 border-dashed text-center transition",
              dragging ? "border-primary bg-primary/5" : "border-border bg-muted/40 hover:border-primary/60",
            )}
          >
            <span className="grid h-12 w-12 place-items-center rounded-full bg-primary/10 text-primary"><Upload className="h-5 w-5" /></span>
            <span className="text-sm font-medium">{m.drop}</span>
            <span className="text-xs text-muted-foreground">{m.hint}</span>
          </button>
        )}
        <input ref={input} type="file" accept="image/*" className="hidden" onChange={(e) => { pick(e.target.files?.[0]); e.target.value = ""; }} />
        {before && (
          <button type="button" onClick={() => input.current?.click()} className="inline-flex items-center gap-1.5 text-xs font-medium text-muted-foreground hover:text-foreground">
            <ImageIcon className="h-3.5 w-3.5" /> {m.change}
          </button>
        )}

        <div className="space-y-2">
          <p className="label-mono text-muted-foreground">{m.room}</p>
          <div className="flex flex-wrap gap-1.5">
            {ROOMS.map((r, i) => (
              <button key={r.en} type="button" onClick={() => setRoom(i)} className={chip(room === i)}>{t(r)}</button>
            ))}
          </div>
        </div>
        <div className="space-y-2">
          <p className="label-mono text-muted-foreground">{m.style}</p>
          <div className="flex flex-wrap gap-1.5">
            {styles.map((s) => (
              <button key={s.id} type="button" onClick={() => setStyle(s.id)} className={chip(style === s.id)}>{t(s.name)}</button>
            ))}
          </div>
        </div>
        <div className="space-y-2">
          <p className="label-mono text-muted-foreground">{m.mode}</p>
          <div className="flex flex-wrap gap-1.5">
            <button type="button" onClick={() => setMode("furnish")} className={chip(mode === "furnish")}>{m.furnish}</button>
            <button type="button" onClick={() => setMode("renovate")} className={chip(mode === "renovate")}>{m.renovate}</button>
          </div>
        </div>
        <label className="block space-y-2">
          <span className="label-mono text-muted-foreground">{m.place}</span>
          <input
            value={place}
            onChange={(e) => setPlace(e.target.value)}
            placeholder={m.placeholder}
            className="w-full rounded-lg border border-border bg-card px-3 py-2 text-sm outline-none focus:ring-2 focus:ring-ring/40"
          />
        </label>
      </div>

      <div className="sticky bottom-0 flex flex-wrap justify-end gap-2 border-t border-border bg-background px-5 py-3.5">
        {result ? (
          <>
            <Button variant="outline" onClick={download} disabled={pending}><Download className="h-4 w-4" /> {m.download}</Button>
            <Button variant="outline" onClick={() => generate(variant + 1)} disabled={pending}>
              {pending ? <Loader2 className="h-4 w-4 animate-spin" /> : <RefreshCw className="h-4 w-4" />} {m.regenerate}
            </Button>
            <Button onClick={save} disabled={pending || saving}>
              {saving ? <Loader2 className="h-4 w-4 animate-spin" /> : <Save className="h-4 w-4" />} {m.save}
            </Button>
          </>
        ) : (
          <Button onClick={() => generate(0)} disabled={!before || pending}>
            {pending ? <Loader2 className="h-4 w-4 animate-spin" /> : null} {pending ? m.generating : m.generate}
          </Button>
        )}
      </div>
    </Dialog>
  );
}
