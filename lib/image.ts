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

/** Sobel edge magnitude + direction of an image drawn (object-cover) at `w`×`h`. */
function edgeMap(img: HTMLImageElement, w: number, h: number) {
  const canvas = document.createElement("canvas");
  canvas.width = w;
  canvas.height = h;
  const ctx = canvas.getContext("2d", { willReadFrequently: true })!;
  const scale = Math.max(w / img.naturalWidth, h / img.naturalHeight);
  ctx.drawImage(img, (w - img.naturalWidth * scale) / 2, (h - img.naturalHeight * scale) / 2, img.naturalWidth * scale, img.naturalHeight * scale);
  const { data } = ctx.getImageData(0, 0, w, h);
  const g = new Float32Array(w * h);
  for (let i = 0; i < w * h; i++) g[i] = 0.299 * data[i * 4] + 0.587 * data[i * 4 + 1] + 0.114 * data[i * 4 + 2];
  const mag = new Float32Array(w * h);
  const dir = new Float32Array(w * h);
  for (let y = 1; y < h - 1; y++) {
    for (let x = 1; x < w - 1; x++) {
      const i = y * w + x;
      const gx = g[i - w + 1] + 2 * g[i + 1] + g[i + w + 1] - g[i - w - 1] - 2 * g[i - 1] - g[i + w - 1];
      const gy = g[i + w - 1] + 2 * g[i + w] + g[i + w + 1] - g[i - w - 1] - 2 * g[i - w] - g[i - w + 1];
      mag[i] = Math.hypot(gx, gy);
      dir[i] = Math.atan2(gy, gx);
    }
  }
  return { mag, dir };
}

function percentile(values: Float32Array, p: number) {
  const sorted = Float32Array.from(values).sort();
  return sorted[Math.floor(sorted.length * p)];
}

/** Below this, the result likely redrew the room rather than staging it. */
export const STRUCTURE_WARN_BELOW = 0.7;

/**
 * 0–1: how much of the room's architecture (strongest edges in the upper 60%
 * of the "before" — windows, doors, wall and ceiling lines) reappears in the
 * "after" at the same place with the same direction. Furniture mostly sits low
 * in the frame, so it's excluded. Calibrated on a structure-preserving staging
 * (~0.89) vs a result that invented new windows/doors (~0.52).
 */
export async function structureScore(before: string, after: string): Promise<number | null> {
  try {
    const [a, b] = await Promise.all([loadImage(before), loadImage(after)]);
    const w = 192;
    const h = Math.round((w * a.naturalHeight) / a.naturalWidth);
    const eb = edgeMap(a, w, h);
    const ea = edgeMap(b, w, h);
    const rows = Math.round(h * 0.6);
    const tb = percentile(eb.mag.subarray(0, rows * w), 0.9);
    const ta = percentile(ea.mag.subarray(0, rows * w), 0.85);
    const maxAngle = Math.PI / 6;
    let total = 0;
    let kept = 0;
    for (let y = 2; y < rows; y++) {
      for (let x = 2; x < w - 2; x++) {
        const i = y * w + x;
        if (eb.mag[i] < tb) continue;
        total++;
        search: for (let dy = -1; dy <= 1; dy++) {
          for (let dx = -1; dx <= 1; dx++) {
            const j = i + dy * w + dx;
            if (ea.mag[j] < ta) continue;
            let d = Math.abs(eb.dir[i] - ea.dir[j]) % Math.PI;
            d = Math.min(d, Math.PI - d);
            if (d < maxAngle) { kept++; break search; }
          }
        }
      }
    }
    return total ? kept / total : null;
  } catch {
    return null;
  }
}
