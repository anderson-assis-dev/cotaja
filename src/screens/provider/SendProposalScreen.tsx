import React, { useState, useEffect, useCallback, useRef } from 'react';
import { View, Text, TextInput, TouchableOpacity, ScrollView, ActivityIndicator, StyleSheet, Platform, KeyboardAvoidingView, Keyboard, Image, Dimensions } from 'react-native';
import { useNavigation, useRoute, useFocusEffect, NavigationProp, RouteProp } from '@react-navigation/native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import Icon from 'react-native-vector-icons/MaterialIcons';
import { Send, Pencil, RefreshCw } from 'lucide-react-native';
import Config from 'react-native-config';
import { proposalService, orderService } from '../../services/api';
import { formatPrice } from '../../utils/formatters';
import { useAuth } from '../../contexts/AuthContext';
import { useToast } from '../../contexts/ToastContext';
import { useStatusBarOverlay } from '../../hooks/useStatusBarOverlay';
import { StatusBarOverlay } from '../../components/StatusBarOverlay';
import { ImageViewer } from '../../components/ImageViewer';
import { getAttachmentUrl as sharedGetAttachmentUrl, isImageAttachment as sharedIsImageAttachment } from '../../utils/attachmentHelpers';

const { width: SCREEN_WIDTH } = Dimensions.get('window');

const BASE_URL = Config.API_URL || Config.SERVER_BASE_URL || 'http://10.0.2.2:3000';

const getAttachmentUrl = sharedGetAttachmentUrl;
const isImageAttachment = sharedIsImageAttachment;

type RootStackParamList = {
  Home: undefined;
  [key: string]: any;
};

type SendProposalScreenNavigationProp = NavigationProp<RootStackParamList>;
type SendProposalScreenRouteProp = RouteProp<{ params: { demand: Demand } }, 'params'>;

interface Proposal {
  id: string;
  providerName: string;
  providerRating: number;
  price: string;
  deadline: string;
  description: string;
  ranking: number;
  provider_id?: number;
  created_at?: string;
  status?: string;
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
  attachments?: any[];
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
  const { showSuccess, showError } = useToast();
  const [price, setPrice] = useState<string>('');
  const [priceDisplay, setPriceDisplay] = useState<string>('');
  const [deadline, setDeadline] = useState<string>('');

  const handlePriceChange = (text: string) => {
    const digits = text.replace(/\D/g, '');
    if (!digits) {
      setPrice('');
      setPriceDisplay('');
      return;
    }
    setPrice(digits);
    const numericValue = parseInt(digits, 10);
    const formatted = (numericValue / 100).toLocaleString('pt-BR', {
      minimumFractionDigits: 2,
      maximumFractionDigits: 2,
    });
    setPriceDisplay(`R$ ${formatted}`);
  };

  const handleDeadlineChange = (text: string) => {
    const numbers = text.replace(/[^0-9]/g, '');
    setDeadline(numbers);
  };
  const [description, setDescription] = useState<string>('');
  const [loading, setLoading] = useState<boolean>(false);
  const [demand, setDemand] = useState<Demand | null>(() => {
    const d = route.params?.demand || null;
    if (d && d.attachments && typeof d.attachments === 'string') {
      try {
        d.attachments = JSON.parse(d.attachments as any);
      } catch (e) {
        d.attachments = [];
      }
    }
    return d;
  });
  const [refreshing, setRefreshing] = useState<boolean>(false);
  const [keyboardHeight, setKeyboardHeight] = useState(0);
  const { showStatusBarOverlay, statusBarOpacity, handleScroll } = useStatusBarOverlay();
  const scrollViewRef = useRef<ScrollView>(null);
  const descriptionInputRef = useRef<TextInput>(null);
  const updateDescriptionInputRef = useRef<TextInput>(null);
  const [imageViewerVisible, setImageViewerVisible] = useState(false);
  const [selectedImageIndex, setSelectedImageIndex] = useState(0);

  useEffect(() => {
    if (demand) {
      console.log('📎 SendProposal - demand.attachments:', {
        value: demand.attachments,
        type: typeof demand.attachments,
        isArray: Array.isArray(demand.attachments),
        length: Array.isArray(demand.attachments) ? demand.attachments.length : 'N/A',
        firstItem: Array.isArray(demand.attachments) && demand.attachments.length > 0
          ? JSON.stringify(demand.attachments[0])
          : 'EMPTY',
      });
    }
  }, [demand]);

