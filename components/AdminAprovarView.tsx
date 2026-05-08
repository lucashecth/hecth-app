// src/components/AdminAprovarView.tsx
"use client";
import { useState, useEffect } from 'react';
import { supabase } from '../lib/supabase';

export function AdminAprovarView({ onVoltar }: { onVoltar: () => void }) {
  const [pendentes, setPendentes] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);

  // Estados locais para edição antes da aprovação
  const [config, setConfig] = useState<Record<string, { nivel: string, freq: number }>>({});

  useEffect(() => { carregarPendentes(); }, []);

  async function carregarPendentes() {
    setLoading(true);
    const { data } = await supabase.from('alunos').select('*').eq('status', 'pendente').order('created_at', { ascending: false });
    if (data) {
      setPendentes(data);
      // Inicializa as configs padrão para cada aluno da lista
      const initialConfig: any = {};
      data.forEach(a => {
        initialConfig[a.id] = { nivel: 'Aprendiz', freq: 2 };
      });
      setConfig(initialConfig);
    }
    setLoading(false);
  }

  const niveis = ['Aprendiz', 'Iniciante', 'Iniciante avançado', 'Intermediário'];
  const frequencias = [2, 3, 5];

  async function handleAprovar(alunoId: string) {
    const { nivel, freq } = config[alunoId];
    
    const { error } = await supabase.from('alunos').update({
      status: 'aprovado',
      nivel: nivel,
      frequencia_semanal: freq,
      mensalidade_paga: false // Garante que ele comece precisando pagar
    }).eq('id', alunoId);

    if (!error) {
      setPendentes(prev => prev.filter(a => a.id !== alunoId));
      alert("✅ Atleta aprovado com sucesso!");
    }
  }

  async function handleRejeitar(alunoId: string, nome: string) {
    if (!window.confirm(`Tem certeza que deseja remover o cadastro de ${nome}?`)) return;
    const { error } = await supabase.from('alunos').delete().eq('id', alunoId);
    if (!error) setPendentes(prev => prev.filter(a => a.id !== alunoId));
  }

  return (
    <div className="animacao-entrada w-full pb-20 pt-4">
      <div className="flex items-center gap-4 mb-8 px-5">
        <button onClick={onVoltar} className="p-3 bg-white/5 rounded-full text-white/50"><svg xmlns="http://www.w3.org/2000/svg" width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="3" strokeLinecap="round" strokeLinejoin="round"><path d="m15 18-6-6 6-6"/></svg></button>
        <h2 className="text-xl font-black uppercase italic tracking-tight text-white">Aprovar Alunos</h2>
      </div>

      <div className="flex flex-col gap-6 px-5">
        {loading ? (
          <p className="text-center py-20 text-white/20 text-[10px] font-black uppercase italic">Buscando novos cadastros...</p>
        ) : pendentes.length === 0 ? (
          <div className="text-center py-20 opacity-20"><p className="text-xs font-black uppercase tracking-widest">Nenhuma solicitação pendente</p></div>
        ) : pendentes.map(aluno => (
          <div key={aluno.id} className="bg-[#121212] border border-white/5 rounded-[2.5rem] p-6 flex flex-col gap-6 shadow-2xl">
            {/* TOPO: FOTO E NOME */}
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-4">
                <div className="w-16 h-16 rounded-full overflow-hidden border-2 border-[#ef3340]/30 shadow-[0_0_15px_rgba(239,51,64,0.2)]">
                  <img src={aluno.foto_url} className="w-full h-full object-cover" />
                </div>
                <div>
                  <h4 className="font-black text-lg uppercase tracking-tighter text-white leading-none">{aluno.nome}</h4>
                  <p className="text-[10px] text-white/30 uppercase font-black mt-1">{aluno.email}</p>
                </div>
              </div>
              
              {/* BOTÕES DE AÇÃO RÁPIDA */}
              <div className="flex gap-2">
                <button onClick={() => handleRejeitar(aluno.id, aluno.nome)} className="w-10 h-10 rounded-full bg-white/5 border border-white/10 flex items-center justify-center text-white/40 hover:bg-red-500/20 hover:text-red-500 transition-all">✕</button>
                <button onClick={() => handleAprovar(aluno.id)} className="w-12 h-12 rounded-full bg-green-600 flex items-center justify-center text-white shadow-[0_0_20px_rgba(22,163,74,0.4)] active:scale-90 transition-all">
                  <svg xmlns="http://www.w3.org/2000/svg" width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="4" strokeLinecap="round" strokeLinejoin="round"><polyline points="20 6 9 17 4 12"/></svg>
                </button>
              </div>
            </div>

            {/* SELETORES */}
            <div className="space-y-4 pt-4 border-t border-white/5">
              {/* NÍVEL */}
              <div>
                <p className="text-[9px] font-black uppercase text-white/40 mb-3 ml-1 tracking-widest">Nível Técnico</p>
                <div className="flex flex-wrap gap-2">
                  {niveis.map(n => (
                    <button 
                      key={n}
                      onClick={() => setConfig({...config, [aluno.id]: {...config[aluno.id], nivel: n}})}
                      className={`px-3 py-2 rounded-lg text-[9px] font-black uppercase transition-all ${config[aluno.id]?.nivel === n ? 'bg-white text-black' : 'bg-white/5 text-white/30 border border-white/5'}`}
                    >
                      {n}
                    </button>
                  ))}
                </div>
              </div>

              {/* FREQUÊNCIA */}
              <div>
                <p className="text-[9px] font-black uppercase text-white/40 mb-3 ml-1 tracking-widest">Frequência Semanal</p>
                <div className="flex gap-2">
                  {frequencias.map(f => (
                    <button 
                      key={f}
                      onClick={() => setConfig({...config, [aluno.id]: {...config[aluno.id], freq: f}})}
                      className={`flex-1 py-2 rounded-lg text-[10px] font-black uppercase transition-all ${config[aluno.id]?.freq === f ? 'bg-cyan-500 text-black shadow-[0_0_15px_rgba(6,182,212,0.4)]' : 'bg-white/5 text-white/30 border border-white/5'}`}
                    >
                      {f}x
                    </button>
                  ))}
                </div>
              </div>
            </div>
          </div>
        ))}
      </div>
    </div>
  );
}