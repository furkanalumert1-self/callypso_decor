"use client";

import { useCallback, useEffect, useRef, useState } from "react";
import { Loader2, Search, Store, TriangleAlert, RefreshCw } from "lucide-react";
import { Dialog } from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { toast } from "@/components/ui/toast";
import { useLang } from "@/components/i18n/language-provider";
import { categoryLabel, type ProductCategory } from "@/lib/demo/products";
import { importProducts, useProducts, type NewProduct } from "@/lib/data";
import { cn } from "@/lib/utils";

type Item = {
  id: string; title: string; url: string | null; productType: string; sku: string; price: number;
  imageUrl: string | null; category: ProductCategory; width?: number; depth?: number; height?: number;
};
type Page = { configured: boolean; error?: string; shop?: string; currency?: string; products?: Item[]; nextCursor?: string | null };

const CATEGORIES = Object.keys(categoryLabel) as ProductCategory[];
const CHUNK = 25;

/** Browse the firm's Shopify products and import the chosen ones into the catalogue. */
export function ShopifyImportDialog({ open, onClose }: { open: boolean; onClose: () => void }) {
  const { lang, t } = useLang();
  const { products: catalogue } = useProducts();
  const [state, setState] = useState<"loading" | "ready" | "unconfigured" | "error">("loading");
  const [error, setError] = useState("");
  const [shop, setShop] = useState({ name: "", currency: "TRY" });
  const [items, setItems] = useState<Item[]>([]);
  const [cursor, setCursor] = useState<string | null>(null);
  const [query, setQuery] = useState("");
  const [selected, setSelected] = useState<Record<string, ProductCategory>>({});
  const [loadingMore, setLoadingMore] = useState(false);
  const [importing, setImporting] = useState(false);
  const request = useRef(0);

  const m = {
    tr: {
      title: "Shopify'dan içe aktar", search: "Ürün adı ya da SKU ara…", selectAll: "Görünenleri seç", none: "Seçimi temizle",
      more: "Daha fazla yükle", import: (n: number) => `${n} ürünü içe aktar`, importing: "İçe aktarılıyor…", inCatalog: "Katalogda",
      noImage: "Görsel yok", empty: "Eşleşen aktif ürün yok.", retry: "Tekrar dene",
      currency: (c: string) => `Fiyatlar mağaza para biriminde (${c}); katalog ₺ olarak gösterir.`,
      setupTitle: "Shopify bağlı değil",
      setup: [
        "Shopify yöneticisinde: Ayarlar → Uygulamalar → Uygulama geliştir → yeni uygulama oluştur.",
        "Admin API erişimine read_products izni ver ve uygulamayı yükle; Admin API erişim anahtarını kopyala.",
        "Vercel → Environment Variables: SHOPIFY_STORE_DOMAIN (ör. magazan.myshopify.com) ve SHOPIFY_ADMIN_ACCESS_TOKEN — ikisi de Secret, NEXT_PUBLIC_ önekisiz.",
        "Redeploy et ve bu pencereyi yeniden aç.",
      ],
      done: (c: number, u: number, s: number) => `${c} ürün eklendi, ${u} güncellendi${s ? `, ${s} görselsiz ürün atlandı` : ""}`,
      memory: "Tarayıcı depolaması doldu — bazı ürünler yalnızca bu oturumda kalır",
    },
    en: {
      title: "Import from Shopify", search: "Search name or SKU…", selectAll: "Select visible", none: "Clear selection",
      more: "Load more", import: (n: number) => `Import ${n} products`, importing: "Importing…", inCatalog: "In catalogue",
      noImage: "No image", empty: "No matching active products.", retry: "Try again",
      currency: (c: string) => `Prices are in the store currency (${c}); the catalogue shows them as ₺.`,
      setupTitle: "Shopify isn't connected",
      setup: [
        "In Shopify admin: Settings → Apps → Develop apps → create an app.",
        "Grant the Admin API read_products scope, install the app and copy the Admin API access token.",
        "Vercel → Environment Variables: SHOPIFY_STORE_DOMAIN (e.g. your-store.myshopify.com) and SHOPIFY_ADMIN_ACCESS_TOKEN — both Secret, no NEXT_PUBLIC_ prefix.",
        "Redeploy and open this dialog again.",
      ],
      done: (c: number, u: number, s: number) => `${c} added, ${u} updated${s ? `, ${s} skipped without an image` : ""}`,
      memory: "Browser storage is full — some products are kept for this session only",
    },
  }[lang];

  const imported = new Set(catalogue.flatMap((p) => (p.source ? [p.source.id] : [])));

  const load = useCallback(async (q: string, after: string | null) => {
    const id = ++request.current;
    const params = new URLSearchParams({ q });
    if (after) params.set("after", after);
    const res = await fetch(`/api/shopify/products?${params}`);
    const page = (await res.json().catch(() => ({ configured: true, error: `HTTP ${res.status}` }))) as Page;
    if (id !== request.current) return; // a newer search superseded this one
    if (!page.configured) return setState("unconfigured");
    if (page.error) {
      setError(page.error);
      return setState("error");
    }
    setShop({ name: page.shop ?? "", currency: page.currency ?? "TRY" });
    setItems((prev) => (after ? [...prev, ...(page.products ?? [])] : page.products ?? []));
    setCursor(page.nextCursor ?? null);
    setState("ready");
  }, []);

  // debounced search (also the initial load)
  useEffect(() => {
    if (!open) return;
    const timer = setTimeout(() => {
      load(query, null).catch((e) => {
        setError(String(e));
        setState("error");
      });
    }, query ? 400 : 0);
    return () => clearTimeout(timer);
  }, [open, query, load]);

  async function more() {
    setLoadingMore(true);
    await load(query, cursor).finally(() => setLoadingMore(false));
  }

  function toggle(item: Item) {
    setSelected((s) => {
      const next = { ...s };
      if (next[item.id]) delete next[item.id];
      else next[item.id] = item.category;
      return next;
    });
  }

  async function runImport() {
    const ids = Object.keys(selected);
    setImporting(true);
    let created = 0, updated = 0, skipped = 0, persisted = true;
    try {
      for (let i = 0; i < ids.length; i += CHUNK) {
        const res = await fetch("/api/shopify/import", {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({ ids: ids.slice(i, i + CHUNK) }),
        });
        const data = (await res.json().catch(() => ({}))) as { products?: (Item & { image: string | null })[]; error?: string };
        if (!res.ok || data.error) throw new Error(data.error || `HTTP ${res.status}`);
        const batch: NewProduct[] = [];
        for (const p of data.products ?? []) {
          if (!p.image) { skipped++; continue; }
          batch.push({
            name: p.title, sku: p.sku, category: selected[p.id] ?? p.category, price: p.price,
            width: p.width, depth: p.depth, height: p.height, image: p.image,
            source: { type: "shopify", id: p.id, url: p.url },
          });
        }
        const r = await importProducts(batch);
        created += r.created; updated += r.updated; persisted &&= r.persisted;
      }
      toast(m.done(created, updated, skipped));
      if (!persisted) toast(m.memory, "info");
      setSelected({});
      onClose();
    } catch (e) {
      toast(e instanceof Error ? e.message : String(e), "error");
    } finally {
      setImporting(false);
    }
  }

  const price = (n: number) =>
    new Intl.NumberFormat(lang === "tr" ? "tr-TR" : "en-US", { style: "currency", currency: shop.currency, maximumFractionDigits: 0 }).format(n);
  const count = Object.keys(selected).length;

  return (
    <Dialog open={open} onClose={onClose} title={shop.name ? `${m.title} · ${shop.name}` : m.title} className="sm:max-w-3xl">
      {state === "unconfigured" ? (
        <div className="space-y-3 p-5 text-sm">
          <p className="flex items-center gap-2 font-medium"><Store className="h-4 w-4 text-primary" /> {m.setupTitle}</p>
          <ol className="list-decimal space-y-1.5 pl-5 text-muted-foreground">
            {m.setup.map((s) => <li key={s}>{s}</li>)}
          </ol>
        </div>
      ) : state === "error" ? (
        <div className="space-y-3 p-5 text-sm">
          <p className="flex items-start gap-2 text-destructive"><TriangleAlert className="mt-0.5 h-4 w-4 shrink-0" /> {error}</p>
          <Button variant="outline" onClick={() => { setState("loading"); load(query, null); }}><RefreshCw className="h-4 w-4" /> {m.retry}</Button>
        </div>
      ) : (
        <div className="space-y-3 p-5">
          <div className="relative">
            <Search className="pointer-events-none absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-muted-foreground" />
            <input
              type="search"
              value={query}
              onChange={(e) => setQuery(e.target.value)}
              placeholder={m.search}
              className="w-full rounded-lg border border-border bg-card py-2 pl-9 pr-3 text-sm outline-none focus:ring-2 focus:ring-ring/40"
            />
          </div>
          {shop.currency !== "TRY" && state === "ready" && <p className="text-xs text-muted-foreground">{m.currency(shop.currency)}</p>}
          <div className="flex items-center gap-3 text-xs">
            <button type="button" className="font-medium text-primary hover:underline" onClick={() => setSelected((s) => ({ ...Object.fromEntries(items.map((i) => [i.id, i.category])), ...s }))}>{m.selectAll}</button>
            {count > 0 && <button type="button" className="text-muted-foreground hover:text-foreground" onClick={() => setSelected({})}>{m.none}</button>}
          </div>

          {state === "loading" ? (
            <div className="space-y-2">{Array.from({ length: 4 }, (_, i) => <div key={i} className="h-16 animate-pulse rounded-lg bg-muted" />)}</div>
          ) : items.length === 0 ? (
            <p className="py-8 text-center text-sm text-muted-foreground">{m.empty}</p>
          ) : (
            <ul className="divide-y divide-border rounded-xl border border-border">
              {items.map((item) => {
                const on = !!selected[item.id];
                const dims = [item.width, item.depth, item.height].filter(Boolean).join(" × ");
                return (
                  <li key={item.id} className={cn("flex items-center gap-3 px-3 py-2", on && "bg-primary/5")}>
                    <input type="checkbox" checked={on} onChange={() => toggle(item)} aria-label={item.title} className="h-4 w-4 accent-[var(--color-primary)]" />
                    <button type="button" onClick={() => toggle(item)} className="grid h-12 w-12 shrink-0 place-items-center overflow-hidden rounded-md bg-white ring-1 ring-border">
                      {item.imageUrl ? (
                        // eslint-disable-next-line @next/next/no-img-element -- Shopify CDN thumbnail
                        <img src={item.imageUrl} alt="" className="h-full w-full object-contain" />
                      ) : (
                        <span className="px-1 text-center text-[9px] text-muted-foreground">{m.noImage}</span>
                      )}
                    </button>
                    <div className="min-w-0 flex-1">
                      <p className="truncate text-sm font-medium">
                        {item.title}
                        {imported.has(item.id) && <span className="ml-2 rounded-full bg-success/12 px-1.5 py-0.5 text-[10px] font-medium text-success">{m.inCatalog}</span>}
                      </p>
                      <p className="truncate text-xs text-muted-foreground">
                        {[item.sku, item.productType, dims && `${dims} cm`].filter(Boolean).join(" · ")}
                      </p>
                    </div>
                    <select
                      aria-label={`${item.title} — ${t(categoryLabel[item.category])}`}
                      value={selected[item.id] ?? item.category}
                      onChange={(e) => setSelected((s) => ({ ...s, [item.id]: e.target.value as ProductCategory }))}
                      className="hidden rounded-md border border-border bg-card px-2 py-1 text-xs sm:block"
                    >
                      {CATEGORIES.map((c) => <option key={c} value={c}>{t(categoryLabel[c])}</option>)}
                    </select>
                    <span className="w-20 shrink-0 text-right text-sm tabular-nums">{item.price > 0 ? price(item.price) : "—"}</span>
                  </li>
                );
              })}
            </ul>
          )}
          {cursor && state === "ready" && (
            <div className="text-center">
              <Button variant="outline" size="sm" onClick={more} disabled={loadingMore}>{loadingMore && <Loader2 className="h-4 w-4 animate-spin" />} {m.more}</Button>
            </div>
          )}
        </div>
      )}

      {state === "ready" && (
        <div className="sticky bottom-0 flex justify-end border-t border-border bg-background px-5 py-3.5">
          <Button onClick={runImport} disabled={!count || importing}>
            {importing && <Loader2 className="h-4 w-4 animate-spin" />} {importing ? m.importing : m.import(count)}
          </Button>
        </div>
      )}
    </Dialog>
  );
}
