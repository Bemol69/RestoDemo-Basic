import type { Metadata, Viewport } from "next";
import "./globals.css";

export const metadata: Metadata = {
  title: "MenuQR · Carta digital para restaurantes",
  description: "Carta digital con fotos y video, pedidos desde la mesa por QR y panel en tiempo real para tu restaurante.",
};
export const viewport: Viewport = { width: "device-width", initialScale: 1 };

export default function RootLayout({ children }: { children: React.ReactNode }) {
  return (
    <html lang="es">
      <body>{children}</body>
    </html>
  );
}
