import assert from 'node:assert/strict';
import { resolveImageLayoutIdForFamilySelection } from '../utils/image-layout-selection.ts';

assert.equal(
  resolveImageLayoutIdForFamilySelection({
    familyId: 'background',
    directionOptions: ['center'],
    defaultLayoutId: 'IMAGE_BACKGROUND',
  }, undefined, undefined),
  'IMAGE_BACKGROUND',
);

assert.equal(
  resolveImageLayoutIdForFamilySelection({
    familyId: 'glass',
    directionOptions: ['center', 'bottom'],
    defaultLayoutId: 'IMAGE_GLASS_CARD',
  }, 'bottom', 'center'),
  'IMAGE_GLASS_BOTTOM',
);

assert.equal(
  resolveImageLayoutIdForFamilySelection({
    familyId: 'glass',
    directionOptions: ['center', 'bottom'],
    defaultLayoutId: 'IMAGE_GLASS_CARD',
  }, undefined, 'center'),
  'IMAGE_GLASS_CARD',
);

assert.equal(
  resolveImageLayoutIdForFamilySelection({
    familyId: 'fade',
    directionOptions: ['left', 'right', 'top', 'bottom'],
    defaultLayoutId: 'IMAGE_FADE_LEFT',
  }, undefined, 'right'),
  'IMAGE_FADE_RIGHT',
);

assert.equal(
  resolveImageLayoutIdForFamilySelection({
    familyId: 'split',
    directionOptions: ['left', 'right', 'top', 'bottom'],
    defaultLayoutId: 'IMAGE_SPLIT_LEFT',
  }, 'bottom', 'right'),
  'IMAGE_SPLIT_BOTTOM',
);

assert.equal(
  resolveImageLayoutIdForFamilySelection({
    familyId: 'stage',
    directionOptions: ['left', 'right', 'top', 'bottom'],
    defaultLayoutId: 'IMAGE_STAGE_RIGHT',
  }, 'top', 'right'),
  'IMAGE_STAGE_TOP',
);

assert.equal(
  resolveImageLayoutIdForFamilySelection({
    familyId: 'wave',
    directionOptions: ['bottom'],
    defaultLayoutId: 'IMAGE_WAVE_BOTTOM',
  }, undefined, undefined),
  'IMAGE_WAVE_BOTTOM',
);

console.log('image-layout-selection.test.ts passed');
