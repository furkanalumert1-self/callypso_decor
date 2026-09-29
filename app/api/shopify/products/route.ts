import { listShopifyProducts, shopifyConfigured, ShopifyError } from "@/lib/shopify";

/** GET /api/shopify/products?q=&after= — browse active Shopify products for import. */
export async function GET(req: Request) {
  if (!shopifyConfigured()) return Response.json({ configured: false });
  const url = new URL(req.url);
  try {
    const page = await listShopifyProducts(url.searchParams.get("q") ?? "", url.searchParams.get("after"));
    return Response.json({ configured: true, ...page });
  } catch (e) {
    const status = e instanceof ShopifyError ? e.status : 502;
    return Response.json({ configured: true, error: e instanceof Error ? e.message : String(e) }, { status });
  }
}
