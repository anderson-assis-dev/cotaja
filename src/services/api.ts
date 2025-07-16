import axios from 'axios';
import AsyncStorage from '@react-native-async-storage/async-storage';
import { Platform } from 'react-native';

// Configurar URL base conforme a plataforma
const getApiBaseUrl = () => {
  if (Platform.OS === 'android') {
    return 'http://10.0.2.2:8000/api'; // Android Emulator
  } else {
    return 'http://localhost:8000/api'; // iOS Simulator
  }
};

const API_BASE_URL = getApiBaseUrl();

console.log('API Base URL:', API_BASE_URL);

// Criar instância do axios
const api = axios.create({
  baseURL: API_BASE_URL,
  headers: {
    'Content-Type': 'application/json',
    'Accept': 'application/json',
  },
  timeout: 10000, // 10 segundos de timeout
});

// Interceptor para adicionar token de autenticação
api.interceptors.request.use(
  async (config) => {
    try {
      const token = await AsyncStorage.getItem('auth_token');
      if (token) {
        config.headers.Authorization = `Bearer ${token}`;
      }
      console.log('Request:', config.method?.toUpperCase(), config.url);
      return config;
    } catch (error) {
      console.error('Erro no interceptor de request:', error);
      return config;
    }
  },
  (error) => {
    console.error('Erro no interceptor de request:', error);
    return Promise.reject(error);
  }
);

