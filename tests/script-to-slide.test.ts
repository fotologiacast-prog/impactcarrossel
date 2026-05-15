import assert from 'node:assert/strict';
import { generateSlideFromScript } from '../utils/heuristics/script-to-slide.ts';

const patchBaseSlide = {
  template: 'BOX_GRID',
  contentTemplate: 'BOX_GRID',
  imageLayout: 'IMAGE_BOX_RIGHT',
  slideNumber: 4,
  image: {
    type: 'IMAGE_BOX' as const,
    url: 'https://example.com/box-image.jpg',
    position: 'right' as const,
    width: 460,
    height: 760,
    imageX: 44,
    imageY: -12,
    imageScale: 1.18,
    naturalWidth: 1600,
    naturalHeight: 1200,
  },
  options: {
    background: '#fffaf5',
    accent: '#ff7a59',
    text: '#151515',
    contentWidthPercent: 88,
    postFX: {
      vignette: 0.18,
    },
  },
  blocks: [
    { type: 'TITLE' as const, content: 'Antes' },
    { type: 'PARAGRAPH' as const, content: 'Texto anterior' },
    { type: 'LIST' as const, content: ['Item antigo 1', 'Item antigo 2'] },
  ],
};

const patchResult = generateSlideFromScript(
  `
Título: Verde & Luz Cênica
Subtítulo: Atmosfera que se sente
Texto: O espaço precisa traduzir a proposta logo no primeiro olhar.
Lista:
- Folhagens pendentes
- Luz quente dramática
- Contraste sofisticado
- Ambiente imersivo
`,
  {
    currentSlide: patchBaseSlide as any,
    slideIndex: 3,
    totalSlides: 8,
    slides: [
      { template: 'HERO', contentTemplate: 'HERO', imageLayout: 'IMAGE_NONE', blocks: [{ type: 'TITLE', content: 'Capa' }] },
      { template: 'HERO', contentTemplate: 'HERO', imageLayout: 'IMAGE_NONE', blocks: [{ type: 'TITLE', content: 'Slide 2' }] },
      { template: 'CHECKLIST', contentTemplate: 'CHECKLIST', imageLayout: 'IMAGE_NONE', blocks: [{ type: 'TITLE', content: 'Slide 3' }] },
      patchBaseSlide,
    ] as any,
    mode: 'patch',
    entropy: 0.5,
  },
);

assert.equal(patchResult.contentTemplateId, 'BOX_GRID');
assert.equal(patchResult.imageLayoutId, 'IMAGE_BOX_RIGHT');
assert.equal(patchResult.slide.template, 'BOX_GRID');
assert.equal(patchResult.slide.contentTemplate, 'BOX_GRID');
assert.equal(patchResult.slide.imageLayout, 'IMAGE_BOX_RIGHT');
assert.equal(patchResult.slide.slideNumber, 4);
assert.equal(patchResult.slide.image?.url, 'https://example.com/box-image.jpg');
assert.equal(patchResult.slide.image?.imageX, 44);
assert.equal(patchResult.slide.image?.imageY, -12);
assert.equal(patchResult.slide.options?.background, '#fffaf5');
assert.equal(patchResult.slide.options?.accent, '#ff7a59');
assert.equal(patchResult.slide.options?.contentWidthPercent, 88);
assert.ok(patchResult.slide.blocks.some((block) => block.type === 'TITLE' && block.content === 'Verde & Luz Cênica'));
assert.ok(patchResult.slide.blocks.some((block) => block.type === 'PARAGRAPH' && block.content === 'Atmosfera que se sente'));

const replaceBaseSlide = {
  template: 'HERO',
  contentTemplate: 'HERO',
  imageLayout: 'IMAGE_BACKGROUND',
  slideNumber: 5,
  image: {
    type: 'IMAGE_BACKGROUND' as const,
    url: 'https://example.com/current-hero.jpg',
    overlay: 'dark' as const,
    naturalWidth: 1920,
    naturalHeight: 1080,
  },
  options: {
    background: '#ffffff',
    accent: '#2490ff',
    text: '#111111',
    cardBg: '#2490ff',
    hlBgColor: '#2490ff',
    hlTextColor: '#ffffff',
    postFX: {
      noiseAmount: 0.08,
    },
  },
  blocks: [
    { type: 'TITLE' as const, content: 'Hero antigo' },
    { type: 'PARAGRAPH' as const, content: 'Texto antigo' },
  ],
};

