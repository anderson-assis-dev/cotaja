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
        <Text style={styles.updated}>Última atualização: 01 de março de 2026</Text>

        <Text style={styles.h1}>1. Aceitação dos Termos</Text>
        <Text style={styles.p}>
          Ao criar uma conta, acessar ou utilizar o aplicativo CotaJá ("Plataforma"), você concorda integralmente com estes Termos de Uso. Caso não concorde com qualquer disposição, não deve utilizar a Plataforma.
        </Text>
        <Text style={styles.p}>
          O uso continuado da Plataforma após a publicação de alterações nestes Termos constitui aceitação das modificações.
        </Text>

        <Text style={styles.h1}>2. Natureza da Plataforma — Intermediação Tecnológica</Text>
        <Text style={styles.highlight}>
          O CotaJá é exclusivamente uma plataforma tecnológica de intermediação. Não somos parte do contrato de serviço celebrado entre cliente e prestador, não executamos serviços, não determinamos como serão executados e não garantimos qualidade, prazo ou resultado.
        </Text>
        <Text style={styles.p}>
          O CotaJá conecta clientes que precisam contratar serviços a prestadores qualificados por meio de um modelo de leilão reverso assistido por inteligência artificial. Nossa função é disponibilizar o ambiente tecnológico para que as partes se encontrem e <Text style={styles.bold}>sugerir</Text> prestadores e propostas com base em critérios objetivos — a decisão final de contratação é sempre e exclusivamente do cliente.
        </Text>
        <Text style={styles.p}>
          Não determinamos, não garantimos e não supervisionamos a execução dos serviços. Toda a negociação de escopo, prazo, forma de pagamento e condições de execução é acordada diretamente entre cliente e prestador, sendo de responsabilidade exclusiva das partes envolvidas.
        </Text>

        <Text style={styles.h1}>3. Cadastro e Conta</Text>
        <Text style={styles.bullet}>• Para utilizar a Plataforma, é necessário criar uma conta fornecendo informações verdadeiras, completas e atualizadas.</Text>
        <Text style={styles.bullet}>• Você é o único responsável por manter a confidencialidade de suas credenciais de acesso (e-mail e senha).</Text>
        <Text style={styles.bullet}>• Qualquer atividade realizada com suas credenciais será de sua inteira responsabilidade.</Text>
        <Text style={styles.bullet}>• O fornecimento de informações falsas, incompletas ou enganosas pode resultar na suspensão ou cancelamento permanente da conta.</Text>
        <Text style={styles.bullet}>• É permitida apenas uma conta por CPF/CNPJ.</Text>

        <Text style={styles.h1}>4. Perfis de Usuário</Text>
        <Text style={styles.p}>A Plataforma oferece dois tipos de perfil:</Text>
        <Text style={styles.bullet}>• <Text style={styles.bold}>Cliente:</Text> pessoa física ou jurídica que publica pedidos de serviço e recebe propostas de prestadores.</Text>
        <Text style={styles.bullet}>• <Text style={styles.bold}>Prestador:</Text> pessoa física ou jurídica que oferece serviços, envia propostas e participa de leilões reversos.</Text>

        <Text style={styles.h1}>5. Responsabilidades do Cliente</Text>
        <Text style={styles.bullet}>• Descrever de forma clara e precisa o serviço desejado, incluindo requisitos, localização, prazo e orçamento estimado.</Text>
        <Text style={styles.bullet}>• Fornecer informações verdadeiras sobre o local de realização do serviço.</Text>
        <Text style={styles.bullet}>• Avaliar de forma justa e honesta os prestadores após a conclusão do serviço.</Text>
        <Text style={styles.bullet}>• O cliente é o <Text style={styles.bold}>único responsável pela escolha do prestador</Text>. O CotaJá apenas apresenta opções — a contratação é decisão autônoma e exclusiva do cliente.</Text>

        <Text style={styles.h1}>6. Responsabilidades do Prestador</Text>
        <Text style={styles.bullet}>• Manter cadastro atualizado com informações verídicas sobre qualificações e serviços oferecidos.</Text>
        <Text style={styles.bullet}>• Executar os serviços contratados com qualidade, pontualidade e em conformidade com a legislação vigente.</Text>
        <Text style={styles.bullet}>• Enviar propostas honestas e realizáveis dentro do prazo e valores informados.</Text>
        <Text style={styles.bullet}>• O prestador é o <Text style={styles.bold}>único responsável pela legalidade, qualidade e consequências</Text> dos serviços prestados, incluindo obrigações trabalhistas, previdenciárias, fiscais e de segurança.</Text>
        <Text style={styles.bullet}>• O CotaJá não se responsabiliza por danos, prejuízos, acidentes ou inadimplementos causados por prestadores.</Text>

        <Text style={styles.h1}>7. Execução do Serviço e Pagamento entre as Partes</Text>
        <Text style={styles.highlight}>
          A execução do serviço e as condições de pagamento são acordadas exclusivamente entre cliente e prestador. O CotaJá não é responsável por disputas, inadimplementos, danos materiais ou morais decorrentes da relação entre as partes.
        </Text>
        <Text style={styles.bullet}>• Escopo, prazo, preço, forma de pagamento e condições de execução são definidos livremente pelas partes, sem interferência do CotaJá.</Text>
        <Text style={styles.bullet}>• O CotaJá poderá disponibilizar meios de pagamento integrados como facilidade operacional, sem ser parte da relação financeira.</Text>
        <Text style={styles.bullet}>• Eventuais disputas financeiras ou de qualidade devem ser resolvidas diretamente entre cliente e prestador, podendo o CotaJá intermediar quando julgar conveniente, sem obrigação de resultado.</Text>
        <Text style={styles.bullet}>• O CotaJá não retém, gerencia ou garante valores pagos fora dos meios de pagamento oficiais da Plataforma.</Text>

        <Text style={styles.h1}>8. Leilão Reverso e Propostas</Text>
        <Text style={styles.bullet}>• O leilão reverso é o modelo em que prestadores competem para oferecer o melhor custo-benefício ao cliente.</Text>
        <Text style={styles.bullet}>• A Plataforma utiliza inteligência artificial para classificar e sugerir propostas, mas a decisão final de contratação é sempre do cliente.</Text>
        <Text style={styles.bullet}>• Propostas enviadas são compromissos do prestador e devem ser honradas caso aceitas pelo cliente.</Text>
        <Text style={styles.bullet}>• O CotaJá reserva-se o direito de remover propostas suspeitas, fraudulentas ou que violem estes Termos.</Text>

        <Text style={styles.h1}>9. Cobranças e Pagamentos à Plataforma</Text>
        <Text style={styles.bullet}>• O download e cadastro na Plataforma são gratuitos.</Text>
        <Text style={styles.bullet}>• Prestadores de serviço terão acesso a um período de avaliação gratuito. Após esse período, uma mensalidade poderá ser cobrada para manter o acesso à Plataforma.</Text>
        <Text style={styles.bullet}>• Clientes podem adquirir anúncios e funcionalidades premium para maior visibilidade.</Text>
        <Text style={styles.bullet}>• Os pagamentos são processados de forma segura pela Stripe, Inc., certificada PCI-DSS.</Text>
        <Text style={styles.bullet}>• Eventuais disputas financeiras entre cliente e prestador devem ser resolvidas diretamente entre as partes, podendo o CotaJá intermediar quando julgar necessário.</Text>

        <Text style={styles.h1}>10. Propriedade Intelectual</Text>
        <Text style={styles.p}>
          Todo o conteúdo da Plataforma, incluindo marca, logotipo, design, textos, código-fonte, algoritmos de inteligência artificial e demais elementos, são de propriedade exclusiva do CotaJá ou licenciados para o mesmo, sendo protegidos pela legislação brasileira de propriedade intelectual.
        </Text>
        <Text style={styles.p}>
          É proibida a reprodução, distribuição, modificação ou qualquer forma de uso não autorizado do conteúdo da Plataforma.
        </Text>

        <Text style={styles.h1}>11. Conteúdo do Usuário</Text>
        <Text style={styles.bullet}>• Ao publicar conteúdo na Plataforma (textos, imagens, avaliações), você declara ser o titular dos direitos sobre esse conteúdo.</Text>
        <Text style={styles.bullet}>• Você concede ao CotaJá uma licença não exclusiva, gratuita e mundial para utilizar, exibir e distribuir esse conteúdo no âmbito da Plataforma.</Text>
        <Text style={styles.bullet}>• É proibido publicar conteúdo ilegal, ofensivo, difamatório, discriminatório ou que viole direitos de terceiros.</Text>

        <Text style={styles.h1}>12. Conduta Proibida</Text>
        <Text style={styles.p}>É expressamente proibido:</Text>
        <Text style={styles.bullet}>• Criar contas falsas ou utilizar identidades de terceiros</Text>
        <Text style={styles.bullet}>• Enviar propostas fraudulentas ou com preços abusivos</Text>
        <Text style={styles.bullet}>• Tentar manipular o sistema de leilão reverso ou o Score IA</Text>
        <Text style={styles.bullet}>• Utilizar a Plataforma para fins ilegais ou não autorizados</Text>
        <Text style={styles.bullet}>• Realizar engenharia reversa, descompilar ou acessar indevidamente os sistemas da Plataforma</Text>
        <Text style={styles.bullet}>• Assediar, ameaçar ou ofender outros usuários</Text>
        <Text style={styles.bullet}>• Publicar spam, propaganda não autorizada ou conteúdo malicioso</Text>

        <Text style={styles.h1}>13. Suspensão e Cancelamento</Text>
        <Text style={styles.bullet}>• O CotaJá reserva-se o direito de suspender ou cancelar contas que violem estes Termos, sem aviso prévio.</Text>
        <Text style={styles.bullet}>• Você pode cancelar sua conta a qualquer momento através das configurações do aplicativo ou entrando em contato com o suporte.</Text>
        <Text style={styles.bullet}>• O cancelamento não gera reembolso proporcional de mensalidades ou valores já cobrados.</Text>
        <Text style={styles.bullet}>• Após o cancelamento, seus dados serão tratados conforme nossa Política de Privacidade.</Text>

        <Text style={styles.h1}>14. Limitação de Responsabilidade</Text>
        <Text style={styles.highlight}>
          O CotaJá é uma plataforma de intermediação tecnológica. Não garantimos a qualidade, execução ou resultado dos serviços contratados entre usuários, nem a solvência ou idoneidade de qualquer das partes.
        </Text>
        <Text style={styles.bullet}>• O CotaJá não garante a disponibilidade ininterrupta ou livre de erros da Plataforma.</Text>
        <Text style={styles.bullet}>• Não nos responsabilizamos por decisões tomadas com base nas sugestões ou classificações da inteligência artificial.</Text>
        <Text style={styles.bullet}>• Não somos responsáveis por danos diretos, indiretos, incidentais ou consequenciais decorrentes da relação entre cliente e prestador.</Text>
        <Text style={styles.bullet}>• Não nos responsabilizamos por acidentes, danos à propriedade, lesões corporais ou qualquer prejuízo ocorrido durante a execução do serviço.</Text>
        <Text style={styles.bullet}>• Nossa responsabilidade perante o usuário é limitada ao valor efetivamente pago pelo usuário ao CotaJá nos últimos 12 meses.</Text>

        <Text style={styles.h1}>15. Proteção de Dados</Text>
        <Text style={styles.p}>
          O tratamento dos seus dados pessoais é regido pela nossa Política de Privacidade, em conformidade com a Lei Geral de Proteção de Dados Pessoais (LGPD — Lei nº 13.709/2018).
        </Text>

        <Text style={styles.h1}>16. Alterações dos Termos</Text>
        <Text style={styles.p}>
          Estes Termos de Uso podem ser atualizados periodicamente. Alterações significativas serão notificadas por meio do aplicativo e/ou e-mail. O uso continuado da Plataforma após a publicação das alterações constitui aceitação dos novos Termos.
        </Text>

        <Text style={styles.h1}>17. Legislação Aplicável e Foro</Text>
        <Text style={styles.p}>
          Estes Termos de Uso são regidos pelas leis da República Federativa do Brasil. Para dirimir qualquer controvérsia decorrente destes Termos, fica eleito o foro da comarca de Salvador, Estado da Bahia, com renúncia expressa a qualquer outro, por mais privilegiado que seja.
        </Text>

        <Text style={styles.h1}>Contato</Text>
        <Text style={styles.p}>Em caso de dúvidas ou solicitações relacionadas a estes Termos de Uso:</Text>
        <Text style={styles.p}><Text style={styles.bold}>E-mail:</Text> suporte@cotaja.com.br</Text>
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
  p: { fontSize: 14, color: '#374151', lineHeight: 22, marginTop: 4 },
  bullet: { fontSize: 14, color: '#374151', lineHeight: 22, marginLeft: 8 },
  bold: { fontWeight: '700' },
  highlight: { fontSize: 14, color: '#3730a3', lineHeight: 22, marginTop: 4, marginBottom: 8, backgroundColor: '#eef2ff', borderLeftWidth: 4, borderLeftColor: '#4f46e5', borderRadius: 6, paddingHorizontal: 12, paddingVertical: 10, fontWeight: '600' },
});
