import React, { useEffect, useMemo, useState } from 'react';
import { View, Text, TextInput, ScrollView, TouchableOpacity, Image, StyleSheet, ActivityIndicator } from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import Icon from 'react-native-vector-icons/MaterialIcons';
import { useNavigation } from '@react-navigation/native';
import { orderService } from '../../services/api';
import { useStatusBarOverlay } from '../../hooks/useStatusBarOverlay';
import { StatusBarOverlay } from '../../components/StatusBarOverlay';
import { OrderCardSkeleton } from '../../components/Skeleton';

const defaultCompanyImage = require('../../../assets/icon.png');

type Company = {
  id: string;
  name: string;
  category: string;
  rating: number;
  ratingsCount: number;
  description: string;
  phone: string;
  image: any;
  serviceCategories?: string[];
};

const normalizeAvatarUri = (avatar?: string) => {
  if (!avatar) return null;
  if (avatar.startsWith('data:') || avatar.startsWith('http') || avatar.startsWith('file:')) return avatar;
  return `data:image/jpeg;base64,${avatar}`;
};

const CompanyCard = ({ company, onPress }: { company: Company; onPress: () => void }) => (
  <TouchableOpacity onPress={onPress} style={styles.companyCard}>
    <View style={styles.companyInfo}>
      <Image source={company.image} style={styles.companyAvatar} />
      <View style={styles.companyDetails}>
        <Text style={styles.companyName}>{company.name}</Text>
        <Text style={styles.companyCategory}>{company.category}</Text>
      </View>
    </View>
    <View style={styles.ratingContainer}>
      <Icon name="star" size={18} color="#f59e0b" />
      <Text style={styles.ratingText}>{Number(company.rating || 0).toFixed(1)}</Text>
    </View>
  </TouchableOpacity>
);

