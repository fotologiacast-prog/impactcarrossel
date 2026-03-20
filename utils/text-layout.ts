const normalizeSpacing = (value: string): string =>
  value
    .replace(/\r\n/g, '\n')
    .replace(/[ \t]+\n/g, '\n')
    .replace(/\n[ \t]+/g, '\n')
    .replace(/[ \t]{2,}/g, ' ')
    .trim();

const getWords = (value: string): string[] =>
  value.trim().split(/\s+/).filter(Boolean);

const getBreakScore = (left: string, right: string): number => {
  const leftWords = getWords(left);
  const rightWords = getWords(right);

  if (leftWords.length < 2 || rightWords.length < 2) return Number.POSITIVE_INFINITY;
  if (rightWords.length === 1) return Number.POSITIVE_INFINITY;

  const charBalance = Math.abs(left.length - right.length);
  const wordBalance = Math.abs(leftWords.length - rightWords.length) * 12;
  const shortLastLinePenalty = right.length < left.length * 0.45 ? 80 : 0;
  const shortFirstLinePenalty = left.length < right.length * 0.45 ? 40 : 0;

  return charBalance + wordBalance + shortLastLinePenalty + shortFirstLinePenalty;
};

export const balanceTitleLineBreak = (value: string): string => {
  const normalized = normalizeSpacing(value);
  if (!normalized || normalized.includes('\n') || normalized.includes('[[') || normalized.includes('**')) return normalized;

  const words = getWords(normalized);
  if (words.length < 4 || words.length > 12) return normalized;

  let bestCandidate = normalized;
  let bestScore = Number.POSITIVE_INFINITY;

  for (let index = 2; index <= words.length - 2; index += 1) {
    const left = words.slice(0, index).join(' ');
    const right = words.slice(index).join(' ');
    const score = getBreakScore(left, right);
    if (score < bestScore) {
      bestScore = score;
      bestCandidate = `${left}\n${right}`;
    }
  }

  return bestCandidate;
};

export const applyWidowProtection = (value: string): string =>
  normalizeSpacing(value)
    .split('\n')
    .map((line) => {
      const trimmed = line.trim();
      if (!trimmed) return line;

      const parts = trimmed.split(/\s+/);
      if (parts.length < 2) return line;

      const lastWord = parts[parts.length - 1];
      const shouldProtect = lastWord.length <= 3;
      if (!shouldProtect) return trimmed;

      return trimmed.replace(/\s+(\S+)$/, '\u00A0$1');
    })
    .join('\n');

export const resolveLineBreakMode = (value?: string | null): 'auto' | 'manual' =>
  value === 'manual' ? 'manual' : 'auto';

export const formatTextForRender = (
  value: string,
  mode?: string | null,
  blockType?: 'TITLE' | 'PARAGRAPH' | 'CARD' | 'BADGE' | 'BOX',
): string => {
  if (resolveLineBreakMode(mode) === 'manual') return normalizeSpacing(value);

  const normalized = normalizeSpacing(value);
  const balanced = blockType === 'TITLE' ? balanceTitleLineBreak(normalized) : normalized;
  return applyWidowProtection(balanced);
};
