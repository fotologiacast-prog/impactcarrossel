import assert from 'node:assert/strict';
import { carouselSchema } from '../template-dsl/schema.ts';

const parsed = carouselSchema.parse({
  brandTheme: {},
  slides: [
    {
      template: 'HERO',
      contentTemplate: 'HERO',
      imageLayout: 'IMAGE_NONE',
      blocks: [
        {
          type: 'TITLE',
          content: 'O [[destaque]] mudou.',
          options: {
            backgroundColor: '#ffffff',
            highlightBackgroundColor: '#111111',
          },
        },
      ],
    },
  ],
});

assert.equal(parsed.slides[0].blocks[0].options?.backgroundColor, '#ffffff');
assert.equal(parsed.slides[0].blocks[0].options?.highlightBackgroundColor, '#111111');

console.log('block-schema.test.ts passed');
