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
  
  const nivelAluno = alunoDb?.nivel || 'Aprendiz';
  
  // Transforma a string do banco "Aprendiz / Iniciante" em um Array para gerar as tags separadas
  const niveisTurmaArray = turma.nome ? turma.nome.split(/[/,]/).map((s: string) => s.trim()) : ['Aprendiz'];

  const verificarAcesso = (nivelAluno: string, niveisTurma: string[]) => {
    const norm = (str: string) => str?.toLowerCase().trim().normalize('NFD').replace(/[\u0300-\u036f]/g, '');
    
    // Pesos para garantir que níveis maiores acessem os menores, mas não o contrário
    const pesos: { [key: string]: number } = { 
      'aprendiz': 1, 
      'iniciante': 2, 
      'iniciante avancado': 3, 
      'intermediario': 4 
    };

    const pesoAluno = pesos[norm(nivelAluno)] || 1;
    
    // O aluno acessa se o peso dele for MAIOR OU IGUAL ao peso MÍNIMO exigido por qualquer uma das tags da turma
    const pesoMinimoExigido = Math.min(...niveisTurma.map(n => pesos[norm(n)] || 1));
    
    return pesoAluno >= pesoMinimoExigido;
  };

  const acessoLiberado = verificarAcesso(nivelAluno, niveisTurmaArray);

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
        <div className="flex flex-col gap-2">
          {/* MAP DAS TAGS: Remove o "Equipe CT Hecth" e gera as tags vermelhas baseadas no nome da turma no banco */}
          <div className="flex flex-wrap gap-2">
            {niveisTurmaArray.map((nivel: string) => (
              <span key={nivel} className="bg-[#ef3340]/10 text-[#ef3340] text-[10px] font-black uppercase tracking-[0.2em] px-3 py-1.5 rounded-lg border border-[#ef3340]/20 italic">
                {nivel}
              </span>
            ))}
          </div>
          <p className="text-white/40 text-[11px] font-black uppercase tracking-[0.2em] italic mt-2 ml-0.5">Prof. {turma.professor}</p>
        </div>
        <div className="text-right">
            <span className="text-4xl font-black tracking-tighter text-white italic">{turma.horario}</span>
            <span className="block text-[9px] font-black text-white/20 uppercase mt-1 tracking-widest">Duração 1h</span>
        </div>
      </div>

      <div className="flex justify-between items-center border-t border-white/5 pt-5">
        <div className="flex -space-x-3 items-center">
          {outrasFotos.map((p, idx) => (
            <div key={p.aluno_email} style={{ zIndex: 10 + idx }} className="w-9 h-9 rounded-full border-2 border-[#121212] shadow-xl overflow-hidden bg-gray-800 flex items-center justify-center">
              {p.foto_url ? <img src={p.foto_url} className="w-full h-full object-cover" /> : <span className="text-white font-black text-[10px]">{p.inicial}</span>}
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
            <span className={lotou ? 'text-white/40' : 'text-[#ef3340]'}>{turma.vagas_ocupadas}</span>
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
            <><span className="group-hover:hidden flex items-center justify-center gap-2">✓ Confirmado</span><span className="hidden group-hover:block">Cancelar</span></>
          ) : lotou ? (
            'Turma Lotada'
          ) : alunoJaMarcouAlguma ? (
            'Limite: 1 aula/dia'
          ) : (
            'Agendar Aula'
          )}
        </button>
      )}
    </div>
  );
}