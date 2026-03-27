// src/components/MenuCards.tsx
"use client";

export function MenuCards() {
  const acoes = [
    {
      nome: 'Mensalidade',
      icone: (
        <svg xmlns="http://www.w3.org/2000/svg" width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
          <rect x="3" y="6" width="18" height="12" rx="2" />
          <path d="M3 10h18" />
        </svg>
      ),
      cor: 'text-green-400',
      bg: 'bg-green-400/10'
    },
    {
      nome: 'Uniformes',
      icone: (
        <svg xmlns="http://www.w3.org/2000/svg" width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
          <path d="M20.38 3.46L16 2a8.59 8.59 0 0 0-8 0L3.62 3.46a2 2 0 0 0-1.34 2.23l.58 3.47a1 1 0 0 0 .99.84H6v10c0 1.1.9 2 2 2h8a2 2 0 0 0 2-2V10h2.15a1 1 0 0 0 .99-.84l.58-3.47a2 2 0 0 0-1.34-2.23z" />
        </svg>
      ),
      cor: 'text-[#ef3340]',
      bg: 'bg-[#ef3340]/10'
    },
    {
      nome: 'Perfil',
      icone: (
        <svg xmlns="http://www.w3.org/2000/svg" width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
          <path d="M19 21v-2a4 4 0 0 0-4-4H9a4 4 0 0 0-4 4v2" />
          <circle cx="12" cy="7" r="4" />
        </svg>
      ),
      cor: 'text-white/70',
      bg: 'bg-white/5'
    }
  ];

  return (
    <div className="grid grid-cols-3 gap-3 mb-8">
      {acoes.map((acao) => (
        <button 
          key={acao.nome}
          onClick={() => alert(`Tela de ${acao.nome} em breve!`)}
          className="bg-[#121212] border border-white/5 rounded-2xl p-4 flex flex-col items-center justify-center gap-3 transition-all active:scale-95 hover:bg-white/5"
        >
          <div className={`w-10 h-10 rounded-full flex items-center justify-center ${acao.bg} ${acao.cor}`}>
            {acao.icone}
          </div>
          <span className="text-[10px] font-bold uppercase tracking-widest text-white/70">
            {acao.nome}
          </span>
        </button>
      ))}
    </div>
  );
}