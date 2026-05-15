import assert from 'node:assert/strict';
import { contentTemplateRegistry } from '../domain/templates/ContentTemplateRegistry.ts';
import { buildVisibleContentTemplateOptions } from '../utils/content-template-options.ts';

const visibleOptions = buildVisibleContentTemplateOptions(contentTemplateRegistry.getAll());

assert.deepEqual(
  visibleOptions.map((option) => option.id),
  ['HERO', 'HERO_SOCIAL', 'STAT', 'CHECKLIST', 'BOX_GRID'],
);

const heroOption = visibleOptions[0];
const heroSocialOption = visibleOptions[1];

assert.equal(heroOption.contentTemplateId, 'HERO');
assert.equal(heroOption.heroVariant, 'default');
assert.equal(heroSocialOption.contentTemplateId, 'HERO');
assert.equal(heroSocialOption.name, 'Social');
assert.equal(heroSocialOption.heroVariant, 'social');
assert.match(heroSocialOption.description, /@instagram/i);
assert.equal(heroSocialOption.allowedBlockCount, heroOption.allowedBlockCount + 1);

console.log('content-template-options.test.ts passed');
