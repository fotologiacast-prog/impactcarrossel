import type { Block, SlideDefinition } from '../types';

type HorizontalAlign = NonNullable<NonNullable<SlideDefinition['options']>['contentHorizontalAlign']>;
type VerticalAlign = NonNullable<NonNullable<SlideDefinition['options']>['contentVerticalAlign']>;

const ALIGNABLE_BLOCK_TYPES = new Set<Block['type']>([
  'TITLE',
  'PARAGRAPH',
  'LIST',
  'CARD',
  'BADGE',
  'BOX',
]);

export type SlideAlignmentDefaults = {
  horizontal: HorizontalAlign;
  vertical: VerticalAlign;
};

export const alignBlocksForSlideLayout = (
  blocks: Block[],
  align: HorizontalAlign,
): Block[] => blocks.map((block) => {
  if (!ALIGNABLE_BLOCK_TYPES.has(block.type)) return block;

  return {
    ...block,
    options: {
      ...(block.options || {}),
      align,
      textAlign: align,
    },
  };
});

export const buildSlideAlignmentUpdates = (
  align: HorizontalAlign,
  vertical: VerticalAlign,
  blocks: Block[],
) => [
  { path: ['options', 'contentHorizontalAlign'], value: align },
  { path: ['options', 'contentVerticalAlign'], value: vertical },
  { path: ['options', 'boxGroupAlign'], value: align },
  { path: ['blocks'], value: alignBlocksForSlideLayout(blocks, align) },
] as { path: (string | number)[]; value: any }[];
