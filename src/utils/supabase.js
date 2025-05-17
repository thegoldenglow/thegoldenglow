import { createClient } from '@supabase/supabase-js'

const supabaseUrl = import.meta.env.VITE_SUPABASE_URL
const supabaseAnonKey = import.meta.env.VITE_SUPABASE_ANON_KEY

// Log the Supabase configuration for debugging
console.log('Supabase Configuration:', { 
  urlConfigured: !!supabaseUrl, 
  keyConfigured: !!supabaseAnonKey,
  urlStart: supabaseUrl ? supabaseUrl.substring(0, 10) + '...' : 'undefined',
  keyStart: supabaseAnonKey ? supabaseAnonKey.substring(0, 5) + '...' : 'undefined'
});

// Create Supabase client with enhanced configuration
export const supabase = createClient(supabaseUrl, supabaseAnonKey, {
  auth: {
    autoRefreshToken: true,
    persistSession: true,
    detectSessionInUrl: true
  },
  realtime: {
    params: {
      eventsPerSecond: 10
    }
  },
  db: {
    schema: 'public'
  }
})

// Helper function to check connection status
export const checkSupabaseConnection = async () => {
  try {
    const { data, error } = await supabase.from('profiles').select('count').single()
    if (error) throw error
    return { success: true, data }
  } catch (error) {
    console.error('Supabase connection error:', error)
    return { success: false, error }
  }
}