import { createClient } from '@supabase/supabase-js'

const supabaseUrl = process.env.EXPO_PUBLIC_SUPABASE_URL || 'https://placeholder.supabase.co'
const supabaseAnonKey = process.env.EXPO_PUBLIC_SUPABASE_ANON_KEY || 'placeholder-key'

// Singleton pattern to prevent multiple clients and duplicate listeners
let _supabase: ReturnType<typeof createClient> | undefined;

export const supabase = (() => {
  if (_supabase) {
    console.log('🔄 [SUPABASE] Returning existing client instance');
    return _supabase;
  }

  console.log('🆕 [SUPABASE] Creating new client instance');
  _supabase = createClient(supabaseUrl, supabaseAnonKey, {
    auth: {
      autoRefreshToken: true,
      persistSession: true,
      detectSessionInUrl: false, // Handle manually for better control
      redirectTo: typeof window !== 'undefined' ? `${window.location.origin}/callback` : undefined,
    },
    global: {
      fetch: (url, options = {}) => {
        // Create timeout logic using AbortController
        const controller = new AbortController();
        const timeoutId = setTimeout(() => controller.abort(), 10000); // 10 second timeout

        return fetch(url, {
          ...options,
          signal: controller.signal,
        }).finally(() => {
          clearTimeout(timeoutId);
        });
      },
      headers: {
        'x-client-info': 'regattaflow-expo-app',
      },
    },
  });

  return _supabase;
})();

// Database types
export interface Database {
  public: {
    Tables: {
      users: {
        Row: {
          id: string
          email: string
          full_name: string
          subscription_status: string
          subscription_tier: string
          stripe_customer_id: string
          created_at: string
        }
        Insert: {
          id: string
          email: string
          full_name: string
          subscription_status?: string
          subscription_tier?: string
          stripe_customer_id?: string
          created_at?: string
        }
        Update: {
          id?: string
          email?: string
          full_name?: string
          subscription_status?: string
          subscription_tier?: string
          stripe_customer_id?: string
          created_at?: string
        }
      }
      regattas: {
        Row: {
          id: string
          user_id: string
          name: string
          venue: any // jsonb
          start_date: string
          end_date: string
          organizing_authority: string
          documents: any[] // jsonb[]
          created_at: string
        }
        Insert: {
          id?: string
          user_id: string
          name: string
          venue: any
          start_date: string
          end_date: string
          organizing_authority: string
          documents?: any[]
          created_at?: string
        }
        Update: {
          id?: string
          user_id?: string
          name?: string
          venue?: any
          start_date?: string
          end_date?: string
          organizing_authority?: string
          documents?: any[]
          created_at?: string
        }
      }
      races: {
        Row: {
          id: string
          regatta_id: string
          race_number: number
          scheduled_start: string
          actual_start: string | null
          course_config: any // jsonb
          weather_snapshot: any // jsonb
          strategy: any // jsonb
          crew_members: string[]
          status: string
        }
        Insert: {
          id?: string
          regatta_id: string
          race_number: number
          scheduled_start: string
          actual_start?: string | null
          course_config: any
          weather_snapshot?: any
          strategy?: any
          crew_members?: string[]
          status?: string
        }
        Update: {
          id?: string
          regatta_id?: string
          race_number?: number
          scheduled_start?: string
          actual_start?: string | null
          course_config?: any
          weather_snapshot?: any
          strategy?: any
          crew_members?: string[]
          status?: string
        }
      }
    }
  }
}

export type Tables<T extends keyof Database['public']['Tables']> = Database['public']['Tables'][T]['Row']
export type TablesInsert<T extends keyof Database['public']['Tables']> = Database['public']['Tables'][T]['Insert']
export type TablesUpdate<T extends keyof Database['public']['Tables']> = Database['public']['Tables'][T]['Update']

// Query retry wrapper with timeout logic
export const queryWithRetry = async <T>(
  queryFn: () => Promise<T>,
  retries = 3,
  delay = 1000
): Promise<T> => {
  for (let i = 0; i < retries; i++) {
    try {
      console.log(`🔄 [QUERY] Attempt ${i + 1}/${retries}`);
      const start = Date.now();
      const result = await queryFn();
      const duration = Date.now() - start;
      console.log(`✅ [QUERY] Success in ${duration}ms on attempt ${i + 1}`);
      return result;
    } catch (err: any) {
      console.warn(`⚠️ [QUERY] Attempt ${i + 1} failed:`, err.message);

      if (i < retries - 1) {
        console.log(`🔄 [QUERY] Retrying in ${delay}ms...`);
        await new Promise(res => setTimeout(res, delay));
        delay *= 1.5; // Exponential backoff
      } else {
        console.error(`🔴 [QUERY] All ${retries} attempts failed`);
        throw err;
      }
    }
  }
  throw new Error('Query failed after all retries');
}

// Test connectivity to Supabase
export const testSupabaseConnectivity = async (): Promise<{ success: boolean; duration: number; error?: string }> => {
  const start = Date.now();
  try {
    const response = await fetch(`${supabaseUrl}/rest/v1/`, {
      method: 'GET',
      headers: {
        'apikey': supabaseAnonKey,
        'Authorization': `Bearer ${supabaseAnonKey}`
      },
      signal: AbortSignal.timeout(5000)
    });

    const duration = Date.now() - start;
    return {
      success: response.ok,
      duration,
      error: response.ok ? undefined : `HTTP ${response.status}: ${response.statusText}`
    };
  } catch (error: any) {
    const duration = Date.now() - start;
    return {
      success: false,
      duration,
      error: error.message
    };
  }
}