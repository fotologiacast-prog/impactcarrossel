import type { Block, BlockType } from '../types';

export type NewBlockType = Extract<BlockType, 'TITLE' | 'PARAGRAPH' | 'LIST' | 'BOX' | 'CARD' | 'BADGE' | 'USER'>;

export type NewBlockOption = {
  type: NewBlockType;
  label: string;
  description: string;
  icon: 'title' | 'paragraph' | 'list' | 'box' | 'card' | 'badge' | 'user';
};

export type DefaultUserBlockSeed = {
  displayName?: string | null;
  handle?: string | null;
  avatar?: string | null;
};

const NEW_BLOCK_OPTIONS: NewBlockOption[] = [
  { type: 'TITLE', label: 'Título', description: 'Abre uma nova manchete.', icon: 'title' },
  { type: 'PARAGRAPH', label: 'Parágrafo', description: 'Cria um bloco de texto corrido.', icon: 'paragraph' },
  { type: 'LIST', label: 'Lista', description: 'Cria uma lista simples para editar.', icon: 'list' },
  { type: 'BOX', label: 'Box', description: 'Cria um destaque em caixa.', icon: 'box' },
  { type: 'CARD', label: 'Card', description: 'Cria um card de conteúdo.', icon: 'card' },
  { type: 'BADGE', label: 'Badge', description: 'Cria um selo curto.', icon: 'badge' },
  { type: 'USER', label: 'Perfil', description: 'Cria um bloco de autor ou profissional.', icon: 'user' },
];

const normalizeHandle = (handle?: string | null) => {
  if (!handle) return '@instagram';
  return handle.startsWith('@') ? handle : `@${handle}`;
};

export const buildNewBlockOptions = () => [...NEW_BLOCK_OPTIONS];

export const createDefaultBlockForType = (
  type: NewBlockType,
  userSeed?: DefaultUserBlockSeed,
): Block => {
  switch (type) {
    case 'TITLE':
      return {
        type: 'TITLE',
        content: 'Novo título',
        options: {
          size: 'md',
          fontVariant: 'destaque',
        },
      };
    case 'PARAGRAPH':
      return {
        type: 'PARAGRAPH',
        content: 'Novo parágrafo...',
        options: {
          fontVariant: 'padrão',
        },
      };
    case 'LIST':
      return {
        type: 'LIST',
        content: ['Novo item'],
        options: {
          variant: 'default',
        },
      };
    case 'BOX':
      return {
        type: 'BOX',
        content: 'Novo destaque',
        options: {
          variant: 'default',
        },
      };
    case 'CARD':
      return {
        type: 'CARD',
        content: 'Novo card',
        options: {
          variant: 'default',
        },
      };
    case 'BADGE':
      return {
        type: 'BADGE',
        content: 'Novo selo',
        options: {
          variant: 'default',
        },
      };
    case 'USER':
      return {
        type: 'USER',
        content: userSeed?.displayName || 'Nome do profissional',
        options: {
          handle: normalizeHandle(userSeed?.handle),
          avatar: userSeed?.avatar || undefined,
        },
      };
    default:
      return {
        type: 'PARAGRAPH',
        content: 'Novo parágrafo...',
        options: {},
      };
  }
};
