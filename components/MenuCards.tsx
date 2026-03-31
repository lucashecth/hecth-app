// src/components/MenuCards.tsx
"use client";

interface MenuCardsProps {
  onNavegar: (aba: any) => void; 
  isAdmin: boolean;
}

export function MenuCards({ onNavegar, isAdmin }: MenuCardsProps) {
  const acoes = [
    {
      nome: 'Mensalidade',
      id: 'mensalidade' as const,
      icone: (
        <svg xmlns="http://www.w3.org/2000/svg" width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round">
          <rect x="3" y="6" width="18" height="12" rx="2" /><path d="M3 10h18" />
        </svg>
      ),
      cor: 'text-green-400',
      bg: 'bg-green-400/10'
    },
    {
      nome: 'Uniformes',
      id: 'uniformes' as const,
      icone: (
        <svg xmlns="http://www.w3.org/2000/svg" width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round">
          <path d="M20.38 3.46L16 2a8.59 8.59 0 0 0-8 0L3.62 3.46a2 2 0 0 0-1.34 2.23l.58 3.47a1 1 0 0 0 .99.84H6v10c0 1.1.9 2 2 2h8a2 2 0 0 0 2-2V10h2.15a1 1 0 0 0 .99-.84l.58-3.47a2 2 0 0 0-1.34-2.23z" />
        </svg>
      ),
      cor: 'text-[#ef3340]',
      bg: 'bg-[#ef3340]/10'
    },
    {
      nome: 'Perfil',
      id: 'perfil' as const,
      icone: (
        <svg xmlns="http://www.w3.org/2000/svg" width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round">
          <path d="M19 21v-2a4 4 0 0 0-4-4H9a4 4 0 0 0-4 4v2" /><circle cx="12" cy="7" r="4" />
        </svg>
      ),
      cor: 'text-white/70',
      bg: 'bg-white/5'
    }
  ];

  return (
    <div className="grid grid-cols-3 gap-2 mb-8">
      {/* Cards dos Alunos */}
      {acoes.map((acao) => (
        <button 
          key={acao.nome}
          onClick={() => onNavegar(acao.id)}
          className="bg-[#121212] border border-white/5 rounded-2xl py-5 flex flex-col items-center justify-center gap-2 transition-all active:scale-95"
        >
          <div className={`w-9 h-9 rounded-full flex items-center justify-center ${acao.bg} ${acao.cor}`}>
            {acao.icone}
          </div>
          <span className="text-[9px] font-black uppercase tracking-tighter text-white/60">
            {acao.nome}
          </span>
        </button>
      ))}

      {/* Botão Gestão Ocupando tudo abaixo */}
      {isAdmin && (
        <button 
          onClick={() => onNavegar('admin')}
          className="col-span-3 mt-1 bg-[#1a1a1a] p-4 rounded-2xl border border-[#ef3340]/30 flex items-center justify-between active:scale-95 transition-all group"
        >
          <div className="flex items-center gap-4">
            <div className="w-10 h-10 rounded-full bg-[#ef3340]/10 flex items-center justify-center text-[#ef3340]">
               <span className="text-xl animate-pulse">☢️</span>
            </div>
            <div className="text-left">
              <span className="text-[9px] font-black uppercase tracking-[0.2em] text-[#ef3340] block">Acesso Restrito</span>
              <span className="font-black text-xs text-white italic tracking-tighter">PAINEL DE GESTÃO ADMIN</span>
            </div>
          </div>
          
          <div className="flex items-center gap-2">
            <div className="w-1.5 h-1.5 bg-[#ef3340] rounded-full animate-ping" />
            <svg xmlns="http://www.w3.org/2000/svg" width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="#ef3340" strokeWidth="3" strokeLinecap="round" strokeLinejoin="round">
              <path d="m9 18 6-6-6-6"/>
            </svg>
          </div>
        </button>
      )}
    </div>
  );
}