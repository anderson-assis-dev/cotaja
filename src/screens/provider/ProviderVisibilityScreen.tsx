import {
  View,
  Text,
  ScrollView,
  StyleSheet,
  ActivityIndicator,
  TouchableOpacity,
  Image,
  Alert,
} from 'react-native';
import { useNavigation } from '@react-navigation/native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { useEffect, useState } from 'react';
import Icon from 'react-native-vector-icons/MaterialIcons';
import {
  Crown,
  Eye,
  TrendingUp,
  TrendingDown,
  Send,
  CheckCircle,
  Clock,
  BarChart2,
  Users,
  AlertCircle,
} from 'lucide-react-native';
import { useStatusBarOverlay } from '../../hooks/useStatusBarOverlay';
import { StatusBarOverlay } from '../../components/StatusBarOverlay';
import { proposalService, VisibilityData, ProfileViewer, CategoryBreakdown, MonthlyHistory } from '../../services/api';

type Period = '7d' | '30d' | 'total';

const PERIOD_LABELS: Record<Period, string> = {
  '7d': 'Esta semana',
  '30d': 'Últimos 30 dias',
  total: 'Total',
};

function getPeriodViews(data: VisibilityData, period: Period): number {
  if (period === '7d') return data.views_this_week;
  if (period === '30d') return data.views_last_30d ?? 0;
  return data.total_views;
}

function getPeriodSublabel(period: Period): string {
  if (period === '7d') return 'nesta semana';
  if (period === '30d') return 'nos últimos 30 dias';
  return 'no total';
}

function getProposalsSublabel(data: VisibilityData, period: Period): string {
  if (period === '30d' && data.proposals_this_month != null) {
    return `${data.proposals_this_month} este mês`;
  }
  return `${data.total_proposals} no total`;
}

function getProposalsValue(data: VisibilityData, period: Period): number {
  if (period === '30d' && data.proposals_this_month != null) {
    return data.proposals_this_month;
  }
  return data.total_proposals;
}

function formatTimeAgo(dateStr: string): string {
  // MySQL DATETIME without timezone ("2025-04-24 17:45:00") must be treated as UTC
  const normalized = dateStr.includes('T') ? dateStr : dateStr.replace(' ', 'T') + 'Z';
  const diff = Date.now() - new Date(normalized).getTime();
  const minutes = Math.floor(diff / 60000);
  if (minutes < 1) return 'agora mesmo';
  if (minutes < 60) return `${minutes}min atrás`;
  const hours = Math.floor(minutes / 60);
  if (hours < 24) return `${hours}h atrás`;
  return `${Math.floor(hours / 24)}d atrás`;
}

/* ─── Main screen ──────────────────────────────────────────────── */

