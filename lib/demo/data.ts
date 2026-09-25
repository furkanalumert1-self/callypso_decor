/**
 * Callypso Decor demo data — a week in the life of someone redesigning a home (and a
 * designer using Callypso Decor with clients). Labels are bilingual ({ tr, en }); pages
 * resolve them to the active language. Room/project names stay as content.
 * Wire fal.ai + Anthropic (run /setup) to generate real before/after looks.
 *
 * Every "render" is drawn as an on-brand inline-SVG RoomScene — no fake photos.
 */
import type { L } from "@/lib/i18n/config";
import type { RoomStyle } from "@/components/room-scene";

export type ProjectStatus = "uploaded" | "styling" | "ready" | "approved";

export interface Project {
  id: string;
  room: L;            // room type (living room, bedroom…)
  place: string;      // short location / client tag
  style: RoomStyle;   // the chosen style for the "after"
  styleName: L;
  status: ProjectStatus;
  variants: number;   // how many looks generated
  saved: number;      // saved / favourited looks
  updated: string;    // ISO
}

/* ── Status labels + tones (shared with dashboard + projects page) ────────── */
export const statusLabel: Record<ProjectStatus, L> = {
  uploaded: { tr: "Yüklendi", en: "Uploaded" },
  styling: { tr: "Tasarlanıyor", en: "Styling" },
  ready: { tr: "Hazır", en: "Ready" },
  approved: { tr: "Onaylandı", en: "Approved" },
};
export const statusTone: Record<ProjectStatus, "neutral" | "warning" | "info" | "success"> = {
  uploaded: "neutral",
  styling: "warning",
  ready: "info",
  approved: "success",
};

/* ── Room-type labels for filters ─────────────────────────────────────────── */
export const roomLiving: L = { tr: "Oturma odası", en: "Living room" };
export const roomBedroom: L = { tr: "Yatak odası", en: "Bedroom" };
export const roomKitchen: L = { tr: "Mutfak", en: "Kitchen" };
export const roomStudy: L = { tr: "Çalışma odası", en: "Home office" };
export const roomKids: L = { tr: "Çocuk odası", en: "Kids' room" };
export const roomBath: L = { tr: "Banyo", en: "Bathroom" };

export const projects: Project[] = [
  { id: "p1", room: roomLiving, place: "Cihangir · Daire", style: "iskandinav", styleName: { tr: "İskandinav", en: "Scandinavian" }, status: "ready", variants: 6, saved: 2, updated: "2026-06-13T09:10:00Z" },
  { id: "p2", room: roomBedroom, place: "Moda · Çatı katı", style: "japandi", styleName: { tr: "Japandi", en: "Japandi" }, status: "approved", variants: 8, saved: 3, updated: "2026-06-13T08:24:00Z" },
  { id: "p3", room: roomKitchen, place: "Nişantaşı · Villa", style: "modern", styleName: { tr: "Modern Minimal", en: "Modern minimal" }, status: "styling", variants: 4, saved: 1, updated: "2026-06-13T07:50:00Z" },
  { id: "p4", room: roomStudy, place: "Bebek · Ofis", style: "endustriyel", styleName: { tr: "Endüstriyel", en: "Industrial" }, status: "ready", variants: 5, saved: 2, updated: "2026-06-12T18:30:00Z" },
  { id: "p5", room: roomLiving, place: "Çeşme · Yazlık", style: "akdeniz", styleName: { tr: "Akdeniz", en: "Mediterranean" }, status: "approved", variants: 7, saved: 4, updated: "2026-06-12T16:05:00Z" },
  { id: "p6", room: roomKids, place: "Acıbadem · Daire", style: "bohem", styleName: { tr: "Bohem", en: "Bohemian" }, status: "uploaded", variants: 0, saved: 0, updated: "2026-06-12T14:40:00Z" },
];

