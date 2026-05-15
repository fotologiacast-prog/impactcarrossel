import assert from 'node:assert/strict';
import { getCoverMainTitleSize } from '../utils/covers/cover-sizing.ts';

assert.equal(getCoverMainTitleSize('CRM'), 190);
assert.equal(getCoverMainTitleSize('Respire melhor'), 164);
assert.equal(getCoverMainTitleSize('Seu nariz entupido pode ser mais do que rinite'), 118);

console.log('cover-sizing.test.ts passed');
