import React, { useState, useEffect } from 'react';
import { View, Text, ScrollView, TouchableOpacity, Image, Alert, Modal, StyleSheet } from 'react-native';
import { useNavigation, useRoute } from '@react-navigation/native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import Icon from 'react-native-vector-icons/MaterialIcons';
import { useStatusBarOverlay } from '../../hooks/useStatusBarOverlay';
import { StatusBarOverlay } from '../../components/StatusBarOverlay';

// --- Tipos e Dados Mockados ---
interface Proposal {
  id: string;
  provider: { name: string; rating: number; avatar: any; };
  price: string;
  deadline: string;
  description: string;
}

interface Auction {
  id: string;
  title: string;
  endTime: Date;
  proposals: Proposal[];
  clientId: string;
}

const mockAuctions: Auction[] = [
  {
    id: '1',
    title: 'Pintura de apartamento',
    endTime: new Date(Date.now() + 24 * 60 * 60 * 1000),
    clientId: 'client_123',
    proposals: [
      { id: 'p1', provider: { name: 'João Silva', rating: 4.8, avatar: require('../../../assets/splash-icon.png') }, price: 'R$ 2.800,00', deadline: '12 dias', description: 'Tenho experiência em pintura residencial.' },
      { id: 'p2', provider: { name: 'Maria Santos', rating: 4.9, avatar: require('../../../assets/splash-icon.png') }, price: 'R$ 3.200,00', deadline: '10 dias', description: 'Especialista em pintura com 10 anos de exp.' },
    ],
  },
  {
    id: '2',
    title: 'Desenvolvimento de App',
    endTime: new Date(Date.now() + 48 * 60 * 60 * 1000),
    clientId: 'client_123',
    proposals: [
      { id: 'p3', provider: { name: 'Tech Solutions', rating: 5.0, avatar: require('../../../assets/splash-icon.png') }, price: 'R$ 15.000,00', deadline: '45 dias', description: 'Desenvolvimento nativo para iOS e Android.' },
    ],
  },
];

// --- Componente TimeLeft ---
const TimeLeft = ({ endTime }: { endTime: Date }) => {
  const [timeLeft, setTimeLeft] = useState('');

  useEffect(() => {
    const timer = setInterval(() => {
      const now = new Date();
      const diff = endTime.getTime() - now.getTime();
      if (diff <= 0) {
        setTimeLeft('Encerrado');
        clearInterval(timer);
        return;
      }
      const h = Math.floor(diff / (1000 * 60 * 60));
      const m = Math.floor((diff % (1000 * 60 * 60)) / (1000 * 60));
      const s = Math.floor((diff % (1000 * 60)) / 1000);
      setTimeLeft(`${h}h ${m}m ${s}s`);
    }, 1000);
    return () => clearInterval(timer);
  }, [endTime]);

  return (
    <View style={styles.timeLeftContainer}>
      <Text style={styles.timeLeftLabel}>Tempo Restante</Text>
      <Text style={styles.timeLeftValue}>{timeLeft}</Text>
    </View>
  );
};