/* ── Dashboard hero + KPIs ────────────────────────────────────────────────── */
export const studio = {
  greeting: { tr: "Merhaba Selin.", en: "Hello Selin." } as L,
  inQueue: 2,
  roomsThisMonth: "38",
  looksGenerated: "214",
  savedDelta: "+27",
};

export interface DKpi { label: L; value: string; delta?: number; hint: L; icon: string; tone: 1 | 2 | 3 | 4; }
export const kpis: DKpi[] = [
  { label: { tr: "Bu ay dönüştürülen oda", en: "Rooms restyled this month" }, value: "38", delta: 22.0, hint: { tr: "geçen aya göre", en: "vs last month" }, icon: "sofa", tone: 1 },
  { label: { tr: "Üretilen görünüm", en: "Looks generated" }, value: "214", delta: 31.5, hint: { tr: "öncesi/sonrası çift", en: "before/after pairs" }, icon: "images", tone: 2 },
  { label: { tr: "Kaydedilen favori", en: "Saved favourites" }, value: "61", delta: 18.0, hint: { tr: "bu ay +27", en: "+27 this month" }, icon: "heart", tone: 3 },
  { label: { tr: "Müşteri onayı", en: "Client approvals" }, value: "12", delta: 9.0, hint: { tr: "stüdyo projeleri", en: "studio projects" }, icon: "circle-check-big", tone: 4 },
  { label: { tr: "Ort. üretim süresi", en: "Avg. render time" }, value: "8.4sn", delta: -12.0, hint: { tr: "oda başına", en: "per room" }, icon: "timer", tone: 1 },
  { label: { tr: "Tahmini sepet", en: "Estimated basket" }, value: "₺28.7K", delta: 14.0, hint: { tr: "alışveriş listeleri", en: "shopping lists" }, icon: "shopping-bag", tone: 3 },
];

/* ── Activity timeline ────────────────────────────────────────────────────── */
export interface DActivity { id: string; who: string; action: L; target: string; at: string; }
export const activity: DActivity[] = [
  { id: "a1", who: "Sen", action: { tr: "yeni bir oda yükledi:", en: "uploaded a new room:" }, target: "Cihangir · Oturma odası", at: "2026-06-13T09:10:00Z" },
  { id: "a2", who: "Callypso Decor", action: { tr: "6 İskandinav görünüm üretti:", en: "generated 6 Scandinavian looks for" }, target: "Cihangir", at: "2026-06-13T09:11:00Z" },
  { id: "a3", who: "Sen", action: { tr: "bir görünümü favoriledi:", en: "saved a look for" }, target: "Moda · Yatak odası", at: "2026-06-13T08:26:00Z" },
  { id: "a4", who: "Müşteri", action: { tr: "öncesi/sonrası galerisini onayladı:", en: "approved the before/after gallery for" }, target: "Çeşme · Yazlık", at: "2026-06-12T16:08:00Z" },
  { id: "a5", who: "Callypso Decor", action: { tr: "tadilat varyantı önerdi:", en: "suggested a renovation variant for" }, target: "Nişantaşı · Mutfak", at: "2026-06-12T15:20:00Z" },
];

/* ── Trend (looks generated, last 14 days) ────────────────────────────────── */
export const looks14d: number[] = [6, 9, 7, 12, 10, 8, 14, 11, 9, 16, 13, 18, 15, 21];

