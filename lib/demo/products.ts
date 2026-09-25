/**
 * Sample furniture catalogue for demo mode. Product "photos" are inline SVG
 * studio shots on a white backdrop — a real firm uploads its own photos.
 */
import type { L } from "@/lib/i18n/config";

export type ProductCategory = "sofa" | "armchair" | "table" | "rug" | "lamp" | "storage" | "bed" | "decor";

export const categoryLabel: Record<ProductCategory, L> = {
  sofa: { tr: "Kanepe", en: "Sofa" },
  armchair: { tr: "Koltuk / Berjer", en: "Armchair" },
  table: { tr: "Masa / Sehpa", en: "Table" },
  rug: { tr: "Halı", en: "Rug" },
  lamp: { tr: "Aydınlatma", en: "Lighting" },
  storage: { tr: "Depolama / TV ünitesi", en: "Storage" },
  bed: { tr: "Yatak", en: "Bed" },
  decor: { tr: "Dekor", en: "Decor" },
};

export interface Product {
  id: string;
  name: string;
  sku: string;
  category: ProductCategory;
  price: number;          // in TRY
  width?: number;         // cm
  depth?: number;         // cm
  height?: number;        // cm
  image: string;          // data URL (product photo, ideally on a plain background)
  createdAt: string;
}

const svg = (body: string) =>
  `data:image/svg+xml;utf8,${encodeURIComponent(
    `<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 400 300" width="800" height="600"><rect width="400" height="300" fill="#ffffff"/><ellipse cx="200" cy="262" rx="150" ry="10" fill="#000" opacity="0.08"/>${body}</svg>`,
  )}`;

export const seedProducts: Product[] = [
  {
    id: "prd-luna", name: "Luna 3'lü Kanepe", sku: "CD-SF-1042", category: "sofa", price: 18900, width: 220, depth: 92, height: 84,
    createdAt: "2026-06-10T09:00:00Z",
    image: svg(`<rect x="60" y="120" width="280" height="90" rx="18" fill="#cbb89d"/><rect x="48" y="110" width="40" height="120" rx="16" fill="#bfa98b"/><rect x="312" y="110" width="40" height="120" rx="16" fill="#bfa98b"/><rect x="80" y="170" width="120" height="40" rx="10" fill="#d8c7ae"/><rect x="200" y="170" width="120" height="40" rx="10" fill="#d8c7ae"/><rect x="80" y="232" width="8" height="26" fill="#6b4f35"/><rect x="312" y="232" width="8" height="26" fill="#6b4f35"/>`),
  },
  {
    id: "prd-nordik", name: "Nordik Berjer", sku: "CD-AC-2210", category: "armchair", price: 7450, width: 78, depth: 82, height: 96,
    createdAt: "2026-06-10T09:05:00Z",
    image: svg(`<rect x="140" y="70" width="120" height="120" rx="30" fill="#8aa08a"/><rect x="120" y="150" width="160" height="60" rx="18" fill="#7c937c"/><rect x="150" y="150" width="100" height="36" rx="10" fill="#9ab39a"/><path d="M140 210 L130 258 M260 210 L270 258" stroke="#8a6a48" stroke-width="8" stroke-linecap="round"/>`),
  },
  {
    id: "prd-oval", name: "Oval Traverten Sehpa", sku: "CD-TB-3305", category: "table", price: 5200, width: 120, depth: 70, height: 38,
    createdAt: "2026-06-10T09:10:00Z",
    image: svg(`<ellipse cx="200" cy="170" rx="140" ry="42" fill="#e3d6c3"/><ellipse cx="200" cy="164" rx="140" ry="42" fill="#efe5d6"/><rect x="150" y="190" width="100" height="62" rx="8" fill="#ddcfb9"/>`),
  },
  {
    id: "prd-terra", name: "Terra Yün Halı 200×300", sku: "CD-RG-4410", category: "rug", price: 4300, width: 300, depth: 200,
    createdAt: "2026-06-10T09:15:00Z",
    image: svg(`<path d="M40 230 L110 90 L360 90 L330 230 Z" fill="#c9774e"/><path d="M70 215 L125 105 L340 105 L315 215 Z" fill="none" stroke="#f1dcc4" stroke-width="6"/><path d="M110 180 L150 120 L300 120 L285 180 Z" fill="#a85e3c"/>`),
  },
];
