import React, { useState, useEffect } from 'react';
import { View, Text, ScrollView, TouchableOpacity, Modal, Alert, Image, ActivityIndicator } from 'react-native';
import { useNavigation, useRoute } from '@react-navigation/native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import Icon from 'react-native-vector-icons/MaterialIcons';
import { useAuth } from '../../contexts/AuthContext';
import { orderService, Order as ApiOrder, Proposal as ApiProposal } from '../../services/api';

// Tipos TypeScript
interface Proposal {
  id: string;
  provider: {
    name: string;
    rating: number;
    avatar: any;
  };
  price: string;
  deadline: string;
  description: string;
  ranking: number;
}

interface Order {
  id: string;
  title: string;
  category: string;
  budget: string;
  deadline: string;
  status: string;
  description: string;
  location: string;
  clientRating: number;
  proposals: Proposal[];
  insights: string[];
  clientId: string;
  hasActiveAuction: boolean;
  isNewDemand: boolean;
}

// Função para converter dados da API para o formato da interface
const convertApiOrderToOrder = (apiOrder: ApiOrder): Order => {
  // Converter propostas da API para o formato da interface
  const proposals: Proposal[] = apiOrder.proposals?.map((proposal: ApiProposal, index: number) => ({
    id: proposal.id.toString(),
    provider: {
      name: proposal.provider?.name || 'Prestador',
      rating: 4.5, // Valor padrão, ajustar conforme necessário
      avatar: require('../../../assets/splash-icon.png'),
    },
    price: `R$ ${(proposal.price || 0).toFixed(2).replace('.', ',')}`,
    deadline: `${proposal.deadline || 0} dias`,
    description: proposal.description || 'Sem descrição',
    ranking: index + 1,
  })) || [];

  // Determinar se tem leilão ativo
  const hasActiveAuction = !!(apiOrder.auction_started_at && apiOrder.auction_ends_at && 
    new Date() >= new Date(apiOrder.auction_started_at) && 
    new Date() <= new Date(apiOrder.auction_ends_at));

  // Determinar se é nova demanda (pedido recente sem propostas)
  const isNewDemand = apiOrder.status === 'open' && proposals.length === 0;

  // Converter status da API para português
  const getStatusInPortuguese = (status: string): string => {
    switch (status) {
      case 'open': return 'Aguardando propostas';
      case 'in_progress': return 'Em andamento';
      case 'completed': return 'Concluído';
      case 'cancelled': return 'Cancelado';
      default: return 'Aguardando propostas';
    }
  };

  // Gerar insights baseados nos dados
  const generateInsights = (apiOrder: ApiOrder, proposals: Proposal[]): string[] => {
    const insights: string[] = [];
    
    if (proposals.length > 0) {
      const avgPrice = proposals.reduce((sum, p) => sum + parseFloat(p.price.replace('R$ ', '').replace(',', '.')), 0) / proposals.length;
      insights.push(`O orçamento médio da categoria é R$ ${avgPrice.toFixed(2).replace('.', ',')}`);
      
      const avgDeadline = proposals.reduce((sum, p) => sum + parseInt(p.deadline), 0) / proposals.length;
      insights.push(`Prazo médio de execução: ${avgDeadline} dias`);
    } else {
      insights.push('Nenhuma proposta recebida ainda');
      insights.push('Seu pedido está sendo divulgado para prestadores');
    }

    return insights;
  };

  // Tratar budget - pode vir como string ou number
  const budgetValue = typeof apiOrder.budget === 'string' 
    ? parseFloat(apiOrder.budget) 
    : (apiOrder.budget || 0);

  // Tratar deadline - pode vir como string ou number
  const deadlineValue = typeof apiOrder.deadline === 'string' 
    ? parseInt(apiOrder.deadline) 
    : (apiOrder.deadline || 0);

  const convertedOrder = {
    id: apiOrder.id.toString(),
    title: apiOrder.title || 'Pedido sem título',
    category: apiOrder.category || 'Sem categoria',
    budget: `R$ ${budgetValue.toFixed(2).replace('.', ',')}`,
    deadline: `${deadlineValue} dias`,
    status: getStatusInPortuguese(apiOrder.status || 'open'),
    description: apiOrder.description || 'Sem descrição',
    location: apiOrder.address || 'Local não informado',
    clientRating: 4.8, // Valor padrão, ajustar conforme necessário
    proposals,
    insights: generateInsights(apiOrder, proposals),
    clientId: apiOrder.client_id?.toString() || '0',
    hasActiveAuction,
    isNewDemand,
  };

  
  return convertedOrder;
};

