import AsyncStorage from '@react-native-async-storage/async-storage';
import { navigationRef } from './navigationRef';

/**
 * Roteador central de deep links do Cotaja.
 *
 * Cobre os 3 canais do Problema 3:
 *  - Push em foreground/background/cold start (via pushNotificationService.handleNotificationTap)
 *  - Notificação na central do sistema (mesmo caminho do push)
 *  - Link de e-mail (https://cotaja.io/... -> backend redireciona para cotaja://...)
 *
 * O esquema canônico é `cotaja://<path>`. Os links https são convertidos para
 * o mesmo path. Como o app é "auth-gated" (os navigators Client/Provider só
 * existem após login), quando um link chega sem usuário autenticado guardamos
 * ele como "pendente" e o AuthContext o consome logo após autenticar.
 */

export type DeepLinkTarget = {
  /** chave lógica da tela, ex: 'order', 'new-order', 'add-service' */
  screen: string;
  /** id opcional (orderId, etc.) */
  id?: number | null;
};

let pendingDeepLink: DeepLinkTarget | null = null;

/** Converte uma URL (cotaja:// ou https://cotaja.io/...) em { screen, id }. */
export function parseDeepLink(url: string): DeepLinkTarget | null {
  if (!url) return null;
  try {
    let path = url.trim();

    // Remove o esquema/host conhecidos, preservando o restante como path.
    // Aceita o scheme custom e os domínios https (app.cotaja.io serve o
    // redirecionador; www/cotaja.io cobrem eventuais links do site).
    path = path
      .replace(/^cotaja:\/\//i, '')
      .replace(/^https?:\/\/(www\.|app\.|api\.)?cotaja\.io\/?/i, '')
      .replace(/^\/+/, '');

    // Remove query string / hash.
    path = path.split('?')[0].split('#')[0];
    if (!path) return null;

    // Aliases vindos do backend (rotas "amigáveis" usadas em e-mails).
    const aliases: Record<string, string> = {
      'new-service': 'add-service',
      'add-service': 'add-service',
      'meus-servicos': 'add-service',
      'novo-pedido': 'new-order',
      'new-order': 'new-order',
      'perfil': 'profile',
      'carteira': 'wallet',
    };

    const segments = path.split('/').filter(Boolean);
    const head = segments[0];
    const screen = aliases[head] || head;
    const rawId = segments[1];
    const id = rawId && /^\d+$/.test(rawId) ? parseInt(rawId, 10) : null;

    return { screen, id };
  } catch {
    return null;
  }
}

async function getProfileType(): Promise<'client' | 'provider' | null> {
  try {
    const json = await AsyncStorage.getItem('user');
    return json ? JSON.parse(json)?.profile_type ?? null : null;
  } catch {
    return null;
  }
}

async function isAuthenticated(): Promise<boolean> {
  try {
    const token = await AsyncStorage.getItem('auth_token');
    const user = await AsyncStorage.getItem('user');
    return Boolean(token && user);
  } catch {
    return false;
  }
}

/** Executa a navegação efetiva para um target, assumindo usuário autenticado. */
async function performNavigation(target: DeepLinkTarget, attempt = 0): Promise<void> {
  if (!navigationRef.isReady()) {
    if (attempt < 20) setTimeout(() => performNavigation(target, attempt + 1), 300);
    return;
  }

  const profile = await getProfileType();
  const isProvider = profile === 'provider';
  const nav = navigationRef as any;
  const { screen, id } = target;

  try {
    switch (screen) {
      // Cliente cria um novo pedido ("adicionar serviços" do cliente).
      case 'new-order':
        nav.navigate('Client', { screen: 'Home', params: { screen: 'CreateOrder', initial: false } });
        break;

      // Prestador: tela de Meus Serviços / adicionar serviço (caso "completar serviço").
      case 'add-service':
        nav.navigate('Provider', { screen: 'MyServicesTab', params: { screen: 'MyServices', initial: false } });
        break;

      // Detalhe de um pedido específico.
      case 'order':
        if (isProvider) {
          nav.navigate('Provider', { screen: 'MyServicesTab', params: { screen: 'AcceptedOrder', params: { orderId: id }, initial: false } });
        } else {
          nav.navigate('Client', { screen: 'MyOrdersTab', params: { screen: 'OrderDetails', params: { orderId: id, order_id: id }, initial: false } });
        }
        break;

      // Avaliar prestador.
      case 'rate':
        nav.navigate('Client', { screen: 'MyOrdersTab', params: { screen: 'RateProvider', params: { orderId: id, order_id: id }, initial: false } });
        break;

      // Chat do pedido aceito.
      case 'chat':
        if (isProvider) {
          nav.navigate('Provider', { screen: 'MyServicesTab', params: { screen: 'AcceptedOrder', params: { orderId: id }, initial: false } });
        } else {
          nav.navigate('Client', { screen: 'MyOrdersTab', params: { screen: 'AcceptedOrder', params: { orderId: id }, initial: false } });
        }
        break;

      // Tracking ao vivo.
      case 'tracking':
        if (isProvider) {
          nav.navigate('Provider', { screen: 'MyServicesTab', params: { screen: 'AcceptedOrder', params: { orderId: id, openTracking: true }, initial: false } });
        } else {
          nav.navigate('Client', { screen: 'MyOrdersTab', params: { screen: 'AcceptedOrder', params: { orderId: id, openTracking: true }, initial: false } });
        }
        break;

      // Carteira / anúncios.
      case 'wallet':
        nav.navigate('Wallet');
        break;

      // Perfil.
      case 'profile':
        nav.navigate(isProvider ? 'Provider' : 'Client', { screen: 'ProfileTab' });
        break;

      // Lista de pedidos/demandas.
      case 'orders':
        if (isProvider) {
          nav.navigate('Provider', { screen: 'AuctionsTab' });
        } else {
          nav.navigate('Client', { screen: 'MyOrdersTab' });
        }
        break;

      default:
        console.log('[DeepLink] Tela desconhecida, ignorando:', screen);
    }
  } catch (e) {
    console.log('[DeepLink] Erro ao navegar:', e);
  }
}

/**
 * Ponto de entrada principal. Recebe uma URL ou um target já parseado.
 * Se o usuário não estiver autenticado, guarda como pendente.
 */
export async function navigateToDeepLink(input: string | DeepLinkTarget): Promise<void> {
  const target = typeof input === 'string' ? parseDeepLink(input) : input;
  if (!target || !target.screen) return;

  if (await isAuthenticated()) {
    performNavigation(target);
  } else {
    pendingDeepLink = target;
    console.log('[DeepLink] Usuário não autenticado, deep link guardado como pendente:', target);
  }
}

/** Guarda explicitamente um deep link pendente. */
export function setPendingDeepLink(input: string | DeepLinkTarget): void {
  const target = typeof input === 'string' ? parseDeepLink(input) : input;
  if (target && target.screen) pendingDeepLink = target;
}

/**
 * Consome um deep link pendente (chamado pelo AuthContext logo após o login,
 * para continuar o fluxo na tela do deep link). Aguarda o navigator ficar pronto.
 */
export function consumePendingDeepLink(delayMs = 600): void {
  if (!pendingDeepLink) return;
  const target = pendingDeepLink;
  pendingDeepLink = null;
  setTimeout(() => performNavigation(target), delayMs);
}

export function hasPendingDeepLink(): boolean {
  return pendingDeepLink !== null;
}
