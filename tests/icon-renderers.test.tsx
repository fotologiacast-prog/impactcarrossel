import assert from 'node:assert/strict';
import React from 'react';
import { renderToStaticMarkup } from 'react-dom/server';
import { BoxRenderer } from '../renderers/blocks/BoxRenderer.tsx';
import { CardRenderer } from '../renderers/blocks/CardRenderer.tsx';
import { BadgeRenderer } from '../renderers/blocks/BadgeRenderer.tsx';
import { ListRenderer } from '../renderers/blocks/ListRenderer.tsx';
import { ParagraphRenderer } from '../renderers/blocks/ParagraphRenderer.tsx';
import { TitleRenderer } from '../renderers/blocks/TitleRenderer.tsx';
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

const boxBlock: Block = {
  type: 'BOX',
  content: 'Tensao',
  options: {
    icon: 'Zap',
    fontSize: 32,
  },
};

const cardBlock: Block = {
  type: 'CARD',
  content: 'Corrente',
  options: {
    icon: 'Plug',
    fontSize: 30,
  },
};

const badgeBlock: Block = {
  type: 'BADGE',
  content: 'Chamar agora',
  options: {
    icon: 'Phone',
    variant: 'pill',
    fontSize: 26,
  },
};

const ctaBadgeBlock: Block = {
  type: 'BADGE',
  content: 'Salva esse conteúdo para lembrar disso.',
  options: {
    icon: 'Bookmark',
    variant: 'pill',
    semanticRole: 'cta',
    fontSize: 36,
    fontWeight: 900,
  },
};

const manualColorCtaBadgeBlock: Block = {
  type: 'BADGE',
  content: 'Salve este conteúdo para não esquecer!',
  options: {
    icon: 'Bookmark',
    variant: 'pill',
    semanticRole: 'cta',
    color: '#101010',
    backgroundColor: '#ffffff',
    fontSize: 32,
    fontWeight: 900,
  },
};

const legacyLongCtaBadgeBlock: Block = {
  type: 'BADGE',
  content: 'Salva esse carrossel e coloca um desses hábitos em prática hoje.',
  options: {
    variant: 'pill',
    fontSize: 26,
    fontWeight: 900,
  },
};

const compactLongBadgeBlock: Block = {
  type: 'BADGE',
  content: 'Cuidar da causa acelera o resultado.',
  options: {
    icon: 'Gauge',
    variant: 'pill',
    fontSize: 26,
    fontWeight: 900,
  },
};

const listBlock: Block = {
  type: 'LIST',
  content: ['Genetica'],
  options: {
    variant: 'check-list',
    itemIcons: ['Dna'],
  },
};

const editorialHighlightBlock: Block = {
  type: 'PARAGRAPH',
  content: '[[Mostre o depois.]]\n[[Mostre o sentimento.]]',
  options: {
    semanticRole: 'highlight',
    align: 'center',
    fontSize: 34,
    fontWeight: 900,
    lineHeight: 1.18,
  },
};

const manualColorHighlightBlock: Block = {
  type: 'PARAGRAPH',
  content: '[[Cor individual do destaque.]]',
  options: {
    semanticRole: 'highlight',
    color: '#111111',
    backgroundColor: '#ffffff',
    fontSize: 34,
    fontWeight: 900,
  },
};

const manualColorTitleHighlightBlock: Block = {
  type: 'TITLE',
  content: 'O [[destaque]] mudou.',
  options: {
    highlightBackgroundColor: '#ffffff',
    fontSize: 72,
    fontWeight: 900,
  },
};

const semanticHighlightBoxBlock: Block = {
  type: 'BOX',
  content: '[[Não é sobre alívio rápido. É sobre resolver de verdade.]]',
  options: {
    semanticRole: 'highlight',
    backgroundColor: '#255d7b',
    fontSize: 32,
    fontWeight: 900,
  },
};

