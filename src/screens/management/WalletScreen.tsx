import { useState, useEffect, useCallback } from 'react';
import { View, Text, ScrollView, TouchableOpacity, StyleSheet, ActivityIndicator, Alert } from 'react-native';
import { useNavigation } from '@react-navigation/native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { ArrowLeft, CreditCard, Trash2, Plus, RefreshCw, Wallet } from 'lucide-react-native';
import { useAuth } from '../../contexts/AuthContext';
import { useToast } from '../../contexts/ToastContext';
import { walletService } from '../../services/api';
import { useStatusBarOverlay } from '../../hooks/useStatusBarOverlay';
import { StatusBarOverlay } from '../../components/StatusBarOverlay';
import { SkeletonBlock } from '../../components/Skeleton';

interface PaymentMethod {
  id: string;
  brand: string;
  last4: string;
  exp_month: number;
  exp_year: number;
}

interface WalletData {
  stripe_customer_id: string;
  balance: number;
  currency: string;
  payment_methods: PaymentMethod[];
}

const BRAND_LABELS: Record<string, string> = {
  visa: 'Visa',
  mastercard: 'Mastercard',
  amex: 'American Express',
  discover: 'Discover',
  elo: 'Elo',
  hipercard: 'Hipercard',
};

export default function WalletScreen() {
  const navigation = useNavigation<any>();
  const insets = useSafeAreaInsets();
  const { user } = useAuth();
  const { showSuccess, showError } = useToast();
  const { showStatusBarOverlay, statusBarOpacity, handleScroll } = useStatusBarOverlay();
  const [wallet, setWallet] = useState<WalletData | null>(null);
  const [loading, setLoading] = useState(true);
  const [removingId, setRemovingId] = useState<string | null>(null);

  const fetchWallet = useCallback(async () => {
    setLoading(true);
    try {
      const res = await walletService.getWallet();
      if (res.success) setWallet(res.data);
      else showError(res.message || 'Erro ao carregar carteira.');
    } catch (e: any) {
      if (e.response?.status === 404) {
        try {
          await walletService.createWallet();
          const retry = await walletService.getWallet();
          if (retry.success) setWallet(retry.data);
          else showError(retry.message || 'Erro ao carregar carteira.');
        } catch (createErr: any) {
          showError(createErr.response?.data?.message || 'Erro ao criar carteira.');
        }
      } else {
        showError(e.response?.data?.message || 'Erro ao carregar carteira.');
      }
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => { fetchWallet(); }, [fetchWallet]);

  const handleRemoveCard = (pmId: string) => {
    Alert.alert('Remover cartão', 'Deseja remover este cartão?', [
      { text: 'Cancelar', style: 'cancel' },
      {
        text: 'Remover',
        style: 'destructive',
        onPress: async () => {
          setRemovingId(pmId);
          try {
            await walletService.removeCard(pmId);
            showSuccess('Cartão removido com sucesso.');
            fetchWallet();
          } catch (e: any) {
            showError(e.response?.data?.message || 'Erro ao remover cartão.');
          } finally {
            setRemovingId(null);
          }
        },
      },
    ]);
  };

  const brandLabel = (brand: string) => BRAND_LABELS[brand] || brand.charAt(0).toUpperCase() + brand.slice(1);

  return (
    <View style={styles.container}>
      <View style={styles.headerBackground} />
      <ScrollView
        style={styles.scrollView}
        onScroll={handleScroll}
        scrollEventThrottle={16}
        contentContainerStyle={{ paddingBottom: insets.bottom + 32 }}
        showsVerticalScrollIndicator={false}
      >
        <View style={[styles.header, { paddingTop: insets.top + 16 }]}>
          <TouchableOpacity style={styles.backBtn} onPress={() => navigation.goBack()} activeOpacity={0.8}>
            <ArrowLeft size={22} color="#fff" />
          </TouchableOpacity>
          <Text style={styles.headerTitle}>Carteira</Text>
          <TouchableOpacity style={styles.refreshBtn} onPress={fetchWallet} activeOpacity={0.8}>
            <RefreshCw size={18} color="rgba(255,255,255,0.8)" />
          </TouchableOpacity>
        </View>
        <View style={styles.content}>
          {loading ? (
            <>
              <SkeletonBlock width="100%" height={100} borderRadius={16} style={{ marginBottom: 16 }} />
              <SkeletonBlock width="100%" height={72} borderRadius={14} style={{ marginBottom: 10 }} />
              <SkeletonBlock width="100%" height={72} borderRadius={14} style={{ marginBottom: 10 }} />
            </>
          ) : wallet ? (
            <>
              <View style={styles.balanceCard}>
                <View style={styles.balanceIconWrap}>
                  <Wallet size={28} color="#4f46e5" />
                </View>
                <Text style={styles.balanceLabel}>Saldo</Text>
                <Text style={styles.balanceValue}>
                  {((wallet.balance || 0) / 100).toLocaleString('pt-BR', { style: 'currency', currency: 'BRL' })}
                </Text>
                <Text style={styles.balanceNote}>
                  {user?.profile_type === 'provider'
                    ? 'Prestadores terão mensalidade após o período trial.'
                    : 'Use seus créditos para impulsionar pedidos.'}
                </Text>
              </View>

              <Text style={styles.sectionTitle}>Seus cartões</Text>
              {wallet.payment_methods.length === 0 ? (
                <View style={styles.emptyCard}>
                  <CreditCard size={32} color="#9ca3af" />
                  <Text style={styles.emptyText}>Nenhum cartão cadastrado.</Text>
                  <Text style={styles.emptySubText}>Adicione um cartão para facilitar pagamentos.</Text>
                </View>
              ) : (
                wallet.payment_methods.map(pm => (
                  <View key={pm.id} style={styles.cardRow}>
                    <View style={styles.cardIcon}>
                      <CreditCard size={20} color="#4f46e5" />
                    </View>
                    <View style={styles.cardInfo}>
                      <Text style={styles.cardBrand}>{brandLabel(pm.brand)}</Text>
                      <Text style={styles.cardLast4}>•••• •••• •••• {pm.last4}</Text>
                      <Text style={styles.cardExp}>Val: {String(pm.exp_month).padStart(2, '0')}/{pm.exp_year}</Text>
                    </View>
                    <TouchableOpacity
                      style={styles.removeBtn}
                      onPress={() => handleRemoveCard(pm.id)}
                      disabled={removingId === pm.id}
                      activeOpacity={0.7}
                    >
                      {removingId === pm.id ? (
                        <ActivityIndicator size="small" color="#dc2626" />
                      ) : (
                        <Trash2 size={18} color="#dc2626" />
                      )}
                    </TouchableOpacity>
                  </View>
                ))
              )}

              <TouchableOpacity
                style={styles.addCardBtn}
                activeOpacity={0.85}
                onPress={() => Alert.alert('Em breve', 'Integração com Stripe Checkout em breve.')}
              >
                <Plus size={18} color="#4f46e5" />
                <Text style={styles.addCardText}>Adicionar cartão</Text>
              </TouchableOpacity>
            </>
          ) : (
            <View style={styles.emptyCard}>
              <Wallet size={32} color="#9ca3af" />
              <Text style={styles.emptyText}>Carteira não disponível.</Text>
              <Text style={styles.emptySubText}>Entre em contato com o suporte.</Text>
            </View>
          )}
        </View>
      </ScrollView>
      <StatusBarOverlay show={showStatusBarOverlay} opacity={statusBarOpacity} forceLight />
    </View>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: '#f3f4f6' },
  headerBackground: {
    position: 'absolute',
    top: '-50%',
    left: 0,
    right: 0,
    height: '100%',
    backgroundColor: '#4f46e5',
  },
  header: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: 20,
    paddingBottom: 20,
    backgroundColor: '#4f46e5',
  },
  backBtn: { padding: 4, marginRight: 12 },
  refreshBtn: { padding: 4, marginLeft: 'auto' as any },
  headerTitle: { flex: 1, fontSize: 20, fontWeight: '700', color: '#fff' },
  scrollView: { flex: 1 },
  content: {
    backgroundColor: '#f3f4f6',
    borderTopLeftRadius: 24,
    borderTopRightRadius: 24,
    padding: 20,
    paddingBottom: 32,
    minHeight: 500,
  },
  balanceCard: {
    backgroundColor: '#fff',
    borderRadius: 16,
    padding: 24,
    alignItems: 'center',
    marginBottom: 24,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.07,
    shadowRadius: 6,
    elevation: 3,
  },
  balanceIconWrap: {
    width: 56,
    height: 56,
    borderRadius: 28,
    backgroundColor: '#e0e7ff',
    justifyContent: 'center',
    alignItems: 'center',
    marginBottom: 12,
  },
  balanceLabel: { fontSize: 13, color: '#6b7280', fontWeight: '600', textTransform: 'uppercase', letterSpacing: 0.4 },
  balanceValue: { fontSize: 32, fontWeight: '700', color: '#111827', marginTop: 4, marginBottom: 8 },
  balanceNote: { fontSize: 13, color: '#6b7280', textAlign: 'center', lineHeight: 18 },
  sectionTitle: { fontSize: 15, fontWeight: '700', color: '#111827', marginBottom: 12 },
  emptyCard: {
    backgroundColor: '#fff',
    borderRadius: 14,
    padding: 28,
    alignItems: 'center',
    marginBottom: 16,
    borderWidth: 1,
    borderColor: '#e5e7eb',
  },
  emptyText: { fontSize: 16, fontWeight: '600', color: '#374151', marginTop: 12, marginBottom: 4 },
  emptySubText: { fontSize: 13, color: '#9ca3af', textAlign: 'center' },
  cardRow: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#fff',
    borderRadius: 14,
    padding: 16,
    marginBottom: 10,
    borderWidth: 1,
    borderColor: '#e5e7eb',
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 1 },
    shadowOpacity: 0.05,
    shadowRadius: 3,
    elevation: 1,
  },
  cardIcon: {
    width: 40,
    height: 40,
    borderRadius: 10,
    backgroundColor: '#e0e7ff',
    justifyContent: 'center',
    alignItems: 'center',
    marginRight: 14,
  },
  cardInfo: { flex: 1 },
  cardBrand: { fontSize: 14, fontWeight: '700', color: '#111827' },
  cardLast4: { fontSize: 13, color: '#6b7280', marginTop: 2 },
  cardExp: { fontSize: 12, color: '#9ca3af', marginTop: 1 },
  removeBtn: { padding: 8 },
  addCardBtn: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    backgroundColor: '#fff',
    borderRadius: 14,
    borderWidth: 1.5,
    borderColor: '#4f46e5',
    borderStyle: 'dashed',
    paddingVertical: 14,
    marginTop: 4,
    gap: 8,
  },
  addCardText: { fontSize: 15, fontWeight: '600', color: '#4f46e5' },
});
