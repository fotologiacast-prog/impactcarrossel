import assert from 'node:assert/strict';
import { applyWidowProtection } from '../utils/text-layout.ts';

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

console.log('text-layout.test.ts passed');
