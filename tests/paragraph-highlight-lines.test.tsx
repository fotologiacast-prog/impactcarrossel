import assert from 'node:assert/strict';
import React from 'react';
import { renderToStaticMarkup } from 'react-dom/server';
import { TOKENS } from '../design-tokens/tokens.ts';
import { ParagraphRenderer } from '../renderers/blocks/ParagraphRenderer.tsx';

const markup = renderToStaticMarkup(
  React.createElement(ParagraphRenderer, {
    theme: TOKENS,
    block: {
      type: 'PARAGRAPH',
      content: '[[E confiança reduz]]\n[[resistência à compra!]]',
      options: {
        semanticRole: 'highlight',
        fontSize: 34,
        fontWeight: 900,
        backgroundColor: '#38bdf8',
        color: '#ffffff',
      },
    },
  }),
);

const lines = markup.match(/data-paragraph-highlight-line="true"/g) || [];

assert.equal(lines.length, 2);
assert.match(markup, /E confiança reduz/);
assert.match(markup, /resistência à compra!/);
assert.doesNotMatch(markup, /\[\[|\]\]/);
assert.match(markup, /display:inline-flex/);
assert.match(markup, /flex-direction:column/);
assert.match(markup, /width:fit-content/);
assert.match(markup, /border-radius:8px/);
assert.doesNotMatch(markup, /data-paragraph-highlight-line="true"[^>]*(^|;)width:100%/);

console.log('paragraph-highlight-lines.test.tsx passed');
