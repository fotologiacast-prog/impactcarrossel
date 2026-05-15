import {
  getProfilesForType,
  TEMPLATE_PROFILES,
  type TemplateProfile,
  type TemplateVisualWeight,
} from './template-profiles.ts';
import type { HeuristicSlideType, HeuristicSlideSignalMap } from '../../types';

export type SlideAnalysis = {
  primaryType?: HeuristicSlideType;
  type: HeuristicSlideType;
  signals?: HeuristicSlideSignalMap;
  textLength: number;
  titleLength: number;
  bodyLength: number;
  itemCount: number;
  itemAverageLength: number;
  visualWeightHint: TemplateVisualWeight;
  hasImagePrompt: boolean;
  shouldUseImage: boolean;
  imagePriority: number;
  prefersBigNumber: boolean;
};

export type TemplateSelectionContext = {
  previousTemplateId: string | null;
  previousTemplateWeight: TemplateVisualWeight | null;
  previousVisualFamily?: string | null;
  previousRenderSignature?: string | null;
  previousContentMode?: TemplateProfile['contentMode'] | null;
  previousImageMode?: TemplateProfile['imageMode'] | null;
  usedTemplateIds?: string[];
  usedVisualFamilies?: string[];
  usedRenderSignatures?: string[];
  usedWeightSequence?: TemplateVisualWeight[];
  usedContentModes?: TemplateProfile['contentMode'][];
  usedImageModes?: TemplateProfile['imageMode'][];
  slideIndex: number;
  totalSlides: number;
  allowImageLayouts?: boolean;
  bannedTemplateIds?: string[];
  bannedFamilies?: string[];
  bannedWeights?: TemplateVisualWeight[];
  /** Per-generation random seed in [0, 1). Makes close-scoring candidates vary between runs. */
  entropy?: number;
};

export type TemplateSelectionCandidate = {
  templateId: string;
  profile: TemplateProfile;
  score: number;
};

export type TemplateSelection = {
  templateId: string;
  profile: TemplateProfile;
  score: number;
  candidates: TemplateSelectionCandidate[];
};

/**
 * Reproducible pseudo-random noise in [0, 1) from a seed and optional index keys.
 * Uses a sin-hash — cheap, no dependencies, good distribution for score jitter.
 */
const seededNoise = (seed: number, ...keys: number[]): number => {
  let h = seed * 31337.31;
  for (const k of keys) {
    h = Math.abs(Math.sin(h * 9301.11 + k * 49297.71 + 233.31)) * 46341.0;
    h = h - Math.floor(h);
  }
  return h;
};

/** Max randomness added to any single template score (±this value). */
const SCORE_JITTER_AMPLITUDE = 18;

const WEIGHT_FIT_SCORES: Record<TemplateVisualWeight, Record<TemplateVisualWeight, number>> = {
  light: { light: 40, medium: 18, heavy: -20 },
  medium: { light: 16, medium: 36, heavy: 12 },
  heavy: { light: -16, medium: 14, heavy: 32 },
};

const WEIGHT_CONTRAST_SCORES: Record<TemplateVisualWeight, Record<TemplateVisualWeight, number>> = {
  light: { light: -8, medium: 14, heavy: 22 },
  medium: { light: 12, medium: -4, heavy: 12 },
  heavy: { light: 22, medium: 14, heavy: -8 },
};

const getPrimaryType = (analysis: SlideAnalysis) => analysis.primaryType ?? analysis.type;

const getSignals = (analysis: SlideAnalysis): HeuristicSlideSignalMap => ({
  intro: analysis.signals?.intro ?? (getPrimaryType(analysis) === 'intro' ? 1 : 0),
  single_point: analysis.signals?.single_point ?? (getPrimaryType(analysis) === 'single_point' ? 1 : 0),
  list: analysis.signals?.list ?? (getPrimaryType(analysis) === 'list' ? 1 : 0),
  stat: analysis.signals?.stat ?? (getPrimaryType(analysis) === 'stat' ? 1 : 0),
  comparison: analysis.signals?.comparison ?? (getPrimaryType(analysis) === 'comparison' ? 1 : 0),
  cta: analysis.signals?.cta ?? (getPrimaryType(analysis) === 'cta' ? 1 : 0),
  quote: analysis.signals?.quote ?? 0,
});

