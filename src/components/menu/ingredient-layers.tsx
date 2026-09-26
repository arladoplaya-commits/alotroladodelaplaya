"use client";

import { JSX } from "react";

/* ------------------------------------------------------------------ */
/*  Capas de la vista explotada: cada ingrediente se dibuja como       */
/*  una ilustración plana dentro de un viewBox 240×80.                 */
/* ------------------------------------------------------------------ */

/** Normaliza: minúsculas y sin tildes, para reconocer el ingrediente. */
function norm(s: string): string {
  return s.toLowerCase().normalize("NFD").replace(/[\u0300-\u036f]/g, "");
}

export type LayerKind =
  | "bunTop"
  | "bunBottom"
  | "bunDog"
  | "baguette"
  | "pattyChicken"
  | "pattyPork"
  | "pattyBeef"
  | "sausage"
  | "veggies"
  | "lettuce"
  | "tomato"
  | "onion"
  | "ketchup"
  | "mustard"
  | "mayo"
  | "sauce"
  | "chips"
  | "cheese"
  | "ham"
  | "pineapple"
  | "fries"
  | "egg"
  | "meatballs"
  | "croquettes"
  | "fajitas"
  | "wings"
  | "glass"
  | "ice"
  | "liquidSoda"
  | "liquidJuice"
  | "milk"
  | "coffee"
  | "foam"
  | "citrus"
  | "fruits"
  | "fallback";

export function layerKindFor(name: string): LayerKind {
  const n = norm(name);
  if (n.includes("albondiga")) return "meatballs";
  if (n.includes("pan de papa")) return "bunTop";
  if (n.includes("pan de perro")) return "bunDog";
  if (n.includes("baguette")) return "baguette";
  if (n.includes("carne") || n.includes("hamburguesa")) {
    if (n.includes("pollo")) return "pattyChicken";
    if (n.includes("cerdo")) return "pattyPork";
    return "pattyBeef";
  }
  if (n.includes("salchicha")) return "sausage";
  if (n.includes("vegetales")) return "veggies";
  if (n.includes("lechuga")) return "lettuce";
  if (n.includes("tomate")) return "tomato";
  if (n.includes("cebolla")) return "onion";
  if (n.includes("ketchup") || n.includes("catacu")) return "ketchup";
  if (n.includes("mostaza")) return "mustard";
  if (n.includes("mayonesa")) return "mayo";
  if (n.includes("salsa")) return "sauce";
  if (n.includes("chips") || n.includes("boniato")) return "chips";
  if (n.includes("queso")) return "cheese";
  if (n.includes("jamon")) return "ham";
  if (n.includes("pina")) return "pineapple";
  if (n.includes("papas") || n.includes("fritas")) return "fries";
  if (n.includes("huevo")) return "egg";
  if (n.includes("croqueta")) return "croquettes";
  if (n.includes("fajita")) return "fajitas";
  if (n.includes("alita")) return "wings";
  /* ---- bebidas ---- */
  if (n.includes("vaso") || n.includes("taza") || n.includes("botella")) return "glass";
  if (n.includes("hielo")) return "ice";
  if (
    n.includes("gaseosa") ||
    n.includes("refresco") ||
    n.includes("malta") ||
    n.includes("cerveza") ||
    n.includes("cola")
  ) {
    return "liquidSoda";
  }
  if (
    n.includes("leche") ||
    n.includes("malteada") ||
    n.includes("cremoso") ||
    n.includes("condensada")
  ) {
    return "milk";
  }
  if (n.includes("cafe")) return "coffee";
  if (n.includes("espuma") || n.includes("crema")) return "foam";
  if (
    n.includes("jugo") ||
    n.includes("limonada") ||
    n.includes("batido") ||
    n.includes("maracuya")
  ) {
    return "liquidJuice";
  }
  if (
    n.includes("limon") ||
    n.includes("naranja") ||
    n.includes("menta") ||
    n.includes("hierbabuena")
  ) {
    return "citrus";
  }
  if (
    n.includes("fresa") ||
    n.includes("fruta") ||
    n.includes("banana") ||
    n.includes("platano") ||
    n.includes("mango") ||
    n.includes("semilla")
  ) {
    return "fruits";
  }
  return "fallback";
}

