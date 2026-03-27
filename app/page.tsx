"use client";

import { useState, useEffect } from 'react';
import { createClient } from '@supabase/supabase-js';

const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL!;
const supabaseKey = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!;
const supabase = createClient(supabaseUrl, supabaseKey);

// ==========================================
// ESTILOS CSS (Animações de Entrada/Saída)
// ==========================================
const estilosGlobais = `
  @keyframes entradaCaindo {
    0% { transform: translateY(-30px) scale(0.7); opacity: 0; }
    100% { transform: translateY(0) scale(1); opacity: 1; }
  }
  @keyframes saidaEscorregando {
    0% { transform: translateY(0); opacity: 1; }
    100% { transform: translateY(30px); opacity: 0; }
  }
  .animacao-entrada {
    animation: entradaCaindo 0.4s cubic-bezier(0.1, 0.9, 0.2, 1) forwards;
  }
  .animacao-saida {
    animation: saidaEscorregando 0.4s cubic-bezier(0.1, 0.9, 0.2, 1) forwards;
  }
`;

// ==========================================
// SISTEMA MIKASA (Explosão de bolas)
// ==========================================
const lancarBolasMikasa = (e: React.MouseEvent<HTMLButtonElement>) => {
  const container = document.body;
  const numBolas = 15;
  const duracao = 1800;
  const originX = e.clientX;
  const originY = e.clientY;

  for (let i = 0; i < numBolas; i++) {
    const ball = document.createElement('img');
    ball.src = '/mikasa-ball.png';
    ball.className = 'fixed pointer-events-none opacity-0 z-50';
    const size = Math.random() * 15 + 15;
    ball.style.width = `${size}px`;
    ball.style.height = `${size}px`;
    ball.style.left = `${originX}px`;
    ball.style.top = `${originY}px`;
    ball.style.transform = 'translate(-50%, -50%) scale(0.1) rotate(0deg)';
    container.appendChild(ball);

    ball.style.transition = `all ${duracao}ms cubic-bezier(0.1, 0.8, 0.3, 1)`;

    requestAnimationFrame(() => {
      requestAnimationFrame(() => {
        const angle = Math.random() * 2 * Math.PI;
        const velocity = Math.random() * 300 + 200;
        const destX = originX + Math.cos(angle) * velocity;
        const destY = originY + Math.sin(angle) * velocity - 80;
        const rotation = Math.random() * 1080 - 540;
        ball.style.left = `${destX}px`;
        ball.style.top = `${destY}px`;
        ball.style.opacity = '1';
        ball.style.transform = `translate(-50%, -50%) scale(1.2) rotate(${rotation}deg)`;
        setTimeout(() => {
          ball.style.opacity = '0';
          ball.style.transform += ' scale(0.8)';
        }, duracao * 0.7);
      });
    });
    setTimeout(() => ball.remove(), duracao);
  }
};

