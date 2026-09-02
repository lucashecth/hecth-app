"use client";

import { useState, useEffect, useRef } from 'react';

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
import { PerfilView } from '../components/PerfilView';
import { TurmaAlunosView } from '../components/TurmaAlunosView';
import { AdminPagamentosView } from '../components/AdminPagamentosView';
import { AdminAprovarView } from '../components/AdminAprovarView';
import { UniformesView } from '../components/UniformesView';
import { AdminCriarAlunoView } from '../components/AdminCriarAlunoView';
import { FotoObrigatoriaView } from '../components/FotoObrigatoriaView';
import { QrCodeModal } from '../components/QrCodeModal';
import { PixQrCodeModal } from '../components/PixQrCodeModal';
import { ChatAlunoView } from '../components/ChatAlunoView';
import { ChatAdminView } from '../components/ChatAdminView';
import { AdminTurmasView } from '../components/AdminTurmasView';
import { RewardsView } from '../components/RewardsView';
import { AdminDeletarAlunoView } from '../components/AdminDeletarAlunoView';
import { AdminNotificacoesView } from '../components/AdminNotificacoesView';
import { QrCodeBaixarModal } from '../components/QrCodeBaixarModal';
import { AdminPrecosView } from '../components/AdminPrecosView';
import { AvulsoView } from '../components/AvulsoView';
import { AdminExperimentalView } from '../components/AdminExperimentalView';
import { AdminFaixasView } from '../components/AdminFaixasView';




import { obterStatusMensalidade } from '../utils/mensalidade';

import { comprimirImagem, fileToBase64 } from '../utils/imagem';
import { enviarParaGoogleSheets } from '../utils/googleSheets';








