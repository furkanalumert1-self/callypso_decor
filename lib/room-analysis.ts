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

export interface StagingCheck {
  structure_preserved: boolean;
  changes: string[];
}

const CHECK_SCHEMA = {
  type: "object",
  properties: {
    structure_preserved: {
      type: "boolean",
      description: "True if every door, doorway, window, balcony door, radiator and wall is still in the same place with the same shape, and the camera viewpoint is the same.",
    },
    changes: {
      type: "array",
      items: { type: "string" },
      description: "Short Turkish phrases for each architectural change found (e.g. 'sol duvardaki kapı kaldırılmış'). Empty if none. Ignore furniture, decor, paint and lighting.",
    },
  },
  required: ["structure_preserved", "changes"],
  additionalProperties: false,
} as const;

function imageBlock(dataUrl: string) {
  const match = /^data:(image\/(?:jpeg|png|webp|gif));base64,(.+)$/.exec(dataUrl);
  if (!match) return null;
  return { type: "image" as const, source: { type: "base64" as const, media_type: match[1] as "image/jpeg", data: match[2] } };
}

/**
 * Server-only: Claude compares the original photo with the staged result and
 * reports whether the architecture survived. Pixel metrics can't tell staging
 * clutter from a redrawn room; this can. Null when unavailable.
 */
export async function checkStaging(before: string, after: string): Promise<StagingCheck | null> {
  if (!process.env.ANTHROPIC_API_KEY) return null;
  const a = imageBlock(before);
  const b = imageBlock(after);
  if (!a || !b) return null;

  try {
    const client = new Anthropic();
    const response = await client.beta.messages.create({
      model: "claude-opus-5",
      max_tokens: 4000,
      betas: ["server-side-fallback-2026-07-01"],
      fallbacks: "default",
      thinking: { type: "adaptive" },
      output_config: { effort: "low", format: { type: "json_schema", schema: CHECK_SCHEMA } },
      messages: [
        {
          role: "user",
          content: [
            { type: "text", text: "Image 1 — the original, empty room:" },
            a,
            { type: "text", text: "Image 2 — the same room after virtual staging:" },
            b,
            {
              type: "text",
              text:
                "Virtual staging may only add furniture and decor. Compare the permanent architecture: doors and doorways, windows " +
                "(including the number and layout of panes), balcony doors, radiators, built-ins, walls, ceiling and the camera viewpoint. " +
                "Is it the same room? Ignore furniture, rugs, plants, art, curtains, paint colour and lighting.",
            },
          ],
        },
      ],
    });

    if (response.stop_reason === "refusal") return null;
    const text = response.content.find((blk) => blk.type === "text");
    if (!text || text.type !== "text") return null;
    const parsed = JSON.parse(text.text) as StagingCheck;
    return { structure_preserved: parsed.structure_preserved, changes: parsed.changes.slice(0, 6) };
  } catch (error) {
    if (error instanceof Anthropic.APIError) console.warn(`Staging check skipped: ${error.status} ${error.message}`);
    else console.warn("Staging check skipped:", error);
    return null;
  }
}

export interface PlacementCheck extends StagingCheck {
  products: { name: string; faithful: boolean; note: string }[];
}

const PLACEMENT_SCHEMA = {
  type: "object",
  properties: {
    ...CHECK_SCHEMA.properties,
    products: {
      type: "array",
      description: "One entry per catalogue product, in the order given.",
      items: {
        type: "object",
        properties: {
          name: { type: "string" },
          faithful: {
            type: "boolean",
            description: "True if the product is visible in the result and matches its catalogue photo in shape, proportions, colour, material and legs.",
          },
          note: { type: "string", description: "Short Turkish note on what differs or is missing; empty if faithful." },
        },
        required: ["name", "faithful", "note"],
        additionalProperties: false,
      },
    },
  },
  required: ["structure_preserved", "changes", "products"],
  additionalProperties: false,
} as const;

/**
 * Server-only: checks a furniture placement — did the room survive, and does
 * each placed item actually match the firm's catalogue photo? Null when
 * unavailable.
 */
export async function checkPlacement(
  before: string,
  after: string,
  products: { name: string; image: string }[],
): Promise<PlacementCheck | null> {
  if (!process.env.ANTHROPIC_API_KEY) return null;
  const a = imageBlock(before);
  const b = imageBlock(after);
  const productBlocks = products.map((p) => ({ name: p.name, block: imageBlock(p.image) }));
  if (!a || !b || productBlocks.some((p) => !p.block)) return null;

  try {
    const client = new Anthropic();
    const response = await client.beta.messages.create({
      model: "claude-opus-5",
      max_tokens: 4000,
      betas: ["server-side-fallback-2026-07-01"],
      fallbacks: "default",
      thinking: { type: "adaptive" },
      output_config: { effort: "low", format: { type: "json_schema", schema: PLACEMENT_SCHEMA } },
      messages: [
        {
          role: "user",
          content: [
            { type: "text", text: "Original room photo:" },
            a,
            { type: "text", text: "Result after placing the catalogue products below into the room:" },
            b,
            ...productBlocks.flatMap((p, i) => [{ type: "text" as const, text: `Catalogue product ${i + 1}: "${p.name}"` }, p.block!]),
            {
              type: "text",
              text:
                "1) Compare the permanent architecture of the original and the result: doors and doorways, windows (number and layout of panes), " +
                "balcony doors, radiators, built-ins, walls, ceiling and camera viewpoint. Ignore furniture, decor, paint and lighting. " +
                "2) For each catalogue product, say whether it appears in the result and faithfully matches its catalogue photo " +
                "(shape, proportions, colour, material, legs). A similar-looking but different product is not faithful.",
            },
          ],
        },
      ],
    });

    if (response.stop_reason === "refusal") return null;
    const text = response.content.find((blk) => blk.type === "text");
    if (!text || text.type !== "text") return null;
    const parsed = JSON.parse(text.text) as PlacementCheck;
    return { ...parsed, changes: parsed.changes.slice(0, 6) };
  } catch (error) {
    if (error instanceof Anthropic.APIError) console.warn(`Placement check skipped: ${error.status} ${error.message}`);
    else console.warn("Placement check skipped:", error);
    return null;
  }
}
