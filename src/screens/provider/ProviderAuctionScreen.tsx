import React, { useState, useEffect, useCallback } from 'react';
import { View, Text, ScrollView, TouchableOpacity, Alert, ActivityIndicator, TextInput, StyleSheet } from 'react-native';
import { useNavigation, useRoute, useFocusEffect, NavigationProp, RouteProp } from '@react-navigation/native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import Icon from 'react-native-vector-icons/MaterialIcons';
import { Target, Crown, Zap } from 'lucide-react-native';
import { useAuth } from '../../contexts/AuthContext';
import { useToast } from '../../contexts/ToastContext';
import { orderService, Order as ApiOrder, Proposal as ApiProposal } from '../../services/api';
import { useStatusBarOverlay } from '../../hooks/useStatusBarOverlay';
import { StatusBarOverlay } from '../../components/StatusBarOverlay';
import { formatPrice } from '../../utils/formatters';
import { SkeletonBlock } from '../../components/Skeleton';
import Geolocation from '@react-native-community/geolocation';
import { requestLocationPermission } from '../../utils/permissions';

type RootStackParamList = {
  SendProposal: { demand: Auction };
  [key: string]: any;
};

type AuctionScreenNavigationProp = NavigationProp<RootStackParamList>;
type AuctionScreenRouteProp = RouteProp<any, any>;

