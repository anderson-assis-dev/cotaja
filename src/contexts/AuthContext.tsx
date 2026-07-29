import React, { createContext, useContext, useState, useEffect, ReactNode } from 'react';
import { Platform, Alert } from 'react-native';
import { authService, User } from '../services/api';
import AsyncStorage from '@react-native-async-storage/async-storage';
import pushNotificationService from '../services/pushNotificationService';
import biometricService from '../services/biometricService';
import { globalToastRef } from './ToastContext';
import { consumePendingDeepLink } from '../navigation/deepLinkRouter';

interface AuthContextType {
  user: User | null;
  token: string | null;
  isLoading: boolean;
  isInitializing: boolean;
  login: (email: string, password: string) => Promise<boolean>;
  register: (name: string, email: string, phone: string, password: string, passwordConfirmation: string, profileType?: 'client' | 'provider', cpf?: string, motherName?: string, birthDate?: string, categories?: string[], address?: string, zipCode?: string, latitude?: number, longitude?: number, liveness?: { score: number; imageBase64: string | null }) => Promise<boolean>;
  logout: () => void;
  updateProfileType: (profileType: 'client' | 'provider', serviceCategories?: string[]) => Promise<boolean>;
  refreshUser: () => Promise<boolean>;
  loginWithBiometric: () => Promise<boolean>;
  isBiometricAvailable: () => Promise<boolean>;
  hasBiometricCredentials: () => Promise<boolean>;
  deleteAccount: () => Promise<boolean>;
  activateAccount: (email: string, code: string) => Promise<boolean>;
  submitLiveness: (score: number, imageBase64: string | null) => Promise<boolean>;
}

const AuthContext = createContext<AuthContextType | undefined>(undefined);

export const useAuth = () => {
  const context = useContext(AuthContext);
  if (context === undefined) {
    throw new Error('useAuth must be used within an AuthProvider');
  }
  return context;
};

interface AuthProviderProps {
  children: ReactNode;
}

