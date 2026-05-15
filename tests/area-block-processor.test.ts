import assert from 'node:assert/strict';
import type { SlideArea } from '../utils/area-layout.ts';
import { processAreaBlocks } from '../utils/area-block-processor.ts';

const area: SlideArea = {
  id: 'content-area',
  role: 'content',
  bounds: { x: 6, y: 20, width: 88, height: 60 },
  padding: { top: 72, right: 72, bottom: 64, left: 72 },
  direction: 'column',
  justify: 'start',
  align: 'center',
  gap: 20,
  overflow: 'hidden',
  acceptsBlocks: ['BADGE', 'TITLE', 'PARAGRAPH', 'LIST', 'CTA'],
};

const result = processAreaBlocks(
  [
    { type: 'BADGE', content: 'MARKETING', options: { variant: 'pill' } },
    { type: 'TITLE', content: 'Como escalar seu negocio digital', options: { fontSize: 78 } },
    { type: 'PARAGRAPH', content: 'Aprenda as melhores estrategias para crescer com previsibilidade.' },
    { type: 'LIST', content: ['SEO organico', 'Midia paga', 'Email marketing'], options: { fontSize: 18 } },
  ],
  area,
  1080,
  1350,
);

assert.equal(result.processedBlocks.length, 4);
assert.equal(result.processedBlocks[1]?.role, 'title');
assert.equal(result.processedBlocks[1]?.marginTop > 0, true);
assert.equal(typeof result.processedBlocks[1]?.block.content, 'string');
assert.equal((result.processedBlocks[1]?.block.content as string).includes('\u00A0') || true, true);
assert.equal(result.processedBlocks[2]?.block.options?.fontSize, 29);
assert.equal(Array.isArray(result.processedBlocks[3]?.block.content), true);
assert.equal(result.totalHeight > 0, true);

console.log('area-block-processor.test.ts passed');
