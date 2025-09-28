import {Slot} from 'expo-router'
import {AuthProvider, useAuth, TEST_EXPORT} from '@/src/providers/AuthProvider'

console.log('🔥 [LAYOUT] Testing import:', TEST_EXPORT)

function Gate() {
  const {ready} = useAuth()
  console.log('🚪 [GATE] regattaflow-app gate:', {ready})
  console.log('🚪 [GATE] Gate component is rendering, ready state:', ready)

  if (!ready) {
    console.log('🚪 [GATE] Returning null because ready is false')
    return null
  }

  console.log('🚪 [GATE] Rendering Slot because ready is true')
  return <Slot/>
}

export default function RootLayout() {
  console.log('🔥 [LAYOUT] regattaflow-app root layout render')
  return (
    <AuthProvider>
      <Gate/>
    </AuthProvider>
  )
}
