import assert from 'node:assert/strict';
import { areaLayoutRegistry } from '../domain/layouts/AreaLayoutRegistry.ts';
import { findSlideArea } from '../utils/area-layout.ts';

const stageRightLayout = areaLayoutRegistry.get('IMAGE_STAGE_RIGHT');
const stageLeftLayout = areaLayoutRegistry.get('IMAGE_STAGE_LEFT');
const stageTopLayout = areaLayoutRegistry.get('IMAGE_STAGE_TOP');
const stageBottomLayout = areaLayoutRegistry.get('IMAGE_STAGE_BOTTOM');

assert.ok(stageRightLayout);
assert.ok(stageLeftLayout);
assert.ok(stageTopLayout);
assert.ok(stageBottomLayout);
assert.equal(stageRightLayout?.name, 'Stage direita');
assert.equal(stageLeftLayout?.name, 'Stage esquerda');

const rightContentArea = stageRightLayout ? findSlideArea(stageRightLayout, 'content-area') : undefined;
const rightImageArea = stageRightLayout ? findSlideArea(stageRightLayout, 'image-area') : undefined;
const leftContentArea = stageLeftLayout ? findSlideArea(stageLeftLayout, 'content-area') : undefined;
const leftImageArea = stageLeftLayout ? findSlideArea(stageLeftLayout, 'image-area') : undefined;
const topContentArea = stageTopLayout ? findSlideArea(stageTopLayout, 'content-area') : undefined;
const topImageArea = stageTopLayout ? findSlideArea(stageTopLayout, 'image-area') : undefined;
const bottomContentArea = stageBottomLayout ? findSlideArea(stageBottomLayout, 'content-area') : undefined;
const bottomImageArea = stageBottomLayout ? findSlideArea(stageBottomLayout, 'image-area') : undefined;

assert.ok(rightContentArea);
assert.ok(rightImageArea);
assert.ok(leftContentArea);
assert.ok(leftImageArea);
assert.ok(topContentArea);
assert.ok(topImageArea);
assert.ok(bottomContentArea);
assert.ok(bottomImageArea);
assert.equal(rightContentArea?.role, 'content');
assert.equal(rightImageArea?.role, 'image');
assert.ok((rightContentArea?.bounds.width || 0) < (rightImageArea?.bounds.x || 0));
assert.ok((leftImageArea?.bounds.width || 0) < (leftContentArea?.bounds.x || 0));
assert.ok((topImageArea?.bounds.height || 0) < (topContentArea?.bounds.y || 0));
assert.ok((bottomContentArea?.bounds.y || 0) < (bottomImageArea?.bounds.y || 0));
assert.equal(topContentArea?.align, 'center');
assert.equal(bottomContentArea?.align, 'center');
assert.equal(rightContentArea?.align, 'start');
assert.equal(leftContentArea?.align, 'start');

console.log('area-layout-stage.test.ts passed');
