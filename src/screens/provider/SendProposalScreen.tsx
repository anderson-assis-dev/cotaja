import { useState, useEffect } from 'react';
import { View, Text, TextInput, TouchableOpacity, ScrollView, Alert, ActivityIndicator } from 'react-native';
import { useNavigation, useRoute, useFocusEffect } from '@react-navigation/native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import Icon from 'react-native-vector-icons/MaterialIcons';
import { proposalService, orderService } from '../../services/api';
import { useAuth } from '../../contexts/AuthContext';
import { useCallback } from 'react';

// Tipos TypeScript
interface Proposal {
  id: string;
  providerName: string;
  providerRating: number;
  price: string;
  deadline: string;
  description: string;
  ranking: number;
  provider_id?: number;
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
  const [demand, setDemand] = useState((route.params as any)?.demand);
  const [refreshing, setRefreshing] = useState(false);

  // Função para atualizar os dados da demanda
  const refreshDemandData = useCallback(async () => {
    if (!demand?.id) return;
    
    setRefreshing(true);
    try {
      // Buscar propostas atualizadas para verificar se já existe uma proposta do usuário
      const response = await proposalService.getProposals({ order_id: parseInt(demand.id) });
      if (response.success) {
        // Atualizar apenas as propostas na demanda atual
        const updatedDemand = {
          ...demand,
          proposals: response.data.data
        };
        setDemand(updatedDemand);
      }
    } catch (error) {
      console.log('Erro ao atualizar dados da demanda:', error);
      // Se houver erro, apenas recarregar os dados originais dos parâmetros
      const originalDemand = (route.params as any)?.demand;
      if (originalDemand) {
        setDemand(originalDemand);
      }
    } finally {
      setRefreshing(false);
    }
  }, [demand?.id, route.params]);

  // Atualizar dados quando a tela ganha foco (apenas uma vez)
  useFocusEffect(
    useCallback(() => {
      // Não fazer refresh automático para evitar múltiplas chamadas
      // O refresh será feito apenas quando necessário (após erros)
    }, [])
  );

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

