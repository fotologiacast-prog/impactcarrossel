import assert from 'node:assert/strict';
import { readFileSync } from 'node:fs';

const source = readFileSync(new URL('../App.tsx', import.meta.url), 'utf8');

assert.match(source, /const renderGuidedFontField = \(/);
assert.match(source, /allFontOptions\.map\(\(font\) => \(/);
assert.match(source, /renderGuidedFontField\('Fonte padrão', currentBrandTheme\.fontPadrão \|\| 'Inter'[\s\S]*\['brandTheme', 'fontPadrão'\]/);
assert.match(source, /renderGuidedFontField\('Fonte destaque', currentBrandTheme\.fontDestaque \|\| currentBrandTheme\.fontPadrão \|\| 'Instrument Serif'[\s\S]*\['brandTheme', 'fontDestaque'\]/);
assert.match(source, /guided-step-font-primary/);
assert.match(source, /guided-step-font-display/);

console.log('app-guided-font-controls.test.ts passed');
