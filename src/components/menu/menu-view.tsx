"use client";

import { useEffect, useMemo, useRef, useState } from "react";
import Image from "next/image";
import {
  Bell,
  Heart,
  Moon,
  Search,
  Share2,
  ShoppingBag,
  Sun,
  UserRound,
  UtensilsCrossed,
  X,
} from "lucide-react";
import { toast } from "sonner";
import { money, useMenuStore } from "@/lib/store";
import { useCartStore } from "@/lib/cart";
import { cartTotals } from "@/lib/store";
import {
  buzz,
  normalizeText,
  unreadCount,
  useCustomerStore,
  waitEstimate,
} from "@/lib/customer";
import { Bunting, BeachCart, CrabSilhouette, PalmSilhouette, ShellSilhouette, Shoreline, StampBadge, SunSilhouette, Surfboard, WaveBand } from "./beach-scene";
import { CatTitle } from "./section-title";
import { CustomizerSheet } from "./customizer-sheet";
import { CartSection } from "./cart-section";
import { FavoritesSection, type TasteEntry } from "./favorites-section";
import { ProductRow } from "./product-row";
import { ReviewsSection } from "./reviews-section";
import { CustomerSheet, InboxSheet } from "./customer-sheet";
import { NotificationWatcher } from "./notification-watcher";
import { InstallButton } from "./install-prompt";
import { DEFAULT_GALLERY } from "./gallery-data";
import type { MenuData, Product } from "@/lib/types";

/* Vistas de la carta: menú, favoritos guardados y carrito */
type View = "menu" | "favoritos" | "carrito";

/* ------------------------------------------------------------------ */
/*  Carta del día · Al Otro Lado de la Playa                           */
/* ------------------------------------------------------------------ */

function OpenBadge({ open }: { open: boolean }) {
  return (
    <span
      className={`inline-flex items-center gap-1.5 rounded-full px-3 py-1 text-xs font-extrabold uppercase tracking-wide shadow-sm ${
        open
          ? "bg-[#3f9e5f] text-white"
          : "bg-[#8a7350] text-[#fdf3e0]"
      }`}
    >
      <span
        className={`size-2 rounded-full ${open ? "animate-pulse bg-[#d6f5c9]" : "bg-[#fdf3e0]/70"}`}
        aria-hidden="true"
      />
      {open ? "Abierto ahora" : "Cerrado ahora"}
    </span>
  );
}

function PhotoMarquee() {
  const imgs = [
    "/images/products/p-clasica.jpg",
    "/images/products/p-limonada.jpg",
    "/images/products/p-perro-crispy.jpg",
    "/images/products/p-batidos.jpg",
    "/images/products/p-doble-mixta.jpg",
    "/images/products/p-papischis.jpg",
    "/images/products/p-baguette-rustico.jpg",
    "/images/products/p-maracuya.jpg",
    "/images/products/p-alitas-pollo.jpg",
    "/images/products/p-cerveza.jpg",
  ];
  return (
    <div
      className="marquee-track relative overflow-hidden rounded-2xl ring-1 ring-[#e8d5b5]"
      aria-hidden="true"
    >
      <div className="flex w-max animate-marquee gap-2.5 py-2.5 pl-2.5">
        {[...imgs, ...imgs].map((src, i) => (
          <div
            key={i}
            className="relative h-20 w-28 shrink-0 overflow-hidden rounded-xl sm:h-28 sm:w-44"
          >
            <Image
              src={src}
              alt=""
              fill
              sizes="144px"
              className="object-cover"
            />
          </div>
        ))}
      </div>
    </div>
  );
}

function CategoryPill({
  active,
  emoji,
  name,
  onClick,
}: {
  active: boolean;
  emoji: string;
  name: string;
  onClick: () => void;
}) {
  return (
    <button
      type="button"
      onClick={onClick}
      className={`inline-flex shrink-0 items-center gap-1.5 rounded-full px-4 py-2 text-sm font-bold shadow-sm transition active:scale-95 ${
        active
          ? "bg-[#e2574c] text-white shadow-[0_6px_18px_-4px_rgba(226,87,76,0.55)]"
          : "aol-pill bg-white text-[#8a7350] ring-1 ring-[#f0dfc0] hover:bg-[#fdf3e0]"
      }`}
      aria-pressed={active}
    >
      <span aria-hidden="true">{emoji}</span>
      {name}
    </button>
  );
}

