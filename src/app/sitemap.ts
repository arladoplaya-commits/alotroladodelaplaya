import type { MetadataRoute } from "next";
import { getMenuForSeo } from "@/lib/menu-data.server";
import { productSlug } from "@/lib/slug";

export default function sitemap(): MetadataRoute.Sitemap {
  const data = getMenuForSeo();
  // La misma dirección que usa el QR (panel → Publicar), o la variable de
  // entorno del hosting si la pusiste ahí; si no hay ninguna, rutas relativas.
  const base = (process.env.NEXT_PUBLIC_SITE_URL || data.settings.publicUrl || "").replace(/\/$/, "");
  const now = new Date();

  const entries: MetadataRoute.Sitemap = [
    { url: base || "/", lastModified: now, changeFrequency: "daily", priority: 1 },
  ];
  for (const p of data.products) {
    const path = `/producto/${productSlug(p)}`;
    entries.push({
      url: base ? `${base}${path}` : path,
      lastModified: now,
      changeFrequency: "weekly",
      priority: 0.7,
    });
  }
  return entries;
}
