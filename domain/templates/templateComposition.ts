import type { SlideDefinition } from '../../types';
import { contentTemplateRegistry } from './ContentTemplateRegistry.ts';
import { imageLayoutRegistry } from './ImageLayoutRegistry.ts';

type CanonicalComposition = {
  contentTemplateId: string;
  imageLayoutId: string;
};

const DEFAULT_CANONICAL_COMPOSITIONS: Record<string, CanonicalComposition> = {
  HERO: { contentTemplateId: 'HERO', imageLayoutId: 'IMAGE_NONE' },
  STAT: { contentTemplateId: 'STAT', imageLayoutId: 'IMAGE_NONE' },
  CHECKLIST: { contentTemplateId: 'CHECKLIST', imageLayoutId: 'IMAGE_NONE' },
  BOX_GRID: { contentTemplateId: 'BOX_GRID', imageLayoutId: 'IMAGE_NONE' },
};

const resolveDefaultComposition = (templateId: string): CanonicalComposition => (
  DEFAULT_CANONICAL_COMPOSITIONS[templateId] ?? DEFAULT_CANONICAL_COMPOSITIONS.HERO
);

const resolveImageLayoutFromSlide = (slide: SlideDefinition, fallbackImageLayoutId: string) => {
  const imageType = slide.image?.type;
  const position = slide.image?.position ?? 'right';
  const fadeSide = slide.options?.fadeSide ?? position;
  const normalizeFadeLayout = () => {
    if (fadeSide === 'right') return 'IMAGE_FADE_RIGHT';
    if (fadeSide === 'top') return 'IMAGE_FADE_TOP';
    if (fadeSide === 'bottom') return 'IMAGE_FADE_BOTTOM';
    return 'IMAGE_FADE_LEFT';
  };

  if (slide.imageLayout) {
    if (
      slide.imageLayout === 'IMAGE_FADE_LEFT' ||
      slide.imageLayout === 'IMAGE_FADE_RIGHT' ||
      slide.imageLayout === 'IMAGE_FADE_TOP' ||
      slide.imageLayout === 'IMAGE_FADE_BOTTOM'
    ) {
      return normalizeFadeLayout();
    }
    return slide.imageLayout;
  }

  if (slide.options?.backgroundImage) {
    if (fallbackImageLayoutId.startsWith('IMAGE_FADE_')) return normalizeFadeLayout();
    return fallbackImageLayoutId === 'IMAGE_NONE' ? 'IMAGE_BACKGROUND' : fallbackImageLayoutId;
  }

  if (imageType === 'IMAGE_BACKGROUND' || imageType === 'IMAGE_SELECT') {
    if (fallbackImageLayoutId.startsWith('IMAGE_FADE_')) return normalizeFadeLayout();
    return 'IMAGE_BACKGROUND';
  }

  if (imageType === 'IMAGE_GLASS_CARD') {
    return 'IMAGE_GLASS_CARD';
  }

  if (imageType === 'IMAGE_SPLIT_HALF') {
    if (position === 'right') return 'IMAGE_SPLIT_RIGHT';
    if (position === 'top') return 'IMAGE_SPLIT_TOP';
    if (position === 'bottom') return 'IMAGE_SPLIT_BOTTOM';
    return 'IMAGE_SPLIT_LEFT';
  }

  if (imageType === 'IMAGE_WAVE') {
    return 'IMAGE_WAVE_BOTTOM';
  }

  if (imageType === 'IMAGE_BOX') {
    if (position === 'top') return 'IMAGE_STACK_BOX_TOP';
    if (position === 'bottom' && slide.imageLayout === 'IMAGE_STACK_BOX_BOTTOM') return 'IMAGE_STACK_BOX_BOTTOM';
    if (position === 'bottom') return 'IMAGE_BOX_BOTTOM';
    return 'IMAGE_BOX_RIGHT';
  }

  return fallbackImageLayoutId;
};

