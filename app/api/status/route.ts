import { shopifyConfigured } from "@/lib/shopify";
import { claudeClient, issueFrom } from "@/lib/room-analysis";

/**
 * GET /api/status — which integrations this deployment can see (booleans only,
 * never values) and which commit is live. Handy after changing env vars on
 * Vercel: they only reach a deployment after a redeploy.
 *
 * GET /api/status?probe=claude additionally calls the Claude API the way the
 * app does and reports the outcome (error type + message, never the key):
 *   countTokens — free; checks the key, workspace and model access,
 *   request     — a tiny real request with the app's options (fallbacks beta +
 *                 structured output), costs a fraction of a cent.
 * Throttled to one probe per 10 s per server instance.
 */
export const dynamic = "force-dynamic";

const MODEL = "claude-opus-5";
let lastProbe = 0;

async function probeClaude() {
  if (Date.now() - lastProbe < 10_000) return { skipped: "throttled — try again in a few seconds" };
  lastProbe = Date.now();
  const client = claudeClient();
  const out: Record<string, unknown> = { model: MODEL };
  try {
    const r = await client.messages.countTokens({ model: MODEL, messages: [{ role: "user", content: "ok" }] });
    out.countTokens = { ok: true, inputTokens: r.input_tokens };
  } catch (e) {
    out.countTokens = { ok: false, ...issueFrom(e) };
    return out; // no point spending on the request if the basics fail
  }
  try {
    const r = await client.beta.messages.create({
      model: MODEL,
      max_tokens: 200,
      betas: ["server-side-fallback-2026-07-01"],
      fallbacks: "default",
      output_config: {
        effort: "low",
        format: { type: "json_schema", schema: { type: "object", properties: { ok: { type: "boolean" } }, required: ["ok"], additionalProperties: false } },
      },
      messages: [{ role: "user", content: 'Reply with {"ok": true}.' }],
    });
    out.request = { ok: true, stopReason: r.stop_reason, servedBy: r.model };
  } catch (e) {
    out.request = { ok: false, ...issueFrom(e) };
  }
  return out;
}

export async function GET(req: Request) {
  const key = process.env.ANTHROPIC_API_KEY?.trim() ?? "";
  const probe = new URL(req.url).searchParams.get("probe") === "claude" && key ? await probeClaude() : undefined;
  return Response.json({
    deployment: {
      env: process.env.VERCEL_ENV ?? "local",
      commit: process.env.VERCEL_GIT_COMMIT_SHA?.slice(0, 7) ?? null,
      branch: process.env.VERCEL_GIT_COMMIT_REF ?? null,
    },
    anthropic: {
      apiKey: key.length > 0,
      apiKeyLooksValid: /^sk-ant-/.test(key),
      apiKeyHasWhitespace: (process.env.ANTHROPIC_API_KEY ?? "") !== key,
      workspaceId: Boolean(process.env.ANTHROPIC_WORKSPACE_ID?.trim()),
      ...(probe && { probe }),
    },
    fal: Boolean(process.env.FAL_KEY?.trim()),
    shopify: shopifyConfigured(),
    supabase: Boolean(process.env.NEXT_PUBLIC_SUPABASE_URL && process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY),
  });
}
