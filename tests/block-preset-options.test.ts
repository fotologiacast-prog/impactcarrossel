import assert from 'node:assert/strict';
import {
  buildNewBlockOptions,
  createDefaultBlockForType,
} from '../utils/block-preset-options.ts';

const options = buildNewBlockOptions();

assert.deepEqual(
  options.map((option) => option.type),
  ['TITLE', 'PARAGRAPH', 'LIST', 'BOX', 'CARD', 'BADGE', 'USER'],
);

assert.equal(options.find((option) => option.type === 'TITLE')?.label, 'Título');
assert.equal(options.find((option) => option.type === 'LIST')?.label, 'Lista');

const titleBlock = createDefaultBlockForType('TITLE');
assert.equal(titleBlock.type, 'TITLE');
assert.equal(titleBlock.content, 'Novo título');

const paragraphBlock = createDefaultBlockForType('PARAGRAPH');
assert.equal(paragraphBlock.type, 'PARAGRAPH');
assert.equal(paragraphBlock.content, 'Novo parágrafo...');

const listBlock = createDefaultBlockForType('LIST');
assert.equal(listBlock.type, 'LIST');
assert.deepEqual(listBlock.content, ['Novo item']);

const userBlock = createDefaultBlockForType('USER', {
  displayName: 'Dra. Ana',
  handle: '@draana',
  avatar: 'https://example.com/avatar.jpg',
});
assert.equal(userBlock.type, 'USER');
assert.equal(userBlock.content, 'Dra. Ana');
assert.equal(userBlock.options?.handle, '@draana');
assert.equal(userBlock.options?.avatar, 'https://example.com/avatar.jpg');

console.log('block-preset-options.test.ts passed');
