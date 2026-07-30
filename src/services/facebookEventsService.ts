import { AppEventsLogger } from 'react-native-fbsdk-next';

const { AppEvents, AppEventParams } = AppEventsLogger;

/**
 * Wrapper dos eventos padrão do Facebook App Events (Events Manager).
 * https://developers.facebook.com/docs/app-events/getting-started-app-events-ios
 * https://developers.facebook.com/docs/app-events/getting-started-app-events-android
 */
export const facebookEvents = {
  /** Pesquisar */
  logSearch(searchString: string, contentType?: string) {
    AppEventsLogger.logEvent(AppEvents.Searched, {
      [AppEventParams.SearchString]: searchString,
      ...(contentType ? { [AppEventParams.ContentType]: contentType } : {}),
    });
  },

  /** Concluir inscrição */
  logCompleteRegistration(registrationMethod: string) {
    AppEventsLogger.logEvent(AppEvents.CompletedRegistration, {
      [AppEventParams.RegistrationMethod]: registrationMethod,
    });
  },

  /** Ver conteúdo */
  logViewContent(contentId: string, contentType: string) {
    AppEventsLogger.logEvent(AppEvents.ViewedContent, {
      [AppEventParams.ContentID]: contentId,
      [AppEventParams.ContentType]: contentType,
    });
  },

  /** Assinar */
  logSubscribe(valueToSum?: number, currency?: string) {
    AppEventsLogger.logEvent(
      AppEvents.Subscribe,
      valueToSum ?? 0,
      currency ? { [AppEventParams.Currency]: currency } : {},
    );
  },

  /** Iniciar finalização da compra */
  logInitiateCheckout(params: {
    contentId: string;
    contentType: string;
    currency: string;
    valueToSum: number;
  }) {
    AppEventsLogger.logEvent(AppEvents.InitiatedCheckout, params.valueToSum, {
      [AppEventParams.ContentID]: params.contentId,
      [AppEventParams.ContentType]: params.contentType,
      [AppEventParams.Currency]: params.currency,
    });
  },

  /** Iniciar período de avaliação */
  logStartTrial() {
    AppEventsLogger.logEvent(AppEvents.StartTrial);
  },

  /** Classificar */
  logRate(maxRatingValue: number, contentType?: string) {
    AppEventsLogger.logEvent(AppEvents.Rated, {
      [AppEventParams.MaxRatingValue]: maxRatingValue,
      ...(contentType ? { [AppEventParams.ContentType]: contentType } : {}),
    });
  },

  /** Comprar */
  logPurchase(params: {
    amount: number;
    currency: string;
    contentId?: string;
    contentType?: string;
  }) {
    AppEventsLogger.logPurchase(params.amount, params.currency, {
      ...(params.contentId ? { [AppEventParams.ContentID]: params.contentId } : {}),
      ...(params.contentType ? { [AppEventParams.ContentType]: params.contentType } : {}),
    });
  },

  /** Adicionar informações de pagamento */
  logAddPaymentInfo(success: boolean) {
    AppEventsLogger.logEvent(AppEvents.AddedPaymentInfo, {
      [AppEventParams.Success]: success ? '1' : '0',
    });
  },
};
