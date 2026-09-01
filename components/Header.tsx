"use client";
import { TagApelido } from './TagApelido';

interface HeaderProps {


  alunoDb: any;
  onLogout: () => void;
  onGoHome?: () => void;
  onGoToProfile?: () => void;
}


export function Header({ alunoDb, onLogout, onGoHome, onGoToProfile }: HeaderProps) {
  const nivel = alunoDb?.nivel || 'Aprendiz';
  const normNivel = String(nivel).toLowerCase().trim().normalize('NFD').replace(/[\u0300-\u036f]/g, '');

  let levelStyle = 'bg-white/10 text-white border-white/20';
  let avatarBorderClass = 'border-white';

  if (normNivel === 'aprendiz') {
    levelStyle = 'bg-white/10 text-white border-white/20';
    avatarBorderClass = 'border-white';
  } else if (normNivel === 'iniciante') {
    levelStyle = 'bg-green-500/20 text-green-300 border-green-500/30';
    avatarBorderClass = 'border-green-400';
  } else if (normNivel === 'iniciante avancado') {
    levelStyle = 'bg-blue-500/20 text-blue-300 border-blue-500/30';
    avatarBorderClass = 'border-blue-400';
  } else if (normNivel === 'intermediario') {
    levelStyle = 'bg-purple-500/20 text-purple-300 border-purple-500/30';
    avatarBorderClass = 'border-purple-400';
  } else if (normNivel === 'professor') {
    levelStyle = 'bg-orange-500/20 text-orange-300 border-orange-500/30';
    avatarBorderClass = 'border-orange-500';
  } else if (normNivel === 'gerencia' || normNivel === 'gerencia') {
    levelStyle = 'animate-gold-shimmer text-black border-yellow-500/20 shadow-[0_0_10px_rgba(255,215,0,0.5)]';
    avatarBorderClass = 'animate-gold-shimmer border-yellow-500/40 shadow-[0_0_8px_rgba(255,215,0,0.4)]';
  }



  return (
    <header className="bg-[#ef3340] px-5 py-4 shadow-xl flex justify-between items-center mb-6 sticky top-0 z-50 border-b border-white/10">
      
      {/* LADO ESQUERDO: Logo + Barra + Nome/Nível */}
      <div className="flex items-center gap-4">
        <img 
          src="/hecth-logo.svg" 
          alt="HECTH." 
          className="h-8 w-auto cursor-pointer hover:opacity-85 active:scale-95 transition-all"
          onClick={onGoHome}
        />
        <span className="text-[10px] not-italic font-medium text-white/30 bg-white/5 px-2 py-0.5 rounded-full tracking-normal">
    v1.8.7
  </span>












































        <div className="h-8 w-[1px] bg-white/30 rounded-full"></div>
        <div className="flex flex-col items-start">
          <span className="text-sm font-bold leading-none text-white flex items-center gap-1.5 flex-wrap">
            Olá, {alunoDb?.nome?.split(' ')[0]}
            <TagApelido apelido={alunoDb?.apelido} mode="name" />
          </span>

          <TagApelido apelido={alunoDb?.apelido} nivel={nivel} levelStyle={levelStyle} mode="level" />

        </div>
      </div>

      {/* LADO DIREITO: Foto + Sair */}
      <div className="flex items-center gap-3">
        <button onClick={onLogout} className="text-[10px] font-black text-white uppercase tracking-widest opacity-60 hover:opacity-100 transition-opacity">
          Sair
        </button>
        <div 
          onClick={onGoToProfile}
          className={`w-10 h-10 rounded-full border-2 shadow-lg flex items-center justify-center cursor-pointer hover:scale-105 active:scale-95 transition-all p-[2px] bg-[#121212] ${avatarBorderClass}`}
        >
          <div className="w-full h-full rounded-full overflow-hidden flex items-center justify-center bg-white/5">
            {alunoDb?.foto_url ? (
              <img src={alunoDb.foto_url} className="w-full h-full object-cover" />
            ) : (
              <span className="text-white/60 text-xs font-bold">{alunoDb?.nome?.charAt(0)}</span>
            )}
          </div>
        </div>

      </div>
    </header>
  );
}