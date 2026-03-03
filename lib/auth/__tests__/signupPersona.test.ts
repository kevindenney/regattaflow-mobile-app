import {
  DEFAULT_PERSONA,
  normalizePersonaParam,
} from '@/lib/auth/signupPersona';

describe('normalizePersonaParam', () => {
  it('returns default persona when param is missing', () => {
    expect(normalizePersonaParam(undefined)).toBe(DEFAULT_PERSONA);
    expect(normalizePersonaParam(null)).toBe(DEFAULT_PERSONA);
  });

  it('returns default persona for invalid values', () => {
    expect(normalizePersonaParam('admin')).toBe(DEFAULT_PERSONA);
    expect(normalizePersonaParam('')).toBe(DEFAULT_PERSONA);
    expect(normalizePersonaParam('   ')).toBe(DEFAULT_PERSONA);
  });

  it('normalizes valid persona strings', () => {
    expect(normalizePersonaParam('sailor')).toBe('sailor');
    expect(normalizePersonaParam('coach')).toBe('coach');
    expect(normalizePersonaParam('club')).toBe('club');
    expect(normalizePersonaParam(' CoAcH ')).toBe('coach');
  });

  it('handles repeated query params represented as arrays', () => {
    expect(normalizePersonaParam(['club'])).toBe('club');
    expect(normalizePersonaParam(['invalid', 'coach'])).toBe(DEFAULT_PERSONA);
  });
});