const boxMarkup = renderToStaticMarkup(React.createElement(BoxRenderer, { block: boxBlock, theme }));
const semanticHighlightBoxMarkup = renderToStaticMarkup(React.createElement(BoxRenderer, { block: semanticHighlightBoxBlock, theme }));
const compactBoxMarkup = renderToStaticMarkup(
  React.createElement(BoxRenderer, {
    block: {
      ...boxBlock,
      content: 'Cenário arquitetônico',
      options: {
        ...boxBlock.options,
        icon: 'CircleDot',
        fontSize: 36,
      },
    },
    theme,
    isGridMember: true,
    totalInGroup: 4,
    groupLayout: 'grid',
    layoutContext: {
      compactLayout: {
        isCompact: true,
        availableWidth: 420,
        availableHeight: 700,
        sourceLayoutId: 'IMAGE_STAGE_RIGHT',
      },
    },
  } as any),
);
const cardMarkup = renderToStaticMarkup(React.createElement(CardRenderer, { block: cardBlock, theme }));
const badgeMarkup = renderToStaticMarkup(React.createElement(BadgeRenderer, { block: badgeBlock, theme, onEditIcon: () => undefined }));
const legacyLongCtaBadgeMarkup = renderToStaticMarkup(React.createElement(BadgeRenderer, { block: legacyLongCtaBadgeBlock, theme }));
const compactLongBadgeMarkup = renderToStaticMarkup(React.createElement(BadgeRenderer, { block: compactLongBadgeBlock, theme }));
const ctaBadgeMarkup = renderToStaticMarkup(React.createElement(BadgeRenderer, { block: ctaBadgeBlock, theme, onEditIcon: () => undefined }));
const manualColorCtaBadgeMarkup = renderToStaticMarkup(React.createElement(BadgeRenderer, { block: manualColorCtaBadgeBlock, theme }));
const compactCtaBadgeMarkup = renderToStaticMarkup(React.createElement(BadgeRenderer, {
  block: ctaBadgeBlock,
  theme,
  layoutContext: {
    compactLayout: {
      isCompact: true,
      availableWidth: 360,
      availableHeight: 260,
      sourceLayoutId: 'IMAGE_STAGE_RIGHT',
    },
  },
} as any));
const listMarkup = renderToStaticMarkup(React.createElement(ListRenderer, { block: listBlock, theme, onEditIcon: () => undefined }));
const editorialHighlightMarkup = renderToStaticMarkup(React.createElement(ParagraphRenderer, { block: editorialHighlightBlock, theme }));
const manualColorHighlightMarkup = renderToStaticMarkup(React.createElement(ParagraphRenderer, { block: manualColorHighlightBlock, theme }));
const manualColorTitleHighlightMarkup = renderToStaticMarkup(React.createElement(TitleRenderer, { block: manualColorTitleHighlightBlock, theme }));
const fullMarkupHighlightMarkup = renderToStaticMarkup(React.createElement(ParagraphRenderer, {
  block: {
    type: 'PARAGRAPH',
    content: '[[Entender o cronotipo do seu filho, faz toda a diferença. Bebê matutino, dorme por volta das 19h, já um bebê vespertino, por volta das 21h]]',
    options: {
      fontSize: 34,
      fontWeight: 900,
      lineHeight: 1.18,
    },
  },
  theme,
}));
const longEditorialHighlightMarkup = renderToStaticMarkup(React.createElement(ParagraphRenderer, {
  block: {
    type: 'PARAGRAPH',
    content: '[[Entender o cronotipo do seu filho, faz toda a diferença. Bebê matutino, dorme por volta das 19h, já um bebê vespertino, por volta das 21h]]',
    options: {
      semanticRole: 'highlight',
      fontSize: 34,
      fontWeight: 900,
      lineHeight: 1.18,
    },
  },
  theme,
}));

