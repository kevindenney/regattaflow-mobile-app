export type PersonaRole = 'sailor' | 'coach' | 'club';

export const DEFAULT_PERSONA: PersonaRole = 'sailor';

const VALID_PERSONAS: readonly PersonaRole[] = ['sailor', 'coach', 'club'];

/** Maps friendly aliases (used in URLs/marketing) to internal persona roles. */
const PERSONA_ALIASES: Record<string, PersonaRole> = {
  individual: 'sailor',
  organization: 'club',
  org: 'club',
  instructor: 'coach',
};

export function normalizePersonaParam(
  rawPersona: string | string[] | undefined | null
): PersonaRole {
  const firstValue = Array.isArray(rawPersona) ? rawPersona[0] : rawPersona;
  if (typeof firstValue !== 'string') {
    return DEFAULT_PERSONA;
  }

  const normalized = firstValue.toLowerCase().trim();
  if (VALID_PERSONAS.includes(normalized as PersonaRole)) {
    return normalized as PersonaRole;
  }
  return PERSONA_ALIASES[normalized] ?? DEFAULT_PERSONA;
}
