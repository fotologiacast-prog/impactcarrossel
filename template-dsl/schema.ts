
import { z } from 'zod';

export const blockSchema = z.object({
  type: z.enum(['TITLE', 'LIST', 'IMAGE', 'SPACER', 'PARAGRAPH', 'CARD', 'BADGE', 'BOX', 'USER']),
  content: z.union([z.string(), z.array(z.string())]).optional(),
  options: z.object({
    lineBreakMode: z.enum(['auto', 'manual']).optional(),
    highlight: z.string().optional(),
    variant: z.enum(['default', 'accent', 'muted', 'box', 'ghost', 'outlined', 'pill', 'oval', 'check-list', 'twitter-post']).optional(),
    size: z.enum(['sm', 'md', 'lg']).optional(),
    icon: z.string().optional(),
    customIcon: z.string().optional(),
    align: z.enum(['left', 'center', 'right']).optional(),
    fontSize: z.number().optional(),
    color: z.string().optional(),
    letterSpacing: z.number().optional(),
    lineHeight: z.number().optional(),
    textAlign: z.enum(['left', 'center', 'right']).optional(),
    fontFamily: z.string().optional(),
    fontVariant: z.enum(['padrão', 'destaque']).optional(),
    widthPercent: z.number().min(10).max(100).optional(),
    handle: z.string().optional(),
    avatar: z.string().optional(),
    nameColor: z.string().optional(),
    handleColor: z.string().optional(),
    hideName: z.boolean().optional(),
    padding: z.number().optional(),
  }).optional(),
});

export const imageConfigSchema = z.object({
  type: z.enum(['IMAGE_SELECT', 'IMAGE_BACKGROUND', 'IMAGE_BOX', 'IMAGE_GLASS_CARD', 'IMAGE_SPLIT_HALF', 'NONE']),
  url: z.string().optional(),
  overlay: z.enum(['dark', 'blur-card', 'none']).optional(),
  boxOverlay: z.enum(['dark', 'light']).optional(),
  position: z.enum(['right', 'left', 'top', 'bottom']).optional(),
  format: z.enum(['png', 'jpg']).optional(),
  
  // Outer Box Transforms
  boxRotation: z.number().optional(),
  boxScale: z.number().optional(),
  boxX: z.number().optional(),
  boxY: z.number().optional(),
  width: z.number().optional(),
  height: z.number().optional(),

  // Inner Image Transforms
  imageRotation: z.number().optional(),
  imageScale: z.number().optional(),
  imageX: z.number().optional(),
  imageY: z.number().optional(),

  backgroundOpacity: z.number().min(0).max(1).optional(),
  borderWidth: z.number().optional(),
  borderColor: z.string().optional(),
  hasShadow: z.boolean().optional(),
});

export const overlayImageSchema = z.object({
  id: z.string().optional(),
  url: z.string().optional(),
  x: z.number().optional(),
  y: z.number().optional(),
  scale: z.number().optional(),
  rotation: z.number().optional(),
  opacity: z.number().optional(),
  isFlipped: z.boolean().optional(),
});

export const slideSchema = z.object({
  template: z.string(),
  slideNumber: z.number().optional(),
  image: imageConfigSchema.optional(),
  overlayImages: z.array(overlayImageSchema).optional(),
  options: z.object({
    theme: z.enum(['dark', 'light']).optional(),
    background: z.string().optional(),
    accent: z.string().optional(),
    text: z.string().optional(),
    cardBg: z.string().optional(),
    cardTextColor: z.string().optional(),
    cardOpacity: z.number().min(0).max(1).optional(),
    hlBgColor: z.string().optional(),
    hlTextColor: z.string().optional(),
    blockGap: z.number().optional(),
    sectionGap: z.number().optional(),
    padding: z.number().optional(),
    backgroundImage: z.string().url().optional(),
    fontPadrão: z.string().optional(),
    fontDestaque: z.string().optional(),
    contentWidthPercent: z.number().min(10).max(100).optional(),
    backgroundOverlayStrength: z.number().min(0).max(1).optional(),
    backgroundOverlayColor: z.string().optional(),
    backgroundBlur: z.number().min(0).max(40).optional(),
    boxGroupAlign: z.enum(['left', 'center', 'right']).optional(),
    boxGroupLayout: z.enum(['auto', 'row', 'grid', 'stack']).optional(),
    fadeSide: z.enum(['left', 'right', 'top', 'bottom']).optional(),
    fadeStrength: z.number().min(0).max(1).optional(),
    fadeBlur: z.number().min(0).max(40).optional(),
    preserveHighlights: z.number().min(0).max(1).optional(),
    liftShadows: z.number().min(0).max(1).optional(),
    texture: z.object({
      type: z.enum(['grain', 'paper', 'dust', 'none']),
      amount: z.number().min(0).max(1).optional(),
      blendMode: z.string().optional(),
    }).optional(),
    postFX: z.object({
      noiseAmount: z.number().min(0).max(1).optional(),
      noiseMode: z.string().optional(),
      lightingIntensity: z.number().min(0).max(1).optional(),
      clarity: z.number().min(0).max(1).optional(),
      vignette: z.number().min(0).max(1).optional(),
    }).optional(),
  }).optional(),
  blocks: z.array(blockSchema).max(15),
});

export const customFontSchema = z.object({
  id: z.string(),
  name: z.string(),
  family: z.string(),
  url: z.string().url(),
});

export const brandThemeSchema = z.object({
  paletteId: z.string().optional(),
  colors: z.array(z.string()).optional(),
  background: z.string().optional(),
  text: z.string().optional(),
  accent: z.string().optional(),
  cardBg: z.string().optional(),
  cardTextColor: z.string().optional(),
  hlBgColor: z.string().optional(),
  hlTextColor: z.string().optional(),
  fontPadrão: z.string().optional(),
  fontDestaque: z.string().optional(),
  white: z.string().optional(),
  black: z.string().optional(),
});

export const carouselSchema = z.object({
  slides: z.array(slideSchema).min(0).max(20),
  customFonts: z.array(customFontSchema).optional(),
  brandTheme: brandThemeSchema.optional(),
  projectFX: z.object({
    noiseAmount: z.number().min(0).max(1).optional(),
    noiseMode: z.string().optional(),
    lightingIntensity: z.number().min(0).max(1).optional(),
    clarity: z.number().min(0).max(1).optional(),
    vignette: z.number().min(0).max(1).optional(),
  }).optional(),
});

export const templateDefSchema = z.object({
  name: z.string().min(3).max(40),
  description: z.string().min(10, "Description must be at least 10 characters."),
  layoutType: z.enum(['CENTERED', 'STACKED', 'SPLIT_IMAGE_TOP', 'SPLIT_IMAGE_SIDE', 'EDITORIAL', 'GRID']),
  allowedBlocks: z.array(z.enum(['TITLE', 'LIST', 'IMAGE', 'SPACER', 'PARAGRAPH', 'CARD', 'BADGE', 'BOX', 'USER'])).min(1),
  maxBlocks: z.number().optional(),
});

export type ValidatedCarousel = z.infer<typeof carouselSchema>;
export type ValidatedSlide = z.infer<typeof slideSchema>;
export type ValidatedTemplate = z.infer<typeof templateDefSchema>;