export default function ProviderVisibilityScreen() {
  const navigation = useNavigation<any>();
  const insets = useSafeAreaInsets();
  const { showStatusBarOverlay, statusBarOpacity, handleScroll } = useStatusBarOverlay();
  const [data, setData] = useState<VisibilityData | null>(null);
  const [loading, setLoading] = useState(true);
  const [period, setPeriod] = useState<Period>('7d');

  useEffect(() => {
    proposalService
      .getVisibility()
      .then(res => { if (res.success) setData(res.data); })
      .catch(console.error)
      .finally(() => setLoading(false));
  }, []);

  function renderContent() {
    if (loading) {
      return (
        <View style={styles.center}>
          <ActivityIndicator color="#4f46e5" size="large" />
          <Text style={styles.centerText}>Carregando métricas...</Text>
        </View>
      );
    }
    if (!data) {
      return (
        <View style={styles.center}>
          <Icon name="bar-chart" size={48} color="#d1d5db" />
          <Text style={styles.centerText}>Não foi possível carregar as métricas.</Text>
        </View>
      );
    }
    if (data.is_premium) {
      return (
        <PremiumContent
          data={data}
          period={period}
          onNavigatePremium={() => navigation.navigate('ProfileTab')}
          onViewerPress={(viewer) => {
            if (viewer.order_id) {
              navigation.navigate('MyServicesTab', {
                screen: 'AcceptedOrder',
                params: { orderId: viewer.order_id },
                initial: false,
              });
            } else {
              Alert.alert(
                'Sem cotação',
                `${viewer.name} visitou seu perfil mas ainda não abriu uma cotação com você.`,
              );
            }
          }}
        />
      );
    }
    return <PremiumLock onUpgrade={() => navigation.navigate('Premium' as never)} />;
  }

  return (
    <View style={styles.container}>
      <View style={styles.headerBg} />

      <ScrollView
        style={styles.scroll}
        onScroll={handleScroll}
        scrollEventThrottle={16}
        contentContainerStyle={{ paddingBottom: insets.bottom + 32 }}
      >
        <View style={[styles.header, { paddingTop: insets.top + 14 }]}>
          <View style={styles.headerRow}>
            <TouchableOpacity
              onPress={() => navigation.goBack()}
              hitSlop={{ top: 8, bottom: 8, left: 8, right: 8 }}
            >
              <Icon name="arrow-back" size={22} color="#374151" />
            </TouchableOpacity>
            <Text style={styles.headerTitle}>Painel profissional</Text>
            <View style={{ width: 22 }} />
          </View>

          <View style={styles.periodRow}>
            {(Object.keys(PERIOD_LABELS) as Period[]).map(p => (
              <TouchableOpacity
                key={p}
                style={[styles.periodTab, period === p && styles.periodTabActive]}
                onPress={() => setPeriod(p)}
              >
                <Text style={[styles.periodTabText, period === p && styles.periodTabTextActive]}>
                  {PERIOD_LABELS[p]}
                </Text>
              </TouchableOpacity>
            ))}
          </View>
        </View>

        <View style={styles.content}>{renderContent()}</View>
      </ScrollView>

      <StatusBarOverlay show={showStatusBarOverlay} opacity={statusBarOpacity} />
    </View>
  );
}

/* ─── Premium content (extracted to lower complexity) ─────────── */

