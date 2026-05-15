import assert from 'node:assert/strict';
import { readFileSync } from 'node:fs';

const source = readFileSync(new URL('../App.tsx', import.meta.url), 'utf8');

assert.match(
  source,
  /<input type="file" ref=\{imageInputRef\} onChange=\{handleImageUpload\} accept="image\/\*" className="hidden" \/>/,
);
assert.match(
  source,
  /<button onClick=\{\(\) => imageInputRef\.current\?\.click\(\)\}[^>]*>\s*Adicionar imagem\s*<\/button>/,
);

console.log('app-guided-image-upload.test.ts passed');
