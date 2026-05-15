import type { SlideDefinition } from '../types';
import { getContrastTextColor } from './branding';

export type StudioMode = 'guided' | 'advanced';
export type GuidedStepId = 'client' | 'visual' | 'script' | 'images' | 'finish' | 'review';
export type GuidedStartActionId = 'script' | 'import' | 'advanced';
export type GuidedDensity = 'compact' | 'balanced' | 'airy';
export type GuidedContrast = 'soft' | 'medium' | 'strong';

export const GUIDED_STEPS: { id: GuidedStepId; label: string; description: string }[] = [
  { id: 'client', label: 'Cliente', description: 'Identidade' },
  { id: 'visual', label: 'Visual', description: 'Estilo' },
  { id: 'script', label: 'Roteiro', description: 'Conteudo' },
  { id: 'images', label: 'Imagens', description: 'Checklist' },
  { id: 'finish', label: 'Acabamento', description: 'FX' },
  { id: 'review', label: 'Revisao', description: 'Baixar' },
];

export const GUIDED_START_ACTIONS: { id: GuidedStartActionId; label: string; description: string }[] = [
  { id: 'script', label: 'Comecar com roteiro', description: 'Cole um roteiro bruto e gere a estrutura inicial.' },
  { id: 'import', label: 'Importar JSON', description: 'Abra um projeto existente para revisar no fluxo guiado.' },
  { id: 'advanced', label: 'Abrir editor livre', description: 'Entre no modo profissional com todos os controles.' },
];

export type GuidedVisualPreset = {
  id: 'clean' | 'impact' | 'premium' | 'editorial' | 'medical-discreet';
  label: string;
  description: string;
  density: GuidedDensity;
  contrast: GuidedContrast;
  options: {
    padding: number;
    blockGap: number;
    background?: string;
    text?: string;
    accent?: string;
    cardOpacity?: number;
  };
};

export const VISUAL_PRESETS: GuidedVisualPreset[] = [
  {
    id: 'clean',
    label: 'Clean',
    description: 'Mais respiro, leitura leve e poucos efeitos.',
    density: 'airy',
    contrast: 'soft',
    options: { padding: 104, blockGap: 30, background: '#F5F3EE', text: '#141414', accent: '#B17448', cardOpacity: 0.92 },
  },
  {
    id: 'impact',
    label: 'Impacto',
    description: 'Mais contraste, texto forte e leitura rapida.',
    density: 'compact',
    contrast: 'strong',
    options: { padding: 72, blockGap: 20, background: '#0D0D0D', text: '#F5F3EE', accent: '#EAB308', cardOpacity: 1 },
  },
  {
    id: 'premium',
    label: 'Premium',
    description: 'Sofisticado, contido e com destaque elegante.',
    density: 'balanced',
    contrast: 'medium',
    options: { padding: 92, blockGap: 26, background: '#11100E', text: '#F5F0E8', accent: '#C59A5B', cardOpacity: 0.94 },
  },
  {
    id: 'editorial',
    label: 'Editorial',
    description: 'Composicao de revista, contraste bom e ritmo de leitura.',
    density: 'balanced',
    contrast: 'medium',
    options: { padding: 84, blockGap: 24, background: '#ECEBE7', text: '#202020', accent: '#A76F45', cardOpacity: 0.96 },
  },
  {
    id: 'medical-discreet',
    label: 'Medico discreto',
    description: 'Serio, claro e sem exagero visual.',
    density: 'balanced',
    contrast: 'soft',
    options: { padding: 90, blockGap: 24, background: '#F4F5F2', text: '#252827', accent: '#7EA092', cardOpacity: 0.9 },
  },
];

export type GuidedFinishPreset = {
  id: 'clean' | 'cinematic-light' | 'photographic' | 'dramatic' | 'none';
  label: string;
  description: string;
  projectFX: {
    noiseAmount: number;
    vignette: number;
  };
};

export const FINISH_PRESETS: GuidedFinishPreset[] = [
  { id: 'clean', label: 'Limpo', description: 'Acabamento discreto e polido.', projectFX: { noiseAmount: 0.02, vignette: 0.04 } },
  { id: 'cinematic-light', label: 'Cinematico leve', description: 'Profundidade suave sem pesar.', projectFX: { noiseAmount: 0.06, vignette: 0.18 } },
  { id: 'photographic', label: 'Fotografico', description: 'Textura sutil e leitura de imagem.', projectFX: { noiseAmount: 0.09, vignette: 0.12 } },
  { id: 'dramatic', label: 'Dramatico', description: 'Bordas mais fortes e clima intenso.', projectFX: { noiseAmount: 0.12, vignette: 0.34 } },
  { id: 'none', label: 'Sem efeitos', description: 'Render direto, sem textura ou vinheta.', projectFX: { noiseAmount: 0, vignette: 0 } },
];

export type SlideImageGuidanceStatus = 'optional' | 'recommended' | 'not-needed' | 'ok' | 'review-crop';

export type SlideImageGuidance = {
  status: SlideImageGuidanceStatus;
  label: string;
  tone: 'muted' | 'warning' | 'success';
};

const hasImageUrl = (slide: Partial<SlideDefinition>) =>
  Boolean(slide.image?.url || slide.options?.backgroundImage || slide.cover?.images?.backgroundImage || slide.cover?.images?.foregroundImage);

