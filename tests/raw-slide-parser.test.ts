import assert from 'node:assert/strict';
import { parseRawScript } from '../utils/heuristics/raw-slide-parser.ts';

const script = `
Slide 1 - Capa
Título de abertura forte
Texto de apoio curto

Slide 2:
- Primeiro ponto
- Segundo ponto
3. Terceiro ponto
`;

const slides = parseRawScript(script);

assert.equal(slides.length, 2);
assert.equal(slides[0].index, 1);
assert.equal(slides[0].titleCandidate, 'Capa');
assert.equal(slides[0].bodyLines[0], 'Título de abertura forte');
assert.equal(slides[0].bodyLines[1], 'Texto de apoio curto');
assert.equal(slides[0].signals.hasExplicitList, false);
assert.equal(slides[0].signals.hasImplicitList, false);

assert.equal(slides[1].index, 2);
assert.equal(slides[1].titleCandidate, undefined);
assert.deepEqual(slides[1].listItems, ['Primeiro ponto', 'Segundo ponto', 'Terceiro ponto']);
assert.equal(slides[1].signals.hasExplicitList, true);

const implicitSlides = parseRawScript(`
Slide 3
Linha curta um
Linha curta dois
Linha curta tres
`);

assert.deepEqual(implicitSlides[0].listItems, ['Linha curta um', 'Linha curta dois', 'Linha curta tres']);
assert.equal(implicitSlides[0].signals.hasExplicitList || implicitSlides[0].signals.hasImplicitList, true);

const structuredSlides = parseRawScript(`
Slide 1
Título: O checklist de proteção
Subtítulo: 4 pilares técnicos
Texto: O reajuste pode aumentar seu lucro ou travar seu capital.
Lista:
CTA:
Imagem: Farmacêutico analisando relatórios

Slide 2
Título: Análise de giro
Subtítulo: Inteligência sobre o volume
Texto: Nem todo produto merece investimento antes do reajuste.
Lista:
- Priorize itens de Curva A
- Foque no que gera liquidez rápida
CTA:
Imagem:
`);

assert.equal(structuredSlides[0].title, 'O checklist de proteção');
assert.equal(structuredSlides[0].subtitle, '4 pilares técnicos');
assert.equal(structuredSlides[0].text, 'O reajuste pode aumentar seu lucro ou travar seu capital.');
assert.equal(structuredSlides[0].cta, undefined);
assert.equal(structuredSlides[0].imagePrompt, 'Farmacêutico analisando relatórios');
assert.deepEqual(structuredSlides[0].listItems, []);

assert.equal(structuredSlides[1].title, 'Análise de giro');
assert.equal(structuredSlides[1].subtitle, 'Inteligência sobre o volume');
assert.equal(structuredSlides[1].text, 'Nem todo produto merece investimento antes do reajuste.');
assert.deepEqual(structuredSlides[1].listItems, [
  'Priorize itens de Curva A',
  'Foque no que gera liquidez rápida',
]);
assert.equal(structuredSlides[1].imagePrompt, undefined);

const semanticSlides = parseRawScript(`
Slide 1
Título: 📈 {trend-up, growth, analytics} O reajuste pode aumentar seu lucro
Subtítulo: 🧠 {brain, strategy} Decisão orientada por dados
Texto: ⚠️ {alert, risk} Comprar sem análise trava capital
Lista:
- 📊 {bar-chart, analytics, growth} Priorize itens de **Curva A**
- ⚡ {bolt, speed, performance} Foque no que gera **liquidez rápida**
CTA: 📞 {phone, contact, action} Fale com a nossa equipe
Imagem: 🏥 {clinic, healthcare} Farmacêutico analisando relatórios
`);

assert.equal(semanticSlides[0].title, 'O reajuste pode aumentar seu lucro');
assert.equal(semanticSlides[0].subtitle, 'Decisão orientada por dados');
assert.equal(semanticSlides[0].text, 'Comprar sem análise trava capital');
assert.equal(semanticSlides[0].cta, 'Fale com a nossa equipe');
assert.equal(semanticSlides[0].imagePrompt, 'Farmacêutico analisando relatórios');
assert.deepEqual(semanticSlides[0].listItems, [
  'Priorize itens de **Curva A**',
  'Foque no que gera **liquidez rápida**',
]);

