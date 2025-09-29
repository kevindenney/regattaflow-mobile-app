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
  const timestamp = new Date().toISOString();
  const prefix = '🔐 [AUTH-DIAGNOSTICS]';

  console.log(`${prefix} ===== ${event.toUpperCase()} =====`);
  console.log(`${prefix} Timestamp: ${timestamp}`);

  if (details) {
    console.log(`${prefix} Details:`, details);
  }

  if (error) {
    console.error(`${prefix} Error:`, errToTextDetailed(error));
  }

  console.log(`${prefix} ===== END ${event.toUpperCase()} =====`);
}

/**
 * Enhanced auth state logging
 */
export function logAuthState(context: string, state: {
  ready?: boolean;
  signedIn?: boolean;
  user?: any;
  userProfile?: any;
  userType?: string;
  loading?: boolean;
}) {
  const timestamp = new Date().toISOString();
  const prefix = '🔐 [AUTH-STATE]';

  console.log(`${prefix} [${context}] Auth state at ${timestamp}:`);
  console.log(`${prefix} [${context}] Ready: ${state.ready}`);
  console.log(`${prefix} [${context}] Signed In: ${state.signedIn}`);
  console.log(`${prefix} [${context}] Has User: ${!!state.user}`);
  console.log(`${prefix} [${context}] User Email: ${state.user?.email || 'N/A'}`);
  console.log(`${prefix} [${context}] User Profile: ${!!state.userProfile}`);
  console.log(`${prefix} [${context}] User Type: ${state.userType || 'N/A'}`);
  console.log(`${prefix} [${context}] Loading: ${state.loading}`);

  if (typeof window !== 'undefined') {
    console.log(`${prefix} [${context}] Current URL: ${window.location.href}`);
    console.log(`${prefix} [${context}] Current Pathname: ${window.location.pathname}`);
  }
}