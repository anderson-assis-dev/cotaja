import { View, Text, ScrollView, TouchableOpacity, StyleSheet, RefreshControl, ActivityIndicator } from 'react-native';
import { useNavigation, useRoute, useFocusEffect } from '@react-navigation/native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import React, { useEffect, useState, useCallback } from 'react';
import Icon from 'react-native-vector-icons/MaterialIcons';
import { Clock, FileText } from 'lucide-react-native';
import { useAuth } from '../../contexts/AuthContext';
import { useStatusBarOverlay } from '../../hooks/useStatusBarOverlay';
import { StatusBarOverlay } from '../../components/StatusBarOverlay';
import { orderService, Order as ApiOrder, Proposal as ApiProposal } from '../../services/api';
import { formatPrice } from '../../utils/formatters';

const services = [
  {
    id: '1',
    title: 'Criar Pedido',
    description: 'Solicite um novo serviço',
    iconName: 'add-circle-outline',
    screen: 'CreateOrder',
  },
  {
    id: '2',
    title: 'Meus Pedidos',
    description: 'Acompanhe seus pedidos',
    iconName: 'list-alt',
    screen: 'OrderDetails', // Ajuste: navega para OrderDetailsScreen
  },
  {
    id: '3',
    title: 'Leilão em Andamento',
    description: 'Veja propostas recebidas',
    iconName: 'gavel',
    screen: 'OrderDetails', // Ajuste: navega para OrderDetailsScreen
  },
  {
    id: '4',
    title: 'Avaliar Prestador',
    description: 'Avalie serviços realizados',
    iconName: 'star-rate',
    screen: 'RateProvider',
  },
];

