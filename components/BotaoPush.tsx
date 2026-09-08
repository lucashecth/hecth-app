"use client";
import { useState, useEffect } from 'react';

interface BotaoPushProps {
  email?: string;
}

function urlBase64ToUint8Array(base64String: string) {
  const padding = '='.repeat((4 - base64String.length % 4) % 4);
  const base64 = (base64String + padding).replace(/\-/g, '+').replace(/_/g, '/');
  const rawData = window.atob(base64);
  const outputArray = new Uint8Array(rawData.length);
  for (let i = 0; i < rawData.length; ++i) {
    outputArray[i] = rawData.charCodeAt(i);
  }
  return outputArray;
}

export function BotaoPush({ email }: BotaoPushProps) {
  const [permissao, setPermissao] = useState<string>('default');
  const [loading, setLoading] = useState(false);
  const [registrado, setRegistrado] = useState(false);

  useEffect(() => {
    if (typeof window !== "undefined" && "Notification" in window) {
      setPermissao(Notification.permission);
      if (Notification.permission === 'granted') {
        setRegistrado(true);
      }
    }
  }, []);

  const pedirPermissao = async () => {
    if (!email) return alert('Faça login para ativar as notificações.');
    if (typeof window === "undefined" || !("Notification" in window) || !("serviceWorker" in navigator)) {
      return alert('Notificações não são suportadas neste navegador/dispositivo.');
    }

    setLoading(true);
    try {
      const permission = await Notification.requestPermission();
      setPermissao(permission);

      if (permission === 'granted') {
        // Registra o Service Worker nativo
        const reg = await navigator.serviceWorker.register('/sw.js');
        await navigator.serviceWorker.ready;

        const keyRes = await fetch('/api/push/public-key');
        const keyData = await keyRes.json();
        const publicVapidKey = keyData.publicKey;
        if (!publicVapidKey) {
          throw new Error('Chave VAPID pública não encontrada.');
        }

        // Limpa inscrição prévia se houver para evitar conflitos
        let existingSub = await reg.pushManager.getSubscription();
        if (existingSub) {
          try { await existingSub.unsubscribe(); } catch (e) {}
        }

        const subscription = await reg.pushManager.subscribe({
          userVisibleOnly: true,
          applicationServerKey: urlBase64ToUint8Array(publicVapidKey)
        });

        // Envia as credenciais para nossa rota de registro local
        const res = await fetch('/api/push/register', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({ email, subscription })
        });

        if (!res.ok) throw new Error('Falha ao registrar inscrição no servidor');
        
        setRegistrado(true);
        alert('🔔 Alertas ativados e sincronizados com sucesso neste aparelho!');
      } else if (permission === 'denied') {
        alert('Você negou a permissão no navegador. Ative nas configurações do seu celular/navegador para receber avisos.');
      }
    } catch (e: any) {
      console.error("Erro ao ativar push nativo:", e);
      alert("Erro ao ativar notificações: " + e.message);
    } finally {
      setLoading(false);
    }
  };

  return (
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
            {registrado ? 'Este aparelho está recebendo avisos' : 'Saiba quando abrir vaga ou avisos'}
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
  );
}