export const KIND_EMOJI: Record<LayerKind, string> = {
  bunTop: "🍞",
  bunBottom: "🍞",
  bunDog: "🍞",
  baguette: "🥖",
  pattyChicken: "🍗",
  pattyPork: "🥩",
  pattyBeef: "🥩",
  sausage: "🌭",
  veggies: "🥬",
  lettuce: "🥬",
  tomato: "🍅",
  onion: "🧅",
  ketchup: "🥫",
  mustard: "🥫",
  mayo: "🥫",
  sauce: "🥫",
  chips: "🍠",
  cheese: "🧀",
  ham: "🥓",
  pineapple: "🍍",
  fries: "🍟",
  egg: "🍳",
  meatballs: "🍖",
  croquettes: "🧆",
  fajitas: "🌯",
  wings: "🍗",
  glass: "🥃",
  ice: "🧊",
  liquidSoda: "🥤",
  liquidJuice: "🧃",
  milk: "🥛",
  coffee: "☕",
  foam: "☁️",
  citrus: "🍋",
  fruits: "🍓",
  fallback: "🍽️",
};

/* --------------------------- tablero de madera --------------------------- */

export function WoodenBoard({ className }: { className?: string }) {
  return (
    <svg viewBox="0 0 288 22" className={className} aria-hidden="true">
      <rect x="2" y="4" width="284" height="14" rx="7" fill="#b07a45" />
      <rect x="2" y="4" width="284" height="7" rx="3.5" fill="#c08a52" />
      <path d="M20 8 h34 M120 8 h30 M210 8 h36" stroke="#9a6a3a" strokeWidth="1.6" strokeLinecap="round" />
      <circle cx="10" cy="11" r="2" fill="#8a5c32" />
      <circle cx="278" cy="11" r="2" fill="#8a5c32" />
    </svg>
  );
}

/* ------------------------------- las artes ------------------------------- */

