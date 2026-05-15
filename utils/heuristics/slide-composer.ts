import type {
  Block,
  HeuristicSlideAnalysis,
  ParsedSemanticField,
  ParsedRawSlide,
  SlideDefinition,
} from '../../types';
import { resolveIconsWithContext } from '../../utils/icon-resolver.ts';
import { getAllLucideIcons } from '../../utils/lucide-library.ts';

const toSentence = (lines: string[]) => lines.join(' ').replace(/\s+/g, ' ').trim();
const structuralSlideLabelPattern = /^slide\s+\d+\s*$/i;
const STANDARD_TITLE_FONT_SIZE = 84;
const STANDARD_TEXT_FONT_SIZE = 36;
const STAT_VALUE_FONT_SIZE = 132;
const LUCIDE_ICON_IDS = new Set(getAllLucideIcons().map((icon) => icon.id));

const EXPLICIT_ICON_HINT_ALIASES: Record<string, string> = {
  'alert': 'AlertTriangle',
  'battery': 'Battery',
  'analytics': 'BarChart3',
  'bar-chart': 'BarChart3',
  'bar-chart-3': 'BarChart3',
  'bolt': 'Zap',
  'circuit': 'Repeat',
  'continuity': 'Repeat',
  'brain': 'Brain',
  'calendar': 'Calendar',
  'current': 'Plug',
  'check': 'Check',
  'check-circle': 'CheckCircle2',
  'clock': 'Clock',
  'distance': 'Ruler',
  'dollar-sign': 'DollarSign',
  'droplet': 'Droplet',
  'document': 'FileText',
  'energy': 'Zap',
  'error': 'AlertTriangle',
  'file-text': 'FileText',
  'frequency': 'Signal',
  'growth': 'TrendingUp',
  'handshake': 'Handshake',
  'heat': 'Thermometer',
  'humidity': 'Droplet',
  'hormones': 'Scale',
  'inventory': 'Package',
  'length': 'Ruler',
  'measure': 'Ruler',
  'maternity': 'Baby',
  'money': 'DollarSign',
  'performance': 'TrendingUp',
  'plug': 'Plug',
  'planning': 'Calendar',
  'power': 'Plug',
  'pregnancy': 'Baby',
  'repeat': 'Repeat',
  'resistance': 'Ruler',
  'rocket': 'Rocket',
  'ruler': 'Ruler',
  'schedule': 'Calendar',
  'search': 'Search',
  'sensor': 'ScanSearch',
  'signal': 'Signal',
  'stand': 'PersonStanding',
  'stock': 'Package',
  'strategy': 'Brain',
  'temperature': 'Thermometer',
  'thermometer': 'Thermometer',
  'voltage': 'Zap',
  'waves': 'Signal',
  'warning': 'AlertTriangle',
  'balance': 'Scale',
  'health': 'Activity',
  'aging': 'Hourglass',
  'zap': 'Zap',
};

const toLucideComponentName = (value: string) => {
  const normalized = value.trim().toLowerCase();
  if (!normalized) return undefined;
  if (EXPLICIT_ICON_HINT_ALIASES[normalized]) return EXPLICIT_ICON_HINT_ALIASES[normalized];
  const pascal = normalized
    .split(/[^a-z0-9]+/i)
    .filter(Boolean)
    .map((part) => part.charAt(0).toUpperCase() + part.slice(1))
    .join('');
  if (!pascal || !LUCIDE_ICON_IDS.has(pascal)) return undefined;
  return pascal;
};

const resolveExplicitLucideIcon = (meta?: ParsedSemanticField) =>
  meta?.iconHints?.map(toLucideComponentName).find(Boolean);

const enrichItemForFallback = (item: string, meta?: ParsedSemanticField) => ({
  title: [meta?.text || item, ...(meta?.iconHints || [])].filter(Boolean).join(' '),
});

