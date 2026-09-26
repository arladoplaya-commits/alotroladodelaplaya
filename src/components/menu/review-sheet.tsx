"use client";

import { useState } from "react";
import { Loader2, Star } from "lucide-react";
import { toast } from "sonner";
import {
  Sheet,
  SheetContent,
  SheetDescription,
  SheetFooter,
  SheetHeader,
  SheetTitle,
} from "@/components/ui/sheet";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { useReviewsStore } from "@/lib/reviews";

/* ------------------------------------------------------------------ */
/*  Formulario de reseña: estrellas, nombre, barrio y comentario.      */
/*  Validaciones suaves en español playero.                            */
/* ------------------------------------------------------------------ */

interface ReviewSheetProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
}

const NAME_RE = /^[A-Za-zÁÉÍÓÚÑáéíóúñüÜ' .-]{2,24}$/;

export function ReviewSheet({ open, onOpenChange }: ReviewSheetProps) {
  const submit = useReviewsStore((s) => s.submit);
  const provider = useReviewsStore((s) => s.config.provider);

  const [rating, setRating] = useState(0);
  const [hover, setHover] = useState(0);
  const [name, setName] = useState("");
  const [place, setPlace] = useState("");
  const [text, setText] = useState("");
  const [sending, setSending] = useState(false);
  const [done, setDone] = useState<null | "local" | "cloud" | "queued">(null);

  const reset = () => {
    setRating(0);
    setHover(0);
    setName("");
    setPlace("");
    setText("");
    setDone(null);
  };

  const nameOk = NAME_RE.test(name.trim());
  const placeOk = place.trim().length <= 24;
  const textOk = text.trim().length >= 5 && text.trim().length <= 200;
  const ratingOk = rating >= 1 && rating <= 5;
  const canSend = nameOk && placeOk && textOk && ratingOk && !sending;

  const handleSend = async () => {
    if (!canSend) return;
    setSending(true);
    const res = await submit({ name, place, rating, text });
    setSending(false);
    if (!res.ok) {
      toast.error("No se pudo enviar la reseña", {
        description: res.error ?? "Intenta de nuevo en unos segundos.",
      });
      return;
    }
    if (res.queued) {
      setDone("queued");
      toast.info("Reseña guardada 📶", {
        description: "Se publicará cuando vuelva la conexión.",
      });
    } else if (provider === "supabase") {
      setDone("cloud");
      toast.success("¡Reseña enviada! 🌊", {
        description: "Ya la puede leer todo el mundo desde la carta.",
      });
    } else {
      setDone("local");
      toast.success("¡Gracias! ⭐", {
        description: "Tu reseña quedó guardada en este dispositivo.",
      });
    }
  };

  return (
    <Sheet
      open={open}
      onOpenChange={(v) => {
        if (!v && done) reset();
        onOpenChange(v);
      }}
    >
      <SheetContent
        side="bottom"
        className="max-h-[92dvh] overflow-y-auto rounded-t-3xl border-[#f0dfc0] bg-[#fffcf4] px-4 pb-6"
      >
        {done ? (
          <div className="flex flex-col items-center gap-3 py-10 text-center">
            <span className="text-5xl" aria-hidden="true">
              {done === "queued" ? "📶" : "🌊"}
            </span>
            <SheetHeader className="items-center gap-1 sm:text-center">
              <SheetTitle className="font-display text-2xl text-[#c2542f]">
                {done === "queued"
                  ? "Reseña en cola 📶"
                  : "¡Gracias, jefe de la marea!"}
              </SheetTitle>
              <SheetDescription className="text-sm text-[#8a7350]">
                {done === "queued"
                  ? "Se publicará automáticamente cuando vuelva la conexión."
                  : done === "cloud"
                    ? "Tu reseña ya está en la nube, la marea la puede leer."
                    : "Tu reseña quedó guardada en este dispositivo."}
              </SheetDescription>
            </SheetHeader>
            <Button
              type="button"
              onClick={() => {
                reset();
                onOpenChange(false);
              }}
              className="mt-2 rounded-2xl bg-[#e2574c] px-6 font-extrabold text-white hover:bg-[#d34a40]"
            >
              Volver a la carta
            </Button>
          </div>
        ) : (
          <>
            <SheetHeader className="items-center gap-1 pb-0 text-center sm:text-center">
              <SheetTitle className="font-display text-2xl text-[#c2542f]">
                Deja tu huella en la arena ✍️
              </SheetTitle>
              <SheetDescription className="text-sm text-[#8a7350]">
                ¿Cómo te fue con tu pedido? Tu reseña ayuda a la marea a elegir.
              </SheetDescription>
            </SheetHeader>

            <div className="grid gap-4 py-4">
              {/* Estrellas */}
              <div>
                <p className="mb-1.5 text-sm font-extrabold text-[#4a3b28]">
                  Tus estrellas
                </p>
                <div
                  className="flex gap-1.5"
                  role="radiogroup"
                  aria-label="Calificación de 1 a 5 estrellas"
                >
                  {[1, 2, 3, 4, 5].map((n) => (
                    <button
                      key={n}
                      type="button"
                      role="radio"
                      aria-checked={rating === n}
                      aria-label={`${n} estrellas`}
                      className="rounded-full p-1 transition active:scale-90"
                      onMouseEnter={() => setHover(n)}
                      onMouseLeave={() => setHover(0)}
                      onClick={() => setRating(n)}
                    >
                      <Star
                        className={`size-8 transition-colors ${
                          (hover || rating) >= n
                            ? "fill-[#f2c230] text-[#f2c230]"
                            : "text-[#e8d5b5]"
                        }`}
                      />
                    </button>
                  ))}
                </div>
                {!ratingOk && rating > 0 && (
                  <p className="mt-1 text-xs font-semibold text-[#e2574c]">
                    Elige las estrellas (1 a 5).
                  </p>
                )}
              </div>

              <div className="grid gap-3 sm:grid-cols-2">
                <div>
                  <Input
                    value={name}
                    onChange={(e) => setName(e.target.value)}
                    placeholder="Tu nombre *"
                    aria-label="Tu nombre"
                    maxLength={24}
                    className="h-11 border-[#f0dfc0] bg-white text-sm focus-visible:ring-[#e2574c]"
                  />
                  {name.trim() && !nameOk && (
                    <p className="mt-1 text-xs font-semibold text-[#e2574c]">
                      El nombre debe tener entre 2 y 24 letras.
                    </p>
                  )}
                </div>
                <div>
                  <Input
                    value={place}
                    onChange={(e) => setPlace(e.target.value)}
                    placeholder="Tu barrio (opcional)"
                    aria-label="Tu barrio (opcional)"
                    maxLength={24}
                    className="h-11 border-[#f0dfc0] bg-white text-sm focus-visible:ring-[#e2574c]"
                  />
                  {!placeOk && (
                    <p className="mt-1 text-xs font-semibold text-[#e2574c]">
                      El barrio no puede pasar de 24 letras.
                    </p>
                  )}
                </div>
              </div>

              <div>
                <Textarea
                  value={text}
                  onChange={(e) => setText(e.target.value.slice(0, 200))}
                  placeholder="Tu reseña *&#10;¿Qué pediste y cómo estuvo? Cuéntalo corto y sabroso…"
                  aria-label="Tu reseña"
                  className="min-h-[88px] resize-none border-[#f0dfc0] bg-white text-sm focus-visible:ring-[#e2574c]"
                />
                <div className="mt-1 flex items-center justify-between">
                  {text.trim() && !textOk && (
                    <p className="text-xs font-semibold text-[#e2574c]">
                      El comentario debe tener entre 5 y 200 letras.
                    </p>
                  )}
                  <p className="ml-auto text-[11px] text-[#a58a5f]">
                    {text.length}/200
                  </p>
                </div>
              </div>
            </div>

            <SheetFooter className="sm:flex-col">
              <Button
                type="button"
                disabled={!canSend}
                onClick={handleSend}
                className="h-12 w-full rounded-2xl bg-[#e2574c] text-base font-extrabold text-white shadow-[0_8px_24px_-4px_rgba(226,87,76,0.5)] transition hover:bg-[#d34a40] active:scale-[0.98] disabled:opacity-50"
              >
                {sending && <Loader2 className="size-4 animate-spin" />}
                {sending ? "Enviando…" : "Enviar mi reseña"}
              </Button>
              <p className="text-center text-xs text-[#8a7350]">
                Reseñas con honestidad playera 🐚 El shack puede moderar el
                contenido ofensivo.
              </p>
            </SheetFooter>
          </>
        )}
      </SheetContent>
    </Sheet>
  );
}
