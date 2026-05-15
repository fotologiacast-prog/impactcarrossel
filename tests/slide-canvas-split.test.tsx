import assert from 'node:assert/strict';
import React from 'react';
import { renderToStaticMarkup } from 'react-dom/server';
import { SlideCanvas } from '../renderers/SlideCanvas.tsx';

const makeSlide = (imageLayout: 'IMAGE_SPLIT_RIGHT' | 'IMAGE_SPLIT_LEFT' | 'IMAGE_SPLIT_TOP') => ({
  template: 'HERO',
  contentTemplate: 'HERO',
  imageLayout,
  options: {
    background: '#e5ddd2',
    text: '#3a352f',
    accent: '#a28767',
  },
  image: {
    type: 'IMAGE_SPLIT_HALF',
    url: 'https://example.com/image.jpg',
    position:
      imageLayout === 'IMAGE_SPLIT_RIGHT' ? 'right'
      : imageLayout === 'IMAGE_SPLIT_LEFT' ? 'left'
      : 'top',
  },
  blocks: [
    { type: 'TITLE', content: 'BENEFÍCIO REAL', options: { fontSize: 54 } },
    { type: 'PARAGRAPH', content: 'Precisão evita erro e protege o profissional.', options: { fontSize: 29 } },
  ],
});

const splitRightMarkup = renderToStaticMarkup(
  React.createElement(SlideCanvas, {
    slide: makeSlide('IMAGE_SPLIT_RIGHT') as any,
    index: 0,
    canvasRef: { current: null },
  }),
);

const splitLeftMarkup = renderToStaticMarkup(
  React.createElement(SlideCanvas, {
    slide: makeSlide('IMAGE_SPLIT_LEFT') as any,
    index: 0,
    canvasRef: { current: null },
  }),
);

const splitTopMarkup = renderToStaticMarkup(
  React.createElement(SlideCanvas, {
    slide: makeSlide('IMAGE_SPLIT_TOP') as any,
    index: 0,
    canvasRef: { current: null },
  }),
);

const splitCutoutMarkup = renderToStaticMarkup(
  React.createElement(SlideCanvas, {
    slide: {
      ...makeSlide('IMAGE_SPLIT_RIGHT'),
      image: {
        type: 'IMAGE_SPLIT_HALF',
        url: 'https://example.com/cutout.png',
        format: 'png',
        isCutout: true,
        position: 'right',
      },
    } as any,
    index: 0,
    canvasRef: { current: null },
  }),
);

const splitBoxGridMarkup = renderToStaticMarkup(
  React.createElement(SlideCanvas, {
    slide: {
      template: 'BOX_GRID',
      contentTemplate: 'BOX_GRID',
      imageLayout: 'IMAGE_SPLIT_LEFT',
      image: {
        type: 'IMAGE_SPLIT_HALF',
        url: 'https://example.com/image.jpg',
        position: 'left',
      },
      blocks: [
        { type: 'TITLE', content: 'Azul & Branco Escultural', options: { fontSize: 84 } },
        { type: 'PARAGRAPH', content: 'Elegância que impressiona', options: { fontSize: 36 } },
        { type: 'BOX', content: 'Composição simétrica', options: { fontSize: 36, icon: 'BarChart3', variant: 'box' } },
        { type: 'BOX', content: 'Flores em abundância', options: { fontSize: 36, icon: 'Brain', variant: 'box' } },
        { type: 'BOX', content: 'Tons frios sofisticados', options: { fontSize: 36, icon: 'Disc3', variant: 'box' } },
        { type: 'BOX', content: 'Cenário arquitetônico', options: { fontSize: 36, icon: 'Disc3', variant: 'box' } },
      ],
    } as any,
    index: 0,
    canvasRef: { current: null },
  }),
);

const splitBoxGridLargeMarkup = renderToStaticMarkup(
  React.createElement(SlideCanvas, {
    slide: {
      template: 'BOX_GRID',
      contentTemplate: 'BOX_GRID',
      imageLayout: 'IMAGE_SPLIT_LEFT',
      image: {
        type: 'IMAGE_SPLIT_HALF',
        url: 'https://example.com/image.jpg',
        position: 'left',
      },
      blocks: [
        { type: 'TITLE', content: 'Azul & Branco Escultural', options: { fontSize: 84 } },
        { type: 'PARAGRAPH', content: 'Elegância que impressiona', options: { fontSize: 36 } },
        { type: 'BOX', content: 'Composição simétrica', options: { fontSize: 44, icon: 'BarChart3', variant: 'box' } },
        { type: 'BOX', content: 'Flores em abundância', options: { fontSize: 44, icon: 'Brain', variant: 'box' } },
        { type: 'BOX', content: 'Tons frios sofisticados', options: { fontSize: 44, icon: 'Disc3', variant: 'box' } },
        { type: 'BOX', content: 'Cenário arquitetônico', options: { fontSize: 44, icon: 'Disc3', variant: 'box' } },
      ],
    } as any,
    index: 0,
    canvasRef: { current: null },
  }),
);

const splitBoxGridBalancedMarkup = renderToStaticMarkup(
  React.createElement(SlideCanvas, {
    slide: {
      template: 'BOX_GRID',
      contentTemplate: 'BOX_GRID',
      imageLayout: 'IMAGE_SPLIT_LEFT',
      image: {
        type: 'IMAGE_SPLIT_HALF',
        url: 'https://example.com/image.jpg',
        position: 'left',
      },
      blocks: [
        { type: 'TITLE', content: 'Verde & Luz Cênica', options: { fontSize: 84 } },
        { type: 'PARAGRAPH', content: 'Atmosfera que se sente', options: { fontSize: 36 } },
        { type: 'BOX', content: 'Folhagens pendentes', options: { fontSize: 36, icon: 'Smile', variant: 'box' } },
        { type: 'BOX', content: 'Luz quente dramática', options: { fontSize: 36, icon: 'CircleDot', variant: 'box' } },
        { type: 'BOX', content: 'Contraste sofisticado', options: { fontSize: 36, icon: 'Disc3', variant: 'box' } },
        { type: 'BOX', content: 'Ambiente arquitetônico imersivo', options: { fontSize: 36, icon: 'Disc3', variant: 'box' } },
      ],
    } as any,
    index: 0,
    canvasRef: { current: null },
  }),
);

assert.doesNotMatch(splitRightMarkup, /data-split-glass-transition="true"/);
assert.doesNotMatch(splitLeftMarkup, /data-split-glass-transition="true"/);
assert.doesNotMatch(splitTopMarkup, /data-split-glass-transition="true"/);
assert.match(splitCutoutMarkup, /data-image-cutout="true"/);
assert.match(splitCutoutMarkup, /data-image-rendering="cutout-free"/);
assert.match(splitCutoutMarkup, /bg-transparent border-0/);
assert.doesNotMatch(splitCutoutMarkup, /bg-zinc-900 border-x/);
assert.equal((splitBoxGridMarkup.match(/data-box-compact="true"/g) || []).length, 4);
assert.equal((splitBoxGridMarkup.match(/data-box-micro-card="true"/g) || []).length, 0);
assert.doesNotMatch(splitBoxGridMarkup, /grid grid-cols-2/);
assert.match(splitBoxGridMarkup, /font-size:36px/);
assert.match(splitBoxGridMarkup, /padding:20px 14px/);
assert.match(splitBoxGridMarkup, /Composição\nsimétrica/);
assert.match(splitBoxGridLargeMarkup, /font-size:44px/);
assert.equal((splitBoxGridBalancedMarkup.match(/font-size:36px/g) || []).length, 5);

console.log('slide-canvas-split.test.tsx passed');
