// src/components/AdminFaixasView.tsx
"use client";
import { useState, useEffect, useRef } from 'react';
import { supabase } from '../lib/supabase';
import { fileToBase64 } from '../utils/imagem';

interface AdminFaixasViewProps {
  onVoltar: () => void;
}

export function AdminFaixasView({ onVoltar }: AdminFaixasViewProps) {
  const [faixas, setFaixas] = useState<any[]>([]);
  const [alunos, setAlunos] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);

  // Form de criação de nova faixa
  const [nomeFaixa, setNomeFaixa] = useState('');
  const [imagemPreview, setImagemPreview] = useState<string | null>(null);
  const [criandoFaixa, setCriandoFaixa] = useState(false);
  const fileInputRef = useRef<HTMLInputElement | null>(null);

  // Modal de atribuição de alunos
  const [faixaSelecionada, setFaixaSelecionada] = useState<any | null>(null);
  const [buscaAluno, setBuscaAluno] = useState('');
  const [alunosPermitidosIds, setAlunosPermitidosIds] = useState<string[]>([]);
  const [salvandoPermissoes, setSalvandoPermissoes] = useState(false);

  useEffect(() => {
    carregarDados();
  }, []);

  async function carregarDados() {
    setLoading(true);
    try {
      const { data: faixasData, error: errFaixas } = await supabase
        .from('faixas')
        .select('*')
        .order('created_at', { ascending: false });

      if (!errFaixas && faixasData) {
        setFaixas(faixasData);
      }

      const { data: alunosData, error: errAlunos } = await supabase
        .from('alunos')
        .select('id, nome, sobrenome, email, foto_url, nivel')
        .eq('status', 'aprovado')
        .order('nome', { ascending: true });

      if (!errAlunos && alunosData) {
        setAlunos(alunosData);
      }
    } catch (err: any) {
      console.error('Erro ao carregar faixas:', err);
    } finally {
      setLoading(false);
    }
  }

  const handleFileChange = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    try {
      const base64 = await fileToBase64(file, 800, 0.85);
      setImagemPreview(base64);
    } catch (err: any) {
      alert('Erro ao processar imagem: ' + err.message);
    }
  };

  const handleCriarFaixa = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!nomeFaixa.trim()) {
      alert('Informe o nome da faixa.');
      return;
    }
    if (!imagemPreview) {
      alert('Faça o upload da imagem da faixa.');
      return;
    }

    setCriandoFaixa(true);
    try {
      const novaFaixa = {
        id: 'faixa_' + Date.now(),
        nome: nomeFaixa.trim(),
        imagem_url: imagemPreview,
        alunos_permitidos: [],
        created_at: new Date().toISOString()
      };

      const { error } = await supabase.from('faixas').insert([novaFaixa]);
      if (error) throw error;

      alert('✅ Faixa de perfil criada com sucesso!');
      setNomeFaixa('');
      setImagemPreview(null);
      if (fileInputRef.current) fileInputRef.current.value = '';
      carregarDados();
    } catch (err: any) {
      alert('Erro ao criar faixa: ' + err.message);
    } finally {
      setCriandoFaixa(false);
    }
  };

  const handleExcluirFaixa = async (faixaId: string, nome: string) => {
    if (!confirm('Deseja realmente excluir a faixa "' + nome + '"?')) return;

    try {
      const { error } = await supabase.from('faixas').delete().eq('id', faixaId);
      if (error) throw error;
      alert('Faixa excluída com sucesso.');
      carregarDados();
    } catch (err: any) {
      alert('Erro ao excluir faixa: ' + err.message);
    }
  };

  const abrirModalPermissoes = (faixa: any) => {
    setFaixaSelecionada(faixa);
    setAlunosPermitidosIds(faixa.alunos_permitidos || []);
    setBuscaAluno('');
  };

  const togglePermissaoAluno = (email: string) => {
    setAlunosPermitidosIds(prev => 
      prev.includes(email) ? prev.filter(e => e !== email) : [...prev, email]
    );
  };

  const handleSelecionarTodos = () => {
    const emailsFiltrados = alunosFiltrados.map(a => a.email);
    const todosJaEstao = emailsFiltrados.every(e => alunosPermitidosIds.includes(e));
    if (todosJaEstao) {
      setAlunosPermitidosIds(prev => prev.filter(e => !emailsFiltrados.includes(e)));
    } else {
      setAlunosPermitidosIds(prev => Array.from(new Set([...prev, ...emailsFiltrados])));
    }
  };

  const handleSalvarPermissoes = async () => {
    if (!faixaSelecionada) return;
    setSalvandoPermissoes(true);
    try {
      const { error } = await supabase
        .from('faixas')
        .update({ alunos_permitidos: alunosPermitidosIds })
        .eq('id', faixaSelecionada.id);

      if (error) throw error;

      alert('✅ Permissões salvas com sucesso!');
      setFaixaSelecionada(null);
      carregarDados();
    } catch (err: any) {
      alert('Erro ao salvar permissões: ' + err.message);
    } finally {
      setSalvandoPermissoes(false);
    }
  };

  const alunosFiltrados = alunos.filter(a => {
    const termo = buscaAluno.toLowerCase().trim();
    const nomeCompleto = ((a.nome || '') + ' ' + (a.sobrenome || '') + ' ' + (a.email || '')).toLowerCase();
    return nomeCompleto.includes(termo);
  });

  return (
    <div className="animacao-entrada px-4 pb-20 pt-4 max-w-lg mx-auto">
      <div className="flex items-center justify-between mb-6">
        <div>
          <h2 className="text-2xl font-black uppercase italic tracking-tight text-[#ef3340]">
            Faixas de Perfil
          </h2>
          <p className="text-[10px] text-white/40 uppercase font-black tracking-widest mt-0.5">
            Gerenciar badges e banners dos atletas
          </p>
        </div>
        <button 
          onClick={onVoltar} 
          className="text-xs font-black uppercase tracking-widest text-white/40 hover:text-white transition-colors bg-white/5 border border-white/10 px-3 py-2 rounded-xl"
        >
          Voltar
        </button>
      </div>

      <div className="bg-[#121212] border border-white/5 rounded-3xl p-6 mb-8 shadow-xl">
        <h3 className="text-sm font-black uppercase tracking-wider text-white mb-4 flex items-center gap-2">
          Nova Faixa de Perfil
        </h3>


        <form onSubmit={handleCriarFaixa} className="flex flex-col gap-4">
          <div>
            <label className="text-[9px] font-black uppercase tracking-widest text-white/40 block mb-1">
              Nome da Faixa / Título
            </label>
            <input 
              type="text" 
              required 
              placeholder="Ex: Campeão Torneio Verão, Atleta Destaque..."
              value={nomeFaixa}
              onChange={(e) => setNomeFaixa(e.target.value)}
              className="w-full bg-white/5 border border-white/10 rounded-xl px-4 py-3 text-white text-xs font-bold outline-none focus:ring-1 focus:ring-[#ef3340]"
            />
          </div>

          <div>
            <label className="text-[9px] font-black uppercase tracking-widest text-white/40 block mb-1">
              Imagem / Banner da Faixa
            </label>
            <input 
              type="file" 
              accept="image/*" 
              ref={fileInputRef}
              onChange={handleFileChange}
              className="hidden" 
            />

            {imagemPreview ? (
              <div className="relative rounded-2xl overflow-hidden border border-amber-500/30 bg-black/40 p-2 group">
                <img 
                  src={imagemPreview} 
                  alt="Preview" 
                  className="w-full h-24 object-cover rounded-xl"
                />
                <button 
                  type="button"
                  onClick={() => fileInputRef.current?.click()}
                  className="absolute inset-0 bg-black/60 opacity-0 group-hover:opacity-100 flex items-center justify-center text-xs font-black uppercase tracking-wider text-white transition-opacity"
                >
                  Trocar Imagem
                </button>
              </div>
            ) : (
              <button 
                type="button"
                onClick={() => fileInputRef.current?.click()}
                className="w-full border-2 border-dashed border-white/10 hover:border-white/20 rounded-2xl py-6 flex flex-col items-center justify-center gap-2 text-white/40 hover:text-white/60 transition-all bg-white/[0.02]"
              >
                <span className="text-2xl">🖼️</span>
                <span className="text-[10px] font-black uppercase tracking-widest">
                  Clique para subir a imagem da faixa
                </span>
              </button>
            )}
          </div>

          <button 
            type="submit" 
            disabled={criandoFaixa}
            className="w-full bg-[#ef3340] hover:bg-red-600 text-white text-xs font-black uppercase tracking-widest py-3.5 rounded-xl active:scale-95 transition-all shadow-[0_0_15px_rgba(239,51,64,0.3)] disabled:opacity-50 mt-2"
          >
            {criandoFaixa ? 'Criando Faixa...' : 'Criar Faixa'}
          </button>
        </form>
      </div>

      <div className="space-y-4">
        <h3 className="text-xs font-black uppercase tracking-widest text-white/60 ml-1">
          Faixas Cadastradas ({faixas.length})
        </h3>

        {loading ? (
          <div className="text-center py-10 text-white/20 text-xs font-black uppercase tracking-widest animate-pulse">
            Carregando faixas...
          </div>
        ) : faixas.length === 0 ? (
          <div className="bg-[#121212] border border-white/5 rounded-3xl p-8 text-center text-white/30 text-xs font-black uppercase tracking-widest">
            Nenhuma faixa cadastrada ainda.
          </div>
        ) : (
          faixas.map(faixa => {
            const totalAlunos = faixa.alunos_permitidos?.length || 0;
            return (
              <div 
                key={faixa.id}
                className="bg-[#121212] border border-white/5 rounded-3xl p-5 relative overflow-hidden shadow-lg group hover:border-white/10 transition-all"
              >
                <div className="relative h-28 rounded-2xl overflow-hidden mb-4 border border-white/10 bg-black/50">
                  <img 
                    src={faixa.imagem_url} 
                    alt={faixa.nome} 
                    className="w-full h-full object-cover"
                  />
                  <div className="absolute inset-0 bg-gradient-to-t from-black/80 via-black/20 to-transparent flex items-end p-3">
                    <span className="text-white font-black text-sm uppercase italic tracking-tight drop-shadow-md">
                      {faixa.nome}
                    </span>
                  </div>
                </div>

                <div className="flex items-center justify-between">
                  <div>
                    <span className="text-[10px] font-black uppercase tracking-widest text-amber-400 bg-amber-500/10 border border-amber-500/20 px-2.5 py-1 rounded-full">
                      {totalAlunos} {totalAlunos === 1 ? 'atleta liberado' : 'atletas liberados'}
                    </span>
                  </div>

                  <div className="flex items-center gap-2">
                    <button 
                      onClick={() => abrirModalPermissoes(faixa)}
                      className="bg-white/10 hover:bg-white/15 text-white text-[10px] font-black uppercase tracking-wider px-3.5 py-2 rounded-xl active:scale-95 transition-all"
                    >
                      👥 Atribuir Alunos
                    </button>
                    <button 
                      onClick={() => handleExcluirFaixa(faixa.id, faixa.nome)}
                      className="bg-red-500/10 hover:bg-red-500/20 text-red-400 text-[10px] font-black uppercase tracking-wider p-2 rounded-xl active:scale-95 transition-all"
                      title="Excluir Faixa"
                    >
                      🗑️
                    </button>
                  </div>
                </div>
              </div>
            );
          })
        )}
      </div>

      {faixaSelecionada && (
        <div 
          onClick={() => setFaixaSelecionada(null)}
          className="fixed inset-0 bg-black/85 backdrop-blur-md z-[99999] flex items-center justify-center p-4 animate-fadeIn"
        >
          <div 
            onClick={(e) => e.stopPropagation()}
            className="bg-[#121212] border border-amber-500/30 rounded-[2rem] p-6 max-w-md w-full shadow-2xl relative flex flex-col max-h-[85vh]"
          >
            <div className="flex items-center justify-between pb-4 border-b border-white/5 mb-4">
              <div>
                <h3 className="font-black text-base text-white uppercase italic tracking-tight">
                  Liberar Faixa
                </h3>
                <p className="text-[10px] text-amber-400 font-bold uppercase tracking-wider">
                  {faixaSelecionada.nome}
                </p>
              </div>
              <button 
                onClick={() => setFaixaSelecionada(null)}
                className="text-white/40 hover:text-white font-black text-lg p-1"
              >
                ✕
              </button>
            </div>

            <div className="mb-3">
              <input 
                type="text" 
                placeholder="Buscar aluno por nome ou email..."
                value={buscaAluno}
                onChange={(e) => setBuscaAluno(e.target.value)}
                className="w-full bg-white/5 border border-white/10 rounded-xl px-3.5 py-2.5 text-white text-xs font-bold outline-none focus:ring-1 focus:ring-amber-400"
              />
            </div>

            <div className="flex items-center justify-between mb-3 text-[10px] font-black uppercase tracking-wider text-white/40">
              <span>{alunosPermitidosIds.length} selecionados</span>
              <button 
                type="button" 
                onClick={handleSelecionarTodos}
                className="text-amber-400 hover:underline"
              >
                Marcar / Desmarcar Todos
              </button>
            </div>

            <div className="flex-1 overflow-y-auto space-y-2 pr-1 mb-4">
              {alunosFiltrados.length === 0 ? (
                <div className="text-center py-8 text-white/20 text-xs font-black uppercase">
                  Nenhum aluno encontrado.
                </div>
              ) : (
                alunosFiltrados.map(a => {
                  const selecionado = alunosPermitidosIds.includes(a.email);
                  return (
                    <div 
                      key={a.id}
                      onClick={() => togglePermissaoAluno(a.email)}
                      className={'flex items-center justify-between p-3 rounded-2xl border cursor-pointer transition-all ' + (
                        selecionado 
                          ? 'border-amber-400/50 bg-amber-500/10 shadow-[0_0_10px_rgba(251,191,36,0.1)]' 
                          : 'border-white/5 bg-white/5 hover:border-white/10'
                      )}
                    >
                      <div className="flex items-center gap-3">
                        <div className="w-9 h-9 rounded-full overflow-hidden border border-white/10 bg-gray-800 shrink-0">
                          {a.foto_url ? (
                            <img src={a.foto_url} alt="" className="w-full h-full object-cover" />
                          ) : (
                            <span className="text-white/60 font-black text-xs flex items-center justify-center h-full">
                              {a.nome?.charAt(0)}
                            </span>
                          )}
                        </div>
                        <div className="text-left">
                          <span className="text-xs font-black uppercase text-white block leading-tight">
                            {a.nome} {a.sobrenome}
                          </span>
                          <span className="text-[9px] text-white/40 block truncate max-w-[180px]">
                            {a.email}
                          </span>
                        </div>
                      </div>

                      <div className={'w-5 h-5 rounded-lg border flex items-center justify-center text-xs font-black transition-all ' + (
                        selecionado 
                          ? 'bg-amber-400 border-amber-400 text-black' 
                          : 'border-white/20 bg-white/5'
                      )}>
                        {selecionado ? '✓' : ''}
                      </div>
                    </div>
                  );
                })
              )}
            </div>

            <div className="pt-3 border-t border-white/5 flex gap-3">
              <button 
                type="button" 
                onClick={() => setFaixaSelecionada(null)}
                className="flex-1 bg-white/5 border border-white/10 text-white/60 text-xs font-black uppercase tracking-wider py-3 rounded-xl"
              >
                Cancelar
              </button>
              <button 
                type="button"
                onClick={handleSalvarPermissoes}
                disabled={salvandoPermissoes}
                className="flex-1 bg-amber-400 hover:bg-amber-500 text-black text-xs font-black uppercase tracking-wider py-3 rounded-xl active:scale-95 transition-all shadow-[0_0_15px_rgba(251,191,36,0.3)] disabled:opacity-50"
              >
                {salvandoPermissoes ? 'Salvando...' : 'Salvar Acesso'}
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
