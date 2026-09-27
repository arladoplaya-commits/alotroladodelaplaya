/* ------------------------------------------------------------------ */
/*  Nube del negocio (Supabase). Va dentro de la carta para que TODOS  */
/*  los teléfonos de los clientes guarden pedidos y reseñas sin tener  */
/*  que configurar nada.                                               */
/*                                                                     */
/*  La clave «publishable» es pública por diseño: la seguridad la dan  */
/*  las reglas (RLS) del SQL que se ejecuta en Supabase. NUNCA pongas  */
/*  aquí la clave «secret» ni la «service_role».                       */
/*                                                                     */
/*  Se puede cambiar sin tocar código con las variables de entorno     */
/*  NEXT_PUBLIC_SUPABASE_URL y NEXT_PUBLIC_SUPABASE_KEY (Netlify →     */
/*  Site configuration → Environment variables).                       */
/* ------------------------------------------------------------------ */

export const CLOUD_URL =
  process.env.NEXT_PUBLIC_SUPABASE_URL || "https://ftrqvtyiriboxxassvju.supabase.co";

export const CLOUD_KEY =
  process.env.NEXT_PUBLIC_SUPABASE_KEY || "sb_publishable_HG_YhDb8oN4Jzus5RJnswA_tFLmq1d0";
