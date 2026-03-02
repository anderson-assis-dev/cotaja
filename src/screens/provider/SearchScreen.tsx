import React, { useState, useEffect, useRef } from 'react';
import { View, Text, TextInput, ScrollView, TouchableOpacity, StyleSheet, ActivityIndicator } from 'react-native';
import { useNavigation, NavigationProp } from '@react-navigation/native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import Icon from 'react-native-vector-icons/MaterialIcons';
import { Lightbulb } from 'lucide-react-native';
import { useStatusBarOverlay } from '../../hooks/useStatusBarOverlay';
import { StatusBarOverlay } from '../../components/StatusBarOverlay';
import { orderService } from '../../services/api';
import { formatPrice } from '../../utils/formatters';
import { SERVICE_CATEGORIES, filterCategories, ServiceCategory } from '../../utils/serviceCategories';

type RootStackParamList = {
  AuctionsTab: {
    screen: string;
    params: {
      profileType: string;
      selectedCategory?: string;
      fromSearch: boolean;
    };
  };
  [key: string]: any;
};

type ProviderSearchScreenNavigationProp = NavigationProp<RootStackParamList>;

interface Demand {
  id: string;
  title: string;
  category: string;
  budget: string;
  location: string;
  description: string;
  _raw?: any;
}

export default function ProviderSearchScreen() {
  const navigation = useNavigation<ProviderSearchScreenNavigationProp>();
  const insets = useSafeAreaInsets();
  const { showStatusBarOverlay, statusBarOpacity, handleScroll } = useStatusBarOverlay();
  const [searchQuery, setSearchQuery] = useState<string>('');
  const [filteredDemands, setFilteredDemands] = useState<Demand[]>([]);
  const [showSearchResults, setShowSearchResults] = useState<boolean>(false);
  const [loading, setLoading] = useState<boolean>(false);
  const [categoryFilter, setCategoryFilter] = useState('');
  const debounceTimer = useRef<ReturnType<typeof setTimeout> | null>(null);

  useEffect(() => {
    if (debounceTimer.current) {
      clearTimeout(debounceTimer.current);
    }

    const query = searchQuery.trim();
    if (query.length === 0) {
      setFilteredDemands([]);
      setShowSearchResults(false);
      return;
    }

    setLoading(true);
    debounceTimer.current = setTimeout(async () => {
      try {
        const response = await orderService.getAvailableOrders({ search: query });
        if (response.success && Array.isArray(response.data.data)) {
          const demands: Demand[] = response.data.data.map((order: any) => ({
            id: order.id.toString(),
            title: order.title || 'Sem título',
            category: order.category || 'Sem categoria',
            budget: `R$ ${formatPrice(Number(order.budget || 0))}`,
            location: order.address || 'Local não informado',
            description: order.description || 'Sem descrição',
            _raw: order,
          }));
          setFilteredDemands(demands);
        } else {
          setFilteredDemands([]);
        }
        setShowSearchResults(true);
      } catch (error) {
        console.error('Erro ao buscar demandas:', error);
        setFilteredDemands([]);
        setShowSearchResults(true);
      } finally {
        setLoading(false);
      }
    }, 500);

    return () => {
      if (debounceTimer.current) {
        clearTimeout(debounceTimer.current);
      }
    };
  }, [searchQuery]);

  const handleCategoryPress = (category: ServiceCategory) => {
    navigation.navigate('AuctionsTab', {
      screen: 'ProviderAuction',
      params: {
        profileType: 'provider',
        selectedCategory: category.name,
        fromSearch: true
      }
    });
  };

  const handleDemandPress = (demand: Demand) => {
    const raw = demand._raw;
    const deadlineValue = raw?.deadline ? Number.parseInt(raw.deadline, 10) : 0;
    let attachments = raw?.attachments;
    if (typeof attachments === 'string') {
      try { attachments = JSON.parse(attachments); } catch (parseError) {
        console.warn('Failed to parse attachments:', parseError);
        attachments = [];
      }
    }
    const fullDemand = {
      id: demand.id,
      title: demand.title,
      category: demand.category,
      budget: demand.budget,
      deadline: `${deadlineValue} dias`,
      description: demand.description,
      location: demand.location,
      clientRating: 4.8,
      proposals: [],
      insights: [],
      attachments: Array.isArray(attachments) ? attachments : [],
      clientId: raw?.client_id?.toString() || '0',
      hasActiveAuction: false,
      isNewDemand: true,
    };
    navigation.navigate('SendProposal', { demand: fullDemand });
  };

  const clearSearch = () => {
    setSearchQuery('');
    setFilteredDemands([]);
    setShowSearchResults(false);
  };

  const handleViewAllDemands = () => {
    navigation.navigate('AuctionsTab', {
      screen: 'ProviderAuction',
      params: {
        profileType: 'provider',
        fromSearch: true
      }
    });
  };

  const renderResults = () => {
    if (loading) {
      return (
        <View style={styles.noResultsContainer}>
          <ActivityIndicator size="large" color="#4f46e5" />
          <Text style={[styles.noResultsText, { marginTop: 12 }]}>Buscando...</Text>
        </View>
      );
    }
    if (filteredDemands.length > 0) {
      return (
        <View>
          {filteredDemands.map((demand) => (
            <TouchableOpacity
              key={demand.id}
              style={styles.demandCard}
              onPress={() => handleDemandPress(demand)}
            >
              <View style={styles.demandCardInner}>
                <View style={{ flex: 1 }}>
                  <Text style={styles.demandTitle} numberOfLines={1}>
                    {demand.title}
                  </Text>
                  <Text style={styles.demandDescription} numberOfLines={2}>
                    {demand.description}
                  </Text>
                  <View style={styles.demandMeta}>
                    <View style={styles.categoryBadge}>
                      <Text style={styles.categoryText}>{demand.category}</Text>
                    </View>
                    <View style={styles.locationContainer}>
                      <Icon name="location-on" size={12} color="#9ca3af" />
                      <Text style={styles.locationText} numberOfLines={1}>
                        {demand.location}
                      </Text>
                    </View>
                  </View>
                </View>
                <View style={styles.demandRight}>
                  <Text style={styles.budgetText}>{demand.budget}</Text>
                  <Icon name="chevron-right" size={20} color="#d1d5db" style={{ marginTop: 6 }} />
                </View>
              </View>
            </TouchableOpacity>
          ))}
        </View>
      );
    }
    return (
      <View style={styles.noResultsContainer}>
        <Icon name="search-off" size={48} color="#9ca3af" />
        <Text style={styles.noResultsTitle}>Nenhum resultado encontrado</Text>
        <Text style={styles.noResultsText}>
          Tente usar outras palavras-chave ou explore as categorias abaixo
        </Text>
      </View>
    );
  };

  return (
    <View style={styles.container}>
      <ScrollView
        style={[styles.scrollView, { paddingTop: insets.top }]}
        onScroll={handleScroll}
        scrollEventThrottle={16}
        contentContainerStyle={{ paddingBottom: insets.bottom }}
      >
      <View style={styles.content}>
        <Text style={styles.title}>Buscar Demandas</Text>


        <View style={styles.searchContainer}>
          <Icon name="search" size={24} color="#9ca3af" />
          <TextInput
            placeholder="Buscar por palavra-chave..."
            style={styles.searchInput}
            value={searchQuery}
            onChangeText={setSearchQuery}
            autoFocus={false}
          />
          {searchQuery.length > 0 && (
            <TouchableOpacity onPress={clearSearch}>
              <Icon name="close" size={20} color="#9ca3af" />
            </TouchableOpacity>
          )}
        </View>


        {(loading || showSearchResults) && (
          <View style={styles.searchResultsContainer}>
            <View style={styles.searchResultsHeader}>
              <Text style={styles.searchResultsTitle}>
                Resultados da busca
              </Text>
              {!loading && (
                <Text style={styles.searchResultsCount}>
                  {filteredDemands.length} {filteredDemands.length === 1 ? 'resultado' : 'resultados'}
                </Text>
              )}
            </View>

            {renderResults()}
          </View>
        )}


        {!showSearchResults && !loading && (
          <View style={styles.categoriesContainer}>
            <Text style={styles.categoriesTitle}>Categorias</Text>
            <Text style={styles.categoriesSubtitle}>
              Selecione uma categoria para ver as demandas disponíveis
            </Text>
            <View style={styles.categorySearchRow}>
              <Icon name="search" size={20} color="#9ca3af" />
              <TextInput placeholder="Buscar categoria..." style={styles.categorySearchInput} value={categoryFilter} onChangeText={setCategoryFilter} />
              {categoryFilter !== '' && (
                <TouchableOpacity onPress={() => setCategoryFilter('')}>
                  <Icon name="close" size={20} color="#9ca3af" />
                </TouchableOpacity>
              )}
            </View>
            <View style={styles.categoriesGrid}>
              {filterCategories(categoryFilter).slice(0, categoryFilter ? 50 : 12).map((category) => (
                <TouchableOpacity
                  key={category.id}
                  style={styles.categoryCard}
                  onPress={() => { handleCategoryPress(category); setCategoryFilter(''); }}
                >
                  <Icon name={category.icon} size={28} color="#4f46e5" />
                  <Text style={styles.categoryName}>{category.name}</Text>
                </TouchableOpacity>
              ))}
            </View>
            {!categoryFilter && SERVICE_CATEGORIES.length > 12 && (
              <Text style={styles.categoryHintText}>Busque acima para ver mais categorias...</Text>
            )}
          </View>
        )}


        {!showSearchResults && !loading && (
          <View style={styles.infoContainer}>
            <Text style={styles.infoTitle}><Lightbulb size={16} color="#f59e0b" /> Como funciona?</Text>
            <Text style={styles.infoText}>
              • Digite palavras-chave para buscar demandas específicas{'\n'}
              • Selecione uma categoria para ver todas as demandas{'\n'}
              • Demandas com leilão ativo terão um ícone especial{'\n'}
              • Seja o primeiro a enviar proposta em demandas sem propostas{'\n'}
              • Encontre oportunidades que combinam com seus serviços
            </Text>
          </View>
        )}


        {!showSearchResults && !loading && (
          <TouchableOpacity
            style={styles.viewAllButton}
            onPress={handleViewAllDemands}
          >
            <Text style={styles.viewAllButtonText}>
              Ver Todas as Demandas
            </Text>
          </TouchableOpacity>
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
  content: {
    padding: 24,
  },
  title: {
    fontSize: 30,
    fontWeight: 'bold',
    color: '#1f2937',
    marginBottom: 16,
  },
  searchContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#ffffff',
    borderRadius: 12,
    padding: 12,
    shadowColor: '#000',
    shadowOffset: {
      width: 0,
      height: 2,
    },
    shadowOpacity: 0.1,
    shadowRadius: 3.84,
    elevation: 5,
    marginBottom: 24,
  },
  searchInput: {
    flex: 1,
    marginLeft: 12,
    fontSize: 18,
    color: '#1f2937',
  },
  searchResultsContainer: {
    marginBottom: 24,
  },
  searchResultsHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 12,
  },
  searchResultsTitle: {
    fontSize: 18,
    fontWeight: '600',
    color: '#1f2937',
  },
  searchResultsCount: {
    fontSize: 14,
    color: '#6b7280',
  },
  demandCard: {
    backgroundColor: '#ffffff',
    borderRadius: 12,
    padding: 14,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 1 },
    shadowOpacity: 0.07,
    shadowRadius: 3,
    elevation: 3,
    marginBottom: 10,
    borderLeftWidth: 4,
    borderLeftColor: '#4f46e5',
  },
  demandCardInner: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 12,
  },
  demandTitle: {
    fontSize: 16,
    fontWeight: '700',
    color: '#1f2937',
    marginBottom: 4,
  },
  demandDescription: {
    color: '#6b7280',
    fontSize: 13,
    lineHeight: 18,
    marginBottom: 8,
  },
  demandMeta: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
    flexWrap: 'wrap',
  },
  categoryBadge: {
    backgroundColor: '#e0e7ff',
    paddingHorizontal: 8,
    paddingVertical: 3,
    borderRadius: 10,
  },
  categoryText: {
    color: '#4f46e5',
    fontSize: 12,
    fontWeight: '600',
  },
  locationContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    flex: 1,
    gap: 2,
    minWidth: 0,
  },
  locationText: {
    color: '#9ca3af',
    fontSize: 12,
    flex: 1,
  },
  demandRight: {
    alignItems: 'flex-end',
    justifyContent: 'center',
    minWidth: 70,
  },
  budgetText: {
    color: '#059669',
    fontWeight: '700',
    fontSize: 15,
  },
  noResultsContainer: {
    backgroundColor: '#ffffff',
    borderRadius: 12,
    padding: 24,
    alignItems: 'center',
    shadowColor: '#000',
    shadowOffset: {
      width: 0,
      height: 2,
    },
    shadowOpacity: 0.1,
    shadowRadius: 3.84,
    elevation: 5,
  },
  noResultsTitle: {
    fontSize: 18,
    fontWeight: '600',
    color: '#6b7280',
    marginTop: 12,
    marginBottom: 4,
  },
  noResultsText: {
    color: '#6b7280',
    textAlign: 'center',
    fontSize: 14,
  },
  categoriesContainer: {
    marginBottom: 24,
  },
  categoriesTitle: {
    fontSize: 20,
    fontWeight: '600',
    color: '#1f2937',
    marginBottom: 12,
  },
  categoriesSubtitle: {
    color: '#6b7280',
    marginBottom: 16,
    fontSize: 14,
  },
  categoriesGrid: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    justifyContent: 'space-between',
  },
  categorySearchRow: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#f3f4f6',
    borderRadius: 12,
    paddingHorizontal: 12,
    marginBottom: 12,
    gap: 8,
  },
  categorySearchInput: {
    flex: 1,
    fontSize: 14,
    color: '#1f2937',
    paddingVertical: 10,
  },
  categoryHintText: {
    fontSize: 12,
    color: '#9ca3af',
    fontStyle: 'italic',
    marginTop: 4,
  },
  categoryCard: {
    width: '48%',
    backgroundColor: '#ffffff',
    borderRadius: 12,
    padding: 16,
    marginBottom: 12,
    shadowColor: '#000',
    shadowOffset: {
      width: 0,
      height: 2,
    },
    shadowOpacity: 0.1,
    shadowRadius: 3.84,
    elevation: 5,
    alignItems: 'center',
  },
  categoryName: {
    marginTop: 8,
    fontWeight: '600',
    color: '#374151',
    textAlign: 'center',
    fontSize: 14,
  },
  infoContainer: {
    backgroundColor: '#dbeafe',
    borderRadius: 12,
    padding: 16,
    marginBottom: 24,
  },
  infoTitle: {
    color: '#1e40af',
    fontWeight: '600',
    marginBottom: 8,
    fontSize: 16,
  },
  infoText: {
    color: '#1d4ed8',
    fontSize: 14,
    lineHeight: 20,
  },
  viewAllButton: {
    backgroundColor: '#4f46e5',
    borderRadius: 8,
    padding: 16,
  },
  viewAllButtonText: {
    textAlign: 'center',
    color: '#ffffff',
    fontWeight: 'bold',
    fontSize: 18,
  },
});