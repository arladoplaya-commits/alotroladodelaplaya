"use client";

import { useMemo, useState, useSyncExternalStore } from "react";
import qrcode from "qrcode-generator";
import { Download, QrCode } from "lucide-react";
import { toast } from "sonner";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { useMenuStore } from "@/lib/store";
import { PdfMenuButton } from "@/components/menu/pdf-menu";

/* ------------------------------------------------------------------ */
/*  Código QR de la carta. Usa la dirección donde está publicada la    */
/*  web (p. ej. la de Vercel) o una que el negocio escriba a mano.     */
/* ------------------------------------------------------------------ */

const noop = () => () => {};
const originSnapshot = () => `${window.location.origin}/`;

function makeQr(url: string) {
  const qr = qrcode(0, "M");
  qr.addData(url);
  qr.make();
  return qr;
}

/** Cartel listo para imprimir: nombre, QR grande y la dirección */
async function posterPng(url: string, businessName: string): Promise<string> {
  const qr = makeQr(url);
  const W = 1200;
  const H = 1650;
  const c = document.createElement("canvas");
  c.width = W;
  c.height = H;
  const ctx = c.getContext("2d");
  if (!ctx) throw new Error("Sin canvas");
  // fondo arena con franja de mar
  ctx.fillStyle = "#fdf3e0";
  ctx.fillRect(0, 0, W, H);
  ctx.fillStyle = "#54b7cf";
  ctx.fillRect(0, H - 150, W, 150);
  ctx.fillStyle = "#a9ddec";
  ctx.fillRect(0, H - 190, W, 40);
  // logo
  try {
    const logo = new Image();
    logo.src = "/images/logo.png";
    await logo.decode();
    ctx.drawImage(logo, W / 2 - 130, 70, 260, 260);
  } catch {
    /* sin logo: seguimos */
  }
  ctx.textAlign = "center";
  ctx.fillStyle = "#c2542f";
  ctx.font = "bold 72px 'Lilita One', system-ui, sans-serif";
  ctx.fillText(businessName, W / 2, 420, W - 120);
  ctx.fillStyle = "#4a3b28";
  ctx.font = "600 44px system-ui, sans-serif";
  ctx.fillText("Escanea, mira la carta y pide 🌊", W / 2, 490, W - 120);
  // QR sobre tarjeta blanca
  const size = 760;
  const x = (W - size) / 2;
  const y = 550;
  ctx.fillStyle = "#ffffff";
  ctx.beginPath();
  ctx.roundRect(x - 40, y - 40, size + 80, size + 80, 48);
  ctx.fill();
  const n = qr.getModuleCount();
  const cell = size / n;
  ctx.fillStyle = "#2b1d11";
  for (let r = 0; r < n; r++) {
    for (let col = 0; col < n; col++) {
      if (qr.isDark(r, col)) ctx.fillRect(x + col * cell, y + r * cell, Math.ceil(cell), Math.ceil(cell));
    }
  }
  ctx.fillStyle = "#8a7350";
  ctx.font = "600 34px system-ui, sans-serif";
  ctx.fillText(url.replace(/^https?:\/\//, "").replace(/\/$/, ""), W / 2, y + size + 110, W - 120);
  return c.toDataURL("image/png");
}

function download(dataUrl: string, name: string) {
  const a = document.createElement("a");
  a.href = dataUrl;
  a.download = name;
  a.click();
}

export function QrCard() {
  const settings = useMenuStore((s) => s.data.settings);
  const saveSettings = useMenuStore((s) => s.saveSettings);
  const origin = useSyncExternalStore(noop, originSnapshot, () => "");
  const [draft, setDraft] = useState(settings.publicUrl);

  const url = (settings.publicUrl || origin).trim();
  const svg = useMemo(() => {
    if (!url) return "";
    try {
      return makeQr(url).createSvgTag({ cellSize: 6, margin: 2, scalable: true });
    } catch {
      return "";
    }
  }, [url]);
  const looksTemporary = /localhost|127\.0\.0\.1|\.local|space\.z\.ai|preview/i.test(url);

  const saveUrl = () => {
    const v = draft.trim();
    if (v && !/^https?:\/\/\S+\.\S+/.test(v)) {
      toast.error("Escribe la dirección completa, ej. https://alotrolado.vercel.app");
      return;
    }
    saveSettings({ ...settings, publicUrl: v });
    toast.success(v ? "Dirección del QR guardada" : "El QR usará la dirección actual");
  };

  return (
    <section className="rounded-3xl border border-[#e8dcc0] bg-white p-5 shadow-sm">
      <h2 className="mb-1 flex items-center gap-2 font-display text-xl text-[#c2542f]">
        <QrCode className="size-5" aria-hidden="true" />
        Código QR de la carta
      </h2>
      <p className="mb-3 text-sm text-[#8a7350]">
        Imprímelo para la barra, las mesas o el carrito. Cuando abras este
        panel desde tu web en Vercel, el QR ya apunta ahí solo.
      </p>
      <div className="grid gap-4 sm:grid-cols-[180px_1fr] sm:items-start">
        <div
          className="mx-auto aspect-square w-44 rounded-2xl bg-white p-2 ring-1 ring-[#f0dfc0] [&_svg]:h-full [&_svg]:w-full"
          // SVG generado localmente por qrcode-generator a partir de la URL
          dangerouslySetInnerHTML={{ __html: svg }}
          aria-label={`Código QR que abre ${url}`}
          role="img"
        />
        <div className="grid gap-2.5">
          <p className="break-all rounded-xl bg-[#fdf8ec] px-3 py-2 text-sm font-bold text-[#4a3b28]">
            🔗 {url || "…"}
          </p>
          {looksTemporary && (
            <p className="rounded-xl bg-[#fdeae0] px-3 py-2 text-xs font-bold text-[#b3562e]">
              ⚠️ Esta dirección parece de prueba. Publica en Vercel y abre el
              panel desde allí, o escribe abajo tu dirección definitiva.
            </p>
          )}
          <div className="flex gap-2">
            <Input
              value={draft}
              onChange={(e) => setDraft(e.target.value)}
              placeholder="https://tu-carta.vercel.app (opcional)"
              aria-label="Dirección pública de la carta"
              className="border-[#f0dfc0] focus-visible:ring-[#e2574c]"
            />
            <Button
              type="button"
              variant="outline"
              onClick={saveUrl}
              className="shrink-0 rounded-2xl border-[#f0dfc0] font-bold text-[#c2542f]"
            >
              Usar
            </Button>
          </div>
          <div className="flex flex-wrap gap-2">
            <Button
              type="button"
              disabled={!url}
              onClick={async () => {
                try {
                  download(await posterPng(url, settings.businessName), "cartel-qr-carta.png");
                } catch {
                  toast.error("No se pudo crear el cartel en este navegador");
                }
              }}
              className="rounded-2xl bg-[#e2574c] font-extrabold text-white hover:bg-[#d34a40]"
            >
              <Download className="size-4" aria-hidden="true" />
              Cartel para imprimir
            </Button>
            <Button
              type="button"
              variant="outline"
              disabled={!url}
              onClick={() => download(makeQr(url).createDataURL(12, 4), "qr-carta.gif")}
              className="rounded-2xl border-[#f0dfc0] font-bold text-[#8a7350]"
            >
              Solo el QR
            </Button>
            <PdfMenuButton className="inline-flex h-9 items-center gap-1.5 rounded-2xl border border-[#f0dfc0] bg-white px-4 text-sm font-bold text-[#8a7350] hover:bg-[#fdf3e0]" />
          </div>
        </div>
      </div>
    </section>
  );
}
