"use client";

import { useEffect, useLayoutEffect, useMemo, useRef, useState, useSyncExternalStore } from "react";
import { createPortal } from "react-dom";
import qrcode from "qrcode-generator";
import { Download, FileText, X } from "lucide-react";
import { money, prettyHour, useMenuStore } from "@/lib/store";
import type { MenuData, Settings } from "@/lib/types";
import { Bunting, PalmSilhouette, SunSilhouette } from "./beach-scene";

/* ------------------------------------------------------------------ */
/*  Carta en PDF: una hoja A4 con la estética de la web. El tamaño de  */
/*  letra se ajusta solo para que TODO quepa en una página. Se guarda  */
/*  con «Imprimir → Guardar como PDF» (texto nítido y colores reales). */
/* ------------------------------------------------------------------ */

const PAGE_W = 794; // A4 a 96 ppp
const PAGE_H = 1123;

const C = {
  sand: "#fdf3e0",
  sand2: "#f6dfb2",
  ink: "#4a3b28",
  muted: "#8a7350",
  coral: "#e2574c",
  coralDeep: "#c2542f",
  cat: "#a8431f",
  gold: "#f2c230",
  sea: "#54b7cf",
  line: "#e8d5b5",
};

const DAY_SHORT = ["Dom", "Lun", "Mar", "Mié", "Jue", "Vie", "Sáb"];

function scheduleText(s: Settings): string {
  if (!s.schedule?.auto) return "";
  const open = [1, 2, 3, 4, 5, 6, 0].filter((d) => !s.schedule.days[d].closed);
  if (!open.length) return "";
  const first = s.schedule.days[open[0]];
  const same = open.every(
    (d) => s.schedule.days[d].open === first.open && s.schedule.days[d].close === first.close
  );
  if (!same) return "Consulta el horario en la carta web";
  const days =
    open.length === 7 ? "Todos los días" : open.map((d) => DAY_SHORT[d]).join(" · ");
  return `${days} · ${prettyHour(first.open)} – ${prettyHour(first.close)}`;
}

function WaveRule({ flip }: { flip?: boolean }) {
  return (
    <svg viewBox="0 0 64 16" style={{ width: "2.2em", height: "0.7em", flex: "none", transform: flip ? "scaleX(-1)" : undefined }} aria-hidden="true">
      <path d="M2 9 Q10 3 18 9 T34 9 T50 9 T62 9" fill="none" stroke="rgba(226,87,76,0.5)" strokeWidth="3" strokeLinecap="round" />
    </svg>
  );
}

