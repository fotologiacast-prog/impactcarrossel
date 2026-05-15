export interface BlockMeasurement {
  blockType: string;
  variant: string;
  minHeight: number;
  idealHeight: number;
  maxHeight: number;
  minWidth: number;
  canShrink: boolean;
  shrinkFactor: number;
  priority: number;
}

const clamp = (value: number, min: number, max: number) => Math.min(max, Math.max(min, value));

const priorityByType: Record<string, number> = {
  TITLE: 100,
  CTA: 85,
  BOX: 70,
  BADGE: 60,
  PARAGRAPH: 50,
  LIST: 45,
  IMAGE: 20,
};

const textLength = (data: { text?: string; title?: string; items?: string[] }) => {
  if (Array.isArray(data.items)) {
    return data.items.reduce((sum, item) => sum + String(item).length, 0);
  }

  return [data.text, data.title].filter(Boolean).join(' ').length;
};

export function measureBlock(blockType: string, data: any, areaWidthPx: number): BlockMeasurement {
  const type = blockType.toUpperCase();
  const contentLength = textLength(data ?? {});

  switch (type) {
    case 'TITLE': {
      const baseFontSize = contentLength < 16 ? 52 : contentLength < 32 ? 44 : contentLength < 60 ? 36 : 30;
      const charsPerLine = Math.max(8, Math.floor(areaWidthPx / (baseFontSize * 0.56)));
      const lineCount = Math.max(1, Math.ceil(Math.max(1, contentLength) / charsPerLine));
      const lineHeight = baseFontSize * 1.12;
      return {
        blockType: 'TITLE',
        variant: 'auto',
        minHeight: lineHeight,
        idealHeight: clamp(lineCount * lineHeight, lineHeight, lineHeight * 3),
        maxHeight: lineHeight * 3.25,
        minWidth: 120,
        canShrink: true,
        shrinkFactor: 0.7,
        priority: priorityByType.TITLE,
      };
    }

    case 'PARAGRAPH': {
      const fontSize = 18;
      const charsPerLine = Math.max(14, Math.floor(areaWidthPx / (fontSize * 0.5)));
      const lineCount = Math.max(1, Math.ceil(Math.max(1, contentLength) / charsPerLine));
      const lineHeight = fontSize * 1.5;
      const minHeight = lineHeight * 1.2;
      const idealHeight = Math.max(minHeight, lineCount * lineHeight);
      return {
        blockType: 'PARAGRAPH',
        variant: 'auto',
        minHeight,
        idealHeight,
        maxHeight: idealHeight + 28,
        minWidth: 100,
        canShrink: true,
        shrinkFactor: 0.85,
        priority: priorityByType.PARAGRAPH,
      };
    }

    case 'LIST': {
      const items = Array.isArray(data?.items) ? data.items : [];
      const itemCount = Math.max(1, items.length);
      const avgItemLength =
        itemCount > 0 ? items.reduce((sum: number, item: string) => sum + String(item).length, 0) / itemCount : 0;
      const compactItemHeight = avgItemLength > 28 ? 38 : 32;
      const idealItemHeight = avgItemLength > 28 ? 48 : 42;
      const gap = itemCount > 1 ? 10 : 0;
      return {
        blockType: 'LIST',
        variant: 'auto',
        minHeight: itemCount * compactItemHeight + Math.max(0, itemCount - 1) * gap,
        idealHeight: itemCount * idealItemHeight + Math.max(0, itemCount - 1) * gap,
        maxHeight: itemCount * idealItemHeight + Math.max(0, itemCount - 1) * gap + 24,
        minWidth: 150,
        canShrink: true,
        shrinkFactor: 0.75,
        priority: priorityByType.LIST,
      };
    }

    case 'BOX': {
      const hasTitle = Boolean(data?.title);
      const hasText = Boolean(data?.text);
      const hasIcon = Boolean(data?.icon);
      const minHeight = 92 + (hasText ? 18 : 0) + (hasTitle ? 12 : 0) + (hasIcon ? 8 : 0);
      const idealHeight = minHeight + 48;
      return {
        blockType: 'BOX',
        variant: 'auto',
        minHeight,
        idealHeight,
        maxHeight: idealHeight + 30,
        minWidth: 130,
        canShrink: true,
        shrinkFactor: 0.82,
        priority: priorityByType.BOX,
      };
    }

    case 'BADGE': {
      return {
        blockType: 'BADGE',
        variant: 'auto',
        minHeight: 28,
        idealHeight: 36,
        maxHeight: 42,
        minWidth: 54,
        canShrink: false,
        shrinkFactor: 1,
        priority: priorityByType.BADGE,
      };
    }

    case 'CTA': {
      const textWeight = contentLength > 24 ? 4 : 0;
      return {
        blockType: 'CTA',
        variant: 'auto',
        minHeight: 48,
        idealHeight: 56 + textWeight,
        maxHeight: 68 + textWeight,
        minWidth: 100,
        canShrink: false,
        shrinkFactor: 1,
        priority: priorityByType.CTA,
      };
    }

    case 'IMAGE': {
      return {
        blockType: 'IMAGE',
        variant: 'auto',
        minHeight: 120,
        idealHeight: 320,
        maxHeight: 9999,
        minWidth: 120,
        canShrink: false,
        shrinkFactor: 1,
        priority: priorityByType.IMAGE,
      };
    }

    default: {
      return {
        blockType: type,
        variant: 'auto',
        minHeight: 40,
        idealHeight: 60,
        maxHeight: 100,
        minWidth: 50,
        canShrink: false,
        shrinkFactor: 1,
        priority: 10,
      };
    }
  }
}
