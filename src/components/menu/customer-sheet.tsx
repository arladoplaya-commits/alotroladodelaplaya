"use client";

import { useMemo, useState } from "react";
import { Bell, BellOff, Check, Heart, Moon, Package, Sun } from "lucide-react";
import { toast } from "sonner";
import {
  Sheet,
  SheetContent,
  SheetDescription,
  SheetFooter,
  SheetHeader,
  SheetTitle,
} from "@/components/ui/sheet";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Switch } from "@/components/ui/switch";
import { buzz, unreadCount, useCustomerStore } from "@/lib/customer";
import { useMenuStore } from "@/lib/store";
import { subscribeToPush, syncCustomerToCloud } from "@/lib/cloud";

import { productName, trNow, useLang, useTr } from "@/lib/i18n";

/* ------------------------------------------------------------------ */
/*  Cliente de la marea: registro, gustos, preferencias y bandeja.     */
/* ------------------------------------------------------------------ */

function requestSystemPermission(): void {
  const st = useCustomerStore.getState();
  try {
    if (typeof Notification === "undefined") {
      st.setPref("systemPermission", "unsupported");
      toast.info(trNow("Tu navegador no soporta notificaciones 📴", "Your browser does not support notifications 📴"), {
        description: trNow("Los avisos quedarán guardados en la campanita 🔔", "Notices will stay in the bell 🔔"),
      });
      return;
    }
    void Notification.requestPermission().then((result) => {
      const perm =
        result === "granted" ? "granted" : result === "denied" ? "denied" : "default";
      useCustomerStore.getState().setPref("systemPermission", perm);
      if (perm === "granted") {
        buzz([60, 40, 60]);
        // Si hay clave VAPID + Supabase, suscribimos también el push real
        void subscribeToPush().then((r) => {
          if (r === "ok") {
            toast.success(trNow("¡Notificaciones activadas! 🔔", "Notifications on! 🔔"), {
              description: trNow(
                "Te avisamos al abrir, al cerrar y con producto nuevo — incluso con la carta cerrada.",
                "We'll tell you when we open, close or add something new — even with the menu closed."
              ),
            });
          } else {
            toast.success(trNow("¡Notificaciones activadas! 🔔", "Notifications on! 🔔"), {
              description: trNow(
                "Te avisamos al abrir, al cerrar y con producto nuevo.",
                "We'll tell you when we open, close or add something new."
              ),
            });
          }
        });
        showWelcomeNotification();
      } else if (perm === "denied") {
        toast.info(trNow("Notificaciones bloqueadas", "Notifications blocked"), {
          description: trNow(
            "Puedes activarlas luego desde ajustes del navegador. La campanita seguirá funcionando.",
            "You can turn them on later in your browser settings. The bell keeps working."
          ),
        });
      }
    });
  } catch {
    st.setPref("systemPermission", "unsupported");
  }
}

function showWelcomeNotification(): void {
  try {
    if (typeof Notification !== "undefined" && Notification.permission === "granted") {
      new Notification(trNow("Bienvenido a la marea 🌊", "Welcome to the tide 🌊"), {
        body: trNow("Ya eres cliente del shack. ¡Buen provecho!", "You're now a shack regular. Enjoy!"),
        icon: "/images/icon-192.png",
        tag: "aol-welcome",
      });
    }
  } catch {
    /* ignorar */
  }
}

function PrefRow({
  icon,
  title,
  desc,
  checked,
  onCheckedChange,
}: {
  icon: React.ReactNode;
  title: string;
  desc: string;
  checked: boolean;
  onCheckedChange: (v: boolean) => void;
}) {
  return (
    <div className="flex items-center gap-3 rounded-2xl border border-[#f0dfc0] bg-white p-3">
      <span className="grid size-9 shrink-0 place-items-center rounded-full bg-[#fdf3e0] text-[#c2542f]">
        {icon}
      </span>
      <div className="min-w-0 flex-1">
        <p className="text-sm font-extrabold text-[#4a3b28]">{title}</p>
        <p className="text-xs leading-snug text-[#8a7350]">{desc}</p>
      </div>
      <Switch checked={checked} onCheckedChange={onCheckedChange} />
    </div>
  );
}

