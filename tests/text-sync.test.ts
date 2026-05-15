import assert from 'node:assert/strict';
import type { Block } from '../types.ts';
import {
  getBlockEditorTextValue,
  normalizeAutoBreakSourceText,
  supportsAutoBreakPreviewSync,
  syncAutoBreakPreviewForBlock,
  updateTextBlockFromEditorValue,
} from '../utils/text-sync.ts';

const plainTitle: Block = {
  type: 'TITLE',
  content: 'Nao existe uma unica solucao',
  options: {},
};

assert.equal(supportsAutoBreakPreviewSync(plainTitle), true);

const syncedPreview = syncAutoBreakPreviewForBlock(plainTitle, 'Nao existe uma\nunica solucao');
assert.equal(syncedPreview.content, 'Nao existe uma unica solucao');
assert.equal(syncedPreview.options?.autoBreakPreview, 'Nao existe uma\nunica solucao');
assert.equal(getBlockEditorTextValue(syncedPreview), 'Nao existe uma\nunica solucao');

const pollutedTitle: Block = {
  type: 'TITLE',
  content: 'Nao existe uma\nunica solucao',
  options: {},
};

const healedPreview = syncAutoBreakPreviewForBlock(pollutedTitle, 'Nao existe uma\nunica solucao');
assert.equal(healedPreview.content, 'Nao existe uma unica solucao');
assert.equal(healedPreview.options?.autoBreakPreview, 'Nao existe uma\nunica solucao');

const editedFromPreview = updateTextBlockFromEditorValue(
  syncedPreview,
  'Nao existe uma\nunica solucao melhor',
);
assert.equal(editedFromPreview.content, 'Nao existe uma unica solucao melhor');
assert.equal(editedFromPreview.options?.autoBreakPreview, 'Nao existe uma\nunica solucao melhor');

const manuallyBrokenTitle = updateTextBlockFromEditorValue(
  syncedPreview,
  'Nao existe\numa unica solucao melhor',
  { manualBreakIntent: true },
);
assert.equal(manuallyBrokenTitle.content, 'Nao existe uma unica solucao melhor');
assert.equal(manuallyBrokenTitle.options?.lineBreakMode, 'manual');
assert.equal(manuallyBrokenTitle.options?.manualBreaks, 'Nao existe\numa unica solucao melhor');
assert.equal(supportsAutoBreakPreviewSync(manuallyBrokenTitle), false);
assert.equal(syncAutoBreakPreviewForBlock(manuallyBrokenTitle, 'Nao existe uma\nunica solucao melhor'), manuallyBrokenTitle);

const cleanEditorValue = updateTextBlockFromEditorValue(plainTitle, 'Tudo fica alinhado');
assert.equal(cleanEditorValue.content, 'Tudo fica alinhado');
assert.equal(cleanEditorValue.options?.autoBreakPreview, undefined);

const markupTitle: Block = {
  type: 'TITLE',
  content: 'O que [[realmente importa]] aqui',
  options: {},
};

assert.equal(supportsAutoBreakPreviewSync(markupTitle), false);
assert.equal(getBlockEditorTextValue(markupTitle), 'O que [[realmente importa]] aqui');

const ctaBadge: Block = {
  type: 'BADGE',
  content: 'Salva esse carrossel e coloca um desses hábitos em prática hoje.',
  options: {
    semanticRole: 'cta',
    icon: 'Bookmark',
  },
};

assert.equal(supportsAutoBreakPreviewSync(ctaBadge), false);
assert.equal(
  syncAutoBreakPreviewForBlock(ctaBadge, 'Salva esse carrossel\ne coloca um desses\nhábitos em prática hoje.'),
  ctaBadge,
);
assert.equal(getBlockEditorTextValue(ctaBadge), 'Salva esse carrossel e coloca um desses hábitos em prática hoje.');

const legacyLongCtaBadge: Block = {
  type: 'BADGE',
  content: 'Salva esse carrossel e coloca um desses hábitos em prática hoje.',
  options: {
    variant: 'pill',
  },
};

assert.equal(supportsAutoBreakPreviewSync(legacyLongCtaBadge), false);
assert.equal(
  syncAutoBreakPreviewForBlock(legacyLongCtaBadge, 'Salva esse carrossel\ne coloca um desses\nhábitos em prática hoje.'),
  legacyLongCtaBadge,
);

assert.equal(
  normalizeAutoBreakSourceText('Nao existe uma\nunica   solucao'),
  'Nao existe uma unica solucao',
);

console.log('text-sync.test.ts passed');