export const createImageConfigFromLayout = (
  imageLayoutId: string,
  currentImage: SlideDefinition['image'],
): SlideDefinition['image'] => {
  const currentUrl = currentImage?.url;

  const isPortrait = (currentImage?.width ?? 460) < (currentImage?.height ?? 760);
  const isLandscape = (currentImage?.width ?? 760) > (currentImage?.height ?? 320);

  const portraitWidth = isLandscape ? (currentImage?.height ?? 460) : (currentImage?.width ?? 460);
  const portraitHeight = isLandscape ? (currentImage?.width ?? 760) : (currentImage?.height ?? 760);
  
  const landscapeWidth = isPortrait ? (currentImage?.height ?? 760) : (currentImage?.width ?? 760);
  const landscapeHeight = isPortrait ? (currentImage?.width ?? 320) : (currentImage?.height ?? 320);
  
  const landscapeStageHeight = isPortrait ? (currentImage?.width ?? 500) : (currentImage?.height ?? 500);

  switch (imageLayoutId) {
    case 'IMAGE_BACKGROUND':
      return { type: 'IMAGE_BACKGROUND', url: currentUrl, overlay: currentImage?.overlay ?? 'dark' };
    case 'IMAGE_FADE_LEFT':
      return { type: 'IMAGE_BACKGROUND', url: currentUrl, position: 'left', overlay: currentImage?.overlay ?? 'dark' };
    case 'IMAGE_FADE_RIGHT':
      return { type: 'IMAGE_BACKGROUND', url: currentUrl, position: 'right', overlay: currentImage?.overlay ?? 'dark' };
    case 'IMAGE_FADE_TOP':
      return { type: 'IMAGE_BACKGROUND', url: currentUrl, position: 'top', overlay: currentImage?.overlay ?? 'dark' };
    case 'IMAGE_FADE_BOTTOM':
      return { type: 'IMAGE_BACKGROUND', url: currentUrl, position: 'bottom', overlay: currentImage?.overlay ?? 'dark' };
    case 'IMAGE_GLASS_CARD':
      return { type: 'IMAGE_GLASS_CARD', url: currentUrl, boxOverlay: currentImage?.boxOverlay ?? 'light' };
    case 'IMAGE_GLASS_BOTTOM':
      return { type: 'IMAGE_GLASS_CARD', url: currentUrl, position: 'bottom', boxOverlay: currentImage?.boxOverlay ?? 'light' };
    case 'IMAGE_STACK_BOX_TOP':
      return { type: 'IMAGE_BOX', url: currentUrl, position: 'top', width: landscapeWidth, height: landscapeHeight };
    case 'IMAGE_STACK_BOX_BOTTOM':
      return { type: 'IMAGE_BOX', url: currentUrl, position: 'bottom', width: landscapeWidth, height: landscapeHeight };
    case 'IMAGE_SPLIT_LEFT':
      return { type: 'IMAGE_SPLIT_HALF', url: currentUrl, position: 'left' };
    case 'IMAGE_SPLIT_RIGHT':
      return { type: 'IMAGE_SPLIT_HALF', url: currentUrl, position: 'right' };
    case 'IMAGE_SPLIT_TOP':
      return { type: 'IMAGE_SPLIT_HALF', url: currentUrl, position: 'top' };
    case 'IMAGE_SPLIT_BOTTOM':
      return { type: 'IMAGE_SPLIT_HALF', url: currentUrl, position: 'bottom' };
    case 'IMAGE_BOX_BOTTOM':
      return { type: 'IMAGE_BOX', url: currentUrl, position: 'bottom', width: landscapeWidth, height: landscapeHeight };
    case 'IMAGE_BOX_RIGHT':
      return { type: 'IMAGE_BOX', url: currentUrl, position: 'right', width: portraitWidth, height: portraitHeight };
    case 'IMAGE_STAGE_LEFT':
      return { type: 'IMAGE_BOX', url: currentUrl, position: 'left', width: portraitWidth, height: portraitHeight };
    case 'IMAGE_STAGE_RIGHT':
      return { type: 'IMAGE_BOX', url: currentUrl, position: 'right', width: portraitWidth, height: portraitHeight };
    case 'IMAGE_STAGE_TOP':
      return { type: 'IMAGE_BOX', url: currentUrl, position: 'top', width: landscapeWidth, height: landscapeStageHeight };
    case 'IMAGE_STAGE_BOTTOM':
      return { type: 'IMAGE_BOX', url: currentUrl, position: 'bottom', width: landscapeWidth, height: landscapeStageHeight };
    case 'IMAGE_WAVE_BOTTOM':
      return { type: 'IMAGE_WAVE', url: currentUrl, position: 'bottom', overlay: currentImage?.overlay ?? 'none' };
    case 'IMAGE_NONE':
    default:
      return { type: 'NONE' };
  }
};