const getTitleAndBody = (slide: ParsedRawSlide) => {
  const bodyLines = [...slide.bodyLines];
  const explicitTitle = slide.title?.trim();
  const candidateTitle = slide.titleCandidate?.trim();
  let title = explicitTitle && !structuralSlideLabelPattern.test(explicitTitle)
    ? explicitTitle
    : candidateTitle && !structuralSlideLabelPattern.test(candidateTitle)
      ? candidateTitle
      : undefined;
  let subtitle = slide.subtitle?.trim();
  let body = slide.text?.trim();

  if (!title && bodyLines.length > 0) {
    title = bodyLines.shift();
  }

  if (!subtitle && bodyLines.length > 0) {
    subtitle = bodyLines.shift();
  }

  if (!body) {
    body = toSentence(bodyLines);
  }

  if (!title && body) {
    title = body;
    body = '';
  }

  if (!title && slide.listItems.length > 0) {
    title = `Slide ${slide.index}`;
  }

  return {
    title: title || `Slide ${slide.index}`,
    subtitle: subtitle || '',
    body: body || '',
  };
};

const detectComparisonParts = (slide: ParsedRawSlide) => {
  const normalizedLines = [...slide.bodyLines, ...slide.listItems].filter(Boolean);
  if (normalizedLines.length >= 2) {
    return normalizedLines.slice(0, 2);
  }

  const raw = slide.raw.replace(/^slide\s+\d+\s*(?:[-:–—]\s*)?/i, '').trim();
  const split = raw.split(/\b(?:vs\.?|x|mito\s*[:\-]|verdade\s*[:\-]|antes\s*[:\-]|depois\s*[:\-])\b/i).map((part) => part.trim()).filter(Boolean);
  if (split.length >= 2) {
    return split.slice(0, 2);
  }

  return ['Ponto 1', 'Ponto 2'];
};

const extractDominantStat = (slide: ParsedRawSlide) => {
  const semanticText = [slide.title, slide.subtitle, slide.text, ...slide.bodyLines, ...slide.listItems]
    .filter(Boolean)
    .join(' ');
  const match = semanticText.match(/\d+(?:[.,]\d+)?%?/);
  return match?.[0] || slide.title || slide.titleCandidate || '100%';
};

const createBaseOptions = (contentTemplateId: string, analysis: HeuristicSlideAnalysis): SlideDefinition['options'] => {
  const centeredTemplates = new Set(['HERO', 'STAT', 'CHECKLIST']);
  const primaryType = analysis.primaryType ?? analysis.type;

  return {
    theme: 'dark',
    contentHorizontalAlign: centeredTemplates.has(contentTemplateId) ? 'center' : 'left',
    contentVerticalAlign: 'center',
    contentWidthPercent: primaryType === 'list' ? 96 : analysis.textLength > 180 ? 92 : 100,
  };
};

const hasEditorialContent = (slide: ParsedRawSlide) =>
  Boolean(
    slide.editorial?.intro
    || slide.editorial?.headline
    || slide.editorial?.support
    || slide.editorial?.body
    || slide.editorial?.highlight,
  );

const isSideImageLayout = (imageLayoutId: string) =>
  imageLayoutId !== 'IMAGE_NONE'
  && !imageLayoutId.startsWith('IMAGE_BACKGROUND')
  && !imageLayoutId.startsWith('IMAGE_FADE');

const getEditorialContentAlign = (imageLayoutId: string): 'left' | 'center' | 'right' => {
  if (imageLayoutId === 'IMAGE_FADE_LEFT') return 'left';
  if (imageLayoutId === 'IMAGE_FADE_RIGHT') return 'right';
  if (imageLayoutId.endsWith('_LEFT')) return 'right';
  if (imageLayoutId.endsWith('_RIGHT')) return 'left';
  return 'center';
};

const splitEditorialHighlightLines = (highlight: string) =>
  highlight
    .split(/\n+/)
    .map((line) => line.trim())
    .filter(Boolean);

const editorialChecklistItemPattern = /^\s*\*\*[^*]+?\*\*\s*[:\-–—]?\s+[\s\S]{6,}$/;

const shouldUseEditorialChecklistList = (items: string[]) => (
  items.length >= 2
  && items.every((item) => editorialChecklistItemPattern.test(item))
);

const formatEditorialHighlightLine = (line: string) => {
  const cleanLine = line.replace(/\[\[([\s\S]*?)\]\]/g, '$1').trim();
  return cleanLine ? `[[${cleanLine}]]` : '';
};

const getPlainTextLength = (value: string) =>
  value
    .replace(/\[\[([\s\S]*?)\]\]/g, '$1')
    .replace(/\*\*([\s\S]*?)\*\*/g, '$1')
    .replace(/\s+/g, ' ')
    .trim()
    .length;

