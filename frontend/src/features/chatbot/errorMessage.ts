import { ChatbotApiError } from './api';
import { type Locale, translate } from '../i18n/messages';

export function getChatbotErrorMessageForFailure(error: unknown, locale: Locale): string {
  if (error instanceof ChatbotApiError) {
    if (error.errorCode === 'groq_credit_limit_exceeded' || error.status === 402) {
      return translate(locale, 'chat.error.creditLimit');
    }

    if (error.errorCode === 'api_gateway_rate_limited' || error.status === 429) {
      return translate(locale, 'chat.error.rateLimit');
    }
  }

  return translate(locale, 'chat.error.generic');
}
