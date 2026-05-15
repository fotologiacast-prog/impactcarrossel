import assert from 'node:assert/strict';
import { getTemplateProfile, TEMPLATE_PROFILES, type TemplateProfile } from '../utils/heuristics/template-profiles.ts';
import { rankTemplateProfiles, selectContentTemplate, selectTemplate } from '../utils/heuristics/template-selector.ts';

const emptyCapabilities = (): TemplateProfile['capabilities'] => ({
  intro: 0,
  single_point: 0,
  list: 0,
  stat: 0,
  comparison: 0,
  cta: 0,
  quote: 0,
});

const makeProfile = (profile: Partial<TemplateProfile> & Pick<TemplateProfile, 'templateId'>): TemplateProfile => ({
  templateId: profile.templateId,
  capabilities: {
    ...emptyCapabilities(),
    ...profile.capabilities,
  },
  visualWeight: profile.visualWeight ?? 'medium',
  imageMode: profile.imageMode ?? 'none',
  contentMode: profile.contentMode ?? 'text',
  textCapacity: profile.textCapacity ?? { min: 0, max: 999 },
  itemCapacity: profile.itemCapacity ?? { min: 0, max: 99 },
  preferredTextDensity: profile.preferredTextDensity ?? 'medium',
  preferredPositions: profile.preferredPositions ?? ['any'],
  visualFamily: profile.visualFamily ?? 'generic',
  renderSignature: profile.renderSignature ?? profile.visualFamily ?? 'generic',
});

const syntheticProfiles: TemplateProfile[] = [
  makeProfile({
    templateId: 'opening-hero',
    capabilities: { intro: 0.98, single_point: 0.35 },
    visualWeight: 'heavy',
    imageMode: 'background',
    contentMode: 'text',
    textCapacity: { min: 10, max: 90 },
    itemCapacity: { min: 0, max: 0 },
    preferredTextDensity: 'short',
    preferredPositions: ['first'],
    visualFamily: 'hero',
  }),
  makeProfile({
    templateId: 'wide-intro',
    capabilities: { intro: 0.82, single_point: 0.6 },
    visualWeight: 'medium',
    imageMode: 'split',
    contentMode: 'mixed',
    textCapacity: { min: 120, max: 320 },
    itemCapacity: { min: 0, max: 2 },
    preferredTextDensity: 'long',
    preferredPositions: ['middle'],
    visualFamily: 'stage',
  }),
  makeProfile({
    templateId: 'compact-checklist',
    capabilities: { list: 0.96, single_point: 0.22 },
    visualWeight: 'medium',
    imageMode: 'none',
    contentMode: 'list',
    textCapacity: { min: 30, max: 160 },
    itemCapacity: { min: 2, max: 4 },
    preferredTextDensity: 'short',
    preferredPositions: ['middle'],
    visualFamily: 'checklist',
  }),
  makeProfile({
    templateId: 'short-box-grid',
    capabilities: { list: 0.82, single_point: 0.34 },
    visualWeight: 'medium',
    imageMode: 'none',
    contentMode: 'mixed',
    textCapacity: { min: 20, max: 180 },
    itemCapacity: { min: 2, max: 4 },
    preferredTextDensity: 'short',
    preferredPositions: ['middle'],
    visualFamily: 'box-grid',
    renderSignature: 'box-grid',
  }),
  makeProfile({
    templateId: 'list-showcase',
    capabilities: { list: 0.92, single_point: 0.2 },
    visualWeight: 'light',
    imageMode: 'split',
    contentMode: 'list',
    textCapacity: { min: 180, max: 360 },
    itemCapacity: { min: 4, max: 8 },
    preferredTextDensity: 'long',
    preferredPositions: ['middle'],
    visualFamily: 'info',
  }),
  makeProfile({
    templateId: 'closing-cta',
    capabilities: { cta: 0.98, intro: 0.04 },
    visualWeight: 'heavy',
    imageMode: 'background',
    contentMode: 'text',
    textCapacity: { min: 20, max: 90 },
    itemCapacity: { min: 0, max: 1 },
    preferredTextDensity: 'short',
    preferredPositions: ['last'],
    visualFamily: 'glass',
  }),
  makeProfile({
    templateId: 'alternate-cta',
    capabilities: { cta: 0.94, intro: 0.04 },
    visualWeight: 'medium',
    imageMode: 'none',
    contentMode: 'text',
    textCapacity: { min: 18, max: 80 },
    itemCapacity: { min: 0, max: 1 },
    preferredTextDensity: 'short',
    preferredPositions: ['last'],
    visualFamily: 'stage',
  }),
];

