import {
  View, Text, ScrollView, TouchableOpacity, Image,
  StyleSheet, RefreshControl, FlatList, Dimensions, Platform,
} from 'react-native';
import { useNavigation, useRoute, useFocusEffect } from '@react-navigation/native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import React, { useEffect, useState, useCallback, useRef } from 'react';
import Icon from 'react-native-vector-icons/MaterialIcons';
import { useAuth } from '../../contexts/AuthContext';
import { useStatusBarOverlay } from '../../hooks/useStatusBarOverlay';
import { StatusBarOverlay } from '../../components/StatusBarOverlay';
import { orderService, Order as ApiOrder } from '../../services/api';
import { formatPrice } from '../../utils/formatters';

const { width: SCREEN_WIDTH } = Dimensions.get('window');

/* ─── Categories ─────────────────────────────────────────────── */

const HOME_CATEGORIES = [
  { name: 'Eletricista',      icon: 'electrical-services', bg: '#fef9c3', color: '#ca8a04' },
  { name: 'Encanador',        icon: 'plumbing',             bg: '#dbeafe', color: '#2563eb' },
  { name: 'Diarista',         icon: 'cleaning-services',    bg: '#dcfce7', color: '#16a34a' },
  { name: 'Pintor',           icon: 'format-paint',         bg: '#fce7f3', color: '#db2777' },
  { name: 'Pedreiro',         icon: 'construction',         bg: '#ffedd5', color: '#ea580c' },
  { name: 'Jardinagem',       icon: 'yard',                 bg: '#d1fae5', color: '#059669' },
  { name: 'Assist. Técnica',  icon: 'phonelink-setup',      bg: '#ede9fe', color: '#7c3aed' },
  { name: 'Ver todos',        icon: 'apps',                 bg: '#f3f4f6', color: '#4f46e5' },
] as const;

/* ─── Banners ────────────────────────────────────────────────── */

const BANNERS = [
  {
    id: '1',
    eyebrow: 'Rápido e fácil',
    title: 'Solicite agora e receba propostas em minutos',
    gradient: ['#4f46e5', '#7c3aed'] as const,
    icon: 'flash-on',
    cta: 'Criar pedido',
    action: 'create',
  },
  {
    id: '2',
    eyebrow: 'Contrate com segurança',
    title: 'Todos os profissionais verificados e avaliados',
    gradient: ['#0891b2', '#0e7490'] as const,
    icon: 'verified-user',
    cta: 'Saiba mais',
    action: null,
  },
  {
    id: '3',
    eyebrow: 'Tudo em um lugar',
    title: 'Acompanhe pedidos, propostas e avaliações',
    gradient: ['#059669', '#047857'] as const,
    icon: 'track-changes',
    cta: 'Meus pedidos',
    action: 'orders',
  },
];

/* ─── Helpers ────────────────────────────────────────────────── */

function getGreeting() {
  const h = new Date().getHours();
  if (h >= 5 && h < 12) return 'Bom dia';
  if (h < 18) return 'Boa tarde';
  return 'Boa noite';
}

function statusLabel(status: string) {
  const map: Record<string, { label: string; color: string; bg: string }> = {
    pending:     { label: 'Pendente',     color: '#d97706', bg: '#fef3c7' },
    open:        { label: 'Aberto',       color: '#2563eb', bg: '#dbeafe' },
    in_progress: { label: 'Em andamento', color: '#059669', bg: '#d1fae5' },
    completed:   { label: 'Concluído',    color: '#6b7280', bg: '#f3f4f6' },
    cancelled:   { label: 'Cancelado',    color: '#dc2626', bg: '#fee2e2' },
  };
  return map[status] ?? { label: status, color: '#6b7280', bg: '#f3f4f6' };
}

/* ─── Main screen ────────────────────────────────────────────── */

