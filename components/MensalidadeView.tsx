"use client";

interface MensalidadeProps {
  onVoltar: () => void;
  alunoDb: any;
}

export function MensalidadeView({ onVoltar, alunoDb }: MensalidadeProps) {
  
  // ==========================================
  // CÁLCULO DO PLANO E VALOR
  // ==========================================
  // Lê a frequência do banco, se não tiver, assume 2.
  const frequencia = alunoDb?.frequencia_semanal || 2; 
  const plano = `Plano HECTH Futevôlei - ${frequencia}x na semana`;
  
  // Define o valor base
  let valorNum = 140; 
  if (frequencia === 3) valorNum = 145;
  if (frequencia === 4) valorNum = 150;
  
  const valor = `R$ ${valorNum.toFixed(2).replace('.', ',')}`;

  // ==========================================
  // CÁLCULO DINÂMICO DO VENCIMENTO
  // ==========================================
  const diaVencimento = alunoDb?.dia_vencimento || 10; 
  
  const hoje = new Date();
  let mesCobranca = hoje.getMonth();
  let anoCobranca = hoje.getFullYear();

  if (hoje.getDate() > diaVencimento) {
    mesCobranca++;
    if (mesCobranca > 11) { 
      mesCobranca = 0;
      anoCobranca++;
    }
  }

  const dataCalculada = `${String(diaVencimento).padStart(2, '0')}/${String(mesCobranca + 1).padStart(2, '0')}/${anoCobranca}`;

  // ==========================================
  // STATUS DE PAGAMENTO DIRETO DO ALUNO
  // ==========================================
  const isPago = alunoDb?.mensalidade_paga === true;
  const status = isPago ? "Em dia" : "Pendente";
  
  const corStatus = isPago 
    ? 'bg-green-500/10 text-green-400 border-green-500/20' 
    : 'bg-orange-500/10 text-orange-400 border-orange-500/20';

  const copiarPix = () => {
    // Chave PIX do CT fixa aqui
    const chavePix = "00020126580014BR.GOV.BCB.PIX..."; 
    navigator.clipboard.writeText(chavePix);
    alert("Código PIX da HECTH copiado com sucesso!");
  };

  return (
    <div className="animacao-entrada">
      <div className="flex items-center gap-4 mb-6">
        <button onClick={onVoltar} className="bg-white/5 p-3 rounded-xl border border-white/10 hover:bg-white/10 transition-colors active:scale-95">
          <svg xmlns="http://www.w3.org/2000/svg" width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
            <path d="m15 18-6-6 6-6"/>
          </svg>
        </button>
        <h2 className="text-2xl font-black uppercase tracking-tighter">Sua Mensalidade</h2>
      </div>

      <div className="bg-[#121212] border border-white/5 rounded-3xl p-6 shadow-lg relative overflow-hidden">
        <div className="absolute -top-10 -right-10 w-32 h-32 bg-[#ef3340]/10 rounded-full blur-2xl pointer-events-none"></div>

        <div className="flex justify-between items-start mb-4 relative z-10">
          <div>
            <span className={`text-[10px] font-black uppercase tracking-widest px-2 py-1 rounded-md border ${corStatus}`}>
              {status}
            </span>
            <h3 className="text-lg font-bold mt-3 text-white max-w-[150px] leading-tight">{plano}</h3>
          </div>
          <span className="text-2xl font-black text-white">{valor}</span>
        </div>

        <div className="border-t border-white/5 pt-5 mt-4 relative z-10">
          <p className="text-white/40 text-xs font-medium uppercase tracking-wider mb-1">Próximo Vencimento</p>
          <div className="flex items-baseline gap-2">
            <p className="text-white font-bold text-lg">{dataCalculada}</p>
            <span className="text-white/30 text-[10px] uppercase font-black tracking-widest">(Todo dia {diaVencimento})</span>
          </div>
        </div>

        <button 
          onClick={copiarPix}
          className="w-full bg-[#ef3340] text-white font-black uppercase tracking-widest text-xs py-4 rounded-2xl mt-6 hover:bg-red-600 transition-colors active:scale-95 relative z-10"
        >
          Copiar Código PIX
        </button>
      </div>

      <p className="text-white/30 text-center text-[10px] uppercase font-bold tracking-widest mt-6">
        Dúvidas? Fale com a recepção.
      </p>
    </div>
  );
}