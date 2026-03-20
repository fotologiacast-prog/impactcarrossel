import assert from 'node:assert/strict';
import { carouselSchema } from '../template-dsl/schema.ts';
import {
  applyProjectClientToSlide,
  applyBrandThemeToSlides,
  createDarkenedOverlayColor,
  createBrandThemeFromPreset,
  getFontFaceDefinition,
  getBrandPaletteSwatches,
  getDirectionalSampleRegion,
  getPreferredFontsForInjection,
  getContrastTextColor,
  mergeSlideOptionsWithBrandTheme,
  normalizeFontFamilyName,
  syncBrandThemeFontFamilies,
  rgbToHex,
  resolveFontPreference,
} from '../utils/branding.ts';

const presetTheme = createBrandThemeFromPreset({
  id: 'preset-1',
  name: 'Cliente A',
  colors: ['#101010', '#F4F4F4', '#ff0055'],
  font_padrao: 'Inter',
  font_destaque: 'Playfair Display',
});

const resolvedPresetTheme = createBrandThemeFromPreset(
  {
    id: 'preset-2',
    name: 'Cliente B',
    colors: ['#101010', '#F4F4F4', '#ff0055'],
    font_padrao: 'Merriweather',
    font_destaque: 'Oswald',
  },
  [
    { family: 'Merriweather Regular', name: 'Merriweather Regular' },
    { family: 'Oswald', name: 'Oswald' },
  ],
);

assert.equal(presetTheme.paletteId, 'preset-1');
assert.deepEqual(presetTheme.colors, ['#101010', '#F4F4F4', '#FF0055']);
assert.equal(presetTheme.background, '#101010');
assert.equal(presetTheme.accent, '#ff0055');
assert.equal(presetTheme.white, '#F5F3EE');
assert.equal(presetTheme.black, '#141414');
assert.equal(presetTheme.text, '#F5F3EE');
assert.equal(presetTheme.cardTextColor, getContrastTextColor(presetTheme.cardBg));
assert.equal(presetTheme.hlTextColor, getContrastTextColor(presetTheme.hlBgColor));
assert.equal(resolvedPresetTheme.fontPadrão, 'Merriweather Regular');
assert.equal(resolvedPresetTheme.fontDestaque, 'Oswald');

assert.equal(getContrastTextColor('#111111'), '#F5F3EE');
assert.equal(getContrastTextColor('#F5F5F5'), '#141414');
assert.deepEqual(getBrandPaletteSwatches(presetTheme).slice(0, 3), ['#101010', '#F4F4F4', '#FF0055']);

const mergedDark = mergeSlideOptionsWithBrandTheme(
  {
    accent: '#ff0055',
    background: '#111111',
    fontPadrão: 'Inter',
    fontDestaque: 'Playfair Display',
  },
  {},
);

assert.equal(mergedDark.text, '#F5F3EE');
assert.equal(mergedDark.cardBg, '#ff0055');
assert.equal(mergedDark.cardTextColor, getContrastTextColor('#ff0055'));

const mergedWithOverrides = mergeSlideOptionsWithBrandTheme(
  {
    accent: '#ff0055',
    background: '#111111',
    fontPadrão: 'Inter',
    fontDestaque: 'Playfair Display',
  },
  {
    accent: '#00ffaa',
    background: '#fafafa',
    postFX: {
      vignette: 0.1,
    },
  },
  {
    noiseAmount: 0.3,
    vignette: 0.45,
  },
);

assert.equal(mergedWithOverrides.accent, '#00ffaa');
assert.equal(mergedWithOverrides.background, '#fafafa');
assert.equal(mergedWithOverrides.text, '#141414');
assert.equal(mergedWithOverrides.cardBg, '#00ffaa');
assert.equal(mergedWithOverrides.postFX?.noiseAmount, 0.3);
assert.equal(mergedWithOverrides.postFX?.vignette, 0.1);

const mergedWithEmptyFontOverride = mergeSlideOptionsWithBrandTheme(
  {
    fontPadrão: 'Merriweather Regular',
    fontDestaque: 'Oswald',
  },
  {
    fontPadrão: '',
    fontDestaque: '   ',
  },
);

assert.equal(mergedWithEmptyFontOverride.fontPadrão, 'Merriweather Regular');
assert.equal(mergedWithEmptyFontOverride.fontDestaque, 'Oswald');

const syncedThemeFonts = syncBrandThemeFontFamilies(
  {
    paletteId: 'client-1',
    fontPadrão: 'Merriweather',
    fontDestaque: 'Oswald Display',
  } as any,
  [
    { family: 'Merriweather Regular', name: 'Merriweather Regular' },
    { family: 'Oswald', name: 'Oswald Display' },
  ],
);

assert.equal(syncedThemeFonts.fontPadrão, 'Merriweather Regular');
assert.equal(syncedThemeFonts.fontDestaque, 'Oswald');

const preferredFonts = getPreferredFontsForInjection(
  [
    { id: '1', family: 'Sora-VariableFont_wght', name: 'Sora-VariableFont_wght', url: 'https://cdn.example.com/other-sora.ttf', clientId: 'other-client' },
    { id: '2', family: 'Sora-VariableFont_wght', name: 'Sora-VariableFont_wght', url: 'https://cdn.example.com/active-sora.ttf', clientId: 'client-1' },
    { id: '3', family: 'Ritchain', name: 'Ritchain', url: 'https://cdn.example.com/ritchain.ttf', clientId: 'client-1' },
  ],
  'client-1',
);

assert.equal(preferredFonts.length, 2);
assert.equal(preferredFonts[0].url, 'https://cdn.example.com/active-sora.ttf');

