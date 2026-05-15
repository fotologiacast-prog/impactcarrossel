import assert from 'node:assert/strict';
import { readFileSync } from 'node:fs';

const source = readFileSync(new URL('../App.tsx', import.meta.url), 'utf8');

assert.match(source, /<p className="text-\[9px\] font-black uppercase tracking-\[0\.18em\] text-zinc-500">Estilo da fonte<\/p>/);
assert.match(source, /selectedGuidedBlock\.options\?\.fontVariant \|\| \(selectedGuidedBlock\.type === 'TITLE' \? 'destaque' : 'padrão'\)/);
assert.match(source, /\['blocks', guidedSelectedBlockIndex, 'options', 'fontVariant'\]/);
assert.match(source, /<p className="text-\[9px\] font-black uppercase tracking-\[0\.18em\] text-zinc-500">Fonte<\/p>/);
assert.match(source, /selectedGuidedBlock\.options\?\.fontFamily \|\| ''/);
assert.match(source, /\['blocks', guidedSelectedBlockIndex, 'options', 'fontFamily'\], event\.target\.value \|\| undefined/);
assert.match(source, /Usar estilo selecionado/);
assert.match(source, /allFontOptions\.map\(\(font\) => \(/);

console.log('app-guided-block-font-controls.test.ts passed');