export const createOptionOverridesFromImageLayout = (imageLayoutId: string): Partial<NonNullable<SlideDefinition['options']>> => {
  switch (imageLayoutId) {
    case 'IMAGE_NONE':
    case 'IMAGE_BACKGROUND':
    case 'IMAGE_GLASS_CARD':
    case 'IMAGE_GLASS_BOTTOM':
      return {
        contentHorizontalAlign: 'center',
        contentVerticalAlign: 'center',
        contentWidthPercent: 100,
      };
    case 'IMAGE_FADE_LEFT':
      return { fadeSide: 'left', contentHorizontalAlign: 'left', contentVerticalAlign: 'center', contentWidthPercent: 58 };
    case 'IMAGE_FADE_RIGHT':
      return { fadeSide: 'right', contentHorizontalAlign: 'right', contentVerticalAlign: 'center', contentWidthPercent: 58 };
    case 'IMAGE_FADE_TOP':
      return { fadeSide: 'top', contentHorizontalAlign: 'center', contentVerticalAlign: 'top', contentWidthPercent: 72 };
    case 'IMAGE_FADE_BOTTOM':
      return { fadeSide: 'bottom', contentHorizontalAlign: 'center', contentVerticalAlign: 'bottom', contentWidthPercent: 72 };
    case 'IMAGE_SPLIT_LEFT':
    case 'IMAGE_STAGE_LEFT':
      return {
        contentHorizontalAlign: 'right',
        contentVerticalAlign: 'center',
        contentWidthPercent: 100,
      };
    case 'IMAGE_SPLIT_RIGHT':
    case 'IMAGE_BOX_RIGHT':
    case 'IMAGE_STAGE_RIGHT':
      return {
        contentHorizontalAlign: 'left',
        contentVerticalAlign: 'center',
        contentWidthPercent: 100,
      };
    case 'IMAGE_SPLIT_TOP':
    case 'IMAGE_STAGE_TOP':
      return {
        contentHorizontalAlign: 'center',
        contentVerticalAlign: 'bottom',
        contentWidthPercent: 100,
      };
    case 'IMAGE_SPLIT_BOTTOM':
    case 'IMAGE_BOX_BOTTOM':
    case 'IMAGE_STAGE_BOTTOM':
      return {
        contentHorizontalAlign: 'center',
        contentVerticalAlign: 'top',
        contentWidthPercent: 100,
      };
    case 'IMAGE_STACK_BOX_TOP':
    case 'IMAGE_STACK_BOX_BOTTOM':
      return {
        contentHorizontalAlign: 'center',
        contentVerticalAlign: 'center',
        contentWidthPercent: 100,
      };
    case 'IMAGE_WAVE_BOTTOM':
      return {
        contentHorizontalAlign: 'center',
        contentVerticalAlign: 'top',
        contentWidthPercent: 92,
      };
    default:
      return {};
  }
};

const resolveContentTemplateAlias = (id: string): string => {
  const normalized = id.toLowerCase();
  if (normalized === 'hero') return 'HERO';
  if (normalized === 'checklist') return 'CHECKLIST';
  if (normalized === 'box' || normalized === 'card' || normalized === 'box_grid') return 'BOX_GRID';
  if (normalized === 'stat') return 'STAT';
  return id;
};

export const resolveSlideComposition = (slide: SlideDefinition) => {
  const requestedTemplateId = slide.contentTemplate ?? slide.template ?? 'HERO';
  const contentTemplateId = contentTemplateRegistry.resolveId(resolveContentTemplateAlias(requestedTemplateId)) ?? 'HERO';
  const fallback = resolveDefaultComposition(contentTemplateId);
  const imageLayoutId = resolveImageLayoutFromSlide(slide, slide.imageLayout ?? fallback.imageLayoutId);

  return {
    contentTemplateId,
    imageLayoutId,
    legacyTemplateId: contentTemplateId,
    contentTemplate: contentTemplateRegistry.get(contentTemplateId),
    imageLayout: imageLayoutRegistry.get(imageLayoutId),
  };
};
