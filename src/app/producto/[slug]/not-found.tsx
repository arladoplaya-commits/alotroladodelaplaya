import Link from "next/link";

export default function ProductNotFound() {
  return (
    <main className="mx-auto flex min-h-dvh max-w-lg flex-col items-center justify-center gap-3 bg-[#fdf3e0] px-6 text-center text-[#4a3b28]">
      <span className="text-5xl" aria-hidden="true">
        🐚
      </span>
      <h1 className="font-display text-2xl text-[#c2542f]">Ese antojo ya no está</h1>
      <p className="text-sm text-[#8a7350]">
        Puede que cambió de nombre o salió de la carta. Mira el resto de antojos playeros.
      </p>
      <Link
        href="/"
        className="mt-2 inline-flex h-11 items-center justify-center rounded-2xl bg-[#e2574c] px-5 text-sm font-extrabold text-white hover:bg-[#d34a40]"
      >
        🌊 Ver la carta
      </Link>
    </main>
  );
}
