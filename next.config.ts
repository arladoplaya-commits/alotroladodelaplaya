import type { NextConfig } from "next";

const nextConfig: NextConfig = {
  // Export estático para GitHub Pages (gratis, sin límites de build ni
  // «créditos»): todo el sitio son archivos, sin servidor Node detrás.
  // La carta funciona igual porque ya lee los datos en el navegador
  // (localStorage + Supabase + raw.githubusercontent.com), no del server.
  output: "export",
  // Si se publica en usuario.github.io/repo/ (en vez de un dominio propio
  // o usuario.github.io a secas), esta subcarpeta la fija el workflow de
  // GitHub Actions con NEXT_PUBLIC_BASE_PATH; con dominio propio se deja
  // vacía. <Link>/<Image> la añaden solos.
  basePath: process.env.NEXT_PUBLIC_BASE_PATH || "",
  images: {
    // Sin servidor no hay quien optimice las fotos al vuelo; siguen
    // viéndose bien porque ya se comprimen al subirlas desde el panel.
    unoptimized: true,
  },
  /* config options here */
  typescript: {
    ignoreBuildErrors: true,
  },
  reactStrictMode: false,
};

export default nextConfig;
