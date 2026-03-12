
import { createClient } from '@supabase/supabase-js';
import { Database } from '../types_db';

// Helper to get env vars safely in both Vite and Node
const getEnv = (key: string) => {
  // Check process.env (Node/Server/Vite Polyfill)
  if (typeof process !== 'undefined' && process.env && process.env[key]) {
    return process.env[key];
  }
  // Check import.meta.env (Vite Native)
  try {
    // @ts-ignore
    if (typeof import.meta !== 'undefined' && import.meta.env && import.meta.env[key]) {
      // @ts-ignore
      return import.meta.env[key];
    }
  } catch (e) {
    // Ignore errors accessing import.meta
  }
  return '';
};

const supabaseUrl = getEnv('VITE_SUPABASE_URL') || 'https://dhxmlycuapmasriiufai.supabase.co';
const supabaseAnonKey = getEnv('VITE_SUPABASE_ANON_KEY') || 'sb_publishable_mq1fYF5sLgHqMtOZb9WDgQ_6of1sfPV';

if (supabaseUrl === 'https://placeholder.supabase.co') {
  console.warn('Supabase credentials missing. Using placeholder URL to prevent crash.');
}

export const supabase = createClient<Database>(supabaseUrl, supabaseAnonKey, {
  auth: {
    persistSession: false,
    autoRefreshToken: false,
    detectSessionInUrl: false
  }
});
