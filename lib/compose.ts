import sharp from "sharp";
import { isolateLargestObject } from "@/lib/product-image";

/**
 * Server-only: paste product cut-outs into the room photo at planned boxes.
 * The image model then only has to *harmonise* one image (lighting, shadows,
 * perspective) instead of assembling several — which is where multi-image
 * editing broke down (collages, duplicates, rugs hung on walls).
 */

/** Where an item goes, as fractions of the room photo. */
export interface Box {
  /** horizontal centre, 0 (left) – 1 (right) */
  cx: number;
  /** y of the item's floor contact line (wall art: its lower frame edge), 0 (top) – 1 (bottom) */
  bottom: number;
  /** apparent width in the photo, as a fraction of the photo width */
  width: number;
}

export interface ComposeItem {
  cutout: Buffer | null;     // transparent PNG from cleaning
  fallback: string;          // product-on-white JPEG data URL (used when there is no cut-out)
  category: string;          // ProductCategory
  box: Box;
}

const clamp = (v: number, lo: number, hi: number) => Math.min(hi, Math.max(lo, v));
const fromDataUrl = (d: string) => Buffer.from(d.slice(d.indexOf(",") + 1), "base64");

/**
 * RGBA buffer of the product. Without a cut-out (background removal failed),
 * key out the backdrop colour sampled from the photo's corners (white studio,
 * grey carpet, …) and keep only the largest remaining object, cropped.
 */
async function productRGBA(item: ComposeItem) {
  let png = item.cutout;
  if (!png) {
    const { data, info } = await sharp(fromDataUrl(item.fallback)).ensureAlpha().raw().toBuffer({ resolveWithObject: true });
    const { width: w, height: h } = info;
    const patch = Math.max(2, Math.round(Math.min(w, h) * 0.04));
    const samples: number[][] = [];
    for (const [ox, oy] of [[0, 0], [w - patch, 0], [0, h - patch], [w - patch, h - patch]]) {
      for (let y = oy; y < oy + patch; y++) for (let x = ox; x < ox + patch; x++) {
        const i = (y * w + x) * 4;
        samples.push([data[i], data[i + 1], data[i + 2]]);
      }
    }
    const median = (c: number) => samples.map((s) => s[c]).sort((a, b) => a - b)[samples.length >> 1];
    const bg = [median(0), median(1), median(2)];
    for (let i = 0; i < data.length; i += 4) {
      const d = Math.hypot(data[i] - bg[0], data[i + 1] - bg[1], data[i + 2] - bg[2]);
      data[i + 3] = d < 28 ? 0 : d < 48 ? Math.round((255 * (d - 28)) / 20) : 255;
    }
    const keyed = await sharp(data, { raw: { width: w, height: h, channels: 4 } }).png().toBuffer();
    png = (await isolateLargestObject(keyed).catch(() => ({ cutout: keyed }))).cutout;
  }
  const { data, info } = await sharp(png).ensureAlpha().raw().toBuffer({ resolveWithObject: true });
  return { data, width: info.width, height: info.height };
}

/** Solve the 3×3 homography mapping the unit-square corners (0,0),(1,0),(1,1),(0,1) onto `q`. */
function squareToQuad(q: [number, number][]) {
  const [[x0, y0], [x1, y1], [x2, y2], [x3, y3]] = q;
  const dx1 = x1 - x2, dx2 = x3 - x2, dy1 = y1 - y2, dy2 = y3 - y2;
  const sx = x0 - x1 + x2 - x3, sy = y0 - y1 + y2 - y3;
  const den = dx1 * dy2 - dx2 * dy1;
  const g = (sx * dy2 - dx2 * sy) / den;
  const h = (dx1 * sy - sx * dy1) / den;
  return [x1 - x0 + g * x1, x3 - x0 + h * x3, x0, y1 - y0 + g * y1, y3 - y0 + h * y3, y0, g, h, 1];
}

function invert3(m: number[]) {
  const [a, b, c, d, e, f, g, h, i] = m;
  const A = e * i - f * h, B = -(d * i - f * g), C = d * h - e * g;
  const det = a * A + b * B + c * C;
  return [A / det, -(b * i - c * h) / det, (b * f - c * e) / det, B / det, (a * i - c * g) / det, -(a * f - c * d) / det, C / det, -(a * h - b * g) / det, (a * e - b * d) / det];
}

