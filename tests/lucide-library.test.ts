import assert from 'node:assert/strict';
import { getAllLucideIcons, searchLucideIcons } from '../utils/lucide-library.ts';

const allIcons = getAllLucideIcons();

assert.equal(allIcons.length > 1000, true);
assert.equal(allIcons.some((icon) => icon.id === 'Zap'), true);
assert.equal(allIcons.some((icon) => icon.id === 'Calendar'), true);
assert.equal(allIcons.some((icon) => icon.id.endsWith('Icon')), false);

const zapResults = searchLucideIcons('zap');
assert.equal(zapResults.some((icon) => icon.id === 'Zap'), true);

const calendarResults = searchLucideIcons('calendar');
assert.equal(calendarResults.some((icon) => icon.id === 'Calendar'), true);

const circleAlertResults = searchLucideIcons('circle alert');
assert.equal(circleAlertResults.some((icon) => icon.id === 'CircleAlert'), true);

console.log('lucide-library.test.ts passed');
