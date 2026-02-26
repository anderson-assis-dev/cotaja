import React, { useState, useEffect, useCallback } from 'react';
import { View, Text, ScrollView, TouchableOpacity, Modal, Alert, Image, ActivityIndicator, StyleSheet, Platform } from 'react-native';
import { useNavigation, useRoute, useFocusEffect } from '@react-navigation/native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import Icon from 'react-native-vector-icons/MaterialIcons';
import { Trophy, Hourglass, MessageSquare, ChevronRight, XCircle } from 'lucide-react-native';
import Config from 'react-native-config';
import { useAuth } from '../../contexts/AuthContext';
import { orderService, Order as ApiOrder, Proposal as ApiProposal } from '../../services/api';
import { useStatusBarOverlay } from '../../hooks/useStatusBarOverlay';
import { StatusBarOverlay } from '../../components/StatusBarOverlay';
import { formatPrice } from '../../utils/formatters';
import { useToast } from '../../contexts/ToastContext';
import { ImageViewer } from '../../components/ImageViewer';
import { FileViewer } from '../../components/FileViewer';
import { getAttachmentUrl, isImageAttachment, isVideoAttachment, isDocumentAttachment } from '../../utils/attachmentHelpers';

// Tipos TypeScript
interface Proposal {
  id: string;
  provider: {
    name: string;
    rating: number;
    avatar: any;
    avatarUri?: string | null;
  };
  price: string;
  deadline: string;
  description: string;
  ranking: number;
}

interface Attachment {
  filename: string;
  path?: string;
  data?: string;
  mime_type: string;
  size: number;
  type: string;
  original_name: string;
  uploaded_at: string;
}

interface Order {
  id: string;
  title: string;
  category: string;
  budget: string;
  deadline: string;
  status: string;
  description: string;
  location: string;
  clientRating: number;
  proposals: Proposal[];
  insights: string[];
  clientId: string;
  hasActiveAuction: boolean;
  isNewDemand: boolean;
  attachments?: Attachment[];
}

// Função para converter dados da API para o formato da interface
const convertApiOrderToOrder = (apiOrder: ApiOrder): Order => {
  // Converter propostas da API para o formato da interface
  const proposals: Proposal[] = apiOrder.proposals?.map((proposal: ApiProposal, index: number) => {
    const avatarUri = proposal.provider_avatar_base64 || proposal.provider?.avatar_base64 || null;
    console.log(`[OrderDetails] Proposal ${proposal.id} - provider_name: ${proposal.provider_name}, has provider obj: ${!!proposal.provider}, provider_avatar_base64: ${avatarUri ? avatarUri.substring(0, 50) + '...' : 'null'}`);
    return {
    id: proposal.id.toString(),
    provider: {
      name: proposal.provider?.name || proposal.provider_name || 'Prestador',
      rating: 4.5, // Valor padrão, ajustar conforme necessário
      avatar: avatarUri ? { uri: avatarUri } : null,
      avatarUri: avatarUri,
    },
    price: `R$ ${formatPrice(proposal.price || 0)}`,
    deadline: `${proposal.deadline || 0} dias`,
    description: proposal.description || 'Sem descrição',
    ranking: index + 1,
  };
  }) || [];

  // Determinar se tem leilão ativo
  const hasActiveAuction = !!(apiOrder.auction_started_at && apiOrder.auction_ends_at &&
    new Date() >= new Date(apiOrder.auction_started_at) &&
    new Date() <= new Date(apiOrder.auction_ends_at));

  // Determinar se é nova demanda (pedido recente sem propostas)
  const isNewDemand = apiOrder.status === 'open' && proposals.length === 0;

  // Converter status da API para português
  const getStatusInPortuguese = (status: string): string => {
    switch (status) {
      case 'open': return 'Aguardando propostas';
      case 'in_progress': return 'Em andamento';
      case 'completed': return 'Concluído';
      case 'cancelled': return 'Cancelado';
      case 'stopped': return 'Pausado';
      default: return 'Aguardando propostas';
    }
  };

  // Gerar insights baseados nos dados
  const generateInsights = (apiOrder: ApiOrder, proposals: Proposal[]): string[] => {
    const insights: string[] = [];

    if (proposals.length > 0) {
      const avgPrice = proposals.reduce((sum, p) => sum + parseFloat(p.price.replace('R$ ', '').replace(',', '.')), 0) / proposals.length;
      insights.push(`O orçamento médio da categoria é R$ ${formatPrice(avgPrice)}`);

      const avgDeadline = proposals.reduce((sum, p) => sum + parseInt(p.deadline), 0) / proposals.length;
      insights.push(`Prazo médio de execução: ${avgDeadline} dias`);
    } else {
      insights.push('Nenhuma proposta recebida ainda');
      insights.push('Seu pedido está sendo divulgado para prestadores');
    }

    return insights;
  };

  // Tratar budget - pode vir como string ou number
  const budgetValue = typeof apiOrder.budget === 'string'
    ? parseFloat(apiOrder.budget)
    : (apiOrder.budget || 0);

  // Tratar deadline - pode vir como string ou number
  const deadlineValue = typeof apiOrder.deadline === 'string'
    ? parseInt(apiOrder.deadline)
    : (apiOrder.deadline || 0);

  // Processar anexos
  let attachments: Attachment[] = [];
  if (apiOrder.attachments) {
    try {
      console.log('📎 Processando anexos para pedido:', apiOrder.id);
      console.log('📎 Tipo de attachments:', typeof apiOrder.attachments);
      console.log('📎 Valor de attachments:', apiOrder.attachments);

      // Se attachments for string JSON, parsear
      const attachmentsData = typeof apiOrder.attachments === 'string'
        ? JSON.parse(apiOrder.attachments)
        : apiOrder.attachments;

      console.log('📎 Dados parseados:', attachmentsData);
      console.log('📎 É array?', Array.isArray(attachmentsData));

      if (Array.isArray(attachmentsData)) {
        attachments = attachmentsData;
        console.log('✅ Anexos processados:', attachments.length);
      }
    } catch (error) {
      console.error('❌ Erro ao parsear anexos:', error);
    }
  } else {
    console.log('⚠️ apiOrder.attachments é null/undefined para pedido:', apiOrder.id);
  }

  const convertedOrder = {
    id: apiOrder.id.toString(),
    title: apiOrder.title || 'Pedido sem título',
    category: apiOrder.category || 'Sem categoria',
    budget: `R$ ${formatPrice(budgetValue)}`,
    deadline: `${deadlineValue} dias`,
    status: getStatusInPortuguese(apiOrder.status || 'open'),
    description: apiOrder.description || 'Sem descrição',
    location: apiOrder.address || 'Local não informado',
    clientRating: 4.8, // Valor padrão, ajustar conforme necessário
    proposals,
    insights: generateInsights(apiOrder, proposals),
    clientId: apiOrder.client_id?.toString() || '0',
    hasActiveAuction,
    isNewDemand,
    attachments,
  };


  return convertedOrder;
};

