import { View, Text, ScrollView, TouchableOpacity, StyleSheet } from 'react-native';
import { useNavigation } from '@react-navigation/native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { ArrowLeft } from 'lucide-react-native';
import { useStatusBarOverlay } from '../../hooks/useStatusBarOverlay';
import { StatusBarOverlay } from '../../components/StatusBarOverlay';

export default function PrivacyPolicyScreen() {
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
          <Text style={styles.headerTitle}>Política de Privacidade</Text>
        </View>
        <View style={styles.content}>
        <Text style={styles.updated}>Atualizado em 01/03/2026</Text>

        <Text style={styles.h1}>1. Informações que Coletamos</Text>
        <Text style={styles.p}>Coletamos os seguintes dados para operação do serviço:</Text>
        <Text style={styles.bullet}>• Nome, e-mail e telefone para identificação;</Text>
        <Text style={styles.bullet}>• Localização aproximada para conectar clientes e prestadores próximos;</Text>
        <Text style={styles.bullet}>• Dados de uso do aplicativo para melhoria da experiência;</Text>
        <Text style={styles.bullet}>• Token de notificação (FCM) para push notifications.</Text>

        <Text style={styles.h1}>2. Como Usamos Seus Dados</Text>
        <Text style={styles.p}>Utilizamos suas informações para:</Text>
        <Text style={styles.bullet}>• Conectar clientes a prestadores na sua região;</Text>
        <Text style={styles.bullet}>• Processar pagamentos via Stripe;</Text>
        <Text style={styles.bullet}>• Enviar notificações sobre pedidos e propostas;</Text>
        <Text style={styles.bullet}>• Enviar e-mails transacionais.</Text>

        <Text style={styles.h1}>3. Compartilhamento de Dados</Text>
        <Text style={styles.p}>Não vendemos seus dados a terceiros. Compartilhamos apenas:</Text>
        <Text style={styles.bullet}>• Com a Stripe para processamento de pagamentos;</Text>
        <Text style={styles.bullet}>• Com a Apple/Google para push notifications;</Text>
        <Text style={styles.bullet}>• Quando exigido por lei.</Text>

        <Text style={styles.h1}>4. Localização</Text>
        <Text style={styles.p}>
          Sua localização é usada para encontrar serviços e prestadores próximos. Não armazenamos seu histórico de localização em tempo real.
        </Text>

        <Text style={styles.h1}>5. Segurança</Text>
        <Text style={styles.p}>
          Utilizamos criptografia e boas práticas de segurança para proteger seus dados. Senhas são armazenadas com hash bcrypt.
        </Text>

        <Text style={styles.h1}>6. Seus Direitos (LGPD)</Text>
        <Text style={styles.p}>Conforme a LGPD (Lei 13.709/2018), você tem direito a:</Text>
        <Text style={styles.bullet}>• Acessar seus dados;</Text>
        <Text style={styles.bullet}>• Corrigir dados incorretos;</Text>
        <Text style={styles.bullet}>• Solicitar a exclusão da sua conta e dados;</Text>
        <Text style={styles.bullet}>• Revogar consentimento a qualquer momento.</Text>

        <Text style={styles.h1}>7. Retenção de Dados</Text>
        <Text style={styles.p}>
          Mantemos seus dados pelo período necessário para prestação do serviço e obrigações legais (5 anos conforme legislação fiscal).
        </Text>

        <Text style={styles.h1}>8. Contato</Text>
        <Text style={styles.p}>Para exercer seus direitos ou dúvidas sobre privacidade:</Text>
        <Text style={styles.p}>E-mail: privacidade@cotaja.com.br</Text>
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
  bullet: { fontSize: 14, color: '#374151', lineHeight: 22, marginLeft: 8 },
});
