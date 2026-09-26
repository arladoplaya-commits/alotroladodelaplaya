"use client";

import { useSyncExternalStore } from "react";
import { MenuView } from "@/components/menu/menu-view";
import { AdminView } from "@/components/admin/admin-view";

/* Enrutado por hash: #/admin → panel, #/ → menú
   (funciona igual en GitHub Pages y en el preview) */

function subscribeHash(onChange: () => void): () => void {
  window.addEventListener("hashchange", onChange);
  return () => window.removeEventListener("hashchange", onChange);
}

function routeSnapshot(): "menu" | "admin" {
  return window.location.hash.startsWith("#/admin") ? "admin" : "menu";
}

function routeServerSnapshot(): "menu" | "admin" {
  return "menu";
}

export default function Home() {
  const route = useSyncExternalStore(
    subscribeHash,
    routeSnapshot,
    routeServerSnapshot
  );

  return route === "admin" ? <AdminView /> : <MenuView />;
}