const POSITION_BY_INDEX = (slideIndex: number, totalSlides: number): 'opening' | 'middle' | 'closing' => {
  if (slideIndex <= 0) return 'opening';
  if (slideIndex >= Math.max(0, totalSlides - 1)) return 'closing';
  return 'middle';
};

const capabilityForType = (capabilities: HeuristicSlideSignalMap, type: HeuristicSlideType) =>
  capabilities[type] ?? 0;

const scoreCapabilityFit = (profile: TemplateProfile, analysis: SlideAnalysis) => {
  const primaryType = getPrimaryType(analysis);
  const signals = getSignals(analysis);
  let score = capabilityForType(profile.capabilities, primaryType) * 100;

  for (const [signalType, signalStrength] of Object.entries(signals) as Array<[keyof HeuristicSlideSignalMap, number]>) {
    if (signalType === primaryType) continue;
    score += profile.capabilities[signalType] * signalStrength * 25;
  }

  return Math.round(score);
};

const scoreTextCapacity = (value: number, min: number, max: number) => {
  if (value >= min && value <= max) return 36;
  if (value < min) return -Math.min(36, (min - value) * 1.8);
  return -Math.min(36, (value - max) * 1.2);
};

const scorePosition = (profile: TemplateProfile, slideIndex: number, totalSlides: number) => {
  const current = POSITION_BY_INDEX(slideIndex, totalSlides);
  let score = 0;

  if (profile.preferredPositions.includes(current)) {
    score = 32;
  } else if (current === 'opening' && profile.preferredPositions.includes('middle')) {
    score = 10;
  } else if (current === 'closing' && profile.preferredPositions.includes('middle')) {
    score = -12;
  } else {
    score = -14;
  }

  const normalizedPosition = slideIndex / Math.max(1, totalSlides - 1);
  if (current === 'middle') {
    if (normalizedPosition < 0.3 && profile.preferredPositions.includes('opening')) score += 6;
    if (normalizedPosition > 0.7 && profile.preferredPositions.includes('closing')) score += 6;
  }

  return score;
};

const scoreItemCapacity = (value: number, min: number, max: number) => {
  if (value >= min && value <= max) return 28;
  if (value < min) return -Math.min(28, (min - value) * 6);
  return -Math.min(28, (value - max) * 6);
};

const scoreDensity = (textLength: number, preferred: TemplateProfile['preferredTextDensity']) => {
  const density = textLength < 60 ? 'short' : textLength > 180 ? 'long' : 'medium';
  if (density === preferred) return 28;
  if (density === 'short' && preferred === 'medium') return 14;
  if (density === 'medium' && preferred === 'long') return 12;
  if (density === 'long' && preferred === 'medium') return 10;
  return -8;
};

const isBoxForwardProfile = (profile: TemplateProfile) =>
  profile.templateId === 'BOX_GRID'
  || profile.visualFamily.startsWith('box');

const canonicalContentTemplateIdFromProfile = (profile: TemplateProfile, analysis: SlideAnalysis) => {
  if (profile.templateId === 'HERO' || profile.templateId === 'STAT' || profile.templateId === 'CHECKLIST' || profile.templateId === 'BOX_GRID') {
    return profile.templateId;
  }

  const family = profile.visualFamily.toLowerCase();
  const signature = (profile.renderSignature ?? '').toLowerCase();
  const primaryType = getPrimaryType(analysis);

  if (primaryType === 'stat' || profile.capabilities.stat >= 0.8 || family.includes('stat') || signature.includes('stat')) {
    return 'STAT';
  }

  if (
    primaryType === 'list'
    || profile.contentMode === 'list'
    || family.includes('check')
    || signature.includes('check')
    || signature.includes('list')
  ) {
    if (family.includes('box') || signature.includes('box') || signature.includes('card')) {
      return 'BOX_GRID';
    }
    return 'CHECKLIST';
  }

  if (family.includes('box') || signature.includes('box') || signature.includes('card')) {
    return 'BOX_GRID';
  }

  return 'HERO';
};

