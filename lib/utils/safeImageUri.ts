import { Platform } from 'react-native';

const WEB_BLOCKED_URI_PATTERN = /^(file:|content:|\/data\/|data\/user\/)/i;
const WEB_ALLOWED_URI_PATTERN = /^(https?:|data:|blob:)/i;

export function getSafeImageUri(uri?: string | null): string | null {
  const raw = String(uri || '').trim();
  if (!raw) return null;

  if (Platform.OS !== 'web') {
    return raw;
  }

  if (WEB_BLOCKED_URI_PATTERN.test(raw)) {
    return null;
  }

  if (!WEB_ALLOWED_URI_PATTERN.test(raw)) {
    return null;
  }

  return raw;
}