const introShort = {
  type: 'intro' as const,
  textLength: 42,
  titleLength: 18,
  bodyLength: 24,
  itemCount: 0,
  itemAverageLength: 0,
  visualWeightHint: 'heavy' as const,
  hasImagePrompt: true,
  shouldUseImage: true,
  imagePriority: 100,
  prefersBigNumber: false,
};

const introLong = {
  type: 'intro' as const,
  textLength: 210,
  titleLength: 24,
  bodyLength: 186,
  itemCount: 0,
  itemAverageLength: 0,
  visualWeightHint: 'medium' as const,
  hasImagePrompt: true,
  shouldUseImage: true,
  imagePriority: 60,
  prefersBigNumber: false,
};

const listWithImage = {
  type: 'list' as const,
  textLength: 280,
  titleLength: 20,
  bodyLength: 160,
  itemCount: 6,
  itemAverageLength: 7,
  visualWeightHint: 'light' as const,
  hasImagePrompt: true,
  shouldUseImage: true,
  imagePriority: 75,
  prefersBigNumber: false,
};

const shortVisualList = {
  type: 'list' as const,
  textLength: 72,
  titleLength: 18,
  bodyLength: 24,
  itemCount: 3,
  itemAverageLength: 3,
  visualWeightHint: 'medium' as const,
  hasImagePrompt: false,
  shouldUseImage: false,
  imagePriority: 0,
  prefersBigNumber: false,
};

const explanatoryShortList = {
  type: 'list' as const,
  textLength: 156,
  titleLength: 20,
  bodyLength: 104,
  itemCount: 3,
  itemAverageLength: 1,
  visualWeightHint: 'light' as const,
  hasImagePrompt: false,
  shouldUseImage: false,
  imagePriority: 0,
  prefersBigNumber: false,
};

const ctaFinal = {
  type: 'cta' as const,
  textLength: 28,
  titleLength: 12,
  bodyLength: 16,
  itemCount: 0,
  itemAverageLength: 0,
  visualWeightHint: 'light' as const,
  hasImagePrompt: true,
  shouldUseImage: true,
  imagePriority: 95,
  prefersBigNumber: false,
};

const introContext = {
  slideIndex: 0,
  totalSlides: 8,
  previousTemplateId: null,
  previousTemplateWeight: null,
  usedTemplateIds: [],
  allowImageLayouts: true,
};

const middleContext = {
  slideIndex: 3,
  totalSlides: 8,
  previousTemplateId: 'opening-hero',
  previousTemplateWeight: 'heavy' as const,
  usedTemplateIds: ['opening-hero'],
  allowImageLayouts: true,
};

const closingContext = {
  slideIndex: 7,
  totalSlides: 8,
  previousTemplateId: 'compact-checklist',
  previousTemplateWeight: 'medium' as const,
  usedTemplateIds: ['opening-hero', 'compact-checklist'],
  allowImageLayouts: true,
};

const introSelection = selectTemplate(introShort, introContext, syntheticProfiles);
assert.equal(introSelection.templateId, 'opening-hero');
assert.equal(introSelection.candidates[0].templateId, 'opening-hero');

const introRanked = rankTemplateProfiles(introShort, introContext, syntheticProfiles);
assert.deepEqual(
  introRanked.map((candidate) => candidate.templateId),
  ['opening-hero', 'wide-intro'],
);

const longIntroSelection = selectTemplate(introLong, middleContext, syntheticProfiles);
assert.equal(longIntroSelection.templateId, 'wide-intro');

const listSelection = selectTemplate(listWithImage, middleContext, syntheticProfiles);
assert.equal(listSelection.templateId, 'list-showcase');

