import { useState } from 'react';
import { View, Text, TextInput, TouchableOpacity, Alert, Image } from 'react-native';
import { useNavigation } from '@react-navigation/native';

// Dados mockados para exemplo
const mockService = {
  id: '1',
  title: 'Pintura de apartamento',
  provider: {
    name: 'João Silva',
    avatar: require('../../../assets/splash-icon.png'),
  },
  date: '15/03/2024',
};

export default function RateProviderScreen() {
  const navigation = useNavigation();
  const [rating, setRating] = useState(0);
  const [comment, setComment] = useState('');

  const handleSubmit = () => {
    if (rating === 0) {
      Alert.alert('Erro', 'Por favor, selecione uma avaliação');
      return;
    }

    // Simulação de envio de avaliação
    Alert.alert(
      'Sucesso',
      'Avaliação enviada com sucesso!',
      [
        {
          text: 'OK',
          onPress: () => navigation.navigate('MyOrders' as never),
        },
      ]
    );
  };

  return (
    <View className="flex-1 bg-gray-100">
      <View className="p-6">
        <Text className="text-2xl font-bold mb-6">Avaliar Serviço</Text>

        <View className="bg-white rounded-xl p-6 shadow-sm mb-6">
          <View className="flex-row items-center mb-6">
            <Image
              source={mockService.provider.avatar}
              className="w-16 h-16 rounded-full mr-4"
            />
            <View>
              <Text className="text-lg font-bold">{mockService.provider.name}</Text>
              <Text className="text-gray-600">{mockService.title}</Text>
              <Text className="text-gray-500">{mockService.date}</Text>
            </View>
          </View>

          <Text className="text-lg font-semibold mb-4">Sua Avaliação</Text>
          
          <View className="flex-row justify-center mb-6">
            {[1, 2, 3, 4, 5].map((star) => (
              <TouchableOpacity
                key={star}
                onPress={() => setRating(star)}
                className="mx-2"
              >
                <Text className="text-4xl">
                  {star <= rating ? '★' : '☆'}
                </Text>
              </TouchableOpacity>
            ))}
          </View>

          <Text className="text-lg font-semibold mb-2">Comentário (opcional)</Text>
          <TextInput
            className="border border-gray-300 rounded-lg p-3 mb-6 h-32"
            placeholder="Conte-nos sobre sua experiência com o serviço"
            value={comment}
            onChangeText={setComment}
            multiline
            textAlignVertical="top"
          />

          <TouchableOpacity
            className="bg-indigo-600 rounded-lg p-4"
            onPress={handleSubmit}
          >
            <Text className="text-center text-white font-bold text-lg">
              Enviar Avaliação
            </Text>
          </TouchableOpacity>
        </View>

        <TouchableOpacity
          onPress={() => navigation.goBack()}
        >
          <Text className="text-indigo-600 text-center">
            Voltar
          </Text>
        </TouchableOpacity>
      </View>
    </View>
  );
} 