/* ------------------------------------------------------------------ */
/*  Vista principal del menú: banner, destacados, categorías, reseñas  */
/* ------------------------------------------------------------------ */

function MenuHome({
  data,
  onArm,
  favProps,
  onGoFavorites,
}: {
  data: MenuData;
  onArm: (p: Product) => void;
  favProps: (p: Product) => { fav: boolean; onFav: () => void };
  onGoFavorites: () => void;
}) {
  const [activeCat, setActiveCat] = useState<string>("todas");
  const [query, setQuery] = useState("");

  const visibleCategories = useMemo(
    () => data.categories.filter((c) => c.visible),
    [data.categories]
  );

  const featured = useMemo(
    () => data.products.filter((p) => p.featured && p.available),
    [data.products]
  );

  const searchResults = useMemo(() => {
    const q = normalizeText(query);
    if (q.length < 2) return [];
    return data.products.filter((p) => {
      if (data.settings.hideSoldOut && !p.available) return false;
      const hay = normalizeText(`${p.name} ${p.description} ${p.tags.join(" ")}`);
      return q.split(/\s+/).every((w) => hay.includes(w));
    });
  }, [query, data]);

  const productsByCat = useMemo(() => {
    const map = new Map<string, Product[]>();
    for (const c of visibleCategories) {
      let list = data.products.filter((p) => p.category === c.id);
      if (data.settings.hideSoldOut) list = list.filter((p) => p.available);
      map.set(c.id, list);
    }
    return map;
  }, [data, visibleCategories]);

  return (
    <>
      {!data.settings.ordersOpen && (
        <div
          className="mb-4 rounded-2xl border-2 border-dashed border-[#e8b08a] bg-[#fdeae0] px-4 py-3 text-center text-sm font-semibold text-[#b3562e]"
          role="status"
        >
          Cerrado por hoy · El shack abre pronto. Vuelve en la próxima noche
          playera 🌙
        </div>
      )}

      {/* Marquesina de fotos */}
      <PhotoMarquee />

      {/* Destacados */}
      {featured.length > 0 && (
        <section className="mt-6" aria-label="Recomendados del chef">
          <CatTitle emoji="⭐">Los preferidos de la marea</CatTitle>
          <div className="nice-scroll -mx-4 flex snap-x gap-3 overflow-x-auto px-4 pb-2">
            {featured.map((p) => (
              <button
                key={p.id}
                type="button"
                onClick={() => onArm(p)}
                className="aol-featured aol-float relative w-40 shrink-0 snap-start overflow-hidden rounded-2xl bg-white text-left ring-1 ring-[#f0dfc0] transition active:scale-[0.98] sm:w-48"
              >
                <div className="relative h-28 w-full sm:h-32">
                  {p.image ? (
                    <Image
                      src={p.image}
                      alt={p.name}
                      fill
                      sizes="192px"
                      className="object-cover"
                    />
                  ) : (
                    <span className="grid h-full place-items-center text-4xl">
                      {p.emoji}
                    </span>
                  )}
                  <span className="absolute left-2 top-2 rounded-full bg-[#f2c230] px-2 py-0.5 text-[10px] font-black uppercase tracking-wider text-[#7a5410]">
                    DESTACADO
                  </span>
                </div>
                <div className="flex items-center justify-between gap-1.5 p-2.5">
                  <span className="truncate text-sm font-extrabold text-[#4a3b28]">
                    {p.name}
                  </span>
                  <span className="font-display text-sm text-[#c2542f]">
                    {money(data.settings.currency, p.price)}
                  </span>
                </div>
              </button>
            ))}
          </div>
        </section>
      )}

      {/* Categorías */}
      <nav
        className="aol-navbar sticky top-0 z-20 -mx-4 mt-6 bg-[#fdf3e0]/95 px-4 py-2.5 backdrop-blur"
        aria-label="Buscar y categorías del menú"
      >
        <div className="relative mb-2">
          <Search
            className="aol-search-icon pointer-events-none absolute left-3 top-1/2 size-4 -translate-y-1/2 text-[#c4b08c]"
            aria-hidden="true"
          />
          <input
            type="text"
            value={query}
            onChange={(e) => setQuery(e.target.value)}
            placeholder="Buscar antojos… limonada, perro, alitas"
            aria-label="Buscar en el menú"
            className="aol-search h-10 w-full rounded-full border border-[#f0dfc0] bg-white pl-9 pr-10 text-sm text-[#4a3b28] placeholder:text-[#c4b08c] focus:outline-none focus:ring-2 focus:ring-[#e2574c]/50"
          />
          {query && (
            <button
              type="button"
              onClick={() => setQuery("")}
              aria-label="Limpiar búsqueda"
              className="aol-search-clear absolute right-2 top-1/2 grid size-6 -translate-y-1/2 place-items-center rounded-full bg-[#fdf3e0] text-[#8a7350] transition hover:bg-[#f6dfb2]"
            >
              <X className="size-3.5" aria-hidden="true" />
            </button>
          )}
        </div>
        {!query && (
          <div className="nice-scroll flex gap-2 overflow-x-auto pb-1">
            <CategoryPill
              active={activeCat === "todas"}
              emoji="🌊"
              name="Todo"
              onClick={() => setActiveCat("todas")}
            />
            {visibleCategories.map((c) => (
              <CategoryPill
                key={c.id}
                active={activeCat === c.id}
                emoji={c.emoji}
                name={c.name}
                onClick={() => setActiveCat(c.id)}
              />
            ))}
            <CategoryPill
              active={false}
              emoji="❤️"
              name="Favoritos"
              onClick={onGoFavorites}
            />
          </div>
        )}
      </nav>

      {/* Búsqueda / productos por categoría */}
      {query.trim().length >= 2 ? (
        <section className="mt-3" aria-label="Resultados de búsqueda">
          <CatTitle emoji="🔍">
            {searchResults.length}{" "}
            {searchResults.length === 1 ? "resultado" : "resultados"} para{" "}
            “{query.trim()}”
          </CatTitle>
          {searchResults.length === 0 ? (
            <div className="aol-empty rounded-2xl border-2 border-dashed border-[#e8d5b5] bg-white/60 px-4 py-6 text-center text-sm text-[#8a7350]">
              Nada con esa marea… prueba con “limonada”, “perro” o “alitas” 🌊
            </div>
          ) : (
            <div className="grid gap-3 lg:grid-cols-2 lg:gap-4">
              {searchResults.map((p) => (
                <ProductRow
                  key={p.id}
                  product={p}
                  currency={data.settings.currency}
                  onArm={onArm}
                  {...favProps(p)}
                />
              ))}
            </div>
          )}
        </section>
      ) : (
        <div className="mt-3 grid gap-7">
          {visibleCategories
            .filter((c) => activeCat === "todas" || activeCat === c.id)
            .map((c) => {
              const list = productsByCat.get(c.id) ?? [];
              return (
                <section key={c.id} aria-label={c.name}>
                  <CatTitle emoji={c.emoji}>{c.name}</CatTitle>
                  {list.length === 0 ? (
                    <div className="aol-empty rounded-2xl border-2 border-dashed border-[#e8d5b5] bg-white/60 px-4 py-6 text-center text-sm text-[#8a7350]">
                      {data.settings.hideSoldOut
                        ? "Nada por aquí por ahora"
                        : "Se agotaron los antojos de esta categoría. ¡Prueba otra!"}
                    </div>
                  ) : (
                    <div className="grid gap-3 lg:grid-cols-2 lg:gap-4">
                      {list.map((p) => (
                        <ProductRow
                          key={p.id}
                          product={p}
                          currency={data.settings.currency}
                          onArm={onArm}
                          {...favProps(p)}
                        />
                      ))}
                    </div>
                  )}
                </section>
              );
            })}
        </div>
      )}

      {/* Reseñas */}
      <ReviewsSection />

      {/* Galería del shack (fotos reales del panel o las de serie) */}
      <section className="mt-10" aria-label="Así se vive el shack">
        <CatTitle emoji="📸">Así se vive el shack</CatTitle>
        <div className="nice-scroll -mx-4 flex snap-x gap-3 overflow-x-auto px-4 pb-2">
          {(data.settings.gallery?.length ? data.settings.gallery : DEFAULT_GALLERY).map(
            (g) => (
            <figure
              key={g.src}
              className="aol-float relative w-56 shrink-0 snap-start overflow-hidden rounded-2xl ring-1 ring-[#f0dfc0] sm:w-64"
            >
              <div className="relative h-40 w-full">
                <Image
                  src={g.src}
                  alt={g.alt}
                  fill
                  sizes="256px"
                  className="object-cover"
                />
              </div>
              <figcaption className="absolute inset-x-0 bottom-0 bg-gradient-to-t from-[#4a3b28]/85 to-transparent px-3 pb-2 pt-8 text-xs font-bold text-white">
                {g.caption}
              </figcaption>
            </figure>
          ))}
        </div>
      </section>

      {/* Escena de cierre */}
      <div className="aol-closing aol-float relative mt-12 overflow-hidden rounded-3xl bg-[#f6dfb2] px-6 pb-0 pt-6 text-center ring-1 ring-[#e8d5b5]">
        <BeachCart className="mx-auto h-24 w-20" />
        <p className="font-display text-lg leading-snug text-[#b3562e]">
          El shack te espera
          <br />
          en {data.settings.deliveryPoint}
        </p>
        <p className="mt-1 text-xs font-semibold text-[#a58a5f]">
          {data.settings.deliveryTime}
        </p>
        <div className="relative mt-4 flex items-end justify-center gap-6">
          <CrabSilhouette className="mb-2 h-7 w-11 crab-walk" />
          <ShellSilhouette className="mb-1 h-6 w-7" />
        </div>
        <Shoreline className="w-full" />
      </div>
    </>
  );
}

