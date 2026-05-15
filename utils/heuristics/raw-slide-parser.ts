import emojiRegex from 'emoji-regex/RGI_Emoji';
import type { ParsedEditorialFields, ParsedRawCoverFields, ParsedRawSlide, ParsedRawSlideSignals, ParsedSemanticField } from '../../types';

const slideHeaderPattern = /^\s*slide\s+(\d+)\s*(?:[-:–—]\s*(.*))?$/i;
const coverHeaderPattern = /^\s*capa\s*(?:[:\-–—]\s*)?$/i;
const explicitListPattern = /^\s*(?:[-*•]|(?:\d+[\.)]))\s+(.*)$/;
const fieldPattern = /^(t[ií]tulo|subt[ií]tulo|texto|lista|cta|imagem|intro|headline|support|body|highlight|list|image)\s*:\s*(.*)$/i;
const coverFieldPattern = /^(apoio superior|destaque|apoio inferior|imagem fundo|imagem destaque)\s*:\s*(.*)$/i;
const leadingIconHintPattern = /^\{\s*([^}]+?)\s*\}\s*/;

const normalizeLine = (line: string) => line.replace(/\r/g, '').trim();
const leadingEmojiPattern = emojiRegex();

const isShortListCandidate = (line: string) => {
  const trimmed = normalizeLine(line);
  if (!trimmed) return false;
  if (/[.!?;:]$/.test(trimmed)) return false;
  return trimmed.split(/\s+/).length <= 5 && trimmed.length <= 42;
};

const normalizeComparisonCue = (value?: string | null) =>
  (value || '').trim().replace(/[.!?;]+$/g, '').trim();

const hasStandaloneComparisonCue = (value?: string | null) => {
  const cue = normalizeComparisonCue(value);
  return /^(?:mito\s*(?:x|vs\.?|\/)\s*verdade|verdade\s*(?:x|vs\.?|\/)\s*mito|antes\s*(?:x|vs\.?|\/)\s*depois|depois\s*(?:x|vs\.?|\/)\s*antes|[\wÀ-ÿ][\wÀ-ÿ\s]{0,44}\s+vs\.?\s+[\wÀ-ÿ][\wÀ-ÿ\s]{0,44})$/i.test(cue);
};

const hasLabeledComparisonPair = (text: string) => {
  const hasMito = /(?:^|\n)\s*mito\s*[:\-–—]/i.test(text);
  const hasVerdade = /(?:^|\n)\s*verdade\s*[:\-–—]/i.test(text);
  const hasAntes = /(?:^|\n)\s*antes\s*[:\-–—]/i.test(text);
  const hasDepois = /(?:^|\n)\s*depois\s*[:\-–—]/i.test(text);

  return (hasMito && hasVerdade) || (hasAntes && hasDepois);
};

const detectImplicitList = (lines: string[]) => {
  const normalized = lines.map(normalizeLine).filter(Boolean);
  if (normalized.length < 3) return false;
  return normalized.every(isShortListCandidate);
};

const parseSemanticField = (rawValue: string): ParsedSemanticField => {
  let working = rawValue.trim();
  let emojiHint: string | undefined;
  const iconHints: string[] = [];

  const consumeLeadingEmoji = () => {
    leadingEmojiPattern.lastIndex = 0;
    const match = leadingEmojiPattern.exec(working);
    if (match && match.index === 0) {
      emojiHint = emojiHint || match[0];
      working = working.slice(match[0].length).trimStart();
      return true;
    }
    return false;
  };

  const consumeLeadingIconHints = () => {
    const match = working.match(leadingIconHintPattern);
    if (!match) return false;
    const hints = match[1]
      .split(',')
      .map((hint) => hint.trim())
      .filter(Boolean);
    for (const hint of hints) {
      if (!iconHints.includes(hint)) {
        iconHints.push(hint);
      }
    }
    working = working.slice(match[0].length).trimStart();
    return true;
  };

  while (consumeLeadingEmoji() || consumeLeadingIconHints()) {
    // consume all leading semantic hints in order
  }

  return {
    raw: rawValue,
    text: working.trim(),
    emojiHint,
    iconHints,
  };
};

