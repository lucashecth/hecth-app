import React from 'react';

interface TagApelidoProps {
  apelido?: string;
  nivel?: string;
  levelStyle?: string; // Classes para o nível padrão
  mode: 'name' | 'level';
  className?: string;
}

export function TagApelido({ apelido, nivel, levelStyle = '', mode, className = '' }: TagApelidoProps) {
  const cleanApelido = apelido?.trim().toUpperCase() || '';
  const isSpecial = cleanApelido === 'PRESIDENTE' || 
                    cleanApelido === 'VICE-PRESIDENTE' || 
                    cleanApelido === 'VICE PRESIDENTE' || 
                    cleanApelido === 'MARKETING' || 
                    cleanApelido === 'ROSA';

  if (mode === 'name') {
    // No nome, se for especial, não mostra nada (pois vai substituir o nível)
    if (isSpecial) return null;
    if (!apelido) return null;
    // Se for apelido comum, mostra entre parênteses
    return (
      <span className={`inline-flex items-center justify-center bg-white/10 border border-white/15 text-white/70 text-[9px] font-bold px-2 py-0.5 rounded-md ml-1.5 select-none ${className}`}>
        {apelido}
      </span>
    );
  }

  if (mode === 'level') {
    const cleanNivel = nivel?.trim().toUpperCase() || '';
    const isGerencia = cleanNivel === 'GERENCIA' || cleanNivel === 'GERÊNCIA';
    const isProfessor = cleanNivel === 'PROFESSOR';

    // No nível, se for especial, gerência ou professor, substitui o nível pelo crachá correspondente
    if (isSpecial || isGerencia || isProfessor) {
      let tagContent = '';
      let tagClass = '';

      if (isGerencia) {
        tagContent = '💼 Gerência';
        tagClass = 'animate-gold-shimmer text-black border-yellow-500/20 shadow-[0_0_10px_rgba(255,215,0,0.5)]';
      } else if (isProfessor) {
        tagContent = '🏐 Professor';
        tagClass = 'bg-transparent border border-orange-500 text-orange-500 shadow-[0_0_8px_rgba(249,115,22,0.3)]';
      } else if (cleanApelido === 'PRESIDENTE') {
        tagContent = '👑 Presidente';
        tagClass = 'animate-gold-shimmer text-black border-yellow-500/20 shadow-[0_0_10px_rgba(255,215,0,0.5)]';
      } else if (cleanApelido === 'VICE-PRESIDENTE' || cleanApelido === 'VICE PRESIDENTE') {
        tagContent = '🥈 Vice-Presidente';
        tagClass = 'animate-silver-shimmer text-black border-gray-400/20 shadow-[0_0_10px_rgba(169,169,169,0.4)]';
      } else {
        tagContent = '📢 Marketing';
        tagClass = 'bg-gradient-to-r from-pink-500 to-rose-400 text-white border-pink-500/20 shadow-[0_0_8px_rgba(244,63,94,0.3)]';
      }

      return (
        <>
          <style dangerouslySetInnerHTML={{__html: `
            @keyframes tagShimmer {
              0% { background-position: 0% 50%; }
              50% { background-position: 100% 50%; }
              100% { background-position: 0% 50%; }
            }
            .animate-gold-shimmer {
              background: linear-gradient(135deg, #b8860b, #ffd700, #ffdf00, #ffd700, #b8860b);
              background-size: 300% 300%;
              animation: tagShimmer 2.5s ease infinite;
            }
            .animate-silver-shimmer {
              background: linear-gradient(135deg, #505050, #dcdcdc, #a9a9a9, #dcdcdc, #505050);
              background-size: 300% 300%;
              animation: tagShimmer 2.5s ease infinite;
            }
          `}} />
          <span className={`inline-flex items-center justify-center text-[8px] font-black uppercase px-2.5 py-0.5 rounded border tracking-wider select-none italic shrink-0 ${tagClass} ${className}`}>
            {tagContent}
          </span>
        </>
      );
    }

    // Se não for especial, gerência ou professor, renderiza o nível original padrão
    if (!nivel) return null;
    return (
      <span className={`text-[8px] font-black uppercase tracking-wider px-2 py-0.5 rounded border italic inline-block shrink-0 ${levelStyle} ${className}`}>
        {nivel}
      </span>
    );
  }

  return null;
}
