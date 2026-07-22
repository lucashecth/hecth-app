// src/components/PixQrCodeModal.tsx
"use client";

import { useState, useEffect } from 'react';
import { createPortal } from 'react-dom';

interface PixQrCodeModalProps {
  isOpen: boolean;
  onClose: () => void;
  tipo: 'uniformes' | 'mensalidade' | null;
}

export function PixQrCodeModal({ isOpen, onClose, tipo }: PixQrCodeModalProps) {
  const [mounted, setMounted] = useState(false);

  useEffect(() => {
    setMounted(true);
  }, []);

  if (!isOpen || !mounted || !tipo) return null;

  const isUniformes = tipo === 'uniformes';
  const titulo = isUniformes ? 'QR Code PIX - Uniformes' : 'QR Code PIX - Mensalidade';
  const subtitulo = isUniformes 
    ? 'Aponte o app do banco para pagar seus Uniformes' 
    : 'Aponte o app do banco para pagar sua Mensalidade';
  const imageSrc = isUniformes ? '/qrcode-uniformes.png' : '/qrcode-mensalidade.png';

  const modalContent = (
    <div 
      onClick={onClose}
      className="fixed inset-0 bg-black/85 backdrop-blur-md z-[99999] flex items-center justify-center p-5"
    >
      <div 
        onClick={(e) => e.stopPropagation()}
        className="bg-[#121212] border border-white/10 rounded-3xl p-6 max-w-sm w-full text-center shadow-2xl relative flex flex-col items-center animacao-entrada"
      >
        <button 
          onClick={onClose} 
          className="absolute top-4 right-4 text-white/40 hover:text-white font-black text-base p-1 transition-colors"
        >
          ✕
        </button>

        <div className="w-12 h-12 rounded-2xl bg-teal-500/10 border border-teal-500/20 flex items-center justify-center text-teal-400 mb-3 text-xl font-black">
          ❖
        </div>

        <h3 className="font-black text-xl text-white uppercase italic tracking-tight mb-1">
          {titulo}
        </h3>
        <p className="text-[10px] text-white/50 font-black uppercase tracking-widest mb-6">
          {subtitulo}
        </p>

        {/* High contrast QR Code Image Display */}
        <div className="bg-white p-4 rounded-2xl shadow-2xl mb-6 flex items-center justify-center border border-white/20">
          <img 
            src={imageSrc} 
            alt={titulo} 
            className="w-64 h-64 object-contain rounded-lg"
          />
        </div>

        <button 
          onClick={onClose}
          className="w-full bg-[#ef3340] text-white text-xs font-black uppercase tracking-widest py-3.5 rounded-xl active:scale-95 transition-all shadow-[0_0_20px_rgba(239,51,64,0.3)]"
        >
          Fechar
        </button>
      </div>
    </div>
  );

  return createPortal(modalContent, document.body);
}
