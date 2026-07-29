import React, { useState, useCallback } from 'react';
import { View, Text, ScrollView, TouchableOpacity, Modal, Alert, Image, StyleSheet } from 'react-native';
import { useNavigation, useRoute, useFocusEffect } from '@react-navigation/native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import Icon from 'react-native-vector-icons/MaterialIcons';
import { Hourglass, MessageSquare, ChevronRight, XCircle } from 'lucide-react-native';
import { useAuth } from '../../contexts/AuthContext';
import { orderService, orderActionService, proposalService, Order as ApiOrder, Proposal as ApiProposal } from '../../services/api';
import { useStatusBarOverlay } from '../../hooks/useStatusBarOverlay';
import { StatusBarOverlay } from '../../components/StatusBarOverlay';
import { formatPrice } from '../../utils/formatters';
import { useToast } from '../../contexts/ToastContext';
import { ImageViewer } from '../../components/ImageViewer';
import { FileViewer } from '../../components/FileViewer';
import { getAttachmentUrl, isImageAttachment, isVideoAttachment } from '../../utils/attachmentHelpers';
import { OrderListSkeleton } from '../../components/Skeleton';
import { OrderTimeline } from '../../components/OrderTimeline';

interface Proposal {
  id: string;
  provider: {
    name: string;
    rating: number;
    avatar: any;
    avatarUri?: string | null;
    is_premium?: number | boolean;
    is_verified?: number | boolean;
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

type ApiOrderStatus = 'open' | 'in_progress' | 'completed' | 'cancelled' | 'stopped';

interface Order {
  id: string;
  title: string;
  category: string;
  budget: string;
  deadline: string;
  status: string;
  description: string;
  location: string;
  street?: string | null;
  number?: string | null;
  complement?: string | null;
  neighborhood?: string | null;
  city?: string | null;
  state?: string | null;
  zip_code?: string | null;
  latitude?: number | null;
  longitude?: number | null;
  clientRating: number;
  proposals: Proposal[];
  insights: string[];
  clientId: string;
  hasActiveAuction: boolean;
  isNewDemand: boolean;
  attachments?: Attachment[];
  apiStatus: ApiOrderStatus;
  created_at?: string;
  acceptedProposalId?: number | null;
  scheduledDate?: string | null;
  scheduleConfirmedByClient?: number | null;
  scheduleConfirmedByProvider?: number | null;
}

const convertApiOrderToOrder = (apiOrder: ApiOrder): Order => {
  const proposals: Proposal[] = apiOrder.proposals?.map((proposal: ApiProposal, index: number) => {
    const avatarUri = proposal.provider_avatar_base64 || proposal.provider?.avatar_base64 || null;
    console.log(`[OrderDetails] Proposal ${proposal.id} - provider_name: ${proposal.provider_name}, has provider obj: ${!!proposal.provider}, provider_avatar_base64: ${avatarUri ? avatarUri.substring(0, 50) + '...' : 'null'}`);
    return {
    id: proposal.id.toString(),
    provider: {
      name: proposal.provider?.name || proposal.provider_name || 'Prestador',
      rating: 4.5,
      avatar: avatarUri ? { uri: avatarUri } : null,
      avatarUri: avatarUri,
      is_premium: proposal.provider?.is_premium,
      is_verified: proposal.provider?.is_verified,
    },
    price: `R$ ${formatPrice(proposal.price || 0)}`,
    deadline: `${proposal.deadline || 0} dias`,
    description: proposal.description || 'Sem descrição',
    ranking: index + 1,
  };
  }) || [];

  const hasActiveAuction = !!(apiOrder.auction_started_at && apiOrder.auction_ends_at &&
    new Date() >= new Date(apiOrder.auction_started_at) &&
    new Date() <= new Date(apiOrder.auction_ends_at));

  const isNewDemand = apiOrder.status === 'open' && proposals.length === 0;

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

  const budgetValue = typeof apiOrder.budget === 'string'
    ? parseFloat(apiOrder.budget)
    : (apiOrder.budget || 0);

  const deadlineValue = typeof apiOrder.deadline === 'string'
    ? parseInt(apiOrder.deadline)
    : (apiOrder.deadline || 0);

  let attachments: Attachment[] = [];
  if (apiOrder.attachments) {
    try {
      console.log('📎 Processando anexos para pedido:', apiOrder.id);
      console.log('📎 Tipo de attachments:', typeof apiOrder.attachments);
      console.log('📎 Valor de attachments:', apiOrder.attachments);

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
    street: (apiOrder as any).street ?? null,
    number: (apiOrder as any).number ?? null,
    complement: (apiOrder as any).complement ?? null,
    neighborhood: (apiOrder as any).neighborhood ?? null,
    city: (apiOrder as any).city ?? null,
    state: (apiOrder as any).state ?? null,
    zip_code: (apiOrder as any).zip_code ?? null,
    latitude: (apiOrder as any).latitude ?? null,
    longitude: (apiOrder as any).longitude ?? null,
    clientRating: 4.8,
    proposals,
    insights: generateInsights(apiOrder, proposals),
    clientId: apiOrder.client_id?.toString() || '0',
    hasActiveAuction,
    isNewDemand,
    attachments,
    apiStatus: (apiOrder.status || 'open') as ApiOrderStatus,
    created_at: apiOrder.created_at,
    acceptedProposalId: (apiOrder as any).accepted_proposal_id ?? null,
    scheduledDate: (apiOrder as any).scheduled_date ?? null,
    scheduleConfirmedByClient: (apiOrder as any).schedule_confirmed_by_client ?? null,
    scheduleConfirmedByProvider: (apiOrder as any).schedule_confirmed_by_provider ?? null,
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
  const [isCancellingAcceptance, setIsCancellingAcceptance] = useState(false);

  const [imageViewerVisible, setImageViewerVisible] = useState(false);
  const [selectedImageIndex, setSelectedImageIndex] = useState(0);
  const [avatarViewerVisible, setAvatarViewerVisible] = useState(false);
  const [avatarViewerImage, setAvatarViewerImage] = useState<string>('');
  const [fileViewerVisible, setFileViewerVisible] = useState(false);
  const [fileViewerUrl, setFileViewerUrl] = useState('');
  const [fileViewerTitle, setFileViewerTitle] = useState('');
  const [fileViewerMime, setFileViewerMime] = useState('');
  const [selectedStatuses, setSelectedStatuses] = useState<string[]>([]);

  const handleRecreateOrder = (order: Order) => {
    setShowDetails(false);
    navigation.navigate('CreateOrder', { prefillOrderData: order });
  };

  const profileType = (route.params as any)?.profileType || 'client';
  const clientId = user?.id?.toString() || (route.params as any)?.clientId || '1';
  const selectedCategory = (route.params as any)?.selectedCategory;
  const fromLeiloes = (route.params as any)?.fromLeiloes || false;

  const fetchOrders = async () => {
    try {
      setLoading(true);
      setError(null);

      let params: any = {};

      if (fromLeiloes) {
        params.status = 'in_progress';
      }

      if (selectedCategory) {
        params.category = selectedCategory;
      }

      const response = await orderService.getOrders(params);

      if (response.success) {

        if (!response.data.data || !Array.isArray(response.data.data)) {
          setOrders([]);
          return;
        }

        const convertedOrders = response.data.data.map((apiOrder: any, index: number) => {

          try {
            return convertApiOrderToOrder(apiOrder);
          } catch (error) {
            console.error('❌ Erro ao converter pedido:', apiOrder.id, error);
            return {
              id: apiOrder.id?.toString() || '0',
              title: apiOrder.title || 'Pedido sem título',
              category: apiOrder.category || 'Sem categoria',
              budget: 'R$ 0,00',
              deadline: '0 dias',
              status: 'Aguardando propostas',
              description: apiOrder.description || 'Sem descrição',
              location: apiOrder.address || 'Local não informado',
              street: (apiOrder as any).street ?? null,
              number: (apiOrder as any).number ?? null,
              complement: (apiOrder as any).complement ?? null,
              neighborhood: (apiOrder as any).neighborhood ?? null,
              city: (apiOrder as any).city ?? null,
              state: (apiOrder as any).state ?? null,
              zip_code: (apiOrder as any).zip_code ?? null,
              latitude: (apiOrder as any).latitude ?? null,
              longitude: (apiOrder as any).longitude ?? null,
              clientRating: 4.8,
              proposals: [],
              insights: ['Dados incompletos'],
              clientId: apiOrder.client_id?.toString() || '0',
              hasActiveAuction: false,
              isNewDemand: false,
              attachments: [],
              apiStatus: (apiOrder.status || 'open') as ApiOrderStatus,
              created_at: apiOrder.created_at,
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

  useFocusEffect(
    useCallback(() => {
      if (user?.id) {
        fetchOrders();
      } else {
        setLoading(false);
      }
    }, [user?.id, fromLeiloes, selectedCategory])
  );

  const STATUS_FILTER_OPTIONS = [
    { label: 'Aguardando', value: 'Aguardando propostas', color: '#4f46e5' },
    { label: 'Em andamento', value: 'Em andamento', color: '#059669' },
    { label: 'Concluído', value: 'Concluído', color: '#22c55e' },
    { label: 'Cancelado', value: 'Cancelado', color: '#ef4444' },
    { label: 'Pausado', value: 'Pausado', color: '#f59e0b' },
  ];

  const toggleStatusFilter = (value: string) => {
    setSelectedStatuses(prev =>
      prev.includes(value) ? prev.filter(s => s !== value) : [...prev, value]
    );
  };

  let filteredOrders = profileType === 'client'
    ? orders.filter(o => o.clientId === clientId)
    : orders;

  filteredOrders = filteredOrders.filter(
    (order) => !closedOrders.includes(order.id)
  );

  if (selectedStatuses.length > 0) {
    filteredOrders = filteredOrders.filter(o => selectedStatuses.includes(o.status));
  }

  const handleOrderPress = (order: Order) => {
    setSelectedOrder(order);
    setShowDetails(true);
  };

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

              setRefusedProposals((prev) => ({
                ...prev,
                [orderId]: [...(prev[orderId] || []), proposalId],
              }));
            } catch (error: any) {
              showError(error.message || 'Erro ao recusar proposta');
            }
          }
        }
      ]
    );
  };

  const handleToggleStopOrder = async (orderId: string) => {
    const isStopped = selectedOrder?.status === 'Pausado';
    const newStatus = isStopped ? 'Aguardando propostas' : 'Pausado';

    if (selectedOrder && selectedOrder.id === orderId) {
      setSelectedOrder({ ...selectedOrder, status: newStatus });
    }
    setOrders(prev => prev.map(o => o.id === orderId ? { ...o, status: newStatus } : o));
    showSuccess(isStopped ? 'Pedido ativado!' : 'Pedido pausado!');

    orderService.toggleStopOrder(parseInt(orderId)).then(response => {
      if (!response.success) {
        const revertStatus = isStopped ? 'Pausado' : 'Aguardando propostas';
        setSelectedOrder(prev => prev && prev.id === orderId ? { ...prev, status: revertStatus } : prev);
        setOrders(prev => prev.map(o => o.id === orderId ? { ...o, status: revertStatus } : o));
        showError(response.message || 'Erro ao alterar status do pedido');
      }
    }).catch((error: any) => {
      const revertStatus = isStopped ? 'Pausado' : 'Aguardando propostas';
      setSelectedOrder(prev => prev && prev.id === orderId ? { ...prev, status: revertStatus } : prev);
      setOrders(prev => prev.map(o => o.id === orderId ? { ...o, status: revertStatus } : o));
      showError(error.message || 'Erro ao alterar status do pedido');
    });
  };

  const handleCancelOrder = async (orderId: string) => {
    try {
      const response = await orderActionService.cancelOrder(parseInt(orderId), 'Cancelado pelo cliente');
      if (response.success) {
        setShowDetails(false);
        setSelectedOrder(null);
        showSuccess('Pedido cancelado com sucesso');
        fetchOrders();
      } else {
        showError(response.message || 'Erro ao cancelar pedido');
      }
    } catch (error: any) {
      showError(error.message || 'Erro ao cancelar pedido');
    }
  };

  const handleCancelAcceptance = (acceptedProposalId: number) => {
    if (isCancellingAcceptance) return;
    Alert.alert(
      'Cancelar aceitação',
      'Deseja cancelar a aceitação desta proposta? O pedido voltará para aberto e você poderá selecionar outra proposta.',
      [
        { text: 'Não', style: 'cancel' },
        {
          text: 'Cancelar aceitação',
          style: 'destructive',
          onPress: () => {
            void (async () => {
              setIsCancellingAcceptance(true);
              try {
                const response = await proposalService.cancelAcceptance(acceptedProposalId);
                if (response.success) {
                  showSuccess('Aceitação cancelada. Selecione outra proposta.');
                  setShowDetails(false);
                  setSelectedOrder(null);
                  void fetchOrders();
                }
              } catch (error: any) {
                const msg = error?.response?.data?.message || error?.message || 'Erro ao cancelar aceitação.';
                showError(msg);
              } finally {
                setIsCancellingAcceptance(false);
              }
            })();
          },
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

  if (loading) {
    return (
      <View style={styles.container}>
        <View style={[styles.headerSection, { paddingTop: insets.top + 16 }]}>
          <Text style={styles.headerTitle}>{getPageTitle()}</Text>
          <Text style={styles.headerSubtitle}>{getPageSubtitle()}</Text>
        </View>
        <View style={styles.content}>
          <OrderListSkeleton />
        </View>
      </View>
    );
  }

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
        <View style={[styles.headerSection, { paddingTop: insets.top + 16 }]}>
          <Text style={styles.headerTitle}>{getPageTitle()}</Text>
          <Text style={styles.headerSubtitle}>{getPageSubtitle()}</Text>
        </View>

        {!fromLeiloes && (
          <ScrollView
            horizontal
            showsHorizontalScrollIndicator={false}
            style={styles.statusFilterBar}
            contentContainerStyle={styles.statusFilterBarContent}
          >
            {STATUS_FILTER_OPTIONS.map((opt) => {
              const isSelected = selectedStatuses.includes(opt.value);
              return (
                <TouchableOpacity
                  key={opt.value}
                  style={[
                    styles.statusFilterChip,
                    isSelected
                      ? { backgroundColor: opt.color, borderColor: opt.color }
                      : { backgroundColor: '#fff', borderColor: '#e5e7eb' },
                  ]}
                  onPress={() => toggleStatusFilter(opt.value)}
                >
                  <Text style={[
                    styles.statusFilterChipText,
                    isSelected ? { color: '#fff' } : { color: '#374151' },
                  ]}>
                    {opt.label}
                  </Text>
                </TouchableOpacity>
              );
            })}
          </ScrollView>
        )}

        <View style={styles.content}>

          {filteredOrders.map((order) => {
            const statusColor =
              order.status === 'Em andamento' ? '#059669' :
              order.status === 'Concluído' ? '#22c55e' :
              order.status === 'Cancelado' ? '#ef4444' :
              order.status === 'Pausado' ? '#f59e0b' : '#4f46e5';
            const statusBg =
              order.status === 'Em andamento' ? '#d1fae5' :
              order.status === 'Concluído' ? '#dcfce7' :
              order.status === 'Cancelado' ? '#fee2e2' :
              order.status === 'Pausado' ? '#fef3c7' : '#eef2ff';
            return (
              <TouchableOpacity
                key={order.id}
                style={styles.orderCard}
                onPress={() => handleOrderPress(order)}
                activeOpacity={0.85}
              >
                {/* Status strip top */}
                <View style={[styles.orderCardStrip, { backgroundColor: statusColor }]} />

                <View style={styles.orderCardBody}>
                  {/* Row 1: title + badges */}
                  <View style={styles.orderCardTitleRow}>
                    <Text style={styles.orderTitle} numberOfLines={1}>{order.title}</Text>
                    <View style={[styles.statusPill, { backgroundColor: statusBg }]}>
                      {order.hasActiveAuction && <Icon name="gavel" size={12} color="#f97316" style={{ marginRight: 2 }} />}
                      {order.isNewDemand && <Icon name="new-releases" size={12} color="#22c55e" style={{ marginRight: 2 }} />}
                      <Text style={[styles.statusPillText, { color: statusColor }]}>{order.status}</Text>
                    </View>
                  </View>

                  {/* Row 2: category chip + budget */}
                  <View style={styles.orderCardMeta}>
                    <View style={styles.categoryChip}>
                      <Text style={styles.categoryChipText}>{order.category}</Text>
                    </View>
                    <Text style={styles.budgetChip}>{order.budget || 'Orçamento não informado'}</Text>
                  </View>

                  {/* Row 3: location */}
                  <View style={styles.locationRow}>
                    <Icon name="location-on" size={14} color="#9ca3af" />
                    <Text style={styles.locationText} numberOfLines={1}>{order.location}</Text>
                  </View>

                  {/* Row 4: proposals banner */}
                  <View style={[styles.proposalBanner, order.proposals.length > 0 ? styles.proposalBannerActive : styles.proposalBannerWaiting]}>
                    <Icon
                      name={order.proposals.length > 0 ? 'description' : 'hourglass-empty'}
                      size={14}
                      color={order.proposals.length > 0 ? '#1e40af' : '#92400e'}
                    />
                    <Text style={[styles.proposalBannerText, { color: order.proposals.length > 0 ? '#1e40af' : '#92400e' }]}>
                      {order.proposals.length > 0
                        ? `${order.proposals.length} ${order.proposals.length === 1 ? 'proposta recebida' : 'propostas recebidas'}`
                        : 'Aguardando propostas…'}
                    </Text>
                  </View>

                  {/* Row 5: footer */}
                  <View style={styles.orderFooter}>
                    <View style={styles.deadlineChip}>
                      <Icon name="schedule" size={13} color="#6b7280" />
                      <Text style={styles.deadlineText}>Prazo: {order.deadline || '—'}</Text>
                    </View>
                    <View style={styles.viewDetailsContainer}>
                      <Text style={styles.viewDetailsText}>Ver detalhes</Text>
                      <Icon name="chevron-right" size={18} color="#4f46e5" />
                    </View>
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
                {selectedStatuses.length > 0
                  ? 'Nenhum pedido com o status selecionado.'
                  : selectedCategory
                    ? `Não há pedidos na categoria "${selectedCategory}" no momento.`
                    : fromLeiloes
                      ? 'Não há leilões em andamento no momento.'
                      : 'Você ainda não possui pedidos. Crie seu primeiro pedido!'
                }
              </Text>
            </View>
          )}
          <View style={{ height: insets.bottom + 16 }} />
        </View>
      </ScrollView>

      <StatusBarOverlay
        show={showStatusBarOverlay}
        opacity={statusBarOpacity}
      />


      <Modal
        visible={showDetails}
        animationType="slide"
        presentationStyle="pageSheet"
      >
        <View style={styles.modalContainer}>
          <View style={[styles.modalHeader,{paddingTop:16}]}>
            <Text style={styles.modalTitle}>Detalhes do Pedido</Text>
            <TouchableOpacity onPress={() => setShowDetails(false)}>
              <Icon name="close" size={24} color="#ffffff" />
            </TouchableOpacity>
          </View>

          {selectedOrder && (
            <ScrollView
              style={styles.modalScroll}
              contentContainerStyle={[styles.modalContent,{paddingBottom:insets.bottom+80}]}
            >
              <View style={styles.demandCard}>
                {(() => {
                  const images=(selectedOrder.attachments||[]).filter(isImageAttachment);
                  if(images.length===0)return null;
                  const heroUrl=getAttachmentUrl(images[0]);
                  return (
                    <TouchableOpacity activeOpacity={0.9} onPress={() => {setSelectedImageIndex(0);setImageViewerVisible(true);}} style={styles.heroImageContainer}>
                      <Image source={{uri:heroUrl}} style={styles.heroImage} resizeMode="cover" />
                      {images.length>1&&(
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
                  const images=(selectedOrder.attachments||[]).filter(isImageAttachment);
                  if(images.length<=1)return null;
                  return (
                    <ScrollView horizontal showsHorizontalScrollIndicator={false} contentContainerStyle={styles.thumbRow}>
                      {images.map((image:any,index:number)=>{
                        const imageUrl=getAttachmentUrl(image);
                        return (
                          <TouchableOpacity key={index} style={[styles.thumbItem,index===0&&styles.thumbItemActive]} onPress={() => {setSelectedImageIndex(index);setImageViewerVisible(true);}} activeOpacity={0.8}>
                            <Image source={{uri:imageUrl}} style={styles.thumbImage} resizeMode="cover" />
                          </TouchableOpacity>
                        );
                      })}
                    </ScrollView>
                  );
                })()}
                <View style={styles.demandTitleArea}>
                  <View style={styles.demandTitleRow}>
                    <Text style={styles.demandTitle}>{selectedOrder.title}</Text>
                    <View style={styles.demandTitleIcons}>
                      {selectedOrder.hasActiveAuction&&(<View style={styles.modalAuctionIcon}><Icon name="gavel" size={18} color="#f97316" /></View>)}
                      {selectedOrder.isNewDemand&&(<View style={styles.modalNewDemandIcon}><Icon name="new-releases" size={18} color="#22c55e" /></View>)}
                    </View>
                  </View>
                  <View style={styles.badgesRow}>
                    <View style={styles.demandCategoryBadge}>
                      <Text style={styles.demandCategoryText}>{selectedOrder.category}</Text>
                    </View>
                    <View style={[styles.demandCategoryBadge,styles.demandBudgetBadge]}>
                      <Text style={[styles.demandCategoryText,styles.demandBudgetBadgeText]}>{selectedOrder.budget}</Text>
                    </View>
                    <View style={[styles.demandCategoryBadge,styles.demandDeadlineBadge]}>
                      <Icon name="schedule" size={14} color="#c2410c" />
                      <Text style={[styles.demandCategoryText,styles.demandDeadlineBadgeText]}>{selectedOrder.deadline}</Text>
                    </View>
                  </View>
                </View>
                <View style={styles.budgetStrip}>
                  <View style={styles.budgetStripLeft}>
                    <Icon name="location-on" size={20} color="#4f46e5" />
                    <Text style={styles.budgetStripLabel}>Endereço</Text>
                  </View>
                  <Text style={styles.budgetStripValue} numberOfLines={3}>{selectedOrder.location}</Text>
                </View>
                <View style={styles.sectionBlock}>
                  <Text style={styles.sectionLabel}>Descrição do Serviço</Text>
                  <Text style={styles.sectionText}>{selectedOrder.description}</Text>
                </View>
                {(() => {
                  const docs=(selectedOrder.attachments||[]).filter((att:any)=>!isImageAttachment(att));
                  if(docs.length===0)return null;
                  return (
                    <View style={styles.docsSection}>
                      <Text style={styles.sectionLabel}>Anexos</Text>
                      {docs.map((doc:any,index:number)=>{
                        const url=getAttachmentUrl(doc);
                        const isVideo=isVideoAttachment(doc);
                        return (
                          <TouchableOpacity key={index} style={styles.docItem} onPress={() => {if(url){setFileViewerUrl(url);setFileViewerTitle(doc.original_name||doc.filename||'Arquivo');setFileViewerMime(doc.mime_type||'application/octet-stream');setFileViewerVisible(true);}}}>
                            <Icon name={isVideo?'videocam':'description'} size={18} color="#4f46e5" />
                            <Text style={styles.docName} numberOfLines={1}>{doc.original_name||doc.filename||'Arquivo'}</Text>
                            <Icon name="open-in-new" size={18} color="#6b7280" />
                          </TouchableOpacity>
                        );
                      })}
                    </View>
                  );
                })()}
              </View>

              <OrderTimeline
                apiStatus={selectedOrder.apiStatus}
                hasProposals={selectedOrder.proposals.length > 0}
                hasAcceptedProposal={!!selectedOrder.acceptedProposalId}
                hasScheduledDate={!!selectedOrder.scheduledDate}
                bothScheduleConfirmed={!!(selectedOrder.scheduleConfirmedByClient && selectedOrder.scheduleConfirmedByProvider)}
                createdAt={selectedOrder.created_at}
              />

              {selectedOrder.status === 'Em andamento' ? (
                <>
                  {profileType === 'client' && !selectedOrder.scheduledDate && !!selectedOrder.acceptedProposalId && (
                    <TouchableOpacity
                      style={styles.cancelAcceptanceBtn}
                      onPress={() => handleCancelAcceptance(selectedOrder.acceptedProposalId as number)}
                      disabled={isCancellingAcceptance}
                      activeOpacity={0.8}
                    >
                      <Icon name="undo" size={20} color="#d97706" />
                      <Text style={styles.cancelAcceptanceBtnText}>
                        {isCancellingAcceptance ? 'Cancelando...' : 'Escolher outra proposta'}
                      </Text>
                    </TouchableOpacity>
                  )}
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
                </>
              ) : selectedOrder.status === 'Cancelado' ? (
                <View style={{ alignItems: 'center', padding: 20, marginTop: 16 }}>
                  <XCircle size={48} color="#ef4444" />
                  <Text style={{ fontSize: 16, fontWeight: '700', color: '#ef4444', marginTop: 8 }}>
                    Pedido Cancelado
                  </Text>
                </View>
              ) : selectedOrder.status === 'Concluído' ? (
                <View style={{ alignItems: 'center', padding: 20, marginTop: 16 }}>
                  <Icon name="check-circle" size={48} color="#22c55e" />
                  <Text style={{ fontSize: 16, fontWeight: '700', color: '#22c55e', marginTop: 8 }}>
                    Pedido Concluído
                  </Text>
                </View>
              ) : selectedOrder.status === 'Pausado' ? (
                <View style={{ alignItems: 'center', padding: 20, marginTop: 16 }}>
                  <Icon name="pause-circle-filled" size={48} color="#f59e0b" />
                  <Text style={{ fontSize: 16, fontWeight: '700', color: '#f59e0b', marginTop: 8 }}>
                    Pedido Pausado
                  </Text>
                  <Text style={{ fontSize: 13, color: '#92400e', marginTop: 4, textAlign: 'center' }}>
                    Este pedido está invisível para prestadores.
                  </Text>
                </View>
              ) : (
                <>

                  {selectedOrder.proposals.length > 0 ? (
                    <View style={styles.proposalsBox}>
                      <Text style={styles.proposalsTitle}>Propostas Recebidas</Text>
                      {selectedOrder.proposals
                        .filter((proposal) => !(refusedProposals[selectedOrder.id]?.includes(proposal.id)))
                        .map((proposal) => (
                          <View key={proposal.id} style={styles.proposalCard}>
                            <View style={styles.proposalCardHeader}>
                              <View style={styles.proposalProvider}>
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
                                    <View style={{ flexDirection: 'row', gap: 4, marginTop: 3 }}>
                                      {proposal.provider?.is_premium ? (
                                        <View style={styles.premiumBadge}>
                                          <Text style={styles.premiumBadgeText}>⭐ Premium</Text>
                                        </View>
                                      ) : null}
                                      {proposal.provider?.is_verified ? (
                                        <View style={styles.verifiedBadge}>
                                          <Text style={styles.verifiedBadgeText}>✓ Verificado</Text>
                                        </View>
                                      ) : null}
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

                            <Text style={styles.proposalDescription}>Descrição da Proposta:</Text>
                            <Text style={styles.proposalDescriptionText}>{proposal.description}</Text>

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
                    </View>
                  ) : (
                    <View style={styles.noProposalsContainer}>
                      <Text style={styles.noProposalsTitle}>
                        <Hourglass size={14} color="#92400e" /> Aguardando propostas...
                      </Text>
                      <Text style={styles.noProposalsMessage}>
                        Seu pedido ainda não recebeu propostas. Continue aguardando ou considere ajustar os detalhes do pedido.
                      </Text>
                    </View>
                  )}

                </>
              )}


              <View style={styles.floatingActions}>
                {(selectedOrder.status==='Aguardando propostas'||selectedOrder.status==='Pausado')&&(
                  <TouchableOpacity style={styles.floatingActionBtn} onPress={() => handleToggleStopOrder(selectedOrder.id)} accessibilityLabel={selectedOrder.status==='Pausado'?'Ativar pedido':'Pausar pedido'}>
                    <View style={[styles.closeOrderIcon,selectedOrder.status==='Pausado'&&{backgroundColor:'#dcfce7'}]}>
                      <Icon name={selectedOrder.status==='Pausado'?'play-circle-filled':'pause-circle-filled'} size={22} color={selectedOrder.status==='Pausado'?'#22c55e':'#f59e0b'} />
                    </View>
                  </TouchableOpacity>
                )}
                {(selectedOrder.apiStatus!=='cancelled'&&selectedOrder.apiStatus!=='completed')&&(
                  <>
                    <TouchableOpacity
                      style={[styles.floatingActionBtn,(selectedOrder.proposals&&selectedOrder.proposals.length>0)&&styles.floatingActionBtnDisabled]}
                      accessibilityLabel="Editar pedido"
                      disabled={!!(selectedOrder.proposals&&selectedOrder.proposals.length>0)}
                      onPress={() => {
                        if (selectedOrder.proposals && selectedOrder.proposals.length > 0) {
                          showError('Não é possível editar pedidos que já receberam propostas');
                          return;
                        }
                        setShowDetails(false);
                        navigation.navigate('CreateOrder', { editMode: true, orderId: selectedOrder.id, orderData: selectedOrder });
                      }}
                    >
                      <Icon name="edit" size={18} color={(selectedOrder.proposals&&selectedOrder.proposals.length>0)?"#9ca3af":"#4f46e5"} />
                    </TouchableOpacity>
                    <TouchableOpacity
                      style={[styles.floatingActionBtn,styles.floatingActionBtnDanger]}
                      accessibilityLabel="Cancelar pedido"
                      onPress={() => {
                        Alert.alert('Cancelar pedido','Tem certeza que deseja cancelar este pedido? Essa ação não poderá ser desfeita.',[
                          { text: 'Voltar', style: 'cancel' },
                          { text: 'Sim, cancelar', style: 'destructive', onPress: () => handleCancelOrder(selectedOrder.id) },
                        ]);
                      }}
                    >
                      <Icon name="cancel" size={18} color="#ef4444" />
                    </TouchableOpacity>
                  </>
                )}
                {(selectedOrder.apiStatus==='cancelled'||selectedOrder.apiStatus==='completed')&&(
                  <TouchableOpacity style={[styles.floatingActionBtn,styles.floatingActionBtnPrimary]} accessibilityLabel="Recriar pedido" onPress={() => handleRecreateOrder(selectedOrder)}>
                    <Icon name="autorenew" size={18} color="#2563eb" />
                  </TouchableOpacity>
                )}
              </View>
            </ScrollView>
          )}
        </View>


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


        {avatarViewerVisible && avatarViewerImage ? (
          <ImageViewer
            visible={true}
            images={[avatarViewerImage]}
            initialIndex={0}
            onClose={() => setAvatarViewerVisible(false)}
          />
        ) : null}


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
  headerBackground: {
    position: 'absolute',
    top: 0,
    left: 0,
    right: 0,
    height: '50%',
    backgroundColor: '#4f46e5',
  },
  scrollView: {
    flex: 1,
  },
  headerSection: {
    backgroundColor: '#fff',
    paddingHorizontal: 24,
    paddingBottom: 20,
    borderBottomWidth: 1,
    borderBottomColor: '#f3f4f6',
  },
  backArrow: {
    marginBottom: 12,
    width: 40,
    height: 40,
    borderRadius: 20,
    backgroundColor: '#f3f4f6',
    alignItems: 'center',
    justifyContent: 'center',
  },
  headerTitle: {
    fontSize: 24,
    fontWeight: 'bold',
    color: '#111827',
    marginBottom: 4,
  },
  headerSubtitle: {
    color: '#6b7280',
    fontSize: 14,
  },
  content: {
    backgroundColor: '#f3f4f6',
    borderTopLeftRadius: 24,
    borderTopRightRadius: 24,
    padding: 20,
    paddingBottom: 32,
    minHeight: 500,
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
  orderCard: {
    backgroundColor: 'white',
    borderRadius: 16,
    overflow: 'hidden',
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.07,
    shadowRadius: 6,
    elevation: 2,
    marginBottom: 12,
  },
  orderCardStrip: {
    height: 4,
    width: '100%',
  },
  orderCardBody: {
    padding: 16,
  },
  orderCardTitleRow: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    marginBottom: 10,
    gap: 8,
  },
  statusPill: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: 10,
    paddingVertical: 4,
    borderRadius: 20,
    gap: 3,
    flexShrink: 0,
  },
  statusPillText: {
    fontSize: 11,
    fontWeight: '700',
  },
  orderCardMeta: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
    marginBottom: 10,
    flexWrap: 'wrap',
  },
  categoryChip: {
    backgroundColor: '#eef2ff',
    paddingHorizontal: 10,
    paddingVertical: 4,
    borderRadius: 20,
  },
  categoryChipText: {
    color: '#4f46e5',
    fontSize: 12,
    fontWeight: '600',
  },
  budgetChip: {
    color: '#374151',
    fontSize: 13,
    fontWeight: '600',
  },
  proposalBanner: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
    borderRadius: 10,
    paddingHorizontal: 12,
    paddingVertical: 8,
    marginBottom: 12,
    marginTop: 4,
  },
  proposalBannerActive: {
    backgroundColor: '#eff6ff',
  },
  proposalBannerWaiting: {
    backgroundColor: '#fffbeb',
  },
  proposalBannerText: {
    fontSize: 13,
    fontWeight: '600',
  },
  deadlineChip: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 4,
  },
  orderHeader: {
    flexDirection: 'column',
    justifyContent: 'space-between',
    alignItems: 'flex-start',
    marginBottom: 16,
  },
  orderTitle: {
    fontSize: 16,
    fontWeight: '700',
    color: '#111827',
    flex: 1,
  },
  statusContainer: {
    flexDirection: 'row',
    alignItems: 'flex-start',
    gap: 2,
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
    marginRight: 2,
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
    marginBottom: 10,
    gap: 2,
  },
  locationText: {
    color: '#9ca3af',
    fontSize: 12,
    flex: 1,
    marginLeft: 2,
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
    marginTop: 4,
  },
  deadlineText: {
    color: '#6b7280',
    fontSize: 12,
    marginLeft: 3,
  },
  viewDetailsContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 2,
  },
  viewDetailsText: {
    color: '#4f46e5',
    fontWeight: '600',
    fontSize: 13,
  },
  statusFilterBar: {
    backgroundColor: '#fff',
    paddingVertical: 12,
    borderBottomWidth: 1,
    borderBottomColor: '#f3f4f6',
  },
  statusFilterBarContent: {
    paddingHorizontal: 16,
    alignItems: 'center',
  },
  statusFilterChip: {
    paddingHorizontal: 14,
    paddingVertical: 7,
    borderRadius: 20,
    borderWidth: 1,
    marginRight: 8,
  },
  statusFilterChipText: {
    fontSize: 13,
    fontWeight: '500',
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
  modalContainer: {
    flex: 1,
    backgroundColor: '#f3f4f6',
  },
  modalHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    paddingHorizontal: 24,
    paddingBottom: 18,
    backgroundColor: '#4f46e5',
  },
  modalTitle: {
    fontSize: 20,
    fontWeight: 'bold',
    color: '#ffffff',
  },
  modalScroll:{
    flex:1,
  },
  modalContent: {
    backgroundColor:'#f3f4f6',
    borderTopLeftRadius:24,
    borderTopRightRadius:24,
    padding:20,
    minHeight:600,
  },
  demandCard:{
    backgroundColor:'white',
    borderRadius:16,
    overflow:'hidden',
    shadowColor:'#000',
    shadowOffset:{width:0,height:2},
    shadowOpacity:0.06,
    shadowRadius:6,
    elevation:3,
    marginBottom:16,
  },
  heroImageContainer:{
    height:190,
    backgroundColor:'#e5e7eb',
  },
  heroImage:{
    width:'100%',
    height:'100%',
  },
  heroImageCount:{
    position:'absolute',
    top:12,
    left:12,
    backgroundColor:'rgba(17,24,39,0.75)',
    borderRadius:999,
    paddingHorizontal:10,
    paddingVertical:6,
    flexDirection:'row',
    alignItems:'center',
  },
  heroImageCountText:{
    color:'#fff',
    fontWeight:'700',
    marginLeft:6,
    fontSize:12,
  },
  heroZoomHint:{
    position:'absolute',
    bottom:12,
    right:12,
    backgroundColor:'rgba(17,24,39,0.75)',
    borderRadius:999,
    padding:8,
  },
  thumbRow:{
    paddingHorizontal:12,
    paddingVertical:12,
    gap:10,
  },
  thumbItem:{
    width:64,
    height:48,
    borderRadius:10,
    overflow:'hidden',
    borderWidth:2,
    borderColor:'transparent',
  },
  thumbItemActive:{
    borderColor:'#4f46e5',
  },
  thumbImage:{
    width:'100%',
    height:'100%',
  },
  demandTitleArea:{
    paddingHorizontal:16,
    paddingBottom:16,
  },
  demandTitleRow:{
    flexDirection:'row',
    alignItems:'flex-start',
    justifyContent:'space-between',
    marginTop:16,
  },
  demandTitle:{
    fontSize:20,
    fontWeight:'800',
    color:'#111827',
    flex:1,
    marginRight:10,
  },
  demandTitleIcons:{
    flexDirection:'row',
    alignItems:'center',
  },
  badgesRow:{
    flexDirection:'row',
    flexWrap:'wrap',
    marginTop:10,
    gap:8,
  },
  demandCategoryBadge:{
    backgroundColor:'#eef2ff',
    borderRadius:999,
    paddingHorizontal:12,
    paddingVertical:6,
  },
  demandCategoryText:{
    color:'#4f46e5',
    fontWeight:'700',
    fontSize:12,
  },
  demandBudgetBadge:{
    backgroundColor:'#ecfdf5',
  },
  demandBudgetBadgeText:{
    color:'#065f46',
  },
  demandDeadlineBadge:{
    backgroundColor:'#ffedd5',
    flexDirection:'row',
    alignItems:'center',
    gap:6,
  },
  demandDeadlineBadgeText:{
    color:'#c2410c',
  },
  budgetStrip:{
    backgroundColor:'#f9fafb',
    borderTopWidth:1,
    borderTopColor:'#f3f4f6',
    paddingHorizontal:16,
    paddingVertical:12,
    flexDirection:'row',
    justifyContent:'space-between',
    gap:12,
  },
  budgetStripLeft:{
    flexDirection:'row',
    alignItems:'center',
    gap:6,
  },
  budgetStripLabel:{
    color:'#374151',
    fontWeight:'700',
  },
  budgetStripValue:{
    color:'#6b7280',
    flex:1,
    textAlign:'right',
  },
  sectionBlock:{
    paddingHorizontal:16,
    paddingTop:14,
    paddingBottom:16,
  },
  sectionLabel:{
    fontSize:14,
    fontWeight:'800',
    color:'#374151',
    marginBottom:8,
  },
  sectionText:{
    color:'#6b7280',
    lineHeight:20,
  },
  docsSection:{
    paddingHorizontal:16,
    paddingTop:14,
  },
  docItem:{
    backgroundColor:'#f9fafb',
    borderRadius:12,
    padding:12,
    flexDirection:'row',
    alignItems:'center',
    gap:10,
    marginBottom:10,
  },
  docName:{
    flex:1,
    color:'#374151',
    fontWeight:'700',
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
  proposalsBox: {
    marginBottom: 20
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
    fontSize: 24,
    marginRight: 8,
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
  premiumBadge: {
    backgroundColor: '#fef3c7',
    borderRadius: 6,
    paddingHorizontal: 6,
    paddingVertical: 2,
  },
  premiumBadgeText: {
    fontSize: 10,
    fontWeight: '700',
    color: '#92400e',
  },
  verifiedBadge: {
    backgroundColor: '#d1fae5',
    borderRadius: 6,
    paddingHorizontal: 6,
    paddingVertical: 2,
  },
  verifiedBadgeText: {
    fontSize: 10,
    fontWeight: '700',
    color: '#065f46',
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
  proposalDescriptionText: {
    color: '#111827',
    fontSize: 16,
  },
  proposalActions: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 5,
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
  floatingActions:{
    position:'absolute',
    right:24,
    top:24,
    zIndex:10,
    flexDirection:'row',
    alignItems:'center',
    gap:10,
  },
  floatingActionBtn:{
    width:44,
    height:44,
    borderRadius:12,
    alignItems:'center',
    justifyContent:'center',
    backgroundColor:'#ffffff',
    shadowColor:'#000',
    shadowOffset:{width:0,height:1},
    shadowOpacity:0.08,
    shadowRadius:3,
    elevation:2,
  },
  floatingActionBtnDisabled:{
    opacity:0.5,
  },
  floatingActionBtnDanger:{
    backgroundColor:'#fee2e2',
  },
  floatingActionBtnPrimary:{
    backgroundColor:'#dbeafe',
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
    justifyContent: 'center',
    marginTop: 16,
    paddingTop: 16,
    borderTopWidth: 1,
    borderTopColor: '#e5e7eb',
    gap: 12,
  },
  editOrderButton: {
    width: 56,
    height: 44,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    backgroundColor: '#e0e7ff',
    padding: 0,
    borderRadius: 8,
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
    width: 56,
    height: 44,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    backgroundColor: '#fee2e2',
    padding: 0,
    borderRadius: 8,
  },
  recreateOrderButton:{
    width:56,
    height:44,
    flexDirection:'row',
    alignItems:'center',
    justifyContent:'center',
    backgroundColor:'#dbeafe',
    padding:0,
    borderRadius:8,
  },
  deleteOrderButtonText: {
    color: '#ef4444',
    fontWeight: '600',
    fontSize: 16,
  },
  confirmOverlay: {
    flex: 1,
    backgroundColor: 'rgba(0,0,0,0.5)',
    justifyContent: 'center',
    alignItems: 'center',
    paddingHorizontal: 32,
  },
  confirmBox: {
    backgroundColor: '#fff',
    borderRadius: 16,
    padding: 24,
    width: '100%',
  },
  confirmTitle: {
    fontSize: 18,
    fontWeight: '700',
    color: '#111827',
    marginBottom: 8,
  },
  confirmMessage: {
    fontSize: 15,
    color: '#6b7280',
    marginBottom: 24,
  },
  confirmButtons: {
    flexDirection: 'row',
    gap: 12,
  },
  confirmButtonSecondary: {
    flex: 1,
    paddingVertical: 12,
    borderRadius: 10,
    backgroundColor: '#f3f4f6',
    alignItems: 'center',
  },
  confirmButtonSecondaryText: {
    color: '#374151',
    fontWeight: '600',
    fontSize: 15,
  },
  confirmButtonDanger: {
    flex: 1,
    paddingVertical: 12,
    borderRadius: 10,
    backgroundColor: '#fee2e2',
    alignItems: 'center',
  },
  confirmButtonDangerText: {
    color: '#ef4444',
    fontWeight: '600',
    fontSize: 15,
  },
  cancelAcceptanceBtn:{
    flexDirection:'row',
    alignItems:'center',
    justifyContent:'center',
    gap:8,
    backgroundColor:'#fffbeb',
    borderWidth:1,
    borderColor:'#fde68a',
    borderRadius:12,
    paddingVertical:14,
    marginTop:16,
  },
  cancelAcceptanceBtnText:{fontSize:16,fontWeight:'600',color:'#d97706'},
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
    backgroundColor: 'rgba(0,0,0,0.5)',
    borderRadius: 12,
    padding: 4,
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