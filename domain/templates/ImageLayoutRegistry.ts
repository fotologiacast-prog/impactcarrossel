import type { ImageLayoutDefinition } from '../../types';

export const INITIAL_IMAGE_LAYOUTS: ImageLayoutDefinition[] = [
  { id: 'IMAGE_NONE', name: 'Sem imagem', description: 'Conteúdo ocupa 100% da área útil.', kind: 'none', position: 'center', reservedContentRatio: 1 },
  { id: 'IMAGE_BACKGROUND', name: 'Background full', description: 'Imagem cobre todo o fundo.', kind: 'background', position: 'center', reservedContentRatio: 1 },
  { id: 'IMAGE_FADE_LEFT', name: 'Fade esquerda', description: 'Imagem full com fade de leitura à esquerda.', kind: 'fade', position: 'left', reservedContentRatio: 0.5 },
  { id: 'IMAGE_FADE_RIGHT', name: 'Fade direita', description: 'Imagem full com fade de leitura à direita.', kind: 'fade', position: 'right', reservedContentRatio: 0.5 },
  { id: 'IMAGE_FADE_TOP', name: 'Fade topo', description: 'Imagem full com fade de leitura no topo.', kind: 'fade', position: 'top', reservedContentRatio: 0.5 },
  { id: 'IMAGE_FADE_BOTTOM', name: 'Fade base', description: 'Imagem full com fade de leitura na base.', kind: 'fade', position: 'bottom', reservedContentRatio: 0.5 },
  { id: 'IMAGE_SPLIT_LEFT', name: 'Split esquerda', description: 'Imagem ocupa 50% à esquerda.', kind: 'split', position: 'left', imageRatio: 0.5, reservedContentRatio: 0.5 },
  { id: 'IMAGE_SPLIT_RIGHT', name: 'Split direita', description: 'Imagem ocupa 50% à direita.', kind: 'split', position: 'right', imageRatio: 0.5, reservedContentRatio: 0.5 },
  { id: 'IMAGE_SPLIT_TOP', name: 'Split topo', description: 'Imagem ocupa a faixa superior.', kind: 'split', position: 'top', imageRatio: 0.5, reservedContentRatio: 0.5 },
  { id: 'IMAGE_SPLIT_BOTTOM', name: 'Split base', description: 'Imagem ocupa a faixa inferior.', kind: 'split', position: 'bottom', imageRatio: 0.5, reservedContentRatio: 0.5 },
  { id: 'IMAGE_GLASS_CARD', name: 'Glass liquid', description: 'Imagem de fundo com card de vidro líquido.', kind: 'glass', position: 'center', reservedContentRatio: 1 },
  { id: 'IMAGE_GLASS_BOTTOM', name: 'Glass base', description: 'Imagem de fundo com card de vidro na base.', kind: 'glass', position: 'bottom', reservedContentRatio: 1 },
  { id: 'IMAGE_STACK_BOX_TOP', name: 'Boxes empilhadas topo', description: 'Imagem em box central no topo e conteúdo em box igual abaixo.', kind: 'stage', position: 'top', reservedContentRatio: 0.6 },
  { id: 'IMAGE_STACK_BOX_BOTTOM', name: 'Boxes empilhadas base', description: 'Conteúdo em box no topo e imagem em box igual abaixo.', kind: 'stage', position: 'bottom', reservedContentRatio: 0.6 },
  { id: 'IMAGE_BOX_RIGHT', name: 'Box lateral direita', description: 'Imagem em box no lado direito.', kind: 'stage', position: 'right', reservedContentRatio: 0.56 },
  { id: 'IMAGE_BOX_BOTTOM', name: 'Box na base', description: 'Imagem em box na parte inferior.', kind: 'stage', position: 'bottom', reservedContentRatio: 0.58 },
  { id: 'IMAGE_STAGE_LEFT', name: 'Stage esquerda', description: 'Área reservada para imagem ou PNG à esquerda.', kind: 'stage', position: 'left', reservedContentRatio: 0.56 },
  { id: 'IMAGE_STAGE_RIGHT', name: 'Stage direita', description: 'Área reservada para imagem ou PNG à direita.', kind: 'stage', position: 'right', reservedContentRatio: 0.56 },
  { id: 'IMAGE_STAGE_TOP', name: 'Stage topo', description: 'Área reservada para imagem ou PNG no topo.', kind: 'stage', position: 'top', reservedContentRatio: 0.58 },
  { id: 'IMAGE_STAGE_BOTTOM', name: 'Stage base', description: 'Área reservada para imagem ou PNG na base.', kind: 'stage', position: 'bottom', reservedContentRatio: 0.58 },
  { id: 'IMAGE_WAVE_BOTTOM', name: 'Onda base', description: 'Imagem na base com recorte orgânico em onda.', kind: 'wave', position: 'bottom', reservedContentRatio: 0.56 },
];

