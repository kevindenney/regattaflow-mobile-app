/**
 * Extract a display name from OAuth user metadata.
 * Different providers store the name in different fields:
 * - Google: full_name, name (string)
 * - Apple: full_name (sometimes object), name (sometimes object with firstName/lastName),
 *          given_name, family_name
 */
export const extractOAuthDisplayName = (userMetadata: Record<string, any> | undefined): string => {
  if (!userMetadata) return '';

  // Try direct string fields first
  if (typeof userMetadata.full_name === 'string' && userMetadata.full_name.trim()) {
    return userMetadata.full_name.trim();
  }
  if (typeof userMetadata.name === 'string' && userMetadata.name.trim()) {
    return userMetadata.name.trim();
  }

  // Apple sometimes provides name as an object { firstName, lastName }
  if (userMetadata.name && typeof userMetadata.name === 'object') {
    const parts = [userMetadata.name.firstName, userMetadata.name.lastName].filter(Boolean);
    if (parts.length > 0) return parts.join(' ').trim();
  }
  if (userMetadata.full_name && typeof userMetadata.full_name === 'object') {
    const parts = [
      userMetadata.full_name.firstName || userMetadata.full_name.givenName,
      userMetadata.full_name.lastName || userMetadata.full_name.familyName,
    ].filter(Boolean);
    if (parts.length > 0) return parts.join(' ').trim();
  }

  // Try given_name / family_name (common in OIDC)
  const givenName = userMetadata.given_name || userMetadata.firstName;
  const familyName = userMetadata.family_name || userMetadata.lastName;
  if (givenName || familyName) {
    return [givenName, familyName].filter(Boolean).join(' ').trim();
  }

  // Last resort: use email prefix as display name
  if (typeof userMetadata.email === 'string' && userMetadata.email.includes('@')) {
    return userMetadata.email.split('@')[0];
  }

  return '';
};
