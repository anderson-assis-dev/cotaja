import React, { useState, useMemo } from 'react';
import { View, Text, TextInput, ScrollView, TouchableOpacity, Modal, Image, StyleSheet } from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import Icon from 'react-native-vector-icons/MaterialIcons';
import { useRoute, useNavigation } from '@react-navigation/native';
import { useStatusBarOverlay } from '../../hooks/useStatusBarOverlay';
import { StatusBarOverlay } from '../../components/StatusBarOverlay';

// --- Dados Mockados Enriquecidos ---
const mockCompanies = [
  { id: '1', name: 'Eletro Flash', category: 'Reparos', rating: 4.8, description: 'Especialistas em reparos elétricos residenciais e comerciais. Atendimento 24h.', phone: '(11) 99999-1111', image: require('../../../assets/icon.png') },
  { id: '2', name: 'Limpa Tudo', category: 'Limpeza', rating: 4.9, description: 'Serviços de limpeza pós-obra, faxinas pesadas e manutenção. Produtos inclusos.', phone: '(21) 99999-2222', image: require('../../../assets/icon.png') },
  { id: '3', name: 'Tech Experts', category: 'Tecnologia', rating: 5.0, description: 'Manutenção de computadores, notebooks e redes. Orçamento sem compromisso.', phone: '(31) 99999-3333', image: require('../../../assets/icon.png') },
  { id: '4', name: 'Jardim Secreto', category: 'Jardinagem', rating: 4.7, description: 'Criação e manutenção de jardins, paisagismo e controle de pragas.', phone: '(41) 99999-4444', image: require('../../../assets/icon.png') },
  { id: '5', name: 'Mestre Cuca Aulas', category: 'Aulas', rating: 4.9, description: 'Aulas de culinária para iniciantes e avançados. Turmas e particular.', phone: '(51) 99999-5555', image: require('../../../assets/icon.png') },
  { id: '6', name: 'Design Criativo', category: 'Design', rating: 4.8, description: 'Criação de logos, identidade visual e materiais gráficos para sua empresa.', phone: '(61) 99999-6666', image: require('../../../assets/icon.png') },
  { id: '7', name: 'Festa & Cia', category: 'Eventos', rating: 4.9, description: 'Organização completa de festas e eventos. Decoração, buffet e mais.', phone: '(71) 99999-7777', image: require('../../../assets/icon.png') },
  { id: '8', name: 'Reparos Rápidos', category: 'Reparos', rating: 4.6, description: 'Pequenos reparos hidráulicos e de alvenaria. O famoso "marido de aluguel".', phone: '(81) 99999-8888', image: require('../../../assets/icon.png') },
];

const mockCategories = [
  { id: '1', name: 'Limpeza', icon: 'cleaning-services' },
  { id: '2', name: 'Reparos', icon: 'build' },
  { id: '3', name: 'Tecnologia', icon: 'computer' },
  { id: '4', name: 'Aulas', icon: 'school' },
  { id: '5', name: 'Design', icon: 'design-services' },
  { id: '6', name: 'Eventos', icon: 'celebration' },
];

// --- Tipos ---
type Company = typeof mockCompanies[0];

// --- Componente de Card da Empresa ---
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

