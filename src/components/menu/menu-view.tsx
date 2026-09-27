"use client";

import { useEffect, useMemo, useRef, useState } from "react";
import { flushSync } from "react-dom";
import Image from "next/image";
import {
  Heart,
  Search,
  ShoppingBag,
  UserRound,
  UtensilsCrossed,
  X,
} from "lucide-react";
import { toast } from "sonner";
import { money, openStateFor, useMenuStore, type OpenState } from "@/lib/store";
import { useCartStore } from "@/lib/cart";
import { cartTotals } from "@/lib/store";
import {
  buzz,
  normalizeText,
  unreadCount,
  useCustomerStore,
  waitEstimate,
} from "@/lib/customer";
import { BeachCart, CrabSilhouette, PalmSilhouette, ShellSilhouette, Shoreline, StampBadge, SunSilhouette, Surfboard } from "./beach-scene";
import { CatTitle } from "./section-title";
import { CustomizerSheet } from "./customizer-sheet";
import { CartSection } from "./cart-section";
import { UpsellSheet } from "./promo-cards";
import { upsellFor } from "@/lib/promos";
import { FavoritesSection, type TasteEntry } from "./favorites-section";
import { ProductRow } from "./product-row";
import { ReviewsSection } from "./reviews-section";
import { CustomerSheet, InboxSheet } from "./customer-sheet";
import { NotificationWatcher } from "./notification-watcher";
import { InstallButton } from "./install-prompt";
import { DEFAULT_GALLERY } from "./gallery-data";
import { CombosSection, DailySection } from "./specials";
import { LiteModeButton } from "./night-glow";
import { useOffscreenPause } from "@/hooks/use-offscreen-pause";
import { HeroPostcard } from "./hero-postcard";
import { categoryName, productName, useLang, useTr } from "@/lib/i18n";
import { SEED } from "@/lib/store";

const DEFAULT_TAGLINE = SEED.settings.tagline;
const CAPTIONS_EN: Record<string, string> = {
  "El carrito al atardecer": "The cart at sunset",
  "La barra y sus jugos": "The bar and its juices",
  "Nuestra playa, la del otro lado": "Our beach, the one across the street",
};
import type { MenuData, Product } from "@/lib/types";

/* Vistas de la carta: menú, favoritos guardados y carrito */
type View = "menu" | "favoritos" | "carrito";

/* ------------------------------------------------------------------ */
/*  Carta del día · Al Otro Lado de la Playa                           */
/* ------------------------------------------------------------------ */

function OpenBadge({ open }: { open: boolean }) {
  const tr = useTr();
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
      {open ? tr("Abierto ahora", "Open now") : tr("Cerrado ahora", "Closed now")}
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
  const ref = useOffscreenPause<HTMLDivElement>();
  return (
    <div
      ref={ref}
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
  count,
  onClick,
}: {
  active: boolean;
  emoji: string;
  name: string;
  count?: number;
  onClick: () => void;
}) {
  return (
    <button
      type="button"
      onClick={onClick}
      className={`inline-flex h-9 shrink-0 items-center gap-1.5 whitespace-nowrap rounded-full pl-3 pr-3.5 text-sm font-bold shadow-sm transition active:scale-95 ${
        active
          ? "bg-gradient-to-br from-[#e2574c] to-[#f08a4b] text-white shadow-[0_6px_18px_-4px_rgba(226,87,76,0.55)]"
          : "aol-pill bg-white text-[#8a7350] ring-1 ring-[#f0dfc0] hover:bg-[#fdf3e0]"
      }`}
      aria-pressed={active}
    >
      <span aria-hidden="true" className="text-base leading-none">{emoji}</span>
      {name}
      {count !== undefined && (
        <span
          className={`grid h-5 min-w-5 place-items-center rounded-full px-1.5 text-[11px] leading-none ${
            active ? "bg-white/25 text-white" : "aol-pill-count bg-[#e2574c]/10 text-[#c2542f]"
          }`}
        >
          {count}
        </span>
      )}
    </button>
  );
}

/* ------------------------------------------------------------------ */
/*  Vista principal del menú: banner, destacados, categorías, reseñas  */
/* ------------------------------------------------------------------ */

