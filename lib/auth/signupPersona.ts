export type PersonaRole = 'sailor' | 'coach' | 'club';

export const DEFAULT_PERSONA: PersonaRole = 'sailor';

const VALID_PERSONAS: readonly PersonaRole[] = ['sailor', 'coach', 'club'];

export function normalizePersonaParam(
  rawPersona: string | string[] | undefined | null
): PersonaRole {
  const firstValue = Array.isArray(rawPersona) ? rawPersona[0] : rawPersona;
  if (typeof firstValue !== 'string') {
    return DEFAULT_PERSONA;
  }

  const normalized = firstValue.toLowerCase().trim();
  return VALID_PERSONAS.includes(normalized as PersonaRole)
    ? (normalized as PersonaRole)
    : DEFAULT_PERSONA;
}