function PremiumContent({
  data,
  period,
  onNavigatePremium,
  onViewerPress,
}: Readonly<{
  data: VisibilityData;
  period: Period;
  onNavigatePremium: () => void;
  onViewerPress: (viewer: ProfileViewer) => void;
}>) {
  const trendPositive = (data.view_trend_pct ?? 0) >= 0;
  const trendColor = trendPositive ? '#059669' : '#dc2626';
  const trendIconBg = trendPositive ? '#d1fae5' : '#fee2e2';
  const trendPrefix = (data.view_trend_pct ?? 0) >= 0 ? '+' : '';
  const visitLabel = data.profile_views_today === 1 ? 'visita' : 'visitas';
  const fomoVerb = data.no_quote_today === 1 ? 'cliente viu' : 'clientes viram';
  const aboveAvg = data.conversion_rate > 18;

  return (
    <>
      {data.no_quote_today > 0 && (
        <View style={styles.fomoCard}>
          <View style={styles.fomoIconBg}>
            <Eye size={20} color="#b45309" />
          </View>
          <View style={{ flex: 1 }}>
            <Text style={styles.fomoTitle}>
              {data.no_quote_today} {fomoVerb} seu perfil hoje mas não abriram cotação
            </Text>
            <Text style={styles.fomoSub}>Saiba quem são e aumente suas chances</Text>
          </View>
        </View>
      )}

      <Text style={styles.sectionTitle}>Insights</Text>
      <View style={styles.card}>
        <InsightRow
          Icon={<Eye size={18} color="#4f46e5" />}
          iconBg="#eef2ff"
          label="Visualizações"
          sublabel={getPeriodSublabel(period)}
          value={getPeriodViews(data, period)}
        />
        <Divider />
        <InsightRow
          Icon={<Send size={18} color="#0891b2" />}
          iconBg="#e0f2fe"
          label="Propostas enviadas"
          sublabel={getProposalsSublabel(data, period)}
          value={getProposalsValue(data, period)}
        />
        <Divider />
        <InsightRow
          Icon={<CheckCircle size={18} color="#059669" />}
          iconBg="#d1fae5"
          label="Propostas aceitas"
          sublabel={`de ${data.total_proposals} enviadas`}
          value={data.total_accepted}
        />
        <Divider />
        <InsightRow
          Icon={<BarChart2 size={18} color="#7c3aed" />}
          iconBg="#ede9fe"
          label="Taxa de conversão"
          sublabel="média da categoria: 18%"
          value={`${data.conversion_rate}%`}
          highlight={aboveAvg}
        />
      </View>

      <Text style={styles.sectionTitle}>Quem visitou seu perfil</Text>
      <ProfileViewersCard data={data} visitLabel={visitLabel} onViewerPress={onViewerPress} />

      <Text style={styles.sectionTitle}>Desempenho</Text>
      <View style={styles.card}>
        {data.avg_rank_position != null && (
          <>
            <InsightRow
              Icon={<TrendingUp size={18} color="#0891b2" />}
              iconBg="#e0f2fe"
              label="Posição média no ranking"
              sublabel="entre propostas concorrentes"
              value={`#${data.avg_rank_position}`}
            />
            <Divider />
          </>
        )}
        {data.view_trend_pct != null && (
          <>
            <InsightRow
              Icon={
                trendPositive
                  ? <TrendingUp size={18} color={trendColor} />
                  : <TrendingDown size={18} color={trendColor} />
              }
              iconBg={trendIconBg}
              label="Tendência de visualizações"
              sublabel="comparado ao mês anterior"
              value={`${trendPrefix}${data.view_trend_pct}%`}
              valueColor={trendColor}
            />
            <Divider />
          </>
        )}
        <InsightRow
          Icon={<Clock size={18} color="#d97706" />}
          iconBg="#fef3c7"
          label="Propostas aguardando"
          sublabel="em aberto"
          value={data.total_pending}
        />
      </View>

      <Text style={styles.sectionTitle}>Categorias que mais fecham</Text>
      <CategoryRankingCard items={data.category_breakdown ?? []} />

      <Text style={styles.sectionTitle}>Tempo médio de resposta</Text>
      <ResponseTimeCard hours={data.avg_response_hours} />

      {data.monthly_history && data.monthly_history.length > 0 && (
        <>
          <Text style={styles.sectionTitle}>Histórico de propostas</Text>
          <MonthlyHistoryCard history={data.monthly_history} />
        </>
      )}

      <Text style={styles.sectionTitle}>Próximas etapas</Text>
      <View style={styles.card}>
        <NextStep
          icon="description"
          color="#4f46e5"
          title="Escreva propostas mais detalhadas"
          sub="Propostas com descrição completa convertem até 3x mais"
        />
        <Divider />
        <NextStep
          icon="speed"
          color="#059669"
          title="Responda rápido para subir no ranking"
          sub="Prestadores que respondem em menos de 1h aparecem primeiro"
        />
        <Divider />
        <NextStep
          icon="person"
          color="#7c3aed"
          title="Complete seu perfil"
          sub="Perfis completos recebem até 40% mais visualizações"
          onPress={onNavigatePremium}
        />
      </View>

      <View style={styles.tipCard}>
        <AlertCircle size={16} color="#d97706" />
        <Text style={styles.tipText}>
          Sua taxa de conversão de{' '}
          <Text style={{ fontWeight: '700' }}>{data.conversion_rate}%</Text>{' '}
          está {aboveAvg ? 'acima' : 'abaixo'} da média da categoria (18%).
          {aboveAvg ? ' Continue assim!' : ' Tente propostas mais personalizadas.'}
        </Text>
      </View>
    </>
  );
}

/* ─── Profile viewers card ─────────────────────────────────────── */

function ProfileViewersCard({
  data,
  visitLabel,
  onViewerPress,
}: Readonly<{ data: VisibilityData; visitLabel: string; onViewerPress: (viewer: ProfileViewer) => void }>) {
  if (data.profile_views_today === 0) {
    return (
      <View style={[styles.card, styles.emptyViewers]}>
        <Users size={32} color="#d1d5db" />
        <Text style={styles.emptyViewersText}>
          Nenhuma visita registrada ainda.{'\n'}Complete seu perfil para aparecer mais.
        </Text>
      </View>
    );
  }

  return (
    <View style={styles.card}>
      <View style={styles.viewersHeader}>
        <Text style={styles.viewersCount}>
          {data.profile_views_today} {visitLabel} hoje
        </Text>
        {data.no_quote_today > 0 && (
          <View style={styles.noQuoteBadge}>
            <Text style={styles.noQuoteBadgeText}>{data.no_quote_today} sem cotação</Text>
          </View>
        )}
      </View>
      {data.profile_viewers.length === 0 ? (
        <Text style={styles.viewersEmptyText}>
          Dados de visitantes disponíveis para novos acessos
        </Text>
      ) : (
        data.profile_viewers.map((viewer, index) => (
          <View key={viewer.id}>
            {index > 0 && <Divider />}
            <ViewerRow viewer={viewer} onPress={() => onViewerPress(viewer)} />
          </View>
        ))
      )}
    </View>
  );
}