export type ImageLayoutFamilyId = 'none' | 'background' | 'fade' | 'split' | 'glass' | 'stack_box' | 'box' | 'stage' | 'wave';
export type ImageLayoutDirection = 'left' | 'right' | 'top' | 'bottom' | 'center';

export interface ImageLayoutFamilyDefinition {
  id: ImageLayoutFamilyId;
  name: string;
  description: string;
  defaultLayoutId: string;
  layoutIds: string[];
  directionOptions: ImageLayoutDirection[];
}

const IMAGE_LAYOUT_FAMILIES: ImageLayoutFamilyDefinition[] = [
  {
    id: 'none',
    name: 'Sem imagem',
    description: 'Conteúdo ocupa 100% da área útil.',
    defaultLayoutId: 'IMAGE_NONE',
    layoutIds: ['IMAGE_NONE'],
    directionOptions: ['center'],
  },
  {
    id: 'background',
    name: 'Background',
    description: 'Imagem cobre todo o fundo.',
    defaultLayoutId: 'IMAGE_BACKGROUND',
    layoutIds: ['IMAGE_BACKGROUND'],
    directionOptions: ['center'],
  },
  {
    id: 'fade',
    name: 'Fade',
    description: 'Imagem full com fade de leitura em um lado.',
    defaultLayoutId: 'IMAGE_FADE_LEFT',
    layoutIds: ['IMAGE_FADE_LEFT', 'IMAGE_FADE_RIGHT', 'IMAGE_FADE_TOP', 'IMAGE_FADE_BOTTOM'],
    directionOptions: ['left', 'right', 'top', 'bottom'],
  },
  {
    id: 'split',
    name: 'Split',
    description: 'Imagem ocupa metade do canvas em uma direção.',
    defaultLayoutId: 'IMAGE_SPLIT_LEFT',
    layoutIds: ['IMAGE_SPLIT_LEFT', 'IMAGE_SPLIT_RIGHT', 'IMAGE_SPLIT_TOP', 'IMAGE_SPLIT_BOTTOM'],
    directionOptions: ['left', 'right', 'top', 'bottom'],
  },
  {
    id: 'glass',
    name: 'Glass',
    description: 'Imagem de fundo com card de vidro.',
    defaultLayoutId: 'IMAGE_GLASS_CARD',
    layoutIds: ['IMAGE_GLASS_CARD', 'IMAGE_GLASS_BOTTOM'],
    directionOptions: ['center', 'bottom'],
  },
  {
    id: 'stack_box',
    name: 'Boxes empilhadas',
    description: 'Imagem e conteúdo em duas boxes iguais.',
    defaultLayoutId: 'IMAGE_STACK_BOX_TOP',
    layoutIds: ['IMAGE_STACK_BOX_TOP', 'IMAGE_STACK_BOX_BOTTOM'],
    directionOptions: ['top', 'bottom'],
  },
  {
    id: 'box',
    name: 'Box',
    description: 'Imagem em box lateral ou inferior.',
    defaultLayoutId: 'IMAGE_BOX_RIGHT',
    layoutIds: ['IMAGE_BOX_RIGHT', 'IMAGE_BOX_BOTTOM'],
    directionOptions: ['right', 'bottom'],
  },
  {
    id: 'stage',
    name: 'Stage',
    description: 'Área reservada para imagem ou PNG à direita.',
    defaultLayoutId: 'IMAGE_STAGE_RIGHT',
    layoutIds: ['IMAGE_STAGE_LEFT', 'IMAGE_STAGE_RIGHT', 'IMAGE_STAGE_TOP', 'IMAGE_STAGE_BOTTOM'],
    directionOptions: ['left', 'right', 'top', 'bottom'],
  },
  {
    id: 'wave',
    name: 'Onda',
    description: 'Imagem recortada por uma curva orgânica na base.',
    defaultLayoutId: 'IMAGE_WAVE_BOTTOM',
    layoutIds: ['IMAGE_WAVE_BOTTOM'],
    directionOptions: ['bottom'],
  },
];

const IMAGE_LAYOUT_FAMILY_BY_LAYOUT_ID = new Map<string, ImageLayoutFamilyDefinition>();

