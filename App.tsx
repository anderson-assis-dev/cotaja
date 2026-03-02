import React, { useEffect } from 'react';
import { SafeAreaProvider } from 'react-native-safe-area-context';
import { GestureHandlerRootView } from 'react-native-gesture-handler';
import { Platform, AppState, AppStateStatus } from 'react-native';
import PushNotificationIOS from '@react-native-community/push-notification-ios';
import AppNavigator from './src/navigation/AppNavigator';
import { AuthProvider } from './src/contexts/AuthContext';
import { PushNotificationProvider } from './src/contexts/PushNotificationContext';
import { ToastProvider } from './src/contexts/ToastContext';

export default function App() {
  useEffect(() => {
    if (Platform.OS === 'ios') {
      PushNotificationIOS.setApplicationIconBadgeNumber(0);
    }

    const subscription = AppState.addEventListener('change', (nextAppState: AppStateStatus) => {
      if (nextAppState === 'active' && Platform.OS === 'ios') {
        PushNotificationIOS.setApplicationIconBadgeNumber(0);
      }
    });

    return () => {
      subscription.remove();
    };
  }, []);

  return (
    <GestureHandlerRootView style={{ flex: 1 }}>
      <SafeAreaProvider>
        <AuthProvider>
          <PushNotificationProvider>
            <ToastProvider>
              <AppNavigator />
            </ToastProvider>
          </PushNotificationProvider>
        </AuthProvider>
      </SafeAreaProvider>
    </GestureHandlerRootView>
  );
}
