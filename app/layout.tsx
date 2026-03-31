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
  title: "HECTH.",
  description: "CT Hecth Futevôlei.",
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
        
        {/* ========================================== */}
        {/* CÓDIGO OFICIAL DO ONESIGNAL */}
        {/* ========================================== */}
        <Script src="https://cdn.onesignal.com/sdks/web/v16/OneSignalSDK.page.js" strategy="afterInteractive" />
       <Script id="onesignal-init" strategy="afterInteractive">
          {`
            window.OneSignalDeferred = window.OneSignalDeferred || [];
            OneSignalDeferred.push(async function(OneSignal) {
              await OneSignal.init({
                appId: "8a2576f5-33b1-4791-be60-2c0a5444b633",
                safari_web_id: "web.onesignal.auto.246fdfe2-a404-4d40-aa8a-d2b211d431d5",
                notifyButton: {
                  enable: false,
                },
                // ==========================================
                // NOTIFICAÇÃO DE BOAS-VINDAS CUSTOMIZADA
                // ==========================================
                welcomeNotification: {
                  title: "HECTH.",
                  message: "Obrigado por baixar o nosso app."
                },
                promptOptions: {
                  slidedown: {
                    prompts: [{
                      type: "push",
                      autoPrompt: true,
                      text: {
                        actionMessage: "Ative para receber avisos de vagas e comunicados da HECTH!",
                        acceptButton: "Permitir",
                        cancelButton: "Depois"
                      }
                    }]
                  }
                }
              });
            });
          `}
        </Script>

        {children}
      </body>
    </html>
  );
}