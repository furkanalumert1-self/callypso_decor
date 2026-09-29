import { checkPlacement, fallbackLayout, planLayout, type ClaudeIssue, type PlanProduct } from "@/lib/room-analysis";
import { cleanProductImage } from "@/lib/product-image";
import { categoryLabel, type ProductCategory } from "@/lib/demo/products";

/**
 * POST /api/place — place specific catalogue products into a room photo.
 * body: {
 *   room: data URL, aspect: number (width / height),
 *   products: [{ name, category, width?, depth?, height?, image: data URL, spot?: { x, y } (0–1) }],
 *   note?: string, variant?: number
 * }
 *
 * Pipeline (FAL_KEY required, else a demo response):
 *   1. in parallel — clean every product photo (background + stray UI text
 *      removed, cropped to the product) and, with ANTHROPIC_API_KEY, have
 *      Claude plan a designer layout (rule-based layout otherwise);
 *   2. FLUX Kontext Max (multi-image) adds exactly those products per the plan;
 *   3. Claude checks the room structure and each product's fidelity.
 */
export const maxDuration = 120;

const MODEL = "fal-ai/flux-pro/kontext/max/multi";
const MAX_PRODUCTS = 3;
const MAX_IMAGE_CHARS = 4_000_000;
const RATIOS: [string, number][] = [["21:9", 21 / 9], ["16:9", 16 / 9], ["3:2", 3 / 2], ["4:3", 4 / 3], ["1:1", 1], ["3:4", 3 / 4], ["2:3", 2 / 3], ["9:16", 9 / 16]];

type InProduct = { name?: unknown; category?: unknown; width?: unknown; depth?: unknown; height?: unknown; image?: unknown; spot?: { x?: unknown; y?: unknown } };

const isImage = (v: unknown): v is string => typeof v === "string" && /^data:image\/(jpeg|png|webp);base64,/.test(v) && v.length < MAX_IMAGE_CHARS;
const num = (v: unknown) => (typeof v === "number" && Number.isFinite(v) && v > 0 ? Math.round(v) : undefined);
const unit = (v: unknown) => (typeof v === "number" && v >= 0 && v <= 1 ? v : null);

/** Per-category fidelity reminders — patterns and silhouettes are what image models drift on. */
const FIDELITY: Partial<Record<ProductCategory, string>> = {
  rug: "keep its exact pattern, medallions, border and colours; flat on the floor as a straight rectangle aligned with the walls",
  sofa: "keep its exact silhouette, arm shape, back stitching, cushions, fabric colour and leg style",
  armchair: "keep its exact silhouette, arms, fabric colour and legs",
  table: "keep its exact top shape, material and base",
};

