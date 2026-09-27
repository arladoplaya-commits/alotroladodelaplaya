"use client";

import { Bell, Moon, Share2, Sun } from "lucide-react";
import type { ThemeMode } from "@/lib/customer";
import { Bunting, PalmSilhouette, SunSilhouette } from "./beach-scene";
import { useOffscreenPause } from "@/hooks/use-offscreen-pause";

/* ------------------------------------------------------------------ */
/*  Postal del shack: cielo, sol, mar y palmeras. Al pasar al modo     */
/*  noche el sol se esconde en el mar y salen la luna y las estrellas. */
/* ------------------------------------------------------------------ */

const STARS = Array.from({ length: 20 }, (_, i) => ({
  left: `${(i * 37.7) % 100}%`,
  top: `${(i * 23.3) % 58}%`,
  size: i % 5 === 0 ? 3 : 2,
  delay: `${(i % 7) * 0.4}s`,
}));

/* Luciérnagas: pocas y solo dentro de la postal (antes flotaban por
   toda la página y obligaban al teléfono a redibujarla sin parar) */
const FIREFLIES = Array.from({ length: 7 }, (_, i) => ({
  left: `${8 + ((i * 13) % 84)}%`,
  size: 3 + (i % 3),
  dur: `${7 + (i % 4) * 2}s`,
  delay: `${-i * 1.7}s`,
  teal: i % 3 === 0,
}));

const WAVE_BACK = "M0 30 Q180 12 360 30 T720 30 T1080 30 T1440 30 V96 H0Z";
const WAVE_MID = "M0 22 Q120 6 240 22 T480 22 T720 22 T960 22 T1200 22 T1440 22 V74 H0Z";
const WAVE_FRONT_LINE = "M0 16 Q90 4 180 16 T360 16 T540 16 T720 16 T900 16 T1080 16 T1260 16 T1440 16";

function WaveRow({ cls, h, d, fill, foam }: { cls: string; h: number; d: string; fill: string; foam?: boolean }) {
  return (
    <div className={`pc-wave ${cls}`}>
      {[0, 1].map((i) => (
        <svg key={i} viewBox={`0 0 1440 ${h}`} preserveAspectRatio="none">
          <path fill={fill} d={d} />
          {foam && (
            <path
              fill="none"
              stroke="var(--pc-foam)"
              strokeWidth="3"
              strokeLinecap="round"
              opacity="0.8"
              d={WAVE_FRONT_LINE}
            />
          )}
        </svg>
      ))}
    </div>
  );
}