/* ── Styles catalogue (Styles page + landing showcase) ────────────────────── */
export interface StyleDef {
  id: RoomStyle;
  name: L;
  blurb: L;
  palette: string[];   // hex swatches for the palette strip
  motifs: L;           // signature materials / motifs
}
export const styles: StyleDef[] = [
  {
    id: "iskandinav",
    name: { tr: "İskandinav", en: "Scandinavian" },
    blurb: { tr: "Açık ahşap, sade hatlar, yumuşak ışık. Az ama özenli; huzurlu ve aydınlık.", en: "Pale wood, clean lines, soft light. Less but considered; calm and bright." },
    palette: ["#efe9df", "#d8c3a5", "#a9b6a0", "#8a8d86", "#3c3a36"],
    motifs: { tr: "Açık meşe · yün · sade tekstil · yeşil bitki", en: "Light oak · wool · plain textiles · greenery" },
  },
  {
    id: "modern",
    name: { tr: "Modern Minimal", en: "Modern minimal" },
    blurb: { tr: "Sıcak nötr tonlar, net geometri, az aksesuar. Sakin bir lüks hissi.", en: "Warm neutrals, crisp geometry, few accessories. A quiet sense of luxury." },
    palette: ["#f1ede8", "#cfc6ba", "#9a8f80", "#4a4540", "#c2754a"],
    motifs: { tr: "Greige · mat metal · cam · keskin hatlar", en: "Greige · matte metal · glass · sharp edges" },
  },
  {
    id: "bohem",
    name: { tr: "Bohem", en: "Bohemian" },
    blurb: { tr: "Toprak tonları, rattan, katmanlı kilimler ve bol bitki. Sıcak ve özgür.", en: "Earth tones, rattan, layered rugs and lots of plants. Warm and free-spirited." },
    palette: ["#f3e2d0", "#dca06a", "#c1582f", "#7a8b5a", "#5a3922"],
    motifs: { tr: "Terrakota · rattan · kilim · makrome · bitki", en: "Terracotta · rattan · kilim · macramé · plants" },
  },
  {
    id: "japandi",
    name: { tr: "Japandi", en: "Japandi" },
    blurb: { tr: "Japon sadeliği ile İskandinav sıcaklığının buluşması. Doğal, dengeli, dingin.", en: "Japanese restraint meets Scandinavian warmth. Natural, balanced, serene." },
    palette: ["#ece6da", "#c9bba4", "#8d9a86", "#54514b", "#2b2824"],
    motifs: { tr: "Yulaf rengi · siyah · bambu · seramik · boşluk", en: "Oat · black · bamboo · ceramics · negative space" },
  },
  {
    id: "akdeniz",
    name: { tr: "Akdeniz", en: "Mediterranean" },
    blurb: { tr: "Badanalı duvarlar, okra ve zeytin, doğal taş. Güneşli, ferah, davetkâr.", en: "Whitewashed walls, ochre and olive, natural stone. Sunny, airy, inviting." },
    palette: ["#faf4e8", "#e8c98a", "#cf9b4e", "#7e8f5b", "#3f5b8a"],
    motifs: { tr: "Badana · taş · keten · zeytin yeşili · seramik", en: "Whitewash · stone · linen · olive green · tilework" },
  },
  {
    id: "endustriyel",
    name: { tr: "Endüstriyel", en: "Industrial" },
    blurb: { tr: "Açık tuğla, beton, ham metal ve pirinç detaylar. Karakterli ve sağlam.", en: "Exposed brick, concrete, raw metal and brass detail. Characterful and solid." },
    palette: ["#cdbfae", "#9a8f82", "#6c6359", "#3a342e", "#caa15a"],
    motifs: { tr: "Beton · tuğla · çelik · pirinç · deri", en: "Concrete · brick · steel · brass · leather" },
  },
];

/* ── Renovation explorer (surface variants for the active project) ────────── */
export interface RenoVariant { id: string; style: RoomStyle; label: L; swatch: string; note: L; }
export const renoMeta = {
  title: { tr: "Tadilat keşfi", en: "Renovation explorer" } as L,
  sub: { tr: "Cihangir · Oturma odası — yüzey varyantları", en: "Cihangir · Living room — surface variants" } as L,
};
export const reno: RenoVariant[] = [
  { id: "r1", style: "iskandinav", label: { tr: "Açık meşe zemin", en: "Light oak floor" }, swatch: "#d8c3a5", note: { tr: "Aydınlık, ferah", en: "Bright, airy" } },
  { id: "r2", style: "japandi", label: { tr: "Füme parke", en: "Smoked parquet" }, swatch: "#7a6a52", note: { tr: "Sıcak, sakin", en: "Warm, calm" } },
  { id: "r3", style: "modern", label: { tr: "Mikro beton", en: "Micro concrete" }, swatch: "#cfc6ba", note: { tr: "Sade, modern", en: "Plain, modern" } },
  { id: "r4", style: "akdeniz", label: { tr: "Terrakota karo", en: "Terracotta tile" }, swatch: "#cf9b4e", note: { tr: "Davetkâr", en: "Inviting" } },
];

