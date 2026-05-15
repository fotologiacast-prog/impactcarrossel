import assert from 'node:assert/strict';
import { classifyParsedRawSlide } from '../utils/heuristics/slide-classifier.ts';

const introSlide = classifyParsedRawSlide(
  {
    index: 1,
    raw: 'Slide 1 - Capa',
    lines: ['Capa'],
    titleCandidate: 'Capa',
    title: 'Capa',
    subtitle: 'Texto curto',
    text: 'Texto de apoio',
    bodyLines: ['Texto curto'],
    listItems: [],
    cta: undefined,
    imagePrompt: 'Capa editorial com pessoa analisando relatório',
    signals: {
      hasExplicitList: false,
      hasImplicitList: false,
      hasNumberStat: false,
      hasComparison: false,
      hasQuestion: false,
      hasCTA: false,
    },
  },
  0,
  4,
);

assert.equal(introSlide.primaryType, 'intro');
assert.equal(introSlide.type, 'intro');
assert.equal(introSlide.visualWeightHint, 'heavy');
assert.equal(introSlide.signals.intro > introSlide.signals.single_point, true);
assert.equal(introSlide.hasImagePrompt, true);
assert.equal(introSlide.shouldUseImage, true);
assert.ok(introSlide.imagePriority > 0);

const listSlide = classifyParsedRawSlide(
  {
    index: 2,
    raw: 'Slide 2',
    lines: ['Item 1', 'Item 2', 'Item 3'],
    title: 'Checklist',
    subtitle: '3 ações-chave',
    text: 'Faça isso antes do reajuste.',
    bodyLines: ['Item 1', 'Item 2', 'Item 3'],
    listItems: ['Item 1', 'Item 2', 'Item 3'],
    cta: undefined,
    imagePrompt: undefined,
    signals: {
      hasExplicitList: true,
      hasImplicitList: false,
      hasNumberStat: false,
      hasComparison: false,
      hasQuestion: false,
      hasCTA: false,
    },
  },
  1,
  4,
);

assert.equal(listSlide.primaryType, 'list');
assert.equal(listSlide.type, 'list');
assert.equal(listSlide.itemCount, 3);
assert.ok(listSlide.signals.list > 0.5);
assert.equal(listSlide.hasImagePrompt, false);
assert.equal(listSlide.shouldUseImage, true);
assert.ok(listSlide.imagePriority > 0);

const hybridSlide = classifyParsedRawSlide(
  {
    index: 3,
    raw: 'Slide 3',
    lines: ['95% da conta', '- Linha 1', '- Linha 2', '- Linha 3'],
    title: '95% da conta',
    subtitle: 'Mesmo com as mudanças',
    text: 'Ainda pode compensar.',
    bodyLines: ['95% da conta'],
    listItems: ['Linha 1', 'Linha 2', 'Linha 3'],
    cta: undefined,
    imagePrompt: 'Farmacêutico olhando gráfico financeiro',
    signals: {
      hasExplicitList: true,
      hasImplicitList: false,
      hasNumberStat: true,
      hasComparison: false,
      hasQuestion: false,
      hasCTA: false,
    },
  },
  2,
  4,
);

assert.ok(hybridSlide.signals.list > 0.5);
assert.ok(hybridSlide.signals.stat > 0.4);
assert.equal(['list', 'stat'].includes(hybridSlide.primaryType), true);
assert.equal(hybridSlide.hasImagePrompt, true);
assert.ok(hybridSlide.imagePriority > 0);

const falsePositiveStatSlide = classifyParsedRawSlide(
  {
    index: 4,
    raw: 'Slide 4',
    lines: ['Análise de giro', 'Base 2024', 'Nem todo produto merece investimento antes do reajuste.'],
    title: 'Análise de giro',
    subtitle: 'Base 2024',
    text: 'Nem todo produto merece investimento antes do reajuste. O foco está em critérios operacionais longos, fluxo de caixa e leitura de mix por categoria, sem depender de um número dominante.',
    bodyLines: ['Nem todo produto merece investimento antes do reajuste. O foco está em critérios operacionais longos, fluxo de caixa e leitura de mix por categoria, sem depender de um número dominante.'],
    listItems: [],
    cta: undefined,
    imagePrompt: undefined,
    signals: {
      hasExplicitList: false,
      hasImplicitList: false,
      hasNumberStat: true,
      hasComparison: false,
      hasQuestion: false,
      hasCTA: false,
    },
  },
  3,
  4,
);

assert.notEqual(falsePositiveStatSlide.primaryType, 'stat');
assert.ok(falsePositiveStatSlide.signals.stat < 0.4);

const comparisonSlide = classifyParsedRawSlide(
  {
    index: 5,
    raw: 'Slide 5',
    lines: ['Mito x Verdade'],
    title: 'Mito x Verdade',
    subtitle: undefined,
    text: 'Comparativo rápido',
    bodyLines: ['Mito x Verdade'],
    listItems: [],
    cta: undefined,
    imagePrompt: undefined,
    signals: {
      hasExplicitList: false,
      hasImplicitList: false,
      hasNumberStat: false,
      hasComparison: true,
      hasQuestion: false,
      hasCTA: false,
    },
  },
  4,
  5,
);

assert.equal(comparisonSlide.primaryType, 'comparison');
assert.ok(comparisonSlide.signals.comparison > 0.5);

const ctaSlide = classifyParsedRawSlide(
  {
    index: 6,
    raw: 'Slide 6',
    lines: ['Quer começar hoje?'],
    title: 'Quer começar hoje?',
    subtitle: 'Fale com nossa equipe',
    text: 'Simule agora.',
    bodyLines: ['Quer começar hoje?'],
    listItems: [],
    cta: 'Fale com nossa equipe',
    imagePrompt: 'Empresário confiante em ambiente profissional',
    signals: {
      hasExplicitList: false,
      hasImplicitList: false,
      hasNumberStat: false,
      hasComparison: false,
      hasQuestion: true,
      hasCTA: true,
    },
  },
  5,
  6,
);

assert.equal(ctaSlide.primaryType, 'cta');
assert.equal(ctaSlide.type, 'cta');
assert.equal(ctaSlide.visualWeightHint, 'heavy');
assert.ok(ctaSlide.signals.cta > 0.7);
assert.equal(ctaSlide.hasImagePrompt, true);
assert.ok(ctaSlide.imagePriority >= 95);

const authorityYearsCtaSlide = classifyParsedRawSlide(
  {
    index: 7,
    raw: 'Slide 7',
    lines: ['Chega de ficar sem resposta.'],
    title: 'Chega de ficar sem resposta.',
    subtitle: undefined,
    text: 'Se o seu sistema precisa de atenção, chame quem tem 18 anos de bagagem na elétrica.',
    bodyLines: ['Se o seu sistema precisa de atenção, chame quem tem 18 anos de bagagem na elétrica.'],
    listItems: [],
    cta: 'Clique no link da bio e fale com a Fatsul!',
    imagePrompt: undefined,
    signals: {
      hasExplicitList: false,
      hasImplicitList: false,
      hasNumberStat: true,
      hasComparison: false,
      hasQuestion: false,
      hasCTA: true,
    },
  },
  4,
  6,
);

assert.equal(authorityYearsCtaSlide.primaryType, 'cta');
assert.ok(authorityYearsCtaSlide.signals.stat < 0.6);
assert.equal(authorityYearsCtaSlide.prefersBigNumber, false);

console.log('slide-classifier.test.ts passed');
