"use client";

import { useCallback, useMemo, useState, useSyncExternalStore } from "react";
import {
  ChevronRight,
  Database,
  Eye,
  EyeOff,
  Flame,
  KeyRound,
  LogOut,
  MessageSquareHeart,
  Power,
  Settings2,
  Sparkles,
  Store,
  Truck,
  UtensilsCrossed,
  Zap,
} from "lucide-react";
import { toast } from "sonner";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { money, useMenuStore } from "@/lib/store";
import { useOrdersStore } from "@/lib/orders";
import { useCartStore } from "@/lib/cart";
import { useReviewsStore } from "@/lib/reviews";
import { TabHoy } from "./tab-hoy";
import { TabProductos } from "./tab-productos";
import { TabAgregos } from "./tab-agregos";
import { TabCombos } from "./tab-combos";
import { TabServicio } from "./tab-servicio";
import { TabPedidos } from "./tab-pedidos";
import { TabResenas } from "./tab-resenas";
import { TabPublicar } from "./tab-publicar";
import { TabAjustes } from "./tab-ajustes";

/* ------------------------------------------------------------------ */
/*  Panel del Negocio: acceso con contraseña + 7 pestañas              */
/* ------------------------------------------------------------------ */

const SESSION_KEY = "aol-admin-session";

/* Mini-store de sesión: sincroniza el candado con localStorage */
const sessionListeners = new Set<() => void>();
const sessionStore = {
  subscribe(cb: () => void): () => void {
    sessionListeners.add(cb);
    window.addEventListener("storage", cb);
    return () => {
      sessionListeners.delete(cb);
      window.removeEventListener("storage", cb);
    };
  },
  get(): boolean {
    try {
      return localStorage.getItem(SESSION_KEY) === "1";
    } catch {
      return false;
    }
  },
  set(value: boolean): void {
    try {
      if (value) localStorage.setItem(SESSION_KEY, "1");
      else localStorage.removeItem(SESSION_KEY);
    } catch {
      /* noop */
    }
    sessionListeners.forEach((l) => l());
  },
};

function OrdersBadge() {
  const status = useOrdersStore((s) => s.status);
  const count = useOrdersStore((s) => s.adminList.filter((o) => o.status === "nuevo").length);
  if (status !== "cloud" || count === 0) return null;
  return (
    <span className="ml-auto grid min-w-6 place-items-center rounded-full bg-[#e2574c] px-1.5 text-xs font-black text-white">
      {count}
    </span>
  );
}

function PasswordGate({ onUnlock }: { onUnlock: () => void }) {
  const adminPassword = useMenuStore((s) => s.data.settings.adminPassword);
  const businessName = useMenuStore((s) => s.data.settings.businessName);
  const [pass, setPass] = useState("");
  const [show, setShow] = useState(false);
  const [error, setError] = useState(false);

  const tryUnlock = () => {
    if (pass === adminPassword) {
      try {
        localStorage.setItem(SESSION_KEY, "1");
      } catch {
        /* noop */
      }
      toast.success("¡Bienvenido, jefe! 🌴");
      onUnlock();
    } else {
      setError(true);
      toast.error("Contraseña incorrecta");
    }
  };

  return (
    <div className="grid min-h-dvh place-items-center bg-[#fdf3e0] px-4">
      <div className="w-full max-w-sm rounded-3xl border border-[#f0dfc0] bg-white p-6 shadow-[0_10px_36px_rgba(180,140,80,0.16)]">
        <div className="mb-4 flex flex-col items-center gap-2 text-center">
          <span className="grid size-14 place-items-center rounded-2xl bg-[#fdf3e0] text-2xl">
            <KeyRound className="size-7 text-[#c2542f]" aria-hidden="true" />
          </span>
          <h1 className="font-display text-2xl text-[#c2542f]">Panel del Negocio</h1>
          <p className="text-sm text-[#8a7350]">
            Gestiona el menú, los agregos del día y la disponibilidad de productos de {businessName}.
          </p>
        </div>

        <div className="grid gap-1.5">
          <Label htmlFor="admin-pass" className="text-sm font-bold text-[#4a3b28]">
            Contraseña del panel
          </Label>
          <div className="relative">
            <Input
              id="admin-pass"
              type={show ? "text" : "password"}
              value={pass}
              onChange={(e) => {
                setPass(e.target.value);
                setError(false);
              }}
              onKeyDown={(e) => e.key === "Enter" && tryUnlock()}
              placeholder="••••••••"
              className={`h-11 border-[#f0dfc0] pr-11 focus-visible:ring-[#e2574c] ${
                error ? "border-[#e2574c]" : ""
              }`}
              autoFocus
            />
            <button
              type="button"
              onClick={() => setShow((v) => !v)}
              className="absolute right-3 top-1/2 -translate-y-1/2 text-[#a58a5f] transition hover:text-[#c2542f]"
              aria-label={show ? "Ocultar" : "Mostrar"}
            >
              {show ? <EyeOff className="size-4" /> : <Eye className="size-4" />}
            </button>
          </div>
          <Button
            type="button"
            onClick={tryUnlock}
            className="mt-2 h-11 rounded-2xl bg-[#e2574c] font-extrabold text-white hover:bg-[#d34a40]"
          >
            Entrar al panel
          </Button>
          <p className="mt-1 text-center text-xs text-[#a58a5f]">
            Contraseña inicial: <code className="rounded bg-[#fdf3e0] px-1 font-bold text-[#c2542f]">playa2026</code>
          </p>
          <a
            href="#/"
            className="mt-3 text-center text-sm font-bold text-[#e2574c] transition hover:underline"
          >
            ← Ver menú
          </a>
        </div>
      </div>
    </div>
  );
}