for (const family of IMAGE_LAYOUT_FAMILIES) {
  for (const layoutId of family.layoutIds) {
    IMAGE_LAYOUT_FAMILY_BY_LAYOUT_ID.set(layoutId, family);
  }
}

export const getImageLayoutFamilies = () => IMAGE_LAYOUT_FAMILIES.slice();

export const getImageLayoutFamily = (layoutId: string) => IMAGE_LAYOUT_FAMILY_BY_LAYOUT_ID.get(layoutId);

export const getDefaultImageLayoutIdForFamily = (familyId: ImageLayoutFamilyId) => (
  IMAGE_LAYOUT_FAMILIES.find((family) => family.id === familyId)?.defaultLayoutId
);

export const getImageLayoutDirection = (layoutId: string): ImageLayoutDirection | undefined => {
  const family = getImageLayoutFamily(layoutId);
  if (!family) return undefined;

  switch (layoutId) {
    case 'IMAGE_FADE_RIGHT':
    case 'IMAGE_SPLIT_RIGHT':
    case 'IMAGE_BOX_RIGHT':
    case 'IMAGE_STAGE_RIGHT':
      return 'right';
    case 'IMAGE_STAGE_TOP':
    case 'IMAGE_FADE_TOP':
    case 'IMAGE_SPLIT_TOP':
    case 'IMAGE_STACK_BOX_TOP':
      return 'top';
    case 'IMAGE_STAGE_BOTTOM':
    case 'IMAGE_FADE_BOTTOM':
    case 'IMAGE_SPLIT_BOTTOM':
    case 'IMAGE_STACK_BOX_BOTTOM':
    case 'IMAGE_BOX_BOTTOM':
    case 'IMAGE_WAVE_BOTTOM':
      return 'bottom';
    case 'IMAGE_STAGE_LEFT':
    case 'IMAGE_FADE_LEFT':
    case 'IMAGE_SPLIT_LEFT':
      return 'left';
    default:
      return family.id === 'none' || family.id === 'background'
        ? 'center'
        : layoutId === 'IMAGE_GLASS_BOTTOM'
          ? 'bottom'
          : family.id === 'glass'
            ? 'center'
            : undefined;
  }
};

export const getImageLayoutIdForFamilyDirection = (
  familyId: ImageLayoutFamilyId,
  direction: ImageLayoutDirection,
) => {
  const family = IMAGE_LAYOUT_FAMILIES.find((entry) => entry.id === familyId);
  if (!family) return undefined;

  if (family.id === 'none' || family.id === 'background') {
    return family.defaultLayoutId;
  }

  switch (family.id) {
    case 'fade':
      if (direction === 'right') return 'IMAGE_FADE_RIGHT';
      if (direction === 'top') return 'IMAGE_FADE_TOP';
      if (direction === 'bottom') return 'IMAGE_FADE_BOTTOM';
      return 'IMAGE_FADE_LEFT';
    case 'split':
      if (direction === 'right') return 'IMAGE_SPLIT_RIGHT';
      if (direction === 'top') return 'IMAGE_SPLIT_TOP';
      if (direction === 'bottom') return 'IMAGE_SPLIT_BOTTOM';
      return 'IMAGE_SPLIT_LEFT';
    case 'stack_box':
      return direction === 'bottom' ? 'IMAGE_STACK_BOX_BOTTOM' : 'IMAGE_STACK_BOX_TOP';
    case 'box':
      return direction === 'bottom' ? 'IMAGE_BOX_BOTTOM' : 'IMAGE_BOX_RIGHT';
    case 'stage':
      if (direction === 'left') return 'IMAGE_STAGE_LEFT';
      if (direction === 'top') return 'IMAGE_STAGE_TOP';
      if (direction === 'bottom') return 'IMAGE_STAGE_BOTTOM';
      return 'IMAGE_STAGE_RIGHT';
    case 'glass':
      return direction === 'bottom' ? 'IMAGE_GLASS_BOTTOM' : 'IMAGE_GLASS_CARD';
    case 'wave':
      return 'IMAGE_WAVE_BOTTOM';
    default:
      return family.defaultLayoutId;
  }
};

class ImageLayoutRegistry {
  private layouts = new Map<string, ImageLayoutDefinition>();

  constructor() {
    INITIAL_IMAGE_LAYOUTS.forEach((layout) => this.layouts.set(layout.id, layout));
  }

  get(id: string) {
    return this.layouts.get(id);
  }

  getAll() {
    return Array.from(this.layouts.values());
  }
}

export const imageLayoutRegistry = new ImageLayoutRegistry();
