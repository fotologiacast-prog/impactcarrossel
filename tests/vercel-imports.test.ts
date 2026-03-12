import assert from 'node:assert/strict';
import { readFileSync } from 'node:fs';

const files = [
  '/Users/fotologiavanassi/Documents/Impact Carrossel /api/branding.ts',
  '/Users/fotologiavanassi/Documents/Impact Carrossel /api/client/[id].ts',
  '/Users/fotologiavanassi/Documents/Impact Carrossel /utils/branding-api.ts',
  '/Users/fotologiavanassi/Documents/Impact Carrossel /services/supabase-server.ts',
];

for (const file of files) {
  const contents = readFileSync(file, 'utf8');
  assert.equal(
    /\.ts['"`]/.test(contents),
    false,
    `${file} still contains a runtime import ending with .ts, which breaks Vercel serverless output.`,
  );
}

const apiFiles = [
  '/Users/fotologiavanassi/Documents/Impact Carrossel /api/branding.ts',
  '/Users/fotologiavanassi/Documents/Impact Carrossel /api/client/[id].ts',
];

for (const file of apiFiles) {
  const contents = readFileSync(file, 'utf8');
  assert.equal(
    /await import\(/.test(contents),
    false,
    `${file} still contains a dynamic import, which Vercel may fail to bundle for serverless functions.`,
  );
}

console.log('vercel-imports.test.ts passed');
