import assert from 'node:assert/strict';
import { carouselSchema } from '../template-dsl/schema.ts';
import { buildCarouselFromScript } from '../utils/heuristics/script-to-carousel.ts';
import { getTemplateProfile } from '../utils/heuristics/template-profiles.ts';

const script = `
Slide 1
Título: O checklist de proteção para o reajuste anual
Subtítulo: 4 pilares técnicos para blindar o caixa da sua farmácia
Texto: O reajuste pode aumentar seu lucro ou travar seu capital. A diferença está na preparação.
Lista:
CTA:
Imagem: Farmacêutico analisando relatórios em tela com gráficos e números

Slide 2
Título: Análise de giro
Subtítulo: Inteligência sobre o volume
Texto: Nem todo produto merece investimento antes do reajuste.
Lista:
- Priorize itens de Curva A
- Foque no que gera liquidez rápida
- Use dados reais de giro
CTA:
Imagem:

Slide 3
Título: Revisão de estoque
Subtítulo: Conferência sistêmica rigorosa
Texto: Sem precisão, qualquer planejamento vira risco.
Lista:
- Valide quantidades reais
- Evite excesso e ruptura
- Corrija divergências antes de comprar
CTA:
Imagem:

Slide 4
Título: Avaliação de fornecedores
Subtítulo: Condições que impactam o lucro
Texto: Comprar bem é tão importante quanto vender bem.
Lista:
- Compare tabelas e prazos
- Negocie com base no histórico
- Avalie custo vs capital parado
CTA:
Imagem:

Slide 5
Título: Compras estratégicas
Subtítulo: Execução baseada em dados
Texto: Aqui o planejamento vira resultado.
Lista:
- Defina cronograma de compras
- Antecipe-se ao reajuste
- Atualize preços no timing certo
CTA:
Imagem:

Slide 6
Título: Sua gestão é baseada em dados ou palpites?
Subtítulo: O que separa lucro de sobrevivência
Texto: Farmácias lucrativas seguem método. As outras reagem ao mercado.
Lista:
- Organização técnica aumenta margem
- Decisão com dados reduz erros
- Gestão previsível gera crescimento
CTA:
Imagem: Farmacêutico confiante no balcão, ambiente organizado e moderno
`;

const carousel = buildCarouselFromScript(script);
const result = carouselSchema.safeParse(carousel);
const textualContents = carousel.slides.flatMap((slide) =>
  slide.blocks.flatMap((block) =>
    Array.isArray(block.content) ? block.content : typeof block.content === 'string' ? [block.content] : [],
  ),
);
const slidesWithImages = carousel.slides.filter((slide) => slide.image && slide.image.type !== 'NONE');
const templateFamilies = carousel.slides.map((slide) => getTemplateProfile(slide.contentTemplate || slide.template)?.visualFamily ?? slide.contentTemplate ?? slide.template);
const renderSignatures = carousel.slides.map((slide) => getTemplateProfile(slide.contentTemplate || slide.template)?.renderSignature ?? slide.contentTemplate ?? slide.template);
const templateWeights = carousel.slides.map((slide) => getTemplateProfile(slide.contentTemplate || slide.template)?.visualWeight ?? 'medium');
const contentTemplates = carousel.slides.map((slide) => slide.contentTemplate);
const heuristicTemplates = carousel.slides.slice(1).map((slide) => slide.template);
const imageLayouts = carousel.slides.map((slide) => slide.imageLayout);
const canonicalContentTemplates = new Set(['HERO', 'STAT', 'CHECKLIST', 'BOX_GRID']);

