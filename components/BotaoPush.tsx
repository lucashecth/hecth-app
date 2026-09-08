"use client";
import { useState, useEffect } from 'react';

interface BotaoPushProps {
  email?: string;
}

function urlBase64ToUint8Array(base64String: string) {
  try {
    const padding = '='.repeat((4 - base64String.length % 4) % 4);
    const base64 = (base64String + padding).replace(/\-/g, '+').replace(/_/g, '/');
    const rawData = window.atob(base64);
    const outputArray = new Uint8Array(rawData.length);
    for (let i = 0; i < rawData.length; ++i) {
      outputArray[i] = rawData.charCodeAt(i);
    }
    return outputArray;
  } catch (e) {
    return new Uint8Array();
  }
}

const PUSH_SYNC_VERSION_KEY = 'hecth_push_sync_v2_3';

export function BotaoPush({ email }: BotaoPushProps) {
  const [suportado, setSuportado] = useState(false);
  const [permissao, setPermissao] = useState<string>('default');
  const [loading, setLoading] = useState(false);
  const [registrado, setRegistrado] = useState(false);
  const [showPromptModal, setShowPromptModal] = useState(false);

  useEffect(() => {
    try {
      if (typeof window !== "undefined" && "Notification" in window && "serviceWorker" in navigator) {
        setSuportado(true);
        setPermissao(Notification.permission);
        
        let jaSincronizouV2 = false;
        try {
          jaSincronizouV2 = localStorage.getItem(PUSH_SYNC_VERSION_KEY) === 'true';
        } catch (e) {}

        if (Notification.permission === 'granted' && jaSincronizouV2) {
          setRegistrado(true);
        } else if (email) {
          setShowPromptModal(true);
        }
      } else {
        setSuportado(false);
      }
    } catch (e) {
      console.warn("Navegador não suporta notificações nativas:", e);
      setSuportado(false);
    }
  }, [email]);

  const pedirPermissao = async () => {
    if (!email) return alert('Faça login para ativar as notificações.');
    if (typeof window === "undefined" || !("Notification" in window) || !("serviceWorker" in navigator)) {
      setShowPromptModal(false);
      return alert('Este dispositivo ou versão do iOS não possui suporte a notificações web nativas.');
    }

    setLoading(true);
    try {
      const permission = await Notification.requestPermission();
      setPermissao(permission);

      if (permission === 'granted') {
        const reg = await navigator.serviceWorker.register('/sw.js');
        await navigator.serviceWorker.ready;

        const keyRes = await fetch('/api/push/public-key');
        const keyData = await keyRes.json();
        const publicVapidKey = keyData.publicKey;
        if (!publicVapidKey) {
          throw new Error('Chave VAPID pública não encontrada.');
        }

        let existingSub = await reg.pushManager.getSubscription();
        if (existingSub) {
          try { await existingSub.unsubscribe(); } catch (e) {}
        }

        const subscription = await reg.pushManager.subscribe({
          userVisibleOnly: true,
          applicationServerKey: urlBase64ToUint8Array(publicVapidKey)
        });

        const res = await fetch('/api/push/register', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({ email, subscription })
        });

        if (!res.ok) throw new Error('Falha ao registrar inscrição no servidor');
        
        try {
          localStorage.setItem(PUSH_SYNC_VERSION_KEY, 'true');
        } catch (e) {}

        setRegistrado(true);
        setShowPromptModal(false);
        alert('🔔 Notificações ativadas e atualizadas com sucesso no seu aparelho!');
      } else if (permission === 'denied') {
        setShowPromptModal(false);
        alert('Você negou a permissão no navegador. Ative nas configurações do seu celular/navegador para receber avisos.');
      }
    } catch (e: any) {
      console.error("Erro ao ativar push nativo:", e);
      alert("Erro ao ativar notificações: " + e.message);
    } finally {
      setLoading(false);
    }
  };

  // Se o navegador/iOS não suportar notificações (ex: iOS 16.2 ou navegador sem push), não renderiza nada e não trava a página
  if (!suportado) {
    return null;
  }

  return (
    <>
      {/* POPUP / MODAL OBRIGATÓRIO NA FRENTE DA TELA */}
      {showPromptModal && (
        <div className="fixed inset-0 z-[999] bg-black/85 backdrop-blur-md flex items-center justify-center p-4">
          <div className="bg-[#181818] border border-white/10 p-6 md:p-8 rounded-[2rem] max-w-sm w-full animacao-entrada text-center shadow-2xl relative">
            <div className="w-16 h-16 rounded-full bg-[#ef3340]/20 text-[#ef3340] border border-[#ef3340]/30 flex items-center justify-center mx-auto mb-4 animate-bounce">
              <svg xmlns="http://www.w3.org/2000/svg" width="32" height="32" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.2" strokeLinecap="round" strokeLinejoin="round">
                <path d="M6 8a6 6 0 0 1 12 0c0 7 3 9 3 9H3s3-2 3-9"/><path d="M10.3 21a1.94 1.94 0 0 0 3.4 0"/>
              </svg>
            </div>

            <span className="text-[10px] font-black uppercase tracking-widest text-[#ef3340] bg-[#ef3340]/10 px-3 py-1 rounded-full border border-[#ef3340]/20 inline-block mb-2">
              Atualização Obrigatória
            </span>

            <h3 className="text-white font-black uppercase tracking-tight text-xl leading-tight mb-2">
              Novo Sistema de Notificações
            </h3>

            <p className="text-white/70 text-xs font-semibold leading-relaxed mb-6">
              Implementamos um sistema novo de notificações push para avisos de aulas, abertura de vagas e cancelamentos por chuva.
            </p>

            <div className="flex flex-col gap-3">
              <button
                onClick={pedirPermissao}
                disabled={loading}
                className="w-full bg-gradient-to-r from-orange-500 to-[#ef3340] text-white text-xs font-black uppercase tracking-wider py-4 rounded-xl active:scale-95 transition-all shadow-[0_0_20px_rgba(239,51,64,0.4)] disabled:opacity-50 flex items-center justify-center gap-2"
              >
                {loading ? 'Atualizando Aparelho...' : 'Clique Aqui Para Permitir'}
              </button>

              <button
                onClick={() => setShowPromptModal(false)}
                className="text-white/30 text-[10px] uppercase font-bold tracking-widest hover:text-white/60 py-2"
              >
                Lembrar depois
              </button>
            </div>
          </div>
        </div>
      )}

      {/* BANNER FIXO DA TELA INICIAL */}
      <button 
        onClick={pedirPermissao}
        disabled={loading}
        className={`w-full border rounded-2xl p-4 mb-6 flex items-center justify-between transition-all active:scale-95 group text-left shadow-lg disabled:opacity-55 ${
          registrado 
            ? 'bg-green-500/10 border-green-500/30' 
            : 'bg-[#1a1a1a] border-[#ef3340]/40'
        }`}
      >
        <div className="flex items-center gap-4">
          <div className={`w-10 h-10 rounded-full flex items-center justify-center ${
            registrado ? 'bg-green-500/20 text-green-400' : 'bg-[#ef3340]/20 text-[#ef3340] animate-pulse'
          }`}>
            <svg xmlns="http://www.w3.org/2000/svg" width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
              <path d="M6 8a6 6 0 0 1 12 0c0 7 3 9 3 9H3s3-2 3-9"/><path d="M10.3 21a1.94 1.94 0 0 0 3.4 0"/>
            </svg>
          </div>
          <div>
            <h4 className="text-white font-black uppercase tracking-widest text-sm">
              {registrado ? 'Alertas Ativos' : 'Ligar Alertas'}
            </h4>
            <p className="text-white/50 text-[10px] uppercase font-bold tracking-wider mt-1">
              {registrado ? 'Este aparelho está sincronizado' : 'Clique para sincronizar o novo sistema'}
            </p>
          </div>
        </div>
        <span className={`font-black uppercase tracking-widest text-[10px] px-3 py-1.5 rounded-full ${
          registrado 
            ? 'text-green-400 bg-green-500/20 border border-green-500/30' 
            : 'text-[#ef3340] bg-[#ef3340]/10 border border-[#ef3340]/20'
        }`}>
          {loading ? 'Sincronizando...' : registrado ? '✓ Ativo' : 'Ativar'}
        </span>
      </button>
    </>
  );
}
