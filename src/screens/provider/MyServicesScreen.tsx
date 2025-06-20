import { useState } from 'react';
import { View, Text, TouchableOpacity, ScrollView, Alert, Image } from 'react-native';
import { useNavigation } from '@react-navigation/native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';

interface Service {
  id: string;
  title: string;
  description: string;
  price: number;
  status: 'active' | 'inactive' | 'pending';
  category: string;
  rating: number;
  completedJobs: number;
}

export default function MyServicesScreen() {
  const navigation = useNavigation();
  const insets = useSafeAreaInsets();
  
  const [services, setServices] = useState<Service[]>([
    {
      id: '1',
      title: 'Limpeza Residencial',
      description: 'Serviço completo de limpeza para residências',
      price: 120.00,
      status: 'active',
      category: 'Limpeza',
      rating: 4.8,
      completedJobs: 45
    },
    {
      id: '2',
      title: 'Manutenção Elétrica',
      description: 'Instalação e reparo de sistemas elétricos',
      price: 200.00,
      status: 'active',
      category: 'Manutenção',
      rating: 4.9,
      completedJobs: 32
    },
    {
      id: '3',
      title: 'Jardinagem',
      description: 'Cuidados com jardim e paisagismo',
      price: 80.00,
      status: 'inactive',
      category: 'Jardinagem',
      rating: 4.7,
      completedJobs: 28
    }
  ]);

  const getStatusColor = (status: string) => {
    switch (status) {
      case 'active':
        return 'bg-green-500';
      case 'inactive':
        return 'bg-gray-500';
      case 'pending':
        return 'bg-yellow-500';
      default:
        return 'bg-gray-500';
    }
  };

  const getStatusText = (status: string) => {
    switch (status) {
      case 'active':
        return 'Ativo';
      case 'inactive':
        return 'Inativo';
      case 'pending':
        return 'Pendente';
      default:
        return 'Desconhecido';
    }
  };

  const toggleServiceStatus = (serviceId: string) => {
    setServices(prevServices =>
      prevServices.map(service =>
        service.id === serviceId
          ? { ...service, status: service.status === 'active' ? 'inactive' : 'active' }
          : service
      )
    );
  };

  const deleteService = (serviceId: string) => {
    Alert.alert(
      'Confirmar Exclusão',
      'Tem certeza que deseja excluir este serviço?',
      [
        { text: 'Cancelar', style: 'cancel' },
        {
          text: 'Excluir',
          style: 'destructive',
          onPress: () => {
            setServices(prevServices => prevServices.filter(service => service.id !== serviceId));
          }
        }
      ]
    );
  };

  const editService = (service: Service) => {
    // Navegar para tela de edição (implementar depois)
    Alert.alert('Editar Serviço', `Editar: ${service.title}`);
  };

  return (
    <ScrollView className="flex-1 bg-gradient-to-br from-indigo-500 to-purple-600" style={{ paddingTop: insets.top }}>
      <View className="p-6">
        {/* Header */}
        <View className="flex-row items-center justify-between mb-6">
          <Text className="text-2xl font-bold text-black">Meus Serviços</Text>
          <TouchableOpacity
            className="bg-white rounded-lg px-4 py-2"
            onPress={() => Alert.alert('Adicionar Serviço', 'Funcionalidade em desenvolvimento')}
          >
            <Text className="text-indigo-600 font-semibold">+ Novo</Text>
          </TouchableOpacity>
        </View>

        {/* Stats */}
        <View className="bg-white rounded-xl p-4 mb-6">
          <Text className="text-lg font-semibold mb-3">Resumo</Text>
          <View className="flex-row justify-between">
            <View className="items-center">
              <Text className="text-2xl font-bold text-indigo-600">{services.length}</Text>
              <Text className="text-gray-600 text-sm">Total</Text>
            </View>
            <View className="items-center">
              <Text className="text-2xl font-bold text-green-600">
                {services.filter(s => s.status === 'active').length}
              </Text>
              <Text className="text-gray-600 text-sm">Ativos</Text>
            </View>
            <View className="items-center">
              <Text className="text-2xl font-bold text-yellow-600">
                {services.filter(s => s.status === 'pending').length}
              </Text>
              <Text className="text-gray-600 text-sm">Pendentes</Text>
            </View>
          </View>
        </View>

        {/* Services List */}
        <View className="space-y-4">
          {services.map((service) => (
            <View key={service.id} className="bg-white rounded-xl p-4 shadow-lg">
              <View className="flex-row justify-between items-start mb-3">
                <View className="flex-1">
                  <Text className="text-lg font-semibold text-gray-800">{service.title}</Text>
                  <Text className="text-gray-600 text-sm">{service.category}</Text>
                </View>
                <View className={`px-2 py-1 rounded-full ${getStatusColor(service.status)}`}>
                  <Text className="text-white text-xs font-medium">{getStatusText(service.status)}</Text>
                </View>
              </View>

              <Text className="text-gray-700 mb-3">{service.description}</Text>

              <View className="flex-row justify-between items-center mb-3">
                <Text className="text-lg font-bold text-indigo-600">R$ {service.price.toFixed(2)}</Text>
                <View className="flex-row items-center">
                  <Text className="text-yellow-500 mr-1">★</Text>
                  <Text className="text-gray-600">{service.rating}</Text>
                  <Text className="text-gray-500 ml-2">({service.completedJobs} trabalhos)</Text>
                </View>
              </View>

              {/* Action Buttons */}
              <View className="flex-row space-x-2">
                <TouchableOpacity
                  className="flex-1 bg-indigo-600 rounded-lg py-2"
                  onPress={() => editService(service)}
                >
                  <Text className="text-white text-center font-medium">Editar</Text>
                </TouchableOpacity>
                
                <TouchableOpacity
                  className="flex-1 bg-gray-600 rounded-lg py-2"
                  onPress={() => toggleServiceStatus(service.id)}
                >
                  <Text className="text-white text-center font-medium">
                    {service.status === 'active' ? 'Desativar' : 'Ativar'}
                  </Text>
                </TouchableOpacity>
                
                <TouchableOpacity
                  className="bg-red-500 rounded-lg px-3 py-2"
                  onPress={() => deleteService(service.id)}
                >
                  <Text className="text-white font-medium">Excluir</Text>
                </TouchableOpacity>
              </View>
            </View>
          ))}
        </View>

        {/* Empty State */}
        {services.length === 0 && (
          <View className="items-center py-12">
            <Text className="text-white text-lg font-semibold mb-2">Nenhum serviço cadastrado</Text>
            <Text className="text-white text-center opacity-80">
              Comece criando seu primeiro serviço para começar a receber propostas
            </Text>
          </View>
        )}
      </View>
    </ScrollView>
  );
} 