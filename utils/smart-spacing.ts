import type { BlockType } from '../types';

export type BlockRole =
  | 'tag'
  | 'title'
  | 'subtitle'
  | 'paragraph'
  | 'list'
  | 'icon_grid'
  | 'stat'
  | 'cta'
  | 'divider'
  | 'author'
  | 'quote'
  | 'image'
  | 'box';

const PAIR_SPACING: Record<string, number> = {
  'tag→title': 0.5,
  'tag→subtitle': 0.5,
  'tag→paragraph': 0.8,
  'tag→list': 0.8,
  'tag→stat': 0.6,
  'title→subtitle': 0.4,
  'title→paragraph': 1.0,
  'title→list': 1.2,
  'title→icon_grid': 1.3,
  'title→stat': 1.0,
  'title→cta': 1.5,
  'title→image': 1.2,
  'title→divider': 0.8,
  'title→quote': 1.2,
  'title→box': 1.2,
  'subtitle→paragraph': 1.0,
  'subtitle→list': 1.2,
  'subtitle→icon_grid': 1.3,
  'subtitle→stat': 1.0,
  'subtitle→cta': 1.4,
  'paragraph→paragraph': 0.8,
  'paragraph→list': 1.2,
  'paragraph→icon_grid': 1.3,
  'paragraph→stat': 1.2,
  'paragraph→cta': 1.5,
  'paragraph→quote': 1.3,
  'paragraph→divider': 1.0,
  'paragraph→box': 1.15,
  'list→paragraph': 1.2,
  'list→cta': 1.5,
  'list→stat': 1.2,
  'stat→paragraph': 1.0,
  'stat→cta': 1.5,
  'quote→paragraph': 1.2,
  'quote→cta': 1.5,
  'quote→author': 0.6,
};

export function getPairSpacing(blockA: BlockRole, blockB: BlockRole): number {
  return PAIR_SPACING[`${blockA}→${blockB}`] ?? 1.0;
}

export function mapBlockTypeToRole(
  type: BlockType,
  variant?: string,
  context?: { isTitleLikeParagraph?: boolean; isSubtitleLikeParagraph?: boolean },
): BlockRole {
  if (type === 'BADGE') return 'tag';
  if (type === 'TITLE') return 'title';
  if (type === 'LIST') return 'list';
  if (type === 'IMAGE') return 'image';
  if (type === 'BOX') return 'box';
  if (type === 'PARAGRAPH' && context?.isTitleLikeParagraph) return 'subtitle';
  if (type === 'PARAGRAPH' && context?.isSubtitleLikeParagraph) return 'subtitle';
  if (type === 'PARAGRAPH') return 'paragraph';
  if (type === 'CARD' && variant === 'quote') return 'quote';
  if (type === 'CARD') return 'paragraph';
  return 'paragraph';
}
