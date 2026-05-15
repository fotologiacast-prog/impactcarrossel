import type { CarouselDefinition } from '../../types';
import { classifyParsedRawSlide } from './slide-classifier.ts';
import { parseRawScript } from './raw-slide-parser.ts';
import { composeHeuristicSlide } from './slide-composer.ts';
import { composeCoverSlide } from '../covers/cover-composer.ts';
import { selectContentTemplate } from './template-selector.ts';
import type { SlideAnalysis, TemplateSelection, TemplateSelectionContext } from './template-selector.ts';
import { contentTemplateRegistry } from '../../domain/templates/ContentTemplateRegistry.ts';
import {
  createImageConfigFromLayout,
  createOptionOverridesFromImageLayout,
} from '../../domain/templates/templateComposition.ts';

/**
 * Reproducible pseudo-random noise in [0, 1) from a seed and optional index keys.
 * Identical to the helper in template-selector — kept inline to avoid a shared
 * utility dependency for such a trivial function.
 */
const seededNoise = (seed: number, ...keys: number[]): number => {
  let h = seed * 31337.31;
  for (const k of keys) {
    h = Math.abs(Math.sin(h * 9301.11 + k * 49297.71 + 233.31)) * 46341.0;
    h = h - Math.floor(h);
  }
  return h;
};

const getImageQuota = (slideCount: number) => {
  const contentSlides = Math.max(0, slideCount - 1);
  return Math.max(2, Math.min(Math.max(0, contentSlides - 1), Math.ceil(contentSlides * 0.5)));
};

const canonicalizeTemplateIdForAnalysis = (analysis: SlideAnalysis, templateId: string) => {
  const primaryType = analysis.primaryType ?? analysis.type;
  if (primaryType === 'stat') return 'STAT';
  if (primaryType === 'cta') return 'HERO';
  return templateId;
};

type ResolvedSelection = {
  analysis: SlideAnalysis;
  selection: TemplateSelection;
  imageLayoutId: string;
};

const buildSelectionContext = (
  slideIndex: number,
  totalSlides: number,
  selections: ResolvedSelection[],
  allowImageLayouts: boolean,
  overrides: Partial<TemplateSelectionContext> = {},
  entropy?: number,
): TemplateSelectionContext => {
  const previous = selections[slideIndex - 1];

  return {
    previousTemplateId: previous?.selection.templateId ?? null,
    previousTemplateWeight: previous?.selection.profile.visualWeight ?? null,
    previousVisualFamily: previous?.selection.profile.visualFamily ?? null,
    previousRenderSignature: previous?.selection.profile.renderSignature ?? null,
    previousContentMode: previous?.selection.profile.contentMode ?? null,
    previousImageMode: previous?.selection.profile.imageMode ?? null,
    usedTemplateIds: selections.slice(0, slideIndex).map((entry) => entry.selection.templateId),
    usedVisualFamilies: selections.slice(0, slideIndex).map((entry) => entry.selection.profile.visualFamily),
    usedRenderSignatures: selections.slice(0, slideIndex).map((entry) => entry.selection.profile.renderSignature),
    usedWeightSequence: selections.slice(0, slideIndex).map((entry) => entry.selection.profile.visualWeight),
    usedContentModes: selections.slice(0, slideIndex).map((entry) => entry.selection.profile.contentMode),
    usedImageModes: selections.slice(0, slideIndex).map((entry) => entry.selection.profile.imageMode),
    slideIndex,
    totalSlides,
    allowImageLayouts,
    entropy,
    ...overrides,
  };
};

const reselectAt = (
  resolved: ResolvedSelection[],
  index: number,
  totalSlides: number,
  overrides: Partial<TemplateSelectionContext> = {},
  entropy?: number,
) => {
  const current = resolved[index];
  if (!current) return;
  const context = buildSelectionContext(index, totalSlides, resolved, current.analysis.shouldUseImage, overrides, entropy);
  resolved[index] = {
    analysis: current.analysis,
    selection: selectContentTemplate(current.analysis, context),
    imageLayoutId: current.imageLayoutId,
  };
};

const pickCandidateAlternative = (
  resolved: ResolvedSelection[],
  index: number,
  predicate: (selection: TemplateSelection) => boolean,
) => {
  const current = resolved[index];
  if (!current) return;
  const alternative = current.selection.candidates.find((candidate) =>
    predicate({
      templateId: candidate.templateId,
      profile: candidate.profile,
      score: candidate.score,
      candidates: current.selection.candidates,
    }),
  );

  if (alternative) {
    resolved[index] = {
      analysis: current.analysis,
      selection: {
        templateId: alternative.templateId,
        profile: alternative.profile,
        score: alternative.score,
        candidates: current.selection.candidates,
      },
      imageLayoutId: current.imageLayoutId,
    };
  }
};