  const refreshDemandData = useCallback(async () => {
    if (!demand?.id) return;

    setRefreshing(true);
    try {
      const response = await proposalService.getProposals({ order_id: parseInt(demand.id) });
      if (response.success) {
        const formattedProposals = (response.data.data || []).map((p: any, index: number) => ({
          id: p.id?.toString() || index.toString(),
          providerName: p.provider?.name || 'Prestador',
          providerRating: p.provider?.rating || 4.5,
          price: `R$ ${formatPrice(Number(p.price || 0))}`,
          deadline: `${p.deadline || 0} dias`,
          description: p.description || 'Sem descrição',
          ranking: index + 1,
          provider_id: p.provider_id,
          created_at: p.created_at || null,
          status: p.status || 'pending',
        }));
        const updatedDemand: Demand = {
          ...demand,
          proposals: formattedProposals,
        };
        setDemand(updatedDemand);
      }
    } catch (error) {
      console.log('Erro ao atualizar dados da demanda:', error);
      const originalDemand = route.params?.demand;
      if (originalDemand) {
        setDemand(originalDemand);
      }
    } finally {
      setRefreshing(false);
    }
  }, [demand?.id, route.params]);

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

  const scrollToInput = useCallback((inputRef: React.RefObject<TextInput | null>) => {
    if (!inputRef.current || !scrollViewRef.current) return;

    setTimeout(() => {
      inputRef.current?.measureInWindow((x, y, width, height) => {
        const screenHeight = require('react-native').Dimensions.get('window').height;
        const availableHeight = screenHeight - keyboardHeight;
        const inputBottom = y + height;

        const targetY = availableHeight * 0.33;
        const currentScrollY = y;

        const scrollTo = Math.max(0, currentScrollY - targetY + 100);

        scrollViewRef.current?.scrollTo({
          y: scrollTo,
          animated: true
        });
      });
    }, 100);
  }, [keyboardHeight]);

  useFocusEffect(
    useCallback(() => {
    }, [])
  );

  const insets = useSafeAreaInsets();

  const alreadyProposed = demand?.proposals?.some(
    (proposal: Proposal) => proposal.provider_id === user?.id
  ) ?? false;