// --- Tela Principal ---
export default function ActiveAuctionScreen() {
  const navigation = useNavigation<any>();
  const route = useRoute();
  const insets = useSafeAreaInsets();
  const { showStatusBarOverlay, statusBarOpacity, handleScroll } = useStatusBarOverlay();

  const [selectedAuction, setSelectedAuction] = useState<Auction | null>(null);
  const [closedAuctions, setClosedAuctions] = useState<string[]>([]);
  const [refusedProposals, setRefusedProposals] = useState<{ [auctionId: string]: string[] }>({});

  const { clientId } = (route.params as any) || {};

  const handleCloseAuction = (auctionId: string) => {
    Alert.alert("Encerrar Leilão", "Tem certeza que deseja encerrar este leilão?", [
      { text: "Cancelar", style: "cancel" },
      { text: "Encerrar", onPress: () => setClosedAuctions(prev => [...prev, auctionId]), style: "destructive" }
    ]);
  };

  const handleRefuseProposal = (proposalId: string) => {
    if (!selectedAuction) return;
    Alert.alert("Recusar Proposta", "Tem certeza que deseja recusar esta proposta?", [
      { text: "Cancelar", style: "cancel" },
      { text: "Recusar", onPress: () => {
        setRefusedProposals(prev => ({
          ...prev,
          [selectedAuction.id]: [...(prev[selectedAuction.id] || []), proposalId]
        }));
      }, style: "destructive" }
    ]);
  };

  const myAuctions = mockAuctions.filter(a => a.clientId === clientId && !closedAuctions.includes(a.id));

  const visibleProposals = selectedAuction 
    ? selectedAuction.proposals.filter(p => !(refusedProposals[selectedAuction.id] || []).includes(p.id))
    : [];

  return (
    <View style={styles.container}>
      <ScrollView
        style={styles.scrollView}
        onScroll={handleScroll}
        scrollEventThrottle={16}
      >
        <View style={[styles.content, { paddingTop: insets.top + 60, marginTop: -60 }]}>
          <Text style={styles.title}>Meus Leilões Ativos ({myAuctions.length})</Text>

        {myAuctions.length === 0 && (
          <View style={styles.emptyStateContainer}>
            <Icon name="gavel" size={40} color="#9ca3af" />
            <Text style={styles.emptyStateText}>Você não tem leilões ativos no momento.</Text>
          </View>
        )}

        {myAuctions.map((auction) => (
          <View key={auction.id} style={styles.auctionCard}>
            <View style={styles.auctionHeader}>
              <View style={styles.auctionInfo}>
                <Text style={styles.auctionTitle}>{auction.title}</Text>
                <Text style={styles.proposalCount}>{auction.proposals.length} proposta(s) recebida(s)</Text>
              </View>
              <View style={styles.actionButtons}>
                <TouchableOpacity onPress={() => handleCloseAuction(auction.id)} style={styles.closeButton}>
                  <Icon name="highlight-off" size={24} color="#ef4444" />
                </TouchableOpacity>
              </View>
            </View>
            <TimeLeft endTime={auction.endTime} />
            <TouchableOpacity
              style={styles.viewProposalsButton}
              onPress={() => setSelectedAuction(auction)}
            >
              <Text style={styles.viewProposalsButtonText}>Ver Propostas</Text>
            </TouchableOpacity>
          </View>
        ))}
        </View>
      </ScrollView>

      <StatusBarOverlay
        show={showStatusBarOverlay}
        opacity={statusBarOpacity}
        backgroundColor="#4f46e5"
      />

      {/* --- Modal de Propostas --- */}
      <Modal
        visible={!!selectedAuction}
        animationType="slide"
        transparent={true}
        onRequestClose={() => setSelectedAuction(null)}
      >
        <View style={styles.modalOverlay}>
          <View style={[styles.modalContent, { paddingBottom: insets.bottom + 16 }]}>
            <TouchableOpacity onPress={() => setSelectedAuction(null)} style={styles.modalCloseButton}>
              <Icon name="close" size={30} color="#6b7280" />
            </TouchableOpacity>

            <Text style={styles.modalTitle}>Propostas para "{selectedAuction?.title}"</Text>

            <ScrollView>
              {visibleProposals.length === 0 && (
                <Text style={styles.noProposalsText}>Nenhuma proposta para exibir.</Text>
              )}
              {visibleProposals.map((proposal) => (
                <View key={proposal.id} style={styles.proposalCard}>
                  <View style={styles.proposalHeader}>
                    <Image source={proposal.provider.avatar} style={styles.providerAvatar} />
                    <View>
                      <Text style={styles.providerName}>{proposal.provider.name}</Text>
                      <View style={styles.ratingContainer}>
                        <Text style={styles.starIcon}>★</Text>
                        <Text style={styles.ratingText}>{proposal.provider.rating}</Text>
                      </View>
                    </View>
                  </View>
                  <Text style={styles.proposalDescription}>{proposal.description}</Text>
                  <View style={styles.proposalDetails}>
                    <View><Text style={styles.detailLabel}>Valor</Text><Text style={styles.detailValue}>{proposal.price}</Text></View>
                    <View><Text style={styles.detailLabel}>Prazo</Text><Text style={styles.detailValue}>{proposal.deadline}</Text></View>
                  </View>
                  <View style={styles.proposalActions}>
                    <TouchableOpacity style={styles.rejectButton} onPress={() => handleRefuseProposal(proposal.id)}><Icon name="close" size={24} color="#ef4444" /></TouchableOpacity>
                    <TouchableOpacity style={styles.chatButton}><Icon name="chat" size={24} color="#3b82f6" /></TouchableOpacity>
                    <TouchableOpacity style={styles.acceptButton} onPress={() => { setSelectedAuction(null); navigation.navigate('Checkout'); }}><Icon name="check" size={24} color="#22c55e" /></TouchableOpacity>
                  </View>
                </View>
              ))}
            </ScrollView>
          </View>
        </View>
      </Modal>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#f3f4f6',
  },
  scrollView: {
    flex: 1,
  },
  content: {
    padding: 24,
  },
  title: {
    fontSize: 24,
    fontWeight: 'bold',
    marginBottom: 16,
  },
  emptyStateContainer: {
    backgroundColor: 'white',
    borderRadius: 12,
    padding: 24,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 1 },
    shadowOpacity: 0.05,
    shadowRadius: 2,
    elevation: 2,
    alignItems: 'center',
  },
  emptyStateText: {
    color: '#6b7280',
    marginTop: 16,
  },
  auctionCard: {
    backgroundColor: 'white',
    borderRadius: 12,
    padding: 16,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 1 },
    shadowOpacity: 0.05,
    shadowRadius: 2,
    elevation: 2,
    marginBottom: 16,
  },
  auctionHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'flex-start',
  },
  auctionInfo: {
    flex: 1,
  },
  auctionTitle: {
    fontSize: 18,
    fontWeight: 'bold',
  },
  proposalCount: {
    color: '#6b7280',
  },
  actionButtons: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  closeButton: {
    padding: 8,
  },
  viewProposalsButton: {
    backgroundColor: '#4f46e5',
    borderRadius: 8,
    padding: 12,
    marginTop: 16,
  },
  viewProposalsButtonText: {
    textAlign: 'center',
    color: 'white',
    fontWeight: 'bold',
  },
  timeLeftContainer: {
    backgroundColor: '#e0e7ff',
    borderRadius: 8,
    padding: 8,
    marginTop: 8,
  },
  timeLeftLabel: {
    textAlign: 'center',
    color: '#4f46e5',
    fontWeight: '600',
    fontSize: 12,
  },
  timeLeftValue: {
    textAlign: 'center',
    fontSize: 18,
    fontWeight: 'bold',
    color: '#4f46e5',
  },
  modalOverlay: {
    flex: 1,
    justifyContent: 'flex-end',
    backgroundColor: 'rgba(0, 0, 0, 0.5)',
  },
  modalContent: {
    backgroundColor: '#f3f4f6',
    borderTopLeftRadius: 16,
    borderTopRightRadius: 16,
    padding: 24,
    maxHeight: '85%',
  },
  modalCloseButton: {
    position: 'absolute',
    top: 16,
    right: 16,
    zIndex: 10,
  },
  modalTitle: {
    fontSize: 24,
    fontWeight: 'bold',
    marginBottom: 16,
  },
  noProposalsText: {
    color: '#6b7280',
    textAlign: 'center',
    paddingVertical: 32,
  },
  proposalCard: {
    backgroundColor: 'white',
    borderRadius: 8,
    padding: 16,
    marginBottom: 16,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 1 },
    shadowOpacity: 0.05,
    shadowRadius: 2,
    elevation: 2,
  },
  proposalHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: 16,
  },
  providerAvatar: {
    width: 48,
    height: 48,
    borderRadius: 24,
    marginRight: 16,
  },
  providerName: {
    fontWeight: 'bold',
    fontSize: 18,
  },
  ratingContainer: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  starIcon: {
    color: '#eab308',
  },
  ratingText: {
    color: '#6b7280',
    marginLeft: 4,
  },
  proposalDescription: {
    color: '#6b7280',
    marginBottom: 16,
  },
  proposalDetails: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
  },
  detailLabel: {
    color: '#6b7280',
  },
  detailValue: {
    fontWeight: 'bold',
    fontSize: 18,
  },
  proposalActions: {
    flexDirection: 'row',
    justifyContent: 'flex-end',
    gap: 16,
    marginTop: 16,
  },
  rejectButton: {
    backgroundColor: '#fee2e2',
    padding: 12,
    borderRadius: 24,
  },
  chatButton: {
    backgroundColor: '#dbeafe',
    padding: 12,
    borderRadius: 24,
  },
  acceptButton: {
    backgroundColor: '#dcfce7',
    padding: 12,
    borderRadius: 24,
  },
}); 