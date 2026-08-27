import React from 'react';

interface TagApelidoProps {
  apelido?: string;
  className?: string;
}

export function TagApelido({ apelido, className = '' }: TagApelidoProps) {
  if (!apelido) return null;

  const cleanApelido = apelido.trim().toUpperCase();

  // Define as classes específicas com base na tag
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
        <span className={`inline-flex items-center justify-center animate-gold-shimmer text-black text-[9px] font-black uppercase px-2 py-0.5 rounded-md tracking-widest shadow-[0_0_10px_rgba(255,215,0,0.5)] select-none ml-1.5 ${className}`}>
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
        <span className={`inline-flex items-center justify-center animate-silver-shimmer text-black text-[9px] font-black uppercase px-2 py-0.5 rounded-md tracking-widest shadow-[0_0_10px_rgba(169,169,169,0.4)] select-none ml-1.5 ${className}`}>
          🥈 Vice-Presidente
        </span>
      </>
    );
  }

  if (cleanApelido === 'MARKETING' || cleanApelido === 'ROSA') {
    return (
      <span className={`inline-flex items-center justify-center bg-gradient-to-r from-pink-500 to-rose-400 text-white text-[9px] font-black uppercase px-2 py-0.5 rounded-md tracking-widest shadow-[0_0_8px_rgba(244,63,94,0.3)] select-none ml-1.5 ${className}`}>
        📢 Marketing
      </span>
    );
  }

  // Fallback para outros apelidos normais
  return (
    <span className={`inline-flex items-center justify-center bg-white/10 border border-white/15 text-white/70 text-[9px] font-bold px-2 py-0.5 rounded-md ml-1.5 select-none ${className}`}>
      {apelido}
    </span>
  );
}