interface CustomerSheetProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
}

export function CustomerSheet({ open, onOpenChange }: CustomerSheetProps) {
  const profile = useCustomerStore((s) => s.profile);
  const prefs = useCustomerStore((s) => s.prefs);
  const favorites = useCustomerStore((s) => s.favorites);
  const orderCounts = useCustomerStore((s) => s.orderCounts);
  const visits = useCustomerStore((s) => s.visits);
  const register = useCustomerStore((s) => s.register);
  const updateProfile = useCustomerStore((s) => s.updateProfile);
  const forgetMe = useCustomerStore((s) => s.forgetMe);
  const setTheme = useCustomerStore((s) => s.setTheme);
  const setPref = useCustomerStore((s) => s.setPref);

  const products = useMenuStore((s) => s.data.products);
  const tr = useTr();
  const lang = useLang();
  const [name, setName] = useState(profile?.name ?? "");
  const [whatsapp, setWhatsapp] = useState(profile?.whatsapp ?? "");
  const [wantNotifs, setWantNotifs] = useState(true);
  const [confirmForget, setConfirmForget] = useState(false);

  const totalOrders = useMemo(
    () => Object.values(orderCounts).reduce((a, b) => a + b, 0),
    [orderCounts]
  );

  const tastes = useMemo(() => {
    return Object.entries(orderCounts)
      .sort((a, b) => b[1] - a[1])
      .slice(0, 3)
      .map(([id, n]) => ({ product: products.find((p) => p.id === id), n }))
      .filter((x): x is { product: NonNullable<typeof x.product>; n: number } => !!x.product);
  }, [orderCounts, products]);

  const joined = useMemo(() => {
    if (!profile) return "";
    try {
      return new Date(profile.joinedAt).toLocaleDateString(lang === "en" ? "en-US" : "es-CU", {
        day: "numeric",
        month: "long",
        year: "numeric",
      });
    } catch {
      return "";
    }
  }, [profile, lang]);

  const handleRegister = () => {
    if (name.trim().length < 2) {
      toast.error(tr("Dinos tu nombre 🌊", "Tell us your name 🌊"), {
        description: tr("Al menos 2 letras para la etiqueta.", "At least 2 letters."),
      });
      return;
    }
    register(name, whatsapp);
    buzz([50, 30, 50]);
    toast.success(tr("¡Bienvenido a la marea! 🌊", "Welcome to the tide! 🌊"), {
      description: wantNotifs
        ? tr("Guardamos tus gustos y activamos los avisos.", "We saved your tastes and turned on notices.")
        : tr("Ya guardamos tu espacio en el shack.", "Your spot at the shack is saved."),
    });
    // Si el shack conectó Supabase, el registro queda guardado en la nube
    void syncCustomerToCloud().then((r) => {
      if (r === "ok") {
        toast.info(tr("Socio registrado en la nube ☁️", "Signed up ☁️"), {
          description: tr("El shack te tendrá en la lista de la marea.", "The shack has you on the list."),
        });
      }
    });
    if (wantNotifs) requestSystemPermission();
  };

  return (
    <Sheet open={open} onOpenChange={onOpenChange}>
      <SheetContent
        side="bottom"
        className="aol-sheet max-h-[92dvh] overflow-y-auto rounded-t-3xl border-[#f0dfc0] bg-[#fffcf4] px-4 pb-[calc(1.5rem+env(safe-area-inset-bottom))]"
      >
        <SheetHeader className="items-center gap-1 pb-0 text-center sm:text-center">
          <SheetTitle className="font-display text-2xl text-[#c2542f]">
            {profile ? tr("Tu rincón playero 🌊", "Your beach corner 🌊") : tr("Hazte cliente de la marea", "Join the tide")}
          </SheetTitle>
          <SheetDescription className="text-sm text-[#8a7350]">
            {profile
              ? tr(`Cliente #${profile.memberNo} · desde ${joined}`, `Member #${profile.memberNo} · since ${joined}`)
              : tr(
                  "Sin cuentas ni contraseñas: solo tu nombre para saludarte y avisarte.",
                  "No accounts or passwords: just your name so we can greet you."
                )}
          </SheetDescription>
        </SheetHeader>

        {!profile ? (
          <>
            <div className="my-4 grid gap-2.5">
              <Input
                value={name}
                onChange={(e) => setName(e.target.value.slice(0, 40))}
                placeholder={tr("Tu nombre (o apodo playero)", "Your name (or beach nickname)")}
                aria-label={tr("Tu nombre", "Your name")}
                className="h-11 border-[#f0dfc0] bg-white text-sm focus-visible:ring-[#e2574c]"
              />
              <Input
                value={whatsapp}
                onChange={(e) => setWhatsapp(e.target.value.slice(0, 20))}
                placeholder={tr("WhatsApp (opcional, para el pedido)", "WhatsApp (optional)")}
                aria-label={tr("WhatsApp opcional", "WhatsApp optional")}
                inputMode="tel"
                className="h-11 border-[#f0dfc0] bg-white text-sm focus-visible:ring-[#e2574c]"
              />
            </div>

            <div className="grid gap-2">
              <PrefRow
                icon={<Bell className="size-4" />}
                title={tr("Avisos del shack", "Shack notices")}
                desc={tr("Avísame cuando abra, cuando cierre y si sale producto nuevo.", "Tell me when it opens, closes or has something new.")}
                checked={wantNotifs}
                onCheckedChange={setWantNotifs}
              />
              <PrefRow
                icon={<Moon className="size-4" />}
                title={tr("Modo noche de playa", "Beach night mode")}
                desc={tr("Cielo nocturno, luna y mar que brilla.", "Night sky, moon and a glowing sea.")}
                checked={prefs.theme === "sunset"}
                onCheckedChange={(v) => setTheme(v ? "sunset" : "day")}
              />
            </div>

            <SheetFooter className="mt-4 sm:flex-col">
              <Button
                type="button"
                onClick={handleRegister}
                className="h-12 w-full rounded-2xl bg-[#e2574c] text-base font-extrabold text-white shadow-[0_8px_24px_-4px_rgba(226,87,76,0.5)] transition hover:bg-[#d34a40] active:scale-[0.98]"
              >
                {tr("🌊 Unirme a la marea", "🌊 Join the tide")}
              </Button>
              <p className="text-center text-xs leading-snug text-[#8a7350]">
                {tr(
                  "Tus favoritos se quedan en este teléfono. Tu nombre, WhatsApp (si lo pones) y tus gustos se guardan en el registro del shack para reconocerte y avisarte de novedades. Si quieres que te borremos del registro, pídenoslo por WhatsApp.",
                  "Your favorites stay on this phone. Your name, WhatsApp (if given) and tastes are kept in the shack's list to recognize you and send news. To be removed, ask us on WhatsApp."
                )}
              </p>
            </SheetFooter>
          </>
        ) : (
          <>
            {/* Tarjeta de socio */}
            <div className="mt-4 flex items-center gap-3 rounded-2xl border-2 border-dashed border-[#e2574c]/45 bg-[#fdeae0] p-3.5">
              <span className="grid size-12 shrink-0 place-items-center rounded-full bg-white text-2xl shadow-sm" aria-hidden="true">
                🌊
              </span>
              <div className="min-w-0 flex-1">
                <p className="truncate font-display text-lg leading-tight text-[#c2542f]">
                  {profile.name}
                </p>
                <p className="text-xs font-semibold text-[#b3562e]">
                  {tr("Cliente de la marea", "Tide member")} #{profile.memberNo} · {visits} {tr("visitas", "visits")}
                </p>
              </div>
            </div>

            {/* Gustos + stats */}
            <div className="mt-3 grid grid-cols-3 gap-2 text-center">
              <div className="rounded-2xl bg-white p-2.5 ring-1 ring-[#f0dfc0]">
                <p className="font-display text-xl text-[#e2574c]">{favorites.length}</p>
                <p className="text-[11px] font-bold text-[#8a7350]">{tr("favoritos ❤️", "favorites ❤️")}</p>
              </div>
              <div className="rounded-2xl bg-white p-2.5 ring-1 ring-[#f0dfc0]">
                <p className="font-display text-xl text-[#e2574c]">{totalOrders}</p>
                <p className="text-[11px] font-bold text-[#8a7350]">{tr("pedidos armados", "orders built")}</p>
              </div>
              <div className="rounded-2xl bg-white p-2.5 ring-1 ring-[#f0dfc0]">
                <p className="font-display text-xl text-[#e2574c]">{visits}</p>
                <p className="text-[11px] font-bold text-[#8a7350]">{tr("visitas", "visits")}</p>
              </div>
            </div>

            <div className="mt-3 rounded-2xl bg-white p-3.5 ring-1 ring-[#f0dfc0]">
              <p className="mb-1.5 flex items-center gap-1.5 text-sm font-extrabold text-[#4a3b28]">
                <Heart className="size-4 fill-[#e2574c] text-[#e2574c]" aria-hidden="true" />
                {tr("Tus gustos", "Your tastes")}
              </p>
              {tastes.length === 0 ? (
                <p className="text-xs leading-snug text-[#8a7350]">
                  {tr(
                    "Aún no los conocemos: cada vez que armes un pedido lo apuntamos para recomendarte mejor.",
                    "We don't know them yet: every order you build helps us recommend better."
                  )}
                </p>
              ) : (
                <ul className="grid gap-1.5">
                  {tastes.map(({ product, n }, i) => (
                    <li key={product.id} className="flex items-center gap-2 text-sm">
                      <span
                        className="grid size-6 shrink-0 place-items-center rounded-full bg-[#fdf3e0] text-[11px] font-black text-[#c2542f]"
                        aria-hidden="true"
                      >
                        {i + 1}
                      </span>
                      <span className="min-w-0 flex-1 truncate font-semibold text-[#4a3b28]">
                        {product.emoji} {productName(product, lang)}
                      </span>
                      <span className="shrink-0 rounded-full bg-[#e2574c]/10 px-2 py-0.5 text-[11px] font-bold text-[#c2542f]">
                        {n}×
                      </span>
                    </li>
                  ))}
                </ul>
              )}
            </div>

            {/* Nombre editable + preferencias */}
            <div className="mt-3 grid gap-2">
              <Input
                value={name}
                onChange={(e) => {
                  setName(e.target.value);
                  updateProfile({ name: e.target.value });
                }}
                placeholder={tr("Tu nombre", "Your name")}
                aria-label={tr("Tu nombre", "Your name")}
                className="h-11 border-[#f0dfc0] bg-white text-sm focus-visible:ring-[#e2574c]"
              />
              <PrefRow
                icon={<Bell className="size-4" />}
                title={tr("Avisos de apertura y cierre", "Open & close notices")}
                desc={tr("Un toque cuando el shack enciende o apaga el fuego.", "A ping when the shack fires up or closes.")}
                checked={prefs.notifyOpenClose}
                onCheckedChange={(v) => setPref("notifyOpenClose", v)}
              />
              <PrefRow
                icon={<Package className="size-4" />}
                title={tr("Productos nuevos", "New items")}
                desc={tr("Aviso cuando entra un antojo nuevo a la carta.", "A notice when something new hits the menu.")}
                checked={prefs.notifyNewProducts}
                onCheckedChange={(v) => setPref("notifyNewProducts", v)}
              />
              <PrefRow
                icon={prefs.theme === "sunset" ? <Moon className="size-4" /> : <Sun className="size-4" />}
                title={tr("Modo noche de playa", "Beach night mode")}
                desc={tr("Cielo nocturno, luna y mar que brilla en toda la carta.", "Night sky, moon and a glowing sea across the menu.")}
                checked={prefs.theme === "sunset"}
                onCheckedChange={(v) => setTheme(v ? "sunset" : "day")}
              />
            </div>

            {/* Permiso del sistema */}
            <div className="mt-3 rounded-2xl border-2 border-dashed border-[#bfe3f2] bg-[#eef9fc] p-3.5">
              <p className="flex items-center gap-1.5 text-sm font-extrabold text-[#2b7a93]">
                <Bell className="size-4" aria-hidden="true" />
                {tr("Notificaciones del teléfono", "Phone notifications")}
              </p>
              {prefs.systemPermission === "granted" ? (
                <p className="mt-1 flex items-center gap-1.5 text-xs font-semibold text-[#2b7a93]">
                  <Check className="size-3.5" aria-hidden="true" />
                  {tr("Activadas: verás los avisos aunque estés en otra app.", "On: you\u2019ll see notices even in another app.")}
                </p>
              ) : (
                <>
                  <p className="mt-1 text-xs leading-snug text-[#4d7c8a]">
                    {prefs.systemPermission === "denied"
                      ? tr(
                          "Están bloqueadas en el navegador. Actívalas desde el candado de la dirección y vuelve aquí.",
                          "They're blocked in the browser. Enable them from the padlock by the address and come back."
                        )
                      : tr(
                          "Permite que el shack te avise aunque tengas la página en segundo plano.",
                          "Let the shack notify you even when the page is in the background."
                        )}
                  </p>
                  {prefs.systemPermission !== "denied" && (
                    <Button
                      type="button"
                      onClick={requestSystemPermission}
                      className="mt-2 h-10 w-full rounded-xl bg-[#2b7a93] text-sm font-extrabold text-white transition hover:bg-[#256a81] active:scale-[0.98]"
                    >
                      <Bell className="size-4" aria-hidden="true" />
                      {tr("Activar notificaciones", "Turn on notifications")}
                    </Button>
                  )}
                </>
              )}
            </div>

            {/* Olvidarme */}
            <div className="mt-4 text-center">
              {confirmForget ? (
                <div className="grid gap-2 rounded-2xl border border-[#e8b08a] bg-[#fdeae0] p-3">
                  <p className="text-xs font-semibold text-[#b3562e]">
                    {tr("¿Borrar tu perfil, favoritos y avisos de este teléfono?", "Delete your profile, favorites and notices from this phone?")}
                  </p>
                  <div className="flex justify-center gap-2">
                    <Button
                      type="button"
                      size="sm"
                      variant="outline"
                      className="rounded-full border-[#e8b08a] text-[#b3562e]"
                      onClick={() => setConfirmForget(false)}
                    >
                      {tr("Mejor no", "No, keep them")}
                    </Button>
                    <Button
                      type="button"
                      size="sm"
                      className="rounded-full bg-[#b3562e] text-white hover:bg-[#a04d29]"
                      onClick={() => {
                        forgetMe();
                        setName("");
                        setWhatsapp("");
                        setConfirmForget(false);
                        toast.info(tr("Listo, borramos tu rastro 🏖️", "Done, your footprints are gone 🏖️"));
                      }}
                    >
                      {tr("Sí, borrar", "Yes, delete")}
                    </Button>
                  </div>
                </div>
              ) : (
                <button
                  type="button"
                  onClick={() => setConfirmForget(true)}
                  className="inline-flex items-center gap-1.5 rounded-full px-3 py-1.5 text-xs font-semibold text-[#c4b08c] transition hover:bg-[#fdeae0] hover:text-[#b3562e]"
                >
                  <BellOff className="size-3.5" aria-hidden="true" />
                  {tr("Borrar mis datos de este teléfono", "Delete my data from this phone")}
                </button>
              )}
            </div>
          </>
        )}
      </SheetContent>
    </Sheet>
  );
}

