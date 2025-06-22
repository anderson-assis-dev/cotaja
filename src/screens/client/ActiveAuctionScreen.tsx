import React, { useState, useEffect } from 'react';
import { View, Text, ScrollView, TouchableOpacity, Image, Alert, Modal } from 'react-native';
import { useNavigation, useRoute } from '@react-navigation/native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import Icon from 'react-native-vector-icons/MaterialIcons';

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
    <View className="bg-indigo-100 rounded-lg p-2 mt-2">
      <Text className="text-center text-indigo-600 font-semibold text-xs">Tempo Restante</Text>
      <Text className="text-center text-lg font-bold text-indigo-600">{timeLeft}</Text>
    </View>
  );
};

// --- Tela Principal ---
export default function ActiveAuctionScreen() {
  const navigation = useNavigation();
  const route = useRoute();
  const insets = useSafeAreaInsets();
  
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
    <ScrollView className="flex-1 bg-gray-100" style={{ paddingTop: insets.top }}>
      <View className="p-6">
        <Text className="text-2xl font-bold mb-4">Meus Leilões Ativos ({myAuctions.length})</Text>
        
        {myAuctions.length === 0 && (
          <View className="bg-white rounded-xl p-6 shadow-sm items-center">
            <Icon name="gavel" size={40} color="#9ca3af" />
            <Text className="text-gray-500 mt-4">Você não tem leilões ativos no momento.</Text>
          </View>
        )}

        {myAuctions.map((auction) => (
          <View key={auction.id} className="bg-white rounded-xl p-4 shadow-sm mb-4">
            <View className="flex-row justify-between items-start">
              <View className="flex-1">
                <Text className="text-lg font-bold">{auction.title}</Text>
                <Text className="text-gray-600">{auction.proposals.length} proposta(s) recebida(s)</Text>
              </View>
              <View className="flex-row items-center">
                <TouchableOpacity onPress={() => handleCloseAuction(auction.id)} className="p-2">
                  <Icon name="highlight-off" size={24} color="#ef4444" />
                </TouchableOpacity>
              </View>
            </View>
            <TimeLeft endTime={auction.endTime} />
            <TouchableOpacity 
              className="bg-indigo-600 rounded-lg p-3 mt-4"
              onPress={() => setSelectedAuction(auction)}
            >
              <Text className="text-center text-white font-bold">Ver Propostas</Text>
            </TouchableOpacity>
          </View>
        ))}
      </View>

      {/* --- Modal de Propostas --- */}
      <Modal
        visible={!!selectedAuction}
        animationType="slide"
        transparent={true}
        onRequestClose={() => setSelectedAuction(null)}
      >
        <View className="flex-1 justify-end bg-black/50">
          <View className="bg-gray-100 rounded-t-2xl p-6 max-h-[85%]" style={{ paddingBottom: insets.bottom + 16 }}>
            <TouchableOpacity onPress={() => setSelectedAuction(null)} className="absolute top-4 right-4 z-10">
              <Icon name="close" size={30} color="#6b7280" />
            </TouchableOpacity>
            
            <Text className="text-2xl font-bold mb-4">Propostas para "{selectedAuction?.title}"</Text>
            
            <ScrollView>
              {visibleProposals.length === 0 && (
                <Text className="text-gray-500 text-center py-8">Nenhuma proposta para exibir.</Text>
              )}
              {visibleProposals.map((proposal) => (
                <View key={proposal.id} className="bg-white rounded-lg p-4 mb-4 shadow-sm">
                  <View className="flex-row items-center mb-4">
                    <Image source={proposal.provider.avatar} className="w-12 h-12 rounded-full mr-4" />
                    <View>
                      <Text className="font-bold text-lg">{proposal.provider.name}</Text>
                      <View className="flex-row items-center">
                        <Text className="text-yellow-500">★</Text>
                        <Text className="text-gray-600 ml-1">{proposal.provider.rating}</Text>
                      </View>
                    </View>
                  </View>
                  <Text className="text-gray-600 mb-4">{proposal.description}</Text>
                  <View className="flex-row justify-between items-center">
                    <View><Text className="text-gray-500">Valor</Text><Text className="font-bold text-lg">{proposal.price}</Text></View>
                    <View><Text className="text-gray-500">Prazo</Text><Text className="font-bold text-lg">{proposal.deadline}</Text></View>
                  </View>
                  <View className="flex-row justify-end space-x-4 mt-4">
                    <TouchableOpacity className="bg-red-100 p-3 rounded-full" onPress={() => handleRefuseProposal(proposal.id)}><Icon name="close" size={24} color="#ef4444" /></TouchableOpacity>
                    <TouchableOpacity className="bg-blue-100 p-3 rounded-full"><Icon name="chat" size={24} color="#3b82f6" /></TouchableOpacity>
                    <TouchableOpacity className="bg-green-100 p-3 rounded-full" onPress={() => { setSelectedAuction(null); (navigation as any).navigate('Checkout'); }}><Icon name="check" size={24} color="#22c55e" /></TouchableOpacity>
                  </View>
                </View>
              ))}
            </ScrollView>
          </View>
        </View>
      </Modal>
    </ScrollView>
  );
} 