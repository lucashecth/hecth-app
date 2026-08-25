// src/utils/googleSheets.ts

/**
 * Envia os dados de mensalidades dos alunos para a planilha do Google Sheets via Google Apps Script
 * @param scriptUrl URL de implantação do Google Apps Script
 * @param sheetName Nome da aba (normalmente a data atual formatada xx/xx/xxxx)
 * @param rows Lista de registros formatados
 */
export async function enviarParaGoogleSheets(scriptUrl: string, sheetName: string, rows: any[]): Promise<{ success: boolean; message?: string }> {
  try {
    const payload = {
      sheetName,
      rows
    };

    const response = await fetch('/api/export-sheets', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify(payload)
    });

    const result = await response.json();
    if (result && result.status === 'success') {
      return { success: true };
    } else {
      return { success: false, message: result.message || 'Erro reportado pelo Google Sheets API Server.' };
    }
  } catch (err: any) {
    console.error('Erro de conexão com o backend:', err);
    return { success: false, message: err.message || 'Erro de conexão.' };
  }
}