const canonicalFallbackProfile = TEMPLATE_PROFILES.find((profile) => profile.templateId === 'HERO')
  ?? TEMPLATE_PROFILES[0];

const prefersVisualBoxLayout = (analysis: SlideAnalysis) =>
  getPrimaryType(analysis) === 'list'
  && analysis.itemCount >= 2
  && analysis.itemCount <= 4
  && analysis.itemAverageLength <= 6
  && analysis.textLength <= 120
  && analysis.bodyLength <= 56;

const scoreRepeatedUsage = (count: number, basePenalty: number, decayPenalty: number) => {
  if (count <= 0) return 0;
  return -(basePenalty + decayPenalty * Math.log2(count));
};

const scoreTemplateBase = (profile: TemplateProfile, analysis: SlideAnalysis, context: TemplateSelectionContext) => {
  if (context.bannedTemplateIds?.includes(profile.templateId)) return -10000;
  if (context.bannedFamilies?.includes(profile.visualFamily)) return -10000;
  if (context.bannedWeights?.includes(profile.visualWeight)) return -10000;

  let score = 0;
  const usedTemplateCount = context.usedTemplateIds?.filter((templateId) => templateId === profile.templateId).length ?? 0;
  const usedFamilyCount = context.usedVisualFamilies?.filter((family) => family === profile.visualFamily).length ?? 0;
  const usedSignatureCount = context.usedRenderSignatures?.filter((signature) => signature === profile.renderSignature).length ?? 0;

  score += WEIGHT_FIT_SCORES[analysis.visualWeightHint][profile.visualWeight];
  score += scoreCapabilityFit(profile, analysis);
  score += scoreTextCapacity(analysis.textLength, profile.textCapacity.min, profile.textCapacity.max);
  score += scoreItemCapacity(analysis.itemCount, profile.itemCapacity.min, profile.itemCapacity.max);
  score += scoreDensity(analysis.textLength, profile.preferredTextDensity);
  score += scorePosition(profile, context.slideIndex, context.totalSlides);

  if (profile.contentMode === 'list' && analysis.itemCount > 0) score += 14;
  if (profile.contentMode === 'text' && analysis.itemCount === 0) score += 9;

  if (analysis.prefersBigNumber && profile.capabilities.stat > 0.5) score += 25;

  if (prefersVisualBoxLayout(analysis)) {
    if (isBoxForwardProfile(profile)) score += 48;
    if (profile.contentMode === 'list') score -= 22;
  }

  if (getPrimaryType(analysis) === 'list') {
    if (context.previousContentMode === 'list' && profile.contentMode === 'list') {
      score -= 22;
    }
    if (context.previousContentMode === 'list' && isBoxForwardProfile(profile)) {
      score += 18;
    }

    const lastContentModes = context.usedContentModes?.slice(-2) ?? [];
    if (lastContentModes.length === 2 && lastContentModes.every((mode) => mode === 'list')) {
      if (profile.contentMode === 'list') score -= 54;
      if (isBoxForwardProfile(profile)) score += 20;
    }
  }

  if (context.previousTemplateId === profile.templateId) {
    score -= 180;
  }

  score += scoreRepeatedUsage(usedTemplateCount, 70, 30);
  score += scoreRepeatedUsage(usedFamilyCount, 24, 12);
  score += scoreRepeatedUsage(usedSignatureCount, 42, 18);

  if (context.previousTemplateWeight) {
    score += WEIGHT_CONTRAST_SCORES[context.previousTemplateWeight][profile.visualWeight];
  }

  if (context.previousVisualFamily && context.previousVisualFamily === profile.visualFamily) {
    score -= 52;
  }

  if (context.previousRenderSignature && context.previousRenderSignature === profile.renderSignature) {
    score -= 110;
  }

  if (context.previousImageMode && context.previousImageMode === profile.imageMode) {
    score -= 16;
  }

  if (context.previousTemplateWeight === 'heavy' && profile.visualWeight === 'light') {
    score += 24;
  }
  if (context.previousTemplateWeight === 'light' && profile.visualWeight === 'heavy') {
    score += 18;
  }

  const lastWeights = context.usedWeightSequence?.slice(-2) ?? [];
  if (lastWeights.length === 2 && lastWeights.every((weight) => weight === profile.visualWeight)) {
    score -= 60;
  }

  if (context.previousTemplateWeight) {
    if (context.previousTemplateWeight === 'heavy' && profile.visualWeight === 'light') {
      score += 24;
    }
    if (context.previousTemplateWeight === 'light' && profile.visualWeight === 'heavy') {
      score += 18;
    }
    const diff = Math.abs(
      WEIGHT_FIT_SCORES.light[profile.visualWeight] - WEIGHT_FIT_SCORES.light[context.previousTemplateWeight],
    );
    score += diff * 0.12;
  }

  return score;
};

