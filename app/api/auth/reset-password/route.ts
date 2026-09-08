import { NextResponse } from 'next/server';
import { supabase } from '@/lib/supabase';

const FIREBASE_API_KEY = process.env.NEXT_PUBLIC_FIREBASE_API_KEY || 'AIzaSyCuicJZFBMWJYj5UHPCvuI5tXoqPP_u-eE';

export async function POST(req: Request) {
  try {
    const body = await req.json();
    const { email } = body;

    if (!email) {
      return NextResponse.json({ error: 'Email obrigatorio' }, { status: 400 });
    }

    const cleanEmail = email.trim().toLowerCase();

    // 1. Atualizar primeiro_login_concluido = false no Firestore via supabase wrapper
    await supabase
      .from('alunos')
      .update({ primeiro_login_concluido: false })
      .eq('email', cleanEmail);

    // 2. Disparar email de recuperacao oficial do Firebase Auth REST API
    const authRes = await fetch(
      `https://identitytoolkit.googleapis.com/v1/accounts:sendOobCode?key=${FIREBASE_API_KEY}`,
      {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          requestType: 'PASSWORD_RESET',
          email: cleanEmail,
        }),
      }
    );

    const authData = await authRes.json();

    if (!authRes.ok) {
      console.error('Erro ao enviar email pelo Firebase Auth:', authData);
      return NextResponse.json(
        { error: authData.error?.message || 'Falha ao enviar email pelo Firebase Auth' },
        { status: authRes.status }
      );
    }

    return NextResponse.json({
      success: true,
      message: 'Senha resetada e email enviado com sucesso.',
    });
  } catch (error: any) {
    console.error('Erro na rota reset-password:', error);
    return NextResponse.json({ error: error.message || 'Erro interno' }, { status: 500 });
  }
}
