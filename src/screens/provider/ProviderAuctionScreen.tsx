import { useState } from 'react';
import { View, Text, ScrollView, TouchableOpacity, Modal, Alert } from 'react-native';
import { useNavigation } from '@react-navigation/native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import Icon from 'react-native-vector-icons/MaterialIcons';

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
}

// Dados mockados para exemplo - demandas com propostas recebidas
const mockAuctions: Auction[] = [
  {
    id: '1',
    title: 'Pintura de apartamento',
    category: 'Pintura',
    budget: 'R$ 3.000,00',
    deadline: '15 dias',
    status: 'Em andamento',
    description: 'Preciso pintar um apartamento de 80m², 2 quartos, sala, cozinha e banheiro. Cores neutras.',
    location: 'São Paulo, SP',
    clientRating: 4.8,
    proposals: [
      {
        id: 'p1',
        providerName: 'João Silva',
        providerRating: 4.9,
        price: 'R$ 2.800,00',
        deadline: '12 dias',
        description: 'Trabalho com tinta premium, proteção de móveis incluída',
        ranking: 1,
      },
      {
        id: 'p2',
        providerName: 'Maria Santos',
        providerRating: 4.7,
        price: 'R$ 2.900,00',
        deadline: '10 dias',
        description: 'Especialista em pintura residencial, acabamento perfeito',
        ranking: 2,
      },
      {
        id: 'p3',
        providerName: 'Carlos Oliveira',
        providerRating: 4.5,
        price: 'R$ 3.100,00',
        deadline: '14 dias',
        description: 'Pintura profissional com garantia de 1 ano',
        ranking: 3,
      },
    ],
    insights: [
      'O orçamento médio da categoria é R$ 2.750,00',
      'Prazo médio de execução: 11 dias',
      'Você tem avaliação superior à média (4.9 vs 4.6)',
      'Sugestão: Ofereça R$ 2.750,00 em 10 dias para ficar em 1º lugar'
    ]
  },
  {
    id: '2',
    title: 'Instalação de ar condicionado',
    category: 'Elétrica',
    budget: 'R$ 1.500,00',
    deadline: '7 dias',
    status: 'Em andamento',
    description: 'Instalar ar condicionado split 12.000 BTUs na sala. Já tenho o aparelho.',
    location: 'Rio de Janeiro, RJ',
    clientRating: 4.6,
    proposals: [
      {
        id: 'p4',
        providerName: 'Pedro Costa',
        providerRating: 4.8,
        price: 'R$ 1.400,00',
        deadline: '5 dias',
        description: 'Instalação profissional com garantia de 2 anos',
        ranking: 1,
      },
      {
        id: 'p5',
        providerName: 'Ana Ferreira',
        providerRating: 4.6,
        price: 'R$ 1.450,00',
        deadline: '4 dias',
        description: 'Técnica certificada, instalação rápida e segura',
        ranking: 2,
      },
    ],
    insights: [
      'O orçamento médio da categoria é R$ 1.350,00',
      'Prazo médio de execução: 5 dias',
      'Você tem avaliação superior à média (4.8 vs 4.5)',
      'Sugestão: Ofereça R$ 1.350,00 em 4 dias para superar a concorrência'
    ]
  },
  {
    id: '3',
    title: 'Limpeza pós-obra',
    category: 'Limpeza',
    budget: 'R$ 800,00',
    deadline: '3 dias',
    status: 'Em andamento',
    description: 'Limpeza completa de casa após reforma. 120m², 3 quartos, 2 banheiros.',
    location: 'Belo Horizonte, MG',
    clientRating: 4.9,
    proposals: [
      {
        id: 'p6',
        providerName: 'Lucia Mendes',
        providerRating: 4.9,
        price: 'R$ 750,00',
        deadline: '2 dias',
        description: 'Limpeza profissional com produtos eco-friendly',
        ranking: 1,
      },
      {
        id: 'p7',
        providerName: 'Roberto Lima',
        providerRating: 4.7,
        price: 'R$ 780,00',
        deadline: '3 dias',
        description: 'Limpeza completa incluindo vidros e azulejos',
        ranking: 2,
      },
    ],
    insights: [
      'O orçamento médio da categoria é R$ 720,00',
      'Prazo médio de execução: 2.5 dias',
      'Você tem avaliação superior à média (4.9 vs 4.6)',
      'Sugestão: Ofereça R$ 720,00 em 2 dias para garantir o primeiro lugar'
    ]
  },
];