export async function POST(req: Request) {
  let body: { room?: unknown; aspect?: unknown; products?: unknown; note?: unknown; variant?: unknown };
  try {
    body = await req.json();
  } catch {
    return Response.json({ error: "Invalid JSON body" }, { status: 400 });
  }

  const { room, aspect, variant } = body;
  const note = typeof body.note === "string" ? body.note : "";
  if (!isImage(room)) return Response.json({ error: "A room photo (JPEG/PNG/WEBP data URL) is required" }, { status: 400 });
  if (!Array.isArray(body.products) || body.products.length === 0 || body.products.length > MAX_PRODUCTS) {
    return Response.json({ error: `Select 1–${MAX_PRODUCTS} products` }, { status: 400 });
  }
  const products = (body.products as InProduct[]).map((p) => {
    const x = unit(p.spot?.x), y = unit(p.spot?.y);
    return {
      name: typeof p.name === "string" ? p.name.slice(0, 80) : "",
      category: (typeof p.category === "string" && p.category in categoryLabel ? p.category : "decor") as ProductCategory,
      width: num(p.width), depth: num(p.depth), height: num(p.height),
      image: p.image as string,
      spot: x !== null && y !== null ? { x, y } : undefined,
    };
  });
  if (products.some((p) => !p.name || !isImage(p.image))) {
    return Response.json({ error: "Every product needs a name and a photo" }, { status: 400 });
  }

  const key = process.env.FAL_KEY;
  if (!key) {
    await new Promise((r) => setTimeout(r, 1500));
    return Response.json({ demo: true });
  }

  const issues: ClaudeIssue[] = [];
  const planInput: PlanProduct[] = products.map((p) => ({ ...p, category: categoryLabel[p.category].en.toLowerCase() }));
  const [cleaned, plan] = await Promise.all([
    Promise.all(products.map((p) => cleanProductImage(p.image))),
    planLayout(room, planInput, note, issues),
  ]);
  const layout = plan ?? fallbackLayout(products);
  const clean = cleaned.map((c) => c.image);

  const ratio = typeof aspect === "number" && aspect > 0 ? aspect : 4 / 3;
  const aspectRatio = RATIOS.reduce((best, r) => (Math.abs(Math.log(r[1] / ratio)) < Math.abs(Math.log(best[1] / ratio)) ? r : best))[0];
  const n = products.length;

  const lines = products.map((p, i) => {
    const dims = [p.width && `${p.width} cm wide`, p.depth && `${p.depth} cm deep`, p.height && `${p.height} cm high`].filter(Boolean).join(" × ");
    const fidelity = FIDELITY[p.category] ? ` Copy it exactly: ${FIDELITY[p.category]}.` : "";
    return `${i + 1}. The product in image ${i + 2}, "${p.name}" (${categoryLabel[p.category].en.toLowerCase()}${dims ? `, ${dims}` : ""}): ${layout.items[i]?.placement ?? "where it naturally belongs"}.${fidelity}`;
  });

  const prompt = [
    `Image 1 is a photo of a customer's room. Each of images 2–${n + 1} shows one catalogue product on a white background.`,
    `Add exactly ${n} ${n === 1 ? "item" : "items"} to the room from image 1 — one of each product below. Never duplicate a product and add no other furniture or decor.`,
    ...lines,
    `Layout: ${layout.composition}`,
    "Reproduce every product faithfully from its image — same shape, proportions, colours, fabric or material, pattern, legs and details. Do not substitute or restyle.",
    "Scale each product realistically from its dimensions and the size of the room. Re-render it from this room photo's camera viewpoint, not the catalogue angle.",
    "Re-light each product to match the room: the same light direction from the windows, colour temperature and exposure, with soft floor shadows and contact shadows under the legs. It must not look pasted in.",
    "The output must be image 1 with the products added: same camera position, angle and framing; same walls, ceiling, floor, windows (with their pane layout), doors and radiators in the same places. Keep doorways clear.",
    layout.fixed_elements.length ? `These must stay exactly as they are: ${layout.fixed_elements.join("; ")}.` : "",
    "No text, letters, logos, watermarks, captions, price tags or interface elements anywhere in the image. Photorealistic, sharp interior photography.",
  ]
    .filter(Boolean)
    .join("\n");

  try {
    const res = await fetch(`https://fal.run/${MODEL}`, {
      method: "POST",
      headers: { Authorization: `Key ${key}`, "Content-Type": "application/json" },
      body: JSON.stringify({
        prompt,
        image_urls: [room, ...clean],
        aspect_ratio: aspectRatio,
        guidance_scale: 3.5,
        output_format: "jpeg",
        ...(typeof variant === "number" && variant > 0 ? { seed: 2000 + variant } : {}),
      }),
    });
    if (!res.ok) return Response.json({ error: `Image service error (${res.status})` }, { status: 502 });
    const data = (await res.json()) as { images?: { url?: string }[] };
    const url = data.images?.[0]?.url;
    if (!url) return Response.json({ error: "Image service returned no image" }, { status: 502 });

    const img = await fetch(url);
    if (!img.ok) return Response.json({ error: `Could not download the result (${img.status})` }, { status: 502 });
    const type = img.headers.get("content-type") ?? "image/jpeg";
    const result = `data:${type};base64,${Buffer.from(await img.arrayBuffer()).toString("base64")}`;
    const check = await checkPlacement(room, result, products.map((p, i) => ({ name: p.name, image: clean[i] })), issues);
    return Response.json({
      demo: false,
      image: result,
      preserved: layout.fixed_elements,
      layout: { planner: plan ? "claude" : "rules", composition: layout.composition },
      cleanedProducts: cleaned.filter((c) => c.cleaned).length,
      check,
      claudeIssue: issues[0] ?? null,
    });
  } catch {
    return Response.json({ error: "Could not reach the image service" }, { status: 502 });
  }
}
