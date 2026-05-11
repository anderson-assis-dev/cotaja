import { useState, useEffect } from 'react';
import { View, Text, TextInput, TouchableOpacity, ActivityIndicator, StyleSheet, KeyboardAvoidingView, ScrollView, TouchableWithoutFeedback, Keyboard, Platform, Image } from 'react-native';
import { useNavigation } from '@react-navigation/native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { useAuth } from '../contexts/AuthContext';
import { useToast } from '../contexts/ToastContext';
import biometricService from '../services/biometricService';
import AsyncStorage from '@react-native-async-storage/async-storage';
import { ScanFace, Fingerprint } from 'lucide-react-native';
import Icon from 'react-native-vector-icons/MaterialIcons';

export default function LoginScreen() {
  const navigation = useNavigation<any>();
  const { login, isLoading, loginWithBiometric } = useAuth();
  const { showError } = useToast();
  const insets = useSafeAreaInsets();
  const [email, setEmail] = useState('');
  const [senha, setSenha] = useState('');
  const [showSenha, setShowSenha] = useState(false);
  const [biometricActivated, setBiometricActivated] = useState(false);
  const [biometricType, setBiometricType] = useState<'Fingerprint' | 'FaceID' | null>(null);

  useEffect(() => {
    const checkBiometricStatus = async () => {
      try {
        const isSupported = await biometricService.isBiometricSupported();
        if (isSupported) {
          const type = await biometricService.getBiometricType();
          setBiometricType(type == 'FaceID' ? 'FaceID' : 'Fingerprint');
        } else {
          setBiometricType(null);
        }
        const activated = await AsyncStorage.getItem('biometryactivated');
        setBiometricActivated(activated === 'true');
      } catch (error) {
        console.error('Error checking biometric status:', error);
      }
    };
    checkBiometricStatus();
  }, []);

  useEffect(() => {
    const recheckBiometric = async () => {
      try {
        const activated = await AsyncStorage.getItem('biometryactivated');
        setBiometricActivated(activated === 'true');
      } catch (error) {
        console.error('Error re-checking biometric status:', error);
      }
    };
    const unsubscribe = navigation.addListener('focus', recheckBiometric);
    return unsubscribe;
  }, [navigation]);

  const handleLogin = async () => {
    if (!email || !senha) {
      showError('Por favor, preencha todos os campos');
      return;
    }
    try {
      await login(email, senha);
    } catch (error: any) {
      if (error.requiresActivation) {
        navigation.navigate('EmailVerification', { email: error.email || email });
        return;
      }
      showError(error.message || 'Email ou senha inválidos');
    }
  };

  return (
    <KeyboardAvoidingView
      style={styles.container}
      behavior={Platform.OS === 'ios' ? 'padding' : undefined}
      keyboardVerticalOffset={0}
    >
      <View style={styles.bottomBackground} />
      <ScrollView
        contentContainerStyle={styles.scrollContent}
        keyboardShouldPersistTaps="handled"
        bounces={false}
        showsVerticalScrollIndicator={false}
      >
        <TouchableWithoutFeedback onPress={Keyboard.dismiss}>
          <View style={styles.outer}>
            <View style={[styles.header, { paddingTop: insets.top + 20 }]}>
              <View style={styles.circle1} />
              <View style={styles.circle2} />
              <View style={styles.circle3} />
              <Image source={require('../../assets/logo.PNG')} style={styles.logo} resizeMode="contain" />
              <Text style={styles.headerTagline}>Marketplace de Serviços</Text>
            </View>

            <View style={styles.content}>
              <Text style={styles.title}>Bem-vindo de volta</Text>
              <Text style={styles.subtitle}>Entre com sua conta para continuar</Text>

              <View style={styles.form}>
                <Text style={styles.label}>Email</Text>
                <View style={styles.inputRow}>
                  <Icon name="mail-outline" size={20} color="#9ca3af" />
                  <TextInput
                    style={styles.input}
                    placeholder="Digite seu email"
                    placeholderTextColor="#9ca3af"
                    value={email}
                    onChangeText={setEmail}
                    keyboardType="email-address"
                    autoCapitalize="none"
                    editable={!isLoading}
                    autoComplete="email"
                  />
                </View>

                <Text style={styles.label}>Senha</Text>
                <View style={styles.inputRow}>
                  <Icon name="lock-outline" size={20} color="#9ca3af" />
                  <TextInput
                    style={styles.input}
                    placeholder="Digite sua senha"
                    placeholderTextColor="#9ca3af"
                    value={senha}
                    onChangeText={setSenha}
                    secureTextEntry={!showSenha}
                    editable={!isLoading}
                    autoComplete="password"
                  />
                  <TouchableOpacity onPress={() => setShowSenha(v => !v)} disabled={isLoading} style={styles.eyeButton}>
                    <Icon name={showSenha ? 'visibility' : 'visibility-off'} size={22} color="#9ca3af" />
                  </TouchableOpacity>
                </View>

                <TouchableOpacity
                  onPress={() => navigation.navigate('ForgotPassword')}
                  style={styles.forgotPasswordButton}
                  disabled={isLoading}
                >
                  <Text style={styles.forgotPasswordText}>Esqueceu sua senha?</Text>
                </TouchableOpacity>

                <TouchableOpacity
                  style={[styles.primaryButton, isLoading && styles.primaryButtonDisabled]}
                  onPress={handleLogin}
                  disabled={isLoading}
                >
                  {isLoading ? (
                    <View style={styles.loadingContainer}>
                      <ActivityIndicator color="#ffffff" size="small" />
                      <Text style={styles.primaryButtonText}>Entrando...</Text>
                    </View>
                  ) : (
                    <Text style={styles.primaryButtonText}>Entrar</Text>
                  )}
                </TouchableOpacity>

                {biometricActivated && biometricType !== null ? (
                  <>
                    <View style={styles.dividerContainer}>
                      <View style={styles.dividerLine} />
                      <Text style={styles.dividerText}>ou</Text>
                      <View style={styles.dividerLine} />
                    </View>
                    <TouchableOpacity
                      style={[styles.biometricButton, isLoading && styles.biometricButtonDisabled]}
                      onPress={() => loginWithBiometric()}
                      disabled={isLoading}
                    >
                      {biometricType === 'FaceID'
                        ? <ScanFace size={22} color="#4f46e5" />
                        : <Fingerprint size={22} color="#4f46e5" />}
                      <Text style={styles.biometricButtonText}>
                        {biometricType === 'FaceID' ? 'Entrar com Face ID' : 'Entrar com Touch ID'}
                      </Text>
                    </TouchableOpacity>
                  </>
                ) : null}

                <View style={styles.registerContainer}>
                  <Text style={styles.registerText}>Não tem uma conta? </Text>
                  <TouchableOpacity onPress={() => navigation.navigate('Register')} disabled={isLoading}>
                    <Text style={styles.registerLink}>Cadastre-se</Text>
                  </TouchableOpacity>
                </View>
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
  bottomBackground: {
    position: 'absolute',
    bottom: 0,
    left: 0,
    right: 0,
    height: '60%',
    backgroundColor: '#ffffff',
  },
  scrollContent: {
    flexGrow: 1,
  },
  outer: {
    flex: 1,
  },
  header: {
    paddingHorizontal: 24,
    paddingBottom: 44,
    alignItems: 'center',
    overflow: 'hidden',
    position: 'relative',
  },
  circle1: {
    position: 'absolute',
    width: 240,
    height: 240,
    borderRadius: 120,
    backgroundColor: 'rgba(255,255,255,0.07)',
    top: -70,
    right: -70,
  },
  circle2: {
    position: 'absolute',
    width: 160,
    height: 160,
    borderRadius: 80,
    backgroundColor: 'rgba(255,255,255,0.05)',
    bottom: 0,
    left: -55,
  },
  circle3: {
    position: 'absolute',
    width: 90,
    height: 90,
    borderRadius: 45,
    backgroundColor: 'rgba(255,255,255,0.08)',
    top: 24,
    left: 24,
  },
  logo: {
    width: 240,
    height: 80,
    tintColor: '#ffffff',
    marginBottom: 6,
  },
  headerTagline: {
    color: 'rgba(255,255,255,0.65)',
    fontSize: 13,
    fontWeight: '500',
    letterSpacing: 0.3,
  },
  content: {
    flex: 1,
    backgroundColor: '#ffffff',
    borderTopLeftRadius: 28,
    borderTopRightRadius: 28,
    paddingHorizontal: 24,
    paddingTop: 30,
  },
  title: {
    fontSize: 28,
    fontWeight: '800',
    color: '#111827',
    letterSpacing: -0.5,
  },
  subtitle: {
    color: '#6b7280',
    fontSize: 15,
    marginTop: 6,
    marginBottom: 28,
  },
  form: {},
  label: {
    fontSize: 13,
    fontWeight: '700',
    color: '#374151',
    marginBottom: 8,
  },
  inputRow: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#f3f4f6',
    borderRadius: 14,
    paddingHorizontal: 14,
    paddingVertical: 13,
    marginBottom: 16,
  },
  input: {
    flex: 1,
    marginLeft: 10,
    fontSize: 15,
    color: '#111827',
    paddingVertical: 0,
  },
  eyeButton: {
    paddingLeft: 10,
  },
  forgotPasswordButton: {
    marginBottom: 22,
    marginTop: -4,
  },
  forgotPasswordText: {
    color: '#4f46e5',
    textAlign: 'right',
    fontWeight: '700',
    fontSize: 13,
  },
  primaryButton: {
    borderRadius: 14,
    paddingVertical: 15,
    backgroundColor: '#4f46e5',
    shadowColor: '#4f46e5',
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.3,
    shadowRadius: 8,
    elevation: 4,
  },
  primaryButtonDisabled: {
    backgroundColor: '#9ca3af',
    shadowOpacity: 0,
    elevation: 0,
  },
  primaryButtonText: {
    textAlign: 'center',
    color: '#ffffff',
    fontWeight: '800',
    fontSize: 16,
    letterSpacing: 0.2,
  },
  loadingContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: 8,
  },
  dividerContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    marginVertical: 18,
  },
  dividerLine: {
    flex: 1,
    height: 1,
    backgroundColor: '#e5e7eb',
  },
  dividerText: {
    marginHorizontal: 14,
    color: '#9ca3af',
    fontSize: 13,
  },
  biometricButton: {
    borderRadius: 14,
    borderWidth: 1.5,
    borderColor: '#e5e7eb',
    backgroundColor: '#ffffff',
    paddingVertical: 13,
    paddingHorizontal: 12,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: 10,
  },
  biometricButtonDisabled: {
    opacity: 0.5,
  },
  biometricButtonText: {
    color: '#4f46e5',
    fontWeight: '700',
    fontSize: 15,
  },
  registerContainer: {
    flexDirection: 'row',
    justifyContent: 'center',
    marginTop: 20,
  },
  registerText: {
    color: '#6b7280',
    fontSize: 14,
  },
  registerLink: {
    color: '#4f46e5',
    fontWeight: '700',
    fontSize: 14,
  },
});
