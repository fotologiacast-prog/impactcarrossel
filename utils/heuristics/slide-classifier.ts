import type { HeuristicSlideAnalysis, HeuristicSlideSignalMap, ParsedRawSlide } from '../../types';

const countWords = (value: string) => value.trim().split(/\s+/).filter(Boolean).length;
const numericPattern = /\b\d+(?:[.,]\d+)?%?\b/;

const clamp01 = (value: number) => Math.min(1, Math.max(0, value));
const titleCaseComparisonPattern = /\b[A-ZÁÉÍÓÚÂÊÔÃÕÇ][\wÀ-ÿ]+\s+x\s+[A-ZÁÉÍÓÚÂÊÔÃÕÇ][\wÀ-ÿ]+\b/;
const genericVsPattern = /\b[\wÀ-ÿ]+\s+vs\.?\s+[\wÀ-ÿ]+\b/i;
const questionSequenceTitlePattern = /^pergunta\s*#?\d+\b/i;

const normalizeComparisonCue = (value?: string | null) =>
  (value || '').trim().replace(/[.!?;]+$/g, '').trim();

const hasStandaloneComparisonCue = (value?: string | null) => {
  const cue = normalizeComparisonCue(value);
  return /^(?:mito\s*(?:x|vs\.?|\/)\s*verdade|verdade\s*(?:x|vs\.?|\/)\s*mito|antes\s*(?:x|vs\.?|\/)\s*depois|depois\s*(?:x|vs\.?|\/)\s*antes|[\wÀ-ÿ][\wÀ-ÿ\s]{0,44}\s+vs\.?\s+[\wÀ-ÿ][\wÀ-ÿ\s]{0,44})$/i.test(cue)
    || titleCaseComparisonPattern.test(cue);
};

const hasLabeledComparisonPair = (text: string) => {
  const hasMito = /(?:^|\n)\s*mito\s*[:\-–—]/i.test(text);
  const hasVerdade = /(?:^|\n)\s*verdade\s*[:\-–—]/i.test(text);
  const hasAntes = /(?:^|\n)\s*antes\s*[:\-–—]/i.test(text);
  const hasDepois = /(?:^|\n)\s*depois\s*[:\-–—]/i.test(text);

  return (hasMito && hasVerdade) || (hasAntes && hasDepois);
};

const computeListSignal = (slide: ParsedRawSlide, itemCount: number, itemAverageLength: number) => {
  let signal = 0;

  if (slide.signals.hasExplicitList) {
    signal += 0.62;
    if (itemCount >= 3) signal += 0.14;
    if (itemCount >= 5) signal += 0.08;
  }

  if (slide.signals.hasImplicitList) {
    signal += 0.38;
  }

  if (itemAverageLength > 8) {
    signal -= 0.12;
  }

  return clamp01(signal);
};

const computeStatSignal = (slide: ParsedRawSlide, textLength: number, titleLength: number) => {
  const semanticText = [slide.title, slide.subtitle, slide.text, ...slide.bodyLines, ...slide.listItems, slide.cta]
    .filter(Boolean)
    .join(' ');
  const title = slide.title?.trim() || slide.titleCandidate?.trim() || '';
  if (questionSequenceTitlePattern.test(title)) return 0;

  const hasNumericSemantic = numericPattern.test(semanticText);
  const titleHasNumber = numericPattern.test(title);
  const bodyHasNumber = hasNumericSemantic && !titleHasNumber;

  if (!hasNumericSemantic && !slide.signals.hasNumberStat) return 0;

  let signal = 0;

  if (titleHasNumber) {
    signal += 0.52;
    if (/\d{2,}%/.test(title)) signal += 0.14;
  } else if (bodyHasNumber) {
    signal += 0.18;
  }

  if (slide.signals.hasNumberStat) signal += 0.10;
  if (/(\bR\$\s?\d|\b\d+(?:[.,]\d+)?\s*(?:mil|milh|milhões|milhoes|bi|trilh|anos|dias|meses|horas))/i.test(semanticText)) {
    signal += 0.18;
  }
  if (textLength < 80) signal += 0.14;
  if (textLength < 50) signal += 0.06;
  if (textLength > 200) signal -= 0.20;
  if (slide.listItems.length > 0) signal -= 0.14;
  if (titleLength > 40) signal -= 0.10;

  return clamp01(signal);
};

