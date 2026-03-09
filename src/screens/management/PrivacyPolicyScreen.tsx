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
        <Text style={styles.updated}>Última atualização: 01 de março de 2026</Text>

        <Text style={styles.p}>
          A CotaJá ("nós", "nosso" ou "Plataforma") se compromete a proteger a privacidade e os dados pessoais de seus usuários ("você" ou "Titular"), em conformidade com a Lei Geral de Proteção de Dados Pessoais (Lei nº 13.709/2018 — LGPD) e demais legislações aplicáveis. Esta Política de Privacidade descreve como coletamos, utilizamos, armazenamos, compartilhamos e protegemos suas informações pessoais.
        </Text>

        <Text style={styles.h1}>1. Controlador dos Dados</Text>
        <Text style={styles.p}>O controlador responsável pelo tratamento dos seus dados pessoais é:</Text>
        <Text style={styles.bullet}>• <Text style={styles.bold}>Razão Social:</Text> CotaJá Tecnologia Ltda.</Text>
        <Text style={styles.bullet}>• <Text style={styles.bold}>E-mail do Encarregado (DPO):</Text> privacidade@cotaja.com.br</Text>
        <Text style={styles.bullet}>• <Text style={styles.bold}>Website:</Text> https://cotaja.com.br</Text>

        <Text style={styles.h1}>2. Dados Pessoais que Coletamos</Text>
        <Text style={styles.p}>Coletamos os seguintes dados pessoais para a operação e melhoria dos nossos serviços:</Text>

        <Text style={styles.subhead}>2.1. Dados de Cadastro (fornecidos por você):</Text>
        <Text style={styles.bullet}>• Nome completo</Text>
        <Text style={styles.bullet}>• Endereço de e-mail</Text>
        <Text style={styles.bullet}>• Número de telefone celular</Text>
        <Text style={styles.bullet}>• CPF ou CNPJ</Text>
        <Text style={styles.bullet}>• Data de nascimento</Text>
        <Text style={styles.bullet}>• Nome da mãe (para verificação de identidade)</Text>
        <Text style={styles.bullet}>• Endereço completo (CEP, rua, bairro, cidade, estado)</Text>
        <Text style={styles.bullet}>• Foto de perfil (opcional)</Text>
        <Text style={styles.bullet}>• Categorias de serviço de interesse</Text>

        <Text style={styles.subhead}>2.2. Dados de Uso (coletados automaticamente):</Text>
        <Text style={styles.bullet}>• Endereço IP e informações do dispositivo</Text>
        <Text style={styles.bullet}>• Sistema operacional e versão do aplicativo</Text>
        <Text style={styles.bullet}>• Dados de navegação e interação com a Plataforma</Text>
        <Text style={styles.bullet}>• Logs de acesso com data e hora</Text>
        <Text style={styles.bullet}>• Token de notificação push (Firebase Cloud Messaging — FCM)</Text>

        <Text style={styles.subhead}>2.3. Dados de Localização:</Text>
        <Text style={styles.bullet}>• Localização aproximada baseada em GPS, Wi-Fi e rede celular (quando autorizada)</Text>
        <Text style={styles.bullet}>• Endereço cadastrado</Text>

        <Text style={styles.subhead}>2.4. Dados Financeiros:</Text>
        <Text style={styles.bullet}>• Informações de pagamento processadas pela Stripe, Inc. (não armazenamos dados completos de cartão de crédito em nossos servidores)</Text>
        <Text style={styles.bullet}>• Histórico de transações realizadas na Plataforma</Text>

        <Text style={styles.h1}>3. Finalidades do Tratamento</Text>
        <Text style={styles.p}>Utilizamos seus dados pessoais para as seguintes finalidades, conforme bases legais previstas no Art. 7º da LGPD:</Text>

        <Text style={styles.subhead}>3.1. Execução de contrato (Art. 7º, V):</Text>
        <Text style={styles.bullet}>• Criar e gerenciar sua conta na Plataforma</Text>
        <Text style={styles.bullet}>• Conectar clientes a prestadores de serviços qualificados na sua região</Text>
        <Text style={styles.bullet}>• Processar pedidos, propostas e leilões reversos</Text>
        <Text style={styles.bullet}>• Facilitar a comunicação entre as partes via chat integrado</Text>
        <Text style={styles.bullet}>• Processar pagamentos e transferências financeiras</Text>

        <Text style={styles.subhead}>3.2. Consentimento (Art. 7º, I):</Text>
        <Text style={styles.bullet}>• Enviar notificações push sobre pedidos, propostas e mensagens</Text>
        <Text style={styles.bullet}>• Enviar e-mails transacionais e informativos</Text>
        <Text style={styles.bullet}>• Utilizar sua localização para encontrar serviços e prestadores próximos</Text>
        <Text style={styles.bullet}>• Coletar e exibir avaliações e reputação de prestadores</Text>

        <Text style={styles.subhead}>3.3. Legítimo interesse (Art. 7º, IX):</Text>
        <Text style={styles.bullet}>• Melhorar a experiência do usuário e a performance da Plataforma</Text>
        <Text style={styles.bullet}>• Prevenir fraudes e garantir a segurança da Plataforma</Text>
        <Text style={styles.bullet}>• Utilizar inteligência artificial para classificação de propostas e análise de fornecedores (Score IA)</Text>
        <Text style={styles.bullet}>• Detectar anomalias em propostas e preços fora do padrão de mercado</Text>

        <Text style={styles.subhead}>3.4. Cumprimento de obrigação legal (Art. 7º, II):</Text>
        <Text style={styles.bullet}>• Manter registros de acesso conforme o Marco Civil da Internet (Lei nº 12.965/2014)</Text>
        <Text style={styles.bullet}>• Cumprir obrigações fiscais e contábeis</Text>
        <Text style={styles.bullet}>• Atender ordens judiciais e requisições de autoridades competentes</Text>

        <Text style={styles.h1}>4. Compartilhamento de Dados</Text>
        <Text style={styles.p}>Não vendemos, alugamos ou comercializamos seus dados pessoais. O compartilhamento ocorre exclusivamente nas seguintes situações:</Text>
        <Text style={styles.bullet}>• <Text style={styles.bold}>Stripe, Inc.:</Text> para processamento seguro de pagamentos (certificada PCI-DSS)</Text>
        <Text style={styles.bullet}>• <Text style={styles.bold}>Firebase / Google Cloud:</Text> para envio de notificações push e armazenamento de tokens FCM</Text>
        <Text style={styles.bullet}>• <Text style={styles.bold}>Apple Push Notification Service (APNs):</Text> para notificações em dispositivos iOS</Text>
        <Text style={styles.bullet}>• <Text style={styles.bold}>Prestadores de Serviço:</Text> dados necessários para a execução do serviço contratado (nome, telefone, endereço de atendimento)</Text>
        <Text style={styles.bullet}>• <Text style={styles.bold}>Autoridades públicas:</Text> quando exigido por lei, decisão judicial ou para proteção dos nossos direitos legais</Text>
        <Text style={styles.p}>Todos os parceiros e subprocessadores são obrigados contratualmente a tratar os dados de acordo com a LGPD e com padrões adequados de segurança.</Text>

        <Text style={styles.h1}>5. Armazenamento e Segurança dos Dados</Text>
        <Text style={styles.p}>Adotamos medidas técnicas e organizacionais adequadas para proteger seus dados pessoais contra acesso não autorizado, destruição, perda, alteração ou qualquer forma de tratamento inadequado. Entre as medidas adotadas:</Text>
        <Text style={styles.bullet}>• Criptografia de dados em trânsito (TLS/SSL) e em repouso</Text>
        <Text style={styles.bullet}>• Hash de senhas com bcrypt (as senhas nunca são armazenadas em texto simples)</Text>
        <Text style={styles.bullet}>• Autenticação segura via tokens JWT com expiração</Text>
        <Text style={styles.bullet}>• Controle de acesso baseado em perfis (cliente e prestador)</Text>
        <Text style={styles.bullet}>• Monitoramento contínuo de acessos e atividades suspeitas</Text>
        <Text style={styles.bullet}>• Backups regulares e redundância de dados</Text>
        <Text style={styles.p}>Seus dados são armazenados em servidores seguros com políticas rígidas de controle de acesso.</Text>

        <Text style={styles.h1}>6. Retenção de Dados</Text>
        <Text style={styles.p}>Seus dados pessoais serão mantidos durante o período necessário para as finalidades descritas nesta Política e conforme as seguintes diretrizes:</Text>
        <Text style={styles.bullet}>• <Text style={styles.bold}>Dados de conta ativa:</Text> mantidos enquanto sua conta estiver ativa na Plataforma</Text>
        <Text style={styles.bullet}>• <Text style={styles.bold}>Após exclusão de conta:</Text> dados necessários para cumprimento de obrigações legais serão mantidos pelo prazo legal aplicável (5 anos para obrigações fiscais conforme o Código Tributário Nacional)</Text>
        <Text style={styles.bullet}>• <Text style={styles.bold}>Logs de acesso:</Text> mantidos por 6 meses conforme o Marco Civil da Internet</Text>
        <Text style={styles.bullet}>• <Text style={styles.bold}>Dados anonimizados:</Text> podem ser mantidos indefinidamente para fins estatísticos e de melhoria do serviço</Text>

        <Text style={styles.h1}>7. Seus Direitos como Titular (LGPD — Art. 18)</Text>
        <Text style={styles.p}>Conforme a Lei Geral de Proteção de Dados Pessoais (Lei nº 13.709/2018), você tem os seguintes direitos:</Text>
        <Text style={styles.bullet}>• <Text style={styles.bold}>Confirmação e Acesso:</Text> confirmar a existência de tratamento e acessar seus dados pessoais</Text>
        <Text style={styles.bullet}>• <Text style={styles.bold}>Correção:</Text> solicitar a correção de dados incompletos, inexatos ou desatualizados</Text>
        <Text style={styles.bullet}>• <Text style={styles.bold}>Anonimização, bloqueio ou eliminação:</Text> de dados desnecessários, excessivos ou tratados em desconformidade com a LGPD</Text>
        <Text style={styles.bullet}>• <Text style={styles.bold}>Portabilidade:</Text> solicitar a portabilidade dos seus dados para outro fornecedor de serviço</Text>
        <Text style={styles.bullet}>• <Text style={styles.bold}>Eliminação:</Text> solicitar a eliminação dos dados tratados com base no seu consentimento</Text>
        <Text style={styles.bullet}>• <Text style={styles.bold}>Informação:</Text> ser informado sobre as entidades públicas e privadas com as quais compartilhamos seus dados</Text>
        <Text style={styles.bullet}>• <Text style={styles.bold}>Revogação do consentimento:</Text> revogar o consentimento a qualquer momento, de forma gratuita e facilitada</Text>
        <Text style={styles.bullet}>• <Text style={styles.bold}>Oposição:</Text> opor-se ao tratamento realizado com base em hipóteses de dispensa de consentimento, caso haja descumprimento da LGPD</Text>
        <Text style={styles.bullet}>• <Text style={styles.bold}>Revisão de decisões automatizadas:</Text> solicitar a revisão de decisões tomadas unicamente com base em tratamento automatizado de dados pessoais (incluindo o Score IA de fornecedores)</Text>
        <Text style={styles.p}>
          Para exercer qualquer um destes direitos, entre em contato pelo e-mail privacidade@cotaja.com.br. Responderemos sua solicitação em até 15 (quinze) dias úteis, conforme previsto na LGPD.
        </Text>

        <Text style={styles.h1}>8. Uso de Localização</Text>
        <Text style={styles.p}>A coleta de dados de localização é utilizada exclusivamente para:</Text>
        <Text style={styles.bullet}>• Conectar clientes a prestadores de serviço próximos à sua região</Text>
        <Text style={styles.bullet}>• Exibir resultados de busca relevantes para sua localidade</Text>
        <Text style={styles.bullet}>• Calcular distâncias e estimar prazos de atendimento</Text>
        <Text style={styles.p}>Não armazenamos seu histórico de localização em tempo real. A coleta de localização requer sua autorização prévia e pode ser desativada a qualquer momento nas configurações do aplicativo.</Text>

        <Text style={styles.h1}>9. Inteligência Artificial e Decisões Automatizadas</Text>
        <Text style={styles.p}>O CotaJá utiliza algoritmos de inteligência artificial para:</Text>
        <Text style={styles.bullet}>• Classificar e pontuar fornecedores (Score IA) com base em critérios objetivos como qualidade do serviço, pontualidade, preço e satisfação de clientes anteriores</Text>
        <Text style={styles.bullet}>• Filtrar e ordenar propostas em leilões reversos</Text>
        <Text style={styles.bullet}>• Detectar propostas suspeitas ou fraudulentas</Text>
        <Text style={styles.bullet}>• Recomendar prestadores adequados para cada tipo de demanda</Text>
        <Text style={styles.p}>
          Conforme o Art. 20 da LGPD, você tem o direito de solicitar a revisão de qualquer decisão tomada exclusivamente com base em tratamento automatizado de dados pessoais que afete seus interesses.
        </Text>

        <Text style={styles.h1}>10. Cookies e Tecnologias de Rastreamento</Text>
        <Text style={styles.p}>O CotaJá pode utilizar cookies e tecnologias similares para:</Text>
        <Text style={styles.bullet}>• Manter sua sessão autenticada</Text>
        <Text style={styles.bullet}>• Lembrar suas preferências de configuração</Text>
        <Text style={styles.bullet}>• Análise de uso e performance da plataforma</Text>
        <Text style={styles.p}>Você pode gerenciar ou desativar cookies através das configurações do seu navegador.</Text>

        <Text style={styles.h1}>11. Transferência Internacional de Dados</Text>
        <Text style={styles.p}>
          Alguns dos nossos prestadores de serviços de infraestrutura (como Google Cloud, Firebase e Stripe) podem processar dados em servidores localizados fora do Brasil. Nesses casos, garantimos que:
        </Text>
        <Text style={styles.bullet}>• Os dados são transferidos apenas para países que proporcionem grau adequado de proteção de dados, ou</Text>
        <Text style={styles.bullet}>• Existam cláusulas contratuais padrão ou outras salvaguardas compatíveis com a LGPD</Text>

        <Text style={styles.h1}>12. Menores de Idade</Text>
        <Text style={styles.p}>
          O CotaJá não é direcionado a menores de 18 anos. Não coletamos intencionalmente dados de menores de idade. Caso identifiquemos que dados de um menor foram coletados inadvertidamente, procederemos com a eliminação imediata.
        </Text>

        <Text style={styles.h1}>13. Alterações nesta Política</Text>
        <Text style={styles.p}>
          Esta Política de Privacidade pode ser atualizada periodicamente para refletir mudanças em nossas práticas ou na legislação aplicável. Notificaremos você sobre alterações significativas por meio do aplicativo e/ou por e-mail. A data da última atualização estará sempre indicada no topo desta página.
        </Text>

        <Text style={styles.h1}>14. Autoridade Nacional de Proteção de Dados (ANPD)</Text>
        <Text style={styles.p}>
          Caso entenda que o tratamento dos seus dados pessoais viola a LGPD, você tem o direito de apresentar reclamação perante a Autoridade Nacional de Proteção de Dados (ANPD):
        </Text>
        <Text style={styles.bullet}>• <Text style={styles.bold}>Website:</Text> https://www.gov.br/anpd</Text>

        <Text style={styles.h1}>Contato do Encarregado de Dados (DPO)</Text>
        <Text style={styles.p}>Para exercer seus direitos, esclarecer dúvidas ou fazer solicitações relacionadas à privacidade:</Text>
        <Text style={styles.p}><Text style={styles.bold}>E-mail:</Text> privacidade@cotaja.com.br</Text>
        <Text style={styles.p}><Text style={styles.bold}>Suporte geral:</Text> suporte@cotaja.com.br</Text>
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
  subhead: { fontSize: 14, fontWeight: '700', color: '#374151', marginTop: 12, marginBottom: 2 },
  p: { fontSize: 14, color: '#374151', lineHeight: 22, marginTop: 4 },
  bullet: { fontSize: 14, color: '#374151', lineHeight: 22, marginLeft: 8 },
  bold: { fontWeight: '700' },
});
