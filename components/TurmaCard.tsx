// src/components/TurmaCard.tsx
"use client";

interface TurmaCardProps {
  turma: any;
  presencasTurma: any[];
  session: any;
  alunoDb: any;
  turmaIdClicada: number | null;
  acaoClicada: 'marcar' | 'desmarcar' | null;
  onAlternarPresenca: (e: React.MouseEvent<HTMLButtonElement>, turmaId: number, vagasAtuais: number, vagasTotais: number, jaMarcou: boolean) => void;
  alunoJaMarcouAlguma: boolean;
  isHoje: boolean; 
}

export function TurmaCard({ turma, presencasTurma, session, alunoDb, turmaIdClicada, acaoClicada, onAlternarPresenca, alunoJaMarcouAlguma, isHoje }: TurmaCardProps) {
  
  // 1. LÓGICA DE NÍVEIS POR HORÁRIO
  const obterNiveisPorHorario = (horario: string) => {
    const h = parseInt(horario.split(':')[0]);
    if (h === 8 || h === 18) return ['Iniciante Avançado'];
    if ([7, 17, 19, 20].includes(h)) return ['Aprendiz', 'Iniciante'];
    return ['Geral'];
  };

  const niveisDaAula = obterNiveisPorHorario(turma.horario);
  const nivelUsuario = alunoDb?.nivel || 'Aprendiz';

  // 2. VERIFICAÇÃO DE ACESSO (Pesos para travar a aula se o aluno for nível baixo)
  const verificarAcesso = (nivelUser: string, niveisAula: string[]) => {
    const pesos: { [key: string]: number } = { 
      'aprendiz': 1, 
      'iniciante': 2, 
      'iniciante avancado': 3, 
      'intermediario': 4 
    };

    const norm = (s: string) => s.toLowerCase().trim().normalize('NFD').replace(/[\u0300-\u036f]/g, '');
    const pesoUser = pesos[norm(nivelUser)] || 1;

    // O aluno pode entrar se o peso dele for maior ou igual ao peso MÍNIMO exigido pela aula
    // Ex: Aula 18h exige peso 3. Aluno Iniciante (peso 2) não entra.
    const pesoMinimoAula = Math.min(...niveisAula.map(n => pesos[norm(n)] || 1));
    
    return pesoUser >= pesoMinimoAula;
  };

  const acessoLiberado = verificarAcesso(nivelUsuario, niveisDaAula);

  // Lógicas de tempo e estado
  const agora = new Date();
  const tempoAtualMinutos = agora.getHours() * 60 + agora.getMinutes();
  const [horaAulaStr, minAulaStr] = (turma.horario || "00:00").split(':');
  const tempoAulaMinutos = parseInt(horaAulaStr) * 60 + parseInt(minAulaStr);
  const aulaEncerrada = isHoje && (tempoAtualMinutos >= tempoAulaMinutos);

  const jaMarcou = presencasTurma.some(p => p.aluno_email === session?.user?.email);
  const outrasFotos = presencasTurma.filter(p => p.aluno_email !== session?.user?.email);
  const lotou = turma.vagas_ocupadas >= turma.vagas_totais;
  const sumindo = turmaIdClicada === turma.id && acaoClicada === 'desmarcar';
  const surgindo = turmaIdClicada === turma.id && acaoClicada === 'marcar';

  return (
    <div className={`bg-[#121212] rounded-3xl p-6 border mb-5 relative transition-all duration-300 ${aulaEncerrada ? 'border-white/5 opacity-40 grayscale' : 'border-white/5 shadow-lg'}`}>
      
      <div className="flex justify-between items-start mb-6">
        <div>
          {/* TAGS DE NÍVEL (Substituindo o nome da equipe) */}
          <div className="flex flex-wrap gap-2 mb-4">
            {niveisDaAula.map(nivel => (
              <span key={nivel} className="bg-[#ef3340]/10 text-[#ef3340] text-[10px] font-black uppercase tracking-[0.2em] px-3 py-1.5 rounded-md border border-[#ef3340]/20 italic">
                {nivel}
              </span>
            ))}
          </div>
          <p className="text-white/40 text-[11px] font-black uppercase tracking-[0.2em] italic ml-0.5">Prof. {turma.professor}</p>
        </div>
        <div className="text-right">
            <span className="text-4xl font-black tracking-tighter text-white italic">{turma.horario}</span>
            <span className="block text-[9px] font-black text-white/20 uppercase mt-1 tracking-widest">Sessão 60 min</span>
        </div>
      </div>

      <div className="flex justify-between items-center border-t border-white/5 pt-5">
        <div className="flex -space-x-3 items-center">
          {outrasFotos.map((p, idx) => (
            <div key={p.aluno_email} style={{ zIndex: 10 + idx }} className="w-9 h-9 rounded-full border-2 border-[#121212] shadow-xl overflow-hidden bg-gray-800 flex items-center justify-center">
              {p.foto_url ? <img src={p.foto_url} className="w-full h-full object-cover" /> : <span className="text-white font-black text-[10px]">{p.inicial || 'A'}</span>}
            </div>
          ))}

          {(jaMarcou || sumindo) && (
            <div style={{ zIndex: 30 }} className={`w-10 h-10 rounded-full border-2 border-[#ef3340] shadow-xl overflow-hidden bg-gray-800 flex items-center justify-center ${sumindo ? 'animacao-saida' : surgindo ? 'animacao-entrada' : ''}`}>
              {alunoDb?.foto_url ? <img src={alunoDb.foto_url} className="w-full h-full object-cover" /> : <span className="text-white font-black text-xs">{alunoDb?.nome?.charAt(0)}</span>}
            </div>
          )}
        </div>
        <div className="text-right">
          <span className="text-white/20 text-[9px] font-black uppercase block tracking-widest mb-0.5">Vagas</span>
          <span className="text-white font-black text-xl tracking-tighter italic">
            <span className={lotou ? 'text-white/20' : 'text-[#ef3340]'}>{turma.vagas_ocupadas}</span>
            <span className="text-white/10 mx-0.5">/</span>
            <span className="text-white/40">{turma.vagas_totais}</span>
          </span>
        </div>
      </div>

      {aulaEncerrada ? (
        <div className="w-full py-4 rounded-2xl font-black uppercase tracking-widest text-[10px] mt-6 bg-white/5 text-white/20 flex items-center justify-center gap-2 border border-white/5 italic">
          Aula Encerrada
        </div>
      ) : !acessoLiberado ? (
        <div className="w-full py-4 rounded-2xl font-black uppercase tracking-widest text-[10px] mt-6 bg-[#ef3340]/5 text-[#ef3340]/40 flex items-center justify-center gap-3 cursor-not-allowed border border-[#ef3340]/10 italic">
          <svg xmlns="http://www.w3.org/2000/svg" width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="3" strokeLinecap="round" strokeLinejoin="round">
            <rect x="3" y="11" width="18" height="11" rx="2" ry="2"></rect><path d="M7 11V7a5 5 0 0 1 10 0v4"></path>
          </svg>
          Nível Bloqueado
        </div>
      ) : (
        <button 
          onClick={(e) => onAlternarPresenca(e, turma.id, turma.vagas_ocupadas, turma.vagas_totais, jaMarcou)}
          disabled={!jaMarcou && (lotou || alunoJaMarcouAlguma)}
          className={`w-full py-4 rounded-2xl font-black uppercase tracking-widest text-[10px] mt-6 transition-all active:scale-95 group relative italic
            ${jaMarcou ? 'bg-green-600 text-white shadow-[0_5px_15px_rgba(22,163,74,0.3)]' : (lotou || alunoJaMarcouAlguma) ? 'bg-white/5 text-white/10' : 'bg-white text-black shadow-lg hover:bg-[#ef3340] hover:text-white'}`}
        >
          {jaMarcou ? (
            <><span className="group-hover:hidden flex items-center justify-center gap-2">✓ Presença Confirmada</span><span className="hidden group-hover:block">Cancelar Presença</span></>
          ) : lotou ? (
            'Turma sem Vagas'
          ) : alunoJaMarcouAlguma ? (
            'Já marcou hoje'
          ) : (
            'Agendar Aula'
          )}
        </button>
      )}
    </div>
  );
}