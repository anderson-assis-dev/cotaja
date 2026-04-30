import { Platform, PermissionsAndroid, Alert } from 'react-native';

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
