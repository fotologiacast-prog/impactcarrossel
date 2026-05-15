import type {
  Block,
  CoverProfileBadge,
  ParsedRawSlide,
  SlideDefinition,
} from '../../types.ts';
import { parseRawScript } from './raw-slide-parser.ts';
import { classifyParsedRawSlide } from './slide-classifier.ts';
import { composeHeuristicSlide } from './slide-composer.ts';
import { composeCoverSlide } from '../covers/cover-composer.ts';
import { selectContentTemplate, type SlideAnalysis, type TemplateSelectionContext } from './template-selector.ts';
import { getTemplateProfile } from './template-profiles.ts';
import { createImageConfigFromLayout, createOptionOverridesFromImageLayout, resolveSlideComposition } from '../../domain/templates/templateComposition.ts';

export type SingleSlideScriptMode = 'patch' | 'replace';

export type SingleSlideGenerationResult = {
  slide: SlideDefinition;
  parsedSlide: ParsedRawSlide;
  analysis: SlideAnalysis | null;
  contentTemplateId: string;
  imageLayoutId: string;
  warnings: string[];
};

const seededNoise = (seed: number, ...keys: number[]): number => {
  let h = seed * 31337.31;
  for (const k of keys) {
    h = Math.abs(Math.sin(h * 9301.11 + k * 49297.71 + 233.31)) * 46341.0;
    h = h - Math.floor(h);
  }
  return h;
};

const canonicalizeTemplateIdForAnalysis = (analysis: SlideAnalysis, templateId: string) => {
  const primaryType = analysis.primaryType ?? analysis.type;
  if (primaryType === 'stat') return 'STAT';
  if (primaryType === 'cta') return 'HERO';
  return templateId;
};

const selectImageLayout = (
  analysis: SlideAnalysis,
  contentTemplateId: string,
  slideIndex: number,
  previousLayouts: string[] = [],
  entropy = 0.5,
): string => {
  if (!analysis.shouldUseImage) return 'IMAGE_NONE';

  const primaryType = analysis.primaryType ?? analysis.type;
  if (primaryType === 'cta' && !analysis.hasImagePrompt) {
    return 'IMAGE_NONE';
  }

  const variant = seededNoise(entropy, slideIndex, slideIndex + 500);
  const rotateCandidates = (pool: string[]): string[] => {
    if (pool.length <= 1) return pool;
    const offset = Math.floor(variant * pool.length);
    return [...pool.slice(offset), ...pool.slice(0, offset)];
  };

  let candidates: string[];

  switch (contentTemplateId) {
    case 'STAT':
      candidates = rotateCandidates(['IMAGE_GLASS_CARD', 'IMAGE_BACKGROUND', 'IMAGE_BOX_RIGHT']);
      break;
    case 'HERO':
      candidates = rotateCandidates(['IMAGE_FADE_LEFT', 'IMAGE_FADE_RIGHT', 'IMAGE_BACKGROUND']);
      break;
    case 'CHECKLIST':
      candidates = rotateCandidates(['IMAGE_SPLIT_RIGHT', 'IMAGE_SPLIT_LEFT', 'IMAGE_BOX_RIGHT', 'IMAGE_BACKGROUND']);
      break;
    case 'BOX_GRID':
      candidates = rotateCandidates(['IMAGE_BOX_RIGHT', 'IMAGE_STAGE_RIGHT', 'IMAGE_BACKGROUND']);
      break;
    default:
      if (primaryType === 'intro' || primaryType === 'cta') {
        candidates = rotateCandidates(['IMAGE_BACKGROUND', 'IMAGE_FADE_LEFT', 'IMAGE_FADE_RIGHT']);
      } else if (primaryType === 'list') {
        candidates = rotateCandidates(['IMAGE_SPLIT_RIGHT', 'IMAGE_BOX_RIGHT', 'IMAGE_SPLIT_LEFT', 'IMAGE_BACKGROUND']);
      } else if (primaryType === 'single_point' && analysis.textLength < 120) {
        candidates = rotateCandidates(['IMAGE_BOX_RIGHT', 'IMAGE_BACKGROUND', 'IMAGE_STAGE_RIGHT']);
      } else if (primaryType === 'stat') {
        candidates = rotateCandidates(['IMAGE_BACKGROUND', 'IMAGE_BOX_RIGHT', 'IMAGE_GLASS_CARD']);
      } else {
        candidates = rotateCandidates(['IMAGE_BACKGROUND', 'IMAGE_BOX_RIGHT', 'IMAGE_SPLIT_RIGHT']);
      }
      break;
  }

  const lastLayout = previousLayouts[previousLayouts.length - 1];
  const secondLastLayout = previousLayouts[previousLayouts.length - 2];

  return candidates.find((layout) => layout !== lastLayout && layout !== secondLastLayout)
    ?? candidates.find((layout) => layout !== lastLayout)
    ?? candidates[0]
    ?? 'IMAGE_NONE';
};

