import { View, Text, TextInput, ScrollView, TouchableOpacity } from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import Icon from 'react-native-vector-icons/MaterialIcons';

// Dados mockados para exemplo
const mockServices = [
  { id: '1', name: 'Eletricista', category: 'Manutenção', rating: 4.8 },
  { id: '2', name: 'Encanador', category: 'Reparos', rating: 4.9 },
  { id: '3', name: 'Jardineiro', category: 'Jardinagem', rating: 4.7 },
  { id: '4', name: 'Diarista', category: 'Limpeza', rating: 4.9 },
  { id: '5', name: 'Desenvolvedor', category: 'Tecnologia', rating: 5.0 },
];

const mockCategories = [
    { id: '1', name: 'Limpeza', icon: 'cleaning-services' },
    { id: '2', name: 'Reparos', icon: 'build' },
    { id: '3', name: 'Tecnologia', icon: 'computer' },
    { id: '4', name: 'Aulas', icon: 'school' },
    { id: '5', name: 'Design', icon: 'design-services' },
    { id: '6', name: 'Eventos', icon: 'celebration' },
];


export default function SearchScreen() {
  const insets = useSafeAreaInsets();

  return (
    <ScrollView style={{ paddingTop: insets.top }} className="flex-1 bg-gray-100">
      <View className="p-6">
        <Text className="text-3xl font-bold text-gray-800 mb-4">Buscar Serviços</Text>
        
        {/* Search Bar */}
        <View className="flex-row items-center bg-white rounded-xl p-3 shadow-sm mb-6">
          <Icon name="search" size={24} color="#9ca3af" />
          <TextInput
            placeholder="O que você precisa?"
            className="flex-1 ml-3 text-lg"
          />
        </View>

        {/* Categorias */}
        <View className="mb-6">
            <Text className="text-xl font-semibold text-gray-800 mb-3">Categorias</Text>
            <View className="flex-row flex-wrap justify-between">
                {mockCategories.map((category) => (
                    <TouchableOpacity key={category.id} className="w-[48%] bg-white rounded-xl p-4 mb-3 shadow-sm items-center">
                        <Icon name={category.icon} size={32} color="#4f46e5" />
                        <Text className="mt-2 font-semibold text-gray-700">{category.name}</Text>
                    </TouchableOpacity>
                ))}
            </View>
        </View>

        {/* Serviços Populares */}
        <View>
          <Text className="text-xl font-semibold text-gray-800 mb-3">Populares</Text>
          <View className="space-y-3">
            {mockServices.map((service) => (
              <TouchableOpacity key={service.id} className="bg-white rounded-xl p-4 shadow-sm flex-row items-center justify-between">
                <View>
                    <Text className="text-lg font-semibold text-gray-800">{service.name}</Text>
                    <Text className="text-gray-500">{service.category}</Text>
                </View>
                <View className="flex-row items-center">
                    <Icon name="star" size={18} color="#f59e0b" />
                    <Text className="ml-1 font-bold">{service.rating}</Text>
                </View>
              </TouchableOpacity>
            ))}
          </View>
        </View>
      </View>
    </ScrollView>
  );
} 