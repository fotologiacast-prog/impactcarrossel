import assert from 'node:assert/strict';
import { getIconScaleForContext, getIconMinSizeForContext } from '../utils/icon-scale.ts';

assert.equal(getIconScaleForContext('box'), 1.75);
assert.equal(getIconScaleForContext('card'), 2.2);
assert.equal(getIconMinSizeForContext('box'), 124);
assert.equal(getIconMinSizeForContext('card'), 72);

console.log('icon-size.test.ts passed');
