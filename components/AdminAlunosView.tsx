// src/components/AdminAlunosView.tsx
"use client";

interface AdminAlunosViewProps {
  onVoltar: () => void;
}

export function AdminAlunosView({ onVoltar }: AdminAlunosViewProps) {
  return (
    <div className="animacao-entrada min-h-screen w-full pt-4">
      <div className="flex items-center gap-4 mb-8 px-5">
        <button onClick={onVoltar} className="p-3 bg-white/5 rounded-full text-white/50">
          <svg xmlns="http://www.w3.org/2000/svg" width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="3" strokeLinecap="round" strokeLinejoin="round"><path d="m15 18-6-6 6-6"/></svg>
        </button>
        <h2 className="text-2xl font-black uppercase italic tracking-tighter text-white">Gestão HECTH</h2>
      </div>

      <div className="px-5">
        <div className="bg-[#121212] border border-dashed border-white/10 rounded-3xl p-10 text-center">
          <p className="text-white/20 font-black uppercase text-xs tracking-[0.3em] italic">
            Área em reestruturação...
          </p>
        </div>
      </div>
    </div>
  );
}