import React, { useEffect, useState } from 'react';
import {
  View,
  Text,
  TouchableOpacity,
  StyleSheet,
  ScrollView,
  Alert,
  Platform
} from 'react-native';
import pushNotificationService from '../services/pushNotificationService';

const TestPushNotificationsScreen: React.FC = () => {
  const [deviceToken, setDeviceToken] = useState<string | null>(null);
  const [permissions, setPermissions] = useState<any>(null);
  const [isInitialized, setIsInitialized] = useState<boolean>(false);

  useEffect(() => {
    initializePushNotifications();
  }, []);

  const initializePushNotifications = async () => {
    try {
      await pushNotificationService.initialize();

      // Update state
      setIsInitialized(pushNotificationService.isServiceInitialized());
      setDeviceToken(pushNotificationService.getDeviceToken());

      // Check permissions
      const perms = await pushNotificationService.checkPermissions();
      setPermissions(perms);
    } catch (error) {
      console.error('Error initializing push notifications:', error);
      Alert.alert('Erro', 'Falha ao inicializar push notifications');
    }
  };

  const sendLocalNotification = async () => {
    try {
      await pushNotificationService.sendLocalNotification(
        'Teste Local',
        'Esta é uma notificação de teste local!',
        { testData: 'local_notification' }
      );
      Alert.alert('Sucesso', 'Notificação local enviada!');
    } catch (error) {
      console.error('Error sending local notification:', error);
      Alert.alert('Erro', 'Falha ao enviar notificação local');
    }
  };

  const sendScheduledNotification = async () => {
    try {
      const futureDate = new Date();
      futureDate.setSeconds(futureDate.getSeconds() + 10); // 10 seconds from now

      await pushNotificationService.sendScheduledNotification(
        'Teste Agendado',
        'Esta notificação foi agendada para 10 segundos!',
        futureDate,
        { testData: 'scheduled_notification' }
      );
      Alert.alert('Sucesso', 'Notificação agendada para 10 segundos!');
    } catch (error) {
      console.error('Error sending scheduled notification:', error);
      Alert.alert('Erro', 'Falha ao agendar notificação');
    }
  };

  const setBadgeCount = async () => {
    if (Platform.OS === 'ios') {
      try {
        await pushNotificationService.setBadgeCount(5);
        Alert.alert('Sucesso', 'Badge count definido para 5');
      } catch (error) {
        Alert.alert('Erro', 'Falha ao definir badge count');
      }
    } else {
      Alert.alert('Info', 'Badge count é apenas para iOS');
    }
  };

  const clearBadge = async () => {
    if (Platform.OS === 'ios') {
      try {
        await pushNotificationService.setBadgeCount(0);
        Alert.alert('Sucesso', 'Badge count zerado');
      } catch (error) {
        Alert.alert('Erro', 'Falha ao zerar badge count');
      }
    } else {
      Alert.alert('Info', 'Badge count é apenas para iOS');
    }
  };

  const cancelAllNotifications = async () => {
    try {
      await pushNotificationService.cancelAllNotifications();
      Alert.alert('Sucesso', 'Todas as notificações canceladas');
    } catch (error) {
      Alert.alert('Erro', 'Falha ao cancelar notificações');
    }
  };

  return (
    <ScrollView style={styles.container}>
      <View style={styles.header}>
        <Text style={styles.title}>Test Push Notifications</Text>
        <Text style={styles.subtitle}>Community Version</Text>
      </View>

      <View style={styles.section}>
        <Text style={styles.sectionTitle}>Status</Text>
        <Text style={styles.statusText}>
          Inicializado: {isInitialized ? '✅ Sim' : '❌ Não'}
        </Text>
        <Text style={styles.statusText}>
          Plataforma: {Platform.OS}
        </Text>
      </View>

      <View style={styles.section}>
        <Text style={styles.sectionTitle}>Device Token</Text>
        <Text style={styles.tokenText}>
          {deviceToken ? deviceToken : 'Token não encontrado'}
        </Text>
      </View>

      <View style={styles.section}>
        <Text style={styles.sectionTitle}>Permissões</Text>
        {permissions && (
          <View>
            <Text style={styles.permissionText}>Alert: {permissions.alert ? '✅' : '❌'}</Text>
            <Text style={styles.permissionText}>Badge: {permissions.badge ? '✅' : '❌'}</Text>
            <Text style={styles.permissionText}>Sound: {permissions.sound ? '✅' : '❌'}</Text>
          </View>
        )}
      </View>

      <View style={styles.section}>
        <Text style={styles.sectionTitle}>Testes</Text>

        <TouchableOpacity style={styles.button} onPress={sendLocalNotification}>
          <Text style={styles.buttonText}>Enviar Notificação Local</Text>
        </TouchableOpacity>

        <TouchableOpacity style={styles.button} onPress={sendScheduledNotification}>
          <Text style={styles.buttonText}>Agendar Notificação (10s)</Text>
        </TouchableOpacity>

        {Platform.OS === 'ios' && (
          <>
            <TouchableOpacity style={styles.button} onPress={setBadgeCount}>
              <Text style={styles.buttonText}>Definir Badge (5)</Text>
            </TouchableOpacity>

            <TouchableOpacity style={styles.button} onPress={clearBadge}>
              <Text style={styles.buttonText}>Limpar Badge</Text>
            </TouchableOpacity>
          </>
        )}

        <TouchableOpacity
          style={[styles.button, styles.dangerButton]}
          onPress={cancelAllNotifications}
        >
          <Text style={styles.buttonText}>Cancelar Todas Notificações</Text>
        </TouchableOpacity>
      </View>

      <View style={styles.section}>
        <TouchableOpacity
          style={[styles.button, styles.primaryButton]}
          onPress={initializePushNotifications}
        >
          <Text style={styles.buttonText}>Reinicializar Serviço</Text>
        </TouchableOpacity>
      </View>
    </ScrollView>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#f5f5f5',
    padding: 20,
  },
  header: {
    alignItems: 'center',
    marginBottom: 30,
  },
  title: {
    fontSize: 24,
    fontWeight: 'bold',
    color: '#333',
  },
  subtitle: {
    fontSize: 16,
    color: '#666',
    marginTop: 5,
  },
  section: {
    backgroundColor: '#fff',
    padding: 15,
    borderRadius: 10,
    marginBottom: 20,
  },
  sectionTitle: {
    fontSize: 18,
    fontWeight: 'bold',
    color: '#333',
    marginBottom: 10,
  },
  statusText: {
    fontSize: 16,
    color: '#333',
    marginBottom: 5,
  },
  tokenText: {
    fontSize: 12,
    color: '#666',
    backgroundColor: '#f0f0f0',
    padding: 10,
    borderRadius: 5,
    fontFamily: 'monospace',
  },
  permissionText: {
    fontSize: 16,
    color: '#333',
    marginBottom: 5,
  },
  button: {
    backgroundColor: '#007AFF',
    padding: 15,
    borderRadius: 8,
    alignItems: 'center',
    marginBottom: 10,
  },
  primaryButton: {
    backgroundColor: '#34C759',
  },
  dangerButton: {
    backgroundColor: '#FF3B30',
  },
  buttonText: {
    color: '#fff',
    fontSize: 16,
    fontWeight: '600',
  },
});

export default TestPushNotificationsScreen;