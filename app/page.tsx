"use client";
import { useState, useEffect } from 'react';
import { supabase } from '../lib/supabase';

interface AdminAlunosViewProps {
  onVoltar: () => void;
}

export function AdminAlunosView({ onVoltar }: AdminAlunosViewProps) {
  const [busca, setBusca] = useState('');
  const [filtro, setFiltro] = useState<'todos' | 'vencimento'>('todos');
  const [alunos, setAlunos] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => { carregarAlunos(); }, []);

  async function carregarAlunos() {
    setLoading(true);

    const { data } = await supabase
      .from('alunos')
      .select('*')
      .eq('status', 'aprovado')
      .order('nome', { ascending: true });

    if (data) setAlunos(data);
    setLoading(false);
  }

  function getTagsNivel(horario: string) {
    if (!horario) return ['INICIANTE'];
    const h = parseInt(horario.replace('h', ''));

    if (h === 8 || h === 18) return ['INICIANTE AVANÇADO'];
    if ([7, 17, 19, 20].includes(h)) return ['APRENDIZ', 'INICIANTE'];

    return ['INICIANTE'];
  }

  async function alterarFrequencia(aluno: any) {
    if (aluno.mensalidade_paga) {
      alert("⚠️ FINANCEIRO TRAVADO");
      return;
    }

    const frequencias = [2, 3, 5];
    const indexAtual = frequencias.indexOf(aluno.frequencia_semanal || 2);
    const novaFreq = frequencias[(indexAtual + 1) % frequencias.length];

    const { error } = await supabase
      .from('alunos')
      .update({ frequencia_semanal: novaFreq })
      .eq('id', aluno.id);

    if (!error) {
      setAlunos(prev =>
        prev.map(a =>
          a.id === aluno.id ? { ...a, frequencia_semanal: novaFreq } : a
        )
      );
    }
  }

  async function confirmarPagamento(aluno: any) {
    const confirmar = window.confirm(
      `${aluno.mensalidade_paga ? "ESTORNAR" : "CONFIRMAR"} pagamento de ${aluno.nome}?`
    );

    if (!confirmar) return;

    const novoStatus = !aluno.mensalidade_paga;

    const { error } = await supabase
      .from('alunos')
      .update({ mensalidade_paga: novoStatus })
      .eq('id', aluno.id);

    if (!error) {
      setAlunos(prev =>
        prev.map(a =>
          a.id === aluno.id ? { ...a, mensalidade_paga: novoStatus } : a
        )
      );
    }
  }

  const alunosFiltrados = alunos.filter(aluno =>
    `${aluno.nome} ${aluno.sobrenome}`
      .toLowerCase()
      .includes(busca.toLowerCase())
  );

  function CardAluno({ aluno, mostrarDia }: { aluno: any; mostrarDia?: boolean }) {
    const tags = getTagsNivel(aluno.horario);

    return (
      <div className={`w-full bg-[#121212] border rounded-2xl p-4 flex items-center justify-between active:scale-[0.98] transition-all ${aluno.mensalidade_paga ? 'border-green-500/30' : 'border-white/5'}`}>

        <div className="flex items-center gap-3 flex-1">
          <div className="w-12 h-12 rounded-xl overflow-hidden border border-white/10 bg-white/5">
            <img src={aluno.foto_url} className="w-full h-full object-cover" />
          </div>

          <div>
            <h4 className="text-sm font-black uppercase text-white/90 leading-tight">
              {aluno.nome} {aluno.sobrenome}
            </h4>

            <div className="flex gap-1 mt-1 flex-wrap">
              {mostrarDia ? (
                <span className={`text-[10px] font-black uppercase ${aluno.mensalidade_paga ? 'text-green-400' : 'text-[#ef3340]'}`}>
                  Vencimento dia {aluno.dia_vencimento}
                </span>
              ) : (
                tags.map(tag => (
                  <span key={tag} className="text-[9px] font-black uppercase px-2 py-0.5 rounded border border-white/10 text-white/60">
                    {tag}
                  </span>
                ))
              )}
            </div>
          </div>
        </div>

        <div className="flex gap-2">
          <button
            onClick={() => alterarFrequencia(aluno)}
            className="px-3 py-2 rounded-xl bg-white/5 border border-white/10 text-xs font-black"
          >
            {aluno.frequencia_semanal || 2}x
          </button>

          <button
            onClick={() => confirmarPagamento(aluno)}
            className={`w-10 h-10 rounded-xl flex items-center justify-center ${aluno.mensalidade_paga ? 'bg-green-500 text-black' : 'bg-[#1a1a1a] border border-white/5 text-white/20'}`}
          >
            ✓
          </button>
        </div>
      </div>
    );
  }

  return (
    <div className="w-full min-h-screen pb-20 pt-4">

      {/* HEADER */}
      <div className="px-4 mb-6 flex items-center gap-3">
        <button onClick={onVoltar} className="p-2 bg-white/5 rounded-full">
          ←
        </button>
        <h2 className="text-xl font-black uppercase">Base de atletas</h2>
      </div>

      {/* BUSCA */}
      <div className="px-4 mb-4">
        <input
          type="text"
          placeholder="Buscar aluno..."
          className="w-full bg-[#121212] border border-white/10 rounded-xl px-4 py-3 text-sm"
          value={busca}
          onChange={(e) => setBusca(e.target.value)}
        />
      </div>

      {/* FILTROS */}
      <div className="px-4 mb-6 flex gap-2">
        <button
          onClick={() => setFiltro('todos')}
          className={`flex-1 py-3 rounded-xl text-xs font-black ${filtro === 'todos' ? 'bg-white text-black' : 'bg-white/5 text-white/40'}`}
        >
          TODOS
        </button>

        <button
          onClick={() => setFiltro('vencimento')}
          className={`flex-1 py-3 rounded-xl text-xs font-black ${filtro === 'vencimento' ? 'bg-[#ef3340]' : 'bg-white/5 text-white/40'}`}
        >
          VENCIMENTO
        </button>
      </div>

      {/* LISTA */}
      <div className="px-3 flex flex-col gap-3">
        {loading ? (
          <p className="text-center py-10 text-white/20 text-xs uppercase">
            Carregando...
          </p>
        ) : filtro === 'todos' ? (
          alunosFiltrados.map(aluno => (
            <CardAluno key={aluno.id} aluno={aluno} />
          ))
        ) : (
          [10, 15, 20].map(dia => {
            const grupo = alunosFiltrados.filter(a => a.dia_vencimento === dia);
            if (!grupo.length) return null;

            return (
              <div key={dia}>
                <div className="flex items-center gap-2 mb-3 px-1">
                  <span className="bg-[#ef3340] text-xs px-3 py-1 rounded-full">
                    Dia {dia}
                  </span>
                  <div className="flex-1 h-[1px] bg-white/10" />
                </div>

                <div className="flex flex-col gap-3">
                  {grupo.map(aluno => (
                    <CardAluno key={aluno.id} aluno={aluno} mostrarDia />
                  ))}
                </div>
              </div>
            );
          })
        )}
      </div>
    </div>
  );
}