import { View, Text, ScrollView, TouchableOpacity } from 'react-native';
import { useNavigation } from '@react-navigation/native';
import { Ionicons } from '@expo/vector-icons';

export default function HomeScreen() {
  const navigation = useNavigation();

  return (
    <View className="flex-1 bg-gradient-to-br from-indigo-500 to-purple-600">
      {/* Header */}
      <View className="p-6 flex-row items-center justify-between">
        <Text className="text-3xl font-bold text-white">Dashboard</Text>
        <TouchableOpacity onPress={() => navigation.goBack()}>
          <Ionicons name="log-out-outline" size={28} color="white" />
        </TouchableOpacity>
      </View>

      {/* Conteúdo */}
      <ScrollView
        className="flex-1 bg-white rounded-t-3xl p-6"
        showsVerticalScrollIndicator={false}
      >
        <Text className="text-xl font-semibold text-indigo-700 mb-4">
          Visão Geral
        </Text>

        {/* Cards */}
        <View className="flex-row flex-wrap justify-between">
          <Card title="Serviços" value="12" icon="construct-outline" />
          <Card title="Pendentes" value="4" icon="time-outline" />
          <Card title="Concluídos" value="8" icon="checkmark-done-outline" />
          <Card title="Ganhos" value="R$ 5.400" icon="cash-outline" />
        </View>

        <Text className="text-xl font-semibold text-indigo-700 mt-8 mb-4">
          Últimos Serviços
        </Text>

        {/* Lista simples */}
        {['Reparo Elétrico', 'Limpeza Residencial', 'Pintura', 'Manutenção'].map((item, idx) => (
          <View
            key={idx}
            className="bg-gray-100 rounded-xl p-4 mb-3 flex-row justify-between items-center"
          >
            <Text className="text-lg text-gray-800">{item}</Text>
            <Ionicons name="chevron-forward" size={24} color="#4F46E5" />
          </View>
        ))}
      </ScrollView>
    </View>
  );
}

type CardProps = {
  title: string;
  value: string;
  icon: keyof typeof Ionicons.glyphMap;
};

function Card({ title, value, icon }: CardProps) {
  return (
    <View className="bg-indigo-600 w-[48%] rounded-2xl p-4 mb-4">
      <Ionicons name={icon} size={28} color="white" />
      <Text className="text-white mt-2 font-semibold">{title}</Text>
      <Text className="text-2xl font-bold text-white">{value}</Text>
    </View>
  );
}
