import React, { useState, useEffect } from 'react';
import { View, Text, ScrollView, TouchableOpacity, Alert, StyleSheet, ActivityIndicator, Image } from 'react-native';
import { useNavigation, useRoute, RouteProp } from '@react-navigation/native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import Icon from 'react-native-vector-icons/MaterialIcons';
import { proposalService } from '../../services/api';
import { useToast } from '../../contexts/ToastContext';
import { facebookEvents } from '../../services/facebookEventsService';

type Proposal = {
  id: string;
  provider: {
    name: string;
    rating: number;
    avatar: { uri: string } | null;
    avatarUri: string | null;
  };
  price: string;
  deadline: string;
  description: string;
  ranking: number;
};

type CheckoutRouteParams = {
  Checkout: { proposal: Proposal };
};

export default function CheckoutScreen() {
  const navigation = useNavigation<any>();
  const route = useRoute<RouteProp<CheckoutRouteParams, 'Checkout'>>();
  const insets = useSafeAreaInsets();
  const { showSuccess, showError } = useToast();
  const [isLoading, setIsLoading] = useState(false);

  const proposal = route.params?.proposal;

  useEffect(() => {
    if (!proposal) return;
    const numericPrice = Number(proposal.price.replace(/[^\d,]/g, '').replace(',', '.')) || 0;
    facebookEvents.logInitiateCheckout({
      contentId: proposal.id,
      contentType: 'proposal',
      currency: 'BRL',
      valueToSum: numericPrice,
    });
  }, [proposal]);

  if (!proposal) {
    return (
      <View style={[styles.container, { paddingTop: insets.top, justifyContent: 'center', alignItems: 'center' }]}>
        <Icon name="error-outline" size={64} color="#ef4444" />
        <Text style={styles.errorText}>Dados da proposta não encontrados</Text>
        <TouchableOpacity style={styles.backButton} onPress={() => navigation.goBack()}>
          <Text style={styles.backButtonText}>Voltar</Text>
        </TouchableOpacity>
      </View>
    );
  }

  const handleAcceptProposal = () => {
    Alert.alert(
      'Confirmar Proposta',
      `Tem certeza que deseja aceitar a proposta de ${proposal.provider.name} no valor de ${proposal.price}?`,
      [
        {
          text: 'Cancelar',
          style: 'cancel',
        },
        {
          text: 'Confirmar',
          onPress: async () => {
            setIsLoading(true);
            try {
              const response = await proposalService.acceptProposal(Number(proposal.id));
              if (response.success) {
                showSuccess(`Proposta de ${proposal.provider.name} aceita com sucesso!`);
                navigation.popToTop();
              } else {
                showError(response.message || 'Não foi possível aceitar a proposta.');
              }
            } catch (error: any) {
              const message = error?.response?.data?.message || 'Erro ao aceitar a proposta. Tente novamente.';
              showError(message);
            } finally {
              setIsLoading(false);
            }
          },
        },
      ]
    );
  };

  return (
    <ScrollView style={[styles.container, { paddingTop: insets.top }]}>
      <View style={styles.content}>
        <Text style={styles.title}>Confirmar Proposta</Text>


        <View style={styles.providerCard}>
          <View style={styles.providerRow}>
            {proposal.provider.avatar || proposal.provider.avatarUri ? (
              <Image
                source={proposal.provider.avatar || { uri: proposal.provider.avatarUri! }}
                style={styles.providerAvatar}
              />
            ) : (
              <View style={styles.providerAvatarPlaceholder}>
                <Icon name="person" size={28} color="#9ca3af" />
              </View>
            )}
            <View style={styles.providerInfo}>
              <Text style={styles.providerName}>{proposal.provider.name}</Text>
              <View style={styles.providerRating}>
                <Icon name="star" size={16} color="#fbbf24" />
                <Text style={styles.providerRatingText}>{proposal.provider.rating}</Text>
              </View>
            </View>
            {proposal.ranking && (
              <View style={styles.rankingBadge}>
                <Text style={styles.rankingText}>{proposal.ranking}º lugar</Text>
              </View>
            )}
          </View>
        </View>


        <View style={styles.proposalCard}>
          <Text style={styles.sectionTitle}>Detalhes da Proposta</Text>

          <View style={styles.detailRow}>
            <View style={styles.detailItem}>
              <View style={styles.detailIconContainer}>
                <Icon name="attach-money" size={24} color="#10b981" />
              </View>
              <Text style={styles.detailLabel}>Valor Total</Text>
              <Text style={styles.totalAmount}>{proposal.price}</Text>
            </View>
            <View style={styles.detailItem}>
              <View style={styles.detailIconContainer}>
                <Icon name="schedule" size={24} color="#3b82f6" />
              </View>
              <Text style={styles.detailLabel}>Prazo</Text>
              <Text style={styles.deadline}>{proposal.deadline}</Text>
            </View>
          </View>

          <View style={styles.descriptionSection}>
            <Text style={styles.descriptionLabel}>Descrição do Serviço</Text>
            <Text style={styles.description}>{proposal.description}</Text>
          </View>
        </View>


        <View style={styles.actionsContainer}>
          <TouchableOpacity
            accessibilityLabel="Confirmar proposta"
            onPress={handleAcceptProposal}
            style={[styles.confirmButton, isLoading && styles.buttonDisabled]}
            disabled={isLoading}
          >
            {isLoading ? (
              <ActivityIndicator size="small" color="#ffffff" />
            ) : (
              <>
                <Icon name="check-circle" size={24} color="#ffffff" />
                <Text style={styles.confirmText}>Aceitar Proposta</Text>
              </>
            )}
          </TouchableOpacity>

          <TouchableOpacity
            accessibilityLabel="Cancelar"
            onPress={() => navigation.goBack()}
            style={styles.cancelButton}
            disabled={isLoading}
          >
            <Icon name="cancel" size={24} color="#ef4444" />
            <Text style={styles.cancelText}>Voltar</Text>
          </TouchableOpacity>
        </View>
      </View>
    </ScrollView>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#f3f4f6',
  },
  content: {
    padding: 24,
    paddingBottom: 48,
  },
  title: {
    fontSize: 24,
    fontWeight: 'bold',
    color: '#111827',
    marginBottom: 20,
  },
  errorText: {
    fontSize: 16,
    color: '#6b7280',
    marginTop: 16,
    marginBottom: 24,
  },
  backButton: {
    backgroundColor: '#3b82f6',
    paddingHorizontal: 24,
    paddingVertical: 12,
    borderRadius: 8,
  },
  backButtonText: {
    color: '#ffffff',
    fontSize: 16,
    fontWeight: '600',
  },
  providerCard: {
    backgroundColor: '#ffffff',
    borderRadius: 12,
    padding: 16,
    marginBottom: 16,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 1 },
    shadowOpacity: 0.05,
    shadowRadius: 2,
    elevation: 2,
  },
  providerRow: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  providerAvatar: {
    width: 52,
    height: 52,
    borderRadius: 26,
    backgroundColor: '#e5e7eb',
  },
  providerAvatarPlaceholder: {
    width: 52,
    height: 52,
    borderRadius: 26,
    backgroundColor: '#f3f4f6',
    justifyContent: 'center',
    alignItems: 'center',
  },
  providerInfo: {
    flex: 1,
    marginLeft: 12,
  },
  providerName: {
    fontSize: 18,
    fontWeight: '700',
    color: '#111827',
  },
  providerRating: {
    flexDirection: 'row',
    alignItems: 'center',
    marginTop: 4,
  },
  providerRatingText: {
    fontSize: 14,
    color: '#6b7280',
    marginLeft: 4,
  },
  rankingBadge: {
    backgroundColor: '#eef2ff',
    paddingHorizontal: 12,
    paddingVertical: 6,
    borderRadius: 16,
  },
  rankingText: {
    fontSize: 13,
    fontWeight: '600',
    color: '#4f46e5',
  },
  proposalCard: {
    backgroundColor: '#ffffff',
    borderRadius: 12,
    padding: 24,
    marginBottom: 24,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 1 },
    shadowOpacity: 0.05,
    shadowRadius: 2,
    elevation: 2,
  },
  sectionTitle: {
    fontSize: 18,
    fontWeight: '600',
    color: '#111827',
    marginBottom: 20,
  },
  detailRow: {
    flexDirection: 'row',
    gap: 16,
    marginBottom: 20,
  },
  detailItem: {
    flex: 1,
    backgroundColor: '#f9fafb',
    borderRadius: 12,
    padding: 16,
    alignItems: 'center',
  },
  detailIconContainer: {
    marginBottom: 8,
  },
  detailLabel: {
    color: '#6b7280',
    fontSize: 13,
    marginBottom: 4,
  },
  totalAmount: {
    fontSize: 16,
    fontWeight: 'bold',
    color: '#10b981',
    textAlign: 'center',
  },
  deadline: {
    fontSize: 16,
    fontWeight: '600',
    color: '#1f2937',
    textAlign: 'center',
  },
  descriptionSection: {
    borderTopWidth: 1,
    borderTopColor: '#f3f4f6',
    paddingTop: 16,
  },
  descriptionLabel: {
    color: '#6b7280',
    fontSize: 14,
    fontWeight: '500',
    marginBottom: 8,
  },
  description: {
    color: '#374151',
    fontSize: 15,
    lineHeight: 22,
  },
  actionsContainer: {
    gap: 12,
  },
  confirmButton: {
    backgroundColor: '#10b981',
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    paddingVertical: 16,
    borderRadius: 12,
    gap: 8,
  },
  buttonDisabled: {
    opacity: 0.7,
  },
  confirmText: {
    color: '#ffffff',
    fontSize: 18,
    fontWeight: '700',
  },
  cancelButton: {
    backgroundColor: '#ffffff',
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    paddingVertical: 14,
    borderRadius: 12,
    borderWidth: 1,
    borderColor: '#e5e7eb',
    gap: 8,
  },
  cancelText: {
    color: '#ef4444',
    fontSize: 16,
    fontWeight: '600',
  },
});