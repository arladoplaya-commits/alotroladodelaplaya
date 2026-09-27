import type { Metadata } from "next";
import Image from "next/image";
import Link from "next/link";
import { notFound } from "next/navigation";
import { getMenuForSeo } from "@/lib/menu-data.server";
import { findProductBySlug, productSlug } from "@/lib/slug";
import { ShareProductButton } from "@/components/menu/share-product-button";

/* ------------------------------------------------------------------ */
/*  Página propia de cada producto: /producto/<slug>. Se puede         */
/*  compartir, la indexan los buscadores (título, descripción, foto,   */
/*  precio con datos estructurados) y «Pedir en la carta» abre el      */
/*  personalizador de siempre en la app de una sola página.            */
/*                                                                      */
/*  Se genera para cada producto de la carta publicada (o la de        */
/*  fábrica si aún no se publicó nada) y también resuelve slugs nuevos  */
/*  que aparezcan después de un despliegue (dynamicParams).             */
/* ------------------------------------------------------------------ */

export const revalidate = 0; // siempre la carta publicada más reciente

export async function generateStaticParams() {
  const data = getMenuForSeo();
  return data.products.map((p) => ({ slug: productSlug(p) }));
}

export const dynamicParams = true;

function money(currency: string, value: number): string {
  return `${value.toLocaleString("es-CU")} ${currency || "MN"}`.trim();
}

export async function generateMetadata({
  params,
}: {
  params: Promise<{ slug: string }>;
}): Promise<Metadata> {
  const { slug } = await params;
  const data = getMenuForSeo();
  const product = findProductBySlug(data.products, slug);
  if (!product) return { title: "Producto no encontrado" };

  const title = `${product.emoji} ${product.name} · ${data.settings.businessName}`;
  const description = `${product.description} — ${money(data.settings.currency, product.price)}. ${data.settings.deliveryPoint}.`;
  const canonicalSlug = productSlug(product);
  const images = product.image ? [{ url: product.image, width: 1200, height: 900, alt: product.name }] : undefined;

  return {
    title,
    description,
    alternates: { canonical: `/producto/${canonicalSlug}` },
    openGraph: { title, description, type: "website", images },
    twitter: { card: "summary_large_image", title, description, images: product.image ? [product.image] : undefined },
  };
}

export default async function ProductPage({
  params,
}: {
  params: Promise<{ slug: string }>;
}) {
  const { slug } = await params;
  const data = getMenuForSeo();
  const product = findProductBySlug(data.products, slug);
  if (!product) notFound();

  // Si el negocio cambió el nombre, el slug de la URL puede ser viejo;
  // igual mostramos el producto, y el enlace canónico ya apunta al nuevo.
  const canonicalSlug = productSlug(product);

  const category = data.categories.find((c) => c.id === product.category);
  const priceLabel = money(data.settings.currency, product.price);
  const waText = encodeURIComponent(
    `¡Hola! Pedido desde la otra orilla 🌊\nQuiero: ${product.emoji} ${product.name} — ${priceLabel}`
  );
  const waHref = data.settings.whatsapp
    ? `https://wa.me/${data.settings.whatsapp.replace(/\D/g, "")}?text=${waText}`
    : null;

  const jsonLd = {
    "@context": "https://schema.org",
    "@type": "Product",
    name: product.name,
    description: product.description,
    image: product.image ? [product.image] : undefined,
    category: category?.name,
    offers: {
      "@type": "Offer",
      priceCurrency: "CUP",
      price: product.price,
      availability: product.available
        ? "https://schema.org/InStock"
        : "https://schema.org/OutOfStock",
    },
  };

  return (
    <main className="mx-auto min-h-dvh max-w-lg bg-[#fdf3e0] px-4 pb-10 pt-6 text-[#4a3b28]">
      <script
        type="application/ld+json"
        // Datos estructurados: así Google puede mostrar precio y foto en el buscador
        dangerouslySetInnerHTML={{ __html: JSON.stringify(jsonLd) }}
      />

      <Link
        href="/"
        className="mb-4 inline-flex items-center gap-1.5 text-sm font-bold text-[#c2542f] hover:underline"
      >
        🌊 {data.settings.businessName}
      </Link>

      <div className="relative aspect-[4/3] w-full overflow-hidden rounded-3xl bg-[#f6dfb2] ring-1 ring-[#f0dfc0]">
        {product.image ? (
          <Image
            src={product.image}
            alt={product.name}
            fill
            sizes="(max-width: 640px) 100vw, 512px"
            priority
            className="object-cover"
          />
        ) : (
          <span className="grid h-full w-full place-items-center text-7xl" aria-hidden="true">
            {product.emoji}
          </span>
        )}
        {!product.available && (
          <span className="absolute right-3 top-3 rounded-full bg-[#8a7350] px-3 py-1 text-xs font-extrabold uppercase tracking-wide text-white">
            Se acabó hoy
          </span>
        )}
      </div>

      <div className="mt-4 flex items-start justify-between gap-3">
        <h1 className="font-display text-3xl leading-tight text-[#c2542f]">
          {product.emoji} {product.name}
        </h1>
        <span className="shrink-0 rounded-full bg-white px-3 py-1.5 font-display text-lg text-[#c2542f] ring-1 ring-[#f0dfc0]">
          {priceLabel}
        </span>
      </div>
      {category && (
        <p className="mt-1 text-xs font-bold uppercase tracking-wide text-[#a58a5f]">
          {category.emoji} {category.name}
        </p>
      )}
      <p className="mt-3 text-[15px] leading-relaxed text-[#6b5a40]">{product.description}</p>

      {product.ingredients.length > 0 && (
        <ul className="mt-4 flex flex-wrap gap-1.5" aria-label="Ingredientes">
          {product.ingredients.map((ing) => (
            <li
              key={ing}
              className="rounded-full bg-white px-3 py-1 text-xs font-semibold text-[#8a7350] ring-1 ring-[#f0dfc0]"
            >
              {ing}
            </li>
          ))}
        </ul>
      )}

      <div className="mt-6 grid gap-2.5">
        <Link
          href={`/?abrir=${encodeURIComponent(product.id)}`}
          className="inline-flex h-12 w-full items-center justify-center gap-2 rounded-2xl bg-[#e2574c] text-base font-extrabold text-white shadow-[0_8px_24px_-4px_rgba(226,87,76,0.5)] transition hover:bg-[#d34a40]"
        >
          🛒 Pedir en la carta
        </Link>
        {waHref && (
          <a
            href={waHref}
            target="_blank"
            rel="noopener noreferrer"
            className="inline-flex h-11 w-full items-center justify-center gap-2 rounded-2xl bg-[#25d366] text-sm font-extrabold text-white transition hover:bg-[#1fb857]"
          >
            💬 Pedir directo por WhatsApp
          </a>
        )}
        <ShareProductButton name={product.name} slug={canonicalSlug} />
      </div>

      <p className="mt-6 text-center text-xs text-[#a58a5f]">
        📍 {data.settings.deliveryPoint} · {data.settings.deliveryTime}
      </p>
    </main>
  );
}
