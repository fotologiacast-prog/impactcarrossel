import assert from 'node:assert/strict';
import { contentTemplateRegistry } from '../domain/templates/ContentTemplateRegistry.ts';
import {
  createImageConfigFromLayout,
  createOptionOverridesFromImageLayout,
  resolveSlideComposition,
} from '../domain/templates/templateComposition.ts';
import {
  getDefaultImageLayoutIdForFamily,
  getImageLayoutDirection,
  getImageLayoutFamily,
  getImageLayoutIdForFamilyDirection,
} from '../domain/templates/ImageLayoutRegistry.ts';

const visibleContentTemplateIds = contentTemplateRegistry.getAll().map((template) => template.id);

assert.deepEqual(visibleContentTemplateIds, ['HERO', 'STAT', 'CHECKLIST', 'BOX_GRID']);
assert.equal(contentTemplateRegistry.get('SOCIAL_CHECKLIST'), undefined);
assert.equal(contentTemplateRegistry.get('HERO_STATEMENT'), undefined);

const splitComposition = resolveSlideComposition({
  template: 'HERO',
  imageLayout: 'IMAGE_SPLIT_LEFT',
  blocks: [],
});

assert.equal(splitComposition.contentTemplateId, 'HERO');
assert.equal(splitComposition.imageLayoutId, 'IMAGE_SPLIT_LEFT');
assert.equal(splitComposition.legacyTemplateId, 'HERO');

assert.equal(resolveSlideComposition({ template: 'hero', blocks: [] }).contentTemplateId, 'HERO');
assert.equal(resolveSlideComposition({ template: 'checklist', blocks: [] }).contentTemplateId, 'CHECKLIST');
assert.equal(resolveSlideComposition({ template: 'box', blocks: [] }).contentTemplateId, 'BOX_GRID');
assert.equal(resolveSlideComposition({ template: 'card', blocks: [] }).contentTemplateId, 'BOX_GRID');
assert.equal(resolveSlideComposition({ template: 'stat', blocks: [] }).contentTemplateId, 'STAT');

const fadeFamily = getImageLayoutFamily('IMAGE_FADE_RIGHT');
assert.equal(fadeFamily?.id, 'fade');
assert.equal(fadeFamily?.defaultLayoutId, 'IMAGE_FADE_LEFT');
assert.deepEqual(fadeFamily?.layoutIds, [
  'IMAGE_FADE_LEFT',
  'IMAGE_FADE_RIGHT',
  'IMAGE_FADE_TOP',
  'IMAGE_FADE_BOTTOM',
]);
assert.equal(getImageLayoutDirection('IMAGE_FADE_RIGHT'), 'right');
assert.equal(getDefaultImageLayoutIdForFamily('fade'), 'IMAGE_FADE_LEFT');

const stageFamily = getImageLayoutFamily('IMAGE_STACK_BOX_TOP');
assert.equal(stageFamily?.id, 'stack_box');
assert.equal(stageFamily?.defaultLayoutId, 'IMAGE_STACK_BOX_TOP');
assert.ok(stageFamily?.layoutIds.includes('IMAGE_STACK_BOX_TOP'));
assert.ok(stageFamily?.layoutIds.includes('IMAGE_STACK_BOX_BOTTOM'));
assert.equal(getImageLayoutDirection('IMAGE_STACK_BOX_TOP'), 'top');
assert.equal(getDefaultImageLayoutIdForFamily('stack_box'), 'IMAGE_STACK_BOX_TOP');

const boxFamily = getImageLayoutFamily('IMAGE_BOX_RIGHT');
assert.equal(boxFamily?.id, 'box');
assert.equal(boxFamily?.defaultLayoutId, 'IMAGE_BOX_RIGHT');
assert.ok(boxFamily?.layoutIds.includes('IMAGE_BOX_RIGHT'));
assert.equal(getImageLayoutDirection('IMAGE_STAGE_RIGHT'), 'right');
assert.equal(getImageLayoutIdForFamilyDirection('box', 'bottom'), 'IMAGE_BOX_BOTTOM');

const stageLayoutFamily = getImageLayoutFamily('IMAGE_STAGE_RIGHT');
assert.equal(stageLayoutFamily?.id, 'stage');
assert.equal(stageLayoutFamily?.defaultLayoutId, 'IMAGE_STAGE_RIGHT');
assert.deepEqual(stageLayoutFamily?.layoutIds, ['IMAGE_STAGE_RIGHT']);

