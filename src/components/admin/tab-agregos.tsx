"use client";

import { useState } from "react";
import { Pencil, Plus } from "lucide-react";
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
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Switch } from "@/components/ui/switch";
import { money, uid, useMenuStore } from "@/lib/store";
import type { Agrego } from "@/lib/types";

/* ------------------------------------------------------------------ */
/*  Agregos: extras que el cliente añade desde el personalizador       */
/* ------------------------------------------------------------------ */

export function TabAgregos() {
  const data = useMenuStore((s) => s.data);
  const saveAgrego = useMenuStore((s) => s.saveAgrego);
  const deleteAgrego = useMenuStore((s) => s.deleteAgrego);

  const [editing, setEditing] = useState<Agrego | null>(null);
  const [confirmDelete, setConfirmDelete] = useState<Agrego | null>(null);

  const openNew = () => {
    setEditing({ id: uid("a"), name: "", price: 200, available: true });
  };

  const save = () => {
    if (!editing) return;
    if (!editing.name.trim()) {
      toast.error("El agrego necesita un nombre");
      return;
    }
    if (editing.price < 0) {
      toast.error("El precio no puede ser negativo");
      return;
    }
    const isNew = !data.agregos.some((a) => a.id === editing.id);
    saveAgrego({ ...editing, name: editing.name.trim().slice(0, 40) });
    toast.success(isNew ? "Agrego creado" : "Agrego actualizado");
    setEditing(null);
  };

  return (
    <div className="grid gap-3">
      <div className="flex items-center justify-between gap-3">
        <p className="text-sm text-[#8a7350]">
          Los agregos que apagues desaparecen del personalizador hoy.
        </p>
        <Button
          type="button"
          onClick={openNew}
          className="shrink-0 rounded-2xl bg-[#e2574c] font-extrabold text-white hover:bg-[#d34a40]"
        >
          <Plus className="size-4" aria-hidden="true" />
          Nuevo agrego ✨
        </Button>
      </div>

      {data.agregos.length === 0 ? (
        <p className="rounded-2xl border-2 border-dashed border-[#e8d5b5] bg-white/60 px-4 py-8 text-center text-sm text-[#8a7350]">
          Aún no hay agregos. Crea el primero.
        </p>
      ) : (
        <ul className="overflow-hidden rounded-3xl border border-[#e8dcc0] bg-white shadow-sm">
          {data.agregos.map((a) => (
            <li
              key={a.id}
              className="flex items-center gap-3 border-b border-[#f0e6cc] px-4 py-3 last:border-0"
            >
              <div className="min-w-0 flex-1">
                <p className="truncate text-sm font-bold text-[#4a3b28]">{a.name}</p>
                <p className="text-xs text-[#8a7350]">
                  + {money(data.settings.currency, a.price)} ·{" "}
                  {a.available ? "hay hoy" : "no hay hoy"}
                </p>
              </div>
              <Switch
                checked={a.available}
                onCheckedChange={(v) => saveAgrego({ ...a, available: v })}
                aria-label={`¿Hay ${a.name}?`}
              />
              <button
                type="button"
                onClick={() => setEditing({ ...a })}
                className="grid size-9 place-items-center rounded-full text-[#8a7350] transition hover:bg-[#fdf3e0] hover:text-[#c2542f]"
                aria-label={`Editar ${a.name}`}
              >
                <Pencil className="size-4" />
              </button>
            </li>
          ))}
        </ul>
      )}

      <Dialog open={!!editing} onOpenChange={(v) => !v && setEditing(null)}>
        <DialogContent className="max-w-md rounded-3xl border-[#f0dfc0] bg-[#fffcf4]">
          <DialogHeader>
            <DialogTitle className="font-display text-xl text-[#c2542f]">
              {editing && data.agregos.some((a) => a.id === editing.id)
                ? "Editar agrego"
                : "Nuevo agrego"}
            </DialogTitle>
            <DialogDescription>
              Ingrediente extra que el cliente añade a su pedido.
            </DialogDescription>
          </DialogHeader>
          {editing && (
            <div className="grid gap-3.5">
              <div className="grid gap-1.5">
                <Label htmlFor="a-name" className="font-bold text-[#4a3b28]">
                  Nombre
                </Label>
                <Input
                  id="a-name"
                  value={editing.name}
                  onChange={(e) => setEditing({ ...editing, name: e.target.value })}
                  placeholder="Ej: Queso Gouda"
                  className="border-[#f0dfc0] focus-visible:ring-[#e2574c]"
                />
              </div>
              <div className="grid gap-1.5">
                <Label htmlFor="a-price" className="font-bold text-[#4a3b28]">
                  Precio ({data.settings.currency})
                </Label>
                <Input
                  id="a-price"
                  type="number"
                  min={0}
                  value={editing.price}
                  onChange={(e) =>
                    setEditing({ ...editing, price: Number(e.target.value) || 0 })
                  }
                  className="border-[#f0dfc0] focus-visible:ring-[#e2574c]"
                />
              </div>
              <div className="flex items-center justify-between rounded-2xl bg-[#fdf8ec] px-4 py-3">
                <span className="text-sm font-bold text-[#4a3b28]">¿Hay hoy?</span>
                <Switch
                  checked={editing.available}
                  onCheckedChange={(v) => setEditing({ ...editing, available: v })}
                  aria-label="Disponible hoy"
                />
              </div>
            </div>
          )}
          <DialogFooter className="gap-2 sm:justify-between">
            {editing && data.agregos.some((a) => a.id === editing.id) ? (
              <Button
                type="button"
                variant="ghost"
                onClick={() => {
                  setConfirmDelete(editing);
                  setEditing(null);
                }}
                className="text-[#b3562e] hover:bg-[#fdeae7] hover:text-[#b3562e]"
              >
                Eliminar
              </Button>
            ) : (
              <span />
            )}
            <div className="flex gap-2">
              <Button
                type="button"
                variant="outline"
                onClick={() => setEditing(null)}
                className="border-[#f0dfc0]"
              >
                Cancelar
              </Button>
              <Button
                type="button"
                onClick={save}
                className="bg-[#e2574c] font-extrabold text-white hover:bg-[#d34a40]"
              >
                Guardar agrego
              </Button>
            </div>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      <AlertDialog
        open={!!confirmDelete}
        onOpenChange={(v) => !v && setConfirmDelete(null)}
      >
        <AlertDialogContent className="rounded-3xl border-[#f0dfc0] bg-[#fffcf4]">
          <AlertDialogHeader>
            <AlertDialogTitle className="font-display text-xl text-[#c2542f]">
              ¿Eliminar {confirmDelete?.name}?
            </AlertDialogTitle>
            <AlertDialogDescription>
              Esta acción no se puede deshacer.
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel className="border-[#f0dfc0]">Cancelar</AlertDialogCancel>
            <AlertDialogAction
              onClick={() => {
                if (confirmDelete) {
                  deleteAgrego(confirmDelete.id);
                  toast.success("Agrego eliminado");
                }
                setConfirmDelete(null);
              }}
              className="bg-[#e2574c] text-white hover:bg-[#d34a40]"
            >
              Sí, eliminar
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </div>
  );
}