const computeComparisonSignal = (slide: ParsedRawSlide) => {
  const semanticText = [slide.title, slide.subtitle, slide.text, ...slide.bodyLines, ...slide.listItems, slide.cta]
    .filter(Boolean)
    .join('\n');
  const comparisonPieces = [slide.title, slide.titleCandidate, ...slide.bodyLines, ...slide.listItems]
    .filter(Boolean) as string[];
  const hasStandaloneCue = comparisonPieces.some(hasStandaloneComparisonCue);
  const hasLabeledPair = hasLabeledComparisonPair(semanticText);
  const hasVsCue = genericVsPattern.test(semanticText);
  const hasTitleCaseCue = titleCaseComparisonPattern.test(semanticText);
  let signal = 0;

  if (!hasStandaloneCue && !hasLabeledPair && !hasVsCue && !hasTitleCaseCue) return 0;

  if (hasStandaloneCue || hasLabeledPair) signal += 0.72;
  if (hasVsCue) signal += 0.56;
  if (hasTitleCaseCue) signal += 0.34;
  if (slide.listItems.length === 2) signal += 0.1;
  if (slide.title && /[:\-–—]\s*$/.test(slide.title)) signal += 0.05;

  return clamp01(signal);
};

const computeCtaSignal = (slide: ParsedRawSlide, slideIndex: number, totalSlides: number) => {
  let signal = 0;

  if (slide.cta) signal += 0.72;
  if (slide.signals.hasCTA) signal += 0.28;
  if (slideIndex >= totalSlides - 1 && signal > 0) signal += 0.18;
  if (slideIndex === 0) signal -= 0.28;

  return clamp01(signal);
};

const computeIntroSignal = (slide: ParsedRawSlide, slideIndex: number) => {
  if (slideIndex > 2) return 0;

  const title = slide.title?.trim() || slide.titleCandidate?.trim() || '';
  let signal = slideIndex === 0 ? 0.6 : slideIndex === 1 ? 0.18 : 0.08;

  if (title.length > 0 && title.length < 50) signal += 0.15;
  if (!slide.signals.hasExplicitList && !slide.signals.hasNumberStat) signal += 0.12;
  if (slide.listItems.length > 0) signal -= 0.18;
  if (slide.cta) signal -= 0.08;

  return clamp01(signal);
};

