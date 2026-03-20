import assert from 'node:assert/strict';
import { applyWidowProtection, balanceTitleLineBreak, formatTextForRender, resolveLineBreakMode } from '../utils/text-layout.ts';

assert.equal(
  applyWidowProtection('O tratamento começa com'),
  'O tratamento começa\u00A0com',
);

assert.equal(
  applyWidowProtection('Linha um\nLinha dois final'),
  'Linha\u00A0um\nLinha dois final',
);

assert.equal(
  applyWidowProtection('Muita gente vai adiando'),
  'Muita gente vai adiando',
);

assert.equal(
  applyWidowProtection('Palavra'),
  'Palavra',
);

assert.equal(
  applyWidowProtection('Seu [[corpo]] avisa'),
  'Seu [[corpo]] avisa',
);

assert.equal(
  balanceTitleLineBreak('Muita gente vai adiando'),
  'Muita gente\nvai adiando',
);

assert.equal(resolveLineBreakMode(undefined), 'auto');
assert.equal(resolveLineBreakMode('manual'), 'manual');
assert.equal(formatTextForRender('Seu corpo avisa', 'auto', 'PARAGRAPH'), 'Seu corpo avisa');
assert.equal(formatTextForRender('Muita gente vai adiando', 'auto', 'TITLE'), 'Muita gente\nvai adiando');
assert.equal(formatTextForRender('Seu corpo\navisa', 'manual'), 'Seu corpo\navisa');

console.log('text-layout.test.ts passed');
