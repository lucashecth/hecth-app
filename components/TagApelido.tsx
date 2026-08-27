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
    // No nível, se for especial, substitui o nível pelo crachá animado
    if (isSpecial) {
      if (cleanApelido === 'PRESIDENTE') {
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
            `}} />
            <span className={`inline-flex items-center justify-center animate-gold-shimmer text-black text-[8px] font-black uppercase px-2.5 py-0.5 rounded border border-yellow-500/20 tracking-wider shadow-[0_0_10px_rgba(255,215,0,0.5)] select-none italic shrink-0 ${className}`}>
              👑 Presidente
            </span>
          </>
        );
      }

      if (cleanApelido === 'VICE-PRESIDENTE' || cleanApelido === 'VICE PRESIDENTE') {
        return (
          <>
            <style dangerouslySetInnerHTML={{__html: `
              @keyframes tagShimmer {
                0% { background-position: 0% 50%; }
                50% { background-position: 100% 50%; }
                100% { background-position: 0% 50%; }
              }
              .animate-silver-shimmer {
                background: linear-gradient(135deg, #505050, #dcdcdc, #a9a9a9, #dcdcdc, #505050);
                background-size: 300% 300%;
                animation: tagShimmer 2.5s ease infinite;
              }
            `}} />
            <span className={`inline-flex items-center justify-center animate-silver-shimmer text-black text-[8px] font-black uppercase px-2.5 py-0.5 rounded border border-gray-400/20 tracking-wider shadow-[0_0_10px_rgba(169,169,169,0.4)] select-none italic shrink-0 ${className}`}>
              🥈 Vice-Presidente
            </span>
          </>
        );
      }

      if (cleanApelido === 'MARKETING' || cleanApelido === 'ROSA') {
        return (
          <span className={`inline-flex items-center justify-center bg-gradient-to-r from-pink-500 to-rose-400 text-white text-[8px] font-black uppercase px-2.5 py-0.5 rounded border border-pink-500/20 tracking-wider shadow-[0_0_8px_rgba(244,63,94,0.3)] select-none italic shrink-0 ${className}`}>
            📢 Marketing
          </span>
        );
      }
    }

    // Se não for especial, renderiza o nível original padrão
    if (!nivel) return null;
    return (
      <span className={`text-[8px] font-black uppercase tracking-wider px-2 py-0.5 rounded border italic inline-block shrink-0 ${levelStyle} ${className}`}>
        {nivel}
      </span>
    );
  }

  return null;
}
