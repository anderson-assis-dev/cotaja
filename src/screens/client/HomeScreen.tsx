import { View, Text, ScrollView, TouchableOpacity } from 'react-native';
import { useNavigation } from '@react-navigation/native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import Icon from 'react-native-vector-icons/MaterialIcons';

const services = [
  {
    id: '1',
    title: 'Criar Pedido',
    description: 'Solicite um novo serviço',
    iconName: 'add-circle-outline',
    screen: 'CreateOrder',
  },
  {
    id: '2',
    title: 'Meus Pedidos',
    description: 'Acompanhe seus pedidos',
    iconName: 'list-alt',
    screen: 'MyOrdersTab',
  },
  {
    id: '3',
    title: 'Leilão em Andamento',
    description: 'Veja propostas recebidas',
    iconName: 'gavel',
    screen: 'ActiveAuction',
  },
  {
    id: '4',
    title: 'Avaliar Prestador',
    description: 'Avalie serviços realizados',
    iconName: 'star-rate',
    screen: 'RateProvider',
  },
];

export default function HomeScreen() {
  const navigation = useNavigation();
  const insets = useSafeAreaInsets();
  return (
    <ScrollView className="flex-1 bg-gray-100" style={{ paddingTop: insets.top }}>
      <View className="bg-gradient-to-r from-indigo-500 to-purple-600 p-6">
        <Text className="text-2xl font-bold text-black mb-2">Olá, João!</Text>
        <Text className="text-black opacity-80">
          Como podemos ajudar você hoje?
        </Text>
      </View>

      <View className="p-6">
        <Text className="text-xl font-bold mb-4">Serviços</Text>
        <View className="flex-row flex-wrap justify-between">
          {services.map((service) => (
            <TouchableOpacity
              key={service.id}
              className="bg-white rounded-xl p-4 mb-4 w-[48%] shadow-sm"
              onPress={() => {
                if (service.screen === 'ActiveAuction') {
                  (navigation as any).navigate('MyOrdersTab', {
                    screen: 'ActiveAuction',
                    params: { profileType: 'client', clientId: '1' }
                  });
                } else {
                  (navigation as any).navigate(service.screen);
                }
              }}
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

        <Text className="text-xl font-bold mb-4 mt-6">Pedidos Recentes</Text>
        <View className="bg-white rounded-xl p-4 shadow-sm">
          <Text className="text-gray-600 text-center">
            Você ainda não tem pedidos recentes
          </Text>
        </View>

        <TouchableOpacity
          className="bg-indigo-600 rounded-lg p-4 mt-6"
          onPress={() => navigation.navigate('CreateOrder' as never)}
        >
          <Text className="text-center text-white font-bold text-lg">
            Criar Novo Pedido
          </Text>
        </TouchableOpacity>
      </View>
    </ScrollView>
  );
} 