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

const NBSP = '\u00A0';
const BREAKABLE_WHITESPACE_PATTERN = /[ \t\r\n]+/;

const normalizeText = (value: string) =>
  value
    .replace(/\r\n/g, '\n')
    .replace(/[ \t]+\n/g, '\n')
    .replace(/\n[ \t]+/g, '\n')
    .replace(/[ \t]{2,}/g, ' ')
    .trim();

const stripMeasurementMarkers = (value: string) =>
  value.replace(/\[\[|\]\]|\*\*/g, '');

const getBreakableWords = (value: string) =>
  value.trim().split(BREAKABLE_WHITESPACE_PATTERN).filter(Boolean);

const protectLeadingShortTitleWord = (value: string) => {
  const words = getBreakableWords(value);
  if (words.length < 2) return value;

  const leadingWord = words[0]?.replace(/\[\[|\]\]|\*\*/g, '') || '';
  if (leadingWord.length !== 1) return value;

  const [first, second, ...rest] = words;
  return [`${first}${NBSP}${second}`, ...rest].join(' ');
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
    return measuredWidth + Math.round(fontSize * 0.5);
  }

  return measuredWidth;
};

const hasTrailingOrphan = (lines: string[]) => {
  if (lines.length < 2) return false;
  const lastLineWords = lines[lines.length - 1]?.trim().split(/\s+/).filter(Boolean) || [];
  return lastLineWords.length === 1;
};

const hasAnySingleWordLine = (lines: string[]) => {
  if (lines.length < 2) return false;
  return lines.some((line) => line.trim().split(/\s+/).filter(Boolean).length === 1);
};

const hasUndesirableSingleWordLine = (
  lines: string[],
  constraint: TextConstraint,
) => {
  if (constraint.mode === 'manual') return false;

  switch (constraint.role) {
    case 'title':
    case 'badge':
    case 'box':
    case 'card':
      return hasAnySingleWordLine(lines);
    case 'paragraph':
    default:
      return hasTrailingOrphan(lines);
  }
};

const rebalanceShortTrailingLines = (
  lines: string[],
  fontSize: number,
  constraint: TextConstraint,
  measurer: TextMeasurer,
) => {
  const nextLines = [...lines];
  let changed = false;

  const isShortLine = (lineIndex: number) => {
    const words = nextLines[lineIndex]?.trim().split(/\s+/).filter(Boolean) || [];
    if (words.length === 0) return false;

    const width = measureLineWidth(nextLines[lineIndex], fontSize, constraint, measurer);
    const isLastLine = lineIndex === nextLines.length - 1;
    const widthThreshold = constraint.availableWidth * (isLastLine ? 0.34 : 0.22);

    return words.length === 1 || width < widthThreshold;
  };

  for (let lineIndex = nextLines.length - 1; lineIndex > 0; lineIndex -= 1) {
    if (!isShortLine(lineIndex)) continue;

    const previousWords = nextLines[lineIndex - 1]?.split(/\s+/).filter(Boolean) || [];
    if (previousWords.length < 2) continue;

    while (previousWords.length > 1 && isShortLine(lineIndex)) {
      const movedWord = previousWords.pop();
      if (!movedWord) break;

      const nextCurrent = `${movedWord} ${nextLines[lineIndex]}`.trim();
      const nextWidth = measureLineWidth(nextCurrent, fontSize, constraint, measurer);

      if (nextWidth > constraint.availableWidth) {
        previousWords.push(movedWord);
        break;
      }

      nextLines[lineIndex - 1] = previousWords.join(' ');
      nextLines[lineIndex] = nextCurrent;
      changed = true;
    }
  }

  return changed ? nextLines.filter(Boolean) : lines;
};

