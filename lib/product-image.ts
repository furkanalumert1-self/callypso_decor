import sharp from "sharp";

/**
 * Server-only: turn a catalogue photo (often a website screenshot with UI text,
 * price tags or other products around it) into a clean product shot:
 *   1. fal BiRefNet removes the background (FAL_KEY),
 *   2. keep only the largest foreground object — drops stray text, icons and
 *      neighbouring thumbnails the segmenter also picked up,
 *   3. crop to it, pad, flatten onto white, JPEG.
 * Returns the original image if anything fails.
 */
const MODEL = "fal-ai/birefnet/v2";

export interface CleanedProduct {
  /** Product on white, JPEG data URL (for the image model / checks). */
  image: string;
  /** Transparent cut-out (PNG) cropped to the product, for compositing; null if cleaning failed. */
  cutout: Buffer | null;
  cleaned: boolean;
}

export async function cleanProductImage(dataUrl: string): Promise<CleanedProduct> {
  const key = process.env.FAL_KEY;
  const original = { image: dataUrl, cutout: null, cleaned: false };
  if (!key) return original;
  try {
    const res = await fetch(`https://fal.run/${MODEL}`, {
      method: "POST",
      headers: { Authorization: `Key ${key}`, "Content-Type": "application/json" },
      body: JSON.stringify({ image_url: dataUrl, model: "General Use (Heavy)", output_format: "png", refine_foreground: true }),
    });
    if (!res.ok) return original;
    const url = ((await res.json()) as { image?: { url?: string } }).image?.url;
    if (!url) return original;
    const png = Buffer.from(await (await fetch(url)).arrayBuffer());
    const { jpeg, cutout } = await isolateLargestObject(png);
    return { image: jpeg, cutout, cleaned: true };
  } catch {
    return original;
  }
}

/** Crop a transparent PNG to its largest opaque component → { flattened JPEG data URL, transparent PNG cut-out }. */
export async function isolateLargestObject(png: Buffer): Promise<{ jpeg: string; cutout: Buffer }> {
  const img = sharp(png).ensureAlpha();
  const { width = 0, height = 0 } = await img.metadata();
  if (!width || !height) throw new Error("empty image");

  // connected components on a small alpha mask
  const S = 256;
  const scale = Math.min(1, S / Math.max(width, height));
  const mw = Math.max(1, Math.round(width * scale));
  const mh = Math.max(1, Math.round(height * scale));
  const alpha = await sharp(png).ensureAlpha().extractChannel("alpha").resize(mw, mh, { fit: "fill" }).raw().toBuffer();
  const label = new Int32Array(mw * mh).fill(-1);
  let best = { size: 0, x0: 0, y0: 0, x1: mw - 1, y1: mh - 1, id: -1 };
  let next = 0;
  const stack: number[] = [];
  for (let i = 0; i < mw * mh; i++) {
    if (alpha[i] < 128 || label[i] !== -1) continue;
    const id = next++;
    let size = 0, x0 = mw, y0 = mh, x1 = 0, y1 = 0;
    label[i] = id;
    stack.push(i);
    while (stack.length) {
      const p = stack.pop()!;
      const x = p % mw, y = (p - x) / mw;
      size++;
      if (x < x0) x0 = x; if (x > x1) x1 = x; if (y < y0) y0 = y; if (y > y1) y1 = y;
      for (const q of [p - 1, p + 1, p - mw, p + mw]) {
        if (q < 0 || q >= mw * mh || label[q] !== -1 || alpha[q] < 128) continue;
        if ((q === p - 1 && x === 0) || (q === p + 1 && x === mw - 1)) continue;
        label[q] = id;
        stack.push(q);
      }
    }
    if (size > best.size) best = { size, x0, y0, x1, y1, id };
  }
  if (best.id < 0) throw new Error("no foreground");

  // erase every other component (at mask resolution, scaled back up) then crop
  // 1px dilation at mask resolution so upscaling doesn't nibble the product's edges
  const keep = Buffer.alloc(mw * mh);
  for (let i = 0; i < mw * mh; i++) {
    if (label[i] !== best.id) continue;
    const x = i % mw;
    keep[i] = 255;
    if (x > 0) keep[i - 1] = 255;
    if (x < mw - 1) keep[i + 1] = 255;
    if (i >= mw) keep[i - mw] = 255;
    if (i < mw * (mh - 1)) keep[i + mw] = 255;
  }
  // sharp promotes 1-channel raw input to sRGB on output → take channel 0 explicitly
  const keepMask = await sharp(keep, { raw: { width: mw, height: mh, channels: 1 } })
    .resize(width, height, { fit: "fill", kernel: "nearest" })
    .extractChannel(0)
    .raw()
    .toBuffer();
  if (keepMask.length !== width * height) throw new Error("unexpected mask size");
  const rgba = await sharp(png).ensureAlpha().raw().toBuffer();
  for (let i = 0; i < width * height; i++) if (!keepMask[i]) rgba[i * 4 + 3] = 0;

  const pad = 0.04;
  const left = Math.max(0, Math.floor((best.x0 / scale) - width * pad));
  const top = Math.max(0, Math.floor((best.y0 / scale) - height * pad));
  const right = Math.min(width, Math.ceil(((best.x1 + 1) / scale) + width * pad));
  const bottom = Math.min(height, Math.ceil(((best.y1 + 1) / scale) + height * pad));

  const cutout = await sharp(rgba, { raw: { width, height, channels: 4 } })
    .extract({ left, top, width: right - left, height: bottom - top })
    .resize(1024, 1024, { fit: "inside", withoutEnlargement: true })
    .png()
    .toBuffer();
  const jpeg = await sharp(cutout).flatten({ background: "#ffffff" }).jpeg({ quality: 90 }).toBuffer();
  return { jpeg: `data:image/jpeg;base64,${jpeg.toString("base64")}`, cutout };
}