export default function ProviderAuctionScreen() {
  const navigation = useNavigation();
  const insets = useSafeAreaInsets();
  const [selectedAuction, setSelectedAuction] = useState<Auction | null>(null);
  const [showDetails, setShowDetails] = useState(false);

  const handleAuctionPress = (auction: Auction) => {
    setSelectedAuction(auction);
    setShowDetails(true);
  };

  const handleSendProposal = (auction: Auction) => {
    setShowDetails(false);
    // Navegar para a tela de envio de proposta com os dados da demanda
    (navigation as any).navigate('SendProposal', { demand: auction });
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

  return (
    <ScrollView className="flex-1 bg-gray-100" style={{ paddingTop: insets.top }}>
      <View className="p-6">
        <Text className="text-2xl font-bold mb-6">Leilões em Andamento</Text>
        <Text className="text-gray-600 mb-6">
          Demandas da sua região e categoria com propostas recebidas
        </Text>

        {mockAuctions.map((auction) => (
          <TouchableOpacity
            key={auction.id}
            className="bg-white rounded-xl p-6 shadow-sm mb-4"
            onPress={() => handleAuctionPress(auction)}
          >
            <View className="flex-row justify-between items-start mb-4">
              <Text className="text-lg font-bold flex-1 mr-4">
                {auction.title}
              </Text>
              <View className="bg-green-100 px-3 py-1 rounded-full">
                <Text className="text-green-600">{auction.status}</Text>
              </View>
            </View>

            <View className="flex-row items-center mb-4">
              <View className="bg-indigo-100 px-3 py-1 rounded-full">
                <Text className="text-indigo-600">{auction.category}</Text>
              </View>
              <Text className="text-gray-500 ml-4">
                Orçamento: {auction.budget}
              </Text>
            </View>

            <View className="flex-row items-center mb-4">
              <Icon name="location-on" size={16} color="#6b7280" />
              <Text className="text-gray-600 ml-1">{auction.location}</Text>
              <View className="flex-row items-center ml-4">
                <Icon name="star" size={16} color="#fbbf24" />
                <Text className="text-gray-600 ml-1">{auction.clientRating}</Text>
              </View>
            </View>

            <View className="bg-blue-50 rounded-lg p-4 mb-4">
              <Text className="font-semibold mb-2 text-blue-800">
                {auction.proposals.length} {auction.proposals.length === 1 ? 'proposta recebida' : 'propostas recebidas'}
              </Text>
              <Text className="text-blue-600 text-sm">
                Clique para ver detalhes e enviar sua proposta
              </Text>
            </View>

            <View className="flex-row justify-between items-center">
              <Text className="text-gray-600">
                Prazo: {auction.deadline}
              </Text>
              <View className="flex-row items-center">
                <Icon name="visibility" size={20} color="#4f46e5" />
                <Text className="text-indigo-600 ml-1 font-semibold">
                  Ver Detalhes
                </Text>
              </View>
            </View>
          </TouchableOpacity>
        ))}

        <TouchableOpacity
          className="bg-indigo-600 rounded-lg p-4 mt-6"
          onPress={() => navigation.navigate('ProviderHome' as never)}
        >
          <Text className="text-center text-white font-bold text-lg">
            Voltar para Home
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
            <Text className="text-xl font-bold">Detalhes da Demanda</Text>
            <TouchableOpacity onPress={() => setShowDetails(false)}>
              <Icon name="close" size={24} color="#6b7280" />
            </TouchableOpacity>
          </View>

          {selectedAuction && (
            <ScrollView className="flex-1 p-6">
              {/* Informações da Demanda */}
              <View className="bg-gray-50 rounded-xl p-6 mb-6">
                <Text className="text-xl font-bold mb-4">{selectedAuction.title}</Text>
                <View className="flex-row items-center mb-3">
                  <View className="bg-indigo-100 px-3 py-1 rounded-full">
                    <Text className="text-indigo-600">{selectedAuction.category}</Text>
                  </View>
                  <Text className="text-gray-500 ml-4">
                    Orçamento: {selectedAuction.budget}
                  </Text>
                </View>
                <Text className="text-gray-600 mb-3">{selectedAuction.description}</Text>
                <View className="flex-row items-center">
                  <Icon name="location-on" size={16} color="#6b7280" />
                  <Text className="text-gray-600 ml-1">{selectedAuction.location}</Text>
                  <View className="flex-row items-center ml-4">
                    <Icon name="star" size={16} color="#fbbf24" />
                    <Text className="text-gray-600 ml-1">{selectedAuction.clientRating}</Text>
                  </View>
                </View>
              </View>

              {/* Ranking das Propostas */}
              <Text className="text-lg font-bold mb-4">Ranking das Propostas</Text>
              {selectedAuction.proposals.map((proposal) => (
                <View
                  key={proposal.id}
                  className="bg-white border border-gray-200 rounded-xl p-4 mb-3"
                >
                  <View className="flex-row justify-between items-start mb-3">
                    <View className="flex-row items-center">
                      <Text className="text-2xl mr-2">{getRankingIcon(proposal.ranking)}</Text>
                      <View>
                        <Text className="font-semibold">{proposal.providerName}</Text>
                        <View className="flex-row items-center">
                          <Icon name="star" size={14} color="#fbbf24" />
                          <Text className="text-gray-600 ml-1">{proposal.providerRating}</Text>
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
                </View>
              ))}

              {/* Insights */}
              <View className="bg-yellow-50 rounded-xl p-6 mb-6">
                <Text className="text-lg font-bold mb-4 text-yellow-800">
                  💡 Insights para sua Proposta
                </Text>
                {selectedAuction.insights.map((insight, index) => (
                  <View key={index} className="flex-row items-start mb-2">
                    <Text className="text-yellow-600 mr-2">•</Text>
                    <Text className="text-yellow-800 flex-1">{insight}</Text>
                  </View>
                ))}
              </View>

              {/* Botão de Enviar Proposta */}
              <TouchableOpacity
                className="bg-indigo-600 rounded-lg p-4 mb-6"
                onPress={() => handleSendProposal(selectedAuction)}
              >
                <Text className="text-center text-white font-bold text-lg">
                  Enviar Minha Proposta
                </Text>
              </TouchableOpacity>
            </ScrollView>
          )}
        </View>
      </Modal>
    </ScrollView>
  );
} 