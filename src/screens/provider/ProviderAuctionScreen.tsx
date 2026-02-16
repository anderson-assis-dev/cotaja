import React, { useState, useEffect } from 'react';
import { View, Text, ScrollView, TouchableOpacity, Alert, ActivityIndicator, TextInput, StyleSheet } from 'react-native';
import { useNavigation, useRoute, NavigationProp, RouteProp } from '@react-navigation/native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import Icon from 'react-native-vector-icons/MaterialIcons';
import { Trophy, Target, Hourglass } from 'lucide-react-native';
import { useAuth } from '../../contexts/AuthContext';
import { orderService, Order as ApiOrder, Proposal as ApiProposal } from '../../services/api';
import { useStatusBarOverlay } from '../../hooks/useStatusBarOverlay';
import { StatusBarOverlay } from '../../components/StatusBarOverlay';
import { formatPrice } from '../../utils/formatters';

// Navigation types
type RootStackParamList = {
  SendProposal: { demand: Auction };
  [key: string]: any;
};

type AuctionScreenNavigationProp = NavigationProp<RootStackParamList>;
type AuctionScreenRouteProp = RouteProp<any, any>;

// TypeScript interfaces
interface Proposal {
  id: string;
  providerName: string;
  providerRating: number;
  price: string;
  deadline: string;
  description: string;
  ranking: number;
  provider_id?: string | number; // Added provider_id
  created_at?: string;
  status?: string;
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
  myProposal?: Proposal;
  attachments?: any[];
}

interface RouteParams {
  profileType?: string;
  clientId?: string;
  selectedCategory?: string;
  fromSearch?: boolean;
}

// Function to convert API data to interface format
const convertApiOrderToAuction = (apiOrder: ApiOrder): Auction => {
  // Convert API proposals to interface format
  const proposals: Proposal[] = apiOrder.proposals?.map((proposal: ApiProposal, index: number) => ({
    id: proposal.id.toString(),
    providerName: proposal.provider?.name || 'Prestador',
    providerRating: 4.5, // Default value, adjust as needed
    price: `R$ ${formatPrice(Number(proposal.price || 0))}`,
    deadline: `${proposal.deadline || 0} dias`,
    description: proposal.description || 'Sem descrição',
    ranking: index + 1,
    provider_id: proposal.provider_id, // Add provider_id
    created_at: proposal.created_at || undefined,
    status: proposal.status || 'pending',
  })) || [];

  // Determine if has active auction
  const hasActiveAuction = !!(apiOrder.auction_started_at && apiOrder.auction_ends_at &&
    new Date() >= new Date(apiOrder.auction_started_at) &&
    new Date() <= new Date(apiOrder.auction_ends_at));

  // Determine if is new demand (recent order without proposals)
  const isNewDemand = apiOrder.status === 'open' && proposals.length === 0;

  // Convert API status to Portuguese
  const getStatusInPortuguese = (status: string): string => {
    switch (status) {
      case 'open': return 'Aguardando propostas';
      case 'in_progress': return 'Em andamento';
      case 'completed': return 'Concluído';
      case 'cancelled': return 'Cancelado';
      default: return 'Aguardando propostas';
    }
  };

  // Generate insights based on data
  const generateInsights = (apiOrder: ApiOrder, proposals: Proposal[]): string[] => {
    const insights: string[] = [];

    if (proposals.length > 0) {
      const avgPrice = proposals.reduce((sum, p) => {
        const cleaned = p.price.replace('R$ ', '').replace(/\./g, '').replace(',', '.');
        return sum + (parseFloat(cleaned) || 0);
      }, 0) / proposals.length;
      insights.push(`O orçamento médio da categoria é R$ ${formatPrice(avgPrice)}`);

      const avgDeadline = proposals.reduce((sum, p) => sum + parseInt(p.deadline), 0) / proposals.length;
      insights.push(`Prazo médio de execução: ${avgDeadline} dias`);
    } else {
      insights.push('Nenhuma proposta recebida ainda');
      insights.push('Esta demanda está sendo divulgada para prestadores');
    }

    return insights;
  };

  // Handle budget - can come as string or number
  const budgetValue = typeof apiOrder.budget === 'string'
    ? parseFloat(apiOrder.budget)
    : (apiOrder.budget || 0);

  // Handle deadline - can come as string or number
  const deadlineValue = typeof apiOrder.deadline === 'string'
    ? parseInt(apiOrder.deadline)
    : (apiOrder.deadline || 0);

  return {
    id: apiOrder.id.toString(),
    title: apiOrder.title || 'Demanda sem título',
    category: apiOrder.category || 'Sem categoria',
    budget: `R$ ${formatPrice(budgetValue)}`,
    deadline: `${deadlineValue} dias`,
    status: getStatusInPortuguese(apiOrder.status || 'open'),
    description: apiOrder.description || 'Sem descrição',
    location: apiOrder.address || 'Local não informado',
    clientRating: 4.8, // Default value, adjust as needed
    proposals,
    insights: generateInsights(apiOrder, proposals),
    clientId: apiOrder.client_id?.toString() || '0',
    hasActiveAuction,
    isNewDemand,
    attachments: (() => {
      let atts = apiOrder.attachments;
      if (typeof atts === 'string') {
        try { atts = JSON.parse(atts); } catch (e) { atts = []; }
      }
      return Array.isArray(atts) ? atts : [];
    })(),
  };
};

