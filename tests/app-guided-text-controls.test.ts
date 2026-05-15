import assert from 'node:assert/strict';
import { readFileSync } from 'node:fs';

const source = readFileSync(new URL('../App.tsx', import.meta.url), 'utf8');

assert.match(source, /StepperNumberControl[\s\S]*label="Tamanho"[\s\S]*max=\{400\}[\s\S]*guided-block-\$\{guidedSelectedBlockIndex\}-font-size/);
assert.match(source, /TransformControl[\s\S]*label="Altura Linha"[\s\S]*guided-block-\$\{guidedSelectedBlockIndex\}-line-height[\s\S]*'options', 'lineHeight'/);
assert.doesNotMatch(source, /<p className="text-\[9px\][^>]*>Tamanho<\/p>\s*<input\s+type="range"[\s\S]*max=\{120\}/);

console.log('app-guided-text-controls.test.ts passed');