// --- Tela Principal ---
export default function SearchScreen() {
  const insets = useSafeAreaInsets();
  const route = useRoute();
  const navigation = useNavigation<any>();

  const [searchQuery, setSearchQuery] = useState('');
  const [selectedCategory, setSelectedCategory] = useState<string | null>(null);
  const [selectedCompany, setSelectedCompany] = useState<Company | null>(null);
  const { showStatusBarOverlay, statusBarOpacity, handleScroll } = useStatusBarOverlay();

  const isRatingMode = (route.params as any)?.isRatingMode || false;

  const filteredCompanies = useMemo(() => {
    let companies = mockCompanies;

    // Filtro por categoria
    if (selectedCategory) {
      companies = companies.filter(c => c.category === selectedCategory);
    }

    // Filtro por texto de busca (nome da empresa ou categoria)
    if (searchQuery.length > 1) {
      const lowercasedQuery = searchQuery.toLowerCase();
      companies = companies.filter(
        c => c.name.toLowerCase().includes(lowercasedQuery) ||
             c.category.toLowerCase().includes(lowercasedQuery)
      );
    }

    return companies;
  }, [searchQuery, selectedCategory]);

  const handleCategoryPress = (categoryName: string) => {
    setSearchQuery(''); // Limpa a busca por texto ao clicar na categoria
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

  return (
    <View style={styles.outerContainer}>
      <ScrollView
        style={styles.container}
        keyboardShouldPersistTaps="handled"
        onScroll={handleScroll}
        scrollEventThrottle={16}
      >
        <View style={[styles.content, { paddingTop: insets.top + 60, marginTop: -60 }]}>
          <Text style={styles.pageTitle}>Encontrar Empresas</Text>
          <Text style={styles.pageSubtitle}>Busque prestadores e serviços</Text>

          {/* Search Bar */}
          <View style={styles.searchContainer}>
            <Icon name="search" size={24} color="#9ca3af" />
            <TextInput
              placeholder="Buscar por nome ou categoria..."
              style={styles.searchInput}
              value={searchQuery}
              onChangeText={setSearchQuery}
            />
          </View>

          {/* Categorias */}
          <View style={styles.categoriesSection}>
            <Text style={styles.sectionTitle}>Categorias</Text>
            <View style={styles.categoriesGrid}>
              {mockCategories.map((category) => (
                <TouchableOpacity
                  key={category.id}
                  style={[
                    styles.categoryButton,
                    selectedCategory === category.name ? styles.selectedCategory : styles.unselectedCategory
                  ]}
                  onPress={() => handleCategoryPress(category.name)}
                >
                  <Icon name={category.icon} size={32} color={selectedCategory === category.name ? '#4f46e5' : '#6b7280'} />
                  <Text style={[
                    styles.categoryText,
                    selectedCategory === category.name ? styles.selectedCategoryText : styles.unselectedCategoryText
                  ]}>{category.name}</Text>
                </TouchableOpacity>
              ))}
            </View>
          </View>

          {/* Resultados */}
          <View>
            <Text style={styles.sectionTitle}>
              {searchQuery || selectedCategory ? 'Resultados da Busca' : 'Empresas Populares'}
            </Text>
            {filteredCompanies.length > 0 ? (
              filteredCompanies.map((company) => (
                <CompanyCard key={company.id} company={company} onPress={() => handleCompanyPress(company)} />
              ))
            ) : (
              <View style={styles.emptyState}>
                  <Icon name="search-off" size={40} color="#9ca3af" />
                  <Text style={styles.emptyStateText}>Nenhuma empresa encontrada. Tente uma busca diferente.</Text>
              </View>
            )}
          </View>
        </View>
      </ScrollView>

      {/* --- Modal de Detalhes da Empresa --- */}
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
                    onPress={() => { /* Navegar para criar pedido */ handleCloseModal(); }}
                  >
                    <Text style={styles.actionButtonText}>Solicitar Orçamento</Text>
                  </TouchableOpacity>
                )}
              </>
            )}
          </View>
        </View>
      </Modal>

      {/* Status Bar Overlay */}
      <StatusBarOverlay show={showStatusBarOverlay} opacity={statusBarOpacity} backgroundColor="#4f46e5" />
    </View>
  );
}

const styles = StyleSheet.create({
  outerContainer: {
    flex: 1,
    backgroundColor: '#f3f4f6',
  },
  container: {
    flex: 1,
    backgroundColor: '#f3f4f6',
  },
  content: {
    padding: 24,
  },
  pageTitle: {
    fontSize: 30,
    fontWeight: 'bold',
    color: '#374151',
    marginBottom: 4,
  },
  pageSubtitle: {
    color: '#6b7280',
    fontSize: 14,
    marginBottom: 16,
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
    backgroundColor: '#f3f4f6',
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