import React, { useEffect, useState, useRef } from 'react';
import {
  Modal, View, Text, ScrollView, TouchableOpacity, StyleSheet, Alert,
} from 'react-native';
import Icon from 'react-native-vector-icons/MaterialIcons';

/**
 * Prominent Disclosure de localização (política de Dados do Usuário do Google Play).
 *
 * Requisitos que este componente atende:
 *  - o aviso aparece DENTRO do app, ANTES do prompt de permissão do sistema;
 *  - diz explicitamente que o app coleta/acessa dados de LOCALIZAÇÃO;
 *  - descreve todas as finalidades para as quais a localização é usada;
 *  - no caso do rastreamento, informa que a coleta continua com o app
 *    minimizado ou com a tela desligada enquanto o trajeto está ativo;
 *  - exige uma ação afirmativa do usuário ("Permitir") e permite recusar;
 *  - não fica escondido em política de privacidade / termos de uso / menu.
 *
 * O app não usa ACCESS_BACKGROUND_LOCATION: a coleta com o app minimizado é
 * feita por um foreground service do tipo "location" (veja o AndroidManifest).
 * Mesmo assim ela é divulgada aqui, porque o usuário precisa saber que a coleta
 * continua quando ele sai do app.
 */

export type LocationDisclosureKind = 'address' | 'tracking';

interface DisclosureContent {
  icon: string;
  title: string;
  intro: string;
  bullets: string[];
  footer: string;
  acceptLabel: string;
}

const CONTENT: Record<LocationDisclosureKind, DisclosureContent> = {
  address: {
    icon: 'my-location',
    title: 'A Cotaja coleta dados de localização',
    intro:
      'Para preencher seu endereço automaticamente, a Cotaja precisa acessar e coletar a localização precisa (GPS) deste dispositivo.',
    bullets: [
      'A localização é convertida em um endereço (rua, bairro, cidade, estado e CEP) e preenchida no formulário para você conferir e editar.',
      'A coleta acontece apenas neste momento, enquanto o app está aberto e após você tocar em "Permitir". O app não coleta sua localização em segundo plano para essa finalidade.',
      'O endereço confirmado é salvo na sua conta para ser usado nos pedidos de serviço.',
    ],
    footer:
      'Você pode recusar e digitar o endereço manualmente. A permissão pode ser revogada a qualquer momento nas configurações do dispositivo.',
    acceptLabel: 'Permitir',
  },
  tracking: {
    icon: 'navigation',
    title: 'A Cotaja coleta dados de localização',
    intro:
      'Para iniciar o trajeto até o cliente, a Cotaja precisa acessar e coletar a localização precisa (GPS) deste dispositivo.',
    bullets: [
      'Sua localização é enviada em tempo real ao cliente do pedido para que ele acompanhe no mapa o seu deslocamento até o endereço dele.',
      'Isso também confirma ao cliente que o profissional a caminho é o mesmo que venceu o leilão na plataforma.',
      'Enquanto o trajeto estiver ativo, a coleta continua se você minimizar a Cotaja ou desligar a tela — por exemplo, ao usar um app de navegação. Nesse período uma notificação permanente da Cotaja fica visível no seu aparelho.',
      'A coleta começa quando você inicia o trajeto e é encerrada assim que você finaliza o trajeto ou o serviço. A Cotaja não coleta sua localização fora de um trajeto ativo.',
    ],
    footer:
      'Somente o cliente do pedido em andamento vê sua localização. Você pode recusar, mas o trajeto em tempo real não ficará disponível.',
    acceptLabel: 'Permitir',
  },
};

type Resolver = (accepted: boolean) => void;
type Opener = (kind: LocationDisclosureKind) => Promise<boolean>;

let openDisclosure: Opener | null = null;

/**
 * Exibe o aviso e resolve com `true` somente se o usuário der o consentimento
 * afirmativo. Deve ser chamado ANTES de qualquer pedido de permissão do sistema
 * ou de qualquer leitura de localização.
 */
export function showLocationDisclosure(kind: LocationDisclosureKind): Promise<boolean> {
  if (openDisclosure) return openDisclosure(kind);
  // Fallback caso o host ainda não esteja montado: o aviso continua aparecendo
  // antes do prompt do sistema, nunca depois.
  const content = CONTENT[kind];
  return new Promise((resolve) => {
    Alert.alert(
      content.title,
      `${content.intro}\n\n${content.bullets.map((b) => `• ${b}`).join('\n\n')}\n\n${content.footer}`,
      [
        { text: 'Agora não', style: 'cancel', onPress: () => resolve(false) },
        { text: content.acceptLabel, onPress: () => resolve(true) },
      ],
      { cancelable: false },
    );
  });
}

