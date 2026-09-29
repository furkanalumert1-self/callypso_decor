import { fetchShopifyProductsForImport, shopifyConfigured, ShopifyError } from "@/lib/shopify";

export const maxDuration = 60;
const MAX_PER_IMPORT = 25;

/** POST /api/shopify/import { ids } — product data + photos ready to store in the catalogue. */
export async function POST(req: Request) {
  if (!shopifyConfigured()) return Response.json({ error: "Shopify is not configured" }, { status: 400 });
  let ids: unknown;
  try {
    ({ ids } = await req.json());
  } catch {
    return Response.json({ error: "Invalid JSON body" }, { status: 400 });
  }
  if (!Array.isArray(ids) || !ids.length || ids.length > MAX_PER_IMPORT || !ids.every((id) => typeof id === "string" && id.startsWith("gid://shopify/Product/"))) {
    return Response.json({ error: `Send 1–${MAX_PER_IMPORT} Shopify product IDs` }, { status: 400 });
  }
  try {
    return Response.json({ products: await fetchShopifyProductsForImport(ids as string[]) });
  } catch (e) {
    const status = e instanceof ShopifyError ? e.status : 502;
    return Response.json({ error: e instanceof Error ? e.message : String(e) }, { status });
  }
}