interface Proposal {
  id: string;
  providerName: string;
  providerRating: number;
  price: string;
  deadline: string;
  description: string;
  ranking: number;
  provider_id?: string | number;
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

const convertApiOrderToAuction = (apiOrder: ApiOrder): Auction => {
  const proposals: Proposal[] = apiOrder.proposals?.map((proposal: ApiProposal, index: number) => ({
    id: proposal.id.toString(),
    providerName: proposal.provider?.name || 'Prestador',
    providerRating: 4.5,
    price: `R$ ${formatPrice(Number(proposal.price || 0))}`,
    deadline: `${proposal.deadline || 0} dias`,
    description: proposal.description || 'Sem descrição',
    ranking: index + 1,
    provider_id: proposal.provider_id,
    created_at: proposal.created_at || undefined,
    status: proposal.status || 'pending',
  })) || [];

  const hasActiveAuction = !!(apiOrder.auction_started_at && apiOrder.auction_ends_at &&
    new Date() >= new Date(apiOrder.auction_started_at) &&
    new Date() <= new Date(apiOrder.auction_ends_at));

  const isNewDemand = apiOrder.status === 'open' && proposals.length === 0;

  const getStatusInPortuguese = (status: string): string => {
    switch (status) {
      case 'open': return 'Aguardando propostas';
      case 'in_progress': return 'Em andamento';
      case 'completed': return 'Concluído';
      case 'cancelled': return 'Cancelado';
      default: return 'Aguardando propostas';
    }
  };

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

  const budgetValue = typeof apiOrder.budget === 'string'
    ? parseFloat(apiOrder.budget)
    : (apiOrder.budget || 0);

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
    clientRating: 4.8,
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
  const { showSuccess, showError } = useToast();
  const [providerLocation, setProviderLocation] = useState<{ latitude: number; longitude: number } | null>(null);

  useEffect(() => {
    const getLocation = async () => {
      const granted = await requestLocationPermission();
      if (!granted) return;
      Geolocation.getCurrentPosition(
        (pos) => setProviderLocation({ latitude: pos.coords.latitude, longitude: pos.coords.longitude }),
        () => {},
        { enableHighAccuracy: false, timeout: 8000, maximumAge: 60000 }
      );
    };
    getLocation();
  }, []);

  const [cepFilter, setCepFilter] = useState('');
  const [categoryFilter, setCategoryFilter] = useState('');
  const [showCategoryAutocomplete, setShowCategoryAutocomplete] = useState(false);
  const [availableCategories, setAvailableCategories] = useState<string[]>([]);
  const [filteredCategories, setFilteredCategories] = useState<string[]>([]);

  const routeParams = route.params as RouteParams | undefined;
  const profileType = routeParams?.profileType || 'provider';
  const clientId = routeParams?.clientId || '1';
  const selectedCategory = routeParams?.selectedCategory;
  const fromSearch = routeParams?.fromSearch || false;

  const fetchAuctions = useCallback(async () => {
    if (!user?.id) {
      setLoading(false);
      return;
    }
    try {
      setLoading(true);
      setError(null);

      let params: Record<string, any> = {};

      if (selectedCategory) {
        params.category = selectedCategory;
      }

      if (providerLocation) {
        params.latitude = providerLocation.latitude;
        params.longitude = providerLocation.longitude;
      }

      const response = await orderService.getAvailableOrders(params);

      if (response.success) {
        if (!response.data.data || !Array.isArray(response.data.data)) {
          setAuctions([]);
          return;
        }

        const convertedAuctions = response.data.data.map((apiOrder: any) => {
          try {
            return convertApiOrderToAuction(apiOrder);
          } catch (error) {
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
      setError(error.message || 'Erro ao carregar demandas');
    } finally {
      setLoading(false);
    }
  }, [selectedCategory, user?.id, providerLocation]);

  useEffect(() => {
    fetchAuctions();
  }, [fetchAuctions]);

  useFocusEffect(
    useCallback(() => {
      fetchAuctions();
    }, [fetchAuctions])
  );

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

  const selectCategory = (category: string) => {
    setCategoryFilter(category);
    setShowCategoryAutocomplete(false);
  };

  const formatCep = (value: string) => {
    const numbers = value.replace(/[^0-9]/g, '');
    if (numbers.length <= 5) {
      return numbers;
    } else {
      return numbers.substring(0, 5) + '-' + numbers.substring(5, 8);
    }
  };

  const clearFilters = () => {
    setCepFilter('');
    setCategoryFilter('');
    setShowCategoryAutocomplete(false);
    applyFilters({});
  };

  useEffect(() => {
    fetchAvailableCategories();
  }, []);

  const applyFilters = async (overrideParams?: Record<string, any>) => {
    if (!user?.id) return;
    try {
      setLoading(true);
      setError(null);

      let params: Record<string, any>;
      if (overrideParams !== undefined) {
        params = overrideParams;
      } else {
        params = {};
        if (categoryFilter) {
          params.category = categoryFilter;
        }
        if (cepFilter && cepFilter.replace(/[^0-9]/g, '').length >= 5) {
          params.cep = cepFilter.replace(/[^0-9]/g, '');
        }
      }

      if (providerLocation) {
        params.latitude = providerLocation.latitude;
        params.longitude = providerLocation.longitude;
      }

      const response = await orderService.getAvailableOrders(params);

      if (response.success) {
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

  let filteredAuctions = auctions;

  filteredAuctions = filteredAuctions.filter(
    (auction) => auction.status === 'Aguardando propostas' || auction.status === 'Em andamento'
  );

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
    navigation.navigate('SendProposal', { demand: auction });
  };

  const handleSendProposal = (auction: Auction) => {
    navigation.navigate('SendProposal', { demand: auction });
  };

  const handleRefuseProposal = (auctionId: string, proposalId: string) => {
    Alert.alert(
      'Recusar Proposta',
      'Tem certeza que deseja recusar esta proposta? Essa ação não poderá ser desfeita.',
      [
        { text: 'Cancelar', style: 'cancel' },
        {
          text: 'Recusar', style: 'destructive',
          onPress: () => {
            showError('Funcionalidade de recusa de proposta ainda não implementada.');
          }
        }
      ]
    );
  };

  const handleCloseAuction = (auctionId: string) => {
    Alert.alert(
      'Encerrar Demanda',
      'Tem certeza que deseja encerrar/cancelar esta demanda? Isso encerrará o leilão e não aceitará mais propostas.',
      [
        { text: 'Cancelar', style: 'cancel' },
        {
          text: 'Encerrar', style: 'destructive',
          onPress: () => {
            showError('Funcionalidade de encerramento de demanda ainda não implementada.');
          }
        }
      ]
    );
  };

  const handleCancelProposal = (auctionId: string) => {
    Alert.alert(
      'Cancelar Proposta',
      'Tem certeza que deseja cancelar sua proposta e sair deste leilão?',
      [
        { text: 'Não', style: 'cancel' },
        {
          text: 'Sim', style: 'destructive',
          onPress: () => {
            showError('Funcionalidade de cancelamento de proposta ainda não implementada.');
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
      <View style={styles.container}>
        <View style={[styles.header, { paddingTop: insets.top + 16 }]}>
          <View style={styles.headerTop}>
            <SkeletonBlock width={32} height={32} borderRadius={16} />
            <SkeletonBlock width={220} height={22} />
          </View>
          <SkeletonBlock width={180} height={14} style={{ marginTop: 8 }} />
        </View>
        <View style={styles.content}>
          <SkeletonBlock width="100%" height={100} borderRadius={12} style={{ marginBottom: 16 }} />
          <SkeletonBlock width="100%" height={80} borderRadius={12} style={{ marginBottom: 12 }} />
          <SkeletonBlock width="100%" height={80} borderRadius={12} style={{ marginBottom: 12 }} />
          <SkeletonBlock width="100%" height={80} borderRadius={12} />
        </View>
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
        style={styles.scrollView}
        onScroll={handleScroll}
        scrollEventThrottle={16}
        contentContainerStyle={{ paddingBottom: insets.bottom }}
      >

      <View style={[styles.header, { paddingTop: insets.top + 16 }]}>
        <View style={styles.headerTop}>
          <TouchableOpacity style={styles.backButtonHeader} onPress={() => navigation.goBack()}>
            <Icon name="arrow-back" size={22} color="#374151" />
          </TouchableOpacity>
          <Text style={styles.title}>{getPageTitle()}</Text>
        </View>
        <Text style={styles.subtitle}>{getPageSubtitle()}</Text>
      </View>

      <View style={styles.content}>

        <View style={styles.filtersCard}>
          <View style={styles.filterField}>
            <View style={styles.filterFieldIcon}>
              <Icon name="location-on" size={18} color="#4f46e5" />
            </View>
            <View style={styles.filterFieldBody}>
              <Text style={styles.filterFieldLabel}>CEP</Text>
              <TextInput
                style={styles.filterInput}
                placeholder="Ex: 40275-190"
                placeholderTextColor="#9ca3af"
                value={cepFilter}
                onChangeText={(text) => setCepFilter(formatCep(text))}
                keyboardType="numeric"
                maxLength={9}
              />
            </View>
          </View>
          <View style={styles.filterSep} />
          <View style={styles.categoryFilterContainer}>
            <View style={styles.filterField}>
              <View style={styles.filterFieldIcon}>
                <Icon name="category" size={18} color="#4f46e5" />
              </View>
              <View style={styles.filterFieldBody}>
                <Text style={styles.filterFieldLabel}>Categoria</Text>
                <TextInput
                  style={styles.filterInput}
                  placeholder="Ex: Limpeza, Elétrica..."
                  placeholderTextColor="#9ca3af"
                  value={categoryFilter}
                  onChangeText={(text) => { setCategoryFilter(text); filterCategories(text); }}
                  onFocus={() => { if (categoryFilter) filterCategories(categoryFilter); }}
                />
              </View>
              {categoryFilter && (
                <TouchableOpacity onPress={() => setCategoryFilter('')} style={styles.clearButton}>
                  <Icon name="clear" size={18} color="#9ca3af" />
                </TouchableOpacity>
              )}
            </View>
            {showCategoryAutocomplete && filteredCategories.length > 0 && (
              <View style={styles.autocompleteContainer}>
                <ScrollView showsVerticalScrollIndicator={false} nestedScrollEnabled={true}>
                  {filteredCategories.map((item) => (
                    <TouchableOpacity key={item} style={styles.autocompleteItem} onPress={() => selectCategory(item)}>
                      <Text style={styles.autocompleteText}>{item}</Text>
                    </TouchableOpacity>
                  ))}
                </ScrollView>
              </View>
            )}
          </View>
          <View style={styles.filterActions}>
            {(cepFilter || categoryFilter) && (
              <TouchableOpacity onPress={clearFilters} style={styles.clearFiltersButton}>
                <Text style={styles.clearFiltersText}>Limpar</Text>
              </TouchableOpacity>
            )}
            <TouchableOpacity onPress={() => applyFilters()} style={styles.searchButton}>
              <Icon name="search" size={18} color="#fff" />
              <Text style={styles.searchButtonText}>Buscar demandas</Text>
            </TouchableOpacity>
          </View>
        </View>

        {user?.is_premium ? (
          <View style={styles.earlyAccessBanner}>
            <Crown size={16} color="#f59e0b" />
            <Text style={styles.earlyAccessText}>
              Você tem acesso antecipado de 30 min às novas demandas
            </Text>
          </View>
        ) : (
          <TouchableOpacity
            style={styles.earlyAccessLocked}
            onPress={() => navigation.navigate('Premium' as never)}
            activeOpacity={0.85}
          >
            <Zap size={16} color="#9ca3af" />
            <Text style={styles.earlyAccessLockedText}>
              Premium: veja demandas 30 min antes de todos
            </Text>
            <Icon name="chevron-right" size={18} color="#9ca3af" />
          </TouchableOpacity>
        )}

        {filteredAuctions.map((auction) => (
          <TouchableOpacity
            key={auction.id}
            style={styles.auctionCard}
            onPress={() => handleAuctionPress(auction)}
            activeOpacity={0.85}
          >
            <View style={[styles.auctionCardStrip, { backgroundColor: auction.hasMyProposal ? '#f59e0b' : '#4f46e5' }]} />
            <View style={styles.auctionCardBody}>
              <View style={styles.auctionHeader}>
                <Text style={styles.auctionTitle}>{auction.title}</Text>
              </View>
              <View style={styles.auctionStatusRow}>
                <View style={styles.statusContainer}>
                  {auction.hasMyProposal && (
                    <View style={styles.myProposalBadge}>
                      <Text style={styles.myProposalText}>{auction.myProposalRanking}º lugar</Text>
                    </View>
                  )}
                  {auction.hasActiveAuction && (
                    <View style={styles.activeAuctionBadge}>
                      <Icon name="gavel" size={14} color="#f97316" />
                    </View>
                  )}
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
                <Text style={styles.budgetText}>Orçamento: {auction.budget}</Text>
              </View>

              <View style={styles.locationRatingRow}>
                <Icon name="location-on" size={14} color="#6b7280" />
                <Text style={styles.locationText}>{auction.location}</Text>
              </View>

              <View style={styles.statusProposalsContainer}>
                {auction.proposals.length > 0 && (
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
                )}
                {auction.proposals.length === 0 && (
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
                <Text style={styles.deadlineText}>Prazo: {auction.deadline}</Text>
                <View style={styles.viewDetailsContainer}>
                  <Icon name="visibility" size={18} color="#4f46e5" />
                  <Text style={styles.viewDetailsText}>
                    {auction.hasMyProposal ? 'Ver Ranking' : 'Ver Detalhes'}
                  </Text>
                </View>
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

      </View>
      </ScrollView>


      <StatusBarOverlay show={showStatusBarOverlay} opacity={statusBarOpacity} />
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#f3f4f6',
  },
  scrollView: {
    flex: 1,
  },
  header: {
    paddingHorizontal: 24,
    paddingBottom: 20,
    backgroundColor: '#fff',
    borderBottomWidth: 1,
    borderBottomColor: '#f3f4f6',
  },
  headerTop: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 14,
    marginBottom: 6,
  },
  backButtonHeader: {
    width: 38,
    height: 38,
    borderRadius: 19,
    backgroundColor: '#f3f4f6',
    alignItems: 'center',
    justifyContent: 'center',
  },
  content: {
    backgroundColor: '#f3f4f6',
    borderTopLeftRadius: 24,
    borderTopRightRadius: 24,
    padding: 20,
    paddingBottom: 32,
    minHeight: 500,
  },
  loadingContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    backgroundColor: '#f3f4f6',
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
    backgroundColor: '#f3f4f6',
  },
  errorText: {
    fontSize: 16,
    color: '#ef4444',
    textAlign: 'center',
    marginBottom: 16,
  },
  title: {
    fontSize: 22,
    fontWeight: 'bold',
    color: '#111827',
    flex: 1,
  },
  subtitle: {
    fontSize: 14,
    color: '#6b7280',
  },
  filtersCard: {
    backgroundColor: 'white',
    borderRadius: 16,
    marginBottom: 16,
    overflow: 'hidden',
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 1 },
    shadowOpacity: 0.06,
    shadowRadius: 4,
    elevation: 2,
  },
  filterField: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: 16,
    paddingVertical: 14,
    gap: 14,
  },
  filterFieldIcon: {
    width: 36,
    height: 36,
    borderRadius: 10,
    backgroundColor: '#eef2ff',
    alignItems: 'center',
    justifyContent: 'center',
  },
  filterFieldBody: {
    flex: 1,
  },
  filterFieldLabel: {
    fontSize: 12,
    fontWeight: '600',
    color: '#9ca3af',
    marginBottom: 2,
  },
  filterSep: {
    height: StyleSheet.hairlineWidth,
    backgroundColor: '#e5e7eb',
    marginLeft: 66,
  },
  filterInput: {
    fontSize: 15,
    color: '#111827',
    padding: 0,
  },
  categoryFilterContainer: {
    position: 'relative',
  },
  clearButton: {
    padding: 6,
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
  filterActions: {
    flexDirection: 'row',
    justifyContent: 'flex-end',
    alignItems: 'center',
    gap: 8,
    padding: 12,
    paddingTop: 8,
    borderTopWidth: StyleSheet.hairlineWidth,
    borderTopColor: '#e5e7eb',
  },
  clearFiltersButton: {
    backgroundColor: '#f3f4f6',
    paddingVertical: 9,
    paddingHorizontal: 16,
    borderRadius: 10,
  },
  clearFiltersText: {
    fontSize: 14,
    color: '#6b7280',
    fontWeight: '500',
  },
  searchButton: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
    backgroundColor: '#4f46e5',
    paddingVertical: 9,
    paddingHorizontal: 20,
    borderRadius: 10,
  },
  searchButtonText: {
    fontSize: 14,
    color: '#fff',
    fontWeight: '600',
  },
  auctionCard: {
    backgroundColor: 'white',
    borderRadius: 16,
    marginBottom: 12,
    overflow: 'hidden',
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 1 },
    shadowOpacity: 0.06,
    shadowRadius: 4,
    elevation: 2,
  },
  auctionCardStrip: {
    height: 4,
  },
  auctionCardBody: {
    padding: 16,
  },
  auctionHeader: {
    marginBottom: 12,
  },
  auctionTitle: {
    fontSize: 17,
    fontWeight: '700',
    color: '#111827',
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
    backgroundColor: '#eef2ff',
    borderRadius: 10,
    padding: 12,
    marginBottom: 12,
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
    borderRadius: 16,
    padding: 32,
    alignItems: 'center',
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 1 },
    shadowOpacity: 0.06,
    shadowRadius: 4,
    elevation: 2,
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
    borderRadius: 10,
    padding: 14,
    marginTop: 16,
    borderWidth: 1,
    borderColor: '#e5e7eb',
    backgroundColor: '#ffffff',
  },
  backButtonBottomText: {
    textAlign: 'center',
    color: '#6b7280',
    fontWeight: '600',
    fontSize: 15,
  },
  earlyAccessBanner: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
    backgroundColor: '#fffbeb',
    borderRadius: 10,
    padding: 12,
    marginBottom: 12,
    borderWidth: 1,
    borderColor: '#fde68a',
  },
  earlyAccessText: {
    flex: 1,
    fontSize: 13,
    fontWeight: '500',
    color: '#92400e',
  },
  earlyAccessLocked: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
    backgroundColor: '#f9fafb',
    borderRadius: 10,
    padding: 12,
    marginBottom: 12,
    borderWidth: 1,
    borderColor: '#e5e7eb',
  },
  earlyAccessLockedText: {
    flex: 1,
    fontSize: 13,
    color: '#6b7280',
  },
});