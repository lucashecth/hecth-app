// src/components/Header.tsx
"use client";

interface HeaderProps {
  alunoDb: any;
  onLogout: () => void;
}

export function Header({ alunoDb, onLogout }: HeaderProps) {
  return (
    <header className="bg-[#ef3340] px-5 py-4 shadow-xl flex justify-between items-center mb-6 sticky top-0 z-40 border-b border-white/10">
      <img src="/hecth-logo.svg" alt="HECTH." className="h-9 w-auto"/>
      <div className="flex items-center gap-3">
        <div className="flex flex-col items-end">
          <span className="text-sm font-bold leading-none">Olá, {alunoDb?.nome}</span>
          <button onClick={onLogout} className="text-[10px] font-black uppercase tracking-widest opacity-60 hover:opacity-100 mt-1 transition-opacity">Sair</button>
        </div>
        <div className="w-10 h-10 rounded-full border-2 border-white shadow-lg overflow-hidden bg-white flex items-center justify-center">
          {alunoDb?.foto_url ? <img src={alunoDb.foto_url} className="w-full h-full object-cover" /> : <span className="text-red-600 font-bold">{alunoDb?.nome?.charAt(0)}</span>}
        </div>
      </div>
    </header>
  );
}