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
}

export function TurmaCard({ turma, presencasTurma, session, alunoDb, turmaIdClicada, acaoClicada, onAlternarPresenca, alunoJaMarcouAlguma }: TurmaCardProps) {
  
  // MOTOR DE REGRAS DE NÍVEL
  const nivelAluno = alunoDb?.nivel || 'Aprendiz';
  const nivelTurma = turma.nome || 'Aprendiz';

  const verificarAcesso = (aluno: string, aula: string) => {
    const norm = (str: string) => str?.toLowerCase().trim().normalize('NFD').replace(/[\u0300-\u036f]/g, '');
    const pesos: { [key: string]: number } = { 'aprendiz': 1, 'iniciante': 2, 'intermediario': 3 };
    return (pesos[norm(aluno)] || 1) >= (pesos[norm(aula)] || 1);
  };
  const acessoLiberado = verificarAcesso(nivelAluno, nivelTurma);

  // MOTOR DE TEMPO (Aula Encerrada)
  const agora = new Date();
  const horaAtual = agora.getHours();
  const minutosAtual = agora.getMinutes();
  const tempoAtualMinutos = horaAtual * 60 + minutosAtual;
  
  // Proteção: caso falte o horário no banco, assume 00:00
  const [horaAulaStr, minAulaStr] = (turma.horario || "00:00").split(':');
  const tempoAulaMinutos = parseInt(horaAulaStr) * 60 + parseInt(minAulaStr);
  
  // Se já passou das 21h, estamos mostrando as aulas de amanhã, então NENHUMA encerrou ainda!
  const isExibindoAmanha = horaAtual >= 21;
  const aulaEncerrada = !isExibindoAmanha && (tempoAtualMinutos >= tempoAulaMinutos);

  // ESTADOS DO ALUNO E TURMA
  const jaMarcou = presencasTurma.some(p => p.aluno_email === session?.user?.email);
  const outrasFotos = presencasTurma.filter(p => p.aluno_email !== session?.user?.email);
  const lotou = turma.vagas_ocupadas >= turma.vagas_totais;
  const sumindo = turmaIdClicada === turma.id && acaoClicada === 'desmarcar';
  const surgindo = turmaIdClicada === turma.id && acaoClicada === 'marcar';

  return (
    <div className={`bg-[#121212] rounded-3xl p-6 border mb-5 relative transition-all duration-300 ${aulaEncerrada ? 'border-white/5 opacity-40 grayscale' : 'border-white/5 shadow-lg'}`}>
      
      <div className="flex justify-between items-start mb-6">
        <div>
          <span className="bg-green-500/10 text-green-400 text-xs font-black uppercase tracking-widest px-3 py-1.5 rounded-md border border-green-500/20">
            {turma.nome}
          </span>
          <p className="text-white/40 text-xs font-medium uppercase tracking-wider mt-4">{turma.professor}</p>
        </div>
        <div className="text-right">
            <span className="text-3xl font-black tracking-tighter text-white">{turma.horario}</span>
            <span className="block text-[9px] font-black text-white/30 uppercase">Duração 1h30</span>
        </div>
      </div>

      <div className="flex justify-between items-center border-t border-white/5 pt-5">
        <div className="flex -space-x-3 items-center">
          {outrasFotos.map((p, idx) => (
            <div key={p.aluno_email} style={{ zIndex: 10 + idx }} className="w-9 h-9 rounded-full border-2 border-[#121212] shadow-xl overflow-hidden bg-gray-600 flex items-center justify-center">
              {p.foto_url ? <img src={p.foto_url} className="w-full h-full object-cover" /> : <span className="text-white font-bold text-xs">{p.inicial}</span>}
            </div>
          ))}

          {(jaMarcou || sumindo) && (
            <div style={{ zIndex: 50 }} className={`w-10 h-10 rounded-full border-2 border-white shadow-xl overflow-hidden bg-red-600 flex items-center justify-center ${sumindo ? 'animacao-saida' : surgindo ? 'animacao-entrada' : ''}`}>
              {alunoDb?.foto_url ? <img src={alunoDb.foto_url} className="w-full h-full object-cover" /> : <span className="text-white font-bold text-xs">{alunoDb?.nome?.charAt(0)}</span>}
            </div>
          )}
        </div>
        <div className="text-right">
          <span className="text-white/30 text-[10px] font-black uppercase block">Vagas</span>
          <span className="text-white font-black text-xl tracking-tight"><span className="text-[#ef3340]">{turma.vagas_ocupadas}</span>/{turma.vagas_totais}</span>
        </div>
      </div>

      {/* RENDERIZAÇÃO DO BOTÃO COM AS CONDIÇÕES */}
      {aulaEncerrada ? (
        <div className="w-full py-4 rounded-2xl font-black uppercase tracking-widest text-xs mt-6 bg-white/5 text-white/30 flex items-center justify-center gap-2 cursor-not-allowed border border-white/5">
          Aula Encerrada
        </div>
      ) : !acessoLiberado ? (
        <div className="w-full py-4 rounded-2xl font-black uppercase tracking-widest text-xs mt-6 bg-white/5 text-white/30 flex items-center justify-center gap-2 cursor-not-allowed border border-white/5">
          <svg xmlns="http://www.w3.org/2000/svg" width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
            <rect x="3" y="11" width="18" height="11" rx="2" ry="2"></rect><path d="M7 11V7a5 5 0 0 1 10 0v4"></path>
          </svg>
          Nível Incompatível
        </div>
      ) : (
        <button 
          onClick={(e) => onAlternarPresenca(e, turma.id, turma.vagas_ocupadas, turma.vagas_totais, jaMarcou)}
          disabled={!jaMarcou && (lotou || alunoJaMarcouAlguma)}
          className={`w-full py-4 rounded-2xl font-black uppercase tracking-widest text-xs mt-6 transition-all active:scale-95 group relative overflow-hidden 
            ${jaMarcou ? 'bg-green-600 text-white hover:bg-red-600' : (lotou || alunoJaMarcouAlguma) ? 'bg-white/5 text-white/20' : 'bg-white text-black hover:bg-gray-200'}`}
        >
          {jaMarcou ? (
            <><span className="group-hover:hidden">Confirmado</span><span className="hidden group-hover:block">Cancelar</span></>
          ) : lotou ? (
            'Turma Lotada'
          ) : alunoJaMarcouAlguma ? (
            'Limite: 1 aula/dia'
          ) : (
            'Marcar Presença'
          )}
        </button>
      )}
    </div>
  );
}