import { checkPlacement, fallbackLayout, planLayout, type ClaudeIssue, type PlanProduct } from "@/lib/room-analysis";
import { cleanProductImage } from "@/lib/product-image";
import { composeRoom } from "@/lib/compose";
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
 *   1. in parallel — cut every product out of its photo (background and stray
 *      UI text removed) and plan the layout: Claude returns a placement box per
 *      product (ANTHROPIC_API_KEY), rule-based boxes otherwise;
 *   2. paste the cut-outs into the room at those boxes (rugs warped flat onto
 *      the floor, art on the wall) — count, position and look are now fixed;
 *   3. FLUX Kontext Max harmonises that ONE image: perspective, lighting,
 *      shadows, blending. (Feeding the room plus several product photos to the
 *      multi-image model produced collages, duplicates and rugs on walls.)
 *   4. Claude checks the room structure and each product's fidelity.
 */
export const maxDuration = 180;

const MODEL = "fal-ai/flux-pro/kontext/max";
const MAX_PRODUCTS = 3;
const MAX_IMAGE_CHARS = 4_000_000;
const RATIOS: [string, number][] = [["21:9", 21 / 9], ["16:9", 16 / 9], ["3:2", 3 / 2], ["4:3", 4 / 3], ["1:1", 1], ["3:4", 3 / 4], ["2:3", 2 / 3], ["9:16", 9 / 16]];

type InProduct = { name?: unknown; category?: unknown; width?: unknown; depth?: unknown; height?: unknown; image?: unknown; spot?: { x?: unknown; y?: unknown } };

const isImage = (v: unknown): v is string => typeof v === "string" && /^data:image\/(jpeg|png|webp);base64,/.test(v) && v.length < MAX_IMAGE_CHARS;
const num = (v: unknown) => (typeof v === "number" && Number.isFinite(v) && v > 0 ? Math.round(v) : undefined);
const unit = (v: unknown) => (typeof v === "number" && v >= 0 && v <= 1 ? v : null);

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

  // 1. clean + plan in parallel
  const issues: ClaudeIssue[] = [];
  const planInput: PlanProduct[] = products.map((p) => ({ ...p, label: categoryLabel[p.category].en.toLowerCase() }));
  const [cleaned, plan] = await Promise.all([
    Promise.all(products.map((p) => cleanProductImage(p.image))),
    planLayout(room, planInput, note, issues),
  ]);
  const layout = plan ?? fallbackLayout(planInput);

  // 2. paste the cut-outs
  let composite: string;
  try {
    composite = await composeRoom(
      room,
      products.map((p, i) => ({ cutout: cleaned[i].cutout, fallback: cleaned[i].image, category: p.category, box: layout.items[i].box })),
    );
  } catch (e) {
    return Response.json({ error: `Could not compose the room (${e instanceof Error ? e.message : String(e)})` }, { status: 500 });
  }

  // 3. harmonise
  const n = products.length;
  const list = products
    .map((p, i) => `${i + 1}. ${p.name} — ${categoryLabel[p.category].en.toLowerCase()}${p.category === "rug" ? " lying flat on the floor" : p.category === "art" ? " hanging on the wall" : ""}`)
    .join("\n");
  const prompt = [
    `This is a photo of a real room into which ${n} catalogue ${n === 1 ? "product has" : "products have"} been pasted as cut-outs:`,
    list,
    "Turn it into one seamless, photorealistic interior photograph:",
    "- correct each pasted item's perspective and angle so it sits naturally in this room as seen from this camera, standing on the floor (or hanging on the wall) with its back parallel to the nearest wall;",
    "- match the room's light direction from its windows, colour temperature and exposure; add soft floor shadows and contact shadows under legs and rug edges; blend the edges;",
    "- keep every item's design exactly — same shape, proportions, colours, fabric, pattern, cushions and legs — and keep its position and size;",
    `- keep exactly these ${n} ${n === 1 ? "item" : "items"}: do not add, remove, duplicate or move anything, and add no other furniture or decor;`,
    "- keep the room identical: walls, ceiling, floor, windows with their pane layout, doors, radiators and the camera framing.",
    layout.fixed_elements.length ? `Unchanged architecture: ${layout.fixed_elements.join("; ")}.` : "",
    "No text, logos or watermarks.",
  ]
    .filter(Boolean)
    .join("\n");

  const ratio = typeof aspect === "number" && aspect > 0 ? aspect : 4 / 3;
  const aspectRatio = RATIOS.reduce((best, r) => (Math.abs(Math.log(r[1] / ratio)) < Math.abs(Math.log(best[1] / ratio)) ? r : best))[0];
  const meta = {
    preserved: layout.fixed_elements,
    layout: { planner: plan ? ("claude" as const) : ("rules" as const), composition: layout.composition },
    cleanedProducts: cleaned.filter((c) => c.cleaned).length,
  };

  let result: string | null = null;
  try {
    const res = await fetch(`https://fal.run/${MODEL}`, {
      method: "POST",
      headers: { Authorization: `Key ${key}`, "Content-Type": "application/json" },
      body: JSON.stringify({
        prompt,
        image_url: composite,
        aspect_ratio: aspectRatio,
        guidance_scale: 3.5,
        output_format: "jpeg",
        ...(typeof variant === "number" && variant > 0 ? { seed: 2000 + variant } : {}),
      }),
    });
    if (res.ok) {
      const url = ((await res.json()) as { images?: { url?: string }[] }).images?.[0]?.url;
      const img = url ? await fetch(url) : null;
      if (img?.ok) result = `data:${img.headers.get("content-type") ?? "image/jpeg"};base64,${Buffer.from(await img.arrayBuffer()).toString("base64")}`;
    }
  } catch {
    /* fall through to the un-harmonised composite */
  }

  // The composite already has the right products in the right places — better than an error.
  const image = result ?? composite;
  const check = await checkPlacement(room, image, products.map((p, i) => ({ name: p.name, image: cleaned[i].image })), issues);
  return Response.json({ demo: false, image, harmonized: !!result, ...meta, check, claudeIssue: issues[0] ?? null });
}