/* ------------------------------------------------------------------ */
/*  Navegación inferior: Menú · Favoritos · Carrito                    */
/* ------------------------------------------------------------------ */

function NavTab({
  active,
  icon,
  label,
  badge,
  hint,
  onClick,
}: {
  active: boolean;
  icon: React.ReactNode;
  label: string;
  badge?: number;
  hint?: string;
  onClick: () => void;
}) {
  return (
    <button
      type="button"
      onClick={onClick}
      aria-current={active ? "page" : undefined}
      className={`relative flex flex-1 flex-col items-center justify-center gap-0.5 rounded-xl px-1 py-2 text-[11px] font-extrabold transition active:scale-95 ${
        active
          ? "bg-[#e2574c] text-white shadow-[0_6px_16px_-4px_rgba(226,87,76,0.55)]"
          : "text-[#8a7350] hover:bg-[#fdf3e0]"
      }`}
    >
      <span className="relative">
        {icon}
        {badge !== undefined && badge > 0 && (
          <span className="absolute -right-2.5 -top-1.5 grid h-4 min-w-4 place-items-center rounded-full bg-[#f2c230] px-1 text-[9px] font-black leading-4 text-[#7a5410] ring-1 ring-white">
            {badge > 9 ? "9+" : badge}
          </span>
        )}
      </span>
      {label}
      {hint && (
        <span className="text-[10px] font-bold leading-none opacity-95">
          {hint}
        </span>
      )}
    </button>
  );
}

