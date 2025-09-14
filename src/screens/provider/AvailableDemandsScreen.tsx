import { View, Text, ScrollView, TouchableOpacity } from 'react-native';
import { useNavigation } from '@react-navigation/native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';

// Dados mockados para exemplo
const mockDemands = [
  {
    id: '1',
    title: 'Pintura de apartamento',
    category: 'Pintura',
    budget: 'R$ 3.000,00',
    deadline: '15 dias',
    location: 'São Paulo, SP',
    description: 'Preciso pintar um apartamento de 80m², 2 quartos, sala, cozinha e banheiro.',
  },
  {
    id: '2',
    title: 'Instalação de ar condicionado',
    category: 'Elétrica',
    budget: 'R$ 1.500,00',
    deadline: '7 dias',
    location: 'São Paulo, SP',
    description: 'Instalação de ar condicionado split em sala e quarto.',
  },
  {
    id: '3',
    title: 'Limpeza pós-obra',
    category: 'Limpeza',
    budget: 'R$ 800,00',
    deadline: '3 dias',
    location: 'São Paulo, SP',
    description: 'Limpeza completa de apartamento após reforma.',
  },
];

export default function AvailableDemandsScreen() {
  const navigation = useNavigation();
  const insets = useSafeAreaInsets();
  return (
    <ScrollView className="flex-1 bg-gray-100" style={{ paddingTop: insets.top }}>
      <View className="p-6">
        <Text className="text-2xl font-bold mb-6">Demandas Disponíveis</Text>

        {mockDemands.map((demand) => (
          <TouchableOpacity
            key={demand.id}
            className="bg-white rounded-xl p-6 shadow-sm mb-4"
            onPress={() => navigation.navigate('SendProposal' as never)}
          >
            <View className="flex-row justify-between items-start mb-4">
              <Text className="text-lg font-bold flex-1 mr-4">
                {demand.title}
              </Text>
              <View className="bg-indigo-100 px-3 py-1 rounded-full">
                <Text className="text-indigo-600">{demand.category}</Text>
              </View>
            </View>

            <Text className="text-gray-600 mb-4">{demand.description}</Text>

            <View className="flex-row flex-wrap mb-4">
              <View className="bg-gray-100 px-3 py-1 rounded-full mr-2 mb-2">
                <Text className="text-gray-600">{demand.budget}</Text>
              </View>
              <View className="bg-gray-100 px-3 py-1 rounded-full mr-2 mb-2">
                <Text className="text-gray-600">{demand.deadline}</Text>
              </View>
              <View className="bg-gray-100 px-3 py-1 rounded-full mb-2">
                <Text className="text-gray-600">{demand.location}</Text>
              </View>
            </View>

            <TouchableOpacity
              className="bg-indigo-600 rounded-lg p-4"
              onPress={() => navigation.navigate('SendProposal' as never)}
            >
              <Text className="text-center text-white font-bold">
                Enviar Proposta
              </Text>
            </TouchableOpacity>
          </TouchableOpacity>
        ))}

        <TouchableOpacity
          className="bg-indigo-600 rounded-lg p-4 mt-6"
          onPress={() => navigation.navigate('Home')}
        >
          <Text className="text-center text-white font-bold text-lg">
            Voltar para Home
          </Text>
        </TouchableOpacity>
      </View>
    </ScrollView>
  );
} 