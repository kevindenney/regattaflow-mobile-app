/**
 * PersonaRole still includes 'coach' for backward compatibility with
 * existing users, but new signups only see 'sailor' and 'club'.
 * Coach users are treated as sailor + hasCoaching capability.
 */
export type PersonaRole = 'sailor' | 'coach' | 'club';

export const DEFAULT_PERSONA: PersonaRole = 'sailor';

/** Personas available for new signups */
export const SIGNUP_PERSONAS: readonly PersonaRole[] = ['sailor', 'club'];

/** All valid personas (including legacy coach) */
const VALID_PERSONAS: readonly PersonaRole[] = ['sailor', 'coach', 'club'];

/** Maps friendly aliases (used in URLs/marketing) to internal persona roles. */
const PERSONA_ALIASES: Record<string, PersonaRole> = {
  individual: 'sailor',
  organization: 'club',
  org: 'club',
  // Legacy alias — coach signups redirect to sailor
  instructor: 'sailor',
  coach: 'sailor',
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
