/**
 * RoomScene — hand-drawn inline-SVG interior "renders". Stands in for the
 * AI-generated before/after looks in demo mode, but reads as curated, on-brand
 * art rather than a flat placeholder. Parameterised by style + furnished state.
 *
 * The same room geometry (back wall, arched window, floor, side wall) is drawn
 * empty (`furnished=false`) or dressed in a named style (`furnished=true`),
 * each with its own palette. No fake photos — everything is vector.
 */
import type { CSSProperties } from "react";

export type RoomStyle =
  | "iskandinav"  // Scandinavian — pale wood, soft greys, sage
  | "modern"      // Modern minimal — warm greige, charcoal accents
  | "bohem"       // Bohemian — terracotta, rattan, layered textiles
  | "japandi"     // Japandi — oat, black, muted green
  | "akdeniz"     // Mediterranean — whitewash, ochre, olive
  | "endustriyel"; // Industrial — concrete, brick, brass

/** Per-style palette. h = primary hue, accent = secondary furniture hue. */
const PALETTE: Record<RoomStyle, { wall: string; floor: string; sofa: string; cushion: string; accent: string; plant: string; rug: string }> = {
  iskandinav:   { wall: "94% 0.012 95", floor: "82% 0.05 70",  sofa: "86% 0.02 80",  cushion: "70% 0.06 150", accent: "62% 0.04 250", plant: "58% 0.11 150", rug: "90% 0.015 90" },
  modern:       { wall: "90% 0.012 70", floor: "70% 0.045 60", sofa: "45% 0.02 50",  cushion: "65% 0.13 40",  accent: "40% 0.02 40",  plant: "55% 0.1 150",  rug: "86% 0.018 60" },
  bohem:        { wall: "93% 0.025 55", floor: "68% 0.07 55",  sofa: "62% 0.12 40",  cushion: "70% 0.13 25",  accent: "60% 0.1 75",   plant: "56% 0.12 145", rug: "78% 0.07 45" },
  japandi:      { wall: "91% 0.018 80", floor: "74% 0.05 70",  sofa: "78% 0.025 80", cushion: "40% 0.02 60",  accent: "52% 0.06 150", plant: "54% 0.09 150", rug: "88% 0.02 75" },
  akdeniz:      { wall: "96% 0.01 90",  floor: "84% 0.04 75",  sofa: "92% 0.012 90", cushion: "68% 0.12 70",  accent: "58% 0.09 145", plant: "55% 0.11 145", rug: "90% 0.02 80" },
  endustriyel:  { wall: "72% 0.012 60", floor: "58% 0.02 55",  sofa: "48% 0.04 45",  cushion: "60% 0.12 45",  accent: "66% 0.1 75",   plant: "52% 0.1 150",  rug: "66% 0.02 55" },
};

const SUN = "#f4d6a8";