export default function OrderDetailsScreen() {
  const navigation = useNavigation<any>();
  const route = useRoute();
  const insets = useSafeAreaInsets();
  const { user } = useAuth();
  const { showSuccess, showError } = useToast();
  const { showStatusBarOverlay, statusBarOpacity, handleScroll } = useStatusBarOverlay();

  const [orders, setOrders] = useState<Order[]>([]);
  const [selectedOrder, setSelectedOrder] = useState<Order | null>(null);
  const [showDetails, setShowDetails] = useState(false);
  const [refusedProposals, setRefusedProposals] = useState<{ [orderId: string]: string[] }>({});
  const [closedOrders, setClosedOrders] = useState<string[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  const [imageViewerVisible, setImageViewerVisible] = useState(false);
  const [selectedImageIndex, setSelectedImageIndex] = useState(0);
  const [avatarViewerVisible, setAvatarViewerVisible] = useState(false);
  const [avatarViewerImage, setAvatarViewerImage] = useState<string>('');
  const [fileViewerVisible, setFileViewerVisible] = useState(false);
  const [fileViewerUrl, setFileViewerUrl] = useState('');
  const [fileViewerTitle, setFileViewerTitle] = useState('');
  const [fileViewerMime, setFileViewerMime] = useState('');

  // Recebe parâmetros da navegação
  const profileType = (route.params as any)?.profileType || 'client';
  const clientId = user?.id?.toString() || (route.params as any)?.clientId || '1';
  const selectedCategory = (route.params as any)?.selectedCategory;
  const fromLeiloes = (route.params as any)?.fromLeiloes || false;

  // Buscar pedidos da API
  const fetchOrders = async () => {
    try {
      setLoading(true);
      setError(null);

      let params: any = {};

      // Se veio da tela de leilões, filtrar apenas pedidos em andamento
      if (fromLeiloes) {
        params.status = 'in_progress';
      }

      // Aplicar filtro por categoria se selecionada
      if (selectedCategory) {
        params.category = selectedCategory;
      }


      const response = await orderService.getOrders(params);

      if (response.success) {

        // Verificar se a estrutura está correta
        if (!response.data.data || !Array.isArray(response.data.data)) {
          setOrders([]);
          return;
        }

        const convertedOrders = response.data.data.map((apiOrder: any, index: number) => {


          try {
            return convertApiOrderToOrder(apiOrder);
          } catch (error) {
            console.error('❌ Erro ao converter pedido:', apiOrder.id, error);
            // Retornar um pedido padrão em caso de erro
            return {
              id: apiOrder.id?.toString() || '0',
              title: apiOrder.title || 'Pedido sem título',
              category: apiOrder.category || 'Sem categoria',
              budget: 'R$ 0,00',
              deadline: '0 dias',
              status: 'Aguardando propostas',
              description: apiOrder.description || 'Sem descrição',
              location: apiOrder.address || 'Local não informado',
              clientRating: 4.8,
              proposals: [],
              insights: ['Dados incompletos'],
              clientId: apiOrder.client_id?.toString() || '0',
              hasActiveAuction: false,
              isNewDemand: false,
              attachments: [],
            };
          }
        });

        setOrders(convertedOrders);
      } else {
        throw new Error('Erro ao carregar pedidos');
      }
    } catch (error: any) {
      setError(error.message || 'Erro ao carregar pedidos');
    } finally {
      setLoading(false);
    }
  };

  // Carregar pedidos quando o componente montar
  useEffect(() => {
    if (user?.id) {
      fetchOrders();
    } else {
      setLoading(false);
    }
  }, [fromLeiloes, selectedCategory, user?.id]);

  // Recarregar pedidos ao voltar para esta tela (ex: retorno do chat)
  useFocusEffect(
    useCallback(() => {
      if (user?.id && !loading) {
        fetchOrders();
      }
    }, [user?.id, fromLeiloes, selectedCategory])
  );

  // Filtra os pedidos conforme o tipo de usuário e categoria
  let filteredOrders = profileType === 'client'
    ? orders.filter(o => o.clientId === clientId)
    : orders;

  // Remove pedidos encerrados
  filteredOrders = filteredOrders.filter(
    (order) => !closedOrders.includes(order.id)
  );


  const handleOrderPress = (order: Order) => {
    setSelectedOrder(order);
    setShowDetails(true);
  };

  // Função para recusar proposta
  const handleRefuseProposal = (orderId: string, proposalId: string) => {
    Alert.alert(
      'Recusar Proposta',
      'Tem certeza que deseja recusar esta proposta? Essa ação não poderá ser desfeita.',
      [
        { text: 'Cancelar', style: 'cancel' },
        {
          text: 'Recusar', style: 'destructive',
          onPress: async () => {
            try {
              // Aqui você pode implementar a chamada da API para recusar proposta
              // await proposalService.rejectProposal(parseInt(proposalId));

              setRefusedProposals((prev) => ({
                ...prev,
                [orderId]: [...(prev[orderId] || []), proposalId],
              }));
            } catch (error: any) {
              Alert.alert('Erro', error.message || 'Erro ao recusar proposta');
            }
          }
        }
      ]
    );
  };

  // Função para cliente pausar/retomar pedido (otimista — UI atualiza instantaneamente)
  const handleToggleStopOrder = async (orderId: string) => {
    const isStopped = selectedOrder?.status === 'Pausado';
    const newStatus = isStopped ? 'Aguardando propostas' : 'Pausado';

    // Atualização otimista — muda o UI imediatamente
    if (selectedOrder && selectedOrder.id === orderId) {
      setSelectedOrder({ ...selectedOrder, status: newStatus });
    }
    setOrders(prev => prev.map(o => o.id === orderId ? { ...o, status: newStatus } : o));
    showSuccess(isStopped ? 'Pedido ativado!' : 'Pedido pausado!');

    // Dispara API em background
    orderService.toggleStopOrder(parseInt(orderId)).then(response => {
      if (!response.success) {
        // Reverter em caso de erro
        const revertStatus = isStopped ? 'Pausado' : 'Aguardando propostas';
        setSelectedOrder(prev => prev && prev.id === orderId ? { ...prev, status: revertStatus } : prev);
        setOrders(prev => prev.map(o => o.id === orderId ? { ...o, status: revertStatus } : o));
        showError(response.message || 'Erro ao alterar status do pedido');
      }
    }).catch((error: any) => {
      // Reverter em caso de erro
      const revertStatus = isStopped ? 'Pausado' : 'Aguardando propostas';
      setSelectedOrder(prev => prev && prev.id === orderId ? { ...prev, status: revertStatus } : prev);
      setOrders(prev => prev.map(o => o.id === orderId ? { ...o, status: revertStatus } : o));
      showError(error.message || 'Erro ao alterar status do pedido');
    });
  };

  // Função para excluir pedido
  const handleDeleteOrder = (orderId: string) => {
    Alert.alert(
      'Excluir Pedido',
      'Tem certeza que deseja excluir este pedido? Esta ação não pode ser desfeita.',
      [
        { text: 'Cancelar', style: 'cancel' },
        {
          text: 'Excluir', style: 'destructive',
          onPress: async () => {
            try {
              const response = await orderService.deleteOrder(parseInt(orderId));

              if (response.success) {
                setShowDetails(false);
                setSelectedOrder(null);
                showSuccess('Pedido excluído com sucesso');
                setClosedOrders((prev) => [...prev, orderId]);
                fetchOrders();
              } else {
                showError(response.message || 'Erro ao excluir pedido');
              }
            } catch (error: any) {
              showError(error.message || 'Erro ao excluir pedido');
            }
          }
        }
      ]
    );
  };

  const getRankingStyle = (ranking: number) => {
    switch (ranking) {
      case 1: return styles.rankingFirst;
      case 2: return styles.rankingSecond;
      case 3: return styles.rankingThird;
      default: return styles.rankingDefault;
    }
  };

  const getRankingIconColor = (ranking: number): string => {
    switch (ranking) {
      case 1: return '#d97706';
      case 2: return '#6b7280';
      case 3: return '#ea580c';
      default: return '#9ca3af';
    }
  };

  const getStatusStyle = (status: string) => {
    switch (status) {
      case 'Em andamento': return styles.statusInProgress;
      case 'Concluído': return styles.statusCompleted;
      case 'Cancelado': return styles.statusCancelled;
      case 'Pausado': return styles.statusStopped;
      default: return styles.statusDefault;
    }
  };

  const getPageTitle = () => {
    if (fromLeiloes) {
      return 'Leilões em Andamento';
    }
    return 'Meus Pedidos';
  };

  const getPageSubtitle = () => {
    if (fromLeiloes) {
      return 'Pedidos com status em andamento';
    }
    return 'Acompanhe seus pedidos e propostas recebidas';
  };

  // Loading state
  if (loading) {
    return (
      <View style={[styles.loadingContainer, { paddingTop: insets.top }]}>
        <ActivityIndicator size="large" color="#4f46e5" />
        <Text style={styles.loadingText}>Carregando pedidos...</Text>
      </View>
    );
  }

  // Usuário não autenticado
  if (!user?.id) {
    return (
      <View style={[styles.errorContainer, { paddingTop: insets.top }]}>
        <Icon name="person-off" size={64} color="#9ca3af" />
        <Text style={styles.errorTitle}>
          Usuário não autenticado
        </Text>
        <Text style={styles.errorMessage}>
          Faça login para ver seus pedidos
        </Text>
      </View>
    );
  }

  // Error state
  if (error) {
    return (
      <View style={[styles.errorContainer, { paddingTop: insets.top }]}>
        <Icon name="error" size={64} color="#ef4444" />
        <Text style={styles.errorTitle}>
          Erro ao carregar pedidos
        </Text>
        <Text style={styles.errorMessage}>
          {error}
        </Text>
        <TouchableOpacity
          style={styles.retryButton}
          onPress={fetchOrders}
        >
          <Text style={styles.retryButtonText}>
            Tentar Novamente
          </Text>
        </TouchableOpacity>
      </View>
    );
  }

  return (
    <View style={styles.container}>
      <ScrollView
        style={styles.scrollView}
        onScroll={handleScroll}
        scrollEventThrottle={16}
      >
        <View style={[styles.content, { paddingTop: insets.top + 60, marginTop: -60 }]}>
          <Text style={styles.pageTitle}>{getPageTitle()}</Text>
          <Text style={styles.pageSubtitle}>
            {getPageSubtitle()}
          </Text>

          {filteredOrders.map((order) => {
            return (
              <TouchableOpacity
                key={order.id}
                style={styles.orderCard}
                onPress={() => handleOrderPress(order)}
              >
                <View style={styles.orderHeader}>
                  <Text style={styles.orderTitle}>
                    {order.title}
                  </Text>
                  <View style={styles.statusContainer}>
                    {/* Ícone de leilão ativo */}
                    {order.hasActiveAuction && (
                      <View style={styles.auctionIcon}>
                        <Icon name="gavel" size={16} color="#f97316" />
                      </View>
                    )}
                    {/* Ícone de nova demanda */}
                    {order.isNewDemand && (
                      <View style={styles.newDemandIcon}>
                        <Icon name="new-releases" size={16} color="#22c55e" />
                      </View>
                    )}
                    <View style={getStatusStyle(order.status)}>
                      <Text style={styles.statusText}>{order.status}</Text>
                    </View>
                    <View style={styles.categoryBadge}>
                      <Text style={styles.categoryText}>{order.category}</Text>
                    </View>
                  </View>
                </View>

                <View style={styles.categoryRow}>
                  <Text style={styles.budgetText}>
                    Orçamento: {order.budget || 'Não informado'}
                  </Text>
                </View>

                <View style={styles.locationRow}>
                  <Icon name="location-on" size={16} color="#6b7280" />
                  <Text style={styles.locationText}>{order.location}</Text>
                </View>

                {/* Status das propostas */}
                <View style={styles.proposalStatusContainer}>
                  {order.proposals.length > 0 ? (
                    <>
                      <Text style={styles.proposalStatusTitle}>
                        {order.proposals.length} {order.proposals.length === 1 ? 'proposta recebida' : 'propostas recebidas'}
                      </Text>
                      <Text style={styles.proposalStatusDescription}>
                        Clique para ver detalhes e gerenciar propostas
                      </Text>
                    </>
                  ) : (
                    <>
                      <Text style={styles.waitingTitle}>
                        <Hourglass size={16} color="#92400e" /> Aguardando propostas...
                      </Text>
                      <Text style={styles.waitingDescription}>
                        Nenhuma proposta ainda. Seu pedido está sendo divulgado.
                      </Text>
                    </>
                  )}
                </View>

                <View style={styles.orderFooter}>
                  <Text style={styles.deadlineText}>
                    Prazo: {order.deadline || 'Não informado'}
                  </Text>
                  <View style={styles.viewDetailsContainer}>
                    <Icon name="visibility" size={20} color="#4f46e5" />
                    <Text style={styles.viewDetailsText}>
                      Ver Detalhes
                    </Text>
                  </View>
                </View>
              </TouchableOpacity>
            );
          })}

          {filteredOrders.length === 0 && (
            <View style={styles.emptyState}>
              <Icon name="assignment" size={64} color="#9ca3af" />
              <Text style={styles.emptyStateTitle}>
                Nenhum pedido encontrado
              </Text>
              <Text style={styles.emptyStateMessage}>
                {selectedCategory
                  ? `Não há pedidos na categoria "${selectedCategory}" no momento.`
                  : fromLeiloes
                    ? 'Não há leilões em andamento no momento.'
                    : 'Você ainda não possui pedidos. Crie seu primeiro pedido!'
                }
              </Text>
            </View>
          )}

          <TouchableOpacity
            style={styles.backButton}
            onPress={() => navigation.goBack()}
          >
            <Text style={styles.backButtonText}>
              Voltar
            </Text>
          </TouchableOpacity>
        </View>
      </ScrollView>

      <StatusBarOverlay
        show={showStatusBarOverlay}
        opacity={statusBarOpacity}
        backgroundColor="#4f46e5"
      />

      {/* Modal de Detalhes */}
      <Modal
        visible={showDetails}
        animationType="slide"
        presentationStyle="pageSheet"
      >
        <View style={styles.modalContainer}>
          <View style={styles.modalHeader}>
            <Text style={styles.modalTitle}>Detalhes do Pedido</Text>
            <TouchableOpacity onPress={() => setShowDetails(false)}>
              <Icon name="close" size={24} color="#6b7280" />
            </TouchableOpacity>
          </View>

          {selectedOrder && (
            <ScrollView
              style={styles.modalContent}
              contentContainerStyle={styles.scrollContent}
            >
              {/* Informações do Pedido */}
              <View style={styles.orderInfoCard}>
                <View style={styles.orderInfoHeader}>
                  <Text style={styles.orderInfoTitle}>{selectedOrder.title}</Text>
                  <View style={styles.orderInfoIcons}>
                    {selectedOrder.hasActiveAuction && (
                      <View style={styles.modalAuctionIcon}>
                        <Icon name="gavel" size={20} color="#f97316" />
                      </View>
                    )}
                    {selectedOrder.isNewDemand && (
                      <View style={styles.modalNewDemandIcon}>
                        <Icon name="new-releases" size={20} color="#22c55e" />
                      </View>
                    )}
                  </View>
                </View>
                <View style={styles.orderInfoDetails}>
                  <View style={styles.modalCategoryBadge}>
                    <Text style={styles.modalCategoryText}>{selectedOrder.category}</Text>
                  </View>
                  <Text style={styles.modalBudgetText}>
                    Orçamento: {selectedOrder.budget}
                  </Text>
                </View>
                <Text style={styles.orderDescription}>{selectedOrder.description}</Text>

                <View style={styles.orderDetailRow}>
                  <Icon name="schedule" size={16} color="#6b7280" />
                  <Text style={styles.orderDetailText}>Prazo: {selectedOrder.deadline}</Text>
                </View>

                <View style={styles.orderInfoFooter}>
                  <Icon name="location-on" size={16} color="#6b7280" />
                  <Text style={styles.modalLocationText}>{selectedOrder.location}</Text>
                </View>

                {/* Botões de Ação do Pedido */}
                <View style={styles.orderActionsContainer}>
                  <TouchableOpacity
                    style={[
                      styles.editOrderButton,
                      (selectedOrder.proposals && selectedOrder.proposals.length > 0) && styles.editOrderButtonDisabled
                    ]}
                    onPress={() => {
                      if (selectedOrder.proposals && selectedOrder.proposals.length > 0) {
                        showError('Não é possível editar pedidos que já receberam propostas');
                        return;
                      }
                      setShowDetails(false);
                      navigation.navigate('CreateOrder', {
                        editMode: true,
                        orderId: selectedOrder.id,
                        orderData: selectedOrder
                      });
                    }}
                  >
                    <Icon
                      name="edit"
                      size={20}
                      color={(selectedOrder.proposals && selectedOrder.proposals.length > 0) ? "#9ca3af" : "#4f46e5"}
                    />
                    <Text style={[
                      styles.editOrderButtonText,
                      (selectedOrder.proposals && selectedOrder.proposals.length > 0) && styles.editOrderButtonTextDisabled
                    ]}>Editar</Text>
                  </TouchableOpacity>

                  <TouchableOpacity
                    style={styles.deleteOrderButton}
                    onPress={() => handleDeleteOrder(selectedOrder.id)}
                  >
                    <Icon name="delete" size={20} color="#ef4444" />
                    <Text style={styles.deleteOrderButtonText}>Excluir</Text>
                  </TouchableOpacity>
                </View>
              </View>

              {/* Anexos do Pedido */}
              <View style={styles.attachmentsSection}>
                <Text style={styles.attachmentsSectionTitle}>
                  <Icon name="attach-file" size={20} color="#4f46e5" /> Anexos ({selectedOrder.attachments?.length || 0})
                </Text>

                {selectedOrder.attachments && selectedOrder.attachments.length > 0 ? (
                  <View style={styles.attachmentsContainer}>
                    {/* Imagens */}
                    {selectedOrder.attachments
                      .filter(isImageAttachment)
                      .length > 0 && (
                        <>
                          <Text style={styles.attachmentTypeLabel}>
                            <Icon name="image" size={16} color="#6b7280" /> Imagens
                          </Text>
                          <ScrollView horizontal showsHorizontalScrollIndicator={false} style={styles.imagesScroll}>
                            {selectedOrder.attachments
                              .filter(isImageAttachment)
                              .map((att, index) => {
                                const imageUrl = getAttachmentUrl(att);

                                return (
                                  <TouchableOpacity
                                    key={index}
                                    style={styles.imageAttachment}
                                    onPress={() => {
                                      setSelectedImageIndex(index);
                                      setImageViewerVisible(true);
                                    }}
                                  >
                                    <Image
                                      source={{ uri: imageUrl }}
                                      style={styles.attachmentImage}
                                      resizeMode="cover"
                                    />
                                    <View style={styles.zoomOverlay}>
                                      <Icon name="zoom-in" size={20} color="#ffffff" />
                                    </View>
                                    <Text style={styles.attachmentName} numberOfLines={1}>
                                      {att.original_name || att.filename}
                                    </Text>
                                    <Text style={styles.attachmentSize}>
                                      {(att.size / 1024).toFixed(0)} KB
                                    </Text>
                                  </TouchableOpacity>
                                );
                              })}
                          </ScrollView>
                        </>
                      )}

                    {/* Vídeos */}
                    {selectedOrder.attachments
                      .filter(isVideoAttachment)
                      .length > 0 && (
                        <>
                          <Text style={styles.attachmentTypeLabel}>
                            <Icon name="videocam" size={16} color="#6b7280" /> Vídeos
                          </Text>
                          {selectedOrder.attachments
                            .filter(isVideoAttachment)
                            .map((att, index) => (
                              <TouchableOpacity key={index} style={styles.videoAttachment} onPress={() => {
                                const url = getAttachmentUrl(att);
                                if (url) {
                                  setFileViewerUrl(url);
                                  setFileViewerTitle(att.original_name || att.filename || 'Vídeo');
                                  setFileViewerMime(att.mime_type || 'video/mp4');
                                  setFileViewerVisible(true);
                                }
                              }}>
                                <View style={styles.videoThumbnailContainer}>
                                  <Icon name="play-circle-filled" size={48} color="#4f46e5" />
                                </View>
                                <View style={styles.videoInfo}>
                                  <Text style={styles.videoName} numberOfLines={1}>
                                    {att.original_name || att.filename}
                                  </Text>
                                  <Text style={styles.videoSize}>
                                    {(att.size / (1024 * 1024)).toFixed(2)} MB
                                  </Text>
                                </View>
                                <Icon name="play-arrow" size={20} color="#4f46e5" />
                              </TouchableOpacity>
                            ))}
                        </>
                      )}

                    {/* Documentos */}
                    {selectedOrder.attachments
                      .filter(isDocumentAttachment)
                      .length > 0 && (
                        <>
                          <Text style={styles.attachmentTypeLabel}>
                            <Icon name="insert-drive-file" size={16} color="#6b7280" /> Documentos
                          </Text>
                          {selectedOrder.attachments
                            .filter(isDocumentAttachment)
                            .map((att, index) => (
                              <TouchableOpacity key={index} style={styles.documentAttachment} onPress={() => {
                                const url = getAttachmentUrl(att);
                                if (url) {
                                  setFileViewerUrl(url);
                                  setFileViewerTitle(att.original_name || att.filename || 'Documento');
                                  setFileViewerMime(att.mime_type || 'application/octet-stream');
                                  setFileViewerVisible(true);
                                }
                              }}>
                                <Icon name="insert-drive-file" size={32} color="#6b7280" />
                                <View style={styles.documentInfo}>
                                  <Text style={styles.documentName} numberOfLines={1}>
                                    {att.original_name || att.filename}
                                  </Text>
                                  <Text style={styles.documentSize}>
                                    {(att.size / 1024).toFixed(0)} KB • {att.mime_type}
                                  </Text>
                                </View>
                                <Icon name="visibility" size={24} color="#4f46e5" />
                              </TouchableOpacity>
                            ))}
                        </>
                      )}
                  </View>
                ) : (
                  <View style={styles.attachmentsContainer}>
                    <Text style={styles.attachmentsPlaceholder}>
                      Nenhum anexo disponível para este pedido
                    </Text>
                  </View>
                )}
              </View>

              {/* Seção de Propostas ou Gerenciamento do Pedido */}
              {selectedOrder.status === 'Em andamento' ? (
                <TouchableOpacity
                  style={{
                    backgroundColor: '#4f46e5', borderRadius: 12, padding: 16,
                    flexDirection: 'row', alignItems: 'center', justifyContent: 'center',
                    gap: 10, marginTop: 16,
                  }}
                  onPress={() => {
                    setShowDetails(false);
                    navigation.navigate('AcceptedOrder', { orderId: parseInt(selectedOrder.id) });
                  }}
                >
                  <MessageSquare size={22} color="#ffffff" />
                  <Text style={{ color: '#ffffff', fontSize: 16, fontWeight: '700' }}>
                    Gerenciar Pedido
                  </Text>
                  <ChevronRight size={22} color="#ffffff" />
                </TouchableOpacity>
              ) : selectedOrder.status === 'Cancelado' ? (
                <View style={{ alignItems: 'center', padding: 20, marginTop: 16 }}>
                  <XCircle size={48} color="#ef4444" />
                  <Text style={{ fontSize: 16, fontWeight: '700', color: '#ef4444', marginTop: 8 }}>
                    Pedido Cancelado
                  </Text>
                </View>
              ) : selectedOrder.status === 'Pausado' ? (
                <View style={{ alignItems: 'center', padding: 20, marginTop: 16 }}>
                  <Icon name="pause-circle-filled" size={48} color="#f59e0b" />
                  <Text style={{ fontSize: 16, fontWeight: '700', color: '#f59e0b', marginTop: 8 }}>
                    Pedido Pausado
                  </Text>
                  <Text style={{ fontSize: 13, color: '#92400e', marginTop: 4, textAlign: 'center' }}>
                    Este pedido está invisível para prestadores. Toque no botão abaixo para ativar novamente.
                  </Text>
                </View>
              ) : (
                <>
                  {/* Ranking das Propostas */}
                  {selectedOrder.proposals.length > 0 ? (
                    <>
                      <Text style={styles.proposalsTitle}>Propostas Recebidas</Text>
                      {selectedOrder.proposals
                        .filter((proposal) => !(refusedProposals[selectedOrder.id]?.includes(proposal.id)))
                        .map((proposal) => (
                          <View
                            key={proposal.id}
                            style={styles.proposalCard}
                          >
                            <View style={styles.proposalCardHeader}>
                              <View style={styles.proposalProvider}>
                                <View style={styles.rankingEmoji}><Trophy size={22} color={getRankingIconColor(proposal.ranking)} /></View>
                                <View style={styles.proposalProviderInfo}>
                                  <TouchableOpacity
                                    onPress={() => {
                                      if (proposal.provider.avatarUri) {
                                        setAvatarViewerImage(proposal.provider.avatarUri);
                                        setAvatarViewerVisible(true);
                                      }
                                    }}
                                    disabled={!proposal.provider.avatarUri}
                                  >
                                    {proposal.provider.avatar ? (
                                      <Image
                                        source={proposal.provider.avatar}
                                        style={styles.providerAvatar}
                                      />
                                    ) : (
                                      <View style={[styles.providerAvatar, styles.providerAvatarPlaceholder]}>
                                        <Icon name="person" size={24} color="#9ca3af" />
                                      </View>
                                    )}
                                  </TouchableOpacity>
                                  <View>
                                    <Text style={styles.providerName}>{proposal.provider.name}</Text>
                                    <View style={styles.providerRating}>
                                      <Icon name="star" size={14} color="#fbbf24" />
                                      <Text style={styles.providerRatingText}>{proposal.provider.rating}</Text>
                                    </View>
                                  </View>
                                </View>
                              </View>
                              <View style={getRankingStyle(proposal.ranking)}>
                                <Text style={styles.rankingText}>{proposal.ranking}º lugar</Text>
                              </View>
                            </View>

                            <View style={styles.proposalDetails}>
                              <View>
                                <Text style={styles.proposalDetailLabel}>Valor</Text>
                                <Text style={styles.proposalDetailValue}>{proposal.price}</Text>
                              </View>
                              <View>
                                <Text style={styles.proposalDetailLabel}>Prazo</Text>
                                <Text style={styles.proposalDetailValue}>{proposal.deadline}</Text>
                              </View>
                            </View>

                            <Text style={styles.proposalDescription}>{proposal.description}</Text>

                            <View style={styles.proposalActions}>
                              <TouchableOpacity
                                accessibilityLabel="Aceitar proposta"
                                onPress={() => {
                                  setShowDetails(false);
                                  navigation.navigate('Checkout', { proposal });
                                }}
                              >
                                <View style={styles.acceptButton}>
                                  <Icon name="check-circle" size={28} color="#22c55e" />
                                </View>
                              </TouchableOpacity>
                              <TouchableOpacity
                                accessibilityLabel="Recusar proposta"
                                onPress={() => handleRefuseProposal(selectedOrder.id, proposal.id)}
                              >
                                <View style={styles.rejectButton}>
                                  <Icon name="cancel" size={28} color="#ef4444" />
                                </View>
                              </TouchableOpacity>
                            </View>
                          </View>
                        ))}
                    </>
                  ) : (
                    <View style={styles.noProposalsContainer}>
                      <Text style={styles.noProposalsTitle}>
                        <Hourglass size={16} color="#92400e" /> Aguardando propostas...
                      </Text>
                      <Text style={styles.noProposalsMessage}>
                        Seu pedido ainda não recebeu propostas. Continue aguardando ou considere ajustar os detalhes do pedido.
                      </Text>
                    </View>
                  )}

                  {/* Ícone para cliente pausar/ativar pedido */}
                  <TouchableOpacity
                    style={styles.closeOrderButton}
                    onPress={() => handleToggleStopOrder(selectedOrder.id)}
                    accessibilityLabel={selectedOrder.status === 'Pausado' ? 'Ativar pedido' : 'Pausar pedido'}
                  >
                    <View style={styles.closeOrderIcon}>
                      <Icon
                        name={selectedOrder.status === 'Pausado' ? 'play-circle-filled' : 'pause-circle-filled'}
                        size={28}
                        color={selectedOrder.status === 'Pausado' ? '#22c55e' : '#f59e0b'}
                      />
                    </View>
                    <Text style={{ fontSize: 11, color: selectedOrder.status === 'Pausado' ? '#22c55e' : '#f59e0b', marginTop: 2, fontWeight: '600' }}>
                      {selectedOrder.status === 'Pausado' ? 'Ativar Novamente' : 'Pausar'}
                    </Text>
                  </TouchableOpacity>
                </>
              )}
            </ScrollView>
          )}
        </View>

        {/* Image Viewer with zoom - inside modal for proper iOS stacking */}
        {imageViewerVisible && selectedOrder && (() => {
          const imageAttachments = (selectedOrder.attachments || [])
            .filter(isImageAttachment)
            .map(att => getAttachmentUrl(att))
            .filter(url => url !== '');

          return imageAttachments.length > 0 ? (
            <ImageViewer
              visible={true}
              images={imageAttachments}
              initialIndex={selectedImageIndex}
              onClose={() => setImageViewerVisible(false)}
            />
          ) : null;
        })()}

        {/* Avatar Viewer - inside modal for proper iOS stacking */}
        {avatarViewerVisible && avatarViewerImage ? (
          <ImageViewer
            visible={true}
            images={[avatarViewerImage]}
            initialIndex={0}
            onClose={() => setAvatarViewerVisible(false)}
          />
        ) : null}

        {/* File Viewer for videos and documents - inside modal */}
        <FileViewer
          visible={fileViewerVisible}
          url={fileViewerUrl}
          title={fileViewerTitle}
          mimeType={fileViewerMime}
          onClose={() => setFileViewerVisible(false)}
        />
      </Modal>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#f3f4f6',
  },
  scrollView: {
    flex: 1,
  },
  scrollContent: {
    paddingBottom: Platform.OS === 'ios' ? 24 : 70,
  },
  content: {
    padding: 24,
  },
  loadingContainer: {
    flex: 1,
    backgroundColor: '#f3f4f6',
    justifyContent: 'center',
    alignItems: 'center',
  },
  loadingText: {
    color: '#6b7280',
    marginTop: 16,
  },
  errorContainer: {
    flex: 1,
    backgroundColor: '#f3f4f6',
    justifyContent: 'center',
    alignItems: 'center',
    padding: 24,
  },
  errorTitle: {
    fontSize: 20,
    fontWeight: '600',
    color: '#6b7280',
    marginTop: 16,
    marginBottom: 8,
  },
  errorMessage: {
    color: '#6b7280',
    textAlign: 'center',
    marginBottom: 24,
  },
  retryButton: {
    backgroundColor: '#4f46e5',
    borderRadius: 8,
    padding: 16,
  },
  retryButtonText: {
    textAlign: 'center',
    color: 'white',
    fontWeight: 'bold',
    fontSize: 18,
  },
  pageTitle: {
    fontSize: 24,
    fontWeight: 'bold',
    marginBottom: 10,
  },
  pageSubtitle: {
    color: '#6b7280',
    marginBottom: 24,
  },
  orderCard: {
    backgroundColor: 'white',
    borderRadius: 12,
    padding: 24,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 1 },
    shadowOpacity: 0.05,
    shadowRadius: 2,
    elevation: 2,
    marginBottom: 16,
  },
  orderHeader: {
    flexDirection: 'column',
    justifyContent: 'space-between',
    alignItems: 'flex-start',
    marginBottom: 16,
  },
  orderTitle: {
    fontSize: 18,
    fontWeight: 'bold',
    flex: 1,
    width: '100%',
    marginBottom: 10
  },
  statusContainer: {
    flexDirection: 'row',
    alignItems: 'flex-start',
    gap: 2
  },
  auctionIcon: {
    backgroundColor: '#fed7aa',
    padding: 4,
    borderRadius: 12,
    marginRight: 8,
  },
  newDemandIcon: {
    backgroundColor: '#dcfce7',
    padding: 4,
    borderRadius: 12,
    marginRight: 2,
  },
  statusText: {
    fontWeight: '600',
    marginRight: 2
  },
  statusInProgress: {
    backgroundColor: '#dbeafe',
    paddingHorizontal: 12,
    paddingVertical: 4,
    borderRadius: 12,
  },
  statusWaiting: {
    backgroundColor: '#fef3c7',
    paddingHorizontal: 12,
    paddingVertical: 4,
    borderRadius: 12,
  },
  statusCompleted: {
    backgroundColor: '#dcfce7',
    paddingHorizontal: 12,
    paddingVertical: 4,
    borderRadius: 12,
  },
  statusCancelled: {
    backgroundColor: '#fee2e2',
    paddingHorizontal: 12,
    paddingVertical: 4,
    borderRadius: 12,
  },
  statusStopped: {
    backgroundColor: '#fef3c7',
    paddingHorizontal: 12,
    paddingVertical: 4,
    borderRadius: 12,
  },
  statusDefault: {
    backgroundColor: '#f3f4f6',
    paddingHorizontal: 12,
    paddingVertical: 4,
    borderRadius: 12,
  },
  categoryRow: {
    flexDirection: 'row',
    alignItems: 'flex-start',
    marginBottom: 16,
  },
  categoryBadge: {
    backgroundColor: '#e0e7ff',
    paddingHorizontal: 12,
    paddingVertical: 4,
    borderRadius: 12,
  },
  categoryText: {
    color: '#4f46e5',
  },
  budgetText: {
    color: '#6b7280',
    marginLeft: 2,
  },
  locationRow: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: 16,
  },
  locationText: {
    color: '#6b7280',
    marginLeft: 4,
  },
  ratingContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    marginLeft: 16,
  },
  ratingText: {
    color: '#6b7280',
    marginLeft: 4,
  },
  proposalStatusContainer: {
    backgroundColor: '#eff6ff',
    borderRadius: 8,
    padding: 16,
    marginBottom: 16,
  },
  proposalStatusTitle: {
    fontWeight: '600',
    marginBottom: 8,
    color: '#1e40af',
  },
  proposalStatusDescription: {
    color: '#2563eb',
    fontSize: 14,
  },
  waitingTitle: {
    fontWeight: '600',
    marginBottom: 8,
    color: '#92400e',
  },
  waitingDescription: {
    color: '#d97706',
    fontSize: 14,
  },
  orderFooter: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
  },
  deadlineText: {
    color: '#6b7280',
  },
  viewDetailsContainer: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  viewDetailsText: {
    color: '#4f46e5',
    marginLeft: 4,
    fontWeight: '600',
  },
  emptyState: {
    backgroundColor: 'white',
    borderRadius: 12,
    padding: 32,
    alignItems: 'center',
  },
  emptyStateTitle: {
    fontSize: 20,
    fontWeight: '600',
    color: '#6b7280',
    marginTop: 16,
    marginBottom: 8,
  },
  emptyStateMessage: {
    color: '#6b7280',
    textAlign: 'center',
  },
  backButton: {
    backgroundColor: '#4f46e5',
    borderRadius: 8,
    padding: 16,
    marginTop: 24,
  },
  backButtonText: {
    textAlign: 'center',
    color: 'white',
    fontWeight: 'bold',
    fontSize: 18,
  },
  modalContainer: {
    flex: 1,
    backgroundColor: 'white',
  },
  modalHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    padding: 16,
    borderBottomWidth: 1,
    borderBottomColor: '#e5e7eb',
  },
  modalTitle: {
    fontSize: 20,
    fontWeight: 'bold',
  },
  modalContent: {
    flex: 1,
    padding: 24,
  },
  orderInfoCard: {
    backgroundColor: '#f9fafb',
    borderRadius: 12,
    padding: 24,
    marginBottom: 24,
  },
  orderInfoHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: 16,
  },
  orderInfoTitle: {
    fontSize: 20,
    fontWeight: 'bold',
    flex: 1,
  },
  orderInfoIcons: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  modalAuctionIcon: {
    backgroundColor: '#fed7aa',
    padding: 8,
    borderRadius: 12,
    marginRight: 8,
  },
  modalNewDemandIcon: {
    backgroundColor: '#dcfce7',
    padding: 8,
    borderRadius: 12,
    marginRight: 8,
  },
  orderInfoDetails: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: 12,
  },
  modalCategoryBadge: {
    backgroundColor: '#e0e7ff',
    paddingHorizontal: 12,
    paddingVertical: 4,
    borderRadius: 12,
  },
  modalCategoryText: {
    color: '#4f46e5',
  },
  modalBudgetText: {
    color: '#6b7280',
    marginLeft: 16,
  },
  orderDescription: {
    color: '#6b7280',
    marginBottom: 12,
  },
  orderInfoFooter: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  modalLocationText: {
    color: '#6b7280',
    marginLeft: 4,
  },
  modalRatingContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    marginLeft: 16,
  },
  modalRatingText: {
    color: '#6b7280',
    marginLeft: 4,
  },
  proposalsTitle: {
    fontSize: 18,
    fontWeight: 'bold',
    marginBottom: 16,
  },
  proposalCard: {
    backgroundColor: 'white',
    borderWidth: 1,
    borderColor: '#e5e7eb',
    borderRadius: 12,
    padding: 16,
    marginBottom: 12,
  },
  proposalCardHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'flex-start',
    marginBottom: 12,
  },
  proposalProvider: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  rankingEmoji: {
    marginRight: 8,
    justifyContent: 'center',
    alignItems: 'center',
  },
  proposalProviderInfo: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  providerAvatar: {
    width: 40,
    height: 40,
    borderRadius: 20,
    marginRight: 12,
  },
  providerAvatarPlaceholder: {
    backgroundColor: '#e5e7eb',
    justifyContent: 'center',
    alignItems: 'center',
  },
  providerName: {
    fontWeight: '600',
  },
  providerRating: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  providerRatingText: {
    color: '#6b7280',
    marginLeft: 4,
  },
  rankingFirst: {
    backgroundColor: '#fef3c7',
    paddingHorizontal: 12,
    paddingVertical: 4,
    borderRadius: 12,
  },
  rankingSecond: {
    backgroundColor: '#f3f4f6',
    paddingHorizontal: 12,
    paddingVertical: 4,
    borderRadius: 12,
  },
  rankingThird: {
    backgroundColor: '#fed7aa',
    paddingHorizontal: 12,
    paddingVertical: 4,
    borderRadius: 12,
  },
  rankingDefault: {
    backgroundColor: '#f3f4f6',
    paddingHorizontal: 12,
    paddingVertical: 4,
    borderRadius: 12,
  },
  rankingText: {
    fontWeight: '600',
  },
  proposalDetails: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    marginBottom: 12,
  },
  proposalDetailLabel: {
    color: '#6b7280',
    fontSize: 14,
  },
  proposalDetailValue: {
    fontWeight: 'bold',
    fontSize: 18,
  },
  proposalDescription: {
    color: '#6b7280',
    fontSize: 14,
  },
  proposalActions: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 16,
    alignSelf: 'flex-end',
    marginTop: 8,
  },
  acceptButton: {
    backgroundColor: '#dcfce7',
    padding: 8,
    borderRadius: 12,
  },
  rejectButton: {
    backgroundColor: '#fee2e2',
    padding: 8,
    borderRadius: 12,
  },
  noProposalsContainer: {
    backgroundColor: '#fffbeb',
    borderRadius: 12,
    padding: 24,
    marginBottom: 24,
  },
  noProposalsTitle: {
    fontSize: 18,
    fontWeight: 'bold',
    marginBottom: 8,
    color: '#92400e',
  },
  noProposalsMessage: {
    color: '#b45309',
  },
  closeOrderButton: {
    position: 'absolute',
    right: 24,
    top: 24,
    zIndex: 10,
  },
  closeOrderIcon: {
    backgroundColor: '#fee2e2',
    padding: 8,
    borderRadius: 12,
  },
  orderDetailRow: {
    flexDirection: 'row',
    alignItems: 'center',
    marginTop: 8,
    marginBottom: 8,
  },
  orderDetailText: {
    color: '#6b7280',
    marginLeft: 8,
  },
  orderActionsContainer: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    marginTop: 16,
    paddingTop: 16,
    borderTopWidth: 1,
    borderTopColor: '#e5e7eb',
    gap: 12,
  },
  editOrderButton: {
    flex: 1,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    backgroundColor: '#e0e7ff',
    padding: 12,
    borderRadius: 8,
    gap: 8,
  },
  editOrderButtonDisabled: {
    backgroundColor: '#f3f4f6',
    opacity: 0.6,
  },
  editOrderButtonText: {
    color: '#4f46e5',
    fontWeight: '600',
    fontSize: 16,
  },
  editOrderButtonTextDisabled: {
    color: '#9ca3af',
  },
  editDisabledWarning: {
    color: '#ef4444',
    fontSize: 12,
    marginTop: 4,
    textAlign: 'center',
    fontStyle: 'italic',
  },
  deleteOrderButton: {
    flex: 1,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    backgroundColor: '#fee2e2',
    padding: 12,
    borderRadius: 8,
    gap: 8,
  },
  deleteOrderButtonText: {
    color: '#ef4444',
    fontWeight: '600',
    fontSize: 16,
  },
  attachmentsSection: {
    backgroundColor: 'white',
    borderRadius: 12,
    padding: 16,
    marginBottom: 16,
  },
  attachmentsSectionTitle: {
    fontSize: 18,
    fontWeight: 'bold',
    marginBottom: 12,
    color: '#111827',
  },
  attachmentsContainer: {
    marginTop: 8,
  },
  attachmentsPlaceholder: {
    color: '#9ca3af',
    textAlign: 'center',
    padding: 24,
    backgroundColor: '#f9fafb',
    borderRadius: 8,
    borderWidth: 1,
    borderColor: '#e5e7eb',
    borderStyle: 'dashed',
  },
  attachmentTypeLabel: {
    fontSize: 14,
    fontWeight: '600',
    color: '#6b7280',
    marginTop: 12,
    marginBottom: 8,
  },
  imagesScroll: {
    marginBottom: 16,
  },
  imageAttachment: {
    marginRight: 12,
    width: 120,
    position: 'relative',
  },
  attachmentImage: {
    width: 120,
    height: 120,
    borderRadius: 8,
    backgroundColor: '#f3f4f6',
  },
  zoomOverlay: {
    position: 'absolute',
    top: 4,
    right: 4,
    backgroundColor: 'rgba(0, 0, 0, 0.5)',
    borderRadius: 12,
    width: 28,
    height: 28,
    alignItems: 'center',
    justifyContent: 'center',
  },
  attachmentName: {
    fontSize: 12,
    color: '#6b7280',
    marginTop: 4,
  },
  attachmentSize: {
    fontSize: 10,
    color: '#9ca3af',
  },
  videoAttachment: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#f9fafb',
    borderRadius: 8,
    padding: 12,
    marginBottom: 8,
  },
  videoThumbnailContainer: {
    width: 80,
    height: 80,
    backgroundColor: '#e5e7eb',
    borderRadius: 8,
    alignItems: 'center',
    justifyContent: 'center',
  },
  videoInfo: {
    flex: 1,
    marginLeft: 12,
  },
  videoName: {
    fontSize: 14,
    fontWeight: '500',
    color: '#111827',
    marginBottom: 4,
  },
  videoSize: {
    fontSize: 12,
    color: '#6b7280',
  },
  documentAttachment: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#f9fafb',
    borderRadius: 8,
    padding: 12,
    marginBottom: 8,
  },
  documentInfo: {
    flex: 1,
    marginLeft: 12,
  },
  documentName: {
    fontSize: 14,
    fontWeight: '500',
    color: '#111827',
    marginBottom: 4,
  },
  documentSize: {
    fontSize: 12,
    color: '#6b7280',
  },
});