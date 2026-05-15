import assert from 'node:assert/strict';
import { resolveImagePreviewFrame } from '../utils/image-preview-frame.ts';

const backgroundFrame = resolveImagePreviewFrame({
  imageLayoutId: 'IMAGE_BACKGROUND',
});

assert.deepEqual(backgroundFrame, {
  width: 1080,
  height: 1350,
});

const splitLeftFrame = resolveImagePreviewFrame({
  imageLayoutId: 'IMAGE_SPLIT_LEFT',
});

assert.deepEqual(splitLeftFrame, {
  width: 540,
  height: 1350,
});

const fadeLeftFrame = resolveImagePreviewFrame({
  imageLayoutId: 'IMAGE_FADE_LEFT',
  fadeSide: 'left',
});

assert.equal(fadeLeftFrame.width, 1080);
assert.equal(fadeLeftFrame.height, 1350);
assert.equal(fadeLeftFrame.coverRect, undefined);

const boxBottomFrame = resolveImagePreviewFrame({
  imageLayoutId: 'IMAGE_BOX_BOTTOM',
  imageWidth: 760,
  imageHeight: 320,
});

assert.deepEqual(boxBottomFrame, {
  width: 760,
  height: 320,
});

console.log('image-preview-frame.test.ts passed');
