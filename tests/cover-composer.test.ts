import assert from 'node:assert/strict';
import React from 'react';
import { renderToStaticMarkup } from 'react-dom/server';
import { carouselSchema } from '../template-dsl/schema.ts';
import { composeCoverSlide } from '../utils/covers/cover-composer.ts';
import { buildCoverProfileBadge } from '../utils/covers/cover-profile.ts';
import { CoverCanvas } from '../renderers/CoverCanvas.tsx';
import type { Theme } from '../types.ts';

const payload = {
  slides: [
    {
      template: 'HERO',
      cover: {
        variant: 'COVER_HIERARCHY_HERO',
        profile: {
          handle: '@drteste',
          displayName: 'Dr. Teste',
          meta: 'CRM 99999 | RQE 0000',
          avatar: 'https://example.com/avatar.jpg',
        },
        text: {
          eyebrow: 'Você respira mal ou acha que é',
          titleTop: 'só',
          titleMain: 'rinite?',
          supportingLine: 'Entenda os sinais que podem indicar algo além de uma alergia comum.',
        },
        textOptions: {
          eyebrow: {
            fontSize: 28,
            textAlign: 'left',
          },
        },
        images: {
          backgroundImage: 'https://example.com/background.jpg',
          backgroundX: -36,
          backgroundY: 18,
          backgroundScale: 1.24,
          backgroundBlur: 6,
          foregroundImage: 'https://example.com/foreground.png',
          foregroundMode: 'cutout',
        },
        effects: {
          darkOverlay: true,
          topShade: true,
          bottomGlow: true,
          textShadow: true,
          contrastMode: 'high',
        },
      },
      image: {
        type: 'IMAGE_BOX',
        width: 690,
        height: 920,
        boxX: 18,
        boxY: -24,
        boxScale: 1.12,
        boxRotation: 3,
        imageX: 12,
        imageY: -8,
        imageScale: 1.08,
        imageRotation: -4,
        backgroundOpacity: 0.66,
      },
      blocks: [],
    },
  ],
};

const result = carouselSchema.safeParse(payload);

assert.equal(result.success, true);
assert.equal(result.success ? result.data.slides[0]?.cover?.variant : undefined, 'COVER_HIERARCHY_HERO');
assert.equal(result.success ? result.data.slides[0]?.template : undefined, 'HERO');
assert.equal(result.success ? result.data.slides[0]?.cover?.profile?.meta : undefined, 'CRM 99999 | RQE 0000');
assert.equal(result.success ? result.data.slides[0]?.cover?.textOptions?.eyebrow?.fontSize : undefined, 28);
assert.equal(result.success ? result.data.slides[0]?.image?.width : undefined, 690);
assert.equal(result.success ? result.data.slides[0]?.cover?.images?.backgroundScale : undefined, 1.24);

const profileWithMeta = buildCoverProfileBadge({
  name: 'Dra. Camila',
  instagram: 'dracamila',
  profilePicture: 'https://example.com/profile.jpg',
  crm: '12345',
  rqe: '6789',
});

assert.equal(profileWithMeta.displayName, 'Dra. Camila');
assert.equal(profileWithMeta.handle, '@dracamila');
assert.equal(profileWithMeta.avatar, 'https://example.com/profile.jpg');
assert.equal(profileWithMeta.meta, 'CRM 12345 | RQE 6789');

const profileWithoutMeta = buildCoverProfileBadge({
  name: 'Clínica Exemplo',
  instagram: null,
  profilePicture: null,
});

assert.equal(profileWithoutMeta.displayName, 'Clínica Exemplo');
assert.equal(profileWithoutMeta.handle, undefined);
assert.equal(profileWithoutMeta.avatar, undefined);
assert.equal(profileWithoutMeta.meta, undefined);

const composedCoverSlide = composeCoverSlide(
  {
    index: 1,
    raw: 'Slide 1',
    lines: [],
    title: 'só rinite?',
    subtitle: 'Você respira mal ou acha que é',
    text: 'Entenda os sinais que podem indicar algo além de uma alergia comum.',
    imagePrompt: 'https://example.com/background.jpg',
    bodyLines: [],
    listItems: [],
    signals: {
      hasExplicitList: false,
      hasImplicitList: false,
      hasNumberStat: false,
      hasComparison: false,
      hasQuestion: false,
      hasCTA: false,
    },
  },
  profileWithMeta,
);

