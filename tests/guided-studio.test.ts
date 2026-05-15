import assert from 'node:assert/strict';
import {
  FINISH_PRESETS,
  GUIDED_START_ACTIONS,
  GUIDED_STEPS,
  VISUAL_PRESETS,
  getGuidedReviewIssues,
  getGuidedScriptSummary,
  getSlideImageGuidance,
} from '../utils/guided-studio.ts';

assert.deepEqual(GUIDED_STEPS.map((step) => step.id), [
  'client',
  'visual',
  'script',
  'images',
  'finish',
  'review',
]);

assert.deepEqual(GUIDED_START_ACTIONS.map((action) => action.id), [
  'script',
  'import',
  'advanced',
]);

assert.equal(
  getGuidedScriptSummary([
    { cover: {}, blocks: [] },
    { contentTemplate: 'HERO', blocks: [{ type: 'TITLE', content: 'A' }] },
    { contentTemplate: 'CHECKLIST', blocks: [{ type: 'LIST', content: ['A'] }] },
    { blocks: [{ type: 'BADGE', content: 'CTA', options: { semanticRole: 'cta' } }] },
  ] as any),
  'Encontramos 4 slides: 1 capa, 1 explicativo, 1 lista e 1 CTA.',
);

assert.equal(getGuidedScriptSummary([]), 'Nenhum slide gerado ainda.');
assert.equal(getSlideImageGuidance({ cover: {}, blocks: [] } as any, 0).status, 'optional');
assert.equal(getSlideImageGuidance({ imageLayout: 'IMAGE_STAGE_RIGHT', blocks: [] } as any, 1).status, 'recommended');
assert.equal(getSlideImageGuidance({ image: { url: 'x' }, imageLayout: 'IMAGE_STAGE_RIGHT', blocks: [] } as any, 1).status, 'ok');
assert.equal(getSlideImageGuidance({ imageLayout: 'IMAGE_NONE', blocks: [] } as any, 2).status, 'not-needed');
assert.ok(VISUAL_PRESETS.some((preset) => preset.id === 'medical-discreet'));
assert.ok(FINISH_PRESETS.some((preset) => preset.id === 'cinematic-light'));

const issues = getGuidedReviewIssues([
  { cover: {}, blocks: [] },
  { imageLayout: 'IMAGE_STAGE_RIGHT', blocks: [] },
  { imageLayout: 'IMAGE_NONE', blocks: [], options: { background: '#ffffff', text: '#f7f7f7' } },
] as any);

assert.ok(issues.some((issue) => issue.type === 'image-recommended'));
assert.ok(issues.some((issue) => issue.type === 'contrast-low'));

console.log('guided-studio.test.ts passed');