export function HeroPostcard({
  theme,
  onToggleTheme,
  unread,
  onBell,
  onShare,
  lang,
  onToggleLang,
}: {
  lang: "es" | "en";
  onToggleLang: () => void;
  theme: ThemeMode;
  onToggleTheme: (origin: HTMLElement) => void;
  unread: number;
  onBell: () => void;
  onShare: () => void;
}) {
  const night = theme === "sunset";
  const ref = useOffscreenPause<HTMLDivElement>();
  return (
    <div ref={ref} className="pc-hero">
      <div className="pc-sky-night" aria-hidden="true" />
      <div className="pc-stars" aria-hidden="true">
        {STARS.map((s, i) => (
          <span
            key={i}
            style={{ left: s.left, top: s.top, width: s.size, height: s.size, animationDelay: s.delay }}
          />
        ))}
      </div>
      <div className="pc-clouds" aria-hidden="true">
        <span style={{ width: 70, top: 58, animationDuration: "70s", animationDelay: "-20s" }} />
        <span style={{ width: 54, top: 100, animationDuration: "90s", animationDelay: "-60s", opacity: 0.8 }} />
        <span style={{ width: 62, top: 30, animationDuration: "110s", animationDelay: "-5s", opacity: 0.7 }} />
      </div>
      <div className="pc-moon" aria-hidden="true" />
      <div className="pc-sun" aria-hidden="true">
        <SunSilhouette className="h-full w-full" />
      </div>
      <div className="pc-sun-glow" aria-hidden="true" />

      <div className="pc-bunting" aria-hidden="true">
        <Bunting className="h-full w-full" />
      </div>

      <div className="pc-sea" aria-hidden="true">
        <WaveRow cls="pc-w-back" h={96} d={WAVE_BACK} fill="var(--pc-sea-back)" />
        <WaveRow cls="pc-w-mid" h={74} d={WAVE_MID} fill="var(--pc-sea-mid)" />
        <WaveRow
          cls="pc-w-front"
          h={50}
          d={`${WAVE_FRONT_LINE} V50 H0Z`}
          fill="var(--pc-sea-front)"
          foam
        />
        <div className="pc-sand">
          <svg viewBox="0 0 1440 26" preserveAspectRatio="none">
            <path fill="var(--pc-sand)" d="M0 12 Q240 0 480 10 T960 10 T1440 8 V26 H0Z" />
          </svg>
        </div>
      </div>
      <span className="pc-sparkle" style={{ right: "28%", width: 46 }} aria-hidden="true" />
      <span className="pc-sparkle" style={{ right: "33%", width: 26, bottom: 48, animationDelay: "-1s" }} aria-hidden="true" />
      <span className="pc-sparkle" style={{ right: "22%", width: 18, bottom: 40, animationDelay: "-2s" }} aria-hidden="true" />

      {night && (
        <div className="pc-fireflies" aria-hidden="true">
          {FIREFLIES.map((f, i) => (
            <span
              key={i}
              className={f.teal ? "teal" : ""}
              style={{ left: f.left, width: f.size, height: f.size, animationDuration: f.dur, animationDelay: f.delay }}
            />
          ))}
        </div>
      )}

      <div className="pc-palm pc-palm-left" aria-hidden="true">
        <PalmSilhouette className="h-full w-full" />
      </div>
      <div className="pc-palm pc-palm-right" aria-hidden="true">
        <PalmSilhouette className="h-full w-full" />
      </div>

      <div className="pc-toolbar pc-toolbar-left">
        <button
          type="button"
          onClick={onBell}
          className="pc-round"
          aria-label={
            lang === "en"
              ? `Shack notices${unread ? ` (${unread} unread)` : ""}`
              : `Avisos del shack${unread ? ` (${unread} sin leer)` : ""}`
          }
        >
          <Bell className="size-[18px]" aria-hidden="true" />
          {unread > 0 && <span className="pc-badge">{unread > 9 ? "9+" : unread}</span>}
        </button>
        <button type="button" onClick={onShare} className="pc-round" aria-label={lang === "en" ? "Share the menu" : "Compartir la carta"}>
          <Share2 className="size-[18px]" aria-hidden="true" />
        </button>
        <button
          type="button"
          onClick={onToggleLang}
          className="pc-round text-[12px] font-black tracking-wide"
          aria-label={lang === "en" ? "Ver la carta en español" : "See the menu in English"}
        >
          {lang === "en" ? "ES" : "EN"}
        </button>
      </div>
      <div className="pc-toolbar pc-toolbar-right">
        <button
          type="button"
          role="switch"
          aria-checked={night}
          aria-label={
            lang === "en"
              ? night ? "Switch to beach day" : "Switch to beach night"
              : night ? "Cambiar a modo día de playa" : "Cambiar a modo noche de playa"
          }
          onClick={(e) => onToggleTheme(e.currentTarget)}
          className="pc-switch"
        >
          <span className="pc-lbl pc-lbl-moon" aria-hidden="true">🌙</span>
          <span className="pc-lbl pc-lbl-sun" aria-hidden="true">☀️</span>
          <span className="pc-knob">
            <Sun className="pc-i-sun size-[18px]" aria-hidden="true" />
            <Moon className="pc-i-moon size-[18px]" aria-hidden="true" />
          </span>
        </button>
      </div>
    </div>
  );
}