/* ─── Reusable sub-components ──────────────────────────────────── */

function PremiumLock({ onUpgrade }: Readonly<{ onUpgrade: () => void }>) {
  return (
    <View style={styles.lockedContainer}>
      <View style={styles.lockedIconBg}>
        <Crown size={40} color="#f59e0b" />
      </View>
      <Text style={styles.lockedTitle}>Recurso Exclusivo Premium</Text>
      <Text style={styles.lockedSub}>
        Acesse métricas de desempenho, veja quem visitou seu perfil, entenda sua taxa de conversão e muito mais.
      </Text>
      <View style={styles.benefitsList}>
        {[
          { icon: 'visibility', text: 'Total e tendência de visualizações' },
          { icon: 'trending-up', text: 'Taxa de conversão das propostas' },
          { icon: 'people', text: 'Veja quem visitou seu perfil' },
          { icon: 'leaderboard', text: 'Posição média no ranking' },
          { icon: 'insights', text: 'Benchmarks da sua categoria' },
        ].map(b => (
          <View key={b.text} style={styles.benefitRow}>
            <Icon name={b.icon} size={16} color="#4f46e5" />
            <Text style={styles.benefitText}>{b.text}</Text>
          </View>
        ))}
      </View>
      <TouchableOpacity style={styles.upgradeBtn} onPress={onUpgrade}>
        <Crown size={18} color="#fff" />
        <Text style={styles.upgradeBtnText}>Assinar Premium — R$ 9,90/mês</Text>
      </TouchableOpacity>
    </View>
  );
}

function InsightRow({
  Icon: IconEl,
  iconBg,
  label,
  sublabel,
  value,
  highlight,
  valueColor,
}: Readonly<{
  Icon: React.ReactNode;
  iconBg: string;
  label: string;
  sublabel: string;
  value: number | string;
  highlight?: boolean;
  valueColor?: string;
}>) {
  const resolvedColor = valueColor ?? (highlight ? '#4f46e5' : undefined);
  return (
    <View style={styles.insightRow}>
      <View style={[styles.insightIconBg, { backgroundColor: iconBg }]}>{IconEl}</View>
      <View style={{ flex: 1 }}>
        <Text style={styles.insightLabel}>{label}</Text>
        <Text style={styles.insightSublabel}>{sublabel}</Text>
      </View>
      <Text style={[styles.insightValue, resolvedColor ? { color: resolvedColor } : null]}>
        {value}
      </Text>
    </View>
  );
}

function ViewerRow({ viewer, onPress }: Readonly<{ viewer: ProfileViewer; onPress: () => void }>) {
  let avatarUri: string | null = null;
  if (viewer.avatar_base64) {
    avatarUri = viewer.avatar_base64.startsWith('data:')
      ? viewer.avatar_base64
      : `data:image/jpeg;base64,${viewer.avatar_base64}`;
  }

  return (
    <TouchableOpacity style={styles.viewerRow} onPress={onPress} activeOpacity={0.7}>
      {avatarUri ? (
        <Image source={{ uri: avatarUri }} style={styles.viewerAvatar} />
      ) : (
        <View style={[styles.viewerAvatar, styles.viewerAvatarFallback]}>
          <Icon name="person" size={18} color="#9ca3af" />
        </View>
      )}
      <View style={{ flex: 1 }}>
        <Text style={styles.viewerName}>{viewer.name}</Text>
        <Text style={styles.viewerTime}>{formatTimeAgo(viewer.viewed_at)}</Text>
      </View>
      {viewer.opened_quote ? (
        <Icon name="chevron-right" size={18} color="#9ca3af" />
      ) : (
        <View style={styles.noQuoteTag}>
          <Text style={styles.noQuoteTagText}>Sem cotação</Text>
        </View>
      )}
    </TouchableOpacity>
  );
}

/* ─── Category ranking card ────────────────────────────────────── */

const MONTH_NAMES = ['Jan','Fev','Mar','Abr','Mai','Jun','Jul','Ago','Set','Out','Nov','Dez'];

