"use client";

import { useMemo, useRef, useState } from "react";
import { Camera, ImagePlus, Pencil, Plus } from "lucide-react";
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
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { Switch } from "@/components/ui/switch";
import { Textarea } from "@/components/ui/textarea";
import { money, uid, useMenuStore } from "@/lib/store";
import { getGhToken, uploadPhotoToGitHub } from "@/lib/gh";
import type { Product } from "@/lib/types";

/* ------------------------------------------------------------------ */
/*  Productos: alta, edición, disponibilidad y baja                    */
/* ------------------------------------------------------------------ */

const EMPTY: Product = {
  id: "",
  name: "",
  description: "",
  price: 0,
  category: "",
  image: "",
  emoji: "🍔",
  tags: [],
  available: true,
  featured: false,
  ingredients: [],
};

export function TabProductos() {
  const data = useMenuStore((s) => s.data);
  const saveProduct = useMenuStore((s) => s.saveProduct);
  const deleteProduct = useMenuStore((s) => s.deleteProduct);

  const [editing, setEditing] = useState<Product | null>(null);
  const [tagsText, setTagsText] = useState("");
  const [ingredientsText, setIngredientsText] = useState("");
  const [confirmDelete, setConfirmDelete] = useState<Product | null>(null);

  /* ---- Subida de fotos reales a GitHub ---- */
  const fileRef = useRef<HTMLInputElement>(null);
  const pickFor = useRef<{ id: string; name: string; inDialog: boolean } | null>(null);
  const [photoBusy, setPhotoBusy] = useState(false);

  const requestPhoto = (id: string, name: string, inDialog: boolean) => {
    pickFor.current = { id, name, inDialog };
    fileRef.current?.click();
  };

  const onPickPhoto = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    e.target.value = "";
    const t = pickFor.current;
    pickFor.current = null;
    if (!file || !t) return;
    if (!file.type.startsWith("image/")) {
      toast.error("Ese archivo no es una foto");
      return;
    }
    const token = getGhToken();
    if (!token) {
      toast.error("Falta el token de GitHub", {
        description: "Pégalo en la pestaña «Publicar» para poder subir fotos.",
      });
      return;
    }
    setPhotoBusy(true);
    const res = await uploadPhotoToGitHub({
      cfg: {
        owner: data.github.owner,
        repo: data.github.repo,
        branch: data.github.branch || "main",
      },
      token,
      file,
      folder: "products",
      slug: t.name,
    });
    setPhotoBusy(false);
    if (res.ok && res.path) {
      if (t.inDialog && editing) {
        setEditing({ ...editing, image: res.path });
      } else {
        const p = data.products.find((x) => x.id === t.id);
        if (p) saveProduct({ ...p, image: res.path });
      }
      toast.success("¡Foto subida a GitHub! 📸", {
        description:
          "Publica la carta (pestaña Publicar) para que todos la vean.",
      });
    } else {
      toast.error(res.error ?? "No se pudo subir la foto");
    }
  };

  const catName = useMemo(() => {
    const m = new Map(data.categories.map((c) => [c.id, c]));
    return (id: string) => m.get(id)?.name ?? id;
  }, [data.categories]);

  const openNew = () => {
    setEditing({
      ...EMPTY,
      id: uid("p"),
      category: data.categories[0]?.id ?? "",
    });
    setTagsText("");
    setIngredientsText("");
  };

  const openEdit = (p: Product) => {
    setEditing({ ...p });
    setTagsText(p.tags.join(", "));
    setIngredientsText(p.ingredients.join(", "));
  };

  const save = () => {
    if (!editing) return;
    if (!editing.name.trim()) {
      toast.error("El producto necesita un nombre");
      return;
    }
    if (!editing.price || editing.price <= 0) {
      toast.error("El precio debe ser mayor a 0");
      return;
    }
    const clean: Product = {
      ...editing,
      name: editing.name.trim().slice(0, 60),
      description: editing.description.trim().slice(0, 200),
      tags: tagsText
        .split(",")
        .map((t) => t.trim())
        .filter(Boolean)
        .slice(0, 3),
      ingredients: ingredientsText
        .split(",")
        .map((t) => t.trim())
        .filter(Boolean)
        .slice(0, 12),
    };
    const isNew = !data.products.some((p) => p.id === clean.id);
    saveProduct(clean);
    toast.success(isNew ? "Producto creado 🎉" : "Producto actualizado");
    setEditing(null);
  };

  return (
    <div className="grid gap-3">
      {/* Input oculto compartido para subir fotos de productos */}
      <input
        ref={fileRef}
        type="file"
        accept="image/*"
        className="hidden"
        onChange={(e) => void onPickPhoto(e)}
      />
      <div className="flex items-center justify-between gap-3">
        <p className="text-sm text-[#8a7350]">
          Los cambios se aplican al menú en cuanto guardas. Usa el botón de
          foto 📷 para subir fotos reales a GitHub.
        </p>
        <Button
          type="button"
          onClick={openNew}
          className="shrink-0 rounded-2xl bg-[#e2574c] font-extrabold text-white hover:bg-[#d34a40]"
        >
          <Plus className="size-4" aria-hidden="true" />
          Nuevo producto 🍔
        </Button>
      </div>

      {data.categories
        .filter((c) => c.visible)
        .map((c) => {
          const items = data.products.filter((p) => p.category === c.id);
          if (!items.length) return null;
          return (
            <section
              key={c.id}
              className="overflow-hidden rounded-3xl border border-[#e8dcc0] bg-white shadow-sm"
            >
              <h3 className="border-b border-[#f0e6cc] bg-[#fdf8ec] px-4 py-2.5 text-sm font-black uppercase tracking-wide text-[#a58a5f]">
                {c.emoji} {c.name}
              </h3>
              <ul className="divide-y divide-[#f0e6cc]">
                {items.map((p) => (
                  <li key={p.id} className="flex items-center gap-3 px-4 py-3">
                    <span className="text-xl" aria-hidden="true">
                      {p.emoji}
                    </span>
                    <div className="min-w-0 flex-1">
                      <p className="flex items-center gap-1.5 truncate text-sm font-bold text-[#4a3b28]">
                        {p.name}
                        {p.featured && (
                          <span className="rounded-full bg-[#f2c230] px-1.5 py-0.5 text-[9px] font-black uppercase tracking-wider text-[#7a5410]">
                            DESTACADO
                          </span>
                        )}
                      </p>
                      <p className="text-xs text-[#8a7350]">
                        {money(data.settings.currency, p.price)} ·{" "}
                        {p.available ? "DISPONIBLE" : "AGOTADO"}
                      </p>
                    </div>
                    <Switch
                      checked={p.available}
                      onCheckedChange={(v) => saveProduct({ ...p, available: v })}
                      aria-label={`¿Hay ${p.name}?`}
                    />
                    <button
                      type="button"
                      onClick={() => requestPhoto(p.id, p.name, false)}
                      disabled={photoBusy}
                      className="grid size-9 place-items-center rounded-full text-[#8a7350] transition hover:bg-[#fdf3e0] hover:text-[#c2542f] disabled:opacity-50"
                      aria-label={`Subir foto real de ${p.name}`}
                    >
                      <ImagePlus className="size-4" />
                    </button>
                    <button
                      type="button"
                      onClick={() => openEdit(p)}
                      className="grid size-9 place-items-center rounded-full text-[#8a7350] transition hover:bg-[#fdf3e0] hover:text-[#c2542f]"
                      aria-label={`Editar ${p.name}`}
                    >
                      <Pencil className="size-4" />
                    </button>
                  </li>
                ))}
              </ul>
            </section>
          );
        })}

      {/* Diálogo de edición */}
      <Dialog open={!!editing} onOpenChange={(v) => !v && setEditing(null)}>
        <DialogContent className="max-h-[90dvh] max-w-lg overflow-y-auto rounded-3xl border-[#f0dfc0] bg-[#fffcf4]">
          <DialogHeader>
            <DialogTitle className="font-display text-xl text-[#c2542f]">
              {editing && data.products.some((p) => p.id === editing.id)
                ? "Editar producto"
                : "Nuevo producto"}
            </DialogTitle>
            <DialogDescription>
              Los cambios se aplican al menú en cuanto guardas.
            </DialogDescription>
          </DialogHeader>

          {editing && (
            <div className="grid gap-3.5">
              <div className="grid gap-1.5">
                <Label htmlFor="p-name" className="font-bold text-[#4a3b28]">
                  Nombre
                </Label>
                <Input
                  id="p-name"
                  value={editing.name}
                  onChange={(e) => setEditing({ ...editing, name: e.target.value })}
                  placeholder="Ej: Costera Smash Doble"
                  className="border-[#f0dfc0] focus-visible:ring-[#e2574c]"
                />
              </div>
              <div className="grid gap-1.5">
                <Label htmlFor="p-desc" className="font-bold text-[#4a3b28]">
                  Descripción
                </Label>
                <Textarea
                  id="p-desc"
                  value={editing.description}
                  onChange={(e) =>
                    setEditing({ ...editing, description: e.target.value })
                  }
                  placeholder="Ingredientes jugosos..."
                  className="min-h-[64px] resize-none border-[#f0dfc0] focus-visible:ring-[#e2574c]"
                />
              </div>
              <div className="grid gap-1.5">
                <Label
                  htmlFor="p-layers"
                  className="font-bold text-[#4a3b28]"
                >
                  Capas de la vista explotada (de arriba hacia abajo; el pan base
                  va al final)
                </Label>
                <Input
                  id="p-layers"
                  value={ingredientsText}
                  onChange={(e) => setIngredientsText(e.target.value)}
                  placeholder="Ej: Pan de papa, Carne de res, Vegetales, Ketchup, Mostaza"
                  className="border-[#f0dfc0] focus-visible:ring-[#e2574c]"
                />
              </div>
              <div className="grid grid-cols-2 gap-3">
                <div className="grid gap-1.5">
                  <Label htmlFor="p-price" className="font-bold text-[#4a3b28]">
                    Precio
                  </Label>
                  <Input
                    id="p-price"
                    type="number"
                    min={1}
                    value={editing.price || ""}
                    onChange={(e) =>
                      setEditing({ ...editing, price: Number(e.target.value) || 0 })
                    }
                    className="border-[#f0dfc0] focus-visible:ring-[#e2574c]"
                  />
                </div>
                <div className="grid gap-1.5">
                  <Label className="font-bold text-[#4a3b28]">Categoría</Label>
                  <Select
                    value={editing.category}
                    onValueChange={(v) => setEditing({ ...editing, category: v })}
                  >
                    <SelectTrigger className="border-[#f0dfc0] focus:ring-[#e2574c]">
                      <SelectValue placeholder="Elegir" />
                    </SelectTrigger>
                    <SelectContent>
                      {data.categories.map((c) => (
                        <SelectItem key={c.id} value={c.id}>
                          {c.emoji} {c.name}
                        </SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                </div>
              </div>
              <div className="grid gap-1.5">
                <Label htmlFor="p-tags" className="font-bold text-[#4a3b28]">
                  Etiquetas (separadas por coma, máx 3)
                </Label>
                <Input
                  id="p-tags"
                  value={tagsText}
                  onChange={(e) => setTagsText(e.target.value)}
                  placeholder="Ej: Doble carne, Crujiente"
                  className="border-[#f0dfc0] focus-visible:ring-[#e2574c]"
                />
              </div>
              <div className="grid gap-1.5">
                <Label htmlFor="p-img" className="font-bold text-[#4a3b28]">
                  Foto del producto (opcional)
                </Label>
                <div className="flex items-center gap-2">
                  {editing.image ? (
                    <img
                      src={editing.image}
                      alt="Foto actual"
                      className="size-12 shrink-0 rounded-xl object-cover ring-1 ring-[#f0dfc0]"
                    />
                  ) : null}
                  <Input
                    id="p-img"
                    value={editing.image ?? ""}
                    onChange={(e) => setEditing({ ...editing, image: e.target.value })}
                    placeholder="/images/products/....jpg · vacío = emoji"
                    className="border-[#f0dfc0] focus-visible:ring-[#e2574c]"
                  />
                </div>
                <Button
                  type="button"
                  variant="outline"
                  onClick={() => requestPhoto(editing.id, editing.name, true)}
                  disabled={photoBusy}
                  className="mt-1 rounded-full border-[#f0dfc0] font-bold text-[#c2542f] hover:bg-[#fdf3e0]"
                >
                  <Camera className="size-4" aria-hidden="true" />
                  {photoBusy ? "Subiendo foto..." : "Subir foto real (cámara o galería)"}
                </Button>
                <p className="text-xs text-[#a58a5f]">
                  La foto se guarda en tu repositorio de GitHub y queda en la
                  carta para todos. Después pulsa «Publicar menú ahora» en la
                  pestaña Publicar.
                </p>
              </div>
              <div className="flex items-center justify-between rounded-2xl bg-[#fdf8ec] px-4 py-3">
                <span className="text-sm font-bold text-[#4a3b28]">Destacar</span>
                <Switch
                  checked={editing.featured}
                  onCheckedChange={(v) => setEditing({ ...editing, featured: v })}
                  aria-label="Producto destacado"
                />
              </div>
              <div className="flex items-center justify-between rounded-2xl bg-[#fdf8ec] px-4 py-3">
                <span className="text-sm font-bold text-[#4a3b28]">Disponible</span>
                <Switch
                  checked={editing.available}
                  onCheckedChange={(v) => setEditing({ ...editing, available: v })}
                  aria-label="Producto disponible"
                />
              </div>
            </div>
          )}

          <DialogFooter className="gap-2 sm:justify-between">
            {editing && data.products.some((p) => p.id === editing.id) ? (
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
                Guardar producto
              </Button>
            </div>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      {/* Confirmar borrado */}
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
                  deleteProduct(confirmDelete.id);
                  toast.success("Producto eliminado");
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
