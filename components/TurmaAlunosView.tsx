// src/components/TurmaAlunosView.tsx
"use client";
import { useState, useEffect } from 'react';
import { supabase } from '../lib/supabase';
import { TagApelido } from './TagApelido';


interface TurmaAlunosViewProps {
  turma: any;
  onVoltar: () => void;
  isAdmin?: boolean;
}

export function TurmaAlunosView({ turma, onVoltar, isAdmin }: TurmaAlunosViewProps) {
  const [alunosInscritos, setAlunosInscritos] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [cancelandoAula, setCancelandoAula] = useState(false);

  useEffect(() => {
    async function carregarInscritos() {
      // 1. Busca as presenças desta turma
      const { data: presencas } = await supabase.from('presencas').select('*').eq('turma_id', turma.id);
      
      if (!presencas || presencas.length === 0) {
        setLoading(false);
        return;
      }

      // Filtra apenas presenças pertencentes ao ciclo de exibição atual (corte 20:30)
      const agoraCheck = new Date();
      const inicioCiclo = new Date(agoraCheck);
      if (agoraCheck.getHours() > 20 || (agoraCheck.getHours() === 20 && agoraCheck.getMinutes() >= 30)) {
        inicioCiclo.setHours(20, 30, 0, 0);
      } else {
        inicioCiclo.setDate(inicioCiclo.getDate() - 1);
        inicioCiclo.setHours(20, 30, 0, 0);
      }

      const presencasFiltradas = presencas.filter((p: any) => {
        if (!p.created_at) return true;
        return new Date(p.created_at) >= inicioCiclo;
      });

      if (presencasFiltradas.length === 0) {
        setLoading(false);
        return;
      }

      // 2. Busca os dados completos dos alunos no banco
      const { data: alunosData } = await supabase.from('alunos').select('*');

      // 3. Junta os dados com o horário de inscrição (formato HH:MM)
      const alunosMontados = presencasFiltradas.map(p => {
        const isExp = p.aluno_email?.startsWith('experimental_');
        let horaFormatada = "--:--";
        if (p.created_at) {
          const dataHora = new Date(p.created_at);
          horaFormatada = dataHora.toLocaleTimeString('pt-BR', { hour: '2-digit', minute: '2-digit' });
        }

        if (isExp) {
          const parts = p.aluno_email.split('_');
          const nomeVisitante = parts[2]?.replace(/-/g, ' ') || 'Visitante';
          const primeiroNome = nomeVisitante.split(' ')[0];

          return {
            id: p.id,
            nome: primeiroNome,
            sobrenome: '(Experimental)',
            apelido: '',
            foto_url: null,
            nivel: 'Aprendiz',
            hora_inscricao: horaFormatada,
            isExperimental: true
          };
        } else {
          const pEmail = (p.aluno_email || '').toLowerCase().trim();
          const aluno = alunosData?.find(a => (a.email || '').toLowerCase().trim() === pEmail);
          return {
            ...(aluno || { 
              id: p.id, 
              nome: p.inicial ? `Aluno (${p.inicial})` : 'Aluno', 
              sobrenome: '', 
              foto_url: p.foto_url || null, 
              nivel: p.nivel || 'Aprendiz' 
            }),
            hora_inscricao: horaFormatada,
            isExperimental: false
          };
        }
      });
      setAlunosInscritos(alunosMontados);
      setLoading(false);
    }
    
    carregarInscritos();
  }, [turma.id]);

  const handleCancelarAulaEDevolverCreditos = async () => {
    if (alunosInscritos.length === 0) {
      return alert('Não há alunos inscritos nesta turma para reembolsar.');
    }

    const confirmar = window.confirm(
      `⚠️ CANCELAMENTO DE AULA\n\nDeseja cancelar esta aula de ${turma.horario} e DEVOLVER 1 CRÉDITO DE AULA a todos os ${alunosInscritos.length} alunos inscritos?\n\nAs presenças desta aula serão limpas e o crédito avulso será adicionado no perfil de cada atleta.`
    );
    if (!confirmar) return;

    setCancelandoAula(true);
    try {
      // 1. Busca todos os alunos no banco para incrementar créditos
      const { data: todosAlunos } = await supabase.from('alunos').select('*');

      for (const inscrito of alunosInscritos) {
        if (!inscrito.isExperimental && inscrito.email) {
          const alunoAtual = todosAlunos?.find((a: any) => (a.email || '').toLowerCase().trim() === (inscrito.email || '').toLowerCase().trim());
          const creditosAtuais = alunoAtual?.creditos_avulsos || 0;
          await supabase.from('alunos').update({
            creditos_avulsos: creditosAtuais + 1
          }).eq('email', inscrito.email);
        }
      }

      // 2. Limpa todas as presenças desta turma
      const { data: presencasAtuais } = await supabase.from('presencas').select('id').eq('turma_id', turma.id);
      if (presencasAtuais && presencasAtuais.length > 0) {
        for (const p of presencasAtuais) {
          await supabase.from('presencas').delete().eq('id', p.id);
        }
      }

      // 3. Zera vagas ocupadas da turma
      await supabase.from('turmas').update({ vagas_ocupadas: 0 }).eq('id', turma.id);

      alert(`✅ Aula cancelada com sucesso!\n\n1 crédito de aula foi devolvido para os ${alunosInscritos.length} atletas inscritos.`);
      setAlunosInscritos([]);
      onVoltar();
    } catch (err: any) {
      alert('Erro ao cancelar aula: ' + err.message);
    } finally {
      setCancelandoAula(false);
    }
  };

  return (
    <div className="animacao-entrada w-full pb-20 pt-4">
      {/* Header com Horário da Turma */}
      <div className="flex items-center justify-between mb-6 px-5">
        <div className="flex items-center gap-4">
          <button onClick={onVoltar} className="p-3 bg-white/5 rounded-full text-white/50 active:scale-95 transition-transform">
            <svg xmlns="http://www.w3.org/2000/svg" width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="3" strokeLinecap="round" strokeLinejoin="round"><path d="m15 18-6-6 6-6"/></svg>
          </button>
          <div>
            <h2 className="text-xl font-black uppercase italic tracking-tighter text-white leading-none">
              {turma.nome}
            </h2>
            <span className="text-xs font-black uppercase tracking-widest text-[#ef3340] italic">
              Horário: {turma.horario}
            </span>
          </div>
        </div>

        {/* Botão de Cancelamento e Devolução para Gestores */}
        {isAdmin && alunosInscritos.length > 0 && (
          <button
            onClick={handleCancelarAulaEDevolverCreditos}
            disabled={cancelandoAula}
            className="bg-amber-500/15 hover:bg-amber-500/25 border border-amber-500/40 text-amber-300 text-[10px] font-black uppercase tracking-wider px-3.5 py-2.5 rounded-xl active:scale-95 transition-all flex items-center gap-1.5 shadow-lg disabled:opacity-50"
            title="Cancelar aula por motivo de chuva/força maior e reembolsar crédito aos atletas"
          >
            <span>☔</span>
            <span>{cancelandoAula ? 'Reembolsando...' : 'Cancelar e Devolver Créditos'}</span>
          </button>
        )}
      </div>

      {/* Lista de Alunos (Estilo Gestão) */}
      <div className="flex flex-col gap-3 px-2">

        {loading ? (
          <p className="text-center py-10 text-white/20 text-[10px] font-black uppercase tracking-widest animate-pulse italic">
            Buscando atletas...
          </p>
        ) : alunosInscritos.length === 0 ? (
          <p className="text-center py-10 text-white/20 text-xs font-black uppercase tracking-widest italic">
            Nenhum atleta inscrito.
          </p>
        ) : (
          alunosInscritos.map(aluno => {
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
            } else if (normNivel === 'gerencia') {
              borderClass = 'animate-gold-shimmer border-yellow-500/40 shadow-[0_0_8px_rgba(255,215,0,0.4)]';
            }

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
            } else if (normNivel === 'gerencia') {
              levelTagStyle = 'animate-gold-shimmer text-black border-yellow-500/20 shadow-[0_0_10px_rgba(255,215,0,0.5)]';
            }

            const temFaixa = Boolean(aluno.faixa_ativa_url);

            return (
              <div 
                key={aluno.id} 
                className={`w-full rounded-2xl p-4 flex items-center justify-between relative overflow-hidden border transition-all ${
                  temFaixa 
                    ? 'border-amber-400/50 shadow-[0_0_20px_rgba(251,191,36,0.15)] bg-black' 
                    : 'bg-[#121212] border-white/5'
                }`}
              >
                {/* Imagem da Faixa perfeitamente contida e arredondada no retângulo */}
                {temFaixa && (
                  <>
                    <img 
                      src={aluno.faixa_ativa_url} 
                      alt="" 
                      className="absolute inset-0 w-full h-full object-cover rounded-2xl select-none pointer-events-none"
                    />
                    {/* Camada suave para proteger o contraste dos textos sem escurecer a arte */}
                    <div className="absolute inset-0 bg-gradient-to-r from-black/85 via-black/40 to-black/70 rounded-2xl pointer-events-none" />
                  </>
                )}
                
                <div className="flex items-center gap-3 flex-1 text-left relative z-10">
                  <div className={`w-12 h-12 rounded-full border-2 shrink-0 flex items-center justify-center p-[2px] shadow-lg ${borderClass}`}>
                    <div className="w-full h-full rounded-full overflow-hidden flex items-center justify-center bg-black/60">
                      {aluno.foto_url && !aluno.isExperimental ? (
                        <img src={aluno.foto_url} alt="" className="w-full h-full object-cover" />
                      ) : (
                        <span className="text-xs text-white/80">👤</span>
                      )}
                    </div>
                  </div>
                  <div>
                    <h4 className="font-black text-sm uppercase tracking-tight text-white leading-tight flex items-center gap-1.5 flex-wrap drop-shadow-md">
                      {aluno.nome} {aluno.sobrenome}
                      <TagApelido apelido={aluno.apelido} mode="name" />
                    </h4>

                    <div className="flex items-center gap-1.5 flex-wrap mt-1">
                      {aluno.isExperimental ? (
                        <span className="text-[9px] font-black uppercase px-2 py-0.5 inline-block rounded border border-white/10 text-white/60 bg-black/50 italic backdrop-blur-sm">
                          Aula Experimental
                        </span>
                      ) : (
                        <TagApelido apelido={aluno.apelido} nivel={nivelDoBanco} levelStyle={levelTagStyle} mode="level" />
                      )}

                      {/* Tag da Faixa de Perfil (Sem emoji de kimono) */}
                      {temFaixa && aluno.faixa_ativa_nome && (
                        <span className="text-[8px] font-black uppercase tracking-wider px-2 py-0.5 rounded border border-amber-400/40 bg-black/60 text-amber-300 italic backdrop-blur-sm shadow-sm">
                          {aluno.faixa_ativa_nome}
                        </span>
                      )}
                    </div>
                  </div>
                </div>

                {/* Horário de Inscrição HH:MM */}
                <div className="bg-black/60 backdrop-blur-md border border-white/15 px-3 py-2 rounded-xl text-center relative z-10 shrink-0 ml-2 shadow-md">
                  <span className="block text-[8px] font-black uppercase text-white/50 tracking-widest mb-0.5">Inscrito às</span>
                  <span className="text-xs font-black text-white">{aluno.hora_inscricao}</span>
                </div>
                
              </div>
            );


          })
        )}
      </div>
    </div>
  );
}