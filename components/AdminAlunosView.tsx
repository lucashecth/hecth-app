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

  useEffect(() => { carregarAlunos(); }, []);

  async function carregarAlunos() {
    setLoading(true);
    const { data } = await supabase.from('alunos').select('*').eq('status', 'aprovado').order('nome', { ascending: true });
    if (data) setAlunos(data);
    setLoading(false);
  }

  function getTagsNivel(horario: string) {
    if (!horario) return ['INICIANTE'];
    const h = parseInt(horario.replace('h', ''));
    if (h === 8 || h === 18) return ['INICIANTE AVANÇADO'];
    if ([7, 17, 19, 20].includes(h)) return ['APRENDIZ', 'INICIANTE'];
    return ['INICIANTE'];
  }

  async function alterarFrequencia(aluno: any) {
    if (aluno.mensalidade_paga) {
      alert("⚠️ FINANCEIRO TRAVADO: O pagamento já foi confirmado.");
      return;
    }
    const frequencias = [2, 3, 5];
    const indexAtual = frequencias.indexOf(aluno.frequencia_semanal || 2);
    const novaFreq = frequencias[(indexAtual + 1) % frequencias.length];
    const { error } = await supabase.from('alunos').update({ frequencia_semanal: novaFreq }).eq('id', aluno.id);
    if (!error) {
      setAlunos(alunos.map(a => a.id === aluno.id ? { ...a, frequencia_semanal: novaFreq } : a));
    }
  }

  async function confirmarPagamento(aluno: any) {
    const acao = aluno.mensalidade_paga ? "ESTORNAR" : "CONFIRMAR";
    const confirmar = window.confirm(`${acao} pagamento de ${aluno.nome} (${aluno.frequencia_semanal || 2}x)?`);
    if (confirmar) {
      const novoStatus = !aluno.mensalidade_paga;
      const { error } = await supabase.from('alunos').update({ mensalidade_paga: novoStatus }).eq('id', aluno.id);
      if (!error) setAlunos(alunos.map(a => a.id === aluno.id ? { ...a, mensalidade_paga: novoStatus } : a));
    }
  }

  const alunosFiltrados = alunos.filter(aluno => 
    aluno.nome.toLowerCase().includes(busca.toLowerCase()) || 
    aluno.sobrenome.toLowerCase().includes(busca.toLowerCase())
  );

  function CardAluno({ aluno, mostrarDia }: { aluno: any, mostrarDia?: boolean }) {
    const tags = getTagsNivel(aluno.horario);
    return (
      <div className={`w-full bg-[#121212] border rounded-3xl p-5 flex items-center justify-between transition-all active:scale-[0.98] ${aluno.mensalidade_paga ? 'border-green-500/30' : 'border-white/5'}`}>
        <div className="flex items-center gap-4 flex-1">
          <div className="w-14 h-14 rounded-2xl overflow-hidden border border-white/10 shrink-0 bg-white/5">
            <img src={aluno.foto_url} alt="" className="w-full h-full object-cover" />
          </div>
          <div className="text-left">
            <h4 className="font-black text-base uppercase tracking-tighter text-white/90 leading-tight">
              {aluno.nome} {aluno.sobrenome}
            </h4>
            <div className="flex flex-wrap gap-1 mt-1.5">
              {mostrarDia ? (
                <span className={`text-[10px] font-black uppercase tracking-widest italic ${aluno.mensalidade_paga ? 'text-green-400' : 'text-[#ef3340]'}`}>
                  Vencimento dia {aluno.dia_vencimento}
                </span>
              ) : (
                tags.map(tag => (
                  <span key={tag} className={`text-[9px] font-black uppercase tracking-widest px-2 py-0.5 rounded border italic ${aluno.mensalidade_paga ? 'text-green-400 border-green-400/30' : 'text-[#ef3340] border-[#ef3340]/20'}`}>
                    {tag}
                  </span>
                ))
              )}
            </div>
          </div>
        </div>
        <div className="flex items-center gap-3">
          <button 
            onClick={() => alterarFrequencia(aluno)}
            className={`px-3 py-2.5 rounded-xl border transition-all ${aluno.mensalidade_paga ? 'bg-green-500/10 border-green-400/50' : 'bg-white/5 border-white/10'}`}
          >
             <span className={`text-xs font-black italic ${aluno.mensalidade_paga ? 'text-green-400' : 'text-white/40'}`}>
               {aluno.frequencia_semanal || 2}x
             </span>
          </button>
          <button 
            onClick={() => confirmarPagamento(aluno)}
            className={`w-12 h-12 rounded-2xl flex items-center justify-center transition-all ${aluno.mensalidade_paga ? 'bg-green-500 text-black shadow-lg shadow-green-500/20' : 'bg-[#1a1a1a] text-white/10 border border-white/5'}`}
          >
            <svg xmlns="http://www.w3.org/2000/svg" width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="4" strokeLinecap="round" strokeLinejoin="round"><path d="M20 6L9 17l-5-5"/></svg>
          </button>
        </div>
      </div>
    );
  }

  return (
    <div className="animacao-entrada min-h-screen pb-20 w-full pt-4"> 
      
      <div className="flex items-center gap-4 mb-8 px-5">
        <button onClick={onVoltar} className="p-3 bg-white/5 rounded-full text-white/50"><svg xmlns="http://www.w3.org/2000/svg" width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="3" strokeLinecap="round" strokeLinejoin="round"><path d="m15 18-6-6 6-6"/></svg></button>
        <h2 className="text-2xl font-black uppercase italic tracking-tighter">BASE DE ATLETAS</h2>
      </div>

      <div className="px-5 mb-6">
        <input 
          type="text" placeholder="PESQUISAR NOME..." 
          className="w-full bg-[#121212] border border-white/10 rounded-2xl px-6 py-5 text-sm font-black uppercase tracking-widest outline-none focus:border-[#ef3340]/50"
          value={busca} onChange={(e) => setBusca(e.target.value)}
        />
      </div>

      <div className="flex gap-3 mb-10 px-5">
        <button onClick={() => setFiltro('todos')} className={`flex-1 py-5 rounded-2xl text-xs font-black uppercase tracking-widest ${filtro === 'todos' ? 'bg-white text-black' : 'bg-white/5 text-white/40 border border-white/5'}`}>TODOS A-Z</button>
        <button onClick={() => setFiltro('vencimento')} className={`flex-1 py-5 rounded-2xl text-xs font-black uppercase tracking-widest ${filtro === 'vencimento' ? 'bg-[#ef3340] text-white' : 'bg-white/5 text-white/40 border border-white/5'}`}>POR VENCIMENTO</button>
      </div>

      {/* AQUI ESTÁ A LISTA! Sem margem negativa, apenas aproveitando o espaço que o page.tsx liberou */}
      <div className="flex flex-col gap-4 px-0"> 
        {loading ? <p className="text-center py-10 animate-pulse font-black uppercase text-xs text-white/20 italic tracking-widest">Sincronizando...</p> : 
          filtro === 'todos' ? alunosFiltrados.map(aluno => <CardAluno key={aluno.id} aluno={aluno} />) :
          [10, 15, 20].map(dia => {
            const alunosDoDia = alunosFiltrados.filter(a => a.dia_vencimento === dia);
            if (alunosDoDia.length === 0) return null;
            return (
              <div key={dia} className="mb-10">
                <div className="flex items-center gap-3 mb-6 px-5">
                  <span className="bg-[#ef3340] text-white text-xs font-black px-4 py-1.5 rounded-full uppercase italic shadow-lg">Dia {dia}</span>
                  <div className="h-[1px] flex-1 bg-white/10"></div>
                </div>
                <div className="flex flex-col gap-4">{alunosDoDia.map(aluno => <CardAluno key={aluno.id} aluno={aluno} mostrarDia />)}</div>
              </div>
            );
          })
        }
      </div>
    </div>
  );
}