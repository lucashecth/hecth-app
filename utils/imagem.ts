// src/utils/imagem.ts

/**
 * Comprime uma imagem no lado do cliente usando Canvas HTML5
 * @param file O arquivo de imagem original
 * @param maxWidth Largura máxima desejada
 * @param quality Qualidade do JPEG (de 0.1 a 1.0)
 * @returns Promise com o Blob comprimido (convertido para File)
 */
export function comprimirImagem(file: File, maxWidth: number = 800, quality: number = 0.75): Promise<File> {
  return new Promise((resolve, reject) => {
    // Se o arquivo for muito pequeno (menos de 300KB), não precisa de compressão
    if (file.size < 300 * 1024) {
      resolve(file);
      return;
    }

    const reader = new FileReader();
    reader.readAsDataURL(file);
    reader.onload = (event) => {
      const img = new Image();
      img.src = event.target?.result as string;
      img.onload = () => {
        const canvas = document.createElement('canvas');
        let width = img.width;
        let height = img.height;

        // Mantém a proporção da imagem se passar da largura máxima
        if (width > maxWidth) {
          height = Math.round((height * maxWidth) / width);
          width = maxWidth;
        }

        canvas.width = width;
        canvas.height = height;

        const ctx = canvas.getContext('2d');
        if (!ctx) {
          reject(new Error("Não foi possível carregar o canvas para compressão."));
          return;
        }

        ctx.drawImage(img, 0, 0, width, height);

        canvas.toBlob(
          (blob) => {
            if (blob) {
              // Converte o Blob gerado de volta para um objeto File para manter compatibilidade de upload
              const compressedFile = new File([blob], file.name.replace(/\.[^/.]+$/, "") + ".jpg", {
                type: 'image/jpeg',
                lastModified: Date.now()
              });
              resolve(compressedFile);
            } else {
              reject(new Error("Erro ao comprimir imagem."));
            }
          },
          'image/jpeg',
          quality
        );
      };
      img.onerror = (err) => reject(err);
    };
    reader.onerror = (err) => reject(err);
  });
}
