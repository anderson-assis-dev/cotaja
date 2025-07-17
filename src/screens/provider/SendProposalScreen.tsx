import { useState } from 'react';
import { View, Text, TextInput, TouchableOpacity, ScrollView, Alert, ActivityIndicator } from 'react-native';
import { useNavigation, useRoute } from '@react-navigation/native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import Icon from 'react-native-vector-icons/MaterialIcons';
import { proposalService } from '../../services/api';
import { useAuth } from '../../contexts/AuthContext';

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

export default function SendProposalScreen() {
  const navigation = useNavigation();
  const route = useRoute();
  const { user } = useAuth();
  const [price, setPrice] = useState('');
  const [deadline, setDeadline] = useState('');
  const [description, setDescription] = useState('');
  const [loading, setLoading] = useState(false);

  // Exigir demanda via params
  const demand = (route.params as any)?.demand;

  if (!demand) {
    return (
      <View className="flex-1 items-center justify-center bg-gray-100">
        <Text className="text-lg text-red-600 mb-4">Erro: Nenhuma demanda selecionada.</Text>
        <TouchableOpacity
          className="bg-indigo-600 rounded-lg p-4"
          onPress={() => navigation.goBack()}
        >
          <Text className="text-center text-white font-bold text-lg">
            Voltar
          </Text>
        </TouchableOpacity>
      </View>
    );
  }

  // Verificar se já existe proposta do provider logado
  const alreadyProposed = demand.proposals?.some(
    (proposal: any) => proposal.provider_id === user?.id
  );

  const handleSubmit = async () => {
    if (!price || !deadline || !description) {
      Alert.alert('Erro', 'Por favor, preencha todos os campos');
      return;
    }
    setLoading(true);
    try {
      const payload = {
        order_id: Number(demand.id),
        price: Number(price),
        deadline: deadline,
        description: description,
      };
      console.log('Enviando proposta:', payload);
      const response = await proposalService.createProposal(payload);
      if (response.success) {
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
      } else {
        Alert.alert('Erro', response.message || 'Erro ao enviar proposta');
      }
    } catch (error: any) {
      console.error('Erro ao enviar proposta:', error);
      Alert.alert('Erro', error.message || 'Erro ao enviar proposta');
    } finally {
      setLoading(false);
    }
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
          {alreadyProposed ? (
            <View className="items-center mb-4">
              <Icon name="check-circle" size={48} color="#22c55e" />
              <Text className="text-lg font-bold text-green-700 mt-2 mb-1">Você já enviou uma proposta para este pedido.</Text>
              <Text className="text-gray-600 text-center">Aguarde a resposta do cliente antes de enviar outra proposta.</Text>
            </View>
          ) : (
            <>
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
            </>
          )}

          <TouchableOpacity
            className={`bg-indigo-600 rounded-lg p-4 ${alreadyProposed ? 'opacity-50' : ''}`}
            onPress={handleSubmit}
            disabled={loading || alreadyProposed}
          >
            {loading ? (
              <ActivityIndicator color="#fff" />
            ) : (
              <Text className="text-center text-white font-bold text-lg">
                Enviar Proposta
              </Text>
            )}
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