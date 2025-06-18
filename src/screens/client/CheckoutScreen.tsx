import { View, Text, ScrollView, TouchableOpacity, Alert } from 'react-native';
import { useNavigation } from '@react-navigation/native';

export default function CheckoutScreen() {
  const navigation = useNavigation();

  const handleAcceptProposal = () => {
    Alert.alert(
      'Confirmar Proposta',
      'Tem certeza que deseja aceitar esta proposta?',
      [
        {
          text: 'Cancelar',
          style: 'cancel',
        },
        {
          text: 'Confirmar',
          onPress: () => {
            navigation.navigate('Payment' as never);
          },
        },
      ]
    );
  };

  return (
    <ScrollView className="flex-1 bg-gray-100">
      <View className="p-6">
        <Text className="text-2xl font-bold mb-6">Confirmar Proposta</Text>

        <View className="bg-white rounded-xl p-6 shadow-sm mb-6">
          <Text className="text-lg font-semibold mb-4">Detalhes da Proposta</Text>
          
          <View className="mb-4">
            <Text className="text-gray-600 mb-2">Valor Total</Text>
            <Text className="text-2xl font-bold text-indigo-600">R$ 2.800,00</Text>
          </View>

          <View className="mb-4">
            <Text className="text-gray-600 mb-2">Prazo de Execução</Text>
            <Text className="text-lg font-semibold">12 dias</Text>
          </View>

          <View className="mb-6">
            <Text className="text-gray-600 mb-2">Descrição do Serviço</Text>
            <Text className="text-gray-800">
              Tenho experiência em pintura residencial e comercial. Realizarei o serviço com materiais de qualidade e garantia de satisfação.
            </Text>
          </View>

          <TouchableOpacity
            className="bg-indigo-600 rounded-lg p-4 mb-4"
            onPress={handleAcceptProposal}
          >
            <Text className="text-center text-white font-bold text-lg">
              Aceitar Proposta
            </Text>
          </TouchableOpacity>

          <TouchableOpacity
            className="bg-gray-200 rounded-lg p-4"
            onPress={() => navigation.goBack()}
          >
            <Text className="text-center text-gray-800 font-bold text-lg">
              Voltar
            </Text>
          </TouchableOpacity>
        </View>
      </View>
    </ScrollView>
  );
} 