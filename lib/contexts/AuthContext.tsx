// Compatibility re-export for regattaflow-app
// This allows existing imports to work with the new simplified AuthProvider
export { useAuth, AuthProvider } from '@/providers/AuthProvider';
export type { UserType } from '@/services/supabase';