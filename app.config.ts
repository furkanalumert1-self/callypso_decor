/**
 * ┌──────────────────────────────────────────────────────────────────────────┐
 * │  app.config.ts — the single source of truth for this starter.            │
 * │  Every user-facing string is bilingual: { tr, en }.                      │
 * │  Run `/setup` (or say "bu projeyi kur") to rebrand.                       │
 * └──────────────────────────────────────────────────────────────────────────┘
 */
import type { L } from "@/lib/i18n/config";

export type IconName = string;

export interface NavItem { label: L; href: string; icon: IconName; }
export interface Feature { icon: IconName; title: L; body: L; }
export interface Stat { value: string; label: L; }
export interface PricingTier { name: string; price: string; period?: string; tagline: L; features: L[]; cta: L; featured?: boolean; }
export interface FaqItem { q: L; a: L; }
export interface Integration { key: string; name: string; envVars: string[]; required: boolean; docsUrl: string; purpose: string; }

export interface AppConfig {
  name: string;
  tagline: L;
  description: L;
  /** Company / parent brand shown in the footer. */
  company: string;
  /** Public domain — leave empty to hide it in the UI. */
  domain?: string;
  /** Public contact email — leave empty to hide it in the UI. */
  email?: string;
  logoText: string;
  accentName: string;
  marketing: {
    badge: L; heroTitle: L; heroAccent: L; heroSubtitle: L; heroCtaPrimary: L; heroCtaSecondary: L;
    features: Feature[]; stats: Stat[]; pricing: PricingTier[]; faq: FaqItem[];
  };
  nav: NavItem[];
  integrations: Integration[];
}

