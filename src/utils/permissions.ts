import { Platform, PermissionsAndroid } from 'react-native';
import {
  showLocationDisclosure,
  LocationDisclosureKind,
} from '../components/LocationDisclosure';

// IMPORTANTE (política de Dados do Usuário do Google Play — Prominent Disclosure):
// NUNCA solicitar a permissão de localização nem ler a localização sem antes
// mostrar, dentro do app, o aviso que descreve a coleta e todas as suas
// finalidades. Todo acesso à localização deve passar por
// `requestLocationPermission`, que exibe o disclosure ANTES do prompt do sistema.
//
// O app NÃO usa ACCESS_BACKGROUND_LOCATION — não peça essa permissão aqui nem
// em nenhuma tela. O rastreamento com o app minimizado é sustentado pelo
// foreground service do tipo "location" (LocationTrackingService), que só
// precisa de ACCESS_FINE_LOCATION.
//
// Para checar silenciosamente (sem prompt e sem aviso) se já há permissão —
// por exemplo, para decidir se um recurso opcional pode ser carregado —
// use `hasLocationPermission`. Nunca dispare um pedido automático ao abrir uma
// tela: a coleta precisa ser iniciada por uma ação do usuário.
//
// Tudo isso vale apenas para o Android: a Prominent Disclosure é uma exigência
// do Google Play. No iOS o comportamento é o de sempre — o próprio sistema
// exibe o prompt na primeira leitura de localização, usando os textos
// NSLocation*UsageDescription do Info.plist.

const FINE = PermissionsAndroid.PERMISSIONS.ACCESS_FINE_LOCATION;
const COARSE = PermissionsAndroid.PERMISSIONS.ACCESS_COARSE_LOCATION;

/**
 * Checagem silenciosa no Android: não mostra aviso nem prompt do sistema.
 *
 * No iOS retorna `true` de propósito, para que os fluxos sigam exatamente como
 * antes: lá quem exibe o prompt é o próprio sistema, na primeira leitura de
 * localização, e nenhum aviso in-app é interposto.
 */
export async function hasLocationPermission(): Promise<boolean> {
  if (Platform.OS !== 'android') return true;
  const [fine, coarse] = await Promise.all([
    PermissionsAndroid.check(FINE),
    PermissionsAndroid.check(COARSE),
  ]);
  return fine || coarse;
}

/**
 * Aviso de uso + permissão de localização em primeiro plano.
 *
 * @param purpose finalidade real desta chamada, para que o aviso descreva
 *   exatamente o que será feito com a localização:
 *   'address'  → preencher o endereço automaticamente;
 *   'tracking' → enviar o trajeto em tempo real ao cliente.
 */
export async function requestLocationPermission(
  purpose: Extract<LocationDisclosureKind, 'address' | 'tracking'> = 'address',
): Promise<boolean> {
  // No iOS, segue direto: o prompt nativo aparece na primeira leitura de
  // localização, como sempre foi. No Android, permissão já concedida significa
  // que a coleta já foi divulgada e consentida antes.
  if (await hasLocationPermission()) return true;

  const accepted = await showLocationDisclosure(purpose);
  if (!accepted) return false;

  try {
    const result = await PermissionsAndroid.requestMultiple([FINE, COARSE]);
    return (
      result[FINE] === PermissionsAndroid.RESULTS.GRANTED ||
      result[COARSE] === PermissionsAndroid.RESULTS.GRANTED
    );
  } catch {
    return false;
  }
}

export async function requestCameraPermission(): Promise<boolean> {
  if (Platform.OS === 'ios') return true;

  try {
    const granted = await PermissionsAndroid.request(
      PermissionsAndroid.PERMISSIONS.CAMERA,
      {
        title: 'Permissão da Câmera',
        message: 'Este app precisa de acesso à câmera para tirar fotos.',
        buttonNeutral: 'Perguntar Depois',
        buttonNegative: 'Cancelar',
        buttonPositive: 'OK',
      },
    );
    return granted === PermissionsAndroid.RESULTS.GRANTED;
  } catch {
    return false;
  }
}