assert.match(boxMarkup, /stroke-width="2\.45"/);
assert.match(boxMarkup, /width="152"/);
assert.match(boxMarkup, /padding:72px/);
assert.match(boxMarkup, /border-radius:76px/);
assert.match(boxMarkup, /min-height:384px/);
assert.match(compactBoxMarkup, /data-box-compact="true"/);
assert.match(compactBoxMarkup, /data-box-micro-card="true"/);
assert.match(compactBoxMarkup, /padding:14px 12px 14px/);
assert.match(compactBoxMarkup, /gap-2\.5/);
assert.match(compactBoxMarkup, /justify-between/);
assert.match(compactBoxMarkup, /width="32"/);
assert.match(compactBoxMarkup, /min-height:128px/);
assert.match(compactBoxMarkup, /font-size:15px/);
assert.match(compactBoxMarkup, /text-wrap:balance/);
assert.match(compactBoxMarkup, /overflow-wrap:anywhere/);
assert.match(cardMarkup, /stroke-width="2\.35"/);
assert.match(cardMarkup, /width="84"/);
assert.match(cardMarkup, /gap-10 p-12/);
assert.match(cardMarkup, /border-radius:46px/);
assert.match(badgeMarkup, /stroke-width="2\.2"/);
assert.match(badgeMarkup, /data-badge-pill-inline="true"/);
assert.match(badgeMarkup, /padding:12px 28px/);
assert.match(badgeMarkup, /border-radius:19px/);
assert.doesNotMatch(badgeMarkup, /background-color:#ffffff/);
assert.match(legacyLongCtaBadgeMarkup, /data-badge-wide-pill="true"/);
assert.match(legacyLongCtaBadgeMarkup, /width:min\(100%, 420px\)/);
assert.match(legacyLongCtaBadgeMarkup, /white-space:normal/);
assert.doesNotMatch(legacyLongCtaBadgeMarkup, /Salva esse carrossel\n/);
assert.match(compactLongBadgeMarkup, /data-badge-pill-label="true"/);
assert.match(compactLongBadgeMarkup, /white-space:pre-line/);
assert.match(compactLongBadgeMarkup, /max-width:300px/);
assert.doesNotMatch(compactLongBadgeMarkup, /causa acelera o\nresultado/);
assert.match(badgeMarkup, /data-edit-icon-target="badge"/);
assert.match(ctaBadgeMarkup, /data-badge-cta-button="true"/);
assert.match(ctaBadgeMarkup, /grid-template-columns:92px 1px minmax\(0, 1fr\)/);
assert.match(ctaBadgeMarkup, /min-height:132px/);
assert.match(ctaBadgeMarkup, /border-radius:34px/);
assert.match(ctaBadgeMarkup, /font-size:36px/);
assert.match(ctaBadgeMarkup, /white-space:normal/);
assert.doesNotMatch(ctaBadgeMarkup, /Salva esse conteúdo\npara lembrar disso/);
assert.match(ctaBadgeMarkup, /box-shadow:0 28px 54px/);
assert.match(manualColorCtaBadgeMarkup, /data-badge-cta-button="true"/);
assert.match(manualColorCtaBadgeMarkup, /background:#ffffff/);
assert.match(manualColorCtaBadgeMarkup, /color:#101010/);
assert.doesNotMatch(manualColorCtaBadgeMarkup, /linear-gradient\(180deg, #41A8F5 0%, #41A8F5 100%\)/);
assert.match(compactCtaBadgeMarkup, /data-badge-cta-compact="true"/);
assert.match(compactCtaBadgeMarkup, /grid-template-columns:70px minmax\(0, 1fr\)/);
assert.match(compactCtaBadgeMarkup, /padding:26px 30px/);
assert.match(compactCtaBadgeMarkup, /width:70px/);
assert.doesNotMatch(badgeMarkup, /data-badge-cta-button="true"/);
assert.match(listMarkup, /data-edit-icon-target="list-item"/);
assert.match(listMarkup, /data-edit-icon-index="0"/);
assert.match(editorialHighlightMarkup, /data-paragraph-semantic-role="highlight"/);
assert.match(editorialHighlightMarkup, /data-paragraph-highlight-stack="true"/);
assert.match(editorialHighlightMarkup, /data-paragraph-highlight-line="true"/);
assert.match(editorialHighlightMarkup, /display:inline-flex/);
assert.match(editorialHighlightMarkup, /flex-direction:column/);
assert.match(editorialHighlightMarkup, /gap:0\.22em/);
assert.match(editorialHighlightMarkup, /width:fit-content/);
assert.match(editorialHighlightMarkup, /max-width:100%/);
assert.match(editorialHighlightMarkup, /align-items:center/);
assert.doesNotMatch(editorialHighlightMarkup, /data-paragraph-highlight-line="true"[^>]*(^|;)width:100%/);
assert.match(editorialHighlightMarkup, /font-weight:700/);
assert.doesNotMatch(editorialHighlightMarkup, /data-paragraph-highlight-pill="true"[^>]*inline-block/);
assert.doesNotMatch(editorialHighlightMarkup, /flex-col/);
assert.match(editorialHighlightMarkup, /border-radius:8px/);
assert.match(editorialHighlightMarkup, /padding:0\.16em 0\.38em/);
assert.match(editorialHighlightMarkup, /box-decoration-break:clone/);
assert.match(editorialHighlightMarkup, /white-space:normal/);
assert.match(editorialHighlightMarkup, /text-wrap:balance/);
assert.doesNotMatch(editorialHighlightMarkup, /!leading-\[1\.72\]/);
assert.match(manualColorHighlightMarkup, /background-color:#ffffff/);
assert.match(manualColorHighlightMarkup, /color:#111111/);
assert.doesNotMatch(manualColorHighlightMarkup, /background-color:#41A8F5/);
assert.match(manualColorTitleHighlightMarkup, /background-color:#ffffff/);
assert.doesNotMatch(manualColorTitleHighlightMarkup, /background-color:#41A8F5/);
assert.match(semanticHighlightBoxMarkup, /background-color:#255d7b/);
assert.doesNotMatch(semanticHighlightBoxMarkup, /<div class="[^"]*" style="[^"]*background-color:#255d7b/);
assert.ok((longEditorialHighlightMarkup.match(/data-paragraph-highlight-line="true"/g) || []).length > 1);
assert.doesNotMatch(longEditorialHighlightMarkup, /data-paragraph-highlight-line="true"[^>]*(^|;)width:100%/);
assert.doesNotMatch(longEditorialHighlightMarkup, /flex-col/);
assert.doesNotMatch(longEditorialHighlightMarkup, /\[\[|\]\]/);
assert.match(fullMarkupHighlightMarkup, /data-paragraph-highlight-stack="true"/);
assert.match(fullMarkupHighlightMarkup, /align-items:flex-start/);
assert.ok((fullMarkupHighlightMarkup.match(/data-paragraph-highlight-line="true"/g) || []).length > 1);
assert.doesNotMatch(fullMarkupHighlightMarkup, /data-paragraph-highlight-line="true"[^>]*(^|;)width:100%/);
assert.doesNotMatch(fullMarkupHighlightMarkup, /data-paragraph-inline-highlight="true"/);
assert.doesNotMatch(fullMarkupHighlightMarkup, /\[\[|\]\]/);

console.log('icon-renderers.test.tsx passed');