const buildSignals = (slide: {
  bodyLines: string[];
  listItems: string[];
  title?: string;
  subtitle?: string;
  text?: string;
  cta?: string;
}) => {
  const semanticText = [slide.title, slide.subtitle, slide.text, ...slide.bodyLines, ...slide.listItems, slide.cta]
    .filter(Boolean)
    .join('\n');
  const comparisonPieces = [slide.title, ...slide.bodyLines, ...slide.listItems].filter(Boolean) as string[];
  const hasComparison = comparisonPieces.some(hasStandaloneComparisonCue) || hasLabeledComparisonPair(semanticText);
  const hasNumberStat = /(^|[^\w])\d+([.,]\d+)?%?([^\w]|$)/.test(semanticText) || /\b\d{2,}\b/.test(semanticText);
  const hasQuestion = /\?$/.test(semanticText.trim()) || /\b(quer|precisa|como|por que|por quê)\b/i.test(semanticText);
  const hasCTA = Boolean(slide.cta) || /\b(chame|agende|comece|começar|faça|clique|acesse|baixe|solicite|fale|entre em contato)\b/i.test(semanticText);

  return {
    hasExplicitList: slide.listItems.length > 0,
    hasImplicitList: slide.listItems.length === 0 && detectImplicitList(slide.bodyLines),
    hasNumberStat,
    hasComparison,
    hasQuestion,
    hasCTA,
  };
};

const splitIntoSlides = (script: string) => {
  const normalized = script.replace(/\r\n/g, '\n').trim();
  if (!normalized) return [] as string[];

  const parts: string[] = [];
  const lines = normalized.split('\n');
  let current: string[] = [];

  const flush = () => {
    const chunk = current.join('\n').trim();
    if (chunk) parts.push(chunk);
    current = [];
  };

  for (const line of lines) {
    if ((slideHeaderPattern.test(line) || coverHeaderPattern.test(line)) && current.length > 0) {
      flush();
    }
    current.push(line);
  }

  flush();
  return parts;
};

const parseCoverSection = (section: string): ParsedRawSlide => {
  const lines = section.split('\n').map(normalizeLine).filter(Boolean);
  const contentLines = coverHeaderPattern.test(lines[0] || '') ? lines.slice(1) : lines.slice();
  const cover: ParsedRawCoverFields = {};
  let currentField: 'apoio superior' | 'destaque' | 'apoio inferior' | 'imagem fundo' | 'imagem destaque' | null = null;

  const assignCoverField = (
    field: 'apoio superior' | 'destaque' | 'apoio inferior' | 'imagem fundo' | 'imagem destaque',
    rawValue: string,
  ) => {
    const meta = rawValue ? parseSemanticField(rawValue) : undefined;

    switch (field) {
      case 'apoio superior':
        cover.supportTop = meta?.text || undefined;
        cover.supportTopMeta = meta;
        break;
      case 'destaque':
        cover.highlight = meta?.text || undefined;
        cover.highlightMeta = meta;
        break;
      case 'apoio inferior':
        cover.supportBottom = meta?.text || undefined;
        cover.supportBottomMeta = meta;
        break;
      case 'imagem fundo':
        cover.backgroundImage = meta?.text || undefined;
        cover.backgroundImageMeta = meta;
        break;
      case 'imagem destaque':
        cover.foregroundImage = meta?.text || undefined;
        cover.foregroundImageMeta = meta;
        break;
      default:
        break;
    }
  };

  for (const line of contentLines) {
    const fieldMatch = line.match(coverFieldPattern);
    if (fieldMatch) {
      const field = normalizeLine(fieldMatch[1]).toLowerCase() as typeof currentField;
      const value = fieldMatch[2]?.trim() || '';
      currentField = field;

      if (value) {
        assignCoverField(field, value);
        currentField = null;
      }

      continue;
    }

    if (currentField) {
      const previousValue =
        currentField === 'apoio superior' ? cover.supportTop
        : currentField === 'destaque' ? cover.highlight
        : currentField === 'apoio inferior' ? cover.supportBottom
        : currentField === 'imagem fundo' ? cover.backgroundImage
        : cover.foregroundImage;

      assignCoverField(currentField, [previousValue, line].filter(Boolean).join(' ').trim());
    }
  }

  const titleMeta = cover.highlightMeta;
  const title = cover.highlight;
  const subtitleMeta = cover.supportTopMeta;
  const subtitle = cover.supportTop;
  const textMeta = cover.supportBottomMeta;
  const text = cover.supportBottom;
  const imagePromptMeta = cover.backgroundImageMeta;
  const imagePrompt = cover.backgroundImage;

  return {
    index: 1,
    kind: 'cover',
    raw: section,
    lines,
    cover,
    titleCandidate: title,
    titleCandidateMeta: titleMeta,
    title,
    titleMeta,
    subtitle,
    subtitleMeta,
    text,
    textMeta,
    cta: undefined,
    ctaMeta: undefined,
    imagePrompt,
    imagePromptMeta,
    bodyLines: [],
    bodyLineMeta: [],
    listItems: [],
    listItemMeta: [],
    signals: {
      hasExplicitList: false,
      hasImplicitList: false,
      hasNumberStat: false,
      hasComparison: false,
      hasQuestion: false,
      hasCTA: false,
    },
  };
};

