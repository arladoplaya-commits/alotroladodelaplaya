"use client";

import { useState } from "react";
import { Eye, EyeOff, RotateCcw } from "lucide-react";
import { toast } from "sonner";
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
} from "@/components/ui/alert-dialog";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Switch } from "@/components/ui/switch";
import { useMenuStore } from "@/lib/store";
import type { Settings } from "@/lib/types";

/* ------------------------------------------------------------------ */
/*  Ajustes del negocio + restaurar datos de fábrica                   */
/* ------------------------------------------------------------------ */

export function TabAjustes() {
  const settings = useMenuStore((s) => s.data.settings);
  const saveSettings = useMenuStore((s) => s.saveSettings);
  const resetToFactory = useMenuStore((s) => s.resetToFactory);

  const [draft, setDraft] = useState<Settings>({ ...settings });
  const [showPass, setShowPass] = useState(false);
  const [confirmReset, setConfirmReset] = useState(false);

  const whatsappOk =
    draft.whatsapp === "" || draft.whatsapp.replace(/\D/g, "").length >= 8;

  const dirty = JSON.stringify(draft) !== JSON.stringify(settings);

  const save = () => {
    if (!draft.businessName.trim()) {
      toast.error("El nombre del negocio es obligatorio");
      return;
    }
    if (!whatsappOk) {
      toast.error(
        "El WhatsApp debe incluir código de país, solo dígitos. Ej: 5351234567"
      );
      return;
    }
    if (draft.adminPassword.trim().length < 4) {
      toast.error("La contraseña debe tener al menos 4 caracteres");
      return;
    }
    saveSettings({
      ...draft,
      businessName: draft.businessName.trim().slice(0, 60),
      tagline: draft.tagline.trim().slice(0, 120),
      adminPassword: draft.adminPassword.trim(),
    });
    toast.success("Ajustes guardados ✅");
  };

  return (
    <div className="grid gap-4">
      <section className="rounded-3xl border border-[#e8dcc0] bg-white p-5 shadow-sm">
        <h2 className="mb-3 font-display text-xl text-[#c2542f]">
          Datos del negocio
        </h2>
        <div className="grid gap-3.5">
          <div className="grid gap-1.5">
            <Label htmlFor="s-name" className="font-bold text-[#4a3b28]">
              Nombre
            </Label>
            <Input
              id="s-name"
              value={draft.businessName}
              onChange={(e) => setDraft({ ...draft, businessName: e.target.value })}
              className="border-[#f0dfc0] focus-visible:ring-[#e2574c]"
            />
          </div>
          <div className="grid gap-1.5">
            <Label htmlFor="s-tagline" className="font-bold text-[#4a3b28]">
              Lema / eslogan
            </Label>
            <Input
              id="s-tagline"
              value={draft.tagline}
              onChange={(e) => setDraft({ ...draft, tagline: e.target.value })}
              className="border-[#f0dfc0] focus-visible:ring-[#e2574c]"
            />
          </div>
          <div className="grid gap-1.5">
            <Label htmlFor="s-wa" className="font-bold text-[#4a3b28]">
              WhatsApp (con país)
            </Label>
            <Input
              id="s-wa"
              inputMode="numeric"
              value={draft.whatsapp}
              onChange={(e) =>
                setDraft({ ...draft, whatsapp: e.target.value.replace(/[^\d+]/g, "") })
              }
              placeholder="Ej: 5351234567"
              className={`border-[#f0dfc0] focus-visible:ring-[#e2574c] ${
                !whatsappOk ? "border-[#e2574c]" : ""
              }`}
            />
            {!whatsappOk && (
              <p className="text-xs font-semibold text-[#e2574c]">
                El WhatsApp debe incluir código de país, solo dígitos. Ej: 5351234567
              </p>
            )}
          </div>
          <div className="grid gap-3 sm:grid-cols-3">
            <div className="grid gap-1.5">
              <Label htmlFor="s-cur" className="font-bold text-[#4a3b28]">
                Moneda
              </Label>
              <Input
                id="s-cur"
                value={draft.currency}
                onChange={(e) => setDraft({ ...draft, currency: e.target.value.slice(0, 4) })}
                className="border-[#f0dfc0] focus-visible:ring-[#e2574c]"
              />
            </div>
            <div className="grid gap-1.5 sm:col-span-2">
              <Label htmlFor="s-time" className="font-bold text-[#4a3b28]">
                Tiempo entrega
              </Label>
              <Input
                id="s-time"
                value={draft.deliveryTime}
                onChange={(e) => setDraft({ ...draft, deliveryTime: e.target.value })}
                className="border-[#f0dfc0] focus-visible:ring-[#e2574c]"
              />
            </div>
          </div>
          <div className="grid gap-1.5">
            <Label htmlFor="s-point" className="font-bold text-[#4a3b28]">
              Punto de entrega
            </Label>
            <Input
              id="s-point"
              value={draft.deliveryPoint}
              onChange={(e) => setDraft({ ...draft, deliveryPoint: e.target.value })}
              placeholder="Ej: Calle 21 e/ 14 · Vedado"
              className="border-[#f0dfc0] focus-visible:ring-[#e2574c]"
            />
          </div>
          <div className="flex items-center justify-between rounded-2xl bg-[#fdf8ec] px-4 py-3">
            <div>
              <p className="text-sm font-bold text-[#4a3b28]">
                Ocultar productos agotados
              </p>
              <p className="text-xs text-[#8a7350]">
                {draft.hideSoldOut
                  ? "Activado: los clientes solo ven lo que hay"
                  : "Desactivado: lo agotado se ve tachado"}
              </p>
            </div>
            <Switch
              checked={draft.hideSoldOut}
              onCheckedChange={(v) => setDraft({ ...draft, hideSoldOut: v })}
              aria-label="Ocultar productos agotados"
            />
          </div>
          <div className="grid gap-1.5">
            <Label htmlFor="s-pass" className="font-bold text-[#4a3b28]">
              Contraseña del panel
            </Label>
            <div className="relative">
              <Input
                id="s-pass"
                type={showPass ? "text" : "password"}
                value={draft.adminPassword}
                onChange={(e) => setDraft({ ...draft, adminPassword: e.target.value })}
                className="border-[#f0dfc0] pr-11 focus-visible:ring-[#e2574c]"
              />
              <button
                type="button"
                onClick={() => setShowPass((v) => !v)}
                className="absolute right-3 top-1/2 -translate-y-1/2 text-[#a58a5f] transition hover:text-[#c2542f]"
                aria-label={showPass ? "Ocultar contraseña" : "Mostrar contraseña"}
              >
                {showPass ? <EyeOff className="size-4" /> : <Eye className="size-4" />}
              </button>
            </div>
            <p className="text-xs text-[#a58a5f]">
              Protege el acceso a este panel en cada dispositivo.
            </p>
          </div>
        </div>

        <div className="mt-4 flex flex-wrap gap-2">
          <Button
            type="button"
            onClick={save}
            disabled={!dirty}
            className="rounded-2xl bg-[#e2574c] font-extrabold text-white hover:bg-[#d34a40] disabled:opacity-50"
          >
            Guardar ajustes
          </Button>
          <Button
            type="button"
            variant="outline"
            onClick={() => setDraft({ ...settings })}
            disabled={!dirty}
            className="rounded-2xl border-[#f0dfc0] font-bold text-[#8a7350] hover:bg-[#fdf3e0] disabled:opacity-50"
          >
            Descartar cambios
          </Button>
        </div>
      </section>

      <section className="rounded-3xl border border-[#e8dcc0] bg-white p-5 shadow-sm">
        <h3 className="font-display text-lg text-[#c2542f]">
          Zona delicada 🌊
        </h3>
        <p className="mt-1 text-sm text-[#8a7350]">
          Restaura la carta, agregos y ajustes a los datos de fábrica.
        </p>
        <Button
          type="button"
          variant="outline"
          onClick={() => setConfirmReset(true)}
          className="mt-2.5 rounded-2xl border-[#f0dfc0] font-bold text-[#b3562e] hover:bg-[#fdeae7]"
        >
          <RotateCcw className="size-4" aria-hidden="true" />
          Restaurar datos de fábrica
        </Button>
      </section>

      <AlertDialog open={confirmReset} onOpenChange={setConfirmReset}>
        <AlertDialogContent className="rounded-3xl border-[#f0dfc0] bg-[#fffcf4]">
          <AlertDialogHeader>
            <AlertDialogTitle className="font-display text-xl text-[#c2542f]">
              ¿Restaurar todo a datos de fábrica?
            </AlertDialogTitle>
            <AlertDialogDescription>
              Se pierden los productos, agregos y ajustes guardados en este
              dispositivo. Esta acción no se puede deshacer.
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel className="border-[#f0dfc0]">Cancelar</AlertDialogCancel>
            <AlertDialogAction
              onClick={() => {
                resetToFactory();
                setDraft({ ...settings });
                toast.success("Datos restaurados");
              }}
              className="bg-[#e2574c] text-white hover:bg-[#d34a40]"
            >
              Sí, restaurar
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </div>
  );
}
