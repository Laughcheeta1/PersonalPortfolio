const ALLOWED_EXTERNAL_PROTOCOLS = new Set(['https:', 'http:', 'mailto:', 'tel:']);

export function getSafeExternalHref(rawValue: string | null | undefined): string | null {
  if (typeof rawValue !== 'string') {
    return null;
  }

  const trimmed = rawValue.trim();
  if (trimmed.length === 0) {
    return null;
  }

  try {
    const parsed = new URL(trimmed);
    if (!ALLOWED_EXTERNAL_PROTOCOLS.has(parsed.protocol)) {
      return null;
    }
    return parsed.toString();
  } catch {
    return null;
  }
}
