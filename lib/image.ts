"use client";

/** Browser-side image helpers: resize uploads, demo colour-grade, downloads. */

function loadImage(src: string): Promise<HTMLImageElement> {
  return new Promise((resolve, reject) => {
    const img = new Image();
    img.crossOrigin = "anonymous";
    img.onload = () => resolve(img);
    img.onerror = () => reject(new Error("Image could not be loaded"));
    img.src = src;
  });
}

function canvasFor(img: HTMLImageElement, max: number) {
  const scale = Math.min(1, max / Math.max(img.naturalWidth, img.naturalHeight));
  const canvas = document.createElement("canvas");
  canvas.width = Math.round(img.naturalWidth * scale);
  canvas.height = Math.round(img.naturalHeight * scale);
  const ctx = canvas.getContext("2d");
  if (!ctx) throw new Error("Canvas not supported");
  ctx.drawImage(img, 0, 0, canvas.width, canvas.height);
  return { canvas, ctx };
}

/** Read an uploaded file and shrink it to a JPEG data URL (keeps storage small). */
export async function fileToDataUrl(file: File, max = 1024): Promise<string> {
  const url = URL.createObjectURL(file);
  try {
    const { canvas } = canvasFor(await loadImage(url), max);
    return canvas.toDataURL("image/jpeg", 0.82);
  } finally {
    URL.revokeObjectURL(url);
  }
}

/**
 * Demo "result": colour-grades the uploaded photo toward a style palette so the
 * before/after flow works without an AI key. Clearly labelled as a demo.
 */
export async function demoRestyle(src: string, palette: string[], label: string, variant = 0): Promise<string> {
  const { canvas, ctx } = canvasFor(await loadImage(src), 1024);
  const { width: w, height: h } = canvas;
  const a = palette[variant % palette.length];
  const b = palette[(variant + 2) % palette.length];

  const grad = ctx.createLinearGradient(0, 0, variant % 2 ? w : 0, h);
  grad.addColorStop(0, a);
  grad.addColorStop(1, b);
  ctx.globalCompositeOperation = "soft-light";
  ctx.globalAlpha = 0.85;
  ctx.fillStyle = grad;
  ctx.fillRect(0, 0, w, h);
  ctx.globalCompositeOperation = "color";
  ctx.globalAlpha = 0.22;
  ctx.fillStyle = palette[(variant + 1) % palette.length];
  ctx.fillRect(0, 0, w, h);

  ctx.globalCompositeOperation = "source-over";
  ctx.globalAlpha = 1;
  const pad = Math.round(w * 0.02);
  ctx.font = `600 ${Math.max(12, Math.round(w * 0.022))}px system-ui, sans-serif`;
  const tw = ctx.measureText(label).width;
  const th = Math.max(12, Math.round(w * 0.022));
  // Centered at the bottom so object-cover cropping in the UI never hides it.
  const x = (w - tw - th) / 2;
  ctx.fillStyle = "rgba(0,0,0,0.55)";
  ctx.fillRect(x, h - pad - th * 2, tw + th, th * 1.8);
  ctx.fillStyle = "#fff";
  ctx.fillText(label, x + th / 2, h - pad - th * 0.65);
  return canvas.toDataURL("image/jpeg", 0.85);
}

function saveBlob(blob: Blob, filename: string) {
  const url = URL.createObjectURL(blob);
  const a = document.createElement("a");
  a.href = url;
  a.download = filename;
  document.body.appendChild(a);
  a.click();
  a.remove();
  setTimeout(() => URL.revokeObjectURL(url), 1000);
}

/** Download an image (data URL or remote URL) as a real file. */
export async function downloadImage(src: string, filename: string) {
  const res = await fetch(src);
  if (!res.ok) throw new Error("Download failed");
  const blob = await res.blob();
  const ext = blob.type.includes("png") ? "png" : blob.type.includes("svg") ? "svg" : "jpg";
  saveBlob(blob, `${filename}.${ext}`);
}

/** Download an inline <svg> element (the demo RoomScene renders) as an .svg file. */
export function downloadSvg(svg: SVGSVGElement, filename: string) {
  const clone = svg.cloneNode(true) as SVGSVGElement;
  clone.setAttribute("xmlns", "http://www.w3.org/2000/svg");
  saveBlob(new Blob([clone.outerHTML], { type: "image/svg+xml" }), `${filename}.svg`);
}

/** Client-side CSV export. */
export function downloadCsv(rows: (string | number)[][], filename: string) {
  const csv = rows.map((r) => r.map((c) => `"${String(c).replace(/"/g, '""')}"`).join(",")).join("\n");
  saveBlob(new Blob(["﻿" + csv], { type: "text/csv;charset=utf-8" }), `${filename}.csv`);
}

/** Copy text to the clipboard (with a fallback for older browsers). */
export async function copyText(text: string) {
  try {
    await navigator.clipboard.writeText(text);
  } catch {
    const ta = document.createElement("textarea");
    ta.value = text;
    document.body.appendChild(ta);
    ta.select();
    document.execCommand("copy");
    ta.remove();
  }
}

/**
 * Crop-and-resize `src` to exactly the pixel size of `ref` (object-cover), so a
 * generated "after" lines up with the uploaded "before". Falls back to `src`
 * when the image can't be read (e.g. a remote URL without CORS).
 */