const startsWithStructuredHeader = (raw: string) => /^\s*(capa|slide\s+\d+)/i.test(raw);
const containsCoverSpecificFields = (raw: string) => /(apoio superior|destaque|apoio inferior|imagem fundo|imagem destaque)\s*:/i.test(raw);

const buildSyntheticScriptFromSlide = (slide: SlideDefinition, slideIndex: number) => {
  if (slide.cover) {
    const lines = ['Capa'];
    if (slide.cover.text?.eyebrow) lines.push(`Apoio Superior: ${slide.cover.text.eyebrow}`);
    if (slide.cover.text?.titleMain) lines.push(`Destaque: ${slide.cover.text.titleMain}`);
    if (slide.cover.text?.supportingLine) lines.push(`Apoio Inferior: ${slide.cover.text.supportingLine}`);
    const backgroundBrief = slide.cover.images?.backgroundPrompt || slide.cover.images?.backgroundImage;
    const foregroundBrief = slide.cover.images?.foregroundPrompt || slide.cover.images?.foregroundImage;
    if (backgroundBrief) lines.push(`Imagem Fundo: ${backgroundBrief}`);
    if (foregroundBrief) lines.push(`Imagem Destaque: ${foregroundBrief}`);
    return lines.join('\n');
  }

  const composition = resolveSlideComposition(slide);
  const title = slide.blocks.find((block) => block.type === 'TITLE' && typeof block.content === 'string')?.content as string | undefined;
  const paragraphs = slide.blocks
    .filter((block) => block.type === 'PARAGRAPH' && typeof block.content === 'string')
    .map((block) => block.content as string);
  const badges = slide.blocks
    .filter((block) => block.type === 'BADGE' && typeof block.content === 'string')
    .map((block) => block.content as string);
  const listBlock = slide.blocks.find((block) => block.type === 'LIST');
  const listFromListBlock = Array.isArray(listBlock?.content)
    ? listBlock?.content
    : typeof listBlock?.content === 'string'
      ? listBlock.content.split('\n').map((item) => item.trim()).filter(Boolean)
      : [];
  const listFromCards = slide.blocks
    .filter((block) => (block.type === 'BOX' || block.type === 'CARD') && typeof block.content === 'string')
    .map((block) => block.content as string)
    .filter(Boolean);
  const listItems = listFromListBlock.length > 0
    ? listFromListBlock
    : composition.contentTemplateId === 'BOX_GRID' || composition.contentTemplateId === 'CHECKLIST'
      ? listFromCards
      : [];
  const cta = composition.contentTemplateId === 'HERO' ? badges[0] : undefined;
  const subtitle = paragraphs[0];
  const body = paragraphs.slice(1).join('\n');
  const lines = [`Slide ${slide.slideNumber ?? (slideIndex + 1)}`];

  if (title) lines.push(`Título: ${title}`);
  if (subtitle) lines.push(`Subtítulo: ${subtitle}`);
  if (body) lines.push(`Texto: ${body}`);
  if (listItems.length > 0) {
    lines.push('Lista:');
    listItems.forEach((item) => lines.push(`- ${item}`));
  }
  if (cta) lines.push(`CTA: ${cta}`);
  if (slide.imagePrompt || slide.image?.url) lines.push(`Imagem: ${slide.imagePrompt || slide.image?.url}`);

  return lines.join('\n');
};

const getParsedSlideForPatchFallback = (slide: SlideDefinition, slideIndex: number) => {
  const synthetic = buildSyntheticScriptFromSlide(slide, slideIndex);
  return parseRawScript(synthetic)[0];
};

