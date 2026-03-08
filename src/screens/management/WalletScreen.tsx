import { useState, useEffect, useCallback, useRef } from 'react';
import { View, Text, ScrollView, TouchableOpacity, StyleSheet, ActivityIndicator, Alert, Modal, TextInput, Platform, KeyboardAvoidingView, Keyboard } from 'react-native';
import { useNavigation } from '@react-navigation/native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { ArrowLeft, CreditCard, Trash2, Plus, RefreshCw, Wallet, Megaphone, Calendar, Clock, Target, Globe, Zap, X, ChevronRight, Ban, Link, FileText, CheckCircle } from 'lucide-react-native';
import DateTimePicker from '@react-native-community/datetimepicker';
import { useStripe, CardField } from '@stripe/stripe-react-native';
import { useAuth } from '../../contexts/AuthContext';
import { useToast } from '../../contexts/ToastContext';
import { walletService, adService, AdPackage, AdItem, orderService, serviceService, Order, Service } from '../../services/api';
import { formatPrice } from '../../utils/formatters';
import { useStatusBarOverlay } from '../../hooks/useStatusBarOverlay';
import { StatusBarOverlay } from '../../components/StatusBarOverlay';
import { SkeletonBlock } from '../../components/Skeleton';

interface PaymentMethod {
  id: string;
  brand: string;
  last4: string;
  exp_month: number;
  exp_year: number;
}

interface WalletData {
  stripe_customer_id: string;
  balance: number;
  currency: string;
  payment_methods: PaymentMethod[];
}

interface AdCredits {
  total_remaining: number;
  by_type: { single: number; general: number; targeted: number };
  purchases: any[];
}

const BRAND_LABELS: Record<string, string> = {
  visa: 'Visa',
  mastercard: 'Mastercard',
  amex: 'American Express',
  discover: 'Discover',
  elo: 'Elo',
  hipercard: 'Hipercard',
};

const AD_TYPE_CONFIG = {
  single: { label: 'Único', icon: Zap, color: '#f59e0b', bg: '#fef3c7' },
  general: { label: 'Geral', icon: Globe, color: '#3b82f6', bg: '#dbeafe' },
  targeted: { label: 'Categorizado', icon: Target, color: '#10b981', bg: '#d1fae5' },
};

