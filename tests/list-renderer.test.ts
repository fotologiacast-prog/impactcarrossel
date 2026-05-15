import assert from 'node:assert/strict';
import React from 'react';
import { renderToStaticMarkup } from 'react-dom/server';
import { ListRenderer } from '../renderers/blocks/ListRenderer.tsx';
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
  },
  spacing: {
    canvasPadding: '0',
    blockGap: '0',
    sectionGap: '0',
  },
  backgrounds: {},
};

const checklistBlock: Block = {
  type: 'LIST',
  content: ['📊 Valide quantidades reais'],
  options: {
    variant: 'check-list',
    fontSize: 26,
    fontWeight: 700,
  },
};

const markup = renderToStaticMarkup(
  React.createElement(ListRenderer, {
    block: checklistBlock,
    theme,
  }),
);

assert.doesNotMatch(markup, /📊/u);
assert.match(markup, /lucide-check/);
assert.match(markup, /width="4[6-9]"/);
assert.match(markup, /stroke-width="2\.8"/);
assert.doesNotMatch(markup, />✓</u);

const shortChecklistBlock: Block = {
  type: 'LIST',
  content: ['Tensão'],
  options: {
    variant: 'check-list',
    fontSize: 26,
    fontWeight: 700,
  },
};

const shortChecklistMarkup = renderToStaticMarkup(
  React.createElement(ListRenderer, {
    block: shortChecklistBlock,
    theme,
  }),
);

