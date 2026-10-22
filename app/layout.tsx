import type { Metadata, Viewport } from "next";
import { Inter, Playfair_Display } from "next/font/google";
import "./globals.css";

const sans = Inter({ subsets: ["latin"], variable: "--font-sans", display: "swap" });
const serif = Playfair_Display({ subsets: ["latin"], variable: "--font-serif", display: "swap" });

export const metadata: Metadata = {
  title: "Restaurant Demo · Cocina colombiana",
  description: "Mira la carta, escanea el QR de tu mesa y llama al mesero desde tu celular.",
};
export const viewport: Viewport = { width: "device-width", initialScale: 1, themeColor: "#7b1e2b" };

export default function RootLayout({ children }: { children: React.ReactNode }) {
  return (
    <html lang="es" className={`${sans.variable} ${serif.variable}`}>
      <body>{children}</body>
    </html>
  );
}
