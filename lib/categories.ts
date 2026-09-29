import type { ProductCategory } from "@/lib/demo/products";

/**
 * Keyword → catalogue category (Turkish + English). Order matters: specific
 * first. Matched at a word start so Turkish suffixes still hit ("masası",
 * "halısı"); text is lower-cased with Turkish rules (İ→i, I→ı).
 */
const CATEGORY_WORDS: [ProductCategory, string[]][] = [
  ["rug", ["halı", "hali", "kilim", "rug", "carpet"]],
  ["lamp", ["lamba", "lambader", "aydınlatma", "aydinlatma", "abajur", "avize", "lamp", "lighting", "chandelier", "sconce"]],
  ["bed", ["yatak", "baza", "karyola", "bed", "headboard"]],
  ["storage", ["tv ünite", "tv unite", "ünite", "dolap", "kitaplık", "kitaplik", "konsol", "şifonyer", "sifonyer", "komodin", "vitrin", "gardırop", "gardirop", "storage", "cabinet", "sideboard", "bookcase", "dresser", "wardrobe", "shelf", "shelv"]],
  ["table", ["masa", "sehpa", "table", "desk"]],
  ["sofa", ["kanepe", "koltuk takım", "köşe takım", "kose takim", "çekyat", "cekyat", "3'lü", "3lü", "2'li", "2li", "4'lü", "4lü", "üçlü", "ikili", "sofa", "couch", "sectional", "loveseat"]],
  ["armchair", ["berjer", "tekli", "koltuk", "puf", "sandalye", "armchair", "chair", "pouf", "ottoman"]],
];

const escape = (w: string) => w.replace(/[.*+?^${}()|[\]\\]/g, "\\$&");
const CATEGORY_RULES: [ProductCategory, RegExp][] = CATEGORY_WORDS.map(([cat, words]) => [
  cat,
  new RegExp(`(?<![\\p{L}\\d])(?:${words.map(escape).join("|")})`, "u"),
]);

export function guessCategory(...texts: string[]): ProductCategory {
  const text = texts.join(" ").toLocaleLowerCase("tr");
  return CATEGORY_RULES.find(([, re]) => re.test(text))?.[0] ?? "decor";
}
