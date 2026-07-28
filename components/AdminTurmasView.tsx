// src/components/AdminTurmasView.tsx
"use client";

import { useState, useEffect } from 'react';
import { supabase } from '../lib/supabase';

interface Turma {
  id: number;
  nome: string;
  professor: string;
  horario: string;
  vagas_totais: number;
  vagas_ocupadas: number;
  dia_exclusivo: string | null;
  cor_card: string;
  dias_semana: string;
}

interface AdminTurmasViewProps {
  onVoltar: () => void;
}

const CORES_PREMIUM = [
  { nome: 'Grafite (Padrão)', value: '#121212' },
  { nome: 'Vermelho HECTH', value: '#ef3340' },
  { nome: 'Dourado / Bronze', value: '#b45309' },
  { nome: 'Verde Esmeralda', value: '#065f46' },
  { nome: 'Roxo Imperial', value: '#581c87' },
  { nome: 'Azul Escuro', value: '#1e3a8a' }
];

const DIAS_SEMANA_MAP = [
  { id: 1, nome: 'Segunda' },
  { id: 2, nome: 'Terça' },
  { id: 3, nome: 'Quarta' },
  { id: 4, nome: 'Quinta' },
  { id: 5, nome: 'Sexta' },
  { id: 6, nome: 'Sábado' },
  { id: 0, nome: 'Domingo' }
];

