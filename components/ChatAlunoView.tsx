// src/components/ChatAlunoView.tsx
"use client";

import { useState, useEffect, useRef } from 'react';
import { supabase } from '../lib/supabase';

interface Mensagem {
  id: number;
  aluno_email: string;
  enviado_por: string;
  nome_remetente: string;
  texto: string;
  created_at: string;
}

interface ChatAlunoViewProps {
  onVoltar: () => void;
  alunoDb: any;
  session: any;
}

export function ChatAlunoView({ onVoltar, alunoDb, session }: ChatAlunoViewProps) {
  const [mensagens, setMensagens] = useState<Mensagem[]>([]);
  const [novoTexto, setNovoTexto] = useState('');
  const [loading, setLoading] = useState(true);
  const [sending, setSending] = useState(false);
  const chatEndRef = useRef<HTMLDivElement | null>(null);

  useEffect(() => {
    if (!session?.user?.email) return;

    carregarMensagens();

    // Subscribe to new messages for this student in real-time
    const canal = supabase
      .channel(`chat_${session.user.email}`)
      .on('postgres_changes', { 
        event: 'INSERT', 
        schema: 'public', 
        table: 'mensagens'
      }, (payload) => {
        const novaMsg = payload.new as Mensagem;
        if (novaMsg.aluno_email === session.user.email) {
          setMensagens(prev => {
            // Prevent duplicates
            if (prev.some(m => m.id === novaMsg.id)) return prev;
            return [...prev, novaMsg];
          });
        }
      })
      .subscribe();


    return () => {
      supabase.removeChannel(canal);
    };
  }, [session]);

  useEffect(() => {
    scrollParaBaixo();
  }, [mensagens]);

  const carregarMensagens = async () => {
    setLoading(true);
    try {
      const { data, error } = await supabase
        .from('mensagens')
        .select('*')
        .eq('aluno_email', session.user.email)
        .order('id', { ascending: true });

      if (error) throw error;
      setMensagens(data || []);
    } catch (err: any) {
      console.error("Erro ao carregar mensagens:", err.message);
    } finally {
      setLoading(false);
    }
  };

  const scrollParaBaixo = () => {
    chatEndRef.current?.scrollIntoView({ behavior: 'smooth' });
  };

  const handleEnviar = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!novoTexto.trim() || sending) return;

    setSending(true);
    const textoMensagem = novoTexto.trim();
    setNovoTexto('');

    // ID temporário para evitar chaves duplicadas no map do React
    const tempId = Math.floor(Math.random() * 10000000);
    const msgOtimista: Mensagem = {
      id: tempId,
      aluno_email: session.user.email,
      enviado_por: session.user.email,
      nome_remetente: `${alunoDb?.nome || 'Aluno'}`,
      texto: textoMensagem,
      created_at: new Date().toISOString()
    };

    // Adiciona instantaneamente na tela do remetente
    setMensagens(prev => [...prev, msgOtimista]);

    try {
      const { data, error } = await supabase
        .from('mensagens')
        .insert([{
          aluno_email: session.user.email,
          enviado_por: session.user.email,
          nome_remetente: `${alunoDb?.nome || 'Aluno'}`,
          texto: textoMensagem,
          lida: false
        }])
        .select();

      if (error) throw error;

      // Substitui o ID temporário pelo ID real vindo do banco
      if (data && data[0]) {
        setMensagens(prev => prev.map(m => m.id === tempId ? (data[0] as Mensagem) : m));
      }
    } catch (err: any) {
      alert("Erro ao enviar mensagem: " + err.message);
      // Remove a mensagem otimista em caso de erro
      setMensagens(prev => prev.filter(m => m.id !== tempId));
      setNovoTexto(textoMensagem); // Restaura o texto
    } finally {
      setSending(false);
    }
  };


  return (
    <div className="animacao-entrada px-4 pb-10 pt-4 max-w-lg mx-auto flex flex-col h-[85vh]">
      {/* Header */}
      <div className="flex items-center justify-between mb-4 border-b border-white/10 pb-3 shrink-0">
        <div className="flex items-center gap-3">
          <div className="w-10 h-10 rounded-full bg-[#ef3340]/10 flex items-center justify-center text-lg">
            🏐
          </div>
          <div>
            <h2 className="text-sm font-black uppercase tracking-wider text-white">Linha Direta HECTH</h2>
            <p className="text-[10px] font-bold text-green-400 uppercase tracking-widest">Suporte & Professores</p>
          </div>
        </div>
        <button 
          onClick={onVoltar} 
          className="text-[10px] font-black uppercase tracking-widest text-white/40 hover:text-white transition-colors"
        >
          Voltar para Arena
        </button>
      </div>

      {/* Chat Messages */}
      <div className="flex-1 overflow-y-auto pr-1 flex flex-col gap-3 mb-4 rounded-2xl bg-[#121212] border border-white/5 p-4 scrollbar-thin scrollbar-thumb-white/10">
        {loading ? (
          <div className="flex-1 flex justify-center items-center">
            <p className="text-white/30 text-[10px] font-black uppercase tracking-widest animate-pulse">Carregando mensagens...</p>
          </div>
        ) : mensagens.length === 0 ? (
          <div className="flex-1 flex flex-col items-center justify-center text-center text-white/30 p-6">
            <span className="text-3xl mb-2">💬</span>
            <p className="text-xs font-black uppercase tracking-wider">Inicie sua conversa com a Gestão</p>
            <p className="text-[9px] uppercase font-bold text-white/20 mt-1">Escreva sua dúvida ou mensagem abaixo.</p>
          </div>
        ) : (
          mensagens.map((msg) => {
            const isMe = msg.enviado_por === session.user.email;
            return (
              <div 
                key={msg.id} 
                className={`flex flex-col max-w-[80%] ${isMe ? 'self-end items-end' : 'self-start items-start'}`}
              >
                {/* Sender Name (only show for others so the student knows who replied: Lucas, Fellipe, etc) */}
                {!isMe && (
                  <span className="text-[9px] font-black text-white/40 uppercase tracking-wider mb-1 ml-2">
                    {msg.nome_remetente}
                  </span>
                )}
                <div 
                  className={`px-4 py-3 rounded-2xl text-sm font-semibold leading-relaxed break-all ${
                    isMe 
                      ? 'bg-[#ef3340] text-white rounded-tr-none shadow-[0_4px_15px_rgba(239,51,64,0.2)]' 
                      : 'bg-white/5 border border-white/10 text-white rounded-tl-none'
                  }`}
                >
                  {msg.texto}
                </div>
                <span className="text-[8px] text-white/20 uppercase font-black mt-1 px-1">
                  {new Date(msg.created_at).toLocaleTimeString('pt-BR', { hour: '2-digit', minute: '2-digit' })}
                </span>
              </div>
            );
          })
        )}
        <div ref={chatEndRef} />
      </div>

      {/* Input Form */}
      <form onSubmit={handleEnviar} className="flex gap-2 shrink-0">
        <input 
          type="text" 
          placeholder="Digite sua mensagem..."
          value={novoTexto}
          onChange={(e) => setNovoTexto(e.target.value)}
          className="flex-1 bg-white/5 border border-white/10 rounded-xl px-4 py-3.5 text-white outline-none focus:ring-1 focus:ring-[#ef3340] text-sm font-bold"
          required
        />
        <button 
          type="submit"
          disabled={sending || !novoTexto.trim()}
          className="bg-[#ef3340] text-white font-black text-xs uppercase tracking-widest px-6 py-3.5 rounded-xl active:scale-95 transition-all shadow-[0_0_15px_rgba(239,51,64,0.3)] disabled:opacity-40 shrink-0"
        >
          {sending ? '...' : 'Enviar'}
        </button>
      </form>
    </div>
  );
}
