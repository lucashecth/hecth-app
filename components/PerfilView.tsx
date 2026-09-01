"use client";
import { useState, useRef, useCallback } from 'react';
import { supabase } from '../lib/supabase';
import { fileToBase64 } from '../utils/imagem';
import Cropper from 'react-easy-crop';

import { TagApelido } from './TagApelido';


interface PerfilViewProps {
  onVoltar: () => void;
  alunoDb: any;
}

// ----------------------------------------------------------------------
// FUNÇÕES UTILITÁRIAS PARA O CORTE DA IMAGEM (CANVAS)
// ----------------------------------------------------------------------
const createImage = (url: string): Promise<HTMLImageElement> =>
  new Promise((resolve, reject) => {
    const image = new Image();
    image.addEventListener('load', () => resolve(image));
    image.addEventListener('error', (error) => reject(error));
    image.setAttribute('crossOrigin', 'anonymous');
    image.src = url;
  });

async function getCroppedImg(imageSrc: string, pixelCrop: any): Promise<Blob> {
  const image = await createImage(imageSrc);
  const canvas = document.createElement('canvas');
  const ctx = canvas.getContext('2d');

  if (!ctx) throw new Error('Sem contexto 2D');

  canvas.width = pixelCrop.width;
  canvas.height = pixelCrop.height;

  ctx.drawImage(
    image,
    pixelCrop.x,
    pixelCrop.y,
    pixelCrop.width,
    pixelCrop.height,
    0,
    0,
    pixelCrop.width,
    pixelCrop.height
  );

  return new Promise((resolve, reject) => {
    canvas.toBlob((file) => {
      if (file) resolve(file);
      else reject(new Error('Erro ao gerar imagem cortada'));
    }, 'image/jpeg', 0.9);
  });
}
// ----------------------------------------------------------------------


