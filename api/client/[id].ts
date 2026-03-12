import { createClient } from '@supabase/supabase-js';

const requireServerEnv = (key: string) => {
  const value = process.env[key];
  if (!value) {
    throw new Error(`Missing required server env: ${key}`);
  }
  return value;
};

const getSupabaseServer = () => {
  const supabaseUrl = requireServerEnv('SUPABASE_URL');
  const supabaseKey = process.env.SUPABASE_SERVICE_ROLE_KEY || process.env.SUPABASE_ANON_KEY;

  if (!supabaseKey) {
    throw new Error('Missing required server env: SUPABASE_SERVICE_ROLE_KEY or SUPABASE_ANON_KEY');
  }

  return createClient(supabaseUrl, supabaseKey, {
    auth: {
      persistSession: false,
      autoRefreshToken: false,
      detectSessionInUrl: false,
    },
  });
};

const serializeError = (error: unknown) => {
  if (error instanceof Error) {
    return {
      message: error.message,
      name: error.name,
      stack: error.stack,
    };
  }

  return {
    message: typeof error === 'string' ? error : 'Unknown serverless error',
    value: error,
  };
};

export default async function handler(req: any, res: any) {
  try {
    const supabase = getSupabaseServer();
    const { data: client, error } = await supabase
      .from('clients')
      .select('id, name, profile_picture, instagram')
      .eq('id', String(req.query.id || ''))
      .single();

    if (error) throw error;

    res.status(200).json({
      id: client.id,
      name: client.name,
      profile_picture: client.profile_picture,
      instagram: client.instagram,
    });
  } catch (error: any) {
    console.error('Client API Error:', error);
    res.status(500).json({
      error: error?.message || 'Internal Server Error',
      details: serializeError(error),
    });
  }
}