export const AuthProvider: React.FC<AuthProviderProps> = ({ children }) => {
  const [user, setUser] = useState<User | null>(null);
  const [token, setToken] = useState<string | null>(null);
  const [isLoading, setIsLoading] = useState(false);
  const [isInitializing, setIsInitializing] = useState(true);

  useEffect(() => {
    const initializeAuth = async () => {
      try {
        const savedToken = await AsyncStorage.getItem('auth_token');
        const savedUser = await AsyncStorage.getItem('user');

        if (savedToken && savedUser) {
          setToken(savedToken);
          setUser(JSON.parse(savedUser));

          try {
            const response = await authService.me();
            setUser(response.data.user);
            await AsyncStorage.setItem('user', JSON.stringify(response.data.user));

            if (!pushNotificationService.isServiceInitialized()) {
              console.log('🔔 [INIT] Inicializando notificações push...');
              await pushNotificationService.initialize();
              console.log('✅ [INIT] Notificações push inicializadas');
            } else {
              console.log('ℹ️ [INIT] Notificações push já inicializadas');
            }

            console.log('🔄 [INIT] Atualizando FCM token no backend...');
            try {
              const storedToken = await AsyncStorage.getItem('device_token');
              if (storedToken) {
                await authService.saveFcmToken(storedToken, Platform.OS);
                console.log('✅ [INIT] FCM token atualizado no backend ao abrir app logado');
              } else {
                console.log('⚠️ [INIT] Nenhum FCM token disponível ao abrir app logado');
              }
            } catch (error) {
              console.error('❌ [INIT] Erro ao atualizar FCM token no backend:', error);
            }
          } catch (error: any) {
            await AsyncStorage.removeItem('auth_token');
            await AsyncStorage.removeItem('user');
            setToken(null);
            setUser(null);
          }
        } else {
        }
      } catch (error) {
        console.error('❌ Erro ao inicializar autenticação:', error);
      } finally {
        setIsInitializing(false);
      }
    };

    initializeAuth();
  }, []);

  // Após autenticar (e com o app já inicializado), continua o fluxo de qualquer
  // deep link que tenha chegado enquanto o usuário ainda não estava logado.
  useEffect(() => {
    if (!isInitializing && user) {
      consumePendingDeepLink();
    }
  }, [user, isInitializing]);

  const promptBiometricSetup = async (email: string, password: string) => {
    try {
      const biometricPreference = await biometricService.getBiometricPreference();

      if (biometricPreference !== null) {
        return;
      }

      const biometricSupported = await biometricService.isBiometricSupported();

      if (biometricSupported) {

        const biometricType = await biometricService.getBiometricType();
        const biometricName = biometricType === 'FaceID' ? 'Face ID' :
                             biometricType === 'TouchID' ? 'Touch ID' : 'biometria';

        Alert.alert(
          'Ativar Login por Biometria',
          `Deseja usar ${biometricName} para fazer login nas próximas vezes?`,
          [
            {
              text: 'Não',
              onPress: () => {
                (async () => {
                  await AsyncStorage.setItem('biometryactivated', 'false');
                })();
              },
              style: 'cancel'
            },
            {
              text: 'Sim',
              onPress: () => {
                (async () => {
                  try {
                    await AsyncStorage.setItem('biometric_email', email);
                    await AsyncStorage.setItem('biometric_password', password);
                    await AsyncStorage.setItem('biometryactivated', 'true');
                    globalToastRef.current?.showSuccess(`${biometricName} foi ativado!`);
                  } catch (err) {
                    console.error('❌ Error saving biometric data:', err);
                  }
                })();
              }
            }
          ]
        );
      } else {
        await biometricService.saveBiometricPreference(false);
        await AsyncStorage.setItem('biometryactivated', 'false');
      }
    } catch (error) {
      console.error('Error prompting biometric setup:', error);
      await biometricService.saveBiometricPreference(false);
      await AsyncStorage.setItem('biometryactivated', 'false');
    }
  };

  const login = async (email: string, password: string): Promise<boolean> => {
    try {
      setIsLoading(true);
      console.log('🔐 [LOGIN] Iniciando processo de login...');
      console.log('📱 [LOGIN] Push service inicializado?', pushNotificationService.isServiceInitialized());

      let fcm_token = null;
      let device_platform = null;

      try {
        const serviceToken = pushNotificationService.getDeviceToken();
        console.log('🔍 [LOGIN] Token do serviço:', serviceToken ? serviceToken.substring(0, 20) + '...' : 'null');

        const storedToken = await AsyncStorage.getItem('device_token');
        console.log('🔍 [LOGIN] Token do AsyncStorage:', storedToken ? storedToken.substring(0, 20) + '...' : 'null');

        fcm_token = serviceToken || storedToken;

        if (fcm_token) {
          device_platform = Platform.OS;
          console.log('✅ [LOGIN] FCM token encontrado:', fcm_token.substring(0, 20) + '...');
          console.log('📱 [LOGIN] Platform:', device_platform);
        } else {
          console.log('⚠️ [LOGIN] Nenhum FCM token disponível');
          console.log('⚠️ [LOGIN] Token será enviado quando disponível');
        }
      } catch (error) {
        console.log('❌ [LOGIN] Erro ao obter FCM token:', error);
      }

      const loginData: any = { email, password };
      if (fcm_token) {
        loginData.fcm_token = fcm_token;
        loginData.device_platform = device_platform;
        console.log('📤 [LOGIN] Enviando FCM token no payload de login');
      }

      console.log('🌐 [LOGIN] Fazendo requisição de login...');
      const response = await authService.login(loginData);
      console.log('✅ [LOGIN] Login bem-sucedido!');

      setUser(response.data.user);
      setToken(response.data.token);

      console.log('💾 [LOGIN] Salvando auth_token e user no AsyncStorage...');
      await AsyncStorage.setItem('auth_token', response.data.token);
      await AsyncStorage.setItem('user', JSON.stringify(response.data.user));
      console.log('✅ [LOGIN] Dados salvos no AsyncStorage');

      if (!pushNotificationService.isServiceInitialized()) {
        console.log('🔔 [LOGIN] Inicializando notificações push...');
        await pushNotificationService.initialize();
        console.log('✅ [LOGIN] Notificações push inicializadas');
      } else {
        console.log('ℹ️ [LOGIN] Notificações push já inicializadas, pulando...');
      }

      if (!fcm_token) {
        console.log('⚠️ [LOGIN] Token não foi enviado no payload de login, será enviado quando disponível');
      } else {
        console.log('✅ [LOGIN] Token FCM foi enviado no payload de login');
      }

      await promptBiometricSetup(email, password);

      return true;
    } catch (error: any) {
      console.error('❌ Erro no login:', error);

      if (error.response?.data?.requiresActivation) {
        const activationError: any = new Error(error.response.data.message);
        activationError.requiresActivation = true;
        activationError.email = error.response.data.email;
        throw activationError;
      }

      let errorMessage = 'Erro ao fazer login';

      if (error.response?.data?.message) {
        errorMessage = error.response.data.message;
      } else if (error.message) {
        errorMessage = error.message;
      } else if (error.code === 'ECONNREFUSED') {
        errorMessage = 'Servidor não está acessível. Verifique se o backend está rodando.';
      } else if (error.code === 'NETWORK_ERROR') {
        errorMessage = 'Erro de conexão. Verifique sua internet.';
      } else if (error.code === 'TIMEOUT') {
        errorMessage = 'Timeout na requisição. Tente novamente.';
      }

      throw new Error(errorMessage);
    } finally {
      setIsLoading(false);
    }
  };

  const register = async (name: string, email: string, phone: string, password: string, passwordConfirmation: string, profileType?: 'client' | 'provider', cpf?: string, motherName?: string, birthDate?: string, categories?: string[], address?: string, zipCode?: string, latitude?: number, longitude?: number, liveness?: { score: number; imageBase64: string | null }): Promise<boolean> => {
    try {
      let fcm_token = null;
      let device_platform = null;

      try {
        const serviceToken = pushNotificationService.getDeviceToken();
        const storedToken = await AsyncStorage.getItem('device_token');
        fcm_token = serviceToken || storedToken;
        if (fcm_token) {
          device_platform = Platform.OS;
        }
      } catch {}

      const registerData: any = {
        name,
        email,
        phone,
        password,
        password_confirmation: passwordConfirmation
      };

      if (profileType) {
        registerData.profile_type = profileType;
      }

      if (cpf) {
        registerData.cpf = cpf;
      }

      if (profileType === 'provider') {
        if (motherName) registerData.mother_name = motherName;
        if (birthDate) registerData.birth_date = birthDate;
        if (categories && categories.length > 0) registerData.service_categories = categories;
        if (address) registerData.address = address;
        if (zipCode) registerData.zip_code = zipCode;
        if (latitude != null) registerData.latitude = latitude;
        if (longitude != null) registerData.longitude = longitude;
      }

      if (fcm_token) {
        registerData.fcm_token = fcm_token;
        registerData.device_platform = device_platform;
      }

      if (liveness) {
        registerData.liveness_verified = 1;
        registerData.liveness_score = liveness.score;
        if (liveness.imageBase64) {
          registerData.liveness_image_base64 = liveness.imageBase64;
        }
      }

      const response = await authService.register(registerData);

      return true;
    } catch (error: any) {
      let errorMessage = 'Erro ao fazer registro';

      if (error.response?.data?.message) {
        errorMessage = error.response.data.message;
      } else if (error.message) {
        errorMessage = error.message;
      } else if (error.code === 'ECONNREFUSED') {
        errorMessage = 'Servidor não está acessível. Verifique se o backend está rodando.';
      } else if (error.code === 'NETWORK_ERROR') {
        errorMessage = 'Erro de conexão. Verifique sua internet.';
      } else if (error.code === 'TIMEOUT') {
        errorMessage = 'Timeout na requisição. Tente novamente.';
      }

      throw new Error(errorMessage);
    }
  };

  const logout = async () => {
    try {
      if (token) {
        await authService.logout();
      }
    } catch (error) {
      console.error('❌ Erro no logout:', error);
    } finally {
      setUser(null);
      setToken(null);
      await AsyncStorage.removeItem('auth_token');
      await AsyncStorage.removeItem('user');

      await pushNotificationService.clearToken();

    }
  };

  const updateProfileType = async (profileType: 'client' | 'provider', serviceCategories?: string[]): Promise<boolean> => {
    try {
      setIsLoading(true);

      const response = await authService.updateProfileType(profileType, serviceCategories);

      setUser(response.data.user);
      await AsyncStorage.setItem('user', JSON.stringify(response.data.user));

      return true;
    } catch (error: any) {
      console.error('❌ Erro ao atualizar tipo de perfil:', error);

      let errorMessage = 'Erro ao atualizar tipo de perfil';

      if (error.response?.data?.message) {
        errorMessage = error.response.data.message;
      } else if (error.message) {
        errorMessage = error.message;
      }

      throw new Error(errorMessage);
    } finally {
      setIsLoading(false);
    }
  };

  const refreshUser = async (): Promise<boolean> => {
    try {
      const response = await authService.me();

      setUser(response.data.user);
      await AsyncStorage.setItem('user', JSON.stringify(response.data.user));

      return true;
    } catch (error: any) {
      console.error('❌ Erro ao atualizar dados do usuário:', error);
      throw error;
    }
  };

  const loginWithBiometric = async (): Promise<boolean> => {
    try {
      setIsLoading(true);

      const biometricSupported = await biometricService.isBiometricSupported();
      if (!biometricSupported) {
        globalToastRef.current?.showError('Biometria não está disponível neste dispositivo');
        return false;
      }

      let savedEmail, savedPassword, biometryActivated;
      try {
        savedEmail = await AsyncStorage.getItem('biometric_email');
        savedPassword = await AsyncStorage.getItem('biometric_password');
        biometryActivated = await AsyncStorage.getItem('biometryactivated');
      } catch (storageError) {
        globalToastRef.current?.showError('Erro ao acessar dados salvos. Tente novamente.');
        return false;
      }

      if (!savedEmail || !savedPassword || biometryActivated !== 'true') {
        globalToastRef.current?.showError('Credenciais biométricas não encontradas ou biometria não está ativada');
        return false;
      }

      const biometricResult = await biometricService.authenticateWithBiometric();

      if (biometricResult.success) {
        console.log('🔐 [BIOMETRIC] Autenticação biométrica bem-sucedida, fazendo login...');

        let fcm_token = null;
        let device_platform = null;

        try {
          const serviceToken = pushNotificationService.getDeviceToken();
          console.log('🔍 [BIOMETRIC] Token do serviço:', serviceToken ? serviceToken.substring(0, 20) + '...' : 'null');

          const storedToken = await AsyncStorage.getItem('device_token');
          console.log('🔍 [BIOMETRIC] Token do AsyncStorage:', storedToken ? storedToken.substring(0, 20) + '...' : 'null');

          fcm_token = serviceToken || storedToken;

          if (fcm_token) {
            device_platform = Platform.OS;
            console.log('✅ [BIOMETRIC] FCM token encontrado:', fcm_token.substring(0, 20) + '...');
            console.log('📱 [BIOMETRIC] Platform:', device_platform);
          } else {
            console.log('⚠️ [BIOMETRIC] Nenhum FCM token disponível');
          }
        } catch (error) {
          console.log('❌ [BIOMETRIC] Erro ao obter FCM token:', error);
        }

        const loginData: any = {
          email: savedEmail,
          password: savedPassword
        };

        if (fcm_token) {
          loginData.fcm_token = fcm_token;
          loginData.device_platform = device_platform;
          console.log('📤 [BIOMETRIC] Enviando FCM token no payload de login');
        }

        const response = await authService.login(loginData);

        setUser(response.data.user);
        setToken(response.data.token);

        await AsyncStorage.setItem('auth_token', response.data.token);
        await AsyncStorage.setItem('user', JSON.stringify(response.data.user));

        if (!pushNotificationService.isServiceInitialized()) {
          console.log('🔔 [BIOMETRIC] Inicializando notificações push...');
          await pushNotificationService.initialize();
          console.log('✅ [BIOMETRIC] Notificações push inicializadas');
        } else {
          console.log('ℹ️ [BIOMETRIC] Notificações push já inicializadas');
        }

        if (fcm_token) {
          console.log('✅ [BIOMETRIC] Token FCM enviado no payload de login');
        }

        return true;
      } else {
        console.log('Erro: Autenticação biométrica cancelada ou falhou');
        return false;
      }
    } catch (error: any) {
      console.error('❌ Erro no login biométrico:', error);

      let errorMessage = 'Falha na autenticação biométrica';
      if (error.message) {
        if (error.message.includes('BiometryNotAvailable')) {
          errorMessage = 'Biometria não está disponível';
        } else if (error.message.includes('BiometryNotEnrolled')) {
          errorMessage = 'Nenhuma biometria está cadastrada no dispositivo';
        } else if (error.message.includes('UserCancel')) {
          errorMessage = 'Autenticação cancelada pelo usuário';
        } else {
          errorMessage = error.message;
        }
      }

      console.log('Erro:', errorMessage);
      return false;
    } finally {
      setIsLoading(false);
    }
  };

  const deleteAccount = async (): Promise<boolean> => {
    try {
      setIsLoading(true);
      await authService.deleteAccount();
      setUser(null);
      setToken(null);
      await AsyncStorage.removeItem('auth_token');
      await AsyncStorage.removeItem('user');
      await pushNotificationService.clearToken();
      return true;
    } catch (error: any) {
      const errorMessage = error.response?.data?.message || error.message || 'Erro ao excluir conta';
      throw new Error(errorMessage);
    } finally {
      setIsLoading(false);
    }
  };

  const activateAccount = async (email: string, code: string): Promise<boolean> => {
    try {
      setIsLoading(true);
      const response = await authService.verifyActivation(email, code);

      setUser(response.data.user);
      setToken(response.data.token);
      await AsyncStorage.setItem('auth_token', response.data.token);
      await AsyncStorage.setItem('user', JSON.stringify(response.data.user));

      if (!pushNotificationService.isServiceInitialized()) {
        await pushNotificationService.initialize();
      }

      return true;
    } catch (error: any) {
      const errorMessage = error.response?.data?.message || error.message || 'Código inválido.';
      throw new Error(errorMessage);
    } finally {
      setIsLoading(false);
    }
  };

  const submitLiveness = async (score: number, imageBase64: string | null): Promise<boolean> => {
    try {
      const response = await authService.submitLiveness({
        liveness_score: score,
        liveness_image_base64: imageBase64 || undefined,
      });
      setUser(response.data.user);
      await AsyncStorage.setItem('user', JSON.stringify(response.data.user));
      return true;
    } catch (error: any) {
      console.error('❌ Erro ao enviar liveness:', error);
      return false;
    }
  };

  const isBiometricAvailable = async (): Promise<boolean> => {
    return await biometricService.isBiometricSupported();
  };

  const hasBiometricCredentials = async (): Promise<boolean> => {
    try {
      const biometryActivated = await AsyncStorage.getItem('biometryactivated');
      const savedEmail = await AsyncStorage.getItem('biometric_email');
      const savedPassword = await AsyncStorage.getItem('biometric_password');

      return biometryActivated === 'true' && savedEmail !== null && savedPassword !== null;
    } catch (error) {
      return false;
    }
  };

  const value: AuthContextType = {
    user,
    token,
    isLoading,
    isInitializing,
    login,
    register,
    logout,
    updateProfileType,
    refreshUser,
    loginWithBiometric,
    isBiometricAvailable,
    hasBiometricCredentials,
    deleteAccount,
    activateAccount,
    submitLiveness,
  };

  return (
    <AuthContext.Provider value={value}>
      {children}
    </AuthContext.Provider>
  );
};