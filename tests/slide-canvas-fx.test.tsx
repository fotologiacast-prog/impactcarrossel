import assert from 'node:assert/strict';
import React from 'react';
import { renderToStaticMarkup } from 'react-dom/server';
import { SlideCanvas } from '../renderers/SlideCanvas.tsx';

const markup = renderToStaticMarkup(
  React.createElement(SlideCanvas, {
    slide: {
      template: 'HERO',
      contentTemplate: 'HERO',
      imageLayout: 'IMAGE_BACKGROUND',
      options: {
        postFX: {
          noiseAmount: 0.6,
          vignette: 0.7,
          lightingIntensity: 0.9,
          clarity: 0.8,
        },
      },
      image: {
        type: 'IMAGE_BACKGROUND',
        url: 'https://example.com/background.jpg',
      },
      blocks: [
        { type: 'TITLE', content: 'Título hero.' },
        { type: 'PARAGRAPH', content: 'Texto com leitura preservada.' },
      ],
    } as any,
    index: 0,
    canvasRef: { current: null },
  }),
);

assert.match(markup, /data-fx-vignette="true"/);
assert.match(markup, /data-fx-noise="true"/);
assert.match(markup, /data-fx-photoshop-noise="true"/);
assert.match(markup, /data-fx-noise-target-blend="linear-light"/);
assert.match(markup, /mix-blend-mode:hard-light/);
assert.match(markup, /opacity:0\.048/);
assert.match(markup, /background-size:256px 256px/);
assert.match(markup, /image-rendering:pixelated/);
assert.match(markup, /mix-blend-mode:multiply/);
assert.doesNotMatch(markup, /data-fx-paper-grain="true"/);
assert.doesNotMatch(markup, /data-fx-grain-lift="true"/);
assert.doesNotMatch(markup, /mix-blend-mode:soft-light/);
assert.doesNotMatch(markup, /data-fx-lighting="true"/);

console.log('slide-canvas-fx.test.tsx passed');
