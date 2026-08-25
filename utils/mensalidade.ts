// src/utils/mensalidade.ts

export function obterStatusMensalidade(aluno: any) {
  if (!aluno) return { ativo: false, diasRestantes: 0 };
  
  // Se for admin/professor, sempre ativo
  const nivel = String(aluno.nivel || '').toLowerCase();
  if (
    nivel.includes('professor') || 
    aluno.email === 'lucas.hecth@gmail.com' || 
    aluno.email === 'fellipe.hecth@gmail.com' ||
    aluno.email === 'alex.hecth@gmail.com'
  ) {
    return { ativo: true, diasRestantes: 999 };
  }

  const hoje = new Date();
  const diaVencimento = aluno.dia_vencimento || 10;
  
  // Determina qual o último mês pago
  let ultimoMesPago = aluno.ultimo_mes_pago;
  if (!ultimoMesPago) {
    // Fallback retrocompatível usando a coluna mensalidade_paga anterior
    const anoAtual = hoje.getFullYear();
    const mesAtual = String(hoje.getMonth() + 1).padStart(2, '0');
    const anteriorDate = new Date(hoje.getFullYear(), hoje.getMonth() - 1, 1);
    const anoAnterior = anteriorDate.getFullYear();
    const mesAnterior = String(anteriorDate.getMonth() + 1).padStart(2, '0');
    
    ultimoMesPago = aluno.mensalidade_paga ? `${anoAtual}-${mesAtual}` : `${anoAnterior}-${mesAnterior}`;
  }

  // O vencimento é sempre o dia D do mês seguinte ao último mês pago
  const [anoPago, mesPago] = ultimoMesPago.split('-').map(Number);
  
  // Mês seguinte ao mês pago
  let anoVencimento = anoPago;
  let mesVencimento = mesPago + 1;
  if (mesVencimento > 12) {
    mesVencimento = 1;
    anoVencimento += 1;
  }

  // Data limite: dia X às 23:59:59 do mês de vencimento (bloqueia no dia X+1 às 00:00)
  const dataLimite = new Date(anoVencimento, mesVencimento - 1, diaVencimento, 23, 59, 59, 999);
  
  const ativo = hoje <= dataLimite;
  
  // Cálculo de dias restantes (arredondado para cima)
  const diffTime = dataLimite.getTime() - hoje.getTime();
  const diasRestantes = Math.max(0, Math.ceil(diffTime / (1000 * 60 * 60 * 24)));

  return { ativo, diasRestantes };
}

export function obterNovoMesPago(aluno: any) {
  const hoje = new Date();
  const anoMesAtual = `${hoje.getFullYear()}-${String(hoje.getMonth() + 1).padStart(2, '0')}`;
  
  if (!aluno || !aluno.ultimo_mes_pago) {
    return anoMesAtual;
  }
  
  const [anoPago, mesPago] = aluno.ultimo_mes_pago.split('-').map(Number);
  const dataUltimoPago = new Date(anoPago, mesPago - 1, 1);
  const dataAtual = new Date(hoje.getFullYear(), hoje.getMonth(), 1);
  
  if (dataUltimoPago < dataAtual) {
    return anoMesAtual;
  } else {
    // Pagamento antecipado: incrementa +1 mês do último pago
    let novoAno = anoPago;
    let novoMes = mesPago + 1;
    if (novoMes > 12) {
      novoMes = 1;
      novoAno += 1;
    }
    return `${novoAno}-${String(novoMes).padStart(2, '0')}`;
  }
}

