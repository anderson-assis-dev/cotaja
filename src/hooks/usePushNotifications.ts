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

  
  useEffect(() => {
    if (user && deviceToken && isInitialized) {
      registerDeviceWithBackend();
    }
  }, [user, deviceToken, isInitialized]);

  
  const registerDeviceWithBackend = async () => {
    try {
      const deviceInfo = getDeviceInfo();
      if (!deviceInfo) return;

      console.log('Registering device with backend:', deviceInfo);

      const response = await api.post('/user/register-device', {
        fcm_token: deviceInfo.token,
        device_platform: deviceInfo.platform,
        app_version: '1.0.0',
      });

      if (response.data.success) {
        console.log('Device registered successfully with backend');
      }
    } catch (error) {
      console.error('Error registering device with backend:', error);
    }
  };

  
  const handleNotificationReceived = (type: string, data: any) => {
    console.log('Handling notification:', type, data);

    switch (type) {
      case 'new_proposal':
        if (handlers?.onNewProposal) {
          handlers.onNewProposal(data);
        } else {
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

  
  const sendBulkNotification = async (userIds: string[], title: string, message: string, data?: any) => {
    try {
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
              await refreshToken();
            }
          }
        ]
      );
    }
  };

  
  const getNotificationInfo = () => {
    return {
      isEnabled: permissionStatus === 'authorized' || permissionStatus === 'provisional',
      hasToken: !!deviceToken,
      platform: Platform.OS,
      status: permissionStatus,
      token: deviceToken
    };
  };

  
  const disableNotifications = async () => {
    try {
      if (deviceToken) {
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
    isInitialized,
    deviceToken,
    permissionStatus,
    isLoading,

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