function BottomNav({
  view,
  onChange,
  favCount,
  cartCount,
  cartTotal,
  currency,
}: {
  view: View;
  onChange: (v: View) => void;
  favCount: number;
  cartCount: number;
  cartTotal: number;
  currency: string;
}) {
  return (
    <nav
      className="aol-nav fixed inset-x-0 bottom-0 z-30 px-4 pb-[calc(0.75rem+env(safe-area-inset-bottom))]"
      aria-label="Secciones de la carta"
    >
      <div className="mx-auto flex max-w-xl items-stretch gap-1.5 rounded-2xl border border-[#f0dfc0] bg-white/95 p-1.5 shadow-[0_12px_30px_-8px_rgba(180,140,80,0.5)] backdrop-blur lg:max-w-2xl">
        <NavTab
          active={view === "menu"}
          icon={<UtensilsCrossed className="size-4" aria-hidden="true" />}
          label="Menú"
          onClick={() => onChange("menu")}
        />
        <NavTab
          active={view === "favoritos"}
          icon={<Heart className="size-4" aria-hidden="true" />}
          label="Favoritos"
          badge={favCount}
          onClick={() => onChange("favoritos")}
        />
        <NavTab
          active={view === "carrito"}
          icon={<ShoppingBag className="size-4" aria-hidden="true" />}
          label="Carrito"
          badge={cartCount}
          hint={cartCount > 0 ? money(currency, cartTotal) : undefined}
          onClick={() => onChange("carrito")}
        />
      </div>
    </nav>
  );
}

