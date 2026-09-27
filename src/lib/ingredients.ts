/* ------------------------------------------------------------------ */
/*  Ingredientes que el cliente puede quitar («sin mostaza»).          */
/*  Solo salsas, vegetales y toppings: la base del plato no se quita.  */
/* ------------------------------------------------------------------ */

const REMOVABLE =
  /vegetal|lechuga|tomate|cebolla|ketchup|mostaza|mayonesa|salsa|chips|queso|jamon|pina|hielo|crema batida|menta|rodaja|leche condensada|chorro de leche|semillas/;

function norm(s: string): string {
  return s.toLowerCase().normalize("NFD").replace(/[̀-ͯ]/g, "");
}

export function canRemoveIngredient(name: string): boolean {
  return REMOVABLE.test(norm(name));
}

/** Ingredientes quitables de un producto, sin repetidos y en su orden */
export function removableOf(ingredients: string[]): string[] {
  return [...new Set(ingredients.filter(canRemoveIngredient))];
}

const lower = (s: string) => s.charAt(0).toLowerCase() + s.slice(1);

/** ["Mostaza", "Ketchup"] → «Sin mostaza y ketchup» */
export function sinText(list: string[]): string {
  if (!list.length) return "";
  const names = list.map(lower);
  const last = names.pop();
  return `Sin ${names.length ? `${names.join(", ")} y ${last}` : last}`;
}
