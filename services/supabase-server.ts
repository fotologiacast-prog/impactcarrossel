import { createClient } from '@supabase/supabase-js';
import type { Database } from '../types_db.ts';

const getServerEnv = (keys: string[]): string | undefined => {
  for (const key of keys) {
    const value = process.env[key];
    if (value) {
      return value;
    }
  }
  return undefined;
};

const supabaseUrl = getServerEnv(['SUPABASE_URL', 'VITE_SUPABASE_URL']) || 'https://dhxmlycuapmasriiufai.supabase.co';
const supabaseKey = getServerEnv([
  'SUPABASE_PUBLISHABLE_KEY',
  'SUPABASE_ANON_KEY',
  'VITE_SUPABASE_PUBLISHABLE_KEY',
  'VITE_SUPABASE_ANON_KEY',
]) || 'sb_publishable_mq1fYF5sLgHqMtOZb9WDgQ_6of1sfPV';

export const supabaseServer = createClient<Database>(supabaseUrl, supabaseKey, {
  auth: {
    persistSession: false,
    autoRefreshToken: false,
    detectSessionInUrl: false,
  },
});
