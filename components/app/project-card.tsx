"use client";

import { useRef, useState } from "react";
import { Layers, Heart, Sofa, CircleCheckBig, MoreHorizontal, Pencil, Share2, Download, Trash2, CheckCircle2 } from "lucide-react";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Dialog } from "@/components/ui/dialog";
import { Menu } from "@/components/ui/menu";
import { toast } from "@/components/ui/toast";
import { RoomScene } from "@/components/room-scene";
import { BeforeAfter } from "@/components/before-after";
import { useLang } from "@/components/i18n/language-provider";
import { statusLabel, statusTone } from "@/lib/demo/data";
import { deleteProject, updateProject, type Project } from "@/lib/data";
import { copyText, downloadImage, downloadSvg } from "@/lib/image";

/** Project card with before/after + actions menu (rename, approve, share, download, delete). */
export function ProjectCard({ p }: { p: Project }) {
  const { lang, t } = useLang();
  const media = useRef<HTMLDivElement>(null);
  const [renaming, setRenaming] = useState(false);
  const [name, setName] = useState(p.place);
  const [confirmDelete, setConfirmDelete] = useState(false);
  const [busy, setBusy] = useState(false);

  const m = {
    tr: { before: "Önce", after: "Sonra", variants: "varyant", saved: "favori", products: "ürün", actions: "İşlemler", rename: "Yeniden adlandır",
      approve: "Onayla", unapprove: "Onayı kaldır", share: "Bağlantıyı paylaş", download: "İndir", del: "Sil",
      renameTitle: "Projeyi yeniden adlandır", save: "Kaydet", cancel: "Vazgeç", delTitle: "Proje silinsin mi?",
      delBody: "Bu proje ve görselleri kalıcı olarak silinecek.", renamed: "Proje güncellendi", approved: "Proje onaylandı",
      unapproved: "Onay kaldırıldı", copied: "Bağlantı panoya kopyalandı", deleted: "Proje silindi", dlFail: "İndirme başarısız" },
    en: { before: "Before", after: "After", variants: "variants", saved: "saved", products: "products", actions: "Actions", rename: "Rename",
      approve: "Approve", unapprove: "Remove approval", share: "Share link", download: "Download", del: "Delete",
      renameTitle: "Rename project", save: "Save", cancel: "Cancel", delTitle: "Delete this project?",
      delBody: "This project and its images will be permanently deleted.", renamed: "Project updated", approved: "Project approved",
      unapproved: "Approval removed", copied: "Link copied to clipboard", deleted: "Project deleted", dlFail: "Download failed" },
  }[lang];

  const run = async (fn: () => Promise<unknown>, ok: string) => {
    setBusy(true);
    try {
      await fn();
      toast(ok);
      return true;
    } catch (e) {
      toast(e instanceof Error ? e.message : String(e), "error");
      return false;
    } finally {
      setBusy(false);
    }
  };

  async function download() {
    const file = `callypso-decor-${p.style}-${p.id.slice(0, 6)}`;
    try {
      if (p.imageAfter || p.imageBefore) await downloadImage((p.imageAfter ?? p.imageBefore)!, file);
      else {
        const svg = media.current?.querySelector("svg");
        if (!svg) throw new Error();
        downloadSvg(svg, file);
      }
    } catch {
      toast(m.dlFail, "error");
    }
  }

  const approved = p.status === "approved";
  const images = p.imageBefore ? { before: p.imageBefore, after: p.imageAfter } : undefined;

  return (
    <article id={p.id} className="group scroll-mt-24 overflow-hidden rounded-2xl border border-border bg-card shadow-soft transition-all hover:-translate-y-0.5 hover:shadow-pop">
      <div ref={media} className="relative">
        {p.status === "uploaded" && !images?.after ? (
          <div className="relative">
            {images ? (
              // eslint-disable-next-line @next/next/no-img-element -- stored data URL
              <img src={images.before} alt={m.before} className="aspect-[4/3] w-full object-cover" />
            ) : (
              <RoomScene style={p.style} furnished={false} className="aspect-[4/3] w-full" />
            )}
            <span className="absolute left-2.5 top-2.5 rounded-full bg-black/45 px-2 py-0.5 text-[10px] font-medium text-white backdrop-blur">{m.before}</span>
          </div>
        ) : (
          <BeforeAfter style={p.style} images={images} labels={{ before: m.before, after: m.after }} />
        )}
        <Badge tone={statusTone[p.status]} className="absolute right-2.5 top-2.5 shadow-sm">{t(statusLabel[p.status])}</Badge>
      </div>
      <div className="p-4">
        <div className="flex items-center justify-between gap-2">
          <p className="truncate font-medium">{t(p.room)}</p>
          <span className="shrink-0 text-xs text-muted-foreground">{t(p.styleName)}</span>
        </div>
        <p className="truncate text-xs text-muted-foreground">{p.place}</p>
        <div className="mt-3 flex items-center gap-3 border-t border-border pt-3 text-xs text-muted-foreground">
          <span className="inline-flex items-center gap-1"><Layers className="h-3.5 w-3.5" />{p.variants} {m.variants}</span>
          {p.products?.length ? (
            <span className="inline-flex items-center gap-1" title={p.products.map((x) => x.name).join(", ")}>
              <Sofa className="h-3.5 w-3.5" />{p.products.length} {m.products}
            </span>
          ) : (
            <span className="inline-flex items-center gap-1"><Heart className="h-3.5 w-3.5" />{p.saved} {m.saved}</span>
          )}
          {approved && <CircleCheckBig className="h-3.5 w-3.5 text-success" />}
          <Menu
            label={m.actions}
            up
            className="ml-auto"
            triggerClassName="grid h-7 w-7 place-items-center rounded-md text-muted-foreground hover:bg-muted hover:text-foreground"
            trigger={<MoreHorizontal className="h-4 w-4" />}
            items={[
              { label: m.rename, icon: <Pencil className="h-3.5 w-3.5" />, onSelect: () => { setName(p.place); setRenaming(true); } },
              {
                label: approved ? m.unapprove : m.approve, icon: <CheckCircle2 className="h-3.5 w-3.5" />,
                onSelect: () => run(() => updateProject(p.id, { status: approved ? "ready" : "approved" }), approved ? m.unapproved : m.approved),
              },
              {
                label: m.share, icon: <Share2 className="h-3.5 w-3.5" />,
                onSelect: () => run(() => copyText(`${window.location.origin}/projects#${p.id}`), m.copied),
              },
              { label: m.download, icon: <Download className="h-3.5 w-3.5" />, onSelect: download },
              { label: m.del, icon: <Trash2 className="h-3.5 w-3.5" />, danger: true, onSelect: () => setConfirmDelete(true) },
            ]}
          />
        </div>
      </div>

      <Dialog open={renaming} onClose={() => setRenaming(false)} title={m.renameTitle}>
        <form
          className="space-y-4 p-5"
          onSubmit={async (e) => {
            e.preventDefault();
            if (!name.trim()) return;
            if (await run(() => updateProject(p.id, { place: name.trim() }), m.renamed)) setRenaming(false);
          }}
        >
          <input
            autoFocus
            value={name}
            onChange={(e) => setName(e.target.value)}
            className="w-full rounded-lg border border-border bg-card px-3 py-2 text-sm outline-none focus:ring-2 focus:ring-ring/40"
          />
          <div className="flex justify-end gap-2">
            <Button type="button" variant="outline" onClick={() => setRenaming(false)}>{m.cancel}</Button>
            <Button type="submit" disabled={busy || !name.trim()}>{m.save}</Button>
          </div>
        </form>
      </Dialog>

      <Dialog open={confirmDelete} onClose={() => setConfirmDelete(false)} title={m.delTitle}>
        <div className="space-y-4 p-5">
          <p className="text-sm text-muted-foreground">{m.delBody}</p>
          <div className="flex justify-end gap-2">
            <Button variant="outline" onClick={() => setConfirmDelete(false)}>{m.cancel}</Button>
            <Button
              variant="destructive"
              disabled={busy}
              onClick={async () => { if (await run(() => deleteProject(p.id), m.deleted)) setConfirmDelete(false); }}
            >
              {m.del}
            </Button>
          </div>
        </div>
      </Dialog>
    </article>
  );
}

/** Skeleton grid while projects load. */
export function ProjectGridSkeleton({ count = 3 }: { count?: number }) {
  return (
    <>
      {Array.from({ length: count }, (_, i) => (
        <div key={i} className="overflow-hidden rounded-2xl border border-border bg-card">
          <div className="aspect-[4/3] animate-pulse bg-muted" />
          <div className="space-y-2 p-4">
            <div className="h-4 w-2/3 animate-pulse rounded bg-muted" />
            <div className="h-3 w-1/3 animate-pulse rounded bg-muted" />
          </div>
        </div>
      ))}
    </>
  );
}
