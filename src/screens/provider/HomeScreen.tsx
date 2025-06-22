import { View, Text, ScrollView, TouchableOpacity } from 'react-native';
import { useNavigation } from '@react-navigation/native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import Icon from 'react-native-vector-icons/MaterialIcons';

const services = [
  {
    id: '1',
    title: 'Buscar Demandas',
    description: 'Encontre oportunidades',
    iconName: 'search',
    screen: 'SearchTab',
  },
  {
    id: '2',
    title: 'Leilões Ativos',
    description: 'Acompanhe seus leilões',
    iconName: 'gavel',
    screen: 'AuctionsTab',
  },
  {
    id: '3',
    title: 'Meus Serviços',
    description: 'Gerencie seus serviços',
    iconName: 'build',
    screen: 'MyServicesTab',
  },
  {
    id: '4',
    title: 'Enviar Proposta',
    description: 'Proponha seus serviços',
    iconName: 'send',
    screen: 'SendProposal',
  },
];

// Dados mockados para exemplo
const mockStats = {
  rating: 4.8,
  completedServices: 45,
  activeServices: 3,
  earnings: 'R$ 12.500,00',
};

export default function ProviderHomeScreen() {
  const navigation = useNavigation();
  const insets = useSafeAreaInsets();
  return (
    <ScrollView className="flex-1 bg-gray-100" style={{ paddingTop: insets.top }}>
      <View className="bg-gradient-to-r from-indigo-500 to-purple-600 p-6">
        <Text className="text-2xl font-bold text-black mb-2">Olá, João!</Text>
        <Text className="text-black opacity-80">
          Como vai seu trabalho hoje?
        </Text>
      </View>

      <View className="p-6">
        <View className="bg-white rounded-xl p-6 shadow-sm mb-6">
          <View className="flex-row justify-between items-center mb-6">
            <View>
              <Text className="text-gray-500">Avaliação</Text>
              <View className="flex-row items-center">
                <Text className="text-2xl font-bold">{mockStats.rating}</Text>
                <Text className="text-yellow-500 ml-1">★</Text>
              </View>
            </View>
            <View>
              <Text className="text-gray-500">Serviços Concluídos</Text>
              <Text className="text-2xl font-bold">{mockStats.completedServices}</Text>
            </View>
            <View>
              <Text className="text-gray-500">Serviços Ativos</Text>
              <Text className="text-2xl font-bold">{mockStats.activeServices}</Text>
            </View>
          </View>

          <View className="bg-indigo-50 rounded-lg p-4">
            <Text className="text-gray-500 mb-1">Ganhos Totais</Text>
            <Text className="text-2xl font-bold text-indigo-600">
              {mockStats.earnings}
            </Text>
          </View>
        </View>

        <Text className="text-xl font-bold mb-4">Serviços</Text>
        <View className="flex-row flex-wrap justify-between">
          {services.map((service) => (
            <TouchableOpacity
              key={service.id}
              className="bg-white rounded-xl p-4 mb-4 w-[48%] shadow-sm"
              onPress={() => (navigation as any).navigate(service.screen)}
            >
              <View className="bg-indigo-100 rounded-full w-12 h-12 items-center justify-center mb-3">
                <Icon name={service.iconName} size={28} color="#4f46e5" />
              </View>
              <Text className="font-bold text-gray-800 mb-1">
                {service.title}
              </Text>
              <Text className="text-gray-600 text-sm">
                {service.description}
              </Text>
            </TouchableOpacity>
          ))}
        </View>

        <Text className="text-xl font-bold mb-4 mt-6">Próximos Serviços</Text>
        <View className="bg-white rounded-xl p-4 shadow-sm">
          <Text className="text-gray-600 text-center">
            Você não tem serviços agendados
          </Text>
        </View>

        <TouchableOpacity
          className="bg-indigo-600 rounded-lg p-4 mt-6"
          onPress={() => (navigation as any).navigate('SearchTab')}
        >
          <Text className="text-center text-white font-bold text-lg">
            Buscar Novas Oportunidades
          </Text>
        </TouchableOpacity>
      </View>
    </ScrollView>
  );
} 