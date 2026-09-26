"use client";

import { useMemo, useRef, useState } from "react";
import { CloudUpload, Copy, Download, ExternalLink, ImagePlus, Trash2 } from "lucide-react";
import { toast } from "sonner";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { useMenuStore } from "@/lib/store";
import {
  getGhToken,
  putFileToGitHub,
  setGhToken,
  uploadPhotoToGitHub,
} from "@/lib/gh";
import type { GalleryItem } from "@/lib/types";
import { DEFAULT_GALLERY } from "@/components/menu/gallery-data";

/* ------------------------------------------------------------------ */
/*  Publicar: sincroniza el menú con GitHub (menu.json) + fotos del    */
/*  local reales subidas al repositorio (visibles para todos).         */
/* ------------------------------------------------------------------ */

export function TabPublicar() {
  const data = useMenuStore((s) => s.data);
  const github = useMenuStore((s) => s.data.github);
  const saveGitHub = useMenuStore((s) => s.saveGitHub);
  const setGallery = useMenuStore((s) => s.setGallery);

  const [owner, setOwner] = useState(github.owner);
  const [repo, setRepo] = useState(github.repo);
  const [branch, setBranch] = useState(github.branch || "main");
  const [path, setPath] = useState(github.path || "public/data/menu.json");
  const [token, setToken] = useState("");
  const [publishing, setPublishing] = useState(false);

  /* ---- Galería del local ---- */
  const [items, setItems] = useState<GalleryItem[]>(
    data.settings.gallery?.length ? data.settings.gallery : DEFAULT_GALLERY
  );
  const [galleryDirty, setGalleryDirty] = useState(false);
  const [localBusy, setLocalBusy] = useState(0);
  const localInputRef = useRef<HTMLInputElement>(null);

  const persistGallery = (list: GalleryItem[]) => {
    setGallery(list);
    setGalleryDirty(false);
    toast.success("Galería guardada en la carta", {
      description:
        "Pulsa «Publicar menú ahora» para que todos la vean desde GitHub.",
    });
  };

  const onPickLocalPhotos = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const files = Array.from(e.target.files ?? []);
    e.target.value = "";
    if (!files.length) return;
    const t = token.trim() || getGhToken();
    if (!t) {
      toast.error("Pega tu token de GitHub arriba para subir fotos");
      return;
    }
    if (!owner.trim() || !repo.trim()) {
      toast.error(
        "Completa el dueño y el repositorio para guardar las fotos"
      );
      return;
    }
    let list = [...items];
    let okCount = 0;
    for (let i = 0; i < files.length; i += 1) {
      const file = files[i];
      if (!file.type.startsWith("image/")) continue;
      setLocalBusy(i + 1);
      const res = await uploadPhotoToGitHub({
        cfg: {
          owner: owner.trim(),
          repo: repo.trim(),
          branch: branch.trim() || "main",
        },
        token: t,
        file,
        folder: "local",
        slug: file.name.replace(/\.[^.]+$/, ""),
      });
      if (res.ok && res.path) {
        okCount += 1;
        list = [
          ...list,
          {
            src: res.path,
            caption:
              file.name
                .replace(/\.[^.]+$/, "")
                .slice(0, 40) || "Nuestro shack",
            alt: "Foto real del local",
          },
        ];
      } else {
        toast.error(res.error ?? `No se pudo subir ${file.name}`);
      }
    }
    setLocalBusy(0);
    if (okCount > 0) {
      setItems(list);
      setGallery(list);
      setGalleryDirty(false);
      toast.success(
        okCount === 1
          ? "¡Foto del local subida a GitHub! 📸"
          : `¡${okCount} fotos del local subidas a GitHub! 📸`,
        {
          description:
            "Pulsa «Publicar menú ahora» para que todos la vean en la carta.",
        }
      );
    }
  };

  const removeGalleryItem = (i: number) => {
    const list = items.filter((_, idx) => idx !== i);
    setItems(list);
    setGalleryDirty(true);
  };

  const json = useMemo(() => JSON.stringify(data, null, 2), [data]);
  const lastUpdated = useMemo(
    () => new Date(data.updatedAt).toLocaleString("es-CU"),
    [data.updatedAt]
  );

  const saveCreds = () => {
    saveGitHub({ owner: owner.trim(), repo: repo.trim(), branch: branch.trim(), path: path.trim() });
    setGhToken(token);
    toast.success("Cambios locales guardados");
  };

  const publish = async () => {
    if (!owner.trim() || !repo.trim()) {
      toast.error("Completa el dueño (usuario) y el repositorio");
      return;
    }
    const t = token.trim() || getGhToken();
    if (!t) {
      toast.error("Pega tu token de acceso personal de GitHub");
      return;
    }
    setPublishing(true);
    saveGitHub({ owner: owner.trim(), repo: repo.trim(), branch: branch.trim(), path: path.trim() });
    const res = await putFileToGitHub(
      { owner: owner.trim(), repo: repo.trim(), branch: branch.trim(), path: path.trim() },
      t,
      json,
      `chore: actualizar carta (${new Date().toISOString()})`
    );
    setPublishing(false);
    if (res.ok) {
      toast.success("¡Publicado en GitHub! 🚀", {
        description: "Los dispositivos leerán el menú actualizado en 1-2 min.",
      });
    } else {
      toast.error(res.error ?? "Error inesperado al publicar");
    }
  };

  const download = () => {
    const blob = new Blob([json], { type: "application/json" });
    const url = URL.createObjectURL(blob);
    const a = document.createElement("a");
    a.href = url;
    a.download = "menu.json";
    a.click();
    URL.revokeObjectURL(url);
  };

  const copy = async () => {
    try {
      await navigator.clipboard.writeText(json);
      toast.success("JSON copiado al portapapeles");
    } catch {
      toast.error("No se pudo copiar en este navegador");
    }
  };

  return (
    <div className="grid gap-4">
      <section className="rounded-3xl border border-[#e8dcc0] bg-white p-5 shadow-sm">
        <h2 className="font-display text-xl text-[#c2542f]">
          Publicar la carta en GitHub
        </h2>
        <p className="mt-1 text-sm text-[#8a7350]">
          Sube el proyecto a un repositorio (el archivo{" "}
          <code className="rounded bg-[#fdf3e0] px-1 font-bold text-[#c2542f]">public/data/menu.json</code>{" "}
          se actualiza) y activa GitHub Pages. En el repo:{" "}
          <strong>Settings → Pages → Source: GitHub Actions</strong>. Haz un push
          para publicar. El token necesita permiso{" "}
          <strong>Contents: Read and write</strong>.
        </p>
        <p className="mt-2 text-xs text-[#a58a5f]">
          RECOMENDADO · Actualizado: {lastUpdated}. Los cambios del panel viven
          en este dispositivo hasta que publiques.
        </p>

        <div className="mt-3 grid gap-2.5 sm:grid-cols-2">
          <div className="grid gap-1.5">
            <Label htmlFor="gh-owner" className="font-bold text-[#4a3b28]">
              Usuario/Org (owner)
            </Label>
            <Input
              id="gh-owner"
              value={owner}
              onChange={(e) => setOwner(e.target.value)}
              placeholder="mi-usuario"
              className="border-[#f0dfc0] focus-visible:ring-[#e2574c]"
            />
          </div>
          <div className="grid gap-1.5">
            <Label htmlFor="gh-repo" className="font-bold text-[#4a3b28]">
              Repositorio
            </Label>
            <Input
              id="gh-repo"
              value={repo}
              onChange={(e) => setRepo(e.target.value)}
              placeholder="mi-carta"
              className="border-[#f0dfc0] focus-visible:ring-[#e2574c]"
            />
          </div>
          <div className="grid gap-1.5">
            <Label htmlFor="gh-branch" className="font-bold text-[#4a3b28]">
              Rama
            </Label>
            <Input
              id="gh-branch"
              value={branch}
              onChange={(e) => setBranch(e.target.value)}
              placeholder="main"
              className="border-[#f0dfc0] focus-visible:ring-[#e2574c]"
            />
          </div>
          <div className="grid gap-1.5">
            <Label htmlFor="gh-path" className="font-bold text-[#4a3b28]">
              Archivo destino
            </Label>
            <Input
              id="gh-path"
              value={path}
              onChange={(e) => setPath(e.target.value)}
              className="border-[#f0dfc0] focus-visible:ring-[#e2574c]"
            />
          </div>
          <div className="grid gap-1.5 sm:col-span-2">
            <Label htmlFor="gh-token" className="font-bold text-[#4a3b28]">
              Token de acceso personal (solo se guarda en este navegador)
            </Label>
            <Input
              id="gh-token"
              type="password"
              value={token}
              onChange={(e) => setToken(e.target.value)}
              placeholder="ghp_..."
              className="border-[#f0dfc0] focus-visible:ring-[#e2574c]"
            />
          </div>
        </div>

        <div className="mt-3 flex flex-wrap gap-2">
          <Button
            type="button"
            onClick={() => void publish()}
            disabled={publishing}
            className="rounded-2xl bg-[#e2574c] font-extrabold text-white hover:bg-[#d34a40]"
          >
            <CloudUpload className="size-4" aria-hidden="true" />
            {publishing ? "Publicando..." : "Publicar menú ahora"}
          </Button>
          <Button
            type="button"
            variant="outline"
            onClick={saveCreds}
            className="rounded-2xl border-[#f0dfc0] font-bold text-[#c2542f] hover:bg-[#fdf3e0]"
          >
            Guardar datos
          </Button>
        </div>
      </section>

      {/* Copia manual */}
      <section className="rounded-3xl border border-[#e8dcc0] bg-white p-5 shadow-sm">
        <h3 className="font-display text-lg text-[#c2542f]">
          ¿Prefieres hacerlo a mano?
        </h3>
        <p className="mt-1 text-sm text-[#8a7350]">
          Descarga el archivo y reemplaza <code className="rounded bg-[#fdf3e0] px-1">public/data/menu.json</code>{" "}
          en tu repositorio y haz push.
        </p>
        <div className="mt-2.5 flex flex-wrap gap-2">
          <Button
            type="button"
            variant="outline"
            onClick={download}
            className="rounded-full border-[#f0dfc0] font-bold text-[#c2542f] hover:bg-[#fdf3e0]"
          >
            <Download className="size-4" aria-hidden="true" />
            Descargar menu.json
          </Button>
          <Button
            type="button"
            variant="outline"
            onClick={() => void copy()}
            className="rounded-full border-[#f0dfc0] font-bold text-[#c2542f] hover:bg-[#fdf3e0]"
          >
            <Copy className="size-4" aria-hidden="true" />
            Copiar JSON
          </Button>
          <a
            href="https://github.com/new"
            target="_blank"
            rel="noreferrer"
            className="inline-flex items-center gap-1.5 rounded-full px-3 py-2 text-xs font-bold text-[#e2574c] transition hover:bg-[#fdf3e0]"
          >
            Crear repo <ExternalLink className="size-3" aria-hidden="true" />
          </a>
        </div>
      </section>

      {/* Fotos del local: subida real al repositorio */}
      <section className="rounded-3xl border border-[#e8dcc0] bg-white p-5 shadow-sm">
        <h3 className="font-display text-lg text-[#c2542f]">
          Fotos del local 📸 (las que ven los clientes)
        </h3>
        <p className="mt-1 text-sm text-[#8a7350]">
          Sube fotos reales del shack: aparecen en la sección «Así se vive el
          shack» para todo el que entre a la carta. Se guardan en tu repositorio
          (carpeta <code className="rounded bg-[#fdf3e0] px-1">public/images/local/</code>)
          y viajan dentro del menú al publicar.
        </p>
        <input
          ref={localInputRef}
          type="file"
          accept="image/*"
          multiple
          className="hidden"
          onChange={(e) => void onPickLocalPhotos(e)}
        />
        <div className="mt-3 flex flex-wrap gap-2">
          <Button
            type="button"
            variant="outline"
            onClick={() => localInputRef.current?.click()}
            disabled={localBusy > 0}
            className="rounded-2xl border-[#f0dfc0] font-bold text-[#c2542f] hover:bg-[#fdf3e0]"
          >
            <ImagePlus className="size-4" aria-hidden="true" />
            {localBusy > 0
              ? `Subiendo foto ${localBusy}...`
              : "Subir fotos del local"}
          </Button>
          {galleryDirty && (
            <Button
              type="button"
              onClick={() => persistGallery(items)}
              className="rounded-2xl bg-[#e2574c] font-extrabold text-white hover:bg-[#d34a40]"
            >
              Guardar cambios de la galería
            </Button>
          )}
        </div>

        <ul className="mt-4 grid gap-2.5">
          {items.map((g, i) => (
            <li key={`${g.src}-${i}`} className="flex items-center gap-2.5">
              <img
                src={g.src}
                alt={g.alt}
                className="size-14 shrink-0 rounded-xl object-cover ring-1 ring-[#f0dfc0]"
              />
              <Input
                value={g.caption}
                onChange={(e) => {
                  const list = [...items];
                  list[i] = { ...g, caption: e.target.value };
                  setItems(list);
                  setGalleryDirty(true);
                }}
                placeholder="Leyenda de la foto"
                aria-label={`Leyenda de la foto ${i + 1}`}
                className="border-[#f0dfc0] focus-visible:ring-[#e2574c]"
              />
              <button
                type="button"
                onClick={() => removeGalleryItem(i)}
                aria-label={`Quitar foto ${i + 1}`}
                className="grid size-9 shrink-0 place-items-center rounded-full text-[#b3562e] transition hover:bg-[#fdeae7]"
              >
                <Trash2 className="size-4" aria-hidden="true" />
              </button>
            </li>
          ))}
        </ul>
        <p className="mt-2 text-xs text-[#a58a5f]">
          Consejo: fotos horizontales lucen mejor. Se comprimen solas antes de
          viajar a GitHub.
        </p>
      </section>
    </div>
  );
}