const replaceResult = generateSlideFromScript(
  `
Título: Onde o erro começa
Texto: Valores muito baixos indicam economia em três pilares fatais.
Lista:
- segurança
- tecnologia
- tempo
Imagem: equipe técnica avaliando instalação elétrica
`,
  {
    currentSlide: replaceBaseSlide as any,
    slideIndex: 4,
    totalSlides: 8,
    slides: [
      { template: 'HERO', contentTemplate: 'HERO', imageLayout: 'IMAGE_NONE', blocks: [{ type: 'TITLE', content: 'Capa' }] },
      { template: 'CHECKLIST', contentTemplate: 'CHECKLIST', imageLayout: 'IMAGE_NONE', blocks: [{ type: 'TITLE', content: 'Slide 2' }] },
      { template: 'HERO', contentTemplate: 'HERO', imageLayout: 'IMAGE_BACKGROUND', blocks: [{ type: 'TITLE', content: 'Slide 3' }] },
      { template: 'STAT', contentTemplate: 'STAT', imageLayout: 'IMAGE_NONE', blocks: [{ type: 'TITLE', content: 'Slide 4' }] },
      replaceBaseSlide,
    ] as any,
    mode: 'replace',
    entropy: 0.5,
  },
);

assert.equal(replaceResult.slide.contentTemplate, 'BOX_GRID');
assert.equal(replaceResult.slide.slideNumber, 5);
assert.equal(replaceResult.slide.options?.background, '#ffffff');
assert.equal(replaceResult.slide.options?.accent, '#2490ff');
assert.equal(replaceResult.slide.options?.postFX?.noiseAmount, 0.08);
assert.equal(replaceResult.slide.image?.url, 'https://example.com/current-hero.jpg');
assert.equal(replaceResult.imageLayoutId, 'IMAGE_BOX_RIGHT');
assert.ok(replaceResult.slide.blocks.some((block) => block.type === 'TITLE' && block.content === 'Onde o erro começa'));
assert.ok(replaceResult.slide.blocks.some((block) => block.type === 'CARD' && block.content === 'segurança'));

const coverPatchBaseSlide = {
  template: 'HERO',
  contentTemplate: 'HERO',
  imageLayout: 'IMAGE_NONE',
  slideNumber: 1,
  image: {
    type: 'NONE' as const,
  },
  cover: {
    variant: 'COVER_HIERARCHY_HERO' as const,
    profile: {},
    text: {
      eyebrow: 'Antes',
      titleMain: 'Título antigo',
      supportingLine: 'Linha antiga',
    },
    images: {
      backgroundImage: 'https://example.com/cover-bg.jpg',
      foregroundImage: 'https://example.com/cover-fg.png',
      foregroundMode: 'cutout' as const,
    },
    effects: {
      darkOverlay: true,
      topShade: true,
      bottomGlow: true,
      textShadow: true,
      contrastMode: 'balanced' as const,
    },
  },
  blocks: [
    { type: 'TITLE' as const, content: 'Título antigo' },
  ],
};

const coverPatchResult = generateSlideFromScript(
  `
Título: Nem toda dor na bexiga
Subtítulo: Quando o sintoma engana
Texto: Às vezes o problema não nasce no sistema urinário.
`,
  {
    currentSlide: coverPatchBaseSlide as any,
    slideIndex: 0,
    totalSlides: 8,
    slides: [coverPatchBaseSlide] as any,
    mode: 'patch',
    entropy: 0.5,
  },
);

assert.equal(coverPatchResult.slide.cover?.text?.titleMain, 'Nem toda dor na bexiga');
assert.equal(coverPatchResult.slide.cover?.text?.eyebrow, 'Quando o sintoma engana');
assert.equal(coverPatchResult.slide.cover?.text?.supportingLine, 'Às vezes o problema não nasce no sistema urinário.');
assert.equal(coverPatchResult.slide.cover?.images?.backgroundImage, 'https://example.com/cover-bg.jpg');
assert.equal(coverPatchResult.slide.cover?.images?.foregroundImage, 'https://example.com/cover-fg.png');

console.log('script-to-slide.test.ts passed');
