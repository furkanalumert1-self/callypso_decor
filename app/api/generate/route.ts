import { styles } from "@/lib/demo/data";
import { analyzeRoom } from "@/lib/room-analysis";

/**
 * POST /api/generate — virtually stage a room photo while keeping the room.
 * body: { image: data URL, style: RoomStyle, room: string, mode?: "furnish" | "renovate", variant?: number }
 *
 * 1. (ANTHROPIC_API_KEY) Claude lists the room's fixed architecture.
 * 2. (FAL_KEY) FLUX Kontext edits the photo — an instruction-following editor
 *    that keeps walls, openings and camera, unlike plain image-to-image.
 * Without FAL_KEY → demo mode: waits 1.5s and returns { demo: true }.
 */
export const maxDuration = 60;

const MAX_IMAGE_CHARS = 4_000_000;
const MODEL = "fal-ai/flux-pro/kontext";

export async function POST(req: Request) {
  let body: { image?: unknown; style?: unknown; room?: unknown; mode?: unknown; variant?: unknown };
  try {
    body = await req.json();
  } catch {
    return Response.json({ error: "Invalid JSON body" }, { status: 400 });
  }

  const { image, style, room, mode, variant } = body;
  const def = styles.find((s) => s.id === style);
  if (typeof image !== "string" || !image.startsWith("data:image/") || image.length > MAX_IMAGE_CHARS) {
    return Response.json({ error: "A photo (image data URL, max ~3 MB) is required" }, { status: 400 });
  }
  if (!def) return Response.json({ error: "Unknown style" }, { status: 400 });

  const key = process.env.FAL_KEY;
  if (!key) {
    await new Promise((r) => setTimeout(r, 1500));
    return Response.json({ demo: true });
  }

  const analysis = await analyzeRoom(image);
  const roomName = typeof room === "string" ? room.toLowerCase() : "room";
  const renovate = mode === "renovate";

  const prompt = [
    `Virtually stage this exact ${roomName} photo in ${def.name.en} interior style (${def.motifs.en}).`,
    renovate
      ? "Add fitting furniture, rug, lighting, plants, textiles and wall art. You may repaint the walls and refinish the floor to suit the style."
      : "Only add fitting furniture, rug, lighting, plants, textiles and wall art.",
    "Keep the room itself identical: same camera position, angle, lens and framing; same walls, ceiling, windows, doors and radiators in the same places.",
    "Do not add, remove, move or resize any window, door, doorway or wall. Do not change the room's proportions.",
    analysis?.fixed_elements.length ? `These must stay exactly as they are: ${analysis.fixed_elements.join("; ")}.` : "",
    analysis && !renovate ? `Keep the floor: ${analysis.floor}.` : "",
    analysis ? `Camera: ${analysis.camera}.` : "",
    "Photorealistic interior photography, natural daylight from the existing windows.",
  ]
    .filter(Boolean)
    .join(" ");

  try {
    const res = await fetch(`https://fal.run/${MODEL}`, {
      method: "POST",
      headers: { Authorization: `Key ${key}`, "Content-Type": "application/json" },
      body: JSON.stringify({
        image_url: image,
        prompt,
        guidance_scale: 3.5,
        output_format: "jpeg",
        ...(typeof variant === "number" && variant > 0 ? { seed: 1000 + variant } : {}),
      }),
    });
    if (!res.ok) {
      return Response.json({ error: `Image service error (${res.status})` }, { status: 502 });
    }
    const data = (await res.json()) as { images?: { url?: string }[] };
    const url = data.images?.[0]?.url;
    if (!url) return Response.json({ error: "Image service returned no image" }, { status: 502 });

    // Inline the result as a data URL: the browser can then align/score it
    // (no CORS) and saved projects don't depend on a CDN link that may expire.
    const img = await fetch(url);
    if (!img.ok) return Response.json({ error: `Could not download the result (${img.status})` }, { status: 502 });
    const type = img.headers.get("content-type") ?? "image/jpeg";
    const b64 = Buffer.from(await img.arrayBuffer()).toString("base64");
    return Response.json({ demo: false, image: `data:${type};base64,${b64}`, preserved: analysis?.fixed_elements ?? [] });
  } catch {
    return Response.json({ error: "Could not reach the image service" }, { status: 502 });
  }
}
