// src/components/QrCodeBaixarModal.tsx
"use client";

import { useState, useEffect } from 'react';
import { createPortal } from 'react-dom';

interface QrCodeBaixarModalProps {
  isOpen: boolean;
  onClose: () => void;
}

export function QrCodeBaixarModal({ isOpen, onClose }: QrCodeBaixarModalProps) {
  const [mounted, setMounted] = useState(false);

  useEffect(() => {
    setMounted(true);
  }, []);

  if (!isOpen || !mounted) return null;

  const modalContent = (
    <div 
      onClick={onClose}
      className="fixed inset-0 bg-black/85 backdrop-blur-md z-[99999] flex items-center justify-center p-5 animate-fadeIn"
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

        <div className="w-12 h-12 rounded-2xl bg-amber-500/10 border border-amber-500/20 flex items-center justify-center text-amber-400 mb-3 text-xl">
          📥
        </div>

        <h3 className="font-black text-xl text-white uppercase italic tracking-tight mb-1">
          Baixar o App
        </h3>
        <p className="text-[10px] text-white/50 font-black uppercase tracking-widest mb-6">
          Aponte a câmera para baixar o app no seu celular
        </p>

        {/* QR Code Container with white background for high contrast scanning */}
        <div className="bg-white p-4 rounded-2xl shadow-xl mb-6 flex items-center justify-center border border-white/20">
          <img 
            src="/qrcode-baixar.png" 
            alt="Baixar o App HECTH" 
            className="w-56 h-56 object-contain"
          />
        </div>

        <p className="text-[10px] text-white/40 font-bold uppercase tracking-widest leading-relaxed">
          Instalação direta para dispositivos Android e iOS
        </p>
      </div>
    </div>
  );

  return createPortal(modalContent, document.body);
}