const variableFontFace = getFontFaceDefinition({
  family: 'Sora-VariableFont_wght',
  name: 'Sora-VariableFont_wght',
  url: 'https://cdn.example.com/sora.ttf',
} as any);
const staticFontFace = getFontFaceDefinition({
  family: 'Ritchain',
  name: 'Ritchain',
  url: 'https://cdn.example.com/ritchain.otf',
} as any);

assert.equal(variableFontFace.weight, '100 900');
assert.equal(variableFontFace.style, 'normal');
assert.equal(staticFontFace.weight, 'normal');

assert.equal(normalizeFontFamilyName(' Playfair-Display '), 'playfairdisplay');
assert.equal(
  resolveFontPreference('Playfair Display', [
    { family: 'Inter', name: 'Inter' },
    { family: 'Playfair Display', name: 'Playfair_Display-Regular' },
  ]),
  'Playfair Display',
);

const legacyCarousel = carouselSchema.parse({
  slides: [],
  customFonts: [],
});

const brandedCarousel = carouselSchema.parse({
  slides: [],
  customFonts: [],
  projectFX: {
    noiseAmount: 0.22,
    vignette: 0.3,
  },
  brandTheme: {
    paletteId: 'preset-1',
    background: '#111111',
    accent: '#ff0055',
    fontPadrão: 'Inter',
    fontDestaque: 'Playfair Display',
    white: '#F5F3EE',
    black: '#141414',
  },
});

assert.equal(legacyCarousel.slides.length, 0);
assert.equal(brandedCarousel.brandTheme?.paletteId, 'preset-1');
assert.equal(brandedCarousel.projectFX?.noiseAmount, 0.22);

const clientSyncedSlide = applyProjectClientToSlide(
  {
    template: 'SOCIAL_CHECKLIST',
    blocks: [
      {
        type: 'USER',
        content: 'Nome Antigo',
        options: {
          handle: '@antigo',
          avatar: 'https://example.com/old.jpg',
        },
      },
      {
        type: 'LIST',
        content: ['A', 'B'],
      },
    ],
  },
  {
    id: 'client-1',
    name: 'Impact Doctor',
    instagram: 'impactdoctor',
    profilePicture: 'https://example.com/new.jpg',
  },
);

assert.equal(clientSyncedSlide.blocks[0].type, 'USER');
assert.equal(clientSyncedSlide.blocks[0].content, 'Impact Doctor');
assert.equal(clientSyncedSlide.blocks[0].options?.handle, '@impactdoctor');
assert.equal(clientSyncedSlide.blocks[0].options?.avatar, 'https://example.com/new.jpg');

const migratedSlides = applyBrandThemeToSlides(
  [
    {
      template: 'DEFAULT',
      blocks: [],
      options: {
        fontPadrão: 'Inter',
        fontDestaque: 'Instrument Serif',
      },
    },
    {
      template: 'DEFAULT',
      blocks: [],
      options: {
        fontPadrão: 'Playfair Display',
      },
    },
    {
      template: 'DEFAULT',
      blocks: [],
      options: {},
    },
  ],
  {
    fontPadrão: 'Inter',
    fontDestaque: 'Instrument Serif',
  },
);

assert.equal(migratedSlides[0].options?.fontPadrão, undefined);
assert.equal(migratedSlides[0].options?.fontDestaque, undefined);
assert.equal(migratedSlides[1].options?.fontPadrão, 'Playfair Display');
assert.equal(migratedSlides[2].options?.fontPadrão, undefined);

console.log('branding.test.ts passed');

const appearanceCarousel = carouselSchema.parse({
  slides: [
    {
      template: 'FADE',
      image: {
        type: 'IMAGE_BACKGROUND',
      },
      options: {
        fadeSide: 'right',
        fadeStrength: 0.55,
        fadeBlur: 14,
        boxGroupAlign: 'center',
        boxGroupLayout: 'auto',
        contentWidthPercent: 42,
        backgroundOverlayStrength: 0.4,
        backgroundBlur: 10,
        postFX: {
          noiseAmount: 0,
        },
      },
      blocks: [
        {
          type: 'USER',
          content: 'Nome',
          options: {
            nameColor: '#FFAA00',
            widthPercent: 20,
          },
        },
      ],
      slideNumber: 7,
    },
  ],
  projectFX: {
    noiseAmount: 0.3,
    vignette: 0.15,
  },
});

assert.equal(appearanceCarousel.slides[0].template, 'FADE');
assert.equal(appearanceCarousel.slides[0].options?.fadeSide, 'right');
assert.equal(appearanceCarousel.slides[0].options?.fadeStrength, 0.55);
assert.equal(appearanceCarousel.slides[0].options?.fadeBlur, 14);
assert.equal(appearanceCarousel.slides[0].options?.boxGroupAlign, 'center');
assert.equal(appearanceCarousel.slides[0].options?.boxGroupLayout, 'auto');
assert.equal(appearanceCarousel.slides[0].options?.contentWidthPercent, 42);
assert.equal(appearanceCarousel.slides[0].blocks[0].options?.nameColor, '#FFAA00');
assert.equal(appearanceCarousel.slides[0].blocks[0].options?.widthPercent, 20);
assert.equal(appearanceCarousel.slides[0].slideNumber, 7);

const fadeBottomRegion = getDirectionalSampleRegion('bottom', 120, 180);
assert.deepEqual(fadeBottomRegion, { sx: 18, sy: 119, sw: 84, sh: 61 });

const darkenedRed = createDarkenedOverlayColor({ r: 220, g: 80, b: 70 }, 0.58);
assert.equal(rgbToHex(darkenedRed), '#4B1B18');
