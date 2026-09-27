"use client";

import { useId } from "react";

/* ------------------------------------------------------------------ */
/*  Escena playera decorativa: banderines, olas, palmera, cangrejo,    */
/*  concha, tabla de surf y carrito de playa. Solo SVG + CSS.          */
/* ------------------------------------------------------------------ */

export function Bunting({ className }: { className?: string }) {
  const flags = [
    "#e2574c",
    "#f2c230",
    "#7cb85c",
    "#e8933a",
    "#e2574c",
    "#7cb85c",
    "#f2c230",
    "#e8933a",
    "#e2574c",
    "#f2c230",
    "#7cb85c",
    "#e8933a",
  ];
  return (
    <svg viewBox="0 0 1200 64" preserveAspectRatio="none" className={className} aria-hidden="true">
      <path d="M0 4 Q300 34 600 4 Q900 -26 1200 4" fill="none" stroke="#c2542f" strokeWidth="3" />
      {flags.map((c, i) => {
        const x = 40 + i * 96;
        const dip = i < 6 ? Math.sin(((x / 1200) * 2) * Math.PI) * 14 : -Math.sin(((x / 1200) * 2) * Math.PI) * 14;
        return (
          <path
            key={i}
            d={`M${x - 14} ${6 + dip} L${x + 14} ${6 + dip} L${x} ${34 + dip} Z`}
            fill={c}
            opacity="0.92"
          />
        );
      })}
    </svg>
  );
}

export function Shoreline({ className, flip }: { className?: string; flip?: boolean }) {
  return (
    <svg
      viewBox="0 0 1440 80"
      preserveAspectRatio="none"
      className={className}
      aria-hidden="true"
      style={flip ? { transform: "scaleX(-1)" } : undefined}
    >
      <path d="M0 44 Q 180 20 360 38 T 720 38 T 1080 38 T 1440 38 V60 H0 Z" fill="#f6dfb2" />
      <path d="M0 60 Q 120 32 240 54 T 480 54 T 720 54 T 960 54 T 1200 54 T 1440 54 V80 H0 Z" fill="#a8d8dc" />
      <path d="M0 66 Q 160 48 320 62 T 640 62 T 960 62 T 1280 62 T 1440 60 V80 H0 Z" fill="#7ec4cb" />
    </svg>
  );
}

export function PalmSilhouette({ className }: { className?: string }) {
  return (
    <svg viewBox="0 0 120 120" className={className} aria-hidden="true">
      <g fill="#2f6b4f">
        <path d="M58 118 C60 90 60 60 55 40 L64 44 C62 64 64 92 66 118 Z" />
        <path d="M58 38 Q48 12 22 8 Q46 24 54 42 Z" />
        <path d="M56 40 Q36 26 14 30 Q38 36 52 46 Z" />
        <path d="M60 38 Q58 10 44 0 Q52 20 56 40 Z" />
        <path d="M62 38 Q70 12 92 6 Q72 24 66 42 Z" />
        <path d="M63 40 Q86 28 108 34 Q84 40 66 48 Z" />
        <circle cx="52" cy="46" r="5" />
        <circle cx="66" cy="48" r="5" />
      </g>
    </svg>
  );
}

export function CrabSilhouette({ className }: { className?: string }) {
  return (
    <svg viewBox="0 0 64 40" className={className} aria-hidden="true">
      <g fill="#e2574c">
        <ellipse cx="32" cy="24" rx="14" ry="9" />
        <path d="M18 18 Q10 8 4 10 Q12 14 17 22 Z" />
        <path d="M46 18 Q54 8 60 10 Q52 14 47 22 Z" />
        <circle cx="7" cy="9" r="4" />
        <circle cx="57" cy="9" r="4" />
        <path d="M20 32 L14 38 M26 33 L24 39 M38 33 L40 39 M44 32 L50 38" stroke="#e2574c" strokeWidth="2.4" strokeLinecap="round" />
        <circle cx="27" cy="22" r="1.8" fill="#fdf3e0" />
        <circle cx="37" cy="22" r="1.8" fill="#fdf3e0" />
      </g>
    </svg>
  );
}

