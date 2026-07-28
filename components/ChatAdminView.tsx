// src/components/ChatAdminView.tsx
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
  lida: boolean;
}

interface Aluno {
  id: number;
  nome: string;
  sobrenome: string;
  email: string;
  foto_url: string;
}

interface ChatAdminViewProps {
  onVoltar: () => void;
  alunoDb: any;
  session: any;
}

export function ChatAdminView({ onVoltar, alunoDb, session }: ChatAdminViewProps) {
  const [alunos, setAlunos] = useState<Aluno[]>([]);
  const [conversas, setConversas] = useState<Record<string, { ultimaMsg: string; data: string; unreadCount: number; data_recente: number }>>({});
  const [busca, setBusca] = useState('');
  const [selectedAluno, setSelectedAluno] = useState<Aluno | null>(null);
  const [mensagens, setMensagens] = useState<Mensagem[]>([]);
  const [novoTexto, setNovoTexto] = useState('');
  const [loadingList, setLoadingList] = useState(true);
  const [loadingChat, setLoadingChat] = useState(false);
  const [sending, setSending] = useState(false);

  const chatEndRef = useRef<HTMLDivElement | null>(null);

  useEffect(() => {
    carregarAlunosEConversas();

    // Subscribe to all messages for real-time updates on active threads
    const canal = supabase
      .channel('chat_admin_global')
      .on('postgres_changes', { event: 'INSERT', schema: 'public', table: 'mensagens' }, (payload) => {
        const novaMsg = payload.new as Mensagem;
        const isStudentMsg = novaMsg.enviado_por === novaMsg.aluno_email;
        
        let isUnread = isStudentMsg;
        setSelectedAluno(current => {
          if (current && current.email === novaMsg.aluno_email) {
            isUnread = false;
            // Also mark it read in database if we are actively chatting!
            supabase
              .from('mensagens')
              .update({ lida: true })
              .eq('id', novaMsg.id)
              .then();
          }
          return current;
        });

        // Update threads preview
        setConversas(prev => {
          const prevConv = prev[novaMsg.aluno_email];
          const prevCount = prevConv ? prevConv.unreadCount : 0;
          return {
            ...prev,
            [novaMsg.aluno_email]: {
              ultimaMsg: novaMsg.texto,
              data: novaMsg.created_at,
              unreadCount: isUnread ? prevCount + 1 : prevCount,
              data_recente: new Date(novaMsg.created_at).getTime()
            }
          };
        });

        // If currently chatting with this student, append message
        setSelectedAluno(current => {
          if (current && current.email === novaMsg.aluno_email) {
            setMensagens(prev => {
              if (prev.some(m => m.id === novaMsg.id)) return prev;
              return [...prev, novaMsg];
            });
          }
          return current;
        });
      })
      .subscribe();

    return () => {
      supabase.removeChannel(canal);
    };
  }, []);

  useEffect(() => {
    if (selectedAluno) {
      carregarMensagensDoAluno(selectedAluno.email);
    }
  }, [selectedAluno]);

  useEffect(() => {
    scrollParaBaixo();
  }, [mensagens]);

  const carregarAlunosEConversas = async () => {
    setLoadingList(true);
    try {
      // 1. Fetch approved students
      const { data: dataAlunos, error: errorAlunos } = await supabase
        .from('alunos')
        .select('id, nome, sobrenome, email, foto_url')
        .eq('status', 'aprovado')
        .order('nome', { ascending: true });

      if (errorAlunos) throw errorAlunos;
      setAlunos(dataAlunos || []);

      // 2. Fetch latest messages to construct snippets and count unread
      const { data: dataMsgs, error: errorMsgs } = await supabase
        .from('mensagens')
        .select('*')
        .order('id', { ascending: false });

      if (errorMsgs) throw errorMsgs;

      const conversasMapeadas: Record<string, { ultimaMsg: string; data: string; unreadCount: number; data_recente: number }> = {};
      dataMsgs?.forEach((m: Mensagem) => {
        const isStudentMsg = m.enviado_por === m.aluno_email;
        const isUnread = isStudentMsg && !m.lida;

        if (!conversasMapeadas[m.aluno_email]) {
          conversasMapeadas[m.aluno_email] = {
            ultimaMsg: m.texto,
            data: m.created_at,
            unreadCount: isUnread ? 1 : 0,
            data_recente: new Date(m.created_at).getTime()
          };
        } else {
          if (isUnread) {
            conversasMapeadas[m.aluno_email].unreadCount += 1;
          }
        }
      });
      setConversas(conversasMapeadas);

    } catch (err: any) {
      console.error("Erro ao carregar lista de chats:", err.message);
    } finally {
      setLoadingList(false);
    }
  };

  const carregarMensagensDoAluno = async (alunoEmail: string) => {
    setLoadingChat(true);
    try {
      // Mark as read in Supabase
      await supabase
        .from('mensagens')
        .update({ lida: true })
        .eq('aluno_email', alunoEmail)
        .eq('enviado_por', alunoEmail);

      const { data, error } = await supabase
        .from('mensagens')
        .select('*')
        .eq('aluno_email', alunoEmail)
        .order('id', { ascending: true });

      if (error) throw error;
      setMensagens(data || []);

      // Mark thread as read locally
      setConversas(prev => {
        if (prev[alunoEmail]) {
          return {
            ...prev,
            [alunoEmail]: { ...prev[alunoEmail], unreadCount: 0 }
          };
        }
        return prev;
      });
    } catch (err: any) {
      console.error("Erro ao carregar chat:", err.message);
    } finally {
      setLoadingChat(false);
    }
  };

  const scrollParaBaixo = () => {
    chatEndRef.current?.scrollIntoView({ behavior: 'smooth' });
  };

  const handleEnviar = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!selectedAluno || !novoTexto.trim() || sending) return;

    setSending(true);
    const textoMensagem = novoTexto.trim();
    setNovoTexto('');

    try {
      const nomeGestor = alunoDb?.nome || 'Gestor';
      const { error } = await supabase
        .from('mensagens')
        .insert([{
          aluno_email: selectedAluno.email,
          enviado_por: session?.user?.email || 'gestao',
          nome_remetente: nomeGestor,
          texto: textoMensagem,
          lida: true // Admin messages are read by default
        }]);

      if (error) throw error;
    } catch (err: any) {
      alert("Erro ao enviar: " + err.message);
      setNovoTexto(textoMensagem);
    } finally {
      setSending(false);
    }
  };

  const alunosFiltrados = alunos.filter(a =>
    `${a.nome} ${a.sobrenome}`.toLowerCase().includes(busca.toLowerCase())
  );

  // SORT STUDENTS: Chat with the latest message always on top
  const alunosOrdenados = [...alunosFiltrados].sort((a, b) => {
    const infoA = conversas[a.email];
    const infoB = conversas[b.email];
    const timeA = infoA ? infoA.data_recente : 0;
    const timeB = infoB ? infoB.data_recente : 0;
    return timeB - timeA;
  });

  return (
    <div className="animacao-entrada px-4 pb-10 pt-4 max-w-lg mx-auto flex flex-col h-[85vh]">
      {/* Header */}
      <div className="flex items-center justify-between mb-4 border-b border-white/10 pb-3 shrink-0">
        <div className="flex items-center gap-3">
          <div className="w-10 h-10 rounded-full bg-purple-500/10 flex items-center justify-center text-lg">
            💬
          </div>
          <div>
            <h2 className="text-sm font-black uppercase tracking-wider text-white">Central de Mensagens</h2>
            <p className="text-[10px] font-bold text-purple-400 uppercase tracking-widest">Painel Administrativo</p>
          </div>
        </div>
        <button 
          onClick={selectedAluno ? () => setSelectedAluno(null) : onVoltar} 
          className="text-[10px] font-black uppercase tracking-widest text-white/40 hover:text-white transition-colors"
        >
          {selectedAluno ? 'Voltar para Lista' : 'Voltar para Arena'}
        </button>
      </div>

      {!selectedAluno ? (
        /* CHATS LIST VIEW */
        <div className="flex-1 flex flex-col overflow-hidden">
          <div className="mb-4">
            <input 
              type="text"
              placeholder="BUSCAR ATLETA..."
              value={busca}
              onChange={(e) => setBusca(e.target.value)}
              className="w-full bg-[#121212] border border-white/10 rounded-xl px-4 py-3.5 text-xs font-black uppercase tracking-widest outline-none focus:border-purple-500/50 text-white"
            />
          </div>

          <div className="flex-1 overflow-y-auto flex flex-col gap-2 pr-1 rounded-2xl bg-[#121212] border border-white/5 p-3">
            {loadingList ? (
              <div className="flex justify-center items-center py-20">
                <p className="text-white/30 text-[10px] font-black uppercase tracking-widest animate-pulse">Carregando conversas...</p>
              </div>
            ) : alunosOrdenados.length === 0 ? (
              <p className="text-center py-10 text-white/30 text-xs font-black uppercase tracking-widest">Nenhum atleta encontrado</p>
            ) : (
              alunosOrdenados.map((aluno) => {
                const infoChat = conversas[aluno.email];
                return (
                  <div 
                    key={aluno.id}
                    onClick={() => setSelectedAluno(aluno)}
                    className="flex items-center gap-3 p-3 rounded-2xl border border-white/5 bg-[#1a1a1a]/50 hover:bg-[#1a1a1a] transition-all cursor-pointer active:scale-[0.98]"
                  >
                    <div className="w-10 h-10 rounded-full overflow-hidden shrink-0 border border-white/10 bg-white/5 flex items-center justify-center">
                      {aluno.foto_url ? (
                        <img src={aluno.foto_url} alt="" className="w-full h-full object-cover" />
                      ) : (
                        <span className="text-sm">👤</span>
                      )}
                    </div>

                    <div className="flex-1 min-w-0 text-left">
                      <div className="flex justify-between items-center">
                        <h4 className="font-black text-xs uppercase tracking-tight text-white/90 truncate">
                          {aluno.nome} {aluno.sobrenome}
                        </h4>
                        {infoChat?.data && (
                          <span className="text-[8px] font-black text-white/20 uppercase shrink-0">
                            {new Date(infoChat.data).toLocaleTimeString('pt-BR', { hour: '2-digit', minute: '2-digit' })}
                          </span>
                        )}
                      </div>
                      
                      <p className="text-[10px] text-white/40 truncate mt-0.5 font-semibold">
                        {infoChat?.ultimaMsg || 'Nenhuma mensagem enviada'}
                      </p>
                    </div>

                    {infoChat?.unreadCount !== undefined && infoChat.unreadCount > 0 && (
                      <div className="min-w-5 h-5 px-1.5 rounded-full bg-[#ef3340] flex items-center justify-center text-white text-[9px] font-black shrink-0 shadow-[0_0_8px_rgba(239,51,64,0.4)]">
                        {infoChat.unreadCount}
                      </div>
                    )}
                  </div>
                );
              })
            )}
          </div>
        </div>
      ) : (
        /* ACTIVE CHAT VIEW */
        <div className="flex-1 flex flex-col overflow-hidden">
          {/* Active Student Info Header */}
          <div className="flex items-center gap-3 bg-white/5 border border-white/5 p-3 rounded-2xl mb-3 shrink-0">
            <div className="w-10 h-10 rounded-full overflow-hidden border border-white/10 bg-white/5 shrink-0 flex items-center justify-center">
              {selectedAluno.foto_url ? (
                <img src={selectedAluno.foto_url} alt="" className="w-full h-full object-cover" />
              ) : (
                <span className="text-sm">👤</span>
              )}
            </div>
            <div className="text-left">
              <h3 className="font-black text-xs uppercase tracking-wider text-white">
                {selectedAluno.nome} {selectedAluno.sobrenome}
              </h3>
              <p className="text-[9px] font-black text-white/40 uppercase tracking-widest">Conversa Direta</p>
            </div>
          </div>

          {/* Chat Messages */}
          <div className="flex-1 overflow-y-auto pr-1 flex flex-col gap-3 mb-4 rounded-2xl bg-[#121212] border border-white/5 p-4 scrollbar-thin scrollbar-thumb-white/10">
            {loadingChat ? (
              <div className="flex-1 flex justify-center items-center">
                <p className="text-white/30 text-[10px] font-black uppercase tracking-widest animate-pulse">Carregando chat...</p>
              </div>
            ) : mensagens.length === 0 ? (
              <div className="flex-1 flex flex-col items-center justify-center text-center text-white/30 p-6">
                <span className="text-2xl mb-2">💬</span>
                <p className="text-xs font-black uppercase tracking-wider">Histórico vazio</p>
                <p className="text-[9px] uppercase font-bold text-white/20 mt-1">Envie a primeira mensagem para este aluno.</p>
              </div>
            ) : (
              mensagens.map((msg) => {
                const isStudent = msg.enviado_por === selectedAluno.email;
                return (
                  <div 
                    key={msg.id} 
                    className={`flex flex-col max-w-[80%] ${!isStudent ? 'self-end items-end' : 'self-start items-start'}`}
                  >
                    {/* Sender Identity Label */}
                    {!isStudent && (
                      <span className="text-[8px] font-black text-white/30 uppercase tracking-widest mb-0.5 mr-1">
                        {msg.nome_remetente}
                      </span>
                    )}
                    <div 
                       className={`px-3.5 py-2.5 rounded-2xl text-xs font-semibold leading-relaxed break-all ${
                        !isStudent 
                          ? 'bg-purple-600 text-white rounded-tr-none' 
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

          {/* Form */}
          <form onSubmit={handleEnviar} className="flex gap-2 shrink-0">
            <input 
              type="text" 
              placeholder={`Responder como ${alunoDb?.nome || 'Gestor'}...`}
              value={novoTexto}
              onChange={(e) => setNovoTexto(e.target.value)}
              className="flex-1 bg-white/5 border border-white/10 rounded-xl px-4 py-3.5 text-white outline-none focus:ring-1 focus:ring-purple-500 text-xs font-bold"
              required
            />
            <button 
              type="submit"
              disabled={sending || !novoTexto.trim()}
              className="bg-purple-600 text-white font-black text-xs uppercase tracking-widest px-6 py-3.5 rounded-xl active:scale-95 transition-all shadow-[0_0_15px_rgba(147,51,234,0.3)] disabled:opacity-40 shrink-0"
            >
              {sending ? '...' : 'Enviar'}
            </button>
          </form>
        </div>
      )}
    </div>
  );
}
