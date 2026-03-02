import React, { createContext, useContext, useEffect, useState, ReactNode } from 'react';
import { Platform, AppState, AppStateStatus } from 'react-native';
import AsyncStorage from '@react-native-async-storage/async-storage';
import pushNotificationService from '../services/pushNotificationService';
import { authService } from '../services/api';

interface DeviceInfo {
  token: string;
  platform: 'ios' | 'android';
}

interface PushNotificationContextData {
  isInitialized: boolean;
  deviceToken: string | null;
  permissionStatus: string;
  isLoading: boolean;

  initializeService: () => Promise<void>;
  sendTestNotification: () => Promise<void>;
  refreshToken: () => Promise<void>;
  getDeviceInfo: () => DeviceInfo | null;
  clearData: () => Promise<void>;
}

interface PushNotificationProviderProps {
  children: ReactNode;
}

const PushNotificationContext = createContext<PushNotificationContextData>({} as PushNotificationContextData);

export const PushNotificationProvider: React.FC<PushNotificationProviderProps> = ({ children }) => {
  const [isInitialized, setIsInitialized] = useState(false);
  const [deviceToken, setDeviceToken] = useState<string | null>(null);
  const [permissionStatus, setPermissionStatus] = useState<string>('unknown');
  const [isLoading, setIsLoading] = useState(false);

  useEffect(() => {
    initializeService();
  }, []);

  useEffect(() => {
    const subscription = AppState.addEventListener('change', async (nextAppState: AppStateStatus) => {
      if (nextAppState === 'active') {
        console.log('📱 [AppState] App voltou para foreground, verificando token...');

        const authToken = await AsyncStorage.getItem('auth_token');
        if (authToken) {
          const storedToken = await AsyncStorage.getItem('device_token');
          if (storedToken) {
            console.log('🔄 [AppState] Atualizando token no backend...');
            try {
              await authService.saveFcmToken(storedToken, Platform.OS);
              console.log('✅ [AppState] Token atualizado com sucesso');
            } catch (error) {
              console.error('❌ [AppState] Erro ao atualizar token:', error);
            }
          }
        }
      }
    });

    return () => {
      subscription.remove();
    };
  }, []);

  
  const initializeService = async (): Promise<void> => {
    try {
      setIsLoading(true);
      console.log('Initializing push notification service from context...');

      await pushNotificationService.initialize();

      setIsInitialized(pushNotificationService.isServiceInitialized());
      setDeviceToken(pushNotificationService.getDeviceToken());

      const status = await pushNotificationService.getPermissionStatus();
      setPermissionStatus(status);

      console.log('Push notification context initialized successfully');
    } catch (error) {
      console.error('Error initializing push notification context:', error);
    } finally {
      setIsLoading(false);
    }
  };

  
  const sendTestNotification = async (): Promise<void> => {
    try {
      setIsLoading(true);
      await pushNotificationService.sendTestNotification();
    } catch (error) {
      console.error('Error sending test notification from context:', error);
    } finally {
      setIsLoading(false);
    }
  };

  
  const refreshToken = async (): Promise<void> => {
    try {
      setIsLoading(true);
      const newToken = await pushNotificationService.refreshToken();
      setDeviceToken(newToken);

      const status = await pushNotificationService.getPermissionStatus();
      setPermissionStatus(status);
    } catch (error) {
      console.error('Error refreshing token from context:', error);
    } finally {
      setIsLoading(false);
    }
  };

  
  const getDeviceInfo = (): DeviceInfo | null => {
    return pushNotificationService.getDeviceInfo();
  };

  
  const clearData = async (): Promise<void> => {
    try {
      setIsLoading(true);
      await pushNotificationService.clearStoredData();

      setIsInitialized(false);
      setDeviceToken(null);
      setPermissionStatus('unknown');
    } catch (error) {
      console.error('Error clearing push notification data from context:', error);
    } finally {
      setIsLoading(false);
    }
  };

  const value: PushNotificationContextData = {
    isInitialized,
    deviceToken,
    permissionStatus,
    isLoading,

    initializeService,
    sendTestNotification,
    refreshToken,
    getDeviceInfo,
    clearData,
  };

  return (
    <PushNotificationContext.Provider value={value}>
      {children}
    </PushNotificationContext.Provider>
  );
};

export const usePushNotification = (): PushNotificationContextData => {
  const context = useContext(PushNotificationContext);

  if (!context) {
    throw new Error('usePushNotification must be used within a PushNotificationProvider');
  }

  return context;
};

export default PushNotificationContext;