const slideNeedsImage = (slide: Partial<SlideDefinition>) => {
  const layout = slide.imageLayout || slide.image?.type;
  if (!layout || layout === 'IMAGE_NONE' || layout === 'NONE') return false;
  return String(layout).startsWith('IMAGE_') && layout !== 'IMAGE_NONE';
};

export const getSlideImageGuidance = (
  slide: Partial<SlideDefinition>,
  index: number,
): SlideImageGuidance => {
  if (hasImageUrl(slide)) {
    const needsCropReview = Boolean(slide.image?.url && slide.image?.type && slide.image.type !== 'IMAGE_NONE' && !slide.image?.naturalWidth);
    return needsCropReview
      ? { status: 'review-crop', label: `Slide ${index + 1}: revisar corte`, tone: 'warning' }
      : { status: 'ok', label: `Slide ${index + 1}: imagem ok`, tone: 'success' };
  }

  if (slide.cover || index === 0) {
    return { status: 'optional', label: `Slide ${index + 1}: imagem nao obrigatoria`, tone: 'muted' };
  }

  if (slideNeedsImage(slide)) {
    return { status: 'recommended', label: `Slide ${index + 1}: adicionar imagem recomendada`, tone: 'warning' };
  }

  return { status: 'not-needed', label: `Slide ${index + 1}: sem imagem necessario`, tone: 'muted' };
};

const isCtaSlide = (slide: Partial<SlideDefinition>) =>
  slide.blocks?.some((block) =>
    block.type === 'CTA'
    || block.options?.semanticRole === 'cta'
    || (block.type === 'BADGE' && String(block.content || '').toLowerCase().includes('salv')),
  ) || false;

const isListSlide = (slide: Partial<SlideDefinition>) =>
  slide.contentTemplate === 'CHECKLIST'
  || slide.template === 'CHECKLIST'
  || slide.blocks?.some((block) => block.type === 'LIST')
  || false;

export const getGuidedScriptSummary = (slides: Partial<SlideDefinition>[] = []) => {
  if (slides.length === 0) return 'Nenhum slide gerado ainda.';

  const coverCount = slides.filter((slide, index) => slide.cover || index === 0).length;
  const listCount = slides.filter((slide, index) => index !== 0 && isListSlide(slide)).length;
  const ctaCount = slides.filter((slide, index) => index !== 0 && isCtaSlide(slide)).length;
  const explanatoryCount = Math.max(0, slides.length - coverCount - listCount - ctaCount);

  return `Encontramos ${slides.length} slides: ${coverCount} ${coverCount === 1 ? 'capa' : 'capas'}, ${explanatoryCount} ${explanatoryCount === 1 ? 'explicativo' : 'explicativos'}, ${listCount} ${listCount === 1 ? 'lista' : 'listas'} e ${ctaCount} CTA.`;
};

export type GuidedReviewIssue = {
  slideIndex: number;
  type: 'image-recommended' | 'crop-review' | 'contrast-low' | 'layout-compressed';
  label: string;
};

const parseHex = (value?: string) => {
  if (!value || !/^#[0-9a-f]{6}$/i.test(value)) return null;
  const numeric = Number.parseInt(value.slice(1), 16);
  return {
    r: (numeric >> 16) & 255,
    g: (numeric >> 8) & 255,
    b: numeric & 255,
  };
};

const luminance = (value: number) => {
  const normalized = value / 255;
  return normalized <= 0.03928
    ? normalized / 12.92
    : ((normalized + 0.055) / 1.055) ** 2.4;
};

const contrastRatio = (foreground?: string, background?: string) => {
  const fg = parseHex(foreground);
  const bg = parseHex(background);
  if (!fg || !bg) return 21;

  const fgL = 0.2126 * luminance(fg.r) + 0.7152 * luminance(fg.g) + 0.0722 * luminance(fg.b);
  const bgL = 0.2126 * luminance(bg.r) + 0.7152 * luminance(bg.g) + 0.0722 * luminance(bg.b);
  const lighter = Math.max(fgL, bgL);
  const darker = Math.min(fgL, bgL);
  return (lighter + 0.05) / (darker + 0.05);
};

export const getGuidedReviewIssues = (slides: Partial<SlideDefinition>[] = []): GuidedReviewIssue[] => {
  const issues: GuidedReviewIssue[] = [];

  slides.forEach((slide, index) => {
    const guidance = getSlideImageGuidance(slide, index);
    if (guidance.status === 'recommended') {
      issues.push({ slideIndex: index, type: 'image-recommended', label: guidance.label });
    }
    if (guidance.status === 'review-crop') {
      issues.push({ slideIndex: index, type: 'crop-review', label: guidance.label });
    }

    const background = slide.options?.background;
    const text = slide.options?.text || (background ? getContrastTextColor(background) : undefined);
    if (background && text && contrastRatio(text, background) < 3.8) {
      issues.push({ slideIndex: index, type: 'contrast-low', label: `Slide ${index + 1}: contraste baixo` });
    }

    if ((slide as any).layoutStatus === 'fits_shrunk') {
      issues.push({ slideIndex: index, type: 'layout-compressed', label: `Slide ${index + 1}: layout comprimido` });
    }
  });

  return issues;
};
