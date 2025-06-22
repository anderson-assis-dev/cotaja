import React, { useState, useMemo } from 'react';
import { View, Text, TextInput, ScrollView, TouchableOpacity, Modal, Image } from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import Icon from 'react-native-vector-icons/MaterialIcons';
import { useRoute, useNavigation } from '@react-navigation/native';

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
  <TouchableOpacity onPress={onPress} className="bg-white rounded-xl p-4 shadow-sm flex-row items-center justify-between mb-3">
    <View className="flex-row items-center flex-1">
        <Image source={company.image} className="w-12 h-12 rounded-full mr-4" />
        <View className="flex-1">
            <Text className="text-lg font-semibold text-gray-800">{company.name}</Text>
            <Text className="text-gray-500">{company.category}</Text>
        </View>
    </View>
    <View className="flex-row items-center">
      <Icon name="star" size={18} color="#f59e0b" />
      <Text className="ml-1 font-bold">{company.rating}</Text>
    </View>
  </TouchableOpacity>
);

// --- Tela Principal ---
export default function SearchScreen() {
  const insets = useSafeAreaInsets();
  const route = useRoute();
  const navigation = useNavigation();

  const [searchQuery, setSearchQuery] = useState('');
  const [selectedCategory, setSelectedCategory] = useState<string | null>(null);
  const [selectedCompany, setSelectedCompany] = useState<Company | null>(null);

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
    (navigation as any).navigate('MyOrdersTab', {
      screen: 'RateProvider',
      params: { companyToRate: company }
    });
  };

  return (
    <>
      <ScrollView style={{ paddingTop: insets.top }} className="flex-1 bg-gray-100" keyboardShouldPersistTaps="handled">
        <View className="p-6">
          <Text className="text-3xl font-bold text-gray-800 mb-4">Encontrar Empresas</Text>
          
          {/* Search Bar */}
          <View className="flex-row items-center bg-white rounded-xl p-3 shadow-sm mb-6">
            <Icon name="search" size={24} color="#9ca3af" />
            <TextInput
              placeholder="Buscar por nome ou categoria..."
              className="flex-1 ml-3 text-lg"
              value={searchQuery}
              onChangeText={setSearchQuery}
            />
          </View>

          {/* Categorias */}
          <View className="mb-6">
            <Text className="text-xl font-semibold text-gray-800 mb-3">Categorias</Text>
            <View className="flex-row flex-wrap justify-between">
              {mockCategories.map((category) => (
                <TouchableOpacity 
                  key={category.id} 
                  className={`w-[48%] bg-white rounded-xl p-4 mb-3 shadow-sm items-center border-2 ${selectedCategory === category.name ? 'border-indigo-500' : 'border-transparent'}`}
                  onPress={() => handleCategoryPress(category.name)}
                >
                  <Icon name={category.icon} size={32} color={selectedCategory === category.name ? '#4f46e5' : '#6b7280'} />
                  <Text className={`mt-2 font-semibold ${selectedCategory === category.name ? 'text-indigo-600' : 'text-gray-700'}`}>{category.name}</Text>
                </TouchableOpacity>
              ))}
            </View>
          </View>

          {/* Resultados */}
          <View>
            <Text className="text-xl font-semibold text-gray-800 mb-3">
              {searchQuery || selectedCategory ? 'Resultados da Busca' : 'Empresas Populares'}
            </Text>
            {filteredCompanies.length > 0 ? (
              filteredCompanies.map((company) => (
                <CompanyCard key={company.id} company={company} onPress={() => handleCompanyPress(company)} />
              ))
            ) : (
              <View className="bg-white rounded-xl p-6 items-center shadow-sm">
                  <Icon name="search-off" size={40} color="#9ca3af" />
                  <Text className="text-gray-500 mt-4 text-center">Nenhuma empresa encontrada. Tente uma busca diferente.</Text>
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
        <View className="flex-1 justify-end bg-black/50">
          <View className="bg-gray-100 rounded-t-2xl p-6 max-h-[85%]" style={{ paddingBottom: insets.bottom + 16 }}>
            <TouchableOpacity onPress={handleCloseModal} className="absolute top-4 right-4 z-10 p-2">
              <Icon name="close" size={30} color="#6b7280" />
            </TouchableOpacity>
            
            {selectedCompany && (
              <>
                <View className="items-center mb-4">
                    <Image source={selectedCompany.image} className="w-24 h-24 rounded-full mb-4 border-4 border-white" />
                    <Text className="text-2xl font-bold text-gray-800">{selectedCompany.name}</Text>
                    <Text className="text-lg text-gray-500">{selectedCompany.category}</Text>
                    <View className="flex-row items-center bg-yellow-100 px-3 py-1 rounded-full mt-2">
                        <Icon name="star" size={18} color="#f59e0b" />
                        <Text className="ml-2 font-bold text-yellow-600">{selectedCompany.rating}</Text>
                    </View>
                </View>
                
                <ScrollView>
                    <Text className="text-base text-gray-600 text-center mb-6">{selectedCompany.description}</Text>
                    <View className="bg-white rounded-xl p-4 mb-4">
                        <Text className="text-lg font-semibold text-gray-800 mb-2">Contato</Text>
                        <Text className="text-gray-600">{selectedCompany.phone}</Text>
                    </View>
                </ScrollView>

                {isRatingMode ? (
                  <TouchableOpacity 
                    className="bg-amber-500 rounded-lg p-4 mt-4"
                    onPress={() => handleNavigateToRate(selectedCompany!)}
                  >
                    <Text className="text-center text-white font-bold text-lg">Avaliar Empresa</Text>
                  </TouchableOpacity>
                ) : (
                  <TouchableOpacity 
                    className="bg-indigo-600 rounded-lg p-4 mt-4"
                    onPress={() => { /* Navegar para criar pedido */ handleCloseModal(); }}
                  >
                    <Text className="text-center text-white font-bold text-lg">Solicitar Orçamento</Text>
                  </TouchableOpacity>
                )}
              </>
            )}
          </View>
        </View>
      </Modal>
    </>
  );
} 