assert.equal(result.success, true);
assert.equal(carousel.slides.length, 6);
assert.equal(contentTemplates.every((templateId) => typeof templateId === 'string' && canonicalContentTemplates.has(templateId || '')), true);
assert.equal(heuristicTemplates.every((templateId) => typeof templateId === 'string' && canonicalContentTemplates.has(templateId || '')), true);
assert.equal(imageLayouts.every((layoutId) => typeof layoutId === 'string' && layoutId.length > 0), true);
assert.equal(carousel.slides[0]?.template, 'HERO');
assert.equal(carousel.slides[0]?.cover?.variant, 'COVER_HIERARCHY_HERO');
assert.equal(carousel.slides[0]?.cover?.text?.eyebrow, '4 pilares técnicos para blindar o caixa da sua farmácia');
assert.equal(carousel.slides[0]?.cover?.text?.titleMain, 'O checklist de proteção para o reajuste anual');
assert.equal(carousel.slides.every((slide) => canonicalContentTemplates.has(slide.contentTemplate || '')), true);
assert.notEqual(carousel.slides[0]?.template, carousel.slides[1]?.template);
assert.ok(carousel.slides.every((slide) => slide.blocks.length > 0));
assert.ok(carousel.slides[1]?.blocks.some((block) => block.type === 'LIST' || block.type === 'BOX' || block.type === 'CARD' || block.type === 'BADGE'));
assert.ok(slidesWithImages.length >= 2);
assert.ok(carousel.slides.filter((slide) => slide.imageLayout !== 'IMAGE_NONE').length >= 2);
assert.equal(carousel.slides[0]?.imageLayout, 'IMAGE_NONE');
assert.ok(!carousel.slides[0]?.image || carousel.slides[0]?.image.type === 'NONE');
assert.ok(carousel.slides[5]?.image);
assert.ok(textualContents.every((content) => !/^(T[ií]tulo|Subt[ií]tulo|Texto|Lista|CTA|Imagem):/i.test(content)));
assert.ok(carousel.slides[1]?.blocks.some((block) => block.content === 'Análise de giro'));
assert.ok(carousel.slides[5]?.blocks.some((block) => block.content === 'Sua gestão é baseada em dados ou palpites?'));
assert.notEqual(carousel.slides[0]?.template, carousel.slides[5]?.template);

for (let index = 2; index < templateFamilies.length; index += 1) {
  assert.notEqual(
    templateFamilies[index - 2] === templateFamilies[index - 1] && templateFamilies[index - 1] === templateFamilies[index],
    true,
  );
  assert.notEqual(
    renderSignatures[index - 2] === renderSignatures[index - 1] && renderSignatures[index - 1] === renderSignatures[index],
    true,
  );
  assert.notEqual(
    templateWeights[index - 2] === templateWeights[index - 1] && templateWeights[index - 1] === templateWeights[index],
    true,
  );
}

console.log('script-to-carousel.test.ts passed');

const coverBlockScript = `
Capa
Apoio Superior: O checklist de proteção para o reajuste anual.
Destaque: [[Quatro pilares técnicos]]
Apoio Inferior: para blindar o caixa da sua farmácia.
Imagem Fundo:
Imagem Destaque: Farmacêutica recortada em PNG

Slide 2
Título: 01. ANÁLISE DE GIRO
Subtítulo: INTELIGÊNCIA SOBRE O VOLUME.
Texto: O aporte financeiro deve ser concentrado em itens de Curva A. Utilize os relatórios de giro do sistema HOS para identificar onde a valorização do estoque trará liquidez imediata.
Lista:
CTA:
Imagem:
`;

const coverBlockCarousel = buildCarouselFromScript(coverBlockScript);

assert.equal(coverBlockCarousel.slides[0]?.cover?.text?.eyebrow, 'O checklist de proteção para o reajuste anual.');
assert.equal(coverBlockCarousel.slides[0]?.cover?.text?.titleMain, '[[Quatro pilares técnicos]]');
assert.equal(coverBlockCarousel.slides[0]?.cover?.text?.supportingLine, 'para blindar o caixa da sua farmácia.');
assert.equal(coverBlockCarousel.slides[0]?.cover?.images?.foregroundImage, undefined);
assert.equal(coverBlockCarousel.slides[0]?.cover?.images?.foregroundPrompt, 'Farmacêutica recortada em PNG');
assert.equal(coverBlockCarousel.slides[0]?.cover?.images?.foregroundMode, 'none');
assert.equal(coverBlockCarousel.slides[0]?.template, 'HERO');
assert.equal(coverBlockCarousel.slides[0]?.contentTemplate, 'HERO');
assert.ok(coverBlockCarousel.slides[1]?.blocks.some((block) => block.content === '01. ANÁLISE DE GIRO'));

