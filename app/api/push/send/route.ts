import { NextResponse } from 'next/server';
import { supabase } from '../../../../lib/supabase';
import webpush from 'web-push';

const vapidPublicKey = process.env.VAPID_PUBLIC_KEY!;
const vapidPrivateKey = process.env.VAPID_PRIVATE_KEY!;

if (vapidPublicKey && vapidPrivateKey) {
  webpush.setVapidDetails(
    'mailto:contato@hecth.com.br',
    vapidPublicKey,
    vapidPrivateKey
  );
}

export async function POST(request: Request) {
  try {
    const { emails, titulo, conteudo, salvamentoManual } = await request.json();
    if (!titulo || !conteudo) {
      return NextResponse.json({ error: 'Falta título ou conteúdo' }, { status: 400 });
    }

    // 1. Busca todas as inscrições no Firestore
    const { data: todasInscricoes, error: dbError } = await supabase.from('push_inscricoes').select('*');
    if (dbError) throw dbError;

    let inscricoes = todasInscricoes || [];
    if (emails && Array.isArray(emails) && emails.length > 0) {
      const emailSet = new Set(emails.map((e: string) => String(e || '').toLowerCase().trim()));
      inscricoes = inscricoes.filter((ins: any) => emailSet.has(String(ins.aluno_email || '').toLowerCase().trim()));
    }

    // 2. DEDUPLICAÇÃO ESTRITA: Garante que o mesmo endpoint ou mesmo aparelho do aluno nunca receba em duplicidade
    const seenEndpoints = new Set<string>();
    const inscricoesUnicas = [];
    for (const ins of inscricoes) {
      const endpoint = ins.subscription?.endpoint || ins.endpoint;
      if (endpoint && !seenEndpoints.has(endpoint)) {
        seenEndpoints.add(endpoint);
        inscricoesUnicas.push(ins);
      }
    }

    if (!inscricoesUnicas || inscricoesUnicas.length === 0) {
      return NextResponse.json({ 
        success: true, 
        sentCount: 0, 
        entreguesPara: [],
        falhasEm: [],
        message: 'Nenhum dispositivo com push ativo encontrado para estes destinatários.' 
      });
    }

    const payload = JSON.stringify({
      title: titulo,
      body: conteudo,
      url: '/'
    });

    const entreguesPara: string[] = [];
    const falhasEm: string[] = [];

    const promises = inscricoesUnicas.map(async (ins: any) => {
      const emailAluno = ins.aluno_email || 'desconhecido';
      try {
        const sub = ins.subscription || ins;
        await webpush.sendNotification(sub, payload);
        entreguesPara.push(emailAluno);
      } catch (err: any) {
        console.error('Falha no disparo para', emailAluno, err);
        falhasEm.push(`${emailAluno} (erro: ${err.statusCode || 'desconhecido'})`);
        if (err.statusCode === 410 || err.statusCode === 404 || err.statusCode === 400) {
          await supabase.from('push_inscricoes').delete().eq('id', ins.id);
        }
      }
    });

    await Promise.all(promises);

    // Grava no log de notificação
    if (salvamentoManual && emails && Array.isArray(emails)) {
      const logs = emails.map((email: string) => ({
        aluno_email: email,
        tipo: 'manual',
        titulo: titulo,
        conteudo: conteudo
      }));
      if (logs.length > 0) {
        await supabase.from('notificacoes_logs').insert(logs);
      }
    }

    return NextResponse.json({
      success: true,
      sentCount: entreguesPara.length,
      failedCount: falhasEm.length,
      entreguesPara: Array.from(new Set(entreguesPara)),
      falhasEm
    });
  } catch (error: any) {
    console.error('Erro na API de envio push:', error);
    return NextResponse.json({ error: error.message }, { status: 500 });
  }
}
