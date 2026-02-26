import React, { useEffect, useMemo, useState } from 'react';
import { View, Text, TextInput, ScrollView, TouchableOpacity, Modal, Image, StyleSheet, ActivityIndicator } from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import Icon from 'react-native-vector-icons/MaterialIcons';
import { useRoute, useNavigation } from '@react-navigation/native';
import { useStatusBarOverlay } from '../../hooks/useStatusBarOverlay';
import { StatusBarOverlay } from '../../components/StatusBarOverlay';
import { serviceService } from '../../services/api';

const mockCategories = [
  { id: '1', name: 'Limpeza', icon: 'cleaning-services' },
  { id: '2', name: 'Reparos', icon: 'build' },
  { id: '3', name: 'Tecnologia', icon: 'computer' },
  { id: '4', name: 'Aulas', icon: 'school' },
  { id: '5', name: 'Design', icon: 'design-services' },
  { id: '6', name: 'Eventos', icon: 'celebration' },
];

const defaultCompanyImage = require('../../../assets/icon.png');
type Company = { id: string; name: string; category: string; rating: number; ratingsCount: number; description: string; phone: string; image: any; _raw?: any; };
const normalizeAvatarUri = (avatar?: string) => {
  if (!avatar) return null;
  if (avatar.startsWith('data:') || avatar.startsWith('http') || avatar.startsWith('file:')) return avatar;
  return `data:image/jpeg;base64,${avatar}`;
};

const CompanyCard = ({ company, onPress }: { company: Company, onPress: () => void }) => (
  <TouchableOpacity onPress={onPress} style={styles.companyCard}>
    <View style={styles.companyInfo}>
        <Image source={company.image} style={styles.companyAvatar} />
        <View style={styles.companyDetails}>
            <Text style={styles.companyName}>{company.name}</Text>
            <Text style={styles.companyCategory}>{company.category}</Text>
        </View>
    </View>
    <View style={styles.ratingContainer}>
      <Icon name="star" size={18} color="#f59e0b" />
      <Text style={styles.ratingText}>{company.rating}</Text>
    </View>
  </TouchableOpacity>
);

