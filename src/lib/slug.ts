/* ------------------------------------------------------------------ */
/*  Slugs para las páginas propias de cada producto (/producto/slug).  */
/*  Se calculan del nombre: no hace falta guardar nada nuevo, y si el   */
/*  negocio cambia el nombre, la URL vieja simplemente deja de existir  */
/*  (Google la vuelve a indexar sola cuando encuentra la nueva).        */
/* ------------------------------------------------------------------ */

export function slugify(text: string): string {
  return text
    .toLowerCase()
    .normalize("NFD")
    .replace(/[̀-ͯ]/g, "") // acentos
    .replace(/[^a-z0-9]+/g, "-")
    .replace(/^-+|-+$/g, "")
    .slice(0, 60);
}

export function productSlug(p: { id: string; name: string }): string {
  return slugify(p.name) || slugify(p.id);
}

export function findProductBySlug<T extends { id: string; name: string }>(
  products: T[],
  slug: string
): T | undefined {
  return (
    products.find((p) => productSlug(p) === slug) ??
    products.find((p) => p.id === slug)
  );
}
