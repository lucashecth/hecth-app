// src/components/MensalidadeView.tsx
"use client";
import { useState, useRef, useEffect } from 'react';
import { supabase } from '../lib/supabase';

interface MensalidadeViewProps {
  onVoltar: () => void;
  alunoDb: any;
  onAtualizarPerfil: () => void;
}

export function MensalidadeView({ onVoltar, alunoDb, onAtualizarPerfil }: MensalidadeViewProps) {
  const [etapa, setEtapa] = useState<'selecao' | 'pagamento' | 'analise' | 'ativo'>('selecao');
  const [planoIdx, setPlanoIdx] = useState(0);
  const [uploading, setUploading] = useState(false);
  const [copiado, setCopiado] = useState(false);
  const fileInputRef = useRef<HTMLInputElement>(null);

  // Strings completas do PIX Copia e Cola
  const planos = [
    { 
      freq: 2, 
      nome: "2x na Semana", 
      preco: "130,00", 
      pixCopiaECola: "00020126580014BR.GOV.BCB.PIX0136ede5ffc9-6da6-4b02-963b-18fdc50a2a625204000053039865406130.005802BR5925CENTRO DE TREINAMENTO HEC6009SAO PAULO61080540900062250521LwrrkLHDXSjH2wxdyavjn63041B40",
      corBase: "text-cyan-400", 
      bgGradiente: "from-blue-600 to-cyan-400", 
      sombraNeon: "shadow-[0_0_30px_rgba(34,211,238,0.5)]", 
      brilhoFundo: "bg-cyan-900/20" 
    },
    { 
      freq: 3, 
      nome: "3x na Semana", 
      preco: "140,00", 
      pixCopiaECola: "00020126580014BR.GOV.BCB.PIX0136ede5ffc9-6da6-4b02-963b-18fdc50a2a625204000053039865406140.005802BR5925CENTRO DE TREINAMENTO HEC6009SAO PAULO61080540900062250521Yt5gkROLycNxiRsdyavjn63049809",
      corBase: "text-fuchsia-400", 
      bgGradiente: "from-purple-600 to-fuchsia-500", 
      sombraNeon: "shadow-[0_0_30px_rgba(232,121,249,0.5)]", 
      brilhoFundo: "bg-fuchsia-900/20" 
    },
    { 
      freq: 5, 
      nome: "Passe Livre (5x)", 
      preco: "145,00", 
      pixCopiaECola: "00020126580014BR.GOV.BCB.PIX0136ede5ffc9-6da6-4b02-963b-18fdc50a2a625204000053039865406145.005802BR5925CENTRO DE TREINAMENTO HEC6009SAO PAULO61080540900062250521bB0I2CF5Jjw8YVXdyavjn630495EC",
      corBase: "text-[#ef3340]", 
      bgGradiente: "from-orange-500 to-[#ef3340]", 
      sombraNeon: "shadow-[0_0_40px_rgba(239,51,64,0.6)]", 
      brilhoFundo: "bg-[#ef3340]/20" 
    }
  ];

  useEffect(() => {
    if (alunoDb) {
      if (alunoDb.mensalidade_paga) setEtapa('ativo');
      else if (alunoDb.pagamento_enviado) setEtapa('analise');
      
      const freqSalva = alunoDb.frequencia_semanal || 2;
      const idx = planos.findIndex(p => p.freq === freqSalva);
      if (idx !== -1) setPlanoIdx(idx);
    }
  }, [alunoDb]);

  const planoAtivo = planos[planoIdx];

  const avancarParaPagamento = async () => {
    try {
      setUploading(true);
      await supabase.from('alunos').update({ frequencia_semanal: planoAtivo.freq }).eq('id', alunoDb.id);
      setEtapa('pagamento');
    } catch (e) { console.error(e); } finally { setUploading(false); }
  };

  const handleCopiarPix = () => {
    navigator.clipboard.writeText(planoAtivo.pixCopiaECola);
    setCopiado(true);
    setTimeout(() => setCopiado(false), 3000);
  };

  const handleUploadComprovante = async (event: React.ChangeEvent<HTMLInputElement>) => {
    try {
      const file = event.target.files?.[0];
      if (!file) return;
      setUploading(true);
      const fileExt = file.name.split('.').pop();
      const dataAtual = new Date();
      const mesNome = dataAtual.toLocaleString('pt-BR', { month: 'long' }).toUpperCase();
      const nomeLimpo = `${alunoDb.nome}_${alunoDb.sobrenome}`.replace(/\s+/g, '_');
      const fileName = `comprovante_${nomeLimpo}_${mesNome}_${dataAtual.getFullYear()}.${fileExt}`;
      
      await supabase.storage.from('comprovantes').upload(fileName, file, { upsert: true });
      const { data: urlData } = supabase.storage.from('comprovantes').getPublicUrl(fileName);

      await supabase.from('alunos').update({ 
        pagamento_enviado: true, 
        mensalidade_paga: false,
        comprovante_url: urlData.publicUrl
      }).eq('id', alunoDb.id);

      setEtapa('analise');
      onAtualizarPerfil();
    } catch (error: any) { alert(error.message); } finally { setUploading(false); }
  };

  const dataVenc = new Date();
  dataVenc.setMonth(dataVenc.getMonth() + 1);
  const dataFormatada = dataVenc.toLocaleDateString('pt-BR', { day: '2-digit', month: '2-digit' });

  return (
    <div className={`animacao-entrada w-full min-h-screen -mt-6 pt-6 pb-20 transition-colors duration-700 ${planoAtivo.brilhoFundo} relative overflow-x-hidden`}>
      <div className={`absolute top-1/4 left-1/2 -translate-x-1/2 -translate-y-1/2 w-[150vw] h-[500px] rounded-full blur-[100px] transition-colors duration-700 -z-10 bg-gradient-to-b ${planoAtivo.bgGradiente} opacity-20`}></div>

      <div className="flex items-center gap-4 mb-6 px-5 z-10 relative">
        <button onClick={onVoltar} className="p-3 bg-white/5 rounded-full text-white/50 active:scale-95 transition-transform">
          <svg xmlns="http://www.w3.org/2000/svg" width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="3" strokeLinecap="round" strokeLinejoin="round"><path d="m15 18-6-6 6-6"/></svg>
        </button>
        <h2 className="text-2xl font-black uppercase italic tracking-tighter text-white">Mensalidade</h2>
      </div>

      <div className="px-5 z-10 relative flex flex-col items-center">
        
        {/* CARD PRINCIPAL */}
        <div className={`w-full bg-[#121212]/80 backdrop-blur-xl border border-white/10 rounded-[2rem] p-8 text-center transition-all duration-500 ${etapa === 'ativo' ? 'border-green-500 shadow-[0_0_30px_rgba(34,197,94,0.3)]' : planoAtivo.sombraNeon} mb-10`}>
          <p className="text-white/40 text-[10px] font-black uppercase tracking-[0.3em] mb-2">{etapa === 'ativo' ? 'Plano Ativo' : 'Valor do Plano'}</p>
          <div className="flex items-start justify-center gap-1">
            <span className={`text-xl font-bold mt-2 ${etapa === 'ativo' ? 'text-green-400' : planoAtivo.corBase}`}>R$</span>
            <span className="text-7xl font-black italic tracking-tighter text-white">{planoAtivo.preco.split(',')[0]}</span>
            <span className="text-xl font-bold mt-2 text-white/40">,{planoAtivo.preco.split(',')[1]}</span>
          </div>
          <h3 className={`text-lg font-black uppercase tracking-widest mt-4 ${etapa === 'ativo' ? 'text-green-400' : planoAtivo.corBase}`}>{planoAtivo.nome}</h3>
        </div>

        {/* ETAPA: SELEÇÃO COM BOTÕES */}
        {etapa === 'selecao' && (
          <div className="w-full animacao-entrada">
            <div className="flex justify-between gap-3 mb-10">
              {planos.map((plano, idx) => (
                <button
                  key={idx}
                  onClick={() => setPlanoIdx(idx)}
                  className={`flex-1 py-6 rounded-2xl border transition-all duration-300 flex flex-col items-center gap-2 ${
                    planoIdx === idx 
                    ? `bg-white/5 border-white/40 ${plano.sombraNeon} scale-105` 
                    : 'bg-black/20 border-white/5 opacity-40 scale-100'
                  }`}
                >
                  <div className={`w-3 h-3 rounded-full ${planoIdx === idx ? `bg-white shadow-[0_0_10px_white]` : 'bg-white/20'}`}></div>
                  <span className={`text-xs font-black uppercase italic ${planoIdx === idx ? 'text-white' : 'text-white/40'}`}>
                    {plano.freq}x
                  </span>
                </button>
              ))}
            </div>
            <button onClick={avancarParaPagamento} className={`w-full py-5 rounded-2xl font-black uppercase tracking-widest text-sm text-white bg-gradient-to-r ${planoAtivo.bgGradiente} ${planoAtivo.sombraNeon}`}>
               Avançar para Pagamento
            </button>
          </div>
        )}

        {/* PAGAMENTO */}
        {etapa === 'pagamento' && (
          <div className="w-full animacao-entrada flex flex-col gap-4">
            <button onClick={handleCopiarPix} className={`w-full py-5 rounded-2xl font-black uppercase tracking-widest text-xs border ${copiado ? 'bg-green-600 border-green-500' : 'bg-[#1a1a1a] border-white/10'}`}>
              {copiado ? '✓ Código Copiado!' : 'Copiar Código PIX'}
            </button>
            <input type="file" accept="image/*" className="hidden" ref={fileInputRef} onChange={handleUploadComprovante} />
            <button onClick={() => fileInputRef.current?.click()} className={`w-full py-5 rounded-2xl font-black uppercase tracking-widest text-sm text-white bg-gradient-to-r ${planoAtivo.bgGradiente}`}>
              {uploading ? 'Enviando...' : 'Enviar Comprovante'}
            </button>
          </div>
        )}

        {/* ANÁLISE / ATIVO - COM O CHECKLIST RESTAURADO */}
        {(etapa === 'analise' || etapa === 'ativo') && (
          <div className="w-full animacao-entrada flex flex-col gap-4">
            <div className="bg-[#1a1a1a] border border-white/5 rounded-3xl p-6 text-center">
              <h3 className="text-xl font-black uppercase tracking-tighter text-white mb-1">{etapa === 'ativo' ? 'Acesso Liberado' : 'Análise HECTH'}</h3>
              <p className="text-white/40 text-[10px] font-black uppercase tracking-widest italic">Válido até:</p>
              <div className="text-green-400 text-3xl font-black mt-2 italic tracking-tighter">{dataFormatada}</div>
            </div>
            
            <div className="flex flex-col gap-3 mt-2">
              <div className="bg-green-500/10 border border-green-500/30 rounded-2xl p-4 flex items-center gap-4">
                <div className="w-8 h-8 rounded-full bg-green-500 flex items-center justify-center text-black font-black italic shadow-[0_0_10px_rgba(34,197,94,0.5)]">✓</div>
                <span className="text-xs font-black uppercase text-green-400 italic">Comprovante Enviado</span>
              </div>
              
              <div className={`border rounded-2xl p-4 flex items-center gap-4 transition-all ${etapa === 'ativo' ? 'bg-green-500/10 border-green-500/30 shadow-[0_0_15px_rgba(34,197,94,0.1)]' : 'bg-[#121212] border-white/5 opacity-30'}`}>
                <div className={`w-8 h-8 rounded-full flex items-center justify-center font-black italic text-[10px] ${etapa === 'ativo' ? 'bg-green-500 text-black shadow-[0_0_10px_rgba(34,197,94,0.5)]' : 'border-2 border-white/20 text-white/40'}`}>
                   {etapa === 'ativo' ? '✓' : '...'}
                </div>
                <span className={`text-xs font-black uppercase italic ${etapa === 'ativo' ? 'text-green-400' : 'text-white/40'}`}>Conferido pela HECTH</span>
              </div>
            </div>

            {etapa === 'ativo' && (
              <button onClick={() => setEtapa('selecao')} className="w-full mt-6 py-3 text-white/20 text-[10px] font-black uppercase tracking-widest underline">Alterar Plano Futuro</button>
            )}
          </div>
        )}
      </div>
    </div>
  );
}