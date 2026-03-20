import { TextMeasurer, textMeasurer, type MeasureTypography } from './text-measurer';

export type TextConstraint = MeasureTypography & {
  availableWidth: number;
  availableHeight: number;
  lineHeight: number;
  maxLines: number;
  minFontSize?: number;
  overflow?: 'shrink' | 'truncate' | 'ellipsis' | 'reflow';
  role?: 'title' | 'paragraph' | 'card' | 'badge' | 'box';
  mode?: 'auto' | 'manual';
  manualBreaks?: string;
};

export type TextFitResult = {
  lines: string[];
  formatted: string;
  effectiveFontSize: number;
  wasShrunk: boolean;
  wasTruncated: boolean;
  quality: number;
};

const normalizeText = (value: string) =>
  value
    .replace(/\r\n/g, '\n')
    .replace(/[ \t]+\n/g, '\n')
    .replace(/\n[ \t]+/g, '\n')
    .replace(/[ \t]{2,}/g, ' ')
    .trim();

const stripMeasurementMarkers = (value: string) =>
  value.replace(/\[\[|\]\]|\*\*/g, '');

const getHighlightPaddingCompensation = (constraint: TextConstraint) => {
  switch (constraint.role) {
    case 'title':
      return 44;
    case 'box':
      return 40;
    case 'badge':
      return 28;
    case 'card':
      return 32;
    case 'paragraph':
      return 30;
    default:
      return 24;
  }
};

const measureLineWidth = (
  value: string,
  fontSize: number,
  constraint: TextConstraint,
  measurer: TextMeasurer,
) => {
  const measuredWidth = measurer.measureWidth(stripMeasurementMarkers(value), {
    fontSize,
    fontFamily: constraint.fontFamily,
    fontWeight: constraint.fontWeight,
    letterSpacing: constraint.letterSpacing,
  });

  if (value.includes('[[') || value.includes(']]')) {
    return measuredWidth + getHighlightPaddingCompensation(constraint);
  }

  return measuredWidth;
};

const hasTrailingOrphan = (lines: string[]) => {
  if (lines.length < 2) return false;
  const lastLineWords = lines[lines.length - 1]?.trim().split(/\s+/).filter(Boolean) || [];
  return lastLineWords.length === 1;
};

const rebalanceTrailingOrphan = (
  lines: string[],
  fontSize: number,
  constraint: TextConstraint,
  measurer: TextMeasurer,
) => {
  if (!hasTrailingOrphan(lines)) return lines;

  const nextLines = [...lines];
  const lastIndex = nextLines.length - 1;
  const previousWords = nextLines[lastIndex - 1]?.split(/\s+/).filter(Boolean) || [];
  if (previousWords.length < 2) return lines;

  const movedWord = previousWords.pop();
  if (!movedWord) return lines;

  const nextPrevious = previousWords.join(' ');
  const nextLast = `${movedWord} ${nextLines[lastIndex]}`.trim();
  const nextWidth = measureLineWidth(nextLast, fontSize, constraint, measurer);

  if (nextWidth > constraint.availableWidth) return lines;

  nextLines[lastIndex - 1] = nextPrevious;
  nextLines[lastIndex] = nextLast;
  return nextLines;
};

const getGreedyLinesForSegment = (
  segment: string,
  fontSize: number,
  constraint: TextConstraint,
  measurer: TextMeasurer,
): string[] => {
  const words = segment.trim().split(/\s+/).filter(Boolean);
  if (words.length === 0) return [''];

  const lines: string[] = [];
  let currentLine = '';

  for (const word of words) {
    const candidate = currentLine ? `${currentLine} ${word}` : word;
    if (measureLineWidth(candidate, fontSize, constraint, measurer) > constraint.availableWidth && currentLine) {
      lines.push(currentLine);
      currentLine = word;
    } else {
      currentLine = candidate;
    }
  }

  if (currentLine) lines.push(currentLine);
  return rebalanceTrailingOrphan(lines, fontSize, constraint, measurer);
};

const getGreedyLines = (
  text: string,
  fontSize: number,
  constraint: TextConstraint,
  measurer: TextMeasurer,
): string[] =>
  text
    .split('\n')
    .map((segment) => segment.trim())
    .filter(Boolean)
    .flatMap((segment) => getGreedyLinesForSegment(segment, fontSize, constraint, measurer));

