import assert from 'node:assert/strict';
import { applyHeroVariantToSlide } from '../utils/hero-social.ts';
import type { SlideDefinition } from '../types';

const baseHeroSlide: SlideDefinition = {
  template: 'HERO',
  contentTemplate: 'HERO',
  imageLayout: 'IMAGE_NONE',
  image: {
    type: 'NONE',
  },
  blocks: [
    {
      type: 'TITLE',
      content: 'Sua saúde merece atenção',
      options: {
        align: 'center',
      },
    },
    {
      type: 'PARAGRAPH',
      content: 'Entenda os sinais e saiba quando procurar ajuda.',
      options: {
        align: 'center',
      },
    },
    {
      type: 'BADGE',
      content: 'Agende sua avaliação',
      options: {
        align: 'center',
        variant: 'pill',
      },
    },
  ],
};

const socialSlide = applyHeroVariantToSlide(
  baseHeroSlide,
  'social',
  {
    id: 'client-1',
    name: 'Dra. Camila',
    instagram: 'dracamila',
    profilePicture: 'https://example.com/profile.jpg',
  },
);

assert.equal(socialSlide.options?.heroVariant, 'social');
assert.equal(socialSlide.blocks[0]?.type, 'USER');
assert.equal(socialSlide.blocks[0]?.content, 'Dra. Camila');
assert.equal(socialSlide.blocks[0]?.options?.handle, '@dracamila');
assert.equal(socialSlide.blocks[0]?.options?.avatar, 'https://example.com/profile.jpg');
assert.equal(socialSlide.blocks[0]?.options?.variant, 'twitter-post');

const socialSlideAppliedTwice = applyHeroVariantToSlide(
  socialSlide,
  'social',
  {
    id: 'client-1',
    name: 'Dra. Camila',
    instagram: 'dracamila',
    profilePicture: 'https://example.com/profile.jpg',
  },
);

assert.equal(
  socialSlideAppliedTwice.blocks.filter((block) => block.type === 'USER' && block.options?.variant === 'twitter-post').length,
  1,
);

const revertedHeroSlide = applyHeroVariantToSlide(socialSlideAppliedTwice, 'default');

assert.equal(revertedHeroSlide.options?.heroVariant, undefined);
assert.equal(
  revertedHeroSlide.blocks.some((block) => block.type === 'USER' && block.options?.variant === 'twitter-post'),
  false,
);
assert.deepEqual(
  revertedHeroSlide.blocks.map((block) => block.type),
  ['TITLE', 'PARAGRAPH', 'BADGE'],
);

console.log('hero-social-variant.test.ts passed');