const parseSlideSection = (section: string, fallbackIndex: number): ParsedRawSlide => {
  const lines = section.split('\n').map(normalizeLine).filter(Boolean);
  const firstLine = lines[0] || '';

  if (coverHeaderPattern.test(firstLine)) {
    return parseCoverSection(section);
  }

  const headerMatch = firstLine.match(slideHeaderPattern);

  const index = headerMatch ? Number(headerMatch[1]) : fallbackIndex + 1;
  const headerTitleMeta = headerMatch?.[2] ? parseSemanticField(headerMatch[2].trim()) : undefined;
  const headerTitle = headerTitleMeta?.text || undefined;
  const contentLines = headerMatch ? lines.slice(1) : lines.slice();

  const bodyLines: string[] = [];
  const bodyLineMeta: ParsedSemanticField[] = [];
  const listItems: string[] = [];
  const listItemMeta: ParsedSemanticField[] = [];
  const editorial: ParsedEditorialFields = {};

  let title = headerTitle;
  let titleMeta = headerTitleMeta;
  let subtitle: string | undefined;
  let subtitleMeta: ParsedSemanticField | undefined;
  let text: string | undefined;
  let textMeta: ParsedSemanticField | undefined;
  let cta: string | undefined;
  let ctaMeta: ParsedSemanticField | undefined;
  let imagePrompt: string | undefined;
  let imagePromptMeta: ParsedSemanticField | undefined;
  type StructuredField = 'lista' | 'título' | 'subtítulo' | 'texto' | 'cta' | 'imagem' | 'intro' | 'headline' | 'support' | 'body' | 'highlight';
  let currentField: StructuredField | null = null;

  const normalizeFieldName = (rawField: string): StructuredField | null => {
    const field = normalizeLine(rawField).toLowerCase();
    switch (field) {
      case 'título':
      case 'titulo':
        return 'título';
      case 'subtítulo':
      case 'subtitulo':
        return 'subtítulo';
      case 'texto':
        return 'texto';
      case 'lista':
      case 'list':
        return 'lista';
      case 'cta':
        return 'cta';
      case 'imagem':
      case 'image':
        return 'imagem';
      case 'intro':
      case 'headline':
      case 'support':
      case 'body':
      case 'highlight':
        return field as StructuredField;
      default:
        return null;
    }
  };

  const assignStructuredField = (
    field: Exclude<StructuredField, 'lista'>,
    rawValue: string,
  ) => {
    const mergeFieldValue = (previousValue?: string, nextValue?: string) =>
      [previousValue, nextValue].filter(Boolean).join(' ').replace(/\s+/g, ' ').trim();
    const mergeMultilineFieldValue = (previousValue?: string, nextValue?: string) =>
      [previousValue, nextValue]
        .filter(Boolean)
        .join('\n')
        .replace(/[ \t]*\n[ \t]*/g, '\n')
        .trim();

    switch (field) {
      case 'título': {
        const merged = mergeFieldValue(title, rawValue);
        const meta = merged ? parseSemanticField(merged) : undefined;
        titleMeta = meta ?? titleMeta;
        title = titleMeta?.text || title;
        break;
      }
      case 'subtítulo': {
        const merged = mergeFieldValue(subtitle, rawValue);
        const meta = merged ? parseSemanticField(merged) : undefined;
        subtitleMeta = meta;
        subtitle = subtitleMeta?.text || undefined;
        break;
      }
      case 'texto': {
        const merged = mergeFieldValue(text, rawValue);
        const meta = merged ? parseSemanticField(merged) : undefined;
        textMeta = meta;
        text = textMeta?.text || undefined;
        break;
      }
      case 'cta': {
        const merged = mergeFieldValue(cta, rawValue);
        const meta = merged ? parseSemanticField(merged) : undefined;
        ctaMeta = meta;
        cta = ctaMeta?.text || undefined;
        break;
      }
      case 'imagem': {
        const merged = mergeFieldValue(imagePrompt, rawValue);
        const meta = merged ? parseSemanticField(merged) : undefined;
        imagePromptMeta = meta;
        imagePrompt = imagePromptMeta?.text || undefined;
        break;
      }
      case 'intro': {
        const merged = mergeFieldValue(editorial.intro, rawValue);
        const meta = merged ? parseSemanticField(merged) : undefined;
        editorial.introMeta = meta;
        editorial.intro = editorial.introMeta?.text || undefined;
        if (!subtitle) {
          subtitleMeta = meta;
          subtitle = meta?.text || undefined;
        }
        break;
      }
      case 'headline': {
        const merged = mergeFieldValue(editorial.headline, rawValue);
        const meta = merged ? parseSemanticField(merged) : undefined;
        editorial.headlineMeta = meta;
        editorial.headline = editorial.headlineMeta?.text || undefined;
        titleMeta = meta ?? titleMeta;
        title = titleMeta?.text || title;
        break;
      }
      case 'support': {
        const merged = mergeFieldValue(editorial.support, rawValue);
        const meta = merged ? parseSemanticField(merged) : undefined;
        editorial.supportMeta = meta;
        editorial.support = editorial.supportMeta?.text || undefined;
        if (!text) {
          textMeta = meta;
          text = meta?.text || undefined;
        }
        break;
      }
      case 'body': {
        const merged = mergeFieldValue(editorial.body, rawValue);
        const meta = merged ? parseSemanticField(merged) : undefined;
        editorial.bodyMeta = meta;
        editorial.body = editorial.bodyMeta?.text || undefined;
        break;
      }
      case 'highlight': {
        const merged = mergeMultilineFieldValue(editorial.highlight, rawValue);
        const meta = merged ? parseSemanticField(merged) : undefined;
        editorial.highlightMeta = meta;
        editorial.highlight = editorial.highlightMeta?.text || undefined;
        break;
      }
    }
  };

  for (const line of contentLines) {
    const fieldMatch = line.match(fieldPattern);
    if (fieldMatch) {
      const field = normalizeFieldName(fieldMatch[1]);
      if (!field) continue;
      const value = fieldMatch[2]?.trim() || '';

      currentField = field === 'lista'
        ? 'lista'
        : value
          ? null
          : field;

      switch (field) {
        case 'título':
          if (value) assignStructuredField('título', value);
          break;
        case 'subtítulo':
          if (value) assignStructuredField('subtítulo', value);
          break;
        case 'texto':
          if (value) assignStructuredField('texto', value);
          break;
        case 'lista':
          if (value) {
            const inlineListMatch = value.match(explicitListPattern);
            if (inlineListMatch) {
              const meta = parseSemanticField(inlineListMatch[1].trim());
              listItems.push(meta.text);
              listItemMeta.push(meta);
            } else {
              const meta = parseSemanticField(value);
              listItems.push(meta.text);
              listItemMeta.push(meta);
            }
          }
          break;
        case 'cta':
          if (value) assignStructuredField('cta', value);
          break;
        case 'imagem':
          if (value) assignStructuredField('imagem', value);
          break;
        case 'intro':
        case 'headline':
        case 'support':
        case 'body':
        case 'highlight':
          if (value) assignStructuredField(field, value);
          break;
        default:
          {
            const meta = parseSemanticField(line);
            bodyLines.push(meta.text);
            bodyLineMeta.push(meta);
          }
          break;
      }
      continue;
    }

    const listMatch = line.match(explicitListPattern);
    if (listMatch) {
      const meta = parseSemanticField(listMatch[1].trim());
      listItems.push(meta.text);
      listItemMeta.push(meta);
      currentField = 'lista';
      continue;
    }

    if (currentField === 'lista') {
      const meta = parseSemanticField(line);
      listItems.push(meta.text);
      listItemMeta.push(meta);
      continue;
    }

    if (currentField) {
      if (currentField === 'lista') {
        const meta = parseSemanticField(line);
        listItems.push(meta.text);
        listItemMeta.push(meta);
      } else {
        assignStructuredField(currentField, line);
      }
      continue;
    }

    const meta = parseSemanticField(line);
    bodyLines.push(meta.text);
    bodyLineMeta.push(meta);
  }

  const canPromoteImplicitList = !title && !subtitle && !text && !cta && !imagePrompt && listItems.length === 0;
  if (canPromoteImplicitList && detectImplicitList(bodyLines)) {
    for (const meta of bodyLineMeta) {
      listItems.push(meta.text);
      listItemMeta.push(meta);
    }
    bodyLines.length = 0;
    bodyLineMeta.length = 0;
  }

  if (!title && bodyLines.length > 0) {
    const promotedMeta = bodyLineMeta.shift()!;
    bodyLines.shift();
    titleMeta = promotedMeta;
    title = titleMeta.text;
  }

  const signalSeed = buildSignals({
    bodyLines,
    listItems,
    title,
    subtitle,
    text: [text, editorial.support, editorial.body, editorial.highlight].filter(Boolean).join(' '),
    cta,
  });

  const normalizedBodyLines = text
    ? [...bodyLines]
    : bodyLines;

  const signals: ParsedRawSlideSignals = {
    hasExplicitList: signalSeed.hasExplicitList,
    hasImplicitList: signalSeed.hasImplicitList,
    hasNumberStat: signalSeed.hasNumberStat,
    hasComparison: signalSeed.hasComparison,
    hasQuestion: signalSeed.hasQuestion,
    hasCTA: signalSeed.hasCTA,
  };

  return {
    index,
    kind: 'slide',
    raw: section,
    lines,
    editorial: Object.keys(editorial).length > 0 ? editorial : undefined,
    titleCandidate: title,
    titleCandidateMeta: titleMeta,
    title,
    titleMeta,
    subtitle,
    subtitleMeta,
    text,
    textMeta,
    cta,
    ctaMeta,
    imagePrompt,
    imagePromptMeta,
    bodyLines: normalizedBodyLines,
    bodyLineMeta,
    listItems,
    listItemMeta,
    signals,
  };
};

export const parseRawScript = (script: string): ParsedRawSlide[] =>
  splitIntoSlides(script).map((section, index) => parseSlideSection(section, index));