export default function SearchScreen() {
  const insets = useSafeAreaInsets();
  const route = useRoute();
  const navigation = useNavigation<any>();

  const [searchQuery, setSearchQuery] = useState('');
  const [selectedCategory, setSelectedCategory] = useState<string | null>(null);
  const [selectedCompany, setSelectedCompany] = useState<Company | null>(null);
  const [companies, setCompanies] = useState<Company[]>([]);
  const [loadingCompanies, setLoadingCompanies] = useState(false);
  const { showStatusBarOverlay, statusBarOpacity, handleScroll } = useStatusBarOverlay();

  const isRatingMode = (route.params as any)?.isRatingMode || false;

  const fetchCompanies = async (category?: string | null) => {
    setLoadingCompanies(true);
    try {
      const params = category ? { category } : undefined;
      const response = await serviceService.getAvailableServices(params);
      const services = response?.success && response.data?.data && Array.isArray(response.data.data) ? response.data.data : [];
      const map = new Map<string, Company>();
      for (const service of services) {
        const provider = service?.provider;
        if (!provider?.id) continue;
        if (map.has(provider.id.toString())) continue;
        const providerCategory = category || (service?.category || (provider?.service_categories?.[0] || 'Serviços'));
        const avatarUri = normalizeAvatarUri(provider?.avatar_base64);
        const avgRatingRaw: any = (provider as any)?.avg_rating ?? (provider as any)?.rate ?? 0;
        const ratingsCountRaw: any = (provider as any)?.ratings_count ?? 0;
        const avgRating = Number(avgRatingRaw);
        const ratingsCount = Number(ratingsCountRaw);
        map.set(provider.id.toString(), {
          id: provider.id.toString(),
          name: provider?.name || 'Empresa',
          category: providerCategory,
          rating: Number.isFinite(avgRating) ? avgRating : 0,
          ratingsCount: Number.isFinite(ratingsCount) ? ratingsCount : 0,
          description: provider?.address || 'Sem descrição',
          phone: provider?.phone || 'Não informado',
          image: avatarUri ? { uri: avatarUri } : defaultCompanyImage,
          _raw: provider
        });
      }
      const list = Array.from(map.values()).sort((a, b) => {
        const ac = a.ratingsCount || 0;
        const bc = b.ratingsCount || 0;
        if (ac === 0 && bc > 0) return 1;
        if (bc === 0 && ac > 0) return -1;
        if (bc !== ac) return bc - ac;
        return (b.rating || 0) - (a.rating || 0);
      });
      setCompanies(list);
    } catch (e) {
      console.warn('fetchCompanies error', e);
      setCompanies([]);
    } finally {
      setLoadingCompanies(false);
    }
  };

  useEffect(() => {
    fetchCompanies(selectedCategory);
  }, [selectedCategory]);

  const filteredCompanies = useMemo(() => {
    let list = companies;
    if (searchQuery.length > 1) {
      const lowercasedQuery = searchQuery.toLowerCase();
      list = list.filter(
        c => c.name.toLowerCase().includes(lowercasedQuery) ||
             c.category.toLowerCase().includes(lowercasedQuery)
      );
    }
    return list;
  }, [searchQuery, companies]);

  const handleCategoryPress = (categoryName: string) => {
    setSearchQuery('');
    setSelectedCategory(prev => (prev === categoryName ? null : categoryName));
  };

  const handleCompanyPress = (company: Company) => {
    setSelectedCompany(company);
  };

  const handleCloseModal = () => {
    setSelectedCompany(null);
  };

  const handleNavigateToRate = (company: Company) => {
    handleCloseModal();
    navigation.navigate('MyOrdersTab', {
      screen: 'RateProvider',
      params: { companyToRate: company }
    });
  };
  const renderCompanies=()=>{
    if(loadingCompanies)return(
      <View style={styles.loadingBox}>
        <ActivityIndicator size="large" color="#4f46e5" />
        <Text style={styles.loadingText}>Carregando empresas...</Text>
      </View>
    );
    if(filteredCompanies.length>0)return filteredCompanies.map((company)=>(
      <CompanyCard key={company.id} company={company} onPress={()=>handleCompanyPress(company)} />
    ));
    return(
      <View style={styles.emptyState}>
        <Icon name="search-off" size={40} color="#9ca3af" />
        <Text style={styles.emptyStateText}>Nenhuma empresa encontrada. Tente uma busca diferente.</Text>
      </View>
    );
  };

  return (
    <View style={styles.container}>
      <ScrollView style={styles.scrollView} keyboardShouldPersistTaps="handled" onScroll={handleScroll} scrollEventThrottle={16}>
        <View style={[styles.headerSection, { paddingTop: insets.top + 16 }]}>
          <Text style={styles.headerTitle}>Encontrar Empresas</Text>
          <Text style={styles.headerSubtitle}>Busque prestadores e serviços</Text>
        </View>
        <View style={styles.content}>
          <View style={styles.searchContainer}>
            <Icon name="search" size={24} color="#9ca3af" />
            <TextInput placeholder="Buscar por nome ou categoria..." style={styles.searchInput} value={searchQuery} onChangeText={setSearchQuery} />
          </View>
          <View style={styles.categoriesSection}>
            <Text style={styles.sectionTitle}>Categorias</Text>
            <View style={styles.categoriesGrid}>
              {mockCategories.map((category) => (
                <TouchableOpacity key={category.id} style={[styles.categoryButton, selectedCategory === category.name ? styles.selectedCategory : styles.unselectedCategory]} onPress={() => handleCategoryPress(category.name)}>
                  <Icon name={category.icon} size={32} color={selectedCategory === category.name ? '#4f46e5' : '#6b7280'} />
                  <Text style={[styles.categoryText, selectedCategory === category.name ? styles.selectedCategoryText : styles.unselectedCategoryText]}>{category.name}</Text>
                </TouchableOpacity>
              ))}
            </View>
          </View>
          <View>
            <Text style={styles.sectionTitle}>{searchQuery || selectedCategory ? 'Resultados da Busca' : 'Empresas Populares'}</Text>
            {renderCompanies()}
          </View>
          <View style={{ height: insets.bottom + 16 }} />
        </View>
      </ScrollView>

      <Modal
        visible={!!selectedCompany}
        animationType="slide"
        transparent={true}
        onRequestClose={handleCloseModal}
      >
        <View style={styles.modalOverlay}>
          <View style={[styles.modalContent, { paddingBottom: insets.bottom + 16 }]}>
            <TouchableOpacity onPress={handleCloseModal} style={styles.closeButton}>
              <Icon name="close" size={30} color="#6b7280" />
            </TouchableOpacity>

            {selectedCompany && (
              <>
                <View style={styles.modalCompanyInfo}>
                    <Image source={selectedCompany.image} style={styles.modalCompanyAvatar} />
                    <Text style={styles.modalCompanyName}>{selectedCompany.name}</Text>
                    <Text style={styles.modalCompanyCategory}>{selectedCompany.category}</Text>
                    <View style={styles.modalRatingBadge}>
                        <Icon name="star" size={18} color="#f59e0b" />
                        <Text style={styles.modalRatingText}>{selectedCompany.rating}</Text>
                    </View>
                </View>

                <ScrollView>
                    <Text style={styles.modalDescription}>{selectedCompany.description}</Text>
                    <View style={styles.contactCard}>
                        <Text style={styles.contactTitle}>Contato</Text>
                        <Text style={styles.contactPhone}>{selectedCompany.phone}</Text>
                    </View>
                </ScrollView>

                {isRatingMode ? (
                  <TouchableOpacity
                    style={styles.rateButton}
                    onPress={() => handleNavigateToRate(selectedCompany!)}
                  >
                    <Text style={styles.actionButtonText}>Avaliar Empresa</Text>
                  </TouchableOpacity>
                ) : (
                  <TouchableOpacity
                    style={styles.quoteButton}
                    onPress={() => { handleCloseModal(); }}
                  >
                    <Text style={styles.actionButtonText}>Solicitar Orçamento</Text>
                  </TouchableOpacity>
                )}
              </>
            )}
          </View>
        </View>
      </Modal>

      <StatusBarOverlay show={showStatusBarOverlay} opacity={statusBarOpacity} backgroundColor="#4f46e5" />
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#4f46e5',
  },
  scrollView: {
    flex: 1,
  },
  headerSection: {
    backgroundColor: '#4f46e5',
    paddingHorizontal: 24,
    paddingBottom: 28,
  },
  headerTitle: {
    fontSize: 24,
    fontWeight: 'bold',
    color: 'white',
    marginBottom: 4,
  },
  headerSubtitle: {
    color: 'rgba(255,255,255,0.8)',
    fontSize: 14,
  },
  content: {
    backgroundColor: '#f3f4f6',
    borderTopLeftRadius: 24,
    borderTopRightRadius: 24,
    padding: 20,
    paddingBottom: 32,
    minHeight: 500,
  },
  searchContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: 'white',
    borderRadius: 12,
    padding: 12,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 1 },
    shadowOpacity: 0.05,
    shadowRadius: 2,
    elevation: 2,
    marginBottom: 24,
  },
  searchInput: {
    flex: 1,
    marginLeft: 12,
    fontSize: 18,
  },
  loadingBox: {
    backgroundColor: 'white',
    borderRadius: 12,
    padding: 24,
    alignItems: 'center',
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 1 },
    shadowOpacity: 0.05,
    shadowRadius: 2,
    elevation: 2,
  },
  loadingText: {
    color: '#6b7280',
    marginTop: 12,
    textAlign: 'center',
  },
  categoriesSection: {
    marginBottom: 24,
  },
  sectionTitle: {
    fontSize: 20,
    fontWeight: '600',
    color: '#374151',
    marginBottom: 12,
  },
  categoriesGrid: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    justifyContent: 'space-between',
  },
  categoryButton: {
    width: '48%',
    backgroundColor: 'white',
    borderRadius: 12,
    padding: 16,
    marginBottom: 12,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 1 },
    shadowOpacity: 0.05,
    shadowRadius: 2,
    elevation: 2,
    alignItems: 'center',
    borderWidth: 2,
  },
  selectedCategory: {
    borderColor: '#4f46e5',
  },
  unselectedCategory: {
    borderColor: 'transparent',
  },
  categoryText: {
    marginTop: 8,
    fontWeight: '600',
  },
  selectedCategoryText: {
    color: '#4f46e5',
  },
  unselectedCategoryText: {
    color: '#4b5563',
  },
  companyCard: {
    backgroundColor: 'white',
    borderRadius: 12,
    padding: 16,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 1 },
    shadowOpacity: 0.05,
    shadowRadius: 2,
    elevation: 2,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    marginBottom: 12,
  },
  companyInfo: {
    flexDirection: 'row',
    alignItems: 'center',
    flex: 1,
  },
  companyAvatar: {
    width: 48,
    height: 48,
    borderRadius: 24,
    marginRight: 16,
  },
  companyDetails: {
    flex: 1,
  },
  companyName: {
    fontSize: 18,
    fontWeight: '600',
    color: '#374151',
  },
  companyCategory: {
    color: '#6b7280',
  },
  ratingContainer: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  ratingText: {
    marginLeft: 4,
    fontWeight: 'bold',
  },
  emptyState: {
    backgroundColor: 'white',
    borderRadius: 12,
    padding: 24,
    alignItems: 'center',
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 1 },
    shadowOpacity: 0.05,
    shadowRadius: 2,
    elevation: 2,
  },
  emptyStateText: {
    color: '#6b7280',
    marginTop: 16,
    textAlign: 'center',
  },
  modalOverlay: {
    flex: 1,
    justifyContent: 'flex-end',
    backgroundColor: 'rgba(0, 0, 0, 0.5)',
  },
  modalContent: {
    backgroundColor: 'white',
    borderTopLeftRadius: 16,
    borderTopRightRadius: 16,
    padding: 24,
    maxHeight: '85%',
  },
  closeButton: {
    position: 'absolute',
    top: 16,
    right: 16,
    zIndex: 10,
    padding: 8,
  },
  modalCompanyInfo: {
    alignItems: 'center',
    marginBottom: 16,
  },
  modalCompanyAvatar: {
    width: 96,
    height: 96,
    borderRadius: 48,
    marginBottom: 16,
    borderWidth: 4,
    borderColor: 'white',
  },
  modalCompanyName: {
    fontSize: 24,
    fontWeight: 'bold',
    color: '#374151',
  },
  modalCompanyCategory: {
    fontSize: 18,
    color: '#6b7280',
  },
  modalRatingBadge: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#fef3c7',
    paddingHorizontal: 12,
    paddingVertical: 4,
    borderRadius: 12,
    marginTop: 8,
  },
  modalRatingText: {
    marginLeft: 8,
    fontWeight: 'bold',
    color: '#d97706',
  },
  modalDescription: {
    fontSize: 16,
    color: '#6b7280',
    textAlign: 'center',
    marginBottom: 24,
  },
  contactCard: {
    backgroundColor: 'white',
    borderRadius: 12,
    padding: 16,
    marginBottom: 16,
  },
  contactTitle: {
    fontSize: 18,
    fontWeight: '600',
    color: '#374151',
    marginBottom: 8,
  },
  contactPhone: {
    color: '#6b7280',
  },
  rateButton: {
    backgroundColor: '#f59e0b',
    borderRadius: 8,
    padding: 16,
    marginTop: 16,
  },
  quoteButton: {
    backgroundColor: '#4f46e5',
    borderRadius: 8,
    padding: 16,
    marginTop: 16,
  },
  actionButtonText: {
    textAlign: 'center',
    color: 'white',
    fontWeight: 'bold',
    fontSize: 18,
  },
});