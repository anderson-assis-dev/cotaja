import { useEffect } from 'react';
import { Alert, Platform } from 'react-native';
import { usePushNotification } from '../contexts/PushNotificationContext';
import { useAuth } from '../contexts/AuthContext';
import api from '../services/api';

interface NotificationHandlers {
  onNewProposal?: (data: any) => void;
  onProposalAccepted?: (data: any) => void;
  onNewOrder?: (data: any) => void;
  onOrderCompleted?: (data: any) => void;
}

export const usePushNotifications = (handlers?: NotificationHandlers) => {
  const { user } = useAuth();
  const {
    isInitialized,
    deviceToken,
    permissionStatus,
    isLoading,
    initializeService,
    sendTestNotification,
    refreshToken,
    getDeviceInfo,
    clearData
  } = usePushNotification();

  /**
   * Register device token with backend when user is authenticated
   */
  useEffect(() => {
    if (user && deviceToken && isInitialized) {
      registerDeviceWithBackend();
    }
  }, [user, deviceToken, isInitialized]);

  /**
   * Register device token with backend
   */
  const registerDeviceWithBackend = async () => {
    try {
      const deviceInfo = getDeviceInfo();
      if (!deviceInfo) return;

      console.log('Registering device with backend:', deviceInfo);

      // You can implement this endpoint in your backend
      const response = await api.post('/user/register-device', {
        fcm_token: deviceInfo.token,
        device_platform: deviceInfo.platform,
        app_version: '1.0.0', // You can get this from package.json
      });

      if (response.data.success) {
        console.log('Device registered successfully with backend');
      }
    } catch (error) {
      console.error('Error registering device with backend:', error);
    }
  };

  /**
   * Handle different notification types
   */
  const handleNotificationReceived = (type: string, data: any) => {
    console.log('Handling notification:', type, data);

    switch (type) {
      case 'new_proposal':
        if (handlers?.onNewProposal) {
          handlers.onNewProposal(data);
        } else {
          // Default handling
          Alert.alert(
            'Nova Proposta',
            'Você recebeu uma nova proposta!',
            [{ text: 'OK' }]
          );
        }
        break;

      case 'proposal_accepted':
        if (handlers?.onProposalAccepted) {
          handlers.onProposalAccepted(data);
        } else {
          Alert.alert(
            'Proposta Aceita',
            'Sua proposta foi aceita!',
            [{ text: 'OK' }]
          );
        }
        break;

      case 'new_order':
        if (handlers?.onNewOrder) {
          handlers.onNewOrder(data);
        } else {
          Alert.alert(
            'Nova Demanda',
            'Nova demanda disponível na sua área!',
            [{ text: 'OK' }]
          );
        }
        break;

      case 'order_completed':
        if (handlers?.onOrderCompleted) {
          handlers.onOrderCompleted(data);
        } else {
          Alert.alert(
            'Serviço Concluído',
            'O serviço foi marcado como concluído!',
            [{ text: 'OK' }]
          );
        }
        break;

      default:
        console.log('Unknown notification type:', type);
    }
  };

  /**
   * Send notification to specific user
   */
  const sendNotificationToUser = async (userId: string, title: string, message: string, data?: any) => {
    try {
      const response = await api.post('/notifications/push/user', {
        user_id: userId,
        title,
        message,
        sound: 'default',
        ...data
      });

      return response.data.success;
    } catch (error) {
      console.error('Error sending notification to user:', error);
      return false;
    }
  };

  /**
   * Send notification to multiple users
   */
  const sendBulkNotification = async (userIds: string[], title: string, message: string, data?: any) => {
    try {
      // You would need to implement this endpoint to get device tokens for multiple users
      const response = await api.post('/notifications/push/bulk-users', {
        user_ids: userIds,
        title,
        message,
        sound: 'default',
        ...data
      });

      return response.data.success;
    } catch (error) {
      console.error('Error sending bulk notification:', error);
      return false;
    }
  };

  /**
   * Request notification permission if not granted
   */
  const requestPermissionIfNeeded = async () => {
    if (permissionStatus === 'denied' || permissionStatus === 'not_determined') {
      Alert.alert(
        'Permissão de Notificações',
        'Para receber notificações sobre propostas e atualizações, permita o acesso às notificações.',
        [
          { text: 'Cancelar', style: 'cancel' },
          {
            text: 'Permitir',
            onPress: async () => {
              await refreshToken(); // This will trigger permission request
            }
          }
        ]
      );
    }
  };

  /**
   * Get notification settings info
   */
  const getNotificationInfo = () => {
    return {
      isEnabled: permissionStatus === 'authorized' || permissionStatus === 'provisional',
      hasToken: !!deviceToken,
      platform: Platform.OS,
      status: permissionStatus,
      token: deviceToken
    };
  };

  /**
   * Disable notifications (clear token from backend)
   */
  const disableNotifications = async () => {
    try {
      if (deviceToken) {
        // Call backend to remove device token
        await api.delete('/user/remove-device', {
          data: { fcm_token: deviceToken }
        });
      }

      await clearData();

      Alert.alert('Notificações Desabilitadas', 'Você não receberá mais notificações push.');
    } catch (error) {
      console.error('Error disabling notifications:', error);
      Alert.alert('Erro', 'Não foi possível desabilitar as notificações.');
    }
  };

  return {
    // State
    isInitialized,
    deviceToken,
    permissionStatus,
    isLoading,

    // Methods
    initializeService,
    sendTestNotification,
    refreshToken,
    registerDeviceWithBackend,
    handleNotificationReceived,
    sendNotificationToUser,
    sendBulkNotification,
    requestPermissionIfNeeded,
    getNotificationInfo,
    disableNotifications,
    clearData
  };
};