function formatResponseTime(hours: number): string {
  if (Number.isNaN(hours) || hours <= 0) return '—';
  if (hours < 1) return `${Math.round(hours * 60)}min`;
  if (hours < 24) return `${Math.round(hours)}h`;
  return `${Math.round(hours / 24)}d`;
}

function CategoryRankingCard({ items }: Readonly<{ items: CategoryBreakdown[] }>) {
  if (items.length === 0) {
    return (
      <View style={[styles.card, styles.emptyViewers]}>
        <BarChart2 size={28} color="#d1d5db" />
        <Text style={styles.emptyViewersText}>Nenhuma proposta enviada ainda</Text>
      </View>
    );
  }
  const maxRate = Math.max(...items.map(i => i.rate), 1);
  return (
    <View style={styles.card}>
      {items.map((item, index) => (
        <View key={item.category}>
          {index > 0 && <Divider />}
          <View style={styles.categoryRow}>
            <View style={[styles.categoryRankBadge, index === 0 && styles.categoryRankBadgeTop]}>
              <Text style={[styles.categoryRankText, index === 0 && styles.categoryRankTextTop]}>
                #{index + 1}
              </Text>
            </View>
            <View style={{ flex: 1 }}>
              <View style={styles.categoryNameRow}>
                <Text style={styles.categoryName} numberOfLines={1}>{item.category}</Text>
                <Text style={[styles.categoryRate, index === 0 && { color: '#4f46e5' }]}>
                  {item.rate}%
                </Text>
              </View>
              <View style={styles.categoryBarBg}>
                <View style={[styles.categoryBarFill, { width: `${(item.rate / maxRate) * 100}%` as any }]} />
              </View>
              <Text style={styles.categoryStats}>
                {item.accepted} aceitas de {item.total} enviadas
              </Text>
            </View>
          </View>
        </View>
      ))}
    </View>
  );
}

/* ─── Response time card ───────────────────────────────────────── */

function ResponseTimeCard({ hours }: Readonly<{ hours: number | null | undefined }>) {
  if (hours == null || Number.isNaN(hours) || hours <= 0) {
    return (
      <View style={[styles.card, styles.emptyViewers]}>
        <Clock size={28} color="#d1d5db" />
        <Text style={styles.emptyViewersText}>Sem dados de tempo de resposta ainda</Text>
      </View>
    );
  }
  const isFast = hours < 4;
  const isMedium = !isFast && hours <= 12;
  let color = '#dc2626';
  let badge = 'Lento';
  if (isFast) { color = '#059669'; badge = 'Rápido ✓'; }
  else if (isMedium) { color = '#d97706'; badge = 'Médio'; }
  const abovePlatform = isFast;
  return (
    <View style={styles.card}>
      <View style={styles.responseTimeRow}>
        <View style={[styles.responseTimeBg, { backgroundColor: `${color}18` }]}>
          <Clock size={22} color={color} />
        </View>
        <View style={{ flex: 1 }}>
          <Text style={[styles.responseTimeValue, { color }]}>{formatResponseTime(hours)}</Text>
          <Text style={styles.responseTimeLabel}>tempo médio de resposta</Text>
        </View>
        <View style={[styles.responseTimeBadge, { backgroundColor: `${color}18` }]}>
          <Text style={[styles.responseTimeBadgeText, { color }]}>{badge}</Text>
        </View>
      </View>
      <Divider />
      <View style={styles.benchmarkRow}>
        <Icon name="people" size={14} color="#9ca3af" />
        <Text style={styles.benchmarkText}>Média da plataforma: 4h</Text>
        {abovePlatform && (
          <Text style={styles.benchmarkAbove}>você está acima</Text>
        )}
      </View>
    </View>
  );
}

/* ─── Monthly history card ─────────────────────────────────────── */

