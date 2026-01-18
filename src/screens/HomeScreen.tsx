import { View, Text, ScrollView, TouchableOpacity, StyleSheet } from 'react-native';
import { useNavigation } from '@react-navigation/native';
import Icon from 'react-native-vector-icons/Ionicons';

export default function HomeScreen() {
  const navigation = useNavigation<any>();

  return (
    <View style={styles.container}>
      {/* Header */}
      <View style={styles.header}>
        <Text style={styles.headerTitle}>Dashboard</Text>
        <TouchableOpacity onPress={() => navigation.goBack()}>
          <Icon name="log-out-outline" size={28} color="white" />
        </TouchableOpacity>
      </View>

      {/* Conteúdo */}
      <ScrollView
        style={styles.content}
        showsVerticalScrollIndicator={false}
      >
        <Text style={styles.sectionTitle}>
          Visão Geral
        </Text>

        {/* Cards */}
        <View style={styles.cardsContainer}>
          <Card title="Serviços" value="12" icon="construct-outline" />
          <Card title="Pendentes" value="4" icon="time-outline" />
          <Card title="Concluídos" value="8" icon="checkmark-done-outline" />
          <Card title="Ganhos" value="R$ 5.400" icon="cash-outline" />
        </View>

        <Text style={[styles.sectionTitle, styles.sectionTitleSpaced]}>
          Últimos Serviços
        </Text>

        {/* Lista simples */}
        {['Reparo Elétrico', 'Limpeza Residencial', 'Pintura', 'Manutenção'].map((item, idx) => (
          <View
            key={idx}
            style={styles.serviceItem}
          >
            <Text style={styles.serviceItemText}>{item}</Text>
            <Icon name="chevron-forward" size={24} color="#4F46E5" />
          </View>
        ))}
      </ScrollView>
    </View>
  );
}

type CardProps = {
  title: string;
  value: string;
  icon: string;
};

function Card({ title, value, icon }: CardProps) {
  return (
    <View style={styles.card}>
      <Icon name={icon} size={28} color="white" />
      <Text style={styles.cardTitle}>{title}</Text>
      <Text style={styles.cardValue}>{value}</Text>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#6366f1', // indigo-500 to purple-600 gradient
  },
  header: {
    padding: 24,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
  },
  headerTitle: {
    fontSize: 30,
    fontWeight: 'bold',
    color: 'white',
  },
  content: {
    flex: 1,
    backgroundColor: 'white',
    borderTopLeftRadius: 24,
    borderTopRightRadius: 24,
    padding: 24,
  },
  sectionTitle: {
    fontSize: 20,
    fontWeight: '600',
    color: '#4f46e5', // indigo-700
    marginBottom: 16,
  },
  sectionTitleSpaced: {
    marginTop: 32,
  },
  cardsContainer: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    justifyContent: 'space-between',
  },
  card: {
    backgroundColor: '#4f46e5', // indigo-600
    width: '48%',
    borderRadius: 16,
    padding: 16,
    marginBottom: 16,
  },
  cardTitle: {
    color: 'white',
    marginTop: 8,
    fontWeight: '600',
  },
  cardValue: {
    fontSize: 24,
    fontWeight: 'bold',
    color: 'white',
  },
  serviceItem: {
    backgroundColor: '#f3f4f6', // gray-100
    borderRadius: 12,
    padding: 16,
    marginBottom: 12,
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
  },
  serviceItemText: {
    fontSize: 18,
    color: '#1f2937', // gray-800
  },
});
