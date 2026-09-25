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