const getEditorialHeadlineFontSize = (headline: string, hasImage: boolean) => {
  const textLength = getPlainTextLength(headline);

  if (hasImage) {
    if (textLength <= 16) return 132;
    if (textLength <= 30) return 124;
    if (textLength <= 46) return 114;
    if (textLength <= 66) return 104;
    return 96;
  }

  if (textLength <= 16) return 156;
  if (textLength <= 30) return 146;
  if (textLength <= 46) return 134;
  if (textLength <= 66) return 122;
  return 110;
};

const composeEditorialHighlightBlocks = (
  highlightLines: string[],
  align: 'left' | 'center' | 'right',
  hasImage: boolean,
): Block[] => {
  const highlightedText = highlightLines
    .map(formatEditorialHighlightLine)
    .filter(Boolean)
    .join('\n');

  if (!highlightedText) return [];

  return [{
    type: 'PARAGRAPH',
    content: highlightedText,
    options: {
      align,
      fontSize: hasImage ? 31 : 34,
      fontWeight: 900,
      lineHeight: 1.18,
      lineBreakMode: 'manual',
      manualBreaks: highlightedText,
      semanticRole: 'highlight',
    } as Block['options'],
  }];
};

const composeEditorial = (
  slide: ParsedRawSlide,
  imageLayoutId: string,
): Block[] => {
  const editorial = slide.editorial || {};
  const hasImage = isSideImageLayout(imageLayoutId);
  const align = getEditorialContentAlign(imageLayoutId);
  const headline = editorial.headline || slide.title || slide.titleCandidate || `Slide ${slide.index}`;
  const support = editorial.support || '';
  const body = editorial.body || '';
  const highlight = editorial.highlight || '';
  const highlightLines = splitEditorialHighlightLines(highlight);
  const iconItems = slide.listItems.map((item, index) => enrichItemForFallback(item, slide.listItemMeta?.[index]));
  const fallbackLucideIcons = resolveIconsWithContext(iconItems, headline, 'lucide');
  const lucideIcons = slide.listItems.map((_, index) => resolveExplicitLucideIcon(slide.listItemMeta?.[index]) || fallbackLucideIcons[index]);
  const useEditorialChecklist = shouldUseEditorialChecklistList(slide.listItems);

  return [
    ...(editorial.intro
      ? [{
          type: 'PARAGRAPH' as const,
          content: editorial.intro,
          options: {
            align,
            fontSize: 34,
            fontWeight: 900,
            lineHeight: 1.05,
            color: 'text',
            semanticRole: 'intro',
          } as Block['options'],
        }]
      : []),
    {
      type: 'TITLE' as const,
      content: headline,
      options: {
        align,
        fontSize: getEditorialHeadlineFontSize(headline, hasImage),
        fontWeight: 900,
        lineHeight: 0.92,
        letterSpacing: 0,
        fontVariant: 'padrão',
        color: 'accent',
        semanticRole: 'headline',
      } as Block['options'],
    },
    ...(support
      ? [{
          type: 'PARAGRAPH' as const,
          content: support,
          options: {
            align,
            fontSize: hasImage ? 31 : 34,
            fontWeight: 500,
            lineHeight: 1.28,
            semanticRole: 'support',
          } as Block['options'],
        }]
      : []),
    ...(body
      ? [{
          type: 'PARAGRAPH' as const,
          content: body,
          options: {
            align,
            fontSize: hasImage ? 31 : 34,
            fontWeight: 500,
            lineHeight: 1.32,
            semanticRole: 'body',
          } as Block['options'],
        }]
      : []),
    ...(slide.listItems.length > 0
      ? [{
          type: 'LIST' as const,
          content: slide.listItems,
          options: {
            variant: useEditorialChecklist ? 'check-list' as const : 'box' as const,
            align,
            fontSize: useEditorialChecklist ? 28 : 32,
            fontWeight: 800,
            itemIcons: lucideIcons,
          } as Block['options'],
        }]
      : []),
    ...composeEditorialHighlightBlocks(highlightLines, align, hasImage),
    ...(slide.cta
      ? [{
          type: 'BADGE' as const,
          content: slide.cta,
          options: {
            variant: 'pill' as const,
            align,
            icon: resolveExplicitLucideIcon(slide.ctaMeta),
            fontSize: hasImage ? 29 : 32,
            fontWeight: 800,
            semanticRole: 'cta',
          } as Block['options'],
        }]
      : []),
  ];
};

