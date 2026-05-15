import assert from 'node:assert/strict';
import React from 'react';
import { renderToStaticMarkup } from 'react-dom/server';
import { UserRenderer } from '../renderers/blocks/UserRenderer.tsx';
import type { Block, Theme } from '../types.ts';

const theme: Theme = {
  name: 'test',
  typography: {
    fontFamily: 'Inter',
    hero: 'hero',
    title: 'title',
    paragraph: 'paragraph',
    body: 'body',
    small: 'small',
    titleWeight: 700,
    letterSpacingTitle: '0',
  },
  colors: {
    background: '#000',
    textPrimary: '#fff',
    textSecondary: '#ddd',
    accent: '#41A8F5',
    muted: '#666',
    highlight: '#41A8F5',
    hlBgColor: '#41A8F5',
    hlTextColor: '#fff',
    cardBg: '#41A8F5',
    cardTextColor: '#000',
  },
  spacing: {
    canvasPadding: '0',
    blockGap: '0',
    sectionGap: '0',
  },
  backgrounds: {},
};

const socialUserBlock: Block = {
  type: 'USER',
  content: 'Dra. Camila',
  options: {
    handle: '@dracamila',
    avatar: 'https://example.com/profile.jpg',
    variant: 'twitter-post',
    align: 'center',
  },
};

const socialUserMarkup = renderToStaticMarkup(
  React.createElement(UserRenderer, { block: socialUserBlock, theme }),
);

assert.match(socialUserMarkup, /Dra\. Camila/);
assert.match(socialUserMarkup, /@dracamila/);
assert.match(socialUserMarkup, /profile\.jpg/);
assert.match(socialUserMarkup, /data-user-variant="twitter-post"/);
assert.match(socialUserMarkup, /justify-start/);
assert.match(socialUserMarkup, /items-center/);
assert.match(socialUserMarkup, /w-24 h-24/);
assert.match(socialUserMarkup, /font-size:30px/);
assert.match(socialUserMarkup, /font-size:22px/);
assert.match(socialUserMarkup, /text-left/);
assert.match(socialUserMarkup, /w-full/);
assert.match(socialUserMarkup, /block w-full font-black tracking-tight text-left/);

console.log('user-renderer.test.tsx passed');
