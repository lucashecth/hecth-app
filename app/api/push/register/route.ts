import { NextResponse } from 'next/server';
import { supabase } from '../../../../lib/supabase';

export async function POST(request: Request) {
  try {
    const { email, subscription } = await request.json();
    if (!email || !subscription) {
      return NextResponse.json({ error: 'Falta email ou inscricao' }, { status: 400 });
    }

    // Busca inscrições existentes para este e-mail
    const { data: existentes } = await supabase
      .from('push_inscricoes')
      .select('id, subscription')
      .eq('aluno_email', email);

    if (existentes && existentes.length > 0) {
      const idsParaDeletar = existentes
        .filter((ins: any) => ins.subscription?.endpoint === subscription.endpoint)
        .map((ins: any) => ins.id);

      if (idsParaDeletar.length > 0) {
        await supabase
          .from('push_inscricoes')
          .delete()
          .in('id', idsParaDeletar);
      }
    }


    // Insere a nova inscricao
    const { error } = await supabase
      .from('push_inscricoes')
      .insert({
        aluno_email: email,
        subscription: subscription
      });

    if (error) throw error;

    return NextResponse.json({ success: true });
  } catch (error: any) {
    console.error('Erro ao registrar push:', error);
    return NextResponse.json({ error: error.message }, { status: 500 });
  }
}
