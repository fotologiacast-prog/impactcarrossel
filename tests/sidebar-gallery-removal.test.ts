import assert from 'node:assert/strict';
import { readFileSync } from 'node:fs';
import { resolve } from 'node:path';

const appSource = readFileSync(resolve(process.cwd(), 'App.tsx'), 'utf8');

assert.doesNotMatch(appSource, /Abrir Galeria de Conteúdo/);
assert.doesNotMatch(appSource, /showTemplateCurationModal/);
assert.doesNotMatch(appSource, /TemplateCurationGallery/);

console.log('sidebar-gallery-removal.test.ts passed');
