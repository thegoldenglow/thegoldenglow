import { createClient } from '@supabase/supabase-js'

const supabaseUrl = import.meta.env.VITE_SUPABASE_URL
const supabaseAnonKey = import.meta.env.VITE_SUPABASE_ANON_KEY

// Validate Supabase configuration
if (!supabaseUrl || !supabaseAnonKey) {
  console.error('Supabase Configuration Error: Missing URL or API key');
  console.error('Make sure your .env.local file contains VITE_SUPABASE_URL and VITE_SUPABASE_ANON_KEY');
  
  // Default to demo values for development purposes only
  if (!supabaseUrl) {
    console.warn('Using fallback Supabase URL for development');
    // This is just a placeholder and won't work for real connections
    supabaseUrl = 'https://xyzcompany.supabase.co';
  }
  
  if (!supabaseAnonKey) {
    console.warn('Using fallback Supabase Anon Key for development');
    // This is just a placeholder and won't work for real connections
    supabaseAnonKey = 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6InhtdGh1eGJ5Y2Fzd3RmaGt0ZW1wIiwicm9sZSI6ImFub24iLCJpYXQiOjE2NTI3NzUxMzgsImV4cCI6MTk2ODM1MTEzOH0.placeholder';
  }
}

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