const listWithoutImageLayouts = selectTemplate(
  listWithImage,
  { ...middleContext, allowImageLayouts: false },
  syntheticProfiles,
);
assert.equal(listWithoutImageLayouts.templateId, 'compact-checklist');

const shortVisualListSelection = selectContentTemplate(shortVisualList, middleContext, syntheticProfiles);
assert.equal(shortVisualListSelection.templateId, 'BOX_GRID');

const explanatoryListSelection = selectContentTemplate(explanatoryShortList, middleContext, syntheticProfiles);
assert.equal(explanatoryListSelection.templateId, 'CHECKLIST');

const ctaSelection = selectTemplate(
  ctaFinal,
  {
    ...closingContext,
    previousTemplateId: 'closing-cta',
    usedTemplateIds: ['opening-hero', 'closing-cta'],
  },
  syntheticProfiles,
);
assert.equal(ctaSelection.templateId, 'alternate-cta');

const actualCtaSelection = selectContentTemplate(
  ctaFinal,
  {
    slideIndex: 7,
    totalSlides: 8,
    previousTemplateId: 'CHECKLIST',
    previousTemplateWeight: 'light',
    usedTemplateIds: ['HERO', 'CHECKLIST'],
    allowImageLayouts: true,
  },
);
assert.equal(actualCtaSelection.templateId, 'HERO');

const clonedVisualProfiles: TemplateProfile[] = [
  makeProfile({
    templateId: 'info-like-a',
    capabilities: { list: 0.92 },
    visualWeight: 'light',
    contentMode: 'list',
    textCapacity: { min: 20, max: 240 },
    itemCapacity: { min: 3, max: 6 },
    preferredTextDensity: 'medium',
    preferredPositions: ['middle'],
    visualFamily: 'info-a',
    renderSignature: 'same-list-shape',
  }),
  makeProfile({
    templateId: 'info-like-b',
    capabilities: { list: 0.91 },
    visualWeight: 'light',
    contentMode: 'list',
    textCapacity: { min: 20, max: 240 },
    itemCapacity: { min: 3, max: 6 },
    preferredTextDensity: 'medium',
    preferredPositions: ['middle'],
    visualFamily: 'info-b',
    renderSignature: 'same-list-shape',
  }),
  makeProfile({
    templateId: 'real-alternative',
    capabilities: { list: 0.84 },
    visualWeight: 'medium',
    contentMode: 'list',
    textCapacity: { min: 20, max: 240 },
    itemCapacity: { min: 3, max: 6 },
    preferredTextDensity: 'medium',
    preferredPositions: ['middle'],
    visualFamily: 'cards',
    renderSignature: 'stacked-cards',
  }),
];

const contentSelectionAgainstClone = selectContentTemplate(
  listWithImage,
  {
    ...middleContext,
    previousTemplateId: 'info-like-a',
    previousVisualFamily: 'info-a',
    previousRenderSignature: 'same-list-shape',
    usedTemplateIds: ['info-like-a'],
    usedVisualFamilies: ['info-a'],
    usedRenderSignatures: ['same-list-shape'],
  },
  clonedVisualProfiles,
);

assert.equal(contentSelectionAgainstClone.templateId, 'BOX_GRID');

const emptyFallbackSelection = selectContentTemplate(shortVisualList, middleContext, []);
assert.equal(emptyFallbackSelection.templateId, 'HERO');

assert.equal(getTemplateProfile('HERO')?.visualFamily, 'hero');
assert.equal(getTemplateProfile('HERO')?.renderSignature, 'hero-copy');
assert.ok((getTemplateProfile('HERO')?.capabilities.intro ?? 0) > 0.8);
assert.deepEqual(getTemplateProfile('CHECKLIST')?.itemCapacity, { min: 2, max: 6 });
assert.equal(getTemplateProfile('HERO_STATEMENT'), undefined);
assert.equal(getTemplateProfile('SOCIAL_CHECKLIST'), undefined);
assert.ok(TEMPLATE_PROFILES.length > 0);

console.log('template-selector.test.ts passed');
