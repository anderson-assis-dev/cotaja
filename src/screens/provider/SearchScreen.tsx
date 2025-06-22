import React, { useState, useEffect } from 'react';
import { View, Text, TextInput, ScrollView, TouchableOpacity } from 'react-native';
import { useNavigation } from '@react-navigation/native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import Icon from 'react-native-vector-icons/MaterialIcons';

// Dados mockados para exemplo
const mockCategories = [
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

// Dados mockados das demandas para busca
const mockDemands = [
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
  const navigation = useNavigation();
  const insets = useSafeAreaInsets();
  const [searchQuery, setSearchQuery] = useState('');
  const [filteredDemands, setFilteredDemands] = useState<any[]>([]);
  const [showSearchResults, setShowSearchResults] = useState(false);

  // Função para filtrar demandas baseada na busca
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

  const handleCategoryPress = (category: any) => {
    // Navegar para a tela de leilões com filtro por categoria
    (navigation as any).navigate('AuctionsTab', {
      screen: 'ProviderAuction',
      params: { 
        profileType: 'provider',
        selectedCategory: category.name,
        fromSearch: true
      }
    });
  };

  const handleDemandPress = (demand: any) => {
    // Navegar para a tela de leilões com filtro por categoria da demanda
    (navigation as any).navigate('AuctionsTab', {
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

  return (
    <ScrollView style={{ paddingTop: insets.top }} className="flex-1 bg-gray-100">
      <View className="p-6">
        <Text className="text-3xl font-bold text-gray-800 mb-4">Buscar Demandas</Text>
        
        {/* Search Bar */}
        <View className="flex-row items-center bg-white rounded-xl p-3 shadow-sm mb-6">
          <Icon name="search" size={24} color="#9ca3af" />
          <TextInput
            placeholder="Buscar por palavra-chave..."
            className="flex-1 ml-3 text-lg"
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

        {/* Resultados da Busca */}
        {showSearchResults && (
          <View className="mb-6">
            <View className="flex-row justify-between items-center mb-3">
              <Text className="text-lg font-semibold text-gray-800">
                Resultados da busca
              </Text>
              <Text className="text-gray-500">
                {filteredDemands.length} {filteredDemands.length === 1 ? 'resultado' : 'resultados'}
              </Text>
            </View>
            
            {filteredDemands.length > 0 ? (
              <View className="space-y-3">
                {filteredDemands.map((demand) => (
                  <TouchableOpacity
                    key={demand.id}
                    className="bg-white rounded-xl p-4 shadow-sm"
                    onPress={() => handleDemandPress(demand)}
                  >
                    <View className="flex-row justify-between items-start mb-2">
                      <Text className="text-lg font-semibold text-gray-800 flex-1 mr-2">
                        {demand.title}
                      </Text>
                      <View className="bg-indigo-100 px-2 py-1 rounded-full">
                        <Text className="text-indigo-600 text-sm">{demand.category}</Text>
                      </View>
                    </View>
                    
                    <Text className="text-gray-600 text-sm mb-2" numberOfLines={2}>
                      {demand.description}
                    </Text>
                    
                    <View className="flex-row justify-between items-center">
                      <View className="flex-row items-center">
                        <Icon name="location-on" size={14} color="#6b7280" />
                        <Text className="text-gray-500 text-sm ml-1">{demand.location}</Text>
                      </View>
                      <Text className="text-green-600 font-semibold">{demand.budget}</Text>
                    </View>
                  </TouchableOpacity>
                ))}
              </View>
            ) : (
              <View className="bg-white rounded-xl p-6 items-center">
                <Icon name="search-off" size={48} color="#9ca3af" />
                <Text className="text-lg font-semibold text-gray-600 mt-3 mb-1">
                  Nenhum resultado encontrado
                </Text>
                <Text className="text-gray-500 text-center">
                  Tente usar outras palavras-chave ou explore as categorias abaixo
                </Text>
              </View>
            )}
          </View>
        )}

        {/* Categorias - só mostra quando não há busca ativa */}
        {!showSearchResults && (
          <View className="mb-6">
            <Text className="text-xl font-semibold text-gray-800 mb-3">Categorias</Text>
            <Text className="text-gray-600 mb-4">
              Selecione uma categoria para ver as demandas disponíveis
            </Text>
            <View className="flex-row flex-wrap justify-between">
              {mockCategories.map((category) => (
                <TouchableOpacity 
                  key={category.id} 
                  className="w-[48%] bg-white rounded-xl p-4 mb-3 shadow-sm items-center"
                  onPress={() => handleCategoryPress(category)}
                >
                  <Icon name={category.icon} size={32} color="#4f46e5" />
                  <Text className="mt-2 font-semibold text-gray-700 text-center">{category.name}</Text>
                </TouchableOpacity>
              ))}
            </View>
          </View>
        )}

        {/* Informações - só mostra quando não há busca ativa */}
        {!showSearchResults && (
          <View className="bg-blue-50 rounded-xl p-4 mb-6">
            <Text className="text-blue-800 font-semibold mb-2">💡 Como funciona?</Text>
            <Text className="text-blue-700 text-sm">
              • Digite palavras-chave para buscar demandas específicas{'\n'}
              • Selecione uma categoria para ver todas as demandas{'\n'}
              • Demandas com leilão ativo terão um ícone especial{'\n'}
              • Seja o primeiro a enviar proposta em demandas sem propostas{'\n'}
              • Encontre oportunidades que combinam com seus serviços
            </Text>
          </View>
        )}

        {/* Botão para ver todas as demandas - só mostra quando não há busca ativa */}
        {!showSearchResults && (
          <TouchableOpacity
            className="bg-indigo-600 rounded-lg p-4"
            onPress={() => {
              (navigation as any).navigate('AuctionsTab', {
                screen: 'ProviderAuction',
                params: { 
                  profileType: 'provider',
                  fromSearch: true
                }
              });
            }}
          >
            <Text className="text-center text-white font-bold text-lg">
              Ver Todas as Demandas
            </Text>
          </TouchableOpacity>
        )}
      </View>
    </ScrollView>
  );
} 