function MonthlyHistoryCard({ history }: Readonly<{ history: MonthlyHistory[] }>) {
  const maxTotal = Math.max(...history.map(h => h.total), 1);
  return (
    <View style={styles.card}>
      {history.map((item, index) => {
        const parts = item.month.split('-');
        const monthLabel = `${MONTH_NAMES[Number.parseInt(parts[1], 10) - 1]} ${parts[0]}`;
        const acceptedPct = item.total > 0 ? Math.round((item.accepted / item.total) * 100) : 0;
        return (
          <View key={item.month}>
            {index > 0 && <Divider />}
            <View style={styles.historyRow}>
              <Text style={styles.historyMonth}>{monthLabel}</Text>
              <View style={styles.historyBarWrap}>
                <View style={styles.historyBarBg}>
                  <View style={[styles.historyBarTotal, { width: `${(item.total / maxTotal) * 100}%` as any }]} />
                </View>
                <View style={styles.historyBarBg}>
                  <View style={[styles.historyBarAccepted, { width: `${(item.accepted / maxTotal) * 100}%` as any }]} />
                </View>
              </View>
              <View style={styles.historyNumbers}>
                <Text style={styles.historyTotal}>{item.total}</Text>
                <Text style={styles.historyAccepted}>{item.accepted}✓</Text>
              </View>
              <Text style={[styles.historyRate, acceptedPct >= 30 && { color: '#059669' }]}>
                {acceptedPct}%
              </Text>
            </View>
          </View>
        );
      })}
      <View style={styles.historyLegend}>
        <View style={styles.historyLegendItem}>
          <View style={[styles.historyLegendDot, { backgroundColor: '#e0e7ff' }]} />
          <Text style={styles.historyLegendText}>Enviadas</Text>
        </View>
        <View style={styles.historyLegendItem}>
          <View style={[styles.historyLegendDot, { backgroundColor: '#4f46e5' }]} />
          <Text style={styles.historyLegendText}>Aceitas</Text>
        </View>
      </View>
    </View>
  );
}

/* ─────────────────────────────────────────────────────────────── */

function NextStep({
  icon,
  color,
  title,
  sub,
  onPress,
}: Readonly<{ icon: string; color: string; title: string; sub: string; onPress?: () => void }>) {
  return (
    <TouchableOpacity style={styles.nextStep} onPress={onPress} disabled={!onPress}>
      <View style={[styles.nextStepIcon, { backgroundColor: `${color}18` }]}>
        <Icon name={icon} size={20} color={color} />
      </View>
      <View style={{ flex: 1 }}>
        <Text style={styles.nextStepTitle}>{title}</Text>
        <Text style={styles.nextStepSub}>{sub}</Text>
      </View>
      {onPress && <Icon name="chevron-right" size={20} color="#9ca3af" />}
    </TouchableOpacity>
  );
}

function Divider() {
  return <View style={styles.divider} />;
}

