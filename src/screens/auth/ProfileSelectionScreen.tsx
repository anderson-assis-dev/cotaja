import { View, Text, TouchableOpacity } from 'react-native';
import { useNavigation } from '@react-navigation/native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import Icon from 'react-native-vector-icons/MaterialIcons';

export default function ProfileSelectionScreen() {
  const navigation = useNavigation();

  const handleProfileSelection = (type: 'client' | 'provider') => {
    // Simulação de seleção de perfil
    if (type === 'client') {
      navigation.navigate('Client' as never);
    } else {
      navigation.navigate('Provider' as never);
    }
  };
  const insets = useSafeAreaInsets();
  return (
    <View className="flex-1 bg-gradient-to-br from-indigo-500 to-purple-600 p-6" style={{ paddingTop: insets.top }}>
      <Text className="text-3xl font-bold text-black text-center mb-8">
        Escolha seu Perfil
      </Text>

      <View className="flex-1 justify-center space-y-6">
        <TouchableOpacity
          className="bg-white rounded-xl p-6 shadow-xl"
          onPress={() => handleProfileSelection('client')}
        >
          <View className="items-center">
            <View className="bg-indigo-100 rounded-full w-24 h-24 items-center justify-center mb-4">
                <Icon name="person" size={60} color="#4f46e5" />
            </View>
            <Text className="text-xl font-bold text-gray-800 mb-2">Cliente</Text>
            <Text className="text-gray-600 text-center">
              Quero contratar serviços e encontrar profissionais qualificados
            </Text>
          </View>
        </TouchableOpacity>

        <TouchableOpacity
          className="bg-white rounded-xl p-6 shadow-xl"
          onPress={() => handleProfileSelection('provider')}
        >
          <View className="items-center">
            <View className="bg-green-100 rounded-full w-24 h-24 items-center justify-center mb-4">
                <Icon name="work" size={60} color="#16a34a" />
            </View>
            <Text className="text-xl font-bold text-gray-800 mb-2">Prestador</Text>
            <Text className="text-gray-600 text-center">
              Quero oferecer meus serviços e encontrar novos clientes
            </Text>
          </View>
        </TouchableOpacity>
      </View>

      <TouchableOpacity
        className="mt-6"
        onPress={() => navigation.goBack()}
      >
        <Text className="text-white text-center">Voltar</Text>
      </TouchableOpacity>
    </View>
  );
} 