const mergeParsedSlides = (primary: ParsedRawSlide, fallback?: ParsedRawSlide): ParsedRawSlide => {
  if (!fallback) return primary;

  const mergedCover = primary.cover || fallback.cover
    ? {
        ...(fallback.cover || {}),
        ...(primary.cover || {}),
        supportTop: primary.cover?.supportTop ?? fallback.cover?.supportTop,
        supportTopMeta: primary.cover?.supportTopMeta ?? fallback.cover?.supportTopMeta,
        highlight: primary.cover?.highlight ?? fallback.cover?.highlight,
        highlightMeta: primary.cover?.highlightMeta ?? fallback.cover?.highlightMeta,
        supportBottom: primary.cover?.supportBottom ?? fallback.cover?.supportBottom,
        supportBottomMeta: primary.cover?.supportBottomMeta ?? fallback.cover?.supportBottomMeta,
        backgroundImage: primary.cover?.backgroundImage ?? fallback.cover?.backgroundImage,
        backgroundImageMeta: primary.cover?.backgroundImageMeta ?? fallback.cover?.backgroundImageMeta,
        foregroundImage: primary.cover?.foregroundImage ?? fallback.cover?.foregroundImage,
        foregroundImageMeta: primary.cover?.foregroundImageMeta ?? fallback.cover?.foregroundImageMeta,
      }
    : undefined;

  return {
    ...fallback,
    ...primary,
    cover: mergedCover,
    titleCandidate: primary.titleCandidate ?? fallback.titleCandidate,
    titleCandidateMeta: primary.titleCandidateMeta ?? fallback.titleCandidateMeta,
    title: primary.title ?? fallback.title,
    titleMeta: primary.titleMeta ?? fallback.titleMeta,
    subtitle: primary.subtitle ?? fallback.subtitle,
    subtitleMeta: primary.subtitleMeta ?? fallback.subtitleMeta,
    text: primary.text ?? fallback.text,
    textMeta: primary.textMeta ?? fallback.textMeta,
    cta: primary.cta ?? fallback.cta,
    ctaMeta: primary.ctaMeta ?? fallback.ctaMeta,
    imagePrompt: primary.imagePrompt ?? fallback.imagePrompt,
    imagePromptMeta: primary.imagePromptMeta ?? fallback.imagePromptMeta,
    bodyLines: primary.bodyLines.length > 0 ? primary.bodyLines : fallback.bodyLines,
    bodyLineMeta: (primary.bodyLineMeta?.length ?? 0) > 0 ? primary.bodyLineMeta : fallback.bodyLineMeta,
    listItems: primary.listItems.length > 0 ? primary.listItems : fallback.listItems,
    listItemMeta: (primary.listItemMeta?.length ?? 0) > 0 ? primary.listItemMeta : fallback.listItemMeta,
    signals: {
      ...fallback.signals,
      ...primary.signals,
    },
  };
};

const convertStandardSlideToCover = (parsedSlide: ParsedRawSlide): ParsedRawSlide => ({
  ...parsedSlide,
  kind: 'cover',
  cover: {
    supportTop: parsedSlide.subtitle,
    supportTopMeta: parsedSlide.subtitleMeta,
    highlight: parsedSlide.title || parsedSlide.titleCandidate || `Slide ${parsedSlide.index}`,
    highlightMeta: parsedSlide.titleMeta || parsedSlide.titleCandidateMeta,
    supportBottom: parsedSlide.text || parsedSlide.bodyLines.join(' ').trim() || undefined,
    supportBottomMeta: parsedSlide.textMeta || parsedSlide.bodyLineMeta?.[0],
    backgroundImage: parsedSlide.imagePrompt,
    backgroundImageMeta: parsedSlide.imagePromptMeta,
  },
});

const pickPreservedReplaceOptions = (options?: SlideDefinition['options']): SlideDefinition['options'] => {
  if (!options) return undefined;

  return {
    heroVariant: options.heroVariant,
    theme: options.theme,
    background: options.background,
    accent: options.accent,
    text: options.text,
    cardBg: options.cardBg,
    cardTextColor: options.cardTextColor,
    cardOpacity: options.cardOpacity,
    hlBgColor: options.hlBgColor,
    hlTextColor: options.hlTextColor,
    fontPadrão: options.fontPadrão,
    fontDestaque: options.fontDestaque,
    backgroundOverlayStrength: options.backgroundOverlayStrength,
    backgroundOverlayColor: options.backgroundOverlayColor,
    backgroundBlur: options.backgroundBlur,
    fadeStrength: options.fadeStrength,
    fadeBlur: options.fadeBlur,
    preserveHighlights: options.preserveHighlights,
    liftShadows: options.liftShadows,
    texture: options.texture,
    postFX: options.postFX,
  };
};

