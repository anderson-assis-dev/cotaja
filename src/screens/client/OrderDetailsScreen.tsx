import { View, Text, ScrollView, TouchableOpacity, Image } from 'react-native';
import { useNavigation, useRoute } from '@react-navigation/native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';

// Dados mockados para exemplo
const mockOrder = {
  id: '1',
  title: 'Pintura de apartamento',
  category: 'Pintura',
  description: 'Preciso pintar um apartamento de 80m², 2 quartos, sala, cozinha e banheiro.',
  budget: 'R$ 3.000,00',
  deadline: '15 dias',
  status: 'Em andamento',
  proposals: [
    {
      id: '1',
      provider: {
        name: 'João Silva',
        rating: 4.8,
        avatar: require('../../../assets/splash-icon.png'),
      },
      price: 'R$ 2.800,00',
      deadline: '12 dias',
      description: 'Tenho experiência em pintura residencial e comercial.',
    },
    {
      id: '2',
      provider: {
        name: 'Maria Santos',
        rating: 4.9,
        avatar: require('../../../assets/splash-icon.png'),
      },
      price: 'R$ 3.200,00',
      deadline: '10 dias',
      description: 'Especialista em pintura com mais de 10 anos de experiência.',
    },
  ],
};

export default function OrderDetailsScreen() {
  const navigation = useNavigation();
  const route = useRoute();
  const insets = useSafeAreaInsets();
  return (
    <ScrollView className="flex-1 bg-gray-100" style={{ paddingTop: insets.top }}>
      <View className="p-6">
        <View className="bg-white rounded-xl p-6 shadow-sm mb-6">
          <Text className="text-2xl font-bold mb-4">{mockOrder.title}</Text>
          
          <View className="flex-row items-center mb-4">
            <View className="bg-indigo-100 px-3 py-1 rounded-full">
              <Text className="text-indigo-600">{mockOrder.category}</Text>
            </View>
            <View className="bg-green-100 px-3 py-1 rounded-full ml-2">
              <Text className="text-green-600">{mockOrder.status}</Text>
            </View>
          </View>

          <Text className="text-gray-600 mb-4">{mockOrder.description}</Text>

          <View className="flex-row justify-between mb-4">
            <View>
              <Text className="text-gray-500">Orçamento</Text>
              <Text className="font-bold text-lg">{mockOrder.budget}</Text>
            </View>
            <View>
              <Text className="text-gray-500">Prazo</Text>
              <Text className="font-bold text-lg">{mockOrder.deadline}</Text>
            </View>
          </View>
        </View>

        <Text className="text-xl font-bold mb-4">Propostas Recebidas</Text>
        
        {mockOrder.proposals.map((proposal) => (
          <View
            key={proposal.id}
            className="bg-white rounded-xl p-6 shadow-sm mb-4"
          >
            <View className="flex-row items-center mb-4">
              <Image
                source={proposal.provider.avatar}
                className="w-12 h-12 rounded-full mr-4"
              />
              <View>
                <Text className="font-bold text-lg">{proposal.provider.name}</Text>
                <View className="flex-row items-center">
                  <Text className="text-yellow-500">★</Text>
                  <Text className="text-gray-600 ml-1">
                    {proposal.provider.rating}
                  </Text>
                </View>
              </View>
            </View>

            <Text className="text-gray-600 mb-4">{proposal.description}</Text>

            <View className="flex-row justify-between items-center">
              <View>
                <Text className="text-gray-500">Valor</Text>
                <Text className="font-bold text-lg">{proposal.price}</Text>
              </View>
              <View>
                <Text className="text-gray-500">Prazo</Text>
                <Text className="font-bold text-lg">{proposal.deadline}</Text>
              </View>
            </View>

            <TouchableOpacity
              className="bg-indigo-600 rounded-lg p-4 mt-4"
              onPress={() => navigation.navigate('Checkout' as never)}
            >
              <Text className="text-center text-white font-bold">
                Aceitar Proposta
              </Text>
            </TouchableOpacity>
          </View>
        ))}
      </View>
    </ScrollView>
  );
} 