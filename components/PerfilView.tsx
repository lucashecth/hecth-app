// src/components/PerfilView.tsx
"use client";

interface PerfilViewProps {
  onVoltar: () => void;
  alunoDb: any;
}

export function PerfilView({ onVoltar, alunoDb }: PerfilViewProps) {
  return (
    <div className="animacao-entrada w-full pb-20 pt-4">
      
      {/* HEADER */}
      <div className="flex items-center gap-4 mb-8 px-5">
        <button 
          onClick={onVoltar} 
          className="p-3 bg-white/5 rounded-full text-white/50 active:scale-95 transition-transform"
        >
          <svg xmlns="http://www.w3.org/2000/svg" width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="3" strokeLinecap="round" strokeLinejoin="round"><path d="m15 18-6-6 6-6"/></svg>
        </button>
        <h2 className="text-2xl font-black uppercase italic tracking-tighter text-white">
          Meu Perfil
        </h2>
      </div>

      <div className="px-5">
        {/* CARD PRINCIPAL */}
        <div className="bg-[#121212] border border-white/5 rounded-3xl p-6 flex flex-col items-center text-center">
          <div className="w-24 h-24 rounded-full overflow-hidden border border-white/10 mb-4 bg-white/5 shrink-0">
            {alunoDb?.foto_url ? (
              <img src={alunoDb.foto_url} alt="Foto de perfil" className="w-full h-full object-cover" />
            ) : (
              <div className="w-full h-full flex items-center justify-center text-3xl font-black text-[#ef3340]">
                {alunoDb?.nome?.charAt(0) || '?'}
              </div>
            )}
          </div>
          <h3 className="text-xl font-black uppercase tracking-tighter text-white/90 leading-tight">
            {alunoDb?.nome} {alunoDb?.sobrenome}
          </h3>
          <p className="text-[10px] font-black uppercase tracking-widest text-[#ef3340] italic mt-1">
            {alunoDb?.nivel || 'Atleta HECTH'}
          </p>
        </div>

        {/* INFORMAÇÕES ADICIONAIS */}
        <div className="mt-4 flex flex-col gap-2">
          <div className="bg-[#1a1a1a] border border-white/5 rounded-2xl p-4 flex items-center justify-between">
            <span className="text-[10px] font-black uppercase tracking-widest text-white/40">E-mail</span>
            <span className="text-xs font-bold text-white/80 truncate ml-4">{alunoDb?.email}</span>
          </div>
          <div className="bg-[#1a1a1a] border border-white/5 rounded-2xl p-4 flex items-center justify-between">
            <span className="text-[10px] font-black uppercase tracking-widest text-white/40">Status</span>
            <span className="text-[10px] font-black uppercase tracking-widest text-green-400 italic">
              {alunoDb?.status === 'aprovado' ? 'Ativo' : alunoDb?.status}
            </span>
          </div>
        </div>
      </div>
    </div>
  );
}