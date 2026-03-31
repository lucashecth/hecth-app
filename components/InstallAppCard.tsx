"use client";
import { useState, useEffect } from 'react';

export function InstallAppCard() {
  const [isInstalled, setIsInstalled] = useState(true); 
  const [isIOS, setIsIOS] = useState(false);
  const [isAndroid, setIsAndroid] = useState(false);
  const [deferredPrompt, setDeferredPrompt] = useState<any>(null);
  const [showTutorial, setShowTutorial] = useState(false);

  useEffect(() => {
    const isStandalone = window.matchMedia('(display-mode: standalone)').matches || (window.navigator as any).standalone;
    setIsInstalled(isStandalone);

    const userAgent = window.navigator.userAgent.toLowerCase();
    setIsIOS(/iphone|ipad|ipod/.test(userAgent));
    setIsAndroid(/android/.test(userAgent));

    const handleBeforeInstallPrompt = (e: any) => {
      e.preventDefault(); 
      setDeferredPrompt(e); 
    };

    window.addEventListener('beforeinstallprompt', handleBeforeInstallPrompt);
    window.addEventListener('appinstalled', () => setIsInstalled(true));

    return () => window.removeEventListener('beforeinstallprompt', handleBeforeInstallPrompt);
  }, []);

  if (isInstalled) return null;
  if (!isIOS && !isAndroid) return null;

  const handleInstallClick = async () => {
    if (isIOS) {
      setShowTutorial(true);
    } else if (isAndroid) {
      if (deferredPrompt) {
        deferredPrompt.prompt();
        const { outcome } = await deferredPrompt.userChoice;
        if (outcome === 'accepted') setIsInstalled(true);
        setDeferredPrompt(null);
      } else {
        alert("O Android precisa do arquivo manifest.json configurado para liberar o download. Faremos isso em seguida!");
      }
    }
  };

  return (
    <>
      {/* BOTÃO DA TELA INICIAL */}
      <button 
        onClick={handleInstallClick}
        className="w-full bg-[#121212] border border-[#ef3340]/30 rounded-3xl p-5 mb-8 flex items-center justify-between transition-all active:scale-95 group text-left shadow-lg relative overflow-hidden"
      >
        <div className="absolute -right-10 -top-10 w-32 h-32 bg-[#ef3340]/10 rounded-full blur-2xl pointer-events-none"></div>
        
        <div className="flex items-center gap-4 relative z-10">
          <div className="w-12 h-12 rounded-full bg-[#ef3340]/20 flex items-center justify-center text-[#ef3340] border border-[#ef3340]/30">
            <svg xmlns="http://www.w3.org/2000/svg" width="22" height="22" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
              <path d="M21 15v4a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2v-4"/><polyline points="7 10 12 15 17 10"/><line x1="12" x2="12" y1="15" y2="3"/>
            </svg>
          </div>
          <div>
            <h4 className="text-white font-black uppercase tracking-widest text-sm">Instalar Aplicativo</h4>
            <p className="text-white/40 text-[10px] uppercase font-bold tracking-wider mt-1">Mais rápido e sem navegador</p>
          </div>
        </div>
      </button>

      {/* MODAL DE TUTORIAL PARA iPHONE (Agora colado no topo: items-start pt-16) */}
      {showTutorial && (
        <div className="fixed inset-0 z-[100] bg-black/90 backdrop-blur-sm flex items-start justify-center p-5 pt-16 overflow-y-auto animacao-entrada">
          <div className="bg-[#121212] w-full max-w-sm rounded-3xl p-6 border border-white/10 shadow-2xl relative mb-10">
            
            <button onClick={() => setShowTutorial(false)} className="absolute top-4 right-4 text-white/40 hover:text-white p-2">
              <svg xmlns="http://www.w3.org/2000/svg" width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><path d="M18 6 6 18"/><path d="m6 6 12 12"/></svg>
            </button>

            <h3 className="text-xl font-black uppercase tracking-tighter text-white mb-6 mt-2">Instalar no iPhone</h3>
            
            <div className="space-y-5">
              
              <div className="flex gap-4 items-start">
                <div className="w-8 h-8 rounded-full bg-white/5 flex items-center justify-center text-[#ef3340] font-black flex-shrink-0 border border-[#ef3340]/20">1</div>
                <p className="text-sm text-white/70 leading-relaxed font-medium">
                  Toque nas <strong>Reticências (...)</strong> no canto inferior direito.
                </p>
              </div>

              <div className="flex gap-4 items-start">
                <div className="w-8 h-8 rounded-full bg-white/5 flex items-center justify-center text-[#ef3340] font-black flex-shrink-0 border border-[#ef3340]/20">2</div>
                <p className="text-sm text-white/70 leading-relaxed font-medium">
                  Selecione a opção <strong>Compartilhar</strong>.
                </p>
              </div>

              <div className="flex gap-4 items-start">
                <div className="w-8 h-8 rounded-full bg-white/5 flex items-center justify-center text-[#ef3340] font-black flex-shrink-0 border border-[#ef3340]/20">3</div>
                <p className="text-sm text-white/70 leading-relaxed font-medium">
                  Toque em <strong>Ver mais</strong> e depois em <strong>Adicionar à Tela de Início</strong>.
                  <span className="block mt-3 text-white bg-white/5 border border-white/10 rounded-lg p-3 w-fit text-xs font-bold tracking-wider">
                    <svg xmlns="http://www.w3.org/2000/svg" width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" className="inline mr-2"><rect width="18" height="18" x="3" y="3" rx="2"/><path d="M12 8v8"/><path d="M8 12h8"/></svg>
                    Adicionar à Tela de Início
                  </span>
                </p>
              </div>

            </div>

            <button onClick={() => setShowTutorial(false)} className="w-full bg-[#ef3340] text-white font-black uppercase tracking-widest text-xs py-4 rounded-2xl mt-8 hover:bg-red-600 transition-colors active:scale-95">
              Entendi, vou instalar!
            </button>
          </div>
        </div>
      )}
    </>
  );
}