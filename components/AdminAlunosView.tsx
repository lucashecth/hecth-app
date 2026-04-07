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
    const { data } = await supabase
      .from('alunos')
      .select('*')
      .eq('status', 'aprovado')
      .order('nome', { ascending: true });

    if (data) setAlunos(data);
    setLoading(false);
  }

  async function alterarFrequencia(e: React.MouseEvent, aluno: any) {
    e.stopPropagation();
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

  async function confirmarPagamento(e: React.MouseEvent, aluno: any) {
    e.stopPropagation();
    const acao = aluno.mensalidade_paga ? "ESTORNAR" : "CONFIRMAR";
    const confirmar = window.confirm(`${acao} pagamento de ${aluno.nome} (${aluno.frequencia_semanal || 2}x)?`);
    if (confirmar) {
      const novoStatus = !aluno.mensalidade_paga;
      const { error } = await supabase.from('alunos').update({ mensalidade_paga: novoStatus }).eq('id', aluno.id);
      if (!error) {
        setAlunos(alunos.map(a => a.id === aluno.id ? { ...a, mensalidade_paga: novoStatus } : a));
      }
    }
  }

  const alunosFiltrados = alunos.filter(aluno =>
    `${aluno.nome} ${aluno.sobrenome}`.toLowerCase().includes(busca.toLowerCase())
  );

  function CardAluno({ aluno, mostrarDia }: { aluno: any, mostrarDia?: boolean }) {
    // Pegamos o nível direto do banco. Se estiver vazio, mostramos INICIANTE por segurança.
    const nivelDoBanco = aluno.nivel ? aluno.nivel.toUpperCase() : 'INICIANTE';
    
    return (
      <button 
        onClick={() => alert(`Perfil detalhado de ${aluno.nome} em breve`)}
        className={`w-full bg-[#121212] border rounded-2xl p-4 flex items-center justify-between transition-all active:scale-[0.98] ${aluno.mensalidade_paga ? 'border-green-500/30' : 'border-white/5'}`}
      >
        <div className="flex items-center gap-3 flex-1 text-left">
          <div className="w-12 h-12 rounded-xl overflow-hidden border border-white/10 shrink-0 bg-white/5">
            <img src={aluno.foto_url} alt="" className="w-full h-full object-cover" />
          </div>
          <div>
            <h4 className="font-black text-sm uppercase tracking-tight text-white/90 leading-tight">
              {aluno.nome} {aluno.sobrenome}
            </h4>
            <div className="flex flex-wrap gap-1 mt-1">
              {mostrarDia ? (
                <span className={`text-[10px] font-black uppercase italic ${aluno.mensalidade_paga ? 'text-green-400' : 'text-[#ef3340]'}`}>
                  Vencimento dia {aluno.dia_vencimento}
                </span>
              ) : (
                /* EXIBIÇÃO DO NÍVEL DO BANCO DE DADOS */
                <span className={`text-[9px] font-black uppercase px-2 py-0.5 rounded border italic ${aluno.mensalidade_paga ? 'text-green-400 border-green-400/30' : 'text-[#ef3340] border-[#ef3340]/20'}`}>
                  {nivelDoBanco}
                </span>
              )}
            </div>
          </div>
        </div>

        <div className="flex items-center gap-2">
          <div 
            onClick={(e) => alterarFrequencia(e, aluno)} 
            className={`px-3 py-2 rounded-xl border flex items-center justify-center ${aluno.mensalidade_paga ? 'bg-green-500/10 border-green-400/50' : 'bg-white/5 border-white/10'}`}
          >
            <span className={`text-xs font-black ${aluno.mensalidade_paga ? 'text-green-400' : 'text-white/40'}`}>
              {aluno.frequencia_semanal || 2}x
            </span>
          </div>
          <div 
            onClick={(e) => confirmarPagamento(e, aluno)} 
            className={`w-10 h-10 rounded-xl flex items-center justify-center ${aluno.mensalidade_paga ? 'bg-green-500 text-black' : 'bg-[#1a1a1a] text-white/10 border border-white/5'}`}
          >
            <svg xmlns="http://www.w3.org/2000/svg" width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="4" strokeLinecap="round" strokeLinejoin="round"><path d="M20 6L9 17l-5-5"/></svg>
          </div>
        </div>
      </button>
    );
  }

  return (
    <div className="animacao-entrada w-full pb-20 pt-4">
      <div className="flex items-center gap-4 mb-6 px-5">
        <button onClick={onVoltar} className="p-2 bg-white/5 rounded-full text-white/50"><svg xmlns="http://www.w3.org/2000/svg" width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="3" strokeLinecap="round" strokeLinejoin="round"><path d="m15 18-6-6 6-6"/></svg></button>
        <h2 className="text-xl font-black uppercase italic tracking-tight">BASE DE ATLETAS</h2>
      </div>

      <div className="px-5 mb-4">
        <input 
          type="text"
          placeholder="PESQUISAR NOME..."
          className="w-full bg-[#121212] border border-white/10 rounded-xl px-4 py-4 text-sm font-black uppercase tracking-widest outline-none focus:border-[#ef3340]/50"
          value={busca}
          onChange={(e) => setBusca(e.target.value)}
        />
      </div>

      <div className="flex gap-2 mb-6 px-5">
        <button onClick={() => setFiltro('todos')} className={`flex-1 py-3 rounded-xl text-xs font-black uppercase tracking-widest ${filtro === 'todos' ? 'bg-white text-black' : 'bg-white/5 text-white/40 border border-white/5'}`}>
          TODOS A-Z
        </button>
        <button onClick={() => setFiltro('vencimento')} className={`flex-1 py-3 rounded-xl text-xs font-black uppercase tracking-widest ${filtro === 'vencimento' ? 'bg-[#ef3340] text-white' : 'bg-white/5 text-white/40 border border-white/5'}`}>
          VENCIMENTO
        </button>
      </div>

      <div className="flex flex-col gap-3 px-2">
        {loading ? (
          <p className="text-center py-10 text-white/20 text-[10px] font-black uppercase tracking-widest animate-pulse italic">Sincronizando...</p>
        ) : filtro === 'todos' ? (
          alunosFiltrados.map(aluno => <CardAluno key={aluno.id} aluno={aluno} />)
        ) : (
          [10, 15, 20].map(dia => {
            const alunosDoDia = alunosFiltrados.filter(a => a.dia_vencimento === dia);
            if (!alunosDoDia.length) return null;
            return (
              <div key={dia}>
                <div className="flex items-center gap-2 mb-3 px-3">
                  <span className="bg-[#ef3340] text-white text-[10px] font-black px-3 py-1 rounded-full italic tracking-widest">DIA {dia}</span>
                  <div className="h-[1px] flex-1 bg-white/10"></div>
                </div>
                <div className="flex flex-col gap-3">
                  {alunosDoDia.map(aluno => <CardAluno key={aluno.id} aluno={aluno} mostrarDia />)}
                </div>
              </div>
            );
          })
        )}
      </div>
    </div>
  );
}