export default function HomeScreen() {
  const navigation  = useNavigation<any>();
  const route       = useRoute();
  const insets      = useSafeAreaInsets();
  const { user, refreshUser } = useAuth();
  const { showStatusBarOverlay, statusBarOpacity, handleScroll } = useStatusBarOverlay();

  const [refreshing, setRefreshing]       = useState(false);
  const [recentOrders, setRecentOrders]   = useState<ApiOrder[]>([]);
  const [loadingOrders, setLoadingOrders] = useState(true);
  const [bannerIndex, setBannerIndex]     = useState(0);

  const bannerRef   = useRef<FlatList>(null);
  const bannerTimer = useRef<ReturnType<typeof setInterval> | null>(null);

  const routeParams = (route.params as any) || {};
  const userType    = routeParams.userType  || 'client';
  const clientId    = routeParams.clientId  || null;
  const clientInfo  = routeParams.clientInfo || {};

  const getSubtitle = () => {
    const hour = new Date().getHours();
    if (hour >= 5 && hour < 12) return 'Bom dia! Precisa de algum profissional?';
    if (hour >= 12 && hour < 18) return 'Boa tarde! Encontre o profissional certo';
    if (hour >= 18 && hour < 23) return 'Boa noite! Resolva o que ficou pendente';
    return 'Profissionais disponíveis agora para você';
  };

  useEffect(() => {
    bannerTimer.current = setInterval(() => {
      setBannerIndex(prev => {
        const next = (prev + 1) % BANNERS.length;
        bannerRef.current?.scrollToIndex({ index: next, animated: true });
        return next;
      });
    }, 4000);
    return () => { if (bannerTimer.current) clearInterval(bannerTimer.current); };
  }, []);

  const fetchRecentOrders = async () => {
    try {
      setLoadingOrders(true);
      const res = await orderService.getRecentOrders();
      if (res.success && Array.isArray(res.data)) setRecentOrders(res.data);
    } catch { /* ignore */ }
    finally { setLoadingOrders(false); }
  };

  useFocusEffect(useCallback(() => {
    if (user?.id) fetchRecentOrders();
    else setLoadingOrders(false);
  }, [user?.id]));

  const onRefresh = async () => {
    setRefreshing(true);
    await Promise.all([refreshUser(), fetchRecentOrders()]).catch(() => {});
    setRefreshing(false);
  };

  const myOrders     = recentOrders.filter(
    (o: any) => o.client_id?.toString() === user?.id?.toString()
  );
  const activeOrders = myOrders.filter((o: any) =>
    ['open', 'in_progress'].includes(o.status)
  );
  const pastOrders = myOrders
    .filter((o: any) => ['completed', 'cancelled'].includes(o.status))
    .slice(0, 3);
  const allProposals = myOrders
    .flatMap((o) => (o.proposals || []).map((p: any) => ({
      ...p, orderTitle: o.title, orderId: o.id,
    })))
    .sort((a: any, b: any) =>
      new Date(b.created_at || 0).getTime() - new Date(a.created_at || 0).getTime()
    )
    .slice(0, 5);

  const goToOrders = () =>
    navigation.navigate('MyOrdersTab', {
      screen: 'MyOrders',
      params: { userType, clientId, clientInfo },
    });

  const goToCreateOrder = (category?: string) =>
    navigation.navigate('CreateOrder', {
      userType, clientId, clientInfo,
      ...(category ? { prefillCategory: category } : {}),
    });

  const handleBannerAction = (action: string | null) => {
    if (action === 'create') goToCreateOrder();
    else if (action === 'orders') goToOrders();
  };

  /* ─── Render ─────────────────────────────────────────────── */

  return (
    <View style={styles.root}>
      <ScrollView
        style={styles.scroll}
        onScroll={handleScroll}
        scrollEventThrottle={16}
        showsVerticalScrollIndicator={false}
        refreshControl={
          <RefreshControl
            refreshing={refreshing}
            onRefresh={onRefresh}
            colors={['#4f46e5']}
            tintColor="#4f46e5"
            progressViewOffset={insets.top + 56}
          />
        }
      >
        {/* ── Header ── */}
        <View style={[styles.header, { paddingTop: insets.top + 14 }]}>
          <View style={styles.headerTop}>
            <View style={styles.headerLeft}>
              <Text style={styles.greeting}>{getGreeting()}, {(user?.name || 'Usuário').split(' ')[0]}!</Text>
              <Text style={styles.headerSub}>{getSubtitle()}</Text>
            </View>
            <TouchableOpacity
              style={styles.notifBtn}
              onPress={() => navigation.navigate('MyOrdersTab')}
              hitSlop={{ top: 8, bottom: 8, left: 8, right: 8 }}
            >
              <Icon name="notifications-none" size={24} color="#111827" />
              {allProposals.length > 0 && <View style={styles.notifDot} />}
            </TouchableOpacity>
          </View>

          {/* Search bar */}
          <TouchableOpacity
            style={styles.searchBar}
            onPress={() => goToCreateOrder()}
            activeOpacity={0.85}
          >
            <Icon name="search" size={20} color="#9ca3af" />
            <Text style={styles.searchPlaceholder}>Que serviço você precisa?</Text>
          </TouchableOpacity>
        </View>

        {/* ── Category Grid ── */}
        <View style={styles.section}>
          <View style={styles.categoryGrid}>
            {HOME_CATEGORIES.map((cat) => (
              <TouchableOpacity
                key={cat.name}
                style={styles.categoryItem}
                onPress={() => {
                  if (cat.name === 'Ver todos') navigation.navigate('SearchTab');
                  else goToCreateOrder(cat.name);
                }}
                activeOpacity={0.75}
              >
                <View style={[styles.categoryIconBg, { backgroundColor: cat.bg }]}>
                  <Icon name={cat.icon} size={28} color={cat.color} />
                </View>
                <Text style={styles.categoryLabel} numberOfLines={2}>{cat.name}</Text>
              </TouchableOpacity>
            ))}
          </View>
        </View>

        {/* ── Banner carousel ── */}
        <View style={styles.bannerSection}>
          <FlatList
            ref={bannerRef}
            data={BANNERS}
            keyExtractor={(b) => b.id}
            horizontal
            pagingEnabled
            showsHorizontalScrollIndicator={false}
            scrollEnabled={false}
            onMomentumScrollEnd={(e) => {
              const idx = Math.round(e.nativeEvent.contentOffset.x / (SCREEN_WIDTH - 32));
              setBannerIndex(idx);
            }}
            renderItem={({ item: b }) => (
              <View style={[styles.bannerCard, { backgroundColor: b.gradient[0] }]}>
                {/* Decorative circles */}
                <View style={styles.bannerCircle1} />
                <View style={styles.bannerCircle2} />

                <View style={styles.bannerContent}>
                  <View style={styles.bannerIconBg}>
                    <Icon name={b.icon} size={26} color="#fff" />
                  </View>
                  <Text style={styles.bannerEyebrow}>{b.eyebrow}</Text>
                  <Text style={styles.bannerTitle}>{b.title}</Text>
                  <TouchableOpacity
                    style={styles.bannerCtaBtn}
                    onPress={() => handleBannerAction(b.action)}
                    activeOpacity={0.85}
                  >
                    <Text style={styles.bannerCtaText}>{b.cta}</Text>
                    <Icon name="arrow-forward" size={14} color="#fff" />
                  </TouchableOpacity>
                </View>
              </View>
            )}
          />
          <View style={styles.bannerDots}>
            {BANNERS.map((b, i) => (
              <View key={b.id} style={[styles.dot, i === bannerIndex && styles.dotActive]} />
            ))}
          </View>
        </View>

        {/* ── Trust bar ── */}
        <View style={styles.trustBar}>
          <TrustItem icon="star" label="4.8 média" />
          <View style={styles.trustDivider} />
          <TrustItem icon="check-circle" label="Prestadores verificados" />
          <View style={styles.trustDivider} />
          <TrustItem icon="bolt" label="Propostas em minutos" />
        </View>

        {/* ── Active orders ── */}
        {!loadingOrders && activeOrders.length > 0 && (
          <View style={styles.section}>
            <SectionHeader title="Pedidos ativos" onPress={goToOrders} />
            {activeOrders.map((order: any) => {
              const st = statusLabel(order.status);
              return (
                <TouchableOpacity
                  key={order.id}
                  style={styles.pastOrderRow}
                  onPress={goToOrders}
                  activeOpacity={0.8}
                >
                  <View style={[styles.pastOrderIconBg, { backgroundColor: st.bg }]}>
                    <Icon name="assignment" size={18} color={st.color} />
                  </View>
                  <View style={{ flex: 1 }}>
                    <Text style={styles.pastOrderTitle} numberOfLines={1}>{order.title}</Text>
                    <Text style={styles.pastOrderCategory} numberOfLines={1}>{order.category}</Text>
                  </View>
                  {order.proposals?.length > 0 ? (
                    <View style={styles.orderProposalPill}>
                      <Icon name="gavel" size={12} color="#4f46e5" />
                      <Text style={styles.orderProposalCount}>
                        {order.proposals.length}
                      </Text>
                    </View>
                  ) : (
                    <View style={[styles.pastOrderBadge, { backgroundColor: st.bg }]}>
                      <Text style={[styles.pastOrderBadgeText, { color: st.color }]}>{st.label}</Text>
                    </View>
                  )}
                  <Icon name="chevron-right" size={16} color="#d1d5db" />
                </TouchableOpacity>
              );
            })}
          </View>
        )}

        {/* ── Recent proposals ── */}
        {!loadingOrders && allProposals.length > 0 && (
          <View style={styles.section}>
            <SectionHeader title="Últimas propostas" onPress={goToOrders} />
            {allProposals.map((p: any) => (
              <ProposalRow key={`${p.orderId}-${p.id}`} proposal={p} onPress={goToOrders} />
            ))}
          </View>
        )}

        {/* ── Past orders ── */}
        {!loadingOrders && pastOrders.length > 0 && (
          <View style={styles.section}>
            <SectionHeader title="Histórico" onPress={goToOrders} />
            {pastOrders.map((order: any) => {
              const st = statusLabel(order.status);
              return (
                <TouchableOpacity
                  key={order.id}
                  style={styles.pastOrderRow}
                  onPress={goToOrders}
                  activeOpacity={0.8}
                >
                  <View style={[styles.pastOrderIconBg, { backgroundColor: st.bg }]}>
                    <Icon name={order.status === 'completed' ? 'check-circle' : 'cancel'} size={18} color={st.color} />
                  </View>
                  <View style={{ flex: 1 }}>
                    <Text style={styles.pastOrderTitle} numberOfLines={1}>{order.title}</Text>
                    <Text style={styles.pastOrderCategory} numberOfLines={1}>{order.category}</Text>
                  </View>
                  <View style={[styles.pastOrderBadge, { backgroundColor: st.bg }]}>
                    <Text style={[styles.pastOrderBadgeText, { color: st.color }]}>{st.label}</Text>
                  </View>
                  <Icon name="chevron-right" size={16} color="#d1d5db" />
                </TouchableOpacity>
              );
            })}
          </View>
        )}

        {/* ── Empty state ── */}
        {!loadingOrders && myOrders.length === 0 && (
          <View style={styles.section}>
            <TouchableOpacity style={styles.emptyCard} onPress={() => goToCreateOrder()} activeOpacity={0.85}>
              <View style={[styles.emptyIconBg, { backgroundColor: '#4f46e5' }]}>
                <Icon name="add" size={30} color="#fff" />
              </View>
              <Text style={styles.emptyTitle}>Crie seu primeiro pedido</Text>
              <Text style={styles.emptySub}>
                Descreva o serviço e receba propostas de profissionais verificados em minutos, de graça
              </Text>
              <View style={styles.emptyBtn}>
                <Icon name="flash-on" size={16} color="#fff" style={{ marginRight: 6 }} />
                <Text style={styles.emptyBtnText}>Solicitar serviço agora</Text>
              </View>
            </TouchableOpacity>
          </View>
        )}

        <View style={{ height: insets.bottom + 28 }} />
      </ScrollView>

      <StatusBarOverlay show={showStatusBarOverlay} opacity={statusBarOpacity} backgroundColor="#fff" />
    </View>
  );
}

