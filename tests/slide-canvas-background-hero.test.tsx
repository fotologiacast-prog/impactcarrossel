import assert from 'node:assert/strict';
import React from 'react';
import { renderToStaticMarkup } from 'react-dom/server';
import { SlideCanvas } from '../renderers/SlideCanvas.tsx';

const backgroundHeroMarkup = renderToStaticMarkup(
  React.createElement(SlideCanvas, {
    slide: {
      template: 'HERO',
      contentTemplate: 'HERO',
      imageLayout: 'IMAGE_BACKGROUND',
      options: {
        accent: '#EAB308',
        backgroundBlur: 12,
      },
      image: {
        type: 'IMAGE_BACKGROUND',
        url: 'https://example.com/hero-bg.jpg',
        overlay: 'dark',
      },
      blocks: [
        { type: 'TITLE', content: 'Nunca ignore a sua dor.' },
        { type: 'PARAGRAPH', content: 'Texto de apoio para validar a ilha de leitura do hero com background.' },
      ],
    } as any,
    index: 0,
    canvasRef: { current: null },
  }),
);

const backgroundHeroMinimumMarkup = renderToStaticMarkup(
  React.createElement(SlideCanvas, {
    slide: {
      template: 'HERO',
      contentTemplate: 'HERO',
      imageLayout: 'IMAGE_BACKGROUND',
      options: {
        accent: '#EAB308',
        backgroundOverlayStrength: 0,
      },
      image: {
        type: 'IMAGE_BACKGROUND',
        url: 'https://example.com/hero-bg.jpg',
        overlay: 'dark',
      },
      blocks: [
        { type: 'TITLE', content: 'Imagem precisa aparecer.' },
        { type: 'PARAGRAPH', content: 'No mínimo, o background não pode virar uma placa preta.' },
      ],
    } as any,
    index: 1,
    canvasRef: { current: null },
  }),
);

const backgroundChecklistMinimumMarkup = renderToStaticMarkup(
  React.createElement(SlideCanvas, {
    slide: {
      template: 'CHECKLIST',
      contentTemplate: 'CHECKLIST',
      imageLayout: 'IMAGE_BACKGROUND',
      options: {
        accent: '#EAB308',
        backgroundOverlayStrength: 0,
      },
      image: {
        type: 'IMAGE_BACKGROUND',
        url: 'https://example.com/checklist-bg.jpg',
        overlay: 'dark',
      },
      blocks: [
        { type: 'TITLE', content: 'Checklist com foto visivel.' },
        { type: 'BOX', content: 'item um' },
        { type: 'BOX', content: 'item dois' },
      ],
    } as any,
    index: 2,
    canvasRef: { current: null },
  }),
);

assert.match(backgroundHeroMarkup, /data-hero-variant="default"/);
assert.match(backgroundHeroMarkup, /data-background-image-grade="true"/);
assert.match(backgroundHeroMarkup, /data-background-reading-veil="true"/);
assert.match(backgroundHeroMarkup, /linear-gradient\(180deg/);
assert.match(backgroundHeroMarkup, /rgba\(20, 20, 20, 0\.249\) 0%/);
assert.match(backgroundHeroMarkup, /backdrop-filter:saturate\(1\.08\) contrast\(1\.12\) brightness\(0\.96\)/);
assert.doesNotMatch(backgroundHeroMarkup, /rgba\(20, 20, 20, 0\.868\) 0%/);
assert.doesNotMatch(backgroundHeroMinimumMarkup, /bg-black\/60/);
assert.doesNotMatch(backgroundChecklistMinimumMarkup, /background-color:rgba\(0,0,0,0\.34\)/);
assert.doesNotMatch(backgroundChecklistMinimumMarkup, /bg-black\/60/);
assert.match(backgroundHeroMinimumMarkup, /rgba\(20, 20, 20, 0\.14\) 0%/);
assert.match(backgroundHeroMinimumMarkup, /rgba\(20, 20, 20, 0\.24\) 100%/);
assert.doesNotMatch(backgroundHeroMinimumMarkup, /rgba\(20, 20, 20, 0\.74\) 0%/);
assert.doesNotMatch(backgroundHeroMinimumMarkup, /rgba\(20, 20, 20, 0\.84\) 100%/);
assert.doesNotMatch(backgroundHeroMarkup, /data-background-accent-glow=/);

console.log('slide-canvas-background-hero.test.tsx passed');