export default function WalletScreen() {
  const navigation = useNavigation<any>();
  const insets = useSafeAreaInsets();
  const { user } = useAuth();
  const { showSuccess, showError } = useToast();
  const { showStatusBarOverlay, statusBarOpacity, handleScroll } = useStatusBarOverlay();
  const [wallet, setWallet] = useState<WalletData | null>(null);
  const [loading, setLoading] = useState(true);
  const [removingId, setRemovingId] = useState<string | null>(null);
  const [showAddCardModal, setShowAddCardModal] = useState(false);
  const [addingCard, setAddingCard] = useState(false);
  const [cardComplete, setCardComplete] = useState(false);
  const { confirmSetupIntent } = useStripe();

  const [adPackages, setAdPackages] = useState<AdPackage[]>([]);
  const [adCredits, setAdCredits] = useState<AdCredits | null>(null);
  const [myAds, setMyAds] = useState<AdItem[]>([]);
  const [loadingAds, setLoadingAds] = useState(false);
  const [purchasingPkg, setPurchasingPkg] = useState<number | null>(null);

  const [showScheduleModal, setShowScheduleModal] = useState(false);
  const [scheduleTitle, setScheduleTitle] = useState('');
  const [scheduleMessage, setScheduleMessage] = useState('');
  const [scheduleDate, setScheduleDate] = useState(new Date());
  const [showDatePicker, setShowDatePicker] = useState(false);
  const [showTimePicker, setShowTimePicker] = useState(false);
  const [selectedPurchaseId, setSelectedPurchaseId] = useState<number | null>(null);
  const [schedulingAd, setSchedulingAd] = useState(false);
  const [cancellingAdId, setCancellingAdId] = useState<number | null>(null);

  const [linkedPostId, setLinkedPostId] = useState<number | null>(null);
  const [linkedPostType, setLinkedPostType] = useState<'order' | 'service' | null>(null);
  const [userOrders, setUserOrders] = useState<Order[]>([]);
  const [userServices, setUserServices] = useState<Service[]>([]);
  const [loadingPosts, setLoadingPosts] = useState(false);
  const [keyboardVisible, setKeyboardVisible] = useState(false);
  const [keyboardHeight, setKeyboardHeight] = useState(0);
  const scheduleScrollRef = useRef<ScrollView>(null);

  useEffect(() => {
    const showSub = Keyboard.addListener('keyboardDidShow', (e) => { setKeyboardVisible(true); setKeyboardHeight(e.endCoordinates.height); });
    const hideSub = Keyboard.addListener('keyboardDidHide', () => { setKeyboardVisible(false); setKeyboardHeight(0); });
    return () => { showSub.remove(); hideSub.remove(); };
  }, []);

  const fetchWallet = useCallback(async () => {
    setLoading(true);
    try {
      const res = await walletService.getWallet();
      if (res.success) setWallet(res.data);
      else showError(res.message || 'Erro ao carregar carteira.');
    } catch (e: any) {
      if (e.response?.status === 404) {
        try {
          await walletService.createWallet();
          const retry = await walletService.getWallet();
          if (retry.success) setWallet(retry.data);
          else showError(retry.message || 'Erro ao carregar carteira.');
        } catch (createErr: any) {
          showError(createErr.response?.data?.message || 'Erro ao criar carteira.');
        }
      } else {
        showError(e.response?.data?.message || 'Erro ao carregar carteira.');
      }
    } finally {
      setLoading(false);
    }
  }, []);

  const FALLBACK_PACKAGES: AdPackage[] = [
    { id: -1, name: 'Anúncio Único', slug: 'single-5', price_cents: 500, ad_count: 1, ad_type: 'single', description: 'Um anúncio avulso enviado para todos os usuários.' },
    { id: -2, name: '2 Anúncios Gerais', slug: 'general-15', price_cents: 1500, ad_count: 2, ad_type: 'general', description: 'Dois anúncios gerais enviados para todos sem filtro.' },
    { id: -3, name: '3 Anúncios Categorizados', slug: 'targeted-25', price_cents: 2500, ad_count: 3, ad_type: 'targeted', description: 'Três anúncios enviados apenas para usuários próximos e com interesse na sua categoria.' },
  ];

  const fetchAds = useCallback(async () => {
    setLoadingAds(true);
    try {
      const results = await Promise.allSettled([
        adService.getPackages(),
        adService.getCredits(),
        adService.getMyAds(),
      ]);

      const pkgResult = results[0];
      if (pkgResult.status === 'fulfilled' && pkgResult.value.success && pkgResult.value.data.length > 0) {
        setAdPackages(pkgResult.value.data);
      } else {
        setAdPackages(FALLBACK_PACKAGES);
      }

      const creditsResult = results[1];
      if (creditsResult.status === 'fulfilled' && creditsResult.value.success) {
        setAdCredits(creditsResult.value.data);
      }

      const adsResult = results[2];
      if (adsResult.status === 'fulfilled' && adsResult.value.success) {
        setMyAds(adsResult.value.data);
      }
    } catch {
      setAdPackages(FALLBACK_PACKAGES);
    } finally {
      setLoadingAds(false);
    }
  }, []);

  useEffect(() => { fetchWallet(); fetchAds(); }, [fetchWallet, fetchAds]);

  const handleRemoveCard = (pmId: string) => {
    Alert.alert('Remover cartão', 'Deseja remover este cartão?', [
      { text: 'Cancelar', style: 'cancel' },
      {
        text: 'Remover',
        style: 'destructive',
        onPress: async () => {
          setRemovingId(pmId);
          try {
            await walletService.removeCard(pmId);
            showSuccess('Cartão removido com sucesso.');
            fetchWallet();
          } catch (e: any) {
            showError(e.response?.data?.message || 'Erro ao remover cartão.');
          } finally {
            setRemovingId(null);
          }
        },
      },
    ]);
  };

  const handleAddCard = async () => {
    if (!cardComplete) {
      showError('Preencha os dados do cartão.');
      return;
    }
    setAddingCard(true);
    try {
      const { success, data } = await walletService.createSetupIntent();
      if (!success || !data?.client_secret) {
        showError('Erro ao iniciar adição de cartão.');
        return;
      }
      const { setupIntent, error } = await confirmSetupIntent(data.client_secret, {
        paymentMethodType: 'Card',
      });
      if (error) {
        showError(error.message || 'Erro ao salvar cartão.');
        return;
      }
      if (setupIntent) {
        showSuccess('Cartão adicionado com sucesso!');
        setShowAddCardModal(false);
        setCardComplete(false);
        fetchWallet();
      }
    } catch (e: any) {
      showError(e?.message || 'Erro ao adicionar cartão.');
    } finally {
      setAddingCard(false);
    }
  };

  const brandLabel = (brand: string) => BRAND_LABELS[brand] || brand.charAt(0).toUpperCase() + brand.slice(1);

  const handlePurchasePackage = (pkg: AdPackage) => {
    if (pkg.id < 0) {
      showError('O sistema de anúncios está sendo configurado. Tente novamente em breve.');
      return;
    }
    if (!wallet || wallet.payment_methods.length === 0) {
      showError('Adicione um cartão primeiro para comprar créditos de anúncio.');
      return;
    }
    const priceFormatted = (pkg.price_cents / 100).toLocaleString('pt-BR', { style: 'currency', currency: 'BRL' });
    Alert.alert(
      'Comprar Pacote',
      `${pkg.name}\n${pkg.description}\n\nValor: ${priceFormatted}\n\nDeseja confirmar a compra?`,
      [
        { text: 'Cancelar', style: 'cancel' },
        {
          text: 'Comprar',
          onPress: async () => {
            setPurchasingPkg(pkg.id);
            try {
              const pmId = wallet.payment_methods[0].id;
              const res = await adService.purchasePackage(pkg.id, pmId);
              if (res.success) {
                showSuccess(res.message || 'Pacote comprado com sucesso!');
                fetchAds();
              } else {
                showError(res.message || 'Erro na compra.');
              }
            } catch (e: any) {
              showError(e.response?.data?.message || e.message || 'Erro ao processar compra.');
            } finally {
              setPurchasingPkg(null);
            }
          },
        },
      ]
    );
  };

  const fetchUserPosts = async () => {
    setLoadingPosts(true);
    try {
      if (user?.profile_type === 'provider') {
        const res = await serviceService.getMyServices();
        if (res.success) setUserServices(res.data || []);
      } else {
        const res = await orderService.getOrders();
        if (res.success) setUserOrders(res.data?.data || []);
      }
    } catch {} finally {
      setLoadingPosts(false);
    }
  };

  const openScheduleModal = (purchaseId: number) => {
    setSelectedPurchaseId(purchaseId);
    setScheduleTitle('');
    setScheduleMessage('');
    setScheduleDate(new Date(Date.now() + 3600000));
    setLinkedPostId(null);
    setLinkedPostType(null);
    setShowScheduleModal(true);
    fetchUserPosts();
  };

  const handleScheduleAd = async () => {
    if (!linkedPostId) {
      showError(user?.profile_type === 'provider'
        ? 'Selecione um serviço para vincular ao anúncio.'
        : 'Selecione um pedido para vincular ao anúncio.');
      return;
    }
    if (!scheduleTitle.trim() || !scheduleMessage.trim()) {
      showError('Preencha o título e a mensagem do anúncio.');
      return;
    }
    if (!selectedPurchaseId) return;
    if (scheduleDate <= new Date()) {
      showError('Selecione uma data e horário futuros.');
      return;
    }
    setSchedulingAd(true);
    try {
      const dateStr = scheduleDate.toISOString().split('T')[0];
      const timeStr = scheduleDate.toTimeString().slice(0, 5);
      let targetCategories: string[] | undefined;
      if (user?.profile_type === 'provider') {
        const selectedService = userServices.find(s => s.id === linkedPostId);
        if (selectedService?.category) targetCategories = [selectedService.category];
      } else {
        const selectedOrder = userOrders.find(o => o.id === linkedPostId);
        if (selectedOrder?.category) targetCategories = [selectedOrder.category];
      }
      const res = await adService.scheduleAd({
        purchase_id: selectedPurchaseId,
        title: scheduleTitle.trim(),
        message: scheduleMessage.trim(),
        scheduled_date: dateStr,
        scheduled_time: timeStr,
        ...(targetCategories ? { target_categories: targetCategories } : {}),
        ...(user?.profile_type === 'provider'
          ? { linked_service_id: linkedPostId }
          : { linked_order_id: linkedPostId }),
      });
      if (res.success) {
        showSuccess(res.message || 'Anúncio agendado!');
        setShowScheduleModal(false);
        fetchAds();
      } else {
        showError(res.message || 'Erro ao agendar.');
      }
    } catch (e: any) {
      showError(e.response?.data?.message || 'Erro ao agendar anúncio.');
    } finally {
      setSchedulingAd(false);
    }
  };

  const handleCancelAd = (adId: number) => {
    Alert.alert('Cancelar Anúncio', 'Deseja cancelar este anúncio? O crédito será devolvido.', [
      { text: 'Não', style: 'cancel' },
      {
        text: 'Sim, cancelar',
        style: 'destructive',
        onPress: async () => {
          setCancellingAdId(adId);
          try {
            const res = await adService.cancelAd(adId);
            if (res.success) {
              showSuccess(res.message || 'Anúncio cancelado.');
              fetchAds();
            }
          } catch (e: any) {
            showError(e.response?.data?.message || 'Erro ao cancelar.');
          } finally {
            setCancellingAdId(null);
          }
        },
      },
    ]);
  };

  const formatAdDate = (date: string, time: string) => {
    const d = new Date(`${date}T${time}`);
    return d.toLocaleDateString('pt-BR') + ' às ' + d.toLocaleTimeString('pt-BR', { hour: '2-digit', minute: '2-digit' });
  };

  const adStatusLabel: Record<string, { label: string; color: string }> = {
    scheduled: { label: 'Agendado', color: '#f59e0b' },
    sent: { label: 'Enviado', color: '#10b981' },
    failed: { label: 'Falhou', color: '#ef4444' },
    cancelled: { label: 'Cancelado', color: '#6b7280' },
  };

  return (
    <View style={styles.container}>
      <View style={styles.headerBackground} />
      <ScrollView
        style={styles.scrollView}
        onScroll={handleScroll}
        scrollEventThrottle={16}
        contentContainerStyle={{ paddingBottom: insets.bottom + 32 }}
        showsVerticalScrollIndicator={false}
      >
        <View style={[styles.header, { paddingTop: insets.top + 16 }]}>
          <TouchableOpacity style={styles.backBtn} onPress={() => navigation.goBack()} activeOpacity={0.8}>
            <ArrowLeft size={22} color="#fff" />
          </TouchableOpacity>
          <Text style={styles.headerTitle}>Carteira & Pagamentos</Text>
          <TouchableOpacity style={styles.refreshBtn} onPress={() => { fetchWallet(); fetchAds(); }} activeOpacity={0.8}>
            <RefreshCw size={18} color="rgba(255,255,255,0.8)" />
          </TouchableOpacity>
        </View>
        <View style={styles.content}>
          {loading ? (
            <>
              <SkeletonBlock width="100%" height={100} borderRadius={16} style={{ marginBottom: 16 }} />
              <SkeletonBlock width="100%" height={72} borderRadius={14} style={{ marginBottom: 10 }} />
              <SkeletonBlock width="100%" height={72} borderRadius={14} style={{ marginBottom: 10 }} />
            </>
          ) : wallet ? (
            <>
              <View style={styles.balanceCard}>
                <View style={styles.balanceIconWrap}>
                  <Wallet size={28} color="#4f46e5" />
                </View>
                <Text style={styles.balanceLabel}>Saldo</Text>
                <Text style={styles.balanceValue}>
                  {((wallet.balance || 0) / 100).toLocaleString('pt-BR', { style: 'currency', currency: 'BRL' })}
                </Text>
                <Text style={styles.balanceNote}>
                  {user?.profile_type === 'provider'
                    ? 'Prestadores terão mensalidade após o período trial.'
                    : 'Use seus créditos para impulsionar pedidos.'}
                </Text>
              </View>

              <Text style={styles.sectionTitle}>Seus cartões</Text>
              {wallet.payment_methods.length === 0 ? (
                <View style={styles.emptyCard}>
                  <CreditCard size={32} color="#9ca3af" />
                  <Text style={styles.emptyText}>Nenhum cartão cadastrado.</Text>
                  <Text style={styles.emptySubText}>Adicione um cartão para facilitar pagamentos.</Text>
                </View>
              ) : (
                wallet.payment_methods.map(pm => (
                  <View key={pm.id} style={styles.cardRow}>
                    <View style={styles.cardIcon}>
                      <CreditCard size={20} color="#4f46e5" />
                    </View>
                    <View style={styles.cardInfo}>
                      <Text style={styles.cardBrand}>{brandLabel(pm.brand)}</Text>
                      <Text style={styles.cardLast4}>•••• •••• •••• {pm.last4}</Text>
                      <Text style={styles.cardExp}>Val: {String(pm.exp_month).padStart(2, '0')}/{pm.exp_year}</Text>
                    </View>
                    <TouchableOpacity
                      style={styles.removeBtn}
                      onPress={() => handleRemoveCard(pm.id)}
                      disabled={removingId === pm.id}
                      activeOpacity={0.7}
                    >
                      {removingId === pm.id ? (
                        <ActivityIndicator size="small" color="#dc2626" />
                      ) : (
                        <Trash2 size={18} color="#dc2626" />
                      )}
                    </TouchableOpacity>
                  </View>
                ))
              )}

              <TouchableOpacity
                style={styles.addCardBtn}
                activeOpacity={0.85}
                onPress={() => setShowAddCardModal(true)}
              >
                <Plus size={18} color="#4f46e5" />
                <Text style={styles.addCardText}>Adicionar cartão</Text>
              </TouchableOpacity>

              <View style={styles.adSectionDivider} />

              <View style={styles.adCreditsHeader}>
                <Megaphone size={22} color="#4f46e5" />
                <Text style={styles.adCreditsTitle}>Créditos de Anúncio</Text>
              </View>

              {adCredits && adCredits.total_remaining > 0 && (
                <View style={styles.creditsOverview}>
                  <Text style={styles.creditsTotal}>{adCredits.total_remaining} anúncio(s) disponível(is)</Text>
                  <View style={styles.creditsByType}>
                    {Object.entries(adCredits.by_type).map(([type, count]) => {
                      if (count === 0) return null;
                      const cfg = AD_TYPE_CONFIG[type as keyof typeof AD_TYPE_CONFIG];
                      const IconComp = cfg.icon;
                      return (
                        <View key={type} style={[styles.creditTypeBadge, { backgroundColor: cfg.bg }]}>
                          <IconComp size={14} color={cfg.color} />
                          <Text style={[styles.creditTypeBadgeText, { color: cfg.color }]}>{count} {cfg.label}</Text>
                        </View>
                      );
                    })}
                  </View>
                </View>
              )}

              {adCredits && adCredits.purchases.length > 0 && (
                <View style={styles.activePurchases}>
                  {adCredits.purchases.map((p: any) => (
                    <TouchableOpacity
                      key={p.id}
                      style={styles.activePurchaseRow}
                      onPress={() => openScheduleModal(p.id)}
                      activeOpacity={0.8}
                    >
                      <View style={styles.activePurchaseInfo}>
                        <Text style={styles.activePurchaseName}>{p.package_name}</Text>
                        <Text style={styles.activePurchaseRemaining}>{p.remaining_ads} restante(s)</Text>
                      </View>
                      <View style={styles.activePurchaseAction}>
                        <Calendar size={16} color="#4f46e5" />
                        <Text style={styles.activePurchaseActionText}>Agendar</Text>
                        <ChevronRight size={16} color="#4f46e5" />
                      </View>
                    </TouchableOpacity>
                  ))}
                </View>
              )}

              <Text style={[styles.sectionTitle, { marginTop: 20 }]}>Comprar Anúncios</Text>
              {loadingAds ? (
                <SkeletonBlock width="100%" height={100} borderRadius={14} />
              ) : (
                adPackages.map(pkg => {
                  const cfg = AD_TYPE_CONFIG[pkg.ad_type as keyof typeof AD_TYPE_CONFIG];
                  const IconComp = cfg.icon;
                  const isPurchasing = purchasingPkg === pkg.id;
                  return (
                    <TouchableOpacity
                      key={pkg.id}
                      style={styles.packageCard}
                      onPress={() => handlePurchasePackage(pkg)}
                      disabled={isPurchasing}
                      activeOpacity={0.85}
                    >
                      <View style={[styles.packageIconWrap, { backgroundColor: cfg.bg }]}>
                        <IconComp size={24} color={cfg.color} />
                      </View>
                      <View style={styles.packageInfo}>
                        <Text style={styles.packageName}>{pkg.name}</Text>
                        <Text style={styles.packageDesc}>{pkg.description}</Text>
                        <View style={styles.packageMeta}>
                          <View style={[styles.packageTypeBadge, { backgroundColor: cfg.bg }]}>
                            <Text style={[styles.packageTypeBadgeText, { color: cfg.color }]}>{cfg.label}</Text>
                          </View>
                          <Text style={styles.packageAdCount}>{pkg.ad_count} anúncio(s)</Text>
                        </View>
                      </View>
                      <View style={styles.packagePriceWrap}>
                        {isPurchasing ? (
                          <ActivityIndicator size="small" color="#4f46e5" />
                        ) : (
                          <Text style={styles.packagePrice}>
                            {(pkg.price_cents / 100).toLocaleString('pt-BR', { style: 'currency', currency: 'BRL' })}
                          </Text>
                        )}
                      </View>
                    </TouchableOpacity>
                  );
                })
              )}

              {myAds.length > 0 && (
                <>
                  <Text style={[styles.sectionTitle, { marginTop: 24 }]}>Meus Anúncios</Text>
                  {myAds.map(ad => {
                    const statusInfo = adStatusLabel[ad.status] || adStatusLabel.scheduled;
                    const cfg = AD_TYPE_CONFIG[ad.ad_type as keyof typeof AD_TYPE_CONFIG] || AD_TYPE_CONFIG.single;
                    const isCancelling = cancellingAdId === ad.id;
                    return (
                      <View key={ad.id} style={styles.adRow}>
                        <View style={styles.adRowHeader}>
                          <Text style={styles.adRowTitle} numberOfLines={1}>{ad.title}</Text>
                          <View style={[styles.adStatusBadge, { backgroundColor: statusInfo.color + '20' }]}>
                            <Text style={[styles.adStatusText, { color: statusInfo.color }]}>{statusInfo.label}</Text>
                          </View>
                        </View>
                        <Text style={styles.adRowMessage} numberOfLines={2}>{ad.message}</Text>
                        <View style={styles.adRowFooter}>
                          <View style={styles.adRowDateWrap}>
                            <Clock size={13} color="#6b7280" />
                            <Text style={styles.adRowDate}>{formatAdDate(ad.scheduled_date, ad.scheduled_time)}</Text>
                          </View>
                          <View style={[styles.adRowTypeBadge, { backgroundColor: cfg.bg }]}>
                            <Text style={[styles.adRowTypeText, { color: cfg.color }]}>{cfg.label}</Text>
                          </View>
                        </View>
                        {ad.status === 'sent' && ad.sent_count > 0 && (
                          <Text style={styles.adSentCount}>Enviado para {ad.sent_count} pessoa(s)</Text>
                        )}
                        {ad.status === 'scheduled' && (
                          <TouchableOpacity
                            style={styles.adCancelBtn}
                            onPress={() => handleCancelAd(ad.id)}
                            disabled={isCancelling}
                          >
                            {isCancelling ? (
                              <ActivityIndicator size="small" color="#ef4444" />
                            ) : (
                              <>
                                <Ban size={14} color="#ef4444" />
                                <Text style={styles.adCancelText}>Cancelar</Text>
                              </>
                            )}
                          </TouchableOpacity>
                        )}
                      </View>
                    );
                  })}
                </>
              )}
            </>
          ) : (
            <View style={styles.emptyCard}>
              <Wallet size={32} color="#9ca3af" />
              <Text style={styles.emptyText}>Carteira não disponível.</Text>
              <Text style={styles.emptySubText}>Entre em contato com o suporte.</Text>
            </View>
          )}
        </View>
      </ScrollView>

      <Modal visible={showScheduleModal} transparent animationType="slide">
        <View style={styles.scheduleModalOverlay}>
          <View style={[styles.scheduleModalContent, { paddingBottom: insets.bottom + 16 }]}>
            <View style={styles.scheduleModalHeader}>
              <Text style={styles.scheduleModalTitle}>Agendar Anúncio</Text>
              <TouchableOpacity onPress={() => setShowScheduleModal(false)}>
                <X size={24} color="#6b7280" />
              </TouchableOpacity>
            </View>

            <ScrollView ref={scheduleScrollRef} showsVerticalScrollIndicator={false} keyboardShouldPersistTaps="handled">
              <Text style={styles.scheduleLabel}>
                {user?.profile_type === 'provider' ? 'Vincular Serviço *' : 'Vincular Pedido *'}
              </Text>
              {loadingPosts ? (
                <ActivityIndicator size="small" color="#4f46e5" style={{ marginVertical: 12 }} />
              ) : (
                <View style={styles.linkedPostList}>
                  {user?.profile_type === 'provider' ? (
                    userServices.filter(s => s.status === 'active').length > 0 ? (
                      userServices.filter(s => s.status === 'active').map(svc => {
                        const isSelected = linkedPostId === svc.id;
                        return (
                          <TouchableOpacity
                            key={svc.id}
                            style={[styles.linkedPostItem, isSelected && styles.linkedPostItemSelected]}
                            onPress={() => {
                              setLinkedPostId(isSelected ? null : svc.id);
                              setLinkedPostType(isSelected ? null : 'service');
                              if (!isSelected && !scheduleTitle.trim()) setScheduleTitle(svc.title);
                              if (!isSelected && !scheduleMessage.trim()) setScheduleMessage(svc.description);
                            }}
                            activeOpacity={0.8}
                          >
                            <View style={styles.linkedPostIcon}>
                              <FileText size={18} color={isSelected ? '#4f46e5' : '#6b7280'} />
                            </View>
                            <View style={styles.linkedPostInfo}>
                              <Text style={[styles.linkedPostTitle, isSelected && { color: '#4f46e5' }]} numberOfLines={1}>{svc.title}</Text>
                              <Text style={styles.linkedPostMeta}>{svc.category} · R$ {formatPrice(Number(svc.price))}</Text>
                            </View>
                            {isSelected && <CheckCircle size={20} color="#4f46e5" />}
                          </TouchableOpacity>
                        );
                      })
                    ) : (
                      <View style={styles.linkedPostEmpty}>
                        <FileText size={24} color="#d1d5db" />
                        <Text style={styles.linkedPostEmptyText}>Você não possui nenhum serviço ativo. Cadastre ao menos um para anunciar.</Text>
                        <TouchableOpacity
                          style={styles.linkedPostCreateBtn}
                          onPress={() => { setShowScheduleModal(false); setTimeout(() => navigation.navigate('Provider', { screen: 'MyServicesTab' }), 350); }}
                        >
                          <Text style={styles.linkedPostCreateText}>Cadastrar Serviço</Text>
                        </TouchableOpacity>
                      </View>
                    )
                  ) : (
                    userOrders.filter(o => o.status === 'open').length > 0 ? (
                      userOrders.filter(o => o.status === 'open').map(order => {
                        const isSelected = linkedPostId === order.id;
                        return (
                          <TouchableOpacity
                            key={order.id}
                            style={[styles.linkedPostItem, isSelected && styles.linkedPostItemSelected]}
                            onPress={() => {
                              setLinkedPostId(isSelected ? null : order.id);
                              setLinkedPostType(isSelected ? null : 'order');
                              if (!isSelected && !scheduleTitle.trim()) setScheduleTitle(order.title);
                              if (!isSelected && !scheduleMessage.trim()) setScheduleMessage(order.description);
                            }}
                            activeOpacity={0.8}
                          >
                            <View style={styles.linkedPostIcon}>
                              <FileText size={18} color={isSelected ? '#4f46e5' : '#6b7280'} />
                            </View>
                            <View style={styles.linkedPostInfo}>
                              <Text style={[styles.linkedPostTitle, isSelected && { color: '#4f46e5' }]} numberOfLines={1}>{order.title}</Text>
                              <Text style={styles.linkedPostMeta}>{order.category} · R$ {formatPrice(Number(order.budget))}</Text>
                            </View>
                            {isSelected && <CheckCircle size={20} color="#4f46e5" />}
                          </TouchableOpacity>
                        );
                      })
                    ) : (
                      <View style={styles.linkedPostEmpty}>
                        <FileText size={24} color="#d1d5db" />
                        <Text style={styles.linkedPostEmptyText}>Você não possui nenhum pedido aberto. Cadastre ao menos um para anunciar.</Text>
                        <TouchableOpacity
                          style={styles.linkedPostCreateBtn}
                          onPress={() => { setShowScheduleModal(false); setTimeout(() => navigation.navigate('Client', { screen: 'Home', params: { screen: 'CreateOrder' } }), 350); }}
                        >
                          <Text style={styles.linkedPostCreateText}>Cadastrar Pedido</Text>
                        </TouchableOpacity>
                      </View>
                    )
                  )}
                </View>
              )}

              <Text style={styles.scheduleLabel}>Título</Text>
              <TextInput
                style={styles.scheduleInput}
                placeholder="Ex: Promoção especial de pintura"
                placeholderTextColor="#9ca3af"
                value={scheduleTitle}
                onChangeText={setScheduleTitle}
                maxLength={100}
                onFocus={(e) => { (e.target as any).measureLayout?.( scheduleScrollRef.current, (_x: number, y: number) => { scheduleScrollRef.current?.scrollTo({ y: y - 10, animated: true }); }, () => {} ); setTimeout(() => scheduleScrollRef.current?.scrollToEnd({ animated: true }), 300); }}
              />

              <Text style={styles.scheduleLabel}>Mensagem</Text>
              <TextInput
                style={[styles.scheduleInput, styles.scheduleTextArea]}
                placeholder="Descreva seu anúncio..."
                placeholderTextColor="#9ca3af"
                value={scheduleMessage}
                onChangeText={setScheduleMessage}
                multiline
                maxLength={300}
                onFocus={() => { setTimeout(() => scheduleScrollRef.current?.scrollToEnd({ animated: true }), 100); setTimeout(() => scheduleScrollRef.current?.scrollToEnd({ animated: true }), 400); }}
              />

              <Text style={styles.scheduleLabel}>Data e Horário</Text>
              <View style={styles.schedulePickerRow}>
                <TouchableOpacity style={styles.schedulePickerBtn} onPress={() => setShowDatePicker(true)}>
                  <Calendar size={18} color="#4f46e5" />
                  <Text style={styles.schedulePickerText}>{scheduleDate.toLocaleDateString('pt-BR')}</Text>
                </TouchableOpacity>
                <TouchableOpacity style={styles.schedulePickerBtn} onPress={() => setShowTimePicker(true)}>
                  <Clock size={18} color="#4f46e5" />
                  <Text style={styles.schedulePickerText}>
                    {scheduleDate.toLocaleTimeString('pt-BR', { hour: '2-digit', minute: '2-digit' })}
                  </Text>
                </TouchableOpacity>
              </View>

              {showDatePicker && (
                Platform.OS === 'ios' ? (
                  <Modal transparent animationType="slide" visible={showDatePicker}>
                    <View style={styles.pickerModalOverlay}>
                      <View style={styles.pickerModalContent}>
                        <View style={styles.pickerToolbar}>
                          <TouchableOpacity onPress={() => setShowDatePicker(false)}>
                            <Text style={styles.pickerToolbarCancel}>Cancelar</Text>
                          </TouchableOpacity>
                          <Text style={styles.pickerToolbarTitle}>Selecionar Data</Text>
                          <TouchableOpacity onPress={() => setShowDatePicker(false)}>
                            <Text style={styles.pickerToolbarDone}>Confirmar</Text>
                          </TouchableOpacity>
                        </View>
                        <DateTimePicker
                          value={scheduleDate}
                          mode="date"
                          display="spinner"
                          minimumDate={new Date()}
                          locale="pt-BR"
                          style={{ width: '100%' }}
                          onChange={(_, date) => {
                            if (date) {
                              const n = new Date(scheduleDate);
                              n.setFullYear(date.getFullYear(), date.getMonth(), date.getDate());
                              setScheduleDate(n);
                            }
                          }}
                        />
                      </View>
                    </View>
                  </Modal>
                ) : (
                  <DateTimePicker
                    value={scheduleDate}
                    mode="date"
                    display="default"
                    minimumDate={new Date()}
                    onChange={(_, date) => {
                      setShowDatePicker(false);
                      if (date) {
                        const n = new Date(scheduleDate);
                        n.setFullYear(date.getFullYear(), date.getMonth(), date.getDate());
                        setScheduleDate(n);
                      }
                    }}
                  />
                )
              )}

              {showTimePicker && (
                Platform.OS === 'ios' ? (
                  <Modal transparent animationType="slide" visible={showTimePicker}>
                    <View style={styles.pickerModalOverlay}>
                      <View style={styles.pickerModalContent}>
                        <View style={styles.pickerToolbar}>
                          <TouchableOpacity onPress={() => setShowTimePicker(false)}>
                            <Text style={styles.pickerToolbarCancel}>Cancelar</Text>
                          </TouchableOpacity>
                          <Text style={styles.pickerToolbarTitle}>Selecionar Horário</Text>
                          <TouchableOpacity onPress={() => setShowTimePicker(false)}>
                            <Text style={styles.pickerToolbarDone}>Confirmar</Text>
                          </TouchableOpacity>
                        </View>
                        <DateTimePicker
                          value={scheduleDate}
                          mode="time"
                          display="spinner"
                          locale="pt-BR"
                          style={{ width: '100%' }}
                          onChange={(_, date) => {
                            if (date) {
                              const n = new Date(scheduleDate);
                              n.setHours(date.getHours(), date.getMinutes());
                              setScheduleDate(n);
                            }
                          }}
                        />
                      </View>
                    </View>
                  </Modal>
                ) : (
                  <DateTimePicker
                    value={scheduleDate}
                    mode="time"
                    display="default"
                    onChange={(_, date) => {
                      setShowTimePicker(false);
                      if (date) {
                        const n = new Date(scheduleDate);
                        n.setHours(date.getHours(), date.getMinutes());
                        setScheduleDate(n);
                      }
                    }}
                  />
                )
              )}
              {keyboardVisible && <View style={{ height: keyboardHeight }} />}
            </ScrollView>

            {!keyboardVisible && (
              <TouchableOpacity
                style={[styles.scheduleConfirmBtn, schedulingAd && { opacity: 0.7 }]}
                onPress={handleScheduleAd}
                disabled={schedulingAd}
              >
                {schedulingAd ? (
                  <ActivityIndicator size="small" color="#fff" />
                ) : (
                  <Text style={styles.scheduleConfirmText}>Agendar Anúncio</Text>
                )}
              </TouchableOpacity>
            )}
          </View>
        </View>
      </Modal>

      <Modal visible={showAddCardModal} transparent animationType="slide">
        <KeyboardAvoidingView
          style={{ flex: 1 }}
          behavior={Platform.OS === 'ios' ? 'padding' : undefined}
        >
          <View style={styles.scheduleModalOverlay}>
            <View style={[styles.scheduleModalContent, { paddingBottom: insets.bottom + 16 }]}>
              <View style={styles.scheduleModalHeader}>
                <Text style={styles.scheduleModalTitle}>Adicionar Cartão</Text>
                <TouchableOpacity onPress={() => { setShowAddCardModal(false); setCardComplete(false); }}>
                  <X size={22} color="#6b7280" />
                </TouchableOpacity>
              </View>
              <Text style={styles.addCardDescription}>Insira os dados do seu cartão de crédito ou débito.</Text>
              <CardField
                postalCodeEnabled={false}
                placeholders={{ number: '4242 4242 4242 4242' }}
                cardStyle={{
                  backgroundColor: '#ffffff',
                  textColor: '#1f2937',
                  borderWidth: 1,
                  borderColor: '#d1d5db',
                  borderRadius: 12,
                  fontSize: 16,
                  placeholderColor: '#9ca3af',
                }}
                style={styles.cardField}
                onCardChange={(details) => setCardComplete(details.complete)}
              />
              <TouchableOpacity
                style={[styles.addCardConfirmBtn, !cardComplete && { opacity: 0.5 }]}
                onPress={handleAddCard}
                disabled={addingCard || !cardComplete}
              >
                {addingCard ? (
                  <ActivityIndicator size="small" color="#fff" />
                ) : (
                  <Text style={styles.addCardConfirmText}>Salvar Cartão</Text>
                )}
              </TouchableOpacity>
            </View>
          </View>
        </KeyboardAvoidingView>
      </Modal>

      <StatusBarOverlay show={showStatusBarOverlay} opacity={statusBarOpacity} forceLight />
    </View>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: '#f3f4f6' },
  headerBackground: {
    position: 'absolute',
    top: '-50%',
    left: 0,
    right: 0,
    height: '100%',
    backgroundColor: '#4f46e5',
  },
  header: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: 20,
    paddingBottom: 20,
    backgroundColor: '#4f46e5',
  },
  backBtn: { padding: 4, marginRight: 12 },
  refreshBtn: { padding: 4, marginLeft: 'auto' as any },
  headerTitle: { flex: 1, fontSize: 20, fontWeight: '700', color: '#fff' },
  scrollView: { flex: 1 },
  content: {
    backgroundColor: '#f3f4f6',
    borderTopLeftRadius: 24,
    borderTopRightRadius: 24,
    padding: 20,
    paddingBottom: 32,
    minHeight: 500,
  },
  balanceCard: {
    backgroundColor: '#fff',
    borderRadius: 16,
    padding: 24,
    alignItems: 'center',
    marginBottom: 24,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.07,
    shadowRadius: 6,
    elevation: 3,
  },
  balanceIconWrap: {
    width: 56,
    height: 56,
    borderRadius: 28,
    backgroundColor: '#e0e7ff',
    justifyContent: 'center',
    alignItems: 'center',
    marginBottom: 12,
  },
  balanceLabel: { fontSize: 13, color: '#6b7280', fontWeight: '600', textTransform: 'uppercase', letterSpacing: 0.4 },
  balanceValue: { fontSize: 32, fontWeight: '700', color: '#111827', marginTop: 4, marginBottom: 8 },
  balanceNote: { fontSize: 13, color: '#6b7280', textAlign: 'center', lineHeight: 18 },
  sectionTitle: { fontSize: 15, fontWeight: '700', color: '#111827', marginBottom: 12 },
  emptyCard: {
    backgroundColor: '#fff',
    borderRadius: 14,
    padding: 28,
    alignItems: 'center',
    marginBottom: 16,
    borderWidth: 1,
    borderColor: '#e5e7eb',
  },
  emptyText: { fontSize: 16, fontWeight: '600', color: '#374151', marginTop: 12, marginBottom: 4 },
  emptySubText: { fontSize: 13, color: '#9ca3af', textAlign: 'center' },
  cardRow: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#fff',
    borderRadius: 14,
    padding: 16,
    marginBottom: 10,
    borderWidth: 1,
    borderColor: '#e5e7eb',
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 1 },
    shadowOpacity: 0.05,
    shadowRadius: 3,
    elevation: 1,
  },
  cardIcon: {
    width: 40,
    height: 40,
    borderRadius: 10,
    backgroundColor: '#e0e7ff',
    justifyContent: 'center',
    alignItems: 'center',
    marginRight: 14,
  },
  cardInfo: { flex: 1 },
  cardBrand: { fontSize: 14, fontWeight: '700', color: '#111827' },
  cardLast4: { fontSize: 13, color: '#6b7280', marginTop: 2 },
  cardExp: { fontSize: 12, color: '#9ca3af', marginTop: 1 },
  removeBtn: { padding: 8 },
  addCardBtn: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    backgroundColor: '#fff',
    borderRadius: 14,
    borderWidth: 1.5,
    borderColor: '#4f46e5',
    borderStyle: 'dashed',
    paddingVertical: 14,
    marginTop: 4,
    gap: 8,
  },
  addCardText: { fontSize: 15, fontWeight: '600', color: '#4f46e5' },

  adSectionDivider: {
    height: 1,
    backgroundColor: '#e5e7eb',
    marginVertical: 24,
  },
  adCreditsHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 10,
    marginBottom: 16,
  },
  adCreditsTitle: {
    fontSize: 18,
    fontWeight: '700',
    color: '#111827',
  },
  creditsOverview: {
    backgroundColor: '#fff',
    borderRadius: 14,
    padding: 16,
    marginBottom: 16,
    borderWidth: 1,
    borderColor: '#e5e7eb',
  },
  creditsTotal: {
    fontSize: 16,
    fontWeight: '700',
    color: '#111827',
    marginBottom: 10,
  },
  creditsByType: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: 8,
  },
  creditTypeBadge: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 5,
    borderRadius: 12,
    paddingHorizontal: 10,
    paddingVertical: 5,
  },
  creditTypeBadgeText: {
    fontSize: 13,
    fontWeight: '600',
  },
  activePurchases: {
    gap: 8,
    marginBottom: 8,
  },
  activePurchaseRow: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    backgroundColor: '#fff',
    borderRadius: 14,
    padding: 14,
    borderWidth: 1,
    borderColor: '#e5e7eb',
  },
  activePurchaseInfo: { flex: 1 },
  activePurchaseName: { fontSize: 14, fontWeight: '600', color: '#111827' },
  activePurchaseRemaining: { fontSize: 12, color: '#6b7280', marginTop: 2 },
  activePurchaseAction: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 4,
    backgroundColor: '#eef2ff',
    borderRadius: 10,
    paddingHorizontal: 10,
    paddingVertical: 6,
  },
  activePurchaseActionText: { fontSize: 13, fontWeight: '600', color: '#4f46e5' },
  packageCard: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#fff',
    borderRadius: 14,
    padding: 16,
    marginBottom: 12,
    borderWidth: 1,
    borderColor: '#e5e7eb',
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 1 },
    shadowOpacity: 0.05,
    shadowRadius: 3,
    elevation: 1,
  },
  packageIconWrap: {
    width: 48,
    height: 48,
    borderRadius: 12,
    justifyContent: 'center',
    alignItems: 'center',
    marginRight: 14,
  },
  packageInfo: { flex: 1 },
  packageName: { fontSize: 15, fontWeight: '700', color: '#111827' },
  packageDesc: { fontSize: 12, color: '#6b7280', marginTop: 2, lineHeight: 16 },
  packageMeta: { flexDirection: 'row', alignItems: 'center', gap: 8, marginTop: 6 },
  packageTypeBadge: { borderRadius: 8, paddingHorizontal: 8, paddingVertical: 2 },
  packageTypeBadgeText: { fontSize: 11, fontWeight: '600' },
  packageAdCount: { fontSize: 11, color: '#9ca3af' },
  packagePriceWrap: { marginLeft: 12 },
  packagePrice: { fontSize: 18, fontWeight: '700', color: '#4f46e5' },
  adRow: {
    backgroundColor: '#fff',
    borderRadius: 14,
    padding: 14,
    marginBottom: 10,
    borderWidth: 1,
    borderColor: '#e5e7eb',
  },
  adRowHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    marginBottom: 6,
  },
  adRowTitle: { fontSize: 15, fontWeight: '700', color: '#111827', flex: 1, marginRight: 8 },
  adStatusBadge: { borderRadius: 8, paddingHorizontal: 8, paddingVertical: 3 },
  adStatusText: { fontSize: 11, fontWeight: '600' },
  adRowMessage: { fontSize: 13, color: '#6b7280', lineHeight: 18, marginBottom: 8 },
  adRowFooter: { flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between' },
  adRowDateWrap: { flexDirection: 'row', alignItems: 'center', gap: 4 },
  adRowDate: { fontSize: 12, color: '#6b7280' },
  adRowTypeBadge: { borderRadius: 8, paddingHorizontal: 8, paddingVertical: 2 },
  adRowTypeText: { fontSize: 11, fontWeight: '600' },
  adSentCount: { fontSize: 12, color: '#10b981', marginTop: 6 },
  adCancelBtn: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: 6,
    marginTop: 10,
    paddingVertical: 8,
    borderRadius: 8,
    borderWidth: 1,
    borderColor: '#fecaca',
  },
  adCancelText: { fontSize: 13, fontWeight: '600', color: '#ef4444' },
  linkedPostList: {
    gap: 8,
    marginBottom: 4,
  },
  linkedPostItem: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#f9fafb',
    borderRadius: 12,
    padding: 12,
    borderWidth: 1.5,
    borderColor: '#e5e7eb',
  },
  linkedPostItemSelected: {
    borderColor: '#4f46e5',
    backgroundColor: '#f5f3ff',
  },
  linkedPostIcon: {
    width: 36,
    height: 36,
    borderRadius: 10,
    backgroundColor: '#e0e7ff',
    justifyContent: 'center',
    alignItems: 'center',
    marginRight: 10,
  },
  linkedPostInfo: { flex: 1, marginRight: 8 },
  linkedPostTitle: { fontSize: 14, fontWeight: '600', color: '#111827' },
  linkedPostMeta: { fontSize: 12, color: '#6b7280', marginTop: 2 },
  linkedPostEmpty: {
    alignItems: 'center',
    padding: 20,
    backgroundColor: '#f9fafb',
    borderRadius: 12,
    borderWidth: 1,
    borderColor: '#e5e7eb',
  },
  linkedPostEmptyText: { fontSize: 13, color: '#9ca3af', marginTop: 8, textAlign: 'center' },
  linkedPostCreateBtn: {
    marginTop: 12,
    backgroundColor: '#4f46e5',
    borderRadius: 10,
    paddingHorizontal: 20,
    paddingVertical: 10,
  },
  linkedPostCreateText: { fontSize: 14, fontWeight: '600', color: '#fff' },
  scheduleModalOverlay: {
    flex: 1,
    backgroundColor: 'rgba(0,0,0,0.5)',
    justifyContent: 'flex-end',
  },
  scheduleModalContent: {
    backgroundColor: '#fff',
    borderTopLeftRadius: 20,
    borderTopRightRadius: 20,
    padding: 20,
    maxHeight: '85%',
  },
  scheduleModalHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    marginBottom: 20,
  },
  scheduleModalTitle: { fontSize: 18, fontWeight: '700', color: '#111827' },
  scheduleLabel: { fontSize: 14, fontWeight: '600', color: '#374151', marginBottom: 6, marginTop: 12 },
  scheduleInput: {
    backgroundColor: '#f3f4f6',
    borderRadius: 12,
    padding: 14,
    fontSize: 15,
    color: '#1f2937',
  },
  scheduleTextArea: {
    minHeight: 80,
    textAlignVertical: 'top',
  },
  schedulePickerRow: {
    flexDirection: 'row',
    gap: 12,
    marginTop: 4,
  },
  schedulePickerBtn: {
    flex: 1,
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
    backgroundColor: '#f3f4f6',
    borderRadius: 12,
    padding: 14,
  },
  schedulePickerText: { fontSize: 15, color: '#4b5563' },
  scheduleConfirmBtn: {
    backgroundColor: '#4f46e5',
    borderRadius: 12,
    paddingVertical: 16,
    alignItems: 'center',
    marginTop: 20,
  },
  scheduleConfirmText: { fontSize: 16, fontWeight: '700', color: '#fff' },
  pickerModalOverlay: {
    flex: 1,
    justifyContent: 'flex-end',
    backgroundColor: 'rgba(0,0,0,0.4)',
  },
  pickerModalContent: {
    backgroundColor: '#ffffff',
    borderTopLeftRadius: 20,
    borderTopRightRadius: 20,
    paddingBottom: 30,
    overflow: 'hidden',
  },
  pickerToolbar: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingHorizontal: 20,
    paddingVertical: 14,
    borderBottomWidth: 1,
    borderBottomColor: '#e5e7eb',
  },
  pickerToolbarTitle: { fontSize: 15, fontWeight: '600', color: '#111827' },
  pickerToolbarCancel: { fontSize: 15, color: '#6b7280' },
  pickerToolbarDone: { fontSize: 15, fontWeight: '700', color: '#4f46e5' },
  addCardDescription: {
    fontSize: 14,
    color: '#6b7280',
    marginBottom: 16,
  },
  cardField: {
    width: '100%',
    height: 50,
    marginBottom: 20,
  },
  addCardConfirmBtn: {
    backgroundColor: '#4f46e5',
    borderRadius: 12,
    paddingVertical: 16,
    alignItems: 'center',
  },
  addCardConfirmText: {
    color: '#ffffff',
    fontWeight: '700',
    fontSize: 16,
  },
});
