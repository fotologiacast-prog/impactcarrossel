import assert from 'node:assert/strict';
import React from 'react';
import { renderToStaticMarkup } from 'react-dom/server';
import { SlideCanvas } from '../renderers/SlideCanvas.tsx';

const renderStackBoxMarkup = (
  imageLayout: 'IMAGE_STACK_BOX_TOP' | 'IMAGE_STACK_BOX_BOTTOM',
  format: 'png' | 'jpg' = 'jpg',
) => renderToStaticMarkup(
  React.createElement(SlideCanvas, {
    slide: {
      template: 'HERO',
      contentTemplate: 'HERO',
      imageLayout,
      image: {
        type: 'IMAGE_BOX',
        url: format === 'png' ? 'https://example.com/cutout.png' : 'https://example.com/photo.jpg',
        format,
        isCutout: format === 'png',
        position: imageLayout === 'IMAGE_STACK_BOX_TOP' ? 'top' : 'bottom',
      },
      blocks: [
        { type: 'TITLE', content: 'O problema não é o remédio' },
        { type: 'PARAGRAPH', content: 'Seu problema não é falta de remédio, é falta de diagnóstico da causa.' },
      ],
    } as any,
    index: 0,
    canvasRef: { current: null },
  }),
);

const topMarkup = renderStackBoxMarkup('IMAGE_STACK_BOX_TOP');
const bottomMarkup = renderStackBoxMarkup('IMAGE_STACK_BOX_BOTTOM');
const topPngMarkup = renderStackBoxMarkup('IMAGE_STACK_BOX_TOP', 'png');
const topOptimizedPhotoMarkup = renderToStaticMarkup(
  React.createElement(SlideCanvas, {
    slide: {
      template: 'HERO',
      contentTemplate: 'HERO',
      imageLayout: 'IMAGE_STACK_BOX_TOP',
      image: {
        type: 'IMAGE_BOX',
        url: 'data:image/webp;base64,optimized-photo-from-png-source',
        format: 'png',
        position: 'top',
      },
      blocks: [
        { type: 'TITLE', content: 'Foto normal não cobre o texto' },
        { type: 'PARAGRAPH', content: 'Ela deve ficar presa na box de imagem.' },
      ],
    } as any,
    index: 0,
    canvasRef: { current: null },
  }),
);
const stackBoxWithBoxMarkup = renderToStaticMarkup(
  React.createElement(SlideCanvas, {
    slide: {
      template: 'BOX_GRID',
      contentTemplate: 'BOX_GRID',
      imageLayout: 'IMAGE_STACK_BOX_TOP',
      image: {
        type: 'IMAGE_BOX',
        url: 'https://example.com/cutout.png',
        format: 'png',
        isCutout: true,
        position: 'top',
      },
      blocks: [
        {
          type: 'BOX',
          content: 'Seu problema não é falta de remédio, é falta de diagnóstico da causa.',
          options: {
            icon: 'ShieldAlert',
          },
        },
      ],
    } as any,
    index: 0,
    canvasRef: { current: null },
  }),
);

assert.match(topMarkup, /data-area-id="content-area"/);
assert.match(topMarkup, /data-area-justify="center"/);
assert.match(topMarkup, /data-area-align="center"/);
assert.match(topMarkup, /text-align:center/);
assert.match(bottomMarkup, /data-area-justify="center"/);
assert.match(bottomMarkup, /data-area-align="center"/);
assert.match(bottomMarkup, /text-align:center/);
assert.match(topMarkup, /data-image-cutout="false"/);
assert.match(topMarkup, /data-image-overflow="hidden"/);
assert.match(topPngMarkup, /data-image-fit="contain"/);
assert.match(topPngMarkup, /data-image-cutout="true"/);
assert.match(topPngMarkup, /data-image-overflow="visible"/);
assert.match(topOptimizedPhotoMarkup, /data-image-cutout="false"/);
assert.match(topOptimizedPhotoMarkup, /data-image-overflow="hidden"/);
assert.match(stackBoxWithBoxMarkup, /data-box-compact="true"/);

console.log('slide-canvas-stack-box.test.tsx passed');
