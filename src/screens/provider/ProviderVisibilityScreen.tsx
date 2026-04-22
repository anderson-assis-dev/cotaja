import { View, Text, ScrollView, StyleSheet, ActivityIndicator, TouchableOpacity } from 'react-native';
import { useNavigation } from '@react-navigation/native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { useEffect, useState } from 'react';
import Icon from 'react-native-vector-icons/MaterialIcons';
import { Crown, TrendingUp, BarChart2, Eye, Clock } from 'lucide-react-native';
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
  is_premium: boolean;
  proposals_this_month?: number;
  avg_rank_position?: number;
  views_last_30d?: number;
  view_trend_pct?: number;
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

  const trendColor = (pct?: number) => (pct != null && pct >= 0 ? '#059669' : '#dc2626');

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
            <View style={styles.centerContainer}>
              <ActivityIndicator color="#4f46e5" size="large" />
              <Text style={styles.centerText}>Carregando métricas...</Text>
            </View>
          ) : !data ? (
            <View style={styles.centerContainer}>
              <Icon name="bar-chart" size={48} color="#d1d5db" />
              <Text style={styles.centerText}>Não foi possível carregar as métricas.</Text>
            </View>
          ) : !data.is_premium ? (
            <View style={styles.lockedContainer}>
              <View style={styles.lockedIconBg}>
                <Crown size={40} color="#f59e0b" />
              </View>
              <Text style={styles.lockedTitle}>Recurso Exclusivo Premium</Text>
              <Text style={styles.lockedSubtitle}>
                Acesse métricas detalhadas de desempenho: visualizações, taxa de conversão, posição média nas propostas e muito mais.
              </Text>
              <View style={styles.benefitsList}>
                {[
                  'Total e tendência de visualizações',
                  'Taxa de conversão das propostas',
                  'Posição média no ranking',
                  'Propostas enviadas este mês',
                  'Demandas disponíveis na sua área',
                ].map((b) => (
                  <View key={b} style={styles.benefitRow}>
                    <Icon name="check-circle" size={16} color="#4f46e5" />
                    <Text style={styles.benefitText}>{b}</Text>
                  </View>
                ))}
              </View>
              <TouchableOpacity
                style={styles.upgradeButton}
                onPress={() => navigation.navigate('Premium' as never)}
              >
                <Crown size={18} color="#ffffff" />
                <Text style={styles.upgradeButtonText}>Assinar Premium — R$ 9,90/mês</Text>
              </TouchableOpacity>
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
                <MetricCard icon="bar-chart"    label="Total de visualizações"  value={data.total_views}      color="#4f46e5" />
                <MetricCard icon="description"  label="Propostas enviadas"      value={data.total_proposals}  color="#0891b2" />
                <MetricCard icon="check-circle" label="Propostas aceitas"       value={data.total_accepted}   color="#059669" />
                <MetricCard icon="pending"      label="Aguardando resposta"     value={data.total_pending}    color="#d97706" />
                <MetricCard icon="trending-up"  label="Taxa de conversão"       value={`${data.conversion_rate}%`} color="#7c3aed" />
                <MetricCard icon="search"       label="Demandas disponíveis"    value={data.available_orders} color="#db2777" />
              </View>

              <Text style={styles.sectionTitle}>Últimos 30 dias</Text>
              <View style={styles.metricsGrid}>
                <View style={[styles.metricCard, { borderLeftColor: '#7c3aed' }]}>
                  <View style={[styles.metricIconBg, { backgroundColor: '#7c3aed18' }]}>
                    <BarChart2 size={20} color="#7c3aed" />
                  </View>
                  <Text style={styles.metricValue}>{data.proposals_this_month ?? '—'}</Text>
                  <Text style={styles.metricLabel}>Propostas este mês</Text>
                </View>

                <View style={[styles.metricCard, { borderLeftColor: '#0891b2' }]}>
                  <View style={[styles.metricIconBg, { backgroundColor: '#0891b218' }]}>
                    <TrendingUp size={20} color="#0891b2" />
                  </View>
                  <Text style={styles.metricValue}>
                    {data.avg_rank_position != null ? `#${data.avg_rank_position}` : '—'}
                  </Text>
                  <Text style={styles.metricLabel}>Posição média na lista</Text>
                </View>

                <View style={[styles.metricCard, { borderLeftColor: '#4f46e5' }]}>
                  <View style={[styles.metricIconBg, { backgroundColor: '#4f46e518' }]}>
                    <Eye size={20} color="#4f46e5" />
                  </View>
                  <Text style={styles.metricValue}>{data.views_last_30d ?? '—'}</Text>
                  <Text style={styles.metricLabel}>Visualizações (30 dias)</Text>
                </View>

                <View style={[styles.metricCard, { borderLeftColor: trendColor(data.view_trend_pct) }]}>
                  <View style={[styles.metricIconBg, { backgroundColor: trendColor(data.view_trend_pct) + '18' }]}>
                    <Clock size={20} color={trendColor(data.view_trend_pct)} />
                  </View>
                  <Text style={[styles.metricValue, { color: trendColor(data.view_trend_pct) }]}>
                    {data.view_trend_pct != null
                      ? `${data.view_trend_pct >= 0 ? '+' : ''}${data.view_trend_pct}%`
                      : '—'}
                  </Text>
                  <Text style={styles.metricLabel}>Tendência vs. mês anterior</Text>
                </View>
              </View>

              <View style={styles.tipCard}>
                <Icon name="lightbulb" size={18} color="#d97706" />
                <Text style={styles.tipText}>
                  Propostas detalhadas e bem escritas aumentam suas visualizações e taxa de conversão.
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
  container: { flex: 1, backgroundColor: '#f3f4f6' },
  headerBackground: {
    position: 'absolute',
    top: '-50%' as any,
    left: 0,
    right: 0,
    height: '100%',
    backgroundColor: '#4f46e5',
  },
  scrollView: { flex: 1 },
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
  backButton: { padding: 2 },
  title: { fontSize: 22, fontWeight: 'bold', color: '#ffffff' },
  subtitle: { color: 'rgba(255,255,255,0.8)', fontSize: 14, marginLeft: 32 },
  content: {
    backgroundColor: '#f3f4f6',
    borderTopLeftRadius: 24,
    borderTopRightRadius: 24,
    padding: 20,
    minHeight: 400,
  },
  centerContainer: {
    alignItems: 'center',
    paddingTop: 60,
    gap: 12,
  },
  centerText: { color: '#6b7280', fontSize: 15 },
  lockedContainer: {
    alignItems: 'center',
    paddingTop: 32,
    paddingHorizontal: 8,
    gap: 16,
  },
  lockedIconBg: {
    backgroundColor: '#fef3c7',
    borderRadius: 50,
    padding: 20,
  },
  lockedTitle: {
    fontSize: 20,
    fontWeight: 'bold',
    color: '#111827',
    textAlign: 'center',
  },
  lockedSubtitle: {
    fontSize: 14,
    color: '#6b7280',
    textAlign: 'center',
    lineHeight: 20,
  },
  benefitsList: {
    alignSelf: 'stretch',
    backgroundColor: '#ffffff',
    borderRadius: 12,
    padding: 16,
    gap: 10,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 1 },
    shadowOpacity: 0.06,
    shadowRadius: 2,
    elevation: 2,
  },
  benefitRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 10,
  },
  benefitText: { fontSize: 14, color: '#374151' },
  upgradeButton: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
    backgroundColor: '#4f46e5',
    borderRadius: 10,
    paddingVertical: 14,
    paddingHorizontal: 24,
    alignSelf: 'stretch',
    justifyContent: 'center',
  },
  upgradeButtonText: {
    color: '#ffffff',
    fontWeight: 'bold',
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