/* ------------------------------------------------------------------ */
/*  Bandeja de avisos (campanita)                                      */
/* ------------------------------------------------------------------ */

const KIND_STYLE: Record<string, { emoji: string; ring: string }> = {
  open: { emoji: "🌊", ring: "bg-[#e6f6ea]" },
  close: { emoji: "🌙", ring: "bg-[#eef0fb]" },
  "new-product": { emoji: "🆕", ring: "bg-[#fdf3d8]" },
  system: { emoji: "🔔", ring: "bg-[#eef9fc]" },
};

interface InboxSheetProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
}

export function InboxSheet({ open, onOpenChange }: InboxSheetProps) {
  const inbox = useCustomerStore((s) => s.inbox);
  const markAllRead = useCustomerStore((s) => s.markAllRead);
  const clearInbox = useCustomerStore((s) => s.clearInbox);
  const unread = unreadCount(inbox);
  const tr = useTr();
  const lang = useLang();

  return (
    <Sheet open={open} onOpenChange={onOpenChange}>
      <SheetContent
        side="bottom"
        className="aol-sheet max-h-[92dvh] overflow-y-auto rounded-t-3xl border-[#f0dfc0] bg-[#fffcf4] px-4 pb-[calc(1.5rem+env(safe-area-inset-bottom))]"
      >
        <SheetHeader className="items-center gap-1 pb-0 text-center sm:text-center">
          <SheetTitle className="font-display text-2xl text-[#c2542f]">
            {tr("Avisos del shack 🔔", "Shack notices 🔔")}
          </SheetTitle>
          <SheetDescription className="text-sm text-[#8a7350]">
            {unread > 0 ? tr(`${unread} sin leer`, `${unread} unread`) : tr("Todo leído, al día con la marea", "All caught up with the tide")}
          </SheetDescription>
        </SheetHeader>

        {inbox.length === 0 ? (
          <div className="flex flex-col items-center gap-2 py-10 text-center">
            <span className="text-5xl" aria-hidden="true">
              🌴
            </span>
            <p className="font-display text-lg text-[#c2542f]">{tr("Sin novedades por ahora", "Nothing new for now")}</p>
            <p className="max-w-xs text-sm leading-snug text-[#8a7350]">
              {tr(
                "Aquí te avisamos cuando el shack abra, cierre o saque algo nuevo a la carta.",
                "We\u2019ll let you know here when the shack opens, closes or adds something new."
              )}
            </p>
          </div>
        ) : (
          <>
            <ul className="nice-scroll my-4 grid max-h-80 gap-2 overflow-y-auto pr-1">
              {[...inbox].reverse().map((n) => {
                const style = KIND_STYLE[n.kind] ?? KIND_STYLE.system;
                return (
                  <li
                    key={n.id}
                    className={`flex items-start gap-3 rounded-2xl border p-3 ${
                      n.read
                        ? "border-[#f0dfc0] bg-white/70"
                        : "border-[#e2574c]/35 bg-white shadow-[0_2px_10px_rgba(226,87,76,0.10)]"
                    }`}
                  >
                    <span
                      className={`grid size-9 shrink-0 place-items-center rounded-full text-lg ${style.ring}`}
                      aria-hidden="true"
                    >
                      {style.emoji}
                    </span>
                    <div className="min-w-0 flex-1">
                      <p className="text-sm font-extrabold text-[#4a3b28]">{n.title}</p>
                      <p className="text-xs leading-snug text-[#8a7350]">{n.body}</p>
                      <p className="mt-0.5 text-[10px] font-semibold uppercase tracking-wide text-[#c4b08c]">
                        {new Date(n.createdAt).toLocaleString(lang === "en" ? "en-US" : "es-CU", {
                          day: "numeric",
                          month: "short",
                          hour: "2-digit",
                          minute: "2-digit",
                        })}
                      </p>
                    </div>
                    {!n.read && <span className="mt-1 size-2 shrink-0 rounded-full bg-[#e2574c]" aria-hidden="true" />}
                  </li>
                );
              })}
            </ul>
            <div className="flex justify-center gap-2 pb-1">
              {unread > 0 && (
                <Button
                  type="button"
                  variant="outline"
                  size="sm"
                  className="rounded-full border-[#f0dfc0] text-[#c2542f] hover:bg-[#fdf3e0]"
                  onClick={markAllRead}
                >
                  <Check className="size-4" aria-hidden="true" />
                  {tr("Marcar todo como leído", "Mark all as read")}
                </Button>
              )}
              <Button
                type="button"
                variant="ghost"
                size="sm"
                className="rounded-full text-[#c4b08c] hover:bg-[#fdeae0] hover:text-[#b3562e]"
                onClick={clearInbox}
              >
                {tr("Vaciar bandeja", "Clear inbox")}
              </Button>
            </div>
          </>
        )}
      </SheetContent>
    </Sheet>
  );
}
