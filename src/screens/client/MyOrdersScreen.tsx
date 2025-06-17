import { View, Text, ScrollView, TouchableOpacity } from 'react-native';
import { useNavigation } from '@react-navigation/native';

// Dados mockados para exemplo
const mockOrders = [
  {
    id: '1',
    title: 'Pintura de apartamento',
    category: 'Pintura',
    status: 'Em andamento',
    date: '15/03/2024',
    proposals: 3,
  },
  {
    id: '2',
    title: 'Instalação de ar condicionado',
    category: 'Elétrica',
    status: 'Aguardando propostas',
    date: '14/03/2024',
    proposals: 0,
  },
  {
    id: '3',
    title: 'Limpeza pós-obra',
    category: 'Limpeza',
    status: 'Concluído',
    date: '10/03/2024',
    proposals: 5,
  },
];

const getStatusColor = (status: string) => {
  switch (status) {
    case 'Em andamento':
      return 'bg-yellow-100 text-yellow-600';
    case 'Aguardando propostas':
      return 'bg-blue-100 text-blue-600';
    case 'Concluído':
      return 'bg-green-100 text-green-600';
    default:
      return 'bg-gray-100 text-gray-600';
  }
};

export default function MyOrdersScreen() {
  const navigation = useNavigation();

  return (
    <ScrollView className="flex-1 bg-gray-100">
      <View className="p-6">
        <Text className="text-2xl font-bold mb-6">Meus Pedidos</Text>

        {mockOrders.map((order) => (
          <TouchableOpacity
            key={order.id}
            className="bg-white rounded-xl p-6 shadow-sm mb-4"
            onPress={() => navigation.navigate('OrderDetails' as never)}
          >
            <View className="flex-row justify-between items-start mb-4">
              <Text className="text-lg font-bold flex-1 mr-4">
                {order.title}
              </Text>
              <View className={`px-3 py-1 rounded-full ${getStatusColor(order.status)}`}>
                <Text>{order.status}</Text>
              </View>
            </View>

            <View className="flex-row items-center mb-4">
              <View className="bg-indigo-100 px-3 py-1 rounded-full">
                <Text className="text-indigo-600">{order.category}</Text>
              </View>
              <Text className="text-gray-500 ml-4">
                {order.date}
              </Text>
            </View>

            <View className="flex-row justify-between items-center">
              <Text className="text-gray-600">
                {order.proposals} {order.proposals === 1 ? 'proposta' : 'propostas'}
              </Text>
              <TouchableOpacity>
                <Text className="text-indigo-600 font-semibold">
                  Ver detalhes
                </Text>
              </TouchableOpacity>
            </View>
          </TouchableOpacity>
        ))}

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