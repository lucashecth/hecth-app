"use client";

import { useState, useEffect } from 'react';
import { supabase } from '../lib/supabase';
import { lancarBolasMikasa } from '../utils/animacoes';
import { Header } from '../components/Header';
import { TurmaCard } from '../components/TurmaCard';
import { MenuCards } from '../components/MenuCards';
import { MensalidadeView } from '../components/MensalidadeView';
import { InstallAppCard } from '../components/InstallAppCard';
import { BotaoPush } from '../components/BotaoPush';
import { useAdmin } from '../hooks/useAdmin';
import { AdminAlunosView } from '../components/AdminAlunosView';

export default function Home() {
  const [mounted, setMounted] = useState(false);
  const [session, setSession] = useState<any>(null);
  const [alunoDb, setAlunoDb] = useState<any>(null);
  const [telaAtiva, setTelaAtiva] = useState<'inicio' | 'login' | 'cadastro'>('inicio');
  const [loading, setLoading] = useState(false);
  const [abaAtiva, setAbaAtiva] = useState<'arena' | 'mensalidade' | 'uniformes' | 'perfil'|'admin'>('arena');
  const { isAdmin } = useAdmin();
  const [viewAdmin, setViewAdmin] = useState<'menu' | 'alunos'>('menu');
  
  // Estados Formulários
  const [email, setEmail] = useState('');
  const [senha, setSenha] = useState('');
  const [nome, setNome] = useState('');
  const [sobrenome, setSobrenome] = useState('');
  const [foto, setFoto] = useState<File | null>(null);

  // Estados App Principal
  const [turmas, setTurmas] = useState<any[]>([]);
  const [presencasDb, setPresencasDb] = useState<any[]>([]);
  const [turmaIdClicada, setTurmaIdClicada] = useState<number | null>(null);
  const [acaoClicada, setAcaoClicada] = useState<'marcar' | 'desmarcar' | null>(null);

  useEffect(() => {
    setMounted(true);
    
    supabase.auth.getSession().then(({ data: { session } }) => {
      setSession(session);
      if (session) carregarPerfil(session.user.email);
    });

    const { data: { subscription } } = supabase.auth.onAuthStateChange((_event, newSession) => {
      setSession(newSession);
      if (newSession) {
        carregarPerfil(newSession.user.email);
      } else {
        setAlunoDb(null);
      }
    });

    carregarArena();

    const canalRealtime = supabase.channel('atualizacoes_arena')
      .on('postgres_changes', { event: '*', schema: 'public', table: 'presencas' }, () => {
        carregarArena();
      })
      .on('postgres_changes', { event: '*', schema: 'public', table: 'turmas' }, () => {
        carregarArena();
      })
      .subscribe();

    return () => {
      subscription.unsubscribe();
      supabase.removeChannel(canalRealtime);
    };
  }, []);

  const carregarArena = async () => {
    const { data: tData } = await supabase.from('turmas').select('*').order('id', { ascending: true });
    if (tData) setTurmas(tData);

    const { data: pData } = await supabase.from('presencas').select('*');
    if (pData) setPresencasDb(pData);
  };

  const carregarPerfil = async (emailUsuario: string | undefined) => {
    if (!emailUsuario) return;
    const { data } = await supabase.from('alunos').select('*').eq('email', emailUsuario).single();
    if (data) setAlunoDb(data);
  };

  const fazerLogout = async () => {
    setAlunoDb(null);
    setSession(null);
    await supabase.auth.signOut();
    setTelaAtiva('inicio');
  };

  const fazerLogin = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);
    const { error } = await supabase.auth.signInWithPassword({ email, password: senha });
    if (error) alert('Erro no login: ' + error.message);
    setLoading(false);
  };

  const fazerCadastro = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!nome || !sobrenome || !email || !senha || !foto) return alert('Preencha tudo e selecione a foto!');
    setLoading(true);
    try {
      const fileExt = foto.name.split('.').pop();
      const fileName = `${Date.now()}.${fileExt}`;
      const { error: uploadError } = await supabase.storage.from('avatares').upload(fileName, foto);
      if (uploadError) throw uploadError;
      
      const { data: publicUrlData } = supabase.storage.from('avatares').getPublicUrl(fileName);
      const { error: authError } = await supabase.auth.signUp({ email, password: senha });
      if (authError) throw authError;
      
      const novoAluno = { 
        nome, sobrenome, email, foto_url: publicUrlData.publicUrl, status: 'pendente' 
      };

      await supabase.from('alunos').insert([novoAluno]);
      setAlunoDb(novoAluno);

    } catch (err: any) { alert('Erro: ' + err.message); }
    setLoading(false);
  };

  const alternarPresenca = async (e: React.MouseEvent<HTMLButtonElement>, turmaId: number, vagasAtuais: number, vagasTotais: number, jaMarcou: boolean) => {
    if (!session || alunoDb?.status !== 'aprovado') return;
    
    setTurmaIdClicada(turmaId);
    setAcaoClicada(jaMarcou ? 'desmarcar' : 'marcar');

    if (jaMarcou) {
      setTimeout(async () => {
        setTurmas(turmas.map(t => t.id === turmaId ? { ...t, vagas_ocupadas: t.vagas_ocupadas - 1 } : t));
        setPresencasDb(prev => prev.filter(p => !(p.turma_id === turmaId && p.aluno_email === session.user.email)));
        
        await supabase.from('presencas').delete().match({ turma_id: turmaId, aluno_email: session.user.email });
        await supabase.from('turmas').update({ vagas_ocupadas: vagasAtuais - 1 }).eq('id', turmaId);
        
        setTurmaIdClicada(null); 
        setAcaoClicada(null);
      }, 400);
    } else {
      if (vagasAtuais >= vagasTotais) return alert("Esta turma já está lotada!");
      lancarBolasMikasa(e);
      
      const novaPresenca = { 
        turma_id: turmaId, 
        aluno_email: session.user.email, 
        foto_url: alunoDb.foto_url, 
        inicial: alunoDb.nome.charAt(0) 
      };

      setTurmas(turmas.map(t => t.id === turmaId ? { ...t, vagas_ocupadas: t.vagas_ocupadas + 1 } : t));
      setPresencasDb(prev => [...prev, novaPresenca]);
      
      await supabase.from('presencas').insert([novaPresenca]);
      await supabase.from('turmas').update({ vagas_ocupadas: vagasAtuais + 1 }).eq('id', turmaId);
      
      setTimeout(() => { setTurmaIdClicada(null); setAcaoClicada(null); }, 400);
    }
  };

  if (!mounted) return null;

  if (session && !alunoDb) {
    return (
      <div className="min-h-screen bg-black flex items-center justify-center">
        <p className="text-white/50 font-bold animate-pulse tracking-widest uppercase text-sm">"Será que hoje é dia de físico?"...</p>
        <button onClick={fazerLogout} className="text-red-500/50 hover:text-red-500 text-[10px] font-black uppercase tracking-widest underline transition-colors">Forçar Saída</button>
      </div>
    );
  }

  if (session && alunoDb?.status === 'pendente') {
    return (
      <div className="min-h-screen bg-black flex items-center justify-center p-5 text-white text-center">
        <div className="bg-[#1a1a1a] p-10 rounded-3xl border border-white/10 max-w-md">
          <div className="text-5xl mb-6">⏳</div>
          <h1 className="text-2xl font-bold mb-4">Passe em análise!</h1>
          <p className="text-white/60 mb-8">Olá {alunoDb.nome}, recebemos seu cadastro. Agora aguarde a aprovação do administrador para acessar as turmas.</p>
          <button onClick={fazerLogout} className="bg-white/10 px-6 py-2 rounded-full text-xs font-bold uppercase tracking-widest hover:bg-white/20 transition-colors">Sair</button>
        </div>
      </div>
    );
  }

  if (!session) {
    return (
      <div className="min-h-screen bg-black flex flex-col items-center justify-center p-5 font-sans">
        <div className="bg-[#1a1a1a] p-8 rounded-3xl shadow-2xl border border-white/5 w-full max-w-md">
          <div className="flex justify-center mb-10">
             <img src="/hecth-logo.svg" alt="HECTH." className="h-14 w-auto"/>
          </div>

          <InstallAppCard />
          {telaAtiva === 'inicio' ? (
            <div className="flex flex-col gap-4">
              <button onClick={() => setTelaAtiva('login')} className="w-full bg-white text-black font-bold py-4 rounded-xl hover:bg-gray-200 transition-all">Já sou aluno</button>
              <button onClick={() => setTelaAtiva('cadastro')} className="w-full bg-transparent text-white font-bold py-4 rounded-xl border border-white/20 hover:bg-white/5 transition-all">Primeiro acesso</button>
            </div>
          ) : telaAtiva === 'login' ? (
            <form onSubmit={fazerLogin} className="flex flex-col gap-4">
              <input type="email" placeholder="Seu e-mail" required className="w-full border rounded-xl px-4 py-3 text-white bg-white/5 outline-none focus:ring-2 focus:ring-red-500" value={email} onChange={(e) => setEmail(e.target.value)} />
              <input type="password" placeholder="Sua senha" required className="w-full border rounded-xl px-4 py-3 text-white bg-white/5 outline-none focus:ring-2 focus:ring-red-500" value={senha} onChange={(e) => setSenha(e.target.value)} />
              <button className="w-full bg-white text-black font-bold py-4 rounded-xl shadow-lg disabled:opacity-50" disabled={loading}>{loading ? 'Entrando...' : 'Entrar'}</button>
              <button type="button" onClick={() => setTelaAtiva('inicio')} className="text-gray-400 text-sm font-bold uppercase mt-2">Voltar</button>
            </form>
          ) : (
            <form onSubmit={fazerCadastro} className="flex flex-col gap-3">
              <div className="flex gap-2">
                <input type="text" placeholder="Nome" required className="w-1/2 border rounded-xl px-4 py-3 text-white bg-white/5" value={nome} onChange={(e) => setNome(e.target.value)} />
                <input type="text" placeholder="Sobrenome" required className="w-1/2 border rounded-xl px-4 py-3 text-white bg-white/5" value={sobrenome} onChange={(e) => setSobrenome(e.target.value)} />
              </div>
              <input type="email" placeholder="E-mail" required className="w-full border rounded-xl px-4 py-3 text-white bg-white/5" value={email} onChange={(e) => setEmail(e.target.value)} />
              <input type="password" placeholder="Senha" required className="w-full border rounded-xl px-4 py-3 text-white bg-white/5" value={senha} onChange={(e) => setSenha(e.target.value)} />
              <div className="flex flex-col gap-1 mt-2">
                <label className="text-[10px] uppercase font-black text-white/40 ml-1 tracking-widest">Sua Foto</label>
                <input type="file" required onChange={(e) => setFoto(e.target.files?.[0] || null)} className="text-xs text-white/50 file:bg-white/10 file:text-white file:rounded-full file:border-0 file:px-4 file:py-2" />
              </div>
              <button className="w-full bg-red-600 text-white font-bold py-4 rounded-xl shadow-lg mt-2 disabled:opacity-50" disabled={loading}>{loading ? 'Criando...' : 'Criar Conta'}</button>
              <button type="button" onClick={() => setTelaAtiva('inicio')} className="text-gray-400 text-sm font-bold uppercase mt-1">Voltar</button>
            </form>
          )}
        </div>
      </div>
    );
  }

  const agora = new Date();
  const horaAtual = agora.getHours();
  let dataExibicao = new Date(agora);
  
  if (horaAtual >= 21) {
    dataExibicao.setDate(dataExibicao.getDate() + 1);
  }

  if (agora.getDay() === 5 && horaAtual >= 10) {
    dataExibicao = new Date(agora);
    dataExibicao.setDate(dataExibicao.getDate() + 3);
  } else if (dataExibicao.getDay() === 6) {
    dataExibicao.setDate(dataExibicao.getDate() + 2);
  } else if (dataExibicao.getDay() === 0) {
    dataExibicao.setDate(dataExibicao.getDate() + 1);
  }

  const dataFormatada = dataExibicao.toLocaleDateString('pt-BR', { day: '2-digit', month: '2-digit', year: '2-digit' });
  const diaDaSemana = dataExibicao.getDay();
  const isHoje = dataExibicao.getDate() === agora.getDate() && dataExibicao.getMonth() === agora.getMonth();

  const turmasDoDia = turmas?.map(turma => {
    const t = { ...turma };
    if (diaDaSemana === 5) {
      const nomeNorm = t.nome?.toLowerCase().normalize('NFD').replace(/[\u0300-\u036f]/g, '');
      if (nomeNorm === 'intermediario') t.horario = '09:00';
    }
    return t;
  }).filter(turma => {
    if (diaDaSemana === 5) {
      const hora = parseInt(turma.horario.split(':')[0]);
      return hora < 13; 
    }
    return true;
  });

  const alunoJaMarcouAlguma = presencasDb.some(p => p.aluno_email === session?.user?.email);

  return (
    <div className="min-h-screen bg-black font-sans pb-10 text-white overflow-x-hidden">
      <Header alunoDb={alunoDb} onLogout={fazerLogout} />

      {/* A SOLUÇÃO: O <main> zera a margem quando estivermos na view de alunos, libertando os cards! */}
      <main className={abaAtiva === 'admin' && viewAdmin === 'alunos' ? "w-full" : "px-5"}>
        
        {abaAtiva === 'arena' && (
          <div className="animacao-entrada">
            <MenuCards onNavegar={setAbaAtiva} isAdmin={isAdmin} />
            <InstallAppCard />
            <BotaoPush />
            <h3 className="text-xl font-black uppercase tracking-tighter mb-6 text-white/90 ml-1">
              Próximas Aulas <span className="text-sm text-[#ef3340] ml-2">({dataFormatada})</span>
            </h3>
            {turmasDoDia?.map((turma) => (
              <TurmaCard key={turma.id} turma={turma} presencasTurma={presencasDb.filter(p => p.turma_id === turma.id)} session={session} alunoDb={alunoDb} turmaIdClicada={turmaIdClicada} acaoClicada={acaoClicada} onAlternarPresenca={alternarPresenca} alunoJaMarcouAlguma={alunoJaMarcouAlguma} isHoje={isHoje} />
            ))}
          </div>
        )}

        {abaAtiva === 'mensalidade' && (
          <MensalidadeView onVoltar={() => setAbaAtiva('arena')} alunoDb={alunoDb} />
        )}

        {(abaAtiva === 'uniformes' || abaAtiva === 'perfil') && (
          <div className="animacao-entrada text-center py-20">
            <h2 className="text-xl font-bold mb-4">Em Construção 🚧</h2>
            <button onClick={() => setAbaAtiva('arena')} className="text-sm font-bold uppercase tracking-widest text-[#ef3340] underline">Voltar para a Arena</button>
          </div>
        )}

        {abaAtiva === 'admin' && isAdmin && (
          <div className="animacao-entrada pb-20"> 
            {viewAdmin === 'menu' ? (
              <div>
                <div className="flex items-center justify-between mb-8">
                   <h2 className="text-2xl font-black uppercase italic tracking-tighter text-[#ef3340]">Gestão HECTH</h2>
                   <button onClick={() => setAbaAtiva('arena')} className="text-[10px] font-black uppercase text-white/30">Sair</button>
                </div>
                
                <div className="grid grid-cols-2 gap-3">
                  <button 
                    onClick={() => setViewAdmin('alunos')}
                    className="bg-[#121212] border border-white/5 rounded-3xl p-6 flex flex-col items-start gap-4 transition-all active:scale-95 text-left group hover:border-[#ef3340]/30"
                  >
                    <div className="w-12 h-12 rounded-2xl bg-blue-500/10 flex items-center justify-center text-blue-400 group-hover:bg-blue-500/20 transition-colors">
                      <svg xmlns="http://www.w3.org/2000/svg" width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round">
                        <path d="M16 21v-2a4 4 0 0 0-4-4H6a4 4 0 0 0-4 4v2"/><circle cx="9" cy="7" r="4"/><path d="M22 21v-2a4 4 0 0 0-3-3.87"/><path d="M16 3.13a4 4 0 0 1 0 7.75"/>
                      </svg>
                    </div>
                    <div>
                      <span className="text-[10px] font-black uppercase tracking-widest text-white/30 block mb-1">Base de Dados</span>
                      <span className="font-black text-lg uppercase tracking-tighter text-white/90">Atletas</span>
                      <p className="text-[10px] text-white/40 leading-tight mt-1 font-medium">Gerenciar os 300 alunos</p>
                    </div>
                  </button>

                  <div className="border border-dashed border-white/10 rounded-3xl flex items-center justify-center bg-white/[0.01]">
                     <span className="text-[9px] font-black uppercase text-white/10 tracking-widest italic">Em breve...</span>
                  </div>
                </div>
              </div>
            ) : (
              <AdminAlunosView onVoltar={() => setViewAdmin('menu')} />
            )}
          </div>
        )}
      </main>
    </div>
  );
}