/* ─── Styles ───────────────────────────────────────────────────── */

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: '#f3f4f6' },

  headerBg: {
    position: 'absolute',
    top: 0,
    left: 0,
    right: 0,
    height: 200,
    backgroundColor: '#4f46e5',
  },

  scroll: { flex: 1 },

  header: {
    backgroundColor: '#fff',
    paddingHorizontal: 20,
    paddingBottom: 16,
    borderBottomWidth: 1,
    borderBottomColor: '#f3f4f6',
  },
  headerRow: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    marginBottom: 16,
  },
  headerTitle: {
    fontSize: 18,
    fontWeight: '700',
    color: '#111827',
  },

  periodRow: {
    flexDirection: 'row',
    backgroundColor: '#f3f4f6',
    borderRadius: 10,
    padding: 3,
    gap: 2,
  },
  periodTab: {
    flex: 1,
    paddingVertical: 7,
    borderRadius: 8,
    alignItems: 'center',
  },
  periodTabActive: {
    backgroundColor: '#fff',
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 1 },
    shadowOpacity: 0.08,
    shadowRadius: 2,
    elevation: 1,
  },
  periodTabText: {
    fontSize: 12,
    fontWeight: '600',
    color: '#6b7280',
  },
  periodTabTextActive: {
    color: '#4f46e5',
  },

  content: {
    backgroundColor: '#f3f4f6',
    borderTopLeftRadius: 24,
    borderTopRightRadius: 24,
    padding: 20,
    marginTop: -12,
  },

  center: {
    alignItems: 'center',
    paddingTop: 60,
    gap: 12,
  },
  centerText: { color: '#6b7280', fontSize: 15 },

  sectionTitle: {
    fontSize: 16,
    fontWeight: '700',
    color: '#111827',
    marginTop: 20,
    marginBottom: 10,
  },

  card: {
    backgroundColor: '#fff',
    borderRadius: 14,
    overflow: 'hidden',
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 1 },
    shadowOpacity: 0.06,
    shadowRadius: 3,
    elevation: 2,
  },

  divider: {
    height: 1,
    backgroundColor: '#f3f4f6',
    marginHorizontal: 16,
  },

  fomoCard: {
    backgroundColor: '#fef3c7',
    borderRadius: 14,
    padding: 14,
    flexDirection: 'row',
    alignItems: 'flex-start',
    gap: 12,
    borderWidth: 1,
    borderColor: '#fde68a',
    marginBottom: 4,
  },
  fomoIconBg: {
    backgroundColor: '#fde68a',
    borderRadius: 8,
    padding: 8,
  },
  fomoTitle: {
    fontSize: 14,
    fontWeight: '600',
    color: '#92400e',
    lineHeight: 20,
  },
  fomoSub: {
    fontSize: 12,
    color: '#b45309',
    marginTop: 2,
  },

  insightRow: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: 16,
    paddingVertical: 14,
    gap: 12,
  },
  insightIconBg: {
    width: 36,
    height: 36,
    borderRadius: 10,
    alignItems: 'center',
    justifyContent: 'center',
  },
  insightLabel: {
    fontSize: 14,
    fontWeight: '600',
    color: '#111827',
  },
  insightSublabel: {
    fontSize: 12,
    color: '#9ca3af',
    marginTop: 1,
  },
  insightValue: {
    fontSize: 22,
    fontWeight: '700',
    color: '#111827',
    minWidth: 48,
    textAlign: 'right',
  },

  viewersHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingHorizontal: 16,
    paddingVertical: 12,
  },
  viewersCount: {
    fontSize: 14,
    fontWeight: '600',
    color: '#374151',
  },
  noQuoteBadge: {
    backgroundColor: '#fef3c7',
    borderRadius: 6,
    paddingHorizontal: 8,
    paddingVertical: 3,
  },
  noQuoteBadgeText: {
    fontSize: 11,
    fontWeight: '600',
    color: '#b45309',
  },
  viewersEmptyText: {
    fontSize: 13,
    color: '#9ca3af',
    textAlign: 'center',
    paddingHorizontal: 16,
    paddingBottom: 14,
  },
  emptyViewers: {
    alignItems: 'center',
    paddingVertical: 28,
    gap: 10,
  },
  emptyViewersText: {
    fontSize: 13,
    color: '#9ca3af',
    textAlign: 'center',
    lineHeight: 20,
  },

  viewerRow: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: 16,
    paddingVertical: 12,
    gap: 12,
  },
  viewerAvatar: {
    width: 40,
    height: 40,
    borderRadius: 20,
  },
  viewerAvatarFallback: {
    backgroundColor: '#f3f4f6',
    alignItems: 'center',
    justifyContent: 'center',
  },
  viewerName: {
    fontSize: 14,
    fontWeight: '600',
    color: '#111827',
  },
  viewerTime: {
    fontSize: 12,
    color: '#9ca3af',
    marginTop: 1,
  },
  noQuoteTag: {
    backgroundColor: '#fff7ed',
    borderRadius: 6,
    paddingHorizontal: 7,
    paddingVertical: 3,
    borderWidth: 1,
    borderColor: '#fed7aa',
  },
  noQuoteTagText: {
    fontSize: 11,
    color: '#c2410c',
    fontWeight: '600',
  },

  nextStep: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: 16,
    paddingVertical: 14,
    gap: 12,
  },
  nextStepIcon: {
    width: 40,
    height: 40,
    borderRadius: 10,
    alignItems: 'center',
    justifyContent: 'center',
  },
  nextStepTitle: {
    fontSize: 14,
    fontWeight: '600',
    color: '#111827',
  },
  nextStepSub: {
    fontSize: 12,
    color: '#6b7280',
    marginTop: 2,
    lineHeight: 17,
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
    marginTop: 20,
  },
  tipText: {
    flex: 1,
    fontSize: 13,
    color: '#92400e',
    lineHeight: 19,
  },

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
    fontWeight: '700',
    color: '#111827',
    textAlign: 'center',
  },
  lockedSub: {
    fontSize: 14,
    color: '#6b7280',
    textAlign: 'center',
    lineHeight: 20,
  },
  benefitsList: {
    alignSelf: 'stretch',
    backgroundColor: '#fff',
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
  upgradeBtn: {
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
  upgradeBtnText: {
    color: '#fff',
    fontWeight: '700',
    fontSize: 15,
  },

  /* Category ranking */
  categoryRow: {
    flexDirection: 'row',
    alignItems: 'flex-start',
    paddingHorizontal: 16,
    paddingVertical: 12,
    gap: 10,
  },
  categoryRankBadge: {
    width: 28,
    height: 28,
    borderRadius: 8,
    backgroundColor: '#f3f4f6',
    alignItems: 'center',
    justifyContent: 'center',
    marginTop: 2,
  },
  categoryRankBadgeTop: {
    backgroundColor: '#eef2ff',
  },
  categoryRankText: {
    fontSize: 12,
    fontWeight: '700',
    color: '#6b7280',
  },
  categoryRankTextTop: {
    color: '#4f46e5',
  },
  categoryNameRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 6,
  },
  categoryName: {
    fontSize: 14,
    fontWeight: '600',
    color: '#111827',
    flex: 1,
    marginRight: 8,
  },
  categoryRate: {
    fontSize: 15,
    fontWeight: '700',
    color: '#374151',
  },
  categoryBarBg: {
    height: 6,
    backgroundColor: '#f3f4f6',
    borderRadius: 3,
    overflow: 'hidden',
    marginBottom: 4,
  },
  categoryBarFill: {
    height: 6,
    backgroundColor: '#4f46e5',
    borderRadius: 3,
  },
  categoryStats: {
    fontSize: 11,
    color: '#9ca3af',
  },

  /* Response time */
  responseTimeRow: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: 16,
    paddingVertical: 14,
    gap: 12,
  },
  responseTimeBg: {
    width: 44,
    height: 44,
    borderRadius: 12,
    alignItems: 'center',
    justifyContent: 'center',
  },
  responseTimeValue: {
    fontSize: 22,
    fontWeight: '700',
  },
  responseTimeLabel: {
    fontSize: 12,
    color: '#9ca3af',
    marginTop: 1,
  },
  responseTimeBadge: {
    borderRadius: 8,
    paddingHorizontal: 10,
    paddingVertical: 5,
  },
  responseTimeBadgeText: {
    fontSize: 12,
    fontWeight: '700',
  },
  benchmarkRow: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: 16,
    paddingVertical: 10,
    gap: 6,
  },
  benchmarkText: {
    fontSize: 12,
    color: '#9ca3af',
    flex: 1,
  },
  benchmarkAbove: {
    fontSize: 12,
    color: '#059669',
    fontWeight: '600',
  },

  /* Monthly history */
  historyRow: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: 16,
    paddingVertical: 10,
    gap: 10,
  },
  historyMonth: {
    fontSize: 12,
    fontWeight: '600',
    color: '#374151',
    width: 52,
  },
  historyBarWrap: {
    flex: 1,
    gap: 3,
  },
  historyBarBg: {
    height: 5,
    backgroundColor: '#f3f4f6',
    borderRadius: 3,
    overflow: 'hidden',
  },
  historyBarTotal: {
    height: 5,
    backgroundColor: '#e0e7ff',
    borderRadius: 3,
  },
  historyBarAccepted: {
    height: 5,
    backgroundColor: '#4f46e5',
    borderRadius: 3,
  },
  historyNumbers: {
    alignItems: 'flex-end',
    gap: 2,
  },
  historyTotal: {
    fontSize: 11,
    color: '#6b7280',
    fontWeight: '600',
  },
  historyAccepted: {
    fontSize: 11,
    color: '#4f46e5',
    fontWeight: '600',
  },
  historyRate: {
    fontSize: 13,
    fontWeight: '700',
    color: '#374151',
    width: 36,
    textAlign: 'right',
  },
  historyLegend: {
    flexDirection: 'row',
    gap: 16,
    paddingHorizontal: 16,
    paddingVertical: 10,
    borderTopWidth: 1,
    borderTopColor: '#f3f4f6',
  },
  historyLegendItem: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
  },
  historyLegendDot: {
    width: 10,
    height: 10,
    borderRadius: 3,
  },
  historyLegendText: {
    fontSize: 11,
    color: '#6b7280',
  },
});