const composeIntro = (title: string, subtitle: string, body: string): Block[] => ([
  { type: 'TITLE', content: title, options: { fontSize: STANDARD_TITLE_FONT_SIZE, fontVariant: 'destaque' } },
  ...(subtitle ? [{ type: 'PARAGRAPH', content: subtitle, options: { fontSize: STANDARD_TEXT_FONT_SIZE, fontWeight: 700 } as Block['options'] }] : []),
  ...(body ? [{ type: 'PARAGRAPH', content: body, options: { fontSize: STANDARD_TEXT_FONT_SIZE } as Block['options'] }] : []),
]);

const composeSinglePoint = (title: string, subtitle: string, body: string): Block[] => ([
  { type: 'TITLE', content: title, options: { fontSize: STANDARD_TITLE_FONT_SIZE, fontVariant: 'destaque' } },
  ...(subtitle ? [{ type: 'PARAGRAPH', content: subtitle, options: { fontSize: STANDARD_TEXT_FONT_SIZE, fontWeight: 700 } as Block['options'] }] : []),
  ...(body ? [{ type: 'PARAGRAPH', content: body, options: { fontSize: STANDARD_TEXT_FONT_SIZE } as Block['options'] }] : []),
]);

const composeQuote = (title: string, subtitle: string, body: string): Block[] => ([
  { type: 'TITLE', content: title, options: { fontSize: STANDARD_TITLE_FONT_SIZE } },
  ...(subtitle ? [{ type: 'PARAGRAPH', content: subtitle, options: { fontSize: STANDARD_TEXT_FONT_SIZE, fontWeight: 700 } as Block['options'] }] : []),
  ...(body ? [{ type: 'CARD', content: `"${body}"`, options: { fontSize: STANDARD_TEXT_FONT_SIZE, variant: 'box', fontVariant: 'destaque' } as Block['options'] }] : []),
]);

const composeChecklist = (
  title: string,
  subtitle: string,
  items: string[],
  body: string,
  itemMeta: ParsedSemanticField[] = [],
): Block[] => {
  const iconItems = items.map((item, index) => enrichItemForFallback(item, itemMeta[index]));
  const fallbackLucideIcons = resolveIconsWithContext(iconItems, title, 'lucide');
  const lucideIcons = items.map((_, index) => resolveExplicitLucideIcon(itemMeta[index]) || fallbackLucideIcons[index]);

  const isPillLike = !body && !subtitle && items.length <= 3 && items.every((item) => item.split(/\s+/).length <= 2);
  const isBoxLike = items.length <= 4 && items.every((item) => item.split(/\s+/).length <= 4);

  if (isPillLike) {
    return [
      { type: 'TITLE', content: title, options: { fontSize: STANDARD_TITLE_FONT_SIZE, align: 'center' } },
      ...(subtitle ? [{ type: 'PARAGRAPH', content: subtitle, options: { fontSize: STANDARD_TEXT_FONT_SIZE, fontWeight: 700, align: 'center' } as Block['options'] }] : []),
      ...items.slice(0, 6).map((item, index) => ({
        type: 'BADGE' as const,
        content: item,
        options: { variant: 'pill' as const, fontSize: STANDARD_TEXT_FONT_SIZE, align: 'center' as const, fontWeight: 700, icon: lucideIcons[index] },
      })),
    ];
  }

  if (isBoxLike) {
    return [
      { type: 'TITLE', content: title, options: { fontSize: STANDARD_TITLE_FONT_SIZE, align: 'center' } },
      ...(subtitle ? [{ type: 'PARAGRAPH', content: subtitle, options: { fontSize: STANDARD_TEXT_FONT_SIZE, fontWeight: 700, align: 'center' } as Block['options'] }] : []),
      ...(body ? [{ type: 'PARAGRAPH', content: body, options: { fontSize: STANDARD_TEXT_FONT_SIZE, align: 'center' } as Block['options'] }] : []),
      {
        type: 'LIST',
        content: items,
        options: {
          variant: 'box',
          fontSize: STANDARD_TEXT_FONT_SIZE,
          fontWeight: 800,
          align: 'center',
          itemIcons: lucideIcons,
        },
      },
    ];
  }

  return [
    { type: 'TITLE', content: title, options: { fontSize: STANDARD_TITLE_FONT_SIZE, align: 'center' } },
    ...(subtitle ? [{ type: 'PARAGRAPH', content: subtitle, options: { fontSize: STANDARD_TEXT_FONT_SIZE, fontWeight: 700, align: 'center' } as Block['options'] }] : []),
    ...(body ? [{ type: 'PARAGRAPH', content: body, options: { fontSize: STANDARD_TEXT_FONT_SIZE, align: 'center' } as Block['options'] }] : []),
    {
      type: 'LIST',
      content: items,
      options: {
        variant: 'check-list',
        fontSize: STANDARD_TEXT_FONT_SIZE,
        fontWeight: 800,
        align: 'center',
        itemIcons: lucideIcons,
      },
    },
  ];
};

