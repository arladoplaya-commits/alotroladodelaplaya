import type { Metadata, Viewport } from "next";
import { Lilita_One, Epilogue, Plus_Jakarta_Sans } from "next/font/google";
import "./globals.css";
import { Toaster } from "@/components/ui/sonner";
import { PwaRegister } from "@/components/menu/pwa-register";

const lilitaOne = Lilita_One({
  weight: "400",
  subsets: ["latin"],
  variable: "--font-display",
  display: "swap",
});

const epilogue = Epilogue({
  subsets: ["latin"],
  weight: ["400", "600", "700", "800"],
  variable: "--font-epilogue",
  display: "swap",
});

const plusJakarta = Plus_Jakarta_Sans({
  subsets: ["latin"],
  weight: ["400", "500", "600", "700"],
  variable: "--font-body",
  display: "swap",
});

export const metadata: Metadata = {
  metadataBase: new URL("http://localhost:3000"),
  title: "Al Otro Lado de la Playa · Hamburguesas y Hot Dogs",
  description:
    "Carta del día de Al Otro Lado de la Playa (by Sol & Habana): hamburguesas, perros calientes, baguettes y raciones. Calle 21 e/ 14, Vedado. Pide por WhatsApp.",
  applicationName: "Al Otro Lado",
  manifest: "/manifest.webmanifest",
  icons: {
    icon: "/images/logo.png",
    apple: "/images/icon-192.png",
  },
  openGraph: {
    title: "Al Otro Lado de la Playa · By Sol & Habana",
    description:
      "Hamburguesas, perros calientes, baguettes y raciones con sazón playera. Calle 21 e/ 14, Vedado. Pide por WhatsApp.",
    locale: "es_CU",
    type: "website",
    images: [
      {
        url: "/og.jpg",
        width: 1200,
        height: 630,
        alt: "Al Otro Lado de la Playa",
      },
    ],
  },
  twitter: {
    card: "summary_large_image",
    title: "Al Otro Lado de la Playa · By Sol & Habana",
    description:
      "Hamburguesas, perros calientes, baguettes y raciones con sazón playera. Vedado, La Habana.",
    images: ["/og.jpg"],
  },
};

export const viewport: Viewport = {
  themeColor: "#f6dfb2",
  width: "device-width",
  initialScale: 1,
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html lang="es" suppressHydrationWarning>
      <body
        className={`${lilitaOne.variable} ${epilogue.variable} ${plusJakarta.variable} antialiased bg-[#fdf3e0] font-body text-[#4a3b28]`}
      >
        {children}
        <Toaster position="top-center" richColors theme="light" />
        <PwaRegister />
      </body>
    </html>
  );
}
