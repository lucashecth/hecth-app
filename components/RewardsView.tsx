// src/components/RewardsView.tsx
"use client";

import { useState } from 'react';

interface RewardsViewProps {
  onVoltar: () => void;
  alunoDb: any;
}

export function RewardsView({ onVoltar, alunoDb }: RewardsViewProps) {
  const nivel = alunoDb?.nivel || 'Aprendiz';
  const normNivel = String(nivel).toLowerCase().trim().normalize('NFD').replace(/[\u0300-\u036f]/g, '');

  let borderClass = 'border-white';
  if (normNivel === 'aprendiz') borderClass = 'border-white';
  else if (normNivel === 'iniciante') borderClass = 'border-green-400';
  else if (normNivel === 'iniciante avancado') borderClass = 'border-blue-400';
  else if (normNivel === 'intermediario') borderClass = 'border-purple-400';

  // Badges Data (Insignias)
  const insignias = [
    { nome: 'Open Arena 2026', conquistado: true, descricao: 'Participou do Open Arena HECTH', icone: '🏐', cor: 'from-amber-500 to-orange-600' },
    { nome: 'Rei da Praia', conquistado: true, descricao: 'Disputou o torneio interno Rei da Praia', icone: '👑', cor: 'from-yellow-400 to-amber-500' },
    { nome: 'Circuito Verão', conquistado: false, descricao: 'Bloqueado: Jogue o Circuito Verão HECTH', icone: '☀️', cor: 'from-gray-700 to-gray-800' },
    { nome: 'HECTH Cup 2026', conquistado: false, descricao: 'Bloqueado: Participe da HECTH Cup', icone: '🏆', cor: 'from-gray-700 to-gray-800' }
  ];

  // Missions Data (Missões)
  const missoes = [
    { titulo: 'Treinar 3x na Semana', progresso: '2/3', xp: '+150 XP', concluida: false },
    { titulo: 'Chegar Cedo (10 min antes)', progresso: '1/1', xp: '+50 XP', concluida: true },
    { titulo: 'Jogar o Próximo Torneio', progresso: '0/1', xp: '+300 XP', concluida: false },
    { titulo: 'Marcar presença 5 dias seguidos', progresso: '3/5', xp: '+200 XP', concluida: false }
  ];

  return (
    <div className="animacao-entrada w-full pb-28 pt-4 max-w-md mx-auto px-4 text-left">
      {/* Header */}
      <div className="flex items-center gap-4 mb-6">
        <button onClick={onVoltar} className="p-3 bg-white/5 rounded-full text-white/50 active:scale-95 transition-transform">
          <svg xmlns="http://www.w3.org/2000/svg" width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="3" strokeLinecap="round" strokeLinejoin="round"><path d="m15 18-6-6 6-6"/></svg>
        </button>
        <h2 className="text-2xl font-black uppercase italic tracking-tighter text-white">Hecth Rewards</h2>
      </div>

      {/* Profile Card Summary */}
      <div className="bg-[#121212] border border-white/5 rounded-3xl p-5 mb-4 flex items-center gap-4">
        <div className={`w-14 h-14 rounded-full overflow-hidden border-2 shrink-0 bg-white/5 flex items-center justify-center ${borderClass}`}>
          {alunoDb?.foto_url ? (
            <img src={alunoDb.foto_url} alt="" className="w-full h-full object-cover" />
          ) : (
            <span className="text-xl font-bold text-white">{alunoDb?.nome?.charAt(0)}</span>
          )}
        </div>
        <div>
          <h3 className="font-black text-base text-white uppercase tracking-tight leading-tight">
            {alunoDb?.nome} {alunoDb?.sobrenome}
          </h3>
          <span className="text-[9px] font-black text-amber-400 uppercase tracking-widest flex items-center gap-1 mt-1">
            ⭐️ Nível {alunoDb?.id ? (alunoDb.id % 4) + 1 : 1} de Fidelidade
          </span>
        </div>
      </div>

      {/* Progress Card */}
      <div className="bg-[#121212] border border-white/5 rounded-3xl p-6 mb-6">
        <div className="flex justify-between items-center mb-3">
          <span className="text-[10px] font-black uppercase tracking-widest text-white/40">Progresso de Nível</span>
          <span className="text-xs font-black text-amber-400 italic">650 / 1000 XP</span>
        </div>

        {/* Glow Bar Container */}
        <div className="w-full h-3 bg-white/5 rounded-full overflow-hidden relative border border-white/10">
          <div 
            className="h-full rounded-full bg-gradient-to-r from-amber-500 to-yellow-400 shadow-[0_0_10px_rgba(245,158,11,0.5)] transition-all duration-500"
            style={{ width: '65%' }}
          />
        </div>

        <p className="text-[9px] font-bold text-white/30 uppercase mt-3 tracking-wide leading-relaxed">
          Ganhe mais XP jogando torneios HECTH ou completando missões semanais para liberar recompensas exclusivas!
        </p>
      </div>

      {/* Badges Grid (Insignias) */}
      <div className="mb-6">
        <h4 className="text-xs font-black uppercase tracking-widest text-white/40 mb-3 pl-1">Insignias dos Campeonatos</h4>
        <div className="grid grid-cols-2 gap-3">
          {insignias.map((badge) => (
            <div 
              key={badge.nome}
              className={`border p-4 rounded-2xl flex flex-col items-center text-center transition-all ${
                badge.conquistado 
                  ? 'bg-gradient-to-b from-[#1a1a1a] to-[#121212] border-amber-500/20' 
                  : 'bg-[#0f0f0f] border-white/5 opacity-40 grayscale'
              }`}
            >
              <div className={`w-12 h-12 rounded-full bg-gradient-to-br ${badge.cor} flex items-center justify-center text-2xl shadow-md mb-2`}>
                {badge.icone}
              </div>
              <span className={`text-[10px] font-black uppercase tracking-tight block ${badge.conquistado ? 'text-white/90' : 'text-white/30'}`}>
                {badge.nome}
              </span>
              <p className="text-[8px] font-bold text-white/30 uppercase mt-1 tracking-wide leading-tight">
                {badge.descricao}
              </p>
            </div>
          ))}
        </div>
      </div>

      {/* Missions (Missões) */}
      <div>
        <h4 className="text-xs font-black uppercase tracking-widest text-white/40 mb-3 pl-1">Missões Diárias & Semanais</h4>
        <div className="flex flex-col gap-2.5">
          {missoes.map((missao) => (
            <div 
              key={missao.titulo}
              className={`p-4 border rounded-2xl flex items-center justify-between transition-all ${
                missao.concluida 
                  ? 'bg-green-950/10 border-green-500/20' 
                  : 'bg-[#121212] border-white/5'
              }`}
            >
              <div className="min-w-0">
                <span className={`text-[10px] font-black uppercase tracking-wider block ${missao.concluida ? 'text-green-400 line-through' : 'text-white/90'}`}>
                  {missao.titulo}
                </span>
                <span className="text-[9px] font-bold text-white/30 uppercase tracking-widest mt-1 block">
                  Progresso: {missao.progresso}
                </span>
              </div>

              <div className="text-right shrink-0">
                {missao.concluida ? (
                  <span className="text-[9px] font-black uppercase tracking-wider text-green-400 bg-green-500/10 border border-green-500/20 px-2.5 py-1 rounded-lg">
                    Concluída
                  </span>
                ) : (
                  <span className="text-[9px] font-black uppercase tracking-wider text-amber-400 bg-amber-500/10 border border-amber-500/20 px-2.5 py-1 rounded-lg">
                    {missao.xp}
                  </span>
                )}
              </div>
            </div>
          ))}
        </div>
      </div>
    </div>
  );
}
