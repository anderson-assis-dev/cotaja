import { Platform, PermissionsAndroid, Alert } from 'react-native';
import AsyncStorage from '@react-native-async-storage/async-storage';
import Geolocation from '@react-native-community/geolocation';
import { Camera } from 'react-native-vision-camera';

const INITIAL_PERMISSIONS_KEY = 'initial_permissions_requested_v1';

/**
 * Solicita, uma única vez (na primeira abertura do app), as permissões de
 * câmera e localização — em Android e iOS. A câmera é pedida via VisionCamera
 * (mesma permissão usada pelo liveness), garantindo que o cadastro funcione
 * sem depender de o usuário abrir a tela de liveness antes. Se a localização
 * for concedida, habilita a preferência usada pelo cadastro para preencher o
 * CEP automaticamente.
 */
export async function requestInitialPermissions(): Promise<void> {
  try {
    const alreadyRequested = await AsyncStorage.getItem(INITIAL_PERMISSIONS_KEY);
    if (alreadyRequested === 'true') return;

    // Câmera (iOS + Android) — dispara o prompt nativo do sistema.
    try {
      await Camera.requestCameraPermission();
    } catch {}

    // Localização
    let locationGranted = false;
    if (Platform.OS === 'android') {
      try {
        const result = await PermissionsAndroid.request(
          PermissionsAndroid.PERMISSIONS.ACCESS_FINE_LOCATION,
        );
        locationGranted = result === PermissionsAndroid.RESULTS.GRANTED;
      } catch {}
    } else {
      // iOS: dispara o prompt nativo de localização (quando em uso).
      locationGranted = await new Promise<boolean>((resolve) => {
        try {
          Geolocation.requestAuthorization(
            () => resolve(true),
            () => resolve(false),
          );
        } catch {
          resolve(false);
        }
      });
    }

    if (locationGranted) {
      await AsyncStorage.setItem('location_enabled_pref', 'true');
    }

    await AsyncStorage.setItem(INITIAL_PERMISSIONS_KEY, 'true');
  } catch {
    // Falha ao solicitar não deve travar o app.
  }
}

export async function requestLocationPermission(): Promise<boolean> {
  if (Platform.OS === 'ios') return true;

  const alreadyGranted = await PermissionsAndroid.check(
    PermissionsAndroid.PERMISSIONS.ACCESS_FINE_LOCATION,
  );
  if (alreadyGranted) return true;

  return new Promise((resolve) => {
    Alert.alert(
      'Uso da Sua Localização',
      'A Cotaja coleta sua localização precisa para preencher endereços automaticamente e para rastrear o trajeto do prestador de serviços até o endereço do cliente, validando que o profissional a caminho é o mesmo que venceu o leilão na plataforma. Esses dados são utilizados somente durante a prestação do serviço.',
      [
        {
          text: 'Cancelar',
          style: 'cancel',
          onPress: () => resolve(false),
        },
        {
          text: 'Continuar',
          onPress: async () => {
            try {
              const result = await PermissionsAndroid.request(
                PermissionsAndroid.PERMISSIONS.ACCESS_FINE_LOCATION,
              );
              resolve(result === PermissionsAndroid.RESULTS.GRANTED);
            } catch {
              resolve(false);
            }
          },
        },
      ],
      { cancelable: false },
    );
  });
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
