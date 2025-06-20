import { View, Text, TouchableOpacity, Image } from 'react-native';
import { useNavigation } from '@react-navigation/native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';

export default function InitialScreen() {
  const navigation = useNavigation();
  const insets = useSafeAreaInsets();

  return (
    <View style={{ paddingTop: insets.top }} className="flex-1 bg-gradient-to-br from-indigo-500 to-purple-600 p-6">
      <View className="flex-1 items-center justify-center">
        <Image 
          source={require('../../assets/logo.png')} 
          className="w-48 h-48 mb-12"
          resizeMode="contain"
        />

        <Text className="text-3xl font-bold text-white text-center mb-8">
          Bem-vindo ao Cotaja
        </Text>

        <TouchableOpacity
          className="bg-white rounded-xl p-6 w-full mb-6"
          onPress={() => navigation.navigate('ClientHome' as never)}
        >
          <Text className="text-xl font-bold text-center text-gray-800">
            Sou Cliente
          </Text>
          <Text className="text-gray-600 text-center mt-2">
            Quero contratar serviços
          </Text>
        </TouchableOpacity>

        <TouchableOpacity
          className="bg-white rounded-xl p-6 w-full"
          onPress={() => navigation.navigate('ProviderHome' as never)}
        >
          <Text className="text-xl font-bold text-center text-gray-800">
            Sou Prestador
          </Text>
          <Text className="text-gray-600 text-center mt-2">
            Quero oferecer serviços
          </Text>
        </TouchableOpacity>
      </View>
    </View>
  );
} 