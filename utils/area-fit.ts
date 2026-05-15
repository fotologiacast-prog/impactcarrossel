import type { AreaBounds, SlideArea } from './area-layout.ts';
import { measureBlock, type BlockMeasurement } from './block-measurement.ts';

export type FitResult =
  | { status: 'fits'; blocks: FittedBlock[]; usedHeight: number; remainingHeight: number }
  | { status: 'fits_shrunk'; blocks: FittedBlock[]; shrinkRatio: number; usedHeight: number; remainingHeight: number }
  | { status: 'overflow'; excess: number; blocks: FittedBlock[]; droppedBlocks: DroppedBlock[]; usedHeight: number }
  | { status: 'impossible'; reason: string; blocks: []; droppedBlocks?: DroppedBlock[] };

export interface FittedBlock {
  blockType: string;
  data: any;
  variant: string;
  allocatedHeight: number;
  shrinkRatio: number;
  position: {
    offsetY: number;
  };
}

export interface DroppedBlock {
  blockType: string;
  data: any;
  reason: 'no_space' | 'below_min_height' | 'low_priority';
}

export const getAvailableSpace = (
  area: SlideArea,
  slideWidth: number,
  slideHeight: number,
): { widthPx: number; heightPx: number } => {
  const widthPx =
    (area.bounds.width / 100) * slideWidth - area.padding.left - area.padding.right;
  const heightPx =
    (area.bounds.height / 100) * slideHeight - area.padding.top - area.padding.bottom;

  return {
    widthPx: Math.max(0, widthPx),
    heightPx: Math.max(0, heightPx),
  };
};

const sum = (values: number[]) => values.reduce((total, value) => total + value, 0);

const layoutBlocks = (
  measurements: { index: number; block: { type: string; data: any; variant?: string }; measurement: BlockMeasurement }[],
  gap: number,
  shrinkRatio: number,
): FittedBlock[] => {
  const fitted: FittedBlock[] = [];
  let currentY = 0;

  measurements.forEach((item, index) => {
    let allocatedHeight = item.measurement.idealHeight;

    if (item.measurement.canShrink && shrinkRatio < 1) {
      const shrinkableHeight = item.measurement.idealHeight - item.measurement.minHeight;
      allocatedHeight = item.measurement.idealHeight - shrinkableHeight * (1 - shrinkRatio);
    }

    allocatedHeight = Math.max(item.measurement.minHeight, allocatedHeight);

    fitted.push({
      blockType: item.block.type,
      data: item.block.data,
      variant: item.block.variant ?? 'auto',
      allocatedHeight,
      shrinkRatio: item.measurement.canShrink ? allocatedHeight / item.measurement.idealHeight : 1,
      position: { offsetY: currentY },
    });

    currentY += allocatedHeight;
    if (index < measurements.length - 1) {
      currentY += gap;
    }
  });

  return fitted;
};

export { layoutBlocks };

export const fitBlocksInArea = (
  blocks: { type: string; data: any; variant?: string }[],
  area: SlideArea,
  slideWidth: number,
  slideHeight: number,
): FitResult => {
  const available = getAvailableSpace(area, slideWidth, slideHeight);
  const measurements = blocks.map((block, index) => ({
    index,
    block,
    measurement: measureBlock(block.type, block.data, available.widthPx),
  }));

  if (measurements.some((item) => item.measurement.minWidth > available.widthPx)) {
    return {
      status: 'impossible',
      reason: 'At least one block is wider than the available area',
      blocks: [],
    };
  }

  const totalGap = Math.max(0, blocks.length - 1) * area.gap;
  const idealTotal = sum(measurements.map((item) => item.measurement.idealHeight)) + totalGap;
  const minTotal = sum(measurements.map((item) => item.measurement.minHeight)) + totalGap;

  if (idealTotal <= available.heightPx) {
    const fitted = layoutBlocks(measurements, area.gap, 1);
    return {
      status: 'fits',
      blocks: fitted,
      usedHeight: idealTotal,
      remainingHeight: available.heightPx - idealTotal,
    };
  }

  if (minTotal <= available.heightPx) {
    const shrinkableSpace = Math.max(1, idealTotal - minTotal);
    const excessSpace = idealTotal - available.heightPx;
    const shrinkRatio = Math.max(0.5, Math.min(1, 1 - excessSpace / shrinkableSpace));
    const fitted = layoutBlocks(measurements, area.gap, shrinkRatio);
    return {
      status: 'fits_shrunk',
      blocks: fitted,
      shrinkRatio,
      usedHeight: available.heightPx,
      remainingHeight: 0,
    };
  }

  const ordered = [...measurements].sort((a, b) => a.measurement.priority - b.measurement.priority || a.index - b.index);
  const kept = [...measurements];
  const droppedBlocks: DroppedBlock[] = [];

  const keptMinTotal = () => sum(kept.map((item) => item.measurement.minHeight)) + Math.max(0, kept.length - 1) * area.gap;

  for (const candidate of ordered) {
    if (keptMinTotal() <= available.heightPx) break;

    const candidateIndex = kept.findIndex((item) => item.index === candidate.index);
    if (candidateIndex !== -1) {
      const [removed] = kept.splice(candidateIndex, 1);
      droppedBlocks.push({
        blockType: removed.block.type,
        data: removed.block.data,
        reason: 'low_priority',
      });
    }
  }

  if (kept.length === 0) {
    return {
      status: 'impossible',
      reason: 'No blocks fit in the available area',
      blocks: [],
      droppedBlocks,
    };
  }

  if (keptMinTotal() > available.heightPx) {
    return {
      status: 'impossible',
      reason: 'Even after dropping low priority blocks, the minimum height still overflows',
      blocks: [],
      droppedBlocks,
    };
  }

  const keptIdealTotal = sum(kept.map((item) => item.measurement.idealHeight)) + Math.max(0, kept.length - 1) * area.gap;
  const shrinkableSpace = Math.max(1, sum(kept.map((item) => item.measurement.idealHeight - item.measurement.minHeight)));
  const excessSpace = Math.max(0, keptIdealTotal - available.heightPx);
  const shrinkRatio = keptIdealTotal <= available.heightPx ? 1 : Math.max(0.5, Math.min(1, 1 - excessSpace / shrinkableSpace));
  const fitted = layoutBlocks(kept, area.gap, shrinkRatio);

  return {
    status: 'overflow',
    excess: idealTotal - available.heightPx,
    blocks: fitted,
    droppedBlocks,
    usedHeight: Math.min(available.heightPx, keptIdealTotal),
  };
};
