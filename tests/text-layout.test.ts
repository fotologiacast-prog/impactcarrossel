import assert from 'node:assert/strict';
import { applyWidowProtection, formatTextForRender, resolveLineBreakMode } from '../utils/text-layout.ts';

assert.equal(
  applyWidowProtection('O tratamento começa com'),
  'O tratamento começa\u00A0com',
);

assert.equal(
  applyWidowProtection('Linha um\nLinha dois final'),
  'Linha\u00A0um\nLinha dois\u00A0final',
);

assert.equal(
  applyWidowProtection('Palavra'),
  'Palavra',
);

assert.equal(
  applyWidowProtection('Seu [[corpo]] avisa'),
  'Seu [[corpo]]\u00A0avisa',
);

assert.equal(resolveLineBreakMode(undefined), 'auto');
assert.equal(resolveLineBreakMode('manual'), 'manual');
assert.equal(formatTextForRender('Seu corpo avisa', 'auto'), 'Seu corpo\u00A0avisa');
assert.equal(formatTextForRender('Seu corpo\navisa', 'manual'), 'Seu corpo\navisa');

console.log('text-layout.test.ts passed');
