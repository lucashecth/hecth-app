// src/components/MenuCards.tsx
"use client";

interface MenuCardsProps {
  onNavegar: (aba: any) => void; 
  isAdmin: boolean;
  isTeacher?: boolean;
  totalMensagensNaoLidas?: number;
  totalPagamentosPendentes?: number;
  totalCadastrosPendentes?: number;
}

export function MenuCards({ onNavegar, isAdmin, isTeacher = false, totalMensagensNaoLidas = 0, totalPagamentosPendentes = 0, totalCadastrosPendentes = 0 }: MenuCardsProps) {
  
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
      bg: 'bg-green-400/10',
      bloqueado: false
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
      bg: 'bg-[#ef3340]/10',
      bloqueado: true
    },
    {
      nome: 'Hecth Rewards',
      id: 'rewards' as const,
      icone: (
        <svg xmlns="http://www.w3.org/2000/svg" width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round">
          <polygon points="12 2 15.09 8.26 22 9.27 17 14.14 18.18 21.02 12 17.77 5.82 21.02 7 14.14 2 9.27 8.91 8.26 12 2" />
        </svg>
      ),
      cor: 'text-amber-400',
      bg: 'bg-amber-400/10',
      bloqueado: true
    }
  ];

  return (
    <div className="grid grid-cols-3 gap-2 mb-8">
      {/* 1, 2 e 3: Mensalidade, Uniformes e Perfil */}
      {acoes.map((acao) => (
        <button 
          key={acao.nome}
          onClick={() => {
            if (acao.bloqueado) {
              alert("🔒 Esta funcionalidade estará disponível em breve!");
            } else {
              onNavegar(acao.id);
            }
          }}
          className="bg-[#121212] border border-white/5 rounded-2xl py-5 flex flex-col items-center justify-center gap-2 transition-all active:scale-95 relative"
        >
          <div className={`w-9 h-9 rounded-full flex items-center justify-center ${acao.bg} ${acao.cor}`}>
            {acao.icone}
          </div>
          <span className="text-[9px] font-black uppercase tracking-tighter text-white/60 flex items-center justify-center gap-1">
            {acao.bloqueado && <span>🔒</span>}
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

      {/* 5: Mensagens */}
      <button 
        onClick={() => onNavegar('mensagens')}
        className="bg-[#121212] border border-white/5 rounded-2xl py-5 flex flex-col items-center justify-center gap-2 transition-all active:scale-95 relative"
      >
        <div className="w-9 h-9 rounded-full flex items-center justify-center bg-purple-500/10 text-purple-400">
          <svg xmlns="http://www.w3.org/2000/svg" width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round">
            <path d="M21 15a2 2 0 0 1-2 2H7l-4 4V5a2 2 0 0 1 2-2h14a2 2 0 0 1 2 2z" />
          </svg>
        </div>
        <span className="text-[9px] font-black uppercase tracking-tighter text-white/60">
          Mensagens
        </span>
        {totalMensagensNaoLidas > 0 && (
          <span className="absolute top-2 right-2 bg-[#ef3340] text-white text-[9px] font-black min-w-5 h-5 px-1.5 rounded-full flex items-center justify-center shadow-[0_0_8px_rgba(239,51,64,0.5)]">
            {totalMensagensNaoLidas}
          </span>
        )}

      </button>

      {/* 6: ADMIN (Sempre o último, na segunda linha, terceira posição) */}
      {(isAdmin || isTeacher) && (
        <button 
          onClick={() => onNavegar('admin')}
          className="bg-[#121212] border border-white/5 rounded-2xl py-5 flex flex-col items-center justify-center gap-2 transition-all active:scale-95 group hover:border-[#ef3340]/30 relative"
        >
          <div className="w-9 h-9 rounded-full flex items-center justify-center bg-yellow-500/10 text-yellow-500 text-lg">
            ☢️
          </div>
          <span className="text-[9px] font-black uppercase tracking-tighter text-white/60">
            Gestão
          </span>
          {isAdmin && ((totalPagamentosPendentes + totalCadastrosPendentes + totalMensagensNaoLidas) > 0) && (
            <span className="absolute top-2 right-2 min-w-5 h-5 px-1.5 rounded-full bg-[#ef3340] flex items-center justify-center text-[9px] font-black text-white shadow-[0_0_8px_rgba(239,51,64,0.5)] border border-black/40">
              {totalPagamentosPendentes + totalCadastrosPendentes + totalMensagensNaoLidas}
            </span>
          )}
        </button>
      )}
    </div>
  );
}
