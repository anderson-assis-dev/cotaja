import { useCallback, useEffect, useMemo, useRef, useState } from 'react';
import { Image, Platform } from 'react-native';
import RNFS from 'react-native-fs';
import { InferenceSession } from 'onnxruntime-react-native';
import {
  FaceDetectorModel,
  LivenessModel,
  cropAndResize,
} from 'react-native-liveness-kit';
import type { BoundingBox } from 'react-native-liveness-kit';
import ImageResizer from '@bam.tech/react-native-image-resizer';

/**
 * Carregamento dos modelos de liveness SEM depender do Metro/HTTP.
 *
 * - **Android:** os 3 modelos (`face_detector`, `liveness_1`, `liveness_2`) são
 *   empacotados como assets nativos em `android/app/src/main/assets/models/` e
 *   copiados do APK com `RNFS.copyFileAssets`. Assim funciona em aparelhos reais
 *   tanto em debug quanto em release (o download do Metro por HTTP falhava em
 *   devices reais).
 * - **iOS:** mantém o caminho da lib (asset resolvido pelo bundle/Metro), que já
 *   funciona.
 *
 * A interface (`isLoading`, `error`, `analyzeFrame`) é idêntica à do hook
 * `useLiveness` da lib — replicamos a mesma lógica de detecção + FASNet.
 */

// Usados só no iOS para resolver o asset embutido pelo Metro.
const FACE_DETECTOR_MODULE = require('react-native-liveness-kit/models/face_detector.onnx');
const LIVENESS_MODULE_1 = require('react-native-liveness-kit/models/liveness_1.onnx');
const LIVENESS_MODULE_2 = require('react-native-liveness-kit/models/liveness_2.onnx');

const SESSION_OPTIONS = {
  executionProviders: ['cpu'],
  graphOptimizationLevel: 'all',
} as const;

async function materialize(fileName: string, moduleRef: number): Promise<string> {
  const dest = `${RNFS.CachesDirectoryPath}/lk-${fileName}`;
  await RNFS.unlink(dest).catch(() => {});

  if (Platform.OS === 'android') {
    // Lê direto dos assets nativos do APK — sem rede.
    await RNFS.copyFileAssets(`models/${fileName}`, dest);
    return dest;
  }

  // iOS: resolve o asset empacotado (file:// em release, http em dev).
  const source = Image.resolveAssetSource(moduleRef);
  if (!source || !source.uri) {
    throw new Error(`Não foi possível resolver o modelo ${fileName}`);
  }
  const uri = source.uri;
  if (uri.startsWith('http://') || uri.startsWith('https://')) {
    const res = await RNFS.downloadFile({ fromUrl: uri, toFile: dest }).promise;
    if (res.statusCode && res.statusCode >= 400) {
      throw new Error(`Falha ao baixar o modelo ${fileName} (HTTP ${res.statusCode})`);
    }
    return dest;
  }
  await RNFS.copyFile(uri.replace('file://', ''), dest);
  return dest;
}

export interface FrameLivenessResult {
  faceDetected: boolean;
  boundingBox: BoundingBox | null;
  score: number | null;
}

export interface UseLivenessModelsResult {
  isLoading: boolean;
  error: Error | null;
  analyzeFrame: (
    frameUri: string,
    sourceWidth: number,
    sourceHeight: number,
  ) => Promise<FrameLivenessResult>;
}