export default function OrderDetailsScreen() {
  const navigation = useNavigation();
  const route = useRoute();
  const insets = useSafeAreaInsets();
  const { user } = useAuth();
  
  const [orders, setOrders] = useState<Order[]>([]);
  const [selectedOrder, setSelectedOrder] = useState<Order | null>(null);
  const [showDetails, setShowDetails] = useState(false);
  const [refusedProposals, setRefusedProposals] = useState<{ [orderId: string]: string[] }>({});
  const [closedOrders, setClosedOrders] = useState<string[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  // Recebe parâmetros da navegação
  const profileType = (route.params as any)?.profileType || 'client';
  const clientId = user?.id?.toString() || (route.params as any)?.clientId || '1';
  const selectedCategory = (route.params as any)?.selectedCategory;
  const fromLeiloes = (route.params as any)?.fromLeiloes || false;

  // Buscar pedidos da API
  const fetchOrders = async () => {
    try {
      setLoading(true);
      setError(null);

      let params: any = {};
      
      // Se veio da tela de leilões, filtrar apenas pedidos em andamento
      if (fromLeiloes) {
        params.status = 'in_progress';
      }

      // Aplicar filtro por categoria se selecionada
      if (selectedCategory) {
        params.category = selectedCategory;
      }

      
      const response = await orderService.getOrders(params);
      
      if (response.success) {
        
        // Verificar se a estrutura está correta
        if (!response.data.data || !Array.isArray(response.data.data)) {
          setOrders([]);
          return;
        }
        
        const convertedOrders = response.data.data.map((apiOrder: any, index: number) => {
    
          
          try {
            return convertApiOrderToOrder(apiOrder);
          } catch (error) {
            // Retornar um pedido padrão em caso de erro
            return {
              id: apiOrder.id?.toString() || '0',
              title: apiOrder.title || 'Pedido sem título',
              category: apiOrder.category || 'Sem categoria',
              budget: 'R$ 0,00',
              deadline: '0 dias',
              status: 'Aguardando propostas',
              description: apiOrder.description || 'Sem descrição',
              location: apiOrder.address || 'Local não informado',
              clientRating: 4.8,
              proposals: [],
              insights: ['Dados incompletos'],
              clientId: apiOrder.client_id?.toString() || '0',
              hasActiveAuction: false,
              isNewDemand: false,
            };
          }
        });
        
        setOrders(convertedOrders);
      } else {
        throw new Error('Erro ao carregar pedidos');
      }
    } catch (error: any) {
      setError(error.message || 'Erro ao carregar pedidos');
    } finally {
      setLoading(false);
    }
  };

  // Carregar pedidos quando o componente montar
  useEffect(() => {
    if (user?.id) {
      fetchOrders();
    } else {
      setLoading(false);
    }
  }, [fromLeiloes, selectedCategory, user?.id]);

  // Filtra os pedidos conforme o tipo de usuário e categoria
  let filteredOrders = profileType === 'client'
    ? orders.filter(o => o.clientId === clientId)
    : orders;

  // Remove pedidos encerrados
  filteredOrders = filteredOrders.filter(
    (order) => !closedOrders.includes(order.id)
  );


  const handleOrderPress = (order: Order) => {
    setSelectedOrder(order);
    setShowDetails(true);
  };

  // Função para recusar proposta
  const handleRefuseProposal = (orderId: string, proposalId: string) => {
    Alert.alert(
      'Recusar Proposta',
      'Tem certeza que deseja recusar esta proposta? Essa ação não poderá ser desfeita.',
      [
        { text: 'Cancelar', style: 'cancel' },
        {
          text: 'Recusar', style: 'destructive',
          onPress: async () => {
            try {
              // Aqui você pode implementar a chamada da API para recusar proposta
              // await proposalService.rejectProposal(parseInt(proposalId));
              
              setRefusedProposals((prev) => ({
                ...prev,
                [orderId]: [...(prev[orderId] || []), proposalId],
              }));
            } catch (error: any) {
              Alert.alert('Erro', error.message || 'Erro ao recusar proposta');
            }
          }
        }
      ]
    );
  };

  // Função para cliente encerrar/cancelar pedido
  const handleCloseOrder = (orderId: string) => {
    Alert.alert(
      'Encerrar Pedido',
      'Tem certeza que deseja encerrar/cancelar este pedido? Isso encerrará o leilão e não aceitará mais propostas.',
      [
        { text: 'Cancelar', style: 'cancel' },
        {
          text: 'Encerrar', style: 'destructive',
          onPress: async () => {
            try {
              // Aqui você pode implementar a chamada da API para cancelar pedido
              // await orderService.updateOrder(parseInt(orderId), { status: 'cancelled' });
              
              setClosedOrders((prev) => [...prev, orderId]);
            } catch (error: any) {
              Alert.alert('Erro', error.message || 'Erro ao encerrar pedido');
            }
          }
        }
      ]
    );
  };

  const getRankingColor = (ranking: number): string => {
    switch (ranking) {
      case 1: return 'bg-yellow-100 text-yellow-800';
      case 2: return 'bg-gray-100 text-gray-800';
      case 3: return 'bg-orange-100 text-orange-800';
      default: return 'bg-gray-100 text-gray-800';
    }
  };

  const getRankingIcon = (ranking: number): string => {
    switch (ranking) {
      case 1: return '🥇';
      case 2: return '🥈';
      case 3: return '🥉';
      default: return '🏅';
    }
  };

  const getStatusColor = (status: string): string => {
    switch (status) {
      case 'Em andamento': return 'bg-blue-100 text-blue-800';
      case 'Aguardando propostas': return 'bg-yellow-100 text-yellow-800';
      case 'Concluído': return 'bg-green-100 text-green-800';
      case 'Cancelado': return 'bg-red-100 text-red-800';
      default: return 'bg-gray-100 text-gray-800';
    }
  };

  const getPageTitle = () => {
    if (fromLeiloes) {
      return 'Leilões em Andamento';
    }
    return 'Meus Pedidos';
  };

  const getPageSubtitle = () => {
    if (fromLeiloes) {
      return 'Pedidos com status em andamento';
    }
    return 'Acompanhe seus pedidos e propostas recebidas';
  };

  // Loading state
  if (loading) {
    return (
      <View className="flex-1 bg-gray-100 justify-center items-center" style={{ paddingTop: insets.top }}>
        <ActivityIndicator size="large" color="#4f46e5" />
        <Text className="text-gray-600 mt-4">Carregando pedidos...</Text>
      </View>
    );
  }

  // Usuário não autenticado
  if (!user?.id) {
    return (
      <View className="flex-1 bg-gray-100 justify-center items-center p-6" style={{ paddingTop: insets.top }}>
        <Icon name="person-off" size={64} color="#9ca3af" />
        <Text className="text-xl font-semibold text-gray-600 mt-4 mb-2">
          Usuário não autenticado
        </Text>
        <Text className="text-gray-500 text-center">
          Faça login para ver seus pedidos
        </Text>
      </View>
    );
  }

  // Error state
  if (error) {
    return (
      <View className="flex-1 bg-gray-100 justify-center items-center p-6" style={{ paddingTop: insets.top }}>
        <Icon name="error" size={64} color="#ef4444" />
        <Text className="text-xl font-semibold text-gray-600 mt-4 mb-2">
          Erro ao carregar pedidos
        </Text>
        <Text className="text-gray-500 text-center mb-6">
          {error}
        </Text>
        <TouchableOpacity
          className="bg-indigo-600 rounded-lg p-4"
          onPress={fetchOrders}
        >
          <Text className="text-center text-white font-bold text-lg">
            Tentar Novamente
          </Text>
        </TouchableOpacity>
      </View>
    );
  }

  return (
    <ScrollView className="flex-1 bg-gray-100" style={{ paddingTop: insets.top }}>
      <View className="p-6">
        <Text className="text-2xl font-bold mb-6">{getPageTitle()}</Text>
        <Text className="text-gray-600 mb-6">
          {getPageSubtitle()}
        </Text>

        {filteredOrders.map((order) => {
    
          
          return (
            <TouchableOpacity
              key={order.id}
              className="bg-white rounded-xl p-6 shadow-sm mb-4"
              onPress={() => handleOrderPress(order)}
            >
            <View className="flex-row justify-between items-start mb-4">
              <Text className="text-lg font-bold flex-1 mr-4">
                {order.title}
              </Text>
              <View className="flex-row items-center">
                {/* Ícone de leilão ativo */}
                {order.hasActiveAuction && (
                  <View className="bg-orange-100 p-1 rounded-full mr-2">
                    <Icon name="gavel" size={16} color="#f97316" />
                  </View>
                )}
                {/* Ícone de nova demanda */}
                {order.isNewDemand && (
                  <View className="bg-green-100 p-1 rounded-full mr-2">
                    <Icon name="new-releases" size={16} color="#22c55e" />
                  </View>
                )}
                <View className={`px-3 py-1 rounded-full ${getStatusColor(order.status)}`}>
                  <Text className="font-semibold">{order.status}</Text>
                </View>
              </View>
            </View>

            <View className="flex-row items-center mb-4">
              <View className="bg-indigo-100 px-3 py-1 rounded-full">
                <Text className="text-indigo-600">{order.category}</Text>
              </View>
              <Text className="text-gray-500 ml-4">
                Orçamento: {order.budget || 'Não informado'}
              </Text>
            </View>

            <View className="flex-row items-center mb-4">
              <Icon name="location-on" size={16} color="#6b7280" />
              <Text className="text-gray-600 ml-1">{order.location}</Text>
              <View className="flex-row items-center ml-4">
                <Icon name="star" size={16} color="#fbbf24" />
                <Text className="text-gray-600 ml-1">{order.clientRating}</Text>
              </View>
            </View>

            {/* Status das propostas */}
            <View className="bg-blue-50 rounded-lg p-4 mb-4">
              {order.proposals.length > 0 ? (
                <>
                  <Text className="font-semibold mb-2 text-blue-800">
                    {order.proposals.length} {order.proposals.length === 1 ? 'proposta recebida' : 'propostas recebidas'}
                  </Text>
                  <Text className="text-blue-600 text-sm">
                    Clique para ver detalhes e gerenciar propostas
                  </Text>
                </>
              ) : (
                <>
                  <Text className="font-semibold mb-2 text-yellow-800">
                    ⏳ Aguardando propostas...
                  </Text>
                  <Text className="text-yellow-600 text-sm">
                    Nenhuma proposta ainda. Seu pedido está sendo divulgado.
                  </Text>
                </>
              )}
            </View>

            <View className="flex-row justify-between items-center">
              <Text className="text-gray-600">
                Prazo: {order.deadline || 'Não informado'}
              </Text>
              <View className="flex-row items-center">
                <Icon name="visibility" size={20} color="#4f46e5" />
                <Text className="text-indigo-600 ml-1 font-semibold">
                  Ver Detalhes
                </Text>
              </View>
            </View>
          </TouchableOpacity>
          );
        })}

        {filteredOrders.length === 0 && (
          <View className="bg-white rounded-xl p-8 items-center">
            <Icon name="assignment" size={64} color="#9ca3af" />
            <Text className="text-xl font-semibold text-gray-600 mt-4 mb-2">
              Nenhum pedido encontrado
            </Text>
            <Text className="text-gray-500 text-center">
              {selectedCategory 
                ? `Não há pedidos na categoria "${selectedCategory}" no momento.`
                : fromLeiloes 
                  ? 'Não há leilões em andamento no momento.'
                  : 'Você ainda não possui pedidos. Crie seu primeiro pedido!'
              }
            </Text>
          </View>
        )}

        <TouchableOpacity
          className="bg-indigo-600 rounded-lg p-4 mt-6"
          onPress={() => navigation.goBack()}
        >
          <Text className="text-center text-white font-bold text-lg">
            Voltar
          </Text>
        </TouchableOpacity>
      </View>

      {/* Modal de Detalhes */}
      <Modal
        visible={showDetails}
        animationType="slide"
        presentationStyle="pageSheet"
      >
        <View className="flex-1 bg-white" style={{ paddingTop: insets.top }}>
          <View className="flex-row justify-between items-center p-6 border-b border-gray-200">
            <Text className="text-xl font-bold">Detalhes do Pedido</Text>
            <TouchableOpacity onPress={() => setShowDetails(false)}>
              <Icon name="close" size={24} color="#6b7280" />
            </TouchableOpacity>
          </View>

          {selectedOrder && (
            <ScrollView className="flex-1 p-6">
              {/* Informações do Pedido */}
              <View className="bg-gray-50 rounded-xl p-6 mb-6">
                <View className="flex-row items-center mb-4">
                  <Text className="text-xl font-bold flex-1">{selectedOrder.title}</Text>
                  <View className="flex-row items-center">
                    {selectedOrder.hasActiveAuction && (
                      <View className="bg-orange-100 p-2 rounded-full mr-2">
                        <Icon name="gavel" size={20} color="#f97316" />
                      </View>
                    )}
                    {selectedOrder.isNewDemand && (
                      <View className="bg-green-100 p-2 rounded-full mr-2">
                        <Icon name="new-releases" size={20} color="#22c55e" />
                      </View>
                    )}
                  </View>
                </View>
                <View className="flex-row items-center mb-3">
                  <View className="bg-indigo-100 px-3 py-1 rounded-full">
                    <Text className="text-indigo-600">{selectedOrder.category}</Text>
                  </View>
                  <Text className="text-gray-500 ml-4">
                    Orçamento: {selectedOrder.budget}
                  </Text>
                </View>
                <Text className="text-gray-600 mb-3">{selectedOrder.description}</Text>
                <View className="flex-row items-center">
                  <Icon name="location-on" size={16} color="#6b7280" />
                  <Text className="text-gray-600 ml-1">{selectedOrder.location}</Text>
                  <View className="flex-row items-center ml-4">
                    <Icon name="star" size={16} color="#fbbf24" />
                    <Text className="text-gray-600 ml-1">{selectedOrder.clientRating}</Text>
                  </View>
                </View>
              </View>

              {/* Ranking das Propostas */}
              {selectedOrder.proposals.length > 0 ? (
                <>
                  <Text className="text-lg font-bold mb-4">Propostas Recebidas</Text>
                  {selectedOrder.proposals
                    .filter((proposal) => !(refusedProposals[selectedOrder.id]?.includes(proposal.id)))
                    .map((proposal) => (
                      <View
                        key={proposal.id}
                        className="bg-white border border-gray-200 rounded-xl p-4 mb-3"
                      >
                        <View className="flex-row justify-between items-start mb-3">
                          <View className="flex-row items-center">
                            <Text className="text-2xl mr-2">{getRankingIcon(proposal.ranking)}</Text>
                            <View className="flex-row items-center">
                              <Image
                                source={proposal.provider.avatar}
                                className="w-10 h-10 rounded-full mr-3"
                              />
                              <View>
                                <Text className="font-semibold">{proposal.provider.name}</Text>
                                <View className="flex-row items-center">
                                  <Icon name="star" size={14} color="#fbbf24" />
                                  <Text className="text-gray-600 ml-1">{proposal.provider.rating}</Text>
                                </View>
                              </View>
                            </View>
                          </View>
                          <View className={`px-3 py-1 rounded-full ${getRankingColor(proposal.ranking)}`}>
                            <Text className="font-semibold">{proposal.ranking}º lugar</Text>
                          </View>
                        </View>
                        
                        <View className="flex-row justify-between mb-3">
                          <View>
                            <Text className="text-gray-500 text-sm">Valor</Text>
                            <Text className="font-bold text-lg">{proposal.price}</Text>
                          </View>
                          <View>
                            <Text className="text-gray-500 text-sm">Prazo</Text>
                            <Text className="font-bold text-lg">{proposal.deadline}</Text>
                          </View>
                        </View>
                        
                        <Text className="text-gray-600 text-sm">{proposal.description}</Text>
                        
                        <View className="flex-row items-center space-x-4 self-end mt-2">
                          <TouchableOpacity
                            accessibilityLabel="Aceitar proposta"
                            onPress={() => {
                              setShowDetails(false);
                              (navigation as any).navigate('Checkout', { proposal });
                            }}
                          >
                            <View className="bg-green-100 p-2 rounded-full">
                              <Icon name="check-circle" size={28} color="#22c55e" />
                            </View>
                          </TouchableOpacity>
                          <TouchableOpacity
                            accessibilityLabel="Recusar proposta"
                            onPress={() => handleRefuseProposal(selectedOrder.id, proposal.id)}
                          >
                            <View className="bg-red-100 p-2 rounded-full">
                              <Icon name="cancel" size={28} color="#ef4444" />
                            </View>
                          </TouchableOpacity>
                        </View>
                      </View>
                    ))}
                </>
              ) : (
                <View className="bg-yellow-50 rounded-xl p-6 mb-6">
                  <Text className="text-lg font-bold mb-2 text-yellow-800">
                    ⏳ Aguardando propostas...
                  </Text>
                  <Text className="text-yellow-700">
                    Seu pedido ainda não recebeu propostas. Continue aguardando ou considere ajustar os detalhes do pedido.
                  </Text>
                </View>
              )}

              {/* Ícone para cliente encerrar/cancelar pedido */}
              <TouchableOpacity
                className="absolute right-6 top-6 z-10"
                onPress={() => handleCloseOrder(selectedOrder.id)}
                accessibilityLabel="Encerrar pedido"
              >
                <View className="bg-red-100 p-2 rounded-full">
                  <Icon name="stop-circle" size={28} color="#ef4444" />
                </View>
              </TouchableOpacity>
            </ScrollView>
          )}
        </View>
      </Modal>
    </ScrollView>
  );
} 