const multilineCoverCarousel = buildCarouselFromScript(`
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

assert.equal(multilineCoverCarousel.slides[0]?.cover?.text?.eyebrow, 'Nem toda dor na');
assert.equal(multilineCoverCarousel.slides[0]?.cover?.text?.titleMain, 'bexiga');
assert.equal(multilineCoverCarousel.slides[0]?.cover?.text?.supportingLine, 'é da bexiga.');
assert.equal(multilineCoverCarousel.slides[0]?.cover?.images?.backgroundImage, undefined);
assert.equal(multilineCoverCarousel.slides[0]?.cover?.images?.backgroundPrompt, 'Mulher com mão na região pélvica, estética mais artística (PB/granulado)');
assert.equal(multilineCoverCarousel.slides[0]?.blocks[0]?.content, 'bexiga');

const ctaScript = `
Slide 1
Título: Capa de abertura
Subtítulo:
Texto: Texto da capa
Lista:
CTA:
Imagem:

Slide 2
Título: Quer organizar seu reajuste com segurança?
Subtítulo:
Texto: Transforme sua rotina de compras em um processo previsível.
Lista:
CTA: {calendar, planning, schedule} Agende sua demonstração
Imagem:
`;

const ctaCarousel = buildCarouselFromScript(ctaScript);
const ctaBadge = ctaCarousel.slides[1]?.blocks.find((block) => block.type === 'BADGE');

assert.notEqual(ctaCarousel.slides[1]?.contentTemplate, 'CTA_FINAL_CARD');
assert.equal(ctaCarousel.slides[1]?.contentTemplate, 'HERO');
assert.equal(ctaCarousel.slides[1]?.imageLayout, 'IMAGE_NONE');
assert.equal(ctaBadge?.type, 'BADGE');
assert.equal(ctaBadge?.content, 'Agende sua demonstração');
assert.equal(ctaBadge?.options?.icon, 'Calendar');

const ctaEmojiScript = `
Slide 1
Título: Capa de abertura
Subtítulo:
Texto: Texto da capa
Lista:
CTA:
Imagem:

Slide 2
Título: Quer acelerar sua gestão?
Subtítulo:
Texto: A equipe inteira ganha clareza com um processo validado.
Lista:
CTA: ⚡ {bolt, speed, performance} Fale com nosso time
Imagem:
`;

const ctaEmojiCarousel = buildCarouselFromScript(ctaEmojiScript);
const ctaEmojiBadge = ctaEmojiCarousel.slides[1]?.blocks.find((block) => block.type === 'BADGE');
const ctaEmojiBody = ctaEmojiCarousel.slides[1]?.blocks.find((block) => block.type === 'PARAGRAPH');

assert.notEqual(ctaEmojiCarousel.slides[1]?.contentTemplate, 'CTA_FINAL_CARD');
assert.equal(ctaEmojiCarousel.slides[1]?.contentTemplate, 'HERO');
assert.equal(ctaEmojiCarousel.slides[1]?.imageLayout, 'IMAGE_NONE');
assert.equal(ctaEmojiBadge?.type, 'BADGE');
assert.equal(ctaEmojiBadge?.content, 'Fale com nosso time');
assert.equal(ctaEmojiBadge?.options?.icon, 'Zap');
assert.equal(ctaEmojiBody?.options?.fontSize, 36);
assert.equal(ctaEmojiBadge?.options?.fontSize, 36);

const structuralLabelScript = `
Slide 1
Título: Capa
Texto: abertura

Slide 6
Texto: Ficou com dúvida sobre o congelamento?
CTA: Deixe sua pergunta aqui!
Imagem:
`;

const structuralLabelCarousel = buildCarouselFromScript(structuralLabelScript);

assert.equal(structuralLabelCarousel.slides[1]?.blocks[0]?.content, 'Ficou com dúvida sobre o congelamento?');
assert.ok(!structuralLabelCarousel.slides[1]?.blocks.some((block) => block.content === 'Slide 6'));

const multilineBodyScript = `
Slide 1
Título: Capa
Texto: abertura

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
`;

const multilineBodyCarousel = buildCarouselFromScript(multilineBodyScript);
const multilineBodyParagraphs = multilineBodyCarousel.slides[1]?.blocks.filter((block) => block.type === 'PARAGRAPH') ?? [];

assert.ok(multilineBodyParagraphs.some((block) =>
  typeof block.content === 'string' &&
  block.content.includes('Quando a mama cai, não existe uma única solução. O que define o melhor caminho é o volume, o tecido e o resultado que você espera.'),
));
assert.equal(multilineBodyParagraphs.length, 1);

const authorityYearsScript = `
Slide 1
Título: Capa
Texto: abertura

Slide 5
Título:
Chega de ficar sem resposta.

Subtítulo:

Texto:
Se o seu sistema precisa de atenção, chame quem tem **18 anos de bagagem na elétrica**.

Lista:

CTA:
☀️ {sun, solar, energy} Clique no link da bio e fale com a Fatsul!

Imagem:
`;

const authorityYearsCarousel = buildCarouselFromScript(authorityYearsScript);
const authorityYearsTitle = authorityYearsCarousel.slides[1]?.blocks.find((block) => block.type === 'TITLE');
const authorityYearsBadge = authorityYearsCarousel.slides[1]?.blocks.find((block) => block.type === 'BADGE');

assert.equal(authorityYearsCarousel.slides[1]?.contentTemplate, 'HERO');
assert.notEqual(authorityYearsCarousel.slides[1]?.contentTemplate, 'STAT');
assert.equal(authorityYearsTitle?.content, 'Chega de ficar sem resposta.');
assert.equal(authorityYearsBadge?.content, 'Clique no link da bio e fale com a Fatsul!');
assert.equal(authorityYearsBadge?.options?.icon, 'Sun');
assert.ok(!authorityYearsCarousel.slides[1]?.blocks.some((block) => block.type === 'TITLE' && block.content === '18'));

const noPromptImageScript = `
Slide 1
Título: O checklist que protege sua farmácia no reajuste
Subtítulo:
Texto: O reajuste anual pode aumentar seu lucro ou travar seu caixa. A diferença não está no mercado — está na sua preparação.
Lista:
CTA:
Imagem:

Slide 2
Título: Análise de giro
Subtítulo: Entenda onde está o dinheiro
Texto: Nem todo produto merece investimento antes do reajuste. O foco deve estar no que retorna rápido.
Lista:
- Priorize itens de Curva A
- Foque no que gera liquidez rápida
- Use dados reais de giro
CTA:
Imagem:

Slide 3
Título: Revisão de estoque
Subtítulo: Evite erro antes de comprar
Texto: Comprar sem validar estoque é um dos erros mais caros nesse momento.
Lista:
- Valide quantidades reais
- Evite excesso e ruptura
- Corrija divergências antes de comprar
CTA:
Imagem:

Slide 4
Título: Avaliação de fornecedores
Subtítulo: Comprar bem é metade do lucro
Texto: Pequenas diferenças de condição geram grande impacto no resultado final.
Lista:
- Compare tabelas e prazos
- Negocie com base no histórico
- Avalie custo vs capital parado
CTA:
Imagem:

Slide 5
Título: Compras estratégicas
Subtítulo: Planejamento que vira resultado
Texto: Quando você organiza os dados, a compra deixa de ser aposta e vira decisão.
Lista:
- Defina cronograma de compras
- Antecipe-se ao reajuste
- Atualize preços no timing certo
CTA:
Imagem:

Slide 6
Título: Dados ou palpites?
Subtítulo: Essa escolha define seu lucro
Texto: Farmácias que crescem seguem método. As que não crescem reagem ao problema.
Lista:
- Organização aumenta margem
- Decisão com dados reduz erros
- Gestão previsível gera crescimento
CTA:
Imagem:
`;

const noPromptImageCarousel = buildCarouselFromScript(noPromptImageScript);
const nonCoverSlides = noPromptImageCarousel.slides.slice(1);
const nonCoverImageLayouts = nonCoverSlides.filter((slide) => slide.imageLayout && slide.imageLayout !== 'IMAGE_NONE');
const firstFourMiddleTemplates = nonCoverSlides.slice(0, 4).map((slide) => slide.contentTemplate);

assert.ok(nonCoverImageLayouts.length >= 2);
assert.ok(
  firstFourMiddleTemplates.some((templateId) =>
    templateId === 'CHECKLIST'
    || templateId === 'BOX_GRID',
  ),
);

const googleQuestionsScript = `
Capa

Apoio Superior:
O que seu paciente procura

Destaque:
no Google

Apoio Inferior:
antes de te procurar

Imagem Fundo:

Imagem Destaque:



Slide 2

Título:
Pergunta #1: Implante dói?

Subtítulo:

Texto:
Essa é a primeira coisa que seu paciente digita.

Ele quer saber se vai sofrer.

Se você não responde essa pergunta no seu conteúdo, ele marca com quem respondeu.

[[Seu post educativo mata essa dúvida no começo.]]

Lista:

CTA:

Imagem:



Slide 3

Título:
Pergunta #2: Quanto custa?

Subtítulo:

Texto:
Depois que sabe que não dói, ele quer saber o preço.

Ele tá filtrando:

"Cabe no meu bolso?"

Se você não fala sobre investimento, ele acha quem fala.

E marca lá.

Lista:

CTA:

Imagem:



Slide 4

Título:
Pergunta #3: Quanto tempo leva?

Subtítulo:

Texto:
Ele quer saber se cabe na agenda.

"Tenho 2 semanas de férias. Dá pra fazer?"

Conteúdo respondendo timeline específica = [[paciente confiante]] marcando.

Lista:

CTA:

Imagem:



Slide 5

Título:
Pergunta #4: Cai? Quanto dura?

Subtítulo:

Texto:
Ele quer segurança.

"Vou gastar caro e isso vai durar quanto?"

Responda:

**Implante de titânio dura 20, 30, 40 anos.**
Se cuidar, dura a vida toda.

Isso resolve a maior dúvida dele.

Lista:

CTA:

Imagem:



Slide 6

Título:
Pergunta #5: Qual dentista bom?

Subtítulo:

Texto:
Essa é a pesquisa final.

Ele tá comparando.
Procurando reviews.
Vendo antes/depois.

Se seu perfil tá completo com essa informação, você [[vence aqui]].

Lista:

CTA:

Imagem:



Slide 7

Título:
Salve esse post

Subtítulo:

Texto:
Você sabe qual pergunta seu paciente faz mais?

Comente abaixo qual dessas 5 você mais ouve.

Cada pergunta respondida = paciente que marca 🚀

Lista:

CTA:
🔖 {bookmark, save, content} Salve esse post e consulte sempre que for criar conteúdo.

Imagem:
`;

const googleQuestionsCarousel = buildCarouselFromScript(googleQuestionsScript);
const questionFiveSlide = googleQuestionsCarousel.slides.find((slide) =>
  slide.blocks.some((block) => block.content === 'Pergunta #5: Qual dentista bom?'),
);
const questionFiveContents = questionFiveSlide?.blocks.flatMap((block) =>
  Array.isArray(block.content) ? block.content : typeof block.content === 'string' ? [block.content] : [],
) ?? [];

assert.ok(questionFiveSlide, 'Pergunta #5 deve ser preservada como slide');
assert.equal(questionFiveContents.some((content) => /^Ponto [12]$/.test(content)), false);
assert.equal(questionFiveContents.some((content) => /vence aqui/.test(content)), true);

const editorialStructureCarousel = buildCarouselFromScript(`
Capa
Apoio Superior:
5 erros que enfraquecem
Destaque:
a imagem da sua marca

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
const editorialStructureValidation = carouselSchema.safeParse(editorialStructureCarousel);

const editorialContentSlide = editorialStructureCarousel.slides[1];
assert.equal(editorialStructureValidation.success, true);
assert.equal(editorialContentSlide.contentTemplate, 'HERO');
assert.equal(editorialContentSlide.imageLayout, 'IMAGE_BOX_RIGHT');
assert.equal(editorialContentSlide.blocks[0]?.type, 'PARAGRAPH');
assert.equal(editorialContentSlide.blocks[0]?.content, 'Uma marca consistente');
assert.equal(editorialContentSlide.blocks[1]?.type, 'TITLE');
assert.equal(editorialContentSlide.blocks[1]?.content, 'Vende mais!');
assert.equal(editorialContentSlide.blocks[1]?.options?.color, 'accent');
assert.equal(editorialContentSlide.blocks[2]?.type, 'PARAGRAPH');
assert.equal(editorialContentSlide.blocks[3]?.type, 'PARAGRAPH');
assert.equal(editorialContentSlide.blocks[3]?.content, '[[E confiança reduz resistência à compra!]]');
assert.equal(editorialContentSlide.blocks[3]?.options?.lineBreakMode, 'manual');
assert.equal(editorialContentSlide.blocks[3]?.options?.manualBreaks, '[[E confiança reduz resistência à compra!]]');
assert.equal(editorialContentSlide.blocks[3]?.options?.icon, undefined);

const editorialChecklistCarousel = buildCarouselFromScript(`
Capa
Destaque:
Sensibilidade dental

Slide 1
Intro:
Rotina simples
Headline:
3 hábitos que ajudam
Body:
Comece pelo básico.
List:
• 🪥 {toothpaste, sensitive, protection} **Creme dental correto:** use pastas específicas para dentes sensíveis. Elas criam uma camada de proteção nos túbulos dentinários
• 🍋 {acid, enamel, erosion} **Cuidado com o ácido:** diminua limão, refrigerantes e vinhos, que desgastam o esmalte
• ✨ {brush, soft, gum} **Força não é limpeza:** use escovas extramacias. Excesso de pressão retrai a gengiva e expõe a raiz
Highlight:
[[Pequenos hábitos aliviam grandes desconfortos.]]
`);
const editorialChecklistSlide = editorialChecklistCarousel.slides[1];
const editorialChecklistList = editorialChecklistSlide.blocks.find((block) => block.type === 'LIST');

assert.ok(['CHECKLIST', 'BOX_GRID'].includes(editorialChecklistSlide.contentTemplate || ''));
assert.equal(editorialChecklistList?.options?.variant, 'check-list');
assert.equal(editorialChecklistList?.content?.[0], '**Creme dental correto:** use pastas específicas para dentes sensíveis. Elas criam uma camada de proteção nos túbulos dentinários');
assert.equal((editorialChecklistList?.options?.itemIcons as string[])?.length, 3);
