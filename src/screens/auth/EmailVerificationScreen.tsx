import { useState, useRef, useEffect } from 'react';
import {
  View, Text, TextInput, TouchableOpacity, ActivityIndicator,
  StyleSheet, KeyboardAvoidingView, ScrollView, TouchableWithoutFeedback,
  Keyboard, Platform, Image
} from 'react-native';
import { useNavigation, useRoute } from '@react-navigation/native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { useAuth } from '../../contexts/AuthContext';
import { useToast } from '../../contexts/ToastContext';
import { authService } from '../../services/api';
import Icon from 'react-native-vector-icons/MaterialIcons';

const CODE_LENGTH = 6;
const RESEND_COOLDOWN = 60;

export default function EmailVerificationScreen() {
  const navigation = useNavigation<any>();
  const route = useRoute<any>();
  const { activateAccount, isLoading } = useAuth();
  const { showError, showSuccess } = useToast();
  const insets = useSafeAreaInsets();

  const email: string = route.params?.email ?? '';

  const [code, setCode] = useState('');
  const [resendCooldown, setResendCooldown] = useState(0);
  const [isSending, setIsSending] = useState(false);
  const inputRef = useRef<TextInput>(null);
  const cooldownRef = useRef<ReturnType<typeof setInterval> | null>(null);

  useEffect(() => {
    // Envia o código automaticamente ao abrir a tela
    authService.resendActivation(email).then(() => {
      startCooldown();
    }).catch(() => {
      // silencioso — usuário pode reenviar manualmente
    });

    return () => {
      if (cooldownRef.current) clearInterval(cooldownRef.current);
    };
  }, []);

  const startCooldown = () => {
    setResendCooldown(RESEND_COOLDOWN);
    cooldownRef.current = setInterval(() => {
      setResendCooldown(prev => {
        if (prev <= 1) {
          clearInterval(cooldownRef.current!);
          return 0;
        }
        return prev - 1;
      });
    }, 1000);
  };

  const handleResend = async () => {
    if (resendCooldown > 0 || isSending) return;
    try {
      setIsSending(true);
      await authService.resendActivation(email);
      showSuccess('Código reenviado! Verifique seu email.');
      startCooldown();
    } catch (error: any) {
      showError(error.response?.data?.message || 'Erro ao reenviar código.');
    } finally {
      setIsSending(false);
    }
  };

  const handleVerify = async () => {
    if (code.length !== CODE_LENGTH) {
      showError('Digite o código de 6 dígitos.');
      return;
    }
    try {
      await activateAccount(email, code);
      // AuthContext define o user, AppNavigator redireciona automaticamente
    } catch (error: any) {
      showError(error.message || 'Código inválido.');
    }
  };

  const handleCodeChange = (text: string) => {
    const numeric = text.replace(/\D/g, '').slice(0, CODE_LENGTH);
    setCode(numeric);
  };

  const maskedEmail = email
    ? email.replace(/(.{2})(.*)(@.*)/, (_, a, b, c) => a + '*'.repeat(Math.max(b.length, 3)) + c)
    : '';

  return (
    <KeyboardAvoidingView
      style={styles.container}
      behavior={Platform.OS === 'ios' ? 'padding' : undefined}
    >
      <ScrollView
        contentContainerStyle={styles.scrollContent}
        keyboardShouldPersistTaps="handled"
        bounces={false}
        showsVerticalScrollIndicator={false}
      >
        <TouchableWithoutFeedback onPress={Keyboard.dismiss}>
          <View style={styles.outer}>
            <View style={[styles.header, { paddingTop: insets.top }]}>
              <TouchableOpacity onPress={() => navigation.goBack()} style={styles.backButton}>
                <Icon name="arrow-back" size={24} color="#ffffff" />
              </TouchableOpacity>
              <Image source={require('../../../assets/logo.png')} style={styles.logo} resizeMode="contain" />
              <View style={styles.backButtonPlaceholder} />
            </View>

            <View style={styles.content}>
              <View style={styles.headerContent}>
                <Text style={styles.title}>Verifique seu email</Text>
                <Text style={styles.subtitle}>
                  Enviamos um código de ativação para{'\n'}
                  <Text style={styles.emailHighlight}>{maskedEmail}</Text>
                </Text>
              </View>

              <View style={styles.card}>
                <View style={styles.iconContainer}>
                  <Icon name="mark-email-unread" size={40} color="#4f46e5" />
                </View>

                <Text style={styles.label}>Código de ativação</Text>
                <TouchableOpacity
                  activeOpacity={1}
                  onPress={() => inputRef.current?.focus()}
                  style={styles.codeRow}
                >
                  {Array.from({ length: CODE_LENGTH }).map((_, i) => (
                    <View
                      key={i}
                      style={[
                        styles.codeBox,
                        code.length === i && styles.codeBoxActive,
                        code.length > i && styles.codeBoxFilled,
                      ]}
                    >
                      <Text style={styles.codeChar}>{code[i] ?? ''}</Text>
                    </View>
                  ))}
                </TouchableOpacity>
                <TextInput
                  ref={inputRef}
                  value={code}
                  onChangeText={handleCodeChange}
                  keyboardType="number-pad"
                  maxLength={CODE_LENGTH}
                  style={styles.hiddenInput}
                  caretHidden
                  autoFocus
                />

                <TouchableOpacity
                  style={[styles.primaryButton, (isLoading || code.length !== CODE_LENGTH) && styles.primaryButtonDisabled]}
                  onPress={handleVerify}
                  disabled={isLoading || code.length !== CODE_LENGTH}
                >
                  {isLoading ? (
                    <View style={styles.loadingContainer}>
                      <ActivityIndicator color="#ffffff" size="small" />
                      <Text style={styles.primaryButtonText}>Verificando...</Text>
                    </View>
                  ) : (
                    <Text style={styles.primaryButtonText}>Ativar conta</Text>
                  )}
                </TouchableOpacity>

                <View style={styles.resendContainer}>
                  <Text style={styles.resendText}>Não recebeu o código? </Text>
                  <TouchableOpacity onPress={handleResend} disabled={resendCooldown > 0 || isSending}>
                    <Text style={[styles.resendLink, resendCooldown > 0 && styles.resendLinkDisabled]}>
                      {resendCooldown > 0 ? `Reenviar em ${resendCooldown}s` : 'Reenviar'}
                    </Text>
                  </TouchableOpacity>
                </View>

                <TouchableOpacity onPress={() => navigation.goBack()} style={styles.backToLoginButton}>
                  <Icon name="arrow-back" size={16} color="#6b7280" />
                  <Text style={styles.backToLoginText}>Voltar ao login</Text>
                </TouchableOpacity>
              </View>
              <View style={{ height: insets.bottom + 24 }} />
            </View>
          </View>
        </TouchableWithoutFeedback>
      </ScrollView>
    </KeyboardAvoidingView>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#4f46e5',
  },
  scrollContent: {
    flexGrow: 1,
  },
  outer: {
    flex: 1,
  },
  header: {
    paddingHorizontal: 16,
    paddingBottom: 26,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
  },
  backButton: {
    padding: 8,
    width: 40,
  },
  backButtonPlaceholder: {
    width: 40,
  },
  logo: {
    width: 200,
    height: 70,
    tintColor: '#ffffff',
  },
  content: {
    flex: 1,
    backgroundColor: '#f3f4f6',
    borderTopLeftRadius: 24,
    borderTopRightRadius: 24,
    padding: 20,
  },
  headerContent: {
    alignItems: 'flex-start',
    marginBottom: 16,
  },
  title: {
    fontSize: 22,
    fontWeight: '800',
    color: '#111827',
  },
  subtitle: {
    color: '#6b7280',
    marginTop: 6,
    fontSize: 14,
    lineHeight: 20,
  },
  emailHighlight: {
    color: '#4f46e5',
    fontWeight: '600',
  },
  card: {
    backgroundColor: '#ffffff',
    borderRadius: 16,
    padding: 20,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.08,
    shadowRadius: 6,
    elevation: 3,
  },
  iconContainer: {
    alignItems: 'center',
    marginBottom: 20,
  },
  label: {
    fontSize: 14,
    fontWeight: '700',
    color: '#374151',
    marginBottom: 12,
  },
  codeRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    marginBottom: 24,
    gap: 8,
  },
  codeBox: {
    flex: 1,
    aspectRatio: 0.85,
    borderWidth: 2,
    borderColor: '#e5e7eb',
    borderRadius: 12,
    alignItems: 'center',
    justifyContent: 'center',
    backgroundColor: '#f9fafb',
  },
  codeBoxActive: {
    borderColor: '#4f46e5',
    backgroundColor: '#ede9fe',
  },
  codeBoxFilled: {
    borderColor: '#4f46e5',
    backgroundColor: '#ffffff',
  },
  codeChar: {
    fontSize: 22,
    fontWeight: '800',
    color: '#111827',
  },
  hiddenInput: {
    position: 'absolute',
    opacity: 0,
    width: 1,
    height: 1,
  },
  primaryButton: {
    borderRadius: 12,
    paddingVertical: 14,
    backgroundColor: '#4f46e5',
    marginBottom: 16,
  },
  primaryButtonDisabled: {
    backgroundColor: '#9ca3af',
  },
  primaryButtonText: {
    textAlign: 'center',
    color: '#ffffff',
    fontWeight: '800',
    fontSize: 16,
  },
  loadingContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: 8,
  },
  resendContainer: {
    flexDirection: 'row',
    justifyContent: 'center',
    marginBottom: 16,
  },
  resendText: {
    color: '#6b7280',
    fontSize: 14,
  },
  resendLink: {
    color: '#4f46e5',
    fontWeight: '700',
    fontSize: 14,
  },
  resendLinkDisabled: {
    color: '#9ca3af',
  },
  backToLoginButton: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: 4,
    paddingTop: 4,
  },
  backToLoginText: {
    color: '#6b7280',
    fontSize: 14,
  },
});