export function PerfilView({ onVoltar, alunoDb }: PerfilViewProps) {
  const [uploading, setUploading] = useState(false);
  const fileInputRef = useRef<HTMLInputElement>(null);
  const [dataNascimento, setDataNascimento] = useState(alunoDb?.data_nascimento || '');

  const handleSalvarDataNascimento = async (val: string) => {
    setDataNascimento(val);
    try {
      const { error } = await supabase
        .from('alunos')
        .update({ data_nascimento: val || null })
        .eq('id', alunoDb.id);
      
      if (error) throw error;
    } catch (e: any) {
      alert("Erro ao salvar data de nascimento: " + e.message);
    }
  };

  const [modalSenha, setModalSenha] = useState(false);
  const [novaSenhaInput, setNovaSenhaInput] = useState('');
  const [confirmSenhaInput, setConfirmSenhaInput] = useState('');
  const [salvandoSenha, setSalvandoSenha] = useState(false);

  const handleAlterarSenha = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!novaSenhaInput || !confirmSenhaInput) {
      return alert('Por favor, preencha todos os campos!');
    }
    if (novaSenhaInput.length < 6) {
      return alert('A senha deve ter pelo menos 6 caracteres!');
    }
    if (novaSenhaInput !== confirmSenhaInput) {
      return alert('As senhas não coincidem!');
    }

    setSalvandoSenha(true);
    try {
      const { error } = await supabase.auth.updateUser({ password: novaSenhaInput });
      if (error) throw error;

      alert('✅ Senha alterada com sucesso!');
      setModalSenha(false);
      setNovaSenhaInput('');
      setConfirmSenhaInput('');
    } catch (err: any) {
      alert('Erro ao alterar senha: ' + err.message);
    } finally {
      setSalvandoSenha(false);
    }
  };



  // Estados para o Cropper
  const [imageSrc, setImageSrc] = useState<string | null>(null);
  const [crop, setCrop] = useState({ x: 0, y: 0 });
  const [zoom, setZoom] = useState(1);
  const [croppedAreaPixels, setCroppedAreaPixels] = useState<any>(null);

  // 1. O usuário seleciona o arquivo e nós lemos como URL temporária
  const onFileChange = async (e: React.ChangeEvent<HTMLInputElement>) => {
    if (e.target.files && e.target.files.length > 0) {
      const file = e.target.files[0];
      const reader = new FileReader();
      reader.addEventListener('load', () => setImageSrc(reader.result?.toString() || null));
      reader.readAsDataURL(file);
    }
  };

  const onCropComplete = useCallback((croppedArea: any, croppedAreaPixels: any) => {
    setCroppedAreaPixels(croppedAreaPixels);
  }, []);

  // 2. O usuário clica em Salvar na tela de corte
  const handleSalvarCrop = async () => {
    try {
      setUploading(true);
      
      // Gera a imagem final recortada
      const croppedImageBlob = await getCroppedImg(imageSrc as string, croppedAreaPixels);
      
      // Converte para Base64 DataURL ultraleve
      const fotoUrl = await fileToBase64(croppedImageBlob, 350, 0.7);
      
      const { error } = await supabase.from('alunos').update({ foto_url: fotoUrl }).eq('email', alunoDb.email);
      if (error) throw error;
      
      alert("✅ Foto atualizada com sucesso!");
      window.location.reload(); // Recarrega para aplicar a foto
      
    } catch (error: any) {
      alert("Erro ao enviar foto: " + error.message);
      setUploading(false);
    }
  };


  return (
    <div className="animacao-entrada w-full pb-20 pt-4">
      
      {/* TELA DE CORTE (MODAL) - Só aparece se tiver imagem selecionada */}
      {imageSrc && (
        <div className="fixed inset-0 z-50 bg-black flex flex-col animacao-entrada">
          {/* Header do Cropper */}
          <div className="flex items-center justify-between p-5 bg-[#121212] border-b border-white/10 z-10">
            <button 
              onClick={() => { setImageSrc(null); setUploading(false); }} 
              className="text-xs font-black uppercase text-white/50 tracking-widest"
              disabled={uploading}
            >
              Cancelar
            </button>
            <h2 className="text-sm font-black italic uppercase text-white tracking-widest">Ajustar Foto</h2>
            <button 
              onClick={handleSalvarCrop} 
              className="text-xs font-black uppercase text-[#ef3340] tracking-widest"
              disabled={uploading}
            >
              {uploading ? 'Salvando...' : 'Salvar'}
            </button>
          </div>
          
          {/* Área do Cropper (Zoom e Movimento) */}
          <div className="relative flex-1 bg-black">
            <Cropper
              image={imageSrc}
              crop={crop}
              zoom={zoom}
              aspect={1}
              cropShape="round"
              showGrid={false}
              onCropChange={setCrop}
              onCropComplete={onCropComplete}
              onZoomChange={setZoom}
            />
          </div>

          {/* Controle de Zoom Manual para Rodapé */}
          <div className="p-8 bg-[#121212] border-t border-white/10 z-10 flex flex-col items-center gap-3">
            <span className="text-[10px] font-black uppercase tracking-[0.2em] text-white/40 italic">Ajuste o Zoom</span>
            <input
              type="range"
              value={zoom}
              min={1}
              max={3}
              step={0.1}
              aria-labelledby="Zoom"
              onChange={(e) => setZoom(Number(e.target.value))}
              className="w-full accent-[#ef3340]"
            />
          </div>
        </div>
      )}

      {/* HEADER NORMAL DO PERFIL */}
      <div className="flex items-center gap-4 mb-8 px-5">
        <button onClick={onVoltar} className="p-3 bg-white/5 rounded-full text-white/50 active:scale-95 transition-transform">
          <svg xmlns="http://www.w3.org/2000/svg" width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="3" strokeLinecap="round" strokeLinejoin="round"><path d="m15 18-6-6 6-6"/></svg>
        </button>
        <h2 className="text-2xl font-black uppercase italic tracking-tighter text-white">Meu Perfil</h2>
      </div>

      {/* CARD DO PERFIL */}
      <div className="px-5">
        <div className="bg-[#121212] border border-white/5 rounded-3xl p-6 flex flex-col items-center text-center">
          <div className="w-24 h-24 rounded-full overflow-hidden border border-white/10 mb-4 bg-white/5 shrink-0 relative">
            {alunoDb?.foto_url ? (
              <img src={alunoDb.foto_url} alt="Foto de perfil" className="w-full h-full object-cover" />
            ) : (
              <div className="w-full h-full flex items-center justify-center text-3xl font-black text-[#ef3340]">
                {alunoDb?.nome?.charAt(0) || '?'}
              </div>
            )}
          </div>
          
          <h3 className="text-xl font-black uppercase tracking-tighter text-white/90 leading-tight flex items-center gap-1.5 flex-wrap justify-center">
            {alunoDb?.nome} {alunoDb?.sobrenome}
            <TagApelido apelido={alunoDb?.apelido} mode="name" />
          </h3>

          <div className="flex justify-center mb-6">
            <TagApelido 
              apelido={alunoDb?.apelido} 
              nivel={alunoDb?.nivel || 'Atleta HECTH'} 
              levelStyle="border-[#ef3340]/25 text-[#ef3340] bg-[#ef3340]/5" 
              mode="level" 
            />
          </div>


          <input type="file" accept="image/*" className="hidden" ref={fileInputRef} onChange={onFileChange} />
          <button 
            onClick={() => fileInputRef.current?.click()}
            className="bg-white/5 border border-white/10 px-6 py-3 rounded-xl text-xs font-black uppercase tracking-widest text-white/70 active:bg-white/10 transition-all flex items-center gap-2"
          >
            <svg xmlns="http://www.w3.org/2000/svg" width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round"><path d="M21 15v4a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2v-4"/><polyline points="17 8 12 3 7 8"/><line x1="12" x2="12" y1="3" y2="15"/></svg>
            Alterar Foto
          </button>
        </div>

        {/* INFO ADICIONAL */}
        <div className="mt-4 flex flex-col gap-2">
          <div className="bg-[#1a1a1a] border border-white/5 rounded-2xl p-4 flex items-center justify-between">
            <span className="text-[10px] font-black uppercase tracking-widest text-white/40">E-mail</span>
            <span className="text-xs font-bold text-white/80 truncate ml-4">{alunoDb?.email}</span>
          </div>
          <div className="bg-[#1a1a1a] border border-white/5 rounded-2xl p-4 flex items-center justify-between">
            <span className="text-[10px] font-black uppercase tracking-widest text-white/40">Status</span>
            <span className="text-[10px] font-black uppercase tracking-widest text-green-400 italic">
              {alunoDb?.status === 'aprovado' ? 'Ativo' : alunoDb?.status}
            </span>
          </div>

          <button
            onClick={() => setModalSenha(true)}
            className="w-full bg-[#1a1a1a] hover:bg-white/5 border border-white/5 rounded-2xl p-4 flex items-center justify-between text-left transition-all active:scale-[0.99] mt-2"
          >
            <div className="flex items-center gap-3">
              <div className="w-8 h-8 rounded-xl bg-orange-500/10 text-orange-400 flex items-center justify-center text-sm font-black">
                🔐
              </div>
              <div>
                <span className="text-xs font-black uppercase text-white/90 block leading-tight">Alterar Senha</span>
                <span className="text-[9px] text-white/40 uppercase font-black tracking-widest">Definir nova senha de acesso</span>
              </div>
            </div>
            <span className="text-white/30 text-xs">›</span>
          </button>
        </div>

        {modalSenha && (
          <div className="fixed inset-0 z-[100] bg-black/85 backdrop-blur-md flex items-center justify-center p-4">
            <div className="bg-[#1a1a1a] border border-[#ef3340]/40 p-8 rounded-[2rem] max-w-sm w-full animacao-entrada text-left shadow-[0_0_50px_rgba(239,51,64,0.2)]">
              <div className="text-center mb-6">
                <div className="w-14 h-14 rounded-full bg-[#ef3340]/10 border border-[#ef3340]/30 flex items-center justify-center text-2xl mx-auto mb-3">
                  🔐
                </div>
                <h3 className="text-white font-black uppercase tracking-tight text-xl leading-none">Alterar Senha</h3>
                <p className="text-white/40 text-[10px] uppercase font-black tracking-widest mt-2 leading-relaxed">
                  Digite e confirme sua nova senha.
                </p>
              </div>

              <form onSubmit={handleAlterarSenha} className="flex flex-col gap-4">
                <div>
                  <label className="text-[9px] font-black uppercase tracking-widest text-white/40 mb-1.5 block">Nova Senha (mín. 6 caracteres)</label>
                  <input 
                    type="password" 
                    required 
                    placeholder="••••••••"
                    value={novaSenhaInput}
                    onChange={(e) => setNovaSenhaInput(e.target.value)}
                    className="w-full bg-white/5 border border-white/10 rounded-xl px-4 py-3.5 text-white outline-none focus:ring-1 focus:ring-[#ef3340] text-sm font-bold"
                  />
                </div>

                <div>
                  <label className="text-[9px] font-black uppercase tracking-widest text-white/40 mb-1.5 block">Confirmar Nova Senha</label>
                  <input 
                    type="password" 
                    required 
                    placeholder="••••••••"
                    value={confirmSenhaInput}
                    onChange={(e) => setConfirmSenhaInput(e.target.value)}
                    className="w-full bg-white/5 border border-white/10 rounded-xl px-4 py-3.5 text-white outline-none focus:ring-1 focus:ring-[#ef3340] text-sm font-bold"
                  />
                </div>

                <button 
                  type="submit" 
                  disabled={salvandoSenha} 
                  className="w-full bg-gradient-to-r from-orange-500 to-[#ef3340] text-white text-[11px] font-black uppercase tracking-widest py-4 rounded-xl active:scale-95 transition-all shadow-[0_0_15px_rgba(239,51,64,0.3)] disabled:opacity-50 mt-2"
                >
                  {salvandoSenha ? 'Salvando...' : 'Salvar Nova Senha'}
                </button>

                <button 
                  type="button" 
                  onClick={() => {
                    setModalSenha(false);
                    setNovaSenhaInput('');
                    setConfirmSenhaInput('');
                  }} 
                  className="w-full border border-white/10 bg-white/5 text-white/60 text-[10px] font-black uppercase tracking-widest py-3 rounded-xl transition-all active:scale-95 text-center"
                >
                  Cancelar
                </button>
              </form>
            </div>
          </div>
        )}
      </div>
    </div>
  );
}