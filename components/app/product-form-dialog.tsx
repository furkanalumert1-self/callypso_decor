"use client";

import { useRef, useState } from "react";
import { ImagePlus, Loader2 } from "lucide-react";
import { Dialog } from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { toast } from "@/components/ui/toast";
import { useLang } from "@/components/i18n/language-provider";
import { categoryLabel, type ProductCategory } from "@/lib/demo/products";
import { createProduct, updateProduct, type Product } from "@/lib/data";
import { fileToDataUrl } from "@/lib/image";
import { cn } from "@/lib/utils";

const CATEGORIES = Object.keys(categoryLabel) as ProductCategory[];

/** Add or edit a catalogue product (photo, name, SKU, category, price, dimensions). */
export function ProductFormDialog({
  open, onClose, product,
}: { open: boolean; onClose: () => void; product?: Product | null }) {
  const { lang, t } = useLang();
  const input = useRef<HTMLInputElement>(null);
  const [image, setImage] = useState(product?.image ?? "");
  const [name, setName] = useState(product?.name ?? "");
  const [sku, setSku] = useState(product?.sku ?? "");
  const [category, setCategory] = useState<ProductCategory>(product?.category ?? "sofa");
  const [price, setPrice] = useState(product ? String(product.price) : "");
  const [width, setWidth] = useState(product?.width ? String(product.width) : "");
  const [depth, setDepth] = useState(product?.depth ? String(product.depth) : "");
  const [height, setHeight] = useState(product?.height ? String(product.height) : "");
  const [saving, setSaving] = useState(false);

  const m = {
    tr: {
      add: "Ürün ekle", edit: "Ürünü düzenle", photo: "Ürün fotoğrafı", photoHint: "Düz, açık renkli fonda tek ürün en iyi sonucu verir",
      pick: "Fotoğraf seç", change: "Değiştir", name: "Ürün adı", sku: "SKU / stok kodu", category: "Kategori", price: "Fiyat (₺)",
      dims: "Ölçüler (cm) — gerçekçi ölçek için", w: "Genişlik", d: "Derinlik", h: "Yükseklik", cancel: "Vazgeç", save: "Kaydet",
      added: "Ürün kataloğa eklendi", updated: "Ürün güncellendi", memory: "Kaydedildi (tarayıcı depolaması dolu — yalnızca bu oturumda)",
      needPhoto: "Ürün fotoğrafı gerekli", needName: "Ürün adı gerekli", badFile: "Lütfen 15 MB'den küçük bir görsel seç",
    },
    en: {
      add: "Add product", edit: "Edit product", photo: "Product photo", photoHint: "A single item on a plain, light background works best",
      pick: "Choose photo", change: "Change", name: "Product name", sku: "SKU", category: "Category", price: "Price (₺)",
      dims: "Dimensions (cm) — for realistic scale", w: "Width", d: "Depth", h: "Height", cancel: "Cancel", save: "Save",
      added: "Product added to the catalogue", updated: "Product updated", memory: "Saved (browser storage is full — this session only)",
      needPhoto: "A product photo is required", needName: "A product name is required", badFile: "Please pick an image under 15 MB",
    },
  }[lang];

  async function pick(file?: File | null) {
    if (!file) return;
    if (!file.type.startsWith("image/") || file.size > 15 * 1024 * 1024) return toast(m.badFile, "error");
    setImage(await fileToDataUrl(file, 768));
  }

  const cm = (v: string) => (v.trim() && Number(v) > 0 ? Math.round(Number(v)) : undefined);

  async function submit(e: React.FormEvent) {
    e.preventDefault();
    if (!image) return toast(m.needPhoto, "error");
    if (!name.trim()) return toast(m.needName, "error");
    setSaving(true);
    const data = {
      name: name.trim(), sku: sku.trim(), category, price: Math.max(0, Number(price) || 0), image,
      width: cm(width), depth: cm(depth), height: cm(height),
    };
    try {
      if (product) {
        await updateProduct(product.id, data);
        toast(m.updated);
      } else {
        const { persisted } = await createProduct(data);
        toast(persisted ? m.added : m.memory, persisted ? "success" : "info");
      }
      onClose();
    } catch (err) {
      toast(err instanceof Error ? err.message : String(err), "error");
    } finally {
      setSaving(false);
    }
  }

  const field = "w-full rounded-lg border border-border bg-card px-3 py-2 text-sm outline-none focus:ring-2 focus:ring-ring/40";

  return (
    <Dialog open={open} onClose={onClose} title={product ? m.edit : m.add}>
      <form onSubmit={submit} className="space-y-4 p-5">
        <div className="flex items-center gap-4">
          <button
            type="button"
            onClick={() => input.current?.click()}
            className="grid h-28 w-36 shrink-0 place-items-center overflow-hidden rounded-xl border-2 border-dashed border-border bg-white hover:border-primary/60"
          >
            {image ? (
              // eslint-disable-next-line @next/next/no-img-element -- local data URL preview
              <img src={image} alt={name || m.photo} className="h-full w-full object-contain" />
            ) : (
              <ImagePlus className="h-6 w-6 text-muted-foreground" />
            )}
          </button>
          <div className="space-y-1.5 text-sm">
            <p className="font-medium">{m.photo}</p>
            <p className="text-xs text-muted-foreground">{m.photoHint}</p>
            <Button type="button" size="sm" variant="outline" onClick={() => input.current?.click()}>{image ? m.change : m.pick}</Button>
          </div>
          <input ref={input} type="file" accept="image/*" className="hidden" onChange={(e) => { pick(e.target.files?.[0]); e.target.value = ""; }} />
        </div>

        <label className="block space-y-1.5">
          <span className="text-sm font-medium">{m.name}</span>
          <input value={name} onChange={(e) => setName(e.target.value)} className={field} required />
        </label>
        <div className="grid grid-cols-2 gap-3">
          <label className="block space-y-1.5">
            <span className="text-sm font-medium">{m.sku}</span>
            <input value={sku} onChange={(e) => setSku(e.target.value)} className={field} />
          </label>
          <label className="block space-y-1.5">
            <span className="text-sm font-medium">{m.price}</span>
            <input type="number" min={0} step="1" inputMode="numeric" value={price} onChange={(e) => setPrice(e.target.value)} className={field} />
          </label>
        </div>
        <div className="space-y-1.5">
          <span className="text-sm font-medium">{m.category}</span>
          <div className="flex flex-wrap gap-1.5">
            {CATEGORIES.map((c) => (
              <button
                key={c}
                type="button"
                onClick={() => setCategory(c)}
                className={cn("rounded-full px-3 py-1.5 text-[13px] font-medium transition", category === c ? "bg-foreground text-background" : "bg-muted text-muted-foreground hover:text-foreground")}
              >
                {t(categoryLabel[c])}
              </button>
            ))}
          </div>
        </div>
        <div className="space-y-1.5">
          <span className="text-sm font-medium">{m.dims}</span>
          <div className="grid grid-cols-3 gap-3">
            {([[m.w, width, setWidth], [m.d, depth, setDepth], [m.h, height, setHeight]] as const).map(([label, value, set]) => (
              <input key={label} type="number" min={1} placeholder={label} aria-label={label} value={value} onChange={(e) => set(e.target.value)} className={field} />
            ))}
          </div>
        </div>
        <div className="flex justify-end gap-2 pt-1">
          <Button type="button" variant="outline" onClick={onClose}>{m.cancel}</Button>
          <Button type="submit" disabled={saving}>{saving && <Loader2 className="h-4 w-4 animate-spin" />} {m.save}</Button>
        </div>
      </form>
    </Dialog>
  );
}
