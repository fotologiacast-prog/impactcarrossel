import assert from 'node:assert/strict';
import { getEmojiSizeForContext } from '../utils/emoji.tsx';

assert.equal(getEmojiSizeForContext('list'), '1.42em');
assert.equal(getEmojiSizeForContext('badge'), '1.36em');
assert.equal(getEmojiSizeForContext('title'), '1.12em');
assert.equal(getEmojiSizeForContext('paragraph'), '1.14em');
assert.equal(getEmojiSizeForContext('box'), '1.18em');
assert.equal(getEmojiSizeForContext('card'), '1.18em');

console.log('emoji-size.test.ts passed');