assert.equal(composedCoverSlide.cover?.variant, 'COVER_HIERARCHY_HERO');
assert.equal(composedCoverSlide.template, 'HERO');
assert.equal(composedCoverSlide.cover?.profile?.meta, 'CRM 12345 | RQE 6789');
assert.equal(composedCoverSlide.cover?.text?.eyebrow, 'Você respira mal ou acha que é');
assert.equal(composedCoverSlide.cover?.text?.titleMain, 'só rinite?');
assert.equal(composedCoverSlide.cover?.text?.supportingLine, 'Entenda os sinais que podem indicar algo além de uma alergia comum.');
assert.equal(composedCoverSlide.cover?.images?.backgroundImage, 'https://example.com/background.jpg');
assert.equal(composedCoverSlide.cover?.images?.foregroundImage, undefined);
assert.equal(composedCoverSlide.cover?.effects?.bottomGlow, true);

const composedStructuredCoverSlide = composeCoverSlide(
  {
    index: 1,
    kind: 'cover',
    raw: 'Capa',
    lines: [],
    title: '[[Quatro pilares técnicos]]',
    subtitle: 'O checklist de proteção para o reajuste anual.',
    text: 'para blindar o caixa da sua farmácia.',
    imagePrompt: 'https://example.com/background-structured.jpg',
    cover: {
      supportTop: 'O checklist de proteção para o reajuste anual.',
      highlight: '[[Quatro pilares técnicos]]',
      supportBottom: 'para blindar o caixa da sua farmácia.',
      backgroundImage: 'https://example.com/background-structured.jpg',
      foregroundImage: 'https://example.com/foreground-structured.png',
      supportTopMeta: { raw: '', text: 'O checklist de proteção para o reajuste anual.', iconHints: [] },
      highlightMeta: { raw: '', text: '[[Quatro pilares técnicos]]', iconHints: [] },
      supportBottomMeta: { raw: '', text: 'para blindar o caixa da sua farmácia.', iconHints: [] },
      backgroundImageMeta: { raw: '', text: 'https://example.com/background-structured.jpg', iconHints: [] },
      foregroundImageMeta: { raw: '', text: 'https://example.com/foreground-structured.png', iconHints: [] },
    },
    bodyLines: [],
    listItems: [],
    signals: {
      hasExplicitList: false,
      hasImplicitList: false,
      hasNumberStat: false,
      hasComparison: false,
      hasQuestion: false,
      hasCTA: false,
    },
  },
  profileWithMeta,
);

assert.equal(composedStructuredCoverSlide.cover?.images?.backgroundImage, 'https://example.com/background-structured.jpg');
assert.equal(composedStructuredCoverSlide.cover?.images?.foregroundImage, 'https://example.com/foreground-structured.png');
assert.equal(composedStructuredCoverSlide.cover?.images?.foregroundMode, 'cutout');

const composedFormattedCoverSlide = composeCoverSlide(
  {
    index: 1,
    kind: 'cover',
    raw: 'Capa',
    lines: [],
    title: '[[Quatro pilares]] e **método**',
    subtitle: '**Checklist** para sua equipe',
    text: 'Use [[dados reais]] e revisão **técnica** para decidir melhor.',
    bodyLines: [],
    listItems: [],
    signals: {
      hasExplicitList: false,
      hasImplicitList: false,
      hasNumberStat: false,
      hasComparison: false,
      hasQuestion: false,
      hasCTA: false,
    },
  },
  profileWithMeta,
);

const theme: Theme = {
  name: 'test',
  typography: {
    fontFamily: 'Inter',
    fontFamilySecondary: 'Cormorant Garamond',
    hero: 'hero',
    title: 'title',
    paragraph: 'paragraph',
    body: 'body',
    small: 'small',
    titleWeight: 700,
    letterSpacingTitle: '0',
  },
  colors: {
    background: '#D2A24E',
    textPrimary: '#FFFFFF',
    textSecondary: 'rgba(255,255,255,0.86)',
    accent: '#D8A54A',
    muted: '#666',
    highlight: '#D8A54A',
    cardBg: '#FFFFFF',
    cardTextColor: '#1E1E1E',
    hlBgColor: '#D8A54A',
    hlTextColor: '#1E1E1E',
    white: '#FFFFFF',
    black: '#1E1E1E',
  },
  spacing: {
    canvasPadding: '0',
    blockGap: '0',
    sectionGap: '0',
  },
  backgrounds: {},
};

