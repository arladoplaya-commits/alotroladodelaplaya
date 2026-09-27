"use client";

import { useState } from "react";
import { Minus, Pencil, Plus, Trash2 } from "lucide-react";
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
import { Textarea } from "@/components/ui/textarea";
import { money, uid, useMenuStore } from "@/lib/store";
import type { Combo, MenuData } from "@/lib/types";

/* ------------------------------------------------------------------ */
/*  Combos y ofertas: varios productos a un precio especial            */
/* ------------------------------------------------------------------ */

function regularPrice(combo: Combo, data: MenuData): number {
  return combo.items.reduce((acc, it) => {
    const p = data.products.find((x) => x.id === it.productId);
    return acc + (p ? p.price * it.qty : 0);
  }, 0);
}

export function TabCombos() {
  const data = useMenuStore((s) => s.data);
  const saveCombo = useMenuStore((s) => s.saveCombo);
  const deleteCombo = useMenuStore((s) => s.deleteCombo);
  const currency = data.settings.currency;

  const [editing, setEditing] = useState<Combo | null>(null);
  const [confirmDelete, setConfirmDelete] = useState<Combo | null>(null);
  const [pick, setPick] = useState("");

  const openNew = () =>
    setEditing({
      id: uid("c"),
      name: "",
      emoji: "🔥",
      description: "",
      items: [],
      price: 0,
      active: true,
    });

  const save = () => {
    if (!editing) return;
    if (!editing.name.trim()) {
      toast.error("El combo necesita un nombre");
      return;
    }
    if (editing.items.length < 2 && !editing.items.some((i) => i.qty > 1)) {
      toast.error("Un combo lleva al menos 2 productos");
      return;
    }
    if (editing.price <= 0) {
      toast.error("Pon el precio del combo");
      return;
    }
    const isNew = !data.combos.some((c) => c.id === editing.id);
    saveCombo({
      ...editing,
      name: editing.name.trim().slice(0, 40),
      description: editing.description.trim().slice(0, 120),
    });
    toast.success(isNew ? "Combo creado 🔥" : "Combo actualizado", {
      description: "Publica el menú para que lo vean todos.",
    });
    setEditing(null);
  };

  const setItemQty = (productId: string, qty: number) => {
    if (!editing) return;
    setEditing({
      ...editing,
      items:
        qty <= 0
          ? editing.items.filter((i) => i.productId !== productId)
          : editing.items.map((i) => (i.productId === productId ? { ...i, qty } : i)),
    });
  };

  const addItem = (productId: string) => {
    if (!editing || !productId) return;
    const exists = editing.items.find((i) => i.productId === productId);
    setEditing({
      ...editing,
      items: exists
        ? editing.items.map((i) => (i.productId === productId ? { ...i, qty: i.qty + 1 } : i))
        : [...editing.items, { productId, qty: 1 }],
    });
    setPick("");
  };

  const editingRegular = editing ? regularPrice(editing, data) : 0;

  return (
    <div className="grid grid-cols-1 gap-3">
      <div className="flex items-center justify-between gap-3">
        <p className="text-sm text-[#8a7350]">
          Arma combos con precio especial. Se esconden solos si algún
          producto se acaba.
        </p>
        <Button
          type="button"
          onClick={openNew}
          className="shrink-0 rounded-2xl bg-[#e2574c] font-extrabold text-white hover:bg-[#d34a40]"
        >
          <Plus className="size-4" aria-hidden="true" />
          Nuevo combo
        </Button>
      </div>

      {data.combos.length === 0 ? (
        <p className="rounded-2xl border-2 border-dashed border-[#e8d5b5] bg-white/60 px-4 py-8 text-center text-sm text-[#8a7350]">
          Aún no hay combos. Crea el primero: por ejemplo «Perro + refresco».
        </p>
      ) : (
        <ul className="grid grid-cols-1 gap-2.5">
          {data.combos.map((c) => {
            const regular = regularPrice(c, data);
            const save = regular - c.price;
            return (
              <li
                key={c.id}
                className="flex items-center gap-3 rounded-2xl border border-[#e8dcc0] bg-white p-3 shadow-sm"
              >
                <span className="grid size-11 shrink-0 place-items-center rounded-xl bg-[#fdf3e0] text-2xl" aria-hidden="true">
                  {c.emoji}
                </span>
                <div className="min-w-0 flex-1">
                  <p className="truncate font-extrabold text-[#4a3b28]">{c.name}</p>
                  <p className="truncate text-xs text-[#8a7350]">
                    {c.items
                      .map((i) => {
                        const p = data.products.find((x) => x.id === i.productId);
                        return p ? `${i.qty}× ${p.name}` : "¿producto borrado?";
                      })
                      .join(" · ")}
                  </p>
                  <p className="text-xs font-bold text-[#c2542f]">
                    {money(currency, c.price)}
                    {save > 0 && (
                      <span className="ml-1.5 font-semibold text-[#3f9e5f]">
                        (ahorran {money(currency, save)})
                      </span>
                    )}
                    {save < 0 && (
                      <span className="ml-1.5 font-semibold text-[#e2574c]">
                        ⚠️ más caro que por separado
                      </span>
                    )}
                  </p>
                </div>
                <Switch
                  checked={c.active}
                  onCheckedChange={(v) => saveCombo({ ...c, active: v })}
                  aria-label={`Mostrar ${c.name}`}
                />
                <button
                  type="button"
                  onClick={() => setEditing({ ...c, items: c.items.map((i) => ({ ...i })) })}
                  className="grid size-9 place-items-center rounded-full text-[#8a7350] ring-1 ring-[#f0dfc0] transition hover:text-[#c2542f]"
                  aria-label={`Editar ${c.name}`}
                >
                  <Pencil className="size-4" />
                </button>
                <button
                  type="button"
                  onClick={() => setConfirmDelete(c)}
                  className="grid size-9 place-items-center rounded-full text-[#8a7350] ring-1 ring-[#f0dfc0] transition hover:text-[#e2574c]"
                  aria-label={`Borrar ${c.name}`}
                >
                  <Trash2 className="size-4" />
                </button>
              </li>
            );
          })}
        </ul>
      )}

      <Dialog open={!!editing} onOpenChange={(v) => !v && setEditing(null)}>
        <DialogContent className="max-h-[92dvh] overflow-y-auto rounded-3xl border-[#f0dfc0] bg-[#fffcf4]">
          <DialogHeader>
            <DialogTitle className="font-display text-xl text-[#c2542f]">
              {editing && data.combos.some((c) => c.id === editing.id)
                ? "Editar combo"
                : "Nuevo combo"}
            </DialogTitle>
            <DialogDescription>
              Elige los productos y pon un precio mejor que por separado.
            </DialogDescription>
          </DialogHeader>
          {editing && (
            <div className="grid gap-3">
              <div className="grid grid-cols-[4.5rem_1fr] gap-2">
                <div className="grid gap-1.5">
                  <Label htmlFor="c-emoji" className="font-bold text-[#4a3b28]">Emoji</Label>
                  <Input
                    id="c-emoji"
                    value={editing.emoji}
                    onChange={(e) => setEditing({ ...editing, emoji: e.target.value.slice(0, 4) })}
                    className="border-[#f0dfc0] text-center text-xl"
                  />
                </div>
                <div className="grid gap-1.5">
                  <Label htmlFor="c-name" className="font-bold text-[#4a3b28]">Nombre</Label>
                  <Input
                    id="c-name"
                    value={editing.name}
                    onChange={(e) => setEditing({ ...editing, name: e.target.value })}
                    placeholder="Ej: Combo Playero"
                    className="border-[#f0dfc0]"
                  />
                </div>
              </div>
              <div className="grid gap-1.5">
                <Label htmlFor="c-desc" className="font-bold text-[#4a3b28]">Descripción (opcional)</Label>
                <Textarea
                  id="c-desc"
                  value={editing.description}
                  onChange={(e) => setEditing({ ...editing, description: e.target.value })}
                  className="min-h-[56px] resize-none border-[#f0dfc0]"
                />
              </div>

              <div className="grid gap-1.5">
                <p className="text-sm font-bold text-[#4a3b28]">Productos del combo</p>
                {editing.items.length === 0 && (
                  <p className="text-xs text-[#8a7350]">Añade al menos 2 productos.</p>
                )}
                <ul className="grid gap-1.5">
                  {editing.items.map((it) => {
                    const p = data.products.find((x) => x.id === it.productId);
                    return (
                      <li key={it.productId} className="flex items-center gap-2 rounded-xl bg-white px-3 py-2 ring-1 ring-[#f0dfc0]">
                        <span className="min-w-0 flex-1 truncate text-sm font-semibold text-[#4a3b28]">
                          {p ? `${p.emoji} ${p.name}` : "Producto borrado"}
                          {p && (
                            <span className="ml-1 text-xs text-[#a58a5f]">
                              {money(currency, p.price)}
                            </span>
                          )}
                        </span>
                        <button type="button" onClick={() => setItemQty(it.productId, it.qty - 1)} className="grid size-7 place-items-center rounded-full bg-[#fdf3e0] text-[#c2542f]" aria-label="Menos">
                          <Minus className="size-3.5" />
                        </button>
                        <span className="w-5 text-center text-sm font-extrabold">{it.qty}</span>
                        <button type="button" onClick={() => setItemQty(it.productId, it.qty + 1)} className="grid size-7 place-items-center rounded-full bg-[#fdf3e0] text-[#c2542f]" aria-label="Más">
                          <Plus className="size-3.5" />
                        </button>
                      </li>
                    );
                  })}
                </ul>
                <select
                  value={pick}
                  onChange={(e) => addItem(e.target.value)}
                  className="h-10 rounded-md border border-[#f0dfc0] bg-white px-3 text-sm text-[#4a3b28]"
                  aria-label="Añadir producto al combo"
                >
                  <option value="">＋ Añadir producto…</option>
                  {data.categories.map((cat) => (
                    <optgroup key={cat.id} label={`${cat.emoji} ${cat.name}`}>
                      {data.products
                        .filter((p) => p.category === cat.id)
                        .map((p) => (
                          <option key={p.id} value={p.id}>
                            {p.name} · {money(currency, p.price)}
                          </option>
                        ))}
                    </optgroup>
                  ))}
                </select>
              </div>

              <div className="grid grid-cols-2 gap-2 rounded-2xl bg-[#fdf8ec] p-3">
                <div>
                  <p className="text-xs font-semibold text-[#8a7350]">Por separado</p>
                  <p className="font-display text-lg text-[#8a7350]">{money(currency, editingRegular)}</p>
                </div>
                <div className="grid gap-1">
                  <Label htmlFor="c-price" className="text-xs font-semibold text-[#8a7350]">Precio del combo</Label>
                  <Input
                    id="c-price"
                    type="number"
                    inputMode="numeric"
                    min={0}
                    value={editing.price || ""}
                    onChange={(e) => setEditing({ ...editing, price: Math.max(0, Number(e.target.value) || 0) })}
                    className="h-9 border-[#f0dfc0] font-bold"
                  />
                </div>
                {editingRegular > 0 && editing.price > 0 && (
                  <p className="col-span-2 text-xs font-bold text-[#3f9e5f]">
                    {editing.price < editingRegular
                      ? `El cliente ahorra ${money(currency, editingRegular - editing.price)} (${Math.round(((editingRegular - editing.price) / editingRegular) * 100)}%)`
                      : "⚠️ El combo no es más barato que por separado"}
                  </p>
                )}
              </div>
              <label className="flex items-center justify-between rounded-2xl bg-white px-3 py-2.5 ring-1 ring-[#f0dfc0]">
                <span className="text-sm font-bold text-[#4a3b28]">Mostrar en la carta</span>
                <Switch
                  checked={editing.active}
                  onCheckedChange={(v) => setEditing({ ...editing, active: v })}
                />
              </label>
            </div>
          )}
          <DialogFooter className="gap-2">
            <Button type="button" variant="outline" onClick={() => setEditing(null)} className="rounded-2xl border-[#f0dfc0]">
              Cancelar
            </Button>
            <Button type="button" onClick={save} className="rounded-2xl bg-[#e2574c] font-extrabold text-white hover:bg-[#d34a40]">
              Guardar combo
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      <AlertDialog open={!!confirmDelete} onOpenChange={(v) => !v && setConfirmDelete(null)}>
        <AlertDialogContent className="rounded-3xl border-[#f0dfc0] bg-[#fffcf4]">
          <AlertDialogHeader>
            <AlertDialogTitle className="font-display text-xl text-[#c2542f]">
              ¿Borrar «{confirmDelete?.name}»?
            </AlertDialogTitle>
            <AlertDialogDescription>
              Si solo quieres esconderlo un tiempo, usa el interruptor.
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel className="border-[#f0dfc0]">Cancelar</AlertDialogCancel>
            <AlertDialogAction
              onClick={() => {
                if (confirmDelete) deleteCombo(confirmDelete.id);
                toast.success("Combo borrado");
              }}
              className="bg-[#e2574c] text-white hover:bg-[#d34a40]"
            >
              Sí, borrar
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </div>
  );
}
