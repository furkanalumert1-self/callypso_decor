import { type ClassValue, clsx } from "clsx";
import { twMerge } from "tailwind-merge";

export function cn(...inputs: ClassValue[]) {
  return twMerge(clsx(inputs));
}

/** Default currency for this kit. The setup can switch this per project. */
export const CURRENCY = "USD";

export function formatMoney(amount: number, currency: string = CURRENCY) {
  return new Intl.NumberFormat("en-US", {
    style: "currency",
    currency,
    maximumFractionDigits: 0,
  }).format(amount);
}

export function formatNumber(n: number) {
  return new Intl.NumberFormat("en-US").format(n);
}

export function formatPercent(n: number, digits = 1) {
  return `${n > 0 ? "+" : ""}${n.toFixed(digits)}%`;
}

export function formatDate(d: Date | string, opts?: Intl.DateTimeFormatOptions) {
  const date = typeof d === "string" ? new Date(d) : d;
  return new Intl.DateTimeFormat(
    "en-US",
    opts ?? { day: "2-digit", month: "short", year: "numeric" },
  ).format(date);
}

export function formatRelative(d: Date | string) {
  const date = typeof d === "string" ? new Date(d) : d;
  const diff = Date.now() - date.getTime();
  const m = Math.floor(diff / 60000);
  if (m < 1) return "just now";
  if (m < 60) return `${m}m ago`;
  const h = Math.floor(m / 60);
  if (h < 24) return `${h}h ago`;
  const days = Math.floor(h / 24);
  if (days < 7) return `${days}d ago`;
  return formatDate(date);
}

export function initials(name: string) {
  return name
    .split(" ")
    .map((p) => p[0])
    .join("")
    .toUpperCase()
    .slice(0, 2);
}

/** Turkish lira price, e.g. ₺18.900 (tr) / TRY 18,900 (en). */
export function formatTry(amount: number, lang: "tr" | "en" = "tr") {
  return new Intl.NumberFormat(lang === "tr" ? "tr-TR" : "en-US", { style: "currency", currency: "TRY", maximumFractionDigits: 0 }).format(amount);
}

/**
 * Parse a price typed the Turkish or English way: "46.000" → 46000,
 * "18.900,50" → 18900.5, "1,299.99" → 1299.99, "₺ 7 450" → 7450.
 */
export function parsePrice(input: string): number {
  let s = input.replace(/[^\d.,]/g, "");
  if (!s) return 0;
  const lastComma = s.lastIndexOf(","), lastDot = s.lastIndexOf(".");
  if (lastComma > -1 && lastDot > -1) {
    // the later separator is the decimal one
    s = lastComma > lastDot ? s.replace(/\./g, "").replace(",", ".") : s.replace(/,/g, "");
  } else if (lastComma > -1) {
    s = /,\d{3}$/.test(s) && s.split(",").length > 1 && !/,\d{1,2}$/.test(s) ? s.replace(/,/g, "") : s.replace(",", ".");
  } else if (lastDot > -1) {
    // "46.000" / "1.250.000" are thousands; "12.5" / "12.50" are decimals
    if (/^\d{1,3}(\.\d{3})+$/.test(s)) s = s.replace(/\./g, "");
  }
  const n = Number(s);
  return Number.isFinite(n) && n > 0 ? Math.round(n * 100) / 100 : 0;
}
