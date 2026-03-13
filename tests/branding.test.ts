import assert from 'node:assert/strict';
import { carouselSchema } from '../template-dsl/schema.ts';
import {
  applyProjectClientToSlide,
  createDarkenedOverlayColor,
  createBrandThemeFromPreset,
  getBrandPaletteSwatches,
  getDirectionalSampleRegion,
  getContrastTextColor,
  mergeSlideOptionsWithBrandTheme,
  normalizeFontFamilyName,
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

assert.equal(presetTheme.paletteId, 'preset-1');
assert.deepEqual(presetTheme.colors, ['#101010', '#F4F4F4', '#FF0055']);
assert.equal(presetTheme.background, '#101010');
assert.equal(presetTheme.accent, '#ff0055');
assert.equal(presetTheme.white, '#F5F3EE');
assert.equal(presetTheme.black, '#141414');
assert.equal(presetTheme.text, '#F5F3EE');
assert.equal(presetTheme.cardTextColor, getContrastTextColor(presetTheme.cardBg));
assert.equal(presetTheme.hlTextColor, getContrastTextColor(presetTheme.hlBgColor));

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