const computeQuoteSignal = (slide: ParsedRawSlide) => {
  const semanticText = [slide.title, slide.subtitle, slide.text, ...slide.bodyLines, ...slide.listItems, slide.cta]
    .filter(Boolean)
    .join(' ');
  let signal = 0;

  if (/["“”].+["“”]/.test(semanticText) || /^["“”]/.test(semanticText.trim())) signal += 0.6;
  if (/[—–-]\s*[A-ZÁÉÍÓÚÂÊÔÃÕÇ]/.test(semanticText)) signal += 0.24;
  if (slide.bodyLines.length > 0 && slide.bodyLines.length <= 2) signal += 0.1;

  return clamp01(signal);
};

const computeSinglePointSignal = (
  slide: ParsedRawSlide,
  quoteSignal: number,
  textLength: number,
  titleLength: number,
) => {
  let signal = 0;

  if (titleLength > 0 && titleLength <= 60) signal += 0.20;
  if (textLength > 20 && textLength < 120) signal += 0.18;
  signal += quoteSignal * 0.35;

  if (!slide.signals.hasExplicitList && !slide.signals.hasNumberStat && !slide.signals.hasComparison && !slide.signals.hasCTA) {
    signal += 0.12;
  }

  if (textLength > 180) signal -= 0.15;
  if (slide.listItems.length > 0) signal -= 0.10;
  if (slide.cta) signal -= 0.05;
  if (titleLength === 0) signal -= 0.12;

  return clamp01(signal);
};

const buildSignals = (
  slide: ParsedRawSlide,
  slideIndex: number,
  totalSlides: number,
  textLength: number,
  titleLength: number,
  itemCount: number,
  itemAverageLength: number,
) => {
  const quote = computeQuoteSignal(slide);
  const list = computeListSignal(slide, itemCount, itemAverageLength);
  const stat = computeStatSignal(slide, textLength, titleLength);
  const comparison = computeComparisonSignal(slide);
  const cta = computeCtaSignal(slide, slideIndex, totalSlides);
  const intro = computeIntroSignal(slide, slideIndex);
  const single_point = computeSinglePointSignal(slide, quote, textLength, titleLength);

  const signals: HeuristicSlideSignalMap = {
    intro,
    single_point,
    list,
    stat,
    comparison,
    cta,
    quote,
  };

  return signals;
};

const pickPrimaryType = (signals: HeuristicSlideSignalMap, slideIndex: number): HeuristicSlideAnalysis['type'] => {
  const candidates: Array<[HeuristicSlideAnalysis['type'], number]> = [
    ['intro', signals.intro],
    ['single_point', signals.single_point],
    ['list', signals.list],
    ['stat', signals.stat],
    ['comparison', signals.comparison],
    ['cta', signals.cta],
  ];

  if (slideIndex === 0 && signals.intro >= 0.45) {
    return 'intro';
  }

  if (slideIndex > 0 && signals.cta >= 0.75) {
    return 'cta';
  }

  return candidates.sort((left, right) => right[1] - left[1])[0]?.[0] ?? 'single_point';
};

export const classifyParsedRawSlide = (
  slide: ParsedRawSlide,
  slideIndex: number,
  totalSlides: number,
): HeuristicSlideAnalysis => {
  const textPieces = [
    slide.title,
    slide.subtitle,
    slide.text,
    ...slide.bodyLines,
    ...slide.listItems,
    slide.cta,
  ].filter(Boolean) as string[];

  const textLength = textPieces.join(' ').length;
  const titleLength = slide.title?.length || slide.titleCandidate?.length || 0;
  const bodyLength = [slide.subtitle, slide.text, ...slide.bodyLines].filter(Boolean).join(' ').length;
  const itemCount = slide.listItems.length;
  const itemAverageLength = itemCount > 0
    ? Math.round(slide.listItems.reduce((sum, item) => sum + countWords(item), 0) / itemCount)
    : 0;
  const hasImagePrompt = Boolean(slide.imagePrompt);
  const hasEditorialStructure = Boolean(
    slide.editorial?.intro
    || slide.editorial?.headline
    || slide.editorial?.support
    || slide.editorial?.body
    || slide.editorial?.highlight,
  );
  const signals = buildSignals(
    slide,
    slideIndex,
    totalSlides,
    textLength,
    titleLength,
    itemCount,
    itemAverageLength,
  );
  const primaryType = pickPrimaryType(signals, slideIndex);
  const visualWeightHint = primaryType === 'intro' || primaryType === 'cta'
    ? 'heavy'
    : primaryType === 'comparison' || primaryType === 'stat'
      ? 'medium'
      : 'light';

  const imagePriority = (() => {
    let priority = 0;

    if (slideIndex === 0) priority = 100;
    else if (slideIndex === totalSlides - 1) priority = 84;
    else if (primaryType === 'intro' || primaryType === 'cta') priority = 80;
    else if (primaryType === 'single_point' || primaryType === 'stat') priority = 66;
    else if (primaryType === 'comparison') priority = 58;
    else if (primaryType === 'list') {
      priority = itemCount <= 4 ? 44 : 20;

      if (itemCount >= 2 && itemCount <= 4 && itemAverageLength <= 6 && textLength <= 160) {
        priority += 10;
      }

      if (itemCount >= 5 || textLength > 220) {
        priority -= 10;
      }
    } else {
      priority = 34;
    }

    if (bodyLength > 220) priority -= 12;
    if (hasImagePrompt) priority += 20;

    return Math.min(100, Math.max(0, priority));
  })();

  return {
    primaryType,
    type: primaryType,
    signals,
    textLength,
    titleLength,
    bodyLength,
    itemCount,
    itemAverageLength,
    visualWeightHint,
    hasImagePrompt,
    hasEditorialStructure,
    shouldUseImage: imagePriority > 0,
    imagePriority,
    prefersBigNumber: primaryType === 'stat' || signals.stat >= 0.6,
  };
};
