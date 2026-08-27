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
  limiteAtingido?: boolean;
  onVerAlunos?: (turma: any) => void; // Adicionamos a prop aqui
}

export function TurmaCard({ turma, presencasTurma, session, alunoDb, turmaIdClicada, acaoClicada, onAlternarPresenca, alunoJaMarcouAlguma, isHoje, limiteAtingido = false, onVerAlunos }: TurmaCardProps) {

  
  const isTeacher = alunoDb?.nivel?.toUpperCase() === 'PROFESSOR';
  const isAdmin = alunoDb?.nivel?.toUpperCase() === 'GERENCIA';
  const nivelAluno = alunoDb?.nivel || 'Aprendiz';

  
  const normNivel = String(nivelAluno).toLowerCase().trim().normalize('NFD').replace(/[\u0300-\u036f]/g, '');
  let avatarBorderClass = 'border-white';
  if (normNivel === 'aprendiz') {
    avatarBorderClass = 'border-white';
  } else if (normNivel === 'iniciante') {
    avatarBorderClass = 'border-green-400';
  } else if (normNivel === 'iniciante avancado') {
    avatarBorderClass = 'border-blue-400';
  } else if (normNivel === 'intermediario') {
    avatarBorderClass = 'border-purple-400';
  } else if (normNivel === 'professor') {
    avatarBorderClass = 'border-orange-500';
  } else if (normNivel === 'gerencia') {
    avatarBorderClass = 'animate-gold-shimmer border-yellow-500/40 shadow-[0_0_8px_rgba(255,215,0,0.4)]';
  }


  const obterBorderClass = (nivelStr: string) => {
    const norm = String(nivelStr || 'Aprendiz').toLowerCase().trim().normalize('NFD').replace(/[\u0300-\u036f]/g, '');
    if (norm === 'aprendiz') return 'border-white';
    if (norm === 'iniciante') return 'border-green-400';
    if (norm === 'iniciante avancado') return 'border-blue-400';
    if (norm === 'intermediario') return 'border-purple-400';
    if (norm === 'professor') return 'border-orange-500';
    if (norm === 'gerencia') return 'animate-gold-shimmer border-yellow-500/40 shadow-[0_0_8px_rgba(255,215,0,0.4)]';
    return 'border-white/20';
  };


  
  // Transforma a string do banco "Aprendiz / Iniciante" em um Array para gerar as tags separadas
  const niveisTurmaArray = turma.nome ? turma.nome.split(/[/,]/).map((s: string) => s.trim()) : ['Aprendiz'];

  const verificarAcesso = (nivelAluno: string, niveisTurma: string[]) => {
    const norm = (str: string) => str?.toLowerCase().trim().normalize('NFD').replace(/[\u0300-\u036f]/g, '');
    const n = norm(nivelAluno);
    if (n === 'gerencia' || n === 'professor' || isTeacher || isAdmin) return true;
    
    // Pesos para garantir que níveis maiores acessem os menores, mas não o contrário
    const pesos: { [key: string]: number } = { 
      'aprendiz': 1, 
      'iniciante': 2, 
      'iniciante avancado': 3, 
      'intermediario': 4 
    };

    const pesoAluno = pesos[n] || 1;
    
    // O aluno acessa se o peso dele for MAIOR OU IGUAL ao peso MÍNIMO exigido por qualquer uma das tags da turma
    const pesoMinimoExigido = Math.min(...niveisTurma.map(n => pesos[norm(n)] || 1));
    
    return pesoAluno >= pesoMinimoExigido;
  };


  const acessoLiberado = verificarAcesso(nivelAluno, niveisTurmaArray);

  const agora = new Date();
  const tempoAtualMinutos = agora.getHours() * 60 + agora.getMinutes();
  
  const [horaAulaStr, minAulaStr] = (turma.horario || "00:00").split(':');
  const tempoAulaMinutos = parseInt(horaAulaStr) * 60 + parseInt(minAulaStr);
  
  const aulaEncerrada = isHoje && (tempoAtualMinutos >= (tempoAulaMinutos - 10));


  const jaMarcou = presencasTurma.some(p => p.aluno_email === session?.user?.email);
  const outrasFotos = presencasTurma.filter(p => p.aluno_email !== session?.user?.email);
  const lotou = turma.vagas_ocupadas >= turma.vagas_totais;
  const sumindo = turmaIdClicada === turma.id && acaoClicada === 'desmarcar';
  const surgindo = turmaIdClicada === turma.id && acaoClicada === 'marcar';

  return (
    <div 
      className={`rounded-3xl p-6 border mb-5 relative transition-all duration-300 ${aulaEncerrada ? 'opacity-40 grayscale' : 'shadow-lg'}`}
      style={{ 
        backgroundColor: turma.cor_card || '#121212',
        borderColor: 'rgba(255,255,255,0.05)'
      }}
    >

      
      <div className="flex justify-between items-start mb-6">
        <div className="flex flex-wrap gap-2">
          {niveisTurmaArray.map((nivel: string) => {
            const normNivel = nivel.toLowerCase().trim().normalize('NFD').replace(/[\u0300-\u036f]/g, '');
            let tagStyle = 'bg-white/5 text-white border-white/10';
            if (normNivel === 'aprendiz') {
              tagStyle = 'bg-white/5 text-white border-white/10';
            } else if (normNivel === 'iniciante') {
              tagStyle = 'bg-green-500/10 text-green-400 border-green-500/20';
            } else if (normNivel === 'iniciante avancado') {
              tagStyle = 'bg-blue-500/10 text-blue-400 border-blue-500/20';
            } else if (normNivel === 'intermediario') {
              tagStyle = 'bg-purple-500/10 text-purple-400 border-purple-500/20';
            }
            return (
              <span key={nivel} className={`text-[10px] font-black uppercase tracking-[0.2em] px-3 py-1.5 rounded-lg border italic ${tagStyle}`}>
                {nivel}
              </span>
            );
          })}
          <span className="bg-[#ef3340]/10 text-[#ef3340] border-[#ef3340]/20 text-[10px] font-black uppercase tracking-[0.2em] px-3 py-1.5 rounded-lg border italic">
            Prof. {turma.professor || 'Equipe CT Hecth'}
          </span>
        </div>
        <div className="text-right">
          <span className="text-4xl font-black tracking-tighter text-white italic">{turma.horario}</span>
          <span className="block text-[9px] font-black text-white/20 uppercase mt-1 tracking-widest">Duração 1h</span>
        </div>
      </div>


      <div className="flex justify-between items-center border-t border-white/5 pt-5">
        {/* AQUI ESTÁ A MÁGICA: Transformamos a div das fotos em um botão interativo */}
        <div 
          onClick={() => onVerAlunos && onVerAlunos(turma)}
          className="flex -space-x-3 items-center cursor-pointer active:scale-95 hover:opacity-80 transition-all"
        >
          {outrasFotos.map((p, idx) => {
            const isExp = p.aluno_email?.startsWith('experimental_');
            const borderCls = isExp ? 'border-white/20' : obterBorderClass(p.nivel);
            const nomeExp = isExp ? p.aluno_email.split('_').slice(2).join(' ') : '';
            const inicial = isExp ? nomeExp.charAt(0).toUpperCase() : p.inicial;

            return (
              <div 
                key={p.aluno_email} 
                style={{ zIndex: 10 + idx }} 
                className={`w-9 h-9 rounded-full border-2 flex items-center justify-center p-[1.5px] bg-[#121212] shadow-xl ${borderCls}`}
              >
                <div className="w-full h-full rounded-full overflow-hidden flex items-center justify-center bg-gray-800">
                  {p.foto_url && !isExp ? (
                    <img src={p.foto_url} className="w-full h-full object-cover" />
                  ) : (
                    <span className="text-white/60 font-black text-[10px]">{inicial}</span>
                  )}
                </div>
              </div>
            );
          })}


          {(jaMarcou || sumindo) && (
            <div 
              style={{ zIndex: 30 }} 
              className={`w-10 h-10 rounded-full border-2 flex items-center justify-center p-[2px] bg-[#121212] shadow-xl ${avatarBorderClass} ${sumindo ? 'animacao-saida' : surgindo ? 'animacao-entrada' : ''}`}
            >
              <div className="w-full h-full rounded-full overflow-hidden flex items-center justify-center bg-gray-800">
                {alunoDb?.foto_url ? (
                  <img src={alunoDb.foto_url} className="w-full h-full object-cover" />
                ) : (
                  <span className="text-white font-black text-xs">{alunoDb?.nome?.charAt(0)}</span>
                )}
              </div>
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
          Inscrições Encerradas
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
          disabled={!jaMarcou && (lotou || alunoJaMarcouAlguma || limiteAtingido)}
          className={`w-full py-4 rounded-2xl font-black uppercase tracking-widest text-[10px] mt-6 transition-all active:scale-95 group relative italic
            ${jaMarcou ? 'bg-green-600 text-white shadow-[0_5px_15px_rgba(22,163,74,0.3)]' : (lotou || alunoJaMarcouAlguma || limiteAtingido) ? 'bg-white/5 text-white/10' : 'bg-white text-black shadow-lg hover:bg-[#ef3340] hover:text-white'}`}
        >
          {jaMarcou ? (
            <><span className="group-hover:hidden flex items-center justify-center gap-2">✓ Confirmado</span><span className="hidden group-hover:block">Cancelar</span></>
          ) : lotou ? (
            'Turma Lotada'
          ) : alunoJaMarcouAlguma ? (
            'Limite: 1 aula/dia'
          ) : limiteAtingido ? (
            'Limite Semanal Atingido'
          ) : (
            'Agendar Aula'
          )}
        </button>

      )}
    </div>
  );
}