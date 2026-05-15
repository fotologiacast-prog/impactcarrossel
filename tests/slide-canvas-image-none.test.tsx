import assert from 'node:assert/strict';
import React from 'react';
import { renderToStaticMarkup } from 'react-dom/server';
import { SlideCanvas } from '../renderers/SlideCanvas.tsx';

const markup = renderToStaticMarkup(
  React.createElement(SlideCanvas, {
    slide: {
      template: 'HERO',
      contentTemplate: 'HERO',
      imageLayout: 'IMAGE_NONE',
      options: {
        backgroundImage: 'https://example.com/background.jpg',
      },
      image: {
        type: 'NONE',
        url: 'https://example.com/background.jpg',
      },
      blocks: [
        { type: 'TITLE', content: 'Slide sem imagem' },
      ],
    } as any,
    index: 0,
    canvasRef: { current: null },
  }),
);

const semanticMarkup = renderToStaticMarkup(
  React.createElement(SlideCanvas, {
    slide: {
      template: 'HERO',
      contentTemplate: 'HERO',
      imageLayout: 'IMAGE_NONE',
      options: {},
      blocks: [
        { type: 'PARAGRAPH', content: 'Uma marca consistente', options: { semanticRole: 'intro', fontSize: 34 } },
        { type: 'TITLE', content: 'Vende mais!', options: { semanticRole: 'headline', fontSize: 156 } },
        { type: 'PARAGRAPH', content: '[[Confiança reduz resistência à compra.]]', options: { semanticRole: 'highlight', fontSize: 34 } },
      ],
    } as any,
    index: 1,
    canvasRef: { current: null },
  }),
);

assert.doesNotMatch(markup, /https:\/\/example\.com\/background\.jpg/);
assert.match(markup, /items-center/);
assert.match(markup, /mx-auto text-center/);
assert.match(semanticMarkup, /gap:22px/);

console.log('slide-canvas-image-none.test.tsx passed');
