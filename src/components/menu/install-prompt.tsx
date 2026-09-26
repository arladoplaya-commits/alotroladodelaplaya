"use client";

import { useEffect, useState } from "react";
import { Download } from "lucide-react";
import { toast } from "sonner";
import { buzz } from "@/lib/customer";

interface BeforeInstallPromptEvent extends Event {
  prompt: () => Promise<void>;
  userChoice: Promise<{ outcome: "accepted" | "dismissed" }>;
}

/**
 * Botón «Instalar la carta como app» (PWA).
 * · Chrome/Android/Edge: usa el aviso nativo (beforeinstallprompt).
 * · iPhone/iPad: enseña la guía (Compartir → Añadir a pantalla de inicio).
 * · Si ya está instalada en modo app, no aparece.
 */
export function InstallButton() {
  const [deferred, setDeferred] = useState<BeforeInstallPromptEvent | null>(null);
  const [hidden, setHidden] = useState(true);

  useEffect(() => {
    try {
      const standalone =
        window.matchMedia("(display-mode: standalone)").matches ||
        (window.navigator as Navigator & { standalone?: boolean })
          .standalone === true;
      if (standalone) return;
    } catch {
      return;
    }

    const onPrompt = (e: Event) => {
      e.preventDefault();
      setDeferred(e as BeforeInstallPromptEvent);
      setHidden(false);
    };
    const onInstalled = () => setHidden(true);
    window.addEventListener("beforeinstallprompt", onPrompt);
    window.addEventListener("appinstalled", onInstalled);

    /* iOS no dispara beforeinstallprompt: botón con guía */
    let iosTimer: number | null = null;
    const isIOS = /iphone|ipad|ipod/i.test(window.navigator.userAgent);
    if (isIOS) {
      iosTimer = window.setTimeout(() => setHidden(false), 0);
    }

    return () => {
      window.removeEventListener("beforeinstallprompt", onPrompt);
      window.removeEventListener("appinstalled", onInstalled);
      if (iosTimer !== null) window.clearTimeout(iosTimer);
    };
  }, []);

  if (hidden) return null;

  const install = async () => {
    buzz(18);
    if (deferred) {
      try {
        await deferred.prompt();
        const choice = await deferred.userChoice;
        if (choice.outcome === "accepted") {
          toast.success("¡Carta instalada! 🌊", {
            description: "Ya tienes el shack en tu pantalla de inicio.",
          });
        }
      } catch {
        /* el usuario cerró el diálogo */
      }
      setDeferred(null);
      return;
    }
    toast("📱 Instalar la carta", {
      description:
        "iPhone: Compartir ▲ → «Añadir a pantalla de inicio». Android: menú ⋮ → «Instalar aplicación».",
      duration: 9000,
    });
  };

  return (
    <button
      type="button"
      onClick={() => void install()}
      aria-label="Instalar la carta como aplicación"
      className="grid size-9 place-items-center rounded-full bg-white text-[#c2542f] shadow-sm ring-1 ring-[#f0dfc0] transition hover:bg-[#fdf3e0] active:scale-95"
    >
      <Download className="size-4" aria-hidden="true" />
    </button>
  );
}
