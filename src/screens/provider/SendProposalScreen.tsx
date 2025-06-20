import { useState } from 'react';
import { View, Text, TextInput, TouchableOpacity, ScrollView, Alert } from 'react-native';
import { useNavigation } from '@react-navigation/native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';

// Dados mockados para exemplo
const mockDemand = {
  id: '1',
  title: 'Pintura de apartamento',
  category: 'Pintura',
  budget: 'R$ 3.000,00',
  deadline: '15 dias',
  description: 'Preciso pintar um apartamento de 80m², 2 quartos, sala, cozinha e banheiro.',
};

export default function SendProposalScreen() {
  const navigation = useNavigation();
  const [price, setPrice] = useState('');
  const [deadline, setDeadline] = useState('');
  const [description, setDescription] = useState('');

  const handleSubmit = () => {
    if (!price || !deadline || !description) {
      Alert.alert('Erro', 'Por favor, preencha todos os campos');
      return;
    }

    // Simulação de envio de proposta
    Alert.alert(
      'Sucesso',
      'Proposta enviada com sucesso! O cliente será notificado.',
      [
        {
          text: 'OK',
          onPress: () => navigation.navigate('ProviderHome' as never),
        },
      ]
    );
  };
  const insets = useSafeAreaInsets();
  return (
    <ScrollView className="flex-1 bg-gray-100" style={{ paddingTop: insets.top }}>
      <View className="p-6">
        <Text className="text-2xl font-bold mb-6">Enviar Proposta</Text>

        <View className="bg-white rounded-xl p-6 shadow-sm mb-6">
          <Text className="text-lg font-bold mb-2">{mockDemand.title}</Text>
          <View className="bg-indigo-100 px-3 py-1 rounded-full self-start mb-4">
            <Text className="text-indigo-600">{mockDemand.category}</Text>
          </View>
          <Text className="text-gray-600 mb-4">{mockDemand.description}</Text>

          <View className="flex-row flex-wrap mb-4">
            <View className="bg-gray-100 px-3 py-1 rounded-full mr-2 mb-2">
              <Text className="text-gray-600">{mockDemand.budget}</Text>
            </View>
            <View className="bg-gray-100 px-3 py-1 rounded-full mb-2">
              <Text className="text-gray-600">{mockDemand.deadline}</Text>
            </View>
          </View>
        </View>

        <View className="bg-white rounded-xl p-6 shadow-sm">
          <Text className="text-lg font-semibold mb-2">Valor da Proposta (R$)</Text>
          <TextInput
            className="border border-gray-300 rounded-lg p-3 mb-4"
            placeholder="Ex: 2800"
            value={price}
            onChangeText={setPrice}
            keyboardType="numeric"
          />

          <Text className="text-lg font-semibold mb-2">Prazo de Execução</Text>
          <TextInput
            className="border border-gray-300 rounded-lg p-3 mb-4"
            placeholder="Ex: 12 dias"
            value={deadline}
            onChangeText={setDeadline}
          />

          <Text className="text-lg font-semibold mb-2">Descrição da Proposta</Text>
          <TextInput
            className="border border-gray-300 rounded-lg p-3 mb-6 h-32"
            placeholder="Descreva como você pretende executar o serviço"
            value={description}
            onChangeText={setDescription}
            multiline
            textAlignVertical="top"
          />

          <TouchableOpacity
            className="bg-indigo-600 rounded-lg p-4"
            onPress={handleSubmit}
          >
            <Text className="text-center text-white font-bold text-lg">
              Enviar Proposta
            </Text>
          </TouchableOpacity>
        </View>

        <TouchableOpacity
          className="mt-6"
          onPress={() => navigation.goBack()}
        >
          <Text className="text-indigo-600 text-center">
            Voltar
          </Text>
        </TouchableOpacity>
      </View>
    </ScrollView>
  );
} 