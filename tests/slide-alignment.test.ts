import assert from 'node:assert/strict';
import { alignBlocksForSlideLayout, buildSlideAlignmentUpdates } from '../utils/slide-alignment.ts';

const blocks = [
  { type: 'TITLE', content: 'Titulo', options: { align: 'left' as const } },
  { type: 'PARAGRAPH', content: 'Texto' },
  { type: 'BOX', content: 'Card', options: { textAlign: 'right' as const } },
  { type: 'USER', content: 'Perfil', options: { align: 'left' as const } },
] as const;

const aligned = alignBlocksForSlideLayout([...blocks], 'center');

assert.equal(aligned[0].options?.align, 'center');
assert.equal(aligned[0].options?.textAlign, 'center');
assert.equal(aligned[1].options?.align, 'center');
assert.equal(aligned[2].options?.align, 'center');
assert.equal(aligned[2].options?.textAlign, 'center');
assert.equal(aligned[3].options?.align, 'left');

const updates = buildSlideAlignmentUpdates('right', 'center', [...blocks]);

assert.deepEqual(updates.slice(0, 3), [
  { path: ['options', 'contentHorizontalAlign'], value: 'right' },
  { path: ['options', 'contentVerticalAlign'], value: 'center' },
  { path: ['options', 'boxGroupAlign'], value: 'right' },
]);
assert.equal(updates[3].path[0], 'blocks');
assert.equal(updates[3].value[0].options.align, 'right');

console.log('slide-alignment.test.ts passed');
