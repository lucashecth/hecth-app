"use client";
import { useState, useEffect } from 'react';

export function BotaoPush() {
  const [permissao, setPermissao] = useState<string>('default');

  useEffect(() => {
    if (typeof window !== "undefined" && "Notification" in window) {
      // Define o status inicial
      setPermissao(Notification.permission);

      // Fica "escutando" a mudança de permissão em tempo real
      const OneSignalDeferred = (window as any).OneSignalDeferred || [];
      OneSignalDeferred.push(function(OneSignal: any) {
        if (OneSignal.Notifications) {
          OneSignal.Notifications.addEventListener("permissionChange", () => {
            setPermissao(Notification.permission);
          });
        }
      });
    }
  }, []);

  const pedirPermissao = () => {
    if (typeof window !== "undefined") {
      const OneSignalDeferred = (window as any).OneSignalDeferred || [];
      OneSignalDeferred.push(async function(OneSignal: any) {
        // Abre o pop-up do OneSignal
        await OneSignal.Slidedown.promptPush({ force: true });
        
        // Fallback: Atualiza o status logo após a janela fechar
        setPermissao(Notification.permission);
      });
    }
  };

  // Se já aceitou ou negou, o componente some da tela na mesma hora
  if (permissao === 'granted' || permissao === 'denied') return null;

  return (
    <button 
      onClick={pedirPermissao}
      className="w-full bg-[#1a1a1a] border border-[#ef3340]/40 rounded-2xl p-4 mb-6 flex items-center justify-between transition-all active:scale-95 group text-left shadow-lg"
    >
      <div className="flex items-center gap-4">
        <div className="w-10 h-10 rounded-full bg-[#ef3340]/20 flex items-center justify-center text-[#ef3340] animate-pulse">
          <svg xmlns="http://www.w3.org/2000/svg" width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
            <path d="M6 8a6 6 0 0 1 12 0c0 7 3 9 3 9H3s3-2 3-9"/><path d="M10.3 21a1.94 1.94 0 0 0 3.4 0"/>
          </svg>
        </div>
        <div>
          <h4 className="text-white font-black uppercase tracking-widest text-sm">Ligar Alertas</h4>
          <p className="text-white/50 text-[10px] uppercase font-bold tracking-wider mt-1">Saiba quando abrir vaga</p>
        </div>
      </div>
      <span className="text-[#ef3340] font-black uppercase tracking-widest text-xs bg-[#ef3340]/10 px-3 py-1 rounded-full">Ativar</span>
    </button>
  );
}