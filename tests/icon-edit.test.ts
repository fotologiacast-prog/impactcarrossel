import assert from 'node:assert/strict';
import { carouselSchema } from '../template-dsl/schema.ts';
import { buildIconEditUpdates, resolveIconEditSelection, type IconEditTarget } from '../utils/icon-edit.ts';
import type { Block } from '../types.ts';

const listBlock: Block = {
  type: 'LIST',
  content: ['Genetica', 'Hormonal'],
  options: {
    variant: 'check-list',
    itemIcons: ['Dna', 'Scale'],
    itemCustomIcons: ['', 'data:image/png;base64,abc'],
  },
};

const parsed = carouselSchema.parse({
  slides: [
    {
      template: 'CHECKLIST',
      blocks: [listBlock],
    },
  ],
});

assert.deepEqual(parsed.slides[0]?.blocks[0]?.options?.itemIcons, ['Dna', 'Scale']);
assert.deepEqual(parsed.slides[0]?.blocks[0]?.options?.itemCustomIcons, ['', 'data:image/png;base64,abc']);

const itemTarget: IconEditTarget = {
  block: listBlock,
  blockIndex: 0,
  itemIndex: 1,
};

assert.deepEqual(resolveIconEditSelection(itemTarget), {
  icon: 'Scale',
  customIcon: 'data:image/png;base64,abc',
});

assert.deepEqual(
  buildIconEditUpdates(itemTarget, { icon: 'Baby', customIcon: undefined }),
  [
    { path: ['blocks', 0, 'options', 'itemIcons'], value: ['Dna', 'Baby'] },
    { path: ['blocks', 0, 'options', 'itemCustomIcons'], value: undefined },
  ],
);

const badgeTarget: IconEditTarget = {
  block: {
    type: 'BADGE',
    content: 'Agende agora',
    options: {
      icon: 'Calendar',
    },
  },
  blockIndex: 2,
};

assert.deepEqual(resolveIconEditSelection(badgeTarget), {
  icon: 'Calendar',
  customIcon: '',
});

assert.deepEqual(
  buildIconEditUpdates(badgeTarget, { customIcon: 'https://example.com/icon.png', icon: undefined }),
  [
    { path: ['blocks', 2, 'options', 'icon'], value: undefined },
    { path: ['blocks', 2, 'options', 'customIcon'], value: 'https://example.com/icon.png' },
  ],
);

console.log('icon-edit.test.ts passed');
