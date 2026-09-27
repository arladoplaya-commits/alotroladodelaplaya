import type { MetadataRoute } from "next";
import { getMenuForSeo } from "@/lib/menu-data.server";

export default function robots(): MetadataRoute.Robots {
  const data = getMenuForSeo();
  const base = (process.env.NEXT_PUBLIC_SITE_URL || data.settings.publicUrl || "").replace(/\/$/, "");

  return {
    rules: { userAgent: "*", allow: "/" },
    // Sin dirección publicada aún, se omite: un sitemap relativo no es
    // válido en robots.txt (tiene que ser absoluto).
    sitemap: base ? `${base}/sitemap.xml` : undefined,
  };
}
