"use client";
import { useState, useEffect } from 'react';
import { supabase } from '../lib/supabase';

interface AdminNotificacoesViewProps {
  onVoltar: () => void;
}

export function AdminNotificacoesView({ onVoltar }: AdminNotificacoesViewProps) {
  const [alunos, setAlunos] = useState<any[]>([]);
  const [modelos, setModelos] = useState<any[]>([]);
  const [logs, setLogs] = useState<any[]>([]);
  
  // Form State
  const [alvo, setAlvo] = useState<'todos' | 'nivel' | 'individual'>('todos');
  const [nivelSelecionado, setNivelSelecionado] = useState('APRENDIZ');
  const [emailSelecionado, setEmailSelecionado] = useState('');
  const [titulo, setTitulo] = useState('');
  const [conteudo, setConteudo] = useState('');
  const [enviando, setEnviando] = useState(false);
  const [resultado, setResultado] = useState<string | null>(null);

  // Model Manager State
  const [novoModeloTitulo, setNovoModeloTitulo] = useState('');
  const [novoModeloConteudo, setNovoModeloConteudo] = useState('');
  const [criandoModelo, setCriandoModelo] = useState(false);

  // Automation State
  const [rodandoCron, setRodandoCron] = useState(false);
  const [diagInfo, setDiagInfo] = useState<string>('');

  function urlBase64ToUint8Array(base64String: string) {
    const padding = '='.repeat((4 - base64String.length % 4) % 4);
    const base64 = (base64String + padding).replace(/\-/g, '+').replace(/_/g, '/');
    const rawData = window.atob(base64);
    const outputArray = new Uint8Array(rawData.length);
    for (let i = 0; i < rawData.length; ++i) {
      outputArray[i] = rawData.charCodeAt(i);
    }
    return outputArray;
  }

  const testarRegistroLocal = async () => {
    setDiagInfo('Iniciando diagnóstico...');
    try {
      if (typeof window === 'undefined') return;
      if (!('Notification' in window)) {
        setDiagInfo('Erro: Notificações não suportadas pelo navegador');
        return;
      }
      
      setDiagInfo(prev => prev + `\n• Permissão atual: ${Notification.permission}`);
      
      if (!('serviceWorker' in navigator)) {
        setDiagInfo(prev => prev + '\nErro: Service Workers não suportados');
        return;
      }

      setDiagInfo(prev => prev + '\n• Registrando /sw.js...');
      const reg = await navigator.serviceWorker.register('/sw.js');
      setDiagInfo(prev => prev + '\n• Service Worker registrado com sucesso');

      setDiagInfo(prev => prev + '\n• Aguardando Service Worker ready...');
      await navigator.serviceWorker.ready;
      setDiagInfo(prev => prev + '\n• Service Worker pronto');

      setDiagInfo(prev => prev + '\n• Buscando chave VAPID pública de /api/push/public-key...');
      const keyRes = await fetch('/api/push/public-key');
      if (!keyRes.ok) {
        setDiagInfo(prev => prev + `\nErro: Falha na API de chave pública (Status ${keyRes.status})`);
        return;
      }
      const keyData = await keyRes.json();
      const publicVapidKey = keyData.publicKey;
      setDiagInfo(prev => prev + `\n• Chave pública recebida: ${publicVapidKey ? publicVapidKey.substring(0, 15) + '...' : 'INDISPONÍVEL'}`);

      if (!publicVapidKey) {
        setDiagInfo(prev => prev + '\nErro: Chave VAPID não configurada no servidor (.env / Vercel)');
        return;
      }

      setDiagInfo(prev => prev + '\n• Verificando e limpando inscrições antigas conflituosas...');
      let existingSub = await reg.pushManager.getSubscription();
      if (existingSub) {
        await existingSub.unsubscribe();
        setDiagInfo(prev => prev + '\n• Inscrição antiga removida');
      }

      setDiagInfo(prev => prev + '\n• Solicitando nova inscrição do Push Manager...');
      const subscription = await reg.pushManager.subscribe({
        userVisibleOnly: true,
        applicationServerKey: urlBase64ToUint8Array(publicVapidKey)
      });

      setDiagInfo(prev => prev + '\n• Inscrição gerada com sucesso pelo navegador');

      setDiagInfo(prev => prev + '\n• Enviando inscrição para /api/push/register...');
      const { data: { user } } = await supabase.auth.getUser();
      const emailObj = user?.email;
      if (!emailObj) {
        setDiagInfo(prev => prev + '\nErro: Usuário não logado na sessão');
        return;
      }

      const registerRes = await fetch('/api/push/register', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ email: emailObj, subscription })
      });

      if (!registerRes.ok) {
        setDiagInfo(prev => prev + `\nErro: Servidor rejeitou registro (Status ${registerRes.status})`);
        return;
      }

      setDiagInfo(prev => prev + '\n\n✅ DISPOSITIVO REGISTRADO COM SUCESSO NO BANCO!');
      carregarDados();
    } catch (err: any) {
      setDiagInfo(prev => prev + `\n❌ ERRO CRÍTICO: ${err.message}`);
    }
  };

  useEffect(() => {
    carregarDados();
  }, []);


  const carregarDados = async () => {
    try {
      // 1. Alunos aprovados para o dropdown individual
      const { data: aData } = await supabase
        .from('alunos')
        .select('email, nome, sobrenome, nivel')
        .eq('status', 'aprovado')
        .order('nome', { ascending: true });
      if (aData) {
        setAlunos(aData);
        if (aData.length > 0) setEmailSelecionado(aData[0].email);
      }

      // 2. Modelos prontos
      const { data: mData } = await supabase
        .from('notificacoes_modelos')
        .select('*')
        .order('created_at', { ascending: false });
      if (mData) setModelos(mData);

      // 3. Logs de envio
      const { data: lData } = await supabase
        .from('notificacoes_logs')
        .select('*')
        .order('enviado_em', { ascending: false })
        .limit(20);
      if (lData) setLogs(lData);
    } catch (e: any) {
      console.error('Erro ao carregar dados:', e.message);
    }
  };

  const criarModelo = async () => {
    if (!novoModeloTitulo || !novoModeloConteudo) return alert('Preencha título e conteúdo do modelo.');
    setCriandoModelo(true);
    try {
      const { data, error } = await supabase
        .from('notificacoes_modelos')
        .insert({
          titulo: novoModeloTitulo,
          conteudo: novoModeloConteudo
        })
        .select()
        .single();
      
      if (error) throw error;
      if (data) setModelos([data, ...modelos]);
      
      setNovoModeloTitulo('');
      setNovoModeloConteudo('');
      alert('Modelo de notificação criado com sucesso!');
    } catch (e: any) {
      alert('Erro ao criar modelo: ' + e.message);
    } finally {
      setCriandoModelo(false);
    }
  };

  const deletarModelo = async (id: number) => {
    const confirmar = window.confirm('Deseja realmente apagar este modelo?');
    if (!confirmar) return;
    try {
      const { error } = await supabase
        .from('notificacoes_modelos')
        .delete()
        .eq('id', id);
      if (error) throw error;
      setModelos(modelos.filter(m => m.id !== id));
    } catch (e: any) {
      alert('Erro ao apagar modelo: ' + e.message);
    }
  };

  const carregarModeloNoForm = (modelo: any) => {
    setTitulo(modelo.titulo);
    setConteudo(modelo.conteudo);
    alert(`Modelo "${modelo.titulo}" carregado no formulário!`);
  };

  const dispararPush = async () => {
    if (!titulo || !conteudo) return alert('Preencha o título e o conteúdo da mensagem.');
    
    // Filtra e-mails de destino
    let alvosEmails: string[] = [];
    if (alvo === 'todos') {
      alvosEmails = alunos.map(a => a.email);
    } else if (alvo === 'nivel') {
      alvosEmails = alunos.filter(a => String(a.nivel || '').toUpperCase() === nivelSelecionado.toUpperCase()).map(a => a.email);
    } else {
      alvosEmails = [emailSelecionado];
    }

    if (alvosEmails.length === 0) {
      return alert('Nenhum aluno encontrado para os critérios selecionados.');
    }

    const confirmar = window.confirm(`Deseja disparar esta notificação para ${alvosEmails.length} atleta(s)?`);
    if (!confirmar) return;

    setEnviando(true);
    setResultado(null);
    try {
      const res = await fetch('/api/push/send', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          emails: alvosEmails,
          titulo,
          conteudo,
          salvamentoManual: true
        })
      });

      const data = await res.json();
      if (!res.ok) throw new Error(data.error || 'Erro no envio');

      setResultado(`Sucesso: ${data.sentCount || 0} enviados. Falhas: ${data.failedCount || 0}.`);
      setTitulo('');
      setConteudo('');
      carregarDados();
    } catch (e: any) {
      setResultado('Falha ao enviar: ' + e.message);
    } finally {
      setEnviando(false);
    }
  };

  const executarCronManualmente = async () => {
    setRodandoCron(true);
    try {
      const res = await fetch('/api/push/cron', { method: 'POST' });
      const data = await res.json();
      if (!res.ok) throw new Error(data.error || 'Erro ao processar');
      alert(`Automático rodado com sucesso! ${data.count || 0} novas notificações automáticas disparadas.`);
      carregarDados();
    } catch (e: any) {
      alert('Erro nas regras automáticas: ' + e.message);
    } finally {
      setRodandoCron(false);
    }
  };

  return (
    <div className="animacao-entrada w-full pb-20 pt-4 max-w-lg mx-auto">
      {/* Header */}
      <div className="flex items-center gap-4 mb-8 px-5">
        <button onClick={onVoltar} className="p-3 bg-white/5 rounded-full text-white/50 active:scale-95 transition-transform">
          <svg xmlns="http://www.w3.org/2000/svg" width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="3" strokeLinecap="round" strokeLinejoin="round"><path d="m15 18-6-6 6-6"/></svg>
        </button>
        <h2 className="text-2xl font-black uppercase italic tracking-tighter text-white">Central Push</h2>
      </div>

      <div className="px-5 flex flex-col gap-6">
        
        {/* Bloco 1: Envio de Notificação */}
        <div className="bg-[#121212] border border-white/5 rounded-3xl p-6">
          <h3 className="text-sm font-black uppercase tracking-wider text-white mb-4 italic">Disparar Notificação</h3>
          
          <div className="flex flex-col gap-4">
            <div>
              <label className="text-[9px] font-black uppercase tracking-widest text-white/40 mb-1.5 block">Enviar Para</label>
              <div className="grid grid-cols-3 gap-2">
                {(['todos', 'nivel', 'individual'] as const).map(tipo => (
                  <button
                    key={tipo}
                    type="button"
                    onClick={() => setAlvo(tipo)}
                    className={`py-2 px-1 rounded-xl text-[9px] font-black uppercase tracking-wider transition-all border ${alvo === tipo ? 'bg-[#ef3340] text-white border-transparent' : 'bg-white/5 text-white/40 border-white/5'}`}
                  >
                    {tipo === 'todos' ? 'Todos' : tipo === 'nivel' ? 'Nível' : 'Individual'}
                  </button>
                ))}
              </div>
            </div>

            {alvo === 'nivel' && (
              <div>
                <label className="text-[9px] font-black uppercase tracking-widest text-white/40 mb-1 block">Nível do Aluno</label>
                <select
                  value={nivelSelecionado}
                  onChange={(e) => setNivelSelecionado(e.target.value)}
                  className="w-full bg-[#1a1a1a] border border-white/10 rounded-xl px-4 py-3 text-white outline-none focus:ring-1 focus:ring-[#ef3340] text-xs font-bold uppercase"
                >
                  <option value="APRENDIZ">Aprendiz</option>
                  <option value="INICIANTE">Iniciante</option>
                  <option value="INICIANTE AVANÇADO">Iniciante Avançado</option>
                  <option value="INTERMEDIÁRIO">Intermediário</option>
                  <option value="PROFESSOR">Professor</option>
                </select>
              </div>
            )}

            {alvo === 'individual' && (
              <div>
                <label className="text-[9px] font-black uppercase tracking-widest text-white/40 mb-1 block">Selecionar Atleta</label>
                <select
                  value={emailSelecionado}
                  onChange={(e) => setEmailSelecionado(e.target.value)}
                  className="w-full bg-[#1a1a1a] border border-white/10 rounded-xl px-4 py-3 text-white outline-none focus:ring-1 focus:ring-[#ef3340] text-xs font-bold"
                >
                  {alunos.map(a => (
                    <option key={a.email} value={a.email}>
                      {a.nome} {a.sobrenome} ({a.email})
                    </option>
                  ))}
                </select>
              </div>
            )}

            <div>
              <label className="text-[9px] font-black uppercase tracking-widest text-white/40 mb-1 block">Título da Notificação</label>
              <input
                type="text"
                placeholder="Ex: Aula das 18h cancelada hoje!"
                value={titulo}
                onChange={(e) => setTitulo(e.target.value)}
                className="w-full bg-[#1a1a1a] border border-white/10 rounded-xl px-4 py-3 text-white outline-none focus:ring-1 focus:ring-[#ef3340] text-xs font-bold"
              />
            </div>

            <div>
              <label className="text-[9px] font-black uppercase tracking-widest text-white/40 mb-1 block">Conteúdo (Mensagem)</label>
              <textarea
                rows={3}
                placeholder="Ex: Devido à chuva forte, a aula das 18h foi cancelada por segurança de todos."
                value={conteudo}
                onChange={(e) => setConteudo(e.target.value)}
                className="w-full bg-[#1a1a1a] border border-white/10 rounded-xl px-4 py-3 text-white outline-none focus:ring-1 focus:ring-[#ef3340] text-xs font-bold resize-none"
              />
            </div>

            <button
              onClick={dispararPush}
              disabled={enviando}
              className="w-full bg-[#ef3340] text-white text-[10px] font-black uppercase tracking-widest py-4 rounded-xl active:scale-95 transition-all shadow-[0_0_15px_rgba(239,51,64,0.3)] disabled:opacity-50 mt-2"
            >
              {enviando ? 'Disparando push...' : 'Disparar Agora'}
            </button>

            {resultado && (
              <p className="text-[10px] text-center text-green-400 font-bold uppercase tracking-wider mt-2 border border-green-500/20 bg-green-500/5 py-2.5 rounded-lg">
                {resultado}
              </p>
            )}
          </div>
        </div>

        {/* Bloco 2: Modelos / Mensagens Prontas */}
        <div className="bg-[#121212] border border-white/5 rounded-3xl p-6">
          <h3 className="text-sm font-black uppercase tracking-wider text-white mb-4 italic">Modelos Pré-Salvos</h3>
          
          {/* Criar novo modelo */}
          <div className="flex flex-col gap-3 mb-6 p-4 rounded-2xl border border-white/5 bg-white/5">
            <span className="text-[9px] font-black uppercase tracking-widest text-white/40">Criar Novo Modelo</span>
            <input
              type="text"
              placeholder="Título do Modelo (Ex: Lembrete Mensalidade)"
              value={novoModeloTitulo}
              onChange={(e) => setNovoModeloTitulo(e.target.value)}
              className="w-full bg-[#1a1a1a] border border-white/10 rounded-xl px-3 py-2.5 text-xs text-white outline-none focus:ring-1 focus:ring-[#ef3340] font-bold"
            />
            <textarea
              rows={2}
              placeholder="Mensagem pronta..."
              value={novoModeloConteudo}
              onChange={(e) => setNovoModeloConteudo(e.target.value)}
              className="w-full bg-[#1a1a1a] border border-white/10 rounded-xl px-3 py-2.5 text-xs text-white outline-none focus:ring-1 focus:ring-[#ef3340] font-bold resize-none"
            />
            <button
              onClick={criarModelo}
              disabled={criandoModelo}
              className="w-full bg-white text-black text-[9px] font-black uppercase tracking-wider py-2.5 rounded-lg active:scale-95 transition-all"
            >
              {criandoModelo ? 'Salvando...' : 'Salvar Modelo'}
            </button>
          </div>

          {/* Lista de Modelos */}
          <div className="flex flex-col gap-3 max-h-60 overflow-y-auto pr-1">
            {modelos.length === 0 ? (
              <p className="text-[10px] text-white/30 uppercase font-black tracking-widest italic text-center py-4">Nenhum modelo salvo</p>
            ) : (
              modelos.map(m => (
                <div key={m.id} className="border border-white/5 bg-white/5 rounded-2xl p-3 flex justify-between items-start gap-4">
                  <div className="flex-1 cursor-pointer group" onClick={() => carregarModeloNoForm(m)}>
                    <h4 className="text-white text-xs font-black uppercase tracking-wide group-hover:text-[#ef3340] transition-colors">{m.titulo}</h4>
                    <p className="text-white/50 text-[10px] font-medium leading-relaxed mt-1">{m.conteudo}</p>
                  </div>
                  <button
                    onClick={() => deletarModelo(m.id)}
                    className="text-red-500/60 hover:text-red-500 text-xs p-1"
                  >
                    🗑️
                  </button>
                </div>
              ))
            )}
          </div>
        </div>

        {/* Bloco 3: Regras Automáticas e Verificação */}
        <div className="bg-[#121212] border border-white/5 rounded-3xl p-6">
          <h3 className="text-sm font-black uppercase tracking-wider text-white mb-2 italic">Regras Automáticas</h3>
          <p className="text-white/40 text-[9px] uppercase font-bold tracking-wider leading-relaxed mb-4">
            O sistema faz duas verificações automáticas gratuitas de push:<br/>
            • <strong>5 dias sem ir pro treino:</strong> Avisa alunos inativos.<br/>
            • <strong>1 dia antes do plano acabar:</strong> Lembra da mensalidade.
          </p>

          <button
            onClick={executarCronManualmente}
            disabled={rodandoCron}
            className="w-full bg-white/5 border border-white/10 hover:bg-white/10 text-white text-[9px] font-black uppercase tracking-widest py-3 rounded-xl active:scale-95 transition-all mb-6"
          >
            {rodandoCron ? 'Executando verificação...' : 'Rodar Verificação de Regras Agora'}
          </button>

          {/* Histórico Recente */}
          <h4 className="text-[9px] font-black uppercase tracking-widest text-white/40 mb-3 block">Histórico de Envios Recentes</h4>
          <div className="flex flex-col gap-2 max-h-48 overflow-y-auto pr-1">
            {logs.length === 0 ? (
              <p className="text-[9px] text-white/30 uppercase font-black tracking-widest italic text-center py-4">Nenhum log de disparo recente</p>
            ) : (
              logs.map(log => (
                <div key={log.id} className="border-b border-white/5 pb-2 text-left">
                  <div className="flex justify-between items-center text-[8px] font-black uppercase tracking-wide">
                    <span className={log.tipo === 'manual' ? 'text-[#ef3340]' : 'text-blue-400'}>{log.tipo}</span>
                    <span className="text-white/30">{new Date(log.enviado_em).toLocaleDateString('pt-BR')} {new Date(log.enviado_em).toLocaleTimeString('pt-BR', { hour: '2-digit', minute: '2-digit' })}</span>
                  </div>
                  <span className="block text-[10px] text-white/80 font-bold mt-0.5">{log.aluno_email}</span>
                  <span className="block text-[9px] text-white/40 italic mt-0.5">"{log.titulo}": {log.conteudo}</span>
                </div>
              ))
            )}
          </div>
        </div>

        {/* Bloco 4: Diagnóstico de Dispositivo */}
        <div className="bg-[#121212] border border-white/5 rounded-3xl p-6">
          <h3 className="text-sm font-black uppercase tracking-wider text-white mb-2 italic">Diagnóstico e Teste de Push</h3>
          <p className="text-white/40 text-[9px] uppercase font-bold tracking-wider leading-relaxed mb-4">
            Use este painel para registrar manualmente o seu próprio computador/celular de teste e diagnosticar possíveis erros.
          </p>

          <button
            onClick={testarRegistroLocal}
            className="w-full bg-blue-600 hover:bg-blue-700 text-white text-[9px] font-black uppercase tracking-widest py-3 rounded-xl active:scale-95 transition-all mb-4"
          >
            Diagnosticar e Registrar Meu Aparelho
          </button>

          {diagInfo && (
            <pre className="text-[10px] text-white/70 font-mono bg-black border border-white/10 p-4 rounded-xl overflow-x-auto text-left whitespace-pre-wrap">
              {diagInfo}
            </pre>
          )}
        </div>

      </div>
    </div>
  );
}

