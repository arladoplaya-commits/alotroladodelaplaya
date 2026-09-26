import { WaveRule } from "./beach-scene";

/**
 * Título de sección centrado: grande, negro, en mayúsculas y con
 * ondulaciones a los lados para que el nombre de la categoría se lea
 * claro sobre la arena (y brille en tono melocotón en el atardecer).
 */
export function CatTitle({
  emoji,
  children,
}: {
  emoji?: string;
  children: React.ReactNode;
}) {
  return (
    <h2 className="aol-h aol-cat mb-3 flex items-center justify-center gap-2.5 text-center font-display text-2xl font-black uppercase leading-tight tracking-wide sm:text-3xl">
      <WaveRule className="aol-cat-rule h-3.5 w-9 shrink-0 sm:w-14" />
      {emoji && (
        <span aria-hidden="true" className="text-[1.15em]">
          {emoji}
        </span>
      )}
      <span>{children}</span>
      <WaveRule flip className="aol-cat-rule h-3.5 w-9 shrink-0 sm:w-14" />
    </h2>
  );
}
