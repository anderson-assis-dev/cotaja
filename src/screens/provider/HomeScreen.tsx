import { View, Text, ScrollView, TouchableOpacity, StyleSheet, RefreshControl, TextInput, FlatList, Dimensions } from 'react-native';
import { useNavigation, useFocusEffect } from '@react-navigation/native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { useEffect, useState, useCallback, useRef } from 'react';

const SCREEN_WIDTH = Dimensions.get('window').width;
import Icon from 'react-native-vector-icons/MaterialIcons';
import { useAuth } from '../../contexts/AuthContext';
import { orderService, Order } from '../../services/api';
import { useStatusBarOverlay } from '../../hooks/useStatusBarOverlay';
import { StatusBarOverlay } from '../../components/StatusBarOverlay';
import { OrderCardSkeleton } from '../../components/Skeleton';

const BANNERS = [
  {
    id: '1',
    eyebrow: 'Novas oportunidades',
    title: 'Demandas abertas esperando pela sua proposta',
    gradient: ['#4f46e5', '#7c3aed'] as const,
    icon: 'search',
    cta: 'Ver demandas',
    action: 'search',
  },
  {
    id: '2',
    eyebrow: 'Aumente sua reputação',
    title: 'Avaliações positivas atraem mais clientes',
    gradient: ['#0891b2', '#0e7490'] as const,
    icon: 'star',
    cta: 'Meus serviços',
    action: 'services',
  },
  {
    id: '3',
    eyebrow: 'Ganhe mais',
    title: 'Participe de leilões e feche contratos maiores',
    gradient: ['#059669', '#047857'] as const,
    icon: 'gavel',
    cta: 'Ver leilões',
    action: 'auctions',
  },
];

const CATEGORIES = [
  { id: '1',  name: 'Limpeza',       icon: 'cleaning-services',  bg: '#eef2ff', color: '#4f46e5' },
  { id: '2',  name: 'Elétrica',      icon: 'electrical-services', bg: '#fff7ed', color: '#ea580c' },
  { id: '3',  name: 'Reparos',       icon: 'build',               bg: '#ecfdf5', color: '#059669' },
  { id: '4',  name: 'Tecnologia',    icon: 'computer',            bg: '#eff6ff', color: '#2563eb' },
  { id: '5',  name: 'Design',        icon: 'brush',               bg: '#faf5ff', color: '#7c3aed' },
  { id: '6',  name: 'Eventos',       icon: 'celebration',         bg: '#fff1f2', color: '#e11d48' },
  { id: '7',  name: 'Jardinagem',    icon: 'grass',               bg: '#f0fdf4', color: '#16a34a' },
  { id: '8',  name: 'Pintura',       icon: 'format-paint',        bg: '#fefce8', color: '#d97706' },
  { id: '9',  name: 'Hidráulica',    icon: 'plumbing',            bg: '#eff6ff', color: '#0284c7' },
  { id: '10', name: 'Ar Cond.',      icon: 'ac-unit',             bg: '#f0fdfa', color: '#0d9488' },
  { id: '11', name: 'Mudanças',      icon: 'local-shipping',      bg: '#fff7ed', color: '#c2410c' },
  { id: '12', name: 'Reformas',      icon: 'home-repair-service', bg: '#fefce8', color: '#a16207' },
  { id: '13', name: 'Fotografia',    icon: 'camera-alt',          bg: '#fff1f2', color: '#be185d' },
  { id: '14', name: 'Educação',      icon: 'school',              bg: '#eef2ff', color: '#3730a3' },
];

