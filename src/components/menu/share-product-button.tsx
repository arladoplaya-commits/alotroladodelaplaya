"use client";

import { useState } from "react";
import { Share2 } from "lucide-react";

/** Comparte (o copia) el enlace directo de un producto */
export function ShareProductButton({ name, slug }: { name: string; slug: string }) {
  const [copied, setCopied] = useState(false);

  const share = async () => {
    const url = `${window.location.origin}/producto/${slug}`;
    if (navigator.share) {
      try {
        await navigator.share({ title: name, url });
        return;
      } catch {
        /* el cliente canceló: seguimos con copiar como respaldo */
      }
    }
    try {
      await navigator.clipboard.writeText(url);
      setCopied(true);
      window.setTimeout(() => setCopied(false), 2000);
    } catch {
      /* sin portapapeles: no pasa nada, solo no confirmamos */
    }
  };

  return (
    <button
      type="button"
      onClick={() => void share()}
      className="inline-flex h-11 w-full items-center justify-center gap-2 rounded-2xl text-sm font-bold text-[#8a7350] ring-1 ring-[#f0dfc0] transition hover:bg-white"
    >
      <Share2 className="size-4" aria-hidden="true" />
      {copied ? "¡Enlace copiado! 🔗" : "Compartir este antojo"}
    </button>
  );
}