const adaptImageToLayout = (
  currentSlide: SlideDefinition,
  imageLayoutId: string,
): SlideDefinition['image'] => {
  const nextImage = createImageConfigFromLayout(imageLayoutId, currentSlide.image);
  if (nextImage.type === 'NONE') return nextImage;

  return {
    ...nextImage,
    format: currentSlide.image?.format,
    naturalWidth: currentSlide.image?.naturalWidth,
    naturalHeight: currentSlide.image?.naturalHeight,
    backgroundOpacity: currentSlide.image?.backgroundOpacity,
    borderColor: currentSlide.image?.borderColor,
    borderWidth: currentSlide.image?.borderWidth,
    hasShadow: currentSlide.image?.hasShadow,
    hasTornEdges: currentSlide.image?.hasTornEdges,
  };
};

const buildSelectionContext = (
  slides: SlideDefinition[],
  slideIndex: number,
  totalSlides: number,
  analysis: SlideAnalysis,
  entropy: number,
): TemplateSelectionContext => {
  const previousSlide = slideIndex > 0 ? slides[slideIndex - 1] : null;
  const previousComposition = previousSlide ? resolveSlideComposition(previousSlide) : null;
  const previousProfile = getTemplateProfile(previousComposition?.contentTemplateId);
  const usedCompositions = slides
    .slice(0, slideIndex)
    .map((slide) => resolveSlideComposition(slide));
  const usedProfiles = usedCompositions.map((composition) => getTemplateProfile(composition.contentTemplateId)).filter(Boolean);

  return {
    previousTemplateId: previousComposition?.contentTemplateId ?? null,
    previousTemplateWeight: previousProfile?.visualWeight ?? null,
    previousVisualFamily: previousProfile?.visualFamily ?? null,
    previousRenderSignature: previousProfile?.renderSignature ?? null,
    previousContentMode: previousProfile?.contentMode ?? null,
    previousImageMode: previousProfile?.imageMode ?? null,
    usedTemplateIds: usedCompositions.map((composition) => composition.contentTemplateId),
    usedVisualFamilies: usedProfiles.map((profile) => profile.visualFamily),
    usedRenderSignatures: usedProfiles.map((profile) => profile.renderSignature || profile.templateId),
    usedWeightSequence: usedProfiles.map((profile) => profile.visualWeight),
    usedContentModes: usedProfiles.map((profile) => profile.contentMode),
    usedImageModes: usedProfiles.map((profile) => profile.imageMode),
    slideIndex,
    totalSlides,
    allowImageLayouts: analysis.shouldUseImage,
    entropy,
  };
};

