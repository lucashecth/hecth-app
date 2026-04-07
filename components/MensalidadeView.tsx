// src/components/MensalidadeView.tsx
"use client";
import { useState } from 'react';

interface MensalidadeViewProps {
  onVoltar: () => void;
  alunoDb: any;
}

export function MensalidadeView({ onVoltar, alunoDb }: MensalidadeViewProps) {
  // 0 = 2x, 1 = 3x, 2 = 5x
  const [planoIdx, setPlanoIdx] = useState(0);

  // Configuração mestre dos planos (Você pode alterar os valores aqui)
  const planos = [
    {
      freq: 2,
      nome: "2x na Semana",
      preco: "180,00",
      corBase: "text-cyan-400",
      bgGradiente: "from-blue-600 to-cyan-400",
      sombraNeon: "shadow-[0_0_30px_rgba(34,211,238,0.5)]",
      brilhoFundo: "bg-cyan-500/10",
      posicao: "0%"
    },
    {
      freq: 3,
      nome: "3x na Semana",
      preco: "220,00",
      corBase: "text-fuchsia-400",
      bgGradiente: "from-purple-600 to-fuchsia-500",
      sombraNeon: "shadow-[0_0_30px_rgba(232,121,249,0.5)]",
      brilhoFundo: "bg-fuchsia-500/10",
      posicao: "50%"
    },
    {
      freq: 5,
      nome: "Passe Livre (5x)",
      preco: "280,00",
      corBase: "text-[#ef3340]",
      bgGradiente: "from-orange-500 to-[#ef3340]",
      sombraNeon: "shadow-[0_0_40px_rgba(239,51,64,0.6)]",
      brilhoFundo: "bg-[#ef3340]/10",
      posicao: "100%"
    }
  ];

  const planoAtivo = planos[planoIdx];

  return (
    <div className={`animacao-entrada w-full min-h-screen pb-20 pt-4 transition-colors duration-700 ${planoAtivo.brilhoFundo} relative overflow-hidden`}>
      
      {/* Brilho Radial no Fundo da Tela */}
      <div 
        className={`absolute top-1/3 left-1/2 -translate-x-1/2 -translate-y-1/2 w-[120%] h-[500px] rounded-full blur-[100px] transition-colors duration-700 -z-10 bg-gradient-to-b ${planoAtivo.bgGradiente} opacity-20`}
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

        {/* SLIDER NEON CUSTOMIZADO */}
        <div className="w-full px-4 mb-16">
          <div className="relative w-full h-3 bg-white/5 rounded-full shadow-inner border border-white/5">
            
            {/* Barra Preenchida Colorida */}
            <div 
              className={`absolute top-0 left-0 h-full rounded-full bg-gradient-to-r ${planoAtivo.bgGradiente} transition-all duration-500 ease-out`}
              style={{ width: planoAtivo.posicao }}
            ></div>

            {/* A Esfera Neon (Thumb) */}
            <div 
              className="absolute top-1/2 -translate-y-1/2 w-10 h-10 rounded-full bg-white flex items-center justify-center transition-all duration-500 ease-out z-20"
              style={{ 
                left: planoAtivo.posicao, 
                transform: `translate(-50%, -50%)`,
                boxShadow: `0 0 25px ${planoIdx === 0 ? '#22d3ee' : planoIdx === 1 ? '#e879f9' : '#ef3340'}` 
              }}
            >
              <div className={`w-4 h-4 rounded-full bg-gradient-to-br ${planoAtivo.bgGradiente}`}></div>
            </div>

            {/* Áreas de Clique (Botões Invisíveis sobrepostos) */}
            <div className="absolute top-1/2 -translate-y-1/2 left-0 w-full flex justify-between z-30">
              <button 
                onClick={() => setPlanoIdx(0)} 
                className="w-12 h-12 -ml-6 flex items-end justify-center pb-12 cursor-pointer outline-none"
              >
                <span className={`text-xs font-black uppercase transition-colors duration-500 ${planoIdx === 0 ? 'text-white' : 'text-white/30'}`}>2x</span>
              </button>
              
              <button 
                onClick={() => setPlanoIdx(1)} 
                className="w-12 h-12 flex items-end justify-center pb-12 cursor-pointer outline-none"
              >
                <span className={`text-xs font-black uppercase transition-colors duration-500 ${planoIdx === 1 ? 'text-white' : 'text-white/30'}`}>3x</span>
              </button>
              
              <button 
                onClick={() => setPlanoIdx(2)} 
                className="w-12 h-12 -mr-6 flex items-end justify-center pb-12 cursor-pointer outline-none"
              >
                <span className={`text-xs font-black uppercase transition-colors duration-500 ${planoIdx === 2 ? 'text-white' : 'text-white/30'}`}>5x</span>
              </button>
            </div>
          </div>
        </div>

        {/* BOTÃO CONFIRMAR */}
        <button 
          onClick={() => alert(`Ação de checkout/mudança para o plano ${planoAtivo.nome} em breve!`)}
          className={`w-full py-5 rounded-2xl font-black uppercase tracking-widest text-sm transition-all duration-500 active:scale-95 text-white bg-gradient-to-r ${planoAtivo.bgGradiente} ${planoAtivo.sombraNeon}`}
        >
          Confirmar Plano
        </button>

      </div>
    </div>
  );
}