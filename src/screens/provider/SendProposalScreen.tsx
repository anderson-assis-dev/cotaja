import React, { useState, useEffect, useCallback, useRef } from 'react';
import { View, Text, TextInput, TouchableOpacity, ScrollView, Alert, ActivityIndicator, StyleSheet, Platform, KeyboardAvoidingView, Keyboard } from 'react-native';
import { useNavigation, useRoute, useFocusEffect, NavigationProp, RouteProp } from '@react-navigation/native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import Icon from 'react-native-vector-icons/MaterialIcons';
import { proposalService, orderService } from '../../services/api';
import { useAuth } from '../../contexts/AuthContext';
import { useStatusBarOverlay } from '../../hooks/useStatusBarOverlay';
import { StatusBarOverlay } from '../../components/StatusBarOverlay';

// Navigation types
type RootStackParamList = {
  Home: undefined;
  [key: string]: any;
};

type SendProposalScreenNavigationProp = NavigationProp<RootStackParamList>;
type SendProposalScreenRouteProp = RouteProp<{ params: { demand: Demand } }, 'params'>;

// TypeScript interfaces
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

interface RouteParams {
  demand?: Demand;
}

interface ApiProposalPayload {
  order_id: number;
  price: number;
  deadline: string;
  description: string;
}

interface ApiProposalUpdatePayload {
  price: number;
  deadline: string;
  description: string;
}

