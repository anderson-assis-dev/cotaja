import axios from 'axios';
import AsyncStorage from '@react-native-async-storage/async-storage';
import { Platform } from 'react-native';
import RNFS from 'react-native-fs';
import Config from 'react-native-config';

// Configurar URL base via variáveis de ambiente
const getApiBaseUrl = () => {
  // URL do servidor via .env
  return Config.API_BASE_URL || 'http://localhost:3000/api';
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
  timeout: 120000, // 120 segundos (2 minutos) para uploads grandes
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
  id: string;
  name: string;
  email: string;
  phone?: string;
  address?: string;
  profile_type: 'client' | 'provider';
  service_categories?: string[];
  email_verified_at?: string;
  created_at: string;
  updated_at: string;
  // User stats fields
  rate?: number;
  avg_rating?: number;
  ratings_count?: number;
  balance?: number;
  active_services?: number;
  completed_services?: number;
  avatar_base64?: string;
  activate?: number;
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
  profile_type?: 'client' | 'provider';
  fcm_token?: string;
  device_platform?: string;
}

export interface LoginData {
  email: string;
  password: string;
  fcm_token?: string;
  device_platform?: string;
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
  deadline: number;
  address: string;
  street?: string;
  number?: string;
  complement?: string;
  neighborhood?: string;
  city?: string;
  state?: string;
  zip_code?: string;
  latitude?: number;
  longitude?: number;
  status: 'open' | 'in_progress' | 'completed' | 'cancelled';
  client_id: number;
  provider_id?: number;
  accepted_proposal_id?: number;
  auction_started_at?: string;
  auction_ends_at?: string;
  scheduled_date?: string;
  schedule_confirmed_by_client?: number;
  schedule_confirmed_by_provider?: number;
  cancel_reason?: string;
  cancelled_by?: string;
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
  provider_name?: string;
  provider_email?: string;
  provider_avatar_base64?: string;
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
  images?: string[];
  created_at: string;
  updated_at: string;
}

// Tipos para Anexos
export interface Attachment {
  id?: number;
  filename: string;
  original_name: string;
  file_path?: string;
  path?: string;
  data?: string;
  file_size?: number;
  size?: number;
  mime_type: string;
  type?: string;
  attachable_type?: string;
  attachable_id?: number;
  uploaded_at?: string;
  created_at?: string;
  updated_at?: string;
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
    console.log(response);
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
  async updateProfileType(profileType: 'client' | 'provider', serviceCategories?: string[]): Promise<{ success: boolean; message: string; data: { user: User } }> {
    const data: any = { profile_type: profileType };
    if (serviceCategories) {
      data.service_categories = serviceCategories;
    }
    const response = await api.put('/profile-type', data);
    return response.data;
  },

  // Salvar token FCM
  async saveFcmToken(fcmToken: string, devicePlatform?: string): Promise<{ success: boolean; message: string }> {
    const response = await api.post('/fcm-token', {
      fcm_token: fcmToken,
      device_platform: devicePlatform || Platform.OS
    });
    return response.data;
  },

