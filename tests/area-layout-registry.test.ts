import assert from 'node:assert/strict';
import { areaLayoutRegistry } from '../domain/layouts/AreaLayoutRegistry.ts';
import { resolveAreaFramePx, resolveAreaInnerFramePx } from '../utils/area-layout.ts';

const allLayouts = areaLayoutRegistry.getAll();
assert.equal(allLayouts.length, 6);

const stackBoxTop = areaLayoutRegistry.get('IMAGE_STACK_BOX_TOP');
assert.ok(stackBoxTop);
assert.equal(stackBoxTop?.slideWidth, 1080);
assert.equal(stackBoxTop?.slideHeight, 1350);
assert.equal(stackBoxTop?.areas.length, 2);
assert.equal(stackBoxTop?.areas[0].role, 'image');
assert.equal(stackBoxTop?.areas[1].role, 'content');
assert.equal(stackBoxTop?.areas[0].bounds.x, 5);
assert.equal(stackBoxTop?.areas[0].bounds.width, 90);
assert.equal(stackBoxTop?.areas[0].bounds.height, 40.8);
assert.equal(stackBoxTop?.areas[1].bounds.y, 50.45);
assert.equal(stackBoxTop?.areas[1].bounds.width, 90);
assert.equal(stackBoxTop?.areas[1].bounds.height, 40.8);
assert.equal(stackBoxTop?.areas[1].padding.left, 72);
assert.equal(stackBoxTop?.areas[1].justify, 'center');
assert.equal(stackBoxTop?.areas[1].align, 'center');
assert.ok(stackBoxTop?.areas[1].acceptsBlocks.includes('TITLE'));
assert.ok(stackBoxTop?.areas[1].acceptsBlocks.includes('LIST'));
const stackBoxTopOuter = resolveAreaFramePx(stackBoxTop!.areas[1], 1080, 1350);
const stackBoxTopInner = resolveAreaInnerFramePx(stackBoxTop!.areas[1], 1080, 1350);
assert.ok(stackBoxTopInner.width < stackBoxTopOuter.width);
assert.ok(stackBoxTopInner.height < stackBoxTopOuter.height);

const stackBoxBottom = areaLayoutRegistry.get('IMAGE_STACK_BOX_BOTTOM');
assert.ok(stackBoxBottom);
assert.equal(stackBoxBottom?.areas.length, 2);
assert.equal(stackBoxBottom?.areas[0].role, 'content');
assert.equal(stackBoxBottom?.areas[1].role, 'image');
assert.equal(stackBoxBottom?.areas[0].bounds.y, 8.2);
assert.equal(stackBoxBottom?.areas[1].bounds.y, 50.45);
assert.equal(stackBoxBottom?.areas[0].justify, 'center');
assert.equal(stackBoxBottom?.areas[0].align, 'center');

console.log('area-layout-registry.test.ts passed');
