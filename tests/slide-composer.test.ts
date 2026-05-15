import assert from 'node:assert/strict';
import { composeHeuristicSlide } from '../utils/heuristics/slide-composer.ts';

const introSlide = composeHeuristicSlide(
  {
    index: 1,
    raw: 'Slide 1\nTítulo: O que mudou\nSubtítulo: A lei mudou\nTexto: E ainda compensa',
    lines: ['Slide 1', 'Título: O que mudou', 'Subtítulo: A lei mudou', 'Texto: E ainda compensa'],
    titleCandidate: 'O que mudou',
    title: 'O que mudou',
    subtitle: 'A lei mudou',
    text: 'E ainda compensa',
    cta: undefined,
    imagePrompt: 'Pessoa analisando dados',
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
  {
    type: 'intro',
    textLength: 48,
    titleLength: 11,
    bodyLength: 28,
    itemCount: 0,
    itemAverageLength: 0,
    visualWeightHint: 'heavy',
    hasImagePrompt: true,
    shouldUseImage: true,
    imagePriority: 100,
    prefersBigNumber: false,
  },
  'HERO',
);

assert.equal(introSlide.template, 'HERO');
assert.equal(introSlide.contentTemplate, 'HERO');
assert.equal(introSlide.imageLayout, 'IMAGE_NONE');
assert.equal(introSlide.blocks[0]?.type, 'TITLE');
assert.equal(introSlide.blocks[0]?.content, 'O que mudou');
assert.equal(introSlide.blocks[0]?.options?.fontSize, 84);
assert.equal(introSlide.blocks[1]?.content, 'A lei mudou');
assert.equal(introSlide.blocks[1]?.options?.fontSize, 36);
assert.equal(introSlide.blocks[2]?.content, 'E ainda compensa');
assert.equal(introSlide.blocks[2]?.options?.fontSize, 36);
assert.equal(introSlide.image, undefined);

const listSlide = composeHeuristicSlide(
  {
    index: 2,
    raw: 'Slide 2\nTítulo: Canais que funcionam\nSubtítulo: Crescimento previsível\nTexto: Use os canais certos.\nLista:\n- SEO orgânico\n- Parcerias B2B\n- Comunidade',
    lines: ['Slide 2', 'Título: Canais que funcionam', 'Subtítulo: Crescimento previsível', 'Texto: Use os canais certos.', 'Lista:', '- SEO orgânico', '- Parcerias B2B', '- Comunidade'],
    titleCandidate: 'Canais que funcionam',
    title: 'Canais que funcionam',
    subtitle: 'Crescimento previsível',
    text: 'Use os canais certos.',
    cta: undefined,
    imagePrompt: undefined,
    bodyLines: [],
    listItems: ['SEO orgânico', 'Parcerias B2B', 'Comunidade'],
    signals: {
      hasExplicitList: true,
      hasImplicitList: false,
      hasNumberStat: false,
      hasComparison: false,
      hasQuestion: false,
      hasCTA: false,
    },
  },
  {
    type: 'list',
    textLength: 72,
    titleLength: 19,
    bodyLength: 0,
    itemCount: 3,
    itemAverageLength: 2,
    visualWeightHint: 'medium',
    hasImagePrompt: false,
    shouldUseImage: false,
    imagePriority: 0,
    prefersBigNumber: false,
  },
  'CHECKLIST',
);

assert.equal(listSlide.template, 'CHECKLIST');
assert.equal(listSlide.contentTemplate, 'CHECKLIST');
assert.equal(listSlide.imageLayout, 'IMAGE_NONE');
assert.ok(listSlide.blocks.some((block) => block.type === 'LIST' || block.type === 'BOX'));
assert.equal(listSlide.blocks[0]?.type, 'TITLE');
assert.equal(listSlide.blocks[0]?.content, 'Canais que funcionam');
assert.equal(listSlide.blocks[0]?.options?.fontSize, 84);
assert.equal(listSlide.blocks[1]?.content, 'Crescimento previsível');
assert.equal(listSlide.blocks[1]?.options?.fontSize, 36);
assert.equal(listSlide.blocks[2]?.type, 'PARAGRAPH');
assert.equal(listSlide.blocks[2]?.content, 'Use os canais certos.');
assert.equal(listSlide.blocks[2]?.options?.fontSize, 36);
assert.equal((listSlide.blocks.find((block) => block.type === 'LIST')?.options?.variant), 'box');
assert.equal(listSlide.blocks.find((block) => block.type === 'LIST')?.options?.fontSize, 36);
assert.deepEqual(
  (listSlide.blocks.find((block) => block.type === 'LIST')?.content as string[]) || [],
  ['SEO orgânico', 'Parcerias B2B', 'Comunidade'],
);
assert.equal(((listSlide.blocks.find((block) => block.type === 'LIST')?.options?.itemIcons as string[]) || []).length, 3);
assert.equal(listSlide.blocks.some((block) => block.type === 'BADGE' && block.content === 'Checklist'), false);
assert.equal(listSlide.image, undefined);

const pillSlide = composeHeuristicSlide(
  {
    index: 3,
    raw: 'Slide 3\nTítulo: Canais que aceleram\nSubtítulo: Leitura rápida\nLista:\n- SEO\n- Performance\n- Comunidade',
    lines: ['Slide 3', 'Título: Canais que aceleram', 'Subtítulo: Leitura rápida', 'Lista:', '- SEO', '- Performance', '- Comunidade'],
    titleCandidate: 'Canais que aceleram',
    title: 'Canais que aceleram',
    subtitle: 'Leitura rápida',
    text: '',
    cta: undefined,
    imagePrompt: undefined,
    bodyLines: [],
    listItems: ['SEO', 'Performance', 'Comunidade'],
    signals: {
      hasExplicitList: true,
      hasImplicitList: false,
      hasNumberStat: false,
      hasComparison: false,
      hasQuestion: false,
      hasCTA: false,
    },
  },
  {
    type: 'list',
    textLength: 42,
    titleLength: 19,
    bodyLength: 0,
    itemCount: 3,
    itemAverageLength: 1,
    visualWeightHint: 'light',
    hasImagePrompt: false,
    shouldUseImage: false,
    imagePriority: 0,
    prefersBigNumber: false,
  },
  'CHECKLIST',
);

assert.equal(pillSlide.contentTemplate, 'CHECKLIST');
const pillLikeList = pillSlide.blocks.find((block) => block.type === 'LIST');
assert.equal(pillSlide.blocks.some((block) => block.type === 'BADGE' && block.content === 'Checklist'), false);
assert.equal(pillLikeList?.options?.variant, 'box');
assert.equal(Array.isArray(pillLikeList?.options?.itemIcons), true);

const checklistWithBodySlide = composeHeuristicSlide(
  {
    index: 14,
    raw: 'Slide 14\nTítulo: Onde o erro começa\nTexto: O erro começa quando se escolhe apenas pelo preço. Valores muito baixos indicam economia em três pilares fatais:\nLista:\n- segurança\n- tecnologia\n- tempo',
    lines: [
      'Slide 14',
      'Título: Onde o erro começa',
      'Texto: O erro começa quando se escolhe apenas pelo preço. Valores muito baixos indicam economia em três pilares fatais:',
      'Lista:',
      '- segurança',
      '- tecnologia',
      '- tempo',
    ],
    titleCandidate: 'Onde o erro começa',
    title: 'Onde o erro começa',
    subtitle: '',
    text: 'O erro começa quando se escolhe apenas pelo preço. Valores muito baixos indicam economia em três pilares fatais:',
    cta: undefined,
    imagePrompt: undefined,
    bodyLines: [],
    listItems: ['segurança', 'tecnologia', 'tempo'],
    signals: {
      hasExplicitList: true,
      hasImplicitList: false,
      hasNumberStat: false,
      hasComparison: false,
      hasQuestion: false,
      hasCTA: false,
    },
  },
  {
    type: 'list',
    textLength: 132,
    titleLength: 19,
    bodyLength: 113,
    itemCount: 3,
    itemAverageLength: 1,
    visualWeightHint: 'medium',
    hasImagePrompt: false,
    shouldUseImage: false,
    imagePriority: 0,
    prefersBigNumber: false,
  },
  'CHECKLIST',
);

assert.equal(checklistWithBodySlide.contentTemplate, 'CHECKLIST');
assert.equal(checklistWithBodySlide.blocks[1]?.type, 'PARAGRAPH');
assert.equal(
  checklistWithBodySlide.blocks[1]?.content,
  'O erro começa quando se escolhe apenas pelo preço. Valores muito baixos indicam economia em três pilares fatais:',
);
assert.equal(checklistWithBodySlide.blocks[1]?.options?.fontSize, 36);
assert.equal(checklistWithBodySlide.blocks[2]?.type, 'LIST');
assert.equal(checklistWithBodySlide.blocks[2]?.options?.fontSize, 36);

const bentoSlide = composeHeuristicSlide(
  {
    index: 4,
    raw: 'Slide 4\nTítulo: Pilares da execução\nSubtítulo: O que sustenta o resultado\nTexto: Cada frente precisa de uma função clara.\nLista:\n- Diagnóstico\n- Margem\n- Equipe\n- Proteção',
    lines: ['Slide 4', 'Título: Pilares da execução', 'Subtítulo: O que sustenta o resultado', 'Texto: Cada frente precisa de uma função clara.', 'Lista:', '- Diagnóstico', '- Margem', '- Equipe', '- Proteção'],
    titleCandidate: 'Pilares da execução',
    title: 'Pilares da execução',
    subtitle: 'O que sustenta o resultado',
    text: 'Cada frente precisa de uma função clara.',
    cta: undefined,
    imagePrompt: undefined,
    bodyLines: [],
    listItems: ['Diagnóstico', 'Margem', 'Equipe', 'Proteção'],
    signals: {
      hasExplicitList: true,
      hasImplicitList: false,
      hasNumberStat: false,
      hasComparison: false,
      hasQuestion: false,
      hasCTA: false,
    },
  },
  {
    type: 'list',
    textLength: 86,
    titleLength: 19,
    bodyLength: 0,
    itemCount: 4,
    itemAverageLength: 1,
    visualWeightHint: 'medium',
    hasImagePrompt: false,
    shouldUseImage: false,
    imagePriority: 0,
    prefersBigNumber: false,
  },
  'BOX_GRID',
);

const bentoBoxes = bentoSlide.blocks.filter((block) => block.type === 'BOX');
assert.equal(bentoSlide.contentTemplate, 'BOX_GRID');
assert.equal(bentoSlide.blocks[2]?.type, 'PARAGRAPH');
assert.equal(bentoSlide.blocks[2]?.content, 'Cada frente precisa de uma função clara.');
assert.equal(bentoSlide.blocks[0]?.options?.fontSize, 84);
assert.equal(bentoSlide.blocks[1]?.options?.fontSize, 36);
assert.equal(bentoSlide.blocks[2]?.options?.fontSize, 36);
assert.equal(bentoBoxes.length, 4);
assert.ok(bentoBoxes.every((block) => block.options?.fontSize === 36));
assert.ok(bentoBoxes.every((block) => typeof block.options?.icon === 'string' && block.options.icon.length > 0));
assert.equal(new Set(bentoBoxes.map((block) => block.options?.icon)).size >= 2, true);

const quoteSlide = composeHeuristicSlide(
  {
    index: 5,
    raw: 'Slide 5\nTítulo: O ponto central\nTexto: Uma boa narrativa muda totalmente a percepção da oferta.',
    lines: ['Slide 5', 'Título: O ponto central', 'Texto: Uma boa narrativa muda totalmente a percepção da oferta.'],
    titleCandidate: 'O ponto central',
    title: 'O ponto central',
    subtitle: '',
    text: 'Uma boa narrativa muda totalmente a percepção da oferta.',
    cta: undefined,
    imagePrompt: undefined,
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
  {
    type: 'single_point',
    textLength: 58,
    titleLength: 14,
    bodyLength: 44,
    itemCount: 0,
    itemAverageLength: 0,
    visualWeightHint: 'medium',
    hasImagePrompt: false,
    shouldUseImage: false,
    imagePriority: 0,
    prefersBigNumber: false,
  },
  'HERO',
);

assert.equal(quoteSlide.contentTemplate, 'HERO');
assert.equal(quoteSlide.blocks[0]?.type, 'TITLE');
assert.ok(quoteSlide.blocks.some((block) => block.type === 'PARAGRAPH'));
assert.equal(quoteSlide.blocks[1]?.options?.fontSize, 36);

const heroSubtitleSlide = composeHeuristicSlide(
  {
    index: 5,
    raw: 'Slide 5\nTítulo: Diagnóstico correto não é só encontrar a doença.\nSubtítulo: É saber diferenciar\nTexto: o que parece... do que realmente é.',
    lines: [
      'Slide 5',
      'Título: Diagnóstico correto não é só encontrar a doença.',
      'Subtítulo: É saber diferenciar',
      'Texto: o que parece... do que realmente é.',
    ],
    titleCandidate: 'Diagnóstico correto não é só encontrar a doença.',
    title: 'Diagnóstico correto não é só encontrar a doença.',
    subtitle: 'É saber diferenciar',
    text: 'o que parece... do que realmente é.',
    cta: undefined,
    imagePrompt: undefined,
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
  {
    type: 'single_point',
    textLength: 82,
    titleLength: 43,
    bodyLength: 34,
    itemCount: 0,
    itemAverageLength: 0,
    visualWeightHint: 'medium',
    hasImagePrompt: false,
    shouldUseImage: false,
    imagePriority: 0,
    prefersBigNumber: false,
  },
  'HERO',
);

assert.equal(heroSubtitleSlide.blocks[1]?.content, 'É saber diferenciar');
assert.equal(heroSubtitleSlide.blocks[1]?.options?.fontSize, 36);
assert.equal(heroSubtitleSlide.blocks[2]?.options?.fontSize, 36);

const minimalChecklistSlide = composeHeuristicSlide(
  {
    index: 6,
    raw: 'Slide 6\nTítulo: Checklist essencial\nSubtítulo: O básico bem feito\nLista:\n- Confirmar agenda\n- Validar cadastro\n- Encaminhar retorno',
    lines: ['Slide 6', 'Título: Checklist essencial', 'Subtítulo: O básico bem feito', 'Lista:', '- Confirmar agenda', '- Validar cadastro', '- Encaminhar retorno'],
    titleCandidate: 'Checklist essencial',
    title: 'Checklist essencial',
    subtitle: 'O básico bem feito',
    text: '',
    cta: undefined,
    imagePrompt: undefined,
    bodyLines: [],
    listItems: ['Confirmar agenda', 'Validar cadastro', 'Encaminhar retorno'],
    signals: {
      hasExplicitList: true,
      hasImplicitList: false,
      hasNumberStat: false,
      hasComparison: false,
      hasQuestion: false,
      hasCTA: false,
    },
  },
  {
    type: 'list',
    textLength: 50,
    titleLength: 19,
    bodyLength: 0,
    itemCount: 3,
    itemAverageLength: 2,
    visualWeightHint: 'light',
    hasImagePrompt: false,
    shouldUseImage: false,
    imagePriority: 0,
    prefersBigNumber: false,
  },
  'CHECKLIST',
);

const minimalList = minimalChecklistSlide.blocks.find((block) => block.type === 'LIST');
assert.equal(minimalChecklistSlide.contentTemplate, 'CHECKLIST');
assert.ok(Array.isArray(minimalList?.content));
assert.equal(minimalList?.options?.variant, 'box');
assert.deepEqual(
  (minimalList?.content as string[]) || [],
  ['Confirmar agenda', 'Validar cadastro', 'Encaminhar retorno'],
);
assert.equal(((minimalList?.options?.itemIcons as string[]) || []).length, 3);

const infoListSlide = composeHeuristicSlide(
  {
    index: 7,
    raw: 'Slide 7\nTítulo: Plano de ação\nSubtítulo: Entenda a lógica\nTexto: Primeiro vem o diagnóstico, depois a execução.\nLista:\n- Revisar números\n- Priorizar margem\n- Executar compras',
    lines: ['Slide 7', 'Título: Plano de ação', 'Subtítulo: Entenda a lógica', 'Texto: Primeiro vem o diagnóstico, depois a execução.', 'Lista:', '- Revisar números', '- Priorizar margem', '- Executar compras'],
    titleCandidate: 'Plano de ação',
    title: 'Plano de ação',
    subtitle: 'Entenda a lógica',
    text: 'Primeiro vem o diagnóstico, depois a execução.',
    cta: undefined,
    imagePrompt: undefined,
    bodyLines: [],
    listItems: ['Revisar números', 'Priorizar margem', 'Executar compras'],
    signals: {
      hasExplicitList: true,
      hasImplicitList: false,
      hasNumberStat: false,
      hasComparison: false,
      hasQuestion: false,
      hasCTA: false,
    },
  },
  {
    type: 'list',
    textLength: 88,
    titleLength: 13,
    bodyLength: 45,
    itemCount: 3,
    itemAverageLength: 2,
    visualWeightHint: 'light',
    hasImagePrompt: false,
    shouldUseImage: false,
    imagePriority: 0,
    prefersBigNumber: false,
  },
  'CHECKLIST',
);

assert.equal(infoListSlide.contentTemplate, 'CHECKLIST');
const infoListBlock = infoListSlide.blocks.find((block) => block.type === 'LIST');
assert.ok(Array.isArray(infoListBlock?.content));
assert.deepEqual(
  (infoListBlock?.content as string[]) || [],
  ['Revisar números', 'Priorizar margem', 'Executar compras'],
);
assert.equal(Array.isArray(infoListBlock?.options?.itemIcons), true);
assert.equal(((infoListBlock?.options?.itemIcons as string[]) || []).length, 3);

const numberedRowsSlide = composeHeuristicSlide(
  {
    index: 8,
    raw: 'Slide 8\nTítulo: Sequência ideal\nSubtítulo: Ordem da operação\nLista:\n- Captar demanda\n- Agendar avaliação\n- Confirmar retorno',
    lines: ['Slide 8', 'Título: Sequência ideal', 'Subtítulo: Ordem da operação', 'Lista:', '- Captar demanda', '- Agendar avaliação', '- Confirmar retorno'],
    titleCandidate: 'Sequência ideal',
    title: 'Sequência ideal',
    subtitle: 'Ordem da operação',
    text: '',
    cta: undefined,
    imagePrompt: undefined,
    bodyLines: [],
    listItems: ['Captar demanda', 'Agendar avaliação', 'Confirmar retorno'],
    signals: {
      hasExplicitList: true,
      hasImplicitList: false,
      hasNumberStat: false,
      hasComparison: false,
      hasQuestion: false,
      hasCTA: false,
    },
  },
  {
    type: 'list',
    textLength: 52,
    titleLength: 15,
    bodyLength: 0,
    itemCount: 3,
    itemAverageLength: 2,
    visualWeightHint: 'medium',
    hasImagePrompt: false,
    shouldUseImage: false,
    imagePriority: 0,
    prefersBigNumber: false,
  },
  'CHECKLIST',
);

const numberedList = numberedRowsSlide.blocks.find((block) => block.type === 'LIST');
assert.equal(numberedRowsSlide.contentTemplate, 'CHECKLIST');
assert.equal(numberedList?.options?.variant, 'box');
assert.equal(Array.isArray(numberedList?.content), true);

const explicitSemanticListSlide = composeHeuristicSlide(
  {
    index: 9,
    raw: 'Slide 9\nTítulo: Medições essenciais\nLista:\n- ⚡ {zap, voltage, energy} Tensão\n- 🔌 {plug, current, power} Corrente\n- 🔁 {repeat, continuity, circuit} Continuidade',
    lines: [
      'Slide 9',
      'Título: Medições essenciais',
      'Lista:',
      '- ⚡ {zap, voltage, energy} Tensão',
      '- 🔌 {plug, current, power} Corrente',
      '- 🔁 {repeat, continuity, circuit} Continuidade',
    ],
    titleCandidate: 'Medições essenciais',
    title: 'Medições essenciais',
    subtitle: '',
    text: '',
    cta: undefined,
    imagePrompt: undefined,
    bodyLines: [],
    listItems: ['Tensão', 'Corrente', 'Continuidade'],
    listItemMeta: [
      { raw: '⚡ {zap, voltage, energy} Tensão', text: 'Tensão', emojiHint: '⚡', iconHints: ['zap', 'voltage', 'energy'] },
      { raw: '🔌 {plug, current, power} Corrente', text: 'Corrente', emojiHint: '🔌', iconHints: ['plug', 'current', 'power'] },
      { raw: '🔁 {repeat, continuity, circuit} Continuidade', text: 'Continuidade', emojiHint: '🔁', iconHints: ['repeat', 'continuity', 'circuit'] },
    ],
    signals: {
      hasExplicitList: true,
      hasImplicitList: false,
      hasNumberStat: false,
      hasComparison: false,
      hasQuestion: false,
      hasCTA: false,
    },
  },
  {
    type: 'list',
    textLength: 38,
    titleLength: 19,
    bodyLength: 0,
    itemCount: 3,
    itemAverageLength: 1,
    visualWeightHint: 'medium',
    hasImagePrompt: false,
    shouldUseImage: false,
    imagePriority: 0,
    prefersBigNumber: false,
  },
  'CHECKLIST',
);

const explicitSemanticBadges = explicitSemanticListSlide.blocks.filter((block) => block.type === 'BADGE');
assert.equal(explicitSemanticListSlide.contentTemplate, 'CHECKLIST');
assert.deepEqual(explicitSemanticBadges.map((block) => block.content), ['Tensão', 'Corrente', 'Continuidade']);
assert.deepEqual(explicitSemanticBadges.map((block) => block.options?.icon), ['Zap', 'Plug', 'Repeat']);

const explicitSemanticBoxSlide = composeHeuristicSlide(
  {
    index: 10,
    raw: 'Slide 10\nTítulo: Itens técnicos\nLista:\n- ⚡ {zap, voltage, energy} Tensão\n- 🔌 {plug, current, power} Corrente\n- 🚨 {alert, error, warning} Identificação de falhas',
    lines: [
      'Slide 10',
      'Título: Itens técnicos',
      'Lista:',
      '- ⚡ {zap, voltage, energy} Tensão',
      '- 🔌 {plug, current, power} Corrente',
      '- 🚨 {alert, error, warning} Identificação de falhas',
    ],
    titleCandidate: 'Itens técnicos',
    title: 'Itens técnicos',
    subtitle: '',
    text: '',
    cta: undefined,
    imagePrompt: undefined,
    bodyLines: [],
    listItems: ['Tensão', 'Corrente', 'Identificação de falhas'],
    listItemMeta: [
      { raw: '⚡ {zap, voltage, energy} Tensão', text: 'Tensão', emojiHint: '⚡', iconHints: ['zap', 'voltage', 'energy'] },
      { raw: '🔌 {plug, current, power} Corrente', text: 'Corrente', emojiHint: '🔌', iconHints: ['plug', 'current', 'power'] },
      { raw: '🚨 {alert, error, warning} Identificação de falhas', text: 'Identificação de falhas', emojiHint: '🚨', iconHints: ['alert', 'error', 'warning'] },
    ],
    signals: {
      hasExplicitList: true,
      hasImplicitList: false,
      hasNumberStat: false,
      hasComparison: false,
      hasQuestion: false,
      hasCTA: false,
    },
  },
  {
    type: 'list',
    textLength: 44,
    titleLength: 14,
    bodyLength: 0,
    itemCount: 3,
    itemAverageLength: 2,
    visualWeightHint: 'medium',
    hasImagePrompt: false,
    shouldUseImage: false,
    imagePriority: 0,
    prefersBigNumber: false,
  },
  'BOX_GRID',
);

const explicitSemanticCards = explicitSemanticBoxSlide.blocks.filter((block) => block.type === 'CARD');
assert.equal(explicitSemanticBoxSlide.contentTemplate, 'BOX_GRID');
assert.deepEqual(
  explicitSemanticCards.map((block) => block.options?.icon),
  ['Zap', 'Plug', 'AlertTriangle'],
);

const medicalChecklistSlide = composeHeuristicSlide(
  {
    index: 12,
    raw: 'Slide 12\nTítulo: Sintomas comuns\nLista:\n- 🧬 {dna, genetics, heredity} Genética\n- ⚖️ {hormones, balance, health} Alterações hormonais\n- 🤰 {pregnancy, family, maternity} Gravidez\n- 🧍 {stand, legs, fatigue} Longos períodos em pé\n- ⏳ {aging, skin, time} Envelhecimento da pele',
    lines: [
      'Slide 12',
      'Título: Sintomas comuns',
      'Lista:',
      '- 🧬 {dna, genetics, heredity} Genética',
      '- ⚖️ {hormones, balance, health} Alterações hormonais',
      '- 🤰 {pregnancy, family, maternity} Gravidez',
      '- 🧍 {stand, legs, fatigue} Longos períodos em pé',
      '- ⏳ {aging, skin, time} Envelhecimento da pele',
    ],
    titleCandidate: 'Sintomas comuns',
    title: 'Sintomas comuns',
    subtitle: '',
    text: '',
    cta: undefined,
    imagePrompt: undefined,
    bodyLines: [],
    listItems: ['Genética', 'Alterações hormonais', 'Gravidez', 'Longos períodos em pé', 'Envelhecimento da pele'],
    listItemMeta: [
      { raw: '🧬 {dna, genetics, heredity} Genética', text: 'Genética', emojiHint: '🧬', iconHints: ['dna', 'genetics', 'heredity'] },
      { raw: '⚖️ {hormones, balance, health} Alterações hormonais', text: 'Alterações hormonais', emojiHint: '⚖️', iconHints: ['hormones', 'balance', 'health'] },
      { raw: '🤰 {pregnancy, family, maternity} Gravidez', text: 'Gravidez', emojiHint: '🤰', iconHints: ['pregnancy', 'family', 'maternity'] },
      { raw: '🧍 {stand, legs, fatigue} Longos períodos em pé', text: 'Longos períodos em pé', emojiHint: '🧍', iconHints: ['stand', 'legs', 'fatigue'] },
      { raw: '⏳ {aging, skin, time} Envelhecimento da pele', text: 'Envelhecimento da pele', emojiHint: '⏳', iconHints: ['aging', 'skin', 'time'] },
    ],
    signals: {
      hasExplicitList: true,
      hasImplicitList: false,
      hasNumberStat: false,
      hasComparison: false,
      hasQuestion: false,
      hasCTA: false,
    },
  },
  {
    type: 'list',
    textLength: 78,
    titleLength: 15,
    bodyLength: 0,
    itemCount: 5,
    itemAverageLength: 2,
    visualWeightHint: 'medium',
    hasImagePrompt: false,
    shouldUseImage: false,
    imagePriority: 0,
    prefersBigNumber: false,
  },
  'CHECKLIST',
);

const medicalChecklistBlock = medicalChecklistSlide.blocks.find((block) => block.type === 'LIST');
assert.deepEqual(
  (medicalChecklistBlock?.options?.itemIcons as string[]) || [],
  ['Dna', 'Scale', 'Baby', 'PersonStanding', 'Hourglass'],
);

const ctaSlide = composeHeuristicSlide(
  {
    index: 11,
    raw: 'Slide 11\nTítulo: Quer acelerar sua gestão?\nTexto: A equipe inteira ganha clareza com um processo validado.\nCTA: ⚡ {bolt, speed, performance} Fale com nosso time',
    lines: [
      'Slide 11',
      'Título: Quer acelerar sua gestão?',
      'Texto: A equipe inteira ganha clareza com um processo validado.',
      'CTA: ⚡ {bolt, speed, performance} Fale com nosso time',
    ],
    titleCandidate: 'Quer acelerar sua gestão?',
    title: 'Quer acelerar sua gestão?',
    subtitle: '',
    text: 'A equipe inteira ganha clareza com um processo validado.',
    cta: 'Fale com nosso time',
    ctaMeta: { raw: '⚡ {bolt, speed, performance} Fale com nosso time', text: 'Fale com nosso time', emojiHint: '⚡', iconHints: ['bolt', 'speed', 'performance'] },
    imagePrompt: undefined,
    bodyLines: [],
    listItems: [],
    signals: {
      hasExplicitList: false,
      hasImplicitList: false,
      hasNumberStat: false,
      hasComparison: false,
      hasQuestion: true,
      hasCTA: true,
    },
  },
  {
    type: 'cta',
    textLength: 78,
    titleLength: 24,
    bodyLength: 54,
    itemCount: 0,
    itemAverageLength: 0,
    visualWeightHint: 'medium',
    hasImagePrompt: false,
    shouldUseImage: false,
    imagePriority: 0,
    prefersBigNumber: false,
  },
  'HERO',
);

const ctaBadge = ctaSlide.blocks.find((block) => block.type === 'BADGE');
const ctaBody = ctaSlide.blocks.find((block) => block.type === 'PARAGRAPH');
assert.equal(ctaSlide.contentTemplate, 'HERO');
assert.equal(ctaSlide.blocks[0]?.content, 'Quer acelerar sua gestão?');
assert.equal(ctaSlide.blocks[0]?.options?.fontSize, 84);
assert.equal(ctaBody?.options?.fontSize, 36);
assert.equal(ctaBadge?.content, 'Fale com nosso time');
assert.equal(ctaBadge?.options?.icon, 'Zap');
assert.equal(ctaBadge?.options?.fontSize, 36);

const structuralCtaSlide = composeHeuristicSlide(
  {
    index: 6,
    raw: 'Slide 6\nTexto: Ficou com dúvida sobre o congelamento?\nCTA: Deixe sua pergunta aqui!',
    lines: [
      'Slide 6',
      'Texto: Ficou com dúvida sobre o congelamento?',
      'CTA: Deixe sua pergunta aqui!',
    ],
    titleCandidate: 'Slide 6',
    title: undefined,
    subtitle: '',
    text: 'Ficou com dúvida sobre o congelamento?',
    cta: 'Deixe sua pergunta aqui!',
    ctaMeta: { raw: 'Deixe sua pergunta aqui!', text: 'Deixe sua pergunta aqui!', iconHints: [] },
    imagePrompt: undefined,
    bodyLines: [],
    listItems: [],
    signals: {
      hasExplicitList: false,
      hasImplicitList: false,
      hasNumberStat: false,
      hasComparison: false,
      hasQuestion: true,
      hasCTA: true,
    },
  },
  {
    type: 'cta',
    textLength: 58,
    titleLength: 7,
    bodyLength: 39,
    itemCount: 0,
    itemAverageLength: 0,
    visualWeightHint: 'heavy',
    hasImagePrompt: false,
    shouldUseImage: false,
    imagePriority: 0,
    prefersBigNumber: false,
  },
  'HERO',
);

assert.equal(structuralCtaSlide.blocks[0]?.content, 'Ficou com dúvida sobre o congelamento?');

const statSlide = composeHeuristicSlide(
  {
    index: 3,
    raw: 'Slide 3\nTítulo: 95% da conta\nSubtítulo: Economia real\nTexto: Gerar a própria energia ainda compensa',
    lines: ['Slide 3', 'Título: 95% da conta', 'Subtítulo: Economia real', 'Texto: Gerar a própria energia ainda compensa'],
    titleCandidate: '95% da conta',
    title: '95% da conta',
    subtitle: 'Economia real',
    text: 'Gerar a própria energia ainda compensa',
    cta: undefined,
    imagePrompt: undefined,
    bodyLines: [],
    listItems: [],
    signals: {
      hasExplicitList: false,
      hasImplicitList: false,
      hasNumberStat: true,
      hasComparison: false,
      hasQuestion: false,
      hasCTA: false,
    },
  },
  {
    type: 'stat',
    textLength: 44,
    titleLength: 12,
    bodyLength: 32,
    itemCount: 0,
    itemAverageLength: 0,
    visualWeightHint: 'medium',
    hasImagePrompt: false,
    shouldUseImage: false,
    imagePriority: 0,
    prefersBigNumber: true,
  },
  'HERO',
);

assert.equal(statSlide.template, 'STAT');
assert.equal(statSlide.contentTemplate, 'STAT');
assert.equal(statSlide.imageLayout, 'IMAGE_NONE');
assert.equal(statSlide.blocks[0]?.type, 'TITLE');
assert.equal(statSlide.blocks[0]?.content, '95%');
assert.equal(statSlide.blocks[0]?.options?.fontSize, 132);
assert.equal(statSlide.blocks[1]?.content, '95% da conta');
assert.equal(statSlide.blocks[1]?.options?.fontSize, 36);
assert.equal(statSlide.blocks[2]?.content, 'Economia real');
assert.equal(statSlide.blocks[2]?.options?.fontSize, 36);
assert.equal(statSlide.blocks[3]?.content, 'Gerar a própria energia ainda compensa');
assert.equal(statSlide.blocks[3]?.options?.fontSize, 36);

const editorialSlide = composeHeuristicSlide(
  {
    index: 2,
    raw: 'Slide 2',
    lines: ['Slide 2'],
    titleCandidate: 'Vende mais!',
    title: 'Vende mais!',
    subtitle: 'Uma marca consistente',
    text: 'Quando imagens seguem uma linguagem visual coerente.',
    cta: undefined,
    imagePrompt: 'Moodboard visual de marca consistente',
    editorial: {
      intro: 'Uma marca consistente',
      headline: 'Vende mais!',
      support: 'Quando imagens seguem uma linguagem visual coerente, paleta, luz e composição, o cérebro do cliente associa [[profissionalismo e confiança]].',
      highlight: 'E confiança reduz resistência à compra!',
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
  {
    type: 'single_point',
    textLength: 174,
    titleLength: 11,
    bodyLength: 144,
    itemCount: 0,
    itemAverageLength: 0,
    visualWeightHint: 'medium',
    hasImagePrompt: true,
    shouldUseImage: true,
    imagePriority: 86,
    prefersBigNumber: false,
  },
  'HERO',
  'IMAGE_BOX_RIGHT',
);

assert.equal(editorialSlide.template, 'HERO');
assert.equal(editorialSlide.contentTemplate, 'HERO');
assert.equal(editorialSlide.imageLayout, 'IMAGE_BOX_RIGHT');
assert.equal(editorialSlide.blocks[0]?.type, 'PARAGRAPH');
assert.equal(editorialSlide.blocks[0]?.content, 'Uma marca consistente');
assert.equal(editorialSlide.blocks[0]?.options?.fontSize, 34);
assert.equal(editorialSlide.blocks[0]?.options?.align, 'left');
assert.equal(editorialSlide.blocks[0]?.options?.semanticRole, 'intro');
assert.equal(editorialSlide.blocks[1]?.type, 'TITLE');
assert.equal(editorialSlide.blocks[1]?.content, 'Vende mais!');
assert.equal(editorialSlide.blocks[1]?.options?.fontSize, 132);
assert.equal(editorialSlide.blocks[1]?.options?.fontWeight, 900);
assert.equal(editorialSlide.blocks[1]?.options?.letterSpacing, 0);
assert.equal(editorialSlide.blocks[1]?.options?.semanticRole, 'headline');
assert.equal(editorialSlide.blocks[2]?.type, 'PARAGRAPH');
assert.equal(editorialSlide.blocks[2]?.content, 'Quando imagens seguem uma linguagem visual coerente, paleta, luz e composição, o cérebro do cliente associa [[profissionalismo e confiança]].');
assert.equal(editorialSlide.blocks[2]?.options?.semanticRole, 'support');
assert.equal(editorialSlide.blocks[3]?.type, 'PARAGRAPH');
assert.equal(editorialSlide.blocks[3]?.content, '[[E confiança reduz resistência à compra!]]');
assert.equal(editorialSlide.blocks[3]?.options?.semanticRole, 'highlight');
assert.equal(editorialSlide.blocks[3]?.options?.lineBreakMode, 'manual');
assert.equal(editorialSlide.blocks[3]?.options?.manualBreaks, '[[E confiança reduz resistência à compra!]]');
assert.equal(editorialSlide.blocks[3]?.options?.icon, undefined);
assert.equal(editorialSlide.blocks.some((block) => block.content === 'Fale com nossa equipe'), false);

const editorialRightAlignedSlide = composeHeuristicSlide(
  {
    index: 5,
    raw: 'Slide 5',
    lines: ['Slide 5'],
    titleCandidate: 'Fotografar o produto.',
    title: 'Fotografar o produto.',
    subtitle: 'Erro comum',
    text: undefined,
    cta: undefined,
    imagePrompt: 'Produto em cena editorial',
    editorial: {
      intro: 'Erro comum',
      headline: 'Fotografar o produto.',
      body: 'Quando deveria fotografar a transformação.',
      highlight: 'Mostre o depois.\nMostre o sentimento.\n[[Esse é o diferencial.]]',
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
  {
    type: 'single_point',
    textLength: 120,
    titleLength: 21,
    bodyLength: 80,
    itemCount: 0,
    itemAverageLength: 0,
    visualWeightHint: 'medium',
    hasImagePrompt: true,
    shouldUseImage: true,
    imagePriority: 80,
    prefersBigNumber: false,
  },
  'HERO',
  'IMAGE_BOX_LEFT',
);

assert.equal(editorialRightAlignedSlide.options?.contentHorizontalAlign, 'right');
assert.equal(editorialRightAlignedSlide.blocks[0]?.options?.align, 'right');
assert.equal(editorialRightAlignedSlide.blocks[1]?.options?.align, 'right');
assert.equal(editorialRightAlignedSlide.blocks[1]?.options?.fontSize, 124);
const rightAlignedHighlights = editorialRightAlignedSlide.blocks.filter((block) => (
  block.type === 'PARAGRAPH'
  && typeof block.content === 'string'
  && block.content.startsWith('[[')
));
assert.equal(rightAlignedHighlights.length, 1);
assert.equal(
  rightAlignedHighlights[0]?.content,
  '[[Mostre o depois.]]\n[[Mostre o sentimento.]]\n[[Esse é o diferencial.]]',
);
assert.equal(rightAlignedHighlights.every((block) => block.options?.align === 'right'), true);
assert.equal(rightAlignedHighlights.every((block) => block.options?.lineBreakMode === 'manual'), true);
assert.equal(
  rightAlignedHighlights[0]?.options?.manualBreaks,
  '[[Mostre o depois.]]\n[[Mostre o sentimento.]]\n[[Esse é o diferencial.]]',
);
assert.equal(rightAlignedHighlights[0]?.options?.lineHeight, 1.18);
assert.equal(rightAlignedHighlights.every((block) => block.options?.icon === undefined), true);

const editorialLongHeadlineSlide = composeHeuristicSlide(
  {
    index: 6,
    raw: 'Slide 6',
    lines: ['Slide 6'],
    titleCandidate: 'Sua marca está sendo percebida do jeito certo pelo cliente certo?',
    title: 'Sua marca está sendo percebida do jeito certo pelo cliente certo?',
    subtitle: 'Diagnóstico visual',
    text: undefined,
    cta: undefined,
    imagePrompt: 'Retrato editorial de branding',
    editorial: {
      intro: 'Diagnóstico visual',
      headline: 'Sua marca está sendo percebida do jeito certo pelo cliente certo?',
      body: 'A percepção começa antes da compra.',
    },
    bodyLines: [],
    listItems: [],
    signals: {
      hasExplicitList: false,
      hasImplicitList: false,
      hasNumberStat: false,
      hasComparison: false,
      hasQuestion: true,
      hasCTA: false,
    },
  },
  {
    type: 'single_point',
    textLength: 160,
    titleLength: 64,
    bodyLength: 36,
    itemCount: 0,
    itemAverageLength: 0,
    visualWeightHint: 'medium',
    hasImagePrompt: true,
    shouldUseImage: true,
    imagePriority: 78,
    prefersBigNumber: false,
  },
  'HERO',
  'IMAGE_BOX_RIGHT',
);

assert.equal(editorialLongHeadlineSlide.blocks[1]?.type, 'TITLE');
assert.equal(editorialLongHeadlineSlide.blocks[1]?.options?.fontSize, 104);

const editorialNoImageHeadlineSlide = composeHeuristicSlide(
  {
    index: 7,
    raw: 'Slide 7',
    lines: ['Slide 7'],
    titleCandidate: 'Vende mais!',
    title: 'Vende mais!',
    subtitle: 'Uma marca consistente',
    text: undefined,
    cta: undefined,
    imagePrompt: undefined,
    editorial: {
      intro: 'Uma marca consistente',
      headline: 'Vende mais!',
      body: 'Quando existe coerência visual, existe confiança.',
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
  {
    type: 'single_point',
    textLength: 92,
    titleLength: 11,
    bodyLength: 48,
    itemCount: 0,
    itemAverageLength: 0,
    visualWeightHint: 'heavy',
    hasImagePrompt: false,
    shouldUseImage: false,
    imagePriority: 0,
    prefersBigNumber: false,
  },
  'HERO',
  'IMAGE_NONE',
);

assert.equal(editorialNoImageHeadlineSlide.blocks[1]?.type, 'TITLE');
assert.equal(editorialNoImageHeadlineSlide.blocks[1]?.options?.fontSize, 156);

const editorialFadeRightSlide = composeHeuristicSlide(
  {
    index: 8,
    raw: 'Slide 8',
    lines: ['Slide 8'],
    titleCandidate: 'Vende mais!',
    title: 'Vende mais!',
    subtitle: 'Uma marca consistente',
    text: undefined,
    cta: undefined,
    imagePrompt: 'Imagem de fundo editorial',
    editorial: {
      intro: 'Uma marca consistente',
      headline: 'Vende mais!',
      body: 'Quando existe coerência visual, existe confiança.',
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
  {
    type: 'single_point',
    textLength: 92,
    titleLength: 11,
    bodyLength: 48,
    itemCount: 0,
    itemAverageLength: 0,
    visualWeightHint: 'heavy',
    hasImagePrompt: true,
    shouldUseImage: true,
    imagePriority: 90,
    prefersBigNumber: false,
  },
  'HERO',
  'IMAGE_FADE_RIGHT',
);

assert.equal(editorialFadeRightSlide.options?.contentHorizontalAlign, 'right');
assert.equal(editorialFadeRightSlide.blocks[0]?.options?.align, 'right');
assert.equal(editorialFadeRightSlide.blocks[1]?.options?.align, 'right');

const editorialFadeLeftSlide = composeHeuristicSlide(
  {
    index: 9,
    raw: 'Slide 9',
    lines: ['Slide 9'],
    titleCandidate: 'Vende mais!',
    title: 'Vende mais!',
    subtitle: 'Uma marca consistente',
    text: undefined,
    cta: undefined,
    imagePrompt: 'Imagem de fundo editorial',
    editorial: {
      intro: 'Uma marca consistente',
      headline: 'Vende mais!',
      body: 'Quando existe coerência visual, existe confiança.',
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
  {
    type: 'single_point',
    textLength: 92,
    titleLength: 11,
    bodyLength: 48,
    itemCount: 0,
    itemAverageLength: 0,
    visualWeightHint: 'heavy',
    hasImagePrompt: true,
    shouldUseImage: true,
    imagePriority: 90,
    prefersBigNumber: false,
  },
  'HERO',
  'IMAGE_FADE_LEFT',
);

assert.equal(editorialFadeLeftSlide.options?.contentHorizontalAlign, 'left');
assert.equal(editorialFadeLeftSlide.blocks[0]?.options?.align, 'left');
assert.equal(editorialFadeLeftSlide.blocks[1]?.options?.align, 'left');

console.log('slide-composer.test.ts passed');
