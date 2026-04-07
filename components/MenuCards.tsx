// src/components/MenuCards.tsx
"use client";

interface MenuCardsProps {
  onNavegar: (aba: any) => void; 
  isAdmin: boolean;
}

export function MenuCards({ onNavegar, isAdmin }: MenuCardsProps) {
  
  // Função para forçar a atualização do PWA e limpar cache
  const atualizarApp = () => {
    if ('serviceWorker' in navigator) {
      navigator.serviceWorker.getRegistrations().then((registrations) => {
        for (let registration of registrations) {
          registration.unregister();
        }
        window.location.reload();
      });
    } else {
      window.location.reload();
    }
  };

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
      {/* 1, 2 e 3: Mensalidade, Uniformes e Perfil */}
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

      {/* 4: Atualizar (Sempre na segunda linha, primeira posição) */}
      <button 
        onClick={atualizarApp}
        className="bg-[#121212] border border-white/5 rounded-2xl py-5 flex flex-col items-center justify-center gap-2 transition-all active:scale-95"
      >
        <div className="w-9 h-9 rounded-full flex items-center justify-center bg-blue-500/10 text-blue-400">
          <svg xmlns="http://www.w3.org/2000/svg" width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round">
            <path d="M21 12a9 9 0 0 0-9-9 9.75 9.75 0 0 0-6.74 2.74L3 8" />
            <path d="M3 3v5h5" />
            <path d="M3 12a9 9 0 0 0 9 9 9.75 9.75 0 0 0 6.74-2.74L21 16" />
            <path d="M16 21v-5h5" />
          </svg>
        </div>
        <span className="text-[9px] font-black uppercase tracking-tighter text-white/60">
          Atualizar
        </span>
      </button>

      {/* 5: Espaço Reservado / Futuro Recurso */}
      <div className="rounded-2xl border border-white/[0.02] flex items-center justify-center">
         <span className="text-[8px] font-black text-white/[0.05] tracking-widest italic uppercase">Hecth.</span>
      </div>

      {/* 6: ADMIN (Sempre o último, na segunda linha, terceira posição) */}
{isAdmin && (
  <button 
    onClick={() => onNavegar('admin')}
    className="bg-[#121212] border border-white/5 rounded-2xl py-5 flex flex-col items-center justify-center gap-2 transition-all active:scale-95"
  >
    <div className="w-9 h-9 rounded-full flex items-center justify-center bg-blue-500/10 text-blue-400">
      <svg xmlns="http://www.w3.org/2000/svg" width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round"><path d="M16 21v-2a4 4 0 0 0-4-4H6a4 4 0 0 0-4 4v2"/><circle cx="9" cy="7" r="4"/><path d="M22 21v-2a4 4 0 0 0-3-3.87"/><path d="M16 3.13a4 4 0 0 1 0 7.75"/></svg>
    </div>
    <span className="text-[9px] font-black uppercase tracking-tighter text-white/60">
      Gestão
    </span>
  </button>
)}
    </div>
  );
}