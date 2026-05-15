import type {
  BlockType,
  PrototypeArea,
  PrototypeTemplateCard,
  PrototypeTemplateFamily,
} from '../types.ts';

export const PROTOTYPE_TEMPLATE_LAB_FAMILIES: PrototypeTemplateFamily[] = [
  'LIST',
  'BOX',
  'IMAGE',
  'TEXT',
];

const createArea = (
  id: string,
  type: PrototypeArea['type'],
  x: number,
  y: number,
  w: number,
  h: number,
  label: string,
  allowedBlocks: BlockType[],
): PrototypeArea => ({
  id,
  type,
  position: { x, y, w, h },
  label,
  allowedBlocks,
});

export const PROTOTYPE_TEMPLATE_LAB_CATALOG: PrototypeTemplateCard[] = [
  {
    id: 'list-numbered-rows',
    family: 'LIST',
    name: 'List Numbered Rows',
    description: 'Linhas numeradas com separadores finos e leitura editorial.',
    visualWeight: 'medium',
    compatibleBlocks: ['TITLE', 'LIST'],
    areas: [
      createArea('title', 'title', 0, 0, 100, 24, 'Título', ['TITLE']),
      createArea('list', 'content', 0, 28, 100, 72, 'Lista numerada', ['LIST']),
    ],
    preview: {
      title: 'Como isso funciona',
      subtitle: 'Leitura mais editorial e progressiva',
      items: ['Diagnóstico', 'Direção', 'Execução'],
      accent: 'Rows',
    },
  },
  {
    id: 'list-pill-tags',
    family: 'LIST',
    name: 'List Pill Tags',
    description: 'Itens viram pills com wrap e ícones opcionais.',
    visualWeight: 'light',
    compatibleBlocks: ['TITLE', 'LIST', 'BADGE'],
    areas: [
      createArea('title', 'title', 0, 0, 100, 24, 'Título', ['TITLE']),
      createArea('list', 'content', 0, 28, 100, 72, 'Pills', ['LIST', 'BADGE']),
    ],
    preview: {
      title: 'Canais que funcionam',
      subtitle: 'Cada item vira uma peça visual',
      items: ['SEO orgânico', 'Parcerias B2B', 'Comunidade', 'Conteúdo técnico'],
      accent: 'Pills',
    },
  },
  {
    id: 'list-stacked-cards',
    family: 'LIST',
    name: 'List Stacked Cards',
    description: 'Cards empilhados com ícone lateral e espaço para apoio.',
    visualWeight: 'heavy',
    compatibleBlocks: ['TITLE', 'LIST', 'CARD'],
    areas: [
      createArea('title', 'title', 0, 0, 100, 24, 'Título', ['TITLE']),
      createArea('list', 'content', 0, 28, 100, 72, 'Cards empilhados', ['LIST', 'CARD']),
    ],
    preview: {
      title: 'Benefícios principais',
      subtitle: 'Mais presença visual e mais respiro',
      items: ['Ativa lembrança', 'Organiza leitura', 'Valoriza a mensagem'],
      accent: 'Cards',
    },
  },
  {
    id: 'box-grid-cards',
    family: 'BOX',
    name: 'Box Grid Cards',
    description: 'Grid de cards com ícone centralizado.',
    visualWeight: 'heavy',
    compatibleBlocks: ['TITLE', 'BOX'],
    areas: [
      createArea('title', 'title', 0, 0, 100, 24, 'Título', ['TITLE']),
      createArea('grid', 'icon_grid', 0, 28, 100, 72, 'Grid de cards', ['BOX']),
    ],
    preview: {
      title: 'Pilares',
      subtitle: 'Grade modular para features',
      items: ['Clareza', 'Ritmo', 'Conversão', 'Consistência'],
      accent: 'Grid',
    },
  },
  {
    id: 'box-feature-rows',
    family: 'BOX',
    name: 'Box Feature Rows',
    description: 'Rows horizontais com ícone, conteúdo e seta.',
    visualWeight: 'medium',
    compatibleBlocks: ['TITLE', 'BOX'],
    areas: [
      createArea('title', 'title', 0, 0, 100, 24, 'Título', ['TITLE']),
      createArea('rows', 'icon_grid', 0, 28, 100, 72, 'Rows horizontais', ['BOX']),
    ],
    preview: {
      title: 'O que isso entrega',
      subtitle: 'Leitura em linha e foco em benefício',
      items: ['Mais foco', 'Mais leitura', 'Mais clareza'],
      accent: 'Rows',
    },
  },
  {
    id: 'box-accent-bar',
    family: 'BOX',
    name: 'Box Accent Bar',
    description: 'Blocos com barra accent lateral em cada item.',
    visualWeight: 'light',
    compatibleBlocks: ['TITLE', 'BOX'],
    areas: [
      createArea('title', 'title', 0, 0, 100, 24, 'Título', ['TITLE']),
      createArea('rows', 'icon_grid', 0, 28, 100, 72, 'Items com barra accent', ['BOX']),
    ],
    preview: {
      title: 'Razões para agir',
      subtitle: 'Estrutura simples com acento forte',
      items: ['Direção', 'Agilidade', 'Presença'],
      accent: 'Bar',
    },
  },
  {
    id: 'image-caption',
    family: 'IMAGE',
    name: 'Image Caption',
    description: 'Imagem com legenda e título opcional.',
    visualWeight: 'medium',
    compatibleBlocks: ['TITLE', 'IMAGE', 'PARAGRAPH'],
    areas: [
      createArea('title', 'title', 0, 0, 100, 22, 'Título', ['TITLE']),
      createArea('image', 'image', 0, 26, 100, 56, 'Imagem', ['IMAGE']),
      createArea('caption', 'body', 0, 86, 100, 14, 'Legenda', ['PARAGRAPH']),
    ],
    preview: {
      title: 'Imagem com legenda',
      subtitle: 'Legenda ajuda a fechar a leitura',
      accent: 'Caption',
    },
  },
  {
    id: 'image-overlay',
    family: 'IMAGE',
    name: 'Image Overlay',
    description: 'Texto sobre a imagem com gradiente.',
    visualWeight: 'heavy',
    compatibleBlocks: ['TITLE', 'IMAGE', 'PARAGRAPH', 'BADGE'],
    areas: [
      createArea('image', 'image', 0, 0, 100, 100, 'Imagem com overlay', ['IMAGE', 'TITLE', 'PARAGRAPH']),
    ],
    preview: {
      title: 'Imagem com overlay',
      subtitle: 'Texto entra na própria foto',
      accent: 'Overlay',
    },
  },
  {
    id: 'image-side-content',
    family: 'IMAGE',
    name: 'Image Side Content',
    description: 'Imagem ao lado do conteúdo com lista opcional.',
    visualWeight: 'medium',
    compatibleBlocks: ['TITLE', 'IMAGE', 'LIST', 'PARAGRAPH'],
    areas: [
      createArea('image', 'image', 0, 0, 40, 100, 'Imagem lateral', ['IMAGE']),
      createArea('content', 'content', 46, 0, 54, 100, 'Conteúdo lateral', ['TITLE', 'LIST', 'PARAGRAPH']),
    ],
    preview: {
      title: 'Imagem lateral',
      subtitle: 'Boa para dividir foco entre foto e argumentos',
      items: ['Juros mais baixos', 'Entrada facilitada', 'Subsidio do governo'],
      accent: 'Split',
    },
  },
  {
    id: 'text-quote',
    family: 'TEXT',
    name: 'Text Quote',
    description: 'Citação ou callout com barra lateral.',
    visualWeight: 'medium',
    compatibleBlocks: ['TITLE', 'PARAGRAPH'],
    areas: [
      createArea('title', 'title', 0, 0, 100, 22, 'Título', ['TITLE']),
      createArea('quote', 'content', 0, 28, 100, 72, 'Citação', ['PARAGRAPH']),
    ],
    preview: {
      title: 'Quote',
      subtitle: 'Boa para argumento ou depoimento',
      accent: 'Quote',
    },
  },
  {
    id: 'text-big-statement',
    family: 'TEXT',
    name: 'Text Big Statement',
    description: 'Frase de impacto com escala maior.',
    visualWeight: 'heavy',
    compatibleBlocks: ['TITLE', 'PARAGRAPH', 'BADGE'],
    areas: [
      createArea('statement', 'content', 0, 0, 100, 100, 'Statement grande', ['TITLE', 'PARAGRAPH', 'BADGE']),
    ],
    preview: {
      title: 'Frase de impacto',
      subtitle: 'Template para headline central',
      accent: 'Statement',
    },
  },
  {
    id: 'text-stat-highlight',
    family: 'TEXT',
    name: 'Text Stat Highlight',
    description: 'Número grande em destaque com apoio abaixo.',
    visualWeight: 'heavy',
    compatibleBlocks: ['TITLE', 'PARAGRAPH', 'BADGE'],
    areas: [
      createArea('title', 'title', 0, 0, 100, 22, 'Título', ['TITLE']),
      createArea('stat', 'content', 0, 26, 100, 74, 'Estatística', ['PARAGRAPH', 'BADGE']),
    ],
    preview: {
      title: 'Estatística',
      subtitle: 'Número grande e apoio embaixo',
      accent: 'Stat',
    },
  },
];

export function getPrototypeTemplateLabTemplatesByFamily(
  family: PrototypeTemplateFamily,
): PrototypeTemplateCard[] {
  return PROTOTYPE_TEMPLATE_LAB_CATALOG.filter((template) => template.family === family);
}

export function getPrototypeTemplateLabTemplate(
  id: string,
): PrototypeTemplateCard | undefined {
  return PROTOTYPE_TEMPLATE_LAB_CATALOG.find((template) => template.id === id);
}
