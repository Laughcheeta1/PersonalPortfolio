import { ChatbotApiError } from './api';
import { type Locale, translate } from '../i18n/messages';

export function getChatbotErrorMessageForFailure(error: unknown, locale: Locale): string {
  if (error instanceof ChatbotApiError) {
    return translate(locale, error.i18nKey);
  }

  return translate(locale, 'chat.error.generic');
}