/**
 * Monte uma única vez na raiz do app (App.tsx). Sem ele, `showLocationDisclosure`
 * cai no fallback com Alert.
 */
export function LocationDisclosureHost() {
  const [kind, setKind] = useState<LocationDisclosureKind | null>(null);
  const resolverRef = useRef<Resolver | null>(null);

  useEffect(() => {
    openDisclosure = (nextKind: LocationDisclosureKind) =>
      new Promise<boolean>((resolve) => {
        resolverRef.current = resolve;
        setKind(nextKind);
      });
    return () => {
      openDisclosure = null;
    };
  }, []);

  const finish = (accepted: boolean) => {
    setKind(null);
    const resolve = resolverRef.current;
    resolverRef.current = null;
    resolve?.(accepted);
  };

  const content = kind ? CONTENT[kind] : null;

  return (
    <Modal
      visible={content !== null}
      transparent
      animationType="fade"
      statusBarTranslucent
      onRequestClose={() => finish(false)}
    >
      <View style={styles.backdrop}>
        <View style={styles.card}>
          {content && (
            <>
              <View style={styles.iconCircle}>
                <Icon name={content.icon} size={28} color="#4f46e5" />
              </View>
              <Text style={styles.title}>{content.title}</Text>

              <ScrollView
                style={styles.body}
                contentContainerStyle={styles.bodyContent}
                showsVerticalScrollIndicator={false}
                bounces={false}
              >
                <Text style={styles.intro}>{content.intro}</Text>
                {content.bullets.map((bullet, index) => (
                  <View key={index} style={styles.bulletRow}>
                    <View style={styles.bulletDot} />
                    <Text style={styles.bulletText}>{bullet}</Text>
                  </View>
                ))}
                <Text style={styles.footer}>{content.footer}</Text>
              </ScrollView>

              <TouchableOpacity
                style={styles.acceptBtn}
                onPress={() => finish(true)}
                activeOpacity={0.85}
              >
                <Text style={styles.acceptBtnText}>{content.acceptLabel}</Text>
              </TouchableOpacity>
              <TouchableOpacity
                style={styles.declineBtn}
                onPress={() => finish(false)}
                activeOpacity={0.7}
              >
                <Text style={styles.declineBtnText}>Agora não</Text>
              </TouchableOpacity>
            </>
          )}
        </View>
      </View>
    </Modal>
  );
}

const styles = StyleSheet.create({
  backdrop: {
    flex: 1,
    backgroundColor: 'rgba(15, 23, 42, 0.6)',
    justifyContent: 'center',
    alignItems: 'center',
    paddingHorizontal: 20,
  },
  card: {
    width: '100%',
    maxWidth: 420,
    maxHeight: '85%',
    backgroundColor: '#ffffff',
    borderRadius: 20,
    paddingHorizontal: 22,
    paddingTop: 24,
    paddingBottom: 16,
  },
  iconCircle: {
    alignSelf: 'center',
    width: 56,
    height: 56,
    borderRadius: 28,
    backgroundColor: '#eef2ff',
    justifyContent: 'center',
    alignItems: 'center',
    marginBottom: 14,
  },
  title: {
    fontSize: 18,
    fontWeight: '700',
    color: '#111827',
    textAlign: 'center',
    marginBottom: 12,
  },
  body: {
    flexShrink: 1,
  },
  bodyContent: {
    paddingBottom: 4,
  },
  intro: {
    fontSize: 14,
    lineHeight: 21,
    color: '#374151',
    marginBottom: 14,
  },
  bulletRow: {
    flexDirection: 'row',
    marginBottom: 10,
  },
  bulletDot: {
    width: 6,
    height: 6,
    borderRadius: 3,
    backgroundColor: '#4f46e5',
    marginTop: 7,
    marginRight: 10,
  },
  bulletText: {
    flex: 1,
    fontSize: 13.5,
    lineHeight: 20,
    color: '#4b5563',
  },
  footer: {
    fontSize: 12.5,
    lineHeight: 18,
    color: '#6b7280',
    marginTop: 6,
    marginBottom: 4,
  },
  acceptBtn: {
    backgroundColor: '#4f46e5',
    borderRadius: 12,
    paddingVertical: 14,
    alignItems: 'center',
    marginTop: 16,
  },
  acceptBtnText: {
    color: '#ffffff',
    fontSize: 15,
    fontWeight: '700',
  },
  declineBtn: {
    paddingVertical: 12,
    alignItems: 'center',
  },
  declineBtnText: {
    color: '#6b7280',
    fontSize: 14,
    fontWeight: '600',
  },
});

export default LocationDisclosureHost;