assert.match(shortChecklistMarkup, /font-size:39px/);
assert.match(shortChecklistMarkup, /min-height:92px/);
assert.match(shortChecklistMarkup, /data-checklist-row-layout="balanced"/);
assert.match(shortChecklistMarkup, /class="relative w-full mx-auto grid items-center/);
assert.match(shortChecklistMarkup, /lucide-check/);
assert.match(shortChecklistMarkup, /width="4[6-9]"/);
assert.match(shortChecklistMarkup, /stroke-width="2\.8"/);
assert.match(shortChecklistMarkup, /stroke="#fff"/);
assert.doesNotMatch(shortChecklistMarkup, /rgba\(255,255,255,0\.92\)/);

const mixedChecklistBlock: Block = {
  type: 'LIST',
  content: ['Genética', 'Alterações hormonais', 'Gravidez'],
  options: {
    variant: 'check-list',
    fontSize: 28,
    fontWeight: 700,
    itemIcons: ['Dna', 'Scale', 'Baby'],
  },
};

const mixedChecklistMarkup = renderToStaticMarkup(
  React.createElement(ListRenderer, {
    block: mixedChecklistBlock,
    theme,
  }),
);

assert.match(mixedChecklistMarkup, /font-size:42px/);
assert.equal((mixedChecklistMarkup.match(/min-height:92px/g) || []).length, 3);
assert.equal((mixedChecklistMarkup.match(/data-checklist-row-layout="balanced"/g) || []).length, 3);
assert.match(mixedChecklistMarkup, /width="4[6-9]"/);
assert.match(mixedChecklistMarkup, /stroke-width="2\.8"/);
assert.match(mixedChecklistMarkup, /stroke="#fff"/);
assert.doesNotMatch(mixedChecklistMarkup, /rgba\(255,255,255,0\.92\)/);

const shortDefaultListBlock: Block = {
  type: 'LIST',
  content: ['Menos improviso'],
  options: {
    fontSize: 28,
    itemIcons: ['Shield'],
  },
};

const shortDefaultListMarkup = renderToStaticMarkup(
  React.createElement(ListRenderer, {
    block: shortDefaultListBlock,
    theme,
  }),
);

assert.match(shortDefaultListMarkup, /font-size:34px/);
assert.match(shortDefaultListMarkup, /lucide-shield/);
assert.match(shortDefaultListMarkup, /width:18px/);

const boxChecklistBlock: Block = {
  type: 'LIST',
  content: ['anos de dor', 'tratamentos ineficazes', 'desgaste emocional'],
  options: {
    variant: 'box',
    fontSize: 30,
    fontWeight: 800,
    itemIcons: ['XCircle', 'XCircle', 'XCircle'],
  },
};

const boxChecklistMarkup = renderToStaticMarkup(
  React.createElement(ListRenderer, {
    block: boxChecklistBlock,
    theme,
  }),
);

assert.match(boxChecklistMarkup, /lucide-circle-x/);
assert.match(boxChecklistMarkup, /max-width:760px/);
assert.match(boxChecklistMarkup, /justify-center/);
assert.match(boxChecklistMarkup, /gap-6 px-10/);
assert.match(boxChecklistMarkup, /width="4[0-4]"/);
assert.match(boxChecklistMarkup, /stroke-width="2\.8"/);
assert.doesNotMatch(boxChecklistMarkup, /data-list-compact="true"/);

const compactBoxChecklistMarkup = renderToStaticMarkup(
  React.createElement(ListRenderer, {
    block: boxChecklistBlock,
    theme,
    layoutContext: {
      compactLayout: {
        isCompact: true,
        availableWidth: 520,
        availableHeight: 320,
        sourceLayoutId: 'IMAGE_STAGE_LEFT',
      },
    },
  } as any),
);

const compactChecklistSpacingMarkup = renderToStaticMarkup(
  React.createElement(ListRenderer, {
    block: {
      type: 'LIST',
      content: [
        'Identidade. Quem é a sua marca e para quem ela fala',
        'Resultado. O que o cliente vai sentir ou conquistar',
        'Confiança. Que vale o investimento',
      ],
      options: {
        variant: 'check-list',
        fontSize: 28,
        fontWeight: 800,
        itemIcons: ['Sparkles', 'BarChart3', 'ShieldCheck'],
      },
    },
    theme,
    layoutContext: {
      compactLayout: {
        isCompact: true,
        availableWidth: 300,
        availableHeight: 180,
        sourceLayoutId: 'IMAGE_STAGE_LEFT',
      },
    },
  } as any),
);

const editorialChecklistBlock: Block = {
  type: 'LIST',
  content: [
    '**Creme dental correto:** use pastas específicas para dentes sensíveis. Elas criam uma camada de proteção nos túbulos dentinários.',
    '**Cuidado com o ácido:** diminua limão, refrigerantes e vinhos, que desgastam o esmalte.',
    '**Força não é limpeza:** use escovas extramacias. Excesso de pressão retrai a gengiva e expõe a raiz.',
  ],
  options: {
    variant: 'check-list',
    fontSize: 28,
    fontWeight: 700,
    itemIcons: ['Tooth', 'Wine', 'Toothbrush'],
  },
};

const editorialChecklistMarkup = renderToStaticMarkup(
  React.createElement(ListRenderer, {
    block: editorialChecklistBlock,
    theme,
  }),
);

const editorialBoxListMarkup = renderToStaticMarkup(
  React.createElement(ListRenderer, {
    block: {
      ...editorialChecklistBlock,
      options: {
        ...editorialChecklistBlock.options,
        variant: 'box',
        color: '#101010',
        backgroundColor: '#44D7A8',
      },
    },
    theme,
  }),
);

const shortBoldChecklistMarkup = renderToStaticMarkup(
  React.createElement(ListRenderer, {
    block: {
      type: 'LIST',
      content: ['**Escova macia**', '**Fio dental**'],
      options: {
        variant: 'check-list',
        fontSize: 28,
        fontWeight: 700,
      },
    },
    theme,
  }),
);

const shortEditorialChecklistMarkup = renderToStaticMarkup(
  React.createElement(ListRenderer, {
    block: {
      type: 'LIST',
      content: [
        '**Liberação de gases:** responsável pelo som do estalo',
        '**Ajuste articular:** foco na função e mobilidade',
        '**Benefício real:** não depende do barulho',
      ],
      options: {
        variant: 'box',
        fontSize: 28,
        fontWeight: 800,
      },
    },
    theme,
  }),
);

assert.match(compactBoxChecklistMarkup, /data-list-compact="true"/);
assert.match(compactBoxChecklistMarkup, /gap-4 px-8/);
assert.match(compactBoxChecklistMarkup, /max-width:100%/);
assert.match(compactBoxChecklistMarkup, /font-size:30px/);
assert.equal((compactChecklistSpacingMarkup.match(/data-checklist-row-layout="balanced"/g) || []).length, 3);
assert.match(compactChecklistSpacingMarkup, /grid-template-columns:42px minmax\(0, 1fr\) 42px/);
assert.match(compactChecklistSpacingMarkup, /padding:10px 20px/);
assert.match(compactChecklistSpacingMarkup, /min-width:0/);
assert.match(compactChecklistSpacingMarkup, /text-wrap:balance/);
assert.match(editorialChecklistMarkup, /data-checklist-editorial="true"/);
assert.equal((editorialChecklistMarkup.match(/data-checklist-editorial-item="true"/g) || []).length, 3);
assert.match(editorialChecklistMarkup, /data-checklist-editorial-title="true"/);
assert.match(editorialChecklistMarkup, /data-checklist-editorial-description="true"/);
assert.match(editorialChecklistMarkup, /grid-template-columns:128px 1px minmax\(0, 1fr\)/);
assert.match(editorialChecklistMarkup, /border-radius:30px/);
assert.match(editorialChecklistMarkup, /font-size:34px/);
assert.match(editorialChecklistMarkup, /font-size:26px/);
assert.match(editorialChecklistMarkup, /Creme dental correto/);
assert.doesNotMatch(editorialChecklistMarkup, /Creme dental correto:/);
assert.match(editorialBoxListMarkup, /data-checklist-editorial="true"/);
assert.match(editorialBoxListMarkup, /#44D7A8/i);
assert.match(editorialBoxListMarkup, /#101010/i);
assert.match(shortEditorialChecklistMarkup, /data-checklist-editorial="true"/);
assert.equal((shortEditorialChecklistMarkup.match(/data-checklist-editorial-item="true"/g) || []).length, 3);
assert.doesNotMatch(shortBoldChecklistMarkup, /data-checklist-editorial="true"/);

console.log('list-renderer.test.ts passed');
