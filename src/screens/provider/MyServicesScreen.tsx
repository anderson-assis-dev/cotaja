import { useState } from 'react';
import { View, Text, TouchableOpacity, ScrollView, Alert, Image, Modal, TextInput } from 'react-native';
import { useNavigation } from '@react-navigation/native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import Icon from 'react-native-vector-icons/MaterialIcons';

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

// Categorias disponíveis
const categories = [
  'Limpeza', 'Reparos', 'Tecnologia', 'Aulas', 'Design', 'Eventos',
  'Pintura', 'Elétrica', 'Encanamento', 'Jardinagem', 'Transporte', 'Outros'
];

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

  // Estados para o modal de novo serviço
  const [showNewServiceModal, setShowNewServiceModal] = useState(false);
  const [isEditing, setIsEditing] = useState(false);
  const [editingServiceId, setEditingServiceId] = useState<string>('');
  const [newService, setNewService] = useState({
    title: '',
    description: '',
    price: '',
    category: '',
    status: 'active' as 'active' | 'inactive' | 'pending'
  });

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
    // Preencher o modal com os dados do serviço para edição
    setNewService({
      title: service.title,
      description: service.description,
      price: service.price.toString(),
      category: service.category,
      status: service.status
    });
    setEditingServiceId(service.id);
    setIsEditing(true);
    setShowNewServiceModal(true);
  };

  const handleAddNewService = () => {
    if (!newService.title || !newService.description || !newService.price || !newService.category) {
      Alert.alert('Erro', 'Por favor, preencha todos os campos obrigatórios');
      return;
    }

    const price = parseFloat(newService.price);
    if (isNaN(price) || price <= 0) {
      Alert.alert('Erro', 'Por favor, insira um preço válido');
      return;
    }

    if (isEditing) {
      // Atualizar serviço existente
      setServices(prevServices =>
        prevServices.map(service =>
          service.id === editingServiceId
            ? {
                ...service,
                title: newService.title,
                description: newService.description,
                price: price,
                status: newService.status,
                category: newService.category
              }
            : service
        )
      );
      
      // TODO: Enviar PUT para backend Laravel com editingServiceId
      console.log('PUT /api/services/' + editingServiceId, {
        title: newService.title,
        description: newService.description,
        price: price,
        status: newService.status,
        category: newService.category
      });
      
      Alert.alert('Sucesso', 'Serviço atualizado com sucesso!');
    } else {
      // Criar novo serviço
      const service: Service = {
        id: Date.now().toString(),
        title: newService.title,
        description: newService.description,
        price: price,
        status: newService.status,
        category: newService.category,
        rating: 0,
        completedJobs: 0
      };

      setServices(prevServices => [...prevServices, service]);
      
      // TODO: Enviar POST para backend Laravel
      console.log('POST /api/services', service);
      
      Alert.alert('Sucesso', 'Serviço criado com sucesso!');
    }

    setShowNewServiceModal(false);
    resetNewServiceForm();
    setIsEditing(false);
    setEditingServiceId('');
  };

  const resetNewServiceForm = () => {
    setNewService({
      title: '',
      description: '',
      price: '',
      category: '',
      status: 'active' as 'active' | 'inactive' | 'pending'
    });
    setIsEditing(false);
    setEditingServiceId('');
  };

  return (
    <ScrollView className="flex-1 bg-gradient-to-br from-indigo-500 to-purple-600" style={{ paddingTop: insets.top }}>
      <View className="p-6">
        {/* Header */}
        <View className="flex-row items-center justify-between mb-6">
          <Text className="text-2xl font-bold text-black">Meus Serviços</Text>
          <TouchableOpacity
            className="bg-white rounded-full p-3 shadow-lg"
            onPress={() => setShowNewServiceModal(true)}
          >
            <Icon name="add" size={24} color="#4f46e5" />
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

              {/* Action Icons */}
              <View className="flex-row justify-end space-x-3">
                <TouchableOpacity
                  className="bg-indigo-100 p-2 rounded-full"
                  onPress={() => editService(service)}
                >
                  <Icon name="edit" size={20} color="#4f46e5" />
                </TouchableOpacity>
                
                <TouchableOpacity
                  className="bg-gray-100 p-2 rounded-full"
                  onPress={() => toggleServiceStatus(service.id)}
                >
                  <Icon 
                    name={service.status === 'active' ? 'pause' : 'play-arrow'} 
                    size={20} 
                    color={service.status === 'active' ? '#6b7280' : '#22c55e'} 
                  />
                </TouchableOpacity>
                
                <TouchableOpacity
                  className="bg-red-100 p-2 rounded-full"
                  onPress={() => deleteService(service.id)}
                >
                  <Icon name="delete" size={20} color="#ef4444" />
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

      {/* Modal para Novo Serviço */}
      <Modal
        visible={showNewServiceModal}
        animationType="slide"
        presentationStyle="pageSheet"
      >
        <View className="flex-1 bg-white" style={{ paddingTop: insets.top }}>
          <View className="flex-row justify-between items-center p-6 border-b border-gray-200">
            <Text className="text-xl font-bold">
              {isEditing ? 'Editar Serviço' : 'Novo Serviço'}
            </Text>
            <TouchableOpacity 
              onPress={() => {
                setShowNewServiceModal(false);
                resetNewServiceForm();
              }}
            >
              <Icon name="close" size={24} color="#6b7280" />
            </TouchableOpacity>
          </View>

          <ScrollView className="flex-1 p-6">
            {/* Informações do Serviço */}
            <View className="bg-gray-50 rounded-xl p-6 mb-6">
              <Text className="text-lg font-bold mb-4">Informações do Serviço</Text>
              
              <Text className="text-gray-700 font-semibold mb-2">Título do Serviço *</Text>
              <TextInput
                className="bg-white border border-gray-300 rounded-lg p-3 mb-4"
                placeholder="Ex: Limpeza Residencial"
                value={newService.title}
                onChangeText={(text) => setNewService(prev => ({ ...prev, title: text }))}
              />

              <Text className="text-gray-700 font-semibold mb-2">Categoria *</Text>
              <View className="bg-white border border-gray-300 rounded-lg p-3 mb-4">
                <ScrollView horizontal showsHorizontalScrollIndicator={false}>
                  <View className="flex-row space-x-2">
                    {categories.map((category) => (
                      <TouchableOpacity
                        key={category}
                        className={`px-3 py-2 rounded-full ${
                          newService.category === category 
                            ? 'bg-indigo-600' 
                            : 'bg-gray-200'
                        }`}
                        onPress={() => setNewService(prev => ({ ...prev, category }))}
                      >
                        <Text className={`${
                          newService.category === category 
                            ? 'text-white' 
                            : 'text-gray-700'
                        } font-medium`}>
                          {category}
                        </Text>
                      </TouchableOpacity>
                    ))}
                  </View>
                </ScrollView>
              </View>

              <Text className="text-gray-700 font-semibold mb-2">Descrição *</Text>
              <TextInput
                className="bg-white border border-gray-300 rounded-lg p-3 mb-4"
                placeholder="Descreva seu serviço em detalhes..."
                value={newService.description}
                onChangeText={(text) => setNewService(prev => ({ ...prev, description: text }))}
                multiline
                numberOfLines={4}
                textAlignVertical="top"
              />

              <Text className="text-gray-700 font-semibold mb-2">Preço (R$) *</Text>
              <TextInput
                className="bg-white border border-gray-300 rounded-lg p-3 mb-4"
                placeholder="0,00"
                value={newService.price}
                onChangeText={(text) => setNewService(prev => ({ ...prev, price: text }))}
                keyboardType="numeric"
              />

              <Text className="text-gray-700 font-semibold mb-2">Status</Text>
              <View className="flex-row space-x-3">
                <TouchableOpacity
                  className={`px-4 py-2 rounded-lg ${
                    newService.status === 'active' 
                      ? 'bg-green-600' 
                      : 'bg-gray-200'
                  }`}
                  onPress={() => setNewService(prev => ({ ...prev, status: 'active' }))}
                >
                  <Text className={`${
                    newService.status === 'active' 
                      ? 'text-white' 
                      : 'text-gray-700'
                  } font-medium`}>
                    Ativo
                  </Text>
                </TouchableOpacity>
                <TouchableOpacity
                  className={`px-4 py-2 rounded-lg ${
                    newService.status === 'inactive' 
                      ? 'bg-gray-600' 
                      : 'bg-gray-200'
                  }`}
                  onPress={() => setNewService(prev => ({ ...prev, status: 'inactive' }))}
                >
                  <Text className={`${
                    newService.status === 'inactive' 
                      ? 'text-white' 
                      : 'text-gray-700'
                  } font-medium`}>
                    Inativo
                  </Text>
                </TouchableOpacity>
                <TouchableOpacity
                  className={`px-4 py-2 rounded-lg ${
                    newService.status === 'pending' 
                      ? 'bg-yellow-600' 
                      : 'bg-gray-200'
                  }`}
                  onPress={() => setNewService(prev => ({ ...prev, status: 'pending' }))}
                >
                  <Text className={`${
                    newService.status === 'pending' 
                      ? 'text-white' 
                      : 'text-gray-700'
                  } font-medium`}>
                    Pendente
                  </Text>
                </TouchableOpacity>
              </View>
            </View>

            {/* Botões de Ação */}
            <View className="flex-row justify-end space-x-3">
              <TouchableOpacity
                className="bg-gray-100 p-3 rounded-full"
                onPress={() => {
                  setShowNewServiceModal(false);
                  resetNewServiceForm();
                }}
              >
                <Icon name="close" size={24} color="#6b7280" />
              </TouchableOpacity>
              
              <TouchableOpacity
                className="bg-indigo-100 p-3 rounded-full"
                onPress={handleAddNewService}
              >
                <Icon name="check" size={24} color="#4f46e5" />
              </TouchableOpacity>
            </View>
          </ScrollView>
        </View>
      </Modal>
    </ScrollView>
  );
} 