/**
 * Selects the image layout for a content slide.
 *
 * `entropy` is a per-generation value in [0, 1) that rotates the candidate
 * array so different layouts are preferred on each generation, even for the
 * same slide index and content type.
 */
const selectImageLayout = (
  analysis: SlideAnalysis,
  contentTemplateId: string,
  slideIndex: number,
  previousLayouts: string[] = [],
  entropy: number = 0.5,
): string => {
  if (!analysis.shouldUseImage) return 'IMAGE_NONE';

  const primaryType = analysis.primaryType ?? analysis.type;
  if (primaryType === 'cta' && !analysis.hasImagePrompt) {
    return 'IMAGE_NONE';
  }

  // `variant` is a stable [0, 1) value unique to this (generation, slide).
  // Used to rotate the candidate list so preferred order varies each run.
  const variant = seededNoise(entropy, slideIndex, slideIndex + 500);

  const rotateCandidates = (pool: string[]): string[] => {
    if (pool.length <= 1) return pool;
    const offset = Math.floor(variant * pool.length);
    return [...pool.slice(offset), ...pool.slice(0, offset)];
  };

  let candidates: string[];

  if (analysis.hasEditorialStructure && analysis.hasImagePrompt) {
    candidates = ['IMAGE_BOX_RIGHT', 'IMAGE_STAGE_RIGHT', 'IMAGE_SPLIT_RIGHT', 'IMAGE_FADE_RIGHT', 'IMAGE_BACKGROUND'];
  } else switch (contentTemplateId) {
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

const adjustSequence = (resolved: ResolvedSelection[], entropy: number) => {
  const totalSlides = resolved.length;
  if (totalSlides < 2) return resolved;
  const reselectCount = new Map<number, number>();
  const MAX_RESELECTS_PER_SLIDE = 2;
  const safeReselectAt = (index: number, overrides: Partial<TemplateSelectionContext> = {}) => {
    const count = reselectCount.get(index) ?? 0;
    if (count >= MAX_RESELECTS_PER_SLIDE) return false;
    reselectAt(resolved, index, totalSlides, overrides, entropy);
    reselectCount.set(index, count + 1);
    return true;
  };

  for (let pass = 0; pass < 3; pass += 1) {
    let changed = false;
    for (let index = 2; index < resolved.length; index += 1) {
      const window = resolved.slice(index - 2, index + 1);
      const families = window.map((entry) => entry.selection.profile.visualFamily);
      const signatures = window.map((entry) => entry.selection.profile.renderSignature);
      const weights = window.map((entry) => entry.selection.profile.visualWeight);
      const images = window.map((entry) => entry.selection.profile.imageMode !== 'none');

      if (signatures[0] === signatures[1] && signatures[1] === signatures[2]) {
        changed = safeReselectAt(index - 1, { bannedTemplateIds: [window[1].selection.templateId] }) || changed;
        continue;
      }

      if (families[0] === families[1] && families[1] === families[2]) {
        changed = safeReselectAt(index - 1, { bannedFamilies: [families[0]] }) || changed;
        continue;
      }

      if (weights[0] === weights[1] && weights[1] === weights[2]) {
        changed = safeReselectAt(index - 1, { bannedWeights: [weights[0]] }) || changed;
        continue;
      }

      if (images[0] === images[1] && images[1] === images[2]) {
        changed = safeReselectAt(index - 1, {
          allowImageLayouts: images[0] ? false : (resolved[index - 1]?.analysis.imagePriority ?? 0) > 0,
        }) || changed;
      }
    }
    if (!changed) break;
  }

  const first = resolved[0];
  const last = resolved[resolved.length - 1];
  if (first && last && resolved.length > 2 && first.selection.templateId === last.selection.templateId) {
    safeReselectAt(resolved.length - 1, {
      bannedTemplateIds: [first.selection.templateId],
    });
  }

  for (let index = 2; index < resolved.length; index += 1) {
    const window = resolved.slice(index - 2, index + 1);
    const families = window.map((entry) => entry.selection.profile.visualFamily);
    const signatures = window.map((entry) => entry.selection.profile.renderSignature);
    const weights = window.map((entry) => entry.selection.profile.visualWeight);

    if (signatures[0] === signatures[1] && signatures[1] === signatures[2]) {
      pickCandidateAlternative(resolved, index - 1, (selection) => selection.profile.renderSignature !== signatures[0]);
    }

    if (families[0] === families[1] && families[1] === families[2]) {
      pickCandidateAlternative(resolved, index - 1, (selection) => selection.profile.visualFamily !== families[0]);
    }

    if (weights[0] === weights[1] && weights[1] === weights[2]) {
      pickCandidateAlternative(resolved, index - 1, (selection) => selection.profile.visualWeight !== weights[0]);
    }
  }

  return resolved;
};

const selectTemplatesForCarousel = (analyses: SlideAnalysis[], entropy: number) => {
  const resolved: ResolvedSelection[] = [];

  for (let index = 0; index < analyses.length; index += 1) {
    const analysis = analyses[index];
    const context = buildSelectionContext(index, analyses.length, resolved, analysis.shouldUseImage, {}, entropy);
    const selection = selectContentTemplate(analysis, context);
    const canonicalTemplateId = canonicalizeTemplateIdForAnalysis(analysis, selection.templateId);
    const previousImageLayouts = resolved.map((entry) => entry.imageLayoutId).filter((layoutId) => layoutId !== 'IMAGE_NONE');
    resolved.push({
      analysis,
      selection,
      imageLayoutId: selectImageLayout(analysis, canonicalTemplateId, index, previousImageLayouts, entropy),
    });
  }

  return adjustSequence(resolved, entropy);
};

export const buildCarouselFromScript = (script: string): CarouselDefinition => {
  // Generate a unique entropy value per generation call.
  // This seed is threaded through all scoring and layout selection so the
  // same script produces visually different (but semantically correct)
  // carousels on every run.
  const entropy = Math.random();

  const parsedSlides = parseRawScript(script);
  if (parsedSlides.length === 0) {
    return { slides: [] };
  }

  const coverSlide = composeCoverSlide(parsedSlides[0]);
  const normalizedCoverSlide = {
    ...coverSlide,
    contentTemplate: contentTemplateRegistry.resolveId(coverSlide.contentTemplate || coverSlide.template)
      ?? coverSlide.contentTemplate
      ?? coverSlide.template,
  };
  const contentSlides = parsedSlides.slice(1);
  const analyses = contentSlides.map((parsedSlide, index) =>
    classifyParsedRawSlide(parsedSlide, index + 1, parsedSlides.length),
  );

  const imageQuota = getImageQuota(parsedSlides.length);
  const imageEligibleIndexes = analyses
    .map((analysis, index) => ({ index, priority: analysis.imagePriority }))
    .filter((entry) => entry.priority > 0)
    .sort((left, right) => right.priority - left.priority)
    .slice(0, imageQuota)
    .map((entry) => entry.index);

  const imageIndexSet = new Set(imageEligibleIndexes);
  const constrainedAnalyses = analyses.map((analysis, index) => ({
    ...analysis,
    shouldUseImage: imageIndexSet.has(index) && analyses[index].imagePriority > 0,
  }));

  const resolvedSelections = selectTemplatesForCarousel(constrainedAnalyses, entropy);

  const contentComposed = contentSlides.map((parsedSlide, index) => {
    const resolved = resolvedSelections[index];
    const analysis = resolved?.analysis ?? {
      ...analyses[index],
      shouldUseImage: imageIndexSet.has(index) && analyses[index].imagePriority > 0,
    };
    const selectedTemplateId = resolved?.selection.templateId ?? selectContentTemplate(
      analysis,
      buildSelectionContext(index, contentSlides.length, [], analysis.shouldUseImage, {}, entropy),
    ).templateId;
    const contentTemplateId = canonicalizeTemplateIdForAnalysis(analysis, selectedTemplateId);
    const previousImageLayouts = contentSlides
      .slice(0, index)
      .map((_, previousIndex) => resolvedSelections[previousIndex]?.imageLayoutId)
      .filter((layoutId): layoutId is string => Boolean(layoutId) && layoutId !== 'IMAGE_NONE');
    const imageLayoutId = selectImageLayout(analysis, contentTemplateId, index, previousImageLayouts, entropy);
    const slide = composeHeuristicSlide(parsedSlide, analysis as unknown as any, contentTemplateId, imageLayoutId);
    const image = createImageConfigFromLayout(imageLayoutId, slide.image);
    const optionOverrides = createOptionOverridesFromImageLayout(imageLayoutId);

    return {
      ...slide,
      image,
      options: {
        ...(slide.options || {}),
        ...optionOverrides,
      },
    };
  });

  return { slides: [normalizedCoverSlide, ...contentComposed] };
};
