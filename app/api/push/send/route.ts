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

    // Busca as inscrições
    let query = supabase.from('push_inscricoes').select('*');
    if (emails && Array.isArray(emails) && emails.length > 0) {
      query = query.in('aluno_email', emails);
    }

    const { data: inscricoes, error: dbError } = await query;
    if (dbError) throw dbError;

    if (!inscricoes || inscricoes.length === 0) {
      return NextResponse.json({ 
        success: true, 
        sentCount: 0, 
        message: 'Nenhum dispositivo inscrito para receber.' 
      });
    }

    const payload = JSON.stringify({
      title: titulo,
      body: conteudo,
      url: '/'
    });

    let sucessos = 0;
    let falhas = 0;

    const promises = inscricoes.map(async (ins: any) => {
      try {
        await webpush.sendNotification(ins.subscription, payload);
        sucessos++;
      } catch (err: any) {
        console.error('Falha no disparo para', ins.aluno_email, err);
        falhas++;
        if (err.statusCode === 410 || err.statusCode === 404) {
          await supabase.from('push_inscricoes').delete().eq('id', ins.id);
        }
      }
    });

    await Promise.all(promises);

    // Grava no log de notificação
    if (salvamentoManual && emails && Array.isArray(emails)) {
      const logs = emails.map(email => ({
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
      sentCount: sucessos,
      failedCount: falhas
    });
  } catch (error: any) {
    console.error('Erro na API de envio push:', error);
    return NextResponse.json({ error: error.message }, { status: 500 });
  }
}
