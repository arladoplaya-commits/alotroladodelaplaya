"use client";

import { useEffect, useState } from "react";
import {
  Database,
  ExternalLink,
  Eye,
  EyeOff,
  PlugZap,
  Trash2,
  WifiOff,
} from "lucide-react";
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
import { useMenuStore } from "@/lib/store";
import { useReviewsStore } from "@/lib/reviews";
import { SQL_SETUP, explain, isValidAnonKey, isValidSupaUrl, normalizeSupaUrl, sbAdminSetPass, sbTestConnection } from "@/lib/supabase";
import { useOrdersStore } from "@/lib/orders";

/* ------------------------------------------------------------------ */
/*  Reseñas: moderación + conexión Supabase + contraseña de la nube    */
/* ------------------------------------------------------------------ */

export function TabResenas() {
  const github = useMenuStore((s) => s.data.github);
  const reviews = useReviewsStore((s) => s.adminList);
  const adminStatus = useReviewsStore((s) => s.adminStatus);
  const config = useReviewsStore((s) => s.config);
  const loadAdmin = useReviewsStore((s) => s.loadAdmin);
  const setHidden = useReviewsStore((s) => s.setHidden);
  const adminDelete = useReviewsStore((s) => s.adminDelete);
  const connect = useReviewsStore((s) => s.connect);
  const disconnect = useReviewsStore((s) => s.disconnect);
  const publishConfigTo = useReviewsStore((s) => s.publishConfigTo);
  const refreshOrders = useOrdersStore((s) => s.loadAdmin);

  const [pass, setPass] = useState(
    () => useMenuStore.getState().data.settings.adminPassword
  );
  const [url, setUrl] = useState(() => config.url);
  const [anonKey, setAnonKey] = useState(() => config.anonKey);
  const [testing, setTesting] = useState(false);
  const [publishing, setPublishing] = useState(false);
  const [oldPass, setOldPass] = useState("");
  const [newPass, setNewPass] = useState("");
  const [confirmDelete, setConfirmDelete] = useState<string | null>(null);

  useEffect(() => {
    void loadAdmin(pass);
  }, []);

  const connected = config.provider === "supabase";

  const handleTest = async () => {
    if (!isValidSupaUrl(url)) {
      toast.error("La URL del proyecto no parece válida.");
      return;
    }
    if (!isValidAnonKey(anonKey)) {
      toast.error("La anon key parece incompleta. Cópiala completa (empieza por «eyJ»).");
      return;
    }
    setTesting(true);
    const res = await sbTestConnection({
      url: normalizeSupaUrl(url),
      anonKey: anonKey.trim(),
    });
    setTesting(false);
    if (res.ok) {
      toast.success("¡Conexión OK! Supabase responde 🌊");
    } else {
      toast.error("No se pudo conectar", {
        description: res.error,
      });
    }
  };

  const handleConnect = () => {
    if (!isValidSupaUrl(url)) {
      toast.error("La URL del proyecto no parece válida.");
      return;
    }
    if (!isValidAnonKey(anonKey)) {
      toast.error("La anon key parece incompleta. Cópiala completa (empieza por «eyJ»).");
      return;
    }
    connect({ provider: "supabase", url: normalizeSupaUrl(url), anonKey: anonKey.trim() });
    toast.success("Conectado en este dispositivo ✅", {
      description:
        "Ahora publica la config para que TODOS los dispositivos sincronicen.",
    });
  };

  const handlePublish = async () => {
    const token =
      (() => {
        try {
          return localStorage.getItem("aol-gh-token") ?? "";
        } catch {
          return "";
        }
      })() || "";
    if (!github.owner || !github.repo || !token) {
      toast.error("Primero completa Publicar → GitHub (owner, repo y token)");
      return;
    }
    setPublishing(true);
    const res = await publishConfigTo({
      owner: github.owner,
      repo: github.repo,
      branch: github.branch || "main",
      path: github.path,
      token,
    });
    setPublishing(false);
    if (res.ok) {
      toast.success("¡Config publicada! 🚀", {
        description:
          "En 1-2 minutos todos los dispositivos leerán y escribirán en tu Supabase.",
      });
    } else {
      toast.error(res.error ?? "Error inesperado al publicar");
    }
  };

  const handleChangePass = async () => {
    if (newPass.trim().length < 6) {
      toast.error("La nueva contraseña debe tener al menos 6 caracteres");
      return;
    }
    if (!connected) {
      toast.error("Conecta Supabase primero");
      return;
    }
    const res = await sbAdminSetPass(
      { url: config.url, anonKey: config.anonKey },
      oldPass,
      newPass
    );
    if (res.ok) {
      toast.success("Contraseña de la nube actualizada 🔐");
      setOldPass("");
      setNewPass("");
    } else {
      toast.error(
        explain(res.status ?? 0, res.body, "contraseña")
      );
    }
  };

  const copySql = async () => {
    try {
      await navigator.clipboard.writeText(SQL_SETUP);
      toast.success("SQL copiado. Pégalo en el SQL Editor de Supabase.");
    } catch {
      toast.error("No se pudo copiar en este navegador");
    }
  };

  return (
    <div className="grid gap-4">
      {/* Estado actual */}
      <section className="rounded-3xl border border-[#e8dcc0] bg-white p-5 shadow-sm">
        <h2 className="flex items-center gap-2 font-display text-xl text-[#c2542f]">
          <Database className="size-5" aria-hidden="true" />
          Reseñas y pedidos en la nube
        </h2>
        <p className="mt-1 text-sm text-[#8a7350]">
          Las reseñas y los pedidos se guardan en tu{" "}
          <strong>Supabase</strong> (gratis). Sin conexión, se guardan en el
          dispositivo y se envían solos después.
        </p>
        <p className="mt-2 inline-flex items-center gap-1.5 rounded-full bg-[#fdf8ec] px-3 py-1 text-xs font-bold text-[#8a6410]">
          {connected
            ? `Conectado a ${config.url.replace(/^https?:\/\//, "").slice(0, 32)}…`
            : "Ahora mismo las reseñas se guardan solo en este dispositivo"}
        </p>
      </section>

      {/* Conectar Supabase */}
      <section className="rounded-3xl border border-[#e8dcc0] bg-white p-5 shadow-sm">
        <h3 className="font-display text-lg text-[#c2542f]">
          {connected ? "Reconfigurar conexión" : "Conectar Supabase (10 minutos, una sola vez)"}
        </h3>
        <ol className="mt-2 grid gap-1.5 text-sm text-[#6b5a40]">
          <li>
            1. Entra en{" "}
            <a
              href="https://supabase.com"
              target="_blank"
              rel="noreferrer"
              className="inline-flex items-center gap-0.5 font-bold text-[#e2574c] hover:underline"
            >
              supabase.com <ExternalLink className="size-3" aria-hidden="true" />
            </a>{" "}
            → New project.
          </li>
          <li>
            2. Menú izquierdo → <strong>SQL Editor</strong> → pega y ejecuta el
            SQL de abajo (crea tablas, RPCs y la contraseña inicial{" "}
            <code className="rounded bg-[#fdf3e0] px-1 font-bold text-[#c2542f]">playa2026</code>).
          </li>
          <li>
            3. Project Settings (⚙️) → <strong>API</strong>: copia la{" "}
            <strong>Project URL</strong> y la <strong>Anon public key</strong>.
          </li>
        </ol>
        <Button
          type="button"
          variant="outline"
          onClick={() => void copySql()}
          className="mt-2.5 rounded-full border-[#f0dfc0] text-xs font-bold text-[#c2542f] hover:bg-[#fdf3e0]"
        >
          Copiar SQL de setup
        </Button>

        <div className="mt-3 grid gap-2.5">
          <div className="grid gap-1.5">
            <Label htmlFor="s-url" className="font-bold text-[#4a3b28]">
              Project URL
            </Label>
            <Input
              id="s-url"
              value={url}
              onChange={(e) => setUrl(e.target.value)}
              placeholder="https://xxxx.supabase.co"
              className="border-[#f0dfc0] focus-visible:ring-[#e2574c]"
            />
          </div>
          <div className="grid gap-1.5">
            <Label htmlFor="s-key" className="font-bold text-[#4a3b28]">
              Anon public key
            </Label>
            <Input
              id="s-key"
              type="password"
              value={anonKey}
              onChange={(e) => setAnonKey(e.target.value)}
              placeholder="eyJ..."
              className="border-[#f0dfc0] focus-visible:ring-[#e2574c]"
            />
          </div>
          <div className="flex flex-wrap gap-2">
            <Button
              type="button"
              variant="outline"
              disabled={testing}
              onClick={() => void handleTest()}
              className="rounded-full border-[#f0dfc0] font-bold text-[#c2542f] hover:bg-[#fdf3e0]"
            >
              <PlugZap className="size-4" aria-hidden="true" />
              Probar conexión
            </Button>
            <Button
              type="button"
              onClick={handleConnect}
              className="rounded-full bg-[#e2574c] font-extrabold text-white hover:bg-[#d34a40]"
            >
              Conectar aquí
            </Button>
            {connected && (
              <Button
                type="button"
                variant="ghost"
                onClick={() => {
                  disconnect();
                  toast.info("Este dispositivo volvió al modo local");
                }}
                className="text-[#8a7350] hover:bg-[#fdf3e0]"
              >
                <WifiOff className="size-4" aria-hidden="true" />
                Desconectar
              </Button>
            )}
          </div>
          {connected && (
            <Button
              type="button"
              onClick={() => void handlePublish()}
              disabled={publishing}
              className="rounded-2xl bg-[#c2542f] font-extrabold text-white hover:bg-[#a84724]"
            >
              {publishing ? "Publicando..." : "Publicar config para todos"}
            </Button>
          )}
        </div>
      </section>

      {/* Contraseña de la nube */}
      {connected && (
        <section className="rounded-3xl border border-[#e8dcc0] bg-white p-5 shadow-sm">
          <h3 className="font-display text-lg text-[#c2542f]">
            Contraseña de la nube
          </h3>
          <p className="mt-1 text-xs text-[#8a7350]">
            Con esta contraseña el panel lee pedidos y reseñas desde Supabase.
            Cámbiala cuando quieras (mínimo 6 caracteres).
          </p>
          <div className="mt-3 grid gap-2.5 sm:grid-cols-2">
            <Input
              type="password"
              value={oldPass}
              onChange={(e) => setOldPass(e.target.value)}
              placeholder="Contraseña actual"
              className="border-[#f0dfc0] focus-visible:ring-[#e2574c]"
              aria-label="Contraseña actual"
            />
            <Input
              type="password"
              value={newPass}
              onChange={(e) => setNewPass(e.target.value)}
              placeholder="Nueva contraseña"
              className="border-[#f0dfc0] focus-visible:ring-[#e2574c]"
              aria-label="Nueva contraseña"
            />
          </div>
          <Button
            type="button"
            onClick={() => void handleChangePass()}
            className="mt-2.5 rounded-full bg-[#e2574c] font-extrabold text-white hover:bg-[#d34a40]"
          >
            Cambiar
          </Button>
        </section>
      )}

      {/* Lista de moderación */}
      <section className="rounded-3xl border border-[#e8dcc0] bg-white p-5 shadow-sm">
        <div className="mb-3 flex flex-wrap items-center justify-between gap-2">
          <h3 className="font-display text-lg text-[#c2542f]">
            Moderar reseñas
          </h3>
          {connected && (
            <Button
              type="button"
              size="sm"
              variant="outline"
              onClick={() => void loadAdmin(pass)}
              className="rounded-full border-[#f0dfc0] text-xs font-bold text-[#c2542f] hover:bg-[#fdf3e0]"
            >
              Actualizar
            </Button>
          )}
        </div>

        {adminListEmpty(reviews) ? (
          <p className="rounded-2xl bg-[#fdf8ec] px-4 py-6 text-center text-sm text-[#8a7350]">
            {connected
              ? "No se pudieron subir. Revisa la conexión."
              : "Todavía no hay reseñas guardadas en este dispositivo."}
          </p>
        ) : (
          <ul className="grid gap-2">
            {reviews.map((r) => (
              <li
                key={r.id}
                className={`rounded-2xl border p-3.5 ${
                  r.hidden
                    ? "border-dashed border-[#e8c9a0] bg-[#fdf8ec]/60"
                    : "border-[#f0e6cc] bg-white"
                }`}
              >
                <div className="flex flex-wrap items-center gap-2">
                  <span className="text-sm font-extrabold text-[#4a3b28]">
                    {r.name}
                  </span>
                  {r.place && (
                    <span className="text-xs text-[#a58a5f]">· {r.place}</span>
                  )}
                  <span className="text-xs text-[#f2a540]">
                    {"★".repeat(r.rating)}
                  </span>
                  {r.hidden && (
                    <span className="rounded-full bg-[#8a7350]/15 px-2 py-0.5 text-[10px] font-black text-[#6b5a40]">
                      OCULTA
                    </span>
                  )}
                  <span className="ml-auto text-[11px] text-[#a58a5f]">
                    {new Date(r.createdAt).toLocaleDateString("es-CU")}
                  </span>
                </div>
                <p className="mt-1 text-sm text-[#6b5a40]">“{r.text}”</p>
                <div className="mt-2 flex flex-wrap gap-1.5">
                  {r.id.startsWith("seed-") ? (
                    <>
                      <Button
                        type="button"
                        size="sm"
                        variant="outline"
                        onClick={() => {
                          void setHidden(r.id, true, pass);
                          toast.success("Quitadas de la web");
                        }}
                        className="rounded-full border-[#f0dfc0] text-xs font-bold text-[#b3562e] hover:bg-[#fdeae7]"
                      >
                        Quitarlas de la web
                      </Button>
                      <Button
                        type="button"
                        size="sm"
                        variant="outline"
                        onClick={() => {
                          useReviewsStore.getState().restoreSeeds();
                          toast.success("Volver a mostrarlas");
                        }}
                        className="rounded-full border-[#f0dfc0] text-xs font-bold text-[#8a7350] hover:bg-[#fdf3e0]"
                      >
                        Ya están en la nube
                      </Button>
                    </>
                  ) : (
                    <>
                      <Button
                        type="button"
                        size="sm"
                        variant="outline"
                        onClick={() => {
                          void setHidden(r.id, !r.hidden, pass)
                            .then(() =>
                              toast.success(
                                r.hidden ? "Reseña visible de nuevo" : "Reseña oculta"
                              )
                            )
                            .catch(() =>
                              toast.error("No se pudo actualizar en la nube")
                            );
                        }}
                        className="rounded-full border-[#f0dfc0] text-xs font-bold text-[#c2542f] hover:bg-[#fdf3e0]"
                      >
                        {r.hidden ? (
                          <>
                            <Eye className="size-3.5" aria-hidden="true" />
                            Mostrar reseña
                          </>
                        ) : (
                          <>
                            <EyeOff className="size-3.5" aria-hidden="true" />
                            Ocultar reseña
                          </>
                        )}
                      </Button>
                      <Button
                        type="button"
                        size="sm"
                        variant="ghost"
                        onClick={() => setConfirmDelete(r.id)}
                        className="text-xs font-bold text-[#b3562e] hover:bg-[#fdeae7]"
                      >
                        <Trash2 className="size-3.5" aria-hidden="true" />
                        Borrar reseña
                      </Button>
                    </>
                  )}
                </div>
              </li>
            ))}
          </ul>
        )}
      </section>

      <AlertDialog
        open={!!confirmDelete}
        onOpenChange={(v) => !v && setConfirmDelete(null)}
      >
        <AlertDialogContent className="rounded-3xl border-[#f0dfc0] bg-[#fffcf4]">
          <AlertDialogHeader>
            <AlertDialogTitle className="font-display text-xl text-[#c2542f]">
              ¿Borrar la reseña?
            </AlertDialogTitle>
            <AlertDialogDescription>
              Se elimina para todos los dispositivos. Esta acción no se puede
              deshacer.
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel className="border-[#f0dfc0]">Cancelar</AlertDialogCancel>
            <AlertDialogAction
              onClick={() => {
                if (confirmDelete) {
                  void adminDelete(confirmDelete, pass)
                    .then(() => toast.success("Reseña borrada"))
                    .catch(() => toast.error("No se pudo borrar en la nube"));
                }
                setConfirmDelete(null);
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

function adminListEmpty(list: { length: number }[]) {
  return list.length === 0;
}
