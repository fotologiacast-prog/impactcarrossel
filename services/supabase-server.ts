import { createClient } from '@supabase/supabase-js';
import type { Database } from '../types_db';

const requireServerEnv = (key: string): string => {
  const value = process.env[key];
  if (!value) {
    throw new Error(`Missing required server env: ${key}`);
  }
  return value;
};

export const getSupabaseServer = () => {
  const supabaseUrl = requireServerEnv('SUPABASE_URL');
  const supabaseKey = process.env.SUPABASE_SERVICE_ROLE_KEY || process.env.SUPABASE_ANON_KEY;

  if (!supabaseKey) {
    throw new Error('Missing required server env: SUPABASE_SERVICE_ROLE_KEY or SUPABASE_ANON_KEY');
  }

  return createClient<Database>(supabaseUrl, supabaseKey, {
    auth: {
      persistSession: false,
      autoRefreshToken: false,
      detectSessionInUrl: false,
    },
  });
};
