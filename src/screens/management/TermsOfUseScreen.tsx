import { View, Text, ScrollView, TouchableOpacity, StyleSheet } from 'react-native';
import { useNavigation } from '@react-navigation/native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { ArrowLeft } from 'lucide-react-native';
import { useStatusBarOverlay } from '../../hooks/useStatusBarOverlay';
import { StatusBarOverlay } from '../../components/StatusBarOverlay';

export default function TermsOfUseScreen() {
  const navigation = useNavigation<any>();
  const insets = useSafeAreaInsets();
  const { showStatusBarOverlay, statusBarOpacity, handleScroll } = useStatusBarOverlay();

  return (
    <View style={styles.container}>
      <View style={styles.headerBackground} />
      <ScrollView
        style={styles.scroll}
        onScroll={handleScroll}
        scrollEventThrottle={16}
        contentContainerStyle={{ paddingBottom: insets.bottom + 32 }}
        showsVerticalScrollIndicator={false}
      >
        <View style={[styles.header, { paddingTop: insets.top + 16 }]}>
          <TouchableOpacity style={styles.backBtn} onPress={() => navigation.goBack()} activeOpacity={0.8}>
            <ArrowLeft size={22} color="#fff" />
          </TouchableOpacity>
          <Text style={styles.headerTitle}>Termos de Uso</Text>
        </View>
        <View style={styles.content}>
        <Text style={styles.updated}>Atualizado em 01/03/2026</Text>

        <Text style={styles.h1}>1. Aceitação dos Termos</Text>
        <Text style={styles.p}>
          Ao criar uma conta ou utilizar o aplicativo Cotaja, você concorda com estes Termos de Uso. Se você não concordar, não deve utilizar o aplicativo.
        </Text>

        <Text style={styles.h1}>2. Descrição do Serviço</Text>
        <Text style={styles.p}>
          O Cotaja é um marketplace que conecta clientes que precisam de serviços a prestadores qualificados. A plataforma não é parte do contrato de serviço firmado entre cliente e prestador.
        </Text>

        <Text style={styles.h1}>3. Cadastro e Conta</Text>
        <Text style={styles.p}>
          Você é responsável por manter a confidencialidade de suas credenciais. Informações falsas no cadastro podem resultar no cancelamento da conta.
        </Text>

        <Text style={styles.h1}>4. Responsabilidades do Prestador</Text>
        <Text style={styles.p}>
          O prestador de serviços é responsável pela qualidade, pontualidade e legalidade dos serviços prestados. O Cotaja não se responsabiliza por eventuais danos ou prejuízos causados por prestadores.
        </Text>

        <Text style={styles.h1}>5. Responsabilidades do Cliente</Text>
        <Text style={styles.p}>
          O cliente é responsável por descrever corretamente o serviço desejado e fornecer informações precisas sobre o local de realização.
        </Text>

        <Text style={styles.h1}>6. Cobranças e Pagamentos</Text>
        <Text style={styles.p}>
          Os prestadores de serviço terão acesso a um período de avaliação gratuito. Após esse período, uma mensalidade será cobrada para manter o acesso à plataforma. Clientes podem adquirir anúncios para maior visibilidade.
        </Text>

        <Text style={styles.h1}>7. Cancelamento</Text>
        <Text style={styles.p}>
          Você pode cancelar sua conta a qualquer momento através das configurações do aplicativo. O cancelamento não gera reembolso proporcional de mensalidades já cobradas.
        </Text>

        <Text style={styles.h1}>8. Contato</Text>
        <Text style={styles.p}>
          Em caso de dúvidas, entre em contato pelo e-mail: suporte@cotaja.com.br
        </Text>
        </View>
      </ScrollView>
      <StatusBarOverlay show={showStatusBarOverlay} opacity={statusBarOpacity} forceLight />
    </View>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: '#f3f4f6' },
  headerBackground: {
    position: 'absolute',
    top: '-50%',
    left: 0,
    right: 0,
    height: '100%',
    backgroundColor: '#4f46e5',
  },
  scroll: { flex: 1 },
  header: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: 20,
    paddingBottom: 28,
    backgroundColor: '#4f46e5',
    gap: 12,
  },
  backBtn: { padding: 4 },
  headerTitle: { fontSize: 20, fontWeight: '700', color: '#fff' },
  content: {
    backgroundColor: '#f3f4f6',
    borderTopLeftRadius: 24,
    borderTopRightRadius: 24,
    padding: 20,
    paddingBottom: 32,
    minHeight: 500,
  },
  updated: { fontSize: 12, color: '#9ca3af', marginBottom: 20 },
  h1: { fontSize: 16, fontWeight: '700', color: '#111827', marginTop: 20, marginBottom: 6 },
  p: { fontSize: 14, color: '#374151', lineHeight: 22 },
});
