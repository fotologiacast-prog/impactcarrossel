import type { HeuristicSlideSignalMap } from '../../types';

export type TemplateVisualWeight = 'light' | 'medium' | 'heavy';

export type TemplateImageMode = 'none' | 'background' | 'fade' | 'split' | 'glass' | 'box' | 'stage';

export type TemplateContentMode = 'text' | 'list' | 'mixed';

export type TemplateTextDensity = 'short' | 'medium' | 'long';

export type TemplatePositionPreference = 'opening' | 'middle' | 'closing' | 'first' | 'last' | 'any';

export interface TemplateProfile {
  templateId: string;
  capabilities: HeuristicSlideSignalMap;
  visualWeight: TemplateVisualWeight;
  imageMode: TemplateImageMode;
  contentMode: TemplateContentMode;
  textCapacity: {
    min: number;
    max: number;
  };
  itemCapacity: {
    min: number;
    max: number;
  };
  preferredTextDensity: TemplateTextDensity;
  preferredPositions: TemplatePositionPreference[];
  visualFamily: string;
  renderSignature?: string;
}

const createProfile = (profile: TemplateProfile): TemplateProfile => profile;

export const TEMPLATE_PROFILES: TemplateProfile[] = [
  createProfile({
    templateId: 'HERO',
    capabilities: {
      intro: 0.96,
      single_point: 0.9,
      list: 0.08,
      stat: 0.24,
      comparison: 0.32,
      cta: 0.92,
      quote: 0.94,
    },
    visualWeight: 'heavy',
    imageMode: 'background',
    contentMode: 'text',
    textCapacity: { min: 12, max: 180 },
    itemCapacity: { min: 0, max: 1 },
    preferredTextDensity: 'short',
    preferredPositions: ['opening', 'closing', 'first', 'last'],
    visualFamily: 'hero',
    renderSignature: 'hero-copy',
  }),
  createProfile({
    templateId: 'STAT',
    capabilities: {
      intro: 0.24,
      single_point: 0.42,
      list: 0.08,
      stat: 0.98,
      comparison: 0.24,
      cta: 0.38,
      quote: 0.08,
    },
    visualWeight: 'medium',
    imageMode: 'background',
    contentMode: 'text',
    textCapacity: { min: 18, max: 180 },
    itemCapacity: { min: 0, max: 1 },
    preferredTextDensity: 'short',
    preferredPositions: ['middle'],
    visualFamily: 'stat',
    renderSignature: 'stat-copy',
  }),
  createProfile({
    templateId: 'CHECKLIST',
    capabilities: {
      intro: 0.18,
      single_point: 0.24,
      list: 0.98,
      stat: 0.12,
      comparison: 0.18,
      cta: 0.12,
      quote: 0.06,
    },
    visualWeight: 'medium',
    imageMode: 'none',
    contentMode: 'list',
    textCapacity: { min: 24, max: 300 },
    itemCapacity: { min: 2, max: 6 },
    preferredTextDensity: 'short',
    preferredPositions: ['middle', 'closing'],
    visualFamily: 'checklist',
    renderSignature: 'checklist-flow',
  }),
  createProfile({
    templateId: 'BOX_GRID',
    capabilities: {
      intro: 0.22,
      single_point: 0.4,
      list: 0.9,
      stat: 0.18,
      comparison: 0.56,
      cta: 0.22,
      quote: 0.08,
    },
    visualWeight: 'light',
    imageMode: 'none',
    contentMode: 'mixed',
    textCapacity: { min: 20, max: 220 },
    itemCapacity: { min: 2, max: 6 },
    preferredTextDensity: 'short',
    preferredPositions: ['middle'],
    visualFamily: 'box-grid',
    renderSignature: 'box-grid',
  }),
];

const PROFILE_BY_ID = new Map(TEMPLATE_PROFILES.map((profile) => [profile.templateId, profile] as const));

export const getTemplateProfile = (templateId?: string | null) => {
  if (!templateId) return undefined;
  return PROFILE_BY_ID.get(templateId);
};

export const getProfilesForType = (
  type: keyof HeuristicSlideSignalMap,
  profiles: TemplateProfile[] = TEMPLATE_PROFILES,
) => {
  const thresholdByType: Record<keyof HeuristicSlideSignalMap, number> = {
    intro: 0.1,
    single_point: 0.12,
    list: 0.12,
    stat: 0.12,
    comparison: 0.1,
    cta: 0.1,
    quote: 0.1,
  };
  const threshold = thresholdByType[type] ?? 0.1;
  const matching = profiles.filter((profile) => (profile.capabilities[type] ?? 0) >= threshold);
  if (matching.length > 0) {
    return matching.sort((left, right) => (right.capabilities[type] ?? 0) - (left.capabilities[type] ?? 0));
  }

  if (type === 'quote' || type === 'single_point') {
    return profiles.filter((profile) => (profile.capabilities.quote ?? 0) > 0 || (profile.capabilities.single_point ?? 0) > 0);
  }

  return profiles;
};
