"use client";
import { useState, useEffect } from 'react';
import { supabase } from '../lib/supabase';

interface AdminExperimentalViewProps {
  onVoltar: () => void;
  alunoDb: any; // Usuário logado (autor)
}

export function AdminExperimentalView({ onVoltar, alunoDb }: AdminExperimentalViewProps) {
  const [loading, setLoading] = useState(true);
  const [turmas, setTurmas] = useState<any[]>([]);
  const [turmaSelecionada, setTurmaSelecionada] = useState<any | null>(null);
  const [nomeExperimental, setNomeExperimental] = useState('');
  const [experimentaisDaTurma, setExperimentaisDaTurma] = useState<any[]>([]);
  const [salvando, setSalvando] = useState(false);

  useEffect(() => {
    carregarTurmas();
  }, []);

  useEffect(() => {
    if (turmaSelecionada) {
      carregarExperimentais(turmaSelecionada.id);
    } else {
      setExperimentaisDaTurma([]);
    }
  }, [turmaSelecionada]);

  const carregarTurmas = async () => {
    setLoading(true);
    try {
      const { data, error } = await supabase
        .from('turmas')
        .select('*')
        .order('horario', { ascending: true });
      if (error) throw error;
      setTurmas(data || []);
    } catch (e: any) {
      alert('Erro ao carregar turmas: ' + e.message);
    } finally {
      setLoading(false);
    }
  };

  const carregarExperimentais = async (turmaId: number) => {
    try {
      const { data, error } = await supabase
        .from('presencas')
        .select('*')
        .eq('turma_id', turmaId);

      if (error) throw error;

      // Filtra apenas as presenças que começam com 'experimental_'
      const exps = (data || [])
        .filter((p: any) => p.aluno_email?.startsWith('experimental_'))
        .map((p: any) => {
          const parts = p.aluno_email.split('_');
          const nomeVisitante = parts[2]?.replace(/-/g, ' ') || 'Visitante';
          const autorRaw = parts[3]?.replace(/-/g, ' ') || 'N/A';
          const autorFormatado = autorRaw.replace('Marcado-por-', '');

          return {
            id: p.id,
            nome: nomeVisitante,
            marcadoPor: autorFormatado,
            aluno_email: p.aluno_email
          };
        });

      setExperimentaisDaTurma(exps);
    } catch (e: any) {
      alert('Erro ao carregar experimentais da turma: ' + e.message);
    }
  };

  const agendarExperimental = async () => {
    if (!turmaSelecionada) return;
    if (!nomeExperimental.trim()) return alert('Por favor, digite o primeiro nome do aluno!');
    if (turmaSelecionada.vagas_ocupadas >= turmaSelecionada.vagas_totais) {
      return alert('Esta turma já está lotada!');
    }

    setSalvando(true);
    try {
      const timestamp = Date.now();
      const nomeLimpo = nomeExperimental.trim().replace(/_/g, ' ').replace(/ /g, '-');
      const autorLimpo = (alunoDb?.nome || 'Admin').trim().replace(/_/g, ' ').replace(/ /g, '-');
      
      // Monta a string do "e-mail" fictício
      const pseudoEmail = `experimental_${timestamp}_${nomeLimpo}_Marcado-por-${autorLimpo}`;
      const inicial = nomeExperimental.trim().charAt(0).toUpperCase();

      // 1. Insere na tabela presencas
      const { error: insError } = await supabase
        .from('presencas')
        .insert([{
          turma_id: turmaSelecionada.id,
          aluno_email: pseudoEmail,
          inicial: inicial
        }]);

      if (insError) throw insError;

      // 2. Incrementa a vaga na turma
      const novasVagas = (turmaSelecionada.vagas_ocupadas || 0) + 1;
      const { error: updError } = await supabase
        .from('turmas')
        .update({ vagas_ocupadas: novasVagas })
        .eq('id', turmaSelecionada.id);

      if (updError) throw updError;

      // 3. Atualiza localmente a turma selecionada e a lista
      setTurmaSelecionada((prev: any) => prev ? { ...prev, vagas_ocupadas: novasVagas } : null);
      setTurmas(prev => prev.map(t => t.id === turmaSelecionada.id ? { ...t, vagas_ocupadas: novasVagas } : t));
      setNomeExperimental('');
      
      await carregarExperimentais(turmaSelecionada.id);
      alert('🧪 Aula experimental agendada com sucesso!');
    } catch (e: any) {
      alert('Erro ao agendar experimental: ' + e.message);
    } finally {
      setSalvando(false);
    }
  };

  const removerExperimental = async (exp: any) => {
    if (!turmaSelecionada) return;
    if (!window.confirm(`Remover agendamento experimental de ${exp.nome}?`)) return;

    try {
      // 1. Deleta a presença
      const { error: delError } = await supabase
        .from('presencas')
        .delete()
        .eq('id', exp.id);

      if (delError) throw delError;

      // 2. Decrementa a vaga na turma
      const novasVagas = Math.max(0, (turmaSelecionada.vagas_ocupadas || 0) - 1);
      const { error: updError } = await supabase
        .from('turmas')
        .update({ vagas_ocupadas: novasVagas })
        .eq('id', turmaSelecionada.id);

      if (updError) throw updError;

      // 3. Atualiza os estados locais
      setTurmaSelecionada((prev: any) => prev ? { ...prev, vagas_ocupadas: novasVagas } : null);
      setTurmas(prev => prev.map(t => t.id === turmaSelecionada.id ? { ...t, vagas_ocupadas: novasVagas } : t));
      
      await carregarExperimentais(turmaSelecionada.id);
      alert('Vaga experimental liberada!');
    } catch (e: any) {
      alert('Erro ao remover experimental: ' + e.message);
    }
  };

  return (
    <div className="animacao-entrada px-5 pb-20 pt-4">
      {/* HEADER */}
      <div className="flex items-center gap-4 mb-8">
        <button onClick={onVoltar} className="p-3 bg-white/5 rounded-full text-white/50 active:scale-95 transition-transform">
          <svg xmlns="http://www.w3.org/2000/svg" width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="3" strokeLinecap="round" strokeLinejoin="round"><path d="m15 18-6-6 6-6"/></svg>
        </button>
        <div>
          <h2 className="text-2xl font-black uppercase italic tracking-tighter text-[#ef3340] leading-none mb-1">Aulas Experimentais</h2>
          <p className="text-[10px] text-white/40 uppercase font-black tracking-widest">Reserva e Controle de Vagas</p>
        </div>
      </div>

      {loading ? (
        <div className="flex flex-col items-center justify-center py-20 gap-4">
          <div className="w-10 h-10 rounded-full border-t-2 border-r-2 border-[#ef3340] animate-spin" />
          <span className="text-[10px] text-white/40 uppercase font-black tracking-widest">Carregando Turmas...</span>
        </div>
      ) : !turmaSelecionada ? (
        /* SELEÇÃO DE TURMAS */
        <div className="flex flex-col gap-3 text-left">
          <label className="text-[10px] font-black uppercase tracking-widest text-white/40 mb-1 block">Selecione o Horário/Turma</label>
          {turmas.map((t) => {
            const lotada = t.vagas_ocupadas >= t.vagas_totais;
            return (
              <button
                key={t.id}
                onClick={() => setTurmaSelecionada(t)}
                className="w-full bg-[#121212] border border-white/5 hover:border-white/10 rounded-2xl p-5 flex items-center justify-between transition-all active:scale-[0.99] text-left"
              >
                <div>
                  <span className="font-black text-sm uppercase tracking-tight text-white/90 block leading-tight">{t.nome}</span>
                  <span className="text-[10px] font-black text-white/40 uppercase tracking-wider block mt-1">Horário: {t.horario}</span>
                </div>
                <div className="text-right">
                  <span className={`text-[10px] font-black uppercase tracking-widest px-2.5 py-1 rounded-md border ${lotada ? 'bg-red-500/10 text-red-400 border-red-500/20' : 'bg-green-500/10 text-green-400 border-green-500/20'}`}>
                    {t.vagas_ocupadas} / {t.vagas_totais} vagas
                  </span>
                </div>
              </button>
            );
          })}
        </div>
      ) : (
        /* AGENDAMENTO NA TURMA SELECIONADA */
        <div className="flex flex-col gap-6 text-left animacao-entrada">
          {/* Cartão Informativo da Turma */}
          <div className="bg-[#121212] border border-white/5 p-5 rounded-3xl flex justify-between items-center">
            <div>
              <span className="text-white/40 text-[9px] font-black uppercase tracking-widest block mb-0.5">Turma Selecionada</span>
              <h3 className="font-black text-lg text-white uppercase tracking-tight leading-none mb-1">{turmaSelecionada.nome}</h3>
              <p className="text-[10px] text-orange-400 font-bold uppercase tracking-wider">Horário: {turmaSelecionada.horario}</p>
            </div>
            <button 
              onClick={() => setTurmaSelecionada(null)}
              className="text-[9px] font-black uppercase tracking-wider border border-white/10 bg-white/5 px-3 py-2 rounded-xl text-white/60 hover:text-white"
            >
              Trocar
            </button>
          </div>

          {/* Form Cadastro */}
          <div className="bg-[#121212] border border-white/5 p-6 rounded-3xl flex flex-col gap-4">
            <h4 className="text-xs font-black uppercase tracking-widest text-[#ef3340] italic leading-none border-b border-white/5 pb-3">Agendar Novo Experimental</h4>
            <div>
              <label className="text-[9px] font-black uppercase tracking-widest text-white/40 mb-1.5 block">Nome do Aluno (Visitante)</label>
              <input 
                type="text" 
                placeholder="Ex: Gabriel"
                value={nomeExperimental}
                onChange={(e) => setNomeExperimental(e.target.value)}
                className="w-full bg-[#1a1a1a] border border-white/10 rounded-xl px-4 py-3 text-white outline-none focus:ring-1 focus:ring-[#ef3340] text-sm font-bold"
              />
            </div>
            <button
              onClick={agendarExperimental}
              disabled={salvando}
              className="w-full bg-gradient-to-r from-orange-500 to-[#ef3340] text-white text-[11px] font-black uppercase tracking-widest py-4 rounded-xl active:scale-95 transition-all shadow-[0_0_15px_rgba(239,51,64,0.3)] disabled:opacity-50 mt-1"
            >
              {salvando ? 'Agendando...' : 'Confirmar Reserva de Vaga'}
            </button>
          </div>

          {/* Listagem de já Agendados */}
          <div className="bg-[#121212] border border-white/5 p-6 rounded-3xl flex flex-col gap-4">
            <h4 className="text-xs font-black uppercase tracking-widest text-white/60 leading-none border-b border-white/5 pb-3">
              Experimentais Agendados ({experimentaisDaTurma.length})
            </h4>

            {experimentaisDaTurma.length === 0 ? (
              <p className="text-[10px] text-white/20 uppercase font-black tracking-widest italic py-4 text-center">Nenhum experimental agendado nesta turma</p>
            ) : (
              <div className="flex flex-col gap-3">
                {experimentaisDaTurma.map((exp) => (
                  <div key={exp.id} className="bg-white/5 border border-white/5 rounded-2xl p-4 flex items-center justify-between">
                    <div>
                      <span className="font-black text-sm uppercase tracking-tight text-white/90 block leading-tight">{exp.nome}</span>
                      <span className="text-[9px] text-[#ef3340] font-black uppercase tracking-wider block mt-0.5">Marcado por: {exp.marcadoPor}</span>
                    </div>
                    <button
                      onClick={() => removerExperimental(exp)}
                      className="text-[9px] font-black uppercase tracking-wider bg-red-500/10 text-red-400 border border-red-500/20 px-3 py-1.5 rounded-lg active:scale-95 transition-all"
                    >
                      Remover
                    </button>
                  </div>
                ))}
              </div>
            )}
          </div>
        </div>
      )}
    </div>
  );
}
