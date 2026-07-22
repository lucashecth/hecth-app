// src/components/FotoObrigatoriaView.tsx
"use client";

import { useState } from 'react';
import { supabase } from '../lib/supabase';

interface FotoObrigatoriaViewProps {
  alunoDb: any;
  onFotoEnviada: () => void;
  onLogout: () => void;
}

export function FotoObrigatoriaView({ alunoDb, onFotoEnviada, onLogout }: FotoObrigatoriaViewProps) {
  const [foto, setFoto] = useState<File | null>(null);
  const [preview, setPreview] = useState<string | null>(null);
  const [loading, setLoading] = useState(false);

  const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0] || null;
    setFoto(file);
    if (file) {
      const url = URL.createObjectURL(file);
      setPreview(url);
    } else {
      setPreview(null);
    }
  };

  const handleUpload = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!foto) return alert("Por favor, selecione uma foto de perfil!");

    setLoading(true);
    try {
      const fileExt = foto.name.split('.').pop();
      const fileName = `avatar_${alunoDb.id}_${Date.now()}.${fileExt}`;

      const { error: uploadError } = await supabase
        .storage
        .from('avatares')
        .upload(fileName, foto);

      if (uploadError) throw uploadError;

      const { data: publicUrlData } = supabase
        .storage
        .from('avatares')
        .getPublicUrl(fileName);

      const fotoUrl = publicUrlData.publicUrl;

      // Update student profile in Supabase
      const { error: updateError } = await supabase
        .from('alunos')
        .update({ foto_url: fotoUrl })
        .eq('id', alunoDb.id);

      if (updateError) throw updateError;

      alert("Foto cadastrada com sucesso! Seja bem-vindo.");
      onFotoEnviada();
    } catch (err: any) {
      alert("Erro ao enviar foto: " + err.message);
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="min-h-screen bg-black flex flex-col items-center justify-center p-5 text-white font-sans">
      <div className="bg-[#121212] p-8 rounded-[2.5rem] border border-[#ef3340]/30 max-w-md w-full text-center shadow-[0_0_40px_rgba(239,51,64,0.1)] animacao-entrada">
        <div className="w-16 h-16 rounded-full bg-[#ef3340]/10 border border-[#ef3340]/30 flex items-center justify-center text-2xl mx-auto mb-4">
          📸
        </div>

        <h1 className="text-2xl font-black uppercase tracking-tighter mb-2 text-white">
          Foto Obrigatória
        </h1>
        <p className="text-xs text-white/50 font-bold uppercase tracking-wider mb-8 leading-relaxed">
          Olá, <span className="text-white font-black">{alunoDb?.nome}</span>! Para liberar seu acesso à plataforma, adicione sua foto de perfil abaixo.
        </p>

        <form onSubmit={handleUpload} className="flex flex-col items-center gap-6">
          {/* Avatar Preview Circle */}
          <label className="relative cursor-pointer group">
            <div className="w-32 h-32 rounded-full overflow-hidden border-2 border-dashed border-[#ef3340] group-hover:border-white transition-colors bg-white/5 flex items-center justify-center shadow-lg">
              {preview ? (
                <img src={preview} alt="Prévia" className="w-full h-full object-cover" />
              ) : (
                <div className="flex flex-col items-center gap-1 text-white/40 group-hover:text-white transition-colors">
                  <span className="text-3xl">📷</span>
                  <span className="text-[9px] font-black uppercase tracking-widest">Escolher Foto</span>
                </div>
              )}
            </div>
            <input 
              type="file" 
              accept="image/*"
              onChange={handleFileChange} 
              className="hidden" 
              required
            />
          </label>

          <button 
            type="submit" 
            disabled={loading || !foto}
            className="w-full bg-[#ef3340] text-white font-black text-xs uppercase tracking-widest py-4 rounded-xl active:scale-95 transition-all shadow-[0_0_20px_rgba(239,51,64,0.4)] disabled:opacity-40 disabled:cursor-not-allowed"
          >
            {loading ? 'Enviando...' : 'Salvar Foto e Continuar'}
          </button>
        </form>

        <button 
          onClick={onLogout} 
          className="mt-6 text-white/30 hover:text-white/60 text-[10px] font-black uppercase tracking-widest transition-colors"
        >
          Sair da Conta
        </button>
      </div>
    </div>
  );
}
