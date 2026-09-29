import { shopifyConfigured } from "@/lib/shopify";

/**
 * GET /api/status — which integrations this deployment can see (booleans only,
 * never values) and which commit is live. Handy after changing env vars on
 * Vercel: they only reach a deployment after a redeploy.
 */
export const dynamic = "force-dynamic";

export function GET() {
  const key = process.env.ANTHROPIC_API_KEY?.trim() ?? "";
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
    },
    fal: Boolean(process.env.FAL_KEY?.trim()),
    shopify: shopifyConfigured(),
    supabase: Boolean(process.env.NEXT_PUBLIC_SUPABASE_URL && process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY),
  });
}