export default function Home() {
  const [mounted, setMounted] = useState(false);
  const [session, setSession] = useState<any>(null);
  const [alunoDb, setAlunoDb] = useState<any>(null);
  const [telaAtiva, setTelaAtiva] = useState<'inicio' | 'login' | 'cadastro'>('inicio');
  const [loading, setLoading] = useState(false);

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

    // ==========================================
    // A MÁGICA DO TEMPO REAL AQUI!
    // ==========================================
    const canalRealtime = supabase.channel('atualizacoes_arena')
      .on('postgres_changes', { event: '*', schema: 'public', table: 'presencas' }, () => {
        carregarArena(); // Se alguém marcar/desmarcar, atualiza a tela
      })
      .on('postgres_changes', { event: '*', schema: 'public', table: 'turmas' }, () => {
        carregarArena(); // Se a vaga mudar, atualiza a tela
      })
      .subscribe();

    return () => {
      subscription.unsubscribe();
      supabase.removeChannel(canalRealtime); // Limpa o canal ao sair
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
        // Atualiza a tela instantaneamente (otimista)
        setTurmas(turmas.map(t => t.id === turmaId ? { ...t, vagas_ocupadas: t.vagas_ocupadas - 1 } : t));
        setPresencasDb(prev => prev.filter(p => !(p.turma_id === turmaId && p.aluno_email === session.user.email)));
        
        // Salva no Supabase
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

      // Atualiza a tela instantaneamente (otimista)
      setTurmas(turmas.map(t => t.id === turmaId ? { ...t, vagas_ocupadas: t.vagas_ocupadas + 1 } : t));
      setPresencasDb(prev => [...prev, novaPresenca]);
      
      // Salva no Supabase
      await supabase.from('presencas').insert([novaPresenca]);
      await supabase.from('turmas').update({ vagas_ocupadas: vagasAtuais + 1 }).eq('id', turmaId);
      
      setTimeout(() => { setTurmaIdClicada(null); setAcaoClicada(null); }, 400);
    }
  };

  if (!mounted) return null;

  if (session && !alunoDb) {
    return (
      <div className="min-h-screen bg-black flex items-center justify-center">
        <p className="text-white/50 font-bold animate-pulse tracking-widest uppercase text-sm">Carregando a arena...</p>
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

  return (
    <div className="min-h-screen bg-black font-sans pb-10 text-white">
      <style>{estilosGlobais}</style>
      
      <header className="bg-[#ef3340] px-5 py-4 shadow-xl flex justify-between items-center mb-6 sticky top-0 z-40 border-b border-white/10">
        <img src="/hecth-logo.svg" alt="HECTH." className="h-9 w-auto"/>
        <div className="flex items-center gap-3">
          <div className="flex flex-col items-end">
            <span className="text-sm font-bold leading-none">Olá, {alunoDb?.nome}</span>
            <button onClick={fazerLogout} className="text-[10px] font-black uppercase tracking-widest opacity-60 hover:opacity-100 mt-1 transition-opacity">Sair</button>
          </div>
          <div className="w-10 h-10 rounded-full border-2 border-white shadow-lg overflow-hidden bg-white flex items-center justify-center">
            {alunoDb?.foto_url ? <img src={alunoDb.foto_url} className="w-full h-full object-cover" /> : <span className="text-red-600 font-bold">{alunoDb?.nome?.charAt(0)}</span>}
          </div>
        </div>
      </header>

      <main className="px-5">
        <h3 className="text-xl font-black uppercase tracking-tighter mb-6 text-white/90 ml-1">Próximas Aulas</h3>
        {turmas?.map((turma) => {
          const presencasTurma = presencasDb.filter(p => p.turma_id === turma.id);
          const jaMarcou = presencasTurma.some(p => p.aluno_email === session?.user?.email);
          const outrasFotos = presencasTurma.filter(p => p.aluno_email !== session?.user?.email);
          
          const lotou = turma.vagas_ocupadas >= turma.vagas_totais;
          const sumindo = turmaIdClicada === turma.id && acaoClicada === 'desmarcar';
          const surgindo = turmaIdClicada === turma.id && acaoClicada === 'marcar';

          return (
            <div key={turma.id} className="bg-[#121212] rounded-3xl p-6 border border-white/5 mb-5 shadow-lg relative">
              <div className="flex justify-between items-start mb-6">
                <div>
                  <span className="bg-green-500/10 text-green-400 text-[10px] font-black uppercase tracking-widest px-2 py-1 rounded-md border border-green-500/20">{turma.nivel}</span>
                  <h4 className="text-xl font-bold mt-3 text-white">{turma.nome}</h4>
                  <p className="text-white/40 text-xs font-medium uppercase tracking-wider">{turma.professor}</p>
                </div>
                <div className="text-right">
                    <span className="text-3xl font-black tracking-tighter text-white">{turma.horario}</span>
                    <span className="block text-[9px] font-black text-white/30 uppercase">Duração 1h30</span>
                </div>
              </div>

              <div className="flex justify-between items-center border-t border-white/5 pt-5">
                <div className="flex -space-x-3 items-center">
                  
                  {outrasFotos.map((p, idx) => (
                    <div key={p.aluno_email} style={{ zIndex: 10 + idx }} className="w-9 h-9 rounded-full border-2 border-[#121212] shadow-xl overflow-hidden bg-gray-600 flex items-center justify-center">
                      {p.foto_url ? <img src={p.foto_url} className="w-full h-full object-cover" /> : <span className="text-white font-bold text-xs">{p.inicial}</span>}
                    </div>
                  ))}

                  {(jaMarcou || sumindo) && (
                    <div style={{ zIndex: 50 }} className={`w-10 h-10 rounded-full border-2 border-white shadow-xl overflow-hidden bg-red-600 flex items-center justify-center ${sumindo ? 'animacao-saida' : surgindo ? 'animacao-entrada' : ''}`}>
                      {alunoDb?.foto_url ? <img src={alunoDb.foto_url} className="w-full h-full object-cover" /> : <span className="text-white font-bold text-xs">{alunoDb?.nome?.charAt(0)}</span>}
                    </div>
                  )}
                </div>
                <div className="text-right">
                  <span className="text-white/30 text-[10px] font-black uppercase block">Vagas</span>
                  <span className="text-white font-black text-xl tracking-tight"><span className="text-[#ef3340]">{turma.vagas_ocupadas}</span>/{turma.vagas_totais}</span>
                </div>
              </div>

              <button 
                onClick={(e) => alternarPresenca(e, turma.id, turma.vagas_ocupadas, turma.vagas_totais, jaMarcou)}
                disabled={!jaMarcou && lotou}
                className={`w-full py-4 rounded-2xl font-black uppercase tracking-widest text-xs mt-6 transition-all active:scale-95 group relative overflow-hidden ${jaMarcou ? 'bg-green-600 text-white hover:bg-red-600' : lotou ? 'bg-white/5 text-white/20' : 'bg-white text-black hover:bg-gray-200'}`}
              >
                {jaMarcou ? <><span className="group-hover:hidden">Confirmado</span><span className="hidden group-hover:block">Cancelar</span></> : lotou ? 'Turma Lotada' : 'Marcar Presença'}
              </button>
            </div>
          );
        })}
      </main>
    </div>
  );
}