export function ShellSilhouette({ className }: { className?: string }) {
  return (
    <svg viewBox="0 0 40 36" className={className} aria-hidden="true">
      <g fill="#f0c9a0">
        <path d="M20 34 C6 30 0 18 4 8 C8 16 12 20 20 22 C28 20 32 16 36 8 C40 18 34 30 20 34 Z" />
        <path d="M20 34 L12 12 M20 34 L20 10 M20 34 L28 12" stroke="#dfa878" strokeWidth="1.6" />
      </g>
    </svg>
  );
}

/** Sol de atardecer: disco con degradado cálido, halo suave y rayos coral */
export function SunSilhouette({ className }: { className?: string }) {
  // id único: si hay varios soles (uno oculto), el degradado no se pierde
  const gid = `aol-sun-core-${useId().replace(/:/g, "")}`;
  return (
    <svg viewBox="0 0 64 64" className={className} aria-hidden="true">
      <defs>
        <radialGradient id={gid} cx="50%" cy="42%" r="62%">
          <stop offset="0%" stopColor="#ffefad" />
          <stop offset="42%" stopColor="#ffc766" />
          <stop offset="76%" stopColor="#ff9550" />
          <stop offset="100%" stopColor="#f0654a" />
        </radialGradient>
      </defs>
      <circle cx="32" cy="32" r="26" fill="#ff9d5c" opacity="0.16" />
      <circle cx="32" cy="32" r="20.5" fill="#ffb26b" opacity="0.22" />
      <circle cx="32" cy="32" r="13.5" fill={`url(#${gid})`} />
      <g stroke="#ff8a4e" strokeWidth="3" strokeLinecap="round" opacity="0.9">
        <path d="M32 6v6.5M32 51.5V58M6 32h6.5M51.5 32H58M13.6 13.6l4.6 4.6M45.8 45.8l4.6 4.6M50.4 13.6l-4.6 4.6M18.2 45.8l-4.6 4.6" />
      </g>
    </svg>
  );
}

/** Ondulación decorativa para acompañar títulos de sección */
export function WaveRule({
  className,
  flip,
}: {
  className?: string;
  flip?: boolean;
}) {
  return (
    <svg
      viewBox="0 0 64 16"
      className={className}
      aria-hidden="true"
      style={flip ? { transform: "scaleX(-1)" } : undefined}
    >
      <path
        d="M2 9 Q10 3 18 9 T34 9 T50 9 T62 9"
        fill="none"
        stroke="currentColor"
        strokeWidth="3"
        strokeLinecap="round"
      />
    </svg>
  );
}

export function Surfboard({ className }: { className?: string }) {
  return (
    <svg viewBox="0 0 48 140" className={className} aria-hidden="true">
      <path d="M24 4 C40 30 44 70 24 132 C4 70 8 30 24 4 Z" fill="#f2c230" />
      <path d="M24 4 C40 30 44 70 24 132 C20 100 20 40 24 4 Z" fill="#e2574c" />
      <path d="M24 18 L24 118" stroke="#fdf3e0" strokeWidth="3" strokeLinecap="round" />
    </svg>
  );
}

export function BeachCart({ className }: { className?: string }) {
  return (
    <svg viewBox="0 0 96 110" className={className} aria-hidden="true">
      <rect x="10" y="30" width="76" height="44" rx="8" fill="#e2574c" />
      <rect x="10" y="30" width="76" height="12" rx="6" fill="#d66a44" opacity="0.7" />
      <path d="M18 74 L10 102 M78 74 L86 102 M48 74 L48 104" stroke="#8a5c32" strokeWidth="5" strokeLinecap="round" />
      <rect x="2" y="14" width="92" height="14" rx="7" fill="#f6dfb2" />
      <text x="48" y="25" textAnchor="middle" fontSize="10" fontWeight="800" fill="#c2542f">
        🍔🌭
      </text>
      <circle cx="48" cy="55" r="9" fill="#fdf3e0" />
      <path d="M44 55 h8 M48 51 v8" stroke="#c2542f" strokeWidth="2.4" strokeLinecap="round" />
    </svg>
  );
}

