"use client";
import { useState, useEffect } from 'react';
import { supabase } from '../lib/supabase';

export function AdminPagamentosView({ onVoltar }: { onVoltar: () => void }) {
  const [alunos, setAlunos] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [imgZoom, setImgZoom] = useState<string | null>(null);

  useEffect(() => { carregarPagamentos(); }, []);

  async function carregarPagamentos() {
    setLoading(true);
    // Buscamos quem enviou o pagamento e ainda não foi confirmado como pago
    const { data } = await supabase
      .from('alunos')
      .select('*')
      .eq('pagamento_enviado', true)
      .order('nome', { ascending: true });
    if (data) setAlunos(data);
    setLoading(false);
  }

  async function confirmarPagamento(aluno: any) {
    if (!window.confirm(`Confirmar recebimento de ${aluno.nome}?`)) return;

    const { error } = await supabase
      .from('alunos')
      .update({ 
        mensalidade_paga: true, 
        pagamento_enviado: false 
      })
      .eq('id', aluno.id);

    if (!error) {
      setAlunos(alunos.filter(a => a.id !== aluno.id));
      alert("✅ Pagamento confirmado e acesso liberado!");
    }
  }

  return (
    <div className="animacao-entrada w-full pb-20 pt-4">
      {/* MODAL DE ZOOM TELA CHEIA CORRIGIDO */}
      {imgZoom && (
        <div className="fixed inset-0 z-[100] bg-black flex flex-col items-center justify-center animacao-entrada">
          <button 
            onClick={() => setImgZoom(null)}
            className="absolute top-10 right-6 w-12 h-12 bg-[#ef3340] rounded-full flex items-center justify-center text-white text-xl font-black shadow-lg z-[110] active:scale-95"
          >
            ✕
          </button>
          
          <div className="w-full h-full overflow-auto flex items-center justify-center">
            <img 
              src={imgZoom} 
              className="w-full h-full object-contain cursor-zoom-in transition-transform duration-300"
              onClick={(e) => {
                const target = e.currentTarget;
                // Alterna entre tamanho normal e zoom de 2.5x para ler os números
                if (target.style.transform === 'scale(2.5)') {
                  target.style.transform = 'scale(1)';
                  target.style.cursor = 'zoom-in';
                } else {
                  target.style.transform = 'scale(2.5)';
                  target.style.cursor = 'zoom-out';
                }
              }}
            />
          </div>
        </div>
      )}

      <div className="flex items-center gap-4 mb-8 px-5">
        <button onClick={onVoltar} className="p-3 bg-white/5 rounded-full text-white/50">
          <svg xmlns="http://www.w3.org/2000/svg" width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="3" strokeLinecap="round" strokeLinejoin="round"><path d="m15 18-6-6 6-6"/></svg>
        </button>
        <h2 className="text-xl font-black uppercase italic tracking-tight text-white">Validar Pagamentos</h2>
      </div>

      <div className="flex flex-col gap-4 px-2">
        {loading ? (
          <p className="text-center py-20 text-white/20 text-[10px] font-black uppercase animate-pulse italic">Buscando comprovantes...</p>
        ) : alunos.length === 0 ? (
          <div className="text-center py-20 opacity-20"><span className="text-5xl block mb-4">✅</span><p className="text-xs font-black uppercase tracking-widest">Nenhum pagamento pendente</p></div>
        ) : (
          alunos.map(aluno => (
            <div key={aluno.id} className="bg-[#121212] border border-white/5 rounded-[2rem] p-5 flex flex-col gap-4">
              <div className="flex items-center justify-between">
                <div className="text-left">
                  <h4 className="font-black text-lg uppercase tracking-tighter text-white leading-none mb-1">{aluno.nome} {aluno.sobrenome}</h4>
                  <span className="text-[10px] font-black uppercase tracking-widest text-[#ef3340] italic">Plano {aluno.frequencia_semanal || 2}x</span>
                </div>
                <div className="w-16 h-16 rounded-2xl overflow-hidden border-2 border-white/10 shrink-0 shadow-xl">
                  <img src={aluno.foto_url} className="w-full h-full object-cover" />
                </div>
              </div>

              <div className="flex gap-2">
                <button 
                  onClick={() => {
                    // MUDANÇA AQUI: Prioridade para o comprovante_url
                    if (aluno.comprovante_url) {
                      setImgZoom(aluno.comprovante_url);
                    } else {
                      alert('Este aluno não enviou o arquivo corretamente.');
                    }
                  }}
                  className="flex-1 py-4 bg-white/5 rounded-2xl text-[10px] font-black uppercase tracking-widest text-white/70 border border-white/5 active:scale-95 transition-all"
                >
                  Ver Comprovante
                </button>
                <button onClick={() => confirmarPagamento(aluno)} className="flex-1 py-4 bg-green-600 rounded-2xl text-[10px] font-black uppercase tracking-widest text-white active:scale-95 transition-all">
                  Confirmar
                </button>
              </div>
            </div>
          ))
        )}
      </div>
    </div>
  );
}