export default function HomeScreen() {
  const navigation = useNavigation<any>();
  const route = useRoute();
  const insets = useSafeAreaInsets();
  const { user, refreshUser } = useAuth();
  const [refreshing, setRefreshing] = useState(false);
  const { showStatusBarOverlay, statusBarOpacity, handleScroll } = useStatusBarOverlay();
  const [top40, setTop40] = useState(0);
  const [recentOrders, setRecentOrders] = useState<ApiOrder[]>([]);
  const [loadingOrders, setLoadingOrders] = useState(true);

  // Acessando os parâmetros do cliente
  const clientInfo = (route.params as any)?.clientInfo || {};
  const clientId = (route.params as any)?.clientId || null;
  const userType = (route.params as any)?.userType || 'client';

  // Nome do cliente para exibição
  const clientName = clientInfo.name || 'Cliente';

  useEffect(() => {
    setTop40(40);
  }, [insets.top]);

  const fetchRecentOrders = async () => {
    try {
      setLoadingOrders(true);
      const response = await orderService.getRecentOrders();
      if (response.success && Array.isArray(response.data)) {
        setRecentOrders(response.data);
      }
    } catch (error) {
      console.error('Erro ao carregar pedidos recentes:', error);
    } finally {
      setLoadingOrders(false);
    }
  };

  // Recarrega os pedidos recentes toda vez que a tela ganha foco
  useFocusEffect(
    useCallback(() => {
      if (user?.id) {
        fetchRecentOrders();
      } else {
        setLoadingOrders(false);
      }
    }, [user?.id])
  );

  const onRefresh = async () => {
    setRefreshing(true);
    try {
      await Promise.all([refreshUser(), fetchRecentOrders()]);
    } catch (error) {
      console.error('Error refreshing user data:', error);
    } finally {
      setRefreshing(false);
    }
  };

  return (
    <View style={styles.container}>
      <ScrollView
        style={styles.scrollView}
        refreshControl={
          <RefreshControl
            refreshing={refreshing}
            onRefresh={onRefresh}
            colors={['#4f46e5']} // Android
            tintColor="#4f46e5" // iOS
            progressViewOffset={top40}
          />
        }
        onScroll={handleScroll}
        scrollEventThrottle={16}
      >
        <View style={[styles.header, { paddingTop: insets.top + 60, marginTop: -60 }]}>
          <Text style={styles.welcomeText}>Olá, {user?.name || 'Usuário'}!</Text>
          <Text style={styles.subtitleText}>
            Como podemos ajudar você hoje?
          </Text>
          {clientId && (
            <Text style={styles.idText}>
              ID: {clientId}
            </Text>
          )}
        </View>

        <View style={styles.content}>
          <Text style={styles.sectionTitle}>Serviços</Text>
          <View style={styles.servicesGrid}>
          {services.map((service) => (
            <TouchableOpacity
              key={service.id}
              style={styles.serviceCard}
              onPress={() => {
                if (service.title === 'Leilão em Andamento') {
                  navigation.navigate('HomeMyOrders', {
                    userType: userType,
                    clientId: clientId,
                    clientInfo: clientInfo,
                    fromLeiloes: true,
                  });
                } else if (service.title === 'Meus Pedidos') {
                  navigation.navigate('HomeMyOrders', {
                    userType: userType,
                    clientId: clientId,
                    clientInfo: clientInfo,
                  });
                } else if (service.screen === 'RateProvider') {
                  navigation.navigate('SearchTab', {
                    isRatingMode: true,
                    userType: userType,
                    clientId: clientId,
                    clientInfo: clientInfo
                  });
                } else {
                  navigation.navigate(service.screen, {
                    userType: userType,
                    clientId: clientId,
                    clientInfo: clientInfo
                  });
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

          <Text style={styles.upcomingTitle}>Últimas Propostas Recebidas</Text>
          {loadingOrders ? (
            <View style={styles.upcomingCard}>
              <ActivityIndicator size="small" color="#4f46e5" />
              <Text style={[styles.noServicesText, { marginTop: 8 }]}>Carregando...</Text>
            </View>
          ) : (() => {
            // Extrair todas as propostas de todos os pedidos e pegar as 5 mais recentes
            const allProposals = recentOrders.flatMap((order) =>
              (order.proposals || []).map((p: any) => ({
                ...p,
                orderTitle: order.title,
                orderId: order.id,
                orderCategory: order.category,
              }))
            );
            // Ordenar por created_at desc (mais recentes primeiro)
            allProposals.sort((a: any, b: any) => {
              const dateA = a.created_at ? new Date(a.created_at).getTime() : 0;
              const dateB = b.created_at ? new Date(b.created_at).getTime() : 0;
              return dateB - dateA;
            });
            const last5 = allProposals.slice(0, 5);

            if (last5.length === 0) {
              return (
                <View style={styles.upcomingCard}>
                  <Icon name="gavel" size={40} color="#d1d5db" style={{ alignSelf: 'center', marginBottom: 8 }} />
                  <Text style={styles.noServicesText}>
                    Nenhuma proposta recebida ainda
                  </Text>
                </View>
              );
            }

            return last5.map((proposal: any, idx: number) => (
              <TouchableOpacity
                key={proposal.id || idx}
                style={styles.proposalCard}
                onPress={() => navigation.navigate('HomeMyOrders', {
                  userType: userType,
                  clientId: clientId,
                  clientInfo: clientInfo,
                })}
              >
                <View style={styles.proposalCardHeader}>
                  <View style={styles.proposalProviderInfo}>
                    <View style={styles.proposalAvatar}>
                      <Icon name="person" size={18} color="#fff" />
                    </View>
                    <View style={{ flex: 1 }}>
                      <Text style={styles.proposalProviderName} numberOfLines={1}>
                        {proposal.provider?.name || proposal.provider_name || 'Prestador'}
                      </Text>
                      <Text style={styles.proposalOrderName} numberOfLines={1}>
                        {proposal.orderTitle}
                      </Text>
                    </View>
                  </View>
                  <View style={styles.proposalValues}>
                    <Text style={styles.proposalPrice}>
                      R$ {formatPrice(proposal.price)}
                    </Text>
                    <View style={styles.proposalDeadlineContainer}>
                      <Clock size={14} color="#6b7280" />
                      <Text style={styles.proposalDeadlineLabel}>Prazo:</Text>
                      <Text style={styles.proposalDeadline}>
                        {proposal.deadline} {typeof proposal.deadline === 'number' ? 'dias' : ''}
                      </Text>
                    </View>
                  </View>
                </View>
                <View style={styles.proposalDescriptionContainer}>
                  <FileText size={14} color="#6b7280" />
                  <Text style={styles.proposalDescriptionLabel}>Descrição:</Text>
                  <Text style={styles.proposalDescription} numberOfLines={2}>
                  {proposal.description || 'Sem descrição'}
                </Text>
                </View>
              </TouchableOpacity>
            ));
          })()}

          <View style={{ height: insets.bottom + 16 }} />
        </View>
      </ScrollView>

      {/* Status Bar Overlay */}
      <StatusBarOverlay show={showStatusBarOverlay} opacity={statusBarOpacity} />
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
  header: {
    backgroundColor: 'transparent',
    padding: 24,
  },
  welcomeText: {
    fontSize: 24,
    fontWeight: 'bold',
    color: '#000000',
    marginBottom: 8,
  },
  subtitleText: {
    color: '#000000',
    opacity: 0.9,
    fontSize: 16,
  },
  idText: {
    color: '#ffffff',
    opacity: 0.8,
    fontSize: 14,
    marginTop: 4,
  },
  content: {
    padding: 24,
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
    shadowColor: '#000',
    shadowOffset: {
      width: 0,
      height: 1,
    },
    shadowOpacity: 0.1,
    shadowRadius: 2,
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
    fontSize: 16,
  },
  serviceDescription: {
    color: '#6b7280',
    fontSize: 14,
  },
  upcomingTitle: {
    fontSize: 20,
    fontWeight: 'bold',
    marginBottom: 16,
    marginTop: 24,
    color: '#111827',
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
  proposalCard: {
    backgroundColor: '#ffffff',
    borderRadius: 12,
    padding: 16,
    marginBottom: 10,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 1 },
    shadowOpacity: 0.1,
    shadowRadius: 2,
    elevation: 2,
  },
  proposalCardHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 8,
  },
  proposalProviderInfo: {
    flexDirection: 'row',
    alignItems: 'center',
    flex: 1,
    gap: 10,
  },
  proposalAvatar: {
    width: 36,
    height: 36,
    borderRadius: 18,
    backgroundColor: '#818cf8',
    alignItems: 'center',
    justifyContent: 'center',
  },
  proposalProviderName: {
    fontSize: 15,
    color: '#1f2937',
    fontWeight: '600',
  },
  proposalOrderName: {
    fontSize: 12,
    color: '#6b7280',
    marginTop: 1,
  },
  proposalValues: {
    alignItems: 'flex-end',
    marginLeft: 8,
  },
  proposalPrice: {
    fontSize: 16,
    fontWeight: 'bold',
    color: '#059669',
    marginBottom: 6,
  },
  proposalDeadlineContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 4,
  },
  proposalDeadlineLabel: {
    fontSize: 11,
    color: '#6b7280',
    fontWeight: '500',
  },
  proposalDeadline: {
    fontSize: 11,
    color: '#111827',
    fontWeight: '600',
  },
  proposalDescriptionContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 4,
    marginTop: 8,
    marginBottom: 4,
  },
  proposalDescriptionLabel: {
    fontSize: 12,
    color: '#6b7280',
    fontWeight: '500',
  },
  proposalDescription: {
    fontSize: 13,
    color: '#374151',
    lineHeight: 18,
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
});