export default function ProviderHomeScreen() {
  const navigation = useNavigation<any>();
  const insets = useSafeAreaInsets();
  const { user, refreshUser } = useAuth();
  const [refreshing, setRefreshing] = useState(false);
  const [activeOrders, setActiveOrders] = useState<Order[]>([]);
  const [loadingOrders, setLoadingOrders] = useState(false);
  const [completedOrders, setCompletedOrders] = useState<Order[]>([]);
  const [searchQuery, setSearchQuery] = useState('');
  const [bannerIndex, setBannerIndex] = useState(0);
  const bannerRef   = useRef<FlatList>(null);
  const bannerTimer = useRef<ReturnType<typeof setInterval> | null>(null);
  const { showStatusBarOverlay, statusBarOpacity, handleScroll } = useStatusBarOverlay();
  const [top40, setTop40] = useState(0);

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

  useEffect(() => {
    setTop40(40);
  }, [insets.top]);

  const handleBannerAction = (action: string | null) => {
    if (action === 'search') navigation.navigate('SearchTab');
    else if (action === 'services') navigation.navigate('MyServicesTab');
    else if (action === 'auctions') navigation.navigate('AuctionsTab', { screen: 'ProviderAuction', params: {} });
  };

  const loadActiveOrders = useCallback(async () => {
    setLoadingOrders(true);
    try {
      const response = await orderService.getOrders({ status: 'in_progress' });
      if (response.success) {
        setActiveOrders((response.data.data || []).slice(0, 5));
      }
    } catch (error) {
      console.error('Erro ao carregar pedidos aceitos:', error);
    } finally {
      setLoadingOrders(false);
    }
  }, []);

  const loadCompletedOrders = useCallback(async () => {
    try {
      const response = await orderService.getOrders({ status: 'completed' });
      if (response.success) {
        setCompletedOrders((response.data.data || []).slice(0, 5));
      }
    } catch (error) {
      console.error('Erro ao carregar histórico:', error);
    }
  }, []);

  useFocusEffect(
    useCallback(() => {
      if (user?.id) {
        loadActiveOrders();
        loadCompletedOrders();
      }
    }, [user?.id, loadActiveOrders, loadCompletedOrders])
  );

  const onRefresh = async () => {
    setRefreshing(true);
    try {
      await Promise.all([refreshUser(), loadActiveOrders(), loadCompletedOrders()]);
    } catch (error) {
      console.error('Error refreshing user data:', error);
    } finally {
      setRefreshing(false);
    }
  };

  const getGreeting = () => {
    const hour = new Date().getHours();
    if (hour >= 5 && hour < 12) return 'Bom dia';
    if (hour >= 12 && hour < 18) return 'Boa tarde';
    return 'Boa noite';
  };

  const getSubtitle = () => {
    const hour = new Date().getHours();
    if (hour >= 5 && hour < 12) return 'Novos pedidos esperando você';
    if (hour >= 12 && hour < 18) return 'Confira as cotações abertas';
    if (hour >= 18 && hour < 23) return 'Planeje seus serviços de amanhã';
    return 'Há oportunidades esperando por você';
  };

  const firstName = (user?.name || 'Usuário').split(' ')[0];

  const handleSearch = () => {
    const q = searchQuery.trim();
    navigation.navigate('AuctionsTab', {
      screen: 'ProviderAuction',
      params: { selectedCategory: q || undefined, fromSearch: true },
    });
    if (q) setSearchQuery('');
  };

  return (
    <View style={styles.container}>
      <ScrollView
        style={styles.scrollView}
        refreshControl={
          <RefreshControl
            refreshing={refreshing}
            onRefresh={onRefresh}
            colors={['#4f46e5']}
            tintColor="#4f46e5"
            progressViewOffset={top40}
          />
        }
        onScroll={handleScroll}
        scrollEventThrottle={16}
      >
        {/* ── White Header ── */}
        <View style={[styles.header, { paddingTop: insets.top + 20 }]}>
          <Text style={styles.greetingLabel}>{getGreeting()},</Text>
          <Text style={styles.welcomeText}>{firstName}!</Text>
          <Text style={styles.subtitleText}>{getSubtitle()}</Text>
          <View style={styles.searchBar}>
            <Icon name="search" size={20} color="#9ca3af" />
            <TextInput
              style={styles.searchInput}
              placeholder="Buscar categoria..."
              placeholderTextColor="#9ca3af"
              value={searchQuery}
              onChangeText={setSearchQuery}
              returnKeyType="search"
              onSubmitEditing={handleSearch}
            />
            {searchQuery.length > 0 && (
              <TouchableOpacity onPress={handleSearch} activeOpacity={0.7}>
                <Icon name="arrow-forward" size={20} color="#4f46e5" />
              </TouchableOpacity>
            )}
          </View>
        </View>

        {/* ── Content ── */}
        <View style={styles.content}>

          {/* Painel Profissional */}
          {user?.is_premium ? (
            <TouchableOpacity
              style={styles.panelCard}
              onPress={() => navigation.navigate('ProviderVisibility')}
              activeOpacity={0.85}
            >
              <View style={styles.panelIconBg}>
                <Icon name="visibility" size={20} color="#4f46e5" />
              </View>
              <View style={{ flex: 1, marginLeft: 12 }}>
                <Text style={styles.panelTitle}>Painel Profissional</Text>
                <Text style={styles.panelSubtitle}>Veja seu desempenho e atraia mais clientes</Text>
              </View>
              <Icon name="chevron-right" size={20} color="#9ca3af" />
            </TouchableOpacity>
          ) : (
            <TouchableOpacity
              style={[styles.panelCard, styles.panelCardLocked]}
              onPress={() => navigation.navigate('Premium' as never)}
              activeOpacity={0.85}
            >
              <View style={[styles.panelIconBg, { backgroundColor: '#f3e8ff' }]}>
                <Icon name="lock" size={20} color="#7c3aed" />
              </View>
              <View style={{ flex: 1, marginLeft: 12 }}>
                <Text style={styles.panelTitle}>Painel Profissional</Text>
                <Text style={styles.panelSubtitle}>Recurso exclusivo Premium — toque para assinar</Text>
              </View>
              <View style={styles.premiumTag}>
                <Text style={styles.premiumTagText}>Premium</Text>
              </View>
            </TouchableOpacity>
          )}

          {/* Banner Carousel */}
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
                const idx = Math.round(e.nativeEvent.contentOffset.x / (SCREEN_WIDTH - 40));
                setBannerIndex(idx);
              }}
              renderItem={({ item: b }) => (
                <View style={[styles.bannerCard, { backgroundColor: b.gradient[0] }]}>
                  <View style={styles.bannerCircle1} />
                  <View style={styles.bannerCircle2} />
                  <View style={styles.bannerContent}>
                    <View style={styles.bannerIconBg}>
                      <Icon name={b.icon} size={24} color="#fff" />
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

          {/* Categories Carousel */}
          <Text style={styles.sectionTitle}>Categorias</Text>
          <ScrollView
            horizontal
            showsHorizontalScrollIndicator={false}
            contentContainerStyle={styles.carouselContent}
            style={styles.carousel}
          >
            {CATEGORIES.filter(c => c.name.toLowerCase().includes(searchQuery.toLowerCase())).map((cat) => (
              <TouchableOpacity
                key={cat.id}
                style={styles.categoryCard}
                activeOpacity={0.85}
                onPress={() =>
                  navigation.navigate('AuctionsTab', {
                    screen: 'ProviderAuction',
                    params: { selectedCategory: cat.name, fromSearch: true },
                  })
                }
              >
                <View style={[styles.categoryIconBg, { backgroundColor: cat.bg }]}>
                  <Icon name={cat.icon} size={22} color={cat.color} />
                </View>
                <Text style={styles.categoryName}>{cat.name}</Text>
              </TouchableOpacity>
            ))}
          </ScrollView>

          {/* Stats bar */}
          <View style={styles.statsBar}>
            <View style={styles.statsBarItem}>
              <Icon name="star" size={14} color="#f59e0b" />
              <Text style={styles.statsBarText}>{user?.rate ? `${user.rate} avaliação` : 'Sem avaliação'}</Text>
            </View>
            <View style={styles.statsBarDivider} />
            <View style={styles.statsBarItem}>
              <Icon name="check-circle" size={14} color="#10b981" />
              <Text style={styles.statsBarText}>{user?.completed_services ?? 0} concluídos</Text>
            </View>
            <View style={styles.statsBarDivider} />
            <View style={styles.statsBarItem}>
              <Icon name="bolt" size={14} color="#4f46e5" />
              <Text style={styles.statsBarText}>{user?.active_services ?? 0} ativos</Text>
            </View>
          </View>

          {/* Próximos Serviços */}
          <View style={styles.sectionHeader}>
            <Text style={styles.sectionTitle}>Próximos Serviços</Text>
            {activeOrders.length > 0 && (
              <TouchableOpacity onPress={() => navigation.navigate('MyServicesTab')}>
                <Text style={styles.seeAll}>Ver todos</Text>
              </TouchableOpacity>
            )}
          </View>

          {loadingOrders && (
            <View>
              <OrderCardSkeleton />
              <OrderCardSkeleton />
            </View>
          )}
          {!loadingOrders && activeOrders.length === 0 && (
            <View style={styles.emptyCard}>
              <Icon name="event-note" size={36} color="#d1d5db" />
              <Text style={styles.emptyCardText}>Nenhum serviço em andamento</Text>
              <Text style={styles.emptyCardSub}>Busque novas oportunidades abaixo</Text>
            </View>
          )}
          {!loadingOrders && activeOrders.length > 0 && (
            <View style={styles.ordersList}>
              {activeOrders.map((order) => (
                <TouchableOpacity
                  key={order.id}
                  style={styles.orderCard}
                  activeOpacity={0.85}
                  onPress={() =>
                    navigation.navigate('MyServicesTab', {
                      screen: 'AcceptedOrder',
                      params: { orderId: order.id },
                      initial: false,
                    })
                  }
                >
                  <View style={styles.orderLeft}>
                    <View style={styles.orderIconBg}>
                      <Icon name="build" size={18} color="#4f46e5" />
                    </View>
                    <View style={{ flex: 1 }}>
                      <Text style={styles.orderTitle} numberOfLines={1}>{order.title}</Text>
                      <Text style={styles.orderCategory}>{order.category}</Text>
                      {order.scheduled_date ? (
                        <View style={styles.orderDateRow}>
                          <Icon
                            name="event"
                            size={12}
                            color={
                              order.schedule_confirmed_by_client && order.schedule_confirmed_by_provider
                                ? '#10b981'
                                : '#f59e0b'
                            }
                          />
                          <Text
                            style={[
                              styles.orderDate,
                              {
                                color:
                                  order.schedule_confirmed_by_client && order.schedule_confirmed_by_provider
                                    ? '#10b981'
                                    : '#f59e0b',
                              },
                            ]}
                          >
                            {new Date(order.scheduled_date).toLocaleDateString('pt-BR')} às{' '}
                            {new Date(order.scheduled_date).toLocaleTimeString('pt-BR', {
                              hour: '2-digit',
                              minute: '2-digit',
                            })}
                          </Text>
                        </View>
                      ) : (
                        <Text style={styles.orderNoDate}>Sem data agendada</Text>
                      )}
                    </View>
                  </View>
                  <Icon name="chevron-right" size={20} color="#d1d5db" />
                </TouchableOpacity>
              ))}
            </View>
          )}

          {/* Histórico de Serviços */}
          {completedOrders.length > 0 && (
            <>
              <View style={styles.sectionHeader}>
                <Text style={styles.sectionTitle}>Histórico de Serviços</Text>
              </View>
              <View style={styles.ordersList}>
                {completedOrders.map((order) => (
                  <View key={order.id} style={styles.historyCard}>
                    <View style={styles.historyIconBg}>
                      <Icon name="check-circle" size={18} color="#059669" />
                    </View>
                    <View style={{ flex: 1 }}>
                      <Text style={styles.historyTitle} numberOfLines={1}>{order.title}</Text>
                      <Text style={styles.historyCategory}>{order.category}</Text>
                    </View>
                    <View style={styles.historyBadge}>
                      <Text style={styles.historyBadgeText}>Concluído</Text>
                    </View>
                  </View>
                ))}
              </View>
            </>
          )}

          <View style={{ height: insets.bottom + 16 }} />
        </View>
      </ScrollView>

      <StatusBarOverlay
        show={showStatusBarOverlay}
        opacity={statusBarOpacity}
        backgroundColor="#fff"
      />
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

  /* ── Header ── */
  header: {
    backgroundColor: '#fff',
    paddingHorizontal: 24,
    paddingBottom: 24,
    borderBottomWidth: 1,
    borderBottomColor: '#f3f4f6',
  },
  greetingLabel: {
    fontSize: 14,
    color: '#6b7280',
    fontWeight: '500',
  },
  welcomeText: {
    fontSize: 26,
    fontWeight: 'bold',
    color: '#111827',
    marginTop: 2,
  },
  subtitleText: {
    color: '#6b7280',
    fontSize: 14,
    marginTop: 4,
  },

  /* ── Content ── */
  content: {
    backgroundColor: '#f3f4f6',
    borderTopLeftRadius: 24,
    borderTopRightRadius: 24,
    padding: 20,
    minHeight: 500,
  },

  /* Panel card */
  panelCard: {
    backgroundColor: '#fff',
    borderRadius: 14,
    padding: 16,
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: 20,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.06,
    shadowRadius: 6,
    elevation: 2,
  },
  panelCardLocked: {
    backgroundColor: '#faf5ff',
  },
  panelIconBg: {
    width: 40,
    height: 40,
    borderRadius: 20,
    backgroundColor: '#eef2ff',
    alignItems: 'center',
    justifyContent: 'center',
  },
  panelTitle: {
    fontSize: 15,
    fontWeight: '700',
    color: '#111827',
  },
  panelSubtitle: {
    fontSize: 12,
    color: '#6b7280',
    marginTop: 2,
  },
  premiumTag: {
    backgroundColor: '#f3e8ff',
    borderRadius: 20,
    paddingHorizontal: 10,
    paddingVertical: 4,
  },
  premiumTagText: {
    fontSize: 11,
    fontWeight: '700',
    color: '#7c3aed',
  },

  /* Section headers */
  sectionTitle: {
    fontSize: 18,
    fontWeight: '800',
    color: '#111827',
    marginBottom: 14,
  },
  sectionHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginTop: 8,
    marginBottom: 14,
  },
  seeAll: {
    fontSize: 13,
    fontWeight: '600',
    color: '#4f46e5',
  },

  /* Banner carousel */
  bannerSection: { marginBottom: 20 },
  bannerCard: {
    width: SCREEN_WIDTH - 40,
    marginHorizontal: 0,
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

  /* Search bar */
  searchBar: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 10,
    backgroundColor: '#f3f4f6',
    borderRadius: 14,
    paddingHorizontal: 14,
    paddingVertical: 12,
    marginTop: 16,
    borderWidth: 1,
    borderColor: '#e5e7eb',
  },
  searchInput: {
    flex: 1,
    fontSize: 15,
    color: '#111827',
    padding: 0,
  },

  /* Stats bar */
  statsBar: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#fff',
    borderRadius: 14,
    paddingVertical: 12,
    paddingHorizontal: 8,
    marginBottom: 20,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 1 },
    shadowOpacity: 0.04,
    shadowRadius: 4,
    elevation: 1,
  },
  statsBarItem: {
    flex: 1,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: 5,
  },
  statsBarText: {
    fontSize: 11,
    fontWeight: '600',
    color: '#374151',
  },
  statsBarDivider: {
    width: 1,
    height: 20,
    backgroundColor: '#e5e7eb',
  },

  /* Orders list */
  ordersList: {
    gap: 10,
    marginBottom: 4,
  },
  orderCard: {
    backgroundColor: '#fff',
    borderRadius: 14,
    padding: 14,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.06,
    shadowRadius: 6,
    elevation: 2,
  },
  orderLeft: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 12,
    flex: 1,
    marginRight: 8,
  },
  orderIconBg: {
    width: 42,
    height: 42,
    borderRadius: 21,
    backgroundColor: '#eef2ff',
    alignItems: 'center',
    justifyContent: 'center',
  },
  orderTitle: {
    fontSize: 14,
    fontWeight: '700',
    color: '#111827',
  },
  orderCategory: {
    fontSize: 12,
    color: '#6b7280',
    marginTop: 2,
  },
  orderDateRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 4,
    marginTop: 4,
  },
  orderDate: {
    fontSize: 12,
    fontWeight: '500',
  },
  orderNoDate: {
    fontSize: 12,
    color: '#d1d5db',
    marginTop: 4,
  },

  /* Empty */
  emptyCard: {
    backgroundColor: '#fff',
    borderRadius: 14,
    padding: 28,
    alignItems: 'center',
    marginBottom: 4,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 1 },
    shadowOpacity: 0.04,
    shadowRadius: 4,
    elevation: 1,
  },
  emptyCardText: {
    fontSize: 15,
    fontWeight: '600',
    color: '#374151',
    marginTop: 10,
  },
  emptyCardSub: {
    fontSize: 13,
    color: '#9ca3af',
    marginTop: 4,
  },

  /* CTA */
  ctaButton: {
    backgroundColor: '#4f46e5',
    borderRadius: 14,
    padding: 16,
    marginTop: 16,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: 10,
  },
  ctaButtonText: {
    color: '#fff',
    fontWeight: '700',
    fontSize: 16,
  },

  /* Categories carousel */
  carousel: {
    marginBottom: 20,
  },
  carouselContent: {
    gap: 10,
    paddingRight: 4,
  },
  categoryCard: {
    backgroundColor: '#fff',
    borderRadius: 14,
    padding: 14,
    alignItems: 'center',
    width: 88,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.06,
    shadowRadius: 6,
    elevation: 2,
  },
  categoryIconBg: {
    width: 48,
    height: 48,
    borderRadius: 24,
    alignItems: 'center',
    justifyContent: 'center',
    marginBottom: 8,
  },
  categoryName: {
    fontSize: 11,
    fontWeight: '600',
    color: '#374151',
    textAlign: 'center',
  },

  /* History */
  historyCard: {
    backgroundColor: '#fff',
    borderRadius: 14,
    padding: 14,
    flexDirection: 'row',
    alignItems: 'center',
    gap: 12,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 1 },
    shadowOpacity: 0.05,
    shadowRadius: 4,
    elevation: 1,
  },
  historyIconBg: {
    width: 38,
    height: 38,
    borderRadius: 19,
    backgroundColor: '#ecfdf5',
    alignItems: 'center',
    justifyContent: 'center',
  },
  historyTitle: {
    fontSize: 14,
    fontWeight: '700',
    color: '#111827',
  },
  historyCategory: {
    fontSize: 12,
    color: '#6b7280',
    marginTop: 2,
  },
  historyBadge: {
    backgroundColor: '#ecfdf5',
    borderRadius: 20,
    paddingHorizontal: 10,
    paddingVertical: 4,
  },
  historyBadgeText: {
    fontSize: 11,
    fontWeight: '700',
    color: '#059669',
  },
});
