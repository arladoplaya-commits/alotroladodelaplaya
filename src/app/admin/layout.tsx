import type { Metadata } from "next";

export const metadata: Metadata = {
  title: "Panel · Al Otro Lado de la Playa",
  robots: { index: false, follow: false },
};

export default function AdminLayout({ children }: { children: React.ReactNode }) {
  return children;
}
