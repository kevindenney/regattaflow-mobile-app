import {useEffect, useRef} from 'react'
import {router} from 'expo-router'
import {supabase} from '@/src/services/supabase'
import {logSession, dumpSbStorage} from '@/src/utils/authDebug'

export default function Callback(){
  const ran = useRef(false)

  useEffect(()=>{
    if (ran.current) return
    ran.current = true
    const run = async ()=>{
      console.log('[CB] location:', window.location.href)
      // Touch the client so detectSessionInUrl kicks in
      await supabase.auth.getSession().catch((e)=>console.warn('[CB] getSession err', e))
      await logSession(supabase, 'AFTER_AUTO_PARSE')
      dumpSbStorage()

      // Now it's safe to scrub hash and leave
      try { window.history.replaceState(null, '', '/callback') } catch {}
      setTimeout(()=>router.replace('/'), 50)
    }
    run()
  },[])

  return <div style={{padding:24}}>Processing authentication tokens…</div>
}