const NBSP = '\u00A0';

const clamp = (value: number, min: number, max: number) => Math.min(max, Math.max(min, value));

const tokenizeWords = (text: string) => text.trim().split(/ +/).filter(Boolean);

export function estimateCharWidth(fontSize: number): number {
  return fontSize * 0.52;
}

export function simulateLines(
  text: string,
  fontSize: number,
  containerWidth: number,
  fontWeight: number = 400,
): string[] {
  const weightFactor = fontWeight >= 700 ? 1.06 : 1;
  const charWidth = estimateCharWidth(fontSize) * weightFactor;
  const charsPerLine = Math.max(1, Math.floor(containerWidth / charWidth));
  const words = tokenizeWords(text);
  const lines: string[] = [];
  let currentLine: string[] = [];
  let currentLength = 0;

  words.forEach((word) => {
    const wordLength = word.replaceAll(NBSP, ' ').length;
    const spacer = currentLength > 0 ? 1 : 0;
    if (currentLength + spacer + wordLength > charsPerLine && currentLine.length > 0) {
      lines.push(currentLine.join(' '));
      currentLine = [word];
      currentLength = wordLength;
      return;
    }

    currentLine.push(word);
    currentLength += spacer + wordLength;
  });

  if (currentLine.length > 0) {
    lines.push(currentLine.join(' '));
  }

  return lines;
}

export function estimateLineCount(
  text: string,
  fontSize: number,
  containerWidth: number,
  fontWeight: number = 400,
): number {
  return simulateLines(text, fontSize, containerWidth, fontWeight).length;
}

export function hasOrphanWord(
  text: string,
  fontSize: number,
  containerWidth: number,
  fontWeight: number = 400,
) {
  const lines = simulateLines(text, fontSize, containerWidth, fontWeight);
  const lastLine = lines[lines.length - 1] || '';
  const lastLineWords = lastLine.split(/[ \u00A0]+/).filter(Boolean);

  return {
    hasOrphan: lines.length > 1 && lastLineWords.length === 1,
    lastLineText: lastLine,
    lastLineWordCount: lastLineWords.length,
  };
}

export function fixOrphanWords(
  text: string,
  fontSize: number,
  containerWidth: number,
  fontWeight: number = 400,
): string {
  const words = tokenizeWords(text);
  if (words.length < 3) return text;

  const orphanCheck = hasOrphanWord(text, fontSize, containerWidth, fontWeight);
  if (!orphanCheck.hasOrphan) return text;

  const pairFixed = [...words];
  const lastWord = pairFixed.pop()!;
  const secondLast = pairFixed.pop()!;
  pairFixed.push(`${secondLast}${NBSP}${lastWord}`);
  const pairResult = pairFixed.join(' ');

  if (!hasOrphanWord(pairResult, fontSize, containerWidth, fontWeight).hasOrphan) {
    return pairResult;
  }

  if (words.length >= 4) {
    const tripleFixed = [...words];
    const lastThree = tripleFixed.splice(-3).join(NBSP);
    tripleFixed.push(lastThree);
    return tripleFixed.join(' ');
  }

  return pairResult;
}

export interface InternalSpacing {
  lineHeight: number;
  letterSpacing: number;
  paddingTop: number;
  paddingBottom: number;
  marginBottom: number;
}

export function computeInternalSpacing(
  blockType: 'title' | 'subtitle' | 'paragraph' | 'tag' | 'stat' | 'list' | 'quote' | 'default',
  fontSize: number,
  options: {
    hasHighlight?: boolean;
    hasUnderline?: boolean;
    fontWeight?: number;
    isMultiLine?: boolean;
  } = {},
): InternalSpacing {
  const { hasHighlight = false, hasUnderline = false, isMultiLine = false } = options;

  switch (blockType) {
    case 'title': {
      let lineHeight = 1.15;
      if (hasHighlight) lineHeight = 1.42;
      if (fontSize > 48 && !hasHighlight) lineHeight = 1.08;
      if (isMultiLine && !hasHighlight) lineHeight = Math.max(lineHeight, 1.18);
      return {
        lineHeight,
        letterSpacing: fontSize > 36 ? -0.8 : fontSize > 28 ? -0.35 : 0,
        paddingTop: 0,
        paddingBottom: hasUnderline ? 8 : 0,
        marginBottom: 0,
      };
    }
    case 'subtitle':
      return { lineHeight: 1.35, letterSpacing: 0, paddingTop: 0, paddingBottom: 0, marginBottom: 0 };
    case 'paragraph':
      return {
        lineHeight: hasHighlight ? 1.68 : fontSize < 15 ? 1.62 : 1.52,
        letterSpacing: 0.08,
        paddingTop: 0,
        paddingBottom: 0,
        marginBottom: 0,
      };
    case 'tag':
      return { lineHeight: 1, letterSpacing: 0.5, paddingTop: 0, paddingBottom: 0, marginBottom: 0 };
    case 'stat':
      return { lineHeight: 1, letterSpacing: -2, paddingTop: 8, paddingBottom: 8, marginBottom: 0 };
    case 'list':
      return { lineHeight: 1.36, letterSpacing: 0, paddingTop: 4, paddingBottom: 4, marginBottom: 0 };
    case 'quote':
      return { lineHeight: 1.55, letterSpacing: 0, paddingTop: 4, paddingBottom: 4, marginBottom: 0 };
    default:
      return { lineHeight: 1.4, letterSpacing: 0, paddingTop: 0, paddingBottom: 0, marginBottom: 0 };
  }
}

