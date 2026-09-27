import fs from "node:fs";
import path from "node:path";
import seedRaw from "@/data/seed.json";
import type { MenuData } from "@/lib/types";

/* ------------------------------------------------------------------ */
/*  Carta para las páginas server-rendered (SEO): productos, precios y  */
/*  fotos para los buscadores y las redes. NO usar en componentes de    */
/*  cliente (esto lee el disco); ahí siempre useMenuStore.              */
/*                                                                      */
/*  Al pulsar «Publicar» en el panel, el negocio sube                   */
/*  public/data/menu.json a GitHub; Vercel/Netlify redespliegan y ese    */
/*  archivo queda servido en el propio dominio. Lo leemos directo del    */
/*  disco (sin red) para que cada visita a /producto/... muestre la      */
/*  carta de verdad. Si aún no hay nada publicado, se usa la carta de    */
/*  fábrica (src/data/seed.json) para que las páginas nunca den 404.     */
/* ------------------------------------------------------------------ */

function readPublished(): MenuData | null {
  try {
    const file = path.join(process.cwd(), "public", "data", "menu.json");
    if (!fs.existsSync(file)) return null;
    const raw = JSON.parse(fs.readFileSync(file, "utf8")) as Partial<MenuData>;
    if (Array.isArray(raw.products) && raw.products.length > 0) {
      return raw as MenuData;
    }
  } catch {
    /* carta publicada corrupta o inaccesible: seguimos con la de fábrica */
  }
  return null;
}

export function getMenuForSeo(): MenuData {
  return readPublished() ?? (seedRaw as unknown as MenuData);
}