function MenuPage({ data, url }: { data: MenuData; url: string }) {
  const s = data.settings;
  const cur = s.currency;
  const cats = data.categories
    .filter((c) => c.visible)
    .map((c) => ({ c, items: data.products.filter((p) => p.category === c.id && p.available) }))
    .filter((g) => g.items.length);
  const byId = new Map(data.products.map((p) => [p.id, p]));
  const combos = data.combos.filter(
    (c) => c.active && c.items.every((i) => byId.get(i.productId)?.available)
  );
  const zones = s.zones.filter((z) => z.active);
  const pays = s.payments.filter((p) => p.active);
  const agregos = data.agregos.filter((a) => a.available);
  const hours = scheduleText(s);
  const qrSvg = useMemo(() => {
    if (!url) return "";
    const qr = qrcode(0, "M");
    qr.addData(url);
    qr.make();
    return qr.createSvgTag({ cellSize: 4, margin: 0, scalable: true });
  }, [url]);

  const bodyRef = useRef<HTMLDivElement>(null);
  const pageRef = useRef<HTMLDivElement>(null);

  // Ajusta la letra hasta que todo quepa en la hoja
  useLayoutEffect(() => {
    const page = pageRef.current;
    const body = bodyRef.current;
    if (!page || !body) return;
    let fs = 12.5;
    page.style.setProperty("--fs", `${fs}px`);
    let guard = 0;
    while (page.scrollHeight > PAGE_H + 1 && fs > 6.5 && guard < 60) {
      fs -= 0.25;
      page.style.setProperty("--fs", `${fs}px`);
      guard += 1;
    }
  }, [data, url]);

  return (
    <div
      ref={pageRef}
      className="aol-pdf-page"
      style={{
        width: PAGE_W,
        height: PAGE_H,
        overflow: "hidden",
        background: C.sand,
        color: C.ink,
        fontFamily: "var(--font-body), system-ui, sans-serif",
        fontSize: "var(--fs, 12px)",
        display: "flex",
        flexDirection: "column",
        position: "relative",
      }}
    >
      {/* Postal de cabecera */}
      <header
        style={{
          position: "relative",
          height: 205,
          flex: "none",
          overflow: "hidden",
          background: "linear-gradient(180deg,#8fd3ec 0%,#c4ecf6 55%,#fff0cf 100%)",
        }}
      >
        <div style={{ position: "absolute", left: "6%", right: "6%", top: -2, height: 30 }}>
          <Bunting className="h-full w-full" />
        </div>
        <div style={{ position: "absolute", right: 70, top: 28, width: 70, height: 70 }}>
          <SunSilhouette className="h-full w-full" />
        </div>
        <div style={{ position: "absolute", left: -14, bottom: 8, width: 120, height: 150 }} aria-hidden="true">
          <PalmSilhouette className="h-full w-full" />
        </div>
        <div style={{ position: "absolute", right: -16, bottom: 8, width: 90, height: 115, transform: "scaleX(-1)" }} aria-hidden="true">
          <PalmSilhouette className="h-full w-full" />
        </div>
        <svg viewBox="0 0 1440 90" preserveAspectRatio="none" style={{ position: "absolute", left: 0, bottom: 0, width: "100%", height: 70 }} aria-hidden="true">
          <path fill="#a9ddec" d="M0 30 Q180 12 360 30 T720 30 T1080 30 T1440 30 V90 H0Z" />
          <path fill="#7ccadb" d="M0 44 Q120 28 240 44 T480 44 T720 44 T960 44 T1200 44 T1440 44 V90 H0Z" />
          <path fill="#54b7cf" d="M0 58 Q90 46 180 58 T360 58 T540 58 T720 58 T900 58 T1080 58 T1260 58 T1440 58 V90 H0Z" />
          <path fill={C.sand} d="M0 78 Q240 66 480 76 T960 76 T1440 74 V90 H0Z" />
        </svg>
        <div style={{ position: "relative", zIndex: 2, display: "flex", alignItems: "center", gap: 18, padding: "34px 120px 0" }}>
          <img
            src="/images/logo.png"
            alt=""
            style={{ width: 104, height: 104, borderRadius: "50%", border: `4px solid ${C.sand}`, boxShadow: "0 8px 20px -8px rgba(160,70,40,.55)", background: C.sand, flex: "none" }}
          />
          <div style={{ minWidth: 0 }}>
            <p style={{ fontFamily: "var(--font-display), system-ui", fontSize: 38, lineHeight: 1, color: C.coralDeep, margin: 0 }}>
              {s.businessName}
            </p>
            <p style={{ margin: "6px 0 0", fontSize: 13, fontWeight: 600, color: C.muted }}>{s.tagline}</p>
            <p style={{ margin: "2px 0 0", fontFamily: "var(--font-display), system-ui", fontSize: 15, color: C.coral }}>
              Sabor playero, al otro lado de tu calle
            </p>
          </div>
        </div>
      </header>

      {/* Datos rápidos */}
      <div style={{ display: "flex", flexWrap: "wrap", justifyContent: "center", gap: 8, padding: "4px 28px 0", fontSize: 11.5, fontWeight: 700, color: C.muted, flex: "none" }}>
        <span style={chip}>📍 {s.deliveryPoint}</span>
        {hours && <span style={chip}>🕒 {hours}</span>}
        {s.whatsapp && <span style={chip}>📲 WhatsApp +{s.whatsapp.replace(/\D/g, "")}</span>}
        <span style={chip}>💵 Precios en MN</span>
      </div>

      {/* Carta en 3 columnas */}
      <div ref={bodyRef} style={{ flex: "none", padding: "10px 28px 0", columnCount: 3, columnGap: 22, columnFill: "balance" }}>
        {cats.map(({ c, items }) => (
          <section key={c.id} style={{ breakInside: "avoid-column", marginBottom: "0.9em" }}>
            <h2
              style={{
                display: "flex",
                alignItems: "center",
                justifyContent: "center",
                gap: "0.4em",
                margin: "0 0 0.35em",
                fontFamily: "var(--font-display), system-ui",
                fontWeight: 400,
                fontSize: "1.45em",
                lineHeight: 1.05,
                textTransform: "uppercase",
                letterSpacing: "0.02em",
                color: C.cat,
                textAlign: "center",
              }}
            >
              <WaveRule />
              <span>
                {c.emoji} {c.name}
              </span>
              <WaveRule flip />
            </h2>
            {items.map((p) => (
              <div key={p.id} style={{ breakInside: "avoid", padding: "0.22em 0" }}>
                <div style={{ display: "flex", alignItems: "baseline", gap: "0.35em" }}>
                  <span style={{ fontWeight: 800, fontSize: "1.02em" }}>{p.name}</span>
                  <span style={{ flex: 1, borderBottom: `2px dotted ${C.line}`, transform: "translateY(-0.25em)" }} />
                  <span style={{ fontFamily: "var(--font-display), system-ui", color: C.coralDeep, fontSize: "1.05em" }}>
                    {money(cur, p.price)}
                  </span>
                </div>
                <p style={{ margin: "0.05em 0 0", fontSize: "0.82em", lineHeight: 1.25, color: C.muted }}>{p.description}</p>
              </div>
            ))}
          </section>
        ))}
        {agregos.length > 0 && (
          <section style={{ breakInside: "avoid-column", marginBottom: "0.9em", background: "#fff", borderRadius: 12, padding: "0.5em 0.7em", border: `1px solid ${C.line}` }}>
            <p style={{ margin: 0, fontFamily: "var(--font-display), system-ui", color: C.cat, fontSize: "1.1em" }}>➕ Agregos</p>
            {agregos.map((a) => (
              <div key={a.id} style={{ display: "flex", justifyContent: "space-between", fontSize: "0.9em", fontWeight: 600 }}>
                <span>{a.name}</span>
                <span style={{ color: C.coralDeep, fontWeight: 800 }}>+{money(cur, a.price)}</span>
              </div>
            ))}
          </section>
        )}
      </div>

      {/* Combos */}
      {combos.length > 0 && (
        <div style={{ flex: "none", margin: "auto 28px 0", padding: "8px 12px", borderRadius: 16, border: `2px dashed rgba(226,87,76,.45)`, background: "rgba(226,87,76,.06)" }}>
          <p style={{ margin: "0 0 4px", textAlign: "center", fontFamily: "var(--font-display), system-ui", color: C.cat, fontSize: 17, textTransform: "uppercase" }}>
            🔥 Combos y ofertas
          </p>
          <div style={{ display: "grid", gridTemplateColumns: `repeat(${Math.min(combos.length, 3)}, 1fr)`, gap: 10 }}>
            {combos.slice(0, 3).map((c) => {
              const regular = c.items.reduce((a, i) => a + (byId.get(i.productId)?.price ?? 0) * i.qty, 0);
              return (
                <div key={c.id} style={{ background: "#fff", borderRadius: 12, padding: "6px 10px", fontSize: 11 }}>
                  <div style={{ display: "flex", justifyContent: "space-between", alignItems: "baseline", gap: 6 }}>
                    <b style={{ fontSize: 12.5 }}>{c.emoji} {c.name}</b>
                    <span style={{ fontFamily: "var(--font-display), system-ui", color: C.coralDeep, fontSize: 14 }}>{money(cur, c.price)}</span>
                  </div>
                  <div style={{ color: C.muted }}>
                    {c.items.map((i) => `${i.qty}× ${byId.get(i.productId)?.name ?? ""}`).join(" · ")}
                  </div>
                  {regular > c.price && (
                    <div style={{ color: "#3f9e5f", fontWeight: 800 }}>Ahorras {money(cur, regular - c.price)}</div>
                  )}
                </div>
              );
            })}
          </div>
        </div>
      )}

      {/* Pie: QR, entrega y pago */}
      <footer style={{ flex: "none", marginTop: combos.length ? 8 : "auto", background: C.sand2, padding: "10px 28px 12px", display: "flex", alignItems: "center", gap: 16 }}>
        {qrSvg && (
          <div style={{ width: 84, height: 84, background: "#fff", borderRadius: 12, padding: 6, flex: "none" }} dangerouslySetInnerHTML={{ __html: qrSvg }} />
        )}
        <div style={{ flex: 1, minWidth: 0, fontSize: 11, lineHeight: 1.45 }}>
          <p style={{ margin: 0, fontFamily: "var(--font-display), system-ui", color: C.coralDeep, fontSize: 16 }}>
            Escanea, arma tu pedido y envíalo por WhatsApp 🌊
          </p>
          {url && <p style={{ margin: 0, fontWeight: 700, color: C.ink }}>{url.replace(/^https?:\/\//, "").replace(/\/$/, "")}</p>}
          {s.deliveryEnabled && zones.length > 0 && (
            <p style={{ margin: 0, color: C.muted }}>
              <b style={{ color: C.ink }}>🛵 Mensajería:</b>{" "}
              {zones.map((z) => `${z.name} ${z.fee ? money(cur, z.fee) : "gratis"}`).join(" · ")}
            </p>
          )}
          {pays.length > 0 && (
            <p style={{ margin: 0, color: C.muted }}>
              <b style={{ color: C.ink }}>💳 Pago:</b> {pays.map((p) => `${p.emoji} ${p.name}`).join(" · ")}
              {s.pickupEnabled && <> · <b style={{ color: C.ink }}>🏖️ Recogida en el local</b></>}
            </p>
          )}
        </div>
        <p style={{ margin: 0, alignSelf: "flex-end", fontSize: 10, color: C.muted, textAlign: "right", flex: "none" }}>
          by Sol &amp; Habana
        </p>
      </footer>
    </div>
  );
}

const chip: React.CSSProperties = {
  background: "#fff",
  border: `1px solid ${C.line}`,
  borderRadius: 999,
  padding: "3px 10px",
};

const noop = () => () => {};

/** Botón «Carta en PDF» + vista previa de la hoja */
export function PdfMenuButton({ className }: { className?: string }) {
  const [open, setOpen] = useState(false);
  const data = useMenuStore((s) => s.data);
  const origin = useSyncExternalStore(noop, () => `${window.location.origin}/`, () => "");
  const url = (data.settings.publicUrl || origin).trim();
  const [vw, setVw] = useState(390);

  useEffect(() => {
    if (!open) return;
    const onResize = () => setVw(window.innerWidth);
    onResize();
    window.addEventListener("resize", onResize);
    const onAfter = () => document.body.classList.remove("aol-printing");
    window.addEventListener("afterprint", onAfter);
    return () => {
      window.removeEventListener("resize", onResize);
      window.removeEventListener("afterprint", onAfter);
    };
  }, [open]);

  const scale = Math.min(1, (vw - 32) / PAGE_W);

  const download = () => {
    const prev = document.title;
    // el nombre del archivo PDF sale del título de la página
    document.title = `Carta - ${data.settings.businessName}`;
    document.body.classList.add("aol-printing");
    window.print();
    setTimeout(() => {
      document.title = prev;
    }, 1500);
  };

  return (
    <>
      <button
        type="button"
        onClick={() => setOpen(true)}
        className={
          className ??
          "aol-chip inline-flex items-center gap-1.5 rounded-full bg-white px-3.5 py-1.5 text-xs font-extrabold text-[#8a7350] shadow-sm ring-1 ring-[#f0dfc0] transition hover:bg-[#fdf3e0] active:scale-95"
        }
      >
        <FileText className="size-3.5" aria-hidden="true" />
        Carta en PDF
      </button>
      {open &&
        createPortal(
          <div className="aol-pdf-root fixed inset-0 z-[100] overflow-y-auto bg-[#281a0e]/70 backdrop-blur-sm" role="dialog" aria-modal="true" aria-label="Carta en PDF">
            <div className="aol-pdf-chrome sticky top-0 z-10 flex flex-wrap items-center justify-center gap-2 bg-[#fffcf4] px-4 py-3 shadow-md">
              <button
                type="button"
                onClick={download}
                className="inline-flex items-center gap-2 rounded-full bg-[#e2574c] px-5 py-2.5 text-sm font-extrabold text-white shadow-[0_6px_18px_-4px_rgba(226,87,76,0.55)] active:scale-95"
              >
                <Download className="size-4" aria-hidden="true" />
                Descargar PDF
              </button>
              <button
                type="button"
                onClick={() => setOpen(false)}
                className="inline-flex items-center gap-1.5 rounded-full bg-white px-4 py-2.5 text-sm font-bold text-[#8a7350] ring-1 ring-[#f0dfc0]"
              >
                <X className="size-4" aria-hidden="true" />
                Cerrar
              </button>
              <p className="w-full text-center text-xs font-semibold text-[#8a7350]">
                En la ventana que se abre elige <b>«Guardar como PDF»</b> · tamaño A4, una sola hoja
              </p>
            </div>
            <div className="aol-pdf-scaler mx-auto my-4" style={{ width: PAGE_W * scale, height: PAGE_H * scale }}>
              <div className="shadow-2xl" style={{ width: PAGE_W, height: PAGE_H, transform: `scale(${scale})`, transformOrigin: "top left" }}>
                <MenuPage data={data} url={url} />
              </div>
            </div>
          </div>,
          document.body
        )}
    </>
  );
}
