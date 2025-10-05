export const errToText = (e:any)=> (e?.message || e?.error_description || e?.hint || 'Unknown error')

/**
 * Enhanced error to text utility for debugging
 */
export function errToTextDetailed(error: unknown): string {
  if (!error) return 'Unknown error';

  if (typeof error === 'string') return error;

  if (error instanceof Error) {
    return `${error.name}: ${error.message}${error.stack ? '\nStack: ' + error.stack : ''}`;
  }

  if (typeof error === 'object') {
    try {
      return JSON.stringify(error, null, 2);
    } catch {
      return String(error);
    }
  }

  return String(error);
}

/**
 * Enhanced auth event logging utility
 */
export function logAuthEvent(event: string, details?: Record<string, any>, error?: unknown) {
  // Logging disabled for production
}

/**
 * Enhanced auth state logging
 */
export function logAuthState(context: string, state: {
  ready?: boolean;
  signedIn?: boolean;
  user?: any;
  userProfile?: any;
  userType?: 'sailor' | 'coach' | 'club' | null;
  loading?: boolean;
}) {
  // Logging disabled for production
}