const scoreTemplate = (profile: TemplateProfile, analysis: SlideAnalysis, context: TemplateSelectionContext) => {
  let score = scoreTemplateBase(profile, analysis, context);

  if (analysis.shouldUseImage) {
    if (profile.imageMode === 'background') score += 18;
    if (profile.imageMode === 'split') score += 14;
    if (profile.imageMode === 'glass') score += 10;
    if (profile.imageMode === 'box') score += 8;
    if (profile.imageMode === 'none') score -= 15;
  } else if (profile.imageMode === 'none') {
    score += 14;
  }

  if (profile.contentMode === 'mixed' && analysis.shouldUseImage) score += 8;

  if (context.allowImageLayouts === false) {
    score += profile.imageMode === 'none' ? 20 : -110;
  }

  if (context.previousImageMode && context.previousImageMode === profile.imageMode) {
    score -= 16;
  }

  const lastImageModes = context.usedImageModes?.slice(-2) ?? [];
  const currentHasImage = profile.imageMode !== 'none';
  const lastHadImages = lastImageModes.map((mode) => mode !== 'none');
  if (lastHadImages.length === 2 && lastHadImages.every((value) => value === currentHasImage)) {
    score -= 40;
  }

  return score;
};

const scoreContentTemplate = (
  profile: TemplateProfile,
  analysis: SlideAnalysis,
  context: TemplateSelectionContext,
) => {
  let score = scoreTemplateBase(profile, analysis, context);

  if (profile.contentMode === 'mixed' && analysis.itemCount > 0) score += 6;

  if (prefersVisualBoxLayout(analysis)) {
    if (profile.templateId === 'CHECKLIST') score -= 18;
  } else if (getPrimaryType(analysis) === 'list' && analysis.itemCount >= 5) {
    if (profile.contentMode === 'list') score += 16;
    if (isBoxForwardProfile(profile)) score -= 14;
  }

  if (getPrimaryType(analysis) === 'list' && analysis.bodyLength >= 70 && analysis.itemCount >= 2) {
    if (profile.templateId === 'CHECKLIST') score += 26;
    if (isBoxForwardProfile(profile)) score -= 22;
  }

  return score;
};

