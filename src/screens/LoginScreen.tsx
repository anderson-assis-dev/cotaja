import { useState, useEffect } from 'react';
import { View, Text, TextInput, TouchableOpacity, Image, ActivityIndicator, StyleSheet, KeyboardAvoidingView, ScrollView, TouchableWithoutFeedback, Keyboard, Platform } from 'react-native';
import { useNavigation } from '@react-navigation/native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { useAuth } from '../contexts/AuthContext';
import { useToast } from '../contexts/ToastContext';
import biometricService from '../services/biometricService';
import AsyncStorage from '@react-native-async-storage/async-storage';
import { ScanFace, Fingerprint } from 'lucide-react-native'

export default function LoginScreen() {
  const navigation = useNavigation<any>();
  const { login, isLoading, loginWithBiometric, hasBiometricCredentials } = useAuth();
  const { showError } = useToast();
  const insets = useSafeAreaInsets();
  const [email, setEmail] = useState('');
  const [senha, setSenha] = useState('');
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

  // Recheck when screen becomes visible
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

  const handleBiometricLogin = async () => {
    try {
      await loginWithBiometric();
    } catch (error: any) {
      showError('Falha na autenticação biométrica. Tente usar email e senha.');
    }
  };

  const handleLogin = async () => {
    if (!email || !senha) {
      showError('Por favor, preencha todos os campos');
      return;
    }

    try {
      await login(email, senha);
    } catch (error: any) {
      let errorMessage = 'Email ou senha inválidos';

      if (error.message) {
        errorMessage = error.message;
      }

      showError(errorMessage);
    }
  };

  const handleForgotPassword = () => {
    navigation.navigate('ForgotPassword');
  };

  const handleRegister = () => {
    navigation.navigate('Register');
  };

  return (
    <KeyboardAvoidingView
      style={[styles.container, { paddingTop: insets.top }]}
      behavior={Platform.OS === 'ios' ? 'padding' : undefined}
      keyboardVerticalOffset={Platform.OS === 'ios' ? 0 : 0}
    >
      <ScrollView
        contentContainerStyle={styles.scrollContent}
        keyboardShouldPersistTaps="handled"
        bounces={false}
        showsVerticalScrollIndicator={false}
      >
        <TouchableWithoutFeedback onPress={Keyboard.dismiss}>
          <View style={styles.content}>
            <Image
              source={require('../../assets/logo.png')}
              style={[styles.logo, { tintColor: 'white' }]}
              resizeMode="contain"
            />

          <View style={styles.formContainer}>
            <Text style={styles.title}>Bem-vindo de volta!</Text>

            <Text style={styles.label}>Email</Text>
            <TextInput
              style={styles.input}
              placeholder="Digite seu email"
              value={email}
              onChangeText={setEmail}
              keyboardType="email-address"
              autoCapitalize="none"
              editable={!isLoading}
              autoComplete="email"
            />

            <Text style={styles.label}>Senha</Text>
            <TextInput
              style={styles.input}
              placeholder="Digite sua senha"
              value={senha}
              onChangeText={setSenha}
              secureTextEntry
              editable={!isLoading}
              autoComplete="password"
            />

            <TouchableOpacity
              onPress={handleForgotPassword}
              style={styles.forgotPasswordButton}
              disabled={isLoading}
            >
              <Text style={styles.forgotPasswordText}>Esqueceu sua senha?</Text>
            </TouchableOpacity>

            <TouchableOpacity
              style={[styles.loginButton, isLoading ? styles.loginButtonDisabled : styles.loginButtonEnabled]}
              onPress={handleLogin}
              disabled={isLoading}
            >
              {isLoading ? (
                <View style={styles.loadingContainer}>
                  <ActivityIndicator color="white" size="small" />
                  <Text style={styles.loginButtonText}>Entrando...</Text>
                </View>
              ) : (
                <Text style={styles.loginButtonText}>Entrar</Text>
              )}
            </TouchableOpacity>

            {biometricActivated && (
              <>
                <View style={styles.dividerContainer}>
                  <View style={styles.dividerLine} />
                  <Text style={styles.dividerText}>ou</Text>
                  <View style={styles.dividerLine} />
                </View>

                <TouchableOpacity
                  style={[styles.biometricButton, isLoading && styles.biometricButtonDisabled]}
                  onPress={handleBiometricLogin}
                  disabled={isLoading}
                >
                  {biometricType === 'FaceID' ?
                    <View style={styles.biometricButtonView}>
                      <ScanFace size={40} color={'#4f46e5'} />
                      <Text style={styles.biometricButtonText}>Entrar com Face ID</Text>
                    </View> :
                  biometricType !== null ?
                  <View style={styles.biometricButtonView}>
                    <Fingerprint size={40} color={'#4f46e5'} />
                    <Text style={styles.biometricButtonText}>Entrar com Touch ID</Text>
                  </View> : null}
                </TouchableOpacity>
              </>
            )}

            <View style={styles.registerContainer}>
              <Text style={styles.registerText}>Não tem uma conta? </Text>
              <TouchableOpacity onPress={handleRegister} disabled={isLoading}>
                <Text style={styles.registerLink}>Cadastre-se</Text>
              </TouchableOpacity>
            </View>
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
    backgroundColor: '#6366f1', // indigo-500
  },
  scrollContent: {
    flexGrow: 1,
  },
  content: {
    flex: 1,
    alignItems: 'center',
    justifyContent: 'center',
    padding: 24,
  },
  logo: {
    width: 400,
    height: 128,
    shadowColor: '#000',
    shadowOffset: {
      width: -2,
      height: 4,
    },
    shadowOpacity: 0.7,
    shadowRadius: 4,
    elevation: 5,
    right: -28
  },
  formContainer: {
    backgroundColor: 'white',
    borderRadius: 12,
    width: '100%',
    padding: 24,
    shadowColor: '#000',
    shadowOffset: {
      width: 0,
      height: 4,
    },
    shadowOpacity: 0.25,
    shadowRadius: 6,
    elevation: 8,
  },
  title: {
    fontSize: 24,
    fontWeight: 'bold',
    textAlign: 'center',
    marginBottom: 24,
  },
  label: {
    fontSize: 18,
    fontWeight: '600',
    marginBottom: 8,
  },
  input: {
    borderWidth: 1,
    borderColor: '#d1d5db',
    borderRadius: 8,
    padding: 12,
    marginBottom: 16,
  },
  forgotPasswordButton: {
    marginBottom: 24,
  },
  forgotPasswordText: {
    color: '#4f46e5',
    textAlign: 'right',
  },
  loginButton: {
    borderRadius: 8,
    padding: 16,
    marginBottom: 16,
  },
  loginButtonEnabled: {
    backgroundColor: '#4f46e5',
  },
  loginButtonDisabled: {
    backgroundColor: '#9ca3af',
  },
  loginButtonText: {
    textAlign: 'center',
    color: 'white',
    fontWeight: 'bold',
    fontSize: 18,
  },
  loadingContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: 8,
  },
  registerContainer: {
    flexDirection: 'row',
    justifyContent: 'center',
  },
  registerText: {
    color: '#6b7280',
  },
  registerLink: {
    color: '#4f46e5',
    fontWeight: '600',
  },
  dividerContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    marginVertical: 16,
  },
  dividerLine: {
    flex: 1,
    height: 1,
    backgroundColor: '#d1d5db',
  },
  dividerText: {
    marginHorizontal: 16,
    color: '#6b7280',
    fontSize: 14,
  },
  biometricButton: {
    borderRadius: 8,
    width: 80,
    height: 80,
    alignItems: 'center',
    justifyContent: 'center',
    alignSelf: 'center',
  },
  biometricButtonView: {
    alignItems: 'center',
    justifyContent: 'center',
    flexDirection: 'column',
    marginBottom: 15
  },
  biometricButtonDisabled: {
    backgroundColor: '#9ca3af',
    borderColor: '#6b7280',
  },
  biometricButtonText: {
    textAlign: 'center',
    color: '#4f46e5',
    fontWeight: 'bold',
    fontSize: 10,
  },
});
