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
        const savedToken = await AsyncStorage.getItem('auth_token');
        const savedUser = await AsyncStorage.getItem('user');

        if (savedToken && savedUser) {
          setToken(savedToken);
          setUser(JSON.parse(savedUser));
          
          // Verificar se o token ainda é válido
          try {
            const response = await authService.me();
            setUser(response.data.user);
            await AsyncStorage.setItem('user', JSON.stringify(response.data.user));
          } catch (error) {
            // Token inválido, limpar dados
            await AsyncStorage.removeItem('auth_token');
            await AsyncStorage.removeItem('user');
            setToken(null);
            setUser(null);
          }
        }
      } catch (error) {
        console.error('Erro ao inicializar autenticação:', error);
      } finally {
        setIsLoading(false);
      }
    };

    initializeAuth();
  }, []);

  const login = async (email: string, password: string): Promise<boolean> => {
    try {
      setIsLoading(true);
      const response = await authService.login({ email, password });
      
      setUser(response.data.user);
      setToken(response.data.token);
      
      await AsyncStorage.setItem('auth_token', response.data.token);
      await AsyncStorage.setItem('user', JSON.stringify(response.data.user));
      
      return true;
    } catch (error: any) {
      console.error('Erro no login:', error);
      throw new Error(error.response?.data?.message || 'Erro ao fazer login');
    } finally {
      setIsLoading(false);
    }
  };

  const register = async (name: string, email: string, phone: string, password: string, passwordConfirmation: string): Promise<boolean> => {
    try {
      setIsLoading(true);
      const response = await authService.register({
        name,
        email,
        phone,
        password,
        password_confirmation: passwordConfirmation
      });
      
      setUser(response.data.user);
      setToken(response.data.token);
      
      await AsyncStorage.setItem('auth_token', response.data.token);
      await AsyncStorage.setItem('user', JSON.stringify(response.data.user));
      
      return true;
    } catch (error: any) {
      console.error('Erro no registro:', error);
      throw new Error(error.response?.data?.message || 'Erro ao fazer registro');
    } finally {
      setIsLoading(false);
    }
  };

  const logout = async () => {
    try {
      if (token) {
        await authService.logout();
      }
    } catch (error) {
      console.error('Erro no logout:', error);
    } finally {
      setUser(null);
      setToken(null);
      await AsyncStorage.removeItem('auth_token');
      await AsyncStorage.removeItem('user');
    }
  };

  const updateProfileType = async (profileType: 'client' | 'provider'): Promise<boolean> => {
    try {
      setIsLoading(true);
      const response = await authService.updateProfileType(profileType);
      
      setUser(response.data.user);
      await AsyncStorage.setItem('user', JSON.stringify(response.data.user));
      
      return true;
    } catch (error: any) {
      console.error('Erro ao atualizar tipo de perfil:', error);
      throw new Error(error.response?.data?.message || 'Erro ao atualizar tipo de perfil');
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