"use client";

import { useMemo, useState } from "react";
import { CloudUpload, Copy, Download, ExternalLink } from "lucide-react";
import { toast } from "sonner";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { useMenuStore } from "@/lib/store";

/* ------------------------------------------------------------------ */
/*  Publicar: sincroniza el menú con GitHub (menu.json)                */
/* ------------------------------------------------------------------ */

const GH_TOKEN_KEY = "aol-gh-token";

async function putFileToGitHub(
  cfg: { owner: string; repo: string; branch: string; path: string },
  token: string,
  contentJson: string,
  message: string
): Promise<{ ok: boolean; commitUrl?: string; error?: string }> {
  const API = "https://api.github.com";
  const headers = {
    Authorization: `Bearer ${token}`,
    Accept: "application/vnd.github+json",
    "Content-Type": "application/json",
  };
  const filePath = (cfg.path || "public/data/menu.json").replace(/^\/+/, "");
  const base = `${API}/repos/${cfg.owner}/${cfg.repo}/contents/${filePath}`;
  try {
    // 1) Obtener el SHA actual del archivo (si existe)
    let sha: string | undefined;
    const res = await fetch(`${base}?ref=${encodeURIComponent(cfg.branch)}`, {
      headers,
      cache: "no-store",
    });
    if (res.ok) {
      const json = await res.json();
      sha = json.sha;
    } else if (res.status !== 404) {
      return {
        ok: false,
        error: `No se pudo leer el archivo (${res.status}). Revisa owner/repo/rama y el permiso del token.`,
      };
    }
    // 2) Crear el commit con el nuevo contenido
    const content = btoa(
      new TextEncoder()
        .encode(contentJson)
        .reduce((acc, b) => acc + String.fromCharCode(b), "")
    );
    const put = await fetch(base, {
      method: "PUT",
      headers,
      body: JSON.stringify({
        message,
        content,
        branch: cfg.branch,
        ...(sha ? { sha } : {}),
      }),
    });
    if (!put.ok) {
      const body = await put.json().catch(() => ({}));
      if (put.status === 401) return { ok: false, error: "Token inválido o expirado (401)." };
      if (put.status === 403)
        return { ok: false, error: "El token no tiene permiso de escritura (403)." };
      if (put.status === 404)
        return { ok: false, error: "Repositorio o rama no encontrada (404)." };
      return {
        ok: false,
        error: (body as { message?: string }).message ?? `Error de GitHub (${put.status})`,
      };
    }
    const json = await put.json();
    return {
      ok: true,
      commitUrl:
        json.commit?.html_url ?? json.content?.html_url ?? "https://github.com",
    };
  } catch (err) {
    if (err instanceof TypeError)
      return { ok: false, error: "Sin conexión con GitHub. Verifica tu internet." };
    return { ok: false, error: "Error inesperado al publicar" };
  }
}

export function TabPublicar() {
  const data = useMenuStore((s) => s.data);
  const github = useMenuStore((s) => s.data.github);
  const saveGitHub = useMenuStore((s) => s.saveGitHub);

  const [owner, setOwner] = useState(github.owner);
  const [repo, setRepo] = useState(github.repo);
  const [branch, setBranch] = useState(github.branch || "main");
  const [path, setPath] = useState(github.path || "public/data/menu.json");
  const [token, setToken] = useState("");
  const [publishing, setPublishing] = useState(false);

  const json = useMemo(() => JSON.stringify(data, null, 2), [data]);
  const lastUpdated = useMemo(
    () => new Date(data.updatedAt).toLocaleString("es-CU"),
    [data.updatedAt]
  );

  const saveCreds = () => {
    saveGitHub({ owner: owner.trim(), repo: repo.trim(), branch: branch.trim(), path: path.trim() });
    try {
      if (token.trim()) localStorage.setItem(GH_TOKEN_KEY, token.trim());
    } catch {
      /* noop */
    }
    toast.success("Cambios locales guardados");
  };

  const publish = async () => {
    if (!owner.trim() || !repo.trim()) {
      toast.error("Completa el dueño (usuario) y el repositorio");
      return;
    }
    const t = token.trim() || (() => {
      try {
        return localStorage.getItem(GH_TOKEN_KEY) ?? "";
      } catch {
        return "";
      }
    })();
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
    </div>
  );
}
