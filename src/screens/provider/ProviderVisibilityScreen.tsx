import { View, Text, ScrollView, StyleSheet, ActivityIndicator, TouchableOpacity } from 'react-native';
import { useNavigation } from '@react-navigation/native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { useEffect, useState } from 'react';
import Icon from 'react-native-vector-icons/MaterialIcons';
import { useStatusBarOverlay } from '../../hooks/useStatusBarOverlay';
import { StatusBarOverlay } from '../../components/StatusBarOverlay';
import { proposalService } from '../../services/api';

interface VisibilityData {
  total_views: number;
  views_this_week: number;
  proposals_with_views: number;
  total_proposals: number;
  total_pending: number;
  total_accepted: number;
  conversion_rate: number;
  available_orders: number;
}

export default function ProviderVisibilityScreen() {
  const navigation = useNavigation<any>();
  const insets = useSafeAreaInsets();
  const { showStatusBarOverlay, statusBarOpacity, handleScroll } = useStatusBarOverlay();
  const [data, setData] = useState<VisibilityData | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    proposalService.getVisibility()
      .then(res => { if (res.success) setData(res.data); })
      .catch(console.error)
      .finally(() => setLoading(false));
  }, []);

  return (
    <View style={styles.container}>
      <View style={styles.headerBackground} />
      <ScrollView
        style={styles.scrollView}
        onScroll={handleScroll}
        scrollEventThrottle={16}
        contentContainerStyle={{ paddingBottom: insets.bottom + 24 }}
      >
        <View style={[styles.header, { paddingTop: insets.top + 16 }]}>
          <View style={styles.headerTop}>
            <TouchableOpacity style={styles.backButton} onPress={() => navigation.goBack()}>
              <Icon name="arrow-back" size={22} color="#ffffff" />
            </TouchableOpacity>
            <Text style={styles.title}>Minha Visibilidade</Text>
          </View>
          <Text style={styles.subtitle}>Acompanhe o desempenho das suas propostas</Text>
        </View>

        <View style={styles.content}>
          {loading ? (
            <View style={styles.loadingContainer}>
              <ActivityIndicator color="#4f46e5" size="large" />
              <Text style={styles.loadingText}>Carregando métricas...</Text>
            </View>
          ) : !data ? (
            <View style={styles.emptyContainer}>
              <Icon name="bar-chart" size={48} color="#d1d5db" />
              <Text style={styles.emptyText}>Não foi possível carregar as métricas.</Text>
            </View>
          ) : (
            <>
              <Text style={styles.sectionTitle}>Esta Semana</Text>
              <View style={styles.highlightCard}>
                <View style={styles.highlightIconBg}>
                  <Icon name="visibility" size={28} color="#4f46e5" />
                </View>
                <Text style={styles.highlightValue}>{data.views_this_week}</Text>
                <Text style={styles.highlightLabel}>Visualizações nas suas propostas</Text>
              </View>

              <Text style={styles.sectionTitle}>Geral</Text>
              <View style={styles.metricsGrid}>
                <MetricCard icon="bar-chart" label="Total de visualizações" value={data.total_views} color="#4f46e5" />
                <MetricCard icon="description" label="Propostas enviadas" value={data.total_proposals} color="#0891b2" />
                <MetricCard icon="check-circle" label="Propostas aceitas" value={data.total_accepted} color="#059669" />
                <MetricCard icon="pending" label="Aguardando resposta" value={data.total_pending} color="#d97706" />
                <MetricCard icon="trending-up" label="Taxa de conversão" value={`${data.conversion_rate}%`} color="#7c3aed" />
                <MetricCard icon="search" label="Demandas disponíveis" value={data.available_orders} color="#db2777" />
              </View>

              <View style={styles.tipCard}>
                <Icon name="lightbulb" size={18} color="#d97706" />
                <Text style={styles.tipText}>
                  As visualizações aumentam quando clientes abrem seus pedidos e veem sua proposta. Envie propostas detalhadas para se destacar.
                </Text>
              </View>
            </>
          )}
        </View>
      </ScrollView>
      <StatusBarOverlay show={showStatusBarOverlay} opacity={statusBarOpacity} forceLight />
    </View>
  );
}

function MetricCard({ icon, label, value, color }: { icon: string; label: string; value: number | string; color: string }) {
  return (
    <View style={[styles.metricCard, { borderLeftColor: color }]}>
      <View style={[styles.metricIconBg, { backgroundColor: color + '18' }]}>
        <Icon name={icon} size={20} color={color} />
      </View>
      <Text style={styles.metricValue}>{value}</Text>
      <Text style={styles.metricLabel}>{label}</Text>
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
    top: '-50%' as any,
    left: 0,
    right: 0,
    height: '100%',
    backgroundColor: '#4f46e5',
  },
  scrollView: {
    flex: 1,
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
    marginBottom: 6,
  },
  backButton: {
    padding: 2,
  },
  title: {
    fontSize: 22,
    fontWeight: 'bold',
    color: '#ffffff',
  },
  subtitle: {
    color: 'rgba(255,255,255,0.8)',
    fontSize: 14,
    marginLeft: 32,
  },
  content: {
    backgroundColor: '#f3f4f6',
    borderTopLeftRadius: 24,
    borderTopRightRadius: 24,
    padding: 20,
    minHeight: 400,
  },
  loadingContainer: {
    alignItems: 'center',
    paddingTop: 60,
    gap: 12,
  },
  loadingText: {
    color: '#6b7280',
    fontSize: 15,
  },
  emptyContainer: {
    alignItems: 'center',
    paddingTop: 60,
    gap: 12,
  },
  emptyText: {
    color: '#6b7280',
    fontSize: 15,
  },
  sectionTitle: {
    fontSize: 18,
    fontWeight: 'bold',
    color: '#111827',
    marginBottom: 12,
    marginTop: 8,
  },
  highlightCard: {
    backgroundColor: '#ffffff',
    borderRadius: 12,
    padding: 24,
    alignItems: 'center',
    marginBottom: 24,
    gap: 10,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 1 },
    shadowOpacity: 0.08,
    shadowRadius: 3,
    elevation: 2,
  },
  highlightIconBg: {
    backgroundColor: '#e0e7ff',
    borderRadius: 40,
    padding: 14,
  },
  highlightValue: {
    fontSize: 52,
    fontWeight: 'bold',
    color: '#111827',
    lineHeight: 60,
  },
  highlightLabel: {
    fontSize: 15,
    color: '#6b7280',
    textAlign: 'center',
  },
  metricsGrid: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: 12,
    marginBottom: 20,
  },
  metricCard: {
    backgroundColor: '#ffffff',
    borderRadius: 12,
    padding: 16,
    width: '47%',
    borderLeftWidth: 4,
    alignItems: 'flex-start',
    gap: 8,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 1 },
    shadowOpacity: 0.06,
    shadowRadius: 2,
    elevation: 2,
  },
  metricIconBg: {
    borderRadius: 8,
    padding: 8,
  },
  metricValue: {
    fontSize: 26,
    fontWeight: 'bold',
    color: '#111827',
  },
  metricLabel: {
    fontSize: 12,
    color: '#6b7280',
    lineHeight: 16,
  },
  tipCard: {
    backgroundColor: '#fffbeb',
    borderRadius: 12,
    padding: 14,
    flexDirection: 'row',
    gap: 10,
    alignItems: 'flex-start',
    borderWidth: 1,
    borderColor: '#fde68a',
  },
  tipText: {
    flex: 1,
    fontSize: 13,
    color: '#92400e',
    lineHeight: 19,
  },
});
