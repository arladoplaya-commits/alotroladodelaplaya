"use client";

import { useEffect } from "react";
import { MenuView } from "@/components/menu/menu-view";

/* Solo la carta: el panel vive aparte en /admin (ruta propia de Next),
   así el código del admin ni se descarga cuando un cliente entra aquí.
   Si alguien llega con un enlace viejo tipo #/admin, lo mandamos allí. */

export default function Home() {
  useEffect(() => {
    if (window.location.hash.startsWith("#/admin")) {
      window.location.replace("/admin");
    }
  }, []);

  return <MenuView />;
}
