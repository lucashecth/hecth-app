import { NextResponse } from 'next/server';
import { supabase } from '../../../../lib/supabase';

export async function POST(request: Request) {
  try {
    const { email, subscription } = await request.json();
    if (!email || !subscription) {
      return NextResponse.json({ error: 'Falta email ou inscricao' }, { status: 400 });
    }

    // Deleta inscrições antigas com o mesmo endpoint para o mesmo email
    await supabase
      .from('push_inscricoes')
      .delete()
      .eq('aluno_email', email)
      .eq('subscription->>endpoint', subscription.endpoint);

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