const composeBoxGrid = (
  title: string,
  subtitle: string,
  body: string,
  items: string[],
  itemMeta: ParsedSemanticField[] = [],
): Block[] => {
  const iconItems = items.map((item, index) => enrichItemForFallback(item, itemMeta[index]));
  const fallbackLucideIcons = resolveIconsWithContext(iconItems, title, 'lucide');
  const lucideIcons = items.map((_, index) => resolveExplicitLucideIcon(itemMeta[index]) || fallbackLucideIcons[index]);
  const useCards = items.length <= 3;

  return [
    { type: 'TITLE', content: title, options: { fontSize: STANDARD_TITLE_FONT_SIZE } },
    ...(subtitle ? [{ type: 'PARAGRAPH', content: subtitle, options: { fontSize: STANDARD_TEXT_FONT_SIZE, fontWeight: 700 } as Block['options'] }] : []),
    ...(body ? [{ type: 'PARAGRAPH', content: body, options: { fontSize: STANDARD_TEXT_FONT_SIZE } as Block['options'] }] : []),
    ...items.slice(0, 4).map((item, index) => (
      useCards
        ? {
            type: 'CARD' as const,
            content: item,
            options: {
              fontSize: STANDARD_TEXT_FONT_SIZE,
              fontWeight: 600,
              variant: index === 0 ? 'accent' : 'box',
              icon: lucideIcons[index],
            },
          }
        : {
            type: 'BOX' as const,
            content: item,
            options: {
              align: 'center',
              fontSize: STANDARD_TEXT_FONT_SIZE,
              fontWeight: 800,
              variant: 'box' as const,
              icon: lucideIcons[index],
            },
          }
    )),
  ];
};

const composeStat = (title: string, subtitle: string, body: string, statValue: string): Block[] => ([
  { type: 'TITLE', content: statValue, options: { fontSize: STAT_VALUE_FONT_SIZE, align: 'center', fontVariant: 'destaque' } },
  { type: 'PARAGRAPH', content: title, options: { fontSize: STANDARD_TEXT_FONT_SIZE, align: 'center', fontWeight: 800 } },
  ...(subtitle ? [{ type: 'PARAGRAPH', content: subtitle, options: { fontSize: STANDARD_TEXT_FONT_SIZE, align: 'center', fontWeight: 700 } as Block['options'] }] : []),
  ...(body ? [{ type: 'PARAGRAPH', content: body, options: { fontSize: STANDARD_TEXT_FONT_SIZE, align: 'center' } as Block['options'] }] : []),
]);

const composeComparison = (title: string, subtitle: string, left: string, right: string): Block[] => ([
  { type: 'TITLE', content: title, options: { fontSize: STANDARD_TITLE_FONT_SIZE } },
  ...(subtitle ? [{ type: 'PARAGRAPH', content: subtitle, options: { fontSize: STANDARD_TEXT_FONT_SIZE, fontWeight: 700 } as Block['options'] }] : []),
  { type: 'CARD', content: left, options: { fontSize: STANDARD_TEXT_FONT_SIZE, variant: 'box' } },
  { type: 'CARD', content: right, options: { fontSize: STANDARD_TEXT_FONT_SIZE, variant: 'accent' } },
]);