assert.equal(semanticSlides[0].titleMeta?.emojiHint, '📈');
assert.deepEqual(semanticSlides[0].titleMeta?.iconHints, ['trend-up', 'growth', 'analytics']);
assert.equal(semanticSlides[0].titleMeta?.text, 'O reajuste pode aumentar seu lucro');

assert.equal(semanticSlides[0].subtitleMeta?.emojiHint, '🧠');
assert.deepEqual(semanticSlides[0].subtitleMeta?.iconHints, ['brain', 'strategy']);
assert.equal(semanticSlides[0].textMeta?.emojiHint, '⚠️');
assert.deepEqual(semanticSlides[0].textMeta?.iconHints, ['alert', 'risk']);
assert.equal(semanticSlides[0].ctaMeta?.emojiHint, '📞');
assert.deepEqual(semanticSlides[0].ctaMeta?.iconHints, ['phone', 'contact', 'action']);
assert.equal(semanticSlides[0].imagePromptMeta?.emojiHint, '🏥');
assert.deepEqual(semanticSlides[0].imagePromptMeta?.iconHints, ['clinic', 'healthcare']);

assert.equal(semanticSlides[0].listItemMeta[0]?.emojiHint, '📊');
assert.deepEqual(semanticSlides[0].listItemMeta[0]?.iconHints, ['bar-chart', 'analytics', 'growth']);
assert.equal(semanticSlides[0].listItemMeta[0]?.text, 'Priorize itens de **Curva A**');
assert.equal(semanticSlides[0].listItemMeta[1]?.emojiHint, '⚡');
assert.deepEqual(semanticSlides[0].listItemMeta[1]?.iconHints, ['bolt', 'speed', 'performance']);
assert.equal(semanticSlides[0].listItemMeta[1]?.text, 'Foque no que gera **liquidez rápida**');

const coverSlides = parseRawScript(`
Capa
Apoio Superior: O checklist de proteção para o reajuste anual.
Destaque: [[Quatro pilares técnicos]]
Apoio Inferior: para blindar o caixa da sua farmácia.
Imagem Fundo:
Imagem Destaque:

Slide 2
Título: 01. ANÁLISE DE GIRO
Subtítulo: INTELIGÊNCIA SOBRE O VOLUME.
Texto: O aporte financeiro deve ser concentrado em itens de Curva A.
`);

assert.equal(coverSlides.length, 2);
assert.equal(coverSlides[0].kind, 'cover');
assert.equal(coverSlides[0].cover?.supportTop, 'O checklist de proteção para o reajuste anual.');
assert.equal(coverSlides[0].cover?.highlight, '[[Quatro pilares técnicos]]');
assert.equal(coverSlides[0].cover?.supportBottom, 'para blindar o caixa da sua farmácia.');
assert.equal(coverSlides[0].title, '[[Quatro pilares técnicos]]');
assert.equal(coverSlides[0].subtitle, 'O checklist de proteção para o reajuste anual.');
assert.equal(coverSlides[0].text, 'para blindar o caixa da sua farmácia.');
assert.equal(coverSlides[1].kind, 'slide');

const coverSlidesWithColon = parseRawScript(`
Capa:
Apoio Superior: Você sente peso nas pernas?
Destaque: [[Microvasos]]
Apoio Inferior: Eles podem ser um sinal de insuficiência venosa.

Slide 2
Título: Continuação
Texto: Conteúdo normal
`);

assert.equal(coverSlidesWithColon.length, 2);
assert.equal(coverSlidesWithColon[0].kind, 'cover');
assert.equal(coverSlidesWithColon[0].cover?.supportTop, 'Você sente peso nas pernas?');
assert.equal(coverSlidesWithColon[0].cover?.highlight, '[[Microvasos]]');
assert.equal(coverSlidesWithColon[0].cover?.supportBottom, 'Eles podem ser um sinal de insuficiência venosa.');
assert.equal(coverSlidesWithColon[1].kind, 'slide');

const multilineCoverSlides = parseRawScript(`
Capa

Apoio Superior:
Nem toda dor na

Destaque:
bexiga

Apoio Inferior:
é da bexiga.

Imagem Fundo:
Mulher com mão na região pélvica, estética mais artística (PB/granulado)

Imagem Destaque:

Slide 2
Título:
Tudo parece uma infecção urinária.
`);

