// src/app/api/export-sheets/route.ts
import { NextResponse } from 'next/server';

export async function POST(request: Request) {
  try {
    const body = await request.json();
    const scriptUrl = 'https://script.google.com/macros/s/AKfycbzQWVqn5LEoJXZuf2wLierTlMjCYKRVTb3jAp12NZSayITGe1qI_00qHq8sAh7ln7zuUQ/exec';

    const response = await fetch(scriptUrl, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify(body)
    });

    const text = await response.text();
    let data;
    try {
      data = JSON.parse(text);
    } catch (e) {
      data = { status: 'success', raw: text }; // Google Apps Script às vezes retorna HTML ou texto limpo
    }

    return NextResponse.json(data);
  } catch (error: any) {
    console.error("Erro na API Route de Exportação:", error);
    return NextResponse.json({ status: 'error', message: error.message }, { status: 500 });
  }
}
