import { useState, useEffect } from 'react';
import { View, Text, ScrollView, TouchableOpacity, Image } from 'react-native';
import { useNavigation } from '@react-navigation/native';

// Dados mockados para exemplo
const mockAuction = {
  id: '1',
  title: 'Pintura de apartamento',
  endTime: new Date(Date.now() + 24 * 60 * 60 * 1000), // 24 horas a partir de agora
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

export default function ActiveAuctionScreen() {
  const navigation = useNavigation();
  const [timeLeft, setTimeLeft] = useState('');

  useEffect(() => {
    const timer = setInterval(() => {
      const now = new Date();
      const diff = mockAuction.endTime.getTime() - now.getTime();

      if (diff <= 0) {
        setTimeLeft('Encerrado');
        clearInterval(timer);
        return;
      }

      const hours = Math.floor(diff / (1000 * 60 * 60));
      const minutes = Math.floor((diff % (1000 * 60 * 60)) / (1000 * 60));
      const seconds = Math.floor((diff % (1000 * 60)) / 1000);

      setTimeLeft(`${hours}h ${minutes}m ${seconds}s`);
    }, 1000);

    return () => clearInterval(timer);
  }, []);

  return (
    <ScrollView className="flex-1 bg-gray-100">
      <View className="p-6">
        <View className="bg-white rounded-xl p-6 shadow-sm mb-6">
          <Text className="text-2xl font-bold mb-4">{mockAuction.title}</Text>
          
          <View className="bg-indigo-100 rounded-lg p-4 mb-6">
            <Text className="text-center text-indigo-600 font-semibold mb-2">
              Tempo Restante
            </Text>
            <Text className="text-center text-2xl font-bold text-indigo-600">
              {timeLeft}
            </Text>
          </View>

          <Text className="text-lg font-semibold mb-4">
            Propostas Recebidas ({mockAuction.proposals.length})
          </Text>

          {mockAuction.proposals.map((proposal) => (
            <View
              key={proposal.id}
              className="bg-gray-50 rounded-lg p-4 mb-4"
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

        <TouchableOpacity
          className="bg-indigo-600 rounded-lg p-4"
          onPress={() => navigation.navigate('MyOrders' as never)}
        >
          <Text className="text-center text-white font-bold text-lg">
            Voltar para Meus Pedidos
          </Text>
        </TouchableOpacity>
      </View>
    </ScrollView>
  );
} 