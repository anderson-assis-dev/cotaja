import { useState } from 'react';
import { View, Text, ScrollView, TouchableOpacity, TextInput, Alert } from 'react-native';
import { useNavigation } from '@react-navigation/native';
import { MaterialCommunityIcons } from '@expo/vector-icons';
import { useSafeAreaInsets } from 'react-native-safe-area-context';

type PaymentMethod = 'credit' | 'debit' | 'pix';

interface CardData {
  number: string;
  name: string;
  expiry: string;
  cvv: string;
  cpf: string;
}

export default function PaymentScreen() {
  const navigation = useNavigation();
  const [selectedMethod, setSelectedMethod] = useState<PaymentMethod>('credit');
  const [cardData, setCardData] = useState<CardData>({
    number: '',
    name: '',
    expiry: '',
    cvv: '',
    cpf: '',
  });
  const [cardBrand, setCardBrand] = useState<string>('');
  const insets = useSafeAreaInsets();

  const formatCardNumber = (number: string) => {
    return number.replace(/(\d{4})/g, '$1 ').trim();
  };

  const formatExpiry = (expiry: string) => {
    if (expiry.length >= 2) {
      return `${expiry.slice(0, 2)}/${expiry.slice(2)}`;
    }
    return expiry;
  };

  const formatCPF = (cpf: string) => {
    return cpf.replace(/(\d{3})(\d{3})(\d{3})(\d{2})/, '$1.$2.$3-$4');
  };

  const detectCardBrand = (number: string) => {
    const firstDigit = number.charAt(0);
    const firstTwoDigits = number.slice(0, 2);

    if (firstDigit === '4') return 'visa';
    if (['51', '52', '53', '54', '55'].includes(firstTwoDigits)) return 'mastercard';
    if (['34', '37'].includes(firstTwoDigits)) return 'amex';
    if (['36', '38'].includes(firstTwoDigits)) return 'diners';
    if (firstTwoDigits === '65' || firstTwoDigits === '60') return 'elo';
    return '';
  };

  const getCardBrandIcon = (brand: string) => {
    switch (brand) {
      case 'visa':
        return 'credit-card-wireless';
      case 'mastercard':
        return 'credit-card-multiple';
      case 'amex':
        return 'credit-card-check';
      case 'diners':
        return 'credit-card-sync';
      case 'elo':
        return 'credit-card-refund';
      default:
        return 'credit-card';
    }
  };

  const handlePayment = () => {
    if (selectedMethod === 'pix') {
      // Lógica para pagamento com PIX
      Alert.alert(
        'Pagamento com PIX',
        'QR Code gerado com sucesso!',
        [
          {
            text: 'OK',
            onPress: () => navigation.navigate('ClientHome' as never),
          },
        ]
      );
    } else {
      // Validação dos campos do cartão
      if (!cardData.number || !cardData.name || !cardData.expiry || !cardData.cvv || !cardData.cpf) {
        Alert.alert('Erro', 'Por favor, preencha todos os campos');
        return;
      }

      // Simulação de pagamento
      Alert.alert(
        'Pagamento Realizado',
        'Seu pagamento foi processado com sucesso!',
        [
          {
            text: 'OK',
            onPress: () => navigation.navigate('ClientHome' as never),
          },
        ]
      );
    }
  };

  return (
    <View style={{ paddingTop: insets.top }} className="flex-1 bg-gray-100">
      <ScrollView className="flex-1">
        <View className="p-6">
          <Text className="text-2xl font-bold mb-6">Pagamento</Text>

          <View className="bg-white rounded-xl p-6 shadow-sm mb-6">
            <Text className="text-lg font-semibold mb-4">Detalhes da Proposta</Text>
            
            <View className="mb-4">
              <Text className="text-gray-600 mb-2">Valor Total</Text>
              <Text className="text-2xl font-bold text-indigo-600">R$ 2.800,00</Text>
            </View>

            <View className="mb-4">
              <Text className="text-gray-600 mb-2">Prazo de Execução</Text>
              <Text className="text-lg font-semibold">12 dias</Text>
            </View>
          </View>

          <View className="bg-white rounded-xl p-6 shadow-sm mb-6">
            <Text className="text-lg font-semibold mb-4">Forma de Pagamento</Text>

            <View className="flex-row justify-between mb-6">
              <TouchableOpacity
                className={`flex-1 p-4 rounded-lg mr-2 ${
                  selectedMethod === 'credit' ? 'bg-indigo-600' : 'bg-gray-200'
                }`}
                onPress={() => setSelectedMethod('credit')}
              >
                <Text
                  className={`text-center font-bold ${
                    selectedMethod === 'credit' ? 'text-white' : 'text-gray-800'
                  }`}
                >
                  Crédito
                </Text>
              </TouchableOpacity>

              <TouchableOpacity
                className={`flex-1 p-4 rounded-lg mx-2 ${
                  selectedMethod === 'debit' ? 'bg-indigo-600' : 'bg-gray-200'
                }`}
                onPress={() => setSelectedMethod('debit')}
              >
                <Text
                  className={`text-center font-bold ${
                    selectedMethod === 'debit' ? 'text-white' : 'text-gray-800'
                  }`}
                >
                  Débito
                </Text>
              </TouchableOpacity>

              <TouchableOpacity
                className={`flex-1 p-4 rounded-lg ml-2 ${
                  selectedMethod === 'pix' ? 'bg-indigo-600' : 'bg-gray-200'
                }`}
                onPress={() => setSelectedMethod('pix')}
              >
                <Text
                  className={`text-center font-bold ${
                    selectedMethod === 'pix' ? 'text-white' : 'text-gray-800'
                  }`}
                >
                  PIX
                </Text>
              </TouchableOpacity>
            </View>

            {selectedMethod !== 'pix' && (
              <View className="mb-6">
                <View className="bg-gradient-to-r from-indigo-500 to-purple-600 rounded-xl p-6 mb-6">
                  <View className="flex-row justify-between items-center mb-6">
                    {cardBrand && (
                      <MaterialCommunityIcons
                        name={getCardBrandIcon(cardBrand)}
                        size={40}
                        color="white"
                      />
                    )}
                    <MaterialCommunityIcons name="chip" size={40} color="white" />
                  </View>

                  <Text className="text-white text-xl mb-4">
                    {cardData.number || '**** **** **** ****'}
                  </Text>

                  <View className="flex-row justify-between">
                    <View>
                      <Text className="text-white text-sm mb-1">Nome do Titular</Text>
                      <Text className="text-white text-lg">
                        {cardData.name || 'NOME NO CARTÃO'}
                      </Text>
                    </View>
                    <View>
                      <Text className="text-white text-sm mb-1">Validade</Text>
                      <Text className="text-white text-lg">
                        {cardData.expiry || 'MM/AA'}
                      </Text>
                    </View>
                  </View>
                </View>

                <TextInput
                  className="border border-gray-300 rounded-lg p-3 mb-4"
                  placeholder="Número do Cartão"
                  value={cardData.number}
                  onChangeText={(text) => {
                    const formatted = text.replace(/\D/g, '').slice(0, 16);
                    setCardData({ ...cardData, number: formatted });
                    setCardBrand(detectCardBrand(formatted));
                  }}
                  keyboardType="numeric"
                  maxLength={19}
                />

                <TextInput
                  className="border border-gray-300 rounded-lg p-3 mb-4"
                  placeholder="Nome do Titular"
                  value={cardData.name}
                  onChangeText={(text) => setCardData({ ...cardData, name: text.toUpperCase() })}
                  autoCapitalize="characters"
                />

                <View className="flex-row mb-4">
                  <TextInput
                    className="flex-1 border border-gray-300 rounded-lg p-3 mr-2"
                    placeholder="Validade (MM/AA)"
                    value={cardData.expiry}
                    onChangeText={(text) => {
                      const formatted = text.replace(/\D/g, '').slice(0, 4);
                      setCardData({ ...cardData, expiry: formatExpiry(formatted) });
                    }}
                    keyboardType="numeric"
                    maxLength={5}
                  />
                  <TextInput
                    className="flex-1 border border-gray-300 rounded-lg p-3 ml-2"
                    placeholder="CVV"
                    value={cardData.cvv}
                    onChangeText={(text) => {
                      const formatted = text.replace(/\D/g, '').slice(0, 3);
                      setCardData({ ...cardData, cvv: formatted });
                    }}
                    keyboardType="numeric"
                    maxLength={3}
                    secureTextEntry
                  />
                </View>

                <TextInput
                  className="border border-gray-300 rounded-lg p-3 mb-4"
                  placeholder="CPF do Titular"
                  value={cardData.cpf}
                  onChangeText={(text) => {
                    const formatted = text.replace(/\D/g, '').slice(0, 11);
                    setCardData({ ...cardData, cpf: formatCPF(formatted) });
                  }}
                  keyboardType="numeric"
                  maxLength={14}
                />
              </View>
            )}

            <TouchableOpacity
              className="bg-indigo-600 rounded-lg p-4 mb-4"
              onPress={handlePayment}
            >
              <Text className="text-center text-white font-bold text-lg">
                {selectedMethod === 'pix' ? 'Gerar QR Code PIX' : 'Pagar'}
              </Text>
            </TouchableOpacity>

            <TouchableOpacity
              className="bg-gray-200 rounded-lg p-4"
              onPress={() => navigation.goBack()}
            >
              <Text className="text-center text-gray-800 font-bold text-lg">
                Voltar
              </Text>
            </TouchableOpacity>
          </View>
        </View>
      </ScrollView>
    </View>
  );
} 