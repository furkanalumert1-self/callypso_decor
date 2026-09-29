/**
 * Server-only Shopify Admin GraphQL client for importing a furniture firm's
 * products into the catalogue. The admin token never leaves the server.
 * Env: SHOPIFY_STORE_DOMAIN (e.g. my-shop.myshopify.com),
 *      SHOPIFY_ADMIN_ACCESS_TOKEN (needs the read_products scope),
 *      SHOPIFY_API_VERSION (optional, defaults to a current stable version).
 */
import type { ProductCategory } from "@/lib/demo/products";
import { guessCategory } from "@/lib/categories";

export { guessCategory };

const API_VERSION = process.env.SHOPIFY_API_VERSION || "2026-07";

export class ShopifyError extends Error {
  constructor(message: string, public status: number) {
    super(message);
  }
}

export function shopifyConfigured() {
  return Boolean(process.env.SHOPIFY_STORE_DOMAIN && process.env.SHOPIFY_ADMIN_ACCESS_TOKEN);
}

function storeDomain() {
  // accept "shop.myshopify.com", "https://shop.myshopify.com/" or "shop"
  const raw = (process.env.SHOPIFY_STORE_DOMAIN ?? "").trim().replace(/^https?:\/\//, "").replace(/\/.*$/, "");
  return raw.includes(".") ? raw : `${raw}.myshopify.com`;
}

async function gql<T>(query: string, variables: Record<string, unknown>): Promise<T> {
  const res = await fetch(`https://${storeDomain()}/admin/api/${API_VERSION}/graphql.json`, {
    method: "POST",
    headers: {
      "Content-Type": "application/json",
      "X-Shopify-Access-Token": process.env.SHOPIFY_ADMIN_ACCESS_TOKEN ?? "",
    },
    body: JSON.stringify({ query, variables }),
    cache: "no-store",
  });
  if (res.status === 401 || res.status === 403) throw new ShopifyError("Shopify rejected the access token (check it and the read_products scope)", res.status);
  if (res.status === 404) throw new ShopifyError("Shopify store not found (check SHOPIFY_STORE_DOMAIN)", 404);
  if (!res.ok) throw new ShopifyError(`Shopify error (${res.status})`, 502);
  const body = (await res.json()) as { data?: T; errors?: { message: string }[] };
  if (body.errors?.length) {
    const denied = body.errors.some((e) => /access denied|scope/i.test(e.message));
    throw new ShopifyError(denied ? "The token is missing the read_products scope" : body.errors[0].message, denied ? 403 : 502);
  }
  return body.data as T;
}

const PRODUCT_FIELDS = `
  id title handle productType vendor tags onlineStoreUrl
  description(truncateAt: 600)
  featuredMedia { preview { image { url(transform: { maxWidth: 768, preferredContentType: JPG }) } } }
  variants(first: 1) { nodes { sku price } }
`;

type RawProduct = {
  id: string; title: string; handle: string; productType: string; vendor: string; tags: string[];
  onlineStoreUrl: string | null; description: string;
  featuredMedia: { preview: { image: { url: string } | null } | null } | null;
  variants: { nodes: { sku: string | null; price: string }[] };
};

export interface ShopifyProduct {
  id: string;
  title: string;
  handle: string;
  url: string | null;
  productType: string;
  vendor: string;
  sku: string;
  price: number;
  imageUrl: string | null;
  category: ProductCategory;
  width?: number;
  depth?: number;
  height?: number;
}

/** "220x90x85 cm", "Genişlik: 220 cm" … → width/depth/height in cm (best effort). */
export function parseDimensions(text: string): Pick<ShopifyProduct, "width" | "depth" | "height"> {
  const triple = /(\d{2,3})\s*[x×*]\s*(\d{2,3})(?:\s*[x×*]\s*(\d{2,3}))?\s*cm/i.exec(text);
  if (triple) return { width: +triple[1], depth: +triple[2], height: triple[3] ? +triple[3] : undefined };
  const pick = (re: RegExp) => {
    const m = re.exec(text);
    return m ? +m[1] : undefined;
  };
  return {
    width: pick(/(?:genişlik|genislik|en|width)\s*[:=]?\s*(\d{2,3})\s*cm/i),
    depth: pick(/(?:derinlik|depth)\s*[:=]?\s*(\d{2,3})\s*cm/i),
    height: pick(/(?:yükseklik|yukseklik|boy|height)\s*[:=]?\s*(\d{2,3})\s*cm/i),
  };
}

function toProduct(p: RawProduct): ShopifyProduct {
  const variant = p.variants.nodes[0];
  return {
    id: p.id,
    title: p.title,
    handle: p.handle,
    url: p.onlineStoreUrl,
    productType: p.productType,
    vendor: p.vendor,
    sku: variant?.sku ?? "",
    price: variant ? Number(variant.price) || 0 : 0,
    imageUrl: p.featuredMedia?.preview?.image?.url ?? null,
    category: guessCategory(p.productType, p.title, p.tags.join(" ")),
    ...parseDimensions(`${p.title} ${p.description}`),
  };
}

/** Active products, newest first, 24 per page. `search` matches title/SKU. */
export async function listShopifyProducts(search: string, after: string | null) {
  const terms = search.trim().replace(/["\\]/g, "");
  const query = ["status:active", terms && `(title:*${terms}* OR sku:*${terms}*)`].filter(Boolean).join(" AND ");
  const data = await gql<{
    shop: { name: string; currencyCode: string };
    products: { pageInfo: { hasNextPage: boolean; endCursor: string | null }; nodes: RawProduct[] };
  }>(
    `query Products($query: String, $after: String) {
      shop { name currencyCode }
      products(first: 24, after: $after, query: $query, sortKey: UPDATED_AT, reverse: true) {
        pageInfo { hasNextPage endCursor }
        nodes { ${PRODUCT_FIELDS} }
      }
    }`,
    { query, after },
  );
  return {
    shop: data.shop.name,
    currency: data.shop.currencyCode,
    products: data.products.nodes.map(toProduct),
    nextCursor: data.products.pageInfo.hasNextPage ? data.products.pageInfo.endCursor : null,
  };
}

/** Full records for the chosen product IDs, each with its photo inlined as a JPEG data URL. */
export async function fetchShopifyProductsForImport(ids: string[]) {
  const data = await gql<{ nodes: (RawProduct | null)[] }>(
    `query Nodes($ids: [ID!]!) { nodes(ids: $ids) { ... on Product { ${PRODUCT_FIELDS} } } }`,
    { ids },
  );
  const products = data.nodes.filter((n): n is RawProduct => !!n && !!n.id).map(toProduct);
  return Promise.all(
    products.map(async (p) => {
      let image: string | null = null;
      // Only Shopify's own CDN URLs from the API response are fetched (no user-supplied URLs).
      if (p.imageUrl && /^https:\/\/cdn\.shopify\.com\//.test(p.imageUrl)) {
        const res = await fetch(p.imageUrl);
        if (res.ok) {
          const type = res.headers.get("content-type") ?? "image/jpeg";
          image = `data:${type};base64,${Buffer.from(await res.arrayBuffer()).toString("base64")}`;
        }
      }
      return { ...p, image };
    }),
  );
}