// Interceptor para tratar respostas
api.interceptors.response.use(
  (response) => {
    console.log('Response:', response.status, response.config.url);
    return response;
  },
  async (error) => {
    console.error('API Error:', {
      url: error.config?.url,
      method: error.config?.method,
      status: error.response?.status,
      data: error.response?.data,
      message: error.message
    });

    if (error.response?.status === 401) {
      // Token expirado ou inválido
      try {
        await AsyncStorage.removeItem('auth_token');
        await AsyncStorage.removeItem('user');
      } catch (storageError) {
        console.error('Erro ao limpar storage:', storageError);
      }
    }

    // Melhorar mensagem de erro
    if (error.code === 'ECONNREFUSED') {
      error.message = 'Servidor não está acessível. Verifique se o backend está rodando.';
    } else if (error.code === 'NETWORK_ERROR') {
      error.message = 'Erro de conexão. Verifique sua internet.';
    } else if (error.code === 'TIMEOUT') {
      error.message = 'Timeout na requisição. Tente novamente.';
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

// Tipos para Pedidos
export interface Order {
  id: number;
  title: string;
  description: string;
  category: string;
  budget: number;
  deadline: number; // Mudando de string para number
  address: string;
  status: 'open' | 'in_progress' | 'completed' | 'cancelled';
  client_id: number;
  provider_id?: number;
  accepted_proposal_id?: number;
  auction_started_at?: string;
  auction_ends_at?: string;
  client?: User;
  provider?: User;
  proposals?: Proposal[];
  attachments?: Attachment[];
  created_at: string;
  updated_at: string;
}

// Tipos para Propostas
export interface Proposal {
  id: number;
  price: number;
  deadline: string;
  description: string;
  status: 'pending' | 'accepted' | 'rejected' | 'withdrawn';
  order_id: number;
  provider_id: number;
  order?: Order;
  provider?: User;
  created_at: string;
  updated_at: string;
}

// Tipos para Serviços
export interface Service {
  id: number;
  title: string;
  description: string;
  price: number;
  category: string;
  status: 'active' | 'inactive' | 'paused';
  provider_id: number;
  provider?: User;
  created_at: string;
  updated_at: string;
}

// Tipos para Anexos
export interface Attachment {
  id: number;
  filename: string;
  original_name: string;
  file_path: string;
  file_size: number;
  mime_type: string;
  attachable_type: string;
  attachable_id: number;
  created_at: string;
  updated_at: string;
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

// Serviços de Pedidos
export const orderService = {
  // Listar pedidos
  async getOrders(params?: { status?: string; category?: string }): Promise<{ success: boolean; data: { data: Order[]; current_page: number; total: number } }> {
    const response = await api.get('/orders', { params });
    return response.data;
  },

  // Obter pedidos recentes
  async getRecentOrders(): Promise<{ success: boolean; data: Order[] }> {
    const response = await api.get('/orders/recent');
    return response.data;
  },

  // Obter estatísticas
  async getStats(): Promise<{ success: boolean; data: { total_orders: number; open_orders: number; completed_orders: number; total_spent: number } }> {
    const response = await api.get('/orders/stats');
    return response.data;
  },

  // Criar pedido
  async createOrder(data: {
    title: string;
    description: string;
    category: string;
    budget: number;
    deadline: number; // Mudando de string para number
    address: string;
    attachments?: any[];
  }): Promise<{ success: boolean; message: string; data: Order }> {
    const formData = new FormData();
    
    // Adicionar campos do pedido
    formData.append('title', data.title);
    formData.append('description', data.description);
    formData.append('category', data.category);
    formData.append('budget', data.budget.toString());
    formData.append('deadline', data.deadline.toString()); // Convertendo para string
    formData.append('address', data.address);

    // Adicionar anexos se existirem
    if (data.attachments && data.attachments.length > 0) {
      data.attachments.forEach((attachment, index) => {
        const file = {
          uri: attachment.uri,
          type: attachment.type || 'application/octet-stream',
          name: attachment.name || `file_${index}`,
        };
        
        formData.append(`attachments[${index}]`, file as any);
      });
    }

    console.log('Enviando dados:', {
      title: data.title,
      description: data.description,
      category: data.category,
      budget: data.budget,
      deadline: data.deadline,
      address: data.address,
      attachmentsCount: data.attachments?.length || 0
    });

    const response = await api.post('/orders', formData, {
      headers: {
        'Content-Type': 'multipart/form-data',
      },
    });
    return response.data;
  },

  // Obter pedido específico
  async getOrder(id: number): Promise<{ success: boolean; data: Order }> {
    const response = await api.get(`/orders/${id}`);
    return response.data;
  },

  // Atualizar pedido
  async updateOrder(id: number, data: Partial<Order>): Promise<{ success: boolean; message: string; data: Order }> {
    const response = await api.put(`/orders/${id}`, data);
    return response.data;
  },

  // Excluir pedido
  async deleteOrder(id: number): Promise<{ success: boolean; message: string }> {
    const response = await api.delete(`/orders/${id}`);
    return response.data;
  },

  // Iniciar leilão
  async startAuction(id: number): Promise<{ success: boolean; message: string; data: Order }> {
    const response = await api.post(`/orders/${id}/start-auction`);
    return response.data;
  },

  // Listar pedidos disponíveis para prestadores
  async getAvailableOrders(params?: { category?: string }): Promise<{ success: boolean; data: { data: Order[]; current_page: number; total: number } }> {
    const response = await api.get('/orders/available', { params });
    return response.data;
  },
};

// Serviços de Propostas
export const proposalService = {
  // Listar propostas
  async getProposals(params?: { status?: string; order_id?: number }): Promise<{ success: boolean; data: { data: Proposal[]; current_page: number; total: number } }> {
    const response = await api.get('/proposals', { params });
    return response.data;
  },

  // Criar proposta
  async createProposal(data: {
    order_id: number;
    price: number;
    deadline: string;
    description: string;
  }): Promise<{ success: boolean; message: string; data: Proposal }> {
    const response = await api.post('/proposals', data);
    return response.data;
  },

  // Obter proposta específica
  async getProposal(id: number): Promise<{ success: boolean; data: Proposal }> {
    const response = await api.get(`/proposals/${id}`);
    return response.data;
  },

  // Atualizar proposta
  async updateProposal(id: number, data: Partial<Proposal>): Promise<{ success: boolean; message: string; data: Proposal }> {
    const response = await api.put(`/proposals/${id}`, data);
    return response.data;
  },

  // Aceitar proposta
  async acceptProposal(id: number): Promise<{ success: boolean; message: string; data: Proposal }> {
    const response = await api.post(`/proposals/${id}/accept`);
    return response.data;
  },

  // Rejeitar proposta
  async rejectProposal(id: number): Promise<{ success: boolean; message: string }> {
    const response = await api.post(`/proposals/${id}/reject`);
    return response.data;
  },

  // Cancelar proposta (prestador)
  async withdrawProposal(id: number): Promise<{ success: boolean; message: string }> {
    const response = await api.post(`/proposals/${id}/withdraw`);
    return response.data;
  },
};

// Serviços de Serviços
export const serviceService = {
  // Listar serviços
  async getServices(params?: { status?: string; category?: string }): Promise<{ success: boolean; data: { data: Service[]; current_page: number; total: number } }> {
    const response = await api.get('/services', { params });
    return response.data;
  },

  // Criar serviço
  async createService(data: {
    title: string;
    description: string;
    price: number;
    category: string;
    status?: string;
  }): Promise<{ success: boolean; message: string; data: Service }> {
    const response = await api.post('/services', data);
    return response.data;
  },

  // Obter serviço específico
  async getService(id: number): Promise<{ success: boolean; data: Service }> {
    const response = await api.get(`/services/${id}`);
    return response.data;
  },

  // Atualizar serviço
  async updateService(id: number, data: Partial<Service>): Promise<{ success: boolean; message: string; data: Service }> {
    const response = await api.put(`/services/${id}`, data);
    return response.data;
  },

  // Excluir serviço
  async deleteService(id: number): Promise<{ success: boolean; message: string }> {
    const response = await api.delete(`/services/${id}`);
    return response.data;
  },

  // Listar serviços disponíveis
  async getAvailableServices(params?: { category?: string; provider_id?: number }): Promise<{ success: boolean; data: { data: Service[]; current_page: number; total: number } }> {
    const response = await api.get('/services/available', { params });
    return response.data;
  },

  // Buscar prestadores por categoria
  async searchProviders(params: { category: string; search?: string }): Promise<{ success: boolean; data: { data: User[]; current_page: number; total: number } }> {
    const response = await api.get('/services/search-providers', { params });
    return response.data;
  },
};

export default api;