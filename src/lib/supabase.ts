/// <reference types="vite/client" />
import { createClient } from '@supabase/supabase-js';

let supabaseUrl = import.meta.env.VITE_SUPABASE_URL || '';
const supabaseAnonKey = import.meta.env.VITE_SUPABASE_ANON_KEY || '';

if (supabaseUrl && !supabaseUrl.startsWith('http')) {
  supabaseUrl = `https://${supabaseUrl}`;
}

export const supabase = createClient(
  supabaseUrl || 'http://placeholder.com', 
  supabaseAnonKey || 'placeholder'
);

export const isSupabaseConfigured = Boolean(supabaseUrl && supabaseAnonKey);
