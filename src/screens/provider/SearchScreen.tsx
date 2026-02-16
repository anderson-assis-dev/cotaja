import React, { useState, useEffect } from 'react';
import { View, Text, TextInput, ScrollView, TouchableOpacity, StyleSheet, StatusBar } from 'react-native';
import { useNavigation, NavigationProp } from '@react-navigation/native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import Icon from 'react-native-vector-icons/MaterialIcons';
import { Lightbulb } from 'lucide-react-native';
import { useStatusBarOverlay } from '../../hooks/useStatusBarOverlay';
import { StatusBarOverlay } from '../../components/StatusBarOverlay';

// Navigation types
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

// TypeScript interfaces
interface Category {
  id: string;
  name: string;
  icon: string;
}

interface Demand {
  id: string;
  title: string;
  category: string;
  budget: string;
  location: string;
  description: string;
}

// Mock data for example
const mockCategories: Category[] = [
  { id: '1', name: 'Limpeza', icon: 'cleaning-services' },
  { id: '2', name: 'Reparos', icon: 'build' },
  { id: '3', name: 'Tecnologia', icon: 'computer' },
  { id: '4', name: 'Aulas', icon: 'school' },
  { id: '5', name: 'Design', icon: 'design-services' },
  { id: '6', name: 'Eventos', icon: 'celebration' },
  { id: '7', name: 'Pintura', icon: 'format-paint' },
  { id: '8', name: 'Elétrica', icon: 'electrical-services' },
  { id: '9', name: 'Encanamento', icon: 'plumbing' },
  { id: '10', name: 'Jardinagem', icon: 'yard' },
  { id: '11', name: 'Transporte', icon: 'local-shipping' },
  { id: '12', name: 'Outros', icon: 'more-horiz' },
];

// Mock demand data for search
const mockDemands: Demand[] = [
  {
    id: '1',
    title: 'Pintura de apartamento',
    category: 'Pintura',
    budget: 'R$ 3.000,00',
    location: 'São Paulo, SP',
    description: 'Preciso pintar um apartamento de 80m², 2 quartos, sala, cozinha e banheiro. Cores neutras.',
  },
  {
    id: '2',
    title: 'Instalação de ar condicionado',
    category: 'Elétrica',
    budget: 'R$ 1.500,00',
    location: 'Rio de Janeiro, RJ',
    description: 'Instalar ar condicionado split 12.000 BTUs na sala. Já tenho o aparelho.',
  },
  {
    id: '3',
    title: 'Limpeza pós-obra',
    category: 'Limpeza',
    budget: 'R$ 800,00',
    location: 'Belo Horizonte, MG',
    description: 'Limpeza completa de casa após reforma. 120m², 3 quartos, 2 banheiros.',
  },
  {
    id: '4',
    title: 'Manutenção de computador',
    category: 'Tecnologia',
    budget: 'R$ 200,00',
    location: 'São Paulo, SP',
    description: 'Meu computador está lento e com problemas. Preciso de manutenção e limpeza.',
  },
  {
    id: '5',
    title: 'Aula de inglês online',
    category: 'Aulas',
    budget: 'R$ 50,00',
    location: 'Online',
    description: 'Preciso de aulas de inglês para conversação. 2x por semana, 1 hora cada.',
  },
  {
    id: '6',
    title: 'Design de logo',
    category: 'Design',
    budget: 'R$ 500,00',
    location: 'São Paulo, SP',
    description: 'Preciso de um logo para minha empresa de tecnologia. Quero algo moderno e profissional.',
  },
  {
    id: '7',
    title: 'Organização de evento corporativo',
    category: 'Eventos',
    budget: 'R$ 5.000,00',
    location: 'São Paulo, SP',
    description: 'Preciso organizar um evento corporativo para 100 pessoas. Inclui decoração e catering.',
  },
  {
    id: '8',
    title: 'Reparo de encanamento',
    category: 'Encanamento',
    budget: 'R$ 300,00',
    location: 'São Paulo, SP',
    description: 'Vazamento na pia da cozinha. Preciso de reparo urgente.',
  },
  {
    id: '9',
    title: 'Poda de árvores',
    category: 'Jardinagem',
    budget: 'R$ 400,00',
    location: 'São Paulo, SP',
    description: 'Preciso podar 3 árvores no meu quintal. Uma delas está muito alta.',
  },
  {
    id: '10',
    title: 'Transporte de móveis',
    category: 'Transporte',
    budget: 'R$ 250,00',
    location: 'São Paulo, SP',
    description: 'Preciso transportar móveis de um apartamento para outro. Distância de 5km.',
  },
];

