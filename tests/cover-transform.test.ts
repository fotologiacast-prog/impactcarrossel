import assert from 'node:assert/strict';
import {
  clampCoverTranslation,
  clampCoverTranslationRange,
  resolveCoverTransformMetrics,
} from '../utils/cover-transform.ts';

const landscapeInPortrait = resolveCoverTransformMetrics({
  viewportWidth: 1080,
  viewportHeight: 1350,
  imageWidth: 1920,
  imageHeight: 1080,
  scale: 1,
});

assert.equal(landscapeInPortrait.renderedWidth, 2400);
assert.equal(landscapeInPortrait.renderedHeight, 1350);
assert.equal(landscapeInPortrait.maxOffsetX, 660);
assert.equal(landscapeInPortrait.maxOffsetY, 0);

const scaledLandscape = resolveCoverTransformMetrics({
  viewportWidth: 1080,
  viewportHeight: 1350,
  imageWidth: 1920,
  imageHeight: 1080,
  scale: 1.2,
});

assert.equal(scaledLandscape.renderedWidth, 2400);
assert.equal(scaledLandscape.renderedHeight, 1350);
assert.equal(scaledLandscape.maxOffsetX, 900);
assert.equal(scaledLandscape.maxOffsetY, 135);

assert.equal(clampCoverTranslation(120, landscapeInPortrait.maxOffsetX), 120);
assert.equal(clampCoverTranslation(1200, landscapeInPortrait.maxOffsetX), 660);
assert.equal(clampCoverTranslation(-1200, landscapeInPortrait.maxOffsetX), -660);
assert.equal(clampCoverTranslationRange(120, -400, 800), 120);
assert.equal(clampCoverTranslationRange(900, -400, 800), 800);
assert.equal(clampCoverTranslationRange(-900, -400, 800), -400);

console.log('cover-transform.test.ts passed');
