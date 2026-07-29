import React, { useCallback, useEffect, useRef, useState } from 'react';
import {
  ActivityIndicator,
  Dimensions,
  StyleSheet,
  Text,
  TouchableOpacity,
  View,
} from 'react-native';
import {
  Camera,
  useCameraDevice,
  useCameraFormat,
  useCameraPermission,
} from 'react-native-vision-camera';
import RNFS from 'react-native-fs';
import AsyncStorage from '@react-native-async-storage/async-storage';
import Icon from 'react-native-vector-icons/MaterialIcons';
import { useLivenessModels } from './useLivenessModels';

/** Marca que este aparelho não conseguiu carregar os modelos de liveness, para
 *  não travar o usuário pedindo a verificação repetidamente. */
export const LIVENESS_UNSUPPORTED_KEY = 'liveness_device_unsupported_v1';

const { width: SCREEN_W, height: SCREEN_H } = Dimensions.get('window');
const OVAL_W = (SCREEN_W * 2) / 3;
const OVAL_H = OVAL_W * 1.35;
const CAPTURE_INTERVAL_MS = 300;

export interface LivenessResultData {
  isLive: boolean;
  confidence: number;
  imageBase64: string | null;
  /** true quando o modelo não pôde ser carregado (device incompatível). */
  loadFailed?: boolean;
  /** Mensagem técnica do erro de carregamento (diagnóstico). */
  errorMessage?: string;
}

interface LivenessScreenProps {
  /** Chamado quando a validação conclui com sucesso (pessoa real) OU quando o
   *  modelo não pôde carregar (loadFailed). */
  onComplete: (result: LivenessResultData) => void;
  /** Chamado quando o usuário cancela/adia a verificação. */
  onCancel: () => void;
  /** Mostra o botão de adiar ("Agora não") — usado no fluxo de login. */
  allowCancel?: boolean;
  threshold?: number;
  requiredFrames?: number;
  timeoutMs?: number;
}

function ovalColor(progress: number, faceDetected: boolean): string {
  if (!faceDetected) return '#9ca3af';
  if (progress <= 0) return '#F2C037';
  const g = Math.round(195 + progress * 60);
  const r = Math.round(242 - progress * 166);
  return `rgb(${r}, ${Math.min(g, 220)}, 55)`;
}

type Phase = 'intro' | 'checking' | 'failed';