  // Atualizar foto de perfil
  async updateAvatar(avatar_base64: string): Promise<{ success: boolean; message: string; data: { avatar_base64: string } }> {
    const response = await api.put('/auth/avatar', { avatar_base64 });
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
    deadline: number;
    address: string;
    street?: string;
    number?: string;
    complement?: string;
    neighborhood?: string;
    city?: string;
    state?: string;
    zip_code?: string;
    latitude?: number;
    longitude?: number;
    attachments?: any[];
  }): Promise<{ success: boolean; message: string; data: Order }> {
    const formData = new FormData();

    // Adicionar campos do pedido
    formData.append('title', data.title);
    formData.append('description', data.description);
    formData.append('category', data.category);
    formData.append('budget', data.budget.toString());
    formData.append('deadline', data.deadline.toString());
    formData.append('address', data.address);

    // Campos de endereço estruturado
    if (data.street) formData.append('street', data.street);
    if (data.number) formData.append('number', data.number);
    if (data.complement) formData.append('complement', data.complement);
    if (data.neighborhood) formData.append('neighborhood', data.neighborhood);
    if (data.city) formData.append('city', data.city);
    if (data.state) formData.append('state', data.state);
    if (data.zip_code) formData.append('zip_code', data.zip_code);
    if (data.latitude) formData.append('latitude', data.latitude.toString());
    if (data.longitude) formData.append('longitude', data.longitude.toString());

    // Adicionar anexos se existirem
    if (data.attachments && data.attachments.length > 0) {
      for (let i = 0; i < data.attachments.length; i++) {
        const attachment = data.attachments[i];

        // Normalizar URI
        let uri = attachment.uri;

        console.log(`🔍 Verificando arquivo ${i + 1}:`, uri);

        try {
          // Para URIs content:// (document picker), não verificar com RNFS
          // O FormData do React Native lida com content:// nativamente
          if (uri.startsWith('content://')) {
            const file: any = {
              uri: uri,
              type: attachment.type || 'application/octet-stream',
              name: attachment.name || `file_${i}`,
            };
            console.log(`📎 Adicionando arquivo ${i + 1} (content://) ao FormData:`, {
              name: file.name,
              type: file.type,
            });
            formData.append('attachments', file);
          } else {
            // Para file:// URIs, decodificar e verificar existência
            const filePath = decodeURIComponent(uri.replace('file://', ''));

            const fileExists = await RNFS.exists(filePath);
            console.log(`  Existe: ${fileExists}, path: ${filePath}`);

            if (fileExists) {
              const stat = await RNFS.stat(filePath);

              // Garantir que o URI tenha file://
              if (!uri.startsWith('file://')) {
                uri = 'file://' + uri;
              }

              const file: any = {
                uri: uri,
                type: attachment.type || 'application/octet-stream',
                name: attachment.name || `file_${i}`,
              };

              console.log(`📎 Adicionando arquivo ${i + 1} ao FormData:`, {
                name: file.name,
                type: file.type,
                size: stat.size
              });

              formData.append('attachments', file);
            } else {
              console.warn(`⚠️ RNFS.exists falhou, tentando enviar mesmo assim: ${filePath}`);
              // Tentar enviar mesmo assim — o React Native pode resolver o URI
              const file: any = {
                uri: uri.startsWith('file://') ? uri : 'file://' + uri,
                type: attachment.type || 'application/octet-stream',
                name: attachment.name || `file_${i}`,
              };
              formData.append('attachments', file);
            }
          }
        } catch (error) {
          console.error(`❌ Erro ao verificar arquivo ${i + 1}:`, error);
          // Tentar enviar mesmo assim em vez de abortar tudo
          const file: any = {
            uri: uri,
            type: attachment.type || 'application/octet-stream',
            name: attachment.name || `file_${i}`,
          };
          formData.append('attachments', file);
        }
      }
    }

    console.log('📦 Enviando dados:', {
      title: data.title,
      category: data.category,
      budget: data.budget,
      deadline: data.deadline,
      attachmentsCount: data.attachments?.length || 0
    });

    console.log('🌐 URL completa:', `${API_BASE_URL}/orders`);

    try {
      // Usar fetch nativo em vez de axios para upload de arquivos
      // pois o axios tem problemas com FormData no React Native
      const token = await AsyncStorage.getItem('auth_token');

      console.log('🔑 Token obtido, iniciando upload...');

      const response = await fetch(`${API_BASE_URL}/orders`, {
        method: 'POST',
        headers: {
          'Authorization': `Bearer ${token}`,
          // NÃO adicionar Content-Type - deixar o fetch definir automaticamente
        },
        body: formData,
      });

      console.log('📡 Resposta HTTP:', response.status, response.statusText);

      const responseData = await response.json();

      if (!response.ok) {
        console.error('❌ Erro do servidor:', responseData);
        throw new Error(responseData.message || 'Erro ao criar pedido');
      }

      console.log('✅ Pedido criado com sucesso!');
      return responseData;
    } catch (error: any) {
      console.error('❌ ERRO ao criar pedido:');
      console.error('- Tipo:', error.name);
      console.error('- Mensagem:', error.message);
      console.error('- Stack:', error.stack);
      throw error;
    }
  },

  // Obter pedido específico
  async getOrder(id: number): Promise<{ success: boolean; data: Order }> {
    const response = await api.get(`/orders/${id}`);
    return response.data;
  },

  // Atualizar pedido
  async updateOrder(id: number, data: {
    title?: string;
    description?: string;
    category?: string;
    budget?: number;
    deadline?: number;
    address?: string;
    street?: string;
    number?: string;
    complement?: string;
    neighborhood?: string;
    city?: string;
    state?: string;
    zip_code?: string;
    latitude?: number;
    longitude?: number;
    attachments?: any[];
    removedAttachments?: string[];
  }): Promise<{ success: boolean; message: string; data: Order }> {
    const formData = new FormData();

    // Adicionar campos que foram fornecidos
    if (data.title) formData.append('title', data.title);
    if (data.description) formData.append('description', data.description);
    if (data.category) formData.append('category', data.category);
    if (data.budget) formData.append('budget', data.budget.toString());
    if (data.deadline) formData.append('deadline', data.deadline.toString());
    if (data.address) formData.append('address', data.address);
    if (data.street) formData.append('street', data.street);
    if (data.number) formData.append('number', data.number);
    if (data.complement) formData.append('complement', data.complement);
    if (data.neighborhood) formData.append('neighborhood', data.neighborhood);
    if (data.city) formData.append('city', data.city);
    if (data.state) formData.append('state', data.state);
    if (data.zip_code) formData.append('zip_code', data.zip_code);
    if (data.latitude) formData.append('latitude', data.latitude.toString());
    if (data.longitude) formData.append('longitude', data.longitude.toString());

    // Enviar lista de anexos removidos
    if (data.removedAttachments && data.removedAttachments.length > 0) {
      formData.append('removedAttachments', JSON.stringify(data.removedAttachments));
    }

    // Adicionar novos anexos se houver
    if (data.attachments && data.attachments.length > 0) {
      for (let i = 0; i < data.attachments.length; i++) {
        const attachment = data.attachments[i];
        let uri = attachment.uri;

        // Normalizar URI
        try {
          // Para URIs content:// (document picker), não verificar com RNFS
          if (uri.startsWith('content://')) {
            const file: any = {
              uri: uri,
              type: attachment.type || 'application/octet-stream',
              name: attachment.name || `file_${i}`,
            };
            console.log(`📎 Adicionando novo arquivo ${i + 1} (content://) ao FormData:`, {
              name: file.name,
              type: file.type,
            });
            formData.append('attachments', file);
          } else {
            const filePath = decodeURIComponent(uri.replace('file://', ''));
            const fileExists = await RNFS.exists(filePath);

            if (fileExists) {
              const stat = await RNFS.stat(filePath);

              if (!uri.startsWith('file://')) {
                uri = 'file://' + uri;
              }

              const file: any = {
                uri: uri,
                type: attachment.type || 'application/octet-stream',
                name: attachment.name || `file_${i}`,
              };

              console.log(`📎 Adicionando novo arquivo ${i + 1} ao FormData:`, {
                name: file.name,
                type: file.type,
                size: stat.size
              });

              formData.append('attachments', file);
            } else {
              console.warn(`⚠️ RNFS.exists falhou, tentando enviar mesmo assim: ${filePath}`);
              const file: any = {
                uri: uri.startsWith('file://') ? uri : 'file://' + uri,
                type: attachment.type || 'application/octet-stream',
                name: attachment.name || `file_${i}`,
              };
              formData.append('attachments', file);
            }
          }
        } catch (error) {
          console.error(`❌ Erro ao verificar arquivo ${i + 1}:`, error);
          const file: any = {
            uri: uri,
            type: attachment.type || 'application/octet-stream',
            name: attachment.name || `file_${i}`,
          };
          formData.append('attachments', file);
        }
      }
    }

    console.log('📝 Atualizando pedido ID:', id);

    try {
      const token = await AsyncStorage.getItem('auth_token');

      const response = await fetch(`${API_BASE_URL}/orders/${id}`, {
        method: 'PUT',
        headers: {
          'Authorization': `Bearer ${token}`,
        },
        body: formData,
      });

      console.log('📡 Resposta HTTP:', response.status, response.statusText);

      const responseData = await response.json();

      if (!response.ok) {
        console.error('❌ Erro do servidor:', responseData);
        throw new Error(responseData.message || 'Erro ao atualizar pedido');
      }

      console.log('✅ Pedido atualizado com sucesso!');
      return responseData;
    } catch (error: any) {
      console.error('❌ ERRO ao atualizar pedido:');
      console.error('- Tipo:', error.name);
      console.error('- Mensagem:', error.message);
      throw error;
    }
  },

  // Excluir pedido
  async deleteOrder(id: number): Promise<{ success: boolean; message: string }> {
    const response = await api.delete(`/orders/${id}`);
    return response.data;
  },

  // Pausar/Retomar pedido (toggle stopped <-> open)
  async toggleStopOrder(id: number): Promise<{ success: boolean; message: string; data: Order }> {
    const response = await api.post(`/orders/${id}/toggle-stop`);
    return response.data;
  },

  // Iniciar leilão
  async startAuction(id: number): Promise<{ success: boolean; message: string; data: Order }> {
    const response = await api.post(`/orders/${id}/start-auction`);
    return response.data;
  },

  // Listar pedidos disponíveis para prestadores
  async getAvailableOrders(params?: { category?: string; cep?: string; search?: string }): Promise<{ success: boolean; data: { data: Order[]; current_page: number; total: number } }> {
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
    images?: string[];
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
  async updateService(id: number, data: Partial<Service> & { images?: string[] }): Promise<{ success: boolean; message: string; data: Service }> {
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

  // Listar meus serviços (do usuário autenticado)
  async getMyServices(): Promise<{ success: boolean; message: string; data: Service[] }> {
    const response = await api.get('/services/my-services');
    return response.data;
  },
};



// Tipos para Mensagens
export interface Message {
  id: number;
  order_id: number;
  sender_id: string;
  receiver_id: string;
  content: string;
  read_at?: string;
  created_at: string;
  updated_at: string;
  sender?: { id: string; name: string; avatar_base64?: string };
  receiver?: { id: string; name: string; avatar_base64?: string };
}

// Serviço de Chat
export const chatService = {
  async getMessages(orderId: number, page = 1): Promise<{ success: boolean; data: { messages: Message[]; total: number } }> {
    const response = await api.get(`/chat/${orderId}/messages`, { params: { page } });
    return response.data;
  },

  async sendMessage(orderId: number, content: string): Promise<{ success: boolean; data: Message }> {
    const response = await api.post(`/chat/${orderId}/messages`, { content });
    return response.data;
  },

  async getUnreadCount(orderId: number): Promise<{ success: boolean; data: { unread_count: number } }> {
    const response = await api.get(`/chat/${orderId}/messages/unread`);
    return response.data;
  },
};

// Serviço de Cancelamento e Agendamento
export const orderActionService = {
  async cancelOrder(orderId: number, reason: string): Promise<{ success: boolean; message: string }> {
    const response = await api.post(`/orders/${orderId}/cancel`, { reason });
    return response.data;
  },

  async proposeSchedule(orderId: number, scheduledDate: string): Promise<{ success: boolean; message: string; data: Order }> {
    const response = await api.post(`/orders/${orderId}/schedule`, { scheduled_date: scheduledDate });
    return response.data;
  },

  async confirmSchedule(orderId: number): Promise<{ success: boolean; message: string; data: Order }> {
    const response = await api.post(`/orders/${orderId}/confirm-schedule`);
    return response.data;
  },
};

export const ratingService = {
  async createProviderRating(providerId: string, data: { rating: number; comment?: string; attachments?: { uri: string; name: string; type: string }[] }): Promise<{ success: boolean; message: string; data: any }> {
    const formData = new FormData();
    formData.append('rating', String(data.rating));
    if (data.comment) formData.append('comment', data.comment);
    if (data.attachments && data.attachments.length > 0) {
      for (let i = 0; i < data.attachments.length; i++) {
        const att = data.attachments[i];
        let uri = att.uri;
        if (uri && !uri.startsWith('content://') && !uri.startsWith('file://')) {
          uri = 'file://' + uri;
        }
        const file: any = { uri, type: att.type || 'application/octet-stream', name: att.name || `file_${i}` };
        formData.append('attachments', file);
      }
    }
    const token = await AsyncStorage.getItem('auth_token');
    const response = await fetch(`${API_BASE_URL}/providers/${providerId}/ratings`, {
      method: 'POST',
      headers: { 'Authorization': `Bearer ${token}` },
      body: formData
    });
    const responseData = await response.json();
    if (!response.ok) throw new Error(responseData.message || 'Erro ao enviar avaliação');
    return responseData;
  },
  async getProviderRatings(providerId: string): Promise<{ success: boolean; message: string; data: { data: any[]; current_page: number; total: number } }> {
    const response = await api.get(`/providers/${providerId}/ratings`);
    return response.data;
  },
};

export const providerService={
  async requestQuote(providerId:string):Promise<{success:boolean;message:string;data:any}>{
    const response=await api.post(`/providers/${providerId}/request-quote`);
    return response.data;
  }
};

// Tipos para Endereço Geocodificado
export interface GeocodedAddress {
  street: string;
  number: string;
  complement: string;
  neighborhood: string;
  city: string;
  state: string;
  zip_code: string;
  latitude: number | null;
  longitude: number | null;
  formatted_address: string;
  name: string;
}

export default api;

// Serviço de Geocoding (Nominatim + ViaCEP)
export const geocodingService = {
  // Reverse geocode: coordenadas → endereço
  async reverseGeocode(lat: number, lng: number): Promise<{ success: boolean; data: GeocodedAddress }> {
    const response = await api.get('/geocoding/reverse', { params: { lat, lng } });
    return response.data;
  },

  // Forward geocode: endereço → coordenadas
  async forwardGeocode(address: string): Promise<{ success: boolean; data: GeocodedAddress }> {
    const response = await api.get('/geocoding/forward', { params: { address } });
    return response.data;
  },

  // Buscar endereços (autocomplete)
  async searchAddress(query: string, lat?: number, lng?: number): Promise<{ success: boolean; data: GeocodedAddress[] }> {
    const response = await api.get('/geocoding/search', { params: { q: query, lat, lng } });
    return response.data;
  },

  // Consultar CEP → endereço (ViaCEP)
  async lookupCep(cep: string): Promise<{ success: boolean; data: GeocodedAddress }> {
    const cleanCep = cep.replace(/[^0-9]/g, '');
    const response = await api.get(`/geocoding/cep/${cleanCep}`);
    return response.data;
  },
};