/* ─── Sub-components ─────────────────────────────────────────── */

function TrustItem({ icon, label }: Readonly<{ icon: string; label: string }>) {
  return (
    <View style={styles.trustItem}>
      <Icon name={icon} size={14} color="#4f46e5" />
      <Text style={styles.trustLabel}>{label}</Text>
    </View>
  );
}

function SectionHeader({ title, onPress }: Readonly<{ title: string; onPress: () => void }>) {
  return (
    <View style={styles.sectionHeader}>
      <Text style={styles.sectionTitle}>{title}</Text>
      <TouchableOpacity onPress={onPress} hitSlop={{ top: 8, bottom: 8, left: 8, right: 8 }}>
        <Text style={styles.sectionLink}>Ver mais</Text>
      </TouchableOpacity>
    </View>
  );
}

function ProposalRow({ proposal, onPress }: Readonly<{ proposal: any; onPress: () => void }>) {
  const avatarSrc = proposal.provider?.avatar_base64 || proposal.provider_avatar_base64;
  let avatarUri: string | null = null;
  if (avatarSrc) {
    avatarUri = avatarSrc.startsWith('data:') ? avatarSrc : `data:image/jpeg;base64,${avatarSrc}`;
  }

  return (
    <TouchableOpacity style={styles.proposalRow} onPress={onPress} activeOpacity={0.8}>
      {avatarUri ? (
        <Image source={{ uri: avatarUri }} style={styles.proposalAvatar} />
      ) : (
        <View style={[styles.proposalAvatar, styles.proposalAvatarFallback]}>
          <Icon name="person" size={18} color="#9ca3af" />
        </View>
      )}
      <View style={{ flex: 1 }}>
        <Text style={styles.proposalName} numberOfLines={1}>
          {proposal.provider?.name || proposal.provider_name || 'Prestador'}
        </Text>
        <Text style={styles.proposalOrder} numberOfLines={1}>{proposal.orderTitle}</Text>
      </View>
      <View style={styles.proposalRight}>
        <Text style={styles.proposalPrice}>R$ {formatPrice(proposal.price)}</Text>
        <Text style={styles.proposalDeadline}>{proposal.deadline} dias</Text>
      </View>
      <Icon name="chevron-right" size={18} color="#d1d5db" />
    </TouchableOpacity>
  );
}

