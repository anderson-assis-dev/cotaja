import { Platform, Alert } from 'react-native';
// @ts-ignore
import PushNotification from 'react-native-push-notification';
import PushNotificationIOS from '@react-native-community/push-notification-ios';
import AsyncStorage from '@react-native-async-storage/async-storage';

class PushNotificationService {
  private deviceToken: string | null = null;
  private isInitialized = false;
  private isSendingToken = false; // Flag para evitar envios duplicados

  async initialize() {
    try {
      console.log('🔔 Inicializando Push Notifications (Community Version)...');

      if (Platform.OS === 'ios') {
        await this.initializeIOS();
      } else {
        await this.initializeAndroid();
      }

      this.isInitialized = true;
      console.log('✅ Push Notifications inicializadas com sucesso');
    } catch (error) {
      console.error('❌ Erro ao inicializar push notifications:', error);
      throw error;
    }
  }

  private async initializeIOS() {
    return new Promise<void>((resolve, reject) => {
      // Setup event listeners FIRST - before requesting permissions
      // These need to be active when the token arrives
      const onRegistered = (token: string) => {
        console.log('✅ [iOS] Token FCM obtido:', token);
        console.log('📝 [iOS] Salvando token no deviceToken interno e AsyncStorage...');
        this.deviceToken = token;
        AsyncStorage.setItem('device_token', token).then(() => {
          console.log('💾 [iOS] Token salvo no AsyncStorage com sucesso!');
          console.log('ℹ️ [iOS] Token será enviado ao backend via payload de login/registro/abertura do app');
          // NÃO enviar automaticamente aqui - confiar no payload
        }).catch((error) => {
          console.error('❌ [iOS] Erro ao salvar token no AsyncStorage:', error);
        });
      };

      const onRegistrationError = (error: any) => {
        console.error('❌ Erro registro iOS:', error);
      };

      const onRemoteNotification = (notification: any) => {
        console.log('📱 Notificação iOS recebida:', notification);
        this.handleNotification(notification);
      };

      // Add event listeners
      PushNotificationIOS.addEventListener('register', onRegistered);
      PushNotificationIOS.addEventListener('registrationError', onRegistrationError);
      PushNotificationIOS.addEventListener('notification', onRemoteNotification);

      // NOW request permissions - this will trigger the 'register' event
      PushNotificationIOS.requestPermissions({
        alert: true,
        badge: true,
        sound: true,
        critical: true,
      }).then(
        (permissions) => {
          console.log('🍎 Permissões iOS concedidas:', permissions);

          if (permissions.alert || permissions.badge || permissions.sound) {
            resolve();
          } else {
            reject(new Error('Permissões de notificação negadas'));
          }
        },
        (error) => {
          console.log('❌ PushNotificationIOS.requestPermissions failed', error);
          reject(error);
        },
      );
    });
  }

  private async initializeAndroid() {
    try {
      // Request Android 13+ notification permission
      if (Platform.OS === 'android' && Platform.Version >= 33) {
        const PermissionsAndroid = require('react-native').PermissionsAndroid;
        const granted = await PermissionsAndroid.request(
          PermissionsAndroid.PERMISSIONS.POST_NOTIFICATIONS,
        );
        console.log('📱 Permissão Android POST_NOTIFICATIONS:', granted);
      }
    } catch (err) {
      console.warn('❌ Erro ao solicitar permissão Android:', err);
    }

    // Configure Android push notifications
    PushNotification.configure({
      // Called when token is generated
      onRegister: (token: any) => {
        console.log('✅ [Android] Token FCM obtido:', token.token);
        console.log('📝 [Android] Salvando token no deviceToken interno e AsyncStorage...');
        this.deviceToken = token.token;
        AsyncStorage.setItem('device_token', token.token).then(() => {
          console.log('💾 [Android] Token salvo no AsyncStorage com sucesso!');
          console.log('ℹ️ [Android] Token será enviado ao backend via payload de login/registro/abertura do app');
          // NÃO enviar automaticamente aqui - confiar no payload
        }).catch((error) => {
          console.error('❌ [Android] Erro ao salvar token no AsyncStorage:', error);
        });
      },

      // Called when a remote or local notification is opened or received
      onNotification: (notification: any) => {
        console.log('📱 Notificação Android recebida:', notification);
        this.handleNotification(notification);

        // Required callback
        notification.finish(PushNotificationIOS.FetchResult.NoData);
      },

      // Called when Registered Action is pressed and invokeApp is false
      onAction: (notification: any) => {
        console.log('🎯 Ação Android:', notification.action);
        console.log('📱 Notificação:', notification);
      },

      // Called when the user fails to register for remote notifications
      onRegistrationError: (err: any) => {
        console.error('❌ Erro registro Android:', err.message, err);
      },

      // iOS ONLY: Permissions to register
      permissions: {
        alert: true,
        badge: true,
        sound: true,
      },

      // Should the initial notification be popped automatically
      popInitialNotification: true,

      // Request permissions on app start
      requestPermissions: true,
    });
  }