export function useLivenessModels(): UseLivenessModelsResult {
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<Error | null>(null);
  const detectorRef = useRef<FaceDetectorModel | null>(null);
  const livenessRef = useRef<LivenessModel | null>(null);

  useEffect(() => {
    let cancelled = false;
    (async () => {
      try {
        const [detectorPath, liveness1Path, liveness2Path] = await Promise.all([
          materialize('face_detector.onnx', FACE_DETECTOR_MODULE),
          materialize('liveness_1.onnx', LIVENESS_MODULE_1),
          materialize('liveness_2.onnx', LIVENESS_MODULE_2),
        ]);

        const [detectorSession, liveness1Session, liveness2Session] = await Promise.all([
          InferenceSession.create(detectorPath, SESSION_OPTIONS),
          InferenceSession.create(liveness1Path, SESSION_OPTIONS),
          InferenceSession.create(liveness2Path, SESSION_OPTIONS),
        ]);

        if (cancelled) return;
        detectorRef.current = new FaceDetectorModel(detectorSession);
        livenessRef.current = new LivenessModel(liveness1Session, liveness2Session);
        setIsLoading(false);
      } catch (e: any) {
        if (cancelled) return;
        console.error('[LivenessKit] Falha ao carregar modelos localmente:', e?.message, e);
        setError(e instanceof Error ? e : new Error(String(e)));
        setIsLoading(false);
      }
    })();
    return () => { cancelled = true; };
  }, []);

  const analyzeFrame = useCallback<UseLivenessModelsResult['analyzeFrame']>(
    async (frameUri, sourceWidth, sourceHeight) => {
      const detectorModel = detectorRef.current;
      const livenessModel = livenessRef.current;
      if (!detectorModel || !livenessModel) {
        throw new Error('Modelos ainda não carregados');
      }

      let activeUri = frameUri;
      let activeWidth = sourceWidth;
      let activeHeight = sourceHeight;

      if (Platform.OS === 'android') {
        try {
          // No Android, fotos tiradas da câmera possuem metadados de orientação EXIF (ex: rotação de 90/270 graus).
          // O ImageEditor do React Native possui um bug conhecido onde ele calcula incorretamente a região de corte
          // se a imagem tiver metadados de orientação EXIF, gerando o crash:
          // "ImageEditor.cropImage failed - java.lang.IllegalArgumentException: y + height must be <= bitmap.height()".
          //
          // Para resolver de forma definitiva, usamos o ImageResizer para gerar uma cópia da imagem com a orientação
          // física "assada" (baked) e sem metadados EXIF de rotação (EXIF rotation = 0).
          // Assim, qualquer chamada posterior ao ImageEditor funcionará perfeitamente sem crash.
          const startTime = Date.now();
          const normalized = await ImageResizer.createResizedImage(
            frameUri,
            sourceWidth,
            sourceHeight,
            'JPEG',
            100, // mantém qualidade total
            0, // rotação
            undefined, // diretório padrão
            false, // descarta metadados EXIF antigos de rotação
            { mode: 'contain' }
          );
          
          activeUri = normalized.uri;
          activeWidth = normalized.width;
          activeHeight = normalized.height;
          console.log(`[LivenessKit] Imagem normalizada no Android em ${Date.now() - startTime}ms. Nova dimensão: ${activeWidth}x${activeHeight}`);
        } catch (err) {
          console.error('[LivenessKit] Falha ao normalizar imagem no Android:', err);
        }
      }

      // 1. Detectar face usando a imagem normalizada
      const faces = await detectorModel.detect(activeUri, activeWidth, activeHeight, {
        scoreThreshold: 0.3,
        maxFaces: 1,
      });
      const face = faces[0];
      if (!face) {
        return { faceDetected: false, boundingBox: null, score: null };
      }

      // MiniFASNetV2 (2.7×) e MiniFASNetV1SE (4.0×) usam recortes centrados.
      const tight = face.boundingBox;
      const makeCrop = (box: BoundingBox, scale: number): BoundingBox => {
        const cx = box.x + box.width / 2;
        const cy = box.y + box.height / 2;
        let nw = box.width * scale;
        let nh = box.height * scale;
        let nx = cx - nw / 2;
        let ny = cy - nh / 2;

        // Clampar para garantir que não ultrapasse os limites da imagem
        if (nx < 0) { nw += nx; nx = 0; }
        if (ny < 0) { nh += ny; ny = 0; }
        if (nx + nw > activeWidth) { nw = activeWidth - nx; }
        if (ny + nh > activeHeight) { nh = activeHeight - ny; }

        nw = Math.max(1, nw);
        nh = Math.max(1, nh);

        return { x: nx, y: ny, width: nw, height: nh };
      };

      // 2. Realizar recortes e predição (com a imagem normalizada, sem risco de crash no ImageEditor)
      const [scale1Uri, scale2Uri] = await Promise.all([
        cropAndResize(activeUri, makeCrop(tight, 2.7), { width: 80, height: 80 }),
        cropAndResize(activeUri, makeCrop(tight, 4.0), { width: 80, height: 80 }),
      ]);

      const raw = await livenessModel.predict(scale1Uri, scale2Uri);

      // Limpar as imagens temporárias do crop para não acumular lixo no disco no Android
      if (Platform.OS === 'android') {
        RNFS.unlink(activeUri.replace('file://', '')).catch(() => {});
        RNFS.unlink(scale1Uri.replace('file://', '')).catch(() => {});
        RNFS.unlink(scale2Uri.replace('file://', '')).catch(() => {});
      }

      return { faceDetected: true, boundingBox: tight, score: raw.score };
    },
    [],
  );

  return useMemo(
    () => ({ isLoading, error, analyzeFrame }),
    [isLoading, error, analyzeFrame],
  );
}
