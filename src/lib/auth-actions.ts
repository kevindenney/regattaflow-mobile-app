import { supabase } from '@/src/services/supabase'

export const signOutEverywhere = async () => {
  console.log('[AUTH] signOut start')
  const { error } = await supabase.auth.signOut({ scope: 'global' })
  if (error) {
    console.error('[AUTH] signOut error:', error)
    throw error
  }
  console.log('[AUTH] signOut success')

  // Prevent immediate re-login from leftover hash or cached URL
  try {
    if (typeof window !== 'undefined') {
      const url = new URL(window.location.href)
      if (url.hash.includes('access_token') || url.hash.includes('refresh_token')) {
        window.history.replaceState(null, '', url.origin + url.pathname)
      }
    }
  } catch (e) {
    console.warn('[AUTH] hash scrub fail', e)
  }
}