const LivenessScreen: React.FC<LivenessScreenProps> = ({
  onComplete,
  onCancel,
  allowCancel = false,
  threshold = 0.75,
  requiredFrames = 3,
  timeoutMs = 30000,
}) => {
  const { hasPermission, requestPermission } = useCameraPermission();
  const device = useCameraDevice('front');
  const format = useCameraFormat(device, [
    { photoResolution: { width: 640, height: 480 } },
  ]);
  const { isLoading, error, analyzeFrame } = useLivenessModels();
  const cameraRef = useRef<Camera>(null);

  const [cameraReady, setCameraReady] = useState(false);
  const [faceDetected, setFaceDetected] = useState(false);
  const [progress, setProgress] = useState(0);
  const [phase, setPhase] = useState<Phase>('intro');
  const [permissionDenied, setPermissionDenied] = useState(false);
  const [instruction, setInstruction] = useState('Posicione seu rosto no oval');
  const [debugText, setDebugText] = useState('iniciando…');

  const totalFramesRef = useRef(0);
  const faceFramesRef = useRef(0);
  const scoreSumRef = useRef(0);
  const lastGoodPathRef = useRef<string | null>(null);
  const startTimeRef = useRef(0);
  const busyRef = useRef(false);
  const finishedRef = useRef(false);
  const timeoutRef = useRef<ReturnType<typeof setTimeout> | null>(null);
  const intervalRef = useRef<ReturnType<typeof setInterval> | null>(null);

  const clearTimers = useCallback(() => {
    if (timeoutRef.current) { clearTimeout(timeoutRef.current); timeoutRef.current = null; }
    if (intervalRef.current) { clearInterval(intervalRef.current); intervalRef.current = null; }
  }, []);

  const resetCounters = useCallback(() => {
    totalFramesRef.current = 0;
    faceFramesRef.current = 0;
    scoreSumRef.current = 0;
    lastGoodPathRef.current = null;
    finishedRef.current = false;
    busyRef.current = false;
    startTimeRef.current = Date.now();
    setProgress(0);
    setFaceDetected(false);
    setInstruction('Posicione seu rosto no oval');
  }, []);

  const readImageBase64 = useCallback(async (): Promise<string | null> => {
    const path = lastGoodPathRef.current;
    if (!path) return null;
    try {
      const clean = path.replace('file://', '');
      return await RNFS.readFile(clean, 'base64');
    } catch {
      return null;
    }
  }, []);

  const finishLive = useCallback(async (avgScore: number) => {
    if (finishedRef.current) return;
    finishedRef.current = true;
    clearTimers();
    const imageBase64 = await readImageBase64();
    onComplete({ isLive: true, confidence: avgScore, imageBase64 });
  }, [clearTimers, onComplete, readImageBase64]);

  const failNotLive = useCallback(() => {
    if (finishedRef.current) return;
    finishedRef.current = true;
    clearTimers();
    setPhase('failed');
  }, [clearTimers]);

  // Falha de carregamento dos modelos (device incompatível) → devolve ao chamador.
  useEffect(() => {
    if (error && !finishedRef.current) {
      finishedRef.current = true;
      clearTimers();
      // Log detalhado — aparece no terminal do Metro (dev) e no logcat.
      console.error('[LivenessKit] Falha ao carregar modelos ONNX:', error?.message, error);
      AsyncStorage.setItem(LIVENESS_UNSUPPORTED_KEY, 'true').catch(() => {});
      onComplete({
        isLive: false,
        confidence: 0,
        imageBase64: null,
        loadFailed: true,
        errorMessage: error?.message,
      });
    }
  }, [error, clearTimers, onComplete]);

  // Permissão de câmera — só pedimos quando o usuário inicia a verificação.
  useEffect(() => {
    if (phase !== 'checking' || hasPermission) return;
    requestPermission()
      .then((granted) => { if (!granted) setPermissionDenied(true); })
      .catch(() => setPermissionDenied(true));
  }, [phase, hasPermission, requestPermission]);

  const onCameraInitialized = useCallback(() => setCameraReady(true), []);

  const handleStart = useCallback(() => {
    resetCounters();
    setPermissionDenied(false);
    setPhase('checking');
  }, [resetCounters]);

  const processOneFrame = useCallback(async () => {
    if (busyRef.current || finishedRef.current || isLoading || !cameraRef.current) return;
    busyRef.current = true;
    try {
      const photo = await cameraRef.current.takePhoto({ flash: 'off', enableShutterSound: false });
      totalFramesRef.current += 1;
      const uri = photo.path.startsWith('file://') ? photo.path : `file://${photo.path}`;
      const result = await analyzeFrame(uri, photo.width, photo.height);
      if (finishedRef.current) return;

      setDebugText(
        `frames:${totalFramesRef.current} ${photo.width}x${photo.height} ` +
        `face:${result.faceDetected ? 'S' : 'N'} ` +
        `score:${result.score != null ? result.score.toFixed(2) : '-'} ` +
        `ok:${faceFramesRef.current}/${requiredFrames}`,
      );

      if (!result.faceDetected || result.score === null) {
        setFaceDetected(false);
        setInstruction('Posicione seu rosto no oval');
        setProgress(0);
        return;
      }

      setFaceDetected(true);
      faceFramesRef.current += 1;
      scoreSumRef.current += result.score;
      lastGoodPathRef.current = photo.path; // guarda o último frame com rosto

      const p = Math.min(faceFramesRef.current / requiredFrames, 1);
      setProgress(p);
      setInstruction('Mantenha o rosto parado e olhe para a câmera');

      if (faceFramesRef.current >= requiredFrames) {
        const avgScore = scoreSumRef.current / faceFramesRef.current;
        if (avgScore >= threshold) {
          await finishLive(avgScore);
        } else {
          failNotLive();
        }
      }
    } catch (e: any) {
      // Mostra o erro do frame para diagnóstico (antes era silenciado).
      console.error('[LivenessKit] Erro ao processar frame:', e?.message, e);
      setDebugText(`ERRO frame ${totalFramesRef.current}: ${e?.message || String(e)}`);
    } finally {
      busyRef.current = false;
    }
  }, [analyzeFrame, isLoading, requiredFrames, threshold, finishLive, failNotLive]);

  // Loop de captura.
  useEffect(() => {
    if (isLoading || !hasPermission || !device || !cameraReady || phase !== 'checking' || finishedRef.current) {
      return;
    }
    startTimeRef.current = Date.now();
    intervalRef.current = setInterval(() => { void processOneFrame(); }, CAPTURE_INTERVAL_MS);
    timeoutRef.current = setTimeout(() => {
      if (faceFramesRef.current > 0) {
        const avgScore = scoreSumRef.current / faceFramesRef.current;
        if (avgScore >= threshold) { void finishLive(avgScore); return; }
      }
      failNotLive();
    }, timeoutMs);

    return () => { clearTimers(); };
  }, [isLoading, hasPermission, device, cameraReady, phase, timeoutMs, threshold, processOneFrame, finishLive, failNotLive, clearTimers]);

  useEffect(() => () => clearTimers(), [clearTimers]);

  const handleRetry = useCallback(() => {
    resetCounters();
    setPhase('checking');
  }, [resetCounters]);

  // ----- Estados de tela -----

  if (phase === 'intro') {
    return (
      <View style={[styles.container, styles.center]}>
        <Icon name="verified-user" size={64} color="#8b83ff" />
        <Text style={styles.msgTitle}>Verificação de segurança</Text>
        <Text style={styles.msgText}>
          Para confirmar que você é uma pessoa real (e não um robô), vamos fazer
          uma rápida verificação facial. Nenhuma imagem sai do seu aparelho.
        </Text>
        <View style={styles.tipsList}>
          <Text style={styles.tipItem}>💡  Fique em um lugar bem iluminado</Text>
          <Text style={styles.tipItem}>🙂  Centralize seu rosto no oval</Text>
          <Text style={styles.tipItem}>🤳  Mantenha o rosto parado e olhe para a câmera</Text>
        </View>
        <TouchableOpacity
          style={[styles.primaryBtn, isLoading && styles.primaryBtnDisabled]}
          onPress={handleStart}
          disabled={isLoading}
        >
          {isLoading ? (
            <View style={styles.btnRow}>
              <ActivityIndicator color="#FFFFFF" size="small" />
              <Text style={styles.primaryBtnText}>Preparando…</Text>
            </View>
          ) : (
            <Text style={styles.primaryBtnText}>Iniciar verificação</Text>
          )}
        </TouchableOpacity>
        <TouchableOpacity style={styles.secondaryBtn} onPress={onCancel}>
          <Text style={styles.secondaryBtnText}>{allowCancel ? 'Agora não' : 'Cancelar'}</Text>
        </TouchableOpacity>
      </View>
    );
  }

  if (permissionDenied) {
    return (
      <View style={[styles.container, styles.center]}>
        <Icon name="no-photography" size={56} color="#ffffff" />
        <Text style={styles.msgTitle}>Precisamos da câmera</Text>
        <Text style={styles.msgText}>
          Para confirmar que você é uma pessoa real, permita o acesso à câmera nas
          configurações do dispositivo.
        </Text>
        <TouchableOpacity style={styles.primaryBtn} onPress={onCancel}>
          <Text style={styles.primaryBtnText}>Fechar</Text>
        </TouchableOpacity>
      </View>
    );
  }

  if (phase === 'failed') {
    return (
      <View style={[styles.container, styles.center]}>
        <Icon name="error-outline" size={56} color="#F2C037" />
        <Text style={styles.msgTitle}>Não foi possível validar</Text>
        <Text style={styles.msgText}>
          Não conseguimos confirmar que você é uma pessoa real. Fique em um lugar
          bem iluminado, centralize seu rosto e tente novamente.
        </Text>
        <TouchableOpacity style={styles.primaryBtn} onPress={handleRetry}>
          <Text style={styles.primaryBtnText}>Tentar novamente</Text>
        </TouchableOpacity>
        <TouchableOpacity style={styles.secondaryBtn} onPress={onCancel}>
          <Text style={styles.secondaryBtnText}>{allowCancel ? 'Agora não' : 'Cancelar'}</Text>
        </TouchableOpacity>
      </View>
    );
  }

  if (isLoading) {
    return (
      <View style={[styles.container, styles.center]}>
        <ActivityIndicator size="large" color="#6C63FF" />
        <Text style={styles.loadingText}>Preparando verificação de segurança…</Text>
      </View>
    );
  }

  if (!device) {
    return (
      <View style={[styles.container, styles.center]}>
        <Text style={styles.loadingText}>Câmera frontal indisponível</Text>
        <TouchableOpacity style={styles.primaryBtn} onPress={onCancel}>
          <Text style={styles.primaryBtnText}>Fechar</Text>
        </TouchableOpacity>
      </View>
    );
  }

  // Só montamos a <Camera> DEPOIS que a permissão foi concedida. Montar antes
  // (permissão concedida no meio da sessão) deixava a câmera presa em
  // "Iniciando câmera…" até reabrir o app.
  if (!hasPermission) {
    return (
      <View style={[styles.container, styles.center]}>
        <ActivityIndicator size="large" color="#6C63FF" />
        <Text style={styles.loadingText}>Aguardando permissão da câmera…</Text>
      </View>
    );
  }

  const borderColor = ovalColor(progress, faceDetected);

  return (
    <View style={styles.container}>
      <Camera
        ref={cameraRef}
        style={StyleSheet.absoluteFill}
        device={device}
        format={format}
        isActive={!finishedRef.current && phase === 'checking'}
        photo
        onInitialized={onCameraInitialized}
      />

      {!cameraReady ? (
        <View style={[styles.overlay, styles.center]}>
          <ActivityIndicator size="large" color="#6C63FF" />
          <Text style={styles.loadingText}>Iniciando câmera…</Text>
        </View>
      ) : (
        <>
          <View style={styles.topTips} pointerEvents="none">
            <Text style={styles.tipText}>💡 Fique em um lugar bem iluminado</Text>
            <Text style={styles.tipText}>🙂 Centralize seu rosto no oval</Text>
          </View>

          <View style={styles.overlay} pointerEvents="box-none">
            <View style={[styles.oval, { borderColor, shadowColor: borderColor }]} />
            <Text style={styles.instruction}>{instruction}</Text>
            <Text style={styles.progressText}>{Math.round(progress * 100)}%</Text>
          </View>

          <View style={styles.debugBox} pointerEvents="none">
            <Text style={styles.debugText}>{debugText}</Text>
          </View>

          {allowCancel && (
            <TouchableOpacity style={styles.cancelPill} onPress={onCancel} accessibilityLabel="Adiar">
              <Text style={styles.cancelPillText}>Agora não</Text>
            </TouchableOpacity>
          )}
          <TouchableOpacity
            style={styles.closeButton}
            onPress={onCancel}
            accessibilityLabel="Cancelar"
          >
            <Icon name="close" size={22} color="#FFFFFF" />
          </TouchableOpacity>
        </>
      )}
    </View>
  );
};

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: '#000000' },
  center: { justifyContent: 'center', alignItems: 'center', paddingHorizontal: 32 },
  loadingText: { color: '#FFFFFF', marginTop: 16, fontSize: 16, textAlign: 'center' },
  overlay: { ...StyleSheet.absoluteFillObject, justifyContent: 'center', alignItems: 'center' },
  topTips: {
    position: 'absolute',
    top: 70,
    left: 0,
    right: 0,
    alignItems: 'center',
    gap: 6,
  },
  tipText: {
    color: '#FFFFFF',
    fontSize: 14,
    fontWeight: '600',
    backgroundColor: 'rgba(0,0,0,0.45)',
    paddingHorizontal: 14,
    paddingVertical: 6,
    borderRadius: 16,
    overflow: 'hidden',
  },
  oval: {
    width: OVAL_W,
    height: OVAL_H,
    borderRadius: OVAL_W,
    borderWidth: 5,
    backgroundColor: 'transparent',
    shadowOpacity: 0.9,
    shadowRadius: 16,
    shadowOffset: { width: 0, height: 0 },
  },
  instruction: {
    position: 'absolute',
    bottom: SCREEN_H * 0.18,
    color: '#FFFFFF',
    fontSize: 17,
    fontWeight: '600',
    textAlign: 'center',
    paddingHorizontal: 24,
  },
  progressText: {
    position: 'absolute',
    bottom: SCREEN_H * 0.12,
    color: '#FFFFFF',
    fontSize: 14,
    opacity: 0.85,
  },
  closeButton: {
    position: 'absolute',
    top: 50,
    right: 24,
    width: 44,
    height: 44,
    borderRadius: 22,
    backgroundColor: 'rgba(0,0,0,0.5)',
    justifyContent: 'center',
    alignItems: 'center',
  },
  cancelPill: {
    position: 'absolute',
    bottom: SCREEN_H * 0.05,
    alignSelf: 'center',
    paddingHorizontal: 22,
    paddingVertical: 12,
    borderRadius: 24,
    backgroundColor: 'rgba(255,255,255,0.14)',
    borderWidth: 1,
    borderColor: 'rgba(255,255,255,0.35)',
  },
  cancelPillText: { color: '#FFFFFF', fontSize: 15, fontWeight: '700' },
  debugBox: {
    position: 'absolute',
    top: 100,
    left: 12,
    right: 12,
    backgroundColor: 'rgba(0,0,0,0.7)',
    paddingHorizontal: 10,
    paddingVertical: 6,
    borderRadius: 8,
    display: 'none', // desativado por padrão, só ativa para debug
  },
  debugText: { color: '#0F0', fontSize: 12, fontFamily: 'monospace', textAlign: 'center' },
  msgTitle: { color: '#FFFFFF', fontSize: 20, fontWeight: '800', marginTop: 18, textAlign: 'center' },
  msgText: { color: '#d1d5db', fontSize: 15, marginTop: 10, textAlign: 'center', lineHeight: 21 },
  tipsList: {
    marginTop: 24,
    alignSelf: 'stretch',
    gap: 12,
  },
  tipItem: {
    color: '#e5e7eb',
    fontSize: 15,
    fontWeight: '600',
    lineHeight: 22,
  },
  btnRow: { flexDirection: 'row', alignItems: 'center', justifyContent: 'center', gap: 8 },
  primaryBtnDisabled: { backgroundColor: '#6b7280' },
  primaryBtn: {
    marginTop: 26,
    backgroundColor: '#4f46e5',
    borderRadius: 14,
    paddingVertical: 14,
    paddingHorizontal: 32,
    minWidth: 220,
  },
  primaryBtnText: { color: '#FFFFFF', fontSize: 16, fontWeight: '800', textAlign: 'center' },
  secondaryBtn: { marginTop: 14, paddingVertical: 10, paddingHorizontal: 24 },
  secondaryBtnText: { color: '#9ca3af', fontSize: 15, fontWeight: '600', textAlign: 'center' },
});

export default LivenessScreen;
