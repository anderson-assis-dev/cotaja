import axios from 'axios';
import AsyncStorage from '@react-native-async-storage/async-storage';

const API_BASE_URL = 'http://localhost:8000/api';

// Criar instância do axios
const api = axios.create({
  baseURL: API_BASE_URL,
  headers: {
    'Content-Type': 'application/json',
    'Accept': 'application/json',
  },
});

// Interceptor para adicionar token de autenticação
api.interceptors.request.use(
  async (config) => {
    const token = await AsyncStorage.getItem('auth_token');
    if (token) {
      config.headers.Authorization = `Bearer ${token}`;
    }
    return config;
  },
  (error) => {
    return Promise.reject(error);
  }
);

// Interceptor para tratar respostas
api.interceptors.response.use(
  (response) => {
    return response;
  },
  async (error) => {
    if (error.response?.status === 401) {
      // Token expirado ou inválido
      await AsyncStorage.removeItem('auth_token');
      await AsyncStorage.removeItem('user');
      // Redirecionar para login se necessário
    }
    return Promise.reject(error);
  }
);

// Tipos para as respostas da API
export interface User {
  id: number;
  name: string;
  email: string;
  phone?: string;
  address?: string;
  profile_type: 'client' | 'provider';
  email_verified_at?: string;
  created_at: string;
  updated_at: string;
}

export interface AuthResponse {
  success: boolean;
  message: string;
  data: {
    user: User;
    token: string;
  };
}

export interface RegisterData {
  name: string;
  email: string;
  phone: string;
  password: string;
  password_confirmation: string;
}

export interface LoginData {
  email: string;
  password: string;
}

export interface UpdateProfileData {
  name?: string;
  phone?: string;
  address?: string;
  profile_type?: 'client' | 'provider';
}

// Serviços de autenticação
export const authService = {
  // Registrar usuário
  async register(data: RegisterData): Promise<AuthResponse> {
    const response = await api.post('/register', data);
    return response.data;
  },

  // Fazer login
  async login(data: LoginData): Promise<AuthResponse> {
    const response = await api.post('/login', data);
    return response.data;
  },

  // Fazer logout
  async logout(): Promise<{ success: boolean; message: string }> {
    const response = await api.post('/logout');
    return response.data;
  },

  // Obter dados do usuário autenticado
  async me(): Promise<{ success: boolean; data: { user: User } }> {
    const response = await api.get('/me');
    return response.data;
  },

  // Atualizar perfil
  async updateProfile(data: UpdateProfileData): Promise<{ success: boolean; message: string; data: { user: User } }> {
    const response = await api.put('/profile', data);
    return response.data;
  },

  // Atualizar tipo de perfil
  async updateProfileType(profileType: 'client' | 'provider'): Promise<{ success: boolean; message: string; data: { user: User } }> {
    const response = await api.put('/profile-type', { profile_type: profileType });
    return response.data;
  },
};

export default api; 