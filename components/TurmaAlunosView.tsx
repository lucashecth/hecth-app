// src/components/TurmaAlunosView.tsx
"use client";
import { useState, useEffect } from 'react';
import { supabase } from '../lib/supabase';

interface TurmaAlunosViewProps {
  turma: any;
  onVoltar: () => void;
}

export function TurmaAlunosView({ turma, onVoltar }: TurmaAlunosViewProps) {
  const [alunosInscritos, setAlunosInscritos] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    async function carregarInscritos() {
      // 1. Busca as presenças desta turma
      const { data: presencas } = await supabase.from('presencas').select('*').eq('turma_id', turma.id);
      
      if (!presencas || presencas.length === 0) {
        setLoading(false);
        return;
      }

      // 2. Busca os dados completos dos alunos inscritos
      const emails = presencas.map(p => p.aluno_email);
      const { data: alunosData } = await supabase.from('alunos').select('*').in('email', emails);

      // 3. Junta os dados com o horário de inscrição (formato HH:MM)
      if (alunosData) {
        const alunosMontados = alunosData.map(aluno => {
          const registroPresenca = presencas.find(p => p.aluno_email === aluno.email);
          let horaFormatada = "--:--";
          if (registroPresenca?.created_at) {
            const dataHora = new Date(registroPresenca.created_at);
            horaFormatada = dataHora.toLocaleTimeString('pt-BR', { hour: '2-digit', minute: '2-digit' });
          }
          return { ...aluno, hora_inscricao: horaFormatada };
        });
        setAlunosInscritos(alunosMontados);
      }
      setLoading(false);
    }
    
    carregarInscritos();
  }, [turma.id]);

  return (
    <div className="animacao-entrada w-full pb-20 pt-4">
      {/* Header com Horário da Turma */}
      <div className="flex items-center gap-4 mb-8 px-5">
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
          alunosInscritos.map(aluno => (
            <div key={aluno.id} className="w-full bg-[#121212] border border-white/5 rounded-2xl p-4 flex items-center justify-between">
              
              <div className="flex items-center gap-3 flex-1 text-left">
                <div className="w-12 h-12 rounded-xl overflow-hidden border border-white/10 shrink-0 bg-white/5">
                  <img src={aluno.foto_url} alt="" className="w-full h-full object-cover" />
                </div>
                <div>
                  <h4 className="font-black text-sm uppercase tracking-tight text-white/90 leading-tight">
                    {aluno.nome} {aluno.sobrenome}
                  </h4>
                  <span className="text-[9px] font-black uppercase px-2 py-0.5 mt-1 inline-block rounded border border-white/10 text-white/40 italic">
                    {aluno.nivel ? aluno.nivel.toUpperCase() : 'INICIANTE'}
                  </span>
                </div>
              </div>

              {/* Horário de Inscrição HH:MM */}
              <div className="bg-white/5 border border-white/10 px-3 py-2 rounded-xl text-center">
                <span className="block text-[8px] font-black uppercase text-white/30 tracking-widest mb-0.5">Inscrito às</span>
                <span className="text-xs font-black text-white/80">{aluno.hora_inscricao}</span>
              </div>
              
            </div>
          ))
        )}
      </div>
    </div>
  );
}