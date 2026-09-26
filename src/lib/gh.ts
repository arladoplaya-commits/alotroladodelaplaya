"use client";

/* ------------------------------------------------------------------ */
/*  Puente con GitHub (Contents API):                                  */
/*  · Publicar menu.json (ya existía en el panel)                      */
/*  · Subir fotos reales de productos y del local, comprimidas         */
/*    en el navegador para que pesen poco y queden guardadas en el     */
/*    repositorio (visibles para todo el que entra a la carta).        */
/* ------------------------------------------------------------------ */

export const GH_TOKEN_KEY = "aol-gh-token";

export interface GhCfg {
  owner: string;
  repo: string;
  branch: string;
}

const API = "https://api.github.com";

function ghHeaders(token: string) {
  return {
    Authorization: `Bearer ${token}`,
    Accept: "application/vnd.github+json",
    "Content-Type": "application/json",
  };
}

function toBase64(bytes: Uint8Array): string {
  let bin = "";
  for (const b of bytes) bin += String.fromCharCode(b);
  return btoa(bin);
}

/** PUT genérico de un archivo (texto) al repo */
export async function putFileToGitHub(
  cfg: GhCfg & { path: string },
  token: string,
  contentJson: string,
  message: string
): Promise<{ ok: boolean; commitUrl?: string; error?: string }> {
  const headers = ghHeaders(token);
  const filePath = (cfg.path || "public/data/menu.json").replace(/^\/+/, "");
  const base = `${API}/repos/${cfg.owner}/${cfg.repo}/contents/${filePath}`;
  try {
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
    const content = toBase64(new TextEncoder().encode(contentJson));
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
      if (put.status === 401)
        return { ok: false, error: "Token inválido o expirado (401)." };
      if (put.status === 403)
        return { ok: false, error: "El token no tiene permiso de escritura (403)." };
      if (put.status === 404)
        return { ok: false, error: "Repositorio o rama no encontrada (404)." };
      return {
        ok: false,
        error:
          (body as { message?: string }).message ??
          `Error de GitHub (${put.status})`,
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
      return {
        ok: false,
        error: "Sin conexión con GitHub. Verifica tu internet.",
      };
    return { ok: false, error: "Error inesperado al publicar" };
  }
}

/** Reduce la foto en el navegador (máx ~900px, JPEG 0.82) para que pese poco */
export async function compressImage(
  file: File,
  maxSize = 900,
  quality = 0.82
): Promise<{ bytes: Uint8Array; type: string }> {
  const bitmap = await createImageBitmap(file);
  const scale = Math.min(1, maxSize / Math.max(bitmap.width, bitmap.height));
  const w = Math.max(1, Math.round(bitmap.width * scale));
  const h = Math.max(1, Math.round(bitmap.height * scale));
  const canvas = document.createElement("canvas");
  canvas.width = w;
  canvas.height = h;
  const ctx = canvas.getContext("2d");
  if (!ctx) throw new Error("no-canvas");
  ctx.drawImage(bitmap, 0, 0, w, h);
  bitmap.close?.();
  const blob: Blob | null = await new Promise((resolve) =>
    canvas.toBlob((b) => resolve(b), "image/jpeg", quality)
  );
  if (!blob) throw new Error("no-blob");
  const buf = new Uint8Array(await blob.arrayBuffer());
  return { bytes: buf, type: "image/jpeg" };
}

export interface PhotoUploadResult {
  ok: boolean;
  path?: string;
  error?: string;
}

/**
 * Sube una foto real al repositorio:
 *  - carpeta destino: public/images/<folder>/
 *  - devuelve la ruta pública lista para usar en la carta
 */
export async function uploadPhotoToGitHub(opts: {
  cfg: GhCfg;
  token: string;
  file: File;
  folder: "products" | "local";
  slug: string;
}): Promise<PhotoUploadResult> {
  const { cfg, token, file, folder, slug } = opts;
  if (!cfg.owner || !cfg.repo) {
    return {
      ok: false,
      error:
        "Primero configura el repositorio en la pestaña «Publicar» (dueño y repo).",
    };
  }
  const safeSlug =
    slug
      .toLowerCase()
      .normalize("NFD")
      .replace(/[\u0300-\u036f]/g, "")
      .replace(/[^a-z0-9]+/g, "-")
      .replace(/^-+|-+$/g, "")
      .slice(0, 40) || "foto";
  const stamp = Date.now().toString(36).slice(-5);
  const repoPath = `public/images/${folder}/${safeSlug}-${stamp}.jpg`;
  try {
    const { bytes } = await compressImage(file);
    const put = await fetch(
      `${API}/repos/${cfg.owner}/${cfg.repo}/contents/${repoPath}`,
      {
        method: "PUT",
        headers: ghHeaders(token),
        body: JSON.stringify({
          message: `foto: ${folder === "products" ? "producto" : "local"} ${safeSlug}`,
          content: toBase64(bytes),
          branch: cfg.branch,
        }),
      }
    );
    if (!put.ok) {
      const body = await put.json().catch(() => ({}));
      if (put.status === 401)
        return { ok: false, error: "Token inválido o expirado (401)." };
      if (put.status === 403)
        return { ok: false, error: "El token no tiene permiso de escritura (403)." };
      if (put.status === 404)
        return { ok: false, error: "Repositorio o rama no encontrada (404)." };
      return {
        ok: false,
        error:
          (body as { message?: string }).message ??
          `Error de GitHub (${put.status})`,
      };
    }
    return { ok: true, path: `/images/${folder}/${safeSlug}-${stamp}.jpg` };
  } catch (err) {
    if (err instanceof TypeError)
      return { ok: false, error: "Sin conexión con GitHub. Verifica tu internet." };
    return { ok: false, error: "No se pudo procesar la foto" };
  }
}

/** Token guardado en este navegador (lo pone la pestaña Publicar) */
export function getGhToken(): string {
  try {
    return localStorage.getItem(GH_TOKEN_KEY) ?? "";
  } catch {
    return "";
  }
}

export function setGhToken(token: string): void {
  try {
    if (token.trim()) localStorage.setItem(GH_TOKEN_KEY, token.trim());
    else localStorage.removeItem(GH_TOKEN_KEY);
  } catch {
    /* noop */
  }
}
