"use client";

import { AdminView } from "@/components/admin/admin-view";

/* Panel del negocio: ruta propia (/admin) para que su código (pestañas,
   editor de productos, publicar…) se descargue solo aquí, nunca en la
   carta pública que abren los clientes. */

export default function AdminPage() {
  return <AdminView />;
}
