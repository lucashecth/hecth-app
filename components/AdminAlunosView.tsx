// src/components/AdminAlunosView.tsx
"use client";
import { useState, useEffect } from 'react';
import { createPortal } from 'react-dom';
import { supabase } from '../lib/supabase';
import { TagApelido } from './TagApelido';

import { obterNovoMesPago } from '../utils/mensalidade';


interface AdminAlunosViewProps {
  onVoltar: () => void;
}

export function AdminAlunosView({ onVoltar }: AdminAlunosViewProps) {
  const [busca, setBusca] = useState('');
  const [filtro, setFiltro] = useState<'todos' | 'vencimento' | 'ativos' | 'evasoes'>('todos');
  const [alunos, setAlunos] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [mounted, setMounted] = useState(false);

  // Modal Student Editing State
  const [alunoEditando, setAlunoEditando] = useState<any | null>(null);
  const [editFrequencia, setEditFrequencia] = useState<number>(2);
  const [editDiaVencimento, setEditDiaVencimento] = useState<number>(10);
  const [editNivel, setEditNivel] = useState<string>('INICIANTE');
  const [editPersonal, setEditPersonal] = useState<boolean>(false);
  const [editIsAdmin, setEditIsAdmin] = useState<boolean>(false);
  const [editApelido, setEditApelido] = useState<string>('');
  const [fotoAmpliada, setFotoAmpliada] = useState<string | null>(null);
  const [saveLoading, setSaveLoading] = useState(false);


  useEffect(() => { 
    setMounted(true);
    carregarAlunos(); 
  }, []);

  async function carregarAlunos() {
    setLoading(true);
    try {
      const { data, error } = await supabase
        .from('alunos')
        .select('*')
        .eq('status', 'aprovado')
        .order('nome', { ascending: true });

      if (error) throw error;
      if (data) setAlunos(data);
    } catch (err: any) {
      console.error("Erro ao carregar alunos:", err.message);
    } finally {
      setLoading(false);
    }
  }

  function abrirModalAluno(aluno: any) {
    setAlunoEditando(aluno);
    setEditFrequencia(aluno.frequencia_semanal || 2);
    setEditDiaVencimento(aluno.dia_vencimento || 10);
    setEditNivel(aluno.nivel ? String(aluno.nivel).toUpperCase() : 'INICIANTE');
    setEditPersonal(!!aluno.personal);
    setEditIsAdmin(!!aluno.is_admin);
    setEditApelido(aluno.apelido || '');
  }


  async function salvarPerfilAluno() {
    if (!alunoEditando) return;
    setSaveLoading(true);
    try {
      const updates = {
        frequencia_semanal: editFrequencia,
        dia_vencimento: editDiaVencimento,
        nivel: editNivel,
        personal: editPersonal,
        is_admin: editIsAdmin,
        apelido: editApelido
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
      
      let ultimoMes = '';
      if (novoStatus) {
        // Se está confirmando, calcula o novo mês com base no atual/antecipado
        ultimoMes = obterNovoMesPago(aluno);
      } else {
        // Se está estornando, volta para o anterior
        const hoje = new Date();
        const anteriorDate = new Date(hoje.getFullYear(), hoje.getMonth() - 1, 1);
        ultimoMes = `${anteriorDate.getFullYear()}-${String(anteriorDate.getMonth() + 1).padStart(2, '0')}`;
      }

      const { error } = await supabase.from('alunos').update({ 
        mensalidade_paga: novoStatus,
        ultimo_mes_pago: ultimoMes
      }).eq('id', aluno.id);

      if (!error) {
        setAlunos(alunos.map(a => a.id === aluno.id ? { ...a, mensalidade_paga: novoStatus, ultimo_mes_pago: ultimoMes } : a));
      }
    }
  }



  const formatarUltimaInscricao = (dateStr?: string) => {
    if (!dateStr) return "Nunca treinou";
    const diffTime = Math.abs(new Date().getTime() - new Date(dateStr).getTime());
    const diffDays = Math.floor(diffTime / (1000 * 60 * 60 * 24));
    if (diffDays === 0) return "Treinou hoje";
    if (diffDays === 1) return "Treinou ontem";
    return `Treinou há ${diffDays} dias`;
  };

  // Get active (paying) vs total counters
  const totalAlunos = alunos.length;
  const ativosAlunos = alunos.filter(a => a.mensalidade_paga).length;

  const getAlunosFiltrados = () => {
    const list = alunos.filter(aluno =>
      `${aluno.nome} ${aluno.sobrenome}`.toLowerCase().includes(busca.toLowerCase())
    );

    if (filtro === 'ativos') {
      return list.filter(a => a.mensalidade_paga);
    }

    if (filtro === 'evasoes') {
      return list
        .sort((a, b) => {
          const timeA = a.ultima_inscricao ? new Date(a.ultima_inscricao).getTime() : 0;
          const timeB = b.ultima_inscricao ? new Date(b.ultima_inscricao).getTime() : 0;
          return timeA - timeB; // Ascending: oldest first
        });
    }


    return list;
  };

  const alunosFiltrados = getAlunosFiltrados();

  function CardAluno({ aluno, mostrarDia, mostrarUltimaInscricao }: { aluno: any, mostrarDia?: boolean, mostrarUltimaInscricao?: boolean }) {
    const nivelDoBanco = aluno.nivel ? String(aluno.nivel).toUpperCase() : 'INICIANTE';
    
    const normNivel = String(aluno.nivel || 'Aprendiz').toLowerCase().trim().normalize('NFD').replace(/[\u0300-\u036f]/g, '');
    let borderClass = 'border-white/20';

    if (normNivel === 'aprendiz') {
      borderClass = 'border-white';
    } else if (normNivel === 'iniciante') {
      borderClass = 'border-green-400';
    } else if (normNivel === 'iniciante avancado') {
      borderClass = 'border-blue-400';
    } else if (normNivel === 'intermediario') {
      borderClass = 'border-purple-400';
    } else if (normNivel === 'professor') {
      borderClass = 'border-orange-500';
    }


    return (
      <div 
        onClick={() => abrirModalAluno(aluno)}
        className={`w-full bg-[#121212] border rounded-2xl p-4 flex items-center justify-between transition-all cursor-pointer active:scale-[0.98] ${aluno.mensalidade_paga ? 'border-green-500/30' : 'border-white/5'}`}
      >
        <div className="flex items-center gap-3 flex-1 text-left">
          <div className={`w-12 h-12 rounded-full border-2 shrink-0 flex items-center justify-center p-[2px] ${borderClass}`}>
            <div className="w-full h-full rounded-full overflow-hidden flex items-center justify-center bg-white/5">
              {aluno.foto_url ? (
                <img src={aluno.foto_url} alt="" className="w-full h-full object-cover" />
              ) : (
                <span className="text-xs">👤</span>
              )}
            </div>
          </div>


          <div>
            <h4 className="font-black text-sm uppercase tracking-tight text-white/90 leading-tight flex items-center gap-1.5 flex-wrap">
              {aluno.nome} {aluno.sobrenome}
              <TagApelido apelido={aluno.apelido} mode="name" />
            </h4>


            <div className="flex flex-wrap gap-1 mt-1">
              {mostrarDia ? (
                <span className={`text-[10px] font-black uppercase italic ${aluno.mensalidade_paga ? 'text-green-400' : 'text-[#ef3340]'}`}>
                  Vencimento dia {aluno.dia_vencimento || 10}
                </span>
              ) : mostrarUltimaInscricao ? (
                <div className="flex gap-2 items-center flex-wrap">
                  <span className="text-[9px] font-black uppercase px-2 py-0.5 rounded border border-[#ef3340]/25 text-[#ef3340] bg-[#ef3340]/5 italic">
                    {formatarUltimaInscricao(aluno.ultima_inscricao)}
                  </span>
                  <span className={`text-[9px] font-black uppercase px-2 py-0.5 rounded border italic ${aluno.mensalidade_paga ? 'border-green-500/30 text-green-400 bg-green-500/5' : 'border-white/10 text-white/40 bg-white/5'}`}>
                    {aluno.mensalidade_paga ? 'Ativo' : 'Inativo'}
                  </span>
                </div>

              ) : (
                (() => {
                  let levelTagStyle = 'bg-white/5 text-white border-white/10';
                  if (normNivel === 'aprendiz') {
                    levelTagStyle = 'bg-white/5 text-white border-white/10';
                  } else if (normNivel === 'iniciante') {
                    levelTagStyle = 'bg-green-500/10 text-green-400 border-green-500/20';
                  } else if (normNivel === 'iniciante avancado') {
                    levelTagStyle = 'bg-blue-500/10 text-blue-400 border-blue-500/20';
                  } else if (normNivel === 'intermediario') {
                    levelTagStyle = 'bg-purple-500/10 text-purple-400 border-purple-500/20';
                  } else if (normNivel === 'professor') {
                    levelTagStyle = 'bg-orange-500/10 text-orange-400 border-orange-500/20';
                  }

                  return (
                    <TagApelido 
                      apelido={aluno.apelido} 
                      nivel={nivelDoBanco} 
                      levelStyle={levelTagStyle} 
                      mode="level" 
                      className="!mt-0"
                    />
                  );
                })()
              )}


              {aluno.personal && (
                <span className="text-[9px] font-black uppercase px-2 py-0.5 rounded border border-amber-500/30 text-amber-500 bg-amber-500/5 italic tracking-wider">
                  ★ Personal
                </span>
              )}
            </div>
          </div>
        </div>

        <div className="flex items-center gap-2" onClick={(e) => e.stopPropagation()}>
          <div 
            onClick={(e) => alterarFrequencia(e, aluno)} 
            className={`px-3 py-2 rounded-xl border flex items-center justify-center cursor-pointer hover:bg-white/10 ${aluno.mensalidade_paga ? 'bg-green-500/10 border-green-400/50' : 'bg-white/5 border-white/10'}`}
          >
            <span className={`text-xs font-black ${aluno.mensalidade_paga ? 'text-green-400' : 'text-white/40'}`}>
              {aluno.frequencia_semanal || 2}x
            </span>
          </div>
          <div 
            onClick={(e) => confirmarPagamento(e, aluno)} 
            className={`w-10 h-10 rounded-xl flex items-center justify-center cursor-pointer hover:scale-105 ${aluno.mensalidade_paga ? 'bg-green-500 text-black' : 'bg-[#1a1a1a] text-white/10 border border-white/5'}`}
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
      <div 
        onClick={() => setAlunoEditando(null)}
        className="fixed inset-0 bg-black/80 backdrop-blur-md z-[99999] flex items-center justify-center p-4"
      >
        <div 
          onClick={(e) => e.stopPropagation()}
          className="bg-[#121212] border border-white/10 rounded-3xl p-6 max-w-md w-full shadow-2xl relative"
        >
          <div className="flex items-center justify-between mb-6">
            <h3 className="font-black text-lg text-white uppercase italic">Perfil do Atleta</h3>
            <button 
              onClick={() => setAlunoEditando(null)} 
              className="text-white/40 hover:text-white font-black text-base p-2 rounded-lg hover:bg-white/5 transition-colors"
            >
              ✕
            </button>
          </div>

          <div className="flex items-center gap-4 mb-6">
            <div 
              onClick={() => alunoEditando.foto_url && setFotoAmpliada(alunoEditando.foto_url)}
              className={`w-16 h-16 rounded-2xl overflow-hidden border border-white/10 bg-white/5 shrink-0 flex items-center justify-center ${alunoEditando.foto_url ? 'cursor-pointer hover:opacity-80 active:scale-95 transition-all' : ''}`}
            >
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
                <option value="APRENDIZ">Aprendiz</option>
                <option value="INICIANTE">Iniciante</option>
                <option value="INICIANTE AVANÇADO">Iniciante Avançado</option>
                <option value="INTERMEDIÁRIO">Intermediário</option>
                <option value="PROFESSOR">Professor</option>
              </select>
            </div>

            <div>
              <label className="text-[10px] font-black uppercase tracking-widest text-white/40 mb-1 block">Apelido (Aparece ao lado do Nome)</label>
              <input 
                type="text" 
                placeholder="Ex: Master, VIP, etc." 
                value={editApelido}
                onChange={(e) => setEditApelido(e.target.value)}
                className="w-full bg-[#1a1a1a] border border-white/10 rounded-xl px-4 py-3 text-white outline-none focus:ring-1 focus:ring-[#ef3340] text-sm font-bold"
              />
            </div>


            <div className="flex items-center gap-3 bg-white/5 border border-white/10 rounded-xl p-4">
              <input 
                type="checkbox" 
                id="checkbox-personal"
                checked={editPersonal}
                onChange={(e) => setEditPersonal(e.target.checked)}
                className="w-5 h-5 rounded border-white/20 bg-[#1a1a1a] text-[#ef3340] focus:ring-0 focus:ring-offset-0 cursor-pointer"
              />
              <label htmlFor="checkbox-personal" className="text-xs font-black uppercase tracking-wider text-white/80 cursor-pointer select-none">
                Aluno de Personal
              </label>
            </div>

            <div className="flex items-center gap-3 bg-white/5 border border-white/10 rounded-xl p-4">
              <input 
                type="checkbox" 
                id="checkbox-admin"
                checked={editIsAdmin}
                onChange={(e) => setEditIsAdmin(e.target.checked)}
                className="w-5 h-5 rounded border-white/20 bg-[#1a1a1a] text-[#ef3340] focus:ring-0 focus:ring-offset-0 cursor-pointer"
              />
              <label htmlFor="checkbox-admin" className="text-xs font-black uppercase tracking-wider text-white/80 cursor-pointer select-none">
                Acesso de Gestor (Admin)
              </label>
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

    const imageOverlay = fotoAmpliada && (
      <div 
        onClick={() => setFotoAmpliada(null)}
        className="fixed inset-0 bg-black/95 backdrop-blur-lg z-[100000] flex flex-col items-center justify-center p-6 animacao-entrada"
      >
        <button 
          onClick={() => setFotoAmpliada(null)}
          className="absolute top-6 right-6 text-white bg-white/10 hover:bg-white/20 w-10 h-10 rounded-full text-base font-black flex items-center justify-center transition-colors"
        >
          ✕
        </button>
        <div className="w-full max-w-xs aspect-square rounded-3xl overflow-hidden border border-white/10 bg-[#121212] shadow-2xl flex items-center justify-center">
          <img src={fotoAmpliada} alt="Foto Ampliada" className="w-full h-full object-cover" />
        </div>
        <span className="text-[10px] font-black uppercase tracking-[0.25em] text-white/40 italic mt-6">Clique em qualquer lugar para fechar</span>
      </div>
    );

    return createPortal(
      <>
        {modalContent}
        {imageOverlay}
      </>,
      document.body
    );
  };


  return (
    <div className="animacao-entrada w-full pb-20 pt-4 max-w-lg mx-auto">
      <div className="flex items-center gap-4 mb-6 px-5">
        <button onClick={onVoltar} className="p-2 bg-white/5 rounded-full text-white/50 hover:text-white transition-colors">
          <svg xmlns="http://www.w3.org/2000/svg" width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="3" strokeLinecap="round" strokeLinejoin="round"><path d="m15 18-6-6 6-6"/></svg>
        </button>
        <div className="flex justify-between items-center flex-1">
          <h2 className="text-xl font-black uppercase italic tracking-tight">BASE DE ATLETAS</h2>
          <span className="text-[10px] font-black tracking-widest bg-[#ef3340]/10 border border-[#ef3340]/25 px-3 py-1 rounded-full text-[#ef3340] italic">
            {ativosAlunos}/{totalAlunos} ATIVOS
          </span>
        </div>
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

      {/* Grid of 4 Filters */}
      <div className="grid grid-cols-2 gap-2 mb-6 px-5">
        <button 
          onClick={() => setFiltro('todos')} 
          className={`py-3 rounded-xl text-[10px] font-black uppercase tracking-wider transition-all ${filtro === 'todos' ? 'bg-white text-black shadow-md' : 'bg-white/5 text-white/40 border border-white/5 hover:bg-white/10'}`}
        >
          TODOS A-Z
        </button>
        <button 
          onClick={() => setFiltro('vencimento')} 
          className={`py-3 rounded-xl text-[10px] font-black uppercase tracking-wider transition-all ${filtro === 'vencimento' ? 'bg-[#ef3340] text-white shadow-md' : 'bg-white/5 text-white/40 border border-white/5 hover:bg-white/10'}`}
        >
          VENCIMENTO
        </button>
        <button 
          onClick={() => setFiltro('ativos')} 
          className={`py-3 rounded-xl text-[10px] font-black uppercase tracking-wider transition-all ${filtro === 'ativos' ? 'bg-green-600 text-white shadow-md' : 'bg-white/5 text-white/40 border border-white/5 hover:bg-white/10'}`}
        >
          ATIVOS
        </button>
        <button 
          onClick={() => setFiltro('evasoes')} 
          className={`py-3 rounded-xl text-[10px] font-black uppercase tracking-wider transition-all ${filtro === 'evasoes' ? 'bg-yellow-600 text-white shadow-md' : 'bg-white/5 text-white/40 border border-white/5 hover:bg-white/10'}`}
        >
          EVASÕES
        </button>
      </div>

      <div className="flex flex-col gap-3 px-2">
        {loading ? (
          <p className="text-center py-10 text-white/20 text-[10px] font-black uppercase tracking-widest animate-pulse italic">Sincronizando...</p>
        ) : getAlunosFiltrados().length === 0 ? (
          <p className="text-center py-10 text-white/40 text-xs font-black uppercase tracking-wider italic">Nenhum atleta encontrado</p>
        ) : filtro === 'vencimento' ? (
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
        ) : (
          alunosFiltrados.map(aluno => (
            <CardAluno 
              key={aluno.id} 
              aluno={aluno} 
              mostrarUltimaInscricao={filtro === 'evasoes'}
            />
          ))
        )}
      </div>

      {renderModal()}
    </div>
  );
}