/** Ola individual repetida para el bucle sin costuras */
function WaveLayer({
  path,
  fill,
  heightClass,
  className,
  stroke,
}: {
  path: string;
  fill: string;
  heightClass: string;
  className?: string;
  stroke?: string;
}) {
  return (
    <div className={`absolute left-0 top-0 flex w-[200%] ${heightClass} ${className ?? ""}`}>
      {[0, 1].map((i) => (
        <svg
          key={i}
          viewBox="0 0 1440 72"
          preserveAspectRatio="none"
          className="h-full w-1/2 shrink-0"
          aria-hidden="true"
        >
          <path
            d={path}
            fill={fill}
            stroke={stroke}
            strokeWidth={stroke ? 4 : undefined}
            strokeLinecap="round"
            opacity={stroke ? 0.85 : undefined}
          />
        </svg>
      ))}
    </div>
  );
}

/** Mar del hero: capas de agua que cuelgan del borde superior y terminan
 *  en orilla ondulada, fundiéndose con la arena de la página. */
export function WaveBand({ className }: { className?: string }) {
  const full = "h-28 sm:h-36";
  return (
    <div
      className={`pointer-events-none absolute inset-x-0 top-0 h-28 overflow-hidden sm:h-36 ${className ?? ""}`}
      aria-hidden="true"
    >
      {/* Fondo marino: la capa más honda llega más abajo (orilla clara) */}
      <WaveLayer
        className="wave-back animate-wave-slow"
        fill="#a9ddec"
        heightClass={full}
        path="M0 0 H1440 V44 Q1330 62 1220 52 T1000 52 T780 52 T560 52 T340 52 T120 52 T0 52 Z"
      />
      <WaveLayer
        className="wave-mid animate-wave"
        fill="#7ccadb"
        heightClass={full}
        path="M0 0 H1440 V32 Q1350 50 1260 40 T1080 40 T900 40 T720 40 T540 40 T360 40 T180 40 T0 40 Z"
      />
      <WaveLayer
        className="wave-front animate-wave-slow"
        fill="#54b7cf"
        heightClass={full}
        path="M0 0 H1440 V20 Q1360 36 1280 27 T1120 27 T960 27 T800 27 T640 27 T480 27 T320 27 T160 27 T0 27 Z"
      />
      {/* Espuma sobre la línea de orilla */}
      <WaveLayer
        className="wave-foam animate-wave"
        fill="none"
        stroke="#ffffff"
        heightClass={full}
        path="M0 54 Q1330 70 1220 61 T1000 61 T780 61 T560 61 T340 61 T120 61 T0 61"
      />
    </div>
  );
}

/** Sello «HECHO AL OTRO LADO 🌊» estilo stamp */
export function StampBadge({ className }: { className?: string }) {
  return (
    <div
      className={`inline-flex rotate-[-12deg] flex-col items-center rounded-xl border-[3px] border-[#e2574c] bg-[#fdf3e0]/90 px-3 py-1.5 text-[#e2574c] shadow-[0_2px_10px_rgba(226,87,76,0.25)] ${className ?? ""}`}
    >
      <span className="font-display text-[10px] font-bold tracking-[0.18em]">HECHO</span>
      <span className="font-display text-sm font-bold leading-none tracking-wide">
        AL OTRO <span aria-hidden="true">🌊</span>
      </span>
      <span className="font-display text-[10px] font-bold tracking-[0.18em]">LADO</span>
    </div>
  );
}
