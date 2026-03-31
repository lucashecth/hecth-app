"use client";
import { useState, useEffect } from 'react';

export function InstallAppCard() {
  const [isInstalled, setIsInstalled] = useState(true); // Começa como true para evitar piscar na tela
  const [isIOS, setIsIOS] = useState(false);
  const [deferredPrompt, setDeferredPrompt] = useState<any>(null);
  const [showTutorial, setShowTutorial] = useState(false);

  useEffect(() => {
    // 1. Verifica se já está instalado (roda como aplicativo independente)
    const isStandalone = window.matchMedia('(display-mode: standalone)').matches || (window.navigator as any).standalone;
    setIsInstalled(isStandalone);

    // 2. Descobre se é um iPhone/iPad
    const userAgent = window.navigator.userAgent.toLowerCase();
    const isAppleDevice = /iphone|ipad|ipod/.test(userAgent);
    setIsIOS(isAppleDevice);

    // 3. Captura o evento nativo de instalação do Android
    const handleBeforeInstallPrompt = (e: any) => {
      e.preventDefault(); // Impede o navegador de mostrar a barrinha padrão chata
      setDeferredPrompt(e); // Guarda o evento para usarmos no nosso botão
    };

    window.addEventListener('beforeinstallprompt', handleBeforeInstallPrompt);

    // 4. Escuta se a instalação foi concluída com sucesso para sumir com o botão
    window.addEventListener('appinstalled', () => {
      setIsInstalled(true);
    });

    return () => {
      window.removeEventListener('beforeinstallprompt', handleBeforeInstallPrompt);
    };
  }, []);

  // Se já está instalado, o componente simplesmente não renderiza nada
  if (isInstalled) return null;
  // Se não é iOS e não tem o evento do Android (ex: está no PC), não mostra
  if (!isIOS && !deferredPrompt) return null;

  const handleInstallClick = async () => {
    if (isIOS) {
      // Abre o tutorial mastigado para iPhone
      setShowTutorial(true);
    } else if (deferredPrompt) {
      // Mostra a janela nativa de instalação do Android
      deferredPrompt.prompt();
      const { outcome } = await deferredPrompt.userChoice;
      if (outcome === 'accepted') {
        setIsInstalled(true);
      }
      setDeferredPrompt(null);
    }
  };

  return (
    <>
      {/* BOTÃO/CARD DE INSTALAÇÃO NA TELA INICIAL */}
      <button 
        onClick={handleInstallClick}
        className="w-full bg-gradient-to-r from-[#ef3340]/20 to-[#ef3340]/5 border border-[#ef3340]/30 rounded-2xl p-4 mb-8 flex items-center justify-between transition-all active:scale-95 group text-left"
      >
        <div className="flex items-center gap-4">
          <div className="w-12 h-12 rounded-full bg-[#ef3340]/20 flex items-center justify-center text-[#ef3340]">
            <svg xmlns="http://www.w3.org/2000/svg" width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
              <path d="M21 15v4a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2v-4"/><polyline points="7 10 12 15 17 10"/><line x1="12" x2="12" y1="15" y2="3"/>
            </svg>
          </div>
          <div>
            <h4 className="text-white font-black uppercase tracking-widest text-sm">Instalar App</h4>
            <p className="text-white/50 text-[10px] uppercase font-bold tracking-wider mt-1">Acesso rápido e notificações</p>
          </div>
        </div>
        <span className="text-[#ef3340] font-black uppercase tracking-widest text-xs group-hover:underline">Baixar</span>
      </button>

      {/* MODAL DE TUTORIAL PARA iPHONE (Só aparece se showTutorial for true) */}
      {showTutorial && (
        <div className="fixed inset-0 z-[100] bg-black/90 backdrop-blur-sm flex items-end justify-center pb-10 px-5 animacao-entrada">
          <div className="bg-[#121212] w-full max-w-md rounded-3xl p-6 border border-white/10 shadow-2xl relative">
            
            <button onClick={() => setShowTutorial(false)} className="absolute top-4 right-4 text-white/40 hover:text-white p-2">
              <svg xmlns="http://www.w3.org/2000/svg" width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><path d="M18 6 6 18"/><path d="m6 6 12 12"/></svg>
            </button>

            <h3 className="text-xl font-black uppercase tracking-tighter text-white mb-6 mt-2">Instalar no iPhone</h3>
            
            <div className="space-y-6">
              <div className="flex gap-4 items-start">
                <div className="w-8 h-8 rounded-full bg-white/5 flex items-center justify-center text-white font-black flex-shrink-0">1</div>
                <p className="text-sm text-white/70 leading-relaxed font-medium">
                  Toque no ícone de <strong>Compartilhar</strong> na barra inferior do Safari.
                  <span className="block mt-2 text-[#ef3340] bg-[#ef3340]/10 border border-[#ef3340]/20 rounded p-2 w-fit">
                    <svg xmlns="http://www.w3.org/2000/svg" width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" className="inline mr-2"><path d="M4 12v8a2 2 0 0 0 2 2h12a2 2 0 0 0 2-2v-8"/><polyline points="16 6 12 2 8 6"/><line x1="12" x2="12" y1="2" y2="15"/></svg>
                    Compartilhar
                  </span>
                </p>
              </div>

              <div className="flex gap-4 items-start">
                <div className="w-8 h-8 rounded-full bg-white/5 flex items-center justify-center text-white font-black flex-shrink-0">2</div>
                <p className="text-sm text-white/70 leading-relaxed font-medium">
                  Role a lista para baixo e toque em <strong>Adicionar à Tela de Início</strong>.
                  <span className="block mt-2 text-white bg-white/10 border border-white/20 rounded p-2 w-fit">
                    <svg xmlns="http://www.w3.org/2000/svg" width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" className="inline mr-2"><rect width="18" height="18" x="3" y="3" rx="2"/><path d="M12 8v8"/><path d="M8 12h8"/></svg>
                    Adicionar à Tela de Início
                  </span>
                </p>
              </div>
            </div>

            <button onClick={() => setShowTutorial(false)} className="w-full bg-white text-black font-black uppercase tracking-widest text-xs py-4 rounded-2xl mt-8 hover:bg-gray-200 transition-colors">
              Entendi
            </button>
            <div className="absolute -bottom-4 left-1/2 transform -translate-x-1/2 text-white/40 animate-bounce">
              <svg xmlns="http://www.w3.org/2000/svg" width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><path d="M12 5v14"/><path d="m19 12-7 7-7-7"/></svg>
            </div>
          </div>
        </div>
      )}
    </>
  );
}