export function MenuView() {
  const data = useMenuStore((s) => s.data);
  const hydrate = useMenuStore((s) => s.hydrate);
  const hydrated = useMenuStore((s) => s.hydrated);
  const cartCount = useCartStore((s) => s.items.reduce((a, i) => a + i.qty, 0));
  const cartTotal = useCartStore((s) => cartTotals(s.items, 0).total);

  const theme = useCustomerStore((s) => s.prefs.theme);
  const setTheme = useCustomerStore((s) => s.setTheme);
  const profile = useCustomerStore((s) => s.profile);
  const favorites = useCustomerStore((s) => s.favorites);
  const toggleFavorite = useCustomerStore((s) => s.toggleFavorite);
  const unread = useCustomerStore((s) => unreadCount(s.inbox));
  const orderCounts = useCustomerStore((s) => s.orderCounts);

  const [view, setView] = useState<View>("menu");
  const [customizing, setCustomizing] = useState<Product | null>(null);
  const [customerOpen, setCustomerOpen] = useState(false);
  const [inboxOpen, setInboxOpen] = useState(false);

  useEffect(() => {
    void hydrate();
  }, [hydrate]);

  useEffect(() => {
    document.documentElement.dataset.theme = theme;
  }, [theme]);

  const goTo = (v: View) => {
    setView(v);
    window.scrollTo({ top: 0, behavior: "smooth" });
  };

  /* Triple toque en el logo → panel de administración (secreto del shack) */
  const tapsRef = useRef(0);
  const tapTimerRef = useRef<number | null>(null);
  const handleLogoTap = () => {
    tapsRef.current += 1;
    buzz(18);
    if (tapTimerRef.current) window.clearTimeout(tapTimerRef.current);
    if (tapsRef.current >= 3) {
      tapsRef.current = 0;
      toast.success("🔑 Modo administrador", {
        description: "Abriendo el panel del shack…",
      });
      window.location.hash = "#/admin";
      return;
    }
    if (tapsRef.current === 2) {
      toast("🔑 Un toque más…", { description: "Modo administrador" });
    }
    tapTimerRef.current = window.setTimeout(() => {
      tapsRef.current = 0;
    }, 900);
  };

  const ordersOpen = data.settings.ordersOpen;

  const favoriteProducts = useMemo(
    () =>
      data.products.filter(
        (p) => favorites.includes(p.id) && (!data.settings.hideSoldOut || p.available)
      ),
    [data.products, favorites, data.settings.hideSoldOut]
  );

  const tastes: TasteEntry[] = useMemo(
    () =>
      Object.entries(orderCounts)
        .sort((a, b) => b[1] - a[1])
        .slice(0, 3)
        .map(([id, n]) => ({
          product: data.products.find((p) => p.id === id),
          n,
        }))
        .filter((x): x is TasteEntry => !!x.product),
    [orderCounts, data.products]
  );

  const totalArmed = useMemo(
    () => Object.values(orderCounts).reduce((a, b) => a + b, 0),
    [orderCounts]
  );

  const handleShare = async () => {
    const url = window.location.href;
    const text = `🌊 ${data.settings.businessName} — ${data.settings.tagline}\nSabor playero, al otro lado de tu calle 👉`;
    try {
      if (navigator.share) {
        await navigator.share({ title: data.settings.businessName, text, url });
        return;
      }
      await navigator.clipboard.writeText(`${text} ${url}`);
      buzz();
      toast.success("Link copiado 📋", {
        description: "Pégalo donde quieras compartir la carta.",
      });
    } catch {
      /* canceló el compartir */
    }
  };

  const favProps = (p: Product) => ({
    fav: favorites.includes(p.id),
    onFav: () => toggleFavorite(p.id),
  });

  if (!hydrated) {
    return (
      <div className="flex min-h-dvh flex-col items-center justify-center gap-4 bg-[#fdf3e0]">
        <div className="relative size-28 overflow-hidden rounded-full border-2 border-[#e2574c]/40 animate-pulse-glow-coral">
          <Image
            src="/images/logo.png"
            alt="Logo"
            fill
            sizes="112px"
            className="object-cover"
            priority
          />
        </div>
        <p className="font-display text-sm font-bold tracking-wide text-[#c2542f]">
          Preparando la carta...
        </p>
      </div>
    );
  }

  return (
    <div className="aol-page relative min-h-dvh bg-[#fdf3e0]">
      {/* Mar animado detrás del encabezado */}
      <WaveBand className="aol-waves z-0" />

      {/* Decoración ambiental solo para pantallas grandes */}
      <div className="pointer-events-none fixed inset-0 z-0 hidden lg:block" aria-hidden="true">
        <div className="absolute right-[10%] top-12 opacity-30">
          <SunSilhouette className="h-24 w-24" />
        </div>
        <div className="absolute -left-12 top-24 opacity-[0.14]">
          <PalmSilhouette className="h-64 w-64" />
        </div>
        <div className="absolute -right-6 bottom-20 rotate-6 opacity-[0.16]">
          <Surfboard className="h-72 w-24" />
        </div>
        <div className="absolute left-20 top-[58%] opacity-[0.18]">
          <CrabSilhouette className="h-10 w-16 crab-walk" />
        </div>
        <div className="absolute right-28 top-[22%] opacity-[0.16]">
          <ShellSilhouette className="h-9 w-11" />
        </div>
        <div className="absolute right-40 bottom-[30%] opacity-[0.12]">
          <BeachCart className="h-28 w-24" />
        </div>
        <div className="absolute left-[8%] bottom-[16%] opacity-[0.15]">
          <ShellSilhouette className="h-7 w-9" />
        </div>
      </div>

      {/* Decoración ambiental para móvil/tablet: la playa vive en los bordes */}
      <div
        className="pointer-events-none fixed inset-0 z-0 overflow-hidden lg:hidden"
        aria-hidden="true"
      >
        {/* Sol de atardecer bien alto, detrás de la copa de la palmera */}
        <div className="absolute left-1 top-1 opacity-60">
          <SunSilhouette className="h-14 w-14" />
        </div>
        <div className="absolute -right-8 top-28 opacity-[0.13]">
          <PalmSilhouette className="h-36 w-36" />
        </div>
        <div className="absolute -left-4 bottom-[24%] -rotate-6 opacity-[0.14]">
          <Surfboard className="h-40 w-14" />
        </div>
        <div className="absolute left-1 top-[36%] opacity-40">
          <ShellSilhouette className="h-5 w-6" />
        </div>
        <div className="absolute right-1.5 bottom-[30%] opacity-30">
          <ShellSilhouette className="h-5 w-6" />
        </div>
        <div className="absolute right-2 bottom-[16%] opacity-[0.16]">
          <CrabSilhouette className="h-7 w-11 crab-walk" />
        </div>
      </div>

      <div className="relative z-10 mx-auto w-full max-w-xl px-4 pb-36 pt-3 sm:max-w-2xl lg:max-w-4xl">
        {/* Banderines */}
        <Bunting className="mx-auto -mt-3 mb-1 h-10 w-full max-w-md" aria-hidden />

        {/* Encabezado */}
        <header className="relative mb-4 text-center">
          <div className="pointer-events-none absolute -left-4 -top-2 opacity-25 sm:-left-6 sm:-top-4 sm:opacity-90">
            <PalmSilhouette className="h-16 w-16 sm:h-28 sm:w-28" />
          </div>
          <div className="pointer-events-none absolute -right-2 top-8 opacity-25 sm:-right-4 sm:top-10 sm:opacity-90">
            <Surfboard className="h-20 w-7 rotate-12 sm:h-32 sm:w-11" />
          </div>

          <div className="mx-auto flex w-fit items-center gap-3">
            <button
              type="button"
              onClick={handleLogoTap}
              aria-label={`Logo de ${data.settings.businessName}`}
              className="relative size-16 cursor-pointer overflow-hidden rounded-full border-2 border-[#e2574c]/50 shadow-md transition active:scale-90 sm:size-20"
            >
              <Image
                src="/images/logo.png"
                alt=""
                fill
                sizes="80px"
                className="object-cover"
                priority
              />
            </button>
            <StampBadge className="stamp-pop" />
          </div>

          <h1 className="mt-3 font-display text-3xl leading-none text-[#c2542f] sm:text-4xl">
            {data.settings.businessName}
          </h1>
          <p className="mt-1.5 text-sm font-semibold text-[#8a7350]">
            {data.settings.tagline}
          </p>
          <p className="font-display text-base text-[#e2574c]">
            Sabor playero, al otro lado de tu calle
          </p>

          <div className="mt-3 flex flex-wrap items-center justify-center gap-2">
            <OpenBadge open={ordersOpen} />
            <span className="aol-chip inline-flex items-center gap-1 rounded-full bg-white px-3 py-1 text-xs font-bold text-[#8a7350] ring-1 ring-[#f0dfc0]">
              📍 {data.settings.deliveryPoint}
            </span>
            {ordersOpen && (
              <span className="aol-chip inline-flex items-center gap-1 rounded-full bg-white px-3 py-1 text-xs font-bold text-[#8a7350] ring-1 ring-[#f0dfc0]">
                {waitEstimate(true)}
              </span>
            )}
          </div>

          {/* Cliente de la marea + acciones rápidas */}
          <div className="mt-2.5 flex flex-wrap items-center justify-center gap-2">
            <button
              type="button"
              onClick={() => setCustomerOpen(true)}
              className={`inline-flex items-center gap-1.5 rounded-full px-3.5 py-1.5 text-xs font-extrabold shadow-sm transition active:scale-95 ${
                profile
                  ? "aol-chip bg-white text-[#8a7350] ring-1 ring-[#f0dfc0] hover:bg-[#fdf3e0]"
                  : "bg-[#e2574c] text-white shadow-[0_6px_18px_-4px_rgba(226,87,76,0.55)] hover:bg-[#d34a40]"
              }`}
            >
              <UserRound className="size-3.5" aria-hidden="true" />
              {profile ? `Hola, ${profile.name}` : "Hazte cliente 🌊"}
            </button>

            <button
              type="button"
              onClick={() => setInboxOpen(true)}
              aria-label={`Avisos del shack${unread ? ` (${unread} sin leer)` : ""}`}
              className="relative grid size-9 place-items-center rounded-full bg-white text-[#c2542f] shadow-sm ring-1 ring-[#f0dfc0] transition hover:bg-[#fdf3e0] active:scale-95"
            >
              <Bell className="size-4" aria-hidden="true" />
              {unread > 0 && (
                <span className="absolute -right-0.5 -top-0.5 grid h-4 min-w-4 place-items-center rounded-full bg-[#e2574c] px-1 text-[9px] font-black leading-4 text-white">
                  {unread > 9 ? "9+" : unread}
                </span>
              )}
            </button>

            <button
              type="button"
              onClick={() => setTheme(theme === "day" ? "sunset" : "day")}
              aria-label={
                theme === "day" ? "Activar modo atardecer" : "Volver al modo día"
              }
              className="grid size-9 place-items-center rounded-full bg-white text-[#c2542f] shadow-sm ring-1 ring-[#f0dfc0] transition hover:bg-[#fdf3e0] active:scale-95"
            >
              {theme === "day" ? (
                <Moon className="size-4" aria-hidden="true" />
              ) : (
                <Sun className="size-4" aria-hidden="true" />
              )}
            </button>

            <button
              type="button"
              onClick={() => void handleShare()}
              aria-label="Compartir la carta"
              className="grid size-9 place-items-center rounded-full bg-white text-[#c2542f] shadow-sm ring-1 ring-[#f0dfc0] transition hover:bg-[#fdf3e0] active:scale-95"
            >
              <Share2 className="size-4" aria-hidden="true" />
            </button>

            <InstallButton />
          </div>
        </header>

        {view === "menu" && (
          <MenuHome
            data={data}
            onArm={setCustomizing}
            favProps={favProps}
            onGoFavorites={() => goTo("favoritos")}
          />
        )}

        {view === "favoritos" && (
          <FavoritesSection
            favorites={favoriteProducts}
            tastes={tastes}
            totalArmed={totalArmed}
            currency={data.settings.currency}
            onArm={setCustomizing}
            favProps={favProps}
            onBrowse={() => goTo("menu")}
          />
        )}

        {view === "carrito" && (
          <CartSection onBrowse={() => goTo("menu")} />
        )}


        {/* Pie */}
        <footer className="mt-6 text-center text-xs text-[#a58a5f]">
          <p>
            {data.settings.businessName} · by Sol &amp; Habana · {new Date().getFullYear()}
          </p>
          <p className="mt-1 italic">El secreto del shack vive en el logo 🔒</p>
        </footer>
      </div>

      {/* Navegación inferior: Menú · Favoritos · Carrito */}
      <BottomNav
        view={view}
        onChange={goTo}
        favCount={favorites.length}
        cartCount={cartCount}
        cartTotal={cartTotal}
        currency={data.settings.currency}
      />

      {/* Hojas */}
      <CustomizerSheet
        product={customizing}
        open={!!customizing}
        onOpenChange={(v) => !v && setCustomizing(null)}
      />
      <CustomerSheet open={customerOpen} onOpenChange={setCustomerOpen} />
      <InboxSheet open={inboxOpen} onOpenChange={setInboxOpen} />
      <NotificationWatcher />
    </div>
  );
}
