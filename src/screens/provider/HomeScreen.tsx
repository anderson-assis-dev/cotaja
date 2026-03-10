import { View, Text, ScrollView, TouchableOpacity, StyleSheet, RefreshControl, ActivityIndicator } from 'react-native';
import { useNavigation, useFocusEffect } from '@react-navigation/native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { useEffect, useState, useCallback } from 'react';
import Icon from 'react-native-vector-icons/MaterialIcons';
import { Star } from 'lucide-react-native';
import { useAuth } from '../../contexts/AuthContext';
import { orderService, Order } from '../../services/api';
import { useStatusBarOverlay } from '../../hooks/useStatusBarOverlay';
import { StatusBarOverlay } from '../../components/StatusBarOverlay';
import { OrderCardSkeleton } from '../../components/Skeleton';
import { formatPrice } from '../../utils/formatters';

const services = [
  {
    id: '1',
    title: 'Buscar Demandas',
    description: 'Encontre oportunidades',
    iconName: 'search',
    screen: 'SearchTab',
  },
  {
    id: '2',
    title: 'Leilões Ativos',
    description: 'Acompanhe seus leilões',
    iconName: 'gavel',
    screen: 'AuctionsTab',
  },
  {
    id: '3',
    title: 'Meus Serviços',
    description: 'Gerencie seus serviços',
    iconName: 'build',
    screen: 'MyServicesTab',
  },
  {
    id: '4',
    title: 'Enviar Proposta',
    description: 'Proponha seus serviços',
    iconName: 'send',
    screen: 'SendProposal',
  },
];