export const generateSlideFromScript = (
  rawScript: string,
  {
    currentSlide,
    slideIndex,
    totalSlides,
    slides = [],
    mode,
    entropy = Math.random(),
    profile = {},
  }: {
    currentSlide: SlideDefinition;
    slideIndex: number;
    totalSlides?: number;
    slides?: SlideDefinition[];
    mode: SingleSlideScriptMode;
    entropy?: number;
    profile?: CoverProfileBadge;
  },
): SingleSlideGenerationResult => {
  const warnings: string[] = [];
  const isCover = Boolean(currentSlide.cover) || slideIndex === 0;
  const trimmed = rawScript.trim();

  if (!trimmed) {
    throw new Error('RAW_SCRIPT_EMPTY');
  }

  const preparedScript = startsWithStructuredHeader(trimmed)
    ? trimmed
    : `${isCover && containsCoverSpecificFields(trimmed) ? 'Capa' : `Slide ${currentSlide.slideNumber ?? (slideIndex + 1)}`}\n${trimmed}`;
  const parsedSlides = parseRawScript(preparedScript);

  if (parsedSlides.length === 0) {
    throw new Error('RAW_SCRIPT_PARSE_EMPTY');
  }

  if (parsedSlides.length > 1) {
    warnings.push(`Apenas a primeira seção foi usada. ${parsedSlides.length - 1} trecho(s) extra foram ignorados.`);
  }

  const firstParsed = parsedSlides[0];
  const fallbackParsed = mode === 'patch' ? getParsedSlideForPatchFallback(currentSlide, slideIndex) : undefined;
  const parsedSlide = mergeParsedSlides(firstParsed, fallbackParsed);

  if (isCover) {
    const coverSource = firstParsed.kind === 'cover' || firstParsed.cover
      ? parsedSlide
      : convertStandardSlideToCover({
          ...parsedSlide,
          cover: undefined,
        });
    const coverSlide = composeCoverSlide(coverSource, currentSlide.cover?.profile || profile);

    return {
      slide: {
        ...currentSlide,
        ...coverSlide,
        slideNumber: currentSlide.slideNumber ?? coverSlide.slideNumber,
        options: mode === 'patch'
          ? currentSlide.options
          : {
              ...(coverSlide.options || {}),
              ...(pickPreservedReplaceOptions(currentSlide.options) || {}),
            },
        cover: {
          ...(coverSlide.cover || {}),
          profile: currentSlide.cover?.profile || profile,
          textOptions: currentSlide.cover?.textOptions,
          images: {
            ...(currentSlide.cover?.images || {}),
            ...(coverSlide.cover?.images || {}),
            backgroundImage: coverSlide.cover?.images?.backgroundImage ?? currentSlide.cover?.images?.backgroundImage,
            foregroundImage: coverSlide.cover?.images?.foregroundImage ?? currentSlide.cover?.images?.foregroundImage,
            foregroundMode: coverSlide.cover?.images?.foregroundImage
              ? (coverSlide.cover?.images?.foregroundMode ?? 'cutout')
              : (currentSlide.cover?.images?.foregroundImage
                  ? (currentSlide.cover?.images?.foregroundMode ?? 'cutout')
                  : (coverSlide.cover?.images?.foregroundMode ?? 'none')),
          },
          effects: currentSlide.cover?.effects || coverSlide.cover?.effects,
        },
      },
      parsedSlide: coverSource,
      analysis: null,
      contentTemplateId: 'HERO',
      imageLayoutId: 'IMAGE_NONE',
      warnings,
    };
  }

  const effectiveTotalSlides = totalSlides ?? Math.max(slideIndex + 1, slides.length || 0, 1);
  const analysis = classifyParsedRawSlide(parsedSlide, slideIndex, effectiveTotalSlides);

  if (mode === 'patch') {
    const composition = resolveSlideComposition(currentSlide);
    const contentTemplateId = composition.contentTemplateId;
    const imageLayoutId = composition.imageLayoutId;
    const generated = composeHeuristicSlide(parsedSlide, analysis as any, contentTemplateId, imageLayoutId);

    return {
      slide: {
        ...currentSlide,
        ...generated,
        slideNumber: currentSlide.slideNumber ?? generated.slideNumber,
        template: contentTemplateId,
        contentTemplate: contentTemplateId,
        imageLayout: imageLayoutId,
        image: currentSlide.image,
        overlayImages: currentSlide.overlayImages,
        options: currentSlide.options,
      },
      parsedSlide,
      analysis,
      contentTemplateId,
      imageLayoutId,
      warnings,
    };
  }

  const contextSlides = slides.length > 0 ? slides : Array.from({ length: effectiveTotalSlides }, (_, index) => (
    index === slideIndex ? currentSlide : { template: 'HERO', contentTemplate: 'HERO', imageLayout: 'IMAGE_NONE', blocks: [{ type: 'TITLE', content: `Slide ${index + 1}` }] } as SlideDefinition
  ));
  const selection = selectContentTemplate(
    analysis,
    buildSelectionContext(contextSlides, slideIndex, effectiveTotalSlides, analysis, entropy),
  );
  const contentTemplateId = canonicalizeTemplateIdForAnalysis(analysis, selection.templateId);
  const previousImageLayouts = contextSlides
    .slice(0, slideIndex)
    .map((slide) => resolveSlideComposition(slide).imageLayoutId)
    .filter((layoutId) => layoutId !== 'IMAGE_NONE');
  const imageLayoutId = selectImageLayout(analysis, contentTemplateId, slideIndex, previousImageLayouts, entropy);
  const generated = composeHeuristicSlide(parsedSlide, analysis as any, contentTemplateId, imageLayoutId);

  return {
    slide: {
      ...generated,
      slideNumber: currentSlide.slideNumber ?? generated.slideNumber,
      overlayImages: currentSlide.overlayImages,
      image: adaptImageToLayout(currentSlide, imageLayoutId),
      options: {
        ...(generated.options || {}),
        ...createOptionOverridesFromImageLayout(imageLayoutId),
        ...(pickPreservedReplaceOptions(currentSlide.options) || {}),
      },
    },
    parsedSlide,
    analysis,
    contentTemplateId,
    imageLayoutId,
    warnings,
  };
};
