/**
 * Resolve an AI-suggested icon name to a valid Ionicons name.
 *
 * The AI may suggest icon names that don't exist in the Ionicons glyph map
 * (e.g. "car-sport-outline" when only "car-sport" exists). This helper:
 *   1. Checks if the name is valid as-is
 *   2. Tries stripping "-outline" / "-sharp" suffixes
 *   3. Tries adding "-outline" suffix
 *   4. Falls back to a default icon
 */

import { Ionicons } from '@expo/vector-icons';

type IoniconName = keyof typeof Ionicons.glyphMap;

const glyphMap = Ionicons.glyphMap as Record<string, number>;

const FALLBACK_ICON: IoniconName = 'sparkles';

export function resolveIonicon(name: string | undefined | null): IoniconName {
  if (!name) return FALLBACK_ICON;

  // Exact match
  if (name in glyphMap) return name as IoniconName;

  // Try stripping -outline or -sharp suffix
  const stripped = name.replace(/-(outline|sharp)$/, '');
  if (stripped !== name && stripped in glyphMap) return stripped as IoniconName;

  // Try adding -outline suffix
  const withOutline = `${name}-outline`;
  if (withOutline in glyphMap) return withOutline as IoniconName;

  // Try base name + outline (e.g. "car-sport-outline" → strip → "car-sport" already checked,
  // but "compass-outline" → "compass" → try "compass-outline")
  const strippedWithOutline = `${stripped}-outline`;
  if (stripped !== name && strippedWithOutline in glyphMap) return strippedWithOutline as IoniconName;

  return FALLBACK_ICON;
}