export default function ProviderSearchScreen() {
  const navigation = useNavigation<ProviderSearchScreenNavigationProp>();
  const insets = useSafeAreaInsets();
  const { showStatusBarOverlay, statusBarOpacity, handleScroll } = useStatusBarOverlay();
  const [searchQuery, setSearchQuery] = useState<string>('');
  const [filteredDemands, setFilteredDemands] = useState<Demand[]>([]);
  const [showSearchResults, setShowSearchResults] = useState<boolean>(false);

  // Function to filter demands based on search
  useEffect(() => {
    if (searchQuery.trim().length > 0) {
      const filtered = mockDemands.filter(demand =>
        demand.title.toLowerCase().includes(searchQuery.toLowerCase()) ||
        demand.category.toLowerCase().includes(searchQuery.toLowerCase()) ||
        demand.description.toLowerCase().includes(searchQuery.toLowerCase()) ||
        demand.location.toLowerCase().includes(searchQuery.toLowerCase())
      );
      setFilteredDemands(filtered);
      setShowSearchResults(true);
    } else {
      setFilteredDemands([]);
      setShowSearchResults(false);
    }
  }, [searchQuery]);

  const handleCategoryPress = (category: Category) => {
    // Navigate to auctions screen with category filter
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
    // Navigate to auctions screen with demand category filter
    navigation.navigate('AuctionsTab', {
      screen: 'ProviderAuction',
      params: {
        profileType: 'provider',
        selectedCategory: demand.category,
        fromSearch: true
      }
    });
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

        {/* Search Bar */}
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

        {/* Search Results */}
        {showSearchResults && (
          <View style={styles.searchResultsContainer}>
            <View style={styles.searchResultsHeader}>
              <Text style={styles.searchResultsTitle}>
                Resultados da busca
              </Text>
              <Text style={styles.searchResultsCount}>
                {filteredDemands.length} {filteredDemands.length === 1 ? 'resultado' : 'resultados'}
              </Text>
            </View>

            {filteredDemands.length > 0 ? (
              <View>
                {filteredDemands.map((demand) => (
                  <TouchableOpacity
                    key={demand.id}
                    style={styles.demandCard}
                    onPress={() => handleDemandPress(demand)}
                  >
                    <View style={styles.demandHeader}>
                      <Text style={styles.demandTitle} numberOfLines={2}>
                        {demand.title}
                      </Text>
                      <View style={styles.categoryBadge}>
                        <Text style={styles.categoryText}>{demand.category}</Text>
                      </View>
                    </View>

                    <Text style={styles.demandDescription} numberOfLines={2}>
                      {demand.description}
                    </Text>

                    <View style={styles.demandFooter}>
                      <View style={styles.locationContainer}>
                        <Icon name="location-on" size={14} color="#6b7280" />
                        <Text style={styles.locationText}>{demand.location}</Text>
                      </View>
                      <Text style={styles.budgetText}>{demand.budget}</Text>
                    </View>
                  </TouchableOpacity>
                ))}
              </View>
            ) : (
              <View style={styles.noResultsContainer}>
                <Icon name="search-off" size={48} color="#9ca3af" />
                <Text style={styles.noResultsTitle}>
                  Nenhum resultado encontrado
                </Text>
                <Text style={styles.noResultsText}>
                  Tente usar outras palavras-chave ou explore as categorias abaixo
                </Text>
              </View>
            )}
          </View>
        )}

        {/* Categories - only shows when there's no active search */}
        {!showSearchResults && (
          <View style={styles.categoriesContainer}>
            <Text style={styles.categoriesTitle}>Categorias</Text>
            <Text style={styles.categoriesSubtitle}>
              Selecione uma categoria para ver as demandas disponíveis
            </Text>
            <View style={styles.categoriesGrid}>
              {mockCategories.map((category) => (
                <TouchableOpacity
                  key={category.id}
                  style={styles.categoryCard}
                  onPress={() => handleCategoryPress(category)}
                >
                  <Icon name={category.icon} size={32} color="#4f46e5" />
                  <Text style={styles.categoryName}>{category.name}</Text>
                </TouchableOpacity>
              ))}
            </View>
          </View>
        )}

        {/* Information - only shows when there's no active search */}
        {!showSearchResults && (
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

        {/* Button to view all demands - only shows when there's no active search */}
        {!showSearchResults && (
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

      {/* Status Bar Overlay */}
      <StatusBarOverlay show={showStatusBarOverlay} opacity={statusBarOpacity} />
    </View>
  );
}

// StyleSheet definitions
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
    padding: 16,
    shadowColor: '#000',
    shadowOffset: {
      width: 0,
      height: 2,
    },
    shadowOpacity: 0.1,
    shadowRadius: 3.84,
    elevation: 5,
    marginBottom: 12,
  },
  demandHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'flex-start',
    marginBottom: 8,
  },
  demandTitle: {
    fontSize: 18,
    fontWeight: '600',
    color: '#1f2937',
    flex: 1,
    marginRight: 8,
  },
  categoryBadge: {
    backgroundColor: '#e0e7ff',
    paddingHorizontal: 8,
    paddingVertical: 4,
    borderRadius: 12,
  },
  categoryText: {
    color: '#4f46e5',
    fontSize: 14,
  },
  demandDescription: {
    color: '#6b7280',
    fontSize: 14,
    marginBottom: 8,
  },
  demandFooter: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
  },
  locationContainer: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  locationText: {
    color: '#6b7280',
    fontSize: 14,
    marginLeft: 4,
  },
  budgetText: {
    color: '#059669',
    fontWeight: '600',
    fontSize: 14,
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