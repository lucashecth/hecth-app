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
      
      {/* MODAL DE ZOOM TELA CHEIA */}
      {imgZoom && (
        <div className="fixed inset-0 z-[100] bg-black flex flex-col items-center justify-center animacao-entrada">
          <button 
            onClick={() => setImgZoom(null)}
            className="absolute top-10 right-6 w-12 h-12 bg-white/10 rounded-full flex items-center justify-center text-white text-2xl font-bold backdrop-blur-md z-[110]"
          >
            ✕
          </button>
          <div className="w-full h-full p-4 flex items-center justify-center overflow-auto">
            <img 
              src={imgZoom} 
              className="max-w-none min-w-full h-auto object-contain transition-transform duration-300" 
              style={{ transform: 'scale(1.2)' }} // Zoom inicial leve
              onClick={(e) => {
                const target = e.currentTarget;
                target.style.transform = target.style.transform === 'scale(1.2)' ? 'scale(2.5)' : 'scale(1.2)';
              }}
            />
          </div>
          <p className="absolute bottom-10 text-white/40 text-[10px] font-black uppercase tracking-widest">Toque na imagem para dar zoom</p>
        </div>
      )}

      {/* HEADER */}
      <div className="flex items-center gap-4 mb-8 px-5">
        <button onClick={onVoltar} className="p-3 bg-white/5 rounded-full text-white/50">
          <svg xmlns="http://www.w3.org/2000/svg" width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="3" strokeLinecap="round" strokeLinejoin="round"><path d="m15 18-6-6 6-6"/></svg>
        </button>
        <h2 className="text-xl font-black uppercase italic tracking-tight text-white">Validar Pagamentos</h2>
      </div>

      {/* LISTA */}
      <div className="flex flex-col gap-4 px-2">
        {loading ? (
          <p className="text-center py-20 text-white/20 text-[10px] font-black uppercase animate-pulse italic">Buscando comprovantes...</p>
        ) : alunos.length === 0 ? (
          <div className="text-center py-20 opacity-20">
            <span className="text-5xl block mb-4">✅</span>
            <p className="text-xs font-black uppercase tracking-widest">Nenhum pagamento pendente</p>
          </div>
        ) : (
          alunos.map(aluno => (
            <div key={aluno.id} className="bg-[#121212] border border-white/5 rounded-[2rem] p-5 flex flex-col gap-4">
              
              <div className="flex items-center justify-between">
                <div className="text-left">
                  <h4 className="font-black text-lg uppercase tracking-tighter text-white leading-none mb-1">
                    {aluno.nome} {aluno.sobrenome}
                  </h4>
                  <span className="text-[10px] font-black uppercase tracking-widest text-[#ef3340] italic">
                    Plano {aluno.frequencia_semanal || 2}x na semana
                  </span>
                </div>
                <div className="w-16 h-16 rounded-2xl overflow-hidden border-2 border-white/10 shrink-0 shadow-xl">
                  <img src={aluno.foto_url} className="w-full h-full object-cover" />
                </div>
              </div>

              <div className="flex gap-2">
                <button 
                  onClick={() => setImgZoom(aluno.foto_url)} // Aqui você pode buscar a URL do comprovante no storage se preferir
                  className="flex-1 py-4 bg-white/5 rounded-2xl text-[10px] font-black uppercase tracking-widest text-white/70 border border-white/5 active:scale-95 transition-all"
                >
                  Ver Comprovante
                </button>
                <button 
                  onClick={() => confirmarPagamento(aluno)}
                  className="flex-1 py-4 bg-green-600 rounded-2xl text-[10px] font-black uppercase tracking-widest text-white active:scale-95 transition-all shadow-[0_5px_15px_rgba(22,163,74,0.3)]"
                >
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