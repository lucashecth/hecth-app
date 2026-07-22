// src/components/AdminCriarAlunoView.tsx
"use client";

import { useState } from 'react';
import { createClient } from '@supabase/supabase-js';

interface AdminCriarAlunoViewProps {
  onVoltar: () => void;
}

export function AdminCriarAlunoView({ onVoltar }: AdminCriarAlunoViewProps) {
  const [nome, setNome] = useState('');
  const [sobrenome, setSobrenome] = useState('');
  const [email, setEmail] = useState('');
  const [senha, setSenha] = useState('');
  const [nivel, setNivel] = useState('INICIANTE');
  const [frequenciaSemanal, setFrequenciaSemanal] = useState<number>(2);
  const [diaVencimento, setDiaVencimento] = useState<number>(10);
  const [loading, setLoading] = useState(false);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!nome || !sobrenome || !email || !senha) {
      return alert("Preencha todos os campos obrigatórios!");
    }

    setLoading(true);
    try {
      const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL!;
      const supabaseKey = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!;

      // Isolated Supabase client so admin session remains intact
      const tempSupabase = createClient(supabaseUrl, supabaseKey, {
        auth: { persistSession: false }
      });

      // 1. Create Auth User in Supabase
      const { data: authData, error: authError } = await tempSupabase.auth.signUp({
        email,
        password: senha
      });

      if (authError) throw authError;

      // 2. Insert Approved Student record into database (foto_url empty forces mandatory photo upload)
      const novoAluno = {
        nome,
        sobrenome,
        email,
        status: 'aprovado',
        foto_url: '',
        nivel,
        frequencia_semanal: Number(frequenciaSemanal),
        dia_vencimento: Number(diaVencimento),
        mensalidade_paga: false
      };

      const { error: dbError } = await tempSupabase.from('alunos').insert([novoAluno]);
      if (dbError) throw dbError;

      alert(`Aluno ${nome} ${sobrenome} cadastrado e APROVADO com sucesso!\nO aluno já pode entrar usando e-mail: ${email}`);
      onVoltar();
    } catch (err: any) {
      alert("Erro ao cadastrar aluno: " + err.message);
    } finally {
      setLoading(false);
    }
  };

  const diasComuns = [5, 10, 15, 20];

  return (
    <div className="animacao-entrada px-5 pb-20 pt-4 max-w-lg mx-auto">
      <div className="flex items-center gap-4 mb-6">
        <button onClick={onVoltar} className="p-2 bg-white/5 rounded-full text-white/50 hover:text-white">
          <svg xmlns="http://www.w3.org/2000/svg" width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="3" strokeLinecap="round" strokeLinejoin="round"><path d="m15 18-6-6 6-6"/></svg>
        </button>
        <h2 className="text-xl font-black uppercase italic tracking-tight text-[#ef3340]">CADASTRAR NOVO ALUNO</h2>
      </div>

      <form onSubmit={handleSubmit} className="bg-[#121212] border border-white/5 rounded-3xl p-6 flex flex-col gap-4">
        <div>
          <label className="text-[10px] font-black uppercase tracking-widest text-white/40 mb-1 block">Nome *</label>
          <input 
            type="text"
            required
            value={nome}
            onChange={(e) => setNome(e.target.value)}
            placeholder="Nome do aluno"
            className="w-full bg-white/5 border border-white/10 rounded-xl px-4 py-3 text-white outline-none focus:ring-1 focus:ring-[#ef3340] text-sm"
          />
        </div>

        <div>
          <label className="text-[10px] font-black uppercase tracking-widest text-white/40 mb-1 block">Sobrenome *</label>
          <input 
            type="text"
            required
            value={sobrenome}
            onChange={(e) => setSobrenome(e.target.value)}
            placeholder="Sobrenome do aluno"
            className="w-full bg-white/5 border border-white/10 rounded-xl px-4 py-3 text-white outline-none focus:ring-1 focus:ring-[#ef3340] text-sm"
          />
        </div>

        <div>
          <label className="text-[10px] font-black uppercase tracking-widest text-white/40 mb-1 block">E-mail *</label>
          <input 
            type="email"
            required
            value={email}
            onChange={(e) => setEmail(e.target.value)}
            placeholder="email@aluno.com"
            className="w-full bg-white/5 border border-white/10 rounded-xl px-4 py-3 text-white outline-none focus:ring-1 focus:ring-[#ef3340] text-sm"
          />
        </div>

        <div>
          <label className="text-[10px] font-black uppercase tracking-widest text-white/40 mb-1 block">Senha Temporária *</label>
          <input 
            type="password"
            required
            value={senha}
            onChange={(e) => setSenha(e.target.value)}
            placeholder="Senha para o primeiro login"
            className="w-full bg-white/5 border border-white/10 rounded-xl px-4 py-3 text-white outline-none focus:ring-1 focus:ring-[#ef3340] text-sm"
          />
        </div>

        <div>
          <label className="text-[10px] font-black uppercase tracking-widest text-white/40 mb-1 block">Nível do Aluno</label>
          <select 
            value={nivel}
            onChange={(e) => setNivel(e.target.value)}
            className="w-full bg-[#1a1a1a] border border-white/10 rounded-xl px-4 py-3 text-white outline-none focus:ring-1 focus:ring-[#ef3340] text-sm font-bold uppercase"
          >
            <option value="INICIANTE">Iniciante</option>
            <option value="INTERMEDIÁRIO">Intermediário</option>
            <option value="AVANÇADO">Avançado</option>
          </select>
        </div>

        <div>
          <label className="text-[10px] font-black uppercase tracking-widest text-white/40 mb-2 block">Aulas na Semana</label>
          <div className="flex gap-2">
            {[2, 3, 5].map((freq) => (
              <button 
                key={freq}
                type="button"
                onClick={() => setFrequenciaSemanal(freq)}
                className={`flex-1 py-3 rounded-xl text-xs font-black uppercase transition-all ${frequenciaSemanal === freq ? 'bg-[#ef3340] text-white shadow-lg' : 'bg-white/5 text-white/40 border border-white/5'}`}
              >
                {freq}x / sem
              </button>
            ))}
          </div>
        </div>

        <div>
          <label className="text-[10px] font-black uppercase tracking-widest text-white/40 mb-1 block">Dia do Vencimento</label>
          <input 
            type="number"
            min="1"
            max="31"
            value={diaVencimento}
            onChange={(e) => setDiaVencimento(Number(e.target.value))}
            className="w-full bg-white/5 border border-white/10 rounded-xl px-4 py-3 text-white outline-none focus:ring-1 focus:ring-[#ef3340] text-sm font-bold mb-2 text-center"
          />
          <div className="flex gap-2">
            {diasComuns.map((dia) => (
              <button 
                key={dia}
                type="button"
                onClick={() => setDiaVencimento(dia)}
                className={`flex-1 py-2 rounded-lg text-xs font-black uppercase transition-all ${diaVencimento === dia ? 'bg-white text-black' : 'bg-white/5 text-white/40 border border-white/5'}`}
              >
                Dia {dia}
              </button>
            ))}
          </div>
        </div>

        <button 
          type="submit"
          disabled={loading}
          className="w-full bg-[#ef3340] text-white text-xs font-black uppercase tracking-widest py-4 rounded-xl active:scale-95 transition-all shadow-[0_0_15px_rgba(239,51,64,0.3)] mt-2 disabled:opacity-50"
        >
          {loading ? 'Cadastrando Aluno...' : 'Cadastrar e Aprovar Aluno'}
        </button>
      </form>
    </div>
  );
}