export interface SizingResult {
  fontSize: number;
  lineHeight: number;
  lineCount: number;
  totalHeight: number;
  orphanFixed: boolean;
  processedText: string;
}

export function autoSizeTitle(
  text: string,
  containerWidth: number,
  maxHeight: number,
  options: {
    hasHighlight?: boolean;
    minFontSize?: number;
    maxFontSize?: number;
    preferredMaxLines?: number;
  } = {},
): SizingResult {
  const {
    hasHighlight = false,
    minFontSize = 22,
    maxFontSize = 56,
    preferredMaxLines = 3,
  } = options;

  const candidates: SizingResult[] = [];

  for (let size = maxFontSize; size >= minFontSize; size -= 2) {
    const processedText = fixOrphanWords(text, size, containerWidth, 800);
    const lineCount = estimateLineCount(processedText, size, containerWidth, 800);
    const spacing = computeInternalSpacing('title', size, {
      hasHighlight,
      isMultiLine: lineCount > 1,
    });
    const totalHeight = lineCount * (size * spacing.lineHeight) + spacing.paddingTop + spacing.paddingBottom;
    candidates.push({
      fontSize: size,
      lineHeight: spacing.lineHeight,
      lineCount,
      totalHeight,
      orphanFixed: processedText !== text,
      processedText,
    });
  }

  const fitting = candidates.find((candidate) => candidate.totalHeight <= maxHeight && candidate.lineCount <= preferredMaxLines);
  if (fitting) return fitting;

  const relaxed = candidates.find((candidate) => candidate.totalHeight <= maxHeight);
  if (relaxed) return relaxed;

  return candidates[candidates.length - 1];
}

export function autoSizeParagraph(
  text: string,
  containerWidth: number,
  maxHeight: number,
  options: {
    hasHighlight?: boolean;
    minFontSize?: number;
    maxFontSize?: number;
  } = {},
): SizingResult {
  const {
    hasHighlight = false,
    minFontSize = 13,
    maxFontSize = 20,
  } = options;

  for (let size = maxFontSize; size >= minFontSize; size -= 1) {
    const processedText = fixOrphanWords(text, size, containerWidth, 400);
    const spacing = computeInternalSpacing('paragraph', size, { hasHighlight });
    const lineCount = estimateLineCount(processedText, size, containerWidth, 400);
    const totalHeight = lineCount * (size * spacing.lineHeight);

    if (totalHeight <= maxHeight) {
      return {
        fontSize: size,
        lineHeight: spacing.lineHeight,
        lineCount,
        totalHeight,
        orphanFixed: processedText !== text,
        processedText,
      };
    }
  }

  const spacing = computeInternalSpacing('paragraph', minFontSize, { hasHighlight });
  const processedText = fixOrphanWords(text, minFontSize, containerWidth, 400);
  const maxLines = Math.max(1, Math.floor(maxHeight / (minFontSize * spacing.lineHeight)));
  return {
    fontSize: minFontSize,
    lineHeight: spacing.lineHeight,
    lineCount: maxLines,
    totalHeight: maxLines * (minFontSize * spacing.lineHeight),
    orphanFixed: processedText !== text,
    processedText,
  };
}

export interface AutoSizeListResult {
  fontSize: number;
  iconSize: number;
  itemGap: number;
  itemPadding: number;
  totalHeight: number;
  processedItems: string[];
}

export function autoSizeList(
  items: string[],
  containerWidth: number,
  maxHeight: number,
  options: {
    minFontSize?: number;
    maxFontSize?: number;
    baseIconSize?: number;
  } = {},
): AutoSizeListResult {
  const {
    minFontSize = 13,
    maxFontSize = 18,
    baseIconSize = 28,
  } = options;

  const textWidth = Math.max(120, containerWidth - baseIconSize - 16);

  for (let size = maxFontSize; size >= minFontSize; size -= 1) {
    const itemGap = Math.round(size * 0.7);
    const itemPadding = Math.round(size * 0.8);
    const iconSize = Math.round(baseIconSize * (size / maxFontSize));
    const spacing = computeInternalSpacing('list', size);

    const processedItems = items.map((item) => fixOrphanWords(item, size, textWidth, 600));
    const totalHeight = processedItems.reduce((sum, item) => {
      const lines = estimateLineCount(item, size, textWidth, 600);
      return sum + lines * (size * spacing.lineHeight) + itemPadding * 2;
    }, 0) + Math.max(0, processedItems.length - 1) * itemGap;

    if (totalHeight <= maxHeight) {
      return {
        fontSize: size,
        iconSize,
        itemGap,
        itemPadding,
        totalHeight,
        processedItems,
      };
    }
  }

  return {
    fontSize: minFontSize,
    iconSize: Math.round(baseIconSize * 0.72),
    itemGap: 8,
    itemPadding: 8,
    totalHeight: maxHeight,
    processedItems: items.map((item) => fixOrphanWords(item, minFontSize, textWidth, 600)),
  };
}

export function normalizeProcessedText(text: string) {
  return text.replaceAll(NBSP, '\u00A0');
}

export { NBSP, clamp };
