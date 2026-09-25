import { analyzeRoom, checkPlacement } from "@/lib/room-analysis";
import { categoryLabel, type ProductCategory } from "@/lib/demo/products";

/**
 * POST /api/place — place specific catalogue products into a room photo.
 * body: {
 *   room: data URL, aspect: number (width / height),
 *   products: [{ name, category, width?, depth?, height?, image: data URL, spot?: { x, y } (0–1) }],
 *   note?: string, variant?: number
 * }
 *
 * With FAL_KEY → FLUX Kontext Max (multi-image): the room plus every product
 * photo go in together, so the model copies the real products instead of
 * inventing look-alikes. ANTHROPIC_API_KEY adds a room analysis before and a
 * structure + product-fidelity check after. Without FAL_KEY → demo response.
 */
export const maxDuration = 90;

const MODEL = "fal-ai/flux-pro/kontext/max/multi";
const MAX_PRODUCTS = 3;
const MAX_IMAGE_CHARS = 4_000_000;
const RATIOS: [string, number][] = [["21:9", 21 / 9], ["16:9", 16 / 9], ["3:2", 3 / 2], ["4:3", 4 / 3], ["1:1", 1], ["3:4", 3 / 4], ["2:3", 2 / 3], ["9:16", 9 / 16]];

type InProduct = { name?: unknown; category?: unknown; width?: unknown; depth?: unknown; height?: unknown; image?: unknown; spot?: { x?: unknown; y?: unknown } };

const isImage = (v: unknown): v is string => typeof v === "string" && /^data:image\/(jpeg|png|webp);base64,/.test(v) && v.length < MAX_IMAGE_CHARS;
const num = (v: unknown) => (typeof v === "number" && Number.isFinite(v) && v > 0 ? Math.round(v) : undefined);

function where(spot?: { x?: unknown; y?: unknown }) {
  const x = typeof spot?.x === "number" ? spot.x : null;
  const y = typeof spot?.y === "number" ? spot.y : null;
  if (x === null || y === null) return "wherever it fits most naturally in the room";
  const side = x < 0.33 ? "on the left side of the room" : x > 0.66 ? "on the right side of the room" : "in the centre of the room";
  const depth = y < 0.55 ? "towards the back wall" : y > 0.78 ? "in the foreground" : "in the middle of the floor";
  return `${side}, ${depth} (at about ${Math.round(x * 100)}% from the left and ${Math.round(y * 100)}% from the top of the photo)`;
}

export async function POST(req: Request) {
  let body: { room?: unknown; aspect?: unknown; products?: unknown; note?: unknown; variant?: unknown };
  try {
    body = await req.json();
  } catch {
    return Response.json({ error: "Invalid JSON body" }, { status: 400 });
  }

  const { room, aspect, note, variant } = body;
  if (!isImage(room)) return Response.json({ error: "A room photo (JPEG/PNG/WEBP data URL) is required" }, { status: 400 });
  if (!Array.isArray(body.products) || body.products.length === 0 || body.products.length > MAX_PRODUCTS) {
    return Response.json({ error: `Select 1–${MAX_PRODUCTS} products` }, { status: 400 });
  }
  const products = (body.products as InProduct[]).map((p) => ({
    name: typeof p.name === "string" ? p.name.slice(0, 80) : "",
    category: (typeof p.category === "string" && p.category in categoryLabel ? p.category : "decor") as ProductCategory,
    width: num(p.width), depth: num(p.depth), height: num(p.height),
    image: p.image,
    spot: p.spot,
  }));
  if (products.some((p) => !p.name || !isImage(p.image))) {
    return Response.json({ error: "Every product needs a name and a photo" }, { status: 400 });
  }

  const key = process.env.FAL_KEY;
  if (!key) {
    await new Promise((r) => setTimeout(r, 1500));
    return Response.json({ demo: true });
  }

  const analysis = await analyzeRoom(room);
  const ratio = typeof aspect === "number" && aspect > 0 ? aspect : 4 / 3;
  const aspectRatio = RATIOS.reduce((best, r) => (Math.abs(Math.log(r[1] / ratio)) < Math.abs(Math.log(best[1] / ratio)) ? r : best))[0];

  const lines = products.map((p, i) => {
    const dims = [p.width && `${p.width} cm wide`, p.depth && `${p.depth} cm deep`, p.height && `${p.height} cm high`].filter(Boolean).join(" × ");
    return `- Image ${i + 2}: "${p.name}" (${categoryLabel[p.category].en.toLowerCase()}${dims ? `, ${dims}` : ""}) — place it ${where(p.spot)}.`;
  });

  const prompt = [
    `Image 1 is a photo of a customer's room. Images 2–${products.length + 1} are catalogue photos of furniture products.`,
    "Place exactly these products into the room from image 1:",
    ...lines,
    "Reproduce every product faithfully: identical shape, proportions, colour, fabric or material, legs and details as in its catalogue photo. Do not substitute, restyle or recolour them, and do not add any other furniture.",
    "Scale each product realistically from its dimensions and the size of the room, stand it on the floor with correct perspective, contact shadows and lighting that matches the room.",
    "The output must be image 1 with the products added: same camera position, angle and framing; same walls, ceiling, floor, windows (with their pane layout), doors and radiators in the same places. Leave doorways clear.",
    analysis?.fixed_elements.length ? `These must stay exactly as they are: ${analysis.fixed_elements.join("; ")}.` : "",
    typeof note === "string" && note.trim() ? `Additional placement instructions from the user (may be in Turkish): ${note.trim().slice(0, 300)}` : "",
    "Photorealistic interior photography.",
  ]
    .filter(Boolean)
    .join("\n");

  try {
    const res = await fetch(`https://fal.run/${MODEL}`, {
      method: "POST",
      headers: { Authorization: `Key ${key}`, "Content-Type": "application/json" },
      body: JSON.stringify({
        prompt,
        image_urls: [room, ...products.map((p) => p.image as string)],
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
    const check = await checkPlacement(room, result, products.map((p) => ({ name: p.name, image: p.image as string })));
    return Response.json({ demo: false, image: result, preserved: analysis?.fixed_elements ?? [], check });
  } catch {
    return Response.json({ error: "Could not reach the image service" }, { status: 502 });
  }
}
