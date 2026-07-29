import { useState, useEffect, useCallback } from 'react';
import { View, Text, ScrollView, TouchableOpacity, StyleSheet, ActivityIndicator, Alert } from 'react-native';
import { useNavigation } from '@react-navigation/native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { ArrowLeft, Crown, Check, Zap, TrendingUp, Star, Clock, BarChart2, RefreshCw } from 'lucide-react-native';
import { useAuth } from '../../contexts/AuthContext';
import { useToast } from '../../contexts/ToastContext';
import { subscriptionService, walletService, SubscriptionStatus } from '../../services/api';
import { useStatusBarOverlay } from '../../hooks/useStatusBarOverlay';
import { StatusBarOverlay } from '../../components/StatusBarOverlay';

const BENEFITS = [
  { icon: TrendingUp, text: 'Prioridade no feed de cotações — suas propostas aparecem primeiro para o cliente' },
  { icon: Zap,        text: 'Propostas ilimitadas por mês (plano gratuito: até 10/mês)' },
  { icon: Clock,      text: 'Acesso antecipado a novas cotações — 30 minutos antes dos outros' },
  { icon: Star,       text: 'Badge de prestador verificado no seu perfil' },
  { icon: BarChart2,  text: 'Métricas de performance: visualizações, taxa de resposta e mais' },
];

