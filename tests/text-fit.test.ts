import assert from 'node:assert/strict';
import { fitTextToConstraint } from '../utils/text-fit.ts';
import { TextMeasurer } from '../utils/text-measurer.ts';

const measurer = new TextMeasurer(({ text, fontSize, letterSpacing = 0 }) => {
  const glyphWidth = text.replace(/\s/g, '').length * fontSize * 0.58;
  const spaceWidth = (text.match(/\s/g) || []).length * fontSize * 0.28;
  const spacingWidth = text.length > 1 ? (text.length - 1) * letterSpacing : 0;
  return glyphWidth + spaceWidth + spacingWidth;
});

const titleConstraint = {
  availableWidth: 520,
  availableHeight: 210,
  fontSize: 80,
  fontFamily: 'Inter',
  fontWeight: 800,
  lineHeight: 1.1,
  letterSpacing: 0,
  maxLines: 3,
  minFontSize: 52,
  overflow: 'shrink' as const,
  role: 'title' as const,
};

const fittedTitle = fitTextToConstraint('Muita gente vai adiando', titleConstraint, measurer);
assert.equal(fittedTitle.formatted, 'Muita gente\nvai adiando');
assert.equal(fittedTitle.effectiveFontSize, 80);
assert.equal(fittedTitle.wasShrunk, false);
assert.ok(fittedTitle.quality > 70);

const fittedManual = fitTextToConstraint('Muita gente vai adiando', {
  ...titleConstraint,
  mode: 'manual' as const,
  manualBreaks: 'Muita gente\nvai adiando',
}, measurer);
assert.equal(fittedManual.formatted, 'Muita gente\nvai adiando');
assert.equal(fittedManual.wasShrunk, false);

const shrunkTitle = fitTextToConstraint('Como criar conteúdo que realmente converte em vendas', {
  ...titleConstraint,
  availableWidth: 360,
  availableHeight: 180,
  maxLines: 3,
  minFontSize: 32,
}, measurer);
assert.equal(shrunkTitle.wasShrunk, true);
assert.ok(shrunkTitle.effectiveFontSize < 80);
assert.ok(shrunkTitle.lines.length <= 3);

const fittedBadge = fitTextToConstraint('Agende sua avaliação hoje', {
  availableWidth: 300,
  availableHeight: 92,
  fontSize: 32,
  fontFamily: 'Inter',
  fontWeight: 700,
  lineHeight: 1.1,
  maxLines: 2,
  minFontSize: 24,
  overflow: 'shrink',
  role: 'badge',
}, measurer);
assert.ok(fittedBadge.lines.length <= 2);
assert.ok(fittedBadge.quality > 60);

const fittedCard = fitTextToConstraint('Diagnóstico completo e higiene correta para iniciar o tratamento', {
  availableWidth: 340,
  availableHeight: 140,
  fontSize: 30,
  fontFamily: 'Inter',
  fontWeight: 400,
  lineHeight: 1.3,
  maxLines: 3,
  minFontSize: 22,
  overflow: 'shrink',
  role: 'card',
}, measurer);
assert.ok(fittedCard.lines.length <= 3);

console.log('text-fit.test.ts passed');