  private handleNotification(notification: any) {
    // Handle different notification types
    if (notification.data) {
      const { type } = notification.data;

      switch (type) {
        case 'new_proposal':
          this.handleNewProposal(notification);
          break;
        case 'proposal_accepted':
          this.handleProposalAccepted(notification);
          break;
        case 'new_order':
          this.handleNewOrder(notification);
          break;
        default:
          console.log('📱 Notificação genérica:', notification);
      }
    }

    // Show alert if app is in foreground (iOS specific handling)
    if (Platform.OS === 'ios' && notification.foreground) {
      Alert.alert(
        notification.title || 'Nova Notificação',
        notification.message || notification.body || '',
        [{ text: 'OK' }]
      );
    }
  }

  private handleNewProposal(notification: any) {
    console.log('🎯 Nova proposta recebida:', notification.data);
  }

  private handleProposalAccepted(notification: any) {
    console.log('✅ Proposta aceita:', notification.data);
  }

  private handleNewOrder(notification: any) {
    console.log('📋 Nova demanda disponível:', notification.data);
  }

  async sendTokenToBackend(token: string, retryCount = 0) {
    // Evitar envios duplicados simultâneos
    if (this.isSendingToken) {
      console.log('⏸️ [sendTokenToBackend] Envio já em andamento, pulando...');
      return;
    }

    try {
      this.isSendingToken = true;
      console.log('📤 [sendTokenToBackend] Tentativa', retryCount + 1, '- Token:', token.substring(0, 20) + '...');
      console.log('📍 [sendTokenToBackend] STACK TRACE:', new Error().stack);
      const { authService } = require('./api');
      const AsyncStorage = require('@react-native-async-storage/async-storage').default;

      // Verificar se usuário está autenticado
      const authToken = await AsyncStorage.getItem('auth_token');
      console.log('🔑 [sendTokenToBackend] Auth token:', authToken ? 'ENCONTRADO' : 'NÃO ENCONTRADO');

      if (authToken) {
        console.log('🚀 [sendTokenToBackend] Enviando FCM token para o backend...');
        const response = await authService.saveFcmToken(token, Platform.OS);
        console.log('✅ [sendTokenToBackend] Token FCM enviado com sucesso!', response);
        this.isSendingToken = false;
      } else {
        // Se não encontrou o auth_token, pode ser que ainda não tenha sido salvo
        // Tentar novamente após um delay (máximo 2 tentativas para evitar 429)
        if (retryCount < 2) {
          console.log('⏳ [sendTokenToBackend] Auth token não encontrado, tentando novamente em 2s...');
          this.isSendingToken = false;
          setTimeout(() => {
            this.sendTokenToBackend(token, retryCount + 1);
          }, 2000);
        } else {
          console.log('⚠️ [sendTokenToBackend] Usuário não autenticado após tentativas, token salvo localmente');
          this.isSendingToken = false;
        }
      }
    } catch (error: any) {
      this.isSendingToken = false;
      console.error('❌ [sendTokenToBackend] ERRO ao enviar token:');
      console.error('  - Message:', error.message);
      console.error('  - Code:', error.code);
      console.error('  - Response status:', error.response?.status);
      console.error('  - Response data:', error.response?.data);
      console.error('  - Full error:', error);
    }
  }

  async getStoredToken(): Promise<string | null> {
    try {
      return await AsyncStorage.getItem('device_token');
    } catch (error) {
      console.error('❌ Erro ao obter token armazenado:', error);
      return null;
    }
  }

