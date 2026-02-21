const FALLBACK_LANGUAGE = 'en';

const ERROR_MESSAGES: Record<string, string> = {
  en: 'Something went wrong while contacting the chatbot. Please try again.',
  es: 'Ocurrió un error al contactar al chatbot. Inténtalo de nuevo.',
  fr: "Une erreur s'est produite lors du contact avec le chatbot. Veuillez réessayer.",
  pt: 'Ocorreu um erro ao contatar o chatbot. Tente novamente.',
  zh: '联系聊天机器人时出错。请重试。',
};

function normalizeLanguageTag(tag: string): string {
  return tag.trim().toLowerCase();
}

function resolvePreferredLanguage(): string {
  if (typeof navigator === 'undefined') {
    return FALLBACK_LANGUAGE;
  }

  const languageCandidates = Array.isArray(navigator.languages) && navigator.languages.length > 0
    ? navigator.languages
    : [navigator.language];

  for (const candidate of languageCandidates) {
    if (typeof candidate !== 'string' || candidate.trim().length === 0) {
      continue;
    }

    const normalized = normalizeLanguageTag(candidate);
    const base = normalized.split('-')[0];
    if (base in ERROR_MESSAGES) {
      return base;
    }
  }

  return FALLBACK_LANGUAGE;
}

export function getLocalizedChatbotErrorMessage(): string {
  const language = resolvePreferredLanguage();
  return ERROR_MESSAGES[language] ?? ERROR_MESSAGES[FALLBACK_LANGUAGE];
}