export function AdminView() {
  const settings = useMenuStore((s) => s.data.settings);
  const unlocked = useSyncExternalStore(
    sessionStore.subscribe,
    sessionStore.get,
    () => false
  );

  const lock = useCallback(() => {
    sessionStore.set(false);
    toast.info("Sesión del panel cerrada");
  }, []);

  if (!unlocked) return <PasswordGate onUnlock={() => sessionStore.set(true)} />;

  return (
    <div className="min-h-dvh bg-[#f7f1e3] pb-10">
      <header className="sticky top-0 z-30 border-b border-[#e8dcc0] bg-[#fffcf4]/95 backdrop-blur">
        <div className="mx-auto flex max-w-3xl items-center gap-3 px-4 py-3">
          <span className="grid size-10 place-items-center rounded-xl bg-[#e2574c] text-white">
            <Store className="size-5" aria-hidden="true" />
          </span>
          <div className="min-w-0">
            <h1 className="truncate font-display text-lg leading-tight text-[#c2542f]">
              {settings.businessName}
            </h1>
            <p className="text-xs font-semibold text-[#8a7350]">
              Panel del Negocio
            </p>
          </div>
          <div className="ml-auto flex items-center gap-2">
            <a
              href="#/"
              className="inline-flex items-center gap-1.5 rounded-full bg-white px-3 py-1.5 text-xs font-bold text-[#c2542f] ring-1 ring-[#f0dfc0] transition hover:bg-[#fdf3e0]"
            >
              <Eye className="size-3.5" aria-hidden="true" />
              Ver menú
            </a>
            <button
              type="button"
              onClick={lock}
              className="grid size-9 place-items-center rounded-full bg-white text-[#8a7350] ring-1 ring-[#f0dfc0] transition hover:text-[#e2574c]"
              aria-label="Salir"
            >
              <LogOut className="size-4" />
            </button>
          </div>
        </div>
      </header>

      <main className="mx-auto w-full max-w-3xl px-4 pt-4">
        <Tabs defaultValue="hoy">
          <TabsList className="nice-scroll mb-4 flex h-auto w-full justify-start gap-1 overflow-x-auto rounded-2xl bg-[#f0e6cc] p-1.5">
            <TabsTrigger
              value="hoy"
              className="gap-1.5 rounded-xl data-[state=active]:bg-white data-[state=active]:text-[#c2542f]"
            >
              <Power className="size-4" aria-hidden="true" />
              Hoy
            </TabsTrigger>
            <TabsTrigger
              value="productos"
              className="gap-1.5 rounded-xl data-[state=active]:bg-white data-[state=active]:text-[#c2542f]"
            >
              <UtensilsCrossed className="size-4" aria-hidden="true" />
              Productos
            </TabsTrigger>
            <TabsTrigger
              value="agregos"
              className="gap-1.5 rounded-xl data-[state=active]:bg-white data-[state=active]:text-[#c2542f]"
            >
              <Flame className="size-4" aria-hidden="true" />
              Agregos
            </TabsTrigger>
            <TabsTrigger
              value="combos"
              className="gap-1.5 rounded-xl data-[state=active]:bg-white data-[state=active]:text-[#c2542f]"
            >
              <Zap className="size-4" aria-hidden="true" />
              Combos
            </TabsTrigger>
            <TabsTrigger
              value="servicio"
              className="gap-1.5 rounded-xl data-[state=active]:bg-white data-[state=active]:text-[#c2542f]"
            >
              <Truck className="size-4" aria-hidden="true" />
              Entrega y pago
            </TabsTrigger>
            <TabsTrigger
              value="pedidos"
              className="gap-1.5 rounded-xl data-[state=active]:bg-white data-[state=active]:text-[#c2542f]"
            >
              Pedidos
              <OrdersBadge />
            </TabsTrigger>
            <TabsTrigger
              value="resenas"
              className="gap-1.5 rounded-xl data-[state=active]:bg-white data-[state=active]:text-[#c2542f]"
            >
              <MessageSquareHeart className="size-4" aria-hidden="true" />
              Reseñas
            </TabsTrigger>
            <TabsTrigger
              value="publicar"
              className="gap-1.5 rounded-xl data-[state=active]:bg-white data-[state=active]:text-[#c2542f]"
            >
              <Sparkles className="size-4" aria-hidden="true" />
              Publicar
            </TabsTrigger>
            <TabsTrigger
              value="ajustes"
              className="gap-1.5 rounded-xl data-[state=active]:bg-white data-[state=active]:text-[#c2542f]"
            >
              <Settings2 className="size-4" aria-hidden="true" />
              Ajustes
            </TabsTrigger>
          </TabsList>

          <TabsContent value="hoy">
            <TabHoy />
          </TabsContent>
          <TabsContent value="productos">
            <TabProductos />
          </TabsContent>
          <TabsContent value="agregos">
            <TabAgregos />
          </TabsContent>
          <TabsContent value="combos">
            <TabCombos />
          </TabsContent>
          <TabsContent value="servicio">
            <TabServicio />
          </TabsContent>
          <TabsContent value="pedidos">
            <TabPedidos />
          </TabsContent>
          <TabsContent value="resenas">
            <TabResenas />
          </TabsContent>
          <TabsContent value="publicar">
            <TabPublicar />
          </TabsContent>
          <TabsContent value="ajustes">
            <TabAjustes />
          </TabsContent>
        </Tabs>
      </main>
    </div>
  );
}