  async clearToken() {
    try {
      // NÃO remover o device_token do AsyncStorage - ele é independente da sessão do usuário
      // Apenas limpar a referência interna (que será recarregada do AsyncStorage quando necessário)
      console.log('ℹ️ [clearToken] Mantendo FCM token no AsyncStorage (independente de logout)');
      // this.deviceToken = null; // Manter também a referência interna
    } catch (error) {
      console.error('❌ Erro ao limpar token:', error);
    }
  }

  async sendLocalNotification(title: string, body: string, data?: any) {
    if (Platform.OS === 'ios') {
      PushNotificationIOS.presentLocalNotification({
        alertTitle: title,
        alertBody: body,
        userInfo: data || {}
      });
    } else {
      PushNotification.localNotification({
        title: title,
        message: body,
        userInfo: data || {}
      });
    }
  }

  getDeviceToken(): string | null {
    return this.deviceToken;
  }

  isServiceInitialized(): boolean {
    return this.isInitialized;
  }

  // Método para forçar o envio do token para o backend
  async forceSendTokenToBackend(): Promise<void> {
    const token = await this.getStoredToken();
    if (token) {
      console.log('🔄 [forceSendTokenToBackend] Forçando envio de token...');
      await this.sendTokenToBackend(token, 0);
    } else {
      console.log('⚠️ [forceSendTokenToBackend] Nenhum token disponível para enviar');
    }
  }

  async checkPermissions(): Promise<any> {
    if (Platform.OS === 'ios') {
      return new Promise((resolve) => {
        PushNotificationIOS.checkPermissions((permissions) => {
          resolve(permissions);
        });
      });
    }
    return { alert: true, badge: true, sound: true }; // Android doesn't have granular permission check
  }

  async getBadgeCount(): Promise<number> {
    if (Platform.OS === 'ios') {
      return new Promise((resolve) => {
        PushNotificationIOS.getApplicationIconBadgeNumber((count) => {
          resolve(count);
        });
      });
    }
    return 0;
  }

  async setBadgeCount(count: number) {
    if (Platform.OS === 'ios') {
      PushNotificationIOS.setApplicationIconBadgeNumber(count);
    }
  }

  // Compatibility methods for existing code
  async sendTestNotification() {
    try {
      if (!this.deviceToken) {
        Alert.alert('Erro', 'Token do dispositivo não encontrado');
        return;
      }

      // Send a local notification for testing
      await this.sendLocalNotification(
        'Teste de Notificação',
        'Esta é uma notificação de teste!',
        { test: true }
      );

      Alert.alert('Sucesso', 'Notificação de teste enviada!');
    } catch (error) {
      console.error('Error sending test notification:', error);
      Alert.alert('Erro', 'Falha ao enviar notificação de teste');
    }
  }

  getDeviceInfo() {
    const token = this.getDeviceToken();
    if (!token) return null;

    return {
      token: token,
      platform: Platform.OS as 'ios' | 'android'
    };
  }

  async refreshToken(): Promise<string | null> {
    // For community version, just get the current token
    return this.getDeviceToken();
  }

  async getPermissionStatus(): Promise<string> {
    try {
      const permissions: any = await this.checkPermissions();
      if (permissions.alert || permissions.badge || permissions.sound) {
        return 'authorized';
      }
      return 'denied';
    } catch (error) {
      return 'error';
    }
  }

  async clearStoredData(): Promise<void> {
    await this.clearToken();
  }

  // Additional community-specific methods
  async sendScheduledNotification(title: string, message: string, date: Date, data?: any) {
    if (Platform.OS === 'ios') {
      PushNotificationIOS.scheduleLocalNotification({
        alertTitle: title,
        alertBody: message,
        fireDate: date.toISOString(),
        userInfo: data || {}
      });
    } else {
      PushNotification.localNotificationSchedule({
        title: title,
        message: message,
        date: date,
        userInfo: data || {}
      });
    }
  }

  async cancelAllNotifications() {
    if (Platform.OS === 'ios') {
      PushNotificationIOS.removeAllPendingNotificationRequests();
    } else {
      PushNotification.cancelAllLocalNotifications();
    }
  }
}

export default new PushNotificationService();