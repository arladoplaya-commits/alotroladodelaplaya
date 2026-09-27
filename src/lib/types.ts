/** Tipos del dominio · Al Otro Lado de la Playa */

export interface Category {
  id: string;
  name: string;
  emoji: string;
  visible: boolean;
}

export interface Product {
  id: string;
  name: string;
  description: string;
  price: number;
  category: string;
  image?: string;
  emoji: string;
  tags: string[];
  available: boolean;
  featured: boolean;
  ingredients: string[];
}

export interface Agrego {
  id: string;
  name: string;
  price: number;
  available: boolean;
}

export interface Settings {
  businessName: string;
  tagline: string;
  whatsapp: string;
  currency: string;
  deliveryPoint: string;
  deliveryTime: string;
  hideSoldOut: boolean;
  adminPassword: string;
  ordersOpen: boolean;
  /** Fotos reales del local subidas desde el panel (opcional) */
  gallery?: GalleryItem[];
  /** Entrega: a domicilio (por zonas) y/o recogida en el local */
  deliveryEnabled: boolean;
  pickupEnabled: boolean;
  zones: DeliveryZone[];
  /** Formas de pago que acepta el negocio */
  payments: PaymentMethod[];
  /** Horario semanal (abre/cierra solo si auto está activo) */
  schedule: Schedule;
  /** Menú del día destacado arriba de la carta */
  daily: DailyMenu;
  /** Dirección pública de la carta (para el código QR). Vacío = la actual */
  publicUrl: string;
}

export interface DeliveryZone {
  id: string;
  name: string;
  /** Precio de la mensajería en MN */
  fee: number;
  active: boolean;
}

export interface PaymentMethod {
  id: string;
  name: string;
  emoji: string;
  /** Datos que ve el cliente (nº de tarjeta, teléfono…) */
  details: string;
  active: boolean;
}

export interface DayHours {
  closed: boolean;
  /** "HH:MM" en 24 h */
  open: string;
  close: string;
}

export interface Schedule {
  auto: boolean;
  /** 0 = domingo … 6 = sábado */
  days: DayHours[];
}

export interface DailyMenu {
  active: boolean;
  title: string;
  note: string;
  productIds: string[];
}

export interface ComboItem {
  productId: string;
  qty: number;
}

export interface Combo {
  id: string;
  name: string;
  emoji: string;
  description: string;
  items: ComboItem[];
  price: number;
  active: boolean;
}

export interface GalleryItem {
  src: string;
  caption: string;
  alt: string;
}

export interface GitHubSync {
  owner: string;
  repo: string;
  branch: string;
  path: string;
}

export interface MenuData {
  version: number;
  updatedAt: string;
  categories: Category[];
  products: Product[];
  agregos: Agrego[];
  combos: Combo[];
  settings: Settings;
  github: GitHubSync;
}

/* ------------------------------ Carrito ------------------------------ */

export interface CartItem {
  id: string;
  productId: string;
  name: string;
  emoji: string;
  qty: number;
  unitPrice: number;
  agregoIds: string[];
  agregoNames: string[];
  /** Ingredientes quitados: «Mostaza», «Ketchup»… */
  removed?: string[];
  /** Si el ítem es un combo, su id */
  comboId?: string;
  notes: string;
}

/* ------------------------------ Pedidos ------------------------------ */

export type OrderStatus = "nuevo" | "confirmado" | "entregado" | "cancelado";

export interface Order {
  id: string;
  code: string;
  name: string;
  address: string;
  items: {
    productId: string;
    name: string;
    qty: number;
    unitPrice: number;
    agregoNames: string[];
    removed?: string[];
    notes: string;
  }[];
  subtotal: number;
  total: number;
  status: OrderStatus;
  createdAt: string;
}

/* ------------------------------ Reseñas ------------------------------ */

export interface Review {
  id: string;
  name: string;
  place: string;
  rating: number;
  text: string;
  createdAt: string;
  hidden?: boolean;
}

/* --------------------------- Supabase (cloud) -------------------------- */

export interface SupaCreds {
  url: string;
  anonKey: string;
}

export type SyncConfig = {
  provider: "none" | "supabase";
  url: string;
  anonKey: string;
};
