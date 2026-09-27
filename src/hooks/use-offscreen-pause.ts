"use client";

import { useEffect, useRef } from "react";

/**
 * Pausa las animaciones de un bloque cuando no se ve en pantalla.
 * El teléfono deja de dibujar olas, nubes o fotos que ya pasaron: menos
 * trabajo y menos batería, sobre todo en teléfonos modestos.
 */
export function useOffscreenPause<T extends HTMLElement>() {
  const ref = useRef<T>(null);
  useEffect(() => {
    const el = ref.current;
    if (!el || typeof IntersectionObserver === "undefined") return;
    const io = new IntersectionObserver(
      ([entry]) => el.classList.toggle("aol-offscreen", !entry.isIntersecting),
      { rootMargin: "80px" }
    );
    io.observe(el);
    return () => io.disconnect();
  }, []);
  return ref;
}