const getGreedyLinesForSegment = (
  segment: string,
  fontSize: number,
  constraint: TextConstraint,
  measurer: TextMeasurer,
): string[] => {
  const words = getBreakableWords(segment);
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
  return rebalanceShortTrailingLines(lines, fontSize, constraint, measurer);
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

  const words = getBreakableWords(text);
  if (words.length <= 2) return [text];

  const bestFromGreedy = getGreedyLines(text, fontSize, constraint, measurer);
  let best = bestFromGreedy;
  let bestScore = Number.POSITIVE_INFINITY;
  const greedyLineCount = bestFromGreedy.length;

  const scoreCandidate = (candidateLines: string[]) => {
    const widths = candidateLines.map((line) => measureLineWidth(line, fontSize, constraint, measurer));
    const avg = widths.reduce((sum, width) => sum + width, 0) / widths.length;
    const balanceCost = widths.reduce((sum, width) => sum + Math.abs(width - avg), 0);
    const singleWordPenalty = candidateLines.reduce((sum, line, index) => {
      const wordCount = line.split(/\s+/).filter(Boolean).length;
      if (wordCount !== 1) return sum;
      const isLastLine = index === candidateLines.length - 1;
      return sum + (isLastLine ? 120 : 220);
    }, 0);
    const extraLinePenalty = Math.max(0, candidateLines.length - greedyLineCount) * 140;
    const shortLinePenalty = widths.reduce((sum, width, index) => {
      const isLastLine = index === widths.length - 1;
      const threshold = constraint.availableWidth * (isLastLine ? 0.34 : 0.5);
      return width < threshold ? sum + (isLastLine ? 40 : 120) : sum;
    }, 0);
    const underusePenalty = widths.reduce((sum, width) => {
      const utilization = width / Math.max(1, constraint.availableWidth);
      return utilization < 0.68 ? sum + (0.68 - utilization) * 160 : sum;
    }, 0);
    return balanceCost + singleWordPenalty + extraLinePenalty + shortLinePenalty + underusePenalty;
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
  return rebalanceShortTrailingLines(best, fontSize, constraint, measurer);
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
  }) + ((line.includes('[[') || line.includes(']]')) ? Math.round(fontSize * 0.5) : 0));

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
  const normalized = constraint.mode === 'manual'
    ? normalizeText(text)
    : normalizeText(text.replace(/\r?\n/g, ' '));
  const overflow = constraint.overflow || 'shrink';
  const minFontSize = constraint.minFontSize || Math.max(12, constraint.fontSize * 0.6);

  const normalizedForFit = constraint.role === 'title' && constraint.mode !== 'manual'
    ? protectLeadingShortTitleWord(normalized)
    : normalized;

  // Non-title copy keeps a small guard against font-loading measurement drift. Titles are
  // already manually bounded by the image frame, so shrinking their width here causes early wraps.
  const widthSafetyScale = constraint.role === 'title' ? 1 : 0.98;
  const safeConstraint: TextConstraint = {
    ...constraint,
    availableWidth: Math.max(100, Math.floor(constraint.availableWidth * widthSafetyScale)),
  };

  const tryFit = (fontSize: number): TextFitResult => {
    const shouldBalance = constraint.role === 'title' || constraint.role === 'badge' || constraint.role === 'box';
    const lines = constraint.mode === 'manual'
      ? getManualLines(constraint.manualBreaks || text)
      : shouldBalance
        ? getBalancedLines(normalizedForFit, fontSize, safeConstraint, measurer)
        : getGreedyLines(normalizedForFit, fontSize, safeConstraint, measurer);

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
  if (doesFit(result.lines, result.effectiveFontSize, constraint, measurer) && !hasUndesirableSingleWordLine(result.lines, constraint)) {
    return result;
  }

  if (overflow !== 'shrink') {
    return result;
  }

  for (let size = constraint.fontSize - 1; size >= minFontSize; size -= 1) {
    const attempt = tryFit(size);
    if (doesFit(attempt.lines, attempt.effectiveFontSize, constraint, measurer) && !hasUndesirableSingleWordLine(attempt.lines, constraint)) {
      return attempt;
    }
    result = attempt;
  }

  return result;
};
