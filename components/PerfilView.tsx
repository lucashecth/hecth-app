"use client";
import { useState, useRef, useCallback } from 'react';
import { supabase } from '../lib/supabase';
import Cropper from 'react-easy-crop';

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
      
      // Upload para o Supabase
      const fileName = `perfil-${alunoDb.id}-${Date.now()}.jpg`;
      const { error: uploadError } = await supabase.storage.from('avatares').upload(fileName, croppedImageBlob);
      if (uploadError) throw uploadError;
      
      // Pega URL Pública e atualiza o banco
      const { data: publicUrlData } = supabase.storage.from('avatares').getPublicUrl(fileName);
      await supabase.from('alunos').update({ foto_url: publicUrlData.publicUrl }).eq('id', alunoDb.id);
      
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
          
          <h3 className="text-xl font-black uppercase tracking-tighter text-white/90 leading-tight">
            {alunoDb?.nome} {alunoDb?.sobrenome}
          </h3>
          <p className="text-[10px] font-black uppercase tracking-widest text-[#ef3340] italic mt-1 mb-6">
            {alunoDb?.nivel || 'Atleta HECTH'}
          </p>

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
        </div>
      </div>
    </div>
  );
}