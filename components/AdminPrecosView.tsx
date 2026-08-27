"use client";
import { useState, useEffect } from 'react';
import { supabase } from '../lib/supabase';

interface AdminPrecosViewProps {
  onVoltar: () => void;
}

export function AdminPrecosView({ onVoltar }: AdminPrecosViewProps) {
  const [loading, setLoading] = useState(true);
  const [salvando, setSalvando] = useState(false);
  const [precos, setPrecos] = useState<any[]>([]);

  useEffect(() => {
    carregarPrecos();
  }, []);

  const carregarPrecos = async () => {
    setLoading(true);
    try {
      const { data, error } = await supabase
        .from('precos_config')
        .select('*')
        .order('freq', { ascending: true });
      
      if (error) throw error;
      setPrecos(data || []);
    } catch (e: any) {
      alert('Erro ao carregar preços: ' + e.message);
    } finally {
      setLoading(false);
    }
  };

  const handleInputChange = (idx: number, field: string, value: string) => {
    const novosPrecos = [...precos];
    novosPrecos[idx][field] = value;
    setPrecos(novosPrecos);
  };

  const salvarPrecos = async () => {
    setSalvando(true);
    try {
      // Faz o update de cada linha de frequência no banco
      const promises = precos.map(p => 
        supabase.from('precos_config')
          .update({
            preco_normal: p.preco_normal,
            preco_reajustado: p.preco_reajustado,
            pix_normal: p.pix_normal,
            pix_reajustado: p.pix_reajustado
          })
          .eq('id', p.id)
      );

      const results = await Promise.all(promises);
      const errors = results.filter(r => r.error);
      if (errors.length > 0) {
        throw new Error('Alguns preços não puderam ser atualizados.');
      }

      alert('📊 Tabela de preços e PIX atualizada com sucesso!');
      carregarPrecos();
    } catch (e: any) {
      alert('Erro ao salvar preços: ' + e.message);
    } finally {
      setSalvando(false);
    }
  };

  return (
    <div className="animacao-entrada px-5 pb-20 pt-4">
      {/* HEADER */}
      <div className="flex items-center gap-4 mb-8">
        <button onClick={onVoltar} className="p-3 bg-white/5 rounded-full text-white/50 active:scale-95 transition-transform">
          <svg xmlns="http://www.w3.org/2000/svg" width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="3" strokeLinecap="round" strokeLinejoin="round"><path d="m15 18-6-6 6-6"/></svg>
        </button>
        <div>
          <h2 className="text-2xl font-black uppercase italic tracking-tighter text-[#ef3340] leading-none mb-1">Preços & Planos</h2>
          <p className="text-[10px] text-white/40 uppercase font-black tracking-widest">Reajustes e Chaves PIX</p>
        </div>
      </div>

      {loading ? (
        <div className="flex flex-col items-center justify-center py-20 gap-4">
          <div className="w-10 h-10 rounded-full border-t-2 border-r-2 border-[#ef3340] animate-spin" />
          <span className="text-[10px] text-white/40 uppercase font-black tracking-widest">Carregando Tabela...</span>
        </div>
      ) : (
        <div className="flex flex-col gap-6">
          {precos.map((p, idx) => (
            <div key={p.id} className="bg-[#121212] border border-white/5 rounded-3xl p-6 flex flex-col gap-4 text-left">
              {/* Título Frequência */}
              <div className="flex justify-between items-center border-b border-white/5 pb-3">
                <span className="text-lg font-black italic uppercase tracking-tight text-white/90">
                  Plano {p.freq}x na semana
                </span>
                <span className="text-[9px] font-black uppercase tracking-widest bg-[#ef3340]/10 text-[#ef3340] px-2.5 py-1 rounded-md border border-[#ef3340]/20">
                  Frequência: {p.freq} dias
                </span>
              </div>

              {/* Grid Preços */}
              <div className="grid grid-cols-2 gap-4">
                <div>
                  <label className="text-[9px] font-black uppercase tracking-widest text-white/40 mb-1.5 block">Preço Atual (R$)</label>
                  <input 
                    type="text" 
                    placeholder="Ex: 130,00"
                    value={p.preco_normal}
                    onChange={(e) => handleInputChange(idx, 'preco_normal', e.target.value)}
                    className="w-full bg-[#1a1a1a] border border-white/10 rounded-xl px-4 py-3 text-white outline-none focus:ring-1 focus:ring-[#ef3340] text-sm font-bold"
                  />
                </div>
                <div>
                  <label className="text-[9px] font-black uppercase tracking-widest text-white/40 mb-1.5 block">Preço Reajustado (R$)</label>
                  <input 
                    type="text" 
                    placeholder="Ex: 150,00"
                    value={p.preco_reajustado}
                    onChange={(e) => handleInputChange(idx, 'preco_reajustado', e.target.value)}
                    className="w-full bg-[#1a1a1a] border border-white/10 rounded-xl px-4 py-3 text-white outline-none focus:ring-1 focus:ring-[#ef3340] text-sm font-bold"
                  />
                </div>
              </div>

              {/* Inputs PIX */}
              <div className="flex flex-col gap-3">
                <div>
                  <label className="text-[9px] font-black uppercase tracking-widest text-white/40 mb-1 block">Código PIX - Preço Atual</label>
                  <textarea 
                    rows={2}
                    value={p.pix_normal}
                    onChange={(e) => handleInputChange(idx, 'pix_normal', e.target.value)}
                    placeholder="Cole o código PIX Copia e Cola aqui..."
                    className="w-full bg-[#1a1a1a] border border-white/10 rounded-xl px-4 py-3 text-white outline-none focus:ring-1 focus:ring-[#ef3340] text-xs font-mono resize-none"
                  />
                </div>
                <div>
                  <label className="text-[9px] font-black uppercase tracking-widest text-white/40 mb-1 block">Código PIX - Preço Reajustado</label>
                  <textarea 
                    rows={2}
                    value={p.pix_reajustado}
                    onChange={(e) => handleInputChange(idx, 'pix_reajustado', e.target.value)}
                    placeholder="Cole o código PIX Copia e Cola do preço reajustado aqui..."
                    className="w-full bg-[#1a1a1a] border border-white/10 rounded-xl px-4 py-3 text-white outline-none focus:ring-1 focus:ring-[#ef3340] text-xs font-mono resize-none"
                  />
                </div>
              </div>
            </div>
          ))}

          {/* Botão de Salvar */}
          <button
            onClick={salvarPrecos}
            disabled={salvando}
            className="w-full bg-[#ef3340] text-white text-[11px] font-black uppercase tracking-widest py-4 rounded-xl active:scale-95 transition-all shadow-[0_0_15px_rgba(239,51,64,0.3)] disabled:opacity-50 mt-4"
          >
            {salvando ? 'Salvando alterações...' : 'Salvar Alterações'}
          </button>
        </div>
      )}
    </div>
  );
}
