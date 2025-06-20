import { View, Text, ScrollView, TouchableOpacity, Image } from 'react-native';
import { useNavigation } from '@react-navigation/native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import Icon from 'react-native-vector-icons/MaterialIcons';

// Dados mockados para exemplo
const mockProfile = {
  name: 'João Silva',
  email: 'joao.silva@email.com',
  phone: '(11) 98765-4321',
  type: 'Prestador',
  rating: 4.8,
  completedServices: 45,
  avatar: require('../../../assets/splash-icon.png'),
  documents: {
    cpf: '123.456.789-00',
    cnpj: '12.345.678/0001-90',
  },
};

export default function ProfileScreen() {
  const navigation = useNavigation();
  const insets = useSafeAreaInsets();

  return (
    <ScrollView style={{ paddingTop: insets.top }} className="flex-1 bg-gray-100">
      <View className="bg-gradient-to-r from-indigo-500 to-purple-600 p-6">
        <View className="items-center">
          <Image
            source={mockProfile.avatar}
            className="w-24 h-24 rounded-full mb-4 border-4 border-white"
          />
          <Text className="text-2xl font-bold text-black mb-2">
            {mockProfile.name}
          </Text>
          <View className="bg-white/20 px-4 py-1 rounded-full">
            <Text className="text-black">{mockProfile.type}</Text>
          </View>
        </View>
      </View>

      <View className="p-6">
        <View className="bg-white rounded-xl p-6 shadow-sm mb-6">
          <Text className="text-lg font-semibold mb-4">Informações Pessoais</Text>
          
          <View className="mb-4">
            <Text className="text-gray-500">Email</Text>
            <Text className="text-gray-800">{mockProfile.email}</Text>
          </View>

          <View className="mb-4">
            <Text className="text-gray-500">Telefone</Text>
            <Text className="text-gray-800">{mockProfile.phone}</Text>
          </View>

          <View className="mb-4">
            <Text className="text-gray-500">CPF</Text>
            <Text className="text-gray-800">{mockProfile.documents.cpf}</Text>
          </View>

          <View>
            <Text className="text-gray-500">CNPJ</Text>
            <Text className="text-gray-800">{mockProfile.documents.cnpj}</Text>
          </View>
        </View>

        <View className="bg-white rounded-xl p-6 shadow-sm mb-6">
          <Text className="text-lg font-semibold mb-4">Estatísticas</Text>
          
          <View className="flex-row justify-between mb-4">
            <View>
              <Text className="text-gray-500">Avaliação</Text>
              <View className="flex-row items-center">
                <Text className="text-2xl font-bold">{mockProfile.rating}</Text>
                <Text className="text-yellow-500 ml-1">★</Text>
              </View>
            </View>
            <View>
              <Text className="text-gray-500">Serviços Concluídos</Text>
              <Text className="text-2xl font-bold">{mockProfile.completedServices}</Text>
            </View>
          </View>
        </View>

        {/* Botões com ícones */}
        <View className="space-y-4">
          <TouchableOpacity
            className="bg-white rounded-xl p-4 shadow-sm flex-row items-center"
            onPress={() => navigation.navigate('Documents' as never)}
          >
            <View className="bg-indigo-100 rounded-lg p-2 mr-4">
              <Icon name="description" size={24} color="#4f46e5" />
            </View>
            <View className="flex-1">
              <Text className="text-lg font-semibold text-gray-800">Gerenciar Documentos</Text>
              <Text className="text-gray-500 text-sm">Visualizar e atualizar documentos</Text>
            </View>
            <Icon name="chevron-right" size={24} color="#9ca3af" />
          </TouchableOpacity>

          <TouchableOpacity
            className="bg-white rounded-xl p-4 shadow-sm flex-row items-center"
            onPress={() => navigation.navigate('Wallet' as never)}
          >
            <View className="bg-green-100 rounded-lg p-2 mr-4">
              <Icon name="account-balance-wallet" size={24} color="#16a34a" />
            </View>
            <View className="flex-1">
              <Text className="text-lg font-semibold text-gray-800">Carteira</Text>
              <Text className="text-gray-500 text-sm">Gerenciar saldo e transações</Text>
            </View>
            <Icon name="chevron-right" size={24} color="#9ca3af" />
          </TouchableOpacity>

          <TouchableOpacity
            className="bg-white rounded-xl p-4 shadow-sm flex-row items-center"
            onPress={() => navigation.navigate('Settings' as never)}
          >
            <View className="bg-gray-100 rounded-lg p-2 mr-4">
              <Icon name="settings" size={24} color="#6b7280" />
            </View>
            <View className="flex-1">
              <Text className="text-lg font-semibold text-gray-800">Configurações</Text>
              <Text className="text-gray-500 text-sm">Preferências e privacidade</Text>
            </View>
            <Icon name="chevron-right" size={24} color="#9ca3af" />
          </TouchableOpacity>

          <TouchableOpacity
            className="bg-white rounded-xl p-4 shadow-sm flex-row items-center"
            onPress={() => navigation.navigate('Login' as never)}
          >
            <View className="bg-red-100 rounded-lg p-2 mr-4">
              <Icon name="logout" size={24} color="#dc2626" />
            </View>
            <View className="flex-1">
              <Text className="text-lg font-semibold text-gray-800">Sair</Text>
              <Text className="text-gray-500 text-sm">Fazer logout da conta</Text>
            </View>
            <Icon name="chevron-right" size={24} color="#9ca3af" />
          </TouchableOpacity>
        </View>
      </View>
    </ScrollView>
  );
} 