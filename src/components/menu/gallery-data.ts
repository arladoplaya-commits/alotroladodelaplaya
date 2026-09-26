import type { GalleryItem } from "@/lib/types";

/**
 * Galería por defecto de «Así se vive el shack».
 * Se usa mientras el negocio no haya subido sus propias fotos
 * (settings.gallery) desde el panel de administración.
 */
export const DEFAULT_GALLERY: GalleryItem[] = [
  {
    src: "/images/shack/s-carrito.jpg",
    caption: "El carrito al atardecer",
    alt: "Carrito del shack en la arena al atardecer",
  },
  {
    src: "/images/shack/s-barra.jpg",
    caption: "La barra y sus jugos",
    alt: "Barra de madera del shack con frutas y luces",
  },
  {
    src: "/images/shack/s-punto.jpg",
    caption: "Calle 21 e/ 14 · Vedado",
    alt: "Esquina del Vedado al anochecer con el puesto iluminado",
  },
  {
    src: "/images/shack/s-atardecer.jpg",
    caption: "Nuestra playa, la del otro lado",
    alt: "Atardecer en la playa con palmeras y tabla de surf",
  },
];
