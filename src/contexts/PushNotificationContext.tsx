import React, { createContext, useContext, useEffect, useState, ReactNode } from 'react';
import pushNotificationService from '../services/pushNotificationService';

interface DeviceInfo {
  token: string;
  platform: 'ios' | 'android';
}

interface PushNotificationContextData {
  // State
  isInitialized: boolean;
  deviceToken: string | null;
  permissionStatus: string;
  isLoading: boolean;

  // Methods
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

  // Initialize service on mount
  useEffect(() => {
    initializeService();
  }, []);

  /**
   * Initialize push notification service
   */
  const initializeService = async (): Promise<void> => {
    try {
      setIsLoading(true);
      console.log('Initializing push notification service from context...');

      await pushNotificationService.initialize();

      // Update state
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

  /**
   * Send test notification
   */
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

  /**
   * Refresh device token
   */
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

  /**
   * Get device info
   */
  const getDeviceInfo = (): DeviceInfo | null => {
    return pushNotificationService.getDeviceInfo();
  };

  /**
   * Clear all push notification data
   */
  const clearData = async (): Promise<void> => {
    try {
      setIsLoading(true);
      await pushNotificationService.clearStoredData();

      // Reset state
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
    // State
    isInitialized,
    deviceToken,
    permissionStatus,
    isLoading,

    // Methods
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

/**
 * Hook to use push notification context
 */
export const usePushNotification = (): PushNotificationContextData => {
  const context = useContext(PushNotificationContext);

  if (!context) {
    throw new Error('usePushNotification must be used within a PushNotificationProvider');
  }

  return context;
};

export default PushNotificationContext;