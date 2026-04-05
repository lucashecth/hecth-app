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
    // Buscamos os alunos aprovados
    const { data } = await supabase
      .from('alunos')
      .select('*')
      .eq('status', 'aprovado')
      .order('nome', { ascending: true });
    
    if (data) setAlunos(data);
    setLoading(false);
  }

  // Função de confirmação com o alerta que você pediu
  async function confirmarPagamento(aluno: any) {
    const frequenciaFormatada = `${aluno.frequencia_semanal || 0}x`;
    const confirmar = window.confirm(`Confirmar pagamento de ${aluno.nome} ${frequenciaFormatada} na semana?`);
    
    if (confirmar) {
      const novoStatus = !aluno.mensalidade_paga;
      const { error } = await supabase
        .from('alunos')
        .update({ mensalidade_paga: novoStatus })
        .eq('id', aluno.id);

      if (!error) {
        setAlunos(alunos.map(a => a.id === aluno.id ? { ...a, mensalidade_paga: novoStatus } : a));
      } else {
        alert("Erro ao atualizar pagamento.");
      }
    }
  }

  const alunosFiltrados = alunos.filter(aluno => 
    aluno.nome.toLowerCase().includes(busca.toLowerCase()) || 
    aluno.sobrenome.toLowerCase().includes(busca.toLowerCase())
  );

  // Sub-componente do Card para manter o código limpo
  function CardAluno({ aluno, mostrarDia }: { aluno: any, mostrarDia?: boolean }) {
    return (
      <div className="w-full bg-[#121212] border border-white/5 rounded-3xl p-4 flex items-center justify-between active:scale-[0.98] transition-all">
        <div className="flex items-center gap-4 flex-1" onClick={() => alert('Abrindo Perfil...')}>
          {/* Foto */}
          <div className="w-12 h-12 rounded-2xl overflow-hidden border border-white/10 shrink-0 bg-white/5">
            {aluno.foto_url ? (
              <img src={aluno.foto_url} alt="" className="w-full h-full object-cover" />
            ) : (
              <div className="w-full h-full flex items-center justify-center text-white/20 font-black">?</div>
            )}
          </div>
          
          <div className="text-left">
            <h4 className="font-black text-sm uppercase tracking-tighter text-white/90 leading-tight">
              {aluno.nome} {aluno.sobrenome}
            </h4>
            <span className="text-[9px] font-black uppercase tracking-widest text-white/30 block mt-0.5 italic">
              {mostrarDia ? `Vencimento dia ${aluno.dia_vencimento}` : 'Atleta Hecth'}
            </span>
          </div>
        </div>

        <div className="flex items-center gap-3">
          {/* Frequência Semanal (Ex: 2x, 3x) */}
          <div className="bg-white/5 border border-white/5 px-2.5 py-1.5 rounded-xl">
             <span className="text-[10px] font-black text-white/40 italic">
               {aluno.frequencia_semanal ? `${aluno.frequencia_semanal}x` : '--'}
             </span>
          </div>

          {/* Botão de Check */}
          <button 
            onClick={() => confirmarPagamento(aluno)}
            className={`w-10 h-10 rounded-2xl flex items-center justify-center transition-all shadow-lg ${
              aluno.mensalidade_paga 
              ? 'bg-green-500 text-black border-transparent' 
              : 'bg-[#1a1a1a] text-white/10 border border-white/5'
            }`}
          >
            <svg xmlns="http://www.w3.org/2000/svg" width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="4" strokeLinecap="round" strokeLinejoin="round">
              <path d="M20 6L9 17l-5-5"/>
            </svg>
          </button>
        </div>
      </div>
    );
  }

  return (
    <div className="animacao-entrada min-h-screen pb-20">
      {/* Header */}
      <div className="flex items-center gap-4 mb-6">
        <button onClick={onVoltar} className="p-2 bg-white/5 rounded-full text-white/50 active:scale-90 transition-transform">
          <svg xmlns="http://www.w3.org/2000/svg" width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="3" strokeLinecap="round" strokeLinejoin="round"><path d="m15 18-6-6 6-6"/></svg>
        </button>
        <h2 className="text-xl font-black uppercase italic tracking-tighter">Base de Atletas</h2>
      </div>

      {/* Busca */}
      <input 
        type="text" 
        placeholder="BUSCAR NOME DO ATLETA..." 
        className="w-full bg-[#121212] border border-white/10 rounded-2xl px-6 py-4 text-sm font-black uppercase tracking-widest outline-none focus:border-[#ef3340]/50 mb-6 placeholder:text-white/10 text-white"
        value={busca} 
        onChange={(e) => setBusca(e.target.value)}
      />

      {/* Filtros */}
      <div className="flex gap-2 mb-8">
        <button 
          onClick={() => setFiltro('todos')} 
          className={`flex-1 py-3 rounded-xl text-[10px] font-black uppercase tracking-widest transition-all ${filtro === 'todos' ? 'bg-white text-black' : 'bg-white/5 text-white/40'}`}
        >
          Todos A-Z
        </button>
        <button 
          onClick={() => setFiltro('vencimento')} 
          className={`flex-1 py-3 rounded-xl text-[10px] font-black uppercase tracking-widest transition-all ${filtro === 'vencimento' ? 'bg-[#ef3340] text-white' : 'bg-white/5 text-white/40'}`}
        >
          Por Vencimento
        </button>
      </div>

      {/* Lista Principal */}
      <div className="flex flex-col gap-3">
        {loading ? (
          <p className="text-center text-white/20 font-black uppercase text-[10px] py-10 animate-pulse italic tracking-[0.2em]">Sincronizando Base...</p>
        ) : filtro === 'todos' ? (
          alunosFiltrados.map(aluno => <CardAluno key={aluno.id} aluno={aluno} />)
        ) : (
          [10, 15, 20].map(dia => {
            const alunosDoDia = alunosFiltrados.filter(a => a.dia_vencimento === dia);
            if (alunosDoDia.length === 0) return null;
            return (
              <div key={dia} className="mb-8">
                <div className="flex items-center gap-2 mb-4 ml-1">
                  <span className="bg-[#ef3340] text-white text-[10px] font-black px-3 py-1 rounded-full uppercase tracking-widest italic shadow-[0_0_15px_rgba(239,51,64,0.3)]">Dia {dia}</span>
                  <div className="h-[1px] flex-1 bg-white/5"></div>
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