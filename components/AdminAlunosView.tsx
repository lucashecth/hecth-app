// src/components/AdminAlunosView.tsx
"use client";
import { useState, useEffect } from 'react';
import { supabase } from '../lib/supabase';

interface AdminAlunosViewProps {
  onVoltar: () => void;
}

export function AdminAlunosView({ onVoltar }: AdminAlunosViewProps) {
  const [busca, setBusca] = useState('');
  const [filtro, setFiltro] = useState<'todos' | 'vencimento'>('todos');
  const [alunos, setAlunos] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    carregarAlunos();
  }, []);

  async function carregarAlunos() {
    setLoading(true);
    // Buscamos todos os alunos aprovados
    const { data } = await supabase
      .from('alunos')
      .select('*')
      .eq('status', 'aprovado')
      .order('nome', { ascending: true });
    
    if (data) setAlunos(data);
    setLoading(false);
  }

  // Lógica de Filtro e Busca
  const alunosFiltrados = alunos.filter(aluno => 
    aluno.nome.toLowerCase().includes(busca.toLowerCase()) || 
    aluno.sobrenome.toLowerCase().includes(busca.toLowerCase())
  ).sort((a, b) => {
    if (filtro === 'vencimento') {
      // Prioriza Dia 10, depois 15, depois 20. Se igual, Alfabética.
      if (a.dia_vencimento !== b.dia_vencimento) {
        return a.dia_vencimento - b.dia_vencimento;
      }
    }
    return a.nome.localeCompare(b.nome);
  });

  return (
    <div className="animacao-entrada min-h-screen pb-20">
      {/* Header Fixo */}
      <div className="flex items-center gap-4 mb-6">
        <button onClick={onVoltar} className="p-2 bg-white/5 rounded-full text-white/50">
           <svg xmlns="http://www.w3.org/2000/svg" width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="3" strokeLinecap="round" strokeLinejoin="round"><path d="m15 18-6-6 6-6"/></svg>
        </button>
        <h2 className="text-xl font-black uppercase italic tracking-tighter">Base de Atletas</h2>
      </div>

      {/* Barra de Pesquisa HECTH Style */}
      <div className="relative mb-6">
        <input 
          type="text" 
          placeholder="PESQUISAR ATLETA..." 
          className="w-full bg-[#121212] border border-white/10 rounded-2xl px-6 py-4 text-sm font-bold uppercase tracking-widest outline-none focus:border-[#ef3340]/50 transition-all"
          value={busca}
          onChange={(e) => setBusca(e.target.value)}
        />
        <div className="absolute right-6 top-1/2 -translate-y-1/2 text-white/20">
          <svg xmlns="http://www.w3.org/2000/svg" width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="3" strokeLinecap="round" strokeLinejoin="round"><circle cx="11" cy="11" r="8"/><path d="m21 21-4.3-4.3"/></svg>
        </div>
      </div>

      {/* Filtros de Organização */}
      <div className="flex gap-2 mb-8">
        <button 
          onClick={() => setFiltro('todos')}
          className={`flex-1 py-3 rounded-xl text-[10px] font-black uppercase tracking-widest transition-all ${filtro === 'todos' ? 'bg-white text-black' : 'bg-white/5 text-white/40 border border-white/5'}`}
        >
          Todos A-Z
        </button>
        <button 
          onClick={() => setFiltro('vencimento')}
          className={`flex-1 py-3 rounded-xl text-[10px] font-black uppercase tracking-widest transition-all ${filtro === 'vencimento' ? 'bg-[#ef3340] text-white' : 'bg-white/5 text-white/40 border border-white/5'}`}
        >
          Por Vencimento
        </button>
      </div>

      {/* Lista de Alunos */}
      <div className="flex flex-col gap-3">
        {loading ? (
          <p className="text-center text-white/20 font-black uppercase text-[10px] tracking-widest animate-pulse">Sincronizando Base...</p>
        ) : (
          alunosFiltrados.map((aluno) => (
            <button 
              key={aluno.id}
              onClick={() => alert(`Abrindo perfil de ${aluno.nome}...`)} // Futura tela de perfil
              className="w-full bg-[#121212] border border-white/5 rounded-3xl p-4 flex items-center justify-between active:scale-[0.98] transition-all"
            >
              <div className="flex items-center gap-4">
                {/* Foto com moldura HECTH */}
                <div className="w-12 h-12 rounded-2xl overflow-hidden border border-white/10">
                  <img src={aluno.foto_url} alt="" className="w-full h-full object-cover" />
                </div>
                <div className="text-left">
                  <span className="text-[9px] font-black uppercase tracking-widest text-white/30 block">
                    {filtro === 'vencimento' ? `Vencimento Dia ${aluno.dia_vencimento || '?'}` : 'Atleta HECTH'}
                  </span>
                  <h4 className="font-black text-sm uppercase tracking-tighter text-white/90">
                    {aluno.nome} {aluno.sobrenome}
                  </h4>
                </div>
              </div>

              {/* Status de Pagamento (Check Interativo) */}
              <div className={`w-10 h-10 rounded-2xl flex items-center justify-center ${aluno.mensalidade_paga ? 'bg-green-500/20 text-green-400' : 'bg-red-500/10 text-red-500/40'}`}>
                {aluno.mensalidade_paga ? (
                  <svg xmlns="http://www.w3.org/2000/svg" width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="4" strokeLinecap="round" strokeLinejoin="round"><path d="M20 6L9 17l-5-5"/></svg>
                ) : (
                  <svg xmlns="http://www.w3.org/2000/svg" width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="4" strokeLinecap="round" strokeLinejoin="round"><path d="M18 6 6 18"/><path d="m6 6 12 12"/></svg>
                )}
              </div>
            </button>
          ))
        )}
      </div>
    </div>
  );
}