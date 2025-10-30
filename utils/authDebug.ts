import { createLogger } from '@/lib/utils/logger';

const logger = createLogger('authDebug');
export const bindAuthDiagnostics = (supabase: any) => {
  try {
    const g = globalThis as any
    if (g.__authDebugBound) return
    g.__authDebugBound = true
    supabase.auth.onAuthStateChange((evt: any, s: any) => {
      // Auth state change listener registered
    })
  } catch (e) {
    // Silent fail
  }
}

export const dumpAuthStorage = () => {
  try {
    const keys = Object.keys(localStorage).filter((k) => k.includes('sb-') || k.includes('supabase'))
    logger.debug('[LS] keys', keys)
    logger.debug('[LS] values', keys.map((k) => [k, localStorage.getItem(k)]))
  } catch {}
}

export const dumpSbStorage = () => {
  try {
    const keys = Object.keys(localStorage).filter((k)=>k.includes('sb-')||k.includes('supabase'))
    const entries = keys.map((k)=>[k, localStorage.getItem(k)])
    logger.debug('[SB][storage-keys]', keys)
    logger.debug('[SB][storage-content]', entries)
  } catch (e) { console.warn('[SB][storage] unavailable', e) }
}

export const logSession = async (supabase:any, tag:string) => {
  const {data, error} = await supabase.auth.getSession()
  logger.debug(`[SB][${tag}] hasSession:`, !!data?.session, 'error:', error)
  if (data?.session) {
    logger.debug(`[SB][${tag}] user:`, data.session.user?.id, data.session.user?.email)
  }
}