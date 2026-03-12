import assert from 'node:assert/strict';
import { readFileSync } from 'node:fs';
import path from 'node:path';
import { fileURLToPath } from 'node:url';

const testDir = path.dirname(fileURLToPath(import.meta.url));

const files = [
  '../api/branding.ts',
  '../api/client/[id].ts',
  '../utils/branding-api.ts',
  '../services/supabase-server.ts',
];

for (const file of files) {
  const contents = readFileSync(path.resolve(testDir, file), 'utf8');
  assert.equal(
    /\.ts['"`]/.test(contents),
    false,
    `${file} still contains a runtime import ending with .ts, which breaks Vercel serverless output.`,
  );
}

const apiFiles = [
  '../api/branding.ts',
  '../api/client/[id].ts',
];

for (const file of apiFiles) {
  const contents = readFileSync(path.resolve(testDir, file), 'utf8');
  assert.equal(
    /await import\(/.test(contents),
    false,
    `${file} still contains a dynamic import, which Vercel may fail to bundle for serverless functions.`,
  );
}

console.log('vercel-imports.test.ts passed');
