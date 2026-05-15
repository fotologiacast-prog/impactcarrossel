import assert from 'node:assert/strict';
import { hydrateServerEnv } from '../utils/server-env.ts';

const loadedByVite = {
  VITE_SUPABASE_URL: 'https://local-project.supabase.co',
  VITE_SUPABASE_ANON_KEY: 'local-anon',
  SUPABASE_URL: 'https://local-project.supabase.co',
  SUPABASE_SERVICE_ROLE_KEY: 'local-service-role',
};

const emptyEnv: Record<string, string | undefined> = {};
const hydratedEnv = hydrateServerEnv('development', '/tmp/fake-project', emptyEnv, () => loadedByVite);

assert.equal(hydratedEnv.VITE_SUPABASE_URL, 'https://local-project.supabase.co');
assert.equal(hydratedEnv.VITE_SUPABASE_ANON_KEY, 'local-anon');
assert.equal(hydratedEnv.SUPABASE_URL, 'https://local-project.supabase.co');
assert.equal(hydratedEnv.SUPABASE_SERVICE_ROLE_KEY, 'local-service-role');

const existingEnv: Record<string, string | undefined> = {
  VITE_SUPABASE_URL: 'https://remote-env.supabase.co',
  SUPABASE_SERVICE_ROLE_KEY: 'remote-service-role',
};
const preservedEnv = hydrateServerEnv('development', '/tmp/fake-project', existingEnv, () => loadedByVite);

assert.equal(preservedEnv.VITE_SUPABASE_URL, 'https://remote-env.supabase.co');
assert.equal(preservedEnv.SUPABASE_SERVICE_ROLE_KEY, 'remote-service-role');
assert.equal(preservedEnv.VITE_SUPABASE_ANON_KEY, 'local-anon');
assert.equal(preservedEnv.SUPABASE_URL, 'https://local-project.supabase.co');

console.log('server-env.test.ts passed');