export default function ProviderHomeScreen() {
  const navigation = useNavigation<any>();
  const insets = useSafeAreaInsets();
  const { user, refreshUser } = useAuth();
  const [refreshing, setRefreshing] = useState(false);
  const [activeOrders, setActiveOrders] = useState<Order[]>([]);
  const [loadingOrders, setLoadingOrders] = useState(false);
  const { showStatusBarOverlay, statusBarOpacity, handleScroll } = useStatusBarOverlay();
  const [top40, setTop40] = useState(0);

  useEffect(() => {
    setTop40(40);
  }, [insets.top]);

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

  useFocusEffect(
    useCallback(() => {
      if (user?.id) {
        loadActiveOrders();
      }
    }, [user?.id, loadActiveOrders])
  );

  const onRefresh = async () => {
    setRefreshing(true);
    try {
      await Promise.all([refreshUser(), loadActiveOrders()]);
    } catch (error) {
      console.error('Error refreshing user data:', error);
    } finally {
      setRefreshing(false);
    }
  };

  return (
    <View style={styles.container}>

      <View style={styles.headerBackground} />
      <ScrollView
        style={styles.scrollView}
        refreshControl={
          <RefreshControl
            refreshing={refreshing}
            onRefresh={onRefresh}
            colors={['#4f46e5']}
            tintColor="#ffffff"
            progressViewOffset={top40}
          />
        }
        onScroll={handleScroll}
        scrollEventThrottle={16}
      >
      <View style={[styles.header, { paddingTop: insets.top + 20 }]}>
        <Text style={styles.welcomeText}>Olá, {(user?.name || 'Usuário').split(' ')[0]}!</Text>
        <Text style={styles.subtitleText}>
          Como vai seu trabalho hoje?
        </Text>
      </View>

      <View style={styles.content}>
        <View style={styles.statsCard}>
          <View style={styles.statsRow}>
            <View style={styles.statItem}>
              <Text style={styles.statLabel}>Avaliação</Text>
              <View style={styles.ratingContainer}>
                <Text style={styles.statValue}>{user?.rate || 0}</Text>
                <Star size={18} color="#f59e0b" fill="#f59e0b" style={{ marginLeft: 4 }} />
              </View>
            </View>
            <View style={styles.statItem}>
              <Text style={styles.statLabel}>Concluídos</Text>
              <Text style={styles.statValue}>{user?.completed_services || 0}</Text>
            </View>
            <View style={styles.statItem}>
              <Text style={styles.statLabel}>Ativos</Text>
              <Text style={styles.statValue}>{user?.active_services || 0}</Text>
            </View>
          </View>
        </View>

        <TouchableOpacity
          style={styles.visibilityCard}
          onPress={() => navigation.navigate('ProviderVisibility')}
        >
          <View style={styles.visibilityLeft}>
            <Icon name="visibility" size={22} color="#4f46e5" />
            <View style={{ marginLeft: 12 }}>
              <Text style={styles.visibilityTitle}>Minha Visibilidade</Text>
              <Text style={styles.visibilitySubtitle}>Veja quantas vezes suas propostas foram visualizadas</Text>
            </View>
          </View>
          <Icon name="chevron-right" size={22} color="#9ca3af" />
        </TouchableOpacity>

        <Text style={styles.sectionTitle}>Serviços</Text>
        <View style={styles.servicesGrid}>
          {services.map((service) => (
            <TouchableOpacity
              key={service.id}
              style={styles.serviceCard}
              onPress={() => {
                if (service.screen === 'AuctionsTab') {
                  navigation.navigate('AuctionsTab', {
                    screen: 'ProviderAuction',
                    params: { selectedCategory: undefined, fromSearch: false },
                  });
                } else {
                  navigation.navigate(service.screen);
                }
              }}
            >
              <View style={styles.serviceIcon}>
                <Icon name={service.iconName} size={28} color="#4f46e5" />
              </View>
              <Text style={styles.serviceTitle}>
                {service.title}
              </Text>
              <Text style={styles.serviceDescription}>
                {service.description}
              </Text>
            </TouchableOpacity>
          ))}
        </View>

        <View style={styles.upcomingHeader}>
          <Text style={styles.upcomingTitle}>Próximos Serviços</Text>
          {activeOrders.length > 0 && (
            <TouchableOpacity
              onPress={() => navigation.navigate('MyServicesTab')}
            >
              <Text style={styles.seeAllText}>Ver todos</Text>
            </TouchableOpacity>
          )}
        </View>

        {loadingOrders ? (
          <View>
            <OrderCardSkeleton />
            <OrderCardSkeleton />
          </View>
        ) : activeOrders.length === 0 ? (
          <View style={styles.upcomingCard}>
            <Text style={styles.noServicesText}>Você não tem serviços aceitos no momento</Text>
          </View>
        ) : (
          <View style={styles.activeOrdersList}>
            {activeOrders.map((order) => (
              <TouchableOpacity
                key={order.id}
                style={styles.activeOrderCard}
                onPress={() =>
                  navigation.navigate('MyServicesTab', {
                    screen: 'AcceptedOrder',
                    params: { orderId: order.id },
                    initial: false,
                  })
                }
              >
                <View style={styles.activeOrderLeft}>
                  <View style={styles.activeOrderIconBg}>
                    <Icon name="build" size={18} color="#4f46e5" />
                  </View>
                  <View style={{ flex: 1 }}>
                    <Text style={styles.activeOrderTitle} numberOfLines={1}>
                      {order.title}
                    </Text>
                    <Text style={styles.activeOrderCategory}>{order.category}</Text>
                    {order.scheduled_date ? (
                      <View style={styles.activeOrderDateRow}>
                        <Icon
                          name="event"
                          size={13}
                          color={
                            order.schedule_confirmed_by_client &&
                            order.schedule_confirmed_by_provider
                              ? '#10b981'
                              : '#f59e0b'
                          }
                        />
                        <Text
                          style={[
                            styles.activeOrderDate,
                            {
                              color:
                                order.schedule_confirmed_by_client &&
                                order.schedule_confirmed_by_provider
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
                      <Text style={styles.activeOrderNoDate}>Sem data agendada</Text>
                    )}
                  </View>
                </View>
                <Icon name="chevron-right" size={22} color="#9ca3af" />
              </TouchableOpacity>
            ))}
          </View>
        )}

        <TouchableOpacity
          style={styles.actionButton}
          onPress={() => navigation.navigate('SearchTab')}
        >
          <Text style={styles.actionButtonText}>
            Buscar Novas Oportunidades
          </Text>
        </TouchableOpacity>
        <View style={{ height: insets.bottom + 16 }} />
      </View>
    </ScrollView>


    <StatusBarOverlay show={showStatusBarOverlay} opacity={statusBarOpacity} forceLight />
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
  header: {
    backgroundColor: '#4f46e5',
    paddingHorizontal: 24,
    paddingBottom: 28,
  },
  welcomeText: {
    fontSize: 26,
    fontWeight: 'bold',
    color: '#ffffff',
    marginBottom: 4,
  },
  subtitleText: {
    color: 'rgba(255,255,255,0.8)',
    fontSize: 15,
  },
  content: {
    backgroundColor: '#f3f4f6',
    borderTopLeftRadius: 24,
    borderTopRightRadius: 24,
    padding: 24,
    minHeight: 500,
  },
  statsCard: {
    backgroundColor: '#ffffff',
    borderRadius: 12,
    padding: 24,
    marginBottom: 24,
    shadowColor: '#000',
    shadowOffset: {
      width: 0,
      height: 1,
    },
    shadowOpacity: 0.1,
    shadowRadius: 2,
    elevation: 2,
  },
  statsRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
  },
  statItem: {
    alignItems: 'center',
  },
  statLabel: {
    color: '#6b7280',
    fontSize: 14,
    marginBottom: 4,
  },
  ratingContainer: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  statValue: {
    fontSize: 24,
    fontWeight: 'bold',
    color: '#111827',
  },
  starIcon: {
    color: '#f59e0b',
    marginLeft: 4,
    fontSize: 20,
  },
  earningsCard: {
    backgroundColor: '#eef2ff',
    borderRadius: 8,
    padding: 16,
  },
  earningsLabel: {
    color: '#6b7280',
    fontSize: 14,
    marginBottom: 4,
  },
  earningsValue: {
    fontSize: 24,
    fontWeight: 'bold',
    color: '#4f46e5',
  },
  sectionTitle: {
    fontSize: 20,
    fontWeight: 'bold',
    marginBottom: 16,
    color: '#111827',
  },
  servicesGrid: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    justifyContent: 'space-between',
  },
  serviceCard: {
    backgroundColor: '#ffffff',
    borderRadius: 12,
    padding: 16,
    marginBottom: 16,
    width: '48%',
    borderLeftWidth: 4,
    borderLeftColor: '#4f46e5',
    shadowColor: '#000',
    shadowOffset: {
      width: 0,
      height: 1,
    },
    shadowOpacity: 0.07,
    shadowRadius: 3,
    elevation: 2,
  },
  serviceIcon: {
    backgroundColor: '#e0e7ff',
    borderRadius: 24,
    width: 48,
    height: 48,
    alignItems: 'center',
    justifyContent: 'center',
    marginBottom: 12,
  },
  serviceTitle: {
    fontWeight: 'bold',
    color: '#1f2937',
    marginBottom: 4,
    fontSize: 15,
  },
  serviceDescription: {
    color: '#6b7280',
    fontSize: 13,
  },
  upcomingHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginTop: 24,
    marginBottom: 16,
  },
  upcomingTitle: {
    fontSize: 20,
    fontWeight: 'bold',
    color: '#111827',
  },
  seeAllText: {
    fontSize: 14,
    fontWeight: '600',
    color: '#4f46e5',
  },
  upcomingCard: {
    backgroundColor: '#ffffff',
    borderRadius: 12,
    padding: 16,
    shadowColor: '#000',
    shadowOffset: {
      width: 0,
      height: 1,
    },
    shadowOpacity: 0.1,
    shadowRadius: 2,
    elevation: 2,
  },
  noServicesText: {
    color: '#6b7280',
    textAlign: 'center',
    fontSize: 16,
  },
  activeOrdersList: {
    gap: 10,
  },
  activeOrderCard: {
    backgroundColor: '#ffffff',
    borderRadius: 12,
    padding: 14,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    borderLeftWidth: 4,
    borderLeftColor: '#4f46e5',
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 1 },
    shadowOpacity: 0.06,
    shadowRadius: 2,
    elevation: 2,
  },
  activeOrderLeft: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 12,
    flex: 1,
    marginRight: 8,
  },
  activeOrderIconBg: {
    width: 40,
    height: 40,
    borderRadius: 20,
    backgroundColor: '#eef2ff',
    alignItems: 'center',
    justifyContent: 'center',
  },
  activeOrderTitle: {
    fontSize: 15,
    fontWeight: '600',
    color: '#111827',
  },
  activeOrderCategory: {
    fontSize: 13,
    color: '#6b7280',
    marginTop: 2,
  },
  activeOrderDateRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 4,
    marginTop: 4,
  },
  activeOrderDate: {
    fontSize: 12,
    fontWeight: '500',
  },
  activeOrderNoDate: {
    fontSize: 12,
    color: '#d1d5db',
    marginTop: 4,
  },
  actionButton: {
    backgroundColor: '#4f46e5',
    borderRadius: 8,
    padding: 16,
    marginTop: 24,
  },
  actionButtonText: {
    textAlign: 'center',
    color: '#ffffff',
    fontWeight: 'bold',
    fontSize: 18,
  },
  visibilityCard: {
    backgroundColor: '#ffffff',
    borderRadius: 12,
    padding: 16,
    marginBottom: 24,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    borderLeftWidth: 4,
    borderLeftColor: '#4f46e5',
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 1 },
    shadowOpacity: 0.07,
    shadowRadius: 3,
    elevation: 2,
  },
  visibilityLeft: {
    flexDirection: 'row',
    alignItems: 'center',
    flex: 1,
  },
  visibilityTitle: {
    fontSize: 15,
    fontWeight: '600',
    color: '#111827',
  },
  visibilitySubtitle: {
    fontSize: 12,
    color: '#6b7280',
    marginTop: 2,
  },
});