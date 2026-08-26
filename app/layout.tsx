// src/app/layout.tsx
import type { Metadata, Viewport } from "next";
import { Inter } from "next/font/google";
import Script from "next/script"; // <-- IMPORTAÇÃO DO SCRIPT DO NEXT.JS
import "./globals.css";

const inter = Inter({ subsets: ["latin"] });

// ==========================================
// CONFIGURAÇÃO DE CORES E TELA (UX NATIVA)
// ==========================================
export const viewport: Viewport = {
  themeColor: "#ef3340",
  width: "device-width",
  initialScale: 1,
  maximumScale: 1, 
  userScalable: false,
};

// ==========================================
// CONFIGURAÇÃO DOS ÍCONES E MANIFEST (PWA)
// ==========================================
export const metadata: Metadata = {
  title: "HECTH",
  description: "CT Hecth Futevôlei",
  manifest: "/manifest.json", 
  icons: {
    icon: "/icon.png", 
    shortcut: "/icon.png",
    apple: "/apple-touch-icon.png", 
  },
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html lang="pt-BR">
      <body className={`${inter.className} bg-black text-white antialiased`}>
        


        {children}
      </body>
    </html>
  );
}