import { View, Text, ScrollView, TouchableOpacity, StyleSheet } from 'react-native';
import { useNavigation } from '@react-navigation/native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';

const mockDemands = [
  {
    id: '1',
    title: 'Pintura de apartamento',
    category: 'Pintura',
    budget: 'R$ 3.000,00',
    deadline: '15 dias',
    location: 'São Paulo, SP',
    description: 'Preciso pintar um apartamento de 80m², 2 quartos, sala, cozinha e banheiro.',
  },
  {
    id: '2',
    title: 'Instalação de ar condicionado',
    category: 'Elétrica',
    budget: 'R$ 1.500,00',
    deadline: '7 dias',
    location: 'São Paulo, SP',
    description: 'Instalação de ar condicionado split em sala e quarto.',
  },
  {
    id: '3',
    title: 'Limpeza pós-obra',
    category: 'Limpeza',
    budget: 'R$ 800,00',
    deadline: '3 dias',
    location: 'São Paulo, SP',
    description: 'Limpeza completa de apartamento após reforma.',
  },
];

export default function AvailableDemandsScreen() {
  const navigation = useNavigation<any>();
  const insets = useSafeAreaInsets();
  return (
    <ScrollView style={[styles.container, { paddingTop: insets.top }]}>
      <View style={styles.content}>
        <Text style={styles.title}>Demandas Disponíveis</Text>

        {mockDemands.map((demand) => (
          <TouchableOpacity
            key={demand.id}
            style={styles.demandCard}
            onPress={() => navigation.navigate('SendProposal' as never)}
          >
            <View style={styles.demandHeader}>
              <Text style={styles.demandTitle}>
                {demand.title}
              </Text>
              <View style={styles.categoryBadge}>
                <Text style={styles.categoryText}>{demand.category}</Text>
              </View>
            </View>

            <Text style={styles.demandDescription}>{demand.description}</Text>

            <View style={styles.tagsContainer}>
              <View style={styles.tag}>
                <Text style={styles.tagText}>{demand.budget}</Text>
              </View>
              <View style={styles.tag}>
                <Text style={styles.tagText}>{demand.deadline}</Text>
              </View>
              <View style={styles.tagLast}>
                <Text style={styles.tagText}>{demand.location}</Text>
              </View>
            </View>

            <TouchableOpacity
              style={styles.proposalButton}
              onPress={() => navigation.navigate('SendProposal' as never)}
            >
              <Text style={styles.proposalButtonText}>
                Enviar Proposta
              </Text>
            </TouchableOpacity>
          </TouchableOpacity>
        ))}

        <TouchableOpacity
          style={styles.backButton}
          onPress={() => navigation.navigate('Home')}
        >
          <Text style={styles.backButtonText}>
            Voltar para Home
          </Text>
        </TouchableOpacity>
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
    color: '#111827',
  },
  demandCard: {
    backgroundColor: '#ffffff',
    borderRadius: 12,
    padding: 24,
    marginBottom: 16,
    shadowColor: '#000',
    shadowOffset: {
      width: 0,
      height: 1,
    },
    shadowOpacity: 0.1,
    shadowRadius: 2,
    elevation: 2,
  },
  demandHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'flex-start',
    marginBottom: 16,
  },
  demandTitle: {
    fontSize: 18,
    fontWeight: 'bold',
    flex: 1,
    marginRight: 16,
    color: '#111827',
  },
  categoryBadge: {
    backgroundColor: '#e0e7ff',
    paddingHorizontal: 12,
    paddingVertical: 4,
    borderRadius: 20,
  },
  categoryText: {
    color: '#4f46e5',
    fontSize: 14,
  },
  demandDescription: {
    color: '#6b7280',
    marginBottom: 16,
    fontSize: 14,
    lineHeight: 20,
  },
  tagsContainer: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    marginBottom: 16,
  },
  tag: {
    backgroundColor: '#f3f4f6',
    paddingHorizontal: 12,
    paddingVertical: 4,
    borderRadius: 20,
    marginRight: 8,
    marginBottom: 8,
  },
  tagLast: {
    backgroundColor: '#f3f4f6',
    paddingHorizontal: 12,
    paddingVertical: 4,
    borderRadius: 20,
    marginBottom: 8,
  },
  tagText: {
    color: '#6b7280',
    fontSize: 14,
  },
  proposalButton: {
    backgroundColor: '#4f46e5',
    borderRadius: 8,
    padding: 16,
  },
  proposalButtonText: {
    textAlign: 'center',
    color: '#ffffff',
    fontWeight: 'bold',
    fontSize: 16,
  },
  backButton: {
    backgroundColor: '#4f46e5',
    borderRadius: 8,
    padding: 16,
    marginTop: 24,
  },
  backButtonText: {
    textAlign: 'center',
    color: '#ffffff',
    fontWeight: 'bold',
    fontSize: 18,
  },
}); 