export const appConfig: AppConfig = {
  name: "Callypso Decor",
  company: "CallypsoTech",
  tagline: { tr: "Bir oda fotoğrafını yeni bir hayata dönüştür.", en: "Turn a room photo into a whole new look." },
  description: {
    tr: "Callypso Decor, bir odanın fotoğrafını alır ve onu farklı stillerde yeniden döşer, tadilat sonrası halini gösterir — saniyeler içinde, gerçekçi öncesi/sonrası görsellerle.",
    en: "Callypso Decor takes a photo of your room and restyles it, shows the post-renovation look — in seconds, with believable before/after visuals.",
  },
  domain: "",
  email: "",
  logoText: "CD",
  accentName: "terracotta",

  marketing: {
    badge: { tr: "Yapay zekâ iç mimar", en: "AI interior designer" },
    heroTitle: { tr: "Odanın fotoğrafını çek.", en: "Snap a photo of your room." },
    heroAccent: { tr: "Yeni halini saniyede gör.", en: "See its new life in seconds." },
    heroSubtitle: {
      tr: "Callypso Decor, telefonunla çektiğin bir oda fotoğrafını alır; İskandinav, Bohem, Japandi gibi stillerde yeniden döşer, tadilat sonrası halini öncesi/sonrası olarak gösterir. Mimar randevusu, mood board, tahmin yok.",
      en: "Callypso Decor takes a photo from your phone, restyles the space — Scandinavian, Bohemian, Japandi — and shows the renovated look as a before/after. No designer appointment, no mood board, no guessing.",
    },
    heroCtaPrimary: { tr: "Odanı dönüştür", en: "Restyle your room" },
    heroCtaSecondary: { tr: "Örnekleri gör", en: "See examples" },
    features: [
      { icon: "wand-sparkles", title: { tr: "Anında yeniden döşeme", en: "Instant restyle" }, body: { tr: "Boş ya da dolu bir odanın fotoğrafını yükle; Callypso Decor onu seçtiğin stilde, gerçekçi mobilya ve ışıkla yeniden döşer.", en: "Upload a photo of an empty or lived-in room; Callypso Decor redresses it in your chosen style with believable furniture and light." } },
      { icon: "palette", title: { tr: "12+ tasarım stili", en: "12+ design styles" }, body: { tr: "İskandinav, Bohem, Japandi, Modern, Akdeniz, Endüstriyel… Her stil kendi paleti, dokusu ve mobilya dili ile gelir.", en: "Scandinavian, Bohemian, Japandi, Modern, Mediterranean, Industrial… each with its own palette, texture and furniture language." } },
      { icon: "arrow-left-right", title: { tr: "Öncesi / sonrası", en: "Before / after" }, body: { tr: "Her sonuç gerçek odanın yanında öncesi-sonrası olarak gelir — hayal etme, gör. Tek dokunuşla karşılaştır.", en: "Every result comes as a before/after against your real room — don't imagine it, see it. Compare with one tap." } },
      { icon: "ruler", title: { tr: "Tadilat keşfi", en: "Renovation explorer" }, body: { tr: "Sadece mobilya değil: zemin, duvar rengi, mutfak tezgâhı varyantlarını dene; tadilat sonrası halini öngör.", en: "Beyond furniture: try flooring, wall color and counter variants; preview the post-renovation look." } },
      { icon: "shopping-bag", title: { tr: "Alışveriş listesi", en: "Shoppable looks" }, body: { tr: "Beğendiğin görseldeki parçalar — kanepe, halı, lamba — bütçeye göre benzer ürünlerle listelenir.", en: "The pieces in a look you love — sofa, rug, lamp — are listed as similar products matched to your budget." } },
      { icon: "users", title: { tr: "Müşteriyle paylaş", en: "Share with clients" }, body: { tr: "İç mimarlar için: her projeyi müşteriye gönderilebilir bir öncesi/sonrası galerisi olarak paylaş, onay topla.", en: "For designers: share each project as a client-ready before/after gallery, collect approvals." } },
    ],
    stats: [
      { value: "8 sn", label: { tr: "fotoğraftan yeni stile", en: "from photo to new look" } },
      { value: "12+", label: { tr: "hazır tasarım stili", en: "ready design styles" } },
      { value: "0", label: { tr: "mimar randevusu", en: "designer appointments" } },
      { value: "0", label: { tr: "anahtarla dene", en: "keys to try it" } },
    ],
    pricing: [
      { name: "Keşif", price: "₺0", period: "/ay", tagline: { tr: "Kendi evini denemek için.", en: "To try it on your own home." }, features: [{ tr: "Ayda 5 oda", en: "5 rooms / mo" }, { tr: "6 temel stil", en: "6 core styles" }, { tr: "Öncesi/sonrası", en: "Before/after" }, { tr: "Filigranlı indirme", en: "Watermarked export" }], cta: { tr: "Ücretsiz başla", en: "Start free" } },
      { name: "Ev", price: "₺249", period: "/ay", tagline: { tr: "Tüm evini yeniden tasarlayanlar için.", en: "For redesigning your whole home." }, features: [{ tr: "Sınırsız oda", en: "Unlimited rooms" }, { tr: "12+ stil + varyant", en: "12+ styles + variants" }, { tr: "Tadilat keşfi", en: "Renovation explorer" }, { tr: "Alışveriş listesi", en: "Shoppable looks" }, { tr: "Filigransız HD", en: "HD, no watermark" }], cta: { tr: "30 gün ücretsiz dene", en: "Try free for 30 days" }, featured: true },
      { name: "Stüdyo", price: "₺899", period: "/ay", tagline: { tr: "İç mimar ve ofisler için.", en: "For designers & studios." }, features: [{ tr: "Ev'deki her şey", en: "Everything in Ev" }, { tr: "Müşteri galerileri", en: "Client galleries" }, { tr: "Marka & logo", en: "Brand & logo" }, { tr: "Ekip koltukları", en: "Team seats" }], cta: { tr: "Stüdyo kur", en: "Set up a studio" } },
    ],
    faq: [
      { q: { tr: "Denemek için API anahtarı gerekli mi?", en: "Do I need API keys to try it?" }, a: { tr: "Hayır. Callypso Decor örnek projeler ve üretilmiş öncesi/sonrası görsellerle demo modda açılır — hemen tıklayabilirsin. Canlı üretim için fal.ai ve Anthropic anahtarını /setup ile bağla.", en: "No. Callypso Decor boots in demo mode with sample projects and generated before/after visuals — click around immediately. Wire your fal.ai and Anthropic keys via /setup for live generation." } },
      { q: { tr: "Sonuçlar gerçekçi mi?", en: "Are the results realistic?" }, a: { tr: "Evet. Callypso Decor odanın yapısını (pencere, oda planı, perspektif) korur ve sadece yüzeyleri, mobilyayı ve ışığı yeniden tasarlar — fotomontaj değil, inandırıcı bir öneri.", en: "Yes. Callypso Decor preserves the room's structure (windows, layout, perspective) and restyles only the surfaces, furniture and light — a believable proposal, not a fake render." } },
      { q: { tr: "Hangi odalar için çalışır?", en: "Which rooms does it work on?" }, a: { tr: "Oturma odası, yatak odası, mutfak, banyo, çalışma odası, çocuk odası ve dış mekânlar — boş ya da dolu, fark etmez.", en: "Living room, bedroom, kitchen, bathroom, home office, kids' room and outdoor spaces — empty or furnished, either way." } },
      { q: { tr: "Teknoloji nedir?", en: "What's the stack?" }, a: { tr: "Next.js 16, React 19, Tailwind v4. Görseller fal.ai, stil önerileri Anthropic ile üretilir. Her yere dağıtabileceğin standart bir uygulama.", en: "Next.js 16, React 19, Tailwind v4. Visuals via fal.ai, style guidance via Anthropic. A standard app you can deploy anywhere." } },
    ],
  },

  nav: [
    { label: { tr: "Genel", en: "Overview" }, href: "/dashboard", icon: "layout-dashboard" },
    { label: { tr: "Projeler", en: "Projects" }, href: "/projects", icon: "folder-open" },
    { label: { tr: "Stiller", en: "Styles" }, href: "/styles", icon: "palette" },
    { label: { tr: "Galeri", en: "Gallery" }, href: "/gallery", icon: "layout-grid" },
    { label: { tr: "Ayarlar", en: "Settings" }, href: "/settings", icon: "settings" },
  ],

  integrations: [
    { key: "fal", name: "fal.ai", envVars: ["FAL_KEY"], required: false, docsUrl: "https://fal.ai/dashboard/keys", purpose: "Generates the restyled / renovated before-after room visuals (image generation)." },
    { key: "anthropic", name: "Anthropic", envVars: ["ANTHROPIC_API_KEY"], required: false, docsUrl: "https://console.anthropic.com/settings/keys", purpose: "Writes style guidance, room descriptions and shopping suggestions." },
    { key: "supabase", name: "Supabase", envVars: ["NEXT_PUBLIC_SUPABASE_URL", "NEXT_PUBLIC_SUPABASE_ANON_KEY"], required: false, docsUrl: "https://supabase.com/dashboard/project/_/settings/api", purpose: "Stores projects, rooms and saved looks. Without it, runs in demo mode." },
  ],
};

export default appConfig;
