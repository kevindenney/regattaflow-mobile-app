const UUID_REGEX =
  /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i;

/**
 * Returns true when the provided value resembles a UUID v4 string.
 */
export function isUuid(value?: string | null): value is string {
  if (typeof value !== 'string') {
    return false;
  }
  return UUID_REGEX.test(value);
}

/**
 * Generate a reasonably unique UUID v4 string.
 * Falls back to Math.random when crypto.randomUUID is unavailable.
 */
export function generateUuid(): string {
  if (typeof globalThis !== 'undefined') {
    const cryptoRef = (globalThis as any)?.crypto;
    if (cryptoRef && typeof cryptoRef.randomUUID === 'function') {
      return cryptoRef.randomUUID();
    }
  }

  let uuid = '';
  const template = 'xxxxxxxx-xxxx-4xxx-yxxx-xxxxxxxxxxxx';
  for (let i = 0; i < template.length; i += 1) {
    const char = template[i];
    if (char === 'x' || char === 'y') {
      const random = Math.floor(Math.random() * 16);
      const value = char === 'x' ? random : (random & 0x3) | 0x8;
      uuid += value.toString(16);
    } else {
      uuid += char;
    }
  }
  return uuid;
}

/**
 * Guarantees a UUID output, generating a new value when necessary.
 */
export function ensureUuid(value?: string | null): string {
  return isUuid(value) ? (value as string) : generateUuid();
}
