import { useState } from 'react';
import { View, Text, TextInput, TouchableOpacity, ScrollView, Alert } from 'react-native';
import { useNavigation } from '@react-navigation/native';

const categories = [
  'Limpeza',
  'Manutenção',
  'Construção',
  'Elétrica',
  'Hidráulica',
  'Pintura',
  'Outros',
];

export default function CreateOrderScreen() {
  const navigation = useNavigation();
  const [title, setTitle] = useState('');
  const [category, setCategory] = useState('');
  const [description, setDescription] = useState('');
  const [budget, setBudget] = useState('');
  const [deadline, setDeadline] = useState('');

  const handleSubmit = () => {
    if (!title || !category || !description || !budget || !deadline) {
      Alert.alert('Erro', 'Por favor, preencha todos os campos');
      return;
    }

    // Simulação de criação de pedido
    Alert.alert(
      'Sucesso',
      'Pedido criado com sucesso! Em breve você receberá propostas de prestadores.',
      [
        {
          text: 'OK',
          onPress: () => navigation.navigate('MyOrders' as never),
        },
      ]
    );
  };

  return (
    <ScrollView className="flex-1 bg-gray-100">
      <View className="p-6">
        <Text className="text-2xl font-bold mb-6">Criar Novo Pedido</Text>

        <View className="bg-white rounded-xl p-6 shadow-sm">
          <Text className="text-lg font-semibold mb-2">Título do Serviço</Text>
          <TextInput
            className="border border-gray-300 rounded-lg p-3 mb-4"
            placeholder="Ex: Pintura de apartamento"
            value={title}
            onChangeText={setTitle}
          />

          <Text className="text-lg font-semibold mb-2">Categoria</Text>
          <View className="flex-row flex-wrap mb-4">
            {categories.map((cat) => (
              <TouchableOpacity
                key={cat}
                className={`mr-2 mb-2 px-4 py-2 rounded-full ${
                  category === cat
                    ? 'bg-indigo-600'
                    : 'bg-gray-200'
                }`}
                onPress={() => setCategory(cat)}
              >
                <Text
                  className={`${
                    category === cat ? 'text-white' : 'text-gray-800'
                  }`}
                >
                  {cat}
                </Text>
              </TouchableOpacity>
            ))}
          </View>

          <Text className="text-lg font-semibold mb-2">Descrição</Text>
          <TextInput
            className="border border-gray-300 rounded-lg p-3 mb-4 h-32"
            placeholder="Descreva detalhadamente o serviço que você precisa"
            value={description}
            onChangeText={setDescription}
            multiline
            textAlignVertical="top"
          />

          <Text className="text-lg font-semibold mb-2">Orçamento (R$)</Text>
          <TextInput
            className="border border-gray-300 rounded-lg p-3 mb-4"
            placeholder="Ex: 1000"
            value={budget}
            onChangeText={setBudget}
            keyboardType="numeric"
          />

          <Text className="text-lg font-semibold mb-2">Prazo Desejado</Text>
          <TextInput
            className="border border-gray-300 rounded-lg p-3 mb-6"
            placeholder="Ex: 15 dias"
            value={deadline}
            onChangeText={setDeadline}
          />

          <TouchableOpacity
            className="bg-indigo-600 rounded-lg p-4"
            onPress={handleSubmit}
          >
            <Text className="text-center text-white font-bold text-lg">
              Criar Pedido
            </Text>
          </TouchableOpacity>
        </View>
      </View>
    </ScrollView>
  );
} 