const composeCta = (
  title: string,
  subtitle: string,
  body: string,
  cta?: string,
  ctaMeta?: ParsedRawSlide['ctaMeta'],
): Block[] => {
  const ctaLabel = cta || 'Fale com nossa equipe';
  const semanticContext = [title, subtitle, body, ctaLabel, ...(ctaMeta?.iconHints || [])]
    .filter(Boolean)
    .join(' ');
  const [resolvedLucide] = resolveIconsWithContext([{ title: semanticContext || ctaLabel }], title || ctaLabel, 'lucide');
  const explicitIcon = ctaMeta?.iconHints?.map(toLucideComponentName).find(Boolean);

  return [
    { type: 'TITLE', content: title, options: { fontSize: STANDARD_TITLE_FONT_SIZE, align: 'center', fontVariant: 'destaque' } },
    ...(subtitle ? [{ type: 'PARAGRAPH', content: subtitle, options: { fontSize: STANDARD_TEXT_FONT_SIZE, align: 'center', fontWeight: 700 } as Block['options'] }] : []),
    ...(body ? [{ type: 'PARAGRAPH', content: body, options: { fontSize: STANDARD_TEXT_FONT_SIZE, align: 'center' } as Block['options'] }] : []),
    {
      type: 'BADGE',
      content: ctaLabel,
      options: {
        align: 'center',
        variant: 'pill',
        icon: explicitIcon || resolvedLucide,
        fontSize: STANDARD_TEXT_FONT_SIZE,
        fontWeight: 700,
      },
    },
  ];
};

export const composeHeuristicSlide = (
  slide: ParsedRawSlide,
  analysis: HeuristicSlideAnalysis,
  contentTemplateId: string,
  imageLayoutId = 'IMAGE_NONE',
): SlideDefinition => {
  const { title, subtitle, body } = getTitleAndBody(slide);
  const comparisonParts = detectComparisonParts(slide);
  const dominantStat = extractDominantStat(slide);
  const primaryType = analysis.primaryType ?? analysis.type;
  let canonicalContentTemplateId = contentTemplateId;

  if (hasEditorialContent(slide)) {
    canonicalContentTemplateId = slide.listItems.length > 0
      ? (contentTemplateId === 'BOX_GRID' ? 'BOX_GRID' : 'CHECKLIST')
      : 'HERO';
  } else if (primaryType === 'stat') {
    canonicalContentTemplateId = 'STAT';
  } else if (primaryType === 'cta') {
    canonicalContentTemplateId = 'HERO';
  }

  let blocks: Block[];
  if (hasEditorialContent(slide)) {
    blocks = composeEditorial(slide, imageLayoutId);
  } else switch (primaryType) {
    case 'intro':
      blocks = composeIntro(title, subtitle, body);
      break;
    case 'list':
      blocks = canonicalContentTemplateId === 'BOX_GRID'
        ? composeBoxGrid(
            title,
            subtitle,
            body,
            slide.listItems.length > 0 ? slide.listItems : slide.bodyLines,
            slide.listItems.length > 0 ? (slide.listItemMeta || []) : (slide.bodyLineMeta || []),
          )
        : composeChecklist(
        title,
        subtitle,
        slide.listItems.length > 0 ? slide.listItems : slide.bodyLines,
        body,
        slide.listItems.length > 0 ? (slide.listItemMeta || []) : (slide.bodyLineMeta || []),
          );
      break;
    case 'stat':
      blocks = composeStat(title, subtitle, body, dominantStat);
      break;
    case 'comparison':
      blocks = composeComparison(title, subtitle, comparisonParts[0], comparisonParts[1]);
      break;
    case 'cta':
      blocks = composeCta(title, subtitle, body, slide.cta, slide.ctaMeta);
      break;
    case 'single_point':
    default:
      blocks = composeSinglePoint(title, subtitle, body);
      break;
  }

  const baseSlide: SlideDefinition = {
    template: canonicalContentTemplateId,
    imagePrompt: slide.imagePrompt,
    options: hasEditorialContent(slide)
      ? {
          ...createBaseOptions(canonicalContentTemplateId, analysis),
          contentHorizontalAlign: getEditorialContentAlign(imageLayoutId),
          contentVerticalAlign: 'center',
          contentWidthPercent: isSideImageLayout(imageLayoutId) ? 86 : 92,
        }
      : createBaseOptions(canonicalContentTemplateId, analysis),
    blocks,
  };

  return {
    ...baseSlide,
    contentTemplate: canonicalContentTemplateId,
    imageLayout: imageLayoutId,
  };
};
