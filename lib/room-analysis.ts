import Anthropic from "@anthropic-ai/sdk";
import type { Box } from "@/lib/compose";

/** Why a Claude step was skipped — surfaced in the UI so a bad key or missing model access is visible. */
export type ClaudeIssue = { code: "no_key" | "auth" | "workspace" | "not_found" | "rate_limit" | "billing" | "unavailable" | "refusal" | "error"; detail: string };

/**
 * Anthropic client. Organisation-level keys (not created inside a workspace)
 * need the workspace named on every request — set ANTHROPIC_WORKSPACE_ID
 * (Console → Workspaces → the workspace's ID), or use a workspace-scoped key.
 */
export function claudeClient() {
  const workspace = process.env.ANTHROPIC_WORKSPACE_ID?.trim();
  return new Anthropic(workspace ? { defaultHeaders: { "anthropic-workspace-id": workspace } } : {});
}

export function issueFrom(error: unknown): ClaudeIssue {
  if (error instanceof Anthropic.APIError) {
    const detail = error.message.slice(0, 200);
    if (error.status === 401) return { code: "auth", detail };
    if (error.status === 403) return { code: "auth", detail };
    if (error.status === 404) return { code: "not_found", detail };
    if (error.status === 429) return { code: "rate_limit", detail };
    if (/credit|billing|balance/i.test(error.message)) return { code: "billing", detail };
    if (/workspace/i.test(error.message)) return { code: "workspace", detail };
    if (typeof error.status === "number" && error.status >= 500) return { code: "unavailable", detail };
    return { code: "error", detail };
  }
  return { code: "error", detail: String(error).slice(0, 200) };
}

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