export default function RateProviderListScreen() {
  const insets = useSafeAreaInsets();
  const navigation = useNavigation<any>();
  const [searchQuery, setSearchQuery] = useState('');
  const [companies, setCompanies] = useState<Company[]>([]);
  const [loading, setLoading] = useState(true);
  const { showStatusBarOverlay, statusBarOpacity, handleScroll } = useStatusBarOverlay();

  useEffect(() => {
    fetchMyProviders();
  }, []);

  const fetchMyProviders = async () => {
    setLoading(true);
    try {
      const res = await orderService.getMyProviders();
      const providers = res?.success && Array.isArray(res.data) ? res.data : [];
      const list: Company[] = providers.map((p: any) => {
        const avatarUri = normalizeAvatarUri(p?.avatar_base64);
        const cats = Array.isArray(p?.service_categories) ? p.service_categories : [];
        return {
          id: String(p.id),
          name: p?.name || 'Empresa',
          category: cats[0] || 'Serviços',
          rating: Number(p?.avg_rating ?? 0) || 0,
          ratingsCount: Number(p?.ratings_count ?? 0) || 0,
          description: p?.address || 'Sem descrição',
          phone: p?.phone || 'Não informado',
          image: avatarUri ? { uri: avatarUri } : defaultCompanyImage,
          serviceCategories: cats,
        };
      });
      setCompanies(list);
    } catch {
      setCompanies([]);
    } finally {
      setLoading(false);
    }
  };

  const filteredCompanies = useMemo(() => {
    if (searchQuery.length < 2) return companies;
    const q = searchQuery.toLowerCase();
    return companies.filter(
      c => c.name.toLowerCase().includes(q) || c.category.toLowerCase().includes(q),
    );
  }, [searchQuery, companies]);

  const handleSelectProvider = (company: Company) => {
    navigation.navigate('RateProvider', { companyToRate: company });
  };

  return (
    <View style={styles.container}>
      <View style={styles.headerBackground} />
      <ScrollView style={styles.scrollView} keyboardShouldPersistTaps="handled" onScroll={handleScroll} scrollEventThrottle={16}>
        <View style={[styles.headerSection, { paddingTop: insets.top + 16 }]}>
          <TouchableOpacity onPress={() => navigation.goBack()} style={styles.backButton}>
            <Icon name="arrow-back" size={24} color="#fff" />
          </TouchableOpacity>
          <Text style={styles.headerTitle}>Avaliar Prestador</Text>
          <Text style={styles.headerSubtitle}>Avalie prestadores que já realizaram serviços</Text>
        </View>
        <View style={styles.content}>
          <View style={styles.searchContainer}>
            <Icon name="search" size={24} color="#9ca3af" />
            <TextInput
              placeholder="Buscar por nome ou categoria..."
              style={styles.searchInput}
              value={searchQuery}
              onChangeText={setSearchQuery}
            />
          </View>

          <Text style={styles.sectionTitle}>Seus Prestadores</Text>

          {loading ? (
            <View>
              <OrderCardSkeleton />
              <OrderCardSkeleton />
            </View>
          ) : filteredCompanies.length > 0 ? (
            filteredCompanies.map(company => (
              <CompanyCard key={company.id} company={company} onPress={() => handleSelectProvider(company)} />
            ))
          ) : (
            <View style={styles.emptyState}>
              <Icon name="star-border" size={48} color="#9ca3af" />
              <Text style={styles.emptyStateTitle}>
                {companies.length === 0 ? 'Nenhum prestador encontrado' : 'Nenhum resultado'}
              </Text>
              <Text style={styles.emptyStateText}>
                {companies.length === 0
                  ? 'Você ainda não possui serviços realizados para avaliar.'
                  : 'Tente buscar com outro termo.'}
              </Text>
            </View>
          )}

          <View style={{ height: insets.bottom + 16 }} />
        </View>
      </ScrollView>
      <StatusBarOverlay show={showStatusBarOverlay} opacity={statusBarOpacity} backgroundColor="#4f46e5" forceLight />
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
  headerSection: {
    backgroundColor: '#4f46e5',
    paddingHorizontal: 24,
    paddingBottom: 28,
  },
  backButton: {
    marginBottom: 12,
    alignSelf: 'flex-start',
    padding: 4,
  },
  headerTitle: {
    fontSize: 24,
    fontWeight: 'bold',
    color: 'white',
    marginBottom: 4,
  },
  headerSubtitle: {
    color: 'rgba(255,255,255,0.8)',
    fontSize: 14,
  },
  content: {
    backgroundColor: '#f3f4f6',
    borderTopLeftRadius: 24,
    borderTopRightRadius: 24,
    padding: 20,
    paddingBottom: 32,
    minHeight: 500,
  },
  searchContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: 'white',
    borderRadius: 12,
    padding: 12,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 1 },
    shadowOpacity: 0.05,
    shadowRadius: 2,
    elevation: 2,
    marginBottom: 24,
  },
  searchInput: {
    flex: 1,
    marginLeft: 12,
    fontSize: 18,
  },
  sectionTitle: {
    fontSize: 20,
    fontWeight: '600',
    color: '#374151',
    marginBottom: 12,
  },
  companyCard: {
    backgroundColor: 'white',
    borderRadius: 12,
    padding: 16,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 1 },
    shadowOpacity: 0.05,
    shadowRadius: 2,
    elevation: 2,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    marginBottom: 12,
  },
  companyInfo: {
    flexDirection: 'row',
    alignItems: 'center',
    flex: 1,
  },
  companyAvatar: {
    width: 48,
    height: 48,
    borderRadius: 24,
    marginRight: 16,
  },
  companyDetails: {
    flex: 1,
  },
  companyName: {
    fontSize: 18,
    fontWeight: '600',
    color: '#374151',
  },
  companyCategory: {
    color: '#6b7280',
  },
  ratingContainer: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  ratingText: {
    marginLeft: 4,
    fontWeight: 'bold',
  },
  emptyState: {
    backgroundColor: 'white',
    borderRadius: 12,
    padding: 32,
    alignItems: 'center',
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 1 },
    shadowOpacity: 0.05,
    shadowRadius: 2,
    elevation: 2,
  },
  emptyStateTitle: {
    fontSize: 18,
    fontWeight: '600',
    color: '#374151',
    marginTop: 16,
    marginBottom: 8,
  },
  emptyStateText: {
    color: '#6b7280',
    textAlign: 'center',
    lineHeight: 20,
  },
});
