import { NextResponse } from 'next/server';
import { db } from '../../../../lib/firebase';
import { doc, updateDoc } from 'firebase/firestore';

const apiKey = process.env.NEXT_PUBLIC_FIREBASE_API_KEY || 'AIzaSyCuicJZFBMWJYj5UHPCvuI5tXoqPP_u-eE';

export async function POST(request: Request) {
  try {
    const { email } = await request.json();
    if (!email) {
      return NextResponse.json({ error: 'E-mail não informado' }, { status: 400 });
    }

    const emailLimpo = email.trim().toLowerCase();

    // 1. Reseta no Firestore a flag de primeiro login
    try {
      await updateDoc(doc(db, 'alunos', emailLimpo), {
        primeiro_login_concluido: false
      });
    } catch (e) {
      console.warn('Aviso updateDoc primeiro_login_concluido:', e);
    }

    // 2. Dispara e-mail de redefinição pelo Firebase Auth
    try {
      await fetch('https://identitytoolkit.googleapis.com/v1/accounts:sendOobCode?key=' + apiKey, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          requestType: 'PASSWORD_RESET',
          email: emailLimpo
        })
      });
    } catch (err) {
      console.warn('Aviso envio reset e-mail:', err);
    }

    return NextResponse.json({ 
      success: true, 
      message: 'A senha de ' + emailLimpo + ' foi resetada com sucesso!'
    });
  } catch (error: any) {
    console.error('Erro na API de reset de senha:', error);
    return NextResponse.json({ error: error.message }, { status: 500 });
  }
}
