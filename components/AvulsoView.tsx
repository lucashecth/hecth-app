"use client";
import { useState, useRef, useEffect } from 'react';
import { supabase } from '../lib/supabase';
import { comprimirImagem } from '../utils/imagem';

interface AvulsoViewProps {
  onVoltar: () => void;
  alunoDb: any;
  onAtualizarPerfil: () => void;
}

export function AvulsoView({ onVoltar, alunoDb, onAtualizarPerfil }: AvulsoViewProps) {
  const [etapa, setEtapa] = useState<'info' | 'pagamento' | 'analise'>('info');
  const [uploading, setUploading] = useState(false);
  const [copiado, setCopiado] = useState(false);
  const fileInputRef = useRef<HTMLInputElement>(null);

  const precoAvulso = "25,00";
  const pixCopiaECola = "00020126580014BR.GOV.BCB.PIX0136ede5ffc9-6da6-4b02-963b-18fdc50a2a62520400005303986540525.005802BR5925CENTRO DE TREINAMENTO HEC6009SAO PAULO61080540900062250521LwrrkLHDXSjH2wxdyavjn63041B40";

  useEffect(() => {
    if (alunoDb) {
      if (alunoDb.pagamento_enviado && alunoDb.tipo_pagamento_pendente === 'avulso') {
        setEtapa('analise');
      } else {
        setEtapa('info');
      }
    }
  }, [alunoDb]);

  const handleCopiarPix = () => {
    navigator.clipboard.writeText(pixCopiaECola);
    setCopiado(true);
    setTimeout(() => setCopiado(false), 3000);
  };

  const handleUploadComprovante = async (event: React.ChangeEvent<HTMLInputElement>) => {
    try {
      const file = event.target.files?.[0];
      if (!file) return;
      setUploading(true);

      // Comprime o comprovante mantendo a legibilidade
      const fileComprimido = await comprimirImagem(file, 1000, 0.75);

      const fileExt = fileComprimido.name.split('.').pop() || 'jpg';
      const dataAtual = new Date();
      const mesNome = dataAtual.toLocaleString('pt-BR', { month: 'long' }).toUpperCase();
      const nomeLimpo = `${alunoDb.nome}_${alunoDb.sobrenome}`.replace(/\s+/g, '_');
      const fileName = `avulso_${nomeLimpo}_${mesNome}_${dataAtual.getDate()}_${dataAtual.getFullYear()}.${fileExt}`;

      const { error: uploadError } = await supabase.storage.from('comprovantes').upload(fileName, fileComprimido, { upsert: true });
      if (uploadError) throw uploadError;

      const { data: urlData } = supabase.storage.from('comprovantes').getPublicUrl(fileName);

      const { error: updateError } = await supabase.from('alunos').update({
        pagamento_enviado: true,
        tipo_pagamento_pendente: 'avulso',
        comprovante_url: urlData.publicUrl
      }).eq('id', alunoDb.id);

      if (updateError) throw updateError;

      setEtapa('analise');
      onAtualizarPerfil();
      alert("✅ Comprovante enviado com sucesso! Aguarde a liberação do seu crédito de aula avulsa.");
    } catch (error: any) {
      alert("Erro ao enviar comprovante: " + error.message);
    } finally {
      setUploading(false);
    }
  };

  return (
    <div className="animacao-entrada w-full min-h-screen -mt-6 pt-6 pb-20 bg-[#ef3340]/5 relative overflow-x-hidden">
      <div className="absolute top-1/4 left-1/2 -translate-x-1/2 -translate-y-1/2 w-[150vw] h-[500px] rounded-full blur-[100px] -z-10 bg-gradient-to-b from-[#ef3340]/20 to-orange-500/10 opacity-20"></div>

      <div className="flex items-center gap-4 mb-6 px-5 z-10 relative">
        <button onClick={onVoltar} className="p-3 bg-white/5 rounded-full text-white/50 active:scale-95 transition-transform">
          <svg xmlns="http://www.w3.org/2000/svg" width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="3" strokeLinecap="round" strokeLinejoin="round"><path d="m15 18-6-6 6-6"/></svg>
        </button>
        <h2 className="text-2xl font-black uppercase italic tracking-tighter text-white">Aula Avulsa</h2>
      </div>

      <div className="px-5 z-10 relative flex flex-col items-center">
        
        {/* CARD VALOR AVULSO */}
        <div className="w-full bg-[#121212]/80 backdrop-blur-xl border border-orange-500/30 rounded-[2rem] p-8 text-center shadow-[0_0_30px_rgba(239,68,68,0.15)] mb-8">
          <p className="text-orange-400 text-[10px] font-black uppercase tracking-[0.3em] mb-2">Valor da Aula Extra</p>
          <div className="flex items-start justify-center gap-1">
            <span className="text-xl font-bold mt-2 text-orange-400">R$</span>
            <span className="text-7xl font-black italic tracking-tighter text-white">{precoAvulso.split(',')[0]}</span>
            <span className="text-xl font-bold mt-2 text-white/40">,{precoAvulso.split(',')[1]}</span>
          </div>
          <h3 className="text-sm font-black uppercase tracking-widest text-white/60 mt-3">Agendamento Adicional</h3>
        </div>

        {/* ETAPA: INFO/INSTRUÇÕES */}
        {etapa === 'info' && (
          <div className="w-full animacao-entrada flex flex-col gap-5 text-left bg-[#121212]/60 border border-white/5 p-6 rounded-2xl">
            <p className="text-xs font-bold uppercase tracking-wider text-[#ef3340] italic leading-tight">Como funciona a aula avulsa?</p>
            <p className="text-xs text-white/70 leading-relaxed font-medium">
              Você já completou todos os seus treinos contratados para esta semana! Caso queira jogar mais uma aula avulsa, você pode realizar um PIX de **R$ 25,00** e enviar o comprovante.
            </p>
            <p className="text-xs text-white/70 leading-relaxed font-medium">
              Assim que o administrador aprovar o pagamento, você receberá **1 Crédito de Aula Avulsa** para marcar a aula que quiser esta semana!
            </p>
            <button 
              onClick={() => setEtapa('pagamento')} 
              className="w-full py-5 rounded-2xl font-black uppercase tracking-widest text-sm text-white bg-gradient-to-r from-orange-500 to-[#ef3340] active:scale-[0.98] transition-transform shadow-[0_0_15px_rgba(239,51,64,0.3)] mt-2"
            >
              Comprar Aula Avulsa
            </button>
          </div>
        )}

        {/* ETAPA: PAGAMENTO E PIX */}
        {etapa === 'pagamento' && (
          <div className="w-full animacao-entrada flex flex-col gap-4">
            <button 
              onClick={handleCopiarPix} 
              className={`w-full py-5 rounded-2xl font-black uppercase tracking-widest text-xs border active:scale-[0.98] transition-transform ${copiado ? 'bg-green-600 border-green-500 text-white' : 'bg-[#1a1a1a] border-white/10 text-white/70'}`}
            >
              {copiado ? '✓ Código Copiado!' : 'Copiar Código PIX'}
            </button>

            <input type="file" accept="image/*" className="hidden" ref={fileInputRef} onChange={handleUploadComprovante} />
            
            <button 
              onClick={() => fileInputRef.current?.click()} 
              disabled={uploading}
              className="w-full py-5 rounded-2xl font-black uppercase tracking-widest text-sm text-white bg-gradient-to-r from-orange-500 to-[#ef3340] active:scale-[0.98] transition-transform shadow-[0_0_15px_rgba(239,51,64,0.3)] disabled:opacity-50"
            >
              {uploading ? 'Enviando comprovante...' : 'Enviar Comprovante'}
            </button>

            <button 
              onClick={() => setEtapa('info')}
              className="w-full py-4 text-xs font-black uppercase tracking-widest text-white/40 active:scale-95 transition-transform"
            >
              Voltar
            </button>
          </div>
        )}

        {/* ETAPA: ANÁLISE */}
        {etapa === 'analise' && (
          <div className="w-full animacao-entrada bg-[#121212]/60 border border-amber-500/20 p-8 rounded-[2rem] text-center flex flex-col items-center justify-center">
            <div className="w-14 h-14 rounded-full bg-amber-500/10 flex items-center justify-center text-amber-500 mb-4 animate-pulse">
              <svg xmlns="http://www.w3.org/2000/svg" width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round"><circle cx="12" cy="12" r="10"/><polyline points="12 6 12 12 16 14"/></svg>
            </div>
            <h4 className="text-white font-black uppercase tracking-tighter text-lg mb-2">Comprovante em Análise</h4>
            <p className="text-white/50 text-[10px] font-black uppercase tracking-wider leading-relaxed italic max-w-[80%] mx-auto">
              A administração está validando seu PIX de R$ 25,00. Assim que for aprovado, seu crédito avulso será liberado para marcação!
            </p>
          </div>
        )}

      </div>
    </div>
  );
}