export function AdminTurmasView({ onVoltar }: AdminTurmasViewProps) {
  const [turmas, setTurmas] = useState<Turma[]>([]);
  const [loading, setLoading] = useState(true);

  // Edit / Create form state
  const [modalOpen, setModalOpen] = useState(false);
  const [turmaEditando, setTurmaEditando] = useState<Turma | null>(null); // Null = creating new
  const [nome, setNome] = useState('');
  const [professor, setProfessor] = useState('Equipe CT Hecth');
  const [horario, setHorario] = useState('18:00');
  const [vagasTotais, setVagasTotais] = useState(30);
  const [corCard, setCorCard] = useState('#121212');
  const [diasSelecionados, setDiasSelecionados] = useState<number[]>([1, 2, 3, 4, 5]); // default Seg-Sex
  const [saving, setSaving] = useState(false);

  useEffect(() => {
    carregarTurmas();
  }, []);

  const carregarTurmas = async () => {
    setLoading(true);
    try {
      const { data, error } = await supabase
        .from('turmas')
        .select('*')
        .order('horario', { ascending: true });

      if (error) throw error;
      setTurmas(data || []);
    } catch (err: any) {
      alert("Erro ao carregar turmas: " + err.message);
    } finally {
      setLoading(false);
    }
  };

  const abrirModalCriar = () => {
    setTurmaEditando(null);
    setNome('');
    setProfessor('Equipe CT Hecth');
    setHorario('18:00');
    setVagasTotais(30);
    setCorCard('#121212');
    setDiasSelecionados([1, 2, 3, 4, 5]);
    setModalOpen(true);
  };

  const abrirModalEditar = (turma: Turma) => {
    setTurmaEditando(turma);
    setNome(turma.nome);
    setProfessor(turma.professor || 'Equipe CT Hecth');
    setHorario(turma.horario);
    setVagasTotais(turma.vagas_totais);
    setCorCard(turma.cor_card || '#121212');
    
    // Parse days list
    if (turma.dias_semana) {
      const parsed = turma.dias_semana.split(',').map(d => parseInt(d.trim())).filter(d => !isNaN(d));
      setDiasSelecionados(parsed);
    } else {
      setDiasSelecionados([1, 2, 3, 4, 5]);
    }
    
    setModalOpen(true);
  };

  const alternarDia = (diaId: number) => {
    setDiasSelecionados(prev => 
      prev.includes(diaId) ? prev.filter(id => id !== diaId) : [...prev, diaId]
    );
  };

  const handleSalvar = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!nome.trim() || !horario.trim() || diasSelecionados.length === 0) {
      return alert("Preencha o nome, horário e selecione ao menos 1 dia da semana!");
    }

    setSaving(true);
    const stringDias = diasSelecionados.sort((a,b)=>a-b).join(',');

    const payload = {
      nome,
      professor,
      horario,
      vagas_totais: vagasTotais,
      cor_card: corCard,
      dias_semana: stringDias,
      dia_exclusivo: null // clear outdated single-day exclusive field
    };

    try {
      if (turmaEditando) {
        // Update existing class
        const { error } = await supabase
          .from('turmas')
          .update(payload)
          .eq('id', turmaEditando.id);

        if (error) throw error;
        alert("Turma atualizada com sucesso!");
      } else {
        // Insert new class
        const { error } = await supabase
          .from('turmas')
          .insert([{ ...payload, vagas_ocupadas: 0 }]);

        if (error) throw error;
        alert("Turma criada com sucesso!");
      }

      setModalOpen(false);
      carregarTurmas();
    } catch (err: any) {
      alert("Erro ao salvar: " + err.message);
    } finally {
      setSaving(false);
    }
  };

  const handleDeletar = async (turmaId: number) => {
    const confirmar = window.confirm("ATENÇÃO: Deseja realmente excluir esta turma? Esta ação não pode ser desfeita!");
    if (!confirmar) return;

    try {
      // First, clean up presencas connected to this class to avoid foreign key conflicts
      await supabase.from('presencas').delete().eq('turma_id', turmaId);
      
      const { error } = await supabase
        .from('turmas')
        .delete()
        .eq('id', turmaId);

      if (error) throw error;

      alert("Turma excluída com sucesso!");
      carregarTurmas();
    } catch (err: any) {
      alert("Erro ao excluir turma: " + err.message);
    }
  };

  const formatarDias = (diasStr?: string) => {
    if (!diasStr) return 'Nenhum dia';
    const parsed = diasStr.split(',').map(d => parseInt(d.trim())).filter(d => !isNaN(d));
    if (parsed.length === 7) return 'Todos os dias';
    
    // Sort array Seg-Sex, Sab, Dom
    const sorted = parsed.sort((a, b) => {
      // Shift Sunday (0) to the end of the sorting logic for local reading
      const valA = a === 0 ? 7 : a;
      const valB = b === 0 ? 7 : b;
      return valA - valB;
    });

    const nomes = sorted.map(d => {
      const match = DIAS_SEMANA_MAP.find(m => m.id === d);
      return match ? match.nome.substring(0, 3) : '';
    });
    return nomes.filter(Boolean).join(', ');
  };

  return (
    <div className="animacao-entrada w-full pb-20 pt-4 max-w-lg mx-auto px-4">
      {/* Header */}
      <div className="flex items-center justify-between mb-6">
        <div className="flex items-center gap-4">
          <button onClick={onVoltar} className="p-2 bg-white/5 rounded-full text-white/50 hover:text-white transition-colors">
            <svg xmlns="http://www.w3.org/2000/svg" width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="3" strokeLinecap="round" strokeLinejoin="round"><path d="m15 18-6-6 6-6"/></svg>
          </button>
          <h2 className="text-xl font-black uppercase italic tracking-tight">Editor de Turmas</h2>
        </div>
        <button 
          onClick={abrirModalCriar}
          className="bg-[#ef3340] text-white text-[10px] font-black uppercase tracking-widest px-4 py-2.5 rounded-xl hover:scale-105 active:scale-95 transition-all shadow-[0_0_10px_rgba(239,51,64,0.3)]"
        >
          + Nova Turma
        </button>
      </div>

      {/* List of classes */}
      <div className="flex flex-col gap-3">
        {loading ? (
          <p className="text-center py-10 text-white/20 text-[10px] font-black uppercase tracking-widest animate-pulse italic">Carregando turmas...</p>
        ) : turmas.length === 0 ? (
          <p className="text-center py-10 text-white/40 text-xs font-black uppercase tracking-wider italic">Nenhuma turma cadastrada</p>
        ) : (
          turmas.map((turma) => (
            <div 
              key={turma.id}
              className="bg-[#121212] border border-white/5 rounded-2xl p-4 flex items-center justify-between text-left relative overflow-hidden"
            >
              {/* Colored status bar to preview color card selection */}
              <div 
                className="absolute left-0 top-0 bottom-0 w-1.5"
                style={{ backgroundColor: turma.cor_card || '#121212' }}
              />

              <div className="pl-3 flex-1 min-w-0">
                <div className="flex items-center gap-2">
                  <span className="text-white font-black text-sm uppercase tracking-tight truncate">
                    {turma.nome}
                  </span>
                  <span className="text-[10px] font-black px-2 py-0.5 rounded bg-white/5 text-white/60">
                    {turma.horario}
                  </span>
                </div>
                <div className="flex flex-wrap gap-x-3 gap-y-1 mt-1.5 text-[10px] font-bold text-white/40 uppercase tracking-wide">
                  <span>Vagas: {turma.vagas_totais}</span>
                  <span>•</span>
                  <span>{formatarDias(turma.dias_semana)}</span>
                </div>
              </div>

              <div className="flex items-center gap-2 shrink-0">
                <button 
                  onClick={() => abrirModalEditar(turma)}
                  className="p-2.5 bg-white/5 rounded-xl border border-white/10 hover:bg-white/10 hover:border-white/20 transition-all text-white/70"
                  title="Editar Turma"
                >
                  ✏️
                </button>
                <button 
                  onClick={() => handleDeletar(turma.id)}
                  className="p-2.5 bg-red-950/20 border border-red-500/20 rounded-xl hover:bg-red-900/30 hover:border-red-500/40 transition-all text-red-400"
                  title="Excluir Turma"
                >
                  🗑️
                </button>
              </div>
            </div>
          ))
        )}
      </div>

      {/* Editor Modal */}
      {modalOpen && (
        <div className="fixed inset-0 bg-black/85 backdrop-blur-md z-[9999] flex items-center justify-center p-4">
          <div className="bg-[#121212] border border-white/10 rounded-3xl p-6 max-w-md w-full shadow-2xl overflow-y-auto max-h-[90vh]">
            <div className="flex justify-between items-center mb-6">
              <h3 className="font-black text-lg text-white uppercase italic">
                {turmaEditando ? 'Editar Turma' : 'Criar Nova Turma'}
              </h3>
              <button 
                onClick={() => setModalOpen(false)}
                className="text-white/40 hover:text-white font-black text-base p-1"
              >
                ✕
              </button>
            </div>

            <form onSubmit={handleSalvar} className="flex flex-col gap-4 text-left">
              <div>
                <label className="text-[10px] font-black uppercase tracking-widest text-white/40 mb-1.5 block">Nome / Nível da Turma</label>
                <input 
                  type="text"
                  required
                  placeholder="Ex: Iniciante Avançado / Intermediário"
                  value={nome}
                  onChange={(e) => setNome(e.target.value)}
                  className="w-full bg-[#1a1a1a] border border-white/10 rounded-xl px-4 py-3 text-white outline-none focus:ring-1 focus:ring-[#ef3340] text-sm font-bold uppercase"
                />
              </div>

              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="text-[10px] font-black uppercase tracking-widest text-white/40 mb-1.5 block">Horário</label>
                  <input 
                    type="text"
                    required
                    placeholder="Ex: 18:00"
                    value={horario}
                    onChange={(e) => setHorario(e.target.value)}
                    className="w-full bg-[#1a1a1a] border border-white/10 rounded-xl px-4 py-3 text-white outline-none focus:ring-1 focus:ring-[#ef3340] text-sm font-bold text-center"
                  />
                </div>
                <div>
                  <label className="text-[10px] font-black uppercase tracking-widest text-white/40 mb-1.5 block">Vagas Totais</label>
                  <input 
                    type="number"
                    required
                    min="1"
                    value={vagasTotais}
                    onChange={(e) => setVagasTotais(parseInt(e.target.value) || 0)}
                    className="w-full bg-[#1a1a1a] border border-white/10 rounded-xl px-4 py-3 text-white outline-none focus:ring-1 focus:ring-[#ef3340] text-sm font-bold text-center"
                  />
                </div>
              </div>

              <div>
                <label className="text-[10px] font-black uppercase tracking-widest text-white/40 mb-1.5 block">Professor / Responsável</label>
                <input 
                  type="text"
                  required
                  value={professor}
                  onChange={(e) => setProfessor(e.target.value)}
                  className="w-full bg-[#1a1a1a] border border-white/10 rounded-xl px-4 py-3 text-white outline-none focus:ring-1 focus:ring-[#ef3340] text-sm font-bold"
                />
              </div>

              {/* Color Selector */}
              <div>
                <label className="text-[10px] font-black uppercase tracking-widest text-white/40 mb-2 block">Cor Temática do Card</label>
                <div className="grid grid-cols-3 gap-2">
                  {CORES_PREMIUM.map((c) => (
                    <button
                      key={c.value}
                      type="button"
                      onClick={() => setCorCard(c.value)}
                      className={`p-2.5 rounded-xl border text-[9px] font-bold uppercase transition-all flex flex-col items-center gap-1.5 ${
                        corCard === c.value 
                          ? 'border-white text-white bg-white/5' 
                          : 'border-white/5 text-white/40 bg-transparent hover:bg-white/5'
                      }`}
                    >
                      <div className="w-4 h-4 rounded-full border border-white/10" style={{ backgroundColor: c.value }} />
                      <span className="truncate max-w-full">{c.nome}</span>
                    </button>
                  ))}
                </div>
              </div>

              {/* Days Selector */}
              <div>
                <label className="text-[10px] font-black uppercase tracking-widest text-white/40 mb-2 block">Dias de Exibição</label>
                <div className="grid grid-cols-4 gap-2">
                  {DIAS_SEMANA_MAP.map((d) => {
                    const ativo = diasSelecionados.includes(d.id);
                    return (
                      <button
                        key={d.id}
                        type="button"
                        onClick={() => alternarDia(d.id)}
                        className={`py-2 rounded-xl text-[9px] font-black uppercase tracking-wider transition-all border ${
                          ativo 
                            ? 'bg-[#ef3340] text-white border-[#ef3340] shadow-sm' 
                            : 'bg-white/5 text-white/40 border-white/5 hover:bg-white/10'
                        }`}
                      >
                        {d.nome.substring(0, 3)}
                      </button>
                    );
                  })}
                </div>
              </div>

              <div className="flex gap-2 mt-4 shrink-0">
                <button 
                  type="submit"
                  disabled={saving}
                  className="flex-1 bg-[#ef3340] text-white text-xs font-black uppercase tracking-widest py-3.5 rounded-xl active:scale-95 transition-all shadow-[0_0_15px_rgba(239,51,64,0.3)]"
                >
                  {saving ? 'Salvando...' : 'Salvar Alterações'}
                </button>
                <button 
                  type="button"
                  onClick={() => setModalOpen(false)}
                  className="flex-1 bg-white/15 text-white text-xs font-black uppercase tracking-widest py-3.5 rounded-xl hover:bg-white/20 transition-all"
                >
                  Cancelar
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
}
