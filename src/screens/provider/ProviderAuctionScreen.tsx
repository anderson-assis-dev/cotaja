import { View, Text, ScrollView, TouchableOpacity } from 'react-native';
import { useNavigation } from '@react-navigation/native';

// Dados mockados para exemplo
const mockAuctions = [
  {
    id: '1',
    title: 'Pintura de apartamento',
    category: 'Pintura',
    budget: 'R$ 3.000,00',
    deadline: '15 dias',
    status: 'Em andamento',
    myProposal: {
      price: 'R$ 2.800,00',
      deadline: '12 dias',
    },
    otherProposals: 2,
  },
  {
    id: '2',
    title: 'Instalação de ar condicionado',
    category: 'Elétrica',
    budget: 'R$ 1.500,00',
    deadline: '7 dias',
    status: 'Em andamento',
    myProposal: {
      price: 'R$ 1.400,00',
      deadline: '5 dias',
    },
    otherProposals: 1,
  },
];

export default function ProviderAuctionScreen() {
  const navigation = useNavigation();

  return (
    <ScrollView className="flex-1 bg-gray-100">
      <View className="p-6">
        <Text className="text-2xl font-bold mb-6">Leilões em Andamento</Text>

        {mockAuctions.map((auction) => (
          <View
            key={auction.id}
            className="bg-white rounded-xl p-6 shadow-sm mb-4"
          >
            <View className="flex-row justify-between items-start mb-4">
              <Text className="text-lg font-bold flex-1 mr-4">
                {auction.title}
              </Text>
              <View className="bg-yellow-100 px-3 py-1 rounded-full">
                <Text className="text-yellow-600">{auction.status}</Text>
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

            <View className="bg-gray-50 rounded-lg p-4 mb-4">
              <Text className="font-semibold mb-2">Sua Proposta</Text>
              <View className="flex-row justify-between">
                <View>
                  <Text className="text-gray-500">Valor</Text>
                  <Text className="font-bold text-lg">{auction.myProposal.price}</Text>
                </View>
                <View>
                  <Text className="text-gray-500">Prazo</Text>
                  <Text className="font-bold text-lg">{auction.myProposal.deadline}</Text>
                </View>
              </View>
            </View>

            <View className="flex-row justify-between items-center">
              <Text className="text-gray-600">
                {auction.otherProposals} {auction.otherProposals === 1 ? 'outra proposta' : 'outras propostas'}
              </Text>
              <TouchableOpacity
                className="bg-indigo-600 rounded-lg px-4 py-2"
                onPress={() => navigation.navigate('SendProposal' as never)}
              >
                <Text className="text-white font-semibold">
                  Atualizar Proposta
                </Text>
              </TouchableOpacity>
            </View>
          </View>
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
    </ScrollView>
  );
} 