  const myProposal = demand?.proposals?.find(
    (proposal: Proposal) => proposal.provider_id === user?.id
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

  const handleSubmit = async () => {
    if (!price || !deadline || !description) {
      showError('Por favor, preencha todos os campos');
      return;
    }

    const priceNumber = parseInt(price, 10) / 100;
    if (isNaN(priceNumber) || priceNumber <= 0) {
      showError('Por favor, informe um valor válido para a proposta');
      return;
    }

    setLoading(true);
    try {
      const payload: ApiProposalPayload = {
        order_id: Number(demand.id),
        price: priceNumber,
        deadline: deadline,
        description: description,
      };

      console.log('📤 Enviando proposta:', payload);

      let response;

      if (alreadyProposed && myProposal) {
        const updatePayload: ApiProposalUpdatePayload = {
          price: parseInt(price, 10) / 100,
          deadline: deadline,
          description: description,
        };
        response = await proposalService.updateProposal(Number(myProposal.id), updatePayload);
      } else {
        response = await proposalService.createProposal(payload);
      }

      if (response.success) {
        setPrice('');
        setPriceDisplay('');
        setDeadline('');
        setDescription('');

        await refreshDemandData();

        scrollViewRef.current?.scrollTo({ y: 0, animated: true });

        showSuccess(alreadyProposed ? 'Proposta atualizada com sucesso!' : 'Proposta enviada com sucesso!');
      } else {
        showError(response.message || 'Erro ao enviar proposta');
      }
    } catch (error: any) {
      console.log('❌ Erro completo:', error);
      console.log('❌ Erro response:', error.response);
      console.log('❌ Erro response data:', error.response?.data);

      let errorMessage = 'Erro ao enviar proposta';

      if (error.response?.data?.message === 'Você já enviou uma proposta para este pedido') {
        errorMessage = 'Você já possui uma proposta para este pedido. Atualizando...';
        showError(errorMessage);
        await refreshDemandData();
        setLoading(false);
        return;
      } else if (error.response?.data?.data?.message) {
        errorMessage = error.response.data.data.message;
      } else if (error.response?.data?.message) {
        errorMessage = error.response.data.message;
      } else if (error.message) {
        errorMessage = error.message;
      }

      showError(errorMessage);
      refreshDemandData();
    } finally {
      setLoading(false);
    }
  };

  const getRankingPosition = (index: number): string => {
    return `#${index + 1}`;
  };

  const isWinning = (proposal: Proposal, index: number): boolean => {
    if (index === 0) return true;
    const budget = parseFloat(demand.budget.replace('R$ ', '').replace(',', '.'));
    const proposalPrice = parseFloat(proposal.price.replace('R$ ', '').replace(',', '.'));
    return proposalPrice <= budget;
  };

  return (
    <View style={styles.container}>
      <View style={styles.headerBackground} />
      <View style={[styles.header, { paddingTop: insets.top + 16 }]}>
        <View style={styles.headerTop}>
          <TouchableOpacity
            style={styles.backButtonHeader}
            onPress={() => navigation.goBack()}
            activeOpacity={0.8}
          >
            <Icon name="arrow-back" size={22} color="#ffffff" />
          </TouchableOpacity>
          <Text style={styles.title}>Enviar Proposta</Text>
          {refreshing && (
            <ActivityIndicator size="small" color="rgba(255,255,255,0.8)" />
          )}
        </View>
      </View>

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
        <View style={styles.content}>


        <View style={styles.demandCard}>

          {(() => {
            const images = Array.isArray(demand.attachments)
              ? demand.attachments.filter(isImageAttachment)
              : [];
            if (images.length === 0) return null;
            const heroUrl = getAttachmentUrl(images[0]);
            return (
              <TouchableOpacity
                activeOpacity={0.9}
                onPress={() => {
                  setSelectedImageIndex(0);
                  setImageViewerVisible(true);
                }}
                style={styles.heroImageContainer}
              >
                <Image source={{ uri: heroUrl }} style={styles.heroImage} resizeMode="cover" />
                {images.length > 1 && (
                  <View style={styles.heroImageCount}>
                    <Icon name="photo-library" size={14} color="#fff" />
                    <Text style={styles.heroImageCountText}>{images.length}</Text>
                  </View>
                )}
                <View style={styles.heroZoomHint}>
                  <Icon name="zoom-in" size={16} color="#fff" />
                </View>
              </TouchableOpacity>
            );
          })()}


          {(() => {
            const images = Array.isArray(demand.attachments)
              ? demand.attachments.filter(isImageAttachment)
              : [];
            if (images.length <= 1) return null;
            return (
              <ScrollView
                horizontal
                showsHorizontalScrollIndicator={false}
                contentContainerStyle={styles.thumbRow}
              >
                {images.map((image: any, index: number) => {
                  const imageUrl = getAttachmentUrl(image);
                  return (
                    <TouchableOpacity
                      key={index}
                      style={[styles.thumbItem, index === 0 && styles.thumbItemActive]}
                      onPress={() => {
                        setSelectedImageIndex(index);
                        setImageViewerVisible(true);
                      }}
                      activeOpacity={0.8}
                    >
                      <Image source={{ uri: imageUrl }} style={styles.thumbImage} resizeMode="cover" />
                    </TouchableOpacity>
                  );
                })}
              </ScrollView>
            );
          })()}


          <View style={styles.demandTitleArea}>
            <Text style={styles.demandTitle}>{demand.title}</Text>
            <View style={styles.badgesRow}>
              <View style={styles.categoryBadge}>
                <Text style={styles.categoryText}>{demand.category}</Text>
              </View>
              <View style={[styles.categoryBadge, styles.budgetBadge]}>
                <Text style={[styles.categoryText, styles.budgetBadgeText]}>{demand.budget}</Text>
              </View>
              <View style={[styles.categoryBadge, styles.deadlineBadge]}>
                <Icon name="schedule" size={14} color="#c2410c" />
                <Text style={[styles.categoryText, styles.deadlineBadgeText]}>{demand.deadline}</Text>
              </View>
            </View>
          </View>


          <View style={styles.budgetStrip}>
            <View style={styles.budgetStripLeft}>
              <Icon name="location-on" size={20} color="#4f46e5" />
              <Text style={styles.budgetStripLabel}>Endereço</Text>
            </View>
            <Text style={styles.budgetStripValue} numberOfLines={2}>{demand.location}</Text>
          </View>


          <View style={styles.sectionBlock}>
            <Text style={styles.sectionLabel}>Descrição do Serviço</Text>
            <Text style={styles.sectionText}>{demand.description}</Text>
          </View>


          <View style={styles.clientRow}>
            <View style={styles.clientInfo}>
              <Icon name="person" size={18} color="#6b7280" />
              <Text style={styles.clientLabel}>Cliente</Text>
            </View>
            <View style={styles.clientRating}>
              <Icon name="star" size={16} color="#fbbf24" />
              <Text style={styles.clientRatingText}>{demand.clientRating}</Text>
            </View>
          </View>


          {(() => {
            const docs = Array.isArray(demand.attachments)
              ? demand.attachments.filter((att: any) => !isImageAttachment(att))
              : [];
            if (docs.length === 0) return null;
            return (
              <View style={styles.docsSection}>
                <Text style={styles.sectionLabel}>Documentos Anexados</Text>
                {docs.map((doc: any, index: number) => (
                  <View key={index} style={styles.docItem}>
                    <Icon name="description" size={18} color="#4f46e5" />
                    <Text style={styles.docName} numberOfLines={1}>{doc.original_name || doc.filename || 'Documento'}</Text>
                  </View>
                ))}
              </View>
            );
          })()}
        </View>


        {(() => {
          if (!demand.proposals || demand.proposals.length === 0) return null;

          const prices = demand.proposals.map((p: Proposal) => {
            const priceStr = p.price?.toString()
              .replace('R$ ', '')
              .replace(/\./g, '')
              .replace(',', '.');
            return parseFloat(priceStr) || 0;
          });
          const avgPrice = prices.reduce((a, b) => a + b, 0) / prices.length;

          const deadlines = demand.proposals.map((p: Proposal) => {
            const deadlineStr = p.deadline?.toString().replace(/[^0-9]/g, '');
            return parseInt(deadlineStr) || 0;
          });
          const avgDeadline = Math.round(deadlines.reduce((a, b) => a + b, 0) / deadlines.length);

          return (
            <View style={styles.insightsCard}>
              <View style={styles.insightsHeader}>
                <Icon name="lightbulb" size={20} color="#d97706" />
                <Text style={styles.insightsTitle}>
                  Insights para sua Proposta
                </Text>
              </View>
              <View style={styles.insightItem}>
                <View style={styles.insightBullet}>
                  <Icon name="trending-up" size={16} color="#d97706" />
                </View>
                <Text style={styles.insightText}>
                  Preço médio das propostas: R$ {avgPrice.toLocaleString('pt-BR', { minimumFractionDigits: 2, maximumFractionDigits: 2 })}
                </Text>
              </View>
              <View style={styles.insightItem}>
                <View style={styles.insightBullet}>
                  <Icon name="schedule" size={16} color="#d97706" />
                </View>
                <Text style={styles.insightText}>
                  Prazo médio de execução: {avgDeadline} dias
                </Text>
              </View>
              <View style={styles.insightItem}>
                <View style={styles.insightBullet}>
                  <Icon name="people" size={16} color="#d97706" />
                </View>
                <Text style={styles.insightText}>
                  {demand.proposals.length} {demand.proposals.length === 1 ? 'prestador interessado' : 'prestadores interessados'}
                </Text>
              </View>
            </View>
          );
        })()}


        {demand.proposals && demand.proposals.length > 0 && (
          <View style={styles.rankingSection}>
            <View style={styles.rankingSectionHeader}>
              <Icon name="leaderboard" size={22} color="#4f46e5" />
              <Text style={styles.rankingSectionTitle}>Ranking das Propostas</Text>
              <View style={styles.rankingCount}>
                <Text style={styles.rankingCountText}>{demand.proposals.length}</Text>
              </View>
            </View>

            {demand.proposals.map((proposal: Proposal, index: number) => {
              const isMyProposal = proposal.provider_id === user?.id;
              const isWinningProposal = isWinning(proposal, index);
              const isFirst = index === 0;
              const isSecond = index === 1;
              const isThird = index === 2;

              return (
                <View
                  key={proposal.id}
                  style={[
                    styles.rankingCard,
                    isMyProposal && styles.rankingCardMine,
                  ]}
                >

                  <View style={styles.rankingCardTop}>
                    <View style={[
                      styles.positionCircle,
                      isFirst && styles.positionGold,
                      isSecond && styles.positionSilver,
                      isThird && styles.positionBronze,
                    ]}>
                      {isFirst ? <Icon name="emoji-events" size={20} color="#d97706" />
                        : isSecond ? <Icon name="emoji-events" size={20} color="#6b7280" />
                        : isThird ? <Icon name="emoji-events" size={20} color="#ea580c" />
                        : <Text style={styles.positionText}>#{index + 1}</Text>}
                    </View>
                    <View style={styles.rankingNameArea}>
                      <View style={styles.rankingNameRow}>
                        <Text style={styles.rankingProviderName} numberOfLines={1}>{proposal.providerName}</Text>
                        {isMyProposal && (
                          <View style={styles.youTag}>
                            <Text style={styles.youTagText}>VOCÊ</Text>
                          </View>
                        )}
                      </View>
                      {proposal.created_at && (
                        <Text style={styles.proposalDate}>
                          {new Date(proposal.created_at).toLocaleDateString('pt-BR', { day: '2-digit', month: 'short', year: 'numeric' })}
                        </Text>
                      )}
                    </View>
                    <View style={[
                      styles.statusPill,
                      proposal.status === 'accepted' && styles.statusPillAccepted,
                      proposal.status === 'rejected' && styles.statusPillRejected,
                    ]}>
                      <Icon
                        name={proposal.status === 'accepted' ? 'check-circle' : proposal.status === 'rejected' ? 'cancel' : 'hourglass-empty'}
                        size={13}
                        color={proposal.status === 'accepted' ? '#059669' : proposal.status === 'rejected' ? '#dc2626' : '#6b7280'}
                      />
                      <Text style={[
                        styles.statusPillText,
                        proposal.status === 'accepted' && styles.statusTextAccepted,
                        proposal.status === 'rejected' && styles.statusTextRejected,
                      ]}>
                        {proposal.status === 'accepted' ? 'Aceita' : proposal.status === 'rejected' ? 'Recusada' : 'Pendente'}
                      </Text>
                    </View>
                  </View>


                  <View style={styles.rankingBottomRow}>
                    <Text style={styles.rankingPriceValue}>{proposal.price}</Text>
                    <View style={styles.rankingDeadlineBox}>
                      <Icon name="schedule" size={14} color="#6b7280" />
                      <Text style={styles.rankingDeadlineValue}>{proposal.deadline}</Text>
                    </View>
                  </View>


                  <View style={styles.rankingBottomRow}>
                    {isWinningProposal && (
                      <View style={styles.budgetOkPill}>
                        <Icon name="check" size={12} color="#059669" />
                        <Text style={styles.budgetOkText}>No orçamento</Text>
                      </View>
                    )}
                  </View>


                  {isMyProposal && (
                    <View style={[
                      styles.myStatusBar,
                      isFirst && styles.myStatusBarFirst
                    ]}>
                      <Icon
                        name={isFirst ? "verified" : "info-outline"}
                        size={16}
                        color={isFirst ? "#059669" : "#3b82f6"}
                      />
                      <Text style={[
                        styles.myStatusText,
                        isFirst && styles.myStatusTextFirst
                      ]}>
                        {isFirst
                          ? 'Parabéns! Você está em 1º lugar!'
                          : 'Ajuste sua proposta para subir no ranking'}
                      </Text>
                    </View>
                  )}
                </View>
              );
            })}
          </View>
        )}


        {!alreadyProposed && (
          <View style={styles.formCard}>
            <Text style={styles.formLabel}>Valor da Proposta</Text>
            <TextInput
              style={styles.formInput}
              placeholder="R$ 0,00"
              value={priceDisplay}
              onChangeText={handlePriceChange}
              keyboardType="numeric"
            />

            <Text style={styles.formLabel}>Prazo de Execução (dias)</Text>
            <TextInput
              style={styles.formInput}
              placeholder="Ex: 12"
              value={deadline}
              onChangeText={handleDeadlineChange}
              keyboardType="numeric"
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
                <View style={{ flexDirection: 'row', alignItems: 'center', justifyContent: 'center', gap: 8 }}>
                  <Send size={18} color="#fff" />
                  <Text style={styles.submitButtonText}>Enviar Proposta</Text>
                </View>
              )}
            </TouchableOpacity>
          </View>
        )}


        {alreadyProposed && myProposal && (
          <View style={styles.formCard}>
            <View style={styles.updateProposalHeader}>
              <Text style={styles.updateProposalTitle}>
                <Pencil size={16} color="#4f46e5" /> Atualizar Sua Proposta
              </Text>
              <Text style={styles.updateProposalSubtitle}>
                Você já enviou uma proposta. Pode atualizar os valores para melhorar sua posição no ranking.
              </Text>
            </View>

            <Text style={styles.formLabel}>Novo Valor da Proposta</Text>
            <TextInput
              style={styles.formInput}
              placeholder="R$ 0,00"
              value={priceDisplay}
              onChangeText={handlePriceChange}
              keyboardType="numeric"
            />

            <Text style={styles.formLabel}>Novo Prazo de Execução (dias)</Text>
            <TextInput
              style={styles.formInput}
              placeholder="Ex: 12"
              value={deadline}
              onChangeText={handleDeadlineChange}
              keyboardType="numeric"
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
                <View style={{ flexDirection: 'row', alignItems: 'center', justifyContent: 'center', gap: 8 }}>
                  <RefreshCw size={18} color="#fff" />
                  <Text style={styles.updateButtonText}>Atualizar Proposta</Text>
                </View>
              )}
            </TouchableOpacity>
          </View>
        )}


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
        forceLight
      />


      {Array.isArray(demand?.attachments) && (
        <ImageViewer
          visible={imageViewerVisible}
          images={demand.attachments
            .filter(isImageAttachment)
            .map((att: any) => getAttachmentUrl(att))}
          initialIndex={selectedImageIndex}
          onClose={() => setImageViewerVisible(false)}
        />
      )}
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#f3f4f6',
  },
  headerBackground: {
    position: 'absolute',
    top: '-50%',
    left: 0,
    right: 0,
    height: '100%',
    backgroundColor: '#4f46e5',
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
  header: {
    paddingHorizontal: 24,
    paddingBottom: 28,
    backgroundColor: '#4f46e5',
  },
  headerTop: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 10,
  },
  backButtonHeader: {
    padding: 2,
  },
  title: {
    fontSize: 22,
    fontWeight: 'bold',
    color: '#ffffff',
    flex: 1,
  },
  content: {
    backgroundColor: '#f3f4f6',
    borderTopLeftRadius: 24,
    borderTopRightRadius: 24,
    padding: 20,
    paddingBottom: 32,
    minHeight: 500,
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
  demandCard: {
    backgroundColor: '#ffffff',
    borderRadius: 16,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.08,
    shadowRadius: 6,
    elevation: 4,
    marginBottom: 24,
    overflow: 'hidden',
  },
  heroImageContainer: {
    width: '100%',
    height: 200,
    position: 'relative',
  },
  heroImage: {
    width: '100%',
    height: '100%',
  },
  heroImageCount: {
    position: 'absolute',
    top: 12,
    right: 12,
    backgroundColor: 'rgba(0,0,0,0.6)',
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: 8,
    paddingVertical: 4,
    borderRadius: 12,
    gap: 4,
  },
  heroImageCountText: {
    color: '#fff',
    fontSize: 12,
    fontWeight: '700',
  },
  heroZoomHint: {
    position: 'absolute',
    bottom: 12,
    right: 12,
    backgroundColor: 'rgba(0,0,0,0.5)',
    borderRadius: 20,
    padding: 6,
  },
  thumbRow: {
    flexDirection: 'row',
    paddingHorizontal: 16,
    paddingTop: 10,
    paddingBottom: 6,
    gap: 8,
  },
  thumbItem: {
    width: 56,
    height: 56,
    borderRadius: 10,
    overflow: 'hidden',
    borderWidth: 2,
    borderColor: 'transparent',
  },
  thumbItemActive: {
    borderColor: '#4f46e5',
  },
  thumbImage: {
    width: '100%',
    height: '100%',
  },
  demandTitleArea: {
    paddingHorizontal: 18,
    paddingTop: 16,
  },
  demandTitle: {
    fontSize: 20,
    fontWeight: '700',
    color: '#111827',
    marginBottom: 8,
    lineHeight: 26,
  },
  badgesRow: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: 8,
    marginBottom: 14,
  },
  categoryBadge: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#e0e7ff',
    paddingHorizontal: 10,
    paddingVertical: 4,
    borderRadius: 10,
    gap: 4,
  },
  categoryText: {
    color: '#4f46e5',
    fontSize: 12,
    fontWeight: '600',
  },
  budgetBadge: {
    backgroundColor: '#f0fdf4',
    borderWidth: 1,
    borderColor: '#bbf7d0',
  },
  budgetBadgeText: {
    color: '#059669',
  },
  deadlineBadge: {
    backgroundColor: '#fff7ed',
    borderWidth: 1,
    borderColor: '#fed7aa',
  },
  deadlineBadgeText: {
    color: '#c2410c',
  },
  budgetStrip: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginHorizontal: 18,
    backgroundColor: '#eff6ff',
    borderRadius: 10,
    paddingHorizontal: 14,
    paddingVertical: 12,
    marginBottom: 16,
    borderWidth: 1,
    borderColor: '#bfdbfe',
  },
  budgetStripLeft: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
  },
  budgetStripLabel: {
    fontSize: 14,
    fontWeight: '600',
    color: '#1e40af',
  },
  budgetStripValue: {
    flex: 1,
    fontSize: 14,
    fontWeight: '600',
    color: '#3b82f6',
    textAlign: 'right',
    marginLeft: 8,
  },
  sectionBlock: {
    paddingHorizontal: 18,
    marginBottom: 16,
  },
  sectionLabel: {
    fontSize: 12,
    fontWeight: '700',
    color: '#6b7280',
    textTransform: 'uppercase',
    letterSpacing: 0.5,
    marginBottom: 6,
  },
  sectionText: {
    fontSize: 14,
    color: '#374151',
    lineHeight: 21,
  },
  infoGrid: {
    flexDirection: 'row',
    marginHorizontal: 18,
    backgroundColor: '#f9fafb',
    borderRadius: 12,
    marginBottom: 14,
    overflow: 'hidden',
  },
  infoGridItem: {
    flex: 1,
    alignItems: 'center',
    paddingVertical: 14,
    paddingHorizontal: 8,
  },
  infoGridDivider: {
    width: 1,
    backgroundColor: '#e5e7eb',
    marginVertical: 10,
  },
  infoGridLabel: {
    fontSize: 11,
    fontWeight: '600',
    color: '#6b7280',
    textTransform: 'uppercase',
    marginTop: 6,
    marginBottom: 2,
  },
  infoGridValue: {
    fontSize: 14,
    fontWeight: '600',
    color: '#111827',
    textAlign: 'center',
  },
  clientRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginHorizontal: 18,
    paddingTop: 12,
    paddingBottom: 16,
    borderTopWidth: 1,
    borderTopColor: '#f3f4f6',
  },
  clientInfo: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
  },
  clientLabel: {
    fontSize: 14,
    fontWeight: '500',
    color: '#6b7280',
  },
  clientRating: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 4,
  },
  clientRatingText: {
    fontSize: 14,
    fontWeight: '700',
    color: '#111827',
  },
  docsSection: {
    paddingHorizontal: 18,
    paddingBottom: 16,
  },
  docItem: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#f3f4f6',
    paddingHorizontal: 12,
    paddingVertical: 10,
    borderRadius: 8,
    marginTop: 8,
    gap: 8,
  },
  docName: {
    fontSize: 13,
    color: '#374151',
    fontWeight: '500',
    flex: 1,
  },
  insightsCard: {
    backgroundColor: '#fefce8',
    borderRadius: 12,
    padding: 20,
    marginBottom: 24,
    borderWidth: 1,
    borderColor: '#fef3c7',
  },
  insightsHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: 16,
    gap: 8,
  },
  insightsTitle: {
    fontSize: 16,
    fontWeight: '600',
    color: '#92400e',
  },
  insightItem: {
    flexDirection: 'row',
    alignItems: 'flex-start',
    marginBottom: 10,
  },
  insightBullet: {
    marginRight: 8,
    marginTop: 2,
  },
  insightText: {
    color: '#78350f',
    flex: 1,
    fontSize: 14,
    lineHeight: 20,
  },
  rankingSection: {
    marginBottom: 24,
  },
  rankingSectionHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: 14,
    gap: 10,
  },
  rankingSectionTitle: {
    fontSize: 18,
    fontWeight: '700',
    color: '#111827',
    flex: 1,
  },
  rankingCount: {
    backgroundColor: '#4f46e5',
    borderRadius: 14,
    paddingHorizontal: 10,
    paddingVertical: 4,
    minWidth: 30,
    alignItems: 'center',
  },
  rankingCountText: {
    fontSize: 13,
    fontWeight: '700',
    color: '#ffffff',
  },
  rankingCard: {
    backgroundColor: '#ffffff',
    borderRadius: 14,
    padding: 16,
    marginBottom: 12,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 1 },
    shadowOpacity: 0.06,
    shadowRadius: 4,
    elevation: 2,
    borderWidth: 1,
    borderColor: '#f3f4f6',
  },
  rankingCardMine: {
    borderColor: '#93c5fd',
    borderWidth: 1.5,
    backgroundColor: '#f8faff',
  },
  rankingCardTop: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: 12,
  },
  positionCircle: {
    width: 40,
    height: 40,
    borderRadius: 20,
    backgroundColor: '#f3f4f6',
    alignItems: 'center',
    justifyContent: 'center',
    marginRight: 10,
  },
  positionGold: {
    backgroundColor: '#fef3c7',
    borderWidth: 2,
    borderColor: '#fbbf24',
  },
  positionSilver: {
    backgroundColor: '#f3f4f6',
    borderWidth: 2,
    borderColor: '#9ca3af',
  },
  positionBronze: {
    backgroundColor: '#ffedd5',
    borderWidth: 2,
    borderColor: '#fb923c',
  },
  positionText: {
    fontSize: 15,
    fontWeight: '700',
    color: '#6b7280',
  },
  rankingNameArea: {
    flex: 1,
    justifyContent: 'center',
  },
  rankingNameRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
  },
  rankingProviderName: {
    fontSize: 15,
    fontWeight: '600',
    color: '#111827',
    flexShrink: 1,
  },
  proposalDate: {
    fontSize: 12,
    color: '#9ca3af',
    marginTop: 2,
  },
  statusPill: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#f3f4f6',
    paddingHorizontal: 8,
    paddingVertical: 4,
    borderRadius: 10,
    gap: 4,
    alignSelf: 'flex-start',
  },
  statusPillAccepted: {
    backgroundColor: '#d1fae5',
  },
  statusPillRejected: {
    backgroundColor: '#fee2e2',
  },
  statusPillText: {
    fontSize: 11,
    fontWeight: '600',
    color: '#6b7280',
  },
  statusTextAccepted: {
    color: '#059669',
  },
  statusTextRejected: {
    color: '#dc2626',
  },
  youTag: {
    backgroundColor: '#3b82f6',
    paddingHorizontal: 8,
    paddingVertical: 3,
    borderRadius: 10,
  },
  youTagText: {
    color: '#ffffff',
    fontSize: 10,
    fontWeight: '700',
    letterSpacing: 0.5,
  },
  rankingPriceValue: {
    fontSize: 18,
    fontWeight: '700',
    color: '#059669',
    marginBottom: 8,
  },
  rankingBottomRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    gap: 10,
    marginBottom: 8,
  },
  rankingDeadlineBox: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    backgroundColor: '#f9fafb',
    paddingVertical: 6,
    borderRadius: 8,
    gap: 4,
  },
  rankingDeadlineValue: {
    fontSize: 13,
    fontWeight: '600',
    color: '#6b7280',
    marginTop: -2
  },
  budgetOkPill: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#d1fae5',
    paddingHorizontal: 8,
    paddingVertical: 4,
    borderRadius: 8,
    gap: 4,
  },
  budgetOkText: {
    fontSize: 11,
    fontWeight: '600',
    color: '#059669',
  },
  rankingDescription: {
    fontSize: 13,
    color: '#6b7280',
    lineHeight: 18,
    marginBottom: 4,
  },
  myStatusBar: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#eff6ff',
    paddingHorizontal: 10,
    paddingVertical: 8,
    borderRadius: 8,
    gap: 6,
    marginTop: 8,
  },
  myStatusBarFirst: {
    backgroundColor: '#ecfdf5',
  },
  myStatusText: {
    fontSize: 12,
    fontWeight: '600',
    color: '#3b82f6',
    flex: 1,
  },
  myStatusTextFirst: {
    color: '#059669',
  },
  flex1: {
    flex: 1,
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