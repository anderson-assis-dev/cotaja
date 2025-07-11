import { View, Text, ScrollView, TouchableOpacity, Image } from 'react-native';
import { useNavigation } from '@react-navigation/native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import Icon from 'react-native-vector-icons/MaterialIcons';
import { useAuth } from '../../contexts/AuthContext';
import { CommonActions } from '@react-navigation/native';

export default function ProfileScreen() {
  const navigation = useNavigation();
  const insets = useSafeAreaInsets();
  const { logout, user } = useAuth();

  const handleLogout = async () => {
    await logout();
    navigation.dispatch(
      CommonActions.reset({
        index: 0,
        routes: [{ name: 'Login' }],
      })
    );
  };

  if (!user) {
    return (
      <View className="flex-1 items-center justify-center bg-gray-100">
        <Text>Carregando dados do usuário...</Text>
      </View>
    );
  }

  return (
    <ScrollView style={{ paddingTop: insets.top }} className="flex-1 bg-gray-100">
      <View className="bg-gradient-to-r from-indigo-500 to-purple-600 p-6">
        <View className="items-center">
          <Image
            source={require('../../../assets/splash-icon.png')}
            className="w-24 h-24 rounded-full mb-4 border-4 border-white"
          />
          <Text className="text-2xl font-bold text-black mb-2">
            {user.name}
          </Text>
          <View className="bg-white/20 px-4 py-1 rounded-full">
            <Text className="text-black">{user.profile_type === 'provider' ? 'Prestador' : user.profile_type === 'client' ? 'Cliente' : 'Usuário'}</Text>
          </View>
        </View>
      </View>

      <View className="p-6">
        <View className="bg-white rounded-xl p-6 shadow-sm mb-6">
          <Text className="text-lg font-semibold mb-4">Informações Pessoais</Text>
          
          <View className="mb-4">
            <Text className="text-gray-500">Email</Text>
            <Text className="text-gray-800">{user.email}</Text>
          </View>

          <View className="mb-4">
            <Text className="text-gray-500">Telefone</Text>
            <Text className="text-gray-800">{user.phone || '-'}</Text>
          </View>

          {user.address && (
            <View className="mb-4">
              <Text className="text-gray-500">Endereço</Text>
              <Text className="text-gray-800">{user.address}</Text>
            </View>
          )}
        </View>

        {/* Se quiser exibir mais informações, adicione aqui conforme o backend for evoluindo */}

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
            onPress={handleLogout}
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