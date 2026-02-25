import { Platform, DeviceEventEmitter } from 'react-native';
// @ts-ignore
import PushNotification from 'react-native-push-notification';
import PushNotificationIOS from '@react-native-community/push-notification-ios';
import AsyncStorage from '@react-native-async-storage/async-storage';
import { navigationRef } from '../navigation/navigationRef';

class PushNotificationService {
  private deviceToken: string | null = null;
  private isInitialized = false;
  private isSendingToken = false;

  async initialize() {
    try {
      console.log('Inicializando Push Notifications...');

      if (Platform.OS === 'ios') {
        await this.initializeIOS();
      } else {
        await this.initializeAndroid();
      }

      this.isInitialized = true;
      console.log('[Push] Notifications inicializadas com sucesso');
    } catch (error) {
      console.error('[Push] Erro ao inicializar push notifications:', error);
      throw error;
    }
  }

  private async initializeIOS() {
    return new Promise<void>((resolve, reject) => {
      // Setup event listeners FIRST - before requesting permissions
      // These need to be active when the token arrives
      const onRegistered = (token: string) => {
        console.log('[iOS] Token FCM obtido:', token);
        this.deviceToken = token;
        AsyncStorage.setItem('device_token', token).then(() => {
          console.log('[iOS] Token salvo no AsyncStorage');
        }).catch((error) => {
          console.error('[iOS] Erro ao salvar token no AsyncStorage:', error);
        });
      };

      const onRegistrationError = (error: any) => {
        console.error('[iOS] Erro registro:', error);
      };

      const onRemoteNotification = (notification: any) => {
        console.log('[iOS] Notificacao recebida (raw):', JSON.stringify(notification));
        const data = notification._data || notification.data || {};
        const getDataResult = notification.getData ? notification.getData() : {};

        // Check userInteraction in ALL possible locations
        // RNCPushNotificationIOS can set it at different levels depending on version
        const isUserTap =
          notification.userInteraction === true ||
          notification.userInteraction === 1 ||
          data.userInteraction === true ||
          data.userInteraction === 1 ||
          getDataResult.userInteraction === true ||
          getDataResult.userInteraction === 1;

        console.log('[iOS] userInteraction detected:', isUserTap, '| data:', JSON.stringify(data));

        if (isUserTap) {
          // User tapped the notification - navigate to chat
          console.log('[iOS] User tapped notification, navigating...');
          this.handleNotificationTap(data);
        } else {
          // Foreground: show in-app toast
          const title = notification._alert?.title || notification.title || data.title || 'Cotaja';
          const body = notification._alert?.body || notification.message || notification.body || data.body || '';
          if (title || body) {
            DeviceEventEmitter.emit('in_app_notification', {
              title,
              message: body,
              type: data.type,
              order_id: data.order_id ? parseInt(data.order_id) : undefined,
            });
          }
        }

        // Required for iOS
        notification.finish && notification.finish(PushNotificationIOS.FetchResult.NoData);
      };

      // Handler specifically for notification TAPS
      // In RNCPushNotificationIOS v1.11.0, didReceiveNotificationResponse posts to
      // 'localNotificationReceived' channel, so taps arrive as 'localNotification' events
      const onLocalNotification = (notification: any) => {
        console.log('[iOS] localNotification event (TAP):', JSON.stringify(notification));
        const data = notification._data || notification.data || {};
        const getDataResult = notification.getData ? notification.getData() : {};

        // localNotification from didReceiveNotificationResponse always has userInteraction=1
        const isUserTap =
          notification.userInteraction === true ||
          notification.userInteraction === 1 ||
          data.userInteraction === true ||
          data.userInteraction === 1 ||
          getDataResult.userInteraction === true ||
          getDataResult.userInteraction === 1;

        console.log('[iOS] localNotification userInteraction:', isUserTap);

        if (isUserTap) {
          console.log('[iOS] TAP detected via localNotification, navigating...');
          // The payload from APNs is inside the notification data
          const navData = {
            type: data.type || getDataResult.type,
            order_id: data.order_id || getDataResult.order_id,
          };
          this.handleNotificationTap(navData);
        }

        notification.finish && notification.finish(PushNotificationIOS.FetchResult.NoData);
      };

      // Add event listeners
      PushNotificationIOS.addEventListener('register', onRegistered);
      PushNotificationIOS.addEventListener('registrationError', onRegistrationError);
      PushNotificationIOS.addEventListener('notification', onRemoteNotification);
      PushNotificationIOS.addEventListener('localNotification', onLocalNotification);

      // Handle cold start: app was killed and user tapped a notification to open it
      PushNotificationIOS.getInitialNotification().then((notification) => {
        if (notification) {
          console.log('[iOS] Initial notification found (cold start tap):', JSON.stringify(notification));
          const initialData = notification.getData ? notification.getData() : (notification as any)._data || {};
          if (initialData.type || initialData.order_id) {
            this.handleNotificationTap(initialData);
          }
        }
      }).catch((err) => {
        console.log('[iOS] getInitialNotification error:', err);
      });

      // NOW request permissions - this will trigger the 'register' event
      PushNotificationIOS.requestPermissions({
        alert: true,
        badge: true,
        sound: true,
        critical: true,
      }).then(
        (permissions) => {
          console.log('[iOS] Permissoes concedidas:', permissions);

          if (permissions.alert || permissions.badge || permissions.sound) {
            resolve();
          } else {
            reject(new Error('Permissões de notificação negadas'));
          }
        },
        (error) => {
          console.log('[iOS] requestPermissions failed:', error);
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
        console.log('[Android] Permissao POST_NOTIFICATIONS:', granted);
      }
    } catch (err) {
      console.warn('[Android] Erro ao solicitar permissao:', err);
    }

    // Configure Firebase Cloud Messaging para Android
    console.log('[Android] Configurando Firebase Cloud Messaging...');

    PushNotification.configure({
      onRegister: (token: any) => {
        console.log('[Android] Token FCM obtido:', token.token);
        this.deviceToken = token.token;
        AsyncStorage.setItem('device_token', token.token).then(() => {
          console.log('[Android] Token salvo no AsyncStorage com sucesso!');
        }).catch((error) => {
          console.error('[Android] Erro ao salvar token no AsyncStorage:', error);
        });
      },
      onNotification: (notification: any) => {
        console.log('[Android] Notificacao recebida:', JSON.stringify(notification));

        // If user tapped the notification (userInteraction = true), navigate
        if (notification.userInteraction) {
          this.handleNotificationTap(notification.data || notification);
        } else if (notification.foreground) {
          const data = notification.data || {};

          // Skip if this is our own local notification copy (avoid infinite loop)
          if (data._isLocalCopy) {
            notification.finish(PushNotificationIOS.FetchResult.NoData);
            return;
          }

          const title = notification.title || data.title || 'Cotaja';
          const message = notification.message || data.body || '';
          if (title || message) {
            // Show in-app toast
            DeviceEventEmitter.emit('in_app_notification', {
              title,
              message,
              type: data.type,
              order_id: data.order_id ? parseInt(data.order_id) : undefined,
            });

            // Also show in notification center so it appears in the status bar
            PushNotification.localNotification({
              channelId: 'cotaja-default',
              title: title,
              message: message,
              smallIcon: 'ic_notification',
              color: '#4f46e5',
              playSound: true,
              soundName: 'default',
              userInfo: { ...data, _isLocalCopy: true },
            });
          }
        }

        notification.finish(PushNotificationIOS.FetchResult.NoData);
      },
      onAction: (notification: any) => {
        console.log('[Android] Acao:', notification.action);
        // When user taps the local notification, navigate
        this.handleNotificationTap(notification.data || notification.userInfo || {});
      },
      onRegistrationError: (err: any) => {
        console.error('[Android] Erro registro:', err.message, err);
      },
      permissions: { alert: true, badge: true, sound: true },
      popInitialNotification: true,
      requestPermissions: true,
    });

    // Create notification channel for Android 8+
    PushNotification.createChannel(
      {
        channelId: 'cotaja-default',
        channelName: 'Cotaja Notificacoes',
        channelDescription: 'Notificacoes do aplicativo Cotaja',
        playSound: true,
        soundName: 'default',
        importance: 4, // IMPORTANCE_HIGH
        vibrate: true,
      },
      (created: boolean) => console.log(`[Android] Canal de notificacao ${created ? 'criado' : 'ja existia'}`)
    );

    console.log('[Android] Firebase Cloud Messaging configurado');
  }

  private handleNotificationTap(data: any) {
    const type = data?.type;
    const orderId = data?.order_id ? parseInt(data.order_id) : null;
    if (!type && !orderId) return;

    const attemptNavigate = (attempt = 0) => {
      if (!navigationRef.isReady()) {
        if (attempt < 15) setTimeout(() => attemptNavigate(attempt + 1), 300);
        return;
      }

      if (type === 'chat_message' && orderId) {
        AsyncStorage.getItem('user').then(json => {
          const profile = json ? JSON.parse(json)?.profile_type : null;
          try {
            if (profile === 'provider') {
              (navigationRef as any).navigate('Provider', {
                screen: 'MyServicesTab',
                params: { screen: 'AcceptedOrder', params: { orderId } },
              });
            } else {
              (navigationRef as any).navigate('Client', {
                screen: 'MyOrdersTab',
                params: { screen: 'AcceptedOrder', params: { orderId } },
              });
            }
          } catch (e) {
            console.log('[Push] Erro ao navegar para chat:', e);
          }
        });
      }
    };

    attemptNavigate();
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
      try {
        PushNotification.localNotification({
          channelId: 'cotaja-default',
          title: title,
          message: body,
          smallIcon: 'ic_notification',
          color: '#4f46e5',
          playSound: true,
          soundName: 'default',
          userInfo: data || {},
        });
      } catch (error) {
        console.warn('⚠️ [Android] Push notification não disponível (Firebase não configurado):', error);
      }
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
      try {
        PushNotification.localNotificationSchedule({
          channelId: 'cotaja-default',
          title: title,
          message: message,
          date: date,
          smallIcon: 'ic_notification',
          color: '#4f46e5',
          playSound: true,
          soundName: 'default',
          userInfo: data || {},
        });
      } catch (error) {
        console.warn('⚠️ [Android] Scheduled notification não disponível (Firebase não configurado):', error);
      }
    }
  }

  async cancelAllNotifications() {
    if (Platform.OS === 'ios') {
      PushNotificationIOS.removeAllPendingNotificationRequests();
    } else {
      try {
        PushNotification.cancelAllLocalNotifications();
      } catch (error) {
        console.warn('⚠️ [Android] Cancel notifications não disponível (Firebase não configurado):', error);
      }
    }
  }
}

export default new PushNotificationService();