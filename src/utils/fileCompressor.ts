import ImageResizer from '@bam.tech/react-native-image-resizer';
import { Video, Image as CompressorImage } from 'react-native-compressor';

const COMPRESSION_CONFIG = {
  image: {
    maxWidth: 1920,
    maxHeight: 1920,
    quality: 80,
    format: 'JPEG' as 'JPEG',
  },
  video: {
    bitrate: 1000000,
    maxSize: 16 * 1024 * 1024,
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

export async function compressImage(uri: string, filename: string): Promise<CompressedFile> {
  try {
    console.log(`📸 Comprimindo imagem: ${filename}`);

    const startTime = Date.now();

    const compressedImage = await ImageResizer.createResizedImage(
      uri,
      COMPRESSION_CONFIG.image.maxWidth,
      COMPRESSION_CONFIG.image.maxHeight,
      COMPRESSION_CONFIG.image.format,
      COMPRESSION_CONFIG.image.quality,
      0,
      undefined,
      false,
      { mode: 'contain' }
    );

    const endTime = Date.now();
    const compressionTime = ((endTime - startTime) / 1000).toFixed(2);

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
    return {
      uri: uri,
      name: filename,
      type: 'image/jpeg',
      size: 0,
    };
  }
}

export async function compressVideo(
  uri: string,
  filename: string,
  onProgress?: (progress: number) => void
): Promise<CompressedFile> {
  try {
    console.log(`🎥 Comprimindo vídeo: ${filename}`);

    const startTime = Date.now();
    const originalSize = await getFileSize(uri);

    const compressedVideo = await Video.compress(
      uri,
      {
        bitrate: COMPRESSION_CONFIG.video.bitrate,
        compressionMethod: 'auto',
      },
      (progress) => {
        if (onProgress) {
          onProgress(progress);
        }
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
    return {
      uri: uri,
      name: filename,
      type: 'video/mp4',
      size: 0,
    };
  }
}

async function getFileSize(uri: string): Promise<number> {
  try {
    if (uri.startsWith('file://')) {
      const RNFS = require('react-native-fs');
      const stat = await RNFS.stat(uri.replace('file://', ''));
      return stat.size;
    }
    return 0;
  } catch (error) {
    return 0;
  }
}

function formatBytes(bytes: number, decimals: number = 2): string {
  if (bytes === 0) return '0 Bytes';

  const k = 1024;
  const dm = decimals < 0 ? 0 : decimals;
  const sizes = ['Bytes', 'KB', 'MB', 'GB'];

  const i = Math.floor(Math.log(bytes) / Math.log(k));

  return parseFloat((bytes / Math.pow(k, i)).toFixed(dm)) + ' ' + sizes[i];
}

export function needsCompression(fileType: string, size: number): boolean {
  if (fileType.startsWith('image/') && size > 500 * 1024) {
    return true;
  }

  if (fileType.startsWith('video/') && size > 5 * 1024 * 1024) {
    return true;
  }

  return false;
}
