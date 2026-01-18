import React from 'react';
import { View, Text, ScrollView, TouchableOpacity, Image, StyleSheet } from 'react-native';
import { useNavigation, NavigationProp, CommonActions } from '@react-navigation/native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import Icon from 'react-native-vector-icons/MaterialIcons';
import { useAuth } from '../../contexts/AuthContext';
import { useStatusBarOverlay } from '../../hooks/useStatusBarOverlay';
import { StatusBarOverlay } from '../../components/StatusBarOverlay';

// Navigation types
type RootStackParamList = {
  Login: undefined;
  Documents: undefined;
  Wallet: undefined;
  Settings: undefined;
  [key: string]: any;
};

type ProfileScreenNavigationProp = NavigationProp<RootStackParamList>;

// TypeScript interfaces
interface User {
  name: string;
  email: string;
  phone?: string;
  address?: string;
  profile_type: 'provider' | 'client' | string;
}

export default function ProfileScreen() {
  const navigation = useNavigation<ProfileScreenNavigationProp>();
  const insets = useSafeAreaInsets();
  const { logout, user } = useAuth();
  const { showStatusBarOverlay, statusBarOpacity, handleScroll } = useStatusBarOverlay();

  const handleLogout = async (): Promise<void> => {
    await logout();
    navigation.dispatch(
      CommonActions.reset({
        index: 0,
        routes: [{ name: 'Login' }],
      })
    );
  };

  const getProfileTypeLabel = (profileType: string): string => {
    switch (profileType) {
      case 'provider': return 'Prestador';
      case 'client': return 'Cliente';
      default: return 'Usuário';
    }
  };

  if (!user) {
    return (
      <View style={styles.loadingContainer}>
        <Text style={styles.loadingText}>Carregando dados do usuário...</Text>
      </View>
    );
  }

  return (
    <View style={styles.container}>
      <ScrollView
        style={styles.scrollView}
        onScroll={handleScroll}
        scrollEventThrottle={1}
      >
      <View style={[styles.header, { paddingTop: insets.top + 60, marginTop: -60 }]}>
        <View style={styles.headerContent}>
          <View style={styles.avatarContainer}>
            <Image
              source={require('../../../assets/cotaja_icon.png')}
              style={styles.avatar}
            />
          </View>
          <Text style={styles.userName}>
            {user.name}
          </Text>
          <View style={styles.profileTypeBadge}>
            <Text style={styles.profileTypeText}>
              {getProfileTypeLabel(user.profile_type)}
            </Text>
          </View>
        </View>
      </View>

      <View style={styles.content}>
        <View style={styles.infoCard}>
          <Text style={styles.infoCardTitle}>Informações Pessoais</Text>

          <View style={styles.infoItem}>
            <Text style={styles.infoLabel}>Email</Text>
            <Text style={styles.infoValue}>{user.email}</Text>
          </View>

          <View style={styles.infoItem}>
            <Text style={styles.infoLabel}>Telefone</Text>
            <Text style={styles.infoValue}>{user.phone || '-'}</Text>
          </View>

          {user.address && (
            <View style={styles.infoItem}>
              <Text style={styles.infoLabel}>Endereço</Text>
              <Text style={styles.infoValue}>{user.address}</Text>
            </View>
          )}
        </View>

        {/* Menu Options */}
        <View style={styles.menuContainer}>
          <TouchableOpacity
            style={styles.menuItem}
            onPress={() => navigation.navigate('Documents')}
          >
            <View style={[styles.menuIcon, styles.documentsIcon]}>
              <Icon name="description" size={24} color="#4f46e5" />
            </View>
            <View style={styles.menuContent}>
              <Text style={styles.menuTitle}>Gerenciar Documentos</Text>
              <Text style={styles.menuSubtitle}>Visualizar e atualizar documentos</Text>
            </View>
            <Icon name="chevron-right" size={24} color="#9ca3af" />
          </TouchableOpacity>

          <TouchableOpacity
            style={styles.menuItem}
            onPress={() => navigation.navigate('Wallet')}
          >
            <View style={[styles.menuIcon, styles.walletIcon]}>
              <Icon name="account-balance-wallet" size={24} color="#16a34a" />
            </View>
            <View style={styles.menuContent}>
              <Text style={styles.menuTitle}>Carteira</Text>
              <Text style={styles.menuSubtitle}>Gerenciar saldo e transações</Text>
            </View>
            <Icon name="chevron-right" size={24} color="#9ca3af" />
          </TouchableOpacity>

          <TouchableOpacity
            style={styles.menuItem}
            onPress={() => navigation.navigate('Settings')}
          >
            <View style={[styles.menuIcon, styles.settingsIcon]}>
              <Icon name="settings" size={24} color="#6b7280" />
            </View>
            <View style={styles.menuContent}>
              <Text style={styles.menuTitle}>Configurações</Text>
              <Text style={styles.menuSubtitle}>Preferências e privacidade</Text>
            </View>
            <Icon name="chevron-right" size={24} color="#9ca3af" />
          </TouchableOpacity>

          <TouchableOpacity
            style={styles.menuItem}
            onPress={handleLogout}
          >
            <View style={[styles.menuIcon, styles.logoutIcon]}>
              <Icon name="logout" size={24} color="#dc2626" />
            </View>
            <View style={styles.menuContent}>
              <Text style={styles.menuTitle}>Sair</Text>
              <Text style={styles.menuSubtitle}>Fazer logout da conta</Text>
            </View>
            <Icon name="chevron-right" size={24} color="#9ca3af" />
          </TouchableOpacity>
        </View>
      </View>
      </ScrollView>

      {/* Status Bar Overlay */}
      {console.log('Passing to StatusBarOverlay - show:', showStatusBarOverlay, 'opacity:', statusBarOpacity)}
      <StatusBarOverlay show={showStatusBarOverlay} opacity={statusBarOpacity} forceLight />
    </View>
  );
}