const arts: Record<LayerKind, JSX.Element> = {
  bunTop: (
    <g>
      <path d="M30 62 C30 30 64 12 120 12 C176 12 210 30 210 62 Z" fill="#f0b054" />
      <path d="M30 62 C30 30 64 12 120 12 C150 12 174 18 190 30 C160 22 80 24 44 52 C38 56 33 59 30 62 Z" fill="#f6c271" />
      <path d="M44 50 Q80 40 120 39 M52 44 Q120 40 188 44 M40 34 Q120 29 200 34" stroke="#e39a3c" strokeWidth="2.4" fill="none" strokeLinecap="round" />
      <ellipse cx="78" cy="34" rx="5" ry="3" fill="#fdf3e0" transform="rotate(-14 78 34)" />
      <ellipse cx="108" cy="27" rx="5" ry="3" fill="#fdf3e0" transform="rotate(-8 108 27)" />
      <ellipse cx="140" cy="28" rx="5" ry="3" fill="#fdf3e0" transform="rotate(6 140 28)" />
      <ellipse cx="166" cy="37" rx="5" ry="3" fill="#fdf3e0" transform="rotate(12 166 37)" />
      <ellipse cx="92" cy="42" rx="5" ry="3" fill="#fdf3e0" transform="rotate(-4 92 42)" />
      <ellipse cx="128" cy="40" rx="5" ry="3" fill="#fdf3e0" transform="rotate(2 128 40)" />
      <rect x="30" y="58" width="180" height="8" rx="4" fill="#e8a94e" />
    </g>
  ),
  bunBottom: (
    <g>
      <path d="M30 34 L210 34 C214 34 216 37 216 41 L216 52 C216 60 210 66 202 66 L38 66 C30 66 24 60 24 52 L24 41 C24 37 26 34 30 34 Z" fill="#f0b054" />
      <path d="M24 52 C24 60 30 66 38 66 L202 66 C210 66 216 60 216 52 L216 48 L24 48 Z" fill="#e8a94e" />
      <rect x="24" y="34" width="192" height="6" rx="3" fill="#f6c271" />
    </g>
  ),
  bunDog: (
    <g>
      <path d="M24 36 C24 26 40 22 120 22 C200 22 216 26 216 36 L216 48 C216 60 204 64 120 64 C36 64 24 60 24 48 Z" fill="#f0b054" />
      <path d="M34 36 C60 30 180 30 206 36 L206 44 C206 50 60 50 34 44 Z" fill="#d99544" />
      <path d="M34 36 C60 30 180 30 206 36" stroke="#f6c271" strokeWidth="3" fill="none" strokeLinecap="round" />
    </g>
  ),
  baguette: (
    <g>
      <path d="M20 52 C20 38 60 28 120 28 C180 28 220 38 220 52 C220 62 180 68 120 68 C60 68 20 62 20 52 Z" fill="#e8b05e" />
      <path d="M34 48 C60 40 100 38 120 38 M60 56 C100 50 160 50 196 54 M40 42 C70 36 110 34 150 36" stroke="#d99a44" strokeWidth="3" fill="none" strokeLinecap="round" />
      <path d="M52 34 L64 44 M96 30 L104 42 M146 30 L154 42 M186 36 L196 46" stroke="#fdf3e0" strokeWidth="4.5" strokeLinecap="round" />
    </g>
  ),
  pattyBeef: (
    <g>
      <path d="M28 30 C28 22 40 18 120 18 C200 18 212 22 212 30 L212 52 C212 62 200 66 120 66 C40 66 28 62 28 52 Z" fill="#7a4326" />
      <path d="M28 30 C28 22 40 18 120 18 C150 18 172 19 186 22 C150 26 70 28 40 38 C32 41 28 36 28 30 Z" fill="#8b4f2e" />
      <circle cx="60" cy="34" r="2.4" fill="#5d3018" />
      <circle cx="96" cy="30" r="2.4" fill="#5d3018" />
      <circle cx="136" cy="33" r="2.4" fill="#5d3018" />
      <circle cx="172" cy="31" r="2.4" fill="#5d3018" />
      <circle cx="78" cy="46" r="2.4" fill="#5d3018" />
      <circle cx="120" cy="48" r="2.4" fill="#5d3018" />
      <circle cx="158" cy="45" r="2.4" fill="#5d3018" />
    </g>
  ),
  pattyPork: (
    <g>
      <path d="M28 30 C28 22 40 18 120 18 C200 18 212 22 212 30 L212 52 C212 62 200 66 120 66 C40 66 28 62 28 52 Z" fill="#a35c3a" />
      <path d="M28 30 C28 22 40 18 120 18 C150 18 172 19 186 22 C150 26 70 28 40 38 C32 41 28 36 28 30 Z" fill="#b76b46" />
      <circle cx="64" cy="36" r="2.4" fill="#7e4426" />
      <circle cx="102" cy="31" r="2.4" fill="#7e4426" />
      <circle cx="142" cy="35" r="2.4" fill="#7e4426" />
      <circle cx="176" cy="30" r="2.4" fill="#7e4426" />
      <circle cx="84" cy="48" r="2.4" fill="#7e4426" />
      <circle cx="126" cy="49" r="2.4" fill="#7e4426" />
    </g>
  ),
  pattyChicken: (
    <g>
      <path d="M28 30 C28 22 40 18 120 18 C200 18 212 22 212 30 L212 52 C212 62 200 66 120 66 C40 66 28 62 28 52 Z" fill="#e2a24e" />
      <path d="M28 30 C28 22 40 18 120 18 C150 18 172 19 186 22 C150 26 70 28 40 38 C32 41 28 36 28 30 Z" fill="#efb567" />
      <circle cx="66" cy="38" r="7" fill="#d68f3b" />
      <circle cx="120" cy="30" r="7" fill="#d68f3b" />
      <circle cx="168" cy="40" r="7" fill="#d68f3b" />
      <circle cx="96" cy="50" r="5" fill="#d68f3b" />
      <circle cx="146" cy="52" r="5" fill="#d68f3b" />
    </g>
  ),
  sausage: (
    <g>
      <path d="M22 42 C22 32 34 30 120 30 C206 30 218 32 218 42 C218 52 206 54 120 54 C34 54 22 52 22 42 Z" fill="#c2542f" />
      <path d="M22 42 C22 32 34 30 120 30 C150 30 172 31 188 33 C150 35 60 37 36 44 C26 47 22 47 22 42 Z" fill="#d66a44" />
      <path d="M30 48 C60 46 180 46 210 48" stroke="#a83f20" strokeWidth="2" fill="none" strokeLinecap="round" />
      <circle cx="212" cy="38" r="3" fill="#d66a44" />
      <circle cx="28" cy="38" r="3" fill="#d66a44" />
    </g>
  ),
  veggies: (
    <g>
      <path d="M28 40 C28 30 60 26 120 26 C180 26 212 30 212 40 C212 48 180 52 120 52 C60 52 28 48 28 40 Z" fill="#7cb85c" />
      <path d="M40 36 C70 30 100 32 120 32 M60 44 C100 40 150 42 190 44 M90 34 C130 30 160 32 180 34" stroke="#5e9e44" strokeWidth="3" fill="none" strokeLinecap="round" />
      <circle cx="58" cy="42" r="4" fill="#9ecf7e" />
      <circle cx="110" cy="46" r="4" fill="#9ecf7e" />
      <circle cx="168" cy="42" r="4" fill="#9ecf7e" />
      <rect x="76" y="36" width="3" height="10" rx="1.5" fill="#e2574c" transform="rotate(8 76 36)" />
      <rect x="140" y="34" width="3" height="10" rx="1.5" fill="#e2574c" transform="rotate(-8 140 34)" />
    </g>
  ),
  lettuce: (
    <g>
      <path d="M24 46 C24 34 44 26 60 32 C68 22 92 22 102 32 C114 22 140 22 150 32 C162 24 186 26 192 36 C206 34 216 42 214 50 C180 60 60 60 26 52 Z" fill="#8ec96a" />
      <path d="M30 50 C70 56 170 56 210 50" stroke="#6fae4e" strokeWidth="2.5" fill="none" strokeLinecap="round" />
      <path d="M56 40 C64 34 76 34 84 40 M116 38 C126 32 140 32 148 38 M176 40 C184 34 194 36 198 40" stroke="#a8dc88" strokeWidth="2.5" fill="none" strokeLinecap="round" />
    </g>
  ),
  tomato: (
    <g>
      {[58, 98, 142, 182].map((x, i) => (
        <g key={i}>
          <circle cx={x} cy="42" r="14" fill="#e2574c" />
          <circle cx={x - 4} cy="38" r="4.5" fill="#ef7a6c" />
        </g>
      ))}
    </g>
  ),
  onion: (
    <g>
      {[62, 120, 178].map((x, i) => (
        <g key={i}>
          <circle cx={x} cy="42" r="13" fill="none" stroke="#c9a0dc" strokeWidth="4" />
          <circle cx={x} cy="42" r="7" fill="none" stroke="#e3cbee" strokeWidth="2.5" />
        </g>
      ))}
    </g>
  ),
  ketchup: (
    <g>
      <path d="M30 34 C60 24 90 44 120 34 C150 24 180 44 210 34" stroke="#d43d2a" strokeWidth="8" fill="none" strokeLinecap="round" />
      <path d="M42 48 C70 40 100 54 130 46 C160 40 186 52 206 46" stroke="#d43d2a" strokeWidth="6" fill="none" strokeLinecap="round" />
    </g>
  ),
  mustard: (
    <g>
      <path d="M30 34 C60 24 90 44 120 34 C150 24 180 44 210 34" stroke="#f2c230" strokeWidth="8" fill="none" strokeLinecap="round" />
      <path d="M42 48 C70 40 100 54 130 46 C160 40 186 52 206 46" stroke="#f2c230" strokeWidth="6" fill="none" strokeLinecap="round" />
    </g>
  ),
  mayo: (
    <g>
      <path d="M30 34 C60 24 90 44 120 34 C150 24 180 44 210 34" stroke="#f7f2e6" strokeWidth="8" fill="none" strokeLinecap="round" />
      <path d="M42 48 C70 40 100 54 130 46 C160 40 186 52 206 46" stroke="#f7f2e6" strokeWidth="6" fill="none" strokeLinecap="round" />
    </g>
  ),
  sauce: (
    <g>
      <path d="M30 34 C60 24 90 44 120 34 C150 24 180 44 210 34" stroke="#b3562e" strokeWidth="8" fill="none" strokeLinecap="round" />
      <path d="M42 48 C70 40 100 54 130 46 C160 40 186 52 206 46" stroke="#b3562e" strokeWidth="6" fill="none" strokeLinecap="round" />
      <circle cx="70" cy="33" r="2" fill="#fdf3e0" />
      <circle cx="150" cy="33" r="2" fill="#fdf3e0" />
    </g>
  ),
  chips: (
    <g>
      {[
        [44, 12, -18],
        [70, 16, -8],
        [96, 12, 4],
        [122, 16, 12],
        [148, 12, -12],
        [174, 16, 6],
        [196, 12, -4],
      ].map(([x, w, r], i) => (
        <rect key={i} x={x} y={22} width={w} height={40} rx={(w as number) / 2 - 1} fill={i % 2 ? "#f0a050" : "#e8933a"} transform={`rotate(${r} ${x + (w as number) / 2} 42)`} />
      ))}
      <path d="M50 24 C80 18 160 18 190 24" stroke="#f7b56a" strokeWidth="3" fill="none" strokeLinecap="round" />
    </g>
  ),
  cheese: (
    <g>
      <path d="M28 34 L212 34 L212 44 C212 52 200 54 120 54 C40 54 28 52 28 44 Z" fill="#f9c440" />
      <path d="M28 34 L212 34 L212 38 L28 38 Z" fill="#ffd35e" />
      <circle cx="70" cy="45" r="4" fill="#e8a928" />
      <circle cx="130" cy="47" r="4" fill="#e8a928" />
      <circle cx="180" cy="45" r="4" fill="#e8a928" />
    </g>
  ),
  ham: (
    <g>
      <path d="M30 36 C60 28 100 34 120 32 C150 28 190 30 210 38 C212 44 208 50 200 52 C170 58 130 54 100 56 C70 58 40 56 32 48 C26 44 26 40 30 36 Z" fill="#f2a7a0" />
      <path d="M48 42 C80 38 150 38 192 42 M52 48 C90 44 150 44 184 48" stroke="#e08a84" strokeWidth="3" fill="none" strokeLinecap="round" />
    </g>
  ),
  pineapple: (
    <g>
      {[66, 120, 174].map((x, i) => (
        <g key={i}>
          <circle cx={x} cy="42" r="15" fill="#f9d423" />
          <circle cx={x} cy="42" r="8" fill="#fdf3e0" />
          <circle cx={x} cy="42" r="15" fill="none" stroke="#e8b418" strokeWidth="2" />
        </g>
      ))}
    </g>
  ),
  fries: (
    <g>
      {[
        [50, -14],
        [70, -6],
        [90, 0],
        [110, 6],
        [130, -8],
        [150, 0],
        [170, 10],
        [190, -2],
      ].map(([x, r], i) => (
        <rect key={i} x={x} y={22} width="9" height="42" rx="4" fill={i % 2 ? "#f5c542" : "#eeb52e"} transform={`rotate(${r} ${x + 4} 43)`} />
      ))}
    </g>
  ),
  egg: (
    <g>
      <ellipse cx="120" cy="40" rx="62" ry="22" fill="#fdf8ec" />
      <ellipse cx="120" cy="38" rx="48" ry="16" fill="#ffffff" />
      <circle cx="104" cy="36" r="10" fill="#f9b234" />
      <circle cx="101" cy="33" r="3.5" fill="#fcd581" />
    </g>
  ),
  meatballs: (
    <g>
      {[
        [64, 44, 16],
        [104, 36, 17],
        [148, 46, 16],
        [184, 36, 14],
      ].map(([x, y, r], i) => (
        <g key={i}>
          <circle cx={x} cy={y} r={r} fill="#8b4a2f" />
          <circle cx={x - (r as number) / 3} cy={y - (r as number) / 3} r={(r as number) / 3.4} fill="#a35c3a" />
        </g>
      ))}
      <path d="M52 30 C90 20 160 20 196 30" stroke="#c2542f" strokeWidth="5" fill="none" strokeLinecap="round" />
    </g>
  ),
  croquettes: (
    <g>
      {[
        [58, 40, -10],
        [100, 44, 4],
        [144, 38, -4],
        [184, 44, 10],
      ].map(([x, y, r], i) => (
        <g key={i} transform={`rotate(${r} ${x} ${y})`}>
          <rect x={(x as number) - 17} y={(y as number) - 9} width="34" height="18" rx="9" fill="#e8a94e" />
          <rect x={(x as number) - 17} y={(y as number) - 9} width="34" height="8" rx="4" fill="#f2c06e" />
          <circle cx={(x as number) - 8} cy={(y as number) + 2} r="1.6" fill="#c98d3a" />
          <circle cx={(x as number) + 4} cy={(y as number) - 1} r="1.6" fill="#c98d3a" />
        </g>
      ))}
    </g>
  ),
  fajitas: (
    <g>
      <path d="M46 24 C90 18 150 18 194 24 C202 30 202 52 194 58 C150 64 90 64 46 58 C38 52 38 30 46 24 Z" fill="#f2d0a0" />
      <path d="M52 34 C90 28 150 28 188 34 M52 44 C90 38 150 38 188 44 M56 53 C100 48 140 48 184 53" stroke="#dfb57e" strokeWidth="3" fill="none" strokeLinecap="round" />
      <path d="M60 30 C80 26 90 40 76 46 C66 50 58 40 60 30 Z" fill="#e2574c" />
      <path d="M120 28 C140 26 150 40 136 46 C124 50 114 38 120 28 Z" fill="#7cb85c" />
    </g>
  ),
  wings: (
    <g>
      {[
        [70, 40],
        [124, 42],
        [178, 38],
      ].map(([x, y], i) => (
        <g key={i}>
          <ellipse cx={x} cy={y} rx="24" ry="13" fill="#c2542f" transform={`rotate(${i % 2 ? 8 : -8} ${x} ${y})`} />
          <ellipse cx={x - 6} cy={y - 4} rx="12" ry="6" fill="#d9714c" transform={`rotate(${i % 2 ? 8 : -8} ${x} ${y})`} />
          <rect x={x + 16} y={y - 3} width="12" height="6" rx="3" fill="#fdf3e0" />
        </g>
      ))}
    </g>
  ),
  fallback: (
    <g>
      <ellipse cx="120" cy="42" rx="70" ry="20" fill="#e8d5b5" />
      <path d="M62 42 C90 32 150 32 178 42" stroke="#d0b98e" strokeWidth="3" fill="none" strokeLinecap="round" />
    </g>
  ),
  /* ------------------------------ bebidas ------------------------------ */
  glass: (
    <g>
      <path d="M80 16 L160 16 L155 66 C154 71 148 74 120 74 C92 74 86 71 85 66 Z" fill="#d7ecf5" opacity="0.8" />
      <path d="M87 24 L153 24 L149 63 C148 67 144 69 120 69 C96 69 92 67 91 63 Z" fill="#bfe3f2" opacity="0.55" />
      <rect x="78" y="13" width="84" height="7" rx="3.5" fill="#9fd4ea" />
      <ellipse cx="120" cy="17" rx="40" ry="4.5" fill="#eef9fd" />
      <path d="M95 32 L99 58 M124 28 L126 50" stroke="#ffffff" strokeWidth="4" strokeLinecap="round" opacity="0.85" />
    </g>
  ),
  ice: (
    <g>
      {([
        [72, 28, -12],
        [108, 24, 8],
        [146, 32, -6],
        [90, 42, 10],
        [130, 44, -10],
      ] as const).map(([x, y, r], i) => (
        <g key={i} transform={`rotate(${r} ${x + 13} ${y + 13})`}>
          <rect x={x} y={y} width="26" height="26" rx="6" fill="#cfeefb" opacity="0.92" />
          <rect x={x + 4} y={y + 4} width="18" height="10" rx="5" fill="#e9f8fe" opacity="0.9" />
        </g>
      ))}
      <path d="M84 34 l7 7 M122 28 l7 7 M158 40 l6 6" stroke="#ffffff" strokeWidth="3" strokeLinecap="round" />
    </g>
  ),
  liquidSoda: (
    <g>
      <path d="M30 34 C60 24 90 44 120 34 C150 24 180 44 210 34 L210 52 C210 62 190 66 120 66 C50 66 30 62 30 52 Z" fill="#c77b2e" />
      <path d="M30 34 C60 24 90 44 120 34 C150 24 180 44 210 34" stroke="#e09a44" strokeWidth="6" fill="none" strokeLinecap="round" />
      <circle cx="70" cy="48" r="3" fill="#f7d9a8" />
      <circle cx="104" cy="54" r="2.4" fill="#f7d9a8" />
      <circle cx="140" cy="47" r="3" fill="#f7d9a8" />
      <circle cx="176" cy="52" r="2.4" fill="#f7d9a8" />
    </g>
  ),
  liquidJuice: (
    <g>
      <path d="M30 34 C60 24 90 44 120 34 C150 24 180 44 210 34 L210 52 C210 62 190 66 120 66 C50 66 30 62 30 52 Z" fill="#f2a03d" />
      <path d="M30 34 C60 24 90 44 120 34 C150 24 180 44 210 34" stroke="#f7bd66" strokeWidth="6" fill="none" strokeLinecap="round" />
      <circle cx="72" cy="48" r="3" fill="#fbe3bb" />
      <circle cx="108" cy="54" r="2.4" fill="#fbe3bb" />
      <circle cx="142" cy="47" r="3" fill="#fbe3bb" />
      <circle cx="178" cy="52" r="2.4" fill="#fbe3bb" />
    </g>
  ),
  milk: (
    <g>
      <path d="M30 34 C60 24 90 44 120 34 C150 24 180 44 210 34 L210 52 C210 62 190 66 120 66 C50 66 30 62 30 52 Z" fill="#f4e6cc" />
      <path d="M30 34 C60 24 90 44 120 34 C150 24 180 44 210 34" stroke="#fdf6e9" strokeWidth="7" fill="none" strokeLinecap="round" />
      <circle cx="78" cy="50" r="2.6" fill="#fffaf0" />
      <circle cx="124" cy="54" r="2.2" fill="#fffaf0" />
      <circle cx="166" cy="49" r="2.6" fill="#fffaf0" />
    </g>
  ),
  coffee: (
    <g>
      <path d="M30 34 C60 24 90 44 120 34 C150 24 180 44 210 34 L210 52 C210 62 190 66 120 66 C50 66 30 62 30 52 Z" fill="#6b4226" />
      <path d="M30 34 C60 24 90 44 120 34 C150 24 180 44 210 34" stroke="#8a5a36" strokeWidth="6" fill="none" strokeLinecap="round" />
      <path d="M66 46 C74 42 82 50 90 46 M128 48 C136 44 144 52 152 48" stroke="#8a5a36" strokeWidth="2.4" fill="none" strokeLinecap="round" />
      <circle cx="182" cy="50" r="2.2" fill="#8a5a36" />
    </g>
  ),
  foam: (
    <g>
      <path d="M28 46 C38 32 56 30 68 40 C76 26 98 26 108 38 C118 26 140 26 150 38 C160 28 180 28 190 40 C198 32 210 36 212 46 C180 58 60 58 28 46 Z" fill="#fffaf0" />
      <circle cx="70" cy="33" r="6" fill="#ffffff" />
      <circle cx="120" cy="29" r="7" fill="#ffffff" />
      <circle cx="172" cy="33" r="6" fill="#ffffff" />
      <path d="M40 50 C80 56 160 56 200 50" stroke="#efe2c8" strokeWidth="2.5" fill="none" strokeLinecap="round" />
    </g>
  ),
  citrus: (
    <g>
      {[62, 120, 178].map((x) => (
        <g key={x}>
          <circle cx={x} cy="42" r="15" fill="#f9c440" />
          <circle cx={x} cy="42" r="11" fill="#fbe289" />
          <path
            d={`M${x} 42 L${x - 8} 34 M${x} 42 L${x + 8} 34 M${x} 42 L${x} 31 M${x} 42 L${x - 7} 49 M${x} 42 L${x + 7} 49`}
            stroke="#f2a93d"
            strokeWidth="2"
            strokeLinecap="round"
          />
          <circle cx={x} cy="42" r="15" fill="none" stroke="#e8a928" strokeWidth="2" />
        </g>
      ))}
    </g>
  ),
  fruits: (
    <g>
      {([
        [70, 40],
        [122, 44],
        [172, 38],
      ] as const).map(([x, y]) => (
        <g key={x}>
          <path
            d={`M${x} ${y - 13} C${x + 13} ${y - 13} ${x + 15} ${y + 5} ${x} ${y + 13} C${x - 15} ${y + 5} ${x - 13} ${y - 13} ${x} ${y - 13} Z`}
            fill="#e2574c"
          />
          <circle cx={x - 3} cy={y - 2} r="1.5" fill="#f9c440" />
          <circle cx={x + 3} cy={y + 2} r="1.5" fill="#f9c440" />
          <path d={`M${x} ${y - 13} l3 -5`} stroke="#5e9e44" strokeWidth="2.4" strokeLinecap="round" />
        </g>
      ))}
      <path d="M94 32 L106 52 M146 30 L158 50" stroke="#f5d67b" strokeWidth="7" strokeLinecap="round" />
    </g>
  ),
};

export function LayerArt({ kind, className }: { kind: LayerKind; className?: string }) {
  return (
    <svg viewBox="0 0 240 80" className={className} aria-hidden="true">
      {arts[kind]}
    </svg>
  );
}
