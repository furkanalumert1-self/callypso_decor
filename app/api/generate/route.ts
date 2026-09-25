import { styles } from "@/lib/demo/data";

/**
 * POST /api/generate — restyle a room photo.
 * body: { image: data URL, style: RoomStyle, room: string, variant?: number }
 *
 * With FAL_KEY set (server-side only) → fal.ai FLUX image-to-image.
 * Without it → demo mode: waits 1.5s and returns { demo: true }; the client
 * then renders a colour-graded sample from the uploaded photo.
 */
export const maxDuration = 60;

const MAX_IMAGE_CHARS = 4_000_000;

export async function POST(req: Request) {
  let body: { image?: unknown; style?: unknown; room?: unknown; variant?: unknown };
  try {
    body = await req.json();
  } catch {
    return Response.json({ error: "Invalid JSON body" }, { status: 400 });
  }

  const { image, style, room } = body;
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

  const prompt =
    `A photorealistic interior photo of the same ${typeof room === "string" ? room : "room"}, redesigned in ${def.name.en} style: ` +
    `${def.motifs.en}. Keep the exact room layout, walls, windows, camera angle and perspective. Natural light, high detail.`;

  try {
    const res = await fetch("https://fal.run/fal-ai/flux/dev/image-to-image", {
      method: "POST",
      headers: { Authorization: `Key ${key}`, "Content-Type": "application/json" },
      body: JSON.stringify({ image_url: image, prompt, strength: 0.85, num_inference_steps: 40 }),
    });
    if (!res.ok) {
      return Response.json({ error: `Image service error (${res.status})` }, { status: 502 });
    }
    const data = (await res.json()) as { images?: { url?: string }[] };
    const url = data.images?.[0]?.url;
    if (!url) return Response.json({ error: "Image service returned no image" }, { status: 502 });
    return Response.json({ demo: false, image: url });
  } catch {
    return Response.json({ error: "Could not reach the image service" }, { status: 502 });
  }
}