/* ─── Styles ─────────────────────────────────────────────────── */

const styles = StyleSheet.create({
  root:   { flex: 1, backgroundColor: '#f3f4f6' },
  scroll: { flex: 1 },

  /* Header */
  header: {
    backgroundColor: '#fff',
    paddingHorizontal: 20,
    paddingBottom: 16,
    borderBottomWidth: 1,
    borderBottomColor: '#f3f4f6',
    ...Platform.select({
      ios: {
        shadowColor: '#000',
        shadowOffset: { width: 0, height: 2 },
        shadowOpacity: 0.06,
        shadowRadius: 6,
      },
      android: { elevation: 3 },
    }),
  },
  headerTop: {
    flexDirection: 'row',
    alignItems: 'flex-start',
    justifyContent: 'space-between',
    marginBottom: 14,
  },
  headerLeft:  { flex: 1 },
  greeting:    { fontSize: 22, fontWeight: '800', color: '#111827', letterSpacing: -0.3 },
  headerSub:   { fontSize: 13, color: '#6b7280', marginTop: 2 },
  notifBtn:    { position: 'relative', padding: 4, marginTop: 2 },
  notifDot: {
    position: 'absolute', top: 4, right: 4,
    width: 8, height: 8, borderRadius: 4,
    backgroundColor: '#ef4444', borderWidth: 1.5, borderColor: '#fff',
  },

  /* Search bar */
  searchBar: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 10,
    backgroundColor: '#f3f4f6',
    borderRadius: 14,
    paddingHorizontal: 14,
    paddingVertical: 13,
    borderWidth: 1,
    borderColor: '#e5e7eb',
  },
  searchPlaceholder: { fontSize: 15, color: '#9ca3af', flex: 1 },

  /* Section spacing */
  section: { paddingHorizontal: 16, marginTop: 22 },

  /* Category grid */
  categoryGrid: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: 6,
  },
  categoryItem: {
    width: (SCREEN_WIDTH - 32 - 18) / 4,
    alignItems: 'center',
    paddingVertical: 8,
  },
  categoryIconBg: {
    width: 60,
    height: 60,
    borderRadius: 18,
    alignItems: 'center',
    justifyContent: 'center',
    marginBottom: 7,
  },
  categoryLabel: {
    fontSize: 11,
    fontWeight: '600',
    color: '#374151',
    textAlign: 'center',
    lineHeight: 14,
  },

  /* Banner */
  bannerSection: { marginTop: 22 },
  bannerCard: {
    width: SCREEN_WIDTH - 32,
    marginHorizontal: 16,
    borderRadius: 20,
    padding: 22,
    minHeight: 160,
    overflow: 'hidden',
    position: 'relative',
  },
  bannerCircle1: {
    position: 'absolute',
    width: 140,
    height: 140,
    borderRadius: 70,
    backgroundColor: 'rgba(255,255,255,0.08)',
    top: -30,
    right: -30,
  },
  bannerCircle2: {
    position: 'absolute',
    width: 90,
    height: 90,
    borderRadius: 45,
    backgroundColor: 'rgba(255,255,255,0.06)',
    bottom: -20,
    right: 60,
  },
  bannerContent: { zIndex: 1 },
  bannerIconBg: {
    width: 44,
    height: 44,
    borderRadius: 14,
    backgroundColor: 'rgba(255,255,255,0.22)',
    alignItems: 'center',
    justifyContent: 'center',
    marginBottom: 12,
  },
  bannerEyebrow: {
    fontSize: 11,
    fontWeight: '700',
    color: 'rgba(255,255,255,0.75)',
    textTransform: 'uppercase',
    letterSpacing: 0.8,
    marginBottom: 4,
  },
  bannerTitle: {
    fontSize: 17,
    fontWeight: '800',
    color: '#fff',
    lineHeight: 23,
    marginBottom: 16,
    maxWidth: SCREEN_WIDTH * 0.55,
  },
  bannerCtaBtn: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 5,
    backgroundColor: 'rgba(255,255,255,0.22)',
    alignSelf: 'flex-start',
    borderRadius: 20,
    paddingHorizontal: 14,
    paddingVertical: 8,
    borderWidth: 1,
    borderColor: 'rgba(255,255,255,0.35)',
  },
  bannerCtaText: { fontSize: 13, fontWeight: '700', color: '#fff' },
  bannerDots: {
    flexDirection: 'row',
    justifyContent: 'center',
    gap: 5,
    marginTop: 12,
  },
  dot:       { width: 6,  height: 6, borderRadius: 3, backgroundColor: '#d1d5db' },
  dotActive: { width: 20, height: 6, borderRadius: 3, backgroundColor: '#4f46e5' },

  /* Trust bar */
  trustBar: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    backgroundColor: '#fff',
    marginHorizontal: 16,
    marginTop: 14,
    borderRadius: 14,
    paddingVertical: 12,
    paddingHorizontal: 8,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 1 },
    shadowOpacity: 0.04,
    shadowRadius: 4,
    elevation: 1,
  },
  trustItem: { flexDirection: 'row', alignItems: 'center', gap: 5, flex: 1, justifyContent: 'center' },
  trustLabel: { fontSize: 11, fontWeight: '600', color: '#374151' },
  trustDivider: { width: 1, height: 20, backgroundColor: '#e5e7eb' },

  /* Section header */
  sectionHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 12,
  },
  sectionTitle: { fontSize: 17, fontWeight: '800', color: '#111827' },
  sectionLink:  { fontSize: 13, fontWeight: '600', color: '#4f46e5' },

  /* Order cards */
  orderCard: {
    backgroundColor: '#fff',
    borderRadius: 16,
    padding: 16,
    width: 180,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.07,
    shadowRadius: 6,
    elevation: 2,
  },
  orderStatusBadge: {
    borderRadius: 7,
    paddingHorizontal: 8,
    paddingVertical: 3,
    alignSelf: 'flex-start',
    marginBottom: 10,
  },
  orderStatusText:    { fontSize: 11, fontWeight: '700' },
  orderCardTitle:     { fontSize: 15, fontWeight: '700', color: '#111827', marginBottom: 4 },
  orderCardCategory:  { fontSize: 12, color: '#9ca3af', marginBottom: 10 },
  orderProposalPill: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 4,
    backgroundColor: '#eef2ff',
    borderRadius: 7,
    paddingHorizontal: 8,
    paddingVertical: 4,
    alignSelf: 'flex-start',
  },
  orderProposalCount: { fontSize: 11, fontWeight: '700', color: '#4f46e5' },

  /* Proposal rows */
  proposalRow: {
    backgroundColor: '#fff',
    borderRadius: 14,
    padding: 14,
    flexDirection: 'row',
    alignItems: 'center',
    gap: 12,
    marginBottom: 8,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 1 },
    shadowOpacity: 0.05,
    shadowRadius: 3,
    elevation: 1,
  },
  proposalAvatar:         { width: 44, height: 44, borderRadius: 22 },
  proposalAvatarFallback: { backgroundColor: '#f3f4f6', alignItems: 'center', justifyContent: 'center' },
  proposalName:           { fontSize: 14, fontWeight: '700', color: '#111827' },
  proposalOrder:          { fontSize: 12, color: '#9ca3af', marginTop: 2 },
  proposalRight:          { alignItems: 'flex-end' },
  proposalPrice:          { fontSize: 14, fontWeight: '700', color: '#059669' },
  proposalDeadline:       { fontSize: 11, color: '#9ca3af', marginTop: 2 },

  /* Past orders */
  pastOrderRow: {
    backgroundColor: '#fff',
    borderRadius: 14,
    padding: 14,
    flexDirection: 'row',
    alignItems: 'center',
    gap: 12,
    marginBottom: 8,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 1 },
    shadowOpacity: 0.05,
    shadowRadius: 3,
    elevation: 1,
  },
  pastOrderIconBg: {
    width: 38,
    height: 38,
    borderRadius: 11,
    alignItems: 'center',
    justifyContent: 'center',
  },
  pastOrderTitle:    { fontSize: 14, fontWeight: '600', color: '#111827' },
  pastOrderCategory: { fontSize: 12, color: '#9ca3af', marginTop: 2 },
  pastOrderBadge: {
    borderRadius: 8,
    paddingHorizontal: 8,
    paddingVertical: 3,
  },
  pastOrderBadgeText: { fontSize: 11, fontWeight: '700' },

  /* Empty state */
  emptyCard: {
    backgroundColor: '#fff',
    borderRadius: 20,
    padding: 28,
    alignItems: 'center',
    gap: 12,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 3 },
    shadowOpacity: 0.08,
    shadowRadius: 10,
    elevation: 4,
  },
  emptyIconBg: {
    width: 68,
    height: 68,
    borderRadius: 20,
    alignItems: 'center',
    justifyContent: 'center',
    marginBottom: 4,
  },
  emptyTitle: { fontSize: 18, fontWeight: '800', color: '#111827', textAlign: 'center' },
  emptySub:   { fontSize: 13, color: '#6b7280', textAlign: 'center', lineHeight: 20 },
  emptyBtn: {
    marginTop: 4,
    backgroundColor: '#4f46e5',
    borderRadius: 14,
    paddingVertical: 14,
    paddingHorizontal: 28,
    alignSelf: 'stretch',
    alignItems: 'center',
    flexDirection: 'row',
    justifyContent: 'center',
  },
  emptyBtnText: { color: '#fff', fontWeight: '700', fontSize: 15 },
});
