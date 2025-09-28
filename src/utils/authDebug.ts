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