// src/app/layout.tsx
import type { Metadata, Viewport } from "next";
import { Inter } from "next/font/google";
import "./globals.css";

const inter = Inter({ subsets: ["latin"] });

// ==========================================
// CONFIGURAÇÃO DE CORES E TELA (UX NATIVA)
// ==========================================
export const viewport: Viewport = {
  themeColor: "#ef3340", // Cor da barra de status no Android
  width: "device-width",
  initialScale: 1,
  maximumScale: 1, // Impede o zoom na tela, dando cara de App nativo
  userScalable: false,
};

// ==========================================
// CONFIGURAÇÃO DOS ÍCONES E MANIFEST (PWA)
// ==========================================
export const metadata: Metadata = {
  title: "HECTH.",
  description: "CT Hecth Futevôlei.",
  manifest: "/manifest.json", // <-- A MÁGICA DO ANDROID AQUI
  icons: {
    icon: "/icon.png", // Favicon padrão
    shortcut: "/icon.png",
    apple: "/apple-touch-icon.png", // Ícone vital para iPhone
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