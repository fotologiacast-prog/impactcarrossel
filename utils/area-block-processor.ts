import type { Block } from '../types';
import type { SlideArea } from './area-layout.ts';
import { getAvailableSpace } from './area-fit.ts';
import {
  autoSizeList,
  autoSizeParagraph,
  autoSizeTitle,
  computeInternalSpacing,
} from './smart-text.ts';
import { getPairSpacing, mapBlockTypeToRole, type BlockRole } from './smart-spacing.ts';

export interface ProcessedBlock {
  block: Block;
  role: BlockRole;
  fontSize?: number;
  lineHeight?: number;
  letterSpacing?: number;
  marginTop: number;
  allocatedHeight: number;
}

const blockWeights: Record<BlockRole, number> = {
  tag: 0.5,
  title: 3,
  subtitle: 1.5,
  paragraph: 2,
  list: 3,
  icon_grid: 3.5,
  stat: 2.5,
  cta: 1,
  divider: 0.3,
  author: 0.8,
  quote: 2,
  image: 3,
  box: 2.8,
};

export function processAreaBlocks(
  blocks: Block[],
  area: SlideArea,
  slideWidth: number,
  slideHeight: number,
) {
  const available = getAvailableSpace(area, slideWidth, slideHeight);
  const warnings: string[] = [];

  if (blocks.length === 0) {
    return { processedBlocks: [] as ProcessedBlock[], totalHeight: 0, fitsInArea: true, warnings };
  }

  const roles = blocks.map((block, index) => mapBlockTypeToRole(block.type, block.options?.variant, {
    isTitleLikeParagraph: block.type === 'PARAGRAPH' && index === 1 && blocks[0]?.type === 'TITLE',
    isSubtitleLikeParagraph: block.type === 'PARAGRAPH' && index === 1 && blocks[0]?.type === 'TITLE',
  }));

  const pairGaps = roles.slice(0, -1).map((role, index) => Math.round(area.gap * getPairSpacing(role, roles[index + 1])));
  const gapBudget = pairGaps.reduce((sum, gap) => sum + gap, 0);
  const contentBudget = Math.max(0, available.heightPx - gapBudget);
  const totalWeight = roles.reduce((sum, role) => sum + (blockWeights[role] || 1), 0);

  const processedBlocks: ProcessedBlock[] = [];
  let totalHeight = 0;

  blocks.forEach((block, index) => {
    const role = roles[index];
    const marginTop = index === 0 ? 0 : pairGaps[index - 1];
    const maxHeightForBlock = Math.max(48, Math.round((blockWeights[role] / totalWeight) * contentBudget));
    let nextBlock = block;
    let fontSize = block.options?.fontSize;
    let lineHeight = block.options?.lineHeight;
    let letterSpacing = block.options?.letterSpacing;
    let allocatedHeight = maxHeightForBlock;

    if (block.type === 'TITLE' && typeof block.content === 'string') {
      const sized = autoSizeTitle(block.content, available.widthPx, maxHeightForBlock, {
        maxFontSize: block.options?.fontSize ?? 78,
        minFontSize: Math.max(22, Math.round((block.options?.fontSize ?? 78) * 0.42)),
      });
      const internal = computeInternalSpacing('title', sized.fontSize, { isMultiLine: sized.lineCount > 1 });
      fontSize = sized.fontSize;
      lineHeight = internal.lineHeight;
      letterSpacing = internal.letterSpacing;
      allocatedHeight = sized.totalHeight + internal.paddingTop + internal.paddingBottom;
      nextBlock = {
        ...block,
        content: sized.processedText,
        options: {
          ...block.options,
          fontSize,
          lineHeight,
          letterSpacing,
          disableAutoFit: true,
        },
      };
    } else if (block.type === 'PARAGRAPH' && typeof block.content === 'string') {
      const sized = autoSizeParagraph(block.content, available.widthPx, maxHeightForBlock, {
        maxFontSize: block.options?.fontSize ?? (role === 'subtitle' ? 28 : 29),
        minFontSize: Math.max(13, Math.round((block.options?.fontSize ?? (role === 'subtitle' ? 28 : 29)) * 0.72)),
      });
      const internal = computeInternalSpacing(role === 'subtitle' ? 'subtitle' : 'paragraph', sized.fontSize);
      fontSize = sized.fontSize;
      lineHeight = internal.lineHeight;
      letterSpacing = internal.letterSpacing;
      allocatedHeight = sized.totalHeight;
      nextBlock = {
        ...block,
        content: sized.processedText,
        options: {
          ...block.options,
          fontSize,
          lineHeight,
          letterSpacing,
          disableAutoFit: true,
        },
      };
    } else if (block.type === 'LIST' && Array.isArray(block.content)) {
      const sized = autoSizeList(block.content.map((item) => String(item)), available.widthPx, maxHeightForBlock, {
        maxFontSize: block.options?.fontSize ?? 18,
        minFontSize: Math.max(13, Math.round((block.options?.fontSize ?? 18) * 0.72)),
      });
      const internal = computeInternalSpacing('list', sized.fontSize);
      fontSize = sized.fontSize;
      lineHeight = internal.lineHeight;
      letterSpacing = internal.letterSpacing;
      allocatedHeight = sized.totalHeight;
      nextBlock = {
        ...block,
        content: sized.processedItems,
        options: {
          ...block.options,
          fontSize,
          lineHeight,
          letterSpacing,
        },
      };
    } else if (block.type === 'BADGE') {
      fontSize = block.options?.fontSize ?? 13;
      lineHeight = 1;
      letterSpacing = 0.5;
      allocatedHeight = 36;
      nextBlock = {
        ...block,
        options: {
          ...block.options,
          fontSize,
          lineHeight,
          letterSpacing,
        },
      };
    } else if (block.type === 'CTA') {
      fontSize = block.options?.fontSize ?? 16;
      lineHeight = 1;
      letterSpacing = 0.3;
      allocatedHeight = 56;
      nextBlock = {
        ...block,
        options: {
          ...block.options,
          fontSize,
          lineHeight,
          letterSpacing,
        },
      };
    }

    processedBlocks.push({
      block: nextBlock,
      role,
      fontSize,
      lineHeight,
      letterSpacing,
      marginTop,
      allocatedHeight,
    });
    totalHeight += allocatedHeight + marginTop;
  });

  const fitsInArea = totalHeight <= available.heightPx;
  if (!fitsInArea) {
    warnings.push(`Content height ${Math.round(totalHeight)} exceeds area ${Math.round(available.heightPx)}`);
  }

  return {
    processedBlocks,
    totalHeight,
    fitsInArea,
    warnings,
  };
}
