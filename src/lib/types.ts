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
