export const bindAuthDiagnostics = (supabase: any) => {
  try {
    const g = globalThis as any
    if (g.__authDebugBound) return
    g.__authDebugBound = true
    console.log('🧪 [AUTHDBG] binding onAuthStateChange')
    supabase.auth.onAuthStateChange((evt: any, s: any) => {
      console.log('🔔 auth evt', { evt, hasSession: !!s, uid: s?.user?.id })
    })
  } catch (e) {
    console.warn('auth debug bind error', e)
  }
}

export const dumpAuthStorage = () => {
  try {
    const keys = Object.keys(localStorage).filter((k) => k.includes('sb-') || k.includes('supabase'))
    console.log('[LS] keys', keys)
    console.log('[LS] values', keys.map((k) => [k, localStorage.getItem(k)]))
  } catch {}
}

export const dumpSbStorage = () => {
  try {
    const keys = Object.keys(localStorage).filter((k)=>k.includes('sb-')||k.includes('supabase'))
    const entries = keys.map((k)=>[k, localStorage.getItem(k)])
    console.log('[SB][storage-keys]', keys)
    console.log('[SB][storage-content]', entries)
  } catch (e) { console.warn('[SB][storage] unavailable', e) }
}

export const logSession = async (supabase:any, tag:string) => {
  const {data, error} = await supabase.auth.getSession()
  console.log(`[SB][${tag}] hasSession:`, !!data?.session, 'error:', error)
  if (data?.session) {
    console.log(`[SB][${tag}] user:`, data.session.user?.id, data.session.user?.email)
  }
}