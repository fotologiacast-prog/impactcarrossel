import assert from 'node:assert/strict';
import React from 'react';
import { renderToStaticMarkup } from 'react-dom/server';
import { SlideCanvas } from '../renderers/SlideCanvas.tsx';

const fadeMarkup = renderToStaticMarkup(
  React.createElement(SlideCanvas, {
    slide: {
      template: 'HERO',
      contentTemplate: 'HERO',
      imageLayout: 'IMAGE_FADE_RIGHT',
      options: {
        fadeSide: 'right',
        fadeStrength: 1,
        fadeBlur: 10,
        accent: '#EAB308',
        text: '#777777',
      },
      image: {
        type: 'IMAGE_BACKGROUND',
        url: 'https://example.com/hero.jpg',
        position: 'right',
        overlay: 'dark',
        naturalWidth: 1920,
        naturalHeight: 1080,
        imageX: 120,
        imageY: -40,
        imageScale: 1.2,
        imageRotation: 12,
      },
      blocks: [
        { type: 'TITLE', content: 'Existe [[solução]], sim.' },
        { type: 'PARAGRAPH', content: 'Texto de apoio para testar a safe area do fade.' },
      ],
    } as any,
    index: 0,
    canvasRef: { current: null },
  }),
);

const fadeSoftMarkup = renderToStaticMarkup(
  React.createElement(SlideCanvas, {
    slide: {
      template: 'HERO',
      contentTemplate: 'HERO',
      imageLayout: 'IMAGE_FADE_RIGHT',
      options: {
        fadeSide: 'right',
        fadeStrength: 0,
        fadeBlur: 10,
        accent: '#EAB308',
      },
      image: {
        type: 'IMAGE_BACKGROUND',
        url: 'https://example.com/hero.jpg',
        position: 'right',
        overlay: 'dark',
        naturalWidth: 1920,
        naturalHeight: 1080,
      },
      blocks: [
        { type: 'TITLE', content: 'Existe [[solução]], sim.' },
        { type: 'PARAGRAPH', content: 'Texto de apoio para testar a safe area do fade.' },
      ],
    } as any,
    index: 1,
    canvasRef: { current: null },
  }),
);

const fadeExtendedClampMarkup = renderToStaticMarkup(
  React.createElement(SlideCanvas, {
    slide: {
      template: 'HERO',
      contentTemplate: 'HERO',
      imageLayout: 'IMAGE_FADE_LEFT',
      options: {
        fadeSide: 'left',
        fadeStrength: 1,
        fadeBlur: 10,
        accent: '#EAB308',
      },
      image: {
        type: 'IMAGE_BACKGROUND',
        url: 'https://example.com/hero.jpg',
        position: 'left',
        overlay: 'dark',
        naturalWidth: 1920,
        naturalHeight: 1080,
        imageX: 900,
        imageY: 0,
        imageScale: 1,
        imageRotation: 0,
      },
      blocks: [
        { type: 'TITLE', content: 'Fade livre' },
        { type: 'PARAGRAPH', content: 'Offset deve aproveitar a área escondida pelo fade.' },
      ],
    } as any,
    index: 2,
    canvasRef: { current: null },
  }),
);

assert.match(fadeMarkup, /data-fade-reading-zone="right"/);
assert.match(fadeMarkup, /data-fade-image-grade="true"/);
assert.match(fadeMarkup, /data-fade-reading-luminosity="right"/);
assert.match(fadeMarkup, /data-fade-reading-blur="true"/);
assert.match(fadeMarkup, /data-fade-reading-desaturate="true"/);
assert.doesNotMatch(fadeMarkup, /data-fade-reading-zone="right"[^>]*mix-blend-mode:luminosity/);
assert.match(fadeMarkup, /data-fade-reading-luminosity="right"[^>]*mix-blend-mode:luminosity/);
assert.match(fadeMarkup, /data-fade-reading-luminosity="right"[^>]*opacity:0\.06/);
assert.match(fadeMarkup, /rgba\(20, 20, 20, 0\.92\)/);
assert.match(fadeMarkup, /rgba\(20, 20, 20, 0\.72\)/);
assert.match(fadeMarkup, /backdrop-filter:saturate\(1\.18\) contrast\(1\.08\) brightness\(1\.02\)/);
assert.doesNotMatch(fadeMarkup, /;filter:blur/);
assert.match(fadeMarkup, /backdrop-filter:blur\(2\.2px\) saturate\(1\.05\) contrast\(1\.06\) brightness\(0\.98\)/);
assert.match(fadeMarkup, /data-fade-reading-blur="true"[^>]*opacity:0\.18/);
assert.match(fadeMarkup, /backdrop-filter:saturate\(1\.02\) contrast\(1\.04\) brightness\(0\.96\)/);
assert.match(fadeMarkup, /data-fade-reading-desaturate="true"[^>]*opacity:0\.1/);
assert.match(fadeMarkup, /color:#FFFFFF/);
assert.doesNotMatch(fadeMarkup, /color:#777777F5/);
assert.match(fadeMarkup, /mix-blend-mode:multiply;opacity:0\.18/);
assert.match(fadeMarkup, /padding-right:72px/);
assert.match(fadeSoftMarkup, /padding-right:72px/);
assert.doesNotMatch(fadeMarkup, /width:58%;max-width:58%/);
assert.match(fadeMarkup, /width:80%/);
assert.match(fadeMarkup, /transparent 66%/);
assert.doesNotMatch(fadeMarkup, /object-position:calc\(/);
assert.match(fadeMarkup, /min-width:100%/);
assert.match(fadeMarkup, /min-height:100%/);
assert.match(fadeMarkup, /translate\(-50%, -50%\) translate\(120px, -40px\) scale\(1\.2\) rotate\(12deg\)/);
assert.match(fadeExtendedClampMarkup, /translate\(-50%, -50%\) translate\([6-9]\d{2}px, 0px\) scale\(1\) rotate\(0deg\)/);

const heroNoImageMarkup = renderToStaticMarkup(
  React.createElement(SlideCanvas, {
    slide: {
      template: 'HERO',
      contentTemplate: 'HERO',
      imageLayout: 'IMAGE_NONE',
      options: {},
      blocks: [
        { type: 'TITLE', content: 'Sem imagem' },
        { type: 'PARAGRAPH', content: 'Texto central.' },
      ],
    } as any,
    index: 1,
    canvasRef: { current: null },
  }),
);

assert.doesNotMatch(heroNoImageMarkup, /data-fade-reading-zone=/);
assert.doesNotMatch(heroNoImageMarkup, /data-fade-reading-blur=/);
assert.match(heroNoImageMarkup, /justify-center items-center/);
assert.match(heroNoImageMarkup, /mx-auto text-center/);

console.log('slide-canvas-fade.test.tsx passed');
