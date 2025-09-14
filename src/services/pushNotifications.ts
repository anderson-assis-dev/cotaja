import AsyncStorage from '@react-native-async-storage/async-storage';
import { Platform, Alert } from 'react-native';
import Constants from 'expo-constants';

// Importação condicional do Expo Notifications
let Notifications: any = null;
let Device: any = null;

try {
  Notifications = require('expo-notifications');
  Device = require('expo-device');
} catch (error) {
  console.warn('Expo Notifications não disponível no Expo Go:', error);
}

class PushNotificationService {
  private expoPushToken: string | null = null;

  async initialize() {
    try {
      console.log('🔔 Inicializando Push Notifications...');
      
      // Verificar se estamos no Expo Go
      if (Constants.appOwnership === 'expo') {
        console.log('⚠️ Push notifications não suportadas no Expo Go');
        return;
      }
      
      // Verificar se os módulos estão disponíveis
      if (!Notifications || !Device) {
        console.log('⚠️ Módulos de notificação não disponíveis');
        return;
      }
      
      // Verificar se é um dispositivo físico
      if (!Device.isDevice) {
        console.log('⚠️ Push notifications só funcionam em dispositivos físicos');
        return;
      }

      // Solicitar permissões
      const { status: existingStatus } = await Notifications.getPermissionsAsync();
      let finalStatus = existingStatus;
      
      if (existingStatus !== 'granted') {
        const { status } = await Notifications.requestPermissionsAsync();
        finalStatus = status;
      }
      
      if (finalStatus !== 'granted') {
        console.log('❌ Permissão de push notifications negada');
        return;
      }

      // Obter token Expo Push
      try {
        const token = await Notifications.getExpoPushTokenAsync();
        
        if (token) {
          this.expoPushToken = token.data;
          console.log('✅ Expo Push Token obtido:', token.data);
          
          // Salvar token no AsyncStorage
          await AsyncStorage.setItem('expo_push_token', token.data);
          
          // Enviar token para o backend
          await this.sendTokenToBackend(token.data);
        }
      } catch (error) {
        console.log('⚠️ Não foi possível obter token de push:', error);
      }

      // Configurar listener para notificações
      Notifications.addNotificationReceivedListener(notification => {
        console.log('📱 Notificação recebida:', notification);
      });

      Notifications.addNotificationResponseReceivedListener(response => {
        console.log('📱 Resposta à notificação:', response);
      });

      console.log('✅ Push Notifications inicializadas com sucesso');
    } catch (error) {
      console.error('❌ Erro ao inicializar push notifications:', error);
    }
  }

  async sendTokenToBackend(token: string) {
    try {
      // Aqui você pode implementar o envio do token para seu backend
      console.log('📤 Enviando token para backend:', token);
      // await api.post('/fcm-token', { fcm_token: token });
    } catch (error) {
      console.error('❌ Erro ao enviar token para backend:', error);
    }
  }

  async getStoredToken(): Promise<string | null> {
    try {
      return await AsyncStorage.getItem('expo_push_token');
    } catch (error) {
      console.error('❌ Erro ao obter token armazenado:', error);
      return null;
    }
  }

  async clearToken() {
    try {
      await AsyncStorage.removeItem('expo_push_token');
      this.expoPushToken = null;
      console.log('🗑️ Token de push removido');
    } catch (error) {
      console.error('❌ Erro ao limpar token:', error);
    }
  }

  // Método para enviar notificação local (para testes)
  async sendLocalNotification(title: string, body: string, data?: any) {
    try {
      if (!Notifications) {
        console.log('⚠️ Notificações não disponíveis no Expo Go');
        return;
      }
      
      await Notifications.scheduleNotificationAsync({
        content: {
          title,
          body,
          data,
        },
        trigger: null, // Enviar imediatamente
      });
    } catch (error) {
      console.error('❌ Erro ao enviar notificação local:', error);
    }
  }
}

// Configurar comportamento das notificações (apenas se disponível)
if (Notifications) {
  Notifications.setNotificationHandler({
    handleNotification: async () => ({
      shouldShowAlert: true,
      shouldPlaySound: true,
      shouldSetBadge: false,
      shouldShowBanner: true,
      shouldShowList: true,
    }),
  });
}

export default new PushNotificationService();