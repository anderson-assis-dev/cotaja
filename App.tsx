import React, { useEffect } from 'react';
import { SafeAreaProvider } from 'react-native-safe-area-context';
import { GestureHandlerRootView } from 'react-native-gesture-handler';
import { Platform, AppState, AppStateStatus } from 'react-native';
import PushNotificationIOS from '@react-native-community/push-notification-ios';
import { StripeProvider } from '@stripe/stripe-react-native';
import Config from 'react-native-config';
import AppNavigator from './src/navigation/AppNavigator';
import { requestInitialPermissions } from './src/utils/permissions';
import { AuthProvider } from './src/contexts/AuthContext';
import { PushNotificationProvider } from './src/contexts/PushNotificationContext';
import { ToastProvider } from './src/contexts/ToastContext';

const STRIPE_PUBLISHABLE_KEY = Config.STRIPE_PUBLISHABLE_KEY || '';

export default function App() {
  useEffect(() => {
    // Na primeira abertura, solicita câmera + localização (iOS e Android) para
    // que o cadastro (liveness e CEP automático) funcione sem passos extras.
    requestInitialPermissions();
  }, []);

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
      <StripeProvider publishableKey={STRIPE_PUBLISHABLE_KEY}>
        <SafeAreaProvider>
          <AuthProvider>
            <PushNotificationProvider>
              <ToastProvider>
                <AppNavigator />
              </ToastProvider>
            </PushNotificationProvider>
          </AuthProvider>
        </SafeAreaProvider>
      </StripeProvider>
    </GestureHandlerRootView>
  );
}
