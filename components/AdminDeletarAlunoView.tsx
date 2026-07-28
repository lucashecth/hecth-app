// src/components/AdminDeletarAlunoView.tsx
"use client";

import { useState, useEffect } from 'react';
import { supabase } from '../lib/supabase';

interface Aluno {
  id: number;
  nome: string;
  sobrenome: string;
  email: string;
  nivel: string;
  foto_url?: string;
}

interface AdminDeletarAlunoViewProps {
  onVoltar: () => void;
}

export function AdminDeletarAlunoView({ onVoltar }: AdminDeletarAlunoViewProps) {
  const [alunos, setAlunos] = useState<Aluno[]>([]);
  const [busca, setBusca] = useState('');
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    carregarAlunos();
  }, []);

  const carregarAlunos = async () => {
    setLoading(true);
    try {
      const { data, error } = await supabase
        .from('alunos')
        .select('id, nome, sobrenome, email, nivel, foto_url')
        .order('nome', { ascending: true });

      if (error) throw error;
      setAlunos(data || []);
    } catch (err: any) {
      alert("Erro ao carregar alunos: " + err.message);
    } finally {
      setLoading(false);
    }
  };

  const handleExcluir = async (aluno: Aluno) => {
    const certeza = window.confirm(
      `⚠️ ATENÇÃO MÁXIMA: Deseja realmente excluir PERMANENTEMENTE o aluno "${aluno.nome} ${aluno.sobrenome}" (${aluno.email})?\n\n` +
      `Esta ação removerá:\n` +
      `- O cadastro do aluno no sistema\n` +
      `- Todos os seus agendamentos de treinos (presenças)\n` +
      `- Todas as mensagens enviadas no chat\n\n` +
      `ESTA AÇÃO NÃO PODE SER DESFEITA!`
    );

    if (!certeza) return;

    try {
      // 1. Clean up presencas
      await supabase.from('presencas').delete().eq('aluno_email', aluno.email);
      
      // 2. Clean up mensagens
      await supabase.from('mensagens').delete().eq('aluno_email', aluno.email);
      
      // 3. Delete from table
      const { error } = await supabase
        .from('alunos')
        .delete()
        .eq('id', aluno.id);

      if (error) throw error;

      alert(`✅ Aluno "${aluno.nome}" excluído com sucesso!`);
      carregarAlunos();
    } catch (err: any) {
      alert("Erro ao excluir aluno: " + err.message);
    }
  };

  const alunosFiltrados = alunos.filter(a => {
    const termo = busca.toLowerCase().trim();
    const nomeCompleto = `${a.nome} ${a.sobrenome}`.toLowerCase();
    return nomeCompleto.includes(termo) || a.email.toLowerCase().includes(termo);
  });

  return (
    <div className="animacao-entrada w-full pb-20 pt-4 max-w-lg mx-auto px-4 text-left">
      {/* Header */}
      <div className="flex items-center gap-4 mb-6">
        <button onClick={onVoltar} className="p-2 bg-white/5 rounded-full text-white/50 hover:text-white transition-colors">
          <svg xmlns="http://www.w3.org/2000/svg" width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="3" strokeLinecap="round" strokeLinejoin="round"><path d="m15 18-6-6 6-6"/></svg>
        </button>
        <h2 className="text-xl font-black uppercase italic tracking-tight text-[#ef3340]">Excluir Aluno</h2>
      </div>

      {/* Busca */}
      <div className="mb-4">
        <input
          type="text"
          placeholder="Buscar aluno por nome ou e-mail..."
          value={busca}
          onChange={(e) => setBusca(e.target.value)}
          className="w-full bg-[#121212] border border-white/10 rounded-2xl px-4 py-3.5 text-white outline-none focus:ring-1 focus:ring-[#ef3340] text-sm font-medium"
        />
      </div>

      {/* List */}
      <div className="flex flex-col gap-3">
        {loading ? (
          <p className="text-center py-10 text-white/20 text-[10px] font-black uppercase tracking-widest animate-pulse italic">Carregando lista...</p>
        ) : alunosFiltrados.length === 0 ? (
          <p className="text-center py-10 text-white/40 text-xs font-black uppercase tracking-wider italic">Nenhum aluno encontrado</p>
        ) : (
          alunosFiltrados.map((aluno) => (
            <div 
              key={aluno.id}
              className="bg-[#121212] border border-white/5 rounded-2xl p-4 flex items-center justify-between text-left gap-4"
            >
              <div className="flex items-center gap-3 min-w-0">
                <div className="w-10 h-10 rounded-full overflow-hidden border border-white/10 shrink-0 bg-white/5 flex items-center justify-center">
                  {aluno.foto_url ? (
                    <img src={aluno.foto_url} alt="" className="w-full h-full object-cover" />
                  ) : (
                    <span className="text-xs font-bold text-white/50">{aluno.nome.charAt(0)}</span>
                  )}
                </div>
                <div className="min-w-0">
                  <h4 className="font-black text-sm uppercase tracking-tight text-white/90 truncate leading-tight">
                    {aluno.nome} {aluno.sobrenome}
                  </h4>
                  <span className="text-[10px] font-bold text-white/30 truncate block mt-0.5">
                    {aluno.email}
                  </span>
                </div>
              </div>

              <button
                onClick={() => handleExcluir(aluno)}
                className="px-4 py-2 bg-red-950/20 border border-red-500/20 rounded-xl hover:bg-red-900/30 hover:border-red-500/40 text-red-400 text-xs font-black uppercase tracking-widest active:scale-95 transition-all shrink-0"
              >
                Excluir
              </button>
            </div>
          ))
        )}
      </div>
    </div>
  );
}
