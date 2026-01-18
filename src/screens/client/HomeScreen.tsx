import { View, Text, ScrollView, TouchableOpacity, StyleSheet, RefreshControl } from 'react-native';
import { useNavigation, useRoute } from '@react-navigation/native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { useEffect, useState } from 'react';
import Icon from 'react-native-vector-icons/MaterialIcons';
import { useAuth } from '../../contexts/AuthContext';
import { useStatusBarOverlay } from '../../hooks/useStatusBarOverlay';
import { StatusBarOverlay } from '../../components/StatusBarOverlay';

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

  // Acessando os parâmetros do cliente
  const clientInfo = (route.params as any)?.clientInfo || {};
  const clientId = (route.params as any)?.clientId || null;
  const userType = (route.params as any)?.userType || 'client';

  // Nome do cliente para exibição
  const clientName = clientInfo.name || 'Cliente';

  useEffect(() => {
    setTop40(40);
  }, [insets.top]);

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
                  navigation.navigate('MyOrdersTab', {
                    screen: 'OrderDetails',
                    params: {
                      userType: userType,
                      clientId: clientId,
                      clientInfo: clientInfo,
                      fromLeiloes: true,
                    }
                  });
                } else if (service.title === 'Meus Pedidos') {
                  navigation.navigate('MyOrdersTab', {
                    screen: 'OrderDetails',
                    params: {
                      userType: userType,
                      clientId: clientId,
                      clientInfo: clientInfo,
                    }
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

          <Text style={styles.upcomingTitle}>Pedidos Recentes</Text>
          <View style={styles.upcomingCard}>
            <Text style={styles.noServicesText}>
              Você ainda não tem pedidos recentes
            </Text>
          </View>

          <TouchableOpacity
            style={styles.actionButton}
            onPress={() => navigation.navigate('CreateOrder', {
              userType: userType,
              clientId: clientId,
              clientInfo: clientInfo
            })}
          >
            <Text style={styles.actionButtonText}>
              Criar Novo Pedido
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