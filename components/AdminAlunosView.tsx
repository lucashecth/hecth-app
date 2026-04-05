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

  // Lógica de Níveis baseada no horário do aluno
  function getTagsNivel(horario: string) {
    if (!horario) return ['INICIANTE'];
    const h = parseInt(horario.replace('h', ''));
    
    if (h === 8 || h === 18) return ['INICIANTE AVANÇADO'];
    if ([7, 17, 19, 20].includes(h)) return ['APRENDIZ', 'INICIANTE'];
    
    return ['INICIANTE'];
  }

  async function alterarFrequencia(aluno: any) {
    if (aluno.mensalidade_paga) {
      alert("⚠️ FINANCEIRO TRAVADO: O pagamento já foi confirmado. A frequência não pode ser alterada.");
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
    const tags = getTagsNivel(aluno.horario);

    return (
      <div className={`w-full bg-[#121212] border-y py-4 px-5 flex items-center justify-between transition-all ${aluno.mensalidade_paga ? 'border-green-500/20' : 'border-white/[0.03]'}`}>
        <div className="flex items-center gap-4 flex-1">
          <div className="w-14 h-14 rounded-2xl overflow-hidden border border-white/10 shrink-0 bg-white/5">
            <img src={aluno.foto_url} alt="" className="w-full h-full object-cover" />
          </div>
          
          <div className="text-left">
            <h4 className="font-black text-sm uppercase tracking-tighter text-white/90 leading-tight">
              {aluno.nome} {aluno.sobrenome}
            </h4>
            
            <div className="flex flex-wrap gap-1 mt-1.5">
              {mostrarDia ? (
                <span className={`text-[9px] font-black uppercase tracking-widest italic ${aluno.mensalidade_paga ? 'text-green-400' : 'text-[#ef3340]'}`}>
                  Vencimento dia {aluno.dia_vencimento}
                </span>
              ) : (
                tags.map(tag => (
                  <span key={tag} className={`text-[8px] font-black uppercase tracking-widest px-1.5 py-0.5 rounded-sm border italic ${aluno.mensalidade_paga ? 'text-green-400 border-green-400/30' : 'text-[#ef3340] border-[#ef3340]/20'}`}>
                    {tag}
                  </span>
                ))
              )}
            </div>
          </div>
        </div>

        <div className="flex items-center gap-3">
          {/* Frequência: Verde e travada se pago */}
          <button 
            onClick={() => alterarFrequencia(aluno)}
            className={`px-3 py-2 rounded-xl transition-all border ${
              aluno.mensalidade_paga 
              ? 'bg-green-500/10 border-green-500/50 cursor-not-allowed' 
              : 'bg-white/5 border-white/10 active:scale-95'
            }`}
          >
             <span className={`text-[10px] font-black italic ${aluno.mensalidade_paga ? 'text-green-400' : 'text-white/40'}`}>
               {aluno.frequencia_semanal || 2}x
             </span>
          </button>

          {/* Check de Pagamento */}
          <button 
            onClick={() => confirmarPagamento(aluno)}
            className={`w-11 h-11 rounded-2xl flex items-center justify-center transition-all ${
              aluno.mensalidade_paga ? 'bg-green-500 text-black shadow-[0_0_20px_rgba(34,197,94,0.3)]' : 'bg-[#1a1a1a] text-white/10 border border-white/5'
            }`}
          >
            <svg xmlns="http://www.w3.org/2000/svg" width="22" height="22" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="4" strokeLinecap="round" strokeLinejoin="round"><path d="M20 6L9 17l-5-5"/></svg>
          </button>
        </div>
      </div>
    );
  }

  return (
    <div className="animacao-entrada min-h-screen pb-20 w-full">
      {/* Header */}
      <div className="flex items-center gap-4 mb-6 px-4">
        <button onClick={onVoltar} className="p-2 bg-white/5 rounded-full text-white/50 active:scale-90 transition-transform">
          <svg xmlns="http://www.w3.org/2000/svg" width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="3" strokeLinecap="round" strokeLinejoin="round"><path d="m15 18-6-6 6-6"/></svg>
        </button>
        <h2 className="text-xl font-black uppercase italic tracking-tighter">Base de Atletas</h2>
      </div>

      {/* Busca Full Width */}
      <div className="mb-6">
        <input 
          type="text" 
          placeholder="BUSCAR NOME DO ATLETA..." 
          className="w-full bg-[#121212] border-y border-white/10 px-6 py-5 text-sm font-black uppercase tracking-widest outline-none focus:border-[#ef3340]/50 text-white placeholder:text-white/10"
          value={busca} 
          onChange={(e) => setBusca(e.target.value)}
        />
      </div>

      {/* Filtros */}
      <div className="flex gap-2 mb-8 px-4">
        <button 
          onClick={() => setFiltro('todos')} 
          className={`flex-1 py-4 rounded-xl text-[10px] font-black uppercase tracking-widest transition-all ${filtro === 'todos' ? 'bg-white text-black' : 'bg-white/5 text-white/40 border border-white/5'}`}
        >
          Todos A-Z
        </button>
        <button 
          onClick={() => setFiltro('vencimento')} 
          className={`flex-1 py-4 rounded-xl text-[10px] font-black uppercase tracking-widest transition-all ${filtro === 'vencimento' ? 'bg-[#ef3340] text-white' : 'bg-white/5 text-white/40 border border-white/5'}`}
        >
          Por Vencimento
        </button>
      </div>

      {/* Lista Principal Esticada */}
      <div className="flex flex-col gap-0.5">
        {loading ? (
          <p className="text-center py-10 animate-pulse font-black uppercase text-[10px] text-white/20 italic tracking-[0.2em]">Sincronizando Base...</p>
        ) : filtro === 'todos' ? (
          alunosFiltrados.map(aluno => <CardAluno key={aluno.id} aluno={aluno} />)
        ) : (
          [10, 15, 20].map(dia => {
            const alunosDoDia = alunosFiltrados.filter(a => a.dia_vencimento === dia);
            if (alunosDoDia.length === 0) return null;
            return (
              <div key={dia} className="mb-8">
                <div className="flex items-center gap-2 mb-4 px-5">
                  <span className="bg-[#ef3340] text-white text-[10px] font-black px-3 py-1 rounded-full uppercase tracking-widest italic shadow-lg">Dia {dia}</span>
                  <div className="h-[1px] flex-1 bg-white/10"></div>
                </div>
                <div className="flex flex-col gap-0.5">
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