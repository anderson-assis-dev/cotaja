import React, { createContext, useContext, useState, useEffect, ReactNode } from 'react';
import { authService, User } from '../services/api';
import AsyncStorage from '@react-native-async-storage/async-storage';

interface AuthContextType {
  user: User | null;
  token: string | null;
  isLoading: boolean;
  login: (email: string, password: string) => Promise<boolean>;
  register: (name: string, email: string, phone: string, password: string, passwordConfirmation: string) => Promise<boolean>;
  logout: () => void;
  updateProfileType: (profileType: 'client' | 'provider') => Promise<boolean>;
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
  const [isLoading, setIsLoading] = useState(true);

  // Verificar se há token salvo ao inicializar
  useEffect(() => {
    const initializeAuth = async () => {
      try {
        console.log('🔐 Inicializando autenticação...');
        const savedToken = await AsyncStorage.getItem('auth_token');
        const savedUser = await AsyncStorage.getItem('user');

        console.log('Token salvo:', savedToken ? 'Sim' : 'Não');
        console.log('Usuário salvo:', savedUser ? 'Sim' : 'Não');

        if (savedToken && savedUser) {
          setToken(savedToken);
          setUser(JSON.parse(savedUser));
          
          // Verificar se o token ainda é válido
          try {
            console.log('🔍 Verificando validade do token...');
            const response = await authService.me();
            console.log('✅ Token válido, usuário:', response.data.user.name);
            setUser(response.data.user);
            await AsyncStorage.setItem('user', JSON.stringify(response.data.user));
          } catch (error: any) {
            console.log('❌ Token inválido, limpando dados...');
            // Token inválido, limpar dados
            await AsyncStorage.removeItem('auth_token');
            await AsyncStorage.removeItem('user');
            setToken(null);
            setUser(null);
          }
        } else {
          console.log('📱 Nenhum token encontrado, usuário não autenticado');
        }
      } catch (error) {
        console.error('❌ Erro ao inicializar autenticação:', error);
      } finally {
        setIsLoading(false);
        console.log('✅ Inicialização concluída');
      }
    };

    initializeAuth();
  }, []);

  const login = async (email: string, password: string): Promise<boolean> => {
    try {
      console.log('🔐 Tentando fazer login...', { email });
      setIsLoading(true);
      
      const response = await authService.login({ email, password });
      console.log('✅ Login bem-sucedido:', response.data.user.name);
      
      setUser(response.data.user);
      setToken(response.data.token);
      
      await AsyncStorage.setItem('auth_token', response.data.token);
      await AsyncStorage.setItem('user', JSON.stringify(response.data.user));
      
      return true;
    } catch (error: any) {
      console.error('❌ Erro no login:', error);
      
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

  const register = async (name: string, email: string, phone: string, password: string, passwordConfirmation: string): Promise<boolean> => {
    try {
      console.log('📝 Tentando registrar usuário...', { email });
      setIsLoading(true);
      
      const response = await authService.register({
        name,
        email,
        phone,
        password,
        password_confirmation: passwordConfirmation
      });
      
      console.log('✅ Registro bem-sucedido:', response.data.user.name);
      
      setUser(response.data.user);
      setToken(response.data.token);
      
      await AsyncStorage.setItem('auth_token', response.data.token);
      await AsyncStorage.setItem('user', JSON.stringify(response.data.user));
      
      return true;
    } catch (error: any) {
      console.error('❌ Erro no registro:', error);
      
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
    } finally {
      setIsLoading(false);
    }
  };

  const logout = async () => {
    try {
      console.log('🚪 Fazendo logout...');
      if (token) {
        await authService.logout();
      }
    } catch (error) {
      console.error('❌ Erro no logout:', error);
    } finally {
      console.log('✅ Logout concluído');
      setUser(null);
      setToken(null);
      await AsyncStorage.removeItem('auth_token');
      await AsyncStorage.removeItem('user');
    }
  };

  const updateProfileType = async (profileType: 'client' | 'provider'): Promise<boolean> => {
    try {
      console.log('🔄 Atualizando tipo de perfil...', { profileType });
      setIsLoading(true);
      
      const response = await authService.updateProfileType(profileType);
      console.log('✅ Tipo de perfil atualizado:', response.data.user.profile_type);
      
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

  const value: AuthContextType = {
    user,
    token,
    isLoading,
    login,
    register,
    logout,
    updateProfileType,
  };

  return (
    <AuthContext.Provider value={value}>
      {children}
    </AuthContext.Provider>
  );
}; 