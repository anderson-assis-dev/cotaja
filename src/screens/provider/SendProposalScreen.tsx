import { useState } from 'react';
import { View, Text, TextInput, TouchableOpacity, ScrollView, Alert } from 'react-native';
import { useNavigation, useRoute } from '@react-navigation/native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import Icon from 'react-native-vector-icons/MaterialIcons';

// Tipos TypeScript
interface Proposal {
  id: string;
  providerName: string;
  providerRating: number;
  price: string;
  deadline: string;
  description: string;
  ranking: number;
}

interface Demand {
  id: string;
  title: string;
  category: string;
  budget: string;
  deadline: string;
  description: string;
  location: string;
  clientRating: number;
  proposals: Proposal[];
  insights: string[];
}

// Dados mockados para exemplo (fallback)
const mockDemand: Demand = {
  id: '1',
  title: 'Pintura de apartamento',
  category: 'Pintura',
  budget: 'R$ 3.000,00',
  deadline: '15 dias',
  description: 'Preciso pintar um apartamento de 80m², 2 quartos, sala, cozinha e banheiro.',
  location: 'São Paulo, SP',
  clientRating: 4.8,
  proposals: [],
  insights: [
    'O orçamento médio da categoria é R$ 2.750,00',
    'Prazo médio de execução: 11 dias',
    'Você tem avaliação superior à média (4.9 vs 4.6)',
    'Sugestão: Ofereça R$ 2.750,00 em 10 dias para ficar em 1º lugar'
  ]
};

export default function SendProposalScreen() {
  const navigation = useNavigation();
  const route = useRoute();
  const [price, setPrice] = useState('');
  const [deadline, setDeadline] = useState('');
  const [description, setDescription] = useState('');

  // Pegar dados da demanda via route params ou usar mock
  const demand = (route.params as any)?.demand || mockDemand;

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
          onPress: () => (navigation as any).navigate('ProviderHome'),
        },
      ]
    );
  };

  const insets = useSafeAreaInsets();
  return (
    <ScrollView className="flex-1 bg-gray-100" style={{ paddingTop: insets.top }}>
      <View className="p-6">
        <Text className="text-2xl font-bold mb-6">Enviar Proposta</Text>

        {/* Informações da Demanda */}
        <View className="bg-white rounded-xl p-6 shadow-sm mb-6">
          <Text className="text-lg font-bold mb-2">{demand.title}</Text>
          <View className="bg-indigo-100 px-3 py-1 rounded-full self-start mb-4">
            <Text className="text-indigo-600">{demand.category}</Text>
          </View>
          <Text className="text-gray-600 mb-4">{demand.description}</Text>

          <View className="flex-row flex-wrap mb-4">
            <View className="bg-gray-100 px-3 py-1 rounded-full mr-2 mb-2">
              <Text className="text-gray-600">{demand.budget}</Text>
            </View>
            <View className="bg-gray-100 px-3 py-1 rounded-full mb-2">
              <Text className="text-gray-600">{demand.deadline}</Text>
            </View>
          </View>

          <View className="flex-row items-center">
            <Icon name="location-on" size={16} color="#6b7280" />
            <Text className="text-gray-600 ml-1">{demand.location}</Text>
            <View className="flex-row items-center ml-4">
              <Icon name="star" size={16} color="#fbbf24" />
              <Text className="text-gray-600 ml-1">{demand.clientRating}</Text>
            </View>
          </View>
        </View>

        {/* Insights */}
        {demand.insights && demand.insights.length > 0 && (
          <View className="bg-yellow-50 rounded-xl p-6 mb-6">
            <Text className="text-lg font-bold mb-4 text-yellow-800">
              💡 Insights para sua Proposta
            </Text>
            {demand.insights.map((insight: string, index: number) => (
              <View key={index} className="flex-row items-start mb-2">
                <Text className="text-yellow-600 mr-2">•</Text>
                <Text className="text-yellow-800 flex-1">{insight}</Text>
              </View>
            ))}
          </View>
        )}

        {/* Ranking das Propostas Existentes */}
        {demand.proposals && demand.proposals.length > 0 && (
          <View className="bg-white rounded-xl p-6 shadow-sm mb-6">
            <Text className="text-lg font-semibold mb-4">Propostas Existentes</Text>
            {demand.proposals.slice(0, 3).map((proposal: Proposal, index: number) => (
              <View key={proposal.id} className="border-b border-gray-200 pb-3 mb-3 last:border-b-0 last:pb-0 last:mb-0">
                <View className="flex-row justify-between items-start mb-2">
                  <Text className="font-semibold">{proposal.providerName}</Text>
                  <View className="flex-row items-center">
                    <Icon name="star" size={14} color="#fbbf24" />
                    <Text className="text-gray-600 ml-1">{proposal.providerRating}</Text>
                  </View>
                </View>
                <View className="flex-row justify-between">
                  <Text className="text-gray-600">{proposal.price}</Text>
                  <Text className="text-gray-600">{proposal.deadline}</Text>
                </View>
              </View>
            ))}
          </View>
        )}

        {/* Formulário da Proposta */}
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