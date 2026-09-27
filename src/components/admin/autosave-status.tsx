"use client";

import { useEffect } from "react";
import { AlertTriangle, CheckCircle2, CloudOff, CloudUpload, Loader2 } from "lucide-react";
import { useMenuStore } from "@/lib/store";
import { autoPublishOn, githubReady, useAutoPublish } from "@/lib/autopublish";

/* ------------------------------------------------------------------ */
/*  Vigila la carta mientras el panel está abierto y la sube sola a    */
/*  GitHub. Muestra el estado en la cabecera del panel.                */
/* ------------------------------------------------------------------ */

const getData = () => useMenuStore.getState().data;

export function AutoSaveStatus() {
  const updatedAt = useMenuStore((s) => s.data.updatedAt);
  const ready = useMenuStore((s) => githubReady(s.data));
  const state = useAutoPublish((s) => s.state);
  const error = useAutoPublish((s) => s.error);

  // preferencia guardada en este dispositivo
  useEffect(() => {
    useAutoPublish.setState({ enabled: autoPublishOn() });
  }, []);

  // cada cambio de la carta agenda un guardado
  useEffect(() => {
    useAutoPublish.getState().schedule(getData);
  }, [updatedAt, ready]);

  // al salir o esconder la app, se sube lo pendiente
  useEffect(() => {
    const onHide = () => {
      if (document.visibilityState === "hidden") {
        const st = useAutoPublish.getState().state;
        if (st === "pending" || st === "error") void useAutoPublish.getState().flush(getData);
      }
    };
    const onUnload = (e: BeforeUnloadEvent) => {
      const st = useAutoPublish.getState().state;
      if (st === "pending" || st === "saving") {
        void useAutoPublish.getState().flush(getData);
        e.preventDefault();
      }
    };
    document.addEventListener("visibilitychange", onHide);
    window.addEventListener("beforeunload", onUnload);
    return () => {
      document.removeEventListener("visibilitychange", onHide);
      window.removeEventListener("beforeunload", onUnload);
    };
  }, []);

  if (!ready) {
    return (
      <span className="inline-flex items-center gap-1 text-[11px] font-bold text-[#a58a5f]">
        <CloudOff className="size-3.5" aria-hidden="true" />
        Solo en este teléfono · configura GitHub en Publicar
      </span>
    );
  }

  const view = {
    off: { icon: CloudOff, text: "Guardado automático apagado", cls: "text-[#a58a5f]" },
    idle: { icon: CheckCircle2, text: "Todo guardado en GitHub", cls: "text-[#3f9e5f]" },
    saved: { icon: CheckCircle2, text: "Guardado en GitHub", cls: "text-[#3f9e5f]" },
    pending: { icon: CloudUpload, text: "Cambios sin subir… se guardan solos", cls: "text-[#c2542f]" },
    saving: { icon: Loader2, text: "Guardando en GitHub…", cls: "text-[#c2542f]" },
    error: { icon: AlertTriangle, text: "No se pudo guardar", cls: "text-[#e2574c]" },
  }[state];
  const Icon = view.icon;

  return (
    <span className={`inline-flex items-center gap-1 text-[11px] font-bold ${view.cls}`} role="status">
      <Icon className={`size-3.5 ${state === "saving" ? "animate-spin" : ""}`} aria-hidden="true" />
      {view.text}
      {state === "error" && (
        <button
          type="button"
          onClick={() => void useAutoPublish.getState().flush(getData)}
          className="ml-1 underline"
          title={error}
        >
          Reintentar
        </button>
      )}
    </span>
  );
}
