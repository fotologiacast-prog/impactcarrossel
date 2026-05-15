import assert from 'node:assert/strict';
import {
  autoSizeList,
  autoSizeParagraph,
  autoSizeTitle,
  fixOrphanWords,
  hasOrphanWord,
} from '../utils/smart-text.ts';

const orphanText = 'Como escalar seu negocio digital';
const fixedOrphan = fixOrphanWords(orphanText, 44, 260, 800);
assert.equal(fixedOrphan.includes('\u00A0'), true);
assert.equal(hasOrphanWord(fixedOrphan, 44, 260, 800).hasOrphan, false);

const sizedTitle = autoSizeTitle('Como escalar seu negocio digital', 320, 160, {
  maxFontSize: 56,
  minFontSize: 24,
});
assert.ok(sizedTitle.fontSize <= 56);
assert.ok(sizedTitle.totalHeight <= 160);
assert.ok(sizedTitle.lineCount >= 1);

const sizedParagraph = autoSizeParagraph(
  'Aprenda as melhores estrategias para crescer de forma previsivel.',
  320,
  120,
  { maxFontSize: 20, minFontSize: 13 },
);
assert.ok(sizedParagraph.fontSize <= 20);
assert.ok(sizedParagraph.totalHeight <= 120);

const sizedList = autoSizeList(
  ['SEO organico', 'Midia paga', 'Email marketing', 'Redes sociais'],
  320,
  220,
  { maxFontSize: 18, minFontSize: 13 },
);
assert.ok(sizedList.fontSize <= 18);
assert.ok(sizedList.processedItems.every((item) => typeof item === 'string'));

console.log('smart-text.test.ts passed');