/** Warp an RGBA image onto a quad (pixel coords, clockwise from top-left) — bilinear, returns the quad's bounding box. */
function warpToQuad(src: { data: Buffer; width: number; height: number }, quad: [number, number][]) {
  const minX = Math.floor(Math.min(...quad.map((p) => p[0]))), maxX = Math.ceil(Math.max(...quad.map((p) => p[0])));
  const minY = Math.floor(Math.min(...quad.map((p) => p[1]))), maxY = Math.ceil(Math.max(...quad.map((p) => p[1])));
  const w = Math.max(1, maxX - minX), h = Math.max(1, maxY - minY);
  const inv = invert3(squareToQuad(quad.map(([x, y]) => [x - minX, y - minY]) as [number, number][]));
  const out = Buffer.alloc(w * h * 4);
  const { data, width: sw, height: sh } = src;
  for (let y = 0; y < h; y++) {
    for (let x = 0; x < w; x++) {
      const zx = inv[6] * x + inv[7] * y + inv[8];
      const u = (inv[0] * x + inv[1] * y + inv[2]) / zx;
      const v = (inv[3] * x + inv[4] * y + inv[5]) / zx;
      if (u < 0 || u > 1 || v < 0 || v > 1) continue;
      const fx = u * (sw - 1), fy = v * (sh - 1);
      const x0 = Math.floor(fx), y0 = Math.floor(fy), x1 = Math.min(sw - 1, x0 + 1), y1 = Math.min(sh - 1, y0 + 1);
      const ax = fx - x0, ay = fy - y0;
      const o = (y * w + x) * 4;
      for (let c = 0; c < 4; c++) {
        const p00 = data[(y0 * sw + x0) * 4 + c], p10 = data[(y0 * sw + x1) * 4 + c];
        const p01 = data[(y1 * sw + x0) * 4 + c], p11 = data[(y1 * sw + x1) * 4 + c];
        out[o + c] = Math.round((p00 * (1 - ax) + p10 * ax) * (1 - ay) + (p01 * (1 - ax) + p11 * ax) * ay);
      }
    }
  }
  return { data: out, width: w, height: h, left: minX, top: minY };
}

const shadowSvg = (w: number, h: number) =>
  Buffer.from(
    `<svg xmlns="http://www.w3.org/2000/svg" width="${w}" height="${h}"><defs><filter id="b" x="-50%" y="-50%" width="200%" height="200%"><feGaussianBlur stdDeviation="${Math.max(2, h / 4)}"/></filter></defs><ellipse cx="${w / 2}" cy="${h / 2}" rx="${w * 0.44}" ry="${h * 0.3}" fill="#000" opacity="0.35" filter="url(#b)"/></svg>`,
  );

/** Composite every item into the room; returns a JPEG data URL of the same size as the room photo. */
export async function composeRoom(room: string, items: ComposeItem[]): Promise<string> {
  const base = sharp(fromDataUrl(room)).rotate();
  const { width: W = 0, height: H = 0 } = await base.metadata();
  if (!W || !H) throw new Error("Room photo could not be read");

  // floor → wall → furniture, farther (higher bottom) first
  const rank = (c: string) => (c === "rug" ? 0 : c === "art" ? 1 : 2);
  const ordered = [...items].sort((a, b) => rank(a.category) - rank(b.category) || a.box.bottom - b.box.bottom);

  const layers: sharp.OverlayOptions[] = [];
  for (const item of ordered) {
    let img = await productRGBA(item);
    const bw = clamp(item.box.width, 0.03, 0.95) * W;
    const cx = clamp(item.box.cx, 0, 1) * W;
    const by = clamp(item.box.bottom, 0.05, 1) * H;

    if (item.category === "rug") {
      // top-down rug photo → long side across the room, then a floor trapezoid
      if (img.height > img.width) {
        const { data, info } = await sharp(img.data, { raw: { width: img.width, height: img.height, channels: 4 } }).rotate(90).raw().toBuffer({ resolveWithObject: true });
        img = { data, width: info.width, height: info.height };
      }
      const depth = bw * (img.height / img.width) * 0.45; // foreshortened — deep enough to reach under the seating
      const quad: [number, number][] = [
        [cx - bw * 0.36, by - depth], [cx + bw * 0.36, by - depth], [cx + bw / 2, by], [cx - bw / 2, by],
      ];
      const warped = warpToQuad(img, quad);
      const left = clamp(warped.left, 0, W - 1), top = clamp(warped.top, 0, H - 1);
      const cw = Math.min(warped.width - (left - warped.left), W - left), ch = Math.min(warped.height - (top - warped.top), H - top);
      if (cw < 2 || ch < 2) continue;
      const piece = await sharp(warped.data, { raw: { width: warped.width, height: warped.height, channels: 4 } })
        .extract({ left: left - warped.left, top: top - warped.top, width: cw, height: ch })
        .png()
        .toBuffer();
      layers.push({ input: piece, left, top });
      continue;
    }

    // furniture / wall art: scale to the box, anchor bottom-centre, keep inside the frame
    let w = Math.round(bw);
    let h = Math.round(bw * (img.height / img.width));
    if (h > H * 0.9) { w = Math.round((w * H * 0.9) / h); h = Math.round(H * 0.9); }
    const left = Math.round(clamp(cx - w / 2, 0, W - w));
    const top = Math.round(clamp(by - h, 0, H - h));
    const resized = await sharp(img.data, { raw: { width: img.width, height: img.height, channels: 4 } }).resize(w, h).png().toBuffer();

    if (item.category !== "art") {
      const sh = Math.max(6, Math.round(h * 0.12));
      const sw = Math.round(w * 1.05);
      layers.push({ input: shadowSvg(sw, sh), left: Math.round(clamp(cx - sw / 2, 0, W - sw)), top: Math.round(clamp(top + h - sh * 0.6, 0, H - sh)) });
    }
    layers.push({ input: resized, left, top });
  }

  const out = await base.composite(layers).jpeg({ quality: 92 }).toBuffer();
  return `data:image/jpeg;base64,${out.toString("base64")}`;
}
