import { useState } from 'react';
import { View, Text, ScrollView, TouchableOpacity, TextInput, Alert, StyleSheet } from 'react-native';
import { useNavigation } from '@react-navigation/native';
import Icon from 'react-native-vector-icons/MaterialCommunityIcons';
import MaterialIcon from 'react-native-vector-icons/MaterialIcons';
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
  const navigation = useNavigation<any>();
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
        return 'credit-card-outline';
      case 'mastercard':
        return 'credit-card-multiple-outline';
      case 'amex':
        return 'credit-card-check-outline';
      case 'diners':
        return 'credit-card-sync-outline';
      case 'elo':
        return 'credit-card-refund-outline';
      default:
        return 'credit-card-outline';
    }
  };

  const handlePayment = () => {
    if (selectedMethod === 'pix') {
      Alert.alert(
        'Pagamento com PIX',
        'QR Code gerado com sucesso!',
        [
          {
            text: 'OK',
            onPress: () => navigation.navigate('ClientHome'),
          },
        ]
      );
    } else {
      if (!cardData.number || !cardData.name || !cardData.expiry || !cardData.cvv || !cardData.cpf) {
        Alert.alert('Erro', 'Por favor, preencha todos os campos');
        return;
      }

      Alert.alert(
        'Pagamento Realizado',
        'Seu pagamento foi processado com sucesso!',
        [
          {
            text: 'OK',
            onPress: () => navigation.navigate('ClientHome'),
          },
        ]
      );
    }
  };

  return (
    <View style={[styles.container, { paddingTop: insets.top }]}>
      <ScrollView style={styles.scrollView}>
        <View style={styles.content}>
          <Text style={styles.title}>Pagamento</Text>

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
          </View>

          <View style={styles.paymentCard}>
            <Text style={styles.sectionTitle}>Forma de Pagamento</Text>

            <View style={styles.paymentMethods}>
              <TouchableOpacity
                style={[styles.paymentMethodButton, selectedMethod === 'credit' ? styles.selectedMethod : styles.unselectedMethod]}
                onPress={() => setSelectedMethod('credit')}
              >
                <MaterialIcon name="credit-card" size={22} color={selectedMethod === 'credit' ? '#fff' : '#4f46e5'} />
                <Text style={[styles.paymentMethodText, selectedMethod === 'credit' ? styles.selectedText : styles.unselectedText]}>Crédito</Text>
              </TouchableOpacity>
              <TouchableOpacity
                style={[styles.paymentMethodButton, styles.middleButton, selectedMethod === 'debit' ? styles.selectedMethod : styles.unselectedMethod]}
                onPress={() => setSelectedMethod('debit')}
              >
                <MaterialIcon name="credit-card" size={22} color={selectedMethod === 'debit' ? '#fff' : '#4f46e5'} />
                <Text style={[styles.paymentMethodText, selectedMethod === 'debit' ? styles.selectedText : styles.unselectedText]}>Débito</Text>
              </TouchableOpacity>
              <TouchableOpacity
                style={[styles.paymentMethodButton, selectedMethod === 'pix' ? styles.selectedMethod : styles.unselectedMethod]}
                onPress={() => setSelectedMethod('pix')}
              >
                <MaterialIcon name="qr-code" size={22} color={selectedMethod === 'pix' ? '#fff' : '#4f46e5'} />
                <Text style={[styles.paymentMethodText, selectedMethod === 'pix' ? styles.selectedText : styles.unselectedText]}>PIX</Text>
              </TouchableOpacity>
            </View>

            {selectedMethod !== 'pix' && (
              <View style={styles.cardFormContainer}>
                <View style={styles.cardPreview}>
                  <View style={styles.cardHeader}>
                    {cardBrand && (
                      <Icon
                        name={getCardBrandIcon(cardBrand)}
                        size={40}
                        color="white"
                      />
                    )}
                    <Icon name="chip" size={40} color="white" />
                  </View>

                  <Text style={styles.cardNumber}>
                    {formatCardNumber(cardData.number) || '**** **** **** ****'}
                  </Text>

                  <View style={styles.cardFooter}>
                    <View>
                      <Text style={styles.cardLabel}>Nome do Titular</Text>
                      <Text style={styles.cardValue}>
                        {cardData.name || 'NOME NO CARTÃO'}
                      </Text>
                    </View>
                    <View>
                      <Text style={styles.cardLabel}>Validade</Text>
                      <Text style={styles.cardValue}>
                        {cardData.expiry || 'MM/AA'}
                      </Text>
                    </View>
                  </View>
                </View>

                <TextInput
                  style={styles.input}
                  placeholder="Número do Cartão"
                  value={formatCardNumber(cardData.number)}
                  onChangeText={(text) => {
                    const formatted = text.replace(/\D/g, '').slice(0, 16);
                    setCardData({ ...cardData, number: formatted });
                    setCardBrand(detectCardBrand(formatted));
                  }}
                  keyboardType="numeric"
                  maxLength={19}
                />

                <TextInput
                  style={styles.input}
                  placeholder="Nome do Titular"
                  value={cardData.name}
                  onChangeText={(text) => setCardData({ ...cardData, name: text.toUpperCase() })}
                  autoCapitalize="characters"
                />

                <View style={styles.inputRow}>
                  <TextInput
                    style={[styles.input, styles.halfInput, styles.inputLeft]}
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
                    style={[styles.input, styles.halfInput, styles.inputRight]}
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
                  style={styles.input}
                  placeholder="CPF do Titular"
                  value={formatCPF(cardData.cpf)}
                  onChangeText={(text) => {
                    const formatted = text.replace(/\D/g, '').slice(0, 11);
                    setCardData({ ...cardData, cpf: formatted });
                  }}
                  keyboardType="numeric"
                  maxLength={14}
                />
              </View>
            )}

            <View style={styles.actionButtons}>
              <TouchableOpacity
                accessibilityLabel={selectedMethod === 'pix' ? 'Gerar QR Code PIX' : 'Pagar'}
                onPress={handlePayment}
                style={styles.actionButton}
              >
                <View style={styles.confirmButton}>
                  <MaterialIcon name="check-circle" size={36} color="#22c55e" />
                </View>
                <Text style={styles.confirmText}>
                  {selectedMethod === 'pix' ? 'PIX' : 'Pagar'}
                </Text>
              </TouchableOpacity>
              <TouchableOpacity
                accessibilityLabel="Cancelar"
                onPress={() => navigation.goBack()}
                style={styles.actionButton}
              >
                <View style={styles.cancelButton}>
                  <MaterialIcon name="close-circle" size={36} color="#ef4444" />
                </View>
                <Text style={styles.cancelText}>Cancelar</Text>
              </TouchableOpacity>
            </View>
          </View>
        </View>
      </ScrollView>
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
  paymentCard: {
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
  paymentMethods: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    marginBottom: 24,
  },
  paymentMethodButton: {
    flex: 1,
    padding: 16,
    borderRadius: 8,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
  },
  middleButton: {
    marginHorizontal: 8,
  },
  selectedMethod: {
    backgroundColor: '#4f46e5',
  },
  unselectedMethod: {
    backgroundColor: '#e5e7eb',
  },
  paymentMethodText: {
    marginLeft: 8,
    fontWeight: 'bold',
  },
  selectedText: {
    color: 'white',
  },
  unselectedText: {
    color: '#374151',
  },
  cardFormContainer: {
    marginBottom: 24,
  },
  cardPreview: {
    backgroundColor: '#4f46e5',
    borderRadius: 12,
    padding: 24,
    marginBottom: 24,
  },
  cardHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 24,
  },
  cardNumber: {
    color: 'white',
    fontSize: 20,
    marginBottom: 16,
    letterSpacing: 2,
  },
  cardFooter: {
    flexDirection: 'row',
    justifyContent: 'space-between',
  },
  cardLabel: {
    color: 'white',
    fontSize: 14,
    marginBottom: 4,
    opacity: 0.8,
  },
  cardValue: {
    color: 'white',
    fontSize: 18,
  },
  input: {
    borderWidth: 1,
    borderColor: '#d1d5db',
    borderRadius: 8,
    padding: 12,
    marginBottom: 16,
    fontSize: 16,
  },
  inputRow: {
    flexDirection: 'row',
    marginBottom: 16,
  },
  halfInput: {
    flex: 1,
    marginBottom: 0,
  },
  inputLeft: {
    marginRight: 8,
  },
  inputRight: {
    marginLeft: 8,
  },
  actionButtons: {
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