export async function alignTo(src: string, ref: string): Promise<string> {
  try {
    const [img, base] = await Promise.all([loadImage(src), loadImage(ref)]);
    const canvas = document.createElement("canvas");
    canvas.width = base.naturalWidth;
    canvas.height = base.naturalHeight;
    const ctx = canvas.getContext("2d");
    if (!ctx) return src;
    const scale = Math.max(canvas.width / img.naturalWidth, canvas.height / img.naturalHeight);
    const w = img.naturalWidth * scale;
    const h = img.naturalHeight * scale;
    ctx.drawImage(img, (canvas.width - w) / 2, (canvas.height - h) / 2, w, h);
    return canvas.toDataURL("image/jpeg", 0.88);
  } catch {
    return src;
  }
}

/** Rasterise any image (incl. SVG) to a JPEG data URL — the image models need raster input. */
export async function toJpeg(src: string, max = 1024): Promise<string> {
  const img = await loadImage(src);
  const scale = Math.min(1, max / Math.max(img.naturalWidth, img.naturalHeight));
  const canvas = document.createElement("canvas");
  canvas.width = Math.round(img.naturalWidth * scale);
  canvas.height = Math.round(img.naturalHeight * scale);
  const ctx = canvas.getContext("2d")!;
  ctx.fillStyle = "#fff"; // transparent PNG/SVG → white studio background
  ctx.fillRect(0, 0, canvas.width, canvas.height);
  ctx.drawImage(img, 0, 0, canvas.width, canvas.height);
  return canvas.toDataURL("image/jpeg", 0.88);
}

export async function imageAspect(src: string): Promise<number> {
  const img = await loadImage(src);
  return img.naturalWidth / img.naturalHeight;
}

/** Product photo with its near-white studio background made transparent (soft edge). */
function cutout(img: HTMLImageElement, w: number, h: number): HTMLCanvasElement {
  const c = document.createElement("canvas");
  c.width = Math.max(1, w);
  c.height = Math.max(1, h);
  const ctx = c.getContext("2d", { willReadFrequently: true })!;
  ctx.drawImage(img, 0, 0, c.width, c.height);
  const px = ctx.getImageData(0, 0, c.width, c.height);
  const d = px.data;
  for (let i = 0; i < d.length; i += 4) {
    const min = Math.min(d[i], d[i + 1], d[i + 2]);
    if (min > 238) d[i + 3] = 0;
    else if (min > 222) d[i + 3] = Math.round((255 * (238 - min)) / 16);
  }
  ctx.putImageData(px, 0, 0);
  return c;
}

/** Share of the room photo's width a product of this category roughly takes up. */
const DEMO_WIDTH: Record<string, number> = { sofa: 0.4, bed: 0.45, rug: 0.5, storage: 0.3, table: 0.22, armchair: 0.17, lamp: 0.08, decor: 0.08 };

/**
 * Demo placement without an AI key: composites each catalogue photo into the
 * room at its marked spot (bottom-centre anchored), with the white studio
 * background keyed out. Clearly labelled as a demo.
 */
export async function demoPlace(
  room: string,
  items: { image: string; category: string; spot?: { x: number; y: number } }[],
  label: string,
): Promise<string> {
  const { canvas, ctx } = canvasFor(await loadImage(room), 1024);
  const { width: w, height: h } = canvas;
  const defaults = [{ x: 0.5, y: 0.75 }, { x: 0.25, y: 0.8 }, { x: 0.75, y: 0.8 }];
  // back-to-front so nearer items overlap farther ones
  const ordered = items.map((it, i) => ({ ...it, spot: it.spot ?? defaults[i % 3] })).sort((a, b) => a.spot.y - b.spot.y);
  for (const it of ordered) {
    const img = await loadImage(it.image);
    const depthScale = 0.6 + 0.6 * it.spot.y; // farther (higher in frame) → smaller
    const pw = w * (DEMO_WIDTH[it.category] ?? 0.2) * depthScale;
    const ph = pw * (img.naturalHeight / img.naturalWidth);
    const x = it.spot.x * w - pw / 2;
    const y = it.spot.y * h - ph;
    ctx.save();
    ctx.globalAlpha = 0.18;
    ctx.fillStyle = "#000";
    ctx.beginPath();
    ctx.ellipse(it.spot.x * w, it.spot.y * h - ph * 0.03, pw * 0.45, ph * 0.06, 0, 0, Math.PI * 2);
    ctx.fill();
    ctx.restore();
    ctx.drawImage(cutout(img, Math.round(pw), Math.round(ph)), x, y, pw, ph);
  }
  const th = Math.max(12, Math.round(w * 0.022));
  ctx.font = `600 ${th}px system-ui, sans-serif`;
  const tw = ctx.measureText(label).width;
  const lx = (w - tw - th) / 2;
  const pad = Math.round(w * 0.02);
  ctx.fillStyle = "rgba(0,0,0,0.55)";
  ctx.fillRect(lx, h - pad - th * 2, tw + th, th * 1.8);
  ctx.fillStyle = "#fff";
  ctx.fillText(label, lx + th / 2, h - pad - th * 0.65);
  return canvas.toDataURL("image/jpeg", 0.88);
}
