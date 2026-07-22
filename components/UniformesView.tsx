// src/components/UniformesView.tsx
"use client";

import { useState, useEffect } from 'react';
import { supabase } from '../lib/supabase';
import { PreEncomendasModal } from './PreEncomendasModal';

interface Uniforme {
  id: number;
  nome: string;
  imagem_url: string;
  estoque: Record<string, number>;
  created_at: string;
}

interface UniformesViewProps {
  onVoltar: () => void;
  isAdmin: boolean;
}

export function UniformesView({ onVoltar, isAdmin }: UniformesViewProps) {
  const [uniformes, setUniformes] = useState<Uniforme[]>([]);
  const [loading, setLoading] = useState(true);
  const [saveLoading, setSaveLoading] = useState(false);
  const [selectedUniforme, setSelectedUniforme] = useState<Uniforme | null>(null);
  const [editEstoque, setEditEstoque] = useState<Record<string, number>>({});
  
  // States for adding a new uniform
  const [showAddForm, setShowAddForm] = useState(false);
  const [newNome, setNewNome] = useState('');
  const [newImagemUrl, setNewImagemUrl] = useState('');
  const [showModalPreEncomendas, setShowModalPreEncomendas] = useState(false);

  const tamanhosPadrao = ["PP", "P", "M", "G", "GG", "XGG"];

  useEffect(() => {
    carregarUniformes();
  }, []);

  const carregarUniformes = async () => {
    setLoading(true);
    try {
      const { data, error } = await supabase
        .from('uniformes')
        .select('*')
        .order('id', { ascending: true });

      if (error) throw error;
      setUniformes(data || []);
    } catch (err: any) {
      console.error("Erro ao carregar uniformes:", err.message);
    } finally {
      setLoading(false);
    }
  };

  const handleCardClick = (uniforme: Uniforme) => {
    setSelectedUniforme(uniforme);
    // Initialize editable stock state, ensuring all default sizes exist in the local state
    const estoqueCompleto = { ...uniforme.estoque };
    tamanhosPadrao.forEach(t => {
      if (estoqueCompleto[t] === undefined) {
        estoqueCompleto[t] = 0;
      }
    });
    setEditEstoque(estoqueCompleto);
  };

  const handleQuantityChange = (tamanho: string, value: string) => {
    const val = parseInt(value) || 0;
    setEditEstoque(prev => ({
      ...prev,
      [tamanho]: val < 0 ? 0 : val
    }));
  };

  const incrementQuantity = (tamanho: string) => {
    setEditEstoque(prev => ({
      ...prev,
      [tamanho]: (prev[tamanho] || 0) + 1
    }));
  };

  const decrementQuantity = (tamanho: string) => {
    setEditEstoque(prev => ({
      ...prev,
      [tamanho]: Math.max(0, (prev[tamanho] || 0) - 1)
    }));
  };

  const salvarEstoque = async () => {
    if (!selectedUniforme) return;
    setSaveLoading(true);
    try {
      const { error } = await supabase
        .from('uniformes')
        .update({ estoque: editEstoque })
        .eq('id', selectedUniforme.id);

      if (error) throw error;

      // Update local state list
      setUniformes(prev => prev.map(u => u.id === selectedUniforme.id ? { ...u, estoque: editEstoque } : u));
      setSelectedUniforme(prev => prev ? { ...prev, estoque: editEstoque } : null);
      alert("Estoque atualizado com sucesso!");
    } catch (err: any) {
      alert("Erro ao salvar estoque: " + err.message);
    } finally {
      setSaveLoading(false);
    }
  };

  const handleAddUniforme = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!newNome) return alert("Por favor, preencha o nome do uniforme");
    
    setSaveLoading(true);
    try {
      // Default stock structure
      const defaultEstoque = tamanhosPadrao.reduce((acc, t) => {
        acc[t] = 0;
        return acc;
      }, {} as Record<string, number>);

      const { data, error } = await supabase
        .from('uniformes')
        .insert([{
          nome: newNome,
          imagem_url: newImagemUrl || 'https://images.unsplash.com/photo-1521572267360-ee0c2909d518?w=500',
          estoque: defaultEstoque
        }])
        .select();

      if (error) throw error;

      if (data) {
        setUniformes(prev => [...prev, data[0]]);
        setNewNome('');
        setNewImagemUrl('');
        setShowAddForm(false);
      }
    } catch (err: any) {
      alert("Erro ao criar uniforme: " + err.message);
    } finally {
      setSaveLoading(false);
    }
  };

  const deleteUniforme = async (id: number) => {
    if (!confirm("Tem certeza que deseja remover este uniforme?")) return;
    try {
      const { error } = await supabase.from('uniformes').delete().eq('id', id);
      if (error) throw error;
      setUniformes(prev => prev.filter(u => u.id !== id));
      setSelectedUniforme(null);
    } catch (err: any) {
      alert("Erro ao excluir: " + err.message);
    }
  };

  const totalEstoque = (estoque: Record<string, number> = {}) => {
    return Object.values(estoque).reduce((acc, curr) => acc + (curr || 0), 0);
  };

  return (
    <div className="animacao-entrada px-4 pb-36 pt-4 max-w-lg mx-auto">
      {/* Header */}
      <div className="flex items-center justify-between mb-6">
        <h2 className="text-2xl font-black uppercase italic tracking-tighter text-[#ef3340]">
          {selectedUniforme 
            ? (isAdmin ? 'Gestão de Estoque' : 'Detalhes do Uniforme') 
            : (isAdmin ? 'Uniformes HECTH (Gestão)' : 'Vitrine de Uniformes')}
        </h2>
        <button 
          onClick={selectedUniforme ? () => setSelectedUniforme(null) : onVoltar} 
          className="text-[10px] font-black uppercase tracking-widest text-white/40 hover:text-white transition-colors"
        >
          {selectedUniforme ? 'Voltar para Grid' : 'Voltar para Arena'}
        </button>
      </div>

      {loading ? (
        <div className="flex justify-center items-center py-20">
          <p className="text-white/50 font-bold animate-pulse tracking-widest uppercase text-xs">Carregando estoque...</p>
        </div>
      ) : selectedUniforme ? (
        /* DETAIL VIEW (Spreadsheet/Vitrine) */
        <div className="bg-[#121212] border border-white/5 rounded-3xl p-5 animacao-entrada">
          <div className="flex gap-4 items-center mb-6">
            <img 
              src={selectedUniforme.imagem_url} 
              alt={selectedUniforme.nome} 
              className="w-16 h-16 rounded-2xl object-cover border border-white/10"
            />
            <div>
              <h3 className="font-black text-lg text-white uppercase tracking-tighter">{selectedUniforme.nome}</h3>
              <p className="text-[10px] text-white/40 uppercase font-black tracking-widest">
                Disponíveis: {totalEstoque(selectedUniforme.estoque)} peças
              </p>
            </div>
          </div>

          {/* Spreadsheet Table */}
          <div className="overflow-hidden border border-white/10 rounded-2xl mb-6 bg-black/40">
            <table className="w-full text-left border-collapse">
              <thead>
                <tr className="border-b border-white/10 bg-white/5 text-[10px] font-black uppercase tracking-widest text-white/60">
                  <th className="px-4 py-3 text-center">Tamanho</th>
                  <th className="px-4 py-3 text-center">Quantidade Em Estoque</th>
                </tr>
              </thead>
              <tbody>
                {tamanhosPadrao.map((tamanho) => (
                  <tr key={tamanho} className="border-b border-white/5 hover:bg-white/[0.02]">
                    <td className="px-4 py-3 text-center font-black text-sm text-[#ef3340] bg-white/[0.02] border-r border-white/5 w-20">
                      {tamanho}
                    </td>
                    <td className="px-2 py-3 text-center">
                      {isAdmin ? (
                        <div className="flex items-center justify-center gap-2">
                          <button 
                            type="button" 
                            onClick={() => decrementQuantity(tamanho)} 
                            className="w-8 h-8 rounded-lg bg-white/10 text-white font-black text-lg flex items-center justify-center hover:bg-white/20 active:scale-95 transition-all select-none"
                          >
                            -
                          </button>
                          <input 
                            type="number" 
                            min="0"
                            value={editEstoque[tamanho] !== undefined ? editEstoque[tamanho] : 0}
                            onChange={(e) => handleQuantityChange(tamanho, e.target.value)}
                            className="w-16 bg-transparent border-0 outline-none text-white text-center font-bold px-1 py-1 focus:bg-white/5 focus:ring-1 focus:ring-[#ef3340]/30 rounded-lg text-base"
                          />
                          <button 
                            type="button" 
                            onClick={() => incrementQuantity(tamanho)} 
                            className="w-8 h-8 rounded-lg bg-[#ef3340]/20 text-[#ef3340] border border-[#ef3340]/30 font-black text-lg flex items-center justify-center hover:bg-[#ef3340]/30 active:scale-95 transition-all select-none"
                          >
                            +
                          </button>
                        </div>
                      ) : (
                        <span className="font-black text-white text-base">
                          {editEstoque[tamanho] || 0} <span className="text-[10px] text-white/40 font-normal uppercase">unid</span>
                        </span>
                      )}
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>

          {isAdmin && (
            <div className="flex flex-col gap-3">
              <button 
                onClick={salvarEstoque}
                disabled={saveLoading}
                className="w-full bg-[#ef3340] text-white text-xs font-black uppercase tracking-widest py-4 rounded-xl active:scale-95 transition-all shadow-[0_0_15px_rgba(239,51,64,0.3)] disabled:opacity-50"
              >
                {saveLoading ? 'Salvando...' : 'Salvar Alterações'}
              </button>

              <button 
                onClick={() => deleteUniforme(selectedUniforme.id)}
                className="w-full bg-transparent text-red-500/50 hover:text-red-500 text-[10px] font-black uppercase tracking-widest py-2 rounded-xl transition-all"
              >
                Remover Uniforme
              </button>
            </div>
          )}
        </div>
      ) : (
        /* GRID VIEW (3 Columns) */
        <div className="flex flex-col gap-6">
          <div className="grid grid-cols-3 gap-3">
            {uniformes.map((uniforme) => (
              <div 
                key={uniforme.id}
                onClick={() => handleCardClick(uniforme)}
                className="bg-[#121212] border border-white/5 rounded-2xl overflow-hidden cursor-pointer hover:border-white/10 active:scale-95 transition-all flex flex-col group"
              >
                <div className="relative aspect-square w-full bg-zinc-900">
                  <img 
                    src={uniforme.imagem_url} 
                    alt={uniforme.nome} 
                    className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-300"
                  />
                  <div className="absolute top-2 right-2 bg-black/60 px-1.5 py-0.5 rounded text-[8px] font-black tracking-wider text-white">
                    {totalEstoque(uniforme.estoque)} Qtd
                  </div>
                </div>
                <div className="p-2 flex-1 flex flex-col justify-between">
                  <h4 className="text-[10px] font-black uppercase tracking-tighter text-white/90 line-clamp-2 leading-tight">
                    {uniforme.nome}
                  </h4>
                </div>
              </div>
            ))}

            {/* Admin Add Card */}
            {isAdmin && !showAddForm && (
              <button 
                onClick={() => setShowAddForm(true)}
                className="bg-[#121212]/50 border border-dashed border-white/10 rounded-2xl aspect-square flex flex-col items-center justify-center gap-1.5 active:scale-95 transition-all"
              >
                <span className="text-xl">➕</span>
                <span className="text-[8px] font-black uppercase tracking-widest text-white/40">Novo</span>
              </button>
            )}
          </div>

          {/* Add Uniform Form */}
          {showAddForm && isAdmin && (
            <div className="bg-[#121212] border border-white/5 rounded-3xl p-5 animacao-entrada">
              <h3 className="font-black text-sm uppercase text-white mb-4">Adicionar Novo Uniforme</h3>
              <form onSubmit={handleAddUniforme} className="flex flex-col gap-3">
                <input 
                  type="text" 
                  placeholder="Nome do Uniforme (ex: Corta Vento)"
                  value={newNome}
                  onChange={(e) => setNewNome(e.target.value)}
                  className="w-full border border-white/10 rounded-xl px-4 py-3 text-white bg-white/5 outline-none focus:ring-1 focus:ring-[#ef3340] text-sm"
                  required
                />
                <input 
                  type="url" 
                  placeholder="URL da Imagem (opcional)"
                  value={newImagemUrl}
                  onChange={(e) => setNewImagemUrl(e.target.value)}
                  className="w-full border border-white/10 rounded-xl px-4 py-3 text-white bg-white/5 outline-none focus:ring-1 focus:ring-[#ef3340] text-sm"
                />
                <div className="flex gap-2 mt-2">
                  <button 
                    type="submit"
                    disabled={saveLoading}
                    className="flex-1 bg-[#ef3340] text-white text-xs font-black uppercase tracking-widest py-3 rounded-xl disabled:opacity-50"
                  >
                    Adicionar
                  </button>
                  <button 
                    type="button" 
                    onClick={() => setShowAddForm(false)}
                    className="flex-1 bg-white/10 text-white text-xs font-black uppercase tracking-widest py-3 rounded-xl"
                  >
                    Cancelar
                  </button>
                </div>
              </form>
            </div>
          )}
          {/* Footer Inline Button for Pre-Orders */}
          <div className="mt-4 pt-4 border-t border-white/5 flex justify-center">
            <button 
              onClick={() => setShowModalPreEncomendas(true)}
              className="w-full bg-[#121212] border border-[#ef3340]/40 text-white font-black text-xs uppercase tracking-widest py-4 rounded-2xl shadow-lg hover:border-[#ef3340] active:scale-95 transition-all flex items-center justify-center gap-2"
            >
              <span className="text-lg">📦</span>
              <span>Abrir Lista de Pré-Encomendas</span>
            </button>
          </div>
        </div>
      )}

      {/* Floating Footer Bar */}
      <div className="fixed bottom-4 left-0 right-0 px-4 flex justify-center z-40 pointer-events-none">
        <button 
          onClick={() => setShowModalPreEncomendas(true)}
          className="pointer-events-auto bg-[#121212]/95 backdrop-blur-md border border-[#ef3340]/40 text-white font-black text-xs uppercase tracking-widest px-6 py-3.5 rounded-full shadow-[0_4px_25px_rgba(239,51,64,0.4)] hover:scale-105 active:scale-95 transition-all flex items-center gap-2"
        >
          <span className="text-base">📦</span>
          <span>Pré-Encomendas</span>
        </button>
      </div>

      <PreEncomendasModal 
        isOpen={showModalPreEncomendas} 
        onClose={() => setShowModalPreEncomendas(false)} 
      />
    </div>
  );
}
