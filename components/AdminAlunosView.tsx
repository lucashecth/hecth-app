// src/components/AdminAlunosView.tsx
"use client";
import { useState, useEffect } from 'react';
import { createPortal } from 'react-dom';
import { supabase } from '../lib/supabase';

interface AdminAlunosViewProps {
  onVoltar: () => void;
}

export function AdminAlunosView({ onVoltar }: AdminAlunosViewProps) {
  const [busca, setBusca] = useState('');
  const [filtro, setFiltro] = useState<'todos' | 'vencimento'>('todos');
  const [alunos, setAlunos] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [mounted, setMounted] = useState(false);

  // Modal Student Editing State
  const [alunoEditando, setAlunoEditando] = useState<any | null>(null);
  const [editFrequencia, setEditFrequencia] = useState<number>(2);
  const [editDiaVencimento, setEditDiaVencimento] = useState<number>(10);
  const [editNivel, setEditNivel] = useState<string>('INICIANTE');
  const [saveLoading, setSaveLoading] = useState(false);

  useEffect(() => { 
    setMounted(true);
    carregarAlunos(); 
  }, []);

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

  function abrirModalAluno(aluno: any) {
    setAlunoEditando(aluno);
    setEditFrequencia(aluno.frequencia_semanal || 2);
    setEditDiaVencimento(aluno.dia_vencimento || 10);
    setEditNivel(aluno.nivel ? aluno.nivel.toUpperCase() : 'INICIANTE');
  }

  async function salvarPerfilAluno() {
    if (!alunoEditando) return;
    setSaveLoading(true);
    try {
      const updates = {
        frequencia_semanal: editFrequencia,
        dia_vencimento: editDiaVencimento,
        nivel: editNivel
      };

      const { error } = await supabase
        .from('alunos')
        .update(updates)
        .eq('id', alunoEditando.id);

      if (error) throw error;

      setAlunos(prev => prev.map(a => a.id === alunoEditando.id ? { ...a, ...updates } : a));
      setAlunoEditando(null);
      alert("Perfil do atleta atualizado com sucesso!");
    } catch (err: any) {
      alert("Erro ao atualizar perfil: " + err.message);
    } finally {
      setSaveLoading(false);
    }
  }

  async function alterarFrequencia(e: React.MouseEvent, aluno: any) {
    e.stopPropagation(); 
    const frequencias = [2, 3, 5];
    const indexAtual = frequencias.indexOf(aluno.frequencia_semanal || 2);
    const novaFreq = frequencias[(indexAtual + 1) % frequencias.length];
    
    const confirmar = window.confirm(`Deseja realmente alterar os dias do aluno ${aluno.nome} ${aluno.sobrenome} para ${novaFreq}x na semana?`);
    
    if (confirmar) {
      const { error } = await supabase.from('alunos').update({ frequencia_semanal: novaFreq }).eq('id', aluno.id);
      if (!error) {
        setAlunos(alunos.map(a => a.id === aluno.id ? { ...a, frequencia_semanal: novaFreq } : a));
      }
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
    const nivelDoBanco = aluno.nivel ? aluno.nivel.toUpperCase() : 'INICIANTE';
    
    return (
      <div 
        onClick={() => abrirModalAluno(aluno)}
        className={`w-full bg-[#121212] border rounded-2xl p-4 flex items-center justify-between transition-all cursor-pointer active:scale-[0.98] ${aluno.mensalidade_paga ? 'border-green-500/30' : 'border-white/5'}`}
      >
        <div className="flex items-center gap-3 flex-1 text-left">
          <div className="w-12 h-12 rounded-xl overflow-hidden border border-white/10 shrink-0 bg-white/5 flex items-center justify-center">
            {aluno.foto_url ? (
              <img src={aluno.foto_url} alt="" className="w-full h-full object-cover" />
            ) : (
              <span className="text-xs">👤</span>
            )}
          </div>
          <div>
            <h4 className="font-black text-sm uppercase tracking-tight text-white/90 leading-tight">
              {aluno.nome} {aluno.sobrenome}
            </h4>
            <div className="flex flex-wrap gap-1 mt-1">
              {mostrarDia ? (
                <span className={`text-[10px] font-black uppercase italic ${aluno.mensalidade_paga ? 'text-green-400' : 'text-[#ef3340]'}`}>
                  Vencimento dia {aluno.dia_vencimento || 10}
                </span>
              ) : (
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
      </div>
    );
  }

  const diasComuns = [5, 10, 15, 20];

  const renderModal = () => {
    if (!alunoEditando || !mounted) return null;

    const modalContent = (
      <div className="fixed inset-0 bg-black/80 backdrop-blur-sm z-[9999] flex items-center justify-center p-4">
        <div className="bg-[#121212] border border-white/10 rounded-3xl p-6 max-w-md w-full animacao-entrada shadow-2xl">
          <div className="flex items-center justify-between mb-6">
            <h3 className="font-black text-lg text-white uppercase italic">Perfil do Atleta</h3>
            <button 
              onClick={() => setAlunoEditando(null)} 
              className="text-white/40 hover:text-white font-black text-sm p-1"
            >
              ✕
            </button>
          </div>

          <div className="flex items-center gap-4 mb-6">
            <div className="w-16 h-16 rounded-2xl overflow-hidden border border-white/10 bg-white/5 shrink-0 flex items-center justify-center">
              {alunoEditando.foto_url ? (
                <img src={alunoEditando.foto_url} alt="" className="w-full h-full object-cover" />
              ) : (
                <span className="text-xl">👤</span>
              )}
            </div>
            <div>
              <h4 className="font-black text-base text-white uppercase">{alunoEditando.nome} {alunoEditando.sobrenome}</h4>
              <p className="text-xs text-white/40">{alunoEditando.email}</p>
            </div>
          </div>

          <div className="flex flex-col gap-4">
            <div>
              <label className="text-[10px] font-black uppercase tracking-widest text-white/40 mb-1 block">Nível</label>
              <select 
                value={editNivel}
                onChange={(e) => setEditNivel(e.target.value)}
                className="w-full bg-[#1a1a1a] border border-white/10 rounded-xl px-4 py-3 text-white outline-none focus:ring-1 focus:ring-[#ef3340] text-sm font-bold uppercase"
              >
                <option value="INICIANTE">Iniciante</option>
                <option value="INTERMEDIÁRIO">Intermediário</option>
                <option value="AVANÇADO">Avançado</option>
              </select>
            </div>

            <div>
              <label className="text-[10px] font-black uppercase tracking-widest text-white/40 mb-2 block">Dias na Semana</label>
              <div className="flex gap-2">
                {[2, 3, 5].map((freq) => (
                  <button 
                    key={freq}
                    type="button"
                    onClick={() => setEditFrequencia(freq)}
                    className={`flex-1 py-3 rounded-xl text-xs font-black uppercase transition-all ${editFrequencia === freq ? 'bg-[#ef3340] text-white shadow-lg' : 'bg-white/5 text-white/40 border border-white/5'}`}
                  >
                    {freq}x / sem
                  </button>
                ))}
              </div>
            </div>

            <div>
              <label className="text-[10px] font-black uppercase tracking-widest text-white/40 mb-1 block">Dia do Vencimento</label>
              <input 
                type="number"
                min="1"
                max="31"
                value={editDiaVencimento}
                onChange={(e) => setEditDiaVencimento(Number(e.target.value))}
                className="w-full bg-white/5 border border-white/10 rounded-xl px-4 py-3 text-white outline-none focus:ring-1 focus:ring-[#ef3340] text-sm font-bold text-center mb-2"
              />
              <div className="flex gap-2">
                {diasComuns.map((dia) => (
                  <button 
                    key={dia}
                    type="button"
                    onClick={() => setEditDiaVencimento(dia)}
                    className={`flex-1 py-2 rounded-lg text-xs font-black uppercase transition-all ${editDiaVencimento === dia ? 'bg-white text-black' : 'bg-white/5 text-white/40 border border-white/5'}`}
                  >
                    Dia {dia}
                  </button>
                ))}
              </div>
            </div>

            <div className="flex gap-2 mt-4">
              <button 
                onClick={salvarPerfilAluno}
                disabled={saveLoading}
                className="flex-1 bg-[#ef3340] text-white text-xs font-black uppercase tracking-widest py-3.5 rounded-xl active:scale-95 transition-all shadow-[0_0_15px_rgba(239,51,64,0.3)] disabled:opacity-50"
              >
                {saveLoading ? 'Salvando...' : 'Salvar Alterações'}
              </button>
              <button 
                onClick={() => setAlunoEditando(null)}
                className="flex-1 bg-white/10 text-white text-xs font-black uppercase tracking-widest py-3.5 rounded-xl hover:bg-white/20 transition-all"
              >
                Cancelar
              </button>
            </div>
          </div>
        </div>
      </div>
    );

    return createPortal(modalContent, document.body);
  };

  return (
    <div className="animacao-entrada w-full pb-20 pt-4 max-w-lg mx-auto">
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
          [5, 10, 15, 20].map(dia => {
            const alunosDoDia = alunosFiltrados.filter(a => (a.dia_vencimento || 10) === dia);
            if (!alunosDoDia.length) return null;
            return (
              <div key={dia}>
                <div className="flex items-center gap-2 mb-3 px-3">
                  <span className="bg-[#ef3340] text-white text-[10px] font-black px-3 py-1 rounded-full italic tracking-widest">DIA {dia}</span>
                  <div className="h-[1px] flex-1 bg-[#ffffff1a]"></div>
                </div>
                <div className="flex flex-col gap-3">
                  {alunosDoDia.map(aluno => <CardAluno key={aluno.id} aluno={aluno} mostrarDia />)}
                </div>
              </div>
            );
          })
        )}
      </div>

      {renderModal()}
    </div>
  );
}