const getBalancedLines = (
  text: string,
  fontSize: number,
  constraint: TextConstraint,
  measurer: TextMeasurer,
): string[] => {
  const segments = text
    .split('\n')
    .map((segment) => segment.trim())
    .filter(Boolean);
  if (segments.length > 1) {
    return segments.flatMap((segment) => getBalancedLines(segment, fontSize, constraint, measurer));
  }

  const words = text.split(/\s+/).filter(Boolean);
  if (words.length <= 2) return [text];

  const bestFromGreedy = getGreedyLines(text, fontSize, constraint, measurer);
  let best = bestFromGreedy;
  let bestScore = Number.POSITIVE_INFINITY;

  const scoreCandidate = (candidateLines: string[]) => {
    const widths = candidateLines.map((line) => measureLineWidth(line, fontSize, constraint, measurer));
    const avg = widths.reduce((sum, width) => sum + width, 0) / widths.length;
    const balanceCost = widths.reduce((sum, width) => sum + Math.abs(width - avg), 0);
    const orphanPenalty = candidateLines[candidateLines.length - 1].split(/\s+/).length === 1 ? 80 : 0;
    const widowPenalty = candidateLines[0].split(/\s+/).length === 1 ? 30 : 0;
    return balanceCost + orphanPenalty + widowPenalty;
  };

  const visit = (startIndex: number, currentLines: string[]) => {
    if (currentLines.length > constraint.maxLines) return;
    if (startIndex >= words.length) {
      if (currentLines.length === 0) return;
      const score = scoreCandidate(currentLines);
      if (score < bestScore) {
        bestScore = score;
        best = [...currentLines];
      }
      return;
    }

    for (let endIndex = startIndex + 1; endIndex <= words.length; endIndex += 1) {
      const line = words.slice(startIndex, endIndex).join(' ');
      const width = measureLineWidth(line, fontSize, constraint, measurer);
      if (width > constraint.availableWidth && endIndex > startIndex + 1) break;
      if (width > constraint.availableWidth) continue;

      currentLines.push(line);
      visit(endIndex, currentLines);
      currentLines.pop();
    }
  };

  visit(0, []);
  return rebalanceTrailingOrphan(best, fontSize, constraint, measurer);
};

const evaluateQuality = (
  lines: string[],
  fontSize: number,
  constraint: TextConstraint,
  measurer: TextMeasurer,
) => {
  if (lines.length === 0) return 0;

  const measuredWidths = lines.map((line) => measurer.measureWidth(stripMeasurementMarkers(line), {
    fontSize,
    fontFamily: constraint.fontFamily,
    fontWeight: constraint.fontWeight,
    letterSpacing: constraint.letterSpacing,
  }) + ((line.includes('[[') || line.includes(']]')) ? getHighlightPaddingCompensation(constraint) : 0));

  const avgWidth = measuredWidths.reduce((sum, width) => sum + width, 0) / measuredWidths.length;
  let score = 100;

  measuredWidths.forEach((width) => {
    if (width > constraint.availableWidth) score -= 30;
    score -= Math.abs(width - avgWidth) / Math.max(1, constraint.availableWidth) * 35;
  });

  const lastLineWords = lines[lines.length - 1]?.split(/\s+/).filter(Boolean) || [];
  if (lastLineWords.length === 1) score -= constraint.role === 'title' ? 42 : 30;
  if (lines.length > constraint.maxLines) score -= (lines.length - constraint.maxLines) * 30;

  return Math.max(0, Math.round(score));
};

const doesFit = (
  lines: string[],
  fontSize: number,
  constraint: TextConstraint,
  measurer: TextMeasurer,
) => {
  const height = measurer.measureHeight(lines, fontSize, constraint.lineHeight);
  const withinHeight = height <= constraint.availableHeight;
  const withinLines = lines.length <= constraint.maxLines;
  const withinWidth = lines.every((line) => measureLineWidth(line, fontSize, constraint, measurer) <= constraint.availableWidth);

  return withinHeight && withinLines && withinWidth;
};

const getManualLines = (manualBreaks: string) =>
  normalizeText(manualBreaks).split('\n').map((line) => line.trim());

export const fitTextToConstraint = (
  text: string,
  constraint: TextConstraint,
  measurer: TextMeasurer = textMeasurer,
): TextFitResult => {
  const normalized = normalizeText(text);
  const overflow = constraint.overflow || 'shrink';
  const minFontSize = constraint.minFontSize || Math.max(12, constraint.fontSize * 0.6);

  const tryFit = (fontSize: number): TextFitResult => {
    const shouldBalance = constraint.role === 'title' || constraint.role === 'badge' || constraint.role === 'box';
    const lines = constraint.mode === 'manual' && constraint.manualBreaks
      ? getManualLines(constraint.manualBreaks)
      : shouldBalance
        ? getBalancedLines(normalized, fontSize, constraint, measurer)
        : getGreedyLines(normalized, fontSize, constraint, measurer);

    return {
      lines,
      formatted: lines.join('\n'),
      effectiveFontSize: fontSize,
      wasShrunk: fontSize < constraint.fontSize,
      wasTruncated: false,
      quality: evaluateQuality(lines, fontSize, constraint, measurer),
    };
  };

  let result = tryFit(constraint.fontSize);
  if (doesFit(result.lines, result.effectiveFontSize, constraint, measurer) && !hasTrailingOrphan(result.lines)) {
    return result;
  }

  if (overflow !== 'shrink') {
    return result;
  }

  for (let size = constraint.fontSize - 2; size >= minFontSize; size -= 2) {
    const attempt = tryFit(size);
    if (doesFit(attempt.lines, attempt.effectiveFontSize, constraint, measurer) && !hasTrailingOrphan(attempt.lines)) {
      return attempt;
    }
    result = attempt;
  }

  return result;
};
