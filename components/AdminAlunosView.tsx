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

  // Altera a frequência apenas se NÃO estiver pago
  async function alterarFrequencia(aluno: any) {
    if (aluno.mensalidade_paga) {
      alert("⚠️ PAGAMENTO CONFIRMADO: A frequência está travada para este mês.");
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
    const freq = `${aluno.frequencia_semanal || 2}x`;
    const acao = aluno.mensalidade_paga ? "ESTORNAR" : "CONFIRMAR";
    
    const confirmar = window.confirm(`${acao} pagamento de ${aluno.nome} (${freq} na semana)?`);
    
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
    return (
      <div className={`w-full bg-[#121212] border rounded-3xl p-4 flex items-center justify-between transition-all ${aluno.mensalidade_paga ? 'border-green-500/30' : 'border-white/5'}`}>
        <div className="flex items-center gap-4 flex-1">
          <div className="w-12 h-12 rounded-2xl overflow-hidden border border-white/10 shrink-0 bg-white/5">
            <img src={aluno.foto_url} alt="" className="w-full h-full object-cover" />
          </div>
          
          <div className="text-left">
            <h4 className="font-black text-sm uppercase tracking-tighter text-white/90 leading-tight">
              {aluno.nome} {aluno.sobrenome}
            </h4>
            <span className={`text-[9px] font-black uppercase tracking-widest block mt-0.5 italic ${aluno.mensalidade_paga ? 'text-green-400' : 'text-[#ef3340]'}`}>
              {mostrarDia ? `Vencimento dia ${aluno.dia_vencimento}` : (aluno.nivel || 'Iniciante')}
            </span>
          </div>
        </div>

        <div className="flex items-center gap-3">
          {/* Botão de Frequência - Fica VERDE e TRAVADO se pago */}
          <button 
            onClick={() => alterarFrequencia(aluno)}
            className={`px-3 py-2 rounded-xl transition-all border ${
              aluno.mensalidade_paga 
              ? 'bg-green-500/10 border-green-500/50 cursor-not-allowed' 
              : 'bg-white/5 border-white/10 active:scale-90'
            }`}
          >
             <span className={`text-[10px] font-black italic ${aluno.mensalidade_paga ? 'text-green-400' : 'text-white/60'}`}>
               {aluno.frequencia_semanal || 2}x
             </span>
          </button>

          {/* Botão de Check */}
          <button 
            onClick={() => confirmarPagamento(aluno)}
            className={`w-10 h-10 rounded-2xl flex items-center justify-center transition-all ${
              aluno.mensalidade_paga ? 'bg-green-500 text-black shadow-[0_0_15px_rgba(34,197,94,0.4)]' : 'bg-[#1a1a1a] text-white/10 border border-white/5'
            }`}
          >
            <svg xmlns="http://www.w3.org/2000/svg" width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="4" strokeLinecap="round" strokeLinejoin="round"><path d="M20 6L9 17l-5-5"/></svg>
          </button>
        </div>
      </div>
    );
  }

  // ... (Restante do render do componente igual ao anterior)
  return (
    <div className="animacao-entrada min-h-screen pb-20 px-1">
      {/* Header, Input e Filtros permanecem os mesmos */}
      <div className="flex items-center gap-4 mb-6">
        <button onClick={onVoltar} className="p-2 bg-white/5 rounded-full text-white/50"><svg xmlns="http://www.w3.org/2000/svg" width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="3" strokeLinecap="round" strokeLinejoin="round"><path d="m15 18-6-6 6-6"/></svg></button>
        <h2 className="text-xl font-black uppercase italic tracking-tighter">Base de Atletas</h2>
      </div>

      <input 
        type="text" placeholder="PESQUISAR NOME..." 
        className="w-full bg-[#121212] border border-white/10 rounded-2xl px-6 py-4 text-sm font-black uppercase tracking-widest outline-none focus:border-[#ef3340]/50 mb-6"
        value={busca} onChange={(e) => setBusca(e.target.value)}
      />

      <div className="flex gap-2 mb-8">
        <button onClick={() => setFiltro('todos')} className={`flex-1 py-3 rounded-xl text-[10px] font-black uppercase tracking-widest ${filtro === 'todos' ? 'bg-white text-black' : 'bg-white/5 text-white/40'}`}>Todos A-Z</button>
        <button onClick={() => setFiltro('vencimento')} className={`flex-1 py-3 rounded-xl text-[10px] font-black uppercase tracking-widest ${filtro === 'vencimento' ? 'bg-[#ef3340] text-white' : 'bg-white/5 text-white/40'}`}>Por Vencimento</button>
      </div>

      <div className="flex flex-col gap-3">
        {loading ? <p className="text-center py-10 animate-pulse font-black uppercase text-[10px] text-white/20 italic">Sincronizando...</p> : 
          filtro === 'todos' ? alunosFiltrados.map(aluno => <CardAluno key={aluno.id} aluno={aluno} />) :
          [10, 15, 20].map(dia => {
            const alunosDoDia = alunosFiltrados.filter(a => a.dia_vencimento === dia);
            if (alunosDoDia.length === 0) return null;
            return (
              <div key={dia} className="mb-8">
                <div className="flex items-center gap-2 mb-4 ml-1">
                  <span className="bg-[#ef3340] text-white text-[10px] font-black px-3 py-1 rounded-full uppercase tracking-widest italic">Dia {dia}</span>
                  <div className="h-[1px] flex-1 bg-white/5"></div>
                </div>
                <div className="flex flex-col gap-3">{alunosDoDia.map(aluno => <CardAluno key={aluno.id} aluno={aluno} mostrarDia />)}</div>
              </div>
            );
          })
        }
      </div>
    </div>
  );
}