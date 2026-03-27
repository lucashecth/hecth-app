// src/app/layout.tsx
import type { Metadata } from "next";
import { Inter } from "next/font/google";
import "./globals.css";

const inter = Inter({ subsets: ["latin"] });

// ==========================================
// CONFIGURAÇÃO DOS ÍCONES PARA CELULAR
// ==========================================
export const metadata: Metadata = {
  title: "HECTH.",
  description: "CT Hecth Futevôlei.",
  // AQUI ESTÁ A CHAVE PARA OS ÍCONES NO CELULAR
  icons: {
    icon: "/icon.png", // Favicon padrão (opcional, pode criar um icon.png de 192x192)
    shortcut: "/icon.png",
    apple: "/apple-touch-icon.png", // Ícone vital para iPhone ("Adicionar à Tela de Início")
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