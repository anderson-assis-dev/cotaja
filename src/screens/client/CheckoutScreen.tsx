import { View, Text, ScrollView, TouchableOpacity, Alert, StyleSheet } from 'react-native';
import { useNavigation } from '@react-navigation/native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import Icon from 'react-native-vector-icons/MaterialIcons';

export default function CheckoutScreen() {
  const navigation = useNavigation<any>();
  const insets = useSafeAreaInsets();
  const handleAcceptProposal = () => {
    Alert.alert(
      'Confirmar Proposta',
      'Tem certeza que deseja aceitar esta proposta?',
      [
        {
          text: 'Cancelar',
          style: 'cancel',
        },
        {
          text: 'Confirmar',
          onPress: () => {
            navigation.navigate('Payment');
          },
        },
      ]
    );
  };

  return (
    <ScrollView style={[styles.container, { paddingTop: insets.top }]}>
      <View style={styles.content}>
        <Text style={styles.title}>Confirmar Proposta</Text>

        <View style={styles.proposalCard}>
          <Text style={styles.sectionTitle}>Detalhes da Proposta</Text>

          <View style={styles.detailSection}>
            <Text style={styles.detailLabel}>Valor Total</Text>
            <Text style={styles.totalAmount}>R$ 2.800,00</Text>
          </View>

          <View style={styles.detailSection}>
            <Text style={styles.detailLabel}>Prazo de Execução</Text>
            <Text style={styles.deadline}>12 dias</Text>
          </View>

          <View style={styles.descriptionSection}>
            <Text style={styles.detailLabel}>Descrição do Serviço</Text>
            <Text style={styles.description}>
              Tenho experiência em pintura residencial e comercial. Realizarei o serviço com materiais de qualidade e garantia de satisfação.
            </Text>
          </View>

          <View style={styles.actionsContainer}>
            <TouchableOpacity
              accessibilityLabel="Confirmar proposta"
              onPress={handleAcceptProposal}
              style={styles.actionButton}
            >
              <View style={styles.confirmButton}>
                <Icon name="check-circle" size={36} color="#22c55e" />
              </View>
              <Text style={styles.confirmText}>Confirmar</Text>
            </TouchableOpacity>
            <TouchableOpacity
              accessibilityLabel="Cancelar"
              onPress={() => navigation.goBack()}
              style={styles.actionButton}
            >
              <View style={styles.cancelButton}>
                <Icon name="close-circle" size={36} color="#ef4444" />
              </View>
              <Text style={styles.cancelText}>Cancelar</Text>
            </TouchableOpacity>
          </View>
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
  },
  title: {
    fontSize: 24,
    fontWeight: 'bold',
    marginBottom: 24,
  },
  proposalCard: {
    backgroundColor: 'white',
    borderRadius: 12,
    padding: 24,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 1 },
    shadowOpacity: 0.05,
    shadowRadius: 2,
    elevation: 2,
    marginBottom: 24,
  },
  sectionTitle: {
    fontSize: 18,
    fontWeight: '600',
    marginBottom: 16,
  },
  detailSection: {
    marginBottom: 16,
  },
  detailLabel: {
    color: '#6b7280',
    marginBottom: 8,
  },
  totalAmount: {
    fontSize: 24,
    fontWeight: 'bold',
    color: '#4f46e5',
  },
  deadline: {
    fontSize: 18,
    fontWeight: '600',
  },
  descriptionSection: {
    marginBottom: 24,
  },
  description: {
    color: '#374151',
  },
  actionsContainer: {
    flexDirection: 'row',
    justifyContent: 'center',
    gap: 32,
    marginTop: 24,
  },
  actionButton: {
    alignItems: 'center',
  },
  confirmButton: {
    backgroundColor: '#dcfce7',
    padding: 16,
    borderRadius: 24,
  },
  confirmText: {
    textAlign: 'center',
    color: '#15803d',
    marginTop: 8,
  },
  cancelButton: {
    backgroundColor: '#fee2e2',
    padding: 16,
    borderRadius: 24,
  },
  cancelText: {
    textAlign: 'center',
    color: '#dc2626',
    marginTop: 8,
  },
}); 