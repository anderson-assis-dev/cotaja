import React from 'react';
import AppNavigator from './src/navigation/AppNavigator';
import { AuthProvider } from './src/contexts/AuthContext';
import { PushNotificationProvider } from './src/contexts/PushNotificationContext';

export default function App() {
  return (
    <AuthProvider>
      <PushNotificationProvider>
        <AppNavigator />
      </PushNotificationProvider>
    </AuthProvider>
  );
}
