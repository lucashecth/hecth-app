"use client";

interface HeaderProps {
  alunoDb: any;
  onLogout: () => void;
}

export function Header({ alunoDb, onLogout }: HeaderProps) {
  return (
    <header className="bg-[#ef3340] px-5 py-4 shadow-xl flex justify-between items-center mb-6 sticky top-0 z-50 border-b border-white/10">
      
      {/* LADO ESQUERDO: Logo + Barra + Nome/Nível */}
      <div className="flex items-center gap-4">
        <img src="/hecth-logo.svg" alt="HECTH." className="h-8 w-auto"/>
        <span className="text-[10px] not-italic font-medium text-white/30 bg-white/5 px-2 py-0.5 rounded-full tracking-normal">
    v1.0.7
  </span>
        <div className="h-8 w-[1px] bg-white/30 rounded-full"></div>
        <div className="flex flex-col">
          <span className="text-sm font-bold leading-none text-white">Olá, {alunoDb?.nome?.split(' ')[0]}</span>
          <span className="text-[10px] font-black uppercase tracking-widest text-black/60 mt-1">
            {alunoDb?.nivel || 'Aprendiz'}
          </span>
        </div>
      </div>

      {/* LADO DIREITO: Foto + Sair */}
      <div className="flex items-center gap-3">
        <button onClick={onLogout} className="text-[10px] font-black text-white uppercase tracking-widest opacity-60 hover:opacity-100 transition-opacity">
          Sair
        </button>
        <div className="w-10 h-10 rounded-full border-2 border-white shadow-lg overflow-hidden bg-white flex items-center justify-center">
          {alunoDb?.foto_url ? (
            <img src={alunoDb.foto_url} className="w-full h-full object-cover" />
          ) : (
            <span className="text-red-600 font-bold">{alunoDb?.nome?.charAt(0)}</span>
          )}
        </div>
      </div>
    </header>
  );
}