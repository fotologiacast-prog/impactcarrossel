import assert from 'node:assert/strict';
import { TextMeasurer } from '../utils/text-measurer.ts';

const measurer = new TextMeasurer(({ text, fontSize, letterSpacing = 0 }) => {
  const glyphWidth = text.replace(/\s/g, '').length * fontSize * 0.58;
  const spaceWidth = (text.match(/\s/g) || []).length * fontSize * 0.28;
  const spacingWidth = text.length > 1 ? (text.length - 1) * letterSpacing : 0;
  return glyphWidth + spaceWidth + spacingWidth;
});

assert.ok(
  measurer.measureWidth('Muita gente', {
    fontSize: 80,
    fontFamily: 'Inter',
    fontWeight: 800,
  }) > 0,
);

assert.deepEqual(
  measurer.measureLines('Muita gente vai adiando', 520, {
    fontSize: 80,
    fontFamily: 'Inter',
    fontWeight: 800,
    letterSpacing: 0,
  }),
  ['Muita gente', 'vai adiando'],
);

assert.equal(
  measurer.measureHeight(['Muita gente', 'vai adiando'], 80, 1.1),
  176,
);

console.log('text-measurer.test.ts passed');
