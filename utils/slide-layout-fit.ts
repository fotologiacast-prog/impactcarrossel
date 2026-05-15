import type { Block, SlideDefinition } from '../types';
import { resolveSlideComposition } from '../domain/templates/templateComposition.ts';
import { imageLayoutRegistry } from '../domain/templates/ImageLayoutRegistry.ts';
import { areaLayoutRegistry } from '../domain/layouts/AreaLayoutRegistry.ts';
import { findSlideArea, type SlideArea } from './area-layout.ts';
import { fitBlocksInArea, type FitResult } from './area-fit.ts';

export interface SlideLayoutFitEvaluation {
  status: FitResult['status'];
  imageLayoutId: string;
  contentTemplateId: string;
  message: string;
}

const DEFAULT_SLIDE_WIDTH = 1080;
const DEFAULT_SLIDE_HEIGHT = 1350;
const DEFAULT_PADDING = 80;
const DEFAULT_BLOCK_GAP = 24;

const createSyntheticArea = (
  widthPercent: number,
  heightPercent: number,
  gap: number,
): SlideArea => ({
  id: 'synthetic-content',
  role: 'content',
  bounds: { x: 0, y: 0, width: widthPercent, height: heightPercent },
  padding: { top: DEFAULT_PADDING, right: DEFAULT_PADDING, bottom: DEFAULT_PADDING, left: DEFAULT_PADDING },
  direction: 'column',
  justify: 'start',
  align: 'start',
  gap,
  overflow: 'hidden',
  acceptsBlocks: ['TITLE', 'PARAGRAPH', 'LIST', 'BOX', 'BADGE', 'CTA', 'IMAGE'],
});

const getSyntheticAreaForImageLayout = (imageLayoutId: string, gap: number): SlideArea => {
  const stageLayout = areaLayoutRegistry.get(imageLayoutId);
  if (stageLayout) {
    const contentArea = findSlideArea(stageLayout, 'content-area');
    if (contentArea) {
      return {
        ...contentArea,
        gap,
      };
    }
  }

  const layout = imageLayoutRegistry.get(imageLayoutId);
  const position = layout?.position ?? 'center';
  const reservedContentRatio = layout?.reservedContentRatio ?? 1;

  if (position === 'left' || position === 'right') {
    return createSyntheticArea(reservedContentRatio * 100, 100, gap);
  }

  if (position === 'top' || position === 'bottom') {
    return createSyntheticArea(100, reservedContentRatio * 100, gap);
  }

  return createSyntheticArea(100, 100, gap);
};

const mapBlockTypeForMeasurement = (block: Block): string => {
  if (block.type === 'CARD') return 'BOX';
  if (block.type === 'USER') return 'BADGE';
  return block.type;
};

const toMeasurementData = (block: Block) => {
  const content = block.content;
  if (block.type === 'LIST') {
    const items = Array.isArray(content)
      ? content.map((item) => String(item))
      : content
        ? [String(content)]
        : [];

    return { items };
  }

  if (block.type === 'BOX' || block.type === 'CARD') {
    return {
      title: typeof content === 'string' ? content : undefined,
      text: typeof content === 'string' ? content : undefined,
      icon: block.options?.icon,
    };
  }

  return {
    text: Array.isArray(content) ? content.join(' ') : String(content || ''),
  };
};

const toFitBlocks = (blocks: Block[]) => (
  blocks
    .filter((block) => block.type !== 'IMAGE' && block.type !== 'SPACER')
    .map((block) => ({
      type: mapBlockTypeForMeasurement(block),
      variant: block.options?.variant,
      data: toMeasurementData(block),
    }))
);

const getMessageForFitResult = (result: FitResult, imageLayoutId: string): string => {
  switch (result.status) {
    case 'fits':
      return '';
    case 'fits_shrunk':
      return `O layout ${imageLayoutId} coube, mas precisou comprimir o conteúdo.`;
    case 'overflow':
      return `O layout ${imageLayoutId} não comporta todo o conteúdo atual.`;
    case 'impossible':
      return `O layout ${imageLayoutId} não comporta esse volume de conteúdo.`;
    default:
      return '';
  }
};

export const evaluateSlideLayoutFit = (
  slide: SlideDefinition,
  slideWidth = DEFAULT_SLIDE_WIDTH,
  slideHeight = DEFAULT_SLIDE_HEIGHT,
): SlideLayoutFitEvaluation => {
  if (slide.cover) {
    return {
      status: 'fits',
      imageLayoutId: 'COVER_IMAGES',
      contentTemplateId: 'COVER',
      message: '',
    };
  }

  const composition = resolveSlideComposition(slide);
  const gap = slide.options?.blockGap ?? DEFAULT_BLOCK_GAP;
  const area = getSyntheticAreaForImageLayout(composition.imageLayoutId, gap);
  const fitBlocks = toFitBlocks(slide.blocks || []);

  if (fitBlocks.length === 0) {
    return {
      status: 'fits',
      imageLayoutId: composition.imageLayoutId,
      contentTemplateId: composition.contentTemplateId,
      message: '',
    };
  }

  const result = fitBlocksInArea(fitBlocks, area, slideWidth, slideHeight);

  return {
    status: result.status,
    imageLayoutId: composition.imageLayoutId,
    contentTemplateId: composition.contentTemplateId,
    message: getMessageForFitResult(result, composition.imageLayoutId),
  };
};
