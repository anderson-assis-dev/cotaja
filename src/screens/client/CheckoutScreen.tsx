import { View, Text, ScrollView, TouchableOpacity, Alert } from 'react-native';
import { useNavigation } from '@react-navigation/native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import Icon from 'react-native-vector-icons/MaterialIcons';

export default function CheckoutScreen() {
  const navigation = useNavigation();
  const insets = useSafeAreaInsets();
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
    <ScrollView className="flex-1 bg-gray-100" style={{ paddingTop: insets.top }}>
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

          <View className="flex-row justify-center space-x-8 mt-6">
            <TouchableOpacity
              accessibilityLabel="Confirmar proposta"
              onPress={handleAcceptProposal}
            >
              <View className="bg-green-100 p-4 rounded-full">
                <Icon name="check-circle" size={36} color="#22c55e" />
              </View>
              <Text className="text-center text-green-700 mt-2">Confirmar</Text>
            </TouchableOpacity>
            <TouchableOpacity
              accessibilityLabel="Cancelar"
              onPress={() => navigation.goBack()}
            >
              <View className="bg-red-100 p-4 rounded-full">
                <Icon name="close-circle" size={36} color="#ef4444" />
              </View>
              <Text className="text-center text-red-700 mt-2">Cancelar</Text>
            </TouchableOpacity>
          </View>
        </View>
      </View>
    </ScrollView>
  );
} 