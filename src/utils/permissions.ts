import { Platform, PermissionsAndroid } from 'react-native';

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
