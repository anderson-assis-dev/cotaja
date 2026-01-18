import { useState } from 'react';
import { View, Text, TouchableOpacity, ActivityIndicator, StyleSheet } from 'react-native';
import { useNavigation } from '@react-navigation/native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import Icon from 'react-native-vector-icons/MaterialIcons';
import { useAuth } from '../../contexts/AuthContext';

export default function ProfileSelectionScreen() {
  const navigation = useNavigation<any>();
  const { user, updateProfileType, isLoading } = useAuth();
  const [isUpdating, setIsUpdating] = useState(false);

  const handleProfileSelection = async (type: 'client' | 'provider') => {
    try {
      setIsUpdating(true);
      await updateProfileType(type);
      // Não navegue manualmente! O AppNavigator já faz isso.
    } catch (error: any) {
      console.log('Erro ao selecionar perfil:', error.message || error);
    } finally {
      setIsUpdating(false);
    }
  };

  const insets = useSafeAreaInsets();

  return (
    <View style={[styles.container, { paddingTop: insets.top }]}>
      <Text style={styles.title}>
        Escolha seu Perfil
      </Text>

      <View style={styles.content}>
        <TouchableOpacity
          style={[styles.profileCard, isUpdating && styles.profileCardDisabled]}
          onPress={() => handleProfileSelection('client')}
          disabled={isUpdating}
        >
          <View style={styles.profileContent}>
            <View style={[styles.iconContainer, styles.clientIconContainer]}>
              <Icon name="person" size={60} color="#4f46e5" />
            </View>
            <Text style={styles.profileTitle}>Cliente</Text>
            <Text style={styles.profileDescription}>
              Quero contratar serviços e encontrar profissionais qualificados
            </Text>
          </View>
        </TouchableOpacity>

        <TouchableOpacity
          style={[styles.profileCard, isUpdating && styles.profileCardDisabled]}
          onPress={() => handleProfileSelection('provider')}
          disabled={isUpdating}
        >
          <View style={styles.profileContent}>
            <View style={[styles.iconContainer, styles.providerIconContainer]}>
              <Icon name="work" size={60} color="#16a34a" />
            </View>
            <Text style={styles.profileTitle}>Prestador</Text>
            <Text style={styles.profileDescription}>
              Quero oferecer meus serviços e encontrar novos clientes
            </Text>
          </View>
        </TouchableOpacity>
      </View>

      {isUpdating && (
        <View style={styles.loadingOverlay}>
          <View style={styles.loadingContainer}>
            <ActivityIndicator size="large" color="#4f46e5" />
            <Text style={styles.loadingText}>Atualizando perfil...</Text>
          </View>
        </View>
      )}

      <TouchableOpacity
        style={styles.backButton}
        onPress={() => navigation.goBack()}
        disabled={isUpdating}
      >
        <Text style={styles.backButtonText}>Voltar</Text>
      </TouchableOpacity>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#6366f1', // indigo-500 to purple-600 gradient
    padding: 24,
  },
  title: {
    fontSize: 30,
    fontWeight: 'bold',
    color: '#000000',
    textAlign: 'center',
    marginBottom: 32,
  },
  content: {
    flex: 1,
    justifyContent: 'center',
    gap: 24,
  },
  profileCard: {
    backgroundColor: 'white',
    borderRadius: 12,
    padding: 24,
    shadowColor: '#000',
    shadowOffset: {
      width: 0,
      height: 4,
    },
    shadowOpacity: 0.25,
    shadowRadius: 6,
    elevation: 8,
  },
  profileCardDisabled: {
    opacity: 0.5,
  },
  profileContent: {
    alignItems: 'center',
  },
  iconContainer: {
    borderRadius: 48,
    width: 96,
    height: 96,
    alignItems: 'center',
    justifyContent: 'center',
    marginBottom: 16,
  },
  clientIconContainer: {
    backgroundColor: '#e0e7ff', // indigo-100
  },
  providerIconContainer: {
    backgroundColor: '#dcfce7', // green-100
  },
  profileTitle: {
    fontSize: 20,
    fontWeight: 'bold',
    color: '#1f2937', // gray-800
    marginBottom: 8,
  },
  profileDescription: {
    color: '#6b7280', // gray-600
    textAlign: 'center',
  },
  loadingOverlay: {
    position: 'absolute',
    top: 0,
    left: 0,
    right: 0,
    bottom: 0,
    backgroundColor: 'rgba(0, 0, 0, 0.5)',
    alignItems: 'center',
    justifyContent: 'center',
  },
  loadingContainer: {
    backgroundColor: 'white',
    borderRadius: 8,
    padding: 24,
    alignItems: 'center',
  },
  loadingText: {
    color: '#1f2937', // gray-800
    marginTop: 8,
  },
  backButton: {
    marginTop: 24,
  },
  backButtonText: {
    color: 'white',
    textAlign: 'center',
  },
}); 