/* ── Render-jobs queue (dashboard) ────────────────────────────────────────── */
export type JobState = "queued" | "rendering" | "done";
export interface RenderJob { id: string; room: L; style: RoomStyle; styleName: L; state: JobState; progress: number; eta: L; }
export const renderJobs: RenderJob[] = [
  { id: "j1", room: roomLiving, style: "iskandinav", styleName: { tr: "İskandinav", en: "Scandinavian" }, state: "rendering", progress: 72, eta: { tr: "~6 sn", en: "~6s" } },
  { id: "j2", room: roomKitchen, style: "modern", styleName: { tr: "Modern", en: "Modern" }, state: "rendering", progress: 38, eta: { tr: "~14 sn", en: "~14s" } },
  { id: "j3", room: roomBedroom, style: "japandi", styleName: { tr: "Japandi", en: "Japandi" }, state: "queued", progress: 0, eta: { tr: "sırada", en: "in queue" } },
  { id: "j4", room: roomStudy, style: "endustriyel", styleName: { tr: "Endüstriyel", en: "Industrial" }, state: "done", progress: 100, eta: { tr: "bitti", en: "done" } },
];

/* ── Styles-usage breakdown (this month) ──────────────────────────────────── */
export interface StyleUsage { style: RoomStyle; name: L; pct: number; swatch: string; }
export const styleUsage: StyleUsage[] = [
  { style: "iskandinav", name: { tr: "İskandinav", en: "Scandinavian" }, pct: 34, swatch: "#d8c3a5" },
  { style: "bohem", name: { tr: "Bohem", en: "Bohemian" }, pct: 24, swatch: "#c1582f" },
  { style: "japandi", name: { tr: "Japandi", en: "Japandi" }, pct: 18, swatch: "#8d9a86" },
  { style: "modern", name: { tr: "Modern", en: "Modern" }, pct: 14, swatch: "#9a8f80" },
  { style: "akdeniz", name: { tr: "Akdeniz", en: "Mediterranean" }, pct: 10, swatch: "#e8c98a" },
];

/* ── Shop-the-look product panel ──────────────────────────────────────────── */
export interface ShopProduct { id: string; name: L; meta: L; price: string; icon: string; }
export const shopProducts: ShopProduct[] = [
  { id: "s1", name: { tr: "Keten kanepe", en: "Linen sofa" }, meta: { tr: "3'lü · bej", en: "3-seat · beige" }, price: "₺18.900", icon: "armchair" },
  { id: "s2", name: { tr: "Dokuma kilim", en: "Woven rug" }, meta: { tr: "160×230 · toprak", en: "160×230 · earth" }, price: "₺3.250", icon: "flower-2" },
  { id: "s3", name: { tr: "Pirinç lambader", en: "Brass floor lamp" }, meta: { tr: "ayaklı · sıcak", en: "standing · warm" }, price: "₺2.480", icon: "lamp" },
  { id: "s4", name: { tr: "Meşe sehpa", en: "Oak coffee table" }, meta: { tr: "oval · doğal", en: "oval · natural" }, price: "₺4.120", icon: "table" },
];
export const shopTotal = "₺28.750";

