// src/components/PreEncomendasModal.tsx
"use client";

import { useState, useEffect } from 'react';
import { supabase } from '../lib/supabase';

interface PreEncomendaItem {
  id: number;
  nome: string;
  entregue: boolean;
  created_at?: string;
}

interface PreEncomendasModalProps {
  isOpen: boolean;
  onClose: () => void;
}

export function PreEncomendasModal({ isOpen, onClose }: PreEncomendasModalProps) {
  const [itens, setItens] = useState<PreEncomendaItem[]>([]);
  const [novoNome, setNovoNome] = useState('');
  const [loading, setLoading] = useState(false);
  const [addLoading, setAddLoading] = useState(false);

  useEffect(() => {
    if (isOpen) {
      carregarEncomendas();
    }
  }, [isOpen]);

  const carregarEncomendas = async () => {
    setLoading(true);
    try {
      const { data, error } = await supabase
        .from('pre_encomendas')
        .select('*')
        .order('id', { ascending: true });

      if (error) {
        console.error("Erro ou tabela pre_encomendas não existe:", error.message);
      } else {
        setItens(data || []);
      }
    } catch (err: any) {
      console.error(err.message);
    } finally {
      setLoading(false);
    }
  };

  const handleToggle = async (item: PreEncomendaItem) => {
    const novoStatus = !item.entregue;
    // Optimistic UI update
    setItens(prev => prev.map(i => i.id === item.id ? { ...i, entregue: novoStatus } : i));

    try {
      const { error } = await supabase
        .from('pre_encomendas')
        .update({ entregue: novoStatus })
        .eq('id', item.id);

      if (error) throw error;
    } catch (err: any) {
      console.error("Erro ao atualizar status:", err.message);
      // Revert if error
      setItens(prev => prev.map(i => i.id === item.id ? { ...i, entregue: item.entregue } : i));
    }
  };

  const handleAdicionar = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!novoNome.trim()) return;

    setAddLoading(true);
    const itemTemp: PreEncomendaItem = {
      id: Date.now(),
      nome: novoNome.trim(),
      entregue: false
    };

    try {
      const { data, error } = await supabase
        .from('pre_encomendas')
        .insert([{ nome: novoNome.trim(), entregue: false }])
        .select();

      if (error) throw error;

      if (data && data.length > 0) {
        setItens(prev => [...prev, data[0]]);
      } else {
        setItens(prev => [...prev, itemTemp]);
      }
      setNovoNome('');
    } catch (err: any) {
      alert("Erro ao adicionar pré-encomenda: " + err.message);
    } finally {
      setAddLoading(false);
    }
  };

  const handleRemover = async (id: number) => {
    setItens(prev => prev.filter(i => i.id !== id));
    try {
      await supabase.from('pre_encomendas').delete().eq('id', id);
    } catch (err: any) {
      console.error("Erro ao remover:", err.message);
    }
  };

  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 bg-black/80 backdrop-blur-sm z-50 flex items-center justify-center p-4">
      <div className="bg-[#121212] border border-white/10 rounded-3xl p-6 max-w-md w-full max-h-[85vh] flex flex-col animacao-entrada shadow-2xl">
        {/* Header */}
        <div className="flex items-center justify-between mb-4 pb-3 border-b border-white/10">
          <div className="flex items-center gap-2">
            <span className="text-xl">📦</span>
            <h3 className="font-black text-lg text-white uppercase italic tracking-tight">Lista de Pré-Encomendas</h3>
          </div>
          <button 
            onClick={onClose} 
            className="text-white/40 hover:text-white font-black text-sm p-1"
          >
            ✕
          </button>
        </div>

        {/* List Content */}
        <div className="flex-1 overflow-y-auto pr-1 flex flex-col gap-2 my-2 min-h-[200px] max-h-[400px]">
          {loading ? (
            <div className="flex justify-center items-center py-10">
              <p className="text-white/40 text-xs font-bold uppercase animate-pulse">Carregando encomendas...</p>
            </div>
          ) : itens.length === 0 ? (
            <div className="flex flex-col items-center justify-center py-12 text-center text-white/30">
              <span className="text-3xl mb-2">📋</span>
              <p className="text-xs font-black uppercase tracking-wider">Nenhuma pré-encomenda cadastrada</p>
              <p className="text-[10px] uppercase font-bold text-white/20 mt-1">Adicione o primeiro nome abaixo</p>
            </div>
          ) : (
            itens.map((item) => (
              <div 
                key={item.id}
                className={`flex items-center justify-between p-3.5 rounded-2xl border transition-all ${
                  item.entregue 
                    ? 'bg-green-500/10 border-green-500/30 text-white/50' 
                    : 'bg-white/5 border-white/5 text-white'
                }`}
              >
                <label className="flex items-center gap-3 cursor-pointer flex-1">
                  <input 
                    type="checkbox"
                    checked={item.entregue}
                    onChange={() => handleToggle(item)}
                    className="w-5 h-5 rounded border-white/20 bg-black/40 text-[#ef3340] focus:ring-0 cursor-pointer accent-[#ef3340]"
                  />
                  <span className={`font-black text-sm uppercase tracking-tight ${item.entregue ? 'line-through text-white/40' : 'text-white'}`}>
                    {item.nome}
                  </span>
                </label>

                <div className="flex items-center gap-2">
                  <span className={`text-[9px] font-black uppercase px-2 py-0.5 rounded italic ${item.entregue ? 'bg-green-500/20 text-green-400' : 'bg-[#ef3340]/20 text-[#ef3340]'}`}>
                    {item.entregue ? 'ENTREGUE' : 'PENDENTE'}
                  </span>
                  <button 
                    onClick={() => handleRemover(item.id)}
                    className="text-white/20 hover:text-red-500 text-xs p-1 transition-colors"
                  >
                    🗑️
                  </button>
                </div>
              </div>
            ))
          )}
        </div>

        {/* Add Form */}
        <form onSubmit={handleAdicionar} className="flex gap-2 mt-4 pt-3 border-t border-white/10">
          <input 
            type="text"
            placeholder="Nome da pessoa..."
            value={novoNome}
            onChange={(e) => setNovoNome(e.target.value)}
            className="flex-1 bg-white/5 border border-white/10 rounded-xl px-4 py-3 text-white outline-none focus:ring-1 focus:ring-[#ef3340] text-sm font-bold"
          />
          <button 
            type="submit"
            disabled={addLoading || !novoNome.trim()}
            className="bg-[#ef3340] text-white font-black text-xs uppercase tracking-widest px-5 py-3 rounded-xl active:scale-95 transition-all shadow-[0_0_15px_rgba(239,51,64,0.3)] disabled:opacity-40 shrink-0"
          >
            {addLoading ? '...' : 'Adicionar'}
          </button>
        </form>
      </div>
    </div>
  );
}