export default function Home() {
  const [mounted, setMounted] = useState(false);
  const [session, setSession] = useState<any>(null);
  const [alunoDb, setAlunoDb] = useState<any>(null);
  const [perfilNaoEncontrado, setPerfilNaoEncontrado] = useState(false);
  const [telaAtiva, setTelaAtiva] = useState<'inicio' | 'login' | 'cadastro'>('inicio');
  const [loading, setLoading] = useState(false);
  const [completandoPerfil, setCompletandoPerfil] = useState(false);

  const [selfNome, setSelfNome] = useState('');
  const [selfSobrenome, setSelfSobrenome] = useState('');
  const [selfDataNascimento, setSelfDataNascimento] = useState('');
  const [selfFoto, setSelfFoto] = useState<File | null>(null);


  
  const [abaAtiva, setAbaAtiva] = useState<'arena' | 'mensalidade' | 'uniformes' | 'perfil' | 'admin' | 'turma_alunos' | 'mensagens' | 'rewards' | 'avulso'>('arena');

  const [temNovoPagamento, setTemNovoPagamento] = useState(false);
  const [totalMensagensNaoLidas, setTotalMensagensNaoLidas] = useState(0);
  const [totalPagamentosPendentes, setTotalPagamentosPendentes] = useState(0);
  const [totalCadastrosPendentes, setTotalCadastrosPendentes] = useState(0);


  const { isAdmin } = useAdmin();
  const [viewAdmin, setViewAdmin] = useState<'menu' | 'alunos'| 'pagamentos' | 'aprovar' | 'criar' | 'mensagens' | 'turmas' | 'deletar_aluno' | 'notificacoes' | 'precos' | 'experimental' | 'faixas'>('menu');




  const [showQrCodeModal, setShowQrCodeModal] = useState(false);
  const [showQrCodeBaixarModal, setShowQrCodeBaixarModal] = useState(false);
  const excelInputRef = useRef<HTMLInputElement>(null);
  const pushSyncedRef = useRef(false);





  const [pixModalTipo, setPixModalTipo] = useState<'uniformes' | 'mensalidade' | null>(null);
  const [turmaDetalhe, setTurmaDetalhe] = useState<any>(null);
  
  const [email, setEmail] = useState('');
  const [senha, setSenha] = useState('');
  const [modalRedefinirSenha, setModalRedefinirSenha] = useState(false);
  const [novaSenha, setNovaSenha] = useState('');
  const [confirmNovaSenha, setConfirmNovaSenha] = useState('');
  const [salvandoNovaSenha, setSalvandoNovaSenha] = useState(false);
  const [modalEsqueciSenha, setModalEsqueciSenha] = useState(false);
  const [emailRecuperacao, setEmailRecuperacao] = useState('');
  const [enviandoRecuperacao, setEnviandoRecuperacao] = useState(false);
  const [dataNascimento, setDataNascimento] = useState('');
  const [dataNascimentoPrimeiroLogin, setDataNascimentoPrimeiroLogin] = useState('');
  const [nome, setNome] = useState('');

  const [sobrenome, setSobrenome] = useState('');
  const [foto, setFoto] = useState<File | null>(null);
  const [aniversariantesHoje, setAniversariantesHoje] = useState<any[]>([]);
  const [showAniversariantesModal, setShowAniversariantesModal] = useState(false);


  const [turmas, setTurmas] = useState<any[]>([]);
  const [presencasDb, setPresencasDb] = useState<any[]>([]);
  const [turmaIdClicada, setTurmaIdClicada] = useState<number | null>(null);
  const [acaoClicada, setAcaoClicada] = useState<'marcar' | 'desmarcar' | null>(null);

  useEffect(() => {
    setMounted(true);
    
    // 1. Checa se o link do email veio com token/code de recuperação na URL (hash # ou query ?)
    if (typeof window !== 'undefined') {
      const hash = window.location.hash || '';
      const search = window.location.search || '';
      const urlParams = new URLSearchParams(search);
      const hashParams = new URLSearchParams(hash.replace('#', ''));
      
      const code = urlParams.get('code') || hashParams.get('code');
      const type = urlParams.get('type') || hashParams.get('type');
      const token = urlParams.get('token') || hashParams.get('token');

      if (type === 'recovery' || hash.includes('type=recovery') || search.includes('type=recovery') || token) {
        setModalRedefinirSenha(true);
      }

      // Se o Supabase usou o fluxo PKCE com 'code'
      if (code) {
        // Limpa a URL imediatamente para não quebrar o router do navegador
        if (window.history && window.history.replaceState) {
          window.history.replaceState(null, '', window.location.pathname);
        }
        supabase.auth.exchangeCodeForSession(code).then(({ data, error }) => {
          if (!error && data?.session) {
            setSession(data.session);
            carregarPerfil(data.session.user.email);
            setModalRedefinirSenha(true);
          }
        }).catch((e) => {
          console.error("Erro no exchangeCode:", e);
        });
      } else if (hash.includes('access_token')) {
        // Limpa a hash da URL
        if (window.history && window.history.replaceState) {
          window.history.replaceState(null, '', window.location.pathname);
        }
      }
    }


    supabase.auth.getSession().then(({ data: { session } }) => {
      setSession(session);
      if (session) carregarPerfil(session.user.email);
    });

    const { data: { subscription } } = supabase.auth.onAuthStateChange((event, newSession) => {
      setSession(newSession);
      if (event === 'PASSWORD_RECOVERY' || event === 'USER_UPDATED') {
        if (event === 'PASSWORD_RECOVERY') setModalRedefinirSenha(true);
      }
      if (newSession) {
        carregarPerfil(newSession.user.email);
      } else {
        setAlunoDb(null);
      }
    });




    carregarArena();

    // 3. Listener Realtime para a Arena (Presenças e Turmas)
    const arenaChannel = supabase
      .channel('realtime-arena')
      .on('postgres_changes', { event: '*', schema: 'public', table: 'presencas' }, () => {
        carregarArena();
      })
      .subscribe();

    return () => {
      subscription.unsubscribe();
      supabase.removeChannel(arenaChannel);
    };
  }, []);





  // Recarrega as notificacoes sempre que o usuario mudar de aba ou de tela de gestao
  useEffect(() => {
    carregarNotificacoes();
  }, [viewAdmin, abaAtiva]);

  // Sincroniza inscrição de push nativo em background se já houver permissão
  useEffect(() => {
    if (session?.user?.email && typeof window !== 'undefined' && 'serviceWorker' in navigator) {
      if (pushSyncedRef.current) return;
      pushSyncedRef.current = true;


      if (Notification.permission === 'granted') {
        navigator.serviceWorker.register('/sw.js').then(async (reg) => {
          try {
            const keyRes = await fetch('/api/push/public-key');
            const keyData = await keyRes.json();
            const publicVapidKey = keyData.publicKey;
            if (publicVapidKey) {
              let subscription = await reg.pushManager.getSubscription();
              
              if (!subscription) {
                try {
                  subscription = await reg.pushManager.subscribe({
                    userVisibleOnly: true,
                    applicationServerKey: urlBase64ToUint8Array(publicVapidKey)
                  });
                } catch (subErr: any) {
                  // Se houver incompatibilidade de chave, limpa e subscreve de novo
                  const existingSub = await reg.pushManager.getSubscription();
                  if (existingSub) {
                    await existingSub.unsubscribe();
                  }
                  subscription = await reg.pushManager.subscribe({
                    userVisibleOnly: true,
                    applicationServerKey: urlBase64ToUint8Array(publicVapidKey)
                  });
                }
              }

              if (subscription) {
                await fetch('/api/push/register', {
                  method: 'POST',
                  headers: { 'Content-Type': 'application/json' },
                  body: JSON.stringify({ email: session.user.email, subscription })
                });
              }

            }
          } catch (err) {
            console.error('Erro ao atualizar inscrição push em background:', err);
          }
        });
      }
    }
  }, [session]);




  // Roda automações de push se for admin ao carregar a área de gestão
  useEffect(() => {
    if (isAdmin && viewAdmin === 'menu') {
      fetch('/api/push/cron', { method: 'POST' })
        .then(res => res.json())
        .then(data => console.log('Automação push executada:', data))
        .catch(err => console.error('Erro na automação push:', err));
    }
  }, [viewAdmin, isAdmin]);

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



  const arenaLoadingRef = useRef(false);
  const aniversariantesLoadedRef = useRef(false);
  const turmasCacheRef = useRef<any[] | null>(null);
  const alunosNiveisCacheRef = useRef<Map<string, string>>(new Map());


  const carregarArena = async () => {
    if (arenaLoadingRef.current) return;
    arenaLoadingRef.current = true;
    try {
      // 1. Carrega turmas (usa cache em memória se já tiver)
      if (!turmasCacheRef.current || turmasCacheRef.current.length === 0) {
        const resTurmas = await supabase.from('turmas').select('*').order('horario', { ascending: true });
        if (resTurmas.data) {
          turmasCacheRef.current = resTurmas.data;
          setTurmas(resTurmas.data);
        }
      } else {
        setTurmas(turmasCacheRef.current);
      }

      // 2. Carrega presenças e enriquece com nível
      const resPresencas = await supabase.from('presencas').select('*');
      const pData = resPresencas.data;
      if (pData && pData.length > 0) {
        // --- AUTO-LIMPEZA DO DIA ANTERIOR NA VIRADA ---
        // Calcula a data de corte: se agora passou das 20:30, a lista ativa é a de amanhã (corte hoje 20:30).
        // Presenças criadas antes do início do ciclo atual são limpas automaticamente.
        const agoraCheck = new Date();
        const inicioCiclo = new Date(agoraCheck);
        if (agoraCheck.getHours() > 20 || (agoraCheck.getHours() === 20 && agoraCheck.getMinutes() >= 30)) {
          // Virou para o dia seguinte: presenças criadas antes de hoje 20:30 pertencem ao dia anterior
          inicioCiclo.setHours(20, 30, 0, 0);
        } else {
          // Ainda no dia de hoje: presenças criadas antes de ontem 20:30 pertencem ao dia anterior
          inicioCiclo.setDate(inicioCiclo.getDate() - 1);
          inicioCiclo.setHours(20, 30, 0, 0);
        }

        const presencasAntigas = pData.filter((p: any) => {
          if (!p.created_at) return false;
          const dataCriacao = new Date(p.created_at);
          return dataCriacao < inicioCiclo;
        });

        if (presencasAntigas.length > 0) {
          // Limpa em background do banco de dados
          presencasAntigas.forEach((pa: any) => {
            supabase.from('presencas').delete().eq('id', pa.id).then();
          });
        }

        const presencasValidas = pData.filter((p: any) => {
          if (!p.created_at) return true;
          return new Date(p.created_at) >= inicioCiclo;
        });

        // Verifica se há e-mails sem nível no cache
        const emailsSemNivel = presencasValidas
          .map((p: any) => p.aluno_email)
          .filter((email: string) => email && !alunosNiveisCacheRef.current.has(email) && !email.startsWith('experimental_'));


        if (emailsSemNivel.length > 0) {
          const { data: novosNiveis } = await supabase
            .from('alunos')
            .select('email, nivel')
            .in('email', Array.from(new Set(emailsSemNivel)));

          if (novosNiveis) {
            novosNiveis.forEach((a: any) => {
              if (a.email && a.nivel) {
                alunosNiveisCacheRef.current.set(a.email, a.nivel);
              }
            });
          }
        }

        // Aplica o nível em cada presença válida
        const presencasComNivel = presencasValidas.map((p: any) => ({
          ...p,
          nivel: p.nivel || alunosNiveisCacheRef.current.get(p.aluno_email) || 'Aprendiz'
        }));
        setPresencasDb(presencasComNivel);

      } else {
        setPresencasDb([]);
      }

      // 3. Aniversariantes roda apenas UMA vez por sessão
      if (!aniversariantesLoadedRef.current) {
        aniversariantesLoadedRef.current = true;
        carregarAniversariantes();
      }
    } catch (err) {
      console.error("Erro ao carregar arena:", err);
    } finally {
      arenaLoadingRef.current = false;
    }
  };




  const [aniversariantesSemana, setAniversariantesSemana] = useState<any[]>([]);

  const carregarAniversariantes = async () => {
    try {
      const hoje = new Date();
      // Semana de segunda a domingo
      const diaSemana = hoje.getDay(); // 0=dom, 1=seg
      const diffSegunda = hoje.getDate() - diaSemana + (diaSemana === 0 ? -6 : 1);
      const segunda = new Date(hoje);
      segunda.setDate(diffSegunda);

      const mapDiasSemana = new Map<string, { dataFormatada: string, diaNome: string, diaNumero: number, isHoje: boolean }>();
      const nomesDias = ['Segunda', 'Terça', 'Quarta', 'Quinta', 'Sexta', 'Sábado', 'Domingo'];

      for (let i = 0; i < 7; i++) {
        const d = new Date(segunda);
        d.setDate(segunda.getDate() + i);
        const mm = String(d.getMonth() + 1).padStart(2, '0');
        const dd = String(d.getDate()).padStart(2, '0');
        const mmdd = `${mm}-${dd}`;
        const isDiaHoje = d.getDate() === hoje.getDate() && d.getMonth() === hoje.getMonth();
        mapDiasSemana.set(mmdd, {
          dataFormatada: `${dd}/${mm}`,
          diaNome: nomesDias[i],
          diaNumero: i,
          isHoje: isDiaHoje
        });
      }

      const { data, error } = await supabase
        .from('alunos')
        .select('id, nome, sobrenome, apelido, foto_url, data_nascimento, nivel')
        .eq('status', 'aprovado');
      
      if (error) throw error;

      const listaSemana: any[] = [];
      data?.forEach((a: any) => {
        if (!a.data_nascimento) return;
        const parts = String(a.data_nascimento).split('-');
        if (parts.length < 3) return;
        const mmdd = `${parts[1]}-${parts[2]}`;
        if (mapDiasSemana.has(mmdd)) {
          const infoDia = mapDiasSemana.get(mmdd)!;
          listaSemana.push({
            ...a,
            dataFormatada: infoDia.dataFormatada,
            diaNome: infoDia.diaNome,
            diaNumero: infoDia.diaNumero,
            isHoje: infoDia.isHoje
          });
        }
      });

      // Ordena pelos dias da semana (Segunda a Domingo)
      listaSemana.sort((a, b) => a.diaNumero - b.diaNumero);

      setAniversariantesSemana(listaSemana);
      setAniversariantesHoje(listaSemana.filter(a => a.isHoje));
    } catch (e) {
      console.error("Erro ao carregar aniversariantes:", e);
    }
  };


  const handleExportarExcel = async () => {
    try {
      const { data: alunos, error } = await supabase
        .from('alunos')
        .select('*')
        .eq('status', 'aprovado');

      if (error) throw error;
      if (!alunos || alunos.length === 0) {
        alert("Nenhum atleta cadastrado e aprovado encontrado para exportar.");
        return;
      }

      // Pergunta se quer enviar para o Google Sheets ou baixar localmente
      const acao = window.confirm(
        "Deseja enviar os dados de hoje diretamente para a Planilha do Google Sheets?\n\n(Clique em OK para enviar para o Google Sheets, ou CANCELAR para baixar a planilha Excel local .xlsx)"
      );

      const hoje = new Date();
      const dia = String(hoje.getDate()).padStart(2, '0');
      const mes = String(hoje.getMonth() + 1).padStart(2, '0');
      const ano = hoje.getFullYear();
      const nomeAba = `${dia}/${mes}/${ano}`; // Nome de página solicitado pelo usuário: xx/xx/xxxx

      // Filtra para remover administradores e professores da planilha de exportação
      const alunosFiltrados = alunos.filter((aluno: any) => {
        if (aluno.is_admin) return false;
        const nivel = String(aluno.nivel || '').toLowerCase();
        if (nivel.includes('professor')) return false;
        return true;
      });

      // Ordenação: 1º por dia_vencimento (5, 10, 15, 20), 2º por nome A-Z
      const alunosOrdenados = [...alunosFiltrados].sort((a: any, b: any) => {
        const vencA = a.dia_vencimento || 10;
        const vencB = b.dia_vencimento || 10;
        if (vencA !== vencB) {
          return vencA - vencB;
        }
        const nomeA = `${a.nome} ${a.sobrenome || ''}`.trim().toLowerCase();
        const nomeB = `${b.nome} ${b.sobrenome || ''}`.trim().toLowerCase();
        return nomeA.localeCompare(nomeB);
      });

      // Mapeia apenas as 3 colunas solicitadas: Atleta, Mensalidade (boolean), Vencimento
      const dadosPlanilha = alunosOrdenados.map((aluno: any) => {
        const status = obterStatusMensalidade(aluno);
        return {
          'Atleta': `${aluno.nome} ${aluno.sobrenome || ''}`.trim(),
          'Mensalidade': status.ativo, // boolean que vira checkbox no Sheets
          'Vencimento': `Dia ${aluno.dia_vencimento || 10}`
        };
      });


      if (acao) {
        // Envio para o Google Sheets (URL Fixa do usuário)
        const scriptUrl = 'https://script.google.com/macros/s/AKfycbzQWVqn5LEoJXZuf2wLierTlMjCYKRVTb3jAp12NZSayITGe1qI_00qHq8sAh7ln7zuUQ/exec';

        alert("Enviando dados para o Google Sheets... Por favor, aguarde.");
        
        const res = await enviarParaGoogleSheets(scriptUrl, nomeAba, dadosPlanilha);
        if (res.success) {
          alert(`✅ Sincronizado com sucesso! Aba "${nomeAba}" criada na sua planilha do Google Sheets.`);
        } else {
          alert(`Erro ao enviar para o Google Sheets: ${res.message}`);
        }
      } else {
        // Backup de exportação local .xlsx
        const XLSX = await import('xlsx');
        const wb = XLSX.utils.book_new();
        const nomeAbaLocal = `${dia}-${mes}-${ano}`;
        const ws = XLSX.utils.json_to_sheet(dadosPlanilha);
        XLSX.utils.book_append_sheet(wb, ws, nomeAbaLocal);
        XLSX.writeFile(wb, `HECTH_Planilha_Mensalidades_${nomeAbaLocal}.xlsx`);
        alert("📊 Planilha Excel gerada localmente com sucesso!");
      }
    } catch (err: any) {
      console.error(err);
      alert("Erro ao exportar dados: " + err.message);
    }
  };


  const handleUploadEAnexarExcel = async (event: React.ChangeEvent<HTMLInputElement>) => {

    const file = event.target.files?.[0];
    if (!file) return;
    try {
      const { data: alunos, error } = await supabase
        .from('alunos')
        .select('*')
        .eq('status', 'aprovado')
        .order('nome', { ascending: true });

      if (error) throw error;
      if (!alunos || alunos.length === 0) return alert("Nenhum atleta encontrado.");

      const dadosPlanilha = alunos.map((aluno: any) => {
        const status = obterStatusMensalidade(aluno);
        return {
          'Atleta': `${aluno.nome} ${aluno.sobrenome || ''}`.trim(),
          'E-mail': aluno.email,
          'Vencimento (Dia)': aluno.dia_vencimento || 10,
          'Freq. Semanal': `${aluno.frequencia_semanal || 2}x`,
          'Último Mês Pago': aluno.ultimo_mes_pago || 'Não cadastrado',
          'Nível': aluno.nivel || 'APRENDIZ',
          'Aluno Personal': aluno.personal ? 'Sim' : 'Não',
          'Status Acesso': status.ativo ? 'Ativo' : 'Inativo',
          'Dias Restantes': status.diasRestantes === 999 ? 'Infinito (Prof)' : `${status.diasRestantes} dias`
        };
      });

      const XLSX = await import('xlsx');
      const reader = new FileReader();
      
      reader.onload = async (e) => {
        try {
          const data = new Uint8Array(e.target?.result as ArrayBuffer);
          const wb = XLSX.read(data, { type: 'array' });
          
          const hoje = new Date();
          const dia = String(hoje.getDate()).padStart(2, '0');
          const mes = String(hoje.getMonth() + 1).padStart(2, '0');
          const ano = hoje.getFullYear();
          const nomeAba = `${dia}-${mes}-${ano}`;
          
          if (wb.SheetNames.includes(nomeAba)) {
            const idx = wb.SheetNames.indexOf(nomeAba);
            wb.SheetNames.splice(idx, 1);
            delete wb.Sheets[nomeAba];
          }

          const ws = XLSX.utils.json_to_sheet(dadosPlanilha);
          XLSX.utils.book_append_sheet(wb, ws, nomeAba);
          
          XLSX.writeFile(wb, file.name);
          alert(`📊 Nova aba '${nomeAba}' adicionada com sucesso no seu arquivo existente!`);
        } catch (err: any) {
          alert("Erro ao ler/anexar dados na planilha: " + err.message);
        }
      };
      reader.readAsArrayBuffer(file);
    } catch (err: any) {
      alert("Erro ao buscar dados do banco: " + err.message);
    } finally {
      event.target.value = '';
    }
  };



  const carregarNotificacoes = async () => {
    try {
      if (!session?.user?.email) return;

      // 1. Total unread messages
      if (isAdmin) {
        // Admin: Count unread messages sent by students (where enviado_por matches aluno_email)
        const { data: dataMsgs } = await supabase
          .from('mensagens')
          .select('enviado_por, aluno_email')
          .eq('lida', false);
        
        const unreadCount = dataMsgs?.filter(m => m.enviado_por === m.aluno_email).length ?? 0;
        setTotalMensagensNaoLidas(unreadCount);
      } else {
        // Student: Count unread messages sent by admin (where aluno_email = self AND enviado_por != self)
        const { count } = await supabase
          .from('mensagens')
          .select('*', { count: 'exact', head: true })
          .eq('aluno_email', session.user.email)
          .neq('enviado_por', session.user.email)
          .eq('lida', false);
        
        setTotalMensagensNaoLidas(count ?? 0);
      }

      // 2. Pending payments (pagamento_enviado === true)
      const { count: countPagamentos } = await supabase
        .from('alunos')
        .select('*', { count: 'exact', head: true })
        .eq('pagamento_enviado', true);
      setTotalPagamentosPendentes(countPagamentos ?? 0);
      setTemNovoPagamento((countPagamentos ?? 0) > 0);

      // 3. Pending approvals (status === 'pendente')
      const { count: countCadastros } = await supabase
        .from('alunos')
        .select('*', { count: 'exact', head: true })
        .eq('status', 'pendente');
      setTotalCadastrosPendentes(countCadastros ?? 0);
    } catch (e) {
      console.error("Erro ao carregar notificacoes:", e);
    }
  };



  const carregarPerfil = async (emailUsuario: string | undefined) => {
    if (!emailUsuario) return;
    const emailLimpo = emailUsuario.trim().toLowerCase();


    try {
      // 1. Tenta buscar exato
      let { data, error } = await supabase
        .from('alunos')
        .select('*')
        .eq('email', emailLimpo)
        .maybeSingle();

      // 2. Se não achou (ex: cadastrado com letra maiúscula), busca insensível a maiúsculas/minúsculas
      if (!data) {
        const { data: dataIlike } = await supabase
          .from('alunos')
          .select('*')
          .ilike('email', emailLimpo)
          .maybeSingle();
        data = dataIlike;
      }

      if (data) {
        setAlunoDb(data);
        setPerfilNaoEncontrado(false);

        // Se ainda não concluiu o primeiro login (e não é o admin principal), abre o modal de validação de nascimento e troca de senha
        if (!data.primeiro_login_concluido && emailLimpo !== 'lucas.hecth@gmail.com') {
          setModalRedefinirSenha(true);
        }
      } else {
        console.warn("Perfil não encontrado no banco para:", emailLimpo, error);
        setPerfilNaoEncontrado(true);
      }

    } catch (e) {
      console.error("Erro ao carregar perfil:", e);
    }
  };



  const salvarPerfilAutocuracao = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!session?.user?.email) return;
    if (!selfNome || !selfSobrenome || !selfDataNascimento || !selfFoto) {
      return alert('Por favor, preencha todos os campos e selecione sua foto!');
    }
    setCompletandoPerfil(true);
    try {
      // 1. Converte a foto comprimida para DataURL Base64 ultraleve
      const fotoUrl = await fileToBase64(selfFoto, 350, 0.7);

      // 2. Insere o aluno
      const novoAluno = {
        nome: selfNome,
        sobrenome: selfSobrenome,
        email: session.user.email,
        foto_url: fotoUrl,
        status: 'pendente',
        data_nascimento: selfDataNascimento || null
      };

      const { error: insertError } = await supabase.from('alunos').insert([novoAluno]);

      if (insertError) throw insertError;

      setPerfilNaoEncontrado(false);
      setAlunoDb(novoAluno);
      alert('✓ Perfil criado com sucesso! Aguarde a aprovação do seu cadastro.');
    } catch (err: any) {
      alert('Erro ao salvar perfil: ' + err.message);
    } finally {
      setCompletandoPerfil(false);
    }
  };



  const fazerLogout = async () => {
    setAlunoDb(null);
    setPerfilNaoEncontrado(false);
    setModalRedefinirSenha(false);
    setSession(null);
    await supabase.auth.signOut();
    setTelaAtiva('inicio');
  };

  const salvarNovaSenha = async (e: React.FormEvent) => {
    e.preventDefault();
    const dataNascimentoFinal = alunoDb?.data_nascimento || dataNascimentoPrimeiroLogin;

    if (!dataNascimentoFinal) {
      return alert('Por favor, informe sua Data de Nascimento!');
    }
    if (!novaSenha || !confirmNovaSenha) {
      return alert('Por favor, preencha todos os campos de senha!');
    }
    if (novaSenha.length < 6) {
      return alert('A senha deve ter pelo menos 6 caracteres!');
    }
    if (novaSenha !== confirmNovaSenha) {
      return alert('As senhas não coincidem!');
    }

    setSalvandoNovaSenha(true);
    try {
      // 1. Atualiza senha no Firebase Auth
      const { error } = await supabase.auth.updateUser({ password: novaSenha });
      if (error) throw error;

      // 2. Salva data de nascimento e marca primeiro login concluído no Firestore
      const emailUsuario = session?.user?.email || alunoDb?.email;
      if (emailUsuario) {
        const updatePayload: any = {
          primeiro_login_concluido: true
        };
        if (!alunoDb?.data_nascimento && dataNascimentoPrimeiroLogin) {
          updatePayload.data_nascimento = dataNascimentoPrimeiroLogin;
        }

        await supabase.from('alunos').update(updatePayload).eq('email', emailUsuario);
        setAlunoDb((prev: any) => prev ? { ...prev, ...updatePayload } : null);
      }

      alert('✅ Senha e cadastro atualizados com sucesso!');
      setModalRedefinirSenha(false);
      setNovaSenha('');
      setConfirmNovaSenha('');
      setDataNascimentoPrimeiroLogin('');
    } catch (err: any) {
      alert('Erro ao salvar alterações: ' + err.message);
    } finally {
      setSalvandoNovaSenha(false);
    }
  };


  const enviarEmailRecuperacao = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!emailRecuperacao.trim()) {
      return alert('Por favor, informe seu e-mail cadastrado!');
    }

    setEnviandoRecuperacao(true);
    try {
      const redirectTo = typeof window !== 'undefined' ? window.location.origin : undefined;
      const { error } = await supabase.auth.resetPasswordForEmail(emailRecuperacao.trim(), {
        redirectTo: redirectTo
      });
      if (error) throw error;

      alert('✉️ E-mail de redefinição enviado! Verifique sua caixa de entrada (e pasta de spam).');
      setModalEsqueciSenha(false);
      setEmailRecuperacao('');
    } catch (err: any) {
      alert('Erro ao solicitar redefinição: ' + err.message);
    } finally {
      setEnviandoRecuperacao(false);
    }
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
    if (!nome || !sobrenome || !email || !senha || !foto || !dataNascimento) return alert('Preencha tudo e selecione a foto!');
    setLoading(true);
    try {
      // Converte a foto para DataURL Base64 ultraleve
      const fotoUrl = await fileToBase64(foto, 350, 0.7);
      
      const { error: authError } = await supabase.auth.signUp({ email, password: senha });
      if (authError) throw authError;
      
      const novoAluno = { 
        nome, 
        sobrenome, 
        email, 
        foto_url: fotoUrl, 
        status: 'pendente',
        data_nascimento: dataNascimento || null
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
        
        // Devolve o crédito avulso se a quantidade marcada for maior que o total do plano
        if (!isTeacher && !isAdmin && progressoSemanal.marcadas > progressoSemanal.total) {
          const novosCreditos = (alunoDb.creditos_avulsos || 0) + 1;
          await supabase.from('alunos').update({ creditos_avulsos: novosCreditos }).eq('email', session.user.email);
          setAlunoDb((prev: any) => prev ? { ...prev, creditos_avulsos: novosCreditos } : null);
        }

        setTurmaIdClicada(null); setAcaoClicada(null);
      }, 400);
    } else {
      let usouCredito = false;
      if (!isTeacher && !isAdmin && progressoSemanal.concluido) {
        const creditos = alunoDb.creditos_avulsos || 0;
        if (creditos > 0) {
          const usar = window.confirm(`Você já atingiu seu limite de treinos semanal. Deseja utilizar 1 dos seus ${creditos} crédito(s) avulso(s) para agendar esta aula?`);
          if (!usar) {
            setTurmaIdClicada(null);
            setAcaoClicada(null);
            return;
          }
          usouCredito = true;
        } else {
          alert(`Você já atingiu seu limite de treinos semanal (${progressoSemanal.total}/${progressoSemanal.total} aulas agendadas)!`);
          setTurmaIdClicada(null);
          setAcaoClicada(null);
          return;
        }
      }
      if (vagasAtuais >= vagasTotais) {
        setTurmaIdClicada(null);
        setAcaoClicada(null);
        return alert("Esta turma já está lotada!");
      }
      
      if (usouCredito) {
        const novosCreditos = (alunoDb.creditos_avulsos || 0) - 1;
        await supabase.from('alunos').update({ creditos_avulsos: novosCreditos }).eq('email', session.user.email);
        setAlunoDb((prev: any) => prev ? { ...prev, creditos_avulsos: novosCreditos } : null);
      }

      lancarBolasMikasa(e);

      
      const novaPresenca = { 
        turma_id: turmaId, 
        aluno_email: session.user.email, 
        foto_url: alunoDb.foto_url, 
        inicial: alunoDb.nome?.charAt(0) || '',
        nivel: alunoDb.nivel || 'Aprendiz'
      };
      setTurmas(turmas.map(t => t.id === turmaId ? { ...t, vagas_ocupadas: t.vagas_ocupadas + 1 } : t));
      setPresencasDb(prev => [...prev, novaPresenca]);
      
      const nowIso = new Date().toISOString();
      await supabase.from('presencas').insert([novaPresenca]);

      await supabase.from('turmas').update({ vagas_ocupadas: vagasAtuais + 1 }).eq('id', turmaId);
      await supabase.from('alunos').update({ ultima_inscricao: nowIso }).eq('email', session.user.email);
      setAlunoDb((prev: any) => prev ? { ...prev, ultima_inscricao: nowIso } : null);
      
      setTimeout(() => { setTurmaIdClicada(null); setAcaoClicada(null); }, 400);
    }

  };

  if (!mounted) return null;

  if (session && !alunoDb) {
    if (perfilNaoEncontrado) {
      return (
        <div className="min-h-screen bg-black flex flex-col items-center justify-center p-5 text-white">
          <form onSubmit={salvarPerfilAutocuracao} className="bg-[#1a1a1a] p-8 rounded-[2rem] border border-white/10 max-w-sm w-full flex flex-col gap-4 shadow-xl text-left animacao-entrada">
            <div className="text-center mb-2">
              <span className="text-3xl">⚠️</span>
              <h3 className="text-white font-black uppercase tracking-tight text-lg mt-2 leading-none">Perfil não Encontrado</h3>
              <p className="text-white/40 text-[9px] uppercase font-black tracking-widest mt-1.5 leading-relaxed">
                Complete seus dados abaixo para ativar e salvar o seu cadastro.
              </p>
            </div>

            <div>
              <label className="text-[9px] font-black uppercase tracking-widest text-white/40 mb-1.5 block">Nome</label>
              <input 
                type="text" 
                placeholder="Ex: Lucas" 
                value={selfNome}
                onChange={(e) => setSelfNome(e.target.value)}
                className="w-full bg-white/5 border border-white/10 rounded-xl px-4 py-3.5 text-white outline-none focus:ring-1 focus:ring-[#ef3340] text-xs font-bold"
                required
              />
            </div>

            <div>
              <label className="text-[9px] font-black uppercase tracking-widest text-white/40 mb-1.5 block">Sobrenome</label>
              <input 
                type="text" 
                placeholder="Ex: Silva" 
                value={selfSobrenome}
                onChange={(e) => setSelfSobrenome(e.target.value)}
                className="w-full bg-white/5 border border-white/10 rounded-xl px-4 py-3.5 text-white outline-none focus:ring-1 focus:ring-[#ef3340] text-xs font-bold"
                required
              />
            </div>

            <div>
              <label className="text-[9px] font-black uppercase tracking-widest text-white/40 mb-1.5 block">Data de Nascimento</label>
              <input 
                type="date" 
                value={selfDataNascimento}
                onChange={(e) => setSelfDataNascimento(e.target.value)}
                className="w-full bg-white/5 border border-white/10 rounded-xl px-4 py-3.5 text-white outline-none focus:ring-1 focus:ring-[#ef3340] text-xs font-bold"
                required
              />
            </div>

            <div>
              <label className="text-[9px] font-black uppercase tracking-widest text-white/40 mb-1.5 block">Foto de Perfil</label>
              <input 
                type="file" 
                accept="image/*" 
                onChange={(e) => setSelfFoto(e.target.files?.[0] || null)}
                className="w-full text-xs text-white/60 file:mr-4 file:py-2.5 file:px-4 file:rounded-xl file:border-0 file:text-[10px] file:font-black file:uppercase file:bg-[#ef3340] file:text-white file:cursor-pointer"
                required
              />
            </div>

            <button 
              type="submit"
              disabled={completandoPerfil}
              className="w-full bg-gradient-to-r from-orange-500 to-[#ef3340] text-white text-[11px] font-black uppercase tracking-widest py-4 rounded-xl active:scale-95 transition-all shadow-[0_0_15px_rgba(239,51,64,0.3)] disabled:opacity-50 mt-2"
            >
              {completandoPerfil ? 'Salvando...' : 'Salvar Perfil'}
            </button>

            <button 
              type="button"
              onClick={fazerLogout}
              className="w-full border border-white/10 bg-white/5 text-white/60 text-[10px] font-black uppercase tracking-widest py-3.5 rounded-xl transition-all active:scale-95 text-center"
            >
              Voltar / Sair
            </button>
          </form>
        </div>
      );
    }

    return (
      <div className="min-h-screen bg-black flex flex-col items-center justify-center p-5 text-center">
        <div className="bg-[#1a1a1a] p-8 rounded-3xl border border-white/10 max-w-sm w-full flex flex-col items-center gap-5 shadow-xl animacao-entrada">
          <div className="w-10 h-10 rounded-full border-t-2 border-r-2 border-[#ef3340] animate-spin" />
          <div>
            <h3 className="text-white font-black uppercase tracking-wider text-sm">Carregando Perfil...</h3>
            <p className="text-white/40 text-[9px] uppercase font-bold tracking-wider mt-1.5 leading-relaxed">
              Buscando dados no CT HECTH...
            </p>
          </div>
          <button 
            onClick={() => {
              if (session?.user?.email) carregarPerfil(session.user.email);
            }} 
            className="w-full bg-[#ef3340] text-white text-[11px] font-black uppercase tracking-widest py-3.5 rounded-xl transition-all active:scale-95 shadow-[0_0_15px_rgba(239,51,64,0.3)]"
          >
            Tentar Novamente
          </button>
          <button 
            onClick={fazerLogout} 
            className="w-full bg-white/5 border border-white/10 text-white/50 text-[10px] font-black uppercase tracking-widest py-3 rounded-xl transition-all active:scale-95 hover:bg-white/10"
          >
            Sair
          </button>
        </div>
      </div>
    );
  }




  if (session && alunoDb?.status === 'pendente') {
    return (
      <div className="min-h-screen bg-black flex items-center justify-center p-5 text-white text-center">
        <div className="bg-[#1a1a1a] p-10 rounded-3xl border border-white/10 max-w-md">
          <div className="text-5xl mb-6">⏳</div>
          <h1 className="text-2xl font-bold mb-4">Em análise!</h1>
          <p className="text-white/60 mb-8">Aguarde a aprovação para acessar.</p>
          <button onClick={fazerLogout} className="bg-white/10 px-6 py-2 rounded-full text-xs font-bold uppercase tracking-widest hover:bg-white/20 transition-colors">Sair</button>
        </div>
      </div>
    );
  }

  if (session && alunoDb?.status === 'aprovado' && (!alunoDb?.foto_url || alunoDb?.foto_url === '')) {
    return (
      <FotoObrigatoriaView 
        alunoDb={alunoDb} 
        onFotoEnviada={() => carregarPerfil(session.user.email)} 
        onLogout={fazerLogout}
      />
    );
  }

  if (!session) {
    return (
      <div className="min-h-screen bg-black flex flex-col items-center justify-center p-5 font-sans">
        <div className="bg-[#1a1a1a] p-8 rounded-3xl shadow-2xl border border-white/5 w-full max-w-md">
          <div className="flex justify-center mb-10"><img src="/hecth-logo.svg" alt="HECTH." className="h-14 w-auto"/></div>
          <InstallAppCard />
          {telaAtiva === 'inicio' ? (
            <div className="flex flex-col gap-4">
              <button onClick={() => setTelaAtiva('login')} className="w-full bg-white text-black font-bold py-4 rounded-xl hover:bg-gray-200 transition-all">Já sou aluno</button>
              <button onClick={() => setTelaAtiva('cadastro')} className="w-full bg-transparent text-white font-bold py-4 rounded-xl border border-white/20 hover:bg-white/5 transition-all">Primeiro acesso</button>
            </div>
          ) : telaAtiva === 'login' ? (
            <>
              <form onSubmit={fazerLogin} className="flex flex-col gap-4">
                <input type="email" placeholder="E-mail" required className="w-full border rounded-xl px-4 py-3 text-white bg-white/5 outline-none focus:ring-2 focus:ring-red-500" value={email} onChange={(e) => setEmail(e.target.value)} />
                <input type="password" placeholder="Senha" required className="w-full border rounded-xl px-4 py-3 text-white bg-white/5 outline-none focus:ring-2 focus:ring-red-500" value={senha} onChange={(e) => setSenha(e.target.value)} />
                <div className="flex justify-end">
                  <button 
                    type="button" 
                    onClick={() => {
                      setEmailRecuperacao(email || '');
                      setModalEsqueciSenha(true);
                    }} 
                    className="text-[11px] font-bold text-red-400 hover:underline"
                  >
                    Esqueci minha senha
                  </button>
                </div>
                <button className="w-full bg-white text-black font-bold py-4 rounded-xl disabled:opacity-50" disabled={loading}>{loading ? 'Entrando...' : 'Entrar'}</button>
                <button type="button" onClick={() => setTelaAtiva('inicio')} className="text-gray-400 text-sm font-bold uppercase mt-2">Voltar</button>
              </form>

              {modalEsqueciSenha && (
                <div className="fixed inset-0 z-50 bg-black/80 backdrop-blur-sm flex items-center justify-center p-4">
                  <div className="bg-[#1a1a1a] border border-white/10 p-6 rounded-3xl max-w-sm w-full animacao-entrada text-left shadow-2xl">
                    <div className="text-center mb-4">
                      <span className="text-3xl">🔑</span>
                      <h3 className="text-white font-black uppercase tracking-tight text-lg mt-2 leading-none">Recuperar Senha</h3>
                      <p className="text-white/40 text-[10px] uppercase font-black tracking-widest mt-1.5 leading-relaxed">
                        Informe seu e-mail cadastrado para receber o link de redefinição.
                      </p>
                    </div>
                    <form onSubmit={enviarEmailRecuperacao} className="flex flex-col gap-4">
                      <div>
                        <label className="text-[9px] font-black uppercase tracking-widest text-white/40 mb-1 block">Seu E-mail</label>
                        <input 
                          type="email" 
                          required 
                          placeholder="seuemail@exemplo.com"
                          value={emailRecuperacao}
                          onChange={(e) => setEmailRecuperacao(e.target.value)}
                          className="w-full bg-white/5 border border-white/10 rounded-xl px-4 py-3 text-white outline-none focus:ring-1 focus:ring-[#ef3340] text-xs font-bold"
                        />
                      </div>
                      <button 
                        type="submit" 
                        disabled={enviandoRecuperacao} 
                        className="w-full bg-gradient-to-r from-orange-500 to-[#ef3340] text-white text-[11px] font-black uppercase tracking-widest py-3.5 rounded-xl active:scale-95 transition-all shadow-[0_0_15px_rgba(239,51,64,0.3)] disabled:opacity-50"
                      >
                        {enviandoRecuperacao ? 'Enviando link...' : 'Enviar Link de Redefinição'}
                      </button>
                      <button 
                        type="button" 
                        onClick={() => setModalEsqueciSenha(false)} 
                        className="w-full border border-white/10 bg-white/5 text-white/60 text-[10px] font-black uppercase tracking-widest py-3 rounded-xl transition-all active:scale-95 text-center"
                      >
                        Cancelar
                      </button>
                    </form>
                  </div>
                </div>
              )}
            </>
          ) : (

            <form onSubmit={fazerCadastro} className="flex flex-col gap-3">
              <input type="text" placeholder="Nome" required className="w-full border rounded-xl px-4 py-3 text-white bg-white/5" value={nome} onChange={(e) => setNome(e.target.value)} />
              <input type="text" placeholder="Sobrenome" required className="w-full border rounded-xl px-4 py-3 text-white bg-white/5" value={sobrenome} onChange={(e) => setSobrenome(e.target.value)} />
              <input type="email" placeholder="E-mail" required className="w-full border rounded-xl px-4 py-3 text-white bg-white/5" value={email} onChange={(e) => setEmail(e.target.value)} />
              <input type="password" placeholder="Senha" required className="w-full border rounded-xl px-4 py-3 text-white bg-white/5" value={senha} onChange={(e) => setSenha(e.target.value)} />
              <div className="flex flex-col gap-1 text-left">
                <span className="text-[10px] font-black uppercase text-white/40 tracking-wider ml-1">Data de Nascimento</span>
                <input type="date" required className="w-full border rounded-xl px-4 py-3 text-white bg-white/5 outline-none focus:ring-2 focus:ring-red-500 font-bold" value={dataNascimento} onChange={(e) => setDataNascimento(e.target.value)} />
              </div>
              <input type="file" required onChange={(e) => setFoto(e.target.files?.[0] || null)} className="text-xs text-white/50 file:bg-white/10 file:text-white file:rounded-full file:border-0 file:px-4 file:py-2" />
              <button className="w-full bg-red-600 text-white font-bold py-4 rounded-xl disabled:opacity-50" disabled={loading}>{loading ? 'Criando...' : 'Criar Conta'}</button>
              <button type="button" onClick={() => setTelaAtiva('inicio')} className="text-gray-400 text-sm font-bold uppercase mt-1">Voltar</button>
            </form>

          )}
          
          <div className="mt-6 text-center">
            <span className="text-[10px] font-black uppercase tracking-widest text-white/20 bg-white/5 px-3 py-1 rounded-full border border-white/5">
              Versão 2.2.2
            </span>













          </div>















        </div>

        {modalRedefinirSenha && (

          <div className="fixed inset-0 z-[100] bg-black/85 backdrop-blur-md flex items-center justify-center p-4">
            <div className="bg-[#1a1a1a] border border-[#ef3340]/40 p-8 rounded-[2rem] max-w-sm w-full animacao-entrada text-left shadow-[0_0_50px_rgba(239,51,64,0.2)]">
              <div className="text-center mb-6">
                <div className="w-14 h-14 rounded-full bg-[#ef3340]/10 border border-[#ef3340]/30 flex items-center justify-center text-2xl mx-auto mb-3">
                  🔐
                </div>
                <h3 className="text-white font-black uppercase tracking-tight text-xl leading-none">Criar Nova Senha</h3>
                <p className="text-white/40 text-[10px] uppercase font-black tracking-widest mt-2 leading-relaxed">
                  Digite e confirme sua nova senha para continuar usando o app.
                </p>
              </div>

              <form onSubmit={salvarNovaSenha} className="flex flex-col gap-4">
                {/* CAMPO DE DATA DE NASCIMENTO (ESMAECIDO SE JÁ EXISTE, OBRIGATÓRIO SE NÃO HOUVER) */}
                <div>
                  <div className="flex items-center justify-between mb-1.5">
                    <label className="text-[9px] font-black uppercase tracking-widest text-white/40 block">Data de Nascimento</label>
                    {alunoDb?.data_nascimento && (
                      <span className="text-[9px] font-bold text-green-400/80 bg-green-500/10 px-2 py-0.5 rounded-full">Já Cadastrado</span>
                    )}
                  </div>
                  {alunoDb?.data_nascimento ? (
                    <input 
                      type="text" 
                      disabled 
                      value={(() => {
                        const parts = String(alunoDb.data_nascimento).split('-');
                        if (parts.length === 3) return `${parts[2]}/${parts[1]}/${parts[0]}`;
                        return alunoDb.data_nascimento;
                      })()}
                      className="w-full bg-white/5 border border-white/5 rounded-xl px-4 py-3.5 text-white/40 cursor-not-allowed text-sm font-bold opacity-60"
                    />
                  ) : (
                    <input 
                      type="date" 
                      required 
                      value={dataNascimentoPrimeiroLogin}
                      onChange={(e) => setDataNascimentoPrimeiroLogin(e.target.value)}
                      className="w-full bg-white/5 border border-[#ef3340]/40 rounded-xl px-4 py-3.5 text-white outline-none focus:ring-1 focus:ring-[#ef3340] text-sm font-bold"
                    />
                  )}
                  {!alunoDb?.data_nascimento && (
                    <span className="text-[8px] font-bold text-amber-400/80 mt-1 block">
                      * Campo obrigatório para confirmação do seu cadastro
                    </span>
                  )}
                </div>

                <div>
                  <label className="text-[9px] font-black uppercase tracking-widest text-white/40 mb-1.5 block">Nova Senha (mín. 6 caracteres)</label>
                  <input 
                    type="password" 
                    required 
                    placeholder="••••••••"
                    value={novaSenha}
                    onChange={(e) => setNovaSenha(e.target.value)}
                    className="w-full bg-white/5 border border-white/10 rounded-xl px-4 py-3.5 text-white outline-none focus:ring-1 focus:ring-[#ef3340] text-sm font-bold"
                  />
                </div>

                <div>
                  <label className="text-[9px] font-black uppercase tracking-widest text-white/40 mb-1.5 block">Confirmar Nova Senha</label>
                  <input 
                    type="password" 
                    required 
                    placeholder="••••••••"
                    value={confirmNovaSenha}
                    onChange={(e) => setConfirmNovaSenha(e.target.value)}
                    className="w-full bg-white/5 border border-white/10 rounded-xl px-4 py-3.5 text-white outline-none focus:ring-1 focus:ring-[#ef3340] text-sm font-bold"
                  />
                </div>

                <button 
                  type="submit" 
                  disabled={salvandoNovaSenha} 
                  className="w-full bg-gradient-to-r from-orange-500 to-[#ef3340] text-white text-[11px] font-black uppercase tracking-widest py-4 rounded-xl active:scale-95 transition-all shadow-[0_0_15px_rgba(239,51,64,0.3)] disabled:opacity-50 mt-2"
                >
                  {salvandoNovaSenha ? 'Salvando...' : 'Salvar e Acessar'}
                </button>


                <button 
                  type="button" 
                  onClick={() => setModalRedefinirSenha(false)} 
                  className="w-full border border-white/10 bg-white/5 text-white/60 text-[10px] font-black uppercase tracking-widest py-3 rounded-xl transition-all active:scale-95 text-center"
                >
                  Fechar
                </button>
              </form>
            </div>
          </div>
        )}
      </div>
    );
  }

  const agora = new Date();
  let dataExibicao = new Date(agora);
  const horaAtual = agora.getHours();
  const minAtual = agora.getMinutes();
  if (horaAtual > 20 || (horaAtual === 20 && minAtual >= 30)) {
    dataExibicao.setDate(dataExibicao.getDate() + 1);
  }

  if (agora.getDay() === 5 && agora.getHours() >= 10) {
    dataExibicao = new Date(agora); dataExibicao.setDate(dataExibicao.getDate() + 3);
  } else if (dataExibicao.getDay() === 6) dataExibicao.setDate(dataExibicao.getDate() + 2);
  else if (dataExibicao.getDay() === 0) dataExibicao.setDate(dataExibicao.getDate() + 1);

  const dataFormatada = dataExibicao.toLocaleDateString('pt-BR', { day: '2-digit', month: '2-digit', year: '2-digit' });
  const isHoje = dataExibicao.getDate() === agora.getDate() && dataExibicao.getMonth() === agora.getMonth();

  const turmasDoDia = turmas?.filter(turma => {
    const diaAtual = dataExibicao.getDay(); // 0=Dom, 1=Seg, 2=Ter, 3=Qua, 4=Qui, 5=Sex, 6=Sab
    const horarioTurma = turma.horario;

    // 0. SE ESTIVER INATIVA, NÃO MOSTRAR
    if (turma.ativo === false) {
      return false;
    }

    // 1. REGRAS DA SEXTA-FEIRA (5):
    if (diaAtual === 5) {
      // Esconde turmas noturnas (17h, 18h, 19h, 20h)
      const horariosNoturnos = ['17:00', '18:00', '19:00', '20:00'];
      if (horariosNoturnos.includes(horarioTurma)) {
        return false;
      }
    }

    // 2. REGRA DE DIA EXCLUSIVO
    if (turma.dia_exclusivo) {
      const diasMap: Record<string, number> = { 
        'Domingo': 0, 'Segunda': 1, 'Terça': 2, 'Terca': 2, 
        'Quarta': 3, 'Quinta': 4, 'Sexta': 5, 'Sábado': 6, 'Sabado': 6 
      };
      
      const diaDesejado = diasMap[turma.dia_exclusivo];
      if (diaAtual !== diaDesejado) {
        return false;
      }
    }

    // 3. REGRA DE DIAS DA SEMANA SELECIONADOS NO EDITOR
    if (turma.dias_semana !== undefined && turma.dias_semana !== null) {
      const diasPermitidos = String(turma.dias_semana).split(',').map((d: string) => parseInt(d.trim())).filter(d => !isNaN(d));
      if (diasPermitidos.length > 0 && !diasPermitidos.includes(diaAtual)) {
        return false;
      }
    }

    return true;


  }).map(turma => {
    const diaAtual = dataExibicao.getDay();
    let nomeCustomizado = turma.nome;

    // 1. SEG/QUA (1 e 3) -> 18:00 = Iniciante Avançado / Intermediário
    if ((diaAtual === 1 || diaAtual === 3) && turma.horario === '18:00') {
      nomeCustomizado = 'Iniciante Avançado / Intermediário';
    }

    // 2. TER/QUI (2 e 4) -> 19:00 = Iniciante Avançado / Intermediário
    if ((diaAtual === 2 || diaAtual === 4) && turma.horario === '19:00') {
      nomeCustomizado = 'Iniciante Avançado / Intermediário';
    }

    // 3. SEX (5) -> 08:00 = Iniciante Avançado / Intermediário
    if (diaAtual === 5 && turma.horario === '08:00') {
      nomeCustomizado = 'Iniciante Avançado / Intermediário';
    }

    return {
      ...turma,
      nome: nomeCustomizado
    };
  });

  // Verifica se o aluno já marcou presença em alguma das turmas DO DIA EXIBIDO
  const turmasDoDiaIds = new Set(turmasDoDia?.map(t => t.id) || []);
  const alunoJaMarcouAlguma = presencasDb.some(p => p.aluno_email === session?.user?.email && turmasDoDiaIds.has(p.turma_id));


  const statusMensalidade = obterStatusMensalidade(alunoDb);
  const nivelNorm = String(alunoDb?.nivel || '').toLowerCase();
  const isAdminEfetivo = Boolean(isAdmin || alunoDb?.is_admin || nivelNorm.includes('gerencia') || session?.user?.email === 'lucas.hecth@gmail.com');
  const isTeacher = nivelNorm.includes('professor');


  // Obtém presenças da semana atual (Segunda a Domingo)
  const obterContagemSemanal = () => {
    if (!session?.user?.email) return { total: 2, marcadas: 0, restantes: 2, concluido: false };
    const hoje = new Date();
    
    // Segunda-feira da semana corrente
    const diaSemana = hoje.getDay(); // 0 = Dom, 1 = Seg, ...
    const diffSegunda = hoje.getDate() - diaSemana + (diaSemana === 0 ? -6 : 1);
    const segunda = new Date(hoje);
    segunda.setDate(diffSegunda);
    segunda.setHours(0, 0, 0, 0);

    // Domingo da semana corrente
    const domingo = new Date(segunda);
    domingo.setDate(segunda.getDate() + 6);
    domingo.setHours(23, 59, 59, 999);

    const presencasDaSemana = presencasDb.filter(p => {
      if (p.aluno_email !== session.user.email) return false;
      const dataPresenca = new Date(p.created_at || new Date());
      return dataPresenca >= segunda && dataPresenca <= domingo;
    });

    const total = alunoDb?.frequencia_semanal || 2;
    const marcadas = presencasDaSemana.length;
    const restantes = Math.max(0, total - marcadas);
    const concluido = marcadas >= total;

    return { total, marcadas, restantes, concluido };
  };

  const progressoSemanal = obterContagemSemanal();

  return (

    <div className="min-h-screen bg-black font-sans pb-10 text-white overflow-x-hidden">
      <Header alunoDb={alunoDb} onLogout={fazerLogout} onGoHome={() => setAbaAtiva('arena')} onGoToProfile={() => setAbaAtiva('perfil')} />


      <main className="w-full">
        
        {abaAtiva === 'arena' && (
          <div className="px-5">
            <MenuCards 
              onNavegar={setAbaAtiva} 
              isAdmin={isAdminEfetivo} 
              isTeacher={isTeacher}
              totalMensagensNaoLidas={totalMensagensNaoLidas}
              totalPagamentosPendentes={totalPagamentosPendentes}
              totalCadastrosPendentes={totalCadastrosPendentes}
              limiteAtingido={progressoSemanal.concluido}
            />


            {/* CARD DE PROGRESSO SEMANAL */}
            {session && alunoDb?.status === 'aprovado' && !isTeacher && !isAdminEfetivo && (

              <div className="w-full bg-[#121212] border border-white/5 rounded-2xl p-4 mb-4 shadow-xl">
                {alunoDb?.creditos_avulsos > 0 && (
                  <div className="mb-3 bg-gradient-to-r from-orange-600/10 to-[#ef3340]/10 border border-orange-500/20 rounded-xl p-3 flex items-center justify-between text-left">
                    <div>
                      <span className="text-[9px] font-black uppercase text-orange-400 block tracking-widest">Crédito de Aula Avulsa</span>
                      <p className="text-[10px] text-white/70 font-semibold mt-0.5">Você possui créditos adicionais liberados para agendamento!</p>
                    </div>
                    <span className="text-xl font-black italic text-orange-400 bg-orange-500/10 border border-orange-500/20 rounded-lg px-2.5 py-0.5">
                      +{alunoDb.creditos_avulsos}
                    </span>
                  </div>
                )}
                <div className="flex justify-between items-center mb-3">

                  <div>
                    <h4 className="text-white text-xs font-black uppercase tracking-wider">
                      Frequência Semanal
                    </h4>
                    <p className="text-white/40 text-[9px] uppercase font-bold tracking-widest mt-0.5">
                      {progressoSemanal.concluido ? (
                        <span className="text-green-400 flex items-center gap-1 font-black">
                          ✓ Treinos Concluídos!
                        </span>
                      ) : (
                        `Você tem ${progressoSemanal.restantes} ${progressoSemanal.restantes === 1 ? 'treino restante' : 'treinos restantes'} essa semana`
                      )}
                    </p>
                  </div>
                  <div className="flex items-center gap-1.5 bg-white/5 border border-white/5 px-2.5 py-1 rounded-full">
                    <span className="text-white/30 text-[9px] font-black uppercase tracking-wider">Status</span>
                    {progressoSemanal.concluido ? (
                      <span className="text-green-400 text-xs">✅</span>
                    ) : (
                      <span className="text-amber-400 text-[10px] font-black uppercase italic">{progressoSemanal.marcadas}/{progressoSemanal.total}</span>
                    )}
                  </div>
                </div>

                {/* Barra de Progresso com a Bola Mikasa de Ponto do Slider */}
                <div className="relative w-full h-2 bg-white/5 rounded-full mt-5 mb-3 border border-white/5">
                  <div 
                    className="absolute top-0 left-0 h-full rounded-full bg-gradient-to-r from-red-500 to-green-500 transition-all duration-500"
                    style={{ width: `${Math.min(100, (progressoSemanal.marcadas / progressoSemanal.total) * 100)}%` }}
                  />
                  {/* Bolinha Mikasa no ponto do slider */}
                  <div 
                    className="absolute transition-all duration-500 flex items-center justify-center"
                    style={{ 
                      left: `${Math.min(100, (progressoSemanal.marcadas / progressoSemanal.total) * 100)}%`,
                      transform: 'translate(-50%, -50%)',
                      top: '50%',
                      width: '20px',
                      height: '20px'
                    }}
                  >
                    <img 
                      src="/mikasa-ball.png" 
                      alt="Bola" 
                      className="w-full h-full object-contain" 
                      style={{ animation: 'spin 8s linear infinite' }} 
                    />
                  </div>
                </div>
              </div>
            )}

            {aniversariantesSemana.length > 0 && (
              <button 
                onClick={() => setShowAniversariantesModal(true)}
                className="w-full bg-[#121212] border border-amber-500/20 rounded-2xl p-4 mb-4 flex items-center justify-between transition-all active:scale-[0.98] text-left animacao-entrada shadow-lg hover:border-amber-500/40"
              >
                <div className="flex items-center gap-3">
                  <span className="text-xl">🎂</span>
                  <div>
                    <h4 className="text-white text-xs font-black uppercase tracking-wider">
                      {aniversariantesSemana.length} {aniversariantesSemana.length === 1 ? 'Aniversariante' : 'Aniversariantes'} da Semana!
                    </h4>
                    <p className="text-white/40 text-[9px] uppercase font-bold tracking-widest mt-0.5">
                      Clique para ver todos e parabenizar 🎉
                    </p>
                  </div>
                </div>
                <span className="text-amber-400 text-xs font-black">➔</span>
              </button>
            )}

            <InstallAppCard />


            {statusMensalidade.ativo && statusMensalidade.diasRestantes <= 5 && (
              <div className="bg-[#121212] border border-amber-500/30 rounded-2xl p-4 mb-4 flex items-center gap-3">
                <span className="text-xl">⏳</span>
                <div>
                  <h4 className="text-white text-xs font-black uppercase tracking-wider leading-none mb-1">
                    Seu plano está vencendo!
                  </h4>
                  <p className="text-amber-400 text-[10px] uppercase font-bold tracking-wider">
                    Faltam {statusMensalidade.diasRestantes} {statusMensalidade.diasRestantes === 1 ? 'dia' : 'dias'} para expirar seu acesso.
                  </p>
                </div>
              </div>
            )}

            <BotaoPush email={alunoDb?.email} />


            
            <h3 className="text-xl font-black uppercase tracking-tighter mb-6 text-white/90 ml-1">
              Próximas Aulas <span className="text-sm text-[#ef3340] ml-2">({dataFormatada})</span>
            </h3>

            {/* TRAVA DE MENSALIDADE: Só mapeia os cards se o aluno está ativo */}
            {statusMensalidade.ativo ? (
              turmasDoDia?.map((turma) => (
                <TurmaCard 
                  key={turma.id} 
                  turma={turma} 
                  presencasTurma={presencasDb.filter(p => p.turma_id === turma.id)} 
                  session={session} 
                  alunoDb={alunoDb} 
                  turmaIdClicada={turmaIdClicada} 
                  acaoClicada={acaoClicada} 
                  onAlternarPresenca={alternarPresenca} 
                  alunoJaMarcouAlguma={alunoJaMarcouAlguma} 
                  isHoje={isHoje}
                  limiteAtingido={progressoSemanal.concluido && !isTeacher && !isAdmin}
                  onVerAlunos={(t) => { setTurmaDetalhe(t); setAbaAtiva('turma_alunos'); }} 
                />
              ))
            ) : (
              /* TELA DE BLOQUEIO PARA ALUNOS INADIMPLENTES OU NOVOS */
              <div className="bg-[#121212] border border-[#ef3340]/20 rounded-[2rem] p-8 text-center flex flex-col items-center justify-center animacao-entrada shadow-[0_0_30px_rgba(239,51,64,0.05)] mt-4 mb-10">
                <div className="w-16 h-16 rounded-full bg-[#ef3340]/10 flex items-center justify-center text-[#ef3340] mb-5">
                  <svg xmlns="http://www.w3.org/2000/svg" width="28" height="28" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round">
                    <rect x="3" y="11" width="18" height="11" rx="2" ry="2"></rect>
                    <path d="M7 11V7a5 5 0 0 1 10 0v4"></path>
                  </svg>
                </div>
                <h4 className="text-white font-black uppercase tracking-tighter text-xl mb-2">Acesso Bloqueado</h4>
                <p className="text-white/40 text-[10px] font-black uppercase tracking-widest leading-relaxed mb-6 italic">
                  Por favor, escolha um plano de aulas para ter acesso às turmas.
                </p>
                <button 
                  onClick={() => setAbaAtiva('mensalidade')}
                  className="w-full bg-[#ef3340] text-white text-xs font-black uppercase tracking-widest py-4 rounded-xl active:scale-95 transition-all shadow-[0_0_15px_rgba(239,51,64,0.4)]"
                >
                  Ver Planos
                </button>
              </div>
            )}
          </div>
        )}

{abaAtiva === 'mensalidade' && (
  <MensalidadeView 
    onVoltar={() => setAbaAtiva('arena')} 
    alunoDb={alunoDb} 
    onAtualizarPerfil={() => carregarPerfil(session?.user?.email)} // <--- ADICIONE ISSO
  />
)}

        {abaAtiva === 'uniformes' && (
          <UniformesView onVoltar={() => setAbaAtiva('arena')} isAdmin={isAdmin} />
        )}

        {abaAtiva === 'perfil' && (
          <PerfilView onVoltar={() => setAbaAtiva('arena')} alunoDb={alunoDb} />
        )}

        {abaAtiva === 'rewards' && (
          <RewardsView onVoltar={() => setAbaAtiva('arena')} alunoDb={alunoDb} />
        )}

        {abaAtiva === 'avulso' && (
          <AvulsoView 
            onVoltar={() => setAbaAtiva('arena')} 
            alunoDb={alunoDb} 
            onAtualizarPerfil={() => carregarPerfil(session?.user?.email)} 
          />
        )}



        {abaAtiva === 'turma_alunos' && turmaDetalhe && (
          <TurmaAlunosView turma={turmaDetalhe} onVoltar={() => setAbaAtiva('arena')} />
        )}

        {abaAtiva === 'mensagens' && (
          (isAdminEfetivo || isAdmin) ? (
            <ChatAdminView onVoltar={() => setAbaAtiva('arena')} alunoDb={alunoDb} session={session} />
          ) : (
            <ChatAlunoView onVoltar={() => setAbaAtiva('arena')} alunoDb={alunoDb} session={session} />
          )
        )}

        {abaAtiva === 'admin' && (isAdminEfetivo || isAdmin || isTeacher) && (

  <div className="w-full"> 
    {viewAdmin === 'menu' ? (
      <div className="animacao-entrada px-5 pb-20 pt-4">
        <div className="flex items-center justify-between mb-8">
           <h2 className="text-2xl font-black uppercase italic tracking-tighter text-[#ef3340]">Gestão HECTH</h2>

           <button onClick={() => setAbaAtiva('arena')} className="text-[10px] font-black uppercase text-white/30">Sair</button>
        </div>
        <div className="grid grid-cols-1 gap-4">
          {/* BOTÃO NOVO: CADASTRAR ALUNO */}
          {(isAdmin || isAdminEfetivo) && (
            <button onClick={() => setViewAdmin('criar')} className="bg-[#121212] border border-[#ef3340]/20 rounded-3xl p-6 flex items-center gap-4 transition-all active:scale-95 text-left group shadow-lg">
              <div className="w-12 h-12 rounded-2xl bg-[#ef3340]/10 flex items-center justify-center text-[#ef3340]">
                <svg xmlns="http://www.w3.org/2000/svg" width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round"><path d="M16 21v-2a4 4 0 0 0-4-4H6a4 4 0 0 0-4 4v2"/><circle cx="9" cy="7" r="4"/><line x1="19" y1="8" x2="19" y2="14"/><line x1="16" y1="11" x2="22" y2="11"/></svg>
              </div>
              <div>
                <span className="font-black text-lg uppercase tracking-tighter text-white/90 block">Cadastrar Aluno</span>
                <p className="text-[10px] text-white/40 uppercase font-black tracking-widest mt-0.5">Criar Conta Direta</p>
              </div>
            </button>
          )}

          {/* BOTÃO EXCLUIR ALUNO */}
          {(isAdmin || isAdminEfetivo) && (
            <button onClick={() => setViewAdmin('deletar_aluno')} className="bg-[#121212] border border-red-500/20 rounded-3xl p-6 flex items-center gap-4 transition-all active:scale-95 text-left group shadow-lg">
              <div className="w-12 h-12 rounded-2xl bg-red-500/10 flex items-center justify-center text-red-400">
                <svg xmlns="http://www.w3.org/2000/svg" width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round"><path d="M16 21v-2a4 4 0 0 0-4-4H6a4 4 0 0 0-4 4v2"/><circle cx="9" cy="7" r="4"/><line x1="17" y1="11" x2="23" y2="11"/></svg>
              </div>
              <div>
                <span className="font-black text-lg uppercase tracking-tighter text-white/90 block">Excluir Aluno</span>
                <p className="text-[10px] text-white/40 uppercase font-black tracking-widest mt-0.5">Remover Cadastro</p>
              </div>
            </button>
          )}


          {/* EDITOR DE TURMAS */}
          <button onClick={() => setViewAdmin('turmas')} className="bg-[#121212] border border-red-500/20 rounded-3xl p-6 flex items-center gap-4 transition-all active:scale-95 text-left group shadow-lg">
            <div className="w-12 h-12 rounded-2xl bg-red-500/10 flex items-center justify-center text-red-400">
              <svg xmlns="http://www.w3.org/2000/svg" width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round"><rect x="3" y="3" width="7" height="7"/><rect x="14" y="3" width="7" height="7"/><rect x="14" y="14" width="7" height="7"/><rect x="3" y="14" width="7" height="7"/></svg>
            </div>
            <div>
              <span className="font-black text-lg uppercase tracking-tighter text-white/90 block">Editor de Turmas</span>
              <p className="text-[10px] text-white/40 uppercase font-black tracking-widest mt-0.5">Gerenciar Grade</p>
            </div>
          </button>


          {/* MENSAGENS / CENTRAL DE CHAT */}
          {(isAdmin || isAdminEfetivo) && (
            <button onClick={() => setViewAdmin('mensagens')} className="bg-[#121212] border border-purple-500/20 rounded-3xl p-6 flex items-center gap-4 transition-all active:scale-95 text-left group shadow-lg">
              <div className="w-12 h-12 rounded-2xl bg-purple-500/10 flex items-center justify-center text-purple-400">
                <svg xmlns="http://www.w3.org/2000/svg" width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round"><path d="M21 15a2 2 0 0 1-2 2H7l-4 4V5a2 2 0 0 1 2-2h14a2 2 0 0 1 2 2z"/></svg>
              </div>
              <div>
                <span className="font-black text-lg uppercase tracking-tighter text-white/90 block">Mensagens</span>
                <p className="text-[10px] text-white/40 uppercase font-black tracking-widest mt-0.5">Central de Chats</p>
              </div>
            </button>
          )}

          {/* BOTÃO NOVO: APROVAR ALUNOS */}
          {(isAdmin || isAdminEfetivo) && (
            <button onClick={() => setViewAdmin('aprovar')} className="bg-[#121212] border border-white/10 rounded-3xl p-6 flex items-center gap-4 transition-all active:scale-95 text-left group shadow-lg relative">
              <div className="w-12 h-12 rounded-2xl bg-orange-500/10 flex items-center justify-center text-orange-400">
                <svg xmlns="http://www.w3.org/2000/svg" width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round"><path d="M16 21v-2a4 4 0 0 0-4-4H6a4 4 0 0 0-4 4v2"/><circle cx="9" cy="7" r="4"/><line x1="19" y1="8" x2="19" y2="14"/><line x1="16" y1="11" x2="22" y2="11"/></svg>
              </div>
              <div>
                <span className="font-black text-lg uppercase tracking-tighter text-white/90 block">Aprovar Alunos</span>
                <p className="text-[10px] text-white/40 uppercase font-black tracking-widest mt-0.5">Novos Cadastros</p>
              </div>
              {totalCadastrosPendentes > 0 && (
                <span className="absolute top-4 right-4 bg-[#ef3340] text-white text-[10px] font-black min-w-5 h-5 px-1.5 rounded-full flex items-center justify-center shadow-[0_0_10px_rgba(239,51,64,0.4)] border border-black/20">
                  {totalCadastrosPendentes}
                </span>
              )}
            </button>
          )}


          {/* BASE DE ATLETAS */}
          {(isAdmin || isAdminEfetivo) && (
            <button onClick={() => setViewAdmin('alunos')} className="bg-[#121212] border border-white/5 rounded-3xl p-6 flex items-center gap-4 transition-all active:scale-95 text-left group">
              <div className="w-12 h-12 rounded-2xl bg-blue-500/10 flex items-center justify-center text-blue-400">
                <svg xmlns="http://www.w3.org/2000/svg" width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round"><path d="M16 21v-2a4 4 0 0 0-4-4H6a4 4 0 0 0-4 4v2"/><circle cx="9" cy="7" r="4"/><path d="M22 21v-2a4 4 0 0 0-3-3.87"/><path d="M16 3.13a4 4 0 0 1 0 7.75"/></svg>
              </div>
              <div>
                <span className="font-black text-lg uppercase tracking-tighter text-white/90 block">Base de Atletas</span>
                <p className="text-[10px] text-white/40 uppercase font-black tracking-widest mt-0.5">Gerenciar Ativos</p>
              </div>
            </button>
          )}

          {/* NOVOS PAGAMENTOS */}
          {(isAdmin || isAdminEfetivo) && (
            <button onClick={() => setViewAdmin('pagamentos')} className="bg-[#121212] border border-white/5 rounded-3xl p-6 flex items-center gap-4 transition-all active:scale-95 text-left group relative">
              <div className="w-12 h-12 rounded-2xl bg-green-500/10 flex items-center justify-center text-green-400">
                <svg xmlns="http://www.w3.org/2000/svg" width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round"><rect x="2" y="5" width="20" height="14" rx="2"/><line x1="2" y1="10" x2="22" y2="10"/></svg>
              </div>
              <div>
                <span className="font-black text-lg uppercase tracking-tighter text-white/90 block">Novos Pagamentos</span>
                <p className="text-[10px] text-white/40 uppercase font-black tracking-widest mt-0.5">Validar Comprovantes</p>
              </div>
              {totalPagamentosPendentes > 0 && (
                <span className="absolute top-4 right-4 bg-[#ef3340] text-white text-[10px] font-black min-w-5 h-5 px-1.5 rounded-full flex items-center justify-center shadow-[0_0_10px_rgba(239,51,64,0.4)] border border-black/20">
                  {totalPagamentosPendentes}
                </span>
              )}
            </button>
          )}


          {/* QR CODE DO APP */}
          {(isAdmin || isAdminEfetivo) && (
            <button onClick={() => setShowQrCodeModal(true)} className="bg-[#121212] border border-purple-500/20 rounded-3xl p-6 flex items-center gap-4 transition-all active:scale-95 text-left group">
              <div className="w-12 h-12 rounded-2xl bg-purple-500/10 flex items-center justify-center text-purple-400">
                <svg xmlns="http://www.w3.org/2000/svg" width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round"><rect x="3" y="3" width="7" height="7"/><rect x="14" y="3" width="7" height="7"/><rect x="14" y="14" width="7" height="7"/><rect x="3" y="14" width="7" height="7"/></svg>
              </div>
              <div>
                <span className="font-black text-lg uppercase tracking-tighter text-white/90 block">QR Code do App</span>
                <p className="text-[10px] text-white/40 uppercase font-black tracking-widest mt-0.5">Escanear no Celular</p>
              </div>
            </button>
          )}

          {/* QR CODE BAIXAR */}
          <button onClick={() => setShowQrCodeBaixarModal(true)} className="bg-[#121212] border border-amber-500/20 rounded-3xl p-6 flex items-center gap-4 transition-all active:scale-95 text-left group">
            <div className="w-12 h-12 rounded-2xl bg-amber-500/10 flex items-center justify-center text-amber-400">
              <svg xmlns="http://www.w3.org/2000/svg" width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round"><path d="M21 15v4a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2v-4"/><polyline points="7 10 12 15 17 10"/><line x1="12" x2="12" y1="15" y2="3"/></svg>
            </div>
            <div>
              <span className="font-black text-lg uppercase tracking-tighter text-white/90 block">QR Code Baixar</span>
              <p className="text-[10px] text-white/40 uppercase font-black tracking-widest mt-0.5">Baixar Aplicativo</p>
            </div>
          </button>


          {/* QR CODE PIX UNIFORMES */}
          {(isAdmin || isAdminEfetivo) && (
            <button onClick={() => setPixModalTipo('uniformes')} className="bg-[#121212] border border-teal-500/20 rounded-3xl p-6 flex items-center gap-4 transition-all active:scale-95 text-left group">
              <div className="w-12 h-12 rounded-2xl bg-teal-500/10 flex items-center justify-center text-teal-400 font-black text-xl">
                ❖
              </div>
              <div>
                <span className="font-black text-lg uppercase tracking-tighter text-white/90 block">QR Code Uniformes</span>
                <p className="text-[10px] text-white/40 uppercase font-black tracking-widest mt-0.5">Pagamento PIX</p>
              </div>
            </button>
          )}

          {/* QR CODE PIX MENSALIDADE */}
          {(isAdmin || isAdminEfetivo) && (
            <button onClick={() => setPixModalTipo('mensalidade')} className="bg-[#121212] border border-emerald-500/20 rounded-3xl p-6 flex items-center gap-4 transition-all active:scale-95 text-left group">
              <div className="w-12 h-12 rounded-2xl bg-emerald-500/10 flex items-center justify-center text-emerald-400 font-black text-xl">
                ❖
              </div>
              <div>
                <span className="font-black text-lg uppercase tracking-tighter text-white/90 block">QR Code Mensalidade</span>
                <p className="text-[10px] text-white/40 uppercase font-black tracking-widest mt-0.5">Pagamento PIX</p>
              </div>
            </button>
          )}

          {/* EXPORTAR PLANILHA EXCEL */}
          {(isAdmin || isAdminEfetivo) && (
            <>
              <input 
                type="file" 
                accept=".xlsx" 
                ref={excelInputRef} 
                onChange={handleUploadEAnexarExcel} 
                className="hidden" 
              />
              <button onClick={handleExportarExcel} className="bg-[#121212] border border-blue-500/30 rounded-3xl p-6 flex items-center gap-4 transition-all active:scale-95 text-left group shadow-lg">
                <div className="w-12 h-12 rounded-2xl bg-blue-500/10 flex items-center justify-center text-blue-400">
                  <svg xmlns="http://www.w3.org/2000/svg" width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round"><path d="M14 2H6a2 2 0 0 0-2 2v16a2 2 0 0 0 2 2h12a2 2 0 0 0 2-2V8z"/><polyline points="14 2 14 8 20 8"/><line x1="16" x2="8" y1="13" y2="13"/><line x1="16" x2="8" y1="17" y2="17"/><polyline points="10 9 9 9 8 9"/></svg>
                </div>
                <div>
                  <span className="font-black text-lg uppercase tracking-tighter text-white/90 block">Exportar Planilha</span>
                  <p className="text-[10px] text-white/40 uppercase font-black tracking-widest mt-0.5">Exportar Relatório Excel</p>
                </div>
              </button>
            </>
          )}

          {/* CENTRAL PUSH */}
          {(isAdmin || isAdminEfetivo) && (
            <button onClick={() => setViewAdmin('notificacoes')} className="bg-[#121212] border border-[#ef3340]/20 rounded-3xl p-6 flex items-center gap-4 transition-all active:scale-95 text-left group shadow-lg">
              <div className="w-12 h-12 rounded-2xl bg-[#ef3340]/10 flex items-center justify-center text-[#ef3340]">
                <svg xmlns="http://www.w3.org/2000/svg" width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round"><path d="M18 8A6 6 0 0 0 6 8c0 7-3 9-3 9h18s-3-2-3-9"/><path d="M13.73 21a2 2 0 0 1-3.46 0"/></svg>
              </div>
              <div>
                <span className="font-black text-lg uppercase tracking-tighter text-white/90 block">Central Push</span>
                <p className="text-[10px] text-white/40 uppercase font-black tracking-widest mt-0.5">Disparar Avisos</p>
              </div>
            </button>
          )}

          {/* CONFIGURAR PREÇOS */}
          {(isAdmin || isAdminEfetivo) && (
            <button onClick={() => setViewAdmin('precos')} className="bg-[#121212] border border-yellow-500/20 rounded-3xl p-6 flex items-center gap-4 transition-all active:scale-95 text-left group shadow-lg">
              <div className="w-12 h-12 rounded-2xl bg-yellow-500/10 flex items-center justify-center text-yellow-400">
                <svg xmlns="http://www.w3.org/2000/svg" width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round"><line x1="12" y1="1" x2="12" y2="23"/><path d="M17 5H9.5a3.5 3.5 0 0 0 0 7h5a3.5 3.5 0 0 1 0 7H6"/></svg>
              </div>
              <div>
                <span className="font-black text-lg uppercase tracking-tighter text-white/90 block">Configurar Preços</span>
                <p className="text-[10px] text-white/40 uppercase font-black tracking-widest mt-0.5">Tabela de Preços & PIX</p>
              </div>
            </button>
          )}


          {/* FAIXAS DE PERFIL */}
          {(isAdmin || isAdminEfetivo) && (
            <button onClick={() => setViewAdmin('faixas')} className="bg-[#121212] border border-amber-500/20 rounded-3xl p-6 flex items-center gap-4 transition-all active:scale-95 text-left group shadow-lg">
              <div className="w-12 h-12 rounded-2xl bg-amber-500/10 flex items-center justify-center text-amber-400">
                <svg xmlns="http://www.w3.org/2000/svg" width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round">
                  <path d="M4 15s1-1 4-1 5 2 8 2 4-1 4-1V3s-1 1-4 1-5-2-8-2-4 1-4 1z"/><line x1="4" y1="22" x2="4" y2="15"/>
                </svg>
              </div>
              <div>
                <span className="font-black text-lg uppercase tracking-tighter text-white/90 block">Faixas de Perfil</span>
                <p className="text-[10px] text-white/40 uppercase font-black tracking-widest mt-0.5">Badges & Banners</p>
              </div>
            </button>
          )}


          {/* AULAS EXPERIMENTAIS */}
          {(isAdmin || isTeacher) && (
            <button onClick={() => setViewAdmin('experimental')} className="bg-[#121212] border border-orange-500/20 rounded-3xl p-6 flex items-center gap-4 transition-all active:scale-95 text-left group shadow-lg">
              <div className="w-12 h-12 rounded-2xl bg-orange-500/10 flex items-center justify-center text-orange-400 text-lg">
                🧪
              </div>
              <div>
                <span className="font-black text-lg uppercase tracking-tighter text-white/90 block">Aulas Experimentais</span>
                <p className="text-[10px] text-white/40 uppercase font-black tracking-widest mt-0.5">Agendar Visitantes</p>
              </div>
            </button>
          )}



        </div>
      </div>

    ) : viewAdmin === 'alunos' ? (
      <AdminAlunosView onVoltar={() => setViewAdmin('menu')} />
    ) : viewAdmin === 'pagamentos' ? (
      <AdminPagamentosView onVoltar={() => setViewAdmin('menu')} />
    ) : viewAdmin === 'criar' ? (
      <AdminCriarAlunoView onVoltar={() => setViewAdmin('menu')} />
    ) : viewAdmin === 'mensagens' ? (
      <ChatAdminView onVoltar={() => setViewAdmin('menu')} alunoDb={alunoDb} session={session} />
    ) : viewAdmin === 'turmas' ? (
      <AdminTurmasView onVoltar={() => setViewAdmin('menu')} />
    ) : viewAdmin === 'deletar_aluno' ? (
      <AdminDeletarAlunoView onVoltar={() => setViewAdmin('menu')} />
    ) : viewAdmin === 'notificacoes' ? (
      <AdminNotificacoesView onVoltar={() => setViewAdmin('menu')} />
    ) : viewAdmin === 'precos' ? (
      <AdminPrecosView onVoltar={() => setViewAdmin('menu')} />
    ) : viewAdmin === 'experimental' ? (
      <AdminExperimentalView onVoltar={() => setViewAdmin('menu')} alunoDb={alunoDb} />
    ) : viewAdmin === 'faixas' ? (
      <AdminFaixasView onVoltar={() => setViewAdmin('menu')} />
    ) : (
      <AdminAprovarView onVoltar={() => setViewAdmin('menu')} />
    )}



  </div>
)}

        <QrCodeModal 
          isOpen={showQrCodeModal} 
          onClose={() => setShowQrCodeModal(false)} 
        />

        <QrCodeBaixarModal 
          isOpen={showQrCodeBaixarModal} 
          onClose={() => setShowQrCodeBaixarModal(false)} 
        />

        {showAniversariantesModal && (
          <div 
            onClick={() => setShowAniversariantesModal(false)}
            className="fixed inset-0 bg-black/85 backdrop-blur-md z-[99999] flex items-center justify-center p-4 animate-fadeIn"
          >
            <div 
              onClick={(e) => e.stopPropagation()}
              className="bg-[#121212] border border-amber-500/30 rounded-[2rem] p-6 max-w-md w-full text-center shadow-2xl relative flex flex-col items-center"
            >
              <button 
                onClick={() => setShowAniversariantesModal(false)} 
                className="absolute top-5 right-5 text-white/40 hover:text-white font-black text-lg p-1 transition-colors"
              >
                ✕
              </button>

              <div className="w-14 h-14 rounded-2xl bg-amber-500/10 border border-amber-500/20 flex items-center justify-center text-amber-400 mb-3 text-2xl">
                🎂
              </div>

              <h3 className="font-black text-xl text-white uppercase italic tracking-tight mb-1">
                Aniversariantes da Semana
              </h3>
              <p className="text-[10px] text-white/50 font-black uppercase tracking-widest mb-6">
                Parabéns aos atletas aniversariantes! 🎉
              </p>

              {/* Grid com as Bolinhas dos Alunos + Chapeuzinho */}
              <div className="grid grid-cols-3 gap-4 w-full max-h-80 overflow-y-auto pr-1 pb-2">
                {aniversariantesSemana.map((aluno: any) => {
                  const primeiroNome = aluno.nome?.split(' ')[0] || 'Atleta';
                  const sobrenomeAbrev = aluno.sobrenome ? `${aluno.sobrenome.split(' ')[0]}` : '';

                  return (
                    <div 
                      key={aluno.id} 
                      className={`flex flex-col items-center text-center p-3 rounded-2xl border transition-all ${aluno.isHoje ? 'border-amber-400/60 bg-amber-500/10 shadow-[0_0_15px_rgba(251,191,36,0.15)]' : 'border-white/5 bg-white/5'}`}
                    >
                      {/* Avatar com Chapeuzinho */}
                      <div className="relative mb-2 mt-1">
                        <span 
                          className="absolute -top-3.5 -right-1.5 text-base select-none filter drop-shadow-[0_2px_4px_rgba(0,0,0,0.8)] z-10"
                          title="Parabéns!"
                        >
                          🥳
                        </span>

                        <div className={`w-14 h-14 rounded-full border-2 p-[1.5px] bg-[#1a1a1a] shadow-lg ${aluno.isHoje ? 'border-amber-400' : 'border-amber-500/40'}`}>
                          <div className="w-full h-full rounded-full overflow-hidden flex items-center justify-center bg-gray-800">
                            {aluno.foto_url ? (
                              <img src={aluno.foto_url} alt={aluno.nome} className="w-full h-full object-cover" />
                            ) : (
                              <span className="text-white/80 font-black text-sm">
                                {aluno.nome?.charAt(0)?.toUpperCase()}
                              </span>
                            )}
                          </div>
                        </div>
                      </div>

                      {/* Nome */}
                      <span className="text-white font-bold text-xs leading-tight truncate w-full">
                        {primeiroNome}
                      </span>
                      {sobrenomeAbrev && (
                        <span className="text-white/50 text-[10px] leading-none truncate w-full mt-0.5">
                          {sobrenomeAbrev}
                        </span>
                      )}

                      {/* Dia e Data */}
                      <span className={`text-[8px] font-black uppercase tracking-wider mt-2 px-2 py-0.5 rounded-full ${aluno.isHoje ? 'bg-amber-400 text-black font-black' : 'text-amber-400 bg-amber-500/10 border border-amber-500/20'}`}>
                        {aluno.isHoje ? 'Hoje!' : `${aluno.diaNome.slice(0, 3)} ${aluno.dataFormatada}`}
                      </span>
                    </div>
                  );
                })}
              </div>
            </div>
          </div>
        )}





        {modalRedefinirSenha && (
          <div className="fixed inset-0 z-[100] bg-black/85 backdrop-blur-md flex items-center justify-center p-4">
            <div className="bg-[#1a1a1a] border border-[#ef3340]/40 p-8 rounded-[2rem] max-w-sm w-full animacao-entrada text-left shadow-[0_0_50px_rgba(239,51,64,0.2)]">
              <div className="text-center mb-6">
                <div className="w-14 h-14 rounded-full bg-[#ef3340]/10 border border-[#ef3340]/30 flex items-center justify-center text-2xl mx-auto mb-3">
                  🔐
                </div>
                <h3 className="text-white font-black uppercase tracking-tight text-xl leading-none">Confirmação de Acesso</h3>
                <p className="text-white/40 text-[10px] uppercase font-black tracking-widest mt-2 leading-relaxed">
                  Confirme seus dados e crie sua senha pessoal para continuar.
                </p>
              </div>

              <form onSubmit={salvarNovaSenha} className="flex flex-col gap-4">
                {/* CAMPO DE DATA DE NASCIMENTO */}
                <div>
                  <div className="flex items-center justify-between mb-1.5">
                    <label className="text-[9px] font-black uppercase tracking-widest text-white/40 block">Data de Nascimento</label>
                    {alunoDb?.data_nascimento && (
                      <span className="text-[9px] font-bold text-green-400/80 bg-green-500/10 px-2 py-0.5 rounded-full">Já Cadastrado</span>
                    )}
                  </div>
                  {alunoDb?.data_nascimento ? (
                    <input 
                      type="text" 
                      disabled 
                      value={(() => {
                        const parts = String(alunoDb.data_nascimento).split('-');
                        if (parts.length === 3) return `${parts[2]}/${parts[1]}/${parts[0]}`;
                        return alunoDb.data_nascimento;
                      })()}
                      className="w-full bg-white/5 border border-white/5 rounded-xl px-4 py-3.5 text-white/40 cursor-not-allowed text-sm font-bold opacity-60"
                    />
                  ) : (
                    <input 
                      type="date" 
                      required 
                      value={dataNascimentoPrimeiroLogin}
                      onChange={(e) => setDataNascimentoPrimeiroLogin(e.target.value)}
                      className="w-full bg-white/5 border border-[#ef3340]/40 rounded-xl px-4 py-3.5 text-white outline-none focus:ring-1 focus:ring-[#ef3340] text-sm font-bold"
                    />
                  )}
                  {!alunoDb?.data_nascimento && (
                    <span className="text-[8px] font-bold text-amber-400/80 mt-1 block">
                      * Campo obrigatório para confirmação do seu cadastro
                    </span>
                  )}
                </div>

                <div>
                  <label className="text-[9px] font-black uppercase tracking-widest text-white/40 mb-1.5 block">Nova Senha (mín. 6 caracteres)</label>
                  <input 
                    type="password" 
                    required 
                    placeholder="••••••••"
                    value={novaSenha}
                    onChange={(e) => setNovaSenha(e.target.value)}
                    className="w-full bg-white/5 border border-white/10 rounded-xl px-4 py-3.5 text-white outline-none focus:ring-1 focus:ring-[#ef3340] text-sm font-bold"
                  />
                </div>

                <div>
                  <label className="text-[9px] font-black uppercase tracking-widest text-white/40 mb-1.5 block">Confirmar Nova Senha</label>
                  <input 
                    type="password" 
                    required 
                    placeholder="••••••••"
                    value={confirmNovaSenha}
                    onChange={(e) => setConfirmNovaSenha(e.target.value)}
                    className="w-full bg-white/5 border border-white/10 rounded-xl px-4 py-3.5 text-white outline-none focus:ring-1 focus:ring-[#ef3340] text-sm font-bold"
                  />
                </div>

                <button 
                  type="submit" 
                  disabled={salvandoNovaSenha} 
                  className="w-full bg-gradient-to-r from-orange-500 to-[#ef3340] text-white text-[11px] font-black uppercase tracking-widest py-4 rounded-xl active:scale-95 transition-all shadow-[0_0_15px_rgba(239,51,64,0.3)] disabled:opacity-50 mt-2"
                >
                  {salvandoNovaSenha ? 'Salvando...' : 'Salvar e Acessar'}
                </button>

                <button 
                  type="button" 
                  onClick={() => setModalRedefinirSenha(false)} 
                  className="w-full border border-white/10 bg-white/5 text-white/60 text-[10px] font-black uppercase tracking-widest py-3 rounded-xl transition-all active:scale-95 text-center"
                >
                  Fechar
                </button>
              </form>
            </div>
          </div>
        )}


        <PixQrCodeModal 
          isOpen={!!pixModalTipo} 
          onClose={() => setPixModalTipo(null)} 
          tipo={pixModalTipo}
        />
      </main>
    </div>
  );
}