/* ── Per-room cost-estimate panel ─────────────────────────────────────────── */
export interface CostRow { id: string; label: L; value: string; pct: number; }
export const costMeta = {
  title: { tr: "Oda maliyet tahmini", en: "Room cost estimate" } as L,
  sub: { tr: "Cihangir · Oturma odası — İskandinav", en: "Cihangir · Living room — Scandinavian" } as L,
  total: "₺46.300",
  totalLabel: { tr: "tahmini toplam", en: "estimated total" } as L,
};
export const costRows: CostRow[] = [
  { id: "c1", label: { tr: "Mobilya", en: "Furniture" }, value: "₺28.750", pct: 62 },
  { id: "c2", label: { tr: "Zemin & duvar", en: "Floor & walls" }, value: "₺9.400", pct: 20 },
  { id: "c3", label: { tr: "Aydınlatma", en: "Lighting" }, value: "₺4.150", pct: 9 },
  { id: "c4", label: { tr: "Tekstil & aksesuar", en: "Textiles & decor" }, value: "₺4.000", pct: 9 },
];

/* ── Saved moodboards strip ───────────────────────────────────────────────── */
export interface Moodboard { id: string; title: L; styles: RoomStyle[]; saved: number; }
export const moodboards: Moodboard[] = [
  { id: "m1", title: { tr: "Salon fikirleri", en: "Living room ideas" }, styles: ["iskandinav", "japandi", "bohem"], saved: 14 },
  { id: "m2", title: { tr: "Yazlık paleti", en: "Summer house palette" }, styles: ["akdeniz", "bohem", "modern"], saved: 9 },
  { id: "m3", title: { tr: "Çalışma köşesi", en: "Work corner" }, styles: ["endustriyel", "modern", "japandi"], saved: 7 },
  { id: "m4", title: { tr: "Çocuk odası", en: "Kids' room" }, styles: ["bohem", "iskandinav", "akdeniz"], saved: 11 },
];

/* ── Gallery items (community / your saved looks) ─────────────────────────── */
export interface GalleryItem { id: string; style: RoomStyle; title: L; room: L; likes: number; }
export const gallery: GalleryItem[] = [
  { id: "g1", style: "bohem", title: { tr: "Güneşli salon", en: "Sunlit lounge" }, room: roomLiving, likes: 248 },
  { id: "g2", style: "japandi", title: { tr: "Sakin yatak odası", en: "Calm bedroom" }, room: roomBedroom, likes: 192 },
  { id: "g3", style: "modern", title: { tr: "Mat mutfak", en: "Matte kitchen" }, room: roomKitchen, likes: 174 },
  { id: "g4", style: "iskandinav", title: { tr: "Aydınlık çalışma", en: "Bright study" }, room: roomStudy, likes: 156 },
  { id: "g5", style: "akdeniz", title: { tr: "Yazlık ferahlık", en: "Summer house air" }, room: roomLiving, likes: 221 },
  { id: "g6", style: "endustriyel", title: { tr: "Tuğla loft", en: "Brick loft" }, room: roomStudy, likes: 138 },
  { id: "g7", style: "iskandinav", title: { tr: "Huzurlu köşe", en: "Peaceful corner" }, room: roomLiving, likes: 167 },
  { id: "g8", style: "bohem", title: { tr: "Katmanlı çocuk odası", en: "Layered kids' room" }, room: roomKids, likes: 145 },
  { id: "g9", style: "japandi", title: { tr: "Dengeli banyo", en: "Balanced bath" }, room: roomBath, likes: 129 },
  { id: "g10", style: "modern", title: { tr: "Sade salon", en: "Quiet living room" }, room: roomLiving, likes: 203 },
  { id: "g11", style: "akdeniz", title: { tr: "Okra mutfak", en: "Ochre kitchen" }, room: roomKitchen, likes: 158 },
  { id: "g12", style: "endustriyel", title: { tr: "Beton yatak odası", en: "Concrete bedroom" }, room: roomBedroom, likes: 112 },
];