export const rankTemplateProfiles = (
  analysis: SlideAnalysis,
  context: TemplateSelectionContext,
  profiles: TemplateProfile[] = TEMPLATE_PROFILES,
) => {
  const pool = getProfilesForType(getPrimaryType(analysis), profiles);
  const candidates = pool.length > 0 ? pool : profiles;
  const filteredCandidates = context.allowImageLayouts === false
    ? candidates.filter((profile) => profile.imageMode === 'none')
    : candidates;
  const scoringPool = context.allowImageLayouts === false ? filteredCandidates : (filteredCandidates.length > 0 ? filteredCandidates : candidates);

  return scoringPool
    .map((profile, candidateIndex) => {
      const baseScore = scoreTemplate(profile, analysis, context);
      const jitter = context.entropy !== undefined
        ? (seededNoise(context.entropy, context.slideIndex, candidateIndex) - 0.5) * SCORE_JITTER_AMPLITUDE * 2
        : 0;
      return {
        templateId: profile.templateId,
        profile,
        score: Math.round(baseScore + jitter),
      };
    })
    .sort((left, right) => {
      if (right.score !== left.score) return right.score - left.score;
      return profiles.findIndex((profile) => profile.templateId === left.templateId)
        - profiles.findIndex((profile) => profile.templateId === right.templateId);
    });
};

export const rankContentTemplateProfiles = (
  analysis: SlideAnalysis,
  context: TemplateSelectionContext,
  profiles: TemplateProfile[] = TEMPLATE_PROFILES,
) => {
  const pool = getProfilesForType(getPrimaryType(analysis), profiles);
  const candidates = pool.length > 0 ? pool : profiles;

  return candidates
    .map((profile, candidateIndex) => {
      const baseScore = scoreContentTemplate(profile, analysis, context);
      const jitter = context.entropy !== undefined
        ? (seededNoise(context.entropy, context.slideIndex + 1000, candidateIndex) - 0.5) * SCORE_JITTER_AMPLITUDE * 2
        : 0;
      return {
        templateId: profile.templateId,
        profile,
        score: Math.round(baseScore + jitter),
      };
    })
    .sort((left, right) => {
      if (right.score !== left.score) return right.score - left.score;
      return profiles.findIndex((profile) => profile.templateId === left.templateId)
        - profiles.findIndex((profile) => profile.templateId === right.templateId);
    });
};

export const selectTemplate = (
  analysis: SlideAnalysis,
  context: TemplateSelectionContext,
  profiles: TemplateProfile[] = TEMPLATE_PROFILES,
): TemplateSelection => {
  const ranked = rankTemplateProfiles(analysis, context, profiles);
  const winner = ranked[0];

  if (!winner) {
    return {
      templateId: 'HERO',
      profile: canonicalFallbackProfile,
      score: 0,
      candidates: [],
    };
  }

  return {
    templateId: winner.templateId,
    profile: winner.profile,
    score: winner.score,
    candidates: ranked,
  };
};

export const selectContentTemplate = (
  analysis: SlideAnalysis,
  context: TemplateSelectionContext,
  profiles: TemplateProfile[] = TEMPLATE_PROFILES,
): TemplateSelection => {
  if (getPrimaryType(analysis) === 'cta') {
    const heroProfile = profiles.find((profile) => profile.templateId === 'HERO') ?? canonicalFallbackProfile;
    const ranked = rankContentTemplateProfiles(analysis, context, profiles).map((candidate) => ({
      ...candidate,
      templateId: canonicalContentTemplateIdFromProfile(candidate.profile, analysis),
    }));

    return {
      templateId: 'HERO',
      profile: heroProfile,
      score: ranked.find((candidate) => candidate.templateId === 'HERO')?.score ?? 0,
      candidates: ranked,
    };
  }

  const ranked = rankContentTemplateProfiles(analysis, context, profiles);
  const winner = ranked[0];

  if (!winner) {
    return {
      templateId: 'HERO',
      profile: canonicalFallbackProfile,
      score: 0,
      candidates: [],
    };
  }

  const canonicalTemplateId = canonicalContentTemplateIdFromProfile(winner.profile, analysis);

  return {
    templateId: canonicalTemplateId,
    profile: winner.profile,
    score: winner.score,
    candidates: ranked.map((candidate) => ({
      ...candidate,
      templateId: canonicalContentTemplateIdFromProfile(candidate.profile, analysis),
    })),
  };
};
