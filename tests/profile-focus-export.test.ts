import assert from 'node:assert/strict';
import { getProfileFocusVisualStyles } from '../utils/profile-focus.ts';

const visualStyles = getProfileFocusVisualStyles({
  white: '#F5F3EE',
  strength: 0.32,
  blur: 18,
});

assert.equal(visualStyles.shell.background, 'rgba(245, 243, 238, 0.1384)');
assert.equal(visualStyles.shell.border, '1px solid rgba(255,255,255,0.24)');
assert.equal(visualStyles.shell.boxShadow, undefined);
assert.equal(visualStyles.shadow.opacity, 0.34);
assert.equal(visualStyles.shadow.filter, undefined);
assert.equal(visualStyles.shadow.background, 'transparent');
assert.match(visualStyles.shadow.boxShadow || '', /rgba\(0,0,0,0\.2/);
assert.match(visualStyles.shadow.boxShadow || '', /rgba\(0,0,0,0\.34/);

console.log('profile-focus-export.test.ts passed');
