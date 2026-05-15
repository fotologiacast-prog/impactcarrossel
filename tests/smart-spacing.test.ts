import assert from 'node:assert/strict';
import { getPairSpacing, mapBlockTypeToRole } from '../utils/smart-spacing.ts';

assert.equal(getPairSpacing('tag', 'title'), 0.5);
assert.equal(getPairSpacing('title', 'paragraph'), 1.0);
assert.equal(getPairSpacing('paragraph', 'list'), 1.2);
assert.equal(mapBlockTypeToRole('BADGE'), 'tag');
assert.equal(mapBlockTypeToRole('TITLE'), 'title');
assert.equal(mapBlockTypeToRole('LIST'), 'list');
assert.equal(mapBlockTypeToRole('BOX'), 'box');

console.log('smart-spacing.test.ts passed');