export function RoomScene({
  style = "iskandinav",
  furnished = true,
  className,
  styleProp,
}: { style?: RoomStyle; furnished?: boolean; className?: string; styleProp?: CSSProperties }) {
  const p = PALETTE[style];
  const id = `${style}-${furnished ? "f" : "e"}`;
  // Empty room reads cooler / barer; furnished gets the style's warmth.
  const wall = furnished ? p.wall : "88% 0.01 80";
  const floor = furnished ? p.floor : "78% 0.02 70";

  return (
    <svg viewBox="0 0 400 300" className={className} style={styleProp} preserveAspectRatio="xMidYMid slice" aria-hidden>
      <defs>
        <linearGradient id={`wall-${id}`} x1="0" y1="0" x2="0" y2="1">
          <stop offset="0" stopColor={`oklch(${wall})`} />
          <stop offset="1" stopColor={`oklch(${furnished ? p.wall : "84% 0.012 80"})`} stopOpacity="0.85" />
        </linearGradient>
        <radialGradient id={`win-${id}`} cx="0.5" cy="0.3" r="0.8">
          <stop offset="0" stopColor="#fbf0d8" />
          <stop offset="0.5" stopColor={SUN} />
          <stop offset="1" stopColor="#e9c98e" />
        </radialGradient>
        <linearGradient id={`light-${id}`} x1="0" y1="0" x2="0.4" y2="1">
          <stop offset="0" stopColor="#fff6e2" stopOpacity="0.5" />
          <stop offset="1" stopColor="#fff6e2" stopOpacity="0" />
        </linearGradient>
      </defs>

      {/* back wall */}
      <rect width="400" height="300" fill={`url(#wall-${id})`} />
      {/* skirting + floor */}
      <rect y="214" width="400" height="86" fill={`oklch(${floor})`} />
      <rect y="210" width="400" height="6" fill={`oklch(${furnished ? p.floor : "70% 0.02 65"})`} opacity="0.6" />
      {/* floor boards */}
      {furnished &&
        Array.from({ length: 6 }).map((_, i) => (
          <line key={i} x1={-20 + i * 80} y1="214" x2={20 + i * 80} y2="300" stroke={`oklch(${p.floor})`} strokeWidth="1.5" opacity="0.45" />
        ))}

      {/* arched window — the signature of every Oda room */}
      <path d="M250 174 V96 a44 44 0 0 1 88 0 V174 Z" fill={`url(#win-${id})`} />
      <path d="M250 174 V96 a44 44 0 0 1 88 0 V174" fill="none" stroke="#fff" strokeWidth="6" />
      <line x1="294" y1="52" x2="294" y2="174" stroke="#fff" strokeWidth="3.5" />
      <line x1="250" y1="118" x2="338" y2="118" stroke="#fff" strokeWidth="3.5" opacity="0.85" />
      {/* sun beam across floor */}
      <path d="M250 174 L338 174 L360 300 L150 300 Z" fill={`url(#light-${id})`} />

      {/* left wall art / shelf — present even when empty (subtle), styled when furnished */}
      <rect x="44" y="86" width="58" height="74" rx="3" fill={furnished ? `oklch(${p.accent})` : "oklch(82% 0.01 80)"} opacity={furnished ? 0.9 : 0.5} />
      <rect x="44" y="86" width="58" height="74" rx="3" fill="none" stroke="#fff" strokeWidth="3" opacity="0.7" />

      {furnished && (
        <g>
          {/* rug */}
          <ellipse cx="160" cy="262" rx="128" ry="22" fill={`oklch(${p.rug})`} />
          <ellipse cx="160" cy="262" rx="128" ry="22" fill="none" stroke={`oklch(${p.accent})`} strokeWidth="2" opacity="0.4" />

          {/* sofa */}
          <rect x="56" y="190" width="172" height="52" rx="12" fill={`oklch(${p.sofa})`} />
          <rect x="50" y="168" width="184" height="36" rx="14" fill={`oklch(${p.sofa})`} />
          <rect x="50" y="184" width="184" height="14" rx="6" fill="#000" opacity="0.07" />
          {/* sofa legs */}
          <rect x="64" y="240" width="7" height="16" rx="2" fill={`oklch(${p.floor})`} opacity="0.8" />
          <rect x="214" y="240" width="7" height="16" rx="2" fill={`oklch(${p.floor})`} opacity="0.8" />
          {/* cushions */}
          <rect x="70" y="176" width="40" height="34" rx="8" fill={`oklch(${p.cushion})`} />
          <rect x="120" y="178" width="36" height="32" rx="8" fill={`oklch(${p.accent})`} opacity="0.85" />

          {/* coffee table */}
          <ellipse cx="150" cy="256" rx="46" ry="11" fill={`oklch(${p.floor})`} />
          <ellipse cx="150" cy="252" rx="46" ry="11" fill={`oklch(${p.sofa})`} opacity="0.55" />
          <rect x="124" y="252" width="5" height="14" fill={`oklch(${p.floor})`} />
          <rect x="171" y="252" width="5" height="14" fill={`oklch(${p.floor})`} />

          {/* floor lamp */}
          <rect x="356" y="150" width="4" height="92" fill={`oklch(${p.accent})`} opacity="0.85" />
          <path d="M348 150 h24 l-6 22 h-12 Z" fill={SUN} opacity="0.92" />

          {/* plant */}
          <rect x="22" y="206" width="26" height="36" rx="4" fill={`oklch(${p.sofa})`} opacity="0.9" />
          <path d="M35 206 q-18 -28 -6 -50 q2 22 10 30 q-2 -26 8 -38 q0 24 0 40 q10 -16 20 -18 q-12 14 -16 36 Z" fill={`oklch(${p.plant})`} />

          {/* small wall sconce glow */}
          <circle cx="200" cy="60" r="6" fill={SUN} opacity="0.8" />
        </g>
      )}

      {!furnished && (
        <g>
          {/* a lone moving box + faint outline where furniture will go */}
          <rect x="80" y="196" width="44" height="44" rx="3" fill="oklch(74% 0.04 65)" />
          <rect x="80" y="196" width="44" height="44" rx="3" fill="none" stroke="oklch(60% 0.04 60)" strokeWidth="1.5" />
          <line x1="80" y1="212" x2="124" y2="212" stroke="oklch(60% 0.04 60)" strokeWidth="1.5" />
          <rect x="56" y="190" width="172" height="52" rx="12" fill="none" stroke="oklch(70% 0.02 70)" strokeWidth="2" strokeDasharray="6 6" opacity="0.6" />
        </g>
      )}

      {/* gentle vignette */}
      <rect width="400" height="300" fill="#3a2415" opacity="0.04" />
    </svg>
  );
}
