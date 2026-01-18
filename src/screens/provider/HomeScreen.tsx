import { View, Text, ScrollView, TouchableOpacity, StyleSheet, RefreshControl } from 'react-native';
import { useNavigation } from '@react-navigation/native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { useEffect, useState } from 'react';
import Icon from 'react-native-vector-icons/MaterialIcons';
import { useAuth } from '../../contexts/AuthContext';
import { authService } from '../../services/api';
import { useStatusBarOverlay } from '../../hooks/useStatusBarOverlay';
import { StatusBarOverlay } from '../../components/StatusBarOverlay';

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
  const { showStatusBarOverlay, statusBarOpacity, handleScroll } = useStatusBarOverlay();
  const [top40, setTop40] = useState(0);

  useEffect(() => {
    setTop40(40);
  }, [insets.top]);

  const formatCurrency = (value: number) => {
    return new Intl.NumberFormat('pt-BR', {
      style: 'currency',
      currency: 'BRL',
    }).format(value);
  };

  const onRefresh = async () => {
    setRefreshing(true);
    try {
      await refreshUser();
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
                <Text style={styles.starIcon}>★</Text>
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

          <View style={styles.earningsCard}>
            <Text style={styles.earningsLabel}>Saldo Atual</Text>
            <Text style={styles.earningsValue}>
              {user?.balance ? formatCurrency(user.balance) : 'R$ 0,00'}
            </Text>
          </View>
        </View>

        <Text style={styles.sectionTitle}>Serviços</Text>
        <View style={styles.servicesGrid}>
          {services.map((service) => (
            <TouchableOpacity
              key={service.id}
              style={styles.serviceCard}
              onPress={() => {
                if (service.screen === 'AuctionsTab') {
                  // Reseta a navegação para a tela de leilões sem filtros
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

        <Text style={styles.upcomingTitle}>Próximos Serviços</Text>
        <View style={styles.upcomingCard}>
          <Text style={styles.noServicesText}>
            Você não tem serviços agendados
          </Text>
        </View>

        <TouchableOpacity
          style={styles.actionButton}
          onPress={() => navigation.navigate('SearchTab')}
        >
          <Text style={styles.actionButtonText}>
            Buscar Novas Oportunidades
          </Text>
        </TouchableOpacity>
      </View>
    </ScrollView>

    {/* Status Bar Overlay */}
    <StatusBarOverlay show={showStatusBarOverlay} opacity={statusBarOpacity} forceLight />
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
    backgroundColor: '#4f46e5',
    padding: 24,
  },
  welcomeText: {
    fontSize: 24,
    fontWeight: 'bold',
    color: '#ffffff',
    marginBottom: 8,
  },
  subtitleText: {
    color: '#ffffff',
    opacity: 0.9,
    fontSize: 16,
  },
  content: {
    padding: 24,
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
    marginBottom: 24,
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