import assert from 'node:assert/strict';
import React from 'react';
import { renderToStaticMarkup } from 'react-dom/server';
import { TOKENS } from '../design-tokens/tokens.ts';
import { TitleRenderer } from '../renderers/blocks/TitleRenderer.tsx';
import { ParagraphRenderer } from '../renderers/blocks/ParagraphRenderer.tsx';
import { BadgeRenderer } from '../renderers/blocks/BadgeRenderer.tsx';
import { UserRenderer } from '../renderers/blocks/UserRenderer.tsx';

const theme = {
  ...TOKENS,
  typography: {
    ...TOKENS.typography,
    fontFamily: 'Inter',
    fontFamilySecondary: 'Montserrat',
  },
};

const titleMarkup = renderToStaticMarkup(
  React.createElement(TitleRenderer, {
    block: {
      type: 'TITLE',
      content: 'Titulo com fonte manual',
      options: { fontFamily: 'Instrument Serif', fontVariant: 'padrão' },
    },
    theme,
  }),
);

const paragraphMarkup = renderToStaticMarkup(
  React.createElement(ParagraphRenderer, {
    block: {
      type: 'PARAGRAPH',
      content: 'Texto com fonte manual',
      options: { fontFamily: 'Playfair Display', fontVariant: 'padrão' },
    },
    theme,
  }),
);

const badgeMarkup = renderToStaticMarkup(
  React.createElement(BadgeRenderer, {
    block: {
      type: 'BADGE',
      content: 'Badge com fonte manual',
      options: { fontFamily: 'Bebas Neue', fontVariant: 'padrão' },
    },
    theme,
  }),
);

const userMarkup = renderToStaticMarkup(
  React.createElement(UserRenderer, {
    block: {
      type: 'USER',
      content: 'Nome',
      options: { fontFamily: 'Syne', handle: '@nome' },
    },
    theme,
  }),
);

assert.match(titleMarkup, /font-family:&quot;Instrument Serif&quot;/);
assert.match(paragraphMarkup, /font-family:&quot;Playfair Display&quot;/);
assert.match(badgeMarkup, /font-family:&quot;Bebas Neue&quot;/);
assert.match(userMarkup, /font-family:&quot;Syne&quot;/);

console.log('block-font-family-override.test.tsx passed');