function MenuHome({
  data,
  openState,
  onArm,
  favProps,
  onGoFavorites,
}: {
  data: MenuData;
  openState: OpenState;
  onArm: (p: Product) => void;
  favProps: (p: Product) => { fav: boolean; onFav: () => void };
  onGoFavorites: () => void;
}) {
  const [activeCat, setActiveCat] = useState<string>("todas");
  const [query, setQuery] = useState("");
  const tr = useTr();
  const lang = useLang();

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
      // se busca en español y en inglés
      const hay = normalizeText(
        `${p.name} ${p.description} ${p.nameEn ?? ""} ${p.descriptionEn ?? ""} ${p.tags.join(" ")}`
      );
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
      {!openState.open && (
        <div
          className="aol-closed mb-4 rounded-2xl border-2 border-dashed border-[#e8b08a] bg-[#fdeae0] px-4 py-3 text-center text-sm font-semibold text-[#b3562e]"
          role="status"
        >
          🌙 {openState.label || tr("Cerrado por hoy", "Closed today")} ·{" "}
          {tr(
            "Puedes ver la carta y armar tu pedido para cuando abramos",
            "You can browse the menu and build your order for when we open"
          )}
        </div>
      )}

      {/* Marquesina de fotos */}
      <PhotoMarquee />

      {/* Menú del día y combos (se configuran en el panel) */}
      <DailySection data={data} onArm={onArm} favProps={favProps} />
      <CombosSection data={data} />

      {/* Destacados */}
      {featured.length > 0 && (
        <section className="mt-6" aria-label={tr("Recomendados del chef", "Chef's picks")}>
          <CatTitle emoji="⭐">{tr("Los preferidos de la marea", "Crowd favorites")}</CatTitle>
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
                      alt={productName(p, lang)}
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
                    {tr("DESTACADO", "FEATURED")}
                  </span>
                </div>
                <div className="flex items-center justify-between gap-1.5 p-2.5">
                  <span className="truncate text-sm font-extrabold text-[#4a3b28]">
                    {productName(p, lang)}
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
        className="aol-navbar sticky top-2 z-20 -mx-1.5 mt-6 rounded-[26px] bg-[#fdf3e0]/90 p-2 backdrop-blur-md"
        aria-label={tr("Buscar y categorías del menú", "Search and menu categories")}
      >
        <div className="aol-search-wrap relative mb-2">
          <Search
            className="aol-search-icon pointer-events-none absolute left-4 top-1/2 size-[18px] -translate-y-1/2 text-[#e2574c]"
            aria-hidden="true"
          />
          <input
            type="text"
            value={query}
            onChange={(e) => setQuery(e.target.value)}
            placeholder={tr("Buscar antojos… limonada, perro, alitas", "Search… lemonade, hot dog, wings")}
            aria-label={tr("Buscar en el menú", "Search the menu")}
            className="aol-search h-12 w-full rounded-full border border-[#f0dfc0] bg-white pl-11 pr-12 text-[15px] font-semibold text-[#4a3b28] shadow-[0_6px_18px_-12px_rgba(120,80,40,0.45)] placeholder:font-medium placeholder:text-[#c4b08c] focus:border-transparent focus:outline-none"
          />
          {query && (
            <button
              type="button"
              onClick={() => setQuery("")}
              aria-label={tr("Limpiar búsqueda", "Clear search")}
              className="aol-search-clear absolute right-2.5 top-1/2 grid size-8 -translate-y-1/2 place-items-center rounded-full bg-[#fdf3e0] text-[#8a7350] transition hover:bg-[#f6dfb2]"
            >
              <X className="size-3.5" aria-hidden="true" />
            </button>
          )}
        </div>
        {!query && (
          <div className="aol-pills no-scrollbar flex gap-2 overflow-x-auto px-1 pb-0.5">
            <CategoryPill
              active={activeCat === "todas"}
              emoji="🌊"
              name={tr("Todo", "All")}
              count={[...productsByCat.values()].reduce((a, l) => a + l.length, 0)}
              onClick={() => setActiveCat("todas")}
            />
            {visibleCategories.map((c) => (
              <CategoryPill
                key={c.id}
                active={activeCat === c.id}
                emoji={c.emoji}
                name={categoryName(c, lang)}
                count={productsByCat.get(c.id)?.length ?? 0}
                onClick={() => setActiveCat(c.id)}
              />
            ))}
            <CategoryPill
              active={false}
              emoji="❤️"
              name={tr("Favoritos", "Favorites")}
              onClick={onGoFavorites}
            />
          </div>
        )}
      </nav>

      {/* Búsqueda / productos por categoría */}
      {query.trim().length >= 2 ? (
        <section className="mt-3" aria-label={tr("Resultados de búsqueda", "Search results")}>
          <CatTitle emoji="🔍">
            {searchResults.length}{" "}
            {searchResults.length === 1 ? tr("resultado", "result") : tr("resultados", "results")}{" "}
            {tr("para", "for")} “{query.trim()}”
          </CatTitle>
          {searchResults.length === 0 ? (
            <div className="aol-empty rounded-2xl border-2 border-dashed border-[#e8d5b5] bg-white/60 px-4 py-6 text-center text-sm text-[#8a7350]">
              {tr(
                "Nada con esa marea… prueba con “limonada”, “perro” o “alitas” 🌊",
                "Nothing on this tide… try “lemonade”, “hot dog” or “wings” 🌊"
              )}
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
                <section key={c.id} aria-label={categoryName(c, lang)}>
                  <CatTitle emoji={c.emoji}>{categoryName(c, lang)}</CatTitle>
                  {list.length === 0 ? (
                    <div className="aol-empty rounded-2xl border-2 border-dashed border-[#e8d5b5] bg-white/60 px-4 py-6 text-center text-sm text-[#8a7350]">
                      {data.settings.hideSoldOut
                        ? tr("Nada por aquí por ahora", "Nothing here right now")
                        : tr(
                            "Se agotaron los antojos de esta categoría. ¡Prueba otra!",
                            "This category sold out. Try another one!"
                          )}
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
      <section className="mt-10" aria-label={tr("Así se vive el shack", "Life at the shack")}>
        <CatTitle emoji="📸">{tr("Así se vive el shack", "Life at the shack")}</CatTitle>
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
                {lang === "en" ? (CAPTIONS_EN[g.caption] ?? g.caption) : g.caption}
              </figcaption>
            </figure>
          ))}
        </div>
      </section>

      {/* Escena de cierre */}
      <div className="aol-closing aol-float relative mt-12 overflow-hidden rounded-3xl bg-[#f6dfb2] px-6 pb-0 pt-6 text-center ring-1 ring-[#e8d5b5]">
        <BeachCart className="mx-auto h-24 w-20" />
        <p className="font-display text-lg leading-snug text-[#b3562e]">
          {tr("El shack te espera", "The shack is waiting for you")}
          <br />
          {tr("en", "at")} {data.settings.deliveryPoint}
        </p>
        <p className="mt-1 text-xs font-semibold text-[#a58a5f]">
          {lang === "en" && data.settings.deliveryTime === "Pedidos por WhatsApp"
            ? "Orders via WhatsApp"
            : data.settings.deliveryTime}
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
  const tr = useTr();
  return (
    <nav
      className="aol-nav fixed inset-x-0 bottom-0 z-30 px-4 pb-[calc(0.75rem+env(safe-area-inset-bottom))]"
      aria-label={tr("Secciones de la carta", "Menu sections")}
    >
      <div className="mx-auto flex max-w-xl items-stretch gap-1.5 rounded-2xl border border-[#f0dfc0] bg-white/95 p-1.5 shadow-[0_12px_30px_-8px_rgba(180,140,80,0.5)] backdrop-blur lg:max-w-2xl">
        <NavTab
          active={view === "menu"}
          icon={<UtensilsCrossed className="size-4" aria-hidden="true" />}
          label={tr("Menú", "Menu")}
          onClick={() => onChange("menu")}
        />
        <NavTab
          active={view === "favoritos"}
          icon={<Heart className="size-4" aria-hidden="true" />}
          label={tr("Favoritos", "Favorites")}
          badge={favCount}
          onClick={() => onChange("favoritos")}
        />
        <NavTab
          active={view === "carrito"}
          icon={<ShoppingBag className="size-4" aria-hidden="true" />}
          label={tr("Carrito", "Cart")}
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
  const [upsell, setUpsell] = useState<{ base: Product; list: Product[] } | null>(null);
  const tr = useTr();
  const lang = useLang();
  const setLang = useCustomerStore((s) => s.setLang);

  // idioma de la página (lectores de pantalla, traductores)
  useEffect(() => {
    document.documentElement.lang = lang;
  }, [lang]);
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

  /* Enlace directo desde una página de producto (/producto/slug → «Pedir
     en la carta» → /?abrir=<id>): abrimos su personalizador solo. */
  useEffect(() => {
    const id = new URLSearchParams(window.location.search).get("abrir");
    if (!id) return;
    const product = data.products.find((p) => p.id === id);
    // Abrir el personalizador es la reacción a un parámetro de la URL leído
    // solo una vez al montar (no a un cambio de estado/props): a propósito.
    // eslint-disable-next-line react-hooks/set-state-in-effect
    if (product?.available) setCustomizing(product);
    window.history.replaceState(null, "", window.location.pathname + window.location.hash);
  }, []);

  useEffect(() => {
    void hydrate();
  }, [hydrate]);

  /* Reloj de un minuto: horario (abierto/cerrado) y carta al día.
     Cada ~90 s mira si el negocio publicó cambios (agotados, precios…). */
  const refreshRemote = useMenuStore((s) => s.refreshRemote);
  const [now, setNow] = useState(() => new Date());
  useEffect(() => {
    let ticks = 0;
    const id = window.setInterval(() => {
      if (document.hidden) return;
      setNow(new Date());
      ticks += 1;
      if (ticks % 3 === 0 && navigator.onLine !== false) void refreshRemote();
    }, 30_000);
    const onVisible = () => {
      if (!document.hidden) {
        setNow(new Date());
        void refreshRemote();
      }
    };
    document.addEventListener("visibilitychange", onVisible);
    return () => {
      window.clearInterval(id);
      document.removeEventListener("visibilitychange", onVisible);
    };
  }, [refreshRemote]);

  useEffect(() => {
    document.documentElement.dataset.theme = theme;
  }, [theme]);

  const goTo = (v: View) => {
    setView(v);
    window.scrollTo({ top: 0, behavior: "smooth" });
  };

  /* Día ⇄ noche: el sol se esconde en el mar y la página cambia con un
     círculo que se abre desde el interruptor */
  const toggleTheme = (origin: HTMLElement) => {
    const next = theme === "day" ? "sunset" : "day";
    const root = document.documentElement;
    const apply = () => {
      root.dataset.theme = next;
      flushSync(() => setTheme(next));
    };
    const doc = document as Document & {
      startViewTransition?: (cb: () => void) => { ready: Promise<void> };
    };
    const calm =
      window.matchMedia("(prefers-reduced-motion: reduce)").matches ||
      root.classList.contains("lite");
    if (!doc.startViewTransition || calm) {
      apply();
    } else {
      const r = origin.getBoundingClientRect();
      const x = r.left + r.width / 2;
      const y = r.top + r.height / 2;
      const rad = Math.hypot(Math.max(x, innerWidth - x), Math.max(y, innerHeight - y));
      doc
        .startViewTransition(apply)
        .ready.then(() => {
          root.animate(
            { clipPath: [`circle(0 at ${x}px ${y}px)`, `circle(${rad}px at ${x}px ${y}px)`] },
            { duration: 700, easing: "cubic-bezier(.4,0,.2,1)", pseudoElement: "::view-transition-new(root)" }
          );
        })
        .catch(() => undefined);
    }
    toast(next === "sunset" ? tr("🌙 Noche de playa", "🌙 Beach night") : tr("☀️ Día de playa", "☀️ Beach day"), {
      description:
        next === "sunset"
          ? tr("El sol se esconde y el mar empieza a brillar…", "The sun sets and the sea starts to glow…")
          : tr("Arena, sol y agua clarita", "Sand, sun and clear water"),
    });
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
      // Navegación real a /admin (ruta propia): así su código nunca viaja
      // dentro de la carta que descarga cada cliente.
      window.location.href = "/admin";
      return;
    }
    tapTimerRef.current = window.setTimeout(() => {
      tapsRef.current = 0;
    }, 900);
  };

  const openState = openStateFor(data.settings, now, lang);
  const ordersOpen = openState.open;

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
    const text = `🌊 ${data.settings.businessName} — ${data.settings.tagline}\n${tr("Sabor playero, al otro lado de tu calle", "Beach flavor, just across your street")} 👉`;
    try {
      if (navigator.share) {
        await navigator.share({ title: data.settings.businessName, text, url });
        return;
      }
      await navigator.clipboard.writeText(`${text} ${url}`);
      buzz();
      toast.success(tr("Link copiado 📋", "Link copied 📋"), {
        description: tr("Pégalo donde quieras compartir la carta.", "Paste it anywhere to share the menu."),
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
          {tr("Preparando la carta...", "Getting the menu ready...")}
        </p>
      </div>
    );
  }

  return (
    <div className="aol-page relative min-h-dvh bg-[#fdf3e0]">
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

      <div className="relative z-10 mx-auto w-full max-w-xl px-4 pb-36 pt-3 sm:max-w-2xl lg:max-w-4xl">
        {/* Postal: cielo, sol/luna, mar y palmeras */}
        <HeroPostcard
          theme={theme}
          onToggleTheme={toggleTheme}
          unread={unread}
          onBell={() => setInboxOpen(true)}
          onShare={() => void handleShare()}
          lang={lang}
          onToggleLang={() => {
            const next = lang === "en" ? "es" : "en";
            setLang(next);
            toast(next === "en" ? "🇬🇧 Menu in English" : "🇨🇺 Carta en español", {
              description:
                next === "en"
                  ? "Your order still reaches the kitchen in Spanish"
                  : "El pedido llega a la cocina en español",
            });
          }}
        />

        {/* Encabezado */}
        <header className="relative z-10 -mt-14 mb-4 text-center">
          <div className="mx-auto flex w-fit items-center gap-3.5">
            <button
              type="button"
              onClick={handleLogoTap}
              aria-label={`Logo de ${data.settings.businessName}`}
              className="pc-logo relative size-24 cursor-pointer overflow-hidden rounded-full bg-[#fdf3e0] transition active:scale-90 sm:size-28"
            >
              <Image
                src="/images/logo.png"
                alt=""
                fill
                sizes="112px"
                className="object-cover"
                priority
              />
            </button>
            <StampBadge className="stamp-pop" />
          </div>

          <h1 className="aol-title mt-3 text-balance font-display text-[clamp(30px,8vw,44px)] leading-none text-[#c2542f]">
            {data.settings.businessName}
          </h1>
          <p className="aol-sub mt-1.5 text-sm font-semibold text-[#8a7350]">
            {lang === "en" && data.settings.tagline === DEFAULT_TAGLINE
              ? "Burgers, hot dogs, baguettes and bites · By Sol & Habana"
              : data.settings.tagline}
          </p>
          <p className="aol-slogan font-display text-base text-[#e2574c]">
            {tr("Sabor playero, al otro lado de tu calle", "Beach flavor, just across your street")}
          </p>

          <div className="mt-3 flex flex-wrap items-center justify-center gap-2">
            <OpenBadge open={ordersOpen} />
            <span className="aol-chip inline-flex items-center gap-1 rounded-full bg-white px-3 py-1 text-xs font-bold text-[#8a7350] ring-1 ring-[#f0dfc0]">
              📍 {data.settings.deliveryPoint}
            </span>
            {ordersOpen && (
              <span className="aol-chip inline-flex items-center gap-1 rounded-full bg-white px-3 py-1 text-xs font-bold text-[#8a7350] ring-1 ring-[#f0dfc0]">
                {waitEstimate(true, lang)}
              </span>
            )}
            {openState.label && (
              <span className="aol-chip inline-flex items-center gap-1 rounded-full bg-white px-3 py-1 text-xs font-bold text-[#8a7350] ring-1 ring-[#f0dfc0]">
                🕒 {openState.label}
              </span>
            )}
            <LiteModeButton />
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
              {profile
                ? tr(`Hola, ${profile.name}`, `Hi, ${profile.name}`)
                : tr("Hazte cliente 🌊", "Join the tide 🌊")}
            </button>

            <InstallButton />
          </div>
        </header>

        {view === "menu" && (
          <MenuHome
            data={data}
            openState={openState}
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
        onAdded={(p) => {
          const list = upsellFor(p, data, useCartStore.getState().items);
          // se abre cuando la hoja anterior ya bajó
          if (list.length) window.setTimeout(() => setUpsell({ base: p, list }), 380);
        }}
      />
      <UpsellSheet
        base={upsell?.base ?? null}
        suggestions={upsell?.list ?? []}
        onClose={() => setUpsell(null)}
      />
      <CustomerSheet open={customerOpen} onOpenChange={setCustomerOpen} />
      <InboxSheet open={inboxOpen} onOpenChange={setInboxOpen} />
      <NotificationWatcher />
    </div>
  );
}
