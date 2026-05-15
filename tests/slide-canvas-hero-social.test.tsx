import assert from 'node:assert/strict';
import React from 'react';
import { renderToStaticMarkup } from 'react-dom/server';
import { SlideCanvas } from '../renderers/SlideCanvas.tsx';

const heroSocialMarkup = renderToStaticMarkup(
  React.createElement(SlideCanvas, {
    slide: {
      template: 'HERO',
      contentTemplate: 'HERO',
      imageLayout: 'IMAGE_NONE',
      options: {
        heroVariant: 'social',
      },
      image: {
        type: 'NONE',
      },
      blocks: [
        {
          type: 'USER',
          content: 'Nome do profissional',
          options: {
            variant: 'twitter-post',
            handle: '@instagram',
            avatar: 'https://example.com/profile.jpg',
          },
        },
        {
          type: 'TITLE',
          content: 'Faço [[bastante]] **diagnóstico**.',
          options: {
            color: '#00adef',
            fontSize: 160,
            textAlign: 'center',
          },
        },
        {
          type: 'PARAGRAPH',
          content: '[[Texto de apoio social.]]',
          options: {
            semanticRole: 'highlight',
            backgroundColor: '#00adef',
            color: '#ffffff',
            fontSize: 72,
          },
        },
        {
          type: 'BADGE',
          content: 'Badge colorido vira texto corrido.',
          options: {
            backgroundColor: '#00adef',
            color: '#ffffff',
          },
        },
      ],
    } as any,
    index: 0,
    canvasRef: { current: null },
  }),
);

assert.match(heroSocialMarkup, /data-hero-variant="social"/);
assert.match(heroSocialMarkup, /data-user-variant="twitter-post"/);
assert.match(heroSocialMarkup, /mx-auto text-left/);
assert.match(heroSocialMarkup, /max-w-\[840px\]/);
assert.match(heroSocialMarkup, /rounded-\[44px\] p-20/);
assert.match(heroSocialMarkup, /background-color:#FFFFFF/);
assert.match(heroSocialMarkup, /border:1px solid rgba\(20,20,20,0\.08\)/);
assert.match(heroSocialMarkup, /Faço bastante diagnóstico\./);
assert.match(heroSocialMarkup, /Texto de apoio social\./);
assert.match(heroSocialMarkup, /Badge colorido vira texto corrido\./);
assert.doesNotMatch(heroSocialMarkup, /bg-white\/5/);
assert.doesNotMatch(heroSocialMarkup, /mx-auto text-center/);
assert.doesNotMatch(heroSocialMarkup, /\[\[|\]\]|\*\*/);
assert.doesNotMatch(heroSocialMarkup, /data-paragraph-highlight-stack/);
assert.doesNotMatch(heroSocialMarkup, /font-size:160px/);
assert.doesNotMatch(heroSocialMarkup, /font-size:72px/);
assert.doesNotMatch(heroSocialMarkup, /background-color:#00adef/);

console.log('slide-canvas-hero-social.test.tsx passed');
