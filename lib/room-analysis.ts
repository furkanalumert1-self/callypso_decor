import Anthropic from "@anthropic-ai/sdk";

/**
 * Server-only: asks Claude to list the fixed architecture in a room photo
 * (openings, radiators, floor, camera view) so the image model can be told
 * exactly what must not change. Returns null when ANTHROPIC_API_KEY is unset
 * or anything fails — generation then continues with the generic prompt.
 */
export interface RoomAnalysis {
  fixed_elements: string[];
  floor: string;
  camera: string;
}

const SCHEMA = {
  type: "object",
  properties: {
    fixed_elements: {
      type: "array",
      items: { type: "string" },
      description:
        "Up to 10 short English phrases naming permanent architecture with its position in the frame, e.g. 'open doorway on the left wall', 'balcony door left of a wide three-pane window on the back wall', 'white radiator under the window'.",
    },
    floor: { type: "string", description: "Floor material and pattern, e.g. 'light oak herringbone parquet'." },
    camera: { type: "string", description: "Camera position and angle, e.g. 'eye level from the doorway, slightly off-centre to the left, wide angle'." },
  },
  required: ["fixed_elements", "floor", "camera"],
  additionalProperties: false,
} as const;

export async function analyzeRoom(imageDataUrl: string): Promise<RoomAnalysis | null> {
  if (!process.env.ANTHROPIC_API_KEY) return null;
  const match = /^data:(image\/(?:jpeg|png|webp|gif));base64,(.+)$/.exec(imageDataUrl);
  if (!match) return null;

  try {
    const client = new Anthropic();
    const response = await client.beta.messages.create({
      model: "claude-opus-5",
      max_tokens: 4000,
      betas: ["server-side-fallback-2026-07-01"],
      fallbacks: "default",
      thinking: { type: "adaptive" },
      output_config: { effort: "low", format: { type: "json_schema", schema: SCHEMA } },
      messages: [
        {
          role: "user",
          content: [
            { type: "image", source: { type: "base64", media_type: match[1] as "image/jpeg", data: match[2] } },
            {
              type: "text",
              text:
                "This photo will be virtually staged by an image model that tends to invent new windows and doors. " +
                "List the permanent architecture that must stay exactly as it is: doors and doorways, windows, balcony doors, " +
                "radiators, built-in shelves, sockets, beams and wall/ceiling features — each with its position in the frame. " +
                "Ignore movable furniture and decor. Also describe the floor and the camera position.",
            },
          ],
        },
      ],
    });

    if (response.stop_reason === "refusal") return null;
    const text = response.content.find((b) => b.type === "text");
    if (!text || text.type !== "text") return null;
    const parsed = JSON.parse(text.text) as RoomAnalysis;
    return { ...parsed, fixed_elements: parsed.fixed_elements.slice(0, 10) };
  } catch (error) {
    if (error instanceof Anthropic.APIError) console.warn(`Room analysis skipped: ${error.status} ${error.message}`);
    else console.warn("Room analysis skipped:", error);
    return null;
  }
}