export default function AuctionScreen() {
  const navigation = useNavigation<AuctionScreenNavigationProp>();
  const route = useRoute<AuctionScreenRouteProp>();
  const insets = useSafeAreaInsets();
  const { showStatusBarOverlay, statusBarOpacity, handleScroll } = useStatusBarOverlay();
  const [auctions, setAuctions] = useState<Auction[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const { user } = useAuth();

  // States for filters
  const [cepFilter, setCepFilter] = useState('');
  const [categoryFilter, setCategoryFilter] = useState('');
  const [showCategoryAutocomplete, setShowCategoryAutocomplete] = useState(false);
  const [availableCategories, setAvailableCategories] = useState<string[]>([]);
  const [filteredCategories, setFilteredCategories] = useState<string[]>([]);

  // Receive navigation parameters
  const routeParams = route.params as RouteParams | undefined;
  const profileType = routeParams?.profileType || 'provider';
  const clientId = routeParams?.clientId || '1';
  const selectedCategory = routeParams?.selectedCategory;
  const fromSearch = routeParams?.fromSearch || false;

  useEffect(() => {
    const fetchAuctions = async () => {
      try {
        setLoading(true);
        setError(null);

        let params: Record<string, any> = {};

        // Apply category filter if selected
        if (selectedCategory) {
          params.category = selectedCategory;
        }

        console.log('🔍 Buscando demandas disponíveis com parâmetros:', params);

        const response = await orderService.getAvailableOrders(params);

        if (response.success) {
          console.log('📦 Dados recebidos da API:', JSON.stringify(response.data, null, 2));

          // Check if structure is correct
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
              address: apiOrder.address,
              attachments: apiOrder.attachments,
              attachmentsType: typeof apiOrder.attachments,
              attachmentsIsArray: Array.isArray(apiOrder.attachments),
              attachmentsLength: Array.isArray(apiOrder.attachments) ? apiOrder.attachments.length : 'N/A'
            });

            try {
              return convertApiOrderToAuction(apiOrder);
            } catch (error) {
              console.error(`❌ Erro ao converter demanda ${apiOrder.id}:`, error);
              // Return default demand in case of error
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
              } as Auction;
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

  // Function to fetch available categories
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

  // Function to filter categories based on input
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

  // Function to select category
  const selectCategory = (category: string) => {
    setCategoryFilter(category);
    setShowCategoryAutocomplete(false);
  };

  // Function to format CEP
  const formatCep = (value: string) => {
    // Remove non-numeric characters
    const numbers = value.replace(/[^0-9]/g, '');
    // Apply CEP mask (00000-000)
    if (numbers.length <= 5) {
      return numbers;
    } else {
      return numbers.substring(0, 5) + '-' + numbers.substring(5, 8);
    }
  };

  // Function to clear filters
  const clearFilters = () => {
    setCepFilter('');
    setCategoryFilter('');
    setShowCategoryAutocomplete(false);
  };

  // Load available categories
  useEffect(() => {
    fetchAvailableCategories();
  }, []);

  // Apply filters when changed
  useEffect(() => {
    const applyFilters = async () => {
      try {
        setLoading(true);
        setError(null);

        let params: Record<string, any> = {};

        // Apply category filter
        if (categoryFilter) {
          params.category = categoryFilter;
        }

        // Apply CEP filter
        if (cepFilter && cepFilter.length >= 5) {
          // Clean CEP (remove non-numeric characters)
          const cleanCep = cepFilter.replace(/[^0-9]/g, '');
          if (cleanCep.length >= 5) {
            params.cep = cleanCep;
          }
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
              } as Auction;
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

  // Filter demands according to user type
  let filteredAuctions = auctions; // For providers, don't filter by clientId

  // Filter only open or in progress demands
  filteredAuctions = filteredAuctions.filter(
    (auction) => auction.status === 'Aguardando propostas' || auction.status === 'Em andamento'
  );

  // Add information about logged provider's proposal
  filteredAuctions = filteredAuctions.map(auction => {
    const myProposal = auction.proposals?.find((proposal: Proposal) =>
      proposal.provider_id?.toString() === user?.id?.toString()
    );
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
    // Navigate to proposal sending screen with demand data
    navigation.navigate('SendProposal', { demand: auction });
  };

  const handleSendProposal = (auction: Auction) => {
    // Navigate to proposal sending screen with demand data
    navigation.navigate('SendProposal', { demand: auction });
  };

  // Function to refuse proposal
  const handleRefuseProposal = (auctionId: string, proposalId: string) => {
    Alert.alert(
      'Recusar Proposta',
      'Tem certeza que deseja recusar esta proposta? Essa ação não poderá ser desfeita.',
      [
        { text: 'Cancelar', style: 'cancel' },
        {
          text: 'Recusar', style: 'destructive',
          onPress: () => {
            // TODO: Implement proposal refusal logic in API
            Alert.alert('Recusar Proposta', 'Funcionalidade de recusa de proposta ainda não implementada.');
          }
        }
      ]
    );
  };

  // Function for client to close/cancel demand
  const handleCloseAuction = (auctionId: string) => {
    Alert.alert(
      'Encerrar Demanda',
      'Tem certeza que deseja encerrar/cancelar esta demanda? Isso encerrará o leilão e não aceitará mais propostas.',
      [
        { text: 'Cancelar', style: 'cancel' },
        {
          text: 'Encerrar', style: 'destructive',
          onPress: () => {
            // TODO: Implement demand closure logic in API
            Alert.alert('Encerrar Demanda', 'Funcionalidade de encerramento de demanda ainda não implementada.');
          }
        }
      ]
    );
  };

  // Function for provider to cancel proposal
  const handleCancelProposal = (auctionId: string) => {
    Alert.alert(
      'Cancelar Proposta',
      'Tem certeza que deseja cancelar sua proposta e sair deste leilão?',
      [
        { text: 'Não', style: 'cancel' },
        {
          text: 'Sim', style: 'destructive',
          onPress: () => {
            // TODO: Implement proposal cancellation logic in API
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

  // getRankingIcon replaced by Lucide Trophy icons in JSX

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
      <View style={styles.loadingContainer}>
        <ActivityIndicator size="large" color="#4f46e5" />
        <Text style={styles.loadingText}>Carregando demandas...</Text>
      </View>
    );
  }

  if (error) {
    return (
      <View style={styles.errorContainer}>
        <Text style={styles.errorText}>{error}</Text>
        <TouchableOpacity
          style={styles.backButton}
          onPress={() => navigation.goBack()}
        >
          <Text style={styles.backButtonText}>
            Voltar
          </Text>
        </TouchableOpacity>
      </View>
    );
  }

  return (
    <View style={styles.container}>
      <ScrollView
        style={[styles.scrollView, { paddingTop: insets.top }]}
        onScroll={handleScroll}
        scrollEventThrottle={16}
        contentContainerStyle={{ paddingBottom: insets.bottom}}
      >
      <View style={styles.content}>
        <Text style={styles.title}>{getPageTitle()}</Text>
        <Text style={styles.subtitle}>
          {getPageSubtitle()}
        </Text>

        {/* Filtros */}
        <View style={styles.filtersCard}>
          <Text style={styles.filtersTitle}>Filtros</Text>

          {/* Filtro por CEP */}
          <View style={styles.filterSection}>
            <Text style={styles.filterLabel}>CEP</Text>
            <View style={styles.filterInputContainer}>
              <Icon name="location-on" size={20} color="#6b7280" style={styles.iconWithMargin} />
                <TextInput
                  style={styles.filterInput}
                  placeholder="Digite o CEP (ex: 40275-190)"
                  value={cepFilter}
                  onChangeText={(text) => setCepFilter(formatCep(text))}
                  keyboardType="numeric"
                  maxLength={9}
                />
            </View>
            <Text style={styles.filterHint}>
              Busca demandas em um raio próximo ao CEP informado
            </Text>
          </View>

          {/* Filtro por Categoria */}
          <View style={styles.filterSection}>
            <Text style={styles.filterLabel}>Categoria</Text>
            <View style={styles.categoryFilterContainer}>
              <View style={styles.filterInputContainer}>
                <Icon name="category" size={20} color="#6b7280" style={styles.iconWithMargin} />
                <TextInput
                  style={styles.filterInput}
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
                    style={styles.clearButton}
                  >
                    <Icon name="clear" size={20} color="#6b7280" />
                  </TouchableOpacity>
                )}
              </View>

              {/* Autocomplete de categorias */}
              {showCategoryAutocomplete && filteredCategories.length > 0 && (
                <View style={styles.autocompleteContainer}>
                  <ScrollView
                    showsVerticalScrollIndicator={false}
                    nestedScrollEnabled={true}
                  >
                    {filteredCategories.map((item) => (
                      <TouchableOpacity
                        key={item}
                        style={styles.autocompleteItem}
                        onPress={() => selectCategory(item)}
                      >
                        <Text style={styles.autocompleteText}>{item}</Text>
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
              style={styles.clearFiltersButton}
            >
              <Text style={styles.clearFiltersText}>Limpar Filtros</Text>
            </TouchableOpacity>
          )}
        </View>

        {filteredAuctions.map((auction) => (
          <TouchableOpacity
            key={auction.id}
            style={styles.auctionCard}
            onPress={() => handleAuctionPress(auction)}
          >
            <View style={styles.auctionHeader}>
            <Text style={styles.auctionTitle}>
                {auction.title}
              </Text>
            </View>
            <View style={styles.auctionStatusRow}>

              <View style={styles.statusContainer}>
                {/* Status da minha proposta */}
                {auction.hasMyProposal && (
                  <View style={styles.myProposalBadge}>
                    <Text style={styles.myProposalText}>
                      {auction.myProposalRanking}º lugar
                    </Text>
                  </View>
                )}
                {/* Ícone de leilão ativo */}
                {auction.hasActiveAuction && (
                  <View style={styles.activeAuctionBadge}>
                    <Icon name="gavel" size={14} color="#f97316" />
                  </View>
                )}
                {/* Ícone de nova demanda */}
                {auction.isNewDemand && (
                  <View style={styles.newDemandBadge}>
                    <Icon name="new-releases" size={14} color="#22c55e" />
                  </View>
                )}
                <View style={styles.statusBadge}>
                  <Text style={styles.statusText}>{auction.status}</Text>
                </View>
              </View>
            </View>

            <View style={styles.auctionMeta}>
              <View style={styles.categoryBadge}>
                <Text style={styles.categoryText}>{auction.category}</Text>
              </View>
              <Text style={styles.budgetText}>
                Orçamento: {auction.budget}
              </Text>
            </View>

            <View style={styles.locationRatingRow}>
              <Icon name="location-on" size={14} color="#6b7280" />
              <Text style={styles.locationText}>{auction.location}</Text>
            </View>

            {/* Status das propostas */}
            <View style={styles.statusProposalsContainer}>
              {auction.proposals.length > 0 ? (
                <>
                  <Text style={styles.statusProposalsTitle}>
                    {auction.proposals.length} {auction.proposals.length === 1 ? 'proposta recebida' : 'propostas recebidas'}
                  </Text>
                  {auction.hasMyProposal ? (
                    <Text style={styles.statusProposalsText}>
                      Sua proposta está em {auction.myProposalRanking}º lugar. Clique para ver detalhes.
                    </Text>
                  ) : (
                    <Text style={styles.statusProposalsText}>
                      Clique para ver detalhes e enviar sua proposta
                    </Text>
                  )}
                </>
              ) : (
                <>
                  <View style={{ flexDirection: 'row', alignItems: 'center', gap: 6 }}>
                    <Target size={18} color="#059669" />
                    <Text style={styles.statusProposalsTitleNew}>
                      Seja o primeiro a enviar uma proposta!
                    </Text>
                  </View>
                  <Text style={styles.statusProposalsTextNew}>
                    Nenhuma proposta ainda. Aproveite esta oportunidade!
                  </Text>
                </>
              )}
            </View>

            <View style={styles.footerRow}>
              <Text style={styles.deadlineText}>
                Prazo: {auction.deadline}
              </Text>
              <View style={styles.viewDetailsContainer}>
                <Icon name="visibility" size={18} color="#4f46e5" />
                <Text style={styles.viewDetailsText}>
                  {auction.hasMyProposal ? 'Ver Ranking' : 'Ver Detalhes'}
                </Text>
              </View>
            </View>
          </TouchableOpacity>
        ))}

        {filteredAuctions.length === 0 && (
          <View style={styles.emptyStateContainer}>
            <Icon name="search-off" size={64} color="#9ca3af" />
            <Text style={styles.emptyStateTitle}>
              Nenhuma demanda encontrada
            </Text>
            <Text style={styles.emptyStateText}>
              {selectedCategory
                ? `Não há demandas disponíveis na categoria "${selectedCategory}" no momento.`
                : 'Não há demandas disponíveis no momento.'
              }
            </Text>
          </View>
        )}

        <TouchableOpacity
          style={styles.backButtonBottom}
          onPress={() => navigation.goBack()}
        >
          <Text style={styles.backButtonBottomText}>
            Voltar
          </Text>
        </TouchableOpacity>
      </View>
      </ScrollView>

      {/* Status Bar Overlay */}
      <StatusBarOverlay show={showStatusBarOverlay} opacity={statusBarOpacity} />
    </View>
  );
}

// StyleSheet definitions
const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#f8fafc',
  },
  scrollView: {
    flex: 1,
  },
  content: {
    padding: 16,
  },
  loadingContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    backgroundColor: '#f8fafc',
  },
  loadingText: {
    marginTop: 12,
    fontSize: 16,
    color: '#6b7280',
  },
  errorContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    padding: 16,
    backgroundColor: '#f8fafc',
  },
  errorText: {
    fontSize: 16,
    color: '#ef4444',
    textAlign: 'center',
    marginBottom: 16,
  },
  title: {
    fontSize: 24,
    fontWeight: 'bold',
    color: '#1f2937',
    marginBottom: 8,
  },
  subtitle: {
    fontSize: 16,
    color: '#6b7280',
    marginBottom: 24,
  },
  filtersCard: {
    backgroundColor: 'white',
    borderRadius: 12,
    padding: 16,
    marginBottom: 16,
    shadowColor: '#000',
    shadowOffset: {
      width: 0,
      height: 2,
    },
    shadowOpacity: 0.1,
    shadowRadius: 3.84,
    elevation: 5,
  },
  filtersTitle: {
    fontSize: 18,
    fontWeight: '600',
    color: '#1f2937',
    marginBottom: 16,
  },
  filterSection: {
    marginBottom: 16,
  },
  filterLabel: {
    fontSize: 14,
    fontWeight: '500',
    color: '#374151',
    marginBottom: 8,
  },
  filterInputContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    borderWidth: 1,
    borderColor: '#d1d5db',
    borderRadius: 8,
    paddingHorizontal: 12,
    paddingVertical: 8,
    backgroundColor: 'white',
  },
  filterInput: {
    flex: 1,
    fontSize: 16,
    color: '#1f2937',
  },
  filterHint: {
    fontSize: 12,
    color: '#6b7280',
    marginTop: 4,
  },
  categoryFilterContainer: {
    position: 'relative',
  },
  clearButton: {
    padding: 4,
  },
  autocompleteContainer: {
    position: 'absolute',
    top: '100%',
    left: 0,
    right: 0,
    maxHeight: 200,
    backgroundColor: 'white',
    borderWidth: 1,
    borderColor: '#d1d5db',
    borderTopWidth: 0,
    borderBottomLeftRadius: 8,
    borderBottomRightRadius: 8,
    zIndex: 1000,
    shadowColor: '#000',
    shadowOffset: {
      width: 0,
      height: 2,
    },
    shadowOpacity: 0.25,
    shadowRadius: 3.84,
    elevation: 5,
  },
  autocompleteItem: {
    paddingHorizontal: 16,
    paddingVertical: 12,
    borderBottomWidth: 1,
    borderBottomColor: '#e5e7eb',
  },
  autocompleteText: {
    fontSize: 14,
    color: '#374151',
  },
  clearFiltersButton: {
    backgroundColor: '#f3f4f6',
    paddingVertical: 8,
    paddingHorizontal: 16,
    borderRadius: 6,
    alignSelf: 'flex-start',
  },
  clearFiltersText: {
    fontSize: 14,
    color: '#6b7280',
    fontWeight: '500',
  },
  auctionCard: {
    backgroundColor: 'white',
    borderRadius: 12,
    padding: 16,
    marginBottom: 16,
    shadowColor: '#000',
    shadowOffset: {
      width: 0,
      height: 2,
    },
    shadowOpacity: 0.1,
    shadowRadius: 3.84,
    elevation: 5,
  },
  auctionHeader: {
    marginBottom: 12,
  },
  auctionTitle: {
    fontSize: 18,
    fontWeight: '600',
    color: '#1f2937',
  },
  auctionStatusRow: {
    marginBottom: 12,
  },
  statusContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    flexWrap: 'wrap',
  },
  myProposalBadge: {
    backgroundColor: '#fef3c7',
    paddingHorizontal: 8,
    paddingVertical: 4,
    borderRadius: 12,
    marginRight: 8,
    marginBottom: 4,
  },
  myProposalText: {
    fontSize: 12,
    color: '#92400e',
    fontWeight: '500',
  },
  activeAuctionBadge: {
    backgroundColor: '#fed7aa',
    paddingHorizontal: 8,
    paddingVertical: 4,
    borderRadius: 12,
    marginRight: 8,
    marginBottom: 4,
  },
  newDemandBadge: {
    backgroundColor: '#dcfce7',
    paddingHorizontal: 8,
    paddingVertical: 4,
    borderRadius: 12,
    marginRight: 8,
    marginBottom: 4,
  },
  statusBadge: {
    backgroundColor: '#e0e7ff',
    paddingHorizontal: 8,
    paddingVertical: 4,
    borderRadius: 12,
    marginBottom: 4,
  },
  statusText: {
    fontSize: 12,
    color: '#3730a3',
    fontWeight: '500',
  },
  auctionMeta: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 12,
  },
  categoryBadge: {
    backgroundColor: '#f3f4f6',
    paddingHorizontal: 8,
    paddingVertical: 4,
    borderRadius: 6,
  },
  categoryText: {
    fontSize: 12,
    color: '#6b7280',
    fontWeight: '500',
  },
  budgetText: {
    fontSize: 14,
    color: '#059669',
    fontWeight: '600',
  },
  locationRatingRow: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: 16,
  },
  locationText: {
    fontSize: 14,
    color: '#6b7280',
    flex: 1,
    marginLeft: 4,
  },
  ratingContainer: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  ratingText: {
    fontSize: 14,
    color: '#6b7280',
    marginLeft: 4,
  },
  iconWithMargin: {
    marginRight: 8,
  },
  statusProposalsContainer: {
    backgroundColor: '#dbeafe',
    borderRadius: 8,
    padding: 12,
    marginBottom: 16,
  },
  statusProposalsTitle: {
    fontWeight: '600',
    marginBottom: 8,
    color: '#1e40af',
    fontSize: 14,
  },
  statusProposalsTitleNew: {
    fontWeight: '600',
    marginBottom: 8,
    color: '#065f46',
    fontSize: 14,
  },
  statusProposalsText: {
    color: '#2563eb',
    fontSize: 12,
  },
  statusProposalsTextNew: {
    color: '#059669',
    fontSize: 12,
  },
  footerRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
  },
  deadlineText: {
    color: '#6b7280',
    fontSize: 14,
  },
  viewDetailsContainer: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  viewDetailsText: {
    color: '#4f46e5',
    marginLeft: 4,
    fontWeight: '600',
    fontSize: 14,
  },
  emptyStateContainer: {
    backgroundColor: 'white',
    borderRadius: 12,
    padding: 32,
    alignItems: 'center'
  },
  emptyStateTitle: {
    fontSize: 16,
    fontWeight: '600',
    color: '#6b7280',
    marginTop: 16,
    marginBottom: 8,
    textAlign: 'center'
  },
  emptyStateText: {
    color: '#9ca3af',
    textAlign: 'center'
  },
  backButton: {
    backgroundColor: '#4f46e5',
    paddingVertical: 12,
    paddingHorizontal: 24,
    borderRadius: 8,
    marginTop: 16,
  },
  backButtonText: {
    color: 'white',
    fontSize: 16,
    fontWeight: '600',
    textAlign: 'center',
  },
  backButtonBottom: {
    backgroundColor: '#4f46e5',
    borderRadius: 8,
    padding: 16,
    marginTop: 24,
  },
  backButtonBottomText: {
    textAlign: 'center',
    color: 'white',
    fontWeight: 'bold',
    fontSize: 18,
  },
});