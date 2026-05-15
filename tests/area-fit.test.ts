import assert from 'node:assert/strict';
import { fitBlocksInArea } from '../utils/area-fit.ts';
import { measureBlock } from '../utils/block-measurement.ts';
import type { SlideArea } from '../utils/area-layout.ts';

const contentArea: SlideArea = {
  id: 'content',
  role: 'content',
  bounds: { x: 10, y: 10, width: 80, height: 50 },
  padding: { top: 24, right: 24, bottom: 24, left: 24 },
  direction: 'column',
  justify: 'start',
  align: 'start',
  gap: 12,
  overflow: 'hidden',
  acceptsBlocks: ['TITLE', 'PARAGRAPH', 'LIST', 'BOX', 'BADGE', 'CTA', 'IMAGE'],
};

const title = measureBlock('TITLE', { text: 'Título curto' }, 640);
assert.ok(title.idealHeight >= title.minHeight);
assert.ok(title.maxHeight >= title.idealHeight);
assert.equal(title.minWidth > 0, true);

const paragraph = measureBlock('PARAGRAPH', { text: 'Um parágrafo com mais de uma linha para medir corretamente.' }, 640);
assert.ok(paragraph.idealHeight >= paragraph.minHeight);
assert.ok(paragraph.maxHeight >= paragraph.idealHeight);

const list = measureBlock('LIST', { items: ['Primeiro ponto', 'Segundo ponto', 'Terceiro ponto'] }, 640);
assert.ok(list.idealHeight >= list.minHeight);
assert.equal(list.priority < title.priority, true);

const box = measureBlock('BOX', { title: 'Diagnóstico', text: 'Resumo da leitura', icon: 'stethoscope' }, 640);
assert.ok(box.minHeight > 0);
assert.equal(box.canShrink, true);

const badge = measureBlock('BADGE', { text: 'Novo' }, 640);
assert.ok(badge.idealHeight >= badge.minHeight);
assert.equal(badge.priority < box.priority, true);

const cta = measureBlock('CTA', { text: 'Agendar agora' }, 640);
assert.equal(cta.canShrink, false);

const image = measureBlock('IMAGE', { src: 'x' }, 640);
assert.equal(image.canShrink, false);
assert.ok(image.maxHeight > 1000);

const fallback = measureBlock('UNKNOWN_KIND', { text: 'Fallback' }, 640);
assert.ok(fallback.idealHeight > 0);

const fitsResult = fitBlocksInArea(
  [
    { type: 'TITLE', data: { text: 'Título curto' } },
    { type: 'PARAGRAPH', data: { text: 'Texto curto de apoio.' } },
  ],
  contentArea,
  1080,
  1350,
);

assert.equal(fitsResult.status, 'fits');
assert.equal(fitsResult.blocks.length, 2);
assert.ok(fitsResult.usedHeight > 0);

const shrunkArea: SlideArea = {
  ...contentArea,
  bounds: { x: 10, y: 10, width: 80, height: 22 },
};

const fitsShrunkResult = fitBlocksInArea(
  [
    { type: 'TITLE', data: { text: 'Título com duas linhas possíveis e um pouco maior' } },
    { type: 'PARAGRAPH', data: { text: 'Texto de apoio suficientemente longo para forçar shrink de verdade no solver.' } },
  ],
  { ...shrunkArea, bounds: { x: 10, y: 10, width: 80, height: 12 } },
  1080,
  1350,
);

assert.equal(fitsShrunkResult.status, 'fits_shrunk');
assert.equal(fitsShrunkResult.blocks.length, 2);
assert.ok(fitsShrunkResult.shrinkRatio < 1);
assert.ok(fitsShrunkResult.shrinkRatio > 0.5);

const overflowResult = fitBlocksInArea(
  [
    { type: 'TITLE', data: { text: 'Título com bastante texto para apertar a área' } },
    { type: 'PARAGRAPH', data: { text: 'Parágrafo um com bastante texto para ocupar altura e forçar a remoção de um bloco.' } },
    { type: 'PARAGRAPH', data: { text: 'Parágrafo dois com bastante texto para ocupar altura e forçar a remoção de um bloco.' } },
  ],
  { ...contentArea, bounds: { x: 10, y: 10, width: 80, height: 13 } },
  1080,
  1350,
);

assert.equal(overflowResult.status, 'overflow');
assert.ok(overflowResult.droppedBlocks.length >= 1);
assert.ok(overflowResult.blocks.length < 3);

const impossibleResult = fitBlocksInArea(
  [{ type: 'TITLE', data: { text: 'Título muito longo para espaço mínimo' } }],
  { ...contentArea, bounds: { x: 10, y: 10, width: 6, height: 10 } },
  1080,
  1350,
);

assert.equal(impossibleResult.status, 'impossible');

console.log('area-fit.test.ts passed');