// StyleSheet definitions
const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#f3f4f6',
  },
  scrollView: {
    flex: 1,
  },
  loadingContainer: {
    flex: 1,
    alignItems: 'center',
    justifyContent: 'center',
    backgroundColor: '#f3f4f6',
  },
  loadingText: {
    fontSize: 16,
    color: '#6b7280',
  },
  header: {
    backgroundColor: '#4f46e5',
    padding: 24,
    paddingBottom: 32,
  },
  headerContent: {
    alignItems: 'center',
    paddingTop: 20
  },
  avatarContainer: {
    borderWidth: 4,
    borderColor: '#ffffff',
    width: 96,
    height: 96,
    borderRadius: 100,
    overflow: 'hidden',
    backgroundColor: '#000',
    justifyContent: 'center',
    alignItems: 'center',
  },
  avatar: {
    width: 200,
    height: 200,
    resizeMode: 'contain',
    paddingTop: '17%'
  },
  userName: {
    fontSize: 24,
    fontWeight: 'bold',
    color: '#ffffff',
    marginVertical: 16,
  },
  profileTypeBadge: {
    backgroundColor: 'rgba(255, 255, 255, 0.2)',
    paddingHorizontal: 16,
    paddingVertical: 4,
    borderRadius: 12,
  },
  profileTypeText: {
    color: '#ffffff',
    fontSize: 14,
  },
  content: {
    padding: 24,
  },
  infoCard: {
    backgroundColor: '#ffffff',
    borderRadius: 12,
    padding: 24,
    shadowColor: '#000',
    shadowOffset: {
      width: 0,
      height: 2,
    },
    shadowOpacity: 0.1,
    shadowRadius: 3.84,
    elevation: 5,
    marginBottom: 24,
  },
  infoCardTitle: {
    fontSize: 18,
    fontWeight: '600',
    color: '#111827',
    marginBottom: 16,
  },
  infoItem: {
    marginBottom: 16,
  },
  infoLabel: {
    color: '#6b7280',
    fontSize: 14,
    marginBottom: 4,
  },
  infoValue: {
    color: '#1f2937',
    fontSize: 16,
  },
  menuContainer: {
    gap: 16,
  },
  menuItem: {
    backgroundColor: '#ffffff',
    borderRadius: 12,
    padding: 16,
    shadowColor: '#000',
    shadowOffset: {
      width: 0,
      height: 2,
    },
    shadowOpacity: 0.1,
    shadowRadius: 3.84,
    elevation: 5,
    flexDirection: 'row',
    alignItems: 'center',
  },
  menuIcon: {
    borderRadius: 8,
    padding: 8,
    marginRight: 16,
  },
  documentsIcon: {
    backgroundColor: '#e0e7ff',
  },
  walletIcon: {
    backgroundColor: '#dcfce7',
  },
  settingsIcon: {
    backgroundColor: '#f3f4f6',
  },
  logoutIcon: {
    backgroundColor: '#fee2e2',
  },
  menuContent: {
    flex: 1,
  },
  menuTitle: {
    fontSize: 18,
    fontWeight: '600',
    color: '#1f2937',
    marginBottom: 2,
  },
  menuSubtitle: {
    color: '#6b7280',
    fontSize: 14,
  },
});