const glassComposition = resolveSlideComposition({
  template: 'HERO',
  imageLayout: 'IMAGE_GLASS_CARD',
  blocks: [],
});

assert.equal(glassComposition.contentTemplateId, 'HERO');
assert.equal(glassComposition.imageLayoutId, 'IMAGE_GLASS_CARD');

const profileComposition = resolveSlideComposition({
  template: 'HERO',
  imageLayout: 'IMAGE_BOX_RIGHT',
  blocks: [],
});

assert.equal(profileComposition.contentTemplateId, 'HERO');
assert.equal(profileComposition.imageLayoutId, 'IMAGE_BOX_RIGHT');

const checklistComposition = resolveSlideComposition({
  template: 'CHECKLIST',
  blocks: [],
});

assert.equal(checklistComposition.contentTemplateId, 'CHECKLIST');
assert.equal(checklistComposition.imageLayoutId, 'IMAGE_NONE');

const explicitComposition = resolveSlideComposition({
  template: 'CHECKLIST',
  contentTemplate: 'BOX_GRID',
  imageLayout: 'IMAGE_NONE',
  blocks: [],
});

assert.equal(explicitComposition.contentTemplateId, 'BOX_GRID');
assert.equal(explicitComposition.imageLayoutId, 'IMAGE_NONE');
assert.equal(explicitComposition.legacyTemplateId, 'BOX_GRID');

const explicitImageComposition = resolveSlideComposition({
  template: 'HERO',
  image: {
    type: 'IMAGE_BACKGROUND',
  },
  blocks: [],
});

assert.equal(explicitImageComposition.contentTemplateId, 'HERO');
assert.equal(explicitImageComposition.imageLayoutId, 'IMAGE_BACKGROUND');
assert.equal(explicitImageComposition.legacyTemplateId, 'HERO');

const backgroundOptionComposition = resolveSlideComposition({
  template: 'CHECKLIST',
  options: {
    backgroundImage: 'https://example.com/background.jpg',
  },
  blocks: [],
});

assert.equal(backgroundOptionComposition.contentTemplateId, 'CHECKLIST');
assert.equal(backgroundOptionComposition.imageLayoutId, 'IMAGE_BACKGROUND');

const fadeBackgroundOptionComposition = resolveSlideComposition({
  template: 'HERO',
  imageLayout: 'IMAGE_FADE_LEFT',
  options: {
    backgroundImage: 'https://example.com/fade.jpg',
    fadeSide: 'right',
  },
  blocks: [],
});

assert.equal(fadeBackgroundOptionComposition.contentTemplateId, 'HERO');
assert.equal(fadeBackgroundOptionComposition.imageLayoutId, 'IMAGE_FADE_RIGHT');

const fadeImage = createImageConfigFromLayout('IMAGE_FADE_RIGHT', { url: 'https://example.com/image.png' });
assert.equal(fadeImage?.type, 'IMAGE_BACKGROUND');
assert.equal(fadeImage?.position, 'right');
assert.equal(fadeImage?.url, 'https://example.com/image.png');

const noImage = createImageConfigFromLayout('IMAGE_NONE', { url: 'https://example.com/image.png' });
assert.deepEqual(noImage, { type: 'NONE' });

const fadeOverrides = createOptionOverridesFromImageLayout('IMAGE_FADE_RIGHT');
assert.equal(fadeOverrides.fadeSide, 'right');

const manualFadeComposition = resolveSlideComposition({
  template: 'HERO',
  contentTemplate: 'HERO',
  imageLayout: 'IMAGE_FADE_RIGHT',
  image: {
    type: 'IMAGE_BACKGROUND',
    position: 'right',
  },
  options: {
    fadeSide: 'top',
  },
  blocks: [],
});

assert.equal(manualFadeComposition.imageLayoutId, 'IMAGE_FADE_TOP');
assert.equal(manualFadeComposition.legacyTemplateId, 'HERO');

const stackBoxTopImage = createImageConfigFromLayout('IMAGE_STACK_BOX_TOP', { url: 'https://example.com/image.png' });
assert.equal(stackBoxTopImage?.type, 'IMAGE_BOX');
assert.equal(stackBoxTopImage?.position, 'top');

const stackBoxBottomOverrides = createOptionOverridesFromImageLayout('IMAGE_STACK_BOX_BOTTOM');
assert.equal(stackBoxBottomOverrides.contentHorizontalAlign, 'center');
assert.equal(stackBoxBottomOverrides.contentWidthPercent, 100);

console.log('template-composition.test.ts passed');