assert.equal(multilineCoverSlides.length, 2);
assert.equal(multilineCoverSlides[0].kind, 'cover');
assert.equal(multilineCoverSlides[0].cover?.supportTop, 'Nem toda dor na');
assert.equal(multilineCoverSlides[0].cover?.highlight, 'bexiga');
assert.equal(multilineCoverSlides[0].cover?.supportBottom, 'é da bexiga.');
assert.equal(multilineCoverSlides[0].cover?.backgroundImage, 'Mulher com mão na região pélvica, estética mais artística (PB/granulado)');
assert.equal(multilineCoverSlides[0].title, 'bexiga');
assert.equal(multilineCoverSlides[0].subtitle, 'Nem toda dor na');
assert.equal(multilineCoverSlides[0].text, 'é da bexiga.');
assert.equal(multilineCoverSlides[1].kind, 'slide');

const multilineFieldSlides = parseRawScript(`
Slide 5
Título:
Chega de ficar sem resposta.

Texto:
Se o seu sistema precisa de atenção, chame quem tem **18 anos de bagagem na elétrica**.

CTA:
☀️ {sun, solar, energy} Clique no link da bio e fale com a Fatsul!

Imagem:
Técnico em campo, ambiente elétrico profissional
`);

assert.equal(multilineFieldSlides[0].title, 'Chega de ficar sem resposta.');
assert.equal(multilineFieldSlides[0].text, 'Se o seu sistema precisa de atenção, chame quem tem **18 anos de bagagem na elétrica**.');
assert.equal(multilineFieldSlides[0].cta, 'Clique no link da bio e fale com a Fatsul!');
assert.equal(multilineFieldSlides[0].ctaMeta?.emojiHint, '☀️');
assert.deepEqual(multilineFieldSlides[0].ctaMeta?.iconHints, ['sun', 'solar', 'energy']);
assert.equal(multilineFieldSlides[0].imagePrompt, 'Técnico em campo, ambiente elétrico profissional');
assert.deepEqual(multilineFieldSlides[0].bodyLines, []);

const multilineTextFieldSlides = parseRawScript(`
Slide 2

Título:
Não existe uma única solução

Subtítulo:

Texto:
Quando a mama cai,
não existe uma única solução.

O que define o melhor caminho
é o volume, o tecido
e o resultado que você espera.

Lista:

CTA:

Imagem:
`);

assert.equal(multilineTextFieldSlides[0].title, 'Não existe uma única solução');
assert.equal(
  multilineTextFieldSlides[0].text,
  'Quando a mama cai, não existe uma única solução. O que define o melhor caminho é o volume, o tecido e o resultado que você espera.',
);
assert.deepEqual(multilineTextFieldSlides[0].bodyLines, []);

const editorialSlides = parseRawScript(`
Slide 2

Intro:
Uma marca consistente

Headline:
Vende mais!

Support:
Quando imagens seguem uma linguagem visual coerente, paleta, luz e composição, o cérebro do cliente associa [[profissionalismo e confiança]].

Highlight:
E confiança reduz resistência à compra!

Imagem:
Moodboard visual de marca consistente, paleta coerente, fotografia editorial
`);

assert.equal(editorialSlides[0].editorial?.intro, 'Uma marca consistente');
assert.equal(editorialSlides[0].editorial?.headline, 'Vende mais!');
assert.equal(
  editorialSlides[0].editorial?.support,
  'Quando imagens seguem uma linguagem visual coerente, paleta, luz e composição, o cérebro do cliente associa [[profissionalismo e confiança]].',
);
assert.equal(editorialSlides[0].editorial?.highlight, 'E confiança reduz resistência à compra!');
assert.equal(editorialSlides[0].cta, undefined);
assert.equal(editorialSlides[0].imagePrompt, 'Moodboard visual de marca consistente, paleta coerente, fotografia editorial');
assert.equal(editorialSlides[0].title, 'Vende mais!');
assert.equal(editorialSlides[0].subtitle, 'Uma marca consistente');

const multilineHighlightSlides = parseRawScript(`
Slide 5

Intro:
Erro comum

Headline:
Fotografar o produto.

Highlight:
Mostre o depois.
Mostre o sentimento.

[[Esse é o diferencial.]]

Imagem:
`);

assert.equal(
  multilineHighlightSlides[0].editorial?.highlight,
  'Mostre o depois.\nMostre o sentimento.\n[[Esse é o diferencial.]]',
);

console.log('raw-slide-parser.test.ts passed');
