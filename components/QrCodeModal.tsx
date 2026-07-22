// src/components/QrCodeModal.tsx
"use client";

import { useState, useEffect } from 'react';
import { createPortal } from 'react-dom';

interface QrCodeModalProps {
  isOpen: boolean;
  onClose: () => void;
}

export function QrCodeModal({ isOpen, onClose }: QrCodeModalProps) {
  const [mounted, setMounted] = useState(false);
  const [copiado, setCopiado] = useState(false);
  const [appUrl, setAppUrl] = useState('');

  useEffect(() => {
    setMounted(true);
    if (typeof window !== 'undefined') {
      setAppUrl(window.location.origin);
    }
  }, []);

  const handleCopiarLink = () => {
    if (!appUrl) return;
    navigator.clipboard.writeText(appUrl);
    setCopiado(true);
    setTimeout(() => setCopiado(false), 2000);
  };

  if (!isOpen || !mounted) return null;

  const qrImageUrl = `https://api.qrserver.com/v1/create-qr-code/?size=300x300&data=${encodeURIComponent(appUrl || 'https://hecth.app')}`;

  const modalContent = (
    <div 
      onClick={onClose}
      className="fixed inset-0 bg-black/85 backdrop-blur-md z-[99999] flex items-center justify-center p-5"
    >
      <div 
        onClick={(e) => e.stopPropagation()}
        className="bg-[#121212] border border-white/10 rounded-3xl p-6 max-w-sm w-full text-center shadow-2xl relative flex flex-col items-center"
      >
        <button 
          onClick={onClose} 
          className="absolute top-4 right-4 text-white/40 hover:text-white font-black text-base p-1 transition-colors"
        >
          ✕
        </button>

        <div className="w-12 h-12 rounded-2xl bg-purple-500/10 border border-purple-500/20 flex items-center justify-center text-purple-400 mb-3 text-xl">
          📱
        </div>

        <h3 className="font-black text-xl text-white uppercase italic tracking-tight mb-1">
          QR Code HECTH
        </h3>
        <p className="text-[10px] text-white/50 font-black uppercase tracking-widest mb-6">
          Aponte a câmera do celular para abrir o WebApp
        </p>

        {/* QR Code Container with white background for high contrast scanning */}
        <div className="bg-white p-4 rounded-2xl shadow-xl mb-6 flex items-center justify-center border border-white/20">
          <img 
            src={qrImageUrl} 
            alt="QR Code do App HECTH" 
            className="w-56 h-56 object-contain"
          />
        </div>

        <p className="text-xs text-white/80 font-bold tracking-tight mb-4 break-all bg-white/5 px-3 py-2 rounded-xl border border-white/5 w-full">
          {appUrl || 'Carregando URL...'}
        </p>

        <button 
          onClick={handleCopiarLink}
          className="w-full bg-[#ef3340] text-white text-xs font-black uppercase tracking-widest py-3.5 rounded-xl active:scale-95 transition-all shadow-[0_0_20px_rgba(239,51,64,0.3)]"
        >
          {copiado ? '✓ Link Copiado!' : 'Copiar Link do App'}
        </button>
      </div>
    </div>
  );

  return createPortal(modalContent, document.body);
}
