import ImageResizer from '@bam.tech/react-native-image-resizer';
import { Video, Image as CompressorImage } from 'react-native-compressor';

/**
 * Compressor de arquivos para uploads
 * Simula comportamento do WhatsApp
 */

// Configurações de compressão
const COMPRESSION_CONFIG = {
  image: {
    maxWidth: 1920,       // WhatsApp usa ~1600px
    maxHeight: 1920,
    quality: 80,          // WhatsApp usa ~80%
    format: 'JPEG' as 'JPEG',
  },
  video: {
    bitrate: 1000000,     // 1 Mbps (~WhatsApp)
    maxSize: 16 * 1024 * 1024, // 16MB max (WhatsApp é ~16MB)
  }
};

export interface CompressedFile {
  uri: string;
  name: string;
  type: string;
  size: number;
  originalSize?: number;
  compressionRatio?: string;
}

/**
 * Comprimir imagem
 * Reduz resolução e qualidade mantendo proporções
 */
export async function compressImage(uri: string, filename: string): Promise<CompressedFile> {
  try {
    console.log(`📸 Comprimindo imagem: ${filename}`);

    const startTime = Date.now();

    // Usar ImageResizer para comprimir
    const compressedImage = await ImageResizer.createResizedImage(
      uri,
      COMPRESSION_CONFIG.image.maxWidth,
      COMPRESSION_CONFIG.image.maxHeight,
      COMPRESSION_CONFIG.image.format,
      COMPRESSION_CONFIG.image.quality,
      0, // rotation
      undefined, // outputPath
      false, // keepMeta
      { mode: 'contain' } // manter proporções
    );

    const endTime = Date.now();
    const compressionTime = ((endTime - startTime) / 1000).toFixed(2);

    // Calcular tamanho original (aproximado pela URI)
    const originalSize = await getFileSize(uri);
    const compressedSize = compressedImage.size || 0;
    const compressionRatio = originalSize > 0
      ? `${((1 - compressedSize / originalSize) * 100).toFixed(0)}%`
      : '0%';

    console.log(`✅ Imagem comprimida em ${compressionTime}s`);
    console.log(`   Original: ${formatBytes(originalSize)} → Comprimida: ${formatBytes(compressedSize)}`);
    console.log(`   Redução: ${compressionRatio}`);

    return {
      uri: compressedImage.uri,
      name: compressedImage.name || filename,
      type: 'image/jpeg',
      size: compressedSize,
      originalSize: originalSize,
      compressionRatio: compressionRatio,
    };
  } catch (error) {
    console.error('❌ Erro ao comprimir imagem:', error);
    // Em caso de erro, retorna arquivo original
    return {
      uri: uri,
      name: filename,
      type: 'image/jpeg',
      size: 0,
    };
  }
}

/**
 * Comprimir vídeo
 * Reduz bitrate e resolução
 */
export async function compressVideo(
  uri: string,
  filename: string,
  onProgress?: (progress: number) => void
): Promise<CompressedFile> {
  try {
    console.log(`🎥 Comprimindo vídeo: ${filename}`);

    const startTime = Date.now();
    const originalSize = await getFileSize(uri);

    // Usar react-native-compressor para vídeos
    const compressedVideo = await Video.compress(
      uri,
      {
        bitrate: COMPRESSION_CONFIG.video.bitrate,
        compressionMethod: 'auto', // auto detecta melhor método
      },
      (progress) => {
        // Callback de progresso para UI
        if (onProgress) {
          onProgress(progress);
        }
        // Log de progresso
        if (progress % 20 === 0) {
          console.log(`   Progresso: ${progress.toFixed(0)}%`);
        }
      }
    );

    const endTime = Date.now();
    const compressionTime = ((endTime - startTime) / 1000).toFixed(2);

    const compressedSize = await getFileSize(compressedVideo);
    const compressionRatio = originalSize > 0
      ? `${((1 - compressedSize / originalSize) * 100).toFixed(0)}%`
      : '0%';

    console.log(`✅ Vídeo comprimido em ${compressionTime}s`);
    console.log(`   Original: ${formatBytes(originalSize)} → Comprimido: ${formatBytes(compressedSize)}`);
    console.log(`   Redução: ${compressionRatio}`);

    // Verificar se compressão excedeu limite
    if (compressedSize > COMPRESSION_CONFIG.video.maxSize) {
      console.warn(`⚠️  Vídeo ainda muito grande: ${formatBytes(compressedSize)} > ${formatBytes(COMPRESSION_CONFIG.video.maxSize)}`);
    }

    return {
      uri: compressedVideo,
      name: filename,
      type: 'video/mp4',
      size: compressedSize,
      originalSize: originalSize,
      compressionRatio: compressionRatio,
    };
  } catch (error) {
    console.error('❌ Erro ao comprimir vídeo:', error);
    // Em caso de erro, retorna arquivo original
    return {
      uri: uri,
      name: filename,
      type: 'video/mp4',
      size: 0,
    };
  }
}

/**
 * Obter tamanho do arquivo (aproximado)
 * React Native não tem acesso direto ao tamanho, então aproximamos
 */
async function getFileSize(uri: string): Promise<number> {
  try {
    // Para URIs de file://, tentar ler metadata
    if (uri.startsWith('file://')) {
      const RNFS = require('react-native-fs');
      const stat = await RNFS.stat(uri.replace('file://', ''));
      return stat.size;
    }
    return 0;
  } catch (error) {
    // Se não conseguir obter tamanho, retorna 0
    return 0;
  }
}

/**
 * Formatar bytes para formato legível
 */
function formatBytes(bytes: number, decimals: number = 2): string {
  if (bytes === 0) return '0 Bytes';

  const k = 1024;
  const dm = decimals < 0 ? 0 : decimals;
  const sizes = ['Bytes', 'KB', 'MB', 'GB'];

  const i = Math.floor(Math.log(bytes) / Math.log(k));

  return parseFloat((bytes / Math.pow(k, i)).toFixed(dm)) + ' ' + sizes[i];
}

/**
 * Verificar se arquivo precisa de compressão
 */
export function needsCompression(fileType: string, size: number): boolean {
  // Imagens maiores que 500KB
  if (fileType.startsWith('image/') && size > 500 * 1024) {
    return true;
  }

  // Vídeos maiores que 5MB
  if (fileType.startsWith('video/') && size > 5 * 1024 * 1024) {
    return true;
  }

  return false;
}
