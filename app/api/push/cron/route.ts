import { NextResponse } from 'next/server';
import { supabase } from '../../../../lib/supabase';
import { obterStatusMensalidade } from '../../../../utils/mensalidade';
import webpush from 'web-push';

const vapidPublicKey = process.env.NEXT_PUBLIC_VAPID_PUBLIC_KEY!;
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
    // 1. Busca todos os alunos aprovados
    const { data: alunos, error: errorAlunos } = await supabase
      .from('alunos')
      .select('*')
      .eq('status', 'aprovado');

    if (errorAlunos) throw errorAlunos;
    if (!alunos || alunos.length === 0) {
      return NextResponse.json({ success: true, message: 'Nenhum aluno cadastrado.' });
    }

    // Busca todas as inscrições para envio de push
    const { data: inscricoes, error: errorIns } = await supabase
      .from('push_inscricoes')
      .select('*');
    if (errorIns) throw errorIns;

    // Busca os logs dos últimos 15 dias para evitar disparos duplicados
    const quinzeDiasAtras = new Date();
    quinzeDiasAtras.setDate(quinzeDiasAtras.getDate() - 15);
    
    const { data: logsRecentes, error: errorLogs } = await supabase
      .from('notificacoes_logs')
      .select('*')
      .gte('enviado_em',quinzeDiasAtras.toISOString());
    if (errorLogs) throw errorLogs;

    const logsArray = logsRecentes || [];
    const inscricoesMap = new Map(inscricoes?.map(i => [i.aluno_email, i.subscription]) || []);

    const hoje = new Date();
    let disparados = 0;

    const dispararPushNativo = async (email: string, tipo: string, titulo: string, conteudo: string) => {
      const sub = inscricoesMap.get(email);
      if (!sub) return;

      // Verifica se já mandou esse tipo de aviso nos logs recentes
      const jaEnviado = logsArray.some(l => l.aluno_email === email && l.tipo === tipo);
      if (jaEnviado) return;

      try {
        const payload = JSON.stringify({ title: titulo, body: conteudo, url: '/' });
        await webpush.sendNotification(sub, payload);
        
        // Salva log de disparo
        await supabase.from('notificacoes_logs').insert({
          aluno_email: email,
          tipo: tipo,
          titulo: titulo,
          conteudo: conteudo
        });
        disparados++;
      } catch (err) {
        console.error(`Erro ao disparar push automático (${tipo}) para ${email}:`, err);
      }
    };

    // Processa regras
    for (const aluno of alunos) {
      // Regra 1: Mensalidade expira amanhã (diasRestantes === 1)
      const statusF = obterStatusMensalidade(aluno);
      if (statusF.ativo && statusF.diasRestantes === 1) {
        await dispararPushNativo(
          aluno.email,
          'plano_expirando_1_dia',
          'Sua mensalidade vence amanhã!',
          'Lembre-se de confirmar o pagamento para não perder o acesso às turmas.'
        );
      }

      // Regra 2: 5 dias sem ir para o treino (inativo)
      const isTeacher = String(aluno.nivel || '').toLowerCase().includes('professor');
      const isAdmin = !!aluno.is_admin;
      if (!isTeacher && !isAdmin && !aluno.personal) {
        let diasInativo = 999;
        if (aluno.ultima_inscricao) {
          const ultimaData = new Date(aluno.ultima_inscricao);
          const diff = hoje.getTime() - ultimaData.getTime();
          diasInativo = Math.floor(diff / (1000 * 60 * 60 * 24));
        }

        if (diasInativo >= 5) {
          await dispararPushNativo(
            aluno.email,
            'inativo_5_dias',
            'Sentimos sua falta! 🥺',
            'Faz mais de 5 dias que você não treina. Bora agendar a próxima aula?'
          );
        }
      }
    }

    return NextResponse.json({ success: true, count: disparados });
  } catch (error: any) {
    console.error('Erro na cron de push:', error);
    return NextResponse.json({ error: error.message }, { status: 500 });
  }
}
