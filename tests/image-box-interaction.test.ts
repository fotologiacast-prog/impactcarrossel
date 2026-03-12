import assert from 'node:assert/strict';
import {
  clampImageBoxDimensions,
  getImageBoxGuides,
  resolveImageBoxSnapLock,
} from '../utils/image-box-interaction.ts';

const centeredGuides = getImageBoxGuides(
  {
    left: 270,
    top: 285,
    width: 540,
    height: 780,
  },
  {
    width: 1080,
    height: 1350,
  },
  12,
);

assert.equal(centeredGuides.snapX, 0);
assert.equal(centeredGuides.snapY, 0);
assert.equal(centeredGuides.isCenteredHorizontally, true);
assert.equal(centeredGuides.isCenteredVertically, true);
assert.equal(centeredGuides.hasEqualHorizontalSpacing, true);
assert.equal(centeredGuides.hasEqualVerticalSpacing, true);

const offCenterGuides = getImageBoxGuides(
  {
    left: 292,
    top: 296,
    width: 520,
    height: 760,
  },
  {
    width: 1080,
    height: 1350,
  },
  12,
);

assert.equal(offCenterGuides.snapX, -12);
assert.equal(offCenterGuides.snapY, -1);
assert.equal(offCenterGuides.isCenteredHorizontally, true);
assert.equal(offCenterGuides.isCenteredVertically, true);

const snapLockAcquire = resolveImageBoxSnapLock(
  { x: false, y: false },
  { snapX: -18, snapY: null },
  { x: 72, y: 72 },
  { x: 96, y: 96 },
);

assert.deepEqual(snapLockAcquire, {
  x: true,
  y: false,
});

const snapLockHold = resolveImageBoxSnapLock(
  { x: true, y: false },
  { snapX: -64, snapY: null },
  { x: 72, y: 72 },
  { x: 96, y: 96 },
);

assert.deepEqual(snapLockHold, {
  x: true,
  y: false,
});

const snapLockRelease = resolveImageBoxSnapLock(
  { x: true, y: false },
  { snapX: -112, snapY: null },
  { x: 72, y: 72 },
  { x: 96, y: 96 },
);

assert.deepEqual(snapLockRelease, {
  x: false,
  y: false,
});

const clamped = clampImageBoxDimensions(
  {
    width: 90,
    height: 1800,
  },
  {
    minWidth: 180,
    maxWidth: 860,
    minHeight: 220,
    maxHeight: 1120,
  },
);

assert.deepEqual(clamped, {
  width: 180,
  height: 1120,
});

console.log('image-box-interaction.test.ts passed');