export default function PremiumScreen() {
  const navigation = useNavigation<any>();
  const insets = useSafeAreaInsets();
  const { user, refreshUser } = useAuth();
  const { showSuccess, showError } = useToast();
  const { showStatusBarOverlay, statusBarOpacity, handleScroll } = useStatusBarOverlay();

  const [status, setStatus] = useState<SubscriptionStatus | null>(null);
  const [loading, setLoading] = useState(true);
  const [subscribing, setSubscribing] = useState(false);
  const [cancelling, setCancelling] = useState(false);
  const [paymentMethods, setPaymentMethods] = useState<{ id: string; brand: string; last4: string }[]>([]);

  const fetchData = useCallback(async () => {
    setLoading(true);
    try {
      const [statusRes, walletRes] = await Promise.allSettled([
        subscriptionService.getStatus(),
        walletService.getWallet(),
      ]);
      if (statusRes.status === 'fulfilled' && statusRes.value.success) {
        setStatus(statusRes.value.data);
      }
      if (walletRes.status === 'fulfilled' && walletRes.value.success) {
        setPaymentMethods(walletRes.value.data.payment_methods || []);
      }
    } catch {
      showError('Erro ao carregar dados do plano.');
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => { fetchData(); }, [fetchData]);

  const handleSubscribe = async () => {
    if (paymentMethods.length === 0) {
      Alert.alert(
        'Cartão necessário',
        'Adicione um cartão de crédito na sua carteira antes de assinar.',
        [
          { text: 'Cancelar', style: 'cancel' },
          { text: 'Ir para Carteira', onPress: () => navigation.navigate('Wallet') },
        ]
      );
      return;
    }

    const pm = paymentMethods[0];
    Alert.alert(
      'Confirmar assinatura',
      `Cobrar R$ 9,90/mês no cartão •••• ${pm.last4}?`,
      [
        { text: 'Cancelar', style: 'cancel' },
        {
          text: 'Confirmar',
          onPress: async () => {
            setSubscribing(true);
            try {
              const res = await subscriptionService.subscribe(pm.id);
              if (res.success) {
                showSuccess('Plano Premium ativado com sucesso!');
                await fetchData();
                await refreshUser();
              } else {
                showError(res.message || 'Erro ao assinar.');
              }
            } catch {
              showError('Erro ao processar pagamento.');
            } finally {
              setSubscribing(false);
            }
          },
        },
      ]
    );
  };

  const handleCancel = () => {
    Alert.alert(
      'Cancelar assinatura',
      'Você continuará com acesso premium até o fim do período atual. Deseja cancelar?',
      [
        { text: 'Manter plano', style: 'cancel' },
        {
          text: 'Cancelar mesmo assim',
          style: 'destructive',
          onPress: async () => {
            setCancelling(true);
            try {
              const res = await subscriptionService.cancel();
              if (res.success) {
                showSuccess(res.message);
                await fetchData();
                await refreshUser();
              } else {
                showError(res.message || 'Erro ao cancelar.');
              }
            } catch {
              showError('Erro ao cancelar assinatura.');
            } finally {
              setCancelling(false);
            }
          },
        },
      ]
    );
  };

  const formatDate = (iso: string | null) => {
    if (!iso) return '';
    return new Date(iso).toLocaleDateString('pt-BR', { day: '2-digit', month: 'long', year: 'numeric' });
  };

  const isActive = status?.is_premium ?? false;
  const willCancel = status?.subscription?.cancel_at_period_end ?? false;

  return (
    <View style={styles.container}>
      <StatusBarOverlay show={showStatusBarOverlay} opacity={statusBarOpacity} />
      {showStatusBarOverlay && <View style={[styles.statusBarBg, { height: insets.top }]} />}

      <ScrollView
        onScroll={handleScroll}
        scrollEventThrottle={16}
        contentContainerStyle={{ paddingBottom: insets.bottom + 32 }}
        showsVerticalScrollIndicator={false}
      >
        {/* Header */}
        <View style={[styles.header, { paddingTop: insets.top + 16 }]}>
          <TouchableOpacity style={styles.backBtn} onPress={() => navigation.goBack()} activeOpacity={0.8}>
            <ArrowLeft size={22} color="#fff" />
          </TouchableOpacity>
          <Text style={styles.headerTitle}>Plano Premium</Text>
          <TouchableOpacity style={styles.refreshBtn} onPress={fetchData} activeOpacity={0.8}>
            <RefreshCw size={18} color="rgba(255,255,255,0.8)" />
          </TouchableOpacity>
        </View>

        <View style={styles.content}>
          {loading ? (
            <ActivityIndicator size="large" color="#4f46e5" style={{ marginTop: 40 }} />
          ) : (
            <>
              {/* Hero card */}
              <View style={[styles.heroCard, isActive && styles.heroCardActive]}>
                <View style={styles.heroIcon}>
                  <Crown size={36} color={isActive ? '#f59e0b' : '#4f46e5'} />
                </View>
                <Text style={styles.heroTitle}>
                  {isActive ? 'Você é Premium!' : 'Seja Premium'}
                </Text>
                <Text style={styles.heroPrice}>
                  R$ 9<Text style={styles.heroCents}>,90</Text>
                  <Text style={styles.heroPeriod}>/mês</Text>
                </Text>

                {isActive && status?.premium_until && (
                  <View style={[styles.statusBadge, willCancel ? styles.statusBadgeWarn : styles.statusBadgeOk]}>
                    <Text style={[styles.statusBadgeText, willCancel ? styles.statusBadgeTextWarn : styles.statusBadgeTextOk]}>
                      {willCancel
                        ? `Cancela em ${formatDate(status.subscription?.current_period_end ?? null)}`
                        : `Renova em ${formatDate(status.subscription?.current_period_end ?? null)}`}
                    </Text>
                  </View>
                )}
              </View>

              {/* Benefits */}
              <Text style={styles.sectionTitle}>O que está incluído</Text>
              <View style={styles.benefitsCard}>
                {BENEFITS.map(({ icon: Icon, text }, i) => (
                  <View key={i} style={[styles.benefitRow, i < BENEFITS.length - 1 && styles.benefitRowBorder]}>
                    <View style={styles.benefitIcon}>
                      <Icon size={18} color="#4f46e5" />
                    </View>
                    <Text style={styles.benefitText}>{text}</Text>
                    <Check size={16} color="#10b981" style={{ flexShrink: 0 }} />
                  </View>
                ))}
              </View>

              {/* Payment method info */}
              {!isActive && paymentMethods.length > 0 && (
                <View style={styles.cardInfo}>
                  <Text style={styles.cardInfoLabel}>Será cobrado no cartão</Text>
                  <Text style={styles.cardInfoValue}>
                    •••• •••• •••• {paymentMethods[0].last4}
                    {'  '}
                    <Text style={styles.cardBrand}>{paymentMethods[0].brand.toUpperCase()}</Text>
                  </Text>
                </View>
              )}

              {/* CTA */}
              {!isActive ? (
                <TouchableOpacity
                  style={[styles.ctaBtn, subscribing && styles.ctaBtnDisabled]}
                  onPress={handleSubscribe}
                  activeOpacity={0.85}
                  disabled={subscribing}
                >
                  {subscribing ? (
                    <ActivityIndicator size="small" color="#fff" />
                  ) : (
                    <>
                      <Crown size={18} color="#fff" />
                      <Text style={styles.ctaBtnText}>Assinar por R$ 9,90/mês</Text>
                    </>
                  )}
                </TouchableOpacity>
              ) : !willCancel ? (
                <TouchableOpacity
                  style={styles.cancelBtn}
                  onPress={handleCancel}
                  activeOpacity={0.85}
                  disabled={cancelling}
                >
                  {cancelling ? (
                    <ActivityIndicator size="small" color="#ef4444" />
                  ) : (
                    <Text style={styles.cancelBtnText}>Cancelar assinatura</Text>
                  )}
                </TouchableOpacity>
              ) : (
                <View style={styles.cancelledNotice}>
                  <Text style={styles.cancelledNoticeText}>
                    Assinatura cancelada. Acesso premium até {formatDate(status?.premium_until ?? null)}.
                  </Text>
                </View>
              )}

              <Text style={styles.fine}>
                Cobrança automática todo mês. Cancele quando quiser sem multa.
              </Text>
            </>
          )}
        </View>
      </ScrollView>
    </View>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: '#f9fafb' },
  statusBarBg: { position: 'absolute', top: 0, left: 0, right: 0, backgroundColor: '#4f46e5', zIndex: 10 },
  header: {
    backgroundColor: '#4f46e5',
    paddingHorizontal: 20,
    paddingBottom: 20,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
  },
  backBtn: { width: 36, height: 36, borderRadius: 10, backgroundColor: 'rgba(255,255,255,0.15)', justifyContent: 'center', alignItems: 'center' },
  headerTitle: { fontSize: 18, fontWeight: '700', color: '#fff', flex: 1, textAlign: 'center' },
  refreshBtn: { width: 36, height: 36, borderRadius: 10, backgroundColor: 'rgba(255,255,255,0.15)', justifyContent: 'center', alignItems: 'center' },
  content: { padding: 20 },

  heroCard: {
    backgroundColor: '#fff',
    borderRadius: 20,
    padding: 24,
    alignItems: 'center',
    marginBottom: 24,
    borderWidth: 2,
    borderColor: '#e0e7ff',
    shadowColor: '#4f46e5',
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.1,
    shadowRadius: 12,
    elevation: 4,
  },
  heroCardActive: { borderColor: '#f59e0b', shadowColor: '#f59e0b' },
  heroIcon: {
    width: 72, height: 72, borderRadius: 36,
    backgroundColor: '#f5f3ff',
    justifyContent: 'center', alignItems: 'center',
    marginBottom: 12,
  },
  heroTitle: { fontSize: 22, fontWeight: '800', color: '#111827', marginBottom: 8 },
  heroPrice: { fontSize: 40, fontWeight: '800', color: '#4f46e5', marginBottom: 12 },
  heroCents: { fontSize: 28 },
  heroPeriod: { fontSize: 16, color: '#6b7280', fontWeight: '500' },
  statusBadge: { borderRadius: 20, paddingHorizontal: 14, paddingVertical: 6, marginTop: 4 },
  statusBadgeOk: { backgroundColor: '#d1fae5' },
  statusBadgeWarn: { backgroundColor: '#fef3c7' },
  statusBadgeText: { fontSize: 13, fontWeight: '600' },
  statusBadgeTextOk: { color: '#065f46' },
  statusBadgeTextWarn: { color: '#92400e' },

  sectionTitle: { fontSize: 16, fontWeight: '700', color: '#111827', marginBottom: 12 },
  benefitsCard: {
    backgroundColor: '#fff',
    borderRadius: 16,
    borderWidth: 1,
    borderColor: '#e5e7eb',
    marginBottom: 20,
    overflow: 'hidden',
  },
  benefitRow: { flexDirection: 'row', alignItems: 'center', padding: 16, gap: 12 },
  benefitRowBorder: { borderBottomWidth: 1, borderBottomColor: '#f3f4f6' },
  benefitIcon: { width: 36, height: 36, borderRadius: 10, backgroundColor: '#f5f3ff', justifyContent: 'center', alignItems: 'center', flexShrink: 0 },
  benefitText: { flex: 1, fontSize: 13, color: '#374151', lineHeight: 18 },

  cardInfo: {
    backgroundColor: '#f5f3ff',
    borderRadius: 12,
    padding: 14,
    marginBottom: 16,
    borderWidth: 1,
    borderColor: '#e0e7ff',
  },
  cardInfoLabel: { fontSize: 12, color: '#6b7280', marginBottom: 4 },
  cardInfoValue: { fontSize: 15, fontWeight: '600', color: '#1f2937' },
  cardBrand: { fontWeight: '700', color: '#4f46e5' },

  ctaBtn: {
    backgroundColor: '#4f46e5',
    borderRadius: 14,
    paddingVertical: 16,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: 8,
    marginBottom: 12,
    shadowColor: '#4f46e5',
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.3,
    shadowRadius: 8,
    elevation: 4,
  },
  ctaBtnDisabled: { opacity: 0.7 },
  ctaBtnText: { fontSize: 16, fontWeight: '700', color: '#fff' },

  cancelBtn: {
    borderRadius: 14,
    paddingVertical: 14,
    alignItems: 'center',
    borderWidth: 1,
    borderColor: '#fecaca',
    marginBottom: 12,
  },
  cancelBtnText: { fontSize: 15, fontWeight: '600', color: '#ef4444' },

  cancelledNotice: {
    backgroundColor: '#fef3c7',
    borderRadius: 12,
    padding: 14,
    marginBottom: 12,
  },
  cancelledNoticeText: { fontSize: 13, color: '#92400e', textAlign: 'center' },

  fine: { fontSize: 12, color: '#9ca3af', textAlign: 'center', lineHeight: 18 },
});