  const myProposal = demand.proposals?.find(
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
      
      let response;
      
      if (alreadyProposed && myProposal) {
        // Atualizar proposta existente
        response = await proposalService.updateProposal(Number(myProposal.id), {
          price: Number(price),
          deadline: deadline,
          description: description,
        });
      } else {
        // Criar nova proposta
        response = await proposalService.createProposal(payload);
      }
      
      
      if (response.success) {
        Alert.alert(
          'Sucesso',
          alreadyProposed ? 'Proposta atualizada com sucesso!' : 'Proposta enviada com sucesso! O cliente será notificado.',
          [
            {
              text: 'OK',
              onPress: () => (navigation as any).navigate('Home'),
            },
          ]
        );
      } else {
        Alert.alert('Erro', response.message || 'Erro ao enviar proposta');
      }
    } catch (error: any) {
      console.log('Erro completo:', error);
      
      // Tratar erro específico da API
      let errorMessage = 'Erro ao enviar proposta';
      
      if (error.response?.data?.data?.message) {
        // Mensagem específica da API (ex: "Você já enviou uma proposta para este pedido")
        errorMessage = error.response.data.data.message;
      } else if (error.response?.data?.message) {
        // Mensagem geral da API
        errorMessage = error.response.data.message;
      } else if (error.message) {
        // Mensagem do erro
        errorMessage = error.message;
      }
      
      Alert.alert('Atenção', errorMessage, [
        {
          text: 'OK',
          onPress: () => {
            // Atualizar os dados da tela após mostrar a mensagem
            refreshDemandData();
          }
        }
      ]);
    } finally {
      setLoading(false);
    }
  };

  // Função para obter ícone de ranking
  const getRankingIcon = (index: number) => {
    switch (index) {
      case 0: return '🥇';
      case 1: return '🥈';
      case 2: return '🥉';
      default: return '🏅';
    }
  };

  // Função para obter cor de ranking
  const getRankingColor = (index: number) => {
    switch (index) {
      case 0: return 'bg-yellow-100 border-yellow-300';
      case 1: return 'bg-gray-100 border-gray-300';
      case 2: return 'bg-orange-100 border-orange-300';
      default: return 'bg-blue-100 border-blue-300';
    }
  };

  // Função para verificar se está ganhando
  const isWinning = (proposal: any, index: number) => {
    if (index === 0) return true;
    const budget = parseFloat(demand.budget.replace('R$ ', '').replace(',', '.'));
    const proposalPrice = parseFloat(proposal.price.replace('R$ ', '').replace(',', '.'));
    return proposalPrice <= budget;
  };

  const insets = useSafeAreaInsets();
  return (
    <ScrollView className="flex-1 bg-gray-100" style={{ paddingTop: insets.top }}>
      <View className="p-6">
        <View className="flex-row items-center justify-between mb-6">
          <Text className="text-2xl font-bold">Enviar Proposta</Text>
          {refreshing && (
            <ActivityIndicator size="small" color="#4f46e5" />
          )}
        </View>

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
            <Text className="text-lg font-bold mb-4 text-center">🏆 Ranking das Propostas</Text>
            {demand.proposals.map((proposal: Proposal, index: number) => {
              const isMyProposal = proposal.provider_id === user?.id;
              const isWinningProposal = isWinning(proposal, index);
              
              return (
                <View 
                  key={proposal.id} 
                  className={`rounded-xl p-4 mb-4 ${getRankingColor(index)} ${isMyProposal ? 'ring-2 ring-blue-500 ring-offset-2' : ''}`}
                >
                  {/* Header com ranking e nome */}
                  <View className="flex-row items-center justify-between mb-3">
                    <View className="flex-row items-center flex-1">
                      <View className="flex-row items-center mb-10">
                        <Text className="font-bold text-base text-gray-800">{proposal.providerName} </Text>
                      </View>
                      <View className="flex-row items-center flex-1 mb-3">
                        <Text className="text-2xl">{getRankingIcon(index)}</Text>
                        <Text className="text-xs text-gray-500 text-center mt-1">
                         
                        </Text>
                      </View>
                      <View className="flex-1">
                   
                        <View className="flex-row items-center mb-1">
                          {isMyProposal && (
                            <View className="bg-blue-500 px-2 py-1 rounded-full ml-2">
                              <Text className="text-white text-xs font-bold">VOCÊ</Text>
                            </View>
                          )}
                        </View>
                        <View className="flex-row items-center">
                          <Icon name="star" size={14} color="#fbbf24" />
                          <Text className="text-gray-600 ml-1 font-medium text-sm">{proposal.providerRating}</Text>
                        </View>
                      </View>
                    </View>
                    
                    {/* Preço e prazo */}
                    <View className="items-end">
                      <Text className="text-lg font-bold text-green-600 mb-1">{proposal.price}</Text>
                      <Text className="text-gray-600 font-medium text-sm">{proposal.deadline}</Text>
                    </View>
                  </View>
                  
                  {/* Indicador de orçamento */}
                  {isWinningProposal && (
                    <View className="bg-green-100 border border-green-200 rounded-lg p-2 mb-3">
                      <View className="flex-row items-center justify-center">
                        <Icon name="check-circle" size={14} color="#22c55e" />
                        <Text className="text-green-700 font-bold ml-2 text-sm">🎯 DENTRO DO ORÇAMENTO</Text>
                      </View>
                    </View>
                  )}
                  
                  {/* Descrição */}
                  <Text className="text-gray-700 text-sm leading-5 mb-3">{proposal.description}</Text>
                  
                  {/* Mensagem personalizada para minha proposta */}
                  {isMyProposal && (
                    <View className="bg-gradient-to-r from-blue-50 to-indigo-50 border border-blue-200 rounded-lg p-3">
                      <Text className="text-blue-800 font-bold text-center text-base mb-1">
                        {index === 0 ? '🥇 Você está em 1º lugar!' : `Você está em ${index + 1}º lugar`}
                      </Text>
                      <Text className="text-blue-600 text-center text-xs">
                        {index === 0 
                          ? 'Continue assim para ganhar o leilão!' 
                          : 'Melhore sua proposta para subir no ranking!'
                        }
                      </Text>
                    </View>
                  )}
                </View>
              );
            })}
          </View>
        )}

        {/* Formulário da Proposta - Só mostrar se não enviou ainda */}
        {!alreadyProposed && (
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
              disabled={loading}
            >
              {loading ? (
                <ActivityIndicator color="#fff" />
              ) : (
                <Text className="text-center text-white font-bold text-lg">
                  🚀 Enviar Proposta
                </Text>
              )}
            </TouchableOpacity>
          </View>
        )}

        {/* Formulário para atualizar proposta existente */}
        {alreadyProposed && myProposal && (
          <View className="bg-white rounded-xl p-6 shadow-sm">
            <View className="bg-blue-50 border border-blue-200 rounded-lg p-4 mb-6">
              <Text className="text-blue-800 font-bold text-center mb-2">
                ✏️ Atualizar Sua Proposta
              </Text>
              <Text className="text-blue-600 text-center text-sm">
                Você já enviou uma proposta. Pode atualizar os valores para melhorar sua posição no ranking.
              </Text>
            </View>

            <Text className="text-lg font-semibold mb-2">Novo Valor da Proposta (R$)</Text>
            <TextInput
              className="border border-gray-300 rounded-lg p-3 mb-4"
              placeholder="Ex: 2800"
              value={price}
              onChangeText={setPrice}
              keyboardType="numeric"
            />

            <Text className="text-lg font-semibold mb-2">Novo Prazo de Execução</Text>
            <TextInput
              className="border border-gray-300 rounded-lg p-3 mb-4"
              placeholder="Ex: 12 dias"
              value={deadline}
              onChangeText={setDeadline}
            />

            <Text className="text-lg font-semibold mb-2">Nova Descrição da Proposta</Text>
            <TextInput
              className="border border-gray-300 rounded-lg p-3 mb-6 h-32"
              placeholder="Descreva como você pretende executar o serviço"
              value={description}
              onChangeText={setDescription}
              multiline
              textAlignVertical="top"
            />

            <TouchableOpacity
              className="bg-blue-600 rounded-lg p-4"
              onPress={handleSubmit}
              disabled={loading}
            >
              {loading ? (
                <ActivityIndicator color="#fff" />
              ) : (
                <Text className="text-center text-white font-bold text-lg">
                  🔄 Atualizar Proposta
                </Text>
              )}
            </TouchableOpacity>
          </View>
        )}

        {/* Mensagem se já enviou proposta */}
        {alreadyProposed && (
          <View className="bg-blue-50 rounded-xl p-6 shadow-sm">
            <View className="items-center">
              <Icon name="check-circle" size={48} color="#22c55e" />
              <Text className="text-lg font-bold text-green-700 mt-2 mb-1">
                Você já enviou uma proposta!
              </Text>
              <Text className="text-gray-600 text-center">
                Acompanhe o ranking acima para ver sua posição. O cliente será notificado quando escolher um vencedor.
              </Text>
            </View>
          </View>
        )}

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