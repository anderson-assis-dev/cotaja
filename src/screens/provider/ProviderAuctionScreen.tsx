import React, { useState, useEffect } from 'react';
import { View, Text, ScrollView, TouchableOpacity, Modal, Alert, ActivityIndicator, TextInput } from 'react-native';
import { useNavigation, useRoute } from '@react-navigation/native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import Icon from 'react-native-vector-icons/MaterialIcons';
import { useAuth } from '../../contexts/AuthContext';
import { orderService, Order as ApiOrder, Proposal as ApiProposal } from '../../services/api';

// Tipos TypeScript
interface Proposal {
  id: string;
  providerName: string;
  providerRating: number;
  price: string;
  deadline: string;
  description: string;
  ranking: number;
}

interface Auction {
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
  hasMyProposal?: boolean;
  myProposalRanking?: number | null;
  myProposal?: any;
}

// Função para converter dados da API para o formato da interface
const convertApiOrderToAuction = (apiOrder: ApiOrder): Auction => {
  // Converter propostas da API para o formato da interface
  const proposals: Proposal[] = apiOrder.proposals?.map((proposal: ApiProposal, index: number) => ({
    id: proposal.id.toString(),
    providerName: proposal.provider?.name || 'Prestador',
    providerRating: 4.5, // Valor padrão, ajustar conforme necessário
    price: `R$ ${Number(proposal.price || 0).toFixed(2).replace('.', ',')}`,
    deadline: `${proposal.deadline || 0} dias`,
    description: proposal.description || 'Sem descrição',
    ranking: index + 1,
    provider_id: proposal.provider_id, // Adicionar provider_id
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
      insights.push('Esta demanda está sendo divulgada para prestadores');
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

  return {
    id: apiOrder.id.toString(),
    title: apiOrder.title || 'Demanda sem título',
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
};

export default function AuctionScreen() {
  const navigation = useNavigation();
  const route = useRoute();
  const insets = useSafeAreaInsets();
  const [auctions, setAuctions] = useState<Auction[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const { user } = useAuth();

  // Estados para filtros
  const [cepFilter, setCepFilter] = useState('');
  const [categoryFilter, setCategoryFilter] = useState('');
  const [showCategoryAutocomplete, setShowCategoryAutocomplete] = useState(false);
  const [availableCategories, setAvailableCategories] = useState<string[]>([]);
  const [filteredCategories, setFilteredCategories] = useState<string[]>([]);

  // Recebe parâmetros da navegação
  const profileType = (route.params as any)?.profileType || 'provider';
  const clientId = (route.params as any)?.clientId || '1';
  const selectedCategory = (route.params as any)?.selectedCategory;
  const fromSearch = (route.params as any)?.fromSearch || false;

  useEffect(() => {
    const fetchAuctions = async () => {
      try {
        setLoading(true);
        setError(null);

        let params: any = {};
        
        // Aplicar filtro por categoria se selecionada
        if (selectedCategory) {
          params.category = selectedCategory;
        }

        console.log('🔍 Buscando demandas disponíveis com parâmetros:', params);
        
        const response = await orderService.getAvailableOrders(params);
        
        if (response.success) {
          console.log('📦 Dados recebidos da API:', JSON.stringify(response.data, null, 2));
          
          // Verificar se a estrutura está correta
          if (!response.data.data || !Array.isArray(response.data.data)) {
            console.warn('⚠️ Estrutura de dados inesperada:', response.data);
            setAuctions([]);
            return;
          }
          
          const convertedAuctions = response.data.data.map((apiOrder: any, index: number) => {
            console.log(`🔄 Convertendo demanda ${index + 1}:`, {
              id: apiOrder.id,
              title: apiOrder.title,
              budget: apiOrder.budget,
              budgetType: typeof apiOrder.budget,
              deadline: apiOrder.deadline,
              deadlineType: typeof apiOrder.deadline,
              status: apiOrder.status,
              category: apiOrder.category,
              address: apiOrder.address
            });
            
            try {
              return convertApiOrderToAuction(apiOrder);
            } catch (error) {
              console.error(`❌ Erro ao converter demanda ${apiOrder.id}:`, error);
              // Retornar uma demanda padrão em caso de erro
              return {
                id: apiOrder.id?.toString() || '0',
                title: apiOrder.title || 'Demanda sem título',
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
          
          console.log('✅ Demandas carregadas:', convertedAuctions.length);
          setAuctions(convertedAuctions);
        } else {
          throw new Error('Erro ao carregar demandas');
        }
      } catch (error: any) {
        console.error('❌ Erro ao buscar demandas:', error);
        setError(error.message || 'Erro ao carregar demandas');
      } finally {
        setLoading(false);
      }
    };

    if (user?.id) {
      console.log('👤 Usuário autenticado:', { id: user.id, name: user.name });
      fetchAuctions();
    } else {
      console.log('⚠️ Usuário não autenticado, aguardando...');
      setLoading(false);
    }
  }, [selectedCategory, user?.id]);

  // Função para buscar categorias disponíveis
  const fetchAvailableCategories = async () => {
    try {
      const response = await orderService.getAvailableOrders();
      if (response.success && response.data.data) {
        const categories = [...new Set(response.data.data.map((order: any) => order.category))];
        setAvailableCategories(categories);
        console.log('📋 Categorias disponíveis:', categories);
      }
    } catch (error) {
      console.error('❌ Erro ao buscar categorias:', error);
    }
  };

  // Função para filtrar categorias baseado no input
  const filterCategories = (input: string) => {
    if (!input.trim()) {
      setFilteredCategories([]);
      setShowCategoryAutocomplete(false);
      return;
    }

    const filtered = availableCategories.filter(category =>
      category.toLowerCase().includes(input.toLowerCase())
    );
    setFilteredCategories(filtered);
    setShowCategoryAutocomplete(true);
  };

  // Função para selecionar categoria
  const selectCategory = (category: string) => {
    setCategoryFilter(category);
    setShowCategoryAutocomplete(false);
  };

  // Função para limpar filtros
  const clearFilters = () => {
    setCepFilter('');
    setCategoryFilter('');
    setShowCategoryAutocomplete(false);
  };

  // Carregar categorias disponíveis
  useEffect(() => {
    fetchAvailableCategories();
  }, []);

  // Aplicar filtros quando mudar
  useEffect(() => {
    const applyFilters = async () => {
      try {
        setLoading(true);
        setError(null);

        let params: any = {};
        
        // Aplicar filtro por categoria
        if (categoryFilter) {
          params.category = categoryFilter;
        }

        // Aplicar filtro por CEP
        if (cepFilter && cepFilter.length >= 5) {
          params.cep = cepFilter;
        }

        console.log('🔍 Aplicando filtros:', params);
        
        const response = await orderService.getAvailableOrders(params);
        
        if (response.success) {
          console.log('📦 Dados filtrados recebidos:', response.data.data?.length || 0);
          
          if (!response.data.data || !Array.isArray(response.data.data)) {
            setAuctions([]);
            return;
          }
          
          const convertedAuctions = response.data.data.map((apiOrder: any) => {
            try {
              return convertApiOrderToAuction(apiOrder);
            } catch (error) {
              console.error(`❌ Erro ao converter demanda ${apiOrder.id}:`, error);
              return {
                id: apiOrder.id?.toString() || '0',
                title: apiOrder.title || 'Demanda sem título',
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
          
          setAuctions(convertedAuctions);
        } else {
          throw new Error('Erro ao carregar demandas');
        }
      } catch (error: any) {
        console.error('❌ Erro ao aplicar filtros:', error);
        setError(error.message || 'Erro ao aplicar filtros');
      } finally {
        setLoading(false);
      }
    };

    if (user?.id) {
      applyFilters();
    }
  }, [categoryFilter, cepFilter, user?.id]);

  // Filtra as demandas conforme o tipo de usuário
  let filteredAuctions = auctions; // Para providers, não filtrar por clientId

  // Aplica filtro por categoria se selecionada
  if (selectedCategory) {
    filteredAuctions = filteredAuctions.filter(a => a.category === selectedCategory);
  }

  // Filtra apenas demandas abertas ou em andamento
  filteredAuctions = filteredAuctions.filter(
    (auction) => auction.status === 'Aguardando propostas' || auction.status === 'Em andamento'
  );

  // Adicionar informações sobre a proposta do provider logado
  filteredAuctions = filteredAuctions.map(auction => {
    const myProposal = auction.proposals?.find((proposal: any) => proposal.provider_id === user?.id);
    return {
      ...auction,
      myProposal,
      hasMyProposal: !!myProposal,
      myProposalRanking: myProposal ? auction.proposals?.indexOf(myProposal) + 1 : null
    };
  });

  console.log('🔍 Filtros aplicados:', {
    totalAuctions: auctions.length,
    filteredAuctions: filteredAuctions.length,
    selectedCategory,
    profileType
  });

  const handleAuctionPress = (auction: Auction) => {
    // setSelectedAuction(auction); // This state is no longer needed
    // setShowDetails(true); // This state is no longer needed
    // Navegar para a tela de envio de proposta com os dados da demanda
    (navigation as any).navigate('SendProposal', { demand: auction });
  };

  const handleSendProposal = (auction: Auction) => {
    // setShowDetails(false); // This state is no longer needed
    // Navegar para a tela de envio de proposta com os dados da demanda
    (navigation as any).navigate('SendProposal', { demand: auction });
  };

  // Função para recusar proposta
  const handleRefuseProposal = (auctionId: string, proposalId: string) => {
    Alert.alert(
      'Recusar Proposta',
      'Tem certeza que deseja recusar esta proposta? Essa ação não poderá ser desfeita.',
      [
        { text: 'Cancelar', style: 'cancel' },
        {
          text: 'Recusar', style: 'destructive',
          onPress: () => {
            // TODO: Implementar lógica de recusa de proposta na API
            Alert.alert('Recusar Proposta', 'Funcionalidade de recusa de proposta ainda não implementada.');
          }
        }
      ]
    );
  };

  // Função para cliente encerrar/cancelar demanda
  const handleCloseAuction = (auctionId: string) => {
    Alert.alert(
      'Encerrar Demanda',
      'Tem certeza que deseja encerrar/cancelar esta demanda? Isso encerrará o leilão e não aceitará mais propostas.',
      [
        { text: 'Cancelar', style: 'cancel' },
        {
          text: 'Encerrar', style: 'destructive',
          onPress: () => {
            // TODO: Implementar lógica de encerramento de demanda na API
            Alert.alert('Encerrar Demanda', 'Funcionalidade de encerramento de demanda ainda não implementada.');
          }
        }
      ]
    );
  };

  // Função para prestador cancelar proposta
  const handleCancelProposal = (auctionId: string) => {
    Alert.alert(
      'Cancelar Proposta',
      'Tem certeza que deseja cancelar sua proposta e sair deste leilão?',
      [
        { text: 'Não', style: 'cancel' },
        {
          text: 'Sim', style: 'destructive',
          onPress: () => {
            // TODO: Implementar lógica de cancelamento de proposta na API
            Alert.alert('Cancelar Proposta', 'Funcionalidade de cancelamento de proposta ainda não implementada.');
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

  const getPageTitle = () => {
    if (fromSearch) {
      return selectedCategory ? `Demandas - ${selectedCategory}` : 'Todas as Demandas';
    }
    return 'Leilões em Andamento';
  };

  const getPageSubtitle = () => {
    if (fromSearch) {
      return selectedCategory 
        ? `Demandas disponíveis na categoria ${selectedCategory}`
        : 'Demandas disponíveis em todas as categorias';
    }
    return 'Demandas da sua região e categoria com propostas recebidas';
  };

  if (loading && auctions.length === 0) {
    return (
      <View className="flex-1 items-center justify-center bg-gray-100">
        <ActivityIndicator size="large" color="#4f46e5" />
        <Text className="text-lg text-gray-600 mt-4">Carregando demandas...</Text>
      </View>
    );
  }

  if (error) {
    return (
      <View className="flex-1 items-center justify-center bg-gray-100">
        <Text className="text-lg text-red-600">{error}</Text>
        <TouchableOpacity
          className="bg-indigo-600 rounded-lg p-4 mt-6"
          onPress={() => navigation.goBack()}
        >
          <Text className="text-center text-white font-bold text-lg">
            Voltar
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

        {/* Filtros */}
        <View className="bg-white rounded-xl p-4 mb-6 shadow-sm">
          <Text className="text-lg font-semibold mb-4 text-gray-800">Filtros</Text>
          
          {/* Filtro por CEP */}
          <View className="mb-4">
            <Text className="text-sm font-medium text-gray-700 mb-2">CEP</Text>
            <View className="flex-row items-center">
              <Icon name="location-on" size={20} color="#6b7280" style={{ marginRight: 8 }} />
              <TextInput
                className="flex-1 border border-gray-300 rounded-lg px-3 py-2 text-gray-800"
                placeholder="Digite o CEP (ex: 40275190)"
                value={cepFilter}
                onChangeText={setCepFilter}
                keyboardType="numeric"
                maxLength={8}
              />
            </View>
            <Text className="text-xs text-gray-500 mt-1">
              Busca demandas em um raio próximo ao CEP informado
            </Text>
          </View>

          {/* Filtro por Categoria */}
          <View className="mb-4">
            <Text className="text-sm font-medium text-gray-700 mb-2">Categoria</Text>
            <View className="relative">
              <View className="flex-row items-center">
                <Icon name="category" size={20} color="#6b7280" style={{ marginRight: 8 }} />
                <TextInput
                  className="flex-1 border border-gray-300 rounded-lg px-3 py-2 text-gray-800"
                  placeholder="Digite para buscar categoria..."
                  value={categoryFilter}
                  onChangeText={(text) => {
                    setCategoryFilter(text);
                    filterCategories(text);
                  }}
                  onFocus={() => {
                    if (categoryFilter) {
                      filterCategories(categoryFilter);
                    }
                  }}
                />
                {categoryFilter && (
                  <TouchableOpacity
                    onPress={() => setCategoryFilter('')}
                    className="ml-2 p-2"
                  >
                    <Icon name="clear" size={20} color="#6b7280" />
                  </TouchableOpacity>
                )}
              </View>

              {/* Autocomplete de categorias */}
              {showCategoryAutocomplete && filteredCategories.length > 0 && (
                <View className="absolute top-full left-0 right-0 bg-white border border-gray-300 rounded-lg mt-1 z-10 max-h-40">
                  <ScrollView 
                    showsVerticalScrollIndicator={false}
                    nestedScrollEnabled={true}
                  >
                    {filteredCategories.map((item) => (
                      <TouchableOpacity
                        key={item}
                        className="px-4 py-3 border-b border-gray-100"
                        onPress={() => selectCategory(item)}
                      >
                        <Text className="text-gray-800">{item}</Text>
                      </TouchableOpacity>
                    ))}
                  </ScrollView>
                </View>
              )}
            </View>
          </View>

          {/* Botão Limpar Filtros */}
          {(cepFilter || categoryFilter) && (
            <TouchableOpacity
              onPress={clearFilters}
              className="bg-gray-200 rounded-lg px-4 py-2 self-start"
            >
              <Text className="text-gray-700 font-medium">Limpar Filtros</Text>
            </TouchableOpacity>
          )}
        </View>

        {filteredAuctions.map((auction) => (
          <TouchableOpacity
            key={auction.id}
            className="bg-white rounded-xl p-6 shadow-sm mb-4"
            onPress={() => handleAuctionPress(auction)}
          >
            <View className="flex-row justify-between items-start mb-4">
            <Text className="text-base font-bold flex-1 mr-4">
                {auction.title}
              </Text>
            </View>
            <View className="flex-row justify-between items-start mb-4">
           
              <View className="flex-row items-center">
                {/* Status da minha proposta */}
                {auction.hasMyProposal && (
                  <View className="bg-blue-100 px-2 py-1 rounded-full mr-2">
                    <Text className="text-blue-600 font-semibold text-xs">
                      {auction.myProposalRanking}º lugar
                    </Text>
                  </View>
                )}
                {/* Ícone de leilão ativo */}
                {auction.hasActiveAuction && (
                  <View className="bg-orange-100 p-1 rounded-full mr-2">
                    <Icon name="gavel" size={14} color="#f97316" />
                  </View>
                )}
                {/* Ícone de nova demanda */}
                {auction.isNewDemand && (
                  <View className="bg-green-100 p-1 rounded-full mr-2">
                    <Icon name="new-releases" size={14} color="#22c55e" />
                  </View>
                )}
                <View className="bg-green-100 px-2 py-1 rounded-full">
                  <Text className="text-green-600 text-xs">{auction.status}</Text>
                </View>
              </View>
            </View>

            <View className="flex-row items-center mb-4">
              <View className="bg-indigo-100 px-2 py-1 rounded-full">
                <Text className="text-indigo-600 text-xs">{auction.category}</Text>
              </View>
              <Text className="text-gray-500 ml-3 text-sm">
                Orçamento: {auction.budget}
              </Text>
            </View>

            <View className="flex-row items-center mb-4">
              <Icon name="location-on" size={14} color="#6b7280" />
              <Text className="text-gray-600 ml-1 text-sm">{auction.location}</Text>
              <View className="flex-row items-center ml-3">
                <Icon name="star" size={14} color="#fbbf24" />
                <Text className="text-gray-600 ml-1 text-sm">{auction.clientRating}</Text>
              </View>
            </View>

            {/* Status das propostas */}
            <View className="bg-blue-50 rounded-lg p-3 mb-4">
              {auction.proposals.length > 0 ? (
                <>
                  <Text className="font-semibold mb-2 text-blue-800 text-sm">
                    {auction.proposals.length} {auction.proposals.length === 1 ? 'proposta recebida' : 'propostas recebidas'}
                  </Text>
                  {auction.hasMyProposal ? (
                    <Text className="text-blue-600 text-xs">
                      Sua proposta está em {auction.myProposalRanking}º lugar. Clique para ver detalhes.
                    </Text>
                  ) : (
                    <Text className="text-blue-600 text-xs">
                      Clique para ver detalhes e enviar sua proposta
                    </Text>
                  )}
                </>
              ) : (
                <>
                  <Text className="font-semibold mb-2 text-green-800 text-sm">
                    🎯 Seja o primeiro a enviar uma proposta!
                  </Text>
                  <Text className="text-green-600 text-xs">
                    Nenhuma proposta ainda. Aproveite esta oportunidade!
                  </Text>
                </>
              )}
            </View>

            <View className="flex-row justify-between items-center">
              <Text className="text-gray-600 text-sm">
                Prazo: {auction.deadline}
              </Text>
              <View className="flex-row items-center">
                <Icon name="visibility" size={18} color="#4f46e5" />
                <Text className="text-indigo-600 ml-1 font-semibold text-sm">
                  {auction.hasMyProposal ? 'Ver Ranking' : 'Ver Detalhes'}
                </Text>
              </View>
            </View>
          </TouchableOpacity>
        ))}

        {filteredAuctions.length === 0 && (
          <View className="bg-white rounded-xl p-8 items-center">
            <Icon name="search-off" size={64} color="#9ca3af" />
            <Text className="text-xl font-semibold text-gray-600 mt-4 mb-2">
              Nenhuma demanda encontrada
            </Text>
            <Text className="text-gray-500 text-center">
              {selectedCategory 
                ? `Não há demandas disponíveis na categoria "${selectedCategory}" no momento.`
                : 'Não há demandas disponíveis no momento.'
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
    </ScrollView>
  );
} 