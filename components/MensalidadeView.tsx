// src/components/MensalidadeView.tsx
"use client";
import { useState } from 'react';

interface MensalidadeViewProps {
  onVoltar: () => void;
  alunoDb: any;
}

export function MensalidadeView({ onVoltar, alunoDb }: MensalidadeViewProps) {
  const [planoIdx, setPlanoIdx] = useState(0);
  const [autoRenovar, setAutoRenovar] = useState(true);

  const planos = [
    {
      freq: 2,
      nome: "2x na Semana",
      preco: "180,00",
      corBase: "text-cyan-400",
      bgGradiente: "from-blue-600 to-cyan-400",
      sombraNeon: "shadow-[0_0_30px_rgba(34,211,238,0.5)]",
      brilhoFundo: "bg-cyan-900/20",
      posicao: "0%"
    },
    {
      freq: 3,
      nome: "3x na Semana",
      preco: "220,00",
      corBase: "text-fuchsia-400",
      bgGradiente: "from-purple-600 to-fuchsia-500",
      sombraNeon: "shadow-[0_0_30px_rgba(232,121,249,0.5)]",
      brilhoFundo: "bg-fuchsia-900/20",
      posicao: "50%"
    },
    {
      freq: 5,
      nome: "Passe Livre (5x)",
      preco: "280,00",
      corBase: "text-[#ef3340]",
      bgGradiente: "from-orange-500 to-[#ef3340]",
      sombraNeon: "shadow-[0_0_40px_rgba(239,51,64,0.6)]",
      brilhoFundo: "bg-[#ef3340]/20",
      posicao: "100%"
    }
  ];

  const planoAtivo = planos[planoIdx];

  return (
    <div className={`animacao-entrada w-full min-h-screen pb-20 pt-4 transition-colors duration-700 ${planoAtivo.brilhoFundo} relative overflow-x-hidden`}>
      
      {/* Brilho Radial no Fundo da Tela (Vazando para as bordas) */}
      <div 
        className={`absolute top-1/4 left-1/2 -translate-x-1/2 -translate-y-1/2 w-[150vw] h-[500px] rounded-full blur-[100px] transition-colors duration-700 -z-10 bg-gradient-to-b ${planoAtivo.bgGradiente} opacity-20`}
      ></div>

      {/* HEADER */}
      <div className="flex items-center gap-4 mb-10 px-5 z-10 relative">
        <button onClick={onVoltar} className="p-3 bg-white/5 rounded-full text-white/50 active:scale-95 transition-transform backdrop-blur-sm">
          <svg xmlns="http://www.w3.org/2000/svg" width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="3" strokeLinecap="round" strokeLinejoin="round"><path d="m15 18-6-6 6-6"/></svg>
        </button>
        <div>
          <h2 className="text-2xl font-black uppercase italic tracking-tighter text-white leading-none">Seu Plano</h2>
          <span className="text-[10px] font-black uppercase tracking-widest text-white/40">Escolha a frequência</span>
        </div>
      </div>

      <div className="px-5 z-10 relative flex flex-col items-center">
        
        {/* CARD PRINCIPAL DO VALOR */}
        <div className={`w-full bg-[#121212]/80 backdrop-blur-xl border border-white/10 rounded-[2rem] p-8 text-center transition-all duration-500 ${planoAtivo.sombraNeon} mb-12`}>
          <p className="text-white/40 text-[10px] font-black uppercase tracking-[0.3em] mb-2">Mensalidade</p>
          <div className="flex items-start justify-center gap-1">
            <span className={`text-xl font-bold mt-2 ${planoAtivo.corBase} transition-colors duration-500`}>R$</span>
            <span className="text-7xl font-black italic tracking-tighter text-white">
              {planoAtivo.preco.split(',')[0]}
            </span>
            <span className="text-xl font-bold mt-2 text-white/40">,{planoAtivo.preco.split(',')[1]}</span>
          </div>
          <h3 className={`text-lg font-black uppercase tracking-widest mt-4 ${planoAtivo.corBase} transition-colors duration-500`}>
            {planoAtivo.nome}
          </h3>
        </div>

        {/* SLIDER NEON ARRASTÁVEL */}
        <div className="w-full px-4 mb-10">
          <div className="relative w-full h-4 bg-[#121212] rounded-full shadow-inner border border-white/10 flex items-center">
            
            {/* Barra Preenchida Colorida */}
            <div 
              className={`absolute top-0 left-0 h-full rounded-full bg-gradient-to-r ${planoAtivo.bgGradiente} transition-all duration-300 ease-out`}
              style={{ width: planoAtivo.posicao }}
            ></div>

            {/* A Esfera Neon (Thumb visual) */}
            <div 
              className="absolute top-1/2 -translate-y-1/2 w-10 h-10 rounded-full bg-white flex items-center justify-center transition-all duration-300 ease-out z-20 pointer-events-none"
              style={{ 
                left: planoAtivo.posicao, 
                transform: `translate(-50%, -50%)`,
                boxShadow: `0 0 25px ${planoIdx === 0 ? '#22d3ee' : planoIdx === 1 ? '#e879f9' : '#ef3340'}` 
              }}
            >
              <div className={`w-4 h-4 rounded-full bg-gradient-to-br ${planoAtivo.bgGradiente}`}></div>
            </div>

            {/* O SEGREDO DO ARRASTO: Input Range NATIVO invisível por cima de tudo */}
            <input 
              type="range" 
              min="0" 
              max="2" 
              step="1" 
              value={planoIdx}
              onChange={(e) => setPlanoIdx(Number(e.target.value))}
              className="absolute inset-0 w-full h-full opacity-0 cursor-pointer z-30 m-0"
            />

            {/* Textos fixos na barra (Ficam atrás do slider) */}
            <div className="absolute top-10 left-0 w-full flex justify-between px-2 z-10 pointer-events-none">
              <span className={`text-xs font-black uppercase transition-colors duration-500 ${planoIdx === 0 ? 'text-white' : 'text-white/30'}`}>2x</span>
              <span className={`text-xs font-black uppercase transition-colors duration-500 ${planoIdx === 1 ? 'text-white' : 'text-white/30'}`}>3x</span>
              <span className={`text-xs font-black uppercase transition-colors duration-500 ${planoIdx === 2 ? 'text-white' : 'text-white/30'}`}>5x</span>
            </div>
          </div>
        </div>

        {/* RENOVACÃO AUTOMÁTICA */}
        <div className="w-full bg-[#1a1a1a] border border-white/5 rounded-2xl p-5 flex items-center justify-between mb-8 transition-all">
          <div className="flex flex-col">
            <span className="text-sm font-black uppercase tracking-tighter text-white/90">
              Renovação Auto
            </span>
            <span className="text-[9px] font-bold uppercase tracking-widest text-white/40 mt-1">
              Cobrança mensal fixa
            </span>
          </div>

          {/* Toggle Switch */}
          <button 
            onClick={() => setAutoRenovar(!autoRenovar)}
            className={`w-14 h-7 rounded-full p-1 relative transition-colors duration-500 ease-in-out ${autoRenovar ? `bg-gradient-to-r ${planoAtivo.bgGradiente}` : 'bg-white/10'}`}
          >
            <div 
              className={`w-5 h-5 bg-white rounded-full transition-all duration-500 ease-in-out shadow-md`}
              style={{ transform: autoRenovar ? 'translateX(28px)' : 'translateX(0)' }}
            ></div>
          </button>
        </div>

        {/* BOTÃO CONFIRMAR */}
        <button 
          onClick={() => alert(`Plano selecionado: ${planoAtivo.nome} | Renova Auto: ${autoRenovar ? 'Sim' : 'Não'}`)}
          className={`w-full py-5 rounded-2xl font-black uppercase tracking-widest text-sm transition-all duration-500 active:scale-95 text-white bg-gradient-to-r ${planoAtivo.bgGradiente} ${planoAtivo.sombraNeon}`}
        >
          Confirmar Plano
        </button>

      </div>
    </div>
  );
}