const configuredCoverMarkup = renderToStaticMarkup(
  React.createElement(CoverCanvas, {
    slide: result.success ? result.data.slides[0] : payload.slides[0] as any,
    theme,
    options: {
      background: '#D2A24E',
      accent: '#D8A54A',
      text: '#FFFFFF',
      cardBg: '#FFFFFF',
      cardTextColor: '#1E1E1E',
      hlBgColor: '#D8A54A',
      hlTextColor: '#1E1E1E',
      fontPadrão: 'Inter',
      fontDestaque: 'Cormorant Garamond',
    },
  }),
);

const coverMarkup = renderToStaticMarkup(
  React.createElement(CoverCanvas, {
    slide: composedCoverSlide,
    theme,
    options: {
      background: '#D2A24E',
      accent: '#D8A54A',
      text: '#FFFFFF',
      cardBg: '#FFFFFF',
      cardTextColor: '#1E1E1E',
      hlBgColor: '#D8A54A',
      hlTextColor: '#1E1E1E',
      fontPadrão: 'Inter',
      fontDestaque: 'Cormorant Garamond',
    },
  }),
);

const structuredCoverMarkup = renderToStaticMarkup(
  React.createElement(CoverCanvas, {
    slide: composedStructuredCoverSlide,
    theme,
    options: {
      background: '#D2A24E',
      accent: '#D8A54A',
      text: '#FFFFFF',
      cardBg: '#FFFFFF',
      cardTextColor: '#1E1E1E',
      hlBgColor: '#D8A54A',
      hlTextColor: '#1E1E1E',
      fontPadrão: 'Inter',
      fontDestaque: 'Cormorant Garamond',
    },
  }),
);

const formattedCoverMarkup = renderToStaticMarkup(
  React.createElement(CoverCanvas, {
    slide: composedFormattedCoverSlide,
    theme,
    options: {
      background: '#D2A24E',
      accent: '#D8A54A',
      text: '#FFFFFF',
      cardBg: '#FFFFFF',
      cardTextColor: '#1E1E1E',
      hlBgColor: '#D8A54A',
      hlTextColor: '#1E1E1E',
      fontPadrão: 'Inter',
      fontDestaque: 'Cormorant Garamond',
    },
  }),
);

assert.match(coverMarkup, /CRM 12345 \| RQE 6789/);
assert.match(coverMarkup, /@dracamila/);
assert.match(coverMarkup, /Dra\. Camila/);
assert.doesNotMatch(coverMarkup, /data-cover-profile-style="social"/);
assert.match(coverMarkup, /só rinite\?/);
assert.match(coverMarkup, /Você respira mal ou acha que é/);
assert.match(coverMarkup, /Próximo slide/);
assert.match(coverMarkup, /data-cover-content-lift="true"/);
assert.match(coverMarkup, /translateY\(-56px\)/);
assert.match(structuredCoverMarkup, /https:\/\/example\.com\/foreground-structured\.png/);
assert.match(structuredCoverMarkup, /Próximo slide/);
assert.match(formattedCoverMarkup, /Quatro pilares/);
assert.match(formattedCoverMarkup, /Checklist/);
assert.match(formattedCoverMarkup, /dados reais/);
assert.match(formattedCoverMarkup, /font-weight:900/);
assert.doesNotMatch(formattedCoverMarkup, /\[\[|\]\]|\*\*/);
assert.match(configuredCoverMarkup, /font-size:28px/);
assert.match(configuredCoverMarkup, /text-align:left/);
assert.match(configuredCoverMarkup, /background-position:calc\(50% \+ -36px\) calc\(50% \+ 18px\)/);
assert.match(configuredCoverMarkup, /background-size:124%/);
assert.match(configuredCoverMarkup, /filter:blur\(2\.52px\)/);
assert.match(configuredCoverMarkup, /filter:blur\(4\.68px\)/);
assert.match(configuredCoverMarkup, /mask-image:linear-gradient\(to top/);
assert.match(configuredCoverMarkup, /translate\(18px, -24px\) scale\(1.12\) rotate\(3deg\)/);
assert.match(configuredCoverMarkup, /scale\(1.08\) rotate\(-4deg\)/);
assert.match(configuredCoverMarkup, /opacity:0.66/);
assert.match(configuredCoverMarkup, /@drteste/);
assert.match(configuredCoverMarkup, /Dr\. Teste/);
assert.match(configuredCoverMarkup, /CRM 99999 \| RQE 0000/);
assert.match(configuredCoverMarkup, /avatar\.jpg/);
assert.doesNotMatch(configuredCoverMarkup, /data-cover-profile-style="social"/);

console.log('cover-composer.test.ts passed');
