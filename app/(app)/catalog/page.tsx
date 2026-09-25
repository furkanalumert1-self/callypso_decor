"use client";

import { useState } from "react";
import { Plus, Search, Sofa, MoreHorizontal, Pencil, Trash2, Wand2 } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Dialog } from "@/components/ui/dialog";
import { Menu } from "@/components/ui/menu";
import { toast } from "@/components/ui/toast";
import { PlaceDialog } from "@/components/app/place-dialog";
import { ProductFormDialog } from "@/components/app/product-form-dialog";
import { useLang } from "@/components/i18n/language-provider";
import { categoryLabel, type ProductCategory } from "@/lib/demo/products";
import { deleteProduct, useProducts, type Product } from "@/lib/data";
import { cn, formatTry } from "@/lib/utils";

export default function CatalogPage() {
  const { lang, t } = useLang();
  const { products, loading } = useProducts();
  const [query, setQuery] = useState("");
  const [category, setCategory] = useState<ProductCategory | "all">("all");
  const [form, setForm] = useState<{ product: Product | null } | null>(null);
  const [placing, setPlacing] = useState<string[] | null>(null);
  const [deleting, setDeleting] = useState<Product | null>(null);

  const m = {
    tr: {
      title: "Katalog", sub: "Mobilya firmanın ürünleri. Bir ürünü müşterinin salon fotoğrafına birebir yerleştir, teklifi paylaş.",
      add: "Ürün ekle", place: "Salona yerleştir", search: "Ürün adı ya da SKU ara…", all: "Tümü", actions: "İşlemler",
      edit: "Düzenle", del: "Sil", delTitle: "Ürün silinsin mi?", delBody: "Ürün katalogdan kalıcı olarak kaldırılacak.", cancel: "Vazgeç",
      deleted: "Ürün silindi", emptyTitle: "Katalog boş", emptyBody: "İlk ürününü fotoğraf, fiyat ve ölçüleriyle ekle.",
      noMatch: "Eşleşen ürün yok", clear: "Filtreleri temizle",
    },
    en: {
      title: "Catalogue", sub: "Your furniture products. Place any of them exactly as they are into a customer's room photo and share the quote.",
      add: "Add product", place: "Place in room", search: "Search name or SKU…", all: "All", actions: "Actions",
      edit: "Edit", del: "Delete", delTitle: "Delete this product?", delBody: "The product will be permanently removed from the catalogue.", cancel: "Cancel",
      deleted: "Product deleted", emptyTitle: "Catalogue is empty", emptyBody: "Add your first product with a photo, price and dimensions.",
      noMatch: "No matching products", clear: "Clear filters",
    },
  }[lang];

  const cats = (Object.keys(categoryLabel) as ProductCategory[]).filter((c) => products.some((p) => p.category === c));
  const q = query.trim().toLocaleLowerCase(lang);
  const shown = products
    .filter((p) => category === "all" || p.category === category)
    .filter((p) => !q || p.name.toLocaleLowerCase(lang).includes(q) || p.sku.toLocaleLowerCase(lang).includes(q));

  const dims = (p: Product) => [p.width, p.depth, p.height].filter(Boolean).join(" × ");

  return (
    <div className="mx-auto max-w-7xl space-y-6">
      <div className="flex flex-wrap items-end justify-between gap-4">
        <div>
          <h1 className="font-display text-3xl font-semibold tracking-tight">{m.title}</h1>
          <p className="mt-1 max-w-xl text-sm text-muted-foreground">{m.sub}</p>
        </div>
        <div className="flex gap-2">
          <Button variant="outline" className="gap-2" onClick={() => setForm({ product: null })}><Plus className="h-4 w-4" /> {m.add}</Button>
          <Button className="gap-2" onClick={() => setPlacing([])} disabled={!products.length}><Wand2 className="h-4 w-4" /> {m.place}</Button>
        </div>
      </div>

      <div className="flex flex-wrap items-center gap-3">
        <div className="flex flex-wrap gap-1.5">
          {(["all", ...cats] as const).map((c) => (
            <button
              key={c}
              onClick={() => setCategory(c)}
              className={cn("rounded-full px-3.5 py-1.5 text-[13px] font-medium transition", category === c ? "bg-foreground text-background" : "bg-muted text-muted-foreground hover:text-foreground")}
            >
              {c === "all" ? m.all : t(categoryLabel[c])}
            </button>
          ))}
        </div>
        <div className="relative w-full sm:ml-auto sm:w-64">
          <Search className="pointer-events-none absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-muted-foreground" />
          <input
            type="search"
            value={query}
            onChange={(e) => setQuery(e.target.value)}
            placeholder={m.search}
            className="w-full rounded-full border border-border bg-card py-2 pl-9 pr-4 text-sm outline-none focus:ring-2 focus:ring-ring/40"
          />
        </div>
      </div>

      {loading ? (
        <div className="grid grid-cols-2 gap-4 sm:grid-cols-3 lg:grid-cols-4">
          {Array.from({ length: 4 }, (_, i) => <div key={i} className="aspect-[4/5] animate-pulse rounded-2xl bg-muted" />)}
        </div>
      ) : shown.length ? (
        <div className="grid grid-cols-2 gap-4 sm:grid-cols-3 lg:grid-cols-4">
          {shown.map((p) => (
            <article key={p.id} className="group overflow-hidden rounded-2xl border border-border bg-card shadow-soft transition-all hover:-translate-y-0.5 hover:shadow-pop">
              <button type="button" onClick={() => setPlacing([p.id])} className="block w-full bg-white" title={m.place}>
                {/* eslint-disable-next-line @next/next/no-img-element -- catalogue data URL */}
                <img src={p.image} alt={p.name} className="aspect-[4/3] w-full object-contain" />
              </button>
              <div className="space-y-1 p-3.5">
                <div className="flex items-start justify-between gap-2">
                  <p className="line-clamp-2 text-sm font-medium leading-snug">{p.name}</p>
                  <Menu
                    label={m.actions}
                    up
                    triggerClassName="grid h-7 w-7 shrink-0 place-items-center rounded-md text-muted-foreground hover:bg-muted hover:text-foreground"
                    trigger={<MoreHorizontal className="h-4 w-4" />}
                    items={[
                      { label: m.place, icon: <Wand2 className="h-3.5 w-3.5" />, onSelect: () => setPlacing([p.id]) },
                      { label: m.edit, icon: <Pencil className="h-3.5 w-3.5" />, onSelect: () => setForm({ product: p }) },
                      { label: m.del, icon: <Trash2 className="h-3.5 w-3.5" />, danger: true, onSelect: () => setDeleting(p) },
                    ]}
                  />
                </div>
                <p className="text-xs text-muted-foreground">{t(categoryLabel[p.category])}{p.sku ? ` · ${p.sku}` : ""}</p>
                <div className="flex items-center justify-between pt-1">
                  <span className="font-display text-base font-semibold tabular-nums">{formatTry(p.price, lang)}</span>
                  {dims(p) && <span className="text-[11px] text-muted-foreground">{dims(p)} cm</span>}
                </div>
              </div>
            </article>
          ))}
        </div>
      ) : (
        <div className="flex flex-col items-center gap-3 rounded-2xl border border-dashed border-border px-6 py-16 text-center">
          <span className="grid h-12 w-12 place-items-center rounded-full bg-muted text-muted-foreground"><Sofa className="h-5 w-5" /></span>
          <p className="font-display text-lg font-semibold">{products.length ? m.noMatch : m.emptyTitle}</p>
          {products.length ? (
            <Button variant="outline" onClick={() => { setQuery(""); setCategory("all"); }}>{m.clear}</Button>
          ) : (
            <>
              <p className="max-w-sm text-sm text-muted-foreground">{m.emptyBody}</p>
              <Button className="gap-2" onClick={() => setForm({ product: null })}><Plus className="h-4 w-4" /> {m.add}</Button>
            </>
          )}
        </div>
      )}

      {form && <ProductFormDialog key={form.product?.id ?? "new"} open onClose={() => setForm(null)} product={form.product} />}
      {placing && <PlaceDialog open onClose={() => setPlacing(null)} initialProductIds={placing} />}
      <Dialog open={!!deleting} onClose={() => setDeleting(null)} title={m.delTitle}>
        <div className="space-y-4 p-5">
          <p className="text-sm text-muted-foreground">{m.delBody}</p>
          <div className="flex justify-end gap-2">
            <Button variant="outline" onClick={() => setDeleting(null)}>{m.cancel}</Button>
            <Button
              variant="destructive"
              onClick={async () => {
                if (!deleting) return;
                try {
                  await deleteProduct(deleting.id);
                  toast(m.deleted);
                  setDeleting(null);
                } catch (e) {
                  toast(e instanceof Error ? e.message : String(e), "error");
                }
              }}
            >
              {m.del}
            </Button>
          </div>
        </div>
      </Dialog>
    </div>
  );
}
