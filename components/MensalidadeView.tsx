// src/components/MensalidadeView.tsx
"use client";
import { useState, useRef } from 'react';
import { supabase } from '../lib/supabase';

interface MensalidadeViewProps {
  onVoltar: () => void;
  alunoDb: any;
}

export function MensalidadeView({ onVoltar, alunoDb }: MensalidadeViewProps) {
  // Controle das Telas: 'selecao' -> 'pagamento' -> 'analise'
  const [etapa, setEtapa] = useState<'selecao' | 'pagamento' | 'analise'>('selecao');
  
  const [planoIdx, setPlanoIdx] = useState(0);
  const [autoRenovar, setAutoRenovar] = useState(true);
  const [uploading, setUploading] = useState(false);
  const [copiado, setCopiado] = useState(false);
  const fileInputRef = useRef<HTMLInputElement>(null);

  // Aqui você vai colocar o seu PIX Copia e Cola gerado no seu banco para cada valor
  const planos = [
    {
      freq: 2,
      nome: "2x na Semana",
      preco: "180,00",
      corBase: "text-cyan-400",
      bgGradiente: "from-blue-600 to-cyan-400",
      sombraNeon: "shadow-[0_0_30px_rgba(34,211,238,0.5)]",
      brilhoFundo: "bg-cyan-900/20",
      posicao: "0%",
      pixCopiaECola: "COLE_O_PIX_AQUI_DE_180" 
    },
    {
      freq: 3,
      nome: "3x na Semana",
      preco: "220,00",
      corBase: "text-fuchsia-400",
      bgGradiente: "from-purple-600 to-fuchsia-500",
      sombraNeon: "shadow-[0_0_30px_rgba(232,121,249,0.5)]",
      brilhoFundo: "bg-fuchsia-900/20",
      posicao: "50%",
      pixCopiaECola: "COLE_O_PIX_AQUI_DE_220"
    },
    {
      freq: 5,
      nome: "Passe Livre (5x)",
      preco: "280,00",
      corBase: "text-[#ef3340]",
      bgGradiente: "from-orange-500 to-[#ef3340]",
      sombraNeon: "shadow-[0_0_40px_rgba(239,51,64,0.6)]",
      brilhoFundo: "bg-[#ef3340]/20",
      posicao: "100%",
      pixCopiaECola: "COLE_O_PIX_AQUI_DE_280"
    }
  ];

  const planoAtivo = planos[planoIdx];

  // Calcula a data de vencimento (Mês que vem)
  const dataHoje = new Date();
  const dataVencimento = new Date(dataHoje.setMonth(dataHoje.getMonth() + 1));
  const vencimentoFormatado = dataVencimento.toLocaleDateString('pt-BR', { day: '2-digit', month: '2-digit' });

  // Copia o código PIX e muda o botão temporariamente
  const handleCopiarPix = () => {
    navigator.clipboard.writeText(planoAtivo.pixCopiaECola);
    setCopiado(true);
    setTimeout(() => setCopiado(false), 3000);
  };

  // Envia o arquivo para o Supabase
  const handleUploadComprovante = async (event: React.ChangeEvent<HTMLInputElement>) => {
    try {
      const file = event.target.files?.[0];
      if (!file) return;
      
      setUploading(true);
      
      // Envia pro bucket "comprovantes"
      const fileExt = file.name.split('.').pop();
      const fileName = `comprovante-${alunoDb.id}-${Date.now()}.${fileExt}`;
      const { error: uploadError } = await supabase.storage.from('comprovantes').upload(fileName, file);
      
      if (uploadError) throw uploadError;
      
      // Opcional: Atualizar o banco para o status de análise (se você tiver esse campo depois)
      // await supabase.from('alunos').update({ status_pagamento: 'em_analise' }).eq('id', alunoDb.id);

      setEtapa('analise');
      
    } catch (error: any) {
      alert("Erro ao enviar comprovante: " + error.message);
    } finally {
      setUploading(false);
    }
  };

  return (
    /* fixed inset-0 z-50 bg-black: Isso mata a borda preta em cima e sobrepõe a tela inteira */
    <div className={`fixed inset-0 z-50 bg-[#0a0a0a] animacao-entrada w-full min-h-screen pb-20 transition-colors duration-700 ${planoAtivo.brilhoFundo} overflow-y-auto overflow-x-hidden`}>
      
      {/* Brilho Radial no Fundo da Tela */}
      <div className={`absolute top-1/4 left-1/2 -translate-x-1/2 -translate-y-1/2 w-[150vw] h-[500px] rounded-full blur-[100px] transition-colors duration-700 -z-10 bg-gradient-to-b ${planoAtivo.bgGradiente} opacity-20`}></div>

      {/* HEADER DA TELA NOVA */}
      <div className="flex items-center gap-4 mb-6 pt-6 px-5 z-10 relative">
        <button onClick={onVoltar} className="p-3 bg-white/5 rounded-full text-white/50 active:scale-95 transition-transform backdrop-blur-sm">
          <svg xmlns="http://www.w3.org/2000/svg" width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="3" strokeLinecap="round" strokeLinejoin="round"><path d="m15 18-6-6 6-6"/></svg>
        </button>
        <div>
          <h2 className="text-2xl font-black uppercase italic tracking-tighter text-white leading-none">Mensalidade</h2>
          <span className="text-[10px] font-black uppercase tracking-widest text-white/40">Gestão de Acesso</span>
        </div>
      </div>

      <div className="px-5 z-10 relative flex flex-col items-center">
        
        {/* O CARD DO VALOR: Permanece no topo em todas as etapas */}
        <div className={`w-full bg-[#121212]/80 backdrop-blur-xl border border-white/10 rounded-[2rem] p-8 text-center transition-all duration-500 ${etapa === 'analise' ? 'opacity-50 grayscale' : planoAtivo.sombraNeon} mb-12`}>
          <p className="text-white/40 text-[10px] font-black uppercase tracking-[0.3em] mb-2">Mensalidade Ativa</p>
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

        {/* =========================================
            ETAPA 1: SELEÇÃO DE PLANO
            ========================================= */}
        {etapa === 'selecao' && (
          <div className="w-full animacao-entrada">
            {/* SLIDER NEON ARRASTÁVEL */}
            <div className="w-full mb-10">
              <div className="relative w-full h-4 bg-[#121212] rounded-full shadow-inner border border-white/10 flex items-center">
                <div className={`absolute top-0 left-0 h-full rounded-full bg-gradient-to-r ${planoAtivo.bgGradiente} transition-all duration-300 ease-out`} style={{ width: planoAtivo.posicao }}></div>
                <div className="absolute top-1/2 -translate-y-1/2 w-10 h-10 rounded-full bg-white flex items-center justify-center transition-all duration-300 ease-out z-20 pointer-events-none" style={{ left: planoAtivo.posicao, transform: `translate(-50%, -50%)`, boxShadow: `0 0 25px ${planoIdx === 0 ? '#22d3ee' : planoIdx === 1 ? '#e879f9' : '#ef3340'}` }}>
                  <div className={`w-4 h-4 rounded-full bg-gradient-to-br ${planoAtivo.bgGradiente}`}></div>
                </div>
                <input type="range" min="0" max="2" step="1" value={planoIdx} onChange={(e) => setPlanoIdx(Number(e.target.value))} className="absolute inset-0 w-full h-full opacity-0 cursor-pointer z-30 m-0" />
                <div className="absolute top-10 left-0 w-full flex justify-between px-2 z-10 pointer-events-none">
                  <span className={`text-xs font-black uppercase transition-colors duration-500 ${planoIdx === 0 ? 'text-white' : 'text-white/30'}`}>2x</span>
                  <span className={`text-xs font-black uppercase transition-colors duration-500 ${planoIdx === 1 ? 'text-white' : 'text-white/30'}`}>3x</span>
                  <span className={`text-xs font-black uppercase transition-colors duration-500 ${planoIdx === 2 ? 'text-white' : 'text-white/30'}`}>5x</span>
                </div>
              </div>
            </div>

            <button onClick={() => setEtapa('pagamento')} className={`w-full mt-4 py-5 rounded-2xl font-black uppercase tracking-widest text-sm transition-all duration-500 active:scale-95 text-white bg-gradient-to-r ${planoAtivo.bgGradiente} ${planoAtivo.sombraNeon}`}>
              Avançar para Pagamento
            </button>
          </div>
        )}

        {/* =========================================
            ETAPA 2: PAGAMENTO VIA PIX E UPLOAD
            ========================================= */}
        {etapa === 'pagamento' && (
          <div className="w-full animacao-entrada flex flex-col gap-4">
            
            <p className="text-white/60 text-xs font-black uppercase tracking-widest text-center italic mb-2">Efetue o pagamento abaixo</p>

            <button 
              onClick={handleCopiarPix}
              className={`w-full py-5 rounded-2xl font-black uppercase tracking-widest text-xs transition-all duration-500 active:scale-95 flex items-center justify-center gap-3 border ${copiado ? 'bg-green-600 text-white border-green-500' : 'bg-[#1a1a1a] text-white border-white/10 hover:bg-white/5'}`}
            >
              {copiado ? (
                <>✓ Código Copiado!</>
              ) : (
                <>
                  <svg xmlns="http://www.w3.org/2000/svg" width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="3" strokeLinecap="round" strokeLinejoin="round"><rect x="9" y="9" width="13" height="13" rx="2" ry="2"></rect><path d="M5 15H4a2 2 0 0 1-2-2V4a2 2 0 0 1 2-2h9a2 2 0 0 1 2 2v1"></path></svg>
                  Copiar Código PIX
                </>
              )}
            </button>

            {/* Input escondido para puxar foto/galeria */}
            <input type="file" accept="image/*,.pdf" className="hidden" ref={fileInputRef} onChange={handleUploadComprovante} />
            
            <button 
              onClick={() => fileInputRef.current?.click()}
              disabled={uploading}
              className={`w-full mt-4 py-5 rounded-2xl font-black uppercase tracking-widest text-sm transition-all duration-500 active:scale-95 text-white bg-gradient-to-r ${planoAtivo.bgGradiente} ${planoAtivo.sombraNeon}`}
            >
              {uploading ? 'Enviando...' : 'Paguei, enviar Comprovante'}
            </button>

            <button onClick={() => setEtapa('selecao')} className="w-full mt-2 py-3 text-[#ef3340] text-[10px] font-black uppercase tracking-widest underline">
              Voltar aos Planos
            </button>
          </div>
        )}

        {/* =========================================
            ETAPA 3: ANÁLISE / CHECKLIST
            ========================================= */}
        {etapa === 'analise' && (
          <div className="w-full animacao-entrada">
            <div className="bg-[#1a1a1a] border border-white/5 rounded-3xl p-6 text-center mb-6 relative overflow-hidden">
              <div className="absolute inset-0 bg-[#ef3340]/5 animate-pulse"></div>
              <h3 className="text-xl font-black uppercase tracking-tighter text-white mb-1 relative z-10">Tudo Certo!</h3>
              <p className="text-white/40 text-[10px] font-black uppercase tracking-widest italic relative z-10">Sua próxima renovação será em:</p>
              <div className="text-[#ef3340] text-3xl font-black mt-2 italic tracking-tighter relative z-10">{vencimentoFormatado}</div>
            </div>

            <div className="flex flex-col gap-3">
              <div className="bg-green-500/10 border border-green-500/30 rounded-2xl p-4 flex items-center gap-4">
                <div className="w-8 h-8 rounded-full bg-green-500 flex items-center justify-center text-black">
                  <svg xmlns="http://www.w3.org/2000/svg" width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="4" strokeLinecap="round" strokeLinejoin="round"><path d="M20 6L9 17l-5-5"/></svg>
                </div>
                <span className="text-xs font-black uppercase tracking-widest text-green-400">Comprovante Enviado</span>
              </div>

              <div className="bg-[#121212] border border-white/5 rounded-2xl p-4 flex items-center gap-4 opacity-50 grayscale">
                <div className="w-8 h-8 rounded-full border-2 border-white/20 flex items-center justify-center text-white/40">
                  <svg xmlns="http://www.w3.org/2000/svg" width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="3" strokeLinecap="round" strokeLinejoin="round"><circle cx="12" cy="12" r="10"></circle><polyline points="12 6 12 12 16 14"></polyline></svg>
                </div>
                <span className="text-xs font-black uppercase tracking-widest text-white/40">Visto pela HECTH</span>
              </div>
            </div>
          </div>
        )}

      </div>
    </div>
  );
}