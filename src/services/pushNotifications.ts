import AsyncStorage from '@react-native-async-storage/async-storage';
import { Platform, Alert, PermissionsAndroid } from 'react-native';

// Importação condicional do Firebase
let messaging: any = null;
try {
  messaging = require('@react-native-firebase/messaging').default;
} catch (error) {
  console.warn('Firebase not configured yet:', error);
}

class PushNotificationService {
  private fcmToken: string | null = null;

  async initialize() {
    try {
      console.log('🔔 Inicializando Push Notifications...');
      
      // Verificar se o Firebase está disponível
      if (!messaging) {
        console.warn('⚠️ Firebase não configurado. Push notifications desabilitadas.');
        return;
      }
      
      // Solicitar permissões
      await this.requestPermissions();
      
      // Obter token FCM
      await this.getFCMToken();
      
      // Configurar listeners
      this.setupNotificationListeners();
      
      console.log('✅ Push Notifications inicializadas com sucesso');
    } catch (error) {
      console.error('❌ Erro ao inicializar Push Notifications:', error);
    }
  }

  async requestPermissions(): Promise<boolean> {
    try {
      console.log('📱 Solicitando permissões...');
      
      if (!messaging) {
        console.warn('⚠️ Firebase não configurado');
        return false;
      }
      
      if (Platform.OS === 'ios') {
        const authStatus = await messaging().requestPermission();
        const enabled =
          authStatus === messaging.AuthorizationStatus.AUTHORIZED ||
          authStatus === messaging.AuthorizationStatus.PROVISIONAL;
        
        if (!enabled) {
          Alert.alert(
            'Permissões Necessárias',
            'Para receber notificações sobre novas demandas e propostas, permita as notificações nas configurações do app.'
          );
          return false;
        }
        
        console.log('✅ Permissões iOS concedidas');
        return true;
      }

      if (Platform.OS === 'android') {
        const granted = await PermissionsAndroid.request(
          PermissionsAndroid.PERMISSIONS.POST_NOTIFICATIONS,
          {
            title: 'Permissão para Notificações',
            message: 'Este app precisa de permissão para enviar notificações sobre novas demandas e propostas.',
            buttonNeutral: 'Perguntar Depois',
            buttonNegative: 'Cancelar',
            buttonPositive: 'OK',
          }
        );

        if (granted !== PermissionsAndroid.RESULTS.GRANTED) {
          Alert.alert(
            'Permissões Necessárias',
            'Para receber notificações, ative as notificações nas configurações do app.'
          );
          return false;
        }
        
        console.log('✅ Permissões Android concedidas');
        return true;
      }

      return true;
    } catch (error) {
      console.error('❌ Erro ao solicitar permissões:', error);
      return false;
    }
  }

  async getFCMToken(): Promise<string | null> {
    try {
      if (!messaging) {
        console.warn('⚠️ Firebase não configurado');
        return null;
      }

      // Verificar se já temos um token salvo
      const savedToken = await AsyncStorage.getItem('fcm_token');
      if (savedToken) {
        this.fcmToken = savedToken;
        console.log('🔑 Token FCM recuperado do storage');
        return savedToken;
      }

      // Obter novo token
      const token = await messaging().getToken();
      if (token) {
        this.fcmToken = token;
        await AsyncStorage.setItem('fcm_token', token);
        console.log('🔑 Novo token FCM obtido:', token.substring(0, 20) + '...');
        
        // Enviar token para o backend
        await this.sendTokenToBackend(token);
        
        return token;
      }

      return null;
    } catch (error) {
      console.error('❌ Erro ao obter token FCM:', error);
      return null;
    }
  }

  setupNotificationListeners() {
    if (!messaging) {
      console.warn('⚠️ Firebase não configurado');
      return;
    }

    // Listener para quando o app está em foreground
    messaging().onMessage(async remoteMessage => {
      console.log('📨 Notificação recebida (foreground):', remoteMessage);
      
      // Mostrar alert quando o app está aberto
      if (remoteMessage.notification) {
        Alert.alert(
          remoteMessage.notification.title || 'Nova Notificação',
          remoteMessage.notification.body || 'Você tem uma nova notificação',
          [
            { text: 'OK', style: 'default' }
          ]
        );
      }
    });

    // Listener para quando o app é aberto através de uma notificação
    messaging().onNotificationOpenedApp(remoteMessage => {
      console.log('📱 App aberto via notificação:', remoteMessage);
      this.handleNotificationNavigation(remoteMessage);
    });

    // Verificar se o app foi aberto através de uma notificação quando estava fechado
    messaging()
      .getInitialNotification()
      .then(remoteMessage => {
        if (remoteMessage) {
          console.log('🚀 App iniciado via notificação:', remoteMessage);
          this.handleNotificationNavigation(remoteMessage);
        }
      });

    // Listener para refresh do token
    messaging().onTokenRefresh(token => {
      console.log('🔄 Token FCM atualizado:', token.substring(0, 20) + '...');
      this.fcmToken = token;
      AsyncStorage.setItem('fcm_token', token);
      // Aqui você pode enviar o novo token para o backend
      this.sendTokenToBackend(token);
    });
  }

  handleNotificationNavigation(remoteMessage: any) {
    // Aqui você pode implementar navegação baseada no tipo de notificação
    const data = remoteMessage.data;
    
    if (data?.type === 'new_order' && data?.order_id) {
      // Navegar para a tela de demandas disponíveis
      console.log('📍 Navegando para demanda:', data.order_id);
    } else if (data?.type === 'new_proposal' && data?.proposal_id) {
      // Navegar para a tela de propostas
      console.log('📍 Navegando para proposta:', data.proposal_id);
    }
  }

  async sendTokenToBackend(token?: string) {
    try {
      const fcmToken = token || this.fcmToken;
      if (!fcmToken) return;

      console.log('📤 Enviando token para backend:', fcmToken.substring(0, 20) + '...');
      
      // Importar dinamicamente para evitar dependência circular
      const { authService } = await import('./api');
      await authService.saveFcmToken(fcmToken);
      
      console.log('✅ Token FCM enviado para backend com sucesso');
      
    } catch (error) {
      console.error('❌ Erro ao enviar token para backend:', error);
    }
  }

  getToken(): string | null {
    return this.fcmToken;
  }

  async clearToken() {
    try {
      await AsyncStorage.removeItem('fcm_token');
      this.fcmToken = null;
      console.log('🗑️ Token FCM limpo');
    } catch (error) {
      console.error('❌ Erro ao limpar token FCM:', error);
    }
  }
}

export default new PushNotificationService();
