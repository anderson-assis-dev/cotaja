import { View, Text, StyleSheet } from 'react-native';
import Icon from 'react-native-vector-icons/MaterialIcons';

interface OrderTimelineProps {
  apiStatus: 'open' | 'in_progress' | 'completed' | 'cancelled' | 'stopped';
  hasProposals: boolean;
  hasAcceptedProposal: boolean;
  hasScheduledDate: boolean;
  bothScheduleConfirmed: boolean;
  createdAt?: string;
}

interface Step {
  label: string;
  icon: string;
  color: string;
  state: 'done' | 'active' | 'pending';
}

function formatDate(iso?: string): string | undefined {
  if (!iso) return undefined;
  const d = new Date(iso);
  return d.toLocaleDateString('pt-BR', { day: '2-digit', month: 'short' });
}

export function OrderTimeline({
  apiStatus,
  hasProposals,
  hasAcceptedProposal,
  hasScheduledDate,
  bothScheduleConfirmed,
  createdAt,
}: OrderTimelineProps) {
  const isCompleted = apiStatus === 'completed';
  const isInProgress = apiStatus === 'in_progress';

  const negociacaoState = (): Step['state'] => {
    if (hasScheduledDate || isCompleted) return 'done';
    if (hasAcceptedProposal || isInProgress) return 'active';
    return 'pending';
  };

  const agendadoState = (): Step['state'] => {
    if (bothScheduleConfirmed || isCompleted) return 'done';
    if (hasScheduledDate) return 'active';
    return 'pending';
  };

  const steps: Step[] = [
    {
      label: 'Cotação criada',
      icon: 'assignment',
      color: '#4f46e5',
      state: 'done',
    },
    {
      label: 'Proposta recebida',
      icon: 'description',
      color: '#0891b2',
      state: hasProposals || hasAcceptedProposal || isInProgress || isCompleted
        ? 'done'
        : 'active',
    },
    {
      label: 'Em negociação',
      icon: 'people',
      color: '#7c3aed',
      state: negociacaoState(),
    },
    {
      label: 'Serviço agendado',
      icon: 'event',
      color: '#059669',
      state: agendadoState(),
    },
    {
      label: 'Concluído',
      icon: 'check-circle',
      color: '#10b981',
      state: isCompleted ? 'done' : 'pending',
    },
  ];

  return (
    <View style={styles.container}>
      <Text style={styles.title}>Status do Pedido</Text>
      {steps.map((step, index) => (
        <View key={index} style={styles.stepRow}>
          <View style={styles.leftCol}>
            <View style={[
              styles.iconCircle,
              step.state === 'done' && { backgroundColor: step.color },
              step.state === 'active' && { backgroundColor: step.color + '20', borderWidth: 2, borderColor: step.color },
              step.state === 'pending' && styles.iconCirclePending,
            ]}>
              <Icon
                name={step.state === 'done' ? 'check' : step.icon}
                size={16}
                color={step.state === 'done' ? '#fff' : step.state === 'active' ? step.color : '#d1d5db'}
              />
            </View>
            {index < steps.length - 1 && (
              <View style={[
                styles.connector,
                step.state === 'done' ? { backgroundColor: step.color } : styles.connectorPending,
              ]} />
            )}
          </View>
          <View style={styles.labelCol}>
            <Text style={[
              styles.stepLabel,
              step.state === 'done' && { color: '#111827' },
              step.state === 'active' && { color: step.color, fontWeight: '600' },
              step.state === 'pending' && styles.stepLabelPending,
            ]}>
              {step.label}
            </Text>
            {step.state === 'active' && (
              <Text style={[styles.stepSublabel, { color: step.color }]}>Em andamento</Text>
            )}
            {step.state === 'done' && index === 0 && createdAt && (
              <Text style={styles.stepDate}>{formatDate(createdAt)}</Text>
            )}
          </View>
        </View>
      ))}
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    backgroundColor: '#ffffff',
    borderRadius: 12,
    padding: 16,
    marginBottom: 16,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 1 },
    shadowOpacity: 0.06,
    shadowRadius: 3,
    elevation: 2,
  },
  title: {
    fontSize: 14,
    fontWeight: '600',
    color: '#6b7280',
    textTransform: 'uppercase',
    letterSpacing: 0.5,
    marginBottom: 16,
  },
  stepRow: {
    flexDirection: 'row',
    alignItems: 'flex-start',
    minHeight: 40,
  },
  leftCol: {
    alignItems: 'center',
    width: 36,
  },
  iconCircle: {
    width: 32,
    height: 32,
    borderRadius: 16,
    justifyContent: 'center',
    alignItems: 'center',
  },
  iconCirclePending: {
    backgroundColor: '#f3f4f6',
  },
  connector: {
    width: 2,
    flex: 1,
    minHeight: 12,
    marginVertical: 2,
  },
  connectorPending: {
    backgroundColor: '#e5e7eb',
  },
  labelCol: {
    flex: 1,
    paddingLeft: 12,
    paddingBottom: 12,
    justifyContent: 'center',
    paddingTop: 6,
  },
  stepLabel: {
    fontSize: 14,
    fontWeight: '500',
  },
  stepLabelPending: {
    color: '#9ca3af',
  },
  stepSublabel: {
    fontSize: 12,
    marginTop: 2,
  },
  stepDate: {
    fontSize: 12,
    color: '#9ca3af',
    marginTop: 2,
  },
});
