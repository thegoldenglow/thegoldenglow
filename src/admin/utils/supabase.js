import { createClient } from '@supabase/supabase-js';

// Initialize the Supabase client directly rather than re-exporting
const supabaseUrl = import.meta.env.VITE_SUPABASE_URL;
const supabaseAnonKey = import.meta.env.VITE_SUPABASE_ANON_KEY;

export const supabase = createClient(supabaseUrl, supabaseAnonKey);