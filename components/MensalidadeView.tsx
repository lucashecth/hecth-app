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
  const [etapa, setEtapa] = useState<'selecao' | 'pagamento' | 'analise'>('selecao');
  const [planoIdx, setPlanoIdx] = useState(0);
  const [uploading, setUploading] = useState(false);
  const [copiado, setCopiado] = useState(false);
  const fileInputRef = useRef<HTMLInputElement>(null);

  const planos = [
    { freq: 2, nome: "2x na Semana", preco: "180,00", corBase: "text-cyan-400", bgGradiente: "from-blue-600 to-cyan-400", sombraNeon: "shadow-[0_0_30px_rgba(34,211,238,0.5)]", brilhoFundo: "bg-cyan-900/20", posicao: "0%", pixCopiaECola: "COLE_O_PIX_AQUI_DE_180" },
    { freq: 3, nome: "3x na Semana", preco: "220,00", corBase: "text-fuchsia-400", bgGradiente: "from-purple-600 to-fuchsia-500", sombraNeon: "shadow-[0_0_30px_rgba(232,121,249,0.5)]", brilhoFundo: "bg-fuchsia-900/20", posicao: "50%", pixCopiaECola: "COLE_O_PIX_AQUI_DE_220" },
    { freq: 5, nome: "Passe Livre (5x)", preco: "280,00", corBase: "text-[#ef3340]", bgGradiente: "from-orange-500 to-[#ef3340]", sombraNeon: "shadow-[0_0_40px_rgba(239,51,64,0.6)]", brilhoFundo: "bg-[#ef3340]/20", posicao: "100%", pixCopiaECola: "COLE_O_PIX_AQUI_DE_280" }
  ];

  useEffect(() => {
    if (alunoDb) {
      if (alunoDb.pagamento_enviado) setEtapa('analise');
      const freqSalva = alunoDb.frequencia_semanal || 2;
      const idx = planos.findIndex(p => p.freq === freqSalva);
      if (idx !== -1) setPlanoIdx(idx);
    }
  }, [alunoDb]);

  const planoAtivo = planos[planoIdx];

  const avancarParaPagamento = async () => {
    try {
      setUploading(true);
      const { error } = await supabase
        .from('alunos')
        .update({ frequencia_semanal: planoAtivo.freq })
        .eq('id', alunoDb.id);
      
      if (error) throw error;
      setEtapa('pagamento');
    } catch (e: any) {
      alert("Erro ao salvar plano: " + e.message);
    } finally {
      setUploading(false);
    }
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
      const fileName = `comprovante-${alunoDb.id}-${Date.now()}.${fileExt}`;
      const { error: uploadError } = await supabase.storage.from('comprovantes').upload(fileName, file);
      if (uploadError) throw uploadError;

      // Pega a URL pública gerada no bucket de comprovantes
      const { data: urlData } = supabase.storage.from('comprovantes').getPublicUrl(fileName);

      // Salva no banco o status E a URL
      const { error: dbError } = await supabase
        .from('alunos')
        .update({ 
          pagamento_enviado: true, 
          mensalidade_paga: false,
          comprovante_url: urlData.publicUrl
        })
        .eq('id', alunoDb.id);

      if (dbError) throw dbError;

      setEtapa('analise');
      onAtualizarPerfil();
      
    } catch (error: any) {
      alert("Erro ao enviar: " + error.message);
    } finally {
      setUploading(false);
    }
  };

  const dataHoje = new Date();
  const dataVencimento = new Date(dataHoje.setMonth(dataHoje.getMonth() + 1));
  const vencimentoFormatado = dataVencimento.toLocaleDateString('pt-BR', { day: '2-digit', month: '2-digit' });

  return (
    <div className={`animacao-entrada w-full min-h-screen -mt-6 pt-6 pb-20 transition-colors duration-700 ${planoAtivo.brilhoFundo} relative overflow-x-hidden`}>
      <div className={`absolute top-1/4 left-1/2 -translate-x-1/2 -translate-y-1/2 w-[150vw] h-[500px] rounded-full blur-[100px] transition-colors duration-700 -z-10 bg-gradient-to-b ${planoAtivo.bgGradiente} opacity-20`}></div>

      <div className="flex items-center gap-4 mb-6 px-5 z-10 relative">
        <button onClick={onVoltar} className="p-3 bg-white/5 rounded-full text-white/50 active:scale-95 transition-transform backdrop-blur-sm">
          <svg xmlns="http://www.w3.org/2000/svg" width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="3" strokeLinecap="round" strokeLinejoin="round"><path d="m15 18-6-6 6-6"/></svg>
        </button>
        <div>
          <h2 className="text-2xl font-black uppercase italic tracking-tighter text-white leading-none">Mensalidade</h2>
          <span className="text-[10px] font-black uppercase tracking-widest text-white/40">Gestão de Acesso</span>
        </div>
      </div>

      <div className="px-5 z-10 relative flex flex-col items-center">
        <div className={`w-full bg-[#121212]/80 backdrop-blur-xl border border-white/10 rounded-[2rem] p-8 text-center transition-all duration-500 ${etapa === 'analise' ? 'opacity-40 grayscale scale-[0.98]' : planoAtivo.sombraNeon} mb-12`}>
          <p className="text-white/40 text-[10px] font-black uppercase tracking-[0.3em] mb-2">Mensalidade</p>
          <div className="flex items-start justify-center gap-1">
            <span className={`text-xl font-bold mt-2 ${planoAtivo.corBase}`}>R$</span>
            <span className="text-7xl font-black italic tracking-tighter text-white">{planoAtivo.preco.split(',')[0]}</span>
            <span className="text-xl font-bold mt-2 text-white/40">,{planoAtivo.preco.split(',')[1]}</span>
          </div>
          <h3 className={`text-lg font-black uppercase tracking-widest mt-4 ${planoAtivo.corBase}`}>{planoAtivo.nome}</h3>
        </div>

        {etapa === 'selecao' && (
          <div className="w-full animacao-entrada">
            {/* AQUI ESTÁ A MÁGICA DO ESPAÇAMENTO: mb-16 afasta o texto do botão */}
            <div className="w-full mb-16">
              <div className="relative w-full h-4 bg-[#121212] rounded-full shadow-inner border border-white/10 flex items-center">
                <div className={`absolute top-0 left-0 h-full rounded-full bg-gradient-to-r ${planoAtivo.bgGradiente} transition-all duration-300`} style={{ width: planoAtivo.posicao }}></div>
                <div className="absolute top-1/2 -translate-y-1/2 w-10 h-10 rounded-full bg-white flex items-center justify-center transition-all duration-300 z-20 pointer-events-none" style={{ left: planoAtivo.posicao, transform: `translate(-50%, -50%)`, boxShadow: `0 0 25px ${planoIdx === 0 ? '#22d3ee' : planoIdx === 1 ? '#e879f9' : '#ef3340'}` }}>
                  <div className={`w-4 h-4 rounded-full bg-gradient-to-br ${planoAtivo.bgGradiente}`}></div>
                </div>
                <input type="range" min="0" max="2" step="1" value={planoIdx} onChange={(e) => setPlanoIdx(Number(e.target.value))} className="absolute inset-0 w-full h-full opacity-0 cursor-pointer z-30" />
                <div className="absolute top-10 left-0 w-full flex justify-between px-2 text-white/30 font-black text-xs uppercase italic">
                  <span>2x</span><span>3x</span><span>5x</span>
                </div>
              </div>
            </div>
            {/* mt-4 dá mais um fôlegozinho em cima do botão */}
            <button onClick={avancarParaPagamento} disabled={uploading} className={`w-full mt-4 py-5 rounded-2xl font-black uppercase tracking-widest text-sm text-white bg-gradient-to-r ${planoAtivo.bgGradiente} ${planoAtivo.sombraNeon}`}>
               {uploading ? 'Salvando...' : 'Avançar para Pagamento'}
            </button>
          </div>
        )}

        {etapa === 'pagamento' && (
          <div className="w-full animacao-entrada flex flex-col gap-4">
             <div className="bg-white/5 rounded-2xl p-4 mb-2 text-center border border-white/5">
                <span className="text-[10px] font-black uppercase text-white/30 block mb-1">Plano Selecionado</span>
                <span className={`text-sm font-black uppercase ${planoAtivo.corBase}`}>{planoAtivo.nome}</span>
             </div>
            <button onClick={handleCopiarPix} className={`w-full py-5 rounded-2xl font-black uppercase tracking-widest text-xs border ${copiado ? 'bg-green-600 text-white border-green-500 shadow-[0_0_20px_rgba(34,197,94,0.4)]' : 'bg-[#1a1a1a] text-white border-white/10'}`}>
              {copiado ? '✓ Código Copiado!' : 'Copiar Código PIX'}
            </button>
            <input type="file" accept="image/*" className="hidden" ref={fileInputRef} onChange={handleUploadComprovante} />
            <button onClick={() => fileInputRef.current?.click()} disabled={uploading} className={`w-full py-5 rounded-2xl font-black uppercase tracking-widest text-sm text-white bg-gradient-to-r ${planoAtivo.bgGradiente} ${planoAtivo.sombraNeon}`}>
              {uploading ? 'Enviando...' : 'Paguei, enviar Comprovante'}
            </button>
            <button onClick={() => setEtapa('selecao')} className="text-[10px] font-black uppercase text-white/20 underline">Alterar Plano</button>
          </div>
        )}

        {etapa === 'analise' && (
          <div className="w-full animacao-entrada">
            <div className="bg-[#1a1a1a] border border-white/5 rounded-3xl p-6 text-center mb-6">
              <h3 className="text-xl font-black uppercase tracking-tighter text-white mb-1">Análise em curso</h3>
              <p className="text-white/40 text-[10px] font-black uppercase tracking-widest italic">Próxima renovação:</p>
              <div className="text-[#ef3340] text-3xl font-black mt-2 italic tracking-tighter">{vencimentoFormatado}</div>
            </div>
            <div className="flex flex-col gap-3">
              <div className="bg-green-500/10 border border-green-500/30 rounded-2xl p-4 flex items-center gap-4">
                <div className="w-8 h-8 rounded-full bg-green-500 flex items-center justify-center text-black font-black italic">✓</div>
                <span className="text-xs font-black uppercase text-green-400 italic">Comprovante Enviado</span>
              </div>
              <div className="bg-[#121212] border border-white/5 rounded-2xl p-4 flex items-center gap-4 opacity-40">
                <div className="w-8 h-8 rounded-full border-2 border-white/20 flex items-center justify-center text-white/40 italic text-[10px]">...</div>
                <span className="text-xs font-black uppercase text-white/40 italic">Visto pela HECTH</span>
              </div>
            </div>
          </div>
        )}
      </div>
    </div>
  );
}