export default function SendProposalScreen() {
  const navigation = useNavigation<SendProposalScreenNavigationProp>();
  const route = useRoute<SendProposalScreenRouteProp>();
  const { user } = useAuth();
  const [price, setPrice] = useState<string>('');
  const [deadline, setDeadline] = useState<string>('');
  const [description, setDescription] = useState<string>('');
  const [loading, setLoading] = useState<boolean>(false);
  const [demand, setDemand] = useState<Demand | null>(route.params?.demand || null);
  const [refreshing, setRefreshing] = useState<boolean>(false);
  const [keyboardHeight, setKeyboardHeight] = useState(0);
  const { showStatusBarOverlay, statusBarOpacity, handleScroll } = useStatusBarOverlay();
  const scrollViewRef = useRef<ScrollView>(null);
  const descriptionInputRef = useRef<TextInput>(null);
  const updateDescriptionInputRef = useRef<TextInput>(null);

  // Function to update demand data
  const refreshDemandData = useCallback(async () => {
    if (!demand?.id) return;

    setRefreshing(true);
    try {
      // Fetch updated proposals to check if user's proposal already exists
      const response = await proposalService.getProposals({ order_id: parseInt(demand.id) });
      if (response.success) {
        // Update only the proposals in the current demand
        const updatedDemand: Demand = {
          ...demand,
          proposals: response.data.data
        };
        setDemand(updatedDemand);
      }
    } catch (error) {
      console.log('Erro ao atualizar dados da demanda:', error);
      // If there's an error, just reload the original data from parameters
      const originalDemand = route.params?.demand;
      if (originalDemand) {
        setDemand(originalDemand);
      }
    } finally {
      setRefreshing(false);
    }
  }, [demand?.id, route.params]);

  // Keyboard listeners
  useEffect(() => {
    const keyboardWillShow = Keyboard.addListener(
      Platform.OS === 'ios' ? 'keyboardWillShow' : 'keyboardDidShow',
      (event) => {
        setKeyboardHeight(event.endCoordinates.height);
      }
    );

    const keyboardWillHide = Keyboard.addListener(
      Platform.OS === 'ios' ? 'keyboardWillHide' : 'keyboardDidHide',
      () => {
        setKeyboardHeight(0);
      }
    );

    return () => {
      keyboardWillShow.remove();
      keyboardWillHide.remove();
    };
  }, []);

  // Function to scroll to focused input with keyboard consideration
  const scrollToInput = useCallback((inputRef: React.RefObject<TextInput | null>) => {
    if (!inputRef.current || !scrollViewRef.current) return;

    setTimeout(() => {
      inputRef.current?.measureInWindow((x, y, width, height) => {
        const screenHeight = require('react-native').Dimensions.get('window').height;
        const availableHeight = screenHeight - keyboardHeight;
        const inputBottom = y + height;

        // Calculate desired position: input should be at 1/3 from top of available space
        const targetY = availableHeight * 0.33;
        const currentScrollY = y;

        // Calculate scroll offset needed
        const scrollTo = Math.max(0, currentScrollY - targetY + 100); // +100 for extra margin

        scrollViewRef.current?.scrollTo({
          y: scrollTo,
          animated: true
        });
      });
    }, 100); // Reduced timeout for better responsiveness
  }, [keyboardHeight]);

  // Update data when screen gains focus (only once)
  useFocusEffect(
    useCallback(() => {
      // Don't do automatic refresh to avoid multiple calls
      // Refresh will be done only when necessary (after errors)
    }, [])
  );

  if (!demand) {
    return (
      <View style={styles.errorContainer}>
        <Text style={styles.errorText}>Erro: Nenhuma demanda selecionada.</Text>
        <TouchableOpacity
          style={styles.errorButton}
          onPress={() => navigation.goBack()}
        >
          <Text style={styles.errorButtonText}>
            Voltar
          </Text>
        </TouchableOpacity>
      </View>
    );
  }

  // Check if logged provider already has a proposal
  const alreadyProposed = demand.proposals?.some(
    (proposal: Proposal) => proposal.provider_id === user?.id
  );

  const myProposal = demand.proposals?.find(
    (proposal: Proposal) => proposal.provider_id === user?.id
  );

  const handleSubmit = async () => {
    if (!price || !deadline || !description) {
      Alert.alert('Erro', 'Por favor, preencha todos os campos');
      return;
    }
    setLoading(true);
    try {
      const payload: ApiProposalPayload = {
        order_id: Number(demand.id),
        price: Number(price),
        deadline: deadline,
        description: description,
      };

      let response;

      if (alreadyProposed && myProposal) {
        // Update existing proposal
        const updatePayload: ApiProposalUpdatePayload = {
          price: Number(price),
          deadline: deadline,
          description: description,
        };
        response = await proposalService.updateProposal(Number(myProposal.id), updatePayload);
      } else {
        // Create new proposal
        response = await proposalService.createProposal(payload);
      }

      if (response.success) {
        Alert.alert(
          'Sucesso',
          alreadyProposed ? 'Proposta atualizada com sucesso!' : 'Proposta enviada com sucesso! O cliente será notificado.',
          [
            {
              text: 'OK',
              onPress: () => navigation.navigate('Home'),
            },
          ]
        );
      } else {
        Alert.alert('Erro', response.message || 'Erro ao enviar proposta');
      }
    } catch (error: any) {
      console.log('Erro completo:', error);

      // Handle specific API error
      let errorMessage = 'Erro ao enviar proposta';

      if (error.response?.data?.data?.message) {
        // Specific API message (e.g., "Você já enviou uma proposta para este pedido")
        errorMessage = error.response.data.data.message;
      } else if (error.response?.data?.message) {
        // General API message
        errorMessage = error.response.data.message;
      } else if (error.message) {
        // Error message
        errorMessage = error.message;
      }

      Alert.alert('Atenção', errorMessage, [
        {
          text: 'OK',
          onPress: () => {
            // Update screen data after showing message
            refreshDemandData();
          }
        }
      ]);
    } finally {
      setLoading(false);
    }
  };

  // Function to get ranking icon
  const getRankingIcon = (index: number): string => {
    switch (index) {
      case 0: return '🥇';
      case 1: return '🥈';
      case 2: return '🥉';
      default: return '🏅';
    }
  };

  // Function to get ranking color classes
  const getRankingStyle = (index: number) => {
    switch (index) {
      case 0: return [styles.rankingCard, styles.goldRanking];
      case 1: return [styles.rankingCard, styles.silverRanking];
      case 2: return [styles.rankingCard, styles.bronzeRanking];
      default: return [styles.rankingCard, styles.defaultRanking];
    }
  };

  // Function to check if it's winning
  const isWinning = (proposal: Proposal, index: number): boolean => {
    if (index === 0) return true;
    const budget = parseFloat(demand.budget.replace('R$ ', '').replace(',', '.'));
    const proposalPrice = parseFloat(proposal.price.replace('R$ ', '').replace(',', '.'));
    return proposalPrice <= budget;
  };

  const insets = useSafeAreaInsets();

  return (
    <View style={styles.container}>
      <KeyboardAvoidingView
        behavior={Platform.OS === 'ios' ? 'padding' : 'height'}
        style={styles.keyboardView}
        keyboardVerticalOffset={Platform.OS === 'ios' ? 0 : 0}
      >
        <ScrollView
          ref={scrollViewRef}
          style={styles.scrollView}
          onScroll={handleScroll}
          scrollEventThrottle={16}
          keyboardShouldPersistTaps="handled"
          showsVerticalScrollIndicator={false}
          contentContainerStyle={[
            styles.scrollContentContainer,
            { paddingBottom: keyboardHeight > 0 ? keyboardHeight + 20 : 100 }
          ]}
        >
        <View style={[styles.content, { paddingTop: insets.top + 60, marginTop: -60 }]}>
        {/* Header com botão Voltar */}
        <View style={styles.topHeader}>
          <TouchableOpacity
            style={styles.backButtonTop}
            onPress={() => navigation.goBack()}
            activeOpacity={0.8}
          >
            <Icon name="arrow-back" size={24} color="#4f46e5" />
            <Text style={styles.backButtonTopText}>Voltar</Text>
          </TouchableOpacity>
        </View>

        <View style={styles.header}>
          <Text style={styles.title}>Enviar Proposta</Text>
          {refreshing && (
            <ActivityIndicator size="small" color="#4f46e5" />
          )}
        </View>

        {/* Demand Information */}
        <View style={styles.demandCard}>
          <Text style={styles.demandTitle}>{demand.title}</Text>
          <View style={styles.categoryBadge}>
            <Text style={styles.categoryText}>{demand.category}</Text>
          </View>
          <Text style={styles.demandDescription}>{demand.description}</Text>

          <View style={styles.demandMeta}>
            <View style={styles.budgetBadge}>
              <Text style={styles.budgetText}>{demand.budget}</Text>
            </View>
            <View style={styles.deadlineBadge}>
              <Text style={styles.deadlineText}>{demand.deadline}</Text>
            </View>
          </View>

          <View style={styles.demandFooter}>
            <View style={styles.locationContainer}>
              <Icon name="location-on" size={16} color="#6b7280" />
              <Text style={styles.locationText}>{demand.location}</Text>
            </View>
            <View style={styles.ratingContainer}>
              <Icon name="star" size={16} color="#fbbf24" />
              <Text style={styles.ratingText}>{demand.clientRating}</Text>
            </View>
          </View>
        </View>

        {/* Insights */}
        {demand.insights && demand.insights.length > 0 && (
          <View style={styles.insightsCard}>
            <Text style={styles.insightsTitle}>
              💡 Insights para sua Proposta
            </Text>
            {demand.insights.map((insight: string, index: number) => (
              <View key={index} style={styles.insightItem}>
                <Text style={styles.insightBullet}>•</Text>
                <Text style={styles.insightText}>{insight}</Text>
              </View>
            ))}
          </View>
        )}

        {/* Existing Proposals Ranking */}
        {demand.proposals && demand.proposals.length > 0 && (
          <View style={styles.rankingCard}>
            <Text style={styles.rankingTitle}>🏆 Ranking das Propostas</Text>
            {demand.proposals.map((proposal: Proposal, index: number) => {
              const isMyProposal = proposal.provider_id === user?.id;
              const isWinningProposal = isWinning(proposal, index);

              return (
                <View
                  key={proposal.id}
                  style={[
                    ...getRankingStyle(index),
                    isMyProposal && styles.myProposalHighlight
                  ]}
                >
                  {/* Header with ranking and name */}
                  <View style={styles.proposalHeader}>
                    <View style={styles.proposalHeaderLeft}>
                      <View style={styles.providerNameContainer}>
                        <Text style={styles.providerName}>{proposal.providerName}</Text>
                      </View>
                      <View style={styles.rankingIconContainer}>
                        <Text style={styles.rankingIcon}>{getRankingIcon(index)}</Text>
                      </View>
                      <View style={styles.providerInfo}>
                        <View style={styles.providerBadges}>
                          {isMyProposal && (
                            <View style={styles.youBadge}>
                              <Text style={styles.youBadgeText}>VOCÊ</Text>
                            </View>
                          )}
                        </View>
                        <View style={styles.ratingContainer}>
                          <Icon name="star" size={14} color="#fbbf24" />
                          <Text style={styles.providerRating}>{proposal.providerRating}</Text>
                        </View>
                      </View>
                    </View>

                    {/* Price and deadline */}
                    <View style={styles.proposalPricing}>
                      <Text style={styles.proposalPrice}>{proposal.price}</Text>
                      <Text style={styles.proposalDeadline}>{proposal.deadline}</Text>
                    </View>
                  </View>

                  {/* Budget indicator */}
                  {isWinningProposal && (
                    <View style={styles.withinBudgetContainer}>
                      <View style={styles.withinBudgetBadge}>
                        <Icon name="check-circle" size={14} color="#22c55e" />
                        <Text style={styles.withinBudgetText}>🎯 DENTRO DO ORÇAMENTO</Text>
                      </View>
                    </View>
                  )}

                  {/* Description */}
                  <Text style={styles.proposalDescriptionText}>{proposal.description}</Text>

                  {/* Personalized message for my proposal */}
                  {isMyProposal && (
                    <View style={styles.myProposalMessage}>
                      <Text style={styles.myProposalMessageTitle}>
                        {index === 0 ? '🥇 Você está em 1º lugar!' : `Você está em ${index + 1}º lugar`}
                      </Text>
                      <Text style={styles.myProposalMessageText}>
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

        {/* Proposal Form - Only show if not submitted yet */}
        {!alreadyProposed && (
          <View style={styles.formCard}>
            <Text style={styles.formLabel}>Valor da Proposta (R$)</Text>
            <TextInput
              style={styles.formInput}
              placeholder="Ex: 2800"
              value={price}
              onChangeText={setPrice}
              keyboardType="numeric"
            />

            <Text style={styles.formLabel}>Prazo de Execução</Text>
            <TextInput
              style={styles.formInput}
              placeholder="Ex: 12 dias"
              value={deadline}
              onChangeText={setDeadline}
            />

            <Text style={styles.formLabel}>Descrição da Proposta</Text>
            <TextInput
              ref={descriptionInputRef}
              style={[styles.formInput, styles.textAreaInput]}
              placeholder="Descreva como você pretende executar o serviço"
              value={description}
              onChangeText={setDescription}
              multiline
              textAlignVertical="top"
              onFocus={() => scrollToInput(descriptionInputRef)}
            />

            <TouchableOpacity
              style={styles.submitButton}
              onPress={handleSubmit}
              disabled={loading}
            >
              {loading ? (
                <ActivityIndicator color="#fff" />
              ) : (
                <Text style={styles.submitButtonText}>
                  🚀 Enviar Proposta
                </Text>
              )}
            </TouchableOpacity>
          </View>
        )}

        {/* Form to update existing proposal */}
        {alreadyProposed && myProposal && (
          <View style={styles.formCard}>
            <View style={styles.updateProposalHeader}>
              <Text style={styles.updateProposalTitle}>
                ✏️ Atualizar Sua Proposta
              </Text>
              <Text style={styles.updateProposalSubtitle}>
                Você já enviou uma proposta. Pode atualizar os valores para melhorar sua posição no ranking.
              </Text>
            </View>

            <Text style={styles.formLabel}>Novo Valor da Proposta (R$)</Text>
            <TextInput
              style={styles.formInput}
              placeholder="Ex: 2800"
              value={price}
              onChangeText={setPrice}
              keyboardType="numeric"
            />

            <Text style={styles.formLabel}>Novo Prazo de Execução</Text>
            <TextInput
              style={styles.formInput}
              placeholder="Ex: 12 dias"
              value={deadline}
              onChangeText={setDeadline}
            />

            <Text style={styles.formLabel}>Nova Descrição da Proposta</Text>
            <TextInput
              ref={updateDescriptionInputRef}
              style={[styles.formInput, styles.textAreaInput]}
              placeholder="Descreva como você pretende executar o serviço"
              value={description}
              onChangeText={setDescription}
              multiline
              textAlignVertical="top"
              onFocus={() => scrollToInput(updateDescriptionInputRef)}
            />

            <TouchableOpacity
              style={styles.updateButton}
              onPress={handleSubmit}
              disabled={loading}
            >
              {loading ? (
                <ActivityIndicator color="#fff" />
              ) : (
                <Text style={styles.updateButtonText}>
                  🔄 Atualizar Proposta
                </Text>
              )}
            </TouchableOpacity>
          </View>
        )}

        {/* Message if proposal already sent */}
        {alreadyProposed && (
          <View style={styles.alreadyProposedCard}>
            <View style={styles.alreadyProposedContent}>
              <Icon name="check-circle" size={48} color="#22c55e" />
              <Text style={styles.alreadyProposedTitle}>
                Você já enviou uma proposta!
              </Text>
              <Text style={styles.alreadyProposedText}>
                Acompanhe o ranking acima para ver sua posição. O cliente será notificado quando escolher um vencedor.
              </Text>
            </View>
          </View>
        )}

        </View>
        </ScrollView>
      </KeyboardAvoidingView>

      <StatusBarOverlay
        show={showStatusBarOverlay}
        opacity={statusBarOpacity}
        backgroundColor="#4f46e5"
      />
    </View>
  );
}

// StyleSheet definitions
const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#f3f4f6',
  },
  keyboardView: {
    flex: 1,
  },
  scrollView: {
    flex: 1,
  },
  scrollContentContainer: {
    flexGrow: 1,
    paddingBottom: 100,
  },
  content: {
    padding: 24,
  },
  topHeader: {
    marginBottom: 16,
    marginLeft: -15,
  },
  backButtonTop: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingVertical: 8,
    paddingHorizontal: 12,
    alignSelf: 'flex-start',
    borderRadius: 8,
  },
  backButtonTopText: {
    color: '#4f46e5',
    fontSize: 16,
    fontWeight: '600',
    marginLeft: 8,
  },
  errorContainer: {
    flex: 1,
    alignItems: 'center',
    justifyContent: 'center',
    backgroundColor: '#f3f4f6',
  },
  errorText: {
    fontSize: 18,
    color: '#dc2626',
    marginBottom: 16,
  },
  errorButton: {
    backgroundColor: '#4f46e5',
    borderRadius: 8,
    padding: 16,
  },
  errorButtonText: {
    textAlign: 'center',
    color: '#ffffff',
    fontWeight: 'bold',
    fontSize: 18,
  },
  header: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    marginBottom: 24,
  },
  title: {
    fontSize: 24,
    fontWeight: 'bold',
    color: '#111827',
  },
  demandCard: {
    backgroundColor: '#ffffff',
    borderRadius: 12,
    padding: 24,
    shadowColor: '#000',
    shadowOffset: {
      width: 0,
      height: 2,
    },
    shadowOpacity: 0.1,
    shadowRadius: 3.84,
    elevation: 5,
    marginBottom: 24,
  },
  demandTitle: {
    fontSize: 18,
    fontWeight: 'bold',
    color: '#111827',
    marginBottom: 8,
  },
  categoryBadge: {
    backgroundColor: '#e0e7ff',
    paddingHorizontal: 12,
    paddingVertical: 4,
    borderRadius: 12,
    alignSelf: 'flex-start',
    marginBottom: 16,
  },
  categoryText: {
    color: '#4f46e5',
    fontSize: 14,
  },
  demandDescription: {
    color: '#6b7280',
    marginBottom: 16,
    fontSize: 14,
  },
  demandMeta: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    marginBottom: 16,
  },
  budgetBadge: {
    backgroundColor: '#f3f4f6',
    paddingHorizontal: 12,
    paddingVertical: 4,
    borderRadius: 12,
    marginRight: 8,
    marginBottom: 8,
  },
  budgetText: {
    color: '#6b7280',
    fontSize: 14,
  },
  deadlineBadge: {
    backgroundColor: '#f3f4f6',
    paddingHorizontal: 12,
    paddingVertical: 4,
    borderRadius: 12,
    marginBottom: 8,
  },
  deadlineText: {
    color: '#6b7280',
    fontSize: 14,
  },
  demandFooter: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  locationContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    flex: 1,
  },
  locationText: {
    color: '#6b7280',
    marginLeft: 4,
    fontSize: 14,
  },
  ratingContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    marginLeft: 16,
  },
  ratingText: {
    color: '#6b7280',
    marginLeft: 4,
    fontSize: 14,
  },
  insightsCard: {
    backgroundColor: '#fefce8',
    borderRadius: 12,
    padding: 24,
    marginBottom: 24,
  },
  insightsTitle: {
    fontSize: 18,
    fontWeight: 'bold',
    marginBottom: 16,
    color: '#92400e',
  },
  insightItem: {
    flexDirection: 'row',
    alignItems: 'flex-start',
    marginBottom: 8,
  },
  insightBullet: {
    color: '#d97706',
    marginRight: 8,
    fontSize: 14,
  },
  insightText: {
    color: '#92400e',
    flex: 1,
    fontSize: 14,
  },
  rankingCard: {
    backgroundColor: '#ffffff',
    borderRadius: 12,
    padding: 24,
    shadowColor: '#000',
    shadowOffset: {
      width: 0,
      height: 2,
    },
    shadowOpacity: 0.1,
    shadowRadius: 3.84,
    elevation: 5,
    marginBottom: 24,
  },
  rankingTitle: {
    fontSize: 18,
    fontWeight: 'bold',
    marginBottom: 16,
    textAlign: 'center',
    color: '#111827',
  },
  goldRanking: {
    backgroundColor: '#fef3c7',
    borderColor: '#fcd34d',
    borderWidth: 1,
  },
  silverRanking: {
    backgroundColor: '#f3f4f6',
    borderColor: '#d1d5db',
    borderWidth: 1,
  },
  bronzeRanking: {
    backgroundColor: '#fed7aa',
    borderColor: '#fb923c',
    borderWidth: 1,
  },
  defaultRanking: {
    backgroundColor: '#dbeafe',
    borderColor: '#93c5fd',
    borderWidth: 1,
  },
  myProposalHighlight: {
    borderColor: '#3b82f6',
    borderWidth: 2,
  },
  proposalHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    marginBottom: 12,
  },
  proposalHeaderLeft: {
    flexDirection: 'row',
    alignItems: 'center',
    flex: 1,
  },
  providerNameContainer: {
    marginBottom: 40,
  },
  providerName: {
    fontWeight: 'bold',
    fontSize: 16,
    color: '#1f2937',
  },
  rankingIconContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    flex: 1,
    marginBottom: 12,
  },
  rankingIcon: {
    fontSize: 32,
  },
  providerInfo: {
    flex: 1,
  },
  providerBadges: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: 4,
  },
  youBadge: {
    backgroundColor: '#3b82f6',
    paddingHorizontal: 8,
    paddingVertical: 2,
    borderRadius: 12,
    marginLeft: 8,
  },
  youBadgeText: {
    color: '#ffffff',
    fontSize: 12,
    fontWeight: 'bold',
  },
  providerRating: {
    color: '#6b7280',
    marginLeft: 4,
    fontWeight: '500',
    fontSize: 14,
  },
  proposalPricing: {
    alignItems: 'flex-end',
  },
  proposalPrice: {
    fontSize: 18,
    fontWeight: 'bold',
    color: '#059669',
    marginBottom: 4,
  },
  proposalDeadline: {
    color: '#6b7280',
    fontWeight: '500',
    fontSize: 14,
  },
  withinBudgetContainer: {
    marginBottom: 12,
  },
  withinBudgetBadge: {
    backgroundColor: '#dcfce7',
    borderColor: '#bbf7d0',
    borderWidth: 1,
    borderRadius: 8,
    padding: 8,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
  },
  withinBudgetText: {
    color: '#15803d',
    fontWeight: 'bold',
    marginLeft: 8,
    fontSize: 14,
  },
  proposalDescriptionText: {
    color: '#374151',
    fontSize: 14,
    lineHeight: 20,
    marginBottom: 12,
  },
  myProposalMessage: {
    backgroundColor: '#eff6ff',
    borderColor: '#bfdbfe',
    borderWidth: 1,
    borderRadius: 8,
    padding: 12,
  },
  myProposalMessageTitle: {
    color: '#1e40af',
    fontWeight: 'bold',
    textAlign: 'center',
    fontSize: 16,
    marginBottom: 4,
  },
  myProposalMessageText: {
    color: '#2563eb',
    textAlign: 'center',
    fontSize: 12,
  },
  formCard: {
    backgroundColor: '#ffffff',
    borderRadius: 12,
    padding: 24,
    shadowColor: '#000',
    shadowOffset: {
      width: 0,
      height: 2,
    },
    shadowOpacity: 0.1,
    shadowRadius: 3.84,
    elevation: 5,
    marginBottom: 24,
  },
  updateProposalHeader: {
    backgroundColor: '#dbeafe',
    borderColor: '#bfdbfe',
    borderWidth: 1,
    borderRadius: 8,
    padding: 16,
    marginBottom: 24,
  },
  updateProposalTitle: {
    color: '#1e40af',
    fontWeight: 'bold',
    textAlign: 'center',
    marginBottom: 8,
    fontSize: 16,
  },
  updateProposalSubtitle: {
    color: '#2563eb',
    textAlign: 'center',
    fontSize: 14,
  },
  formLabel: {
    fontSize: 18,
    fontWeight: '600',
    color: '#111827',
    marginBottom: 8,
  },
  formInput: {
    borderWidth: 1,
    borderColor: '#d1d5db',
    borderRadius: 8,
    padding: 12,
    marginBottom: 16,
    fontSize: 16,
    color: '#111827',
  },
  textAreaInput: {
    height: 128,
    marginBottom: 24,
  },
  submitButton: {
    backgroundColor: '#4f46e5',
    borderRadius: 8,
    padding: 16,
  },
  submitButtonText: {
    textAlign: 'center',
    color: '#ffffff',
    fontWeight: 'bold',
    fontSize: 18,
  },
  updateButton: {
    backgroundColor: '#2563eb',
    borderRadius: 8,
    padding: 16,
  },
  updateButtonText: {
    textAlign: 'center',
    color: '#ffffff',
    fontWeight: 'bold',
    fontSize: 18,
  },
  alreadyProposedCard: {
    backgroundColor: '#dbeafe',
    borderRadius: 12,
    padding: 24,
    shadowColor: '#000',
    shadowOffset: {
      width: 0,
      height: 2,
    },
    shadowOpacity: 0.1,
    shadowRadius: 3.84,
    elevation: 5,
    marginBottom: 24,
  },
  alreadyProposedContent: {
    alignItems: 'center',
  },
  alreadyProposedTitle: {
    fontSize: 18,
    fontWeight: 'bold',
    color: '#15803d',
    marginTop: 8,
    marginBottom: 4,
  },
  alreadyProposedText: {
    color: '#6b7280',
    textAlign: 'center',
    fontSize: 14,
  },
  backButton: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    backgroundColor: '#ffffff',
    borderWidth: 1,
    borderColor: '#e5e7eb',
    borderRadius: 12,
    paddingVertical: 16,
    paddingHorizontal: 24,
    marginTop: 24,
    shadowColor: '#000',
    shadowOffset: {
      width: 0,
      height: 1,
    },
    shadowOpacity: 0.1,
    shadowRadius: 2,
    elevation: 2,
  },
  backButtonText: {
    color: '#4f46e5',
    fontSize: 16,
    fontWeight: '600',
    marginLeft: 8,
  },
});