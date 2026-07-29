import React, { useState } from 'react';
import {
  View,
  Text,
  TouchableOpacity,
  ScrollView,
  Alert,
  StyleSheet,
  Switch,
  ActivityIndicator,
  Clipboard
} from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import Icon from 'react-native-vector-icons/MaterialIcons';
import { usePushNotifications } from '../../hooks/usePushNotifications';
import { useAuth } from '../../contexts/AuthContext';
import { useToast } from '../../contexts/ToastContext';
import { authService } from '../../services/api';

export default function PushNotificationSettingsScreen() {
  const insets = useSafeAreaInsets();
  const [isTestingToken, setIsTestingToken] = useState(false);
  const { user, refreshUser } = useAuth();
  const { showError } = useToast();
  const [emailEnabled, setEmailEnabled] = useState(user?.email_unsubscribed !== 1);
  const [savingEmailPref, setSavingEmailPref] = useState(false);

  React.useEffect(() => {
    setEmailEnabled(user?.email_unsubscribed !== 1);
  }, [user?.email_unsubscribed]);

  const handleToggleEmail = async (value: boolean) => {
    setEmailEnabled(value); // otimista
    setSavingEmailPref(true);
    try {
      await authService.updateNotificationPreferences(value);
      await refreshUser();
    } catch (error: any) {
      setEmailEnabled(!value); // reverte em caso de erro
      showError(error.response?.data?.message || 'Não foi possível atualizar a preferência de e-mail.');
    } finally {
      setSavingEmailPref(false);
    }
  };

  const {
    isInitialized,
    deviceToken,
    permissionStatus,
    isLoading,
    sendTestNotification,
    refreshToken,
    requestPermissionIfNeeded,
    getNotificationInfo,
    disableNotifications,
    initializeService
  } = usePushNotifications();

  const notificationInfo = getNotificationInfo();

  const handleSendTest = async () => {
    setIsTestingToken(true);
    try {
      await sendTestNotification();
    } finally {
      setIsTestingToken(false);
    }
  };

  const handleRefreshToken = async () => {
    try {
      await refreshToken();
      Alert.alert('Sucesso', 'Token atualizado com sucesso!');
    } catch (error) {
      Alert.alert('Erro', 'Falha ao atualizar token');
    }
  };

  const handleCopyToken = () => {
    if (deviceToken) {
      Clipboard.setString(deviceToken);
      Alert.alert('Copiado', 'Token copiado para a área de transferência');
    }
  };

  const getStatusColor = (status: string) => {
    switch (status) {
      case 'authorized':
      case 'provisional':
        return '#10b981';
      case 'denied':
        return '#ef4444';
      default:
        return '#f59e0b';
    }
  };

  const getStatusText = (status: string) => {
    switch (status) {
      case 'authorized':
        return 'Autorizado';
      case 'provisional':
        return 'Autorizado (Provisório)';
      case 'denied':
        return 'Negado';
      case 'not_determined':
        return 'Não Determinado';
      default:
        return 'Desconhecido';
    }
  };

  return (
    <ScrollView style={[styles.container, { paddingTop: insets.top }]}>
      <View style={styles.content}>
        <Text style={styles.title}>Configurações de Notificação</Text>

        <View style={styles.card}>
          <Text style={styles.cardTitle}>Notificações por e-mail</Text>
          <View style={styles.emailPrefRow}>
            <View style={styles.emailPrefTextWrap}>
              <Text style={styles.emailPrefLabel}>Receber e-mails de notificação</Text>
              <Text style={styles.emailPrefDesc}>
                Avisos de propostas, lembretes e novidades. Você pode cancelar a qualquer momento.
              </Text>
            </View>
            <Switch
              value={emailEnabled}
              onValueChange={handleToggleEmail}
              disabled={savingEmailPref}
              trackColor={{ false: '#d1d5db', true: '#a5b4fc' }}
              thumbColor={emailEnabled ? '#4f46e5' : '#f3f4f6'}
            />
          </View>
        </View>


        <View style={styles.card}>
          <Text style={styles.cardTitle}>Status do Serviço</Text>

          <View style={styles.statusRow}>
            <Text style={styles.statusLabel}>Inicializado:</Text>
            <View style={[styles.statusBadge, { backgroundColor: isInitialized ? '#10b981' : '#ef4444' }]}>
              <Text style={styles.statusText}>
                {isInitialized ? 'Sim' : 'Não'}
              </Text>
            </View>
          </View>

          <View style={styles.statusRow}>
            <Text style={styles.statusLabel}>Permissão:</Text>
            <View style={[styles.statusBadge, { backgroundColor: getStatusColor(permissionStatus) }]}>
              <Text style={styles.statusText}>
                {getStatusText(permissionStatus)}
              </Text>
            </View>
          </View>

          <View style={styles.statusRow}>
            <Text style={styles.statusLabel}>Token Disponível:</Text>
            <View style={[styles.statusBadge, { backgroundColor: deviceToken ? '#10b981' : '#ef4444' }]}>
              <Text style={styles.statusText}>
                {deviceToken ? 'Sim' : 'Não'}
              </Text>
            </View>
          </View>

          <View style={styles.statusRow}>
            <Text style={styles.statusLabel}>Plataforma:</Text>
            <Text style={styles.statusValue}>{notificationInfo.platform}</Text>
          </View>
        </View>

        
        {deviceToken && (
          <View style={styles.card}>
            <Text style={styles.cardTitle}>Token do Dispositivo</Text>

            <View style={styles.tokenContainer}>
              <Text style={styles.tokenText} numberOfLines={3} ellipsizeMode="middle">
                {deviceToken}
              </Text>

              <TouchableOpacity style={styles.copyButton} onPress={handleCopyToken}>
                <Icon name="content-copy" size={20} color="#4f46e5" />
              </TouchableOpacity>
            </View>
          </View>
        )}

        
        <View style={styles.card}>
          <Text style={styles.cardTitle}>Ações</Text>

          {!notificationInfo.isEnabled && (
            <TouchableOpacity
              style={[styles.actionButton, styles.primaryButton]}
              onPress={requestPermissionIfNeeded}
              disabled={isLoading}
            >
              <Icon name="notifications" size={24} color="#ffffff" />
              <Text style={styles.primaryButtonText}>Solicitar Permissão</Text>
            </TouchableOpacity>
          )}

          {!isInitialized && (
            <TouchableOpacity
              style={[styles.actionButton, styles.primaryButton]}
              onPress={initializeService}
              disabled={isLoading}
            >
              {isLoading ? (
                <ActivityIndicator color="#ffffff" size="small" />
              ) : (
                <Icon name="play-arrow" size={24} color="#ffffff" />
              )}
              <Text style={styles.primaryButtonText}>Inicializar Serviço</Text>
            </TouchableOpacity>
          )}

          <TouchableOpacity
            style={[styles.actionButton, styles.secondaryButton]}
            onPress={handleSendTest}
            disabled={!deviceToken || isTestingToken}
          >
            {isTestingToken ? (
              <ActivityIndicator color="#4f46e5" size="small" />
            ) : (
              <Icon name="send" size={24} color="#4f46e5" />
            )}
            <Text style={styles.secondaryButtonText}>Enviar Teste</Text>
          </TouchableOpacity>

          <TouchableOpacity
            style={[styles.actionButton, styles.secondaryButton]}
            onPress={handleRefreshToken}
            disabled={isLoading}
          >
            {isLoading ? (
              <ActivityIndicator color="#4f46e5" size="small" />
            ) : (
              <Icon name="refresh" size={24} color="#4f46e5" />
            )}
            <Text style={styles.secondaryButtonText}>Atualizar Token</Text>
          </TouchableOpacity>

          <TouchableOpacity
            style={[styles.actionButton, styles.dangerButton]}
            onPress={disableNotifications}
            disabled={isLoading}
          >
            <Icon name="notifications-off" size={24} color="#ef4444" />
            <Text style={styles.dangerButtonText}>Desabilitar Notificações</Text>
          </TouchableOpacity>
        </View>

        
        <View style={styles.card}>
          <Text style={styles.cardTitle}>Instruções</Text>

          <View style={styles.instructionItem}>
            <Icon name="info" size={20} color="#6b7280" />
            <Text style={styles.instructionText}>
              Para receber notificações, certifique-se de que as permissões estão habilitadas nas configurações do dispositivo.
            </Text>
          </View>

          <View style={styles.instructionItem}>
            <Icon name="security" size={20} color="#6b7280" />
            <Text style={styles.instructionText}>
              O token do dispositivo é usado para enviar notificações direcionadas e é renovado automaticamente.
            </Text>
          </View>

          <View style={styles.instructionItem}>
            <Icon name="bug-report" size={20} color="#6b7280" />
            <Text style={styles.instructionText}>
              Use o botão "Enviar Teste" para verificar se as notificações estão funcionando corretamente.
            </Text>
          </View>
        </View>
      </View>
    </ScrollView>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#f3f4f6',
  },
  content: {
    padding: 24,
  },
  title: {
    fontSize: 24,
    fontWeight: 'bold',
    marginBottom: 24,
    color: '#111827',
  },
  card: {
    backgroundColor: '#ffffff',
    borderRadius: 12,
    padding: 20,
    marginBottom: 16,
    shadowColor: '#000',
    shadowOffset: {
      width: 0,
      height: 1,
    },
    shadowOpacity: 0.1,
    shadowRadius: 2,
    elevation: 2,
  },
  cardTitle: {
    fontSize: 18,
    fontWeight: '600',
    marginBottom: 16,
    color: '#374151',
  },
  emailPrefRow: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
  },
  emailPrefTextWrap: {
    flex: 1,
    paddingRight: 12,
  },
  emailPrefLabel: {
    fontSize: 16,
    fontWeight: '500',
    color: '#111827',
    marginBottom: 4,
  },
  emailPrefDesc: {
    fontSize: 13,
    color: '#6b7280',
    lineHeight: 18,
  },
  statusRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 12,
  },
  statusLabel: {
    fontSize: 16,
    color: '#6b7280',
    flex: 1,
  },
  statusBadge: {
    paddingHorizontal: 12,
    paddingVertical: 4,
    borderRadius: 12,
  },
  statusText: {
    color: '#ffffff',
    fontSize: 14,
    fontWeight: '500',
  },
  statusValue: {
    fontSize: 16,
    color: '#111827',
    fontWeight: '500',
    textTransform: 'capitalize',
  },
  tokenContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#f9fafb',
    padding: 12,
    borderRadius: 8,
    borderWidth: 1,
    borderColor: '#e5e7eb',
  },
  tokenText: {
    flex: 1,
    fontSize: 12,
    color: '#6b7280',
    fontFamily: 'monospace',
  },
  copyButton: {
    marginLeft: 12,
    padding: 8,
  },
  actionButton: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    paddingVertical: 12,
    paddingHorizontal: 16,
    borderRadius: 8,
    marginBottom: 12,
    gap: 8,
  },
  primaryButton: {
    backgroundColor: '#4f46e5',
  },
  primaryButtonText: {
    color: '#ffffff',
    fontSize: 16,
    fontWeight: '600',
  },
  secondaryButton: {
    backgroundColor: '#ffffff',
    borderWidth: 1,
    borderColor: '#d1d5db',
  },
  secondaryButtonText: {
    color: '#4f46e5',
    fontSize: 16,
    fontWeight: '600',
  },
  dangerButton: {
    backgroundColor: '#ffffff',
    borderWidth: 1,
    borderColor: '#fecaca',
  },
  dangerButtonText: {
    color: '#ef4444',
    fontSize: 16,
    fontWeight: '600',
  },
  instructionItem: {
    flexDirection: 'row',
    alignItems: 'flex-start',
    marginBottom: 12,
    gap: 12,
  },
  instructionText: {
    flex: 1,
    fontSize: 14,
    color: '#6b7280',
    lineHeight: 20,
  },
});