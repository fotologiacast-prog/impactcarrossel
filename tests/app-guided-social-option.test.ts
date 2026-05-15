import assert from 'node:assert/strict';
import { readFileSync } from 'node:fs';

const source = readFileSync(new URL('../App.tsx', import.meta.url), 'utf8');

assert.match(
  source,
  /const heroSocialContentOption = !isCoverSlide[\s\S]*visibleContentTemplateOptionsForCurrentSlide\.find\(\(option\) => option\.heroVariant === 'social'\)/,
);
assert.match(
  source,
  /onClick=\{\(\) => applyVisibleContentTemplateSelection\(heroSocialContentOption\)\}/,
);
assert.match(source, /Foto, nome, @ e frase em um slide sem imagem\./);
assert.match(
  source,
  /!currentImageLayoutFamily && family\.id === 'none' && !isHeroSocialActive/,
);
assert.match(
  source,
  /applySlideCompositionSelection\(undefined, nextLayoutId, familyId === 'none' \|\| nextLayoutId === 'IMAGE_NONE' \? 'default' : undefined\)/,
);

console.log('app-guided-social-option.test.ts passed');
