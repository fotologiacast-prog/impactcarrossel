import assert from 'node:assert/strict';
import React from 'react';
import { renderToStaticMarkup } from 'react-dom/server';
import { SlideCanvas } from '../renderers/SlideCanvas.tsx';

const glassBottomMarkup = renderToStaticMarkup(
  React.createElement(SlideCanvas, {
    slide: {
      template: 'HERO',
      contentTemplate: 'HERO',
      imageLayout: 'IMAGE_GLASS_BOTTOM',
      options: {
        accent: '#41A8F5',
        backgroundOverlayStrength: 0.2,
        backgroundBlur: 7,
      },
      image: {
        type: 'IMAGE_GLASS_CARD',
        url: 'https://example.com/hero.jpg',
        position: 'bottom',
        boxOverlay: 'dark',
      },
      blocks: [
        { type: 'TITLE', content: 'Se a dor persiste' },
        { type: 'PARAGRAPH', content: 'mesmo com exames normais...' },
      ],
    } as any,
    index: 0,
    canvasRef: { current: null },
  }),
);

assert.match(glassBottomMarkup, /data-glass-layout="bottom"/);
assert.match(glassBottomMarkup, /data-glass-frame="true"/);
assert.match(glassBottomMarkup, /data-glass-style="liquid"/);
assert.match(glassBottomMarkup, /data-glass-clip="true"/);
assert.match(glassBottomMarkup, /data-glass-backdrop-host="true"/);
assert.match(glassBottomMarkup, /data-glass-materialized-blur="true"/);
assert.match(glassBottomMarkup, /data-glass-backdrop-surface="true"/);
assert.match(glassBottomMarkup, /data-glass-surface-strength="0\.2"/);
assert.match(glassBottomMarkup, /data-glass-surface-blur="7"/);
assert.match(glassBottomMarkup, /data-glass-computed-blur="22"/);
assert.match(glassBottomMarkup, /clip-path:inset\(0 round 58px\)/);
assert.match(glassBottomMarkup, /contain:paint/);
assert.match(glassBottomMarkup, /items-end/);
assert.match(glassBottomMarkup, /pb-28/);
assert.match(glassBottomMarkup, /blur\(22px\) saturate\(180%\)/);
assert.match(glassBottomMarkup, /background-color:rgba\(255,255,255,0\.01\)/);
assert.match(glassBottomMarkup, /saturate\(180%\)/);
assert.match(glassBottomMarkup, /rgba\(10,14,22,0\.58\) 44%/);
assert.match(glassBottomMarkup, /rgba\(10,14,22,0\.476\) 100%/);
assert.doesNotMatch(glassBottomMarkup, /rgba\(10,14,22,0\.44\) 44%/);
assert.doesNotMatch(glassBottomMarkup, /rgba\(10,14,22,0\.36\) 100%/);
assert.match(glassBottomMarkup, /border:1px solid rgba\(255,255,255,0\.2\)/);
assert.match(glassBottomMarkup, /inset 0 1px 0 rgba\(255,255,255,0\.38\)/);
assert.doesNotMatch(glassBottomMarkup, /65, 168, 245/);

console.log('slide-canvas-glass-bottom.test.tsx passed');
