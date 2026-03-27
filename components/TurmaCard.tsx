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
}

export function TurmaCard({ turma, presencasTurma, session, alunoDb, turmaIdClicada, acaoClicada, onAlternarPresenca }: TurmaCardProps) {
  const jaMarcou = presencasTurma.some(p => p.aluno_email === session?.user?.email);
  const outrasFotos = presencasTurma.filter(p => p.aluno_email !== session?.user?.email);
  
  const lotou = turma.vagas_ocupadas >= turma.vagas_totais;
  const sumindo = turmaIdClicada === turma.id && acaoClicada === 'desmarcar';
  const surgindo = turmaIdClicada === turma.id && acaoClicada === 'marcar';

  return (
    <div className="bg-[#121212] rounded-3xl p-6 border border-white/5 mb-5 shadow-lg relative">
      <div className="flex justify-between items-start mb-6">
        <div>
          <span className="bg-green-500/10 text-green-400 text-[10px] font-black uppercase tracking-widest px-2 py-1 rounded-md border border-green-500/20">{turma.nivel}</span>
          <h4 className="text-xl font-bold mt-3 text-white">{turma.nome}</h4>
          <p className="text-white/40 text-xs font-medium uppercase tracking-wider">{turma.professor}</p>
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

      <button 
        onClick={(e) => onAlternarPresenca(e, turma.id, turma.vagas_ocupadas, turma.vagas_totais, jaMarcou)}
        disabled={!jaMarcou && lotou}
        className={`w-full py-4 rounded-2xl font-black uppercase tracking-widest text-xs mt-6 transition-all active:scale-95 group relative overflow-hidden ${jaMarcou ? 'bg-green-600 text-white hover:bg-red-600' : lotou ? 'bg-white/5 text-white/20' : 'bg-white text-black hover:bg-gray-200'}`}
      >
        {jaMarcou ? <><span className="group-hover:hidden">Confirmado</span><span className="hidden group-hover:block">Cancelar</span></> : lotou ? 'Turma Lotada' : 'Marcar Presença'}
      </button>
    </div>
  );
}