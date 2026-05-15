import assert from 'node:assert/strict';
import { MAX_RECENT_ICON_IDS, normalizeRecentIconIds, pushRecentIconId } from '../utils/recent-icons.ts';

assert.deepEqual(
  normalizeRecentIconIds(['Zap', 'Calendar', 'Zap', '  ', 'Shield']),
  ['Zap', 'Calendar', 'Shield'],
);

assert.deepEqual(
  pushRecentIconId(['Zap', 'Calendar', 'Shield'], 'Calendar'),
  ['Calendar', 'Zap', 'Shield'],
);

assert.equal(
  pushRecentIconId(Array.from({ length: MAX_RECENT_ICON_IDS }, (_, index) => `Icon${index}`), 'NewIcon').length,
  MAX_RECENT_ICON_IDS,
);

console.log('recent-icons.test.ts passed');
