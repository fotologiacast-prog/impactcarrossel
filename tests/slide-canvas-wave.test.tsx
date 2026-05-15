import assert from 'node:assert/strict';
import React from 'react';
import { renderToStaticMarkup } from 'react-dom/server';
import { SlideCanvas } from '../renderers/SlideCanvas.tsx';

const waveMarkup = renderToStaticMarkup(
  React.createElement(SlideCanvas, {
    slide: {
      template: 'HERO',
      contentTemplate: 'HERO',
      imageLayout: 'IMAGE_WAVE_BOTTOM',
      options: {
        background: '#F7F5EF',
        text: '#141414',
        accent: '#1FB2F7',
        contentHorizontalAlign: 'center',
        contentVerticalAlign: 'top',
        contentWidthPercent: 92,
      },
      image: {
        type: 'IMAGE_WAVE',
        url: 'https://example.com/wave.jpg',
        position: 'bottom',
        naturalWidth: 1920,
        naturalHeight: 1080,
        imageX: 80,
        imageY: -120,
        imageScale: 1.08,
      },
      blocks: [
        { type: 'PARAGRAPH', content: 'Uma marca consistente', options: { align: 'center', fontSize: 34, fontWeight: 900 } },
        { type: 'TITLE', content: 'Vende mais!', options: { align: 'center', fontSize: 156, color: 'accent' } },
        { type: 'PARAGRAPH', content: 'Quando imagens seguem uma linguagem visual coerente, o cérebro associa confiança.', options: { align: 'center', fontSize: 34 } },
        { type: 'PARAGRAPH', content: '[[E confiança reduz resistência à compra!]]', options: { align: 'center', fontSize: 34, lineBreakMode: 'manual', manualBreaks: '[[E confiança reduz resistência à compra!]]' } },
      ],
    } as any,
    index: 0,
    canvasRef: { current: null },
  }),
);

assert.match(waveMarkup, /data-wave-layout="bottom"/);
assert.match(waveMarkup, /data-wave-image-mask="true"/);
assert.match(waveMarkup, /data-wave-boundary="true"/);
assert.match(waveMarkup, /clip-path:url\(#waveClip-0\)/);
assert.match(waveMarkup, /M0 814 C126 756 250 742 386 748 C566 758 724 754 874 710 C980 678 1034 642 1080 590/);
assert.match(waveMarkup, /data-image-positioning="cover-transform"/);
assert.match(waveMarkup, /translate\(-50%, -50%\) translate\(80px, -54px\) scale\(1\.08\)/);
assert.match(waveMarkup, /text-align:center/);
assert.match(waveMarkup, /data-wave-content-safe-area="true"/);
assert.match(waveMarkup, /top:116px/);
assert.match(waveMarkup, /height:462px/);
assert.match(waveMarkup, /transform:translateX\(-20px\)/);
assert.match(waveMarkup, /data-wave-content="true"[^>]*justify-center/);
assert.match(waveMarkup, /data-wave-content-zone="top-safe"/);
assert.match(waveMarkup, /width:100%;max-width:100%/);
assert.doesNotMatch(waveMarkup, /width:92%;max-width:92%/);

console.log('slide-canvas-wave.test.tsx passed');
