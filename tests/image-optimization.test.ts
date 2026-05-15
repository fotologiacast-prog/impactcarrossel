import assert from 'node:assert/strict';
import {
  detectImageFormatFromDataUrl,
  estimateDataUrlBytes,
  formatImageBytes,
  getOptimizationConfig,
} from '../utils/image-optimization.ts';

assert.deepEqual(getOptimizationConfig('template'), {
  maxDimension: 2400,
  quality: 0.88,
  mimeType: 'image/webp',
});

assert.deepEqual(getOptimizationConfig('background'), {
  maxDimension: 2400,
  quality: 0.88,
  mimeType: 'image/webp',
});

assert.deepEqual(getOptimizationConfig('cover-background'), {
  maxDimension: 2400,
  quality: 0.88,
  mimeType: 'image/webp',
});

assert.deepEqual(getOptimizationConfig('cover-foreground'), {
  maxDimension: 2400,
  quality: 0.88,
  mimeType: 'image/webp',
});

assert.deepEqual(getOptimizationConfig('overlay'), {
  maxDimension: 1800,
  quality: 0.9,
  mimeType: 'image/webp',
});

assert.equal(detectImageFormatFromDataUrl('data:image/png;base64,QUJDRA=='), 'png');
assert.equal(detectImageFormatFromDataUrl('data:image/jpeg;base64,QUJDRA=='), 'jpg');
assert.equal(detectImageFormatFromDataUrl('data:image/webp;base64,QUJDRA=='), 'jpg');
assert.equal(estimateDataUrlBytes('data:image/png;base64,QUJDRA=='), 4);
assert.equal(formatImageBytes(512), '512 B');
assert.equal(formatImageBytes(1536), '1.5 KB');
assert.equal(formatImageBytes(2 * 1024 * 1024), '2.00 MB');

console.log('image-optimization.test.ts passed');
