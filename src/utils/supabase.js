import { createClient } from '@supabase/supabase-js'

let supabaseUrl = import.meta.env.VITE_SUPABASE_URL
let supabaseAnonKey = import.meta.env.VITE_SUPABASE_ANON_KEY

// Validate Supabase configuration
if (!supabaseUrl || !supabaseAnonKey) {
  console.error('Supabase Configuration Error: Missing URL or API key');
  console.error('Make sure your .env.local file contains VITE_SUPABASE_URL and VITE_SUPABASE_ANON_KEY');
  
  // Default to demo values for development purposes only
  if (!supabaseUrl) {
    console.warn('Using fallback Supabase URL for development');
    // This is just a placeholder and won't work for real connections
    supabaseUrl = 'https://luzpkuypmyidaluitvzh.supabase.co';
  }
  
  if (!supabaseAnonKey) {
    console.warn('Missing VITE_SUPABASE_ANON_KEY environment variable');
    console.error('Please set VITE_SUPABASE_ANON_KEY in your .env file');
    
    // Enable guest mode automatically when keys are missing
    console.log('Enabling guest mode due to missing Supabase configuration');
    try { localStorage.setItem('gg_guest_mode', 'true'); } catch {}
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

// Helper to check if Supabase is configured locally (without making network calls)
export const isSupabaseAvailable = () => {
  try {
    if (typeof localStorage !== 'undefined' && localStorage.getItem('gg_guest_mode') === 'true') return false;
  } catch {}
  return !!supabaseUrl && !!supabaseAnonKey;
}

// Helper function to check connection status
export const checkSupabaseConnection = async () => {
  try {
    const { data, error } = await supabase.from('profiles').select('count').single()
    if (error) throw error
    return { success: true, data }
  } catch (error) {
    console.error('Supabase connection error:', error)
    // Enable guest mode on connection error
    console.log('Enabling guest mode due to Supabase connection error');
    try { localStorage.setItem('gg_guest_mode', 'true'); } catch {}
    return { success: false, error }
  }
}