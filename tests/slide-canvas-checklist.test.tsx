import assert from 'node:assert/strict';
import React from 'react';
import { renderToStaticMarkup } from 'react-dom/server';
import { SlideCanvas } from '../renderers/SlideCanvas.tsx';

const checklistMarkup = renderToStaticMarkup(
  React.createElement(SlideCanvas, {
    slide: {
      template: 'CHECKLIST',
      contentTemplate: 'CHECKLIST',
      imageLayout: 'IMAGE_NONE',
      blocks: [
        { type: 'TITLE', content: 'Por que eles aparecem?' },
        { type: 'PARAGRAPH', content: 'Os microvasos podem surgir por uma combinação de fatores:' },
        {
          type: 'LIST',
          content: ['Genética', 'Alterações hormonais', 'Gravidez'],
          options: {
            variant: 'check-list',
            itemIcons: ['Dna', 'Scale', 'Baby'],
          },
        },
      ],
    } as any,
    index: 0,
    canvasRef: { current: null },
  }),
);

const denseChecklistMarkup = renderToStaticMarkup(
  React.createElement(SlideCanvas, {
    slide: {
      template: 'CHECKLIST',
      contentTemplate: 'CHECKLIST',
      imageLayout: 'IMAGE_NONE',
      blocks: [
        { type: 'TITLE', content: '3 hábitos que ajudam', options: { fontSize: 82, align: 'center' } },
        {
          type: 'LIST',
          content: [
            'Creme dental correto: use pastas específicas para dentes sensíveis. Elas criam uma camada de proteção nos túbulos dentinários',
            'Cuidado com o ácido: diminua limão, refrigerantes e vinhos, que desgastam o esmalte',
            'Força não é limpeza: use escovas extramacias. Excesso de pressão retrai a gengiva e expõe a raiz',
          ],
          options: {
            variant: 'check-list',
            align: 'center',
            itemIcons: ['Check', 'Check', 'Check'],
          },
        },
        {
          type: 'PARAGRAPH',
          content: '[[Pequenos hábitos aliviam grandes desconfortos.]]',
          options: { semanticRole: 'highlight', align: 'center', fontSize: 28 },
        },
      ],
    } as any,
    index: 1,
    canvasRef: { current: null },
  }),
);

assert.doesNotMatch(checklistMarkup, /rounded-\[40px\] p-16 bg-white\/5/);
assert.match(checklistMarkup, /mx-auto text-center/);
assert.match(denseChecklistMarkup, /data-checklist-content-stack="true"/);
assert.match(denseChecklistMarkup, /gap:28px/);
assert.doesNotMatch(denseChecklistMarkup, /data-list-after-title="true"/);
assert.doesNotMatch(denseChecklistMarkup, /margin-top:10px/);

console.log('slide-canvas-checklist.test.tsx passed');