export async function analyzeRoom(imageDataUrl: string, issues: ClaudeIssue[] = []): Promise<RoomAnalysis | null> {
  if (!process.env.ANTHROPIC_API_KEY) { issues.push({ code: "no_key", detail: "ANTHROPIC_API_KEY is not set" }); return null; }
  const match = /^data:(image\/(?:jpeg|png|webp|gif));base64,(.+)$/.exec(imageDataUrl);
  if (!match) return null;

  try {
    const client = claudeClient();
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

    if (response.stop_reason === "refusal") { issues.push({ code: "refusal", detail: response.stop_details?.category ?? "refused" }); return null; }
    const text = response.content.find((b) => b.type === "text");
    if (!text || text.type !== "text") return null;
    const parsed = JSON.parse(text.text) as RoomAnalysis;
    return { ...parsed, fixed_elements: parsed.fixed_elements.slice(0, 10) };
  } catch (error) {
    const issue = issueFrom(error);
    console.warn(`Room analysis skipped: ${issue.code} — ${issue.detail}`);
    issues.push(issue);
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
export async function checkStaging(before: string, after: string, issues: ClaudeIssue[] = []): Promise<StagingCheck | null> {
  if (!process.env.ANTHROPIC_API_KEY) { issues.push({ code: "no_key", detail: "ANTHROPIC_API_KEY is not set" }); return null; }
  const a = imageBlock(before);
  const b = imageBlock(after);
  if (!a || !b) return null;

  try {
    const client = claudeClient();
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

    if (response.stop_reason === "refusal") { issues.push({ code: "refusal", detail: response.stop_details?.category ?? "refused" }); return null; }
    const text = response.content.find((blk) => blk.type === "text");
    if (!text || text.type !== "text") return null;
    const parsed = JSON.parse(text.text) as StagingCheck;
    return { structure_preserved: parsed.structure_preserved, changes: parsed.changes.slice(0, 6) };
  } catch (error) {
    const issue = issueFrom(error);
    console.warn(`Staging check skipped: ${issue.code} — ${issue.detail}`);
    issues.push(issue);
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
  issues: ClaudeIssue[] = [],
): Promise<PlacementCheck | null> {
  if (!process.env.ANTHROPIC_API_KEY) { issues.push({ code: "no_key", detail: "ANTHROPIC_API_KEY is not set" }); return null; }
  const a = imageBlock(before);
  const b = imageBlock(after);
  const productBlocks = products.map((p) => ({ name: p.name, block: imageBlock(p.image) }));
  if (!a || !b || productBlocks.some((p) => !p.block)) return null;

  try {
    const client = claudeClient();
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

    if (response.stop_reason === "refusal") { issues.push({ code: "refusal", detail: response.stop_details?.category ?? "refused" }); return null; }
    const text = response.content.find((blk) => blk.type === "text");
    if (!text || text.type !== "text") return null;
    const parsed = JSON.parse(text.text) as PlacementCheck;
    return { ...parsed, changes: parsed.changes.slice(0, 6) };
  } catch (error) {
    const issue = issueFrom(error);
    console.warn(`Placement check skipped: ${issue.code} — ${issue.detail}`);
    issues.push(issue);
    return null;
  }
}

export interface LayoutPlan {
  fixed_elements: string[];
  composition: string;
  items: { name: string; placement: string; box: Box }[];
}

const LAYOUT_SCHEMA = {
  type: "object",
  properties: {
    fixed_elements: {
      type: "array",
      items: { type: "string" },
      description: "Up to 10 short English phrases naming the room's permanent architecture with its position in the frame.",
    },
    composition: {
      type: "string",
      description: "One or two English sentences describing the overall arrangement (the single furniture group, its axis, what it faces, how it is balanced).",
    },
    items: {
      type: "array",
      description: "Exactly one entry per product, in the order given.",
      items: {
        type: "object",
        properties: {
          name: { type: "string" },
          placement: {
            type: "string",
            description:
              "Precise English placement: which wall or area (named by visible features such as 'the long wall with textured wallpaper on the right' or 'below the window'), orientation (what it faces), alignment/centring and distance relative to the other products.",
          },
          box: {
            type: "object",
            description:
              "Where the item appears in the room photo, as fractions of the photo (0–1). cx: horizontal centre. bottom: y of the line where the item touches the floor (for wall art: its lower frame edge on the wall; for a rug: its front edge nearest the camera). width: its apparent width in the photo as a fraction of the photo width, consistent with its real dimensions and its depth in the room (farther = smaller).",
            properties: { cx: { type: "number" }, bottom: { type: "number" }, width: { type: "number" } },
            required: ["cx", "bottom", "width"],
            additionalProperties: false,
          },
        },
        required: ["name", "placement", "box"],
        additionalProperties: false,
      },
    },
  },
  required: ["fixed_elements", "composition", "items"],
  additionalProperties: false,
} as const;

export interface PlanProduct {
  name: string;
  /** ProductCategory code ("sofa", "art", …) */
  category: string;
  /** human-readable English category for prompts ("wall art") */
  label?: string;
  width?: number;
  depth?: number;
  height?: number;
  image: string;
  spot?: { x: number; y: number };
}

/**
 * Server-only: an interior-designer layout for the given products in this room
 * — one coherent, balanced group placed against real walls, with the rug
 * aligned to them — plus the fixed architecture to preserve. Null when Claude
 * is unavailable; callers then use `fallbackLayout`.
 */
export async function planLayout(room: string, products: PlanProduct[], note: string, issues: ClaudeIssue[] = []): Promise<LayoutPlan | null> {
  if (!process.env.ANTHROPIC_API_KEY) { issues.push({ code: "no_key", detail: "ANTHROPIC_API_KEY is not set" }); return null; }
  const roomBlock = imageBlock(room);
  const blocks = products.map((p) => imageBlock(p.image));
  if (!roomBlock || blocks.some((b) => !b)) return null;

  const describe = (p: PlanProduct, i: number) => {
    const dims = [p.width && `${p.width} cm wide`, p.depth && `${p.depth} cm deep`, p.height && `${p.height} cm high`].filter(Boolean).join(", ");
    const pin = p.spot ? ` The user marked its spot at ${Math.round(p.spot.x * 100)}% from the left, ${Math.round(p.spot.y * 100)}% from the top of the room photo — respect it.` : "";
    return `Product ${i + 1}: "${p.name}" (${p.label ?? p.category}${dims ? `, ${dims}` : ""}).${pin}`;
  };

  try {
    const client = claudeClient();
    const response = await client.beta.messages.create({
      model: "claude-opus-5",
      max_tokens: 6000,
      betas: ["server-side-fallback-2026-07-01"],
      fallbacks: "default",
      thinking: { type: "adaptive" },
      output_config: { effort: "medium", format: { type: "json_schema", schema: LAYOUT_SCHEMA } },
      messages: [
        {
          role: "user",
          content: [
            { type: "text", text: "The customer's room:" },
            roomBlock,
            ...products.flatMap((p, i) => [{ type: "text" as const, text: describe(p, i) }, blocks[i]!]),
            {
              type: "text",
              text:
                "You are an interior designer preparing instructions for an image model that will add exactly these products to the room photo — one of each, no duplicates, nothing else. " +
                "Plan one coherent, balanced furniture group the way a designer would stage this room for a sales photo: " +
                "large pieces with their backs against a real wall (never floating diagonally), centred on that wall or on a clear axis of the room, facing into the room; " +
                "a rug laid flat as a straight rectangle parallel to the walls, centred on the seating group with the front legs of the seating on it; " +
                "tables centred on the sofa; armchairs placed symmetrically; keep doorways, the balcony door and walkways clear; respect real scale from the dimensions. " +
                "Describe placements using features visible in the photo. The products will be cut out and pasted at your boxes, so the boxes must be accurate: " +
                "estimate the room's scale from features of known size (doors ≈ 80–90 cm wide and 200 cm high, radiators, windows, floor boards), keep large pieces' bottoms on the floor line of the wall they stand against, put wall art on a wall at eye level (e.g. centred above the sofa), and keep boxes inside the photo and off doorways." +
                (note.trim() ? ` The user's note (may be Turkish), use it as guidance but never add extra items: ${note.trim().slice(0, 300)}` : ""),
            },
          ],
        },
      ],
    });
    if (response.stop_reason === "refusal") { issues.push({ code: "refusal", detail: response.stop_details?.category ?? "refused" }); return null; }
    const text = response.content.find((blk) => blk.type === "text");
    if (!text || text.type !== "text") return null;
    const plan = JSON.parse(text.text) as LayoutPlan;
    if (plan.items.length !== products.length) return null;
    const fb = fallbackLayout(products).items;
    return {
      ...plan,
      fixed_elements: plan.fixed_elements.slice(0, 10),
      // sanity-check each box; fall back to the rule-based one if it's nonsense
      items: plan.items.map((it, i) => ({ ...it, box: validBox(it.box) ? clampBox(it.box) : fb[i].box })),
    };
  } catch (error) {
    const issue = issueFrom(error);
    console.warn(`Layout planning skipped: ${issue.code} — ${issue.detail}`);
    issues.push(issue);
    return null;
  }
}

const validBox = (b?: Box) =>
  !!b && [b.cx, b.bottom, b.width].every((v) => typeof v === "number" && Number.isFinite(v)) && b.width > 0.02 && b.width < 1 && b.bottom > 0.05 && b.bottom <= 1.05;
const clampBox = (b: Box): Box => ({ cx: Math.min(0.97, Math.max(0.03, b.cx)), bottom: Math.min(1, Math.max(0.08, b.bottom)), width: Math.min(0.9, b.width) });

/**
 * Designer rules used when Claude can't plan: one balanced group — the main
 * piece against the back wall, rug in front of and under it, table centred on
 * it, armchair across the rug, art above it. Pins override positions.
 */
export function fallbackLayout(products: PlanProduct[]): LayoutPlan {
  const has = (c: string) => products.some((p) => p.category === c);
  const anchorCat = ["sofa", "bed", "storage", "armchair"].find(has) ?? null;
  const anchorProduct = anchorCat ? products.find((p) => p.category === anchorCat)! : null;
  const anchor: Box = anchorProduct?.spot
    ? { cx: anchorProduct.spot.x, bottom: anchorProduct.spot.y, width: 0.4 }
    : { cx: 0.5, bottom: 0.7, width: anchorCat === "bed" ? 0.48 : anchorCat === "armchair" ? 0.2 : 0.4 };
  const seat = anchorCat === "sofa" ? "the sofa" : anchorCat === "bed" ? "the bed" : anchorCat ? `the ${anchorCat}` : null;
  const depthScale = (bottom: number) => Math.min(1.3, Math.max(0.6, bottom / 0.72));

  const place = (p: PlanProduct): { placement: string; box: Box } => {
    const pinned = (w: number): Box | null => (p.spot ? { cx: p.spot.x, bottom: p.spot.y, width: w * depthScale(p.spot.y) } : null);
    switch (p.category) {
      case "sofa": case "bed": case "storage":
        if (p === anchorProduct) return { placement: `${p.spot ? "at the marked spot" : "centred against the back wall"}, its back to the wall, facing into the room`, box: anchor };
        return { placement: "against a free side wall, facing the main seating", box: pinned(0.3) ?? { cx: anchor.cx > 0.5 ? 0.18 : 0.82, bottom: anchor.bottom + 0.06, width: 0.3 } };
      case "armchair":
        if (p === anchorProduct) return { placement: "against a free wall, facing into the room", box: anchor };
        return { placement: seat ? `across the rug from ${seat}, angled towards it` : "near the window, facing into the room", box: pinned(0.2) ?? { cx: anchor.cx > 0.5 ? anchor.cx - 0.36 : anchor.cx + 0.36, bottom: anchor.bottom + 0.1, width: 0.2 * depthScale(anchor.bottom + 0.1) } };
      case "table":
        return { placement: seat ? `centred in front of ${seat}` : "centred in the open floor area", box: pinned(0.22) ?? { cx: anchor.cx, bottom: anchor.bottom + 0.12, width: anchor.width * 0.5 } };
      case "rug":
        return { placement: seat ? `flat on the floor, centred on ${seat}, extending in front of it` : "flat, centred in the open floor area", box: pinned(0.5) ?? { cx: anchor.cx, bottom: Math.min(0.98, anchor.bottom + 0.22), width: Math.min(0.8, anchor.width * 1.25) } };
      case "art":
        return { placement: seat ? `on the wall, centred above ${seat}` : "on a free wall at eye level", box: p.spot ? { cx: p.spot.x, bottom: p.spot.y, width: 0.16 } : { cx: anchor.cx, bottom: anchor.bottom - 0.3, width: Math.min(0.24, anchor.width * 0.45) } };
      case "lamp":
        return { placement: seat ? `beside ${seat}` : "in a corner", box: pinned(0.07) ?? { cx: Math.min(0.95, anchor.cx + anchor.width / 2 + 0.05), bottom: anchor.bottom + 0.01, width: 0.07 } };
      default:
        return { placement: seat ? `near ${seat}` : "where it naturally belongs", box: pinned(0.1) ?? { cx: Math.max(0.05, anchor.cx - anchor.width / 2 - 0.06), bottom: anchor.bottom + 0.02, width: 0.1 } };
    }
  };
  return {
    fixed_elements: [],
    composition: "One balanced furniture group on a clear axis of the room; nothing floats diagonally in the middle of the floor; doorways and walkways stay clear.",
    items: products.map((p) => {
      const { placement, box } = place(p);
      return { name: p.name, placement, box: clampBox(box) };
    }),
  };
}
