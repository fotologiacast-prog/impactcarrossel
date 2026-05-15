
import React, { useCallback, useEffect, useMemo, useRef, useState } from 'react'
import Moveable from 'react-moveable'
import { ValidatedSlide } from '../template-dsl/schema'
import { TOKENS } from '../design-tokens/tokens'
import { CoverCanvas } from './CoverCanvas'
import { renderBlock } from './renderBlock'
import { resolveSlideComposition } from '../domain/templates/templateComposition'
import { Image as ImageIcon, Box, User, Layers, Package } from 'lucide-react'
import { Block, BrandTheme, CustomFont, ProjectFX } from '../types'
import {
  getFontFaceDefinition,
  getContrastTextColor,
  getPreferredFontsForInjection,
  mergeSlideOptionsWithBrandTheme,
  quoteFontFamily,
} from '../utils/branding'
import { getProfileFocusVisualStyles } from '../utils/profile-focus'
import {
  clampImageBoxDimensions,
  getImageBoxGuides,
  resolveImageBoxSnapLock,
  type ImageBoxGuides,
  type ImageBoxRect,
} from '../utils/image-box-interaction'
import { areaLayoutRegistry } from '../domain/layouts/AreaLayoutRegistry'
import { findSlideArea, resolveAreaFramePx, resolveAreaInnerFramePx } from '../utils/area-layout'
import { processAreaBlocks } from '../utils/area-block-processor'
import { getFadeReadingMetrics } from '../utils/hero-layout-metrics'
import { shouldUseChecklistShell } from '../utils/content-shells'
import { clampCoverTranslation, clampCoverTranslationRange, resolveCoverTransformMetrics } from '../utils/cover-transform'
import { resolveImagePreviewFrame } from '../utils/image-preview-frame'
import { fitTextToConstraint } from '../utils/text-fit'
import type { CompactLayoutContext } from './block-layout-context'
import { shouldTreatImageAsCutout } from '../utils/image-cutout'

const PHOTOSHOP_NOISE_TILE_SVG = `<svg xmlns="http://www.w3.org/2000/svg" width="256" height="256" viewBox="0 0 256 256"><filter id="ps-noise" x="0" y="0" width="100%" height="100%" color-interpolation-filters="sRGB"><feTurbulence type="turbulence" baseFrequency="0.92" numOctaves="1" seed="73" stitchTiles="stitch" result="noise"/><feComponentTransfer><feFuncR type="discrete" tableValues="0 .16 .32 .5 .68 .84 1"/><feFuncG type="discrete" tableValues="0 .18 .36 .5 .64 .82 1"/><feFuncB type="discrete" tableValues="0 .14 .30 .5 .70 .86 1"/></feComponentTransfer></filter><rect width="256" height="256" filter="url(#ps-noise)"/></svg>`;
const PHOTOSHOP_NOISE_TILE_URL = `url("data:image/svg+xml,${encodeURIComponent(PHOTOSHOP_NOISE_TILE_SVG)}")`;

type SlideCanvasProps = {
  slide: ValidatedSlide, 
  index: number, 
  canvasRef: React.RefObject<HTMLDivElement>,
  onEditIcon?: (block: Block, index: number, itemIndex?: number) => void,
  customFonts?: CustomFont[],
  brandTheme?: BrandTheme,
  projectFX?: ProjectFX,
  onUpdateImage?: (updates: { path: (string | number)[]; value: any }[]) => void,
  onSelectionChange?: (selection: { type: 'IMAGE_BOX'; mode: 'box' | 'image' } | null) => void,
  onSelectBlock?: (block: Block, index: number) => void,
  interactionScale?: number,
  debugMode?: boolean,
}

const useCanvasTheme = (
  brandTheme: BrandTheme | undefined,
  slideOptions: ValidatedSlide['options'],
  projectFX: ProjectFX | undefined,
) => {
  const effectiveOptions = useMemo(
    () => mergeSlideOptionsWithBrandTheme(brandTheme, slideOptions, projectFX),
    [brandTheme, projectFX, slideOptions],
  )

  const theme = useMemo(() => {
    const baseTextSecondary = effectiveOptions.text
      ? `${effectiveOptions.text}F5`
      : `${TOKENS.colors.textPrimary}F5`;

    return {
      ...TOKENS,
      typography: {
        ...TOKENS.typography,
        fontFamily: quoteFontFamily(effectiveOptions.fontPadrão, TOKENS.typography.fontFamily),
        fontFamilySecondary: quoteFontFamily(effectiveOptions.fontDestaque || effectiveOptions.fontPadrão, TOKENS.typography.fontFamily),
      },
      colors: {
        ...TOKENS.colors,
        background: effectiveOptions.background || TOKENS.colors.background,
        textPrimary: effectiveOptions.text || TOKENS.colors.textPrimary,
        textSecondary: baseTextSecondary,
        accent: effectiveOptions.accent || TOKENS.colors.accent,
        highlight: effectiveOptions.accent || TOKENS.colors.highlight,
        cardBg: effectiveOptions.cardBg || effectiveOptions.accent || TOKENS.colors.accent,
        cardTextColor: effectiveOptions.cardTextColor,
        cardOpacity: effectiveOptions.cardOpacity !== undefined ? effectiveOptions.cardOpacity : 1,
        hlBgColor: effectiveOptions.hlBgColor || effectiveOptions.accent || TOKENS.colors.accent,
        hlTextColor: effectiveOptions.hlTextColor || effectiveOptions.black || '#000000',
        white: effectiveOptions.white,
        black: effectiveOptions.black,
      }
    }
  }, [effectiveOptions])

  return { effectiveOptions, theme }
}

const CoverSlideCanvas: React.FC<SlideCanvasProps> = ({ slide, canvasRef, brandTheme, projectFX }) => {
  const { effectiveOptions, theme } = useCanvasTheme(brandTheme, slide.options, projectFX)

  return (
    <div
      ref={canvasRef}
      style={{ backgroundColor: theme.colors.background, color: theme.colors.textPrimary, fontFamily: theme.typography.fontFamily }}
      className="relative w-[1080px] h-[1350px] flex flex-col shadow-2xl overflow-hidden shrink-0 select-auto cursor-text"
    >
      <CoverCanvas slide={slide} theme={theme} options={effectiveOptions} />
    </div>
  )
}

const RegularSlideCanvas: React.FC<SlideCanvasProps> = ({ slide, index, canvasRef, onEditIcon, customFonts, brandTheme, projectFX, onUpdateImage, onSelectionChange, onSelectBlock, interactionScale = 1, debugMode = false }) => {
  const slideComposition = useMemo(() => resolveSlideComposition(slide), [slide])
  const { effectiveOptions, theme } = useCanvasTheme(brandTheme, slide.options, projectFX)
  const contentTemplateId = slideComposition.contentTemplateId
  const imageLayoutId = slideComposition.imageLayoutId
  const isFadeLayout = imageLayoutId === 'IMAGE_FADE_LEFT' || imageLayoutId === 'IMAGE_FADE_RIGHT' || imageLayoutId === 'IMAGE_FADE_TOP' || imageLayoutId === 'IMAGE_FADE_BOTTOM'
  const isGlassLayout = imageLayoutId === 'IMAGE_GLASS_CARD'
  const isSplitLayout = imageLayoutId === 'IMAGE_SPLIT_LEFT' || imageLayoutId === 'IMAGE_SPLIT_RIGHT' || imageLayoutId === 'IMAGE_SPLIT_TOP' || imageLayoutId === 'IMAGE_SPLIT_BOTTOM'
  const isStageLayout = imageLayoutId === 'IMAGE_STAGE_LEFT' || imageLayoutId === 'IMAGE_STAGE_RIGHT' || imageLayoutId === 'IMAGE_STAGE_TOP' || imageLayoutId === 'IMAGE_STAGE_BOTTOM'
  const isWaveLayout = imageLayoutId === 'IMAGE_WAVE_BOTTOM'
  const isBoxGridContent = contentTemplateId === 'BOX_GRID'
  const isChecklistContent = contentTemplateId === 'CHECKLIST'
  const isHeroContent = contentTemplateId === 'HERO'
  const isStatContent = contentTemplateId === 'STAT'
  const isHeroSocial = isHeroContent && slide.options?.heroVariant === 'social' && imageLayoutId === 'IMAGE_NONE'

  const imageConfig = slide.image;
  const safeInteractionScale = Math.max(0.01, interactionScale || 1);
  const overlayImages = slide.overlayImages || [];
  const texture = slide.options?.texture;
  const fx = effectiveOptions.postFX;
  const isCutoutImage = shouldTreatImageAsCutout(imageConfig);
  const imageBoxTargetRef = useRef<HTMLDivElement>(null);
  const interactionStartRef = useRef<{
    naturalLeft: number;
    naturalTop: number;
    width: number;
    height: number;
  } | null>(null);
  const snapLockRef = useRef<{ x: boolean; y: boolean }>({ x: false, y: false });
  const [selectedImageBoxMode, setSelectedImageBoxMode] = useState<'box' | 'image' | null>(null);
  const [imageBoxDraft, setImageBoxDraft] = useState<{
    boxX: number;
    boxY: number;
    width: number;
    height: number;
    imageX: number;
    imageY: number;
  } | null>(null);
  const imageBoxDraftRef = useRef<typeof imageBoxDraft>(null);
  const imageBoxFrameRef = useRef<number | null>(null);
  const pendingImageBoxStateRef = useRef<{
    draft: NonNullable<typeof imageBoxDraft>;
    guides: ImageBoxGuides | null;
    rect: ImageBoxRect | null;
  } | null>(null);
  const [imageBoxGuides, setImageBoxGuides] = useState<ImageBoxGuides | null>(null);
  const [imageBoxGuideRect, setImageBoxGuideRect] = useState<ImageBoxRect | null>(null);
  const [imageNaturalSize, setImageNaturalSize] = useState<{ width: number; height: number } | null>(null);
  const storedImageNaturalSize = imageConfig?.naturalWidth && imageConfig?.naturalHeight
    ? {
        width: imageConfig.naturalWidth,
        height: imageConfig.naturalHeight,
      }
    : null;

  const blockGap = effectiveOptions.blockGap !== undefined ? effectiveOptions.blockGap : 24;
  const sectionGap = effectiveOptions.sectionGap !== undefined ? effectiveOptions.sectionGap : 48;
  const padding = effectiveOptions.padding !== undefined ? effectiveOptions.padding : 80;
  const contentOffsetX = effectiveOptions.contentOffsetX || 0;
  const contentOffsetY = effectiveOptions.contentOffsetY || 0;
  const contentScale = effectiveOptions.contentScale || 1;
  const contentOffsetStyle: React.CSSProperties | undefined = (contentOffsetX || contentOffsetY || contentScale !== 1)
    ? {
        transform: `translate(${contentOffsetX}px, ${contentOffsetY}px) scale(${contentScale})`,
        transformOrigin: 'center',
      }
    : undefined;
  const resolvedImageNaturalSize = imageNaturalSize || storedImageNaturalSize;
  const debugPreviewFrame = useMemo(
    () => resolveImagePreviewFrame({
      imageLayoutId,
      imageWidth: imageConfig?.width,
      imageHeight: imageConfig?.height,
    }),
    [imageConfig?.height, imageConfig?.width, imageLayoutId],
  );
  const debugViewport = (isFadeLayout || isWaveLayout || imageLayoutId === 'IMAGE_BACKGROUND' || isSplitLayout || isStageLayout || imageLayoutId === 'IMAGE_BOX_RIGHT' || imageLayoutId === 'IMAGE_BOX_BOTTOM')
    ? { width: debugPreviewFrame.width, height: debugPreviewFrame.height, coverRect: debugPreviewFrame.coverRect }
    : null;
  const debugCoverMetrics = resolvedImageNaturalSize && debugViewport && !isCutoutImage
    ? resolveCoverTransformMetrics({
        viewportWidth: debugViewport.coverRect?.width || debugViewport.width,
        viewportHeight: debugViewport.coverRect?.height || debugViewport.height,
        imageWidth: resolvedImageNaturalSize.width,
        imageHeight: resolvedImageNaturalSize.height,
        scale: imageConfig?.imageScale ?? 1,
      })
    : null;
  const debugClampedImageX = debugCoverMetrics ? clampCoverTranslation(imageConfig?.imageX ?? 0, debugCoverMetrics.maxOffsetX) : undefined;
  const debugClampedImageY = debugCoverMetrics ? clampCoverTranslation(imageConfig?.imageY ?? 0, debugCoverMetrics.maxOffsetY) : undefined;
  const debugExpectsCoverTransform = Boolean(
    imageConfig?.url
    && !isCutoutImage
    && (
      isFadeLayout
      || isWaveLayout
      || imageLayoutId === 'IMAGE_BACKGROUND'
      || isSplitLayout
      || isStageLayout
      || imageLayoutId === 'IMAGE_BOX_RIGHT'
      || imageLayoutId === 'IMAGE_BOX_BOTTOM'
    ),
  );
  const debugBlockSummary = useMemo(
    () => slide.blocks.map((block, blockIndex) => ({
      index: blockIndex,
      type: block.type,
      fontSize: typeof block.options?.fontSize === 'number' ? block.options.fontSize : undefined,
      variant: typeof block.options?.variant === 'string' ? block.options.variant : undefined,
    })),
    [slide.blocks],
  );

  const getDefaultImageBoxHeight = useCallback(() => {
    const position = imageConfig?.position || 'right';
    return position === 'left' || position === 'right' ? 760 : 500;
  }, [imageConfig?.position]);

  const getCurrentImageBoxState = useCallback(() => ({
    boxX: imageBoxDraft?.boxX ?? imageConfig?.boxX ?? 0,
    boxY: imageBoxDraft?.boxY ?? imageConfig?.boxY ?? 0,
    width: imageBoxDraft?.width ?? imageConfig?.width ?? 460,
    height: imageBoxDraft?.height ?? imageConfig?.height ?? getDefaultImageBoxHeight(),
    imageX: imageBoxDraft?.imageX ?? imageConfig?.imageX ?? 0,
    imageY: imageBoxDraft?.imageY ?? imageConfig?.imageY ?? 0,
  }), [
    getDefaultImageBoxHeight,
    imageBoxDraft?.boxX,
    imageBoxDraft?.boxY,
    imageBoxDraft?.height,
    imageBoxDraft?.imageX,
    imageBoxDraft?.imageY,
    imageBoxDraft?.width,
    imageConfig?.boxX,
    imageConfig?.boxY,
    imageConfig?.height,
    imageConfig?.imageX,
    imageConfig?.imageY,
    imageConfig?.width,
  ]);

  const commitImageBoxDraft = useCallback((draft: NonNullable<typeof imageBoxDraft>) => {
    onUpdateImage?.([
      { path: ['image', 'boxX'], value: Math.round(draft.boxX) },
      { path: ['image', 'boxY'], value: Math.round(draft.boxY) },
      { path: ['image', 'width'], value: Math.round(draft.width) },
      { path: ['image', 'height'], value: Math.round(draft.height) },
      { path: ['image', 'imageX'], value: Math.round(draft.imageX) },
      { path: ['image', 'imageY'], value: Math.round(draft.imageY) },
    ]);
  }, [onUpdateImage]);

  useEffect(() => {
    imageBoxDraftRef.current = imageBoxDraft;
  }, [imageBoxDraft]);

  const flushPendingImageBoxState = useCallback(() => {
    if (imageBoxFrameRef.current !== null) {
      window.cancelAnimationFrame(imageBoxFrameRef.current);
      imageBoxFrameRef.current = null;
    }

    const pending = pendingImageBoxStateRef.current;
    pendingImageBoxStateRef.current = null;
    if (!pending) return imageBoxDraftRef.current;

    imageBoxDraftRef.current = pending.draft;
    setImageBoxDraft(pending.draft);
    setImageBoxGuides(pending.guides);
    setImageBoxGuideRect(pending.rect);
    return pending.draft;
  }, []);

  const scheduleImageBoxState = useCallback((
    draft: NonNullable<typeof imageBoxDraft>,
    guides: ImageBoxGuides | null,
    rect: ImageBoxRect | null,
  ) => {
    pendingImageBoxStateRef.current = { draft, guides, rect };
    if (imageBoxFrameRef.current !== null) return;

    imageBoxFrameRef.current = window.requestAnimationFrame(() => {
      imageBoxFrameRef.current = null;
      const pending = pendingImageBoxStateRef.current;
      pendingImageBoxStateRef.current = null;
      if (!pending) return;

      imageBoxDraftRef.current = pending.draft;
      setImageBoxDraft(pending.draft);
      setImageBoxGuides(pending.guides);
      setImageBoxGuideRect(pending.rect);
    });
  }, []);

  const updateGuidesFromRect = useCallback((rect: ImageBoxRect | null) => {
    if (!rect || imageConfig?.type !== 'IMAGE_BOX') {
      setImageBoxGuides(null);
      setImageBoxGuideRect(null);
      return;
    }

    const nextGuides = getImageBoxGuides(rect, { width: 1080, height: 1350 });
    setImageBoxGuides(nextGuides);
    setImageBoxGuideRect(rect);
  }, [imageConfig?.type]);

  useEffect(() => {
    setImageBoxDraft(null);
    setImageBoxGuides(null);
    setImageBoxGuideRect(null);
    setSelectedImageBoxMode(null);
    snapLockRef.current = { x: false, y: false };
  }, [index, slide.template, imageConfig?.type, imageConfig?.url]);

  useEffect(() => {
    if (storedImageNaturalSize) {
      setImageNaturalSize(storedImageNaturalSize);
      return;
    }

    if (typeof window === 'undefined' || !imageConfig?.url) {
      setImageNaturalSize(null);
      return;
    }

    let isActive = true;
    const image = new window.Image();
    image.onload = () => {
      if (!isActive) return;
      setImageNaturalSize({
        width: image.naturalWidth || image.width || 1,
        height: image.naturalHeight || image.height || 1,
      });
    };
    image.onerror = () => {
      if (!isActive) return;
      setImageNaturalSize(null);
    };
    image.src = imageConfig.url;

    return () => {
      isActive = false;
    };
  }, [imageConfig?.url, storedImageNaturalSize]);

  useEffect(() => {
    if (imageConfig?.type !== 'IMAGE_BOX' || !selectedImageBoxMode) {
      onSelectionChange?.(null);
      return;
    }

    onSelectionChange?.({ type: 'IMAGE_BOX', mode: selectedImageBoxMode });
  }, [imageConfig?.type, onSelectionChange, selectedImageBoxMode]);

  useEffect(() => {
    if (imageConfig?.type !== 'IMAGE_BOX' || !selectedImageBoxMode || !canvasRef.current || !imageBoxTargetRef.current) {
      if (!selectedImageBoxMode) {
        setImageBoxGuides(null);
        setImageBoxGuideRect(null);
      }
      return;
    }

    const canvasBounds = canvasRef.current.getBoundingClientRect();
    const targetBounds = imageBoxTargetRef.current.getBoundingClientRect();
    updateGuidesFromRect({
      left: targetBounds.left - canvasBounds.left,
      top: targetBounds.top - canvasBounds.top,
      width: targetBounds.width,
      height: targetBounds.height,
    });
  }, [
    canvasRef,
    imageBoxDraft,
    imageConfig?.type,
    selectedImageBoxMode,
    updateGuidesFromRect,
  ]);

  useEffect(() => {
    if (!selectedImageBoxMode) return;

    const handleGlobalPointerDown = (event: PointerEvent) => {
      const target = event.target;
      const targetElement = target instanceof Element ? target : null;
      const clickedInsideCanvas = !!(targetElement && canvasRef.current?.contains(targetElement));
      const clickedInsideImageBox = !!(targetElement && imageBoxTargetRef.current?.contains(targetElement));
      const clickedMoveableControl = !!targetElement?.closest('.moveable-control-box');

      if (!clickedInsideCanvas && !clickedInsideImageBox && !clickedMoveableControl) {
        setSelectedImageBoxMode(null);
      }
    };

    document.addEventListener('pointerdown', handleGlobalPointerDown, true);
    return () => {
      document.removeEventListener('pointerdown', handleGlobalPointerDown, true);
    };
  }, [canvasRef, selectedImageBoxMode]);

  useEffect(() => () => {
    if (imageBoxFrameRef.current !== null) {
      window.cancelAnimationFrame(imageBoxFrameRef.current);
    }
  }, []);

  const handleRenderedImageLoad = useCallback((event: React.SyntheticEvent<HTMLImageElement>) => {
    const target = event.currentTarget;
    const nextWidth = target.naturalWidth || target.width || 0;
    const nextHeight = target.naturalHeight || target.height || 0;

    if (!nextWidth || !nextHeight) return;

    setImageNaturalSize((previous) => {
      if (previous && previous.width === nextWidth && previous.height === nextHeight) {
        return previous;
      }
      return {
        width: nextWidth,
        height: nextHeight,
      };
    });
  }, []);

  const renderTornPaperSVG = () => {
    if (!imageConfig?.hasTornEdges) return null;
    const maskId = `tornMask-${index}`;
    return (
      <svg width="0" height="0" className="absolute">
        <defs>
          <clipPath id={maskId} clipPathUnits="objectBoundingBox">
            <path d="M0.04,0.06 C0.1,0.04 0.15,0.08 0.2,0.05 C0.25,0.03 0.3,0.07 0.35,0.04 C0.4,0.02 0.45,0.06 0.5,0.04 C0.55,0.03 0.6,0.07 0.65,0.05 C0.7,0.03 0.75,0.06 0.8,0.04 C0.85,0.03 0.9,0.07 0.96,0.05 C0.98,0.1 0.95,0.15 0.97,0.2 C0.99,0.25 0.96,0.3 0.98,0.35 C1.0,0.4 0.97,0.45 0.99,0.5 C1.0,0.55 0.96,0.6 0.98,0.65 C1.0,0.7 0.97,0.75 0.99,0.8 C1.0,0.85 0.96,0.9 0.94,0.96 C0.9,0.98 0.85,0.95 0.8,0.97 C0.75,0.99 0.7,0.96 0.65,0.98 C0.6,1.0 0.55,0.97 0.5,0.99 C0.45,1.0 0.4,0.96 0.35,0.98 C0.3,1.0 0.25,0.97 0.2,0.99 C0.15,1.0 0.1,0.96 0.04,0.94 C0.02,0.9 0.05,0.85 0.03,0.8 C0.01,0.75 0.04,0.7 0.02,0.65 C0.0,0.6 0.03,0.55 0.01,0.5 C0.0,0.45 0.04,0.4 0.02,0.35 C0.0,0.3 0.03,0.25 0.01,0.2 C0.0,0.15 0.04,0.1 0.04,0.06 Z" />
          </clipPath>
        </defs>
      </svg>
    );
  };

  const renderImage = (
    className: string,
    fit: 'cover' | 'contain' = 'cover',
    extraStyle: React.CSSProperties = {},
    viewport?: { width: number; height: number; coverRect?: { left: number; top: number; width: number; height: number } },
  ) => {
    if (!imageConfig?.url) return null;
    const imgScale = imageConfig.imageScale ?? 1;
    const imgRotation = imageConfig.imageRotation ?? 0;
    const currentBoxState = getCurrentImageBoxState();
    const imgX = currentBoxState.imageX;
    const imgY = currentBoxState.imageY;
    const opacity = imageConfig.backgroundOpacity ?? 1;
    const maskId = `tornMask-${index}`;
    const resolvedFit = isCutoutImage ? 'contain' : fit;
    const shouldUseFreeTransform = isCutoutImage || resolvedFit === 'contain';
    const shouldUseCoverTransform = resolvedFit === 'cover' && !isCutoutImage;
    const resolvedImageNaturalSize = imageNaturalSize || storedImageNaturalSize;
    const coverFrame = viewport?.coverRect || (viewport
      ? { left: 0, top: 0, width: viewport.width, height: viewport.height }
      : null);
    const coverMetrics = shouldUseCoverTransform && resolvedImageNaturalSize && viewport
      ? resolveCoverTransformMetrics({
          viewportWidth: coverFrame?.width || viewport.width,
          viewportHeight: coverFrame?.height || viewport.height,
          imageWidth: resolvedImageNaturalSize.width,
          imageHeight: resolvedImageNaturalSize.height,
          scale: imgScale,
        })
      : null;
    const fadeSide = imageLayoutId === 'IMAGE_FADE_LEFT'
      ? 'left'
      : imageLayoutId === 'IMAGE_FADE_RIGHT'
        ? 'right'
        : imageLayoutId === 'IMAGE_FADE_TOP'
          ? 'top'
          : imageLayoutId === 'IMAGE_FADE_BOTTOM'
            ? 'bottom'
            : null;
    const fadeMetrics = fadeSide ? getFadeReadingMetrics(fadeSide, viewport?.width || 1080) : null;
    const fadeHiddenBleedX = coverMetrics && viewport && fadeMetrics && (fadeSide === 'left' || fadeSide === 'right')
      ? Math.round(viewport.width * Math.max(0.16, fadeMetrics.zoneFadeStop - 0.42))
      : 0;
    const fadeHiddenBleedY = coverMetrics && viewport && fadeMetrics && (fadeSide === 'top' || fadeSide === 'bottom')
      ? Math.round(viewport.height * Math.max(0.14, fadeMetrics.zoneFadeStop - 0.46))
      : 0;
    const clampedImageX = coverMetrics
      ? fadeSide === 'left'
        ? clampCoverTranslationRange(imgX, -coverMetrics.maxOffsetX, coverMetrics.maxOffsetX)
        : fadeSide === 'right'
          ? clampCoverTranslationRange(imgX, -coverMetrics.maxOffsetX, coverMetrics.maxOffsetX)
          : clampCoverTranslation(imgX, coverMetrics.maxOffsetX)
      : imgX;
    const clampedImageY = coverMetrics
      ? fadeSide === 'top'
        ? clampCoverTranslationRange(imgY, -coverMetrics.maxOffsetY, coverMetrics.maxOffsetY)
        : fadeSide === 'bottom'
          ? clampCoverTranslationRange(imgY, -coverMetrics.maxOffsetY, coverMetrics.maxOffsetY)
          : clampCoverTranslation(imgY, coverMetrics.maxOffsetY)
      : imgY;
    const imageTransitionClass = imageConfig.type === 'IMAGE_BOX' && selectedImageBoxMode
      ? ''
      : 'transition-all duration-300 ease-out';
    const freeFrameWidth = coverFrame?.width || viewport?.width || currentBoxState.width;
    const freeFrameHeight = coverFrame?.height || viewport?.height || currentBoxState.height;
    const freeCutoutScale = resolvedImageNaturalSize
      ? Math.min(
          freeFrameWidth / Math.max(1, resolvedImageNaturalSize.width),
          freeFrameHeight / Math.max(1, resolvedImageNaturalSize.height),
        )
      : 1;
    const freeCutoutWidth = resolvedImageNaturalSize
      ? Math.max(1, Math.round(resolvedImageNaturalSize.width * freeCutoutScale))
      : freeFrameWidth;
    const freeCutoutHeight = resolvedImageNaturalSize
      ? Math.max(1, Math.round(resolvedImageNaturalSize.height * freeCutoutScale))
      : freeFrameHeight;
    return (
      <div
        className={`${className} ${imageTransitionClass}`}
        style={{
          position: 'relative',
          clipPath: imageConfig.hasTornEdges ? `url(#${maskId})` : 'none',
          overflow: shouldUseCoverTransform ? 'hidden' : (isCutoutImage ? 'visible' : 'hidden'),
          ...extraStyle,
        }}
        data-image-positioning={shouldUseCoverTransform ? 'cover-transform' : (shouldUseFreeTransform ? 'free-transform' : 'default')}
        data-image-cutout={isCutoutImage ? 'true' : 'false'}
      >
        {isCutoutImage ? (
          <img
            src={imageConfig.url}
            className="block absolute"
            data-image-rendering="cutout-free"
            onLoad={handleRenderedImageLoad}
            style={{
              left: '50%',
              top: '50%',
              width: `${freeCutoutWidth}px`,
              height: `${freeCutoutHeight}px`,
              maxWidth: 'none',
              maxHeight: 'none',
              transform: `translate(-50%, -50%) translate(${clampedImageX}px, ${clampedImageY}px) scale(${imgScale}) rotate(${imgRotation}deg)`,
              transformOrigin: 'center',
              opacity: opacity,
            }}
            alt=""
          />
        ) : shouldUseCoverTransform && coverMetrics ? (
          <div
            className="absolute"
            style={{
              left: `${coverFrame?.left || 0}px`,
              top: `${coverFrame?.top || 0}px`,
              width: `${coverFrame?.width || viewport?.width || 0}px`,
              height: `${coverFrame?.height || viewport?.height || 0}px`,
              overflow: 'visible',
            }}
          >
            <img
              src={imageConfig.url}
              className="block absolute"
              onLoad={handleRenderedImageLoad}
              style={{
                left: '50%',
                top: '50%',
                width: `${coverMetrics.renderedWidth}px`,
                height: `${coverMetrics.renderedHeight}px`,
                maxWidth: 'none',
                maxHeight: 'none',
                minWidth: '100%',
                minHeight: '100%',
                transform: `translate(-50%, -50%) translate(${clampedImageX}px, ${clampedImageY}px) scale(${imgScale}) rotate(${imgRotation}deg)`,
                transformOrigin: 'center',
                opacity: opacity,
              }}
              alt=""
            />
          </div>
        ) : (
          <img
            src={imageConfig.url}
            className={`block w-full h-full ${resolvedFit === 'cover' ? 'object-cover' : 'object-contain'}`}
            onLoad={handleRenderedImageLoad}
            style={{
              objectPosition: shouldUseFreeTransform ? '50% 50%' : `calc(50% + ${clampedImageX}px) calc(50% + ${clampedImageY}px)`,
              transform: shouldUseFreeTransform
                ? `translate(${clampedImageX}px, ${clampedImageY}px) scale(${imgScale}) rotate(${imgRotation}deg)`
                : `scale(${imgScale}) rotate(${imgRotation}deg)`,
              transformOrigin: 'center',
              opacity: opacity,
            }}
            alt=""
          />
        )}
      </div>
    );
  };

  const renderFloatingOverlays = () => {
    if (!overlayImages || overlayImages.length === 0) return null;
    return overlayImages.map((ov, idx) => (
      <div 
        key={ov.id || idx}
        className="absolute inset-0 z-50 pointer-events-none flex items-center justify-center overflow-hidden"
      >
        <img 
          src={ov.url} 
          className="max-w-none transition-all duration-300 ease-out"
          style={{ 
            transform: `translate(${ov.x || 0}px, ${ov.y || 0}px) scale(${ov.scale || 1}) scaleX(${ov.isFlipped ? -1 : 1}) rotate(${ov.rotation || 0}deg)`,
            opacity: ov.opacity ?? 1,
            pointerEvents: 'none'
          }}
          alt={`Floating Overlay ${idx}`}
        />
      </div>
    ));
  };

  const defaultContentHorizontalAlign: 'left' | 'center' | 'right' =
    effectiveOptions.contentHorizontalAlign
    || ((isHeroContent || isStatContent || isChecklistContent) ? 'center' : 'left');

  const hasCenteredBox = slide.blocks.some((block) =>
    block.type === 'BOX' && ((block.options?.align || block.options?.textAlign) === 'center'),
  );
  const defaultTextAlign = defaultContentHorizontalAlign === 'center'
    ? 'center' as const
    : hasCenteredBox
      ? 'center' as const
      : undefined;

  const stripSocialInlineFormatting = (value?: string | string[]) => {
    const text = Array.isArray(value) ? value.join(' ') : String(value || '');
    return text
      .replace(/\[\[|\]\]|\*\*/g, '')
      .replace(/[ \t]+/g, ' ')
      .trim();
  };

  const normalizeSocialPostBlock = (block: Block): Block => {
    if (block.type === 'USER') {
      return {
        ...block,
        options: {
          ...(block.options || {}),
          variant: 'twitter-post',
          align: 'left',
          textAlign: 'left',
          widthPercent: 100,
          fontSize: 30,
          color: undefined,
          backgroundColor: undefined,
          highlightBackgroundColor: undefined,
        },
      };
    }

    if (block.type === 'TITLE') {
      return {
        type: 'TITLE',
        content: stripSocialInlineFormatting(block.content),
        options: {
          size: 'sm',
          fontVariant: 'padrão',
          fontSize: 48,
          fontWeight: 800,
          lineHeight: 1.12,
          align: 'left',
          textAlign: 'left',
          widthPercent: 100,
          color: '#141414',
          lineBreakMode: 'auto',
        },
      };
    }

    if (block.type === 'PARAGRAPH') {
      return {
        type: 'PARAGRAPH',
        content: stripSocialInlineFormatting(block.options?.manualBreaks || block.content),
        options: {
          fontVariant: 'padrão',
          fontSize: 30,
          fontWeight: 400,
          lineHeight: 1.38,
          align: 'left',
          textAlign: 'left',
          widthPercent: 100,
          color: 'rgba(20,20,20,0.72)',
          lineBreakMode: 'auto',
        },
      };
    }

    if (block.type === 'LIST') {
      return {
        type: 'PARAGRAPH',
        content: stripSocialInlineFormatting(block.content),
        options: {
          fontVariant: 'padrão',
          fontSize: 30,
          fontWeight: 400,
          lineHeight: 1.38,
          align: 'left',
          textAlign: 'left',
          widthPercent: 100,
          color: 'rgba(20,20,20,0.72)',
          lineBreakMode: 'auto',
        },
      };
    }

    if (block.type === 'BADGE' || block.type === 'BOX' || block.type === 'CARD') {
      return {
        type: 'PARAGRAPH',
        content: stripSocialInlineFormatting(block.content),
        options: {
          fontVariant: 'padrão',
          fontSize: 28,
          fontWeight: 600,
          lineHeight: 1.28,
          align: 'left',
          textAlign: 'left',
          widthPercent: 100,
          color: '#141414',
          lineBreakMode: 'auto',
        },
      };
    }

    return block;
  };

  const rebalanceSplitCompactCardLabel = (value: string) => {
    const words = value.trim().split(/\s+/).filter(Boolean);
    if (words.length < 2 || value.includes('\n')) return value;

    if (words.length === 2) {
      return `${words[0]}\n${words[1]}`;
    }

    if (words.length === 3) {
      const optionA = `${words[0]} ${words[1]}\n${words[2]}`;
      const optionB = `${words[0]}\n${words[1]} ${words[2]}`;
      return optionA.length <= optionB.length ? optionA : optionB;
    }

    const midpoint = Math.ceil(words.length / 2);
    const firstLine = words.slice(0, midpoint).join(' ');
    const secondLine = words.slice(midpoint).join(' ');
    return firstLine && secondLine ? `${firstLine}\n${secondLine}` : value;
  };

  const estimateSplitCompactBoxFontSize = (
    block: Block,
    compactLayout: CompactLayoutContext,
  ) => {
    const baseFontSize = block.options?.fontSize ?? 36;
    const widthCompactScale = compactLayout.availableWidth
      ? Math.min(1, compactLayout.availableWidth / 860)
      : 1;
    const heightCompactScale = compactLayout.availableHeight
      ? Math.min(1, compactLayout.availableHeight / 520)
      : 1;
    const compactScale = Math.max(0.58, Math.min(widthCompactScale, heightCompactScale));
    const horizontalPadding = Math.max(14, Math.round(16 * compactScale));
    const balancedText = rebalanceSplitCompactCardLabel(String(block.content || ''));

    return fitTextToConstraint(balancedText, {
      availableWidth: Math.max(220, (compactLayout.availableWidth || 0) - horizontalPadding * 2),
      availableHeight: Math.max(240, compactLayout.availableHeight || 0),
      fontSize: baseFontSize,
      fontFamily: theme.typography.fontFamily,
      fontWeight: block.options?.fontWeight || 900,
      lineHeight: block.options?.lineHeight ?? 1.08,
      maxLines: 5,
      minFontSize: Math.max(18, Math.round(baseFontSize * 0.56)),
      overflow: 'shrink',
      role: 'paragraph',
      mode: 'manual',
      manualBreaks: balancedText,
    }).effectiveFontSize;
  };

  const renderBoxGroup = (
    boxBlocks: Block[],
    startIndex: number,
    layoutContextOverrides?: {
      defaultWidthPercent?: number;
      defaultTextAlign?: 'left' | 'center' | 'right';
      compactLayout?: CompactLayoutContext;
    },
    themeOverride = theme,
  ) => {
    const groupAlign = effectiveOptions.boxGroupAlign || 'left';
    const groupLayout = effectiveOptions.boxGroupLayout || 'auto';
    const compactLayout = layoutContextOverrides?.compactLayout;
    const total = boxBlocks.length;
    const resolvedLayout = groupLayout === 'auto'
      ? total === 1
        ? 'stack'
        : total === 2
          ? 'row'
          : 'grid'
      : groupLayout;
    const shouldStackCompactSplitGrid = compactLayout?.isCompact
      && compactLayout.sourceLayoutId?.startsWith('IMAGE_SPLIT_')
      && resolvedLayout === 'grid'
      && total >= 3;
    const effectiveResolvedLayout = shouldStackCompactSplitGrid ? 'stack' : resolvedLayout;
    const shouldNormalizeSplitCompactStackFonts = compactLayout?.isCompact
      && compactLayout.sourceLayoutId?.startsWith('IMAGE_SPLIT_')
      && effectiveResolvedLayout === 'stack';
    const resolvedBoxFontSizeByIndex = shouldNormalizeSplitCompactStackFonts && compactLayout
      ? (() => {
          const fontSizeBuckets = new Map<number, { indices: number[]; values: number[] }>();

          boxBlocks.forEach((block, localIndex) => {
            const savedFontSize = block.options?.fontSize ?? 36;
            const estimatedFontSize = estimateSplitCompactBoxFontSize(block, compactLayout);
            const bucket = fontSizeBuckets.get(savedFontSize) || { indices: [], values: [] };
            bucket.indices.push(startIndex + localIndex);
            bucket.values.push(estimatedFontSize);
            fontSizeBuckets.set(savedFontSize, bucket);
          });

          return Array.from(fontSizeBuckets.entries()).reduce<Record<number, number>>((acc, [, bucket]) => {
            const sharedSize = Math.min(...bucket.values);
            bucket.indices.forEach((globalIndex) => {
              acc[globalIndex] = sharedSize;
            });
            return acc;
          }, {});
        })()
      : undefined;
    const mergedLayoutContext = {
      defaultWidthPercent: shouldStackCompactSplitGrid
        ? 100
        : layoutContextOverrides?.defaultWidthPercent ?? effectiveOptions.contentWidthPercent,
      defaultTextAlign: layoutContextOverrides?.defaultTextAlign ?? defaultTextAlign,
      compactLayout,
      resolvedBoxFontSizeByIndex,
    };
    const alignmentClass = groupAlign === 'center'
      ? 'items-center'
      : groupAlign === 'right'
        ? 'items-end'
        : 'items-start';
    const justifyClass = groupAlign === 'center'
      ? 'justify-center'
      : groupAlign === 'right'
        ? 'justify-end'
        : 'justify-start';
    const compactGridGapClass = mergedLayoutContext.compactLayout?.isCompact ? 'gap-4' : 'gap-6';
    const groupMaxWidth = total === 1
      ? '940px'
      : total === 2
        ? '980px'
        : '1040px';

    const renderBoxItem = (block: Block, localIndex: number, asGridMember: boolean) => (
      <React.Fragment key={`box-${startIndex + localIndex}`}>
        {renderBlock(
          block,
          themeOverride,
          onEditIcon,
          asGridMember,
          localIndex,
          startIndex + localIndex,
          { totalInGroup: total, groupLayout: effectiveResolvedLayout },
          mergedLayoutContext,
          onSelectBlock,
        )}
      </React.Fragment>
    );

    const getBoxJustifyClass = (block: Block) => {
      const blockAlign = block.options?.align || block.options?.textAlign || groupAlign || 'left';
      return blockAlign === 'center'
        ? 'justify-center'
        : blockAlign === 'right'
          ? 'justify-end'
          : 'justify-start';
    };

    if (effectiveResolvedLayout === 'stack') {
      return (
        <div className={`w-full flex flex-col ${alignmentClass}`} style={{ gap: `${Math.max(18, blockGap)}px` }}>
          {boxBlocks.map((block, localIndex) => (
            <div key={`box-stack-wrap-${startIndex + localIndex}`} className={`w-full flex ${getBoxJustifyClass(block)}`}>
              <div style={{ width: '100%', maxWidth: groupMaxWidth }}>
                {renderBoxItem(block, localIndex, false)}
              </div>
            </div>
          ))}
        </div>
      );
    }

    if (effectiveResolvedLayout === 'row') {
      return (
        <div className={`w-full flex ${justifyClass}`}>
          <div className={`grid grid-cols-2 ${compactGridGapClass} w-full auto-rows-fr items-stretch`} style={{ maxWidth: groupMaxWidth }}>
            {boxBlocks.map((block, localIndex) => (
              <div key={`box-row-${startIndex + localIndex}`} className="h-full">
                {renderBoxItem(block, localIndex, true)}
              </div>
            ))}
          </div>
        </div>
      );
    }

    return (
      <div className={`w-full flex ${justifyClass}`}>
        <div className={`grid grid-cols-2 ${compactGridGapClass} w-full auto-rows-fr items-stretch`} style={{ maxWidth: groupMaxWidth }}>
          {boxBlocks.map((block, localIndex) => {
            const shouldSpanFull = total === 3 && localIndex === 0;
            return (
              <div key={`box-grid-${startIndex + localIndex}`} className={`${shouldSpanFull ? 'col-span-2' : ''} h-full`}>
                {renderBlock(
                  block,
                  themeOverride,
                  onEditIcon,
                  true,
                  localIndex,
                  startIndex + localIndex,
                  { totalInGroup: total, groupLayout: effectiveResolvedLayout },
                  mergedLayoutContext,
                  onSelectBlock,
                )}
              </div>
            );
          })}
        </div>
      </div>
    );
  };

  const renderBlocks = (layoutContextOverrides?: {
    defaultWidthPercent?: number;
    defaultTextAlign?: 'left' | 'center' | 'right';
    compactLayout?: CompactLayoutContext;
  }, themeOverride = theme, sourceBlocks: Block[] = slide.blocks) => {
    const groups: React.ReactNode[] = [];
    const mergedLayoutContext = {
      defaultWidthPercent: layoutContextOverrides?.defaultWidthPercent ?? effectiveOptions.contentWidthPercent,
      defaultTextAlign: layoutContextOverrides?.defaultTextAlign ?? defaultTextAlign,
      compactLayout: layoutContextOverrides?.compactLayout,
    };

    for (let index = 0; index < sourceBlocks.length; index += 1) {
      const currentBlock = sourceBlocks[index];

      if (currentBlock.type === 'BOX') {
        const boxBlocks: Block[] = [];
        const startIndex = index;

        while (index < sourceBlocks.length && sourceBlocks[index].type === 'BOX') {
          boxBlocks.push(sourceBlocks[index]);
          index += 1;
        }

        groups.push(
          <React.Fragment key={`box-group-${startIndex}`}>
            {renderBoxGroup(boxBlocks, startIndex, layoutContextOverrides, themeOverride)}
          </React.Fragment>,
        );

        index -= 1;
        continue;
      }

      const fadeReadableBlock = isFadeLayout && (
        currentBlock.type === 'TITLE'
        || currentBlock.type === 'PARAGRAPH'
        || currentBlock.type === 'LIST'
        || currentBlock.type === 'CARD'
        || currentBlock.type === 'BADGE'
        || currentBlock.type === 'USER'
      ) && !currentBlock.options?.color
        ? {
          ...currentBlock,
          options: {
            ...(currentBlock.options || {}),
            color: '#FFFFFF',
          },
        }
        : currentBlock;
      const renderedBlock = renderBlock(
        fadeReadableBlock,
        themeOverride,
        onEditIcon,
        false,
        0,
        index,
        undefined,
        mergedLayoutContext,
        onSelectBlock,
      );

      groups.push(
        <React.Fragment key={index}>
          {renderedBlock}
        </React.Fragment>,
      );
    }

    const hasSemanticEditorialBlocks = sourceBlocks.some((block) => block.options?.semanticRole);
    const hasChecklistContentStack = sourceBlocks.some((block, index) => (
      block.type === 'LIST'
      && sourceBlocks.slice(0, index).some((previousBlock) => previousBlock.type === 'TITLE')
    ));
    const resolvedBlockGap = hasChecklistContentStack
      ? Math.max(blockGap, 28)
      : hasSemanticEditorialBlocks
        ? Math.min(blockGap, 22)
        : blockGap;

    return (
      <div
        className="w-full relative z-30 flex flex-col"
        style={{ gap: `${resolvedBlockGap}px` }}
        data-checklist-content-stack={hasChecklistContentStack ? 'true' : undefined}
      >
        {groups}
      </div>
    );
  };

  const renderFXOverlays = () => {
    const overlays: React.ReactNode[] = [];

    if (fx?.vignette && fx.vignette > 0) {
      const vignetteStrength = Math.min(0.48, 0.06 + fx.vignette * 0.34);
      overlays.push(
        <div
          key="fx-vignette"
          data-fx-vignette="true"
          className="absolute inset-0 pointer-events-none z-[2]"
          style={{
            background: `radial-gradient(circle at center, rgba(0,0,0,0) 48%, rgba(0,0,0,${(vignetteStrength * 0.22).toFixed(3)}) 76%, rgba(0,0,0,${vignetteStrength.toFixed(3)}) 100%)`,
            mixBlendMode: 'multiply',
          }}
        />,
      );
    }

    if (fx?.noiseAmount && fx.noiseAmount > 0) {
      const noiseOpacity = roundAlpha(Math.min(0.08, fx.noiseAmount * 0.08));
      overlays.push(
        <div
          key="fx-noise"
          data-fx-noise="true"
          data-fx-photoshop-noise="true"
          data-fx-noise-target-blend="linear-light"
          className="absolute inset-0 pointer-events-none z-[5]"
          style={{
            opacity: noiseOpacity,
            mixBlendMode: 'hard-light',
            backgroundImage: PHOTOSHOP_NOISE_TILE_URL,
            backgroundRepeat: 'repeat',
            backgroundSize: '256px 256px',
            backgroundPosition: `${(index * 37) % 256}px ${(index * 71) % 256}px`,
            imageRendering: 'pixelated',
            filter: 'contrast(1.72) saturate(1.8)',
          }}
        />,
      );
    }

    return overlays;
  };

  const hexToRgba = (value: string | undefined, alpha: number) => {
    if (!value || !value.startsWith('#')) {
      const fallback = effectiveOptions.black || '#141414';
      return `rgba(20,20,20,${alpha})`;
    }

    const raw = value.replace('#', '');
    const normalized = raw.length === 3
      ? raw.split('').map((char) => `${char}${char}`).join('')
      : raw;

    const r = parseInt(normalized.slice(0, 2), 16);
    const g = parseInt(normalized.slice(2, 4), 16);
    const b = parseInt(normalized.slice(4, 6), 16);
    if ([r, g, b].some((channel) => Number.isNaN(channel))) {
      return `rgba(20,20,20,${alpha})`;
    }
    return `rgba(${r}, ${g}, ${b}, ${alpha})`;
  };
  const roundAlpha = (alpha: number) => Math.round(alpha * 1000) / 1000;

  const getDirectionalGradient = (side: 'left' | 'right' | 'top' | 'bottom', strength: number, color: string) => {
    const normalizedStrength = Math.min(1, Math.max(0, strength / 2));
    const shadeStrong = hexToRgba(color, Math.min(0.88, 0.28 + normalizedStrength * 0.48));
    const shadeMid = hexToRgba(color, Math.min(0.58, 0.16 + normalizedStrength * 0.3));
    const shadeSoft = hexToRgba(color, Math.min(0.22, 0.05 + normalizedStrength * 0.12));
    switch (side) {
      case 'right':
        return `linear-gradient(270deg, ${shadeStrong} 0%, ${shadeMid} 18%, ${shadeSoft} 42%, transparent 66%)`;
      case 'top':
        return `linear-gradient(180deg, ${shadeStrong} 0%, ${shadeMid} 18%, ${shadeSoft} 42%, transparent 66%)`;
      case 'bottom':
        return `linear-gradient(0deg, ${shadeStrong} 0%, ${shadeMid} 18%, ${shadeSoft} 42%, transparent 66%)`;
      case 'left':
      default:
        return `linear-gradient(90deg, ${shadeStrong} 0%, ${shadeMid} 18%, ${shadeSoft} 42%, transparent 66%)`;
    }
  };

  const getDirectionalContentLayout = (side: 'left' | 'right' | 'top' | 'bottom') => {
    switch (side) {
      case 'right':
        return {
          wrapper: 'items-end justify-center',
          panel: 'ml-auto mr-0 text-right pr-10',
        };
      case 'top':
        return {
          wrapper: 'items-center justify-start',
          panel: 'mx-auto text-center mt-18',
        };
      case 'bottom':
        return {
          wrapper: 'items-center justify-end',
          panel: 'mx-auto text-center mb-28',
        };
      case 'left':
      default:
        return {
          wrapper: 'items-start justify-center',
          panel: 'mr-auto ml-0 text-left pl-10',
        };
    }
  };

  const getVerticalJustifyClass = () => {
    const verticalAlign = effectiveOptions.contentVerticalAlign || 'center';
    return verticalAlign === 'top'
      ? 'justify-start'
      : verticalAlign === 'bottom'
        ? 'justify-end'
        : 'justify-center';
  };

  const getHorizontalAlignClass = () => {
    const horizontalAlign = defaultContentHorizontalAlign;
    return horizontalAlign === 'center'
      ? 'items-center'
      : horizontalAlign === 'right'
        ? 'items-end'
        : 'items-start';
  };

  const getCanvasVerticalItemsClass = () => {
    const verticalAlign = effectiveOptions.contentVerticalAlign || 'center';
    return verticalAlign === 'top'
      ? 'items-start'
      : verticalAlign === 'bottom'
        ? 'items-end'
        : 'items-center';
  };

  const getHorizontalSelfClass = () => {
    const horizontalAlign = defaultContentHorizontalAlign;
    return horizontalAlign === 'center'
      ? 'mx-auto text-center'
      : horizontalAlign === 'right'
        ? 'ml-auto mr-0 text-right'
        : 'mr-auto ml-0 text-left';
  };

  const getFadeContentMaxWidth = (side: 'left' | 'right' | 'top' | 'bottom', availableCanvasWidth: number) => {
    const metrics = getFadeReadingMetrics(side, availableCanvasWidth);
    return metrics.panelMaxWidth;
  };

  const renderSplitAccentEdge = (position: 'left' | 'right' | 'top' | 'bottom') => {
    const accentColor = effectiveOptions.accent || theme.colors.accent;
    const commonStyle: React.CSSProperties = {
      position: 'absolute',
      pointerEvents: 'none',
      backgroundColor: accentColor,
      boxShadow: `0 0 28px ${hexToRgba(accentColor, 0.28)}`,
      opacity: 0.9,
    };

    if (position === 'left') {
      return <div style={{ ...commonStyle, top: 0, bottom: 0, left: -10, width: 10 }} />;
    }
    if (position === 'right') {
      return <div style={{ ...commonStyle, top: 0, bottom: 0, right: -10, width: 10 }} />;
    }
    if (position === 'top') {
      return <div style={{ ...commonStyle, left: 0, right: 0, top: -10, height: 10 }} />;
    }
    return <div style={{ ...commonStyle, left: 0, right: 0, bottom: -10, height: 10 }} />;
  };

  const renderLayout = () => {
    const canvasPadding = `${padding}px`;
    const verticalAlign = effectiveOptions.contentVerticalAlign || 'center';
    const verticalEdgeInset = verticalAlign === 'center' ? padding : padding + 128;
    const contentPaddingStyle: React.CSSProperties = {
      paddingTop: verticalAlign === 'top' ? verticalEdgeInset : padding,
      paddingBottom: verticalAlign === 'bottom' ? verticalEdgeInset : padding,
      paddingLeft: padding,
      paddingRight: padding,
    };
    const availableCanvasWidth = Math.max(320, 1080 - padding * 2);
    const buildCompactLayoutContext = (
      availableWidth: number,
      availableHeight: number,
      sourceLayoutId?: string,
    ): CompactLayoutContext | undefined => {
      const normalizedWidth = Math.max(0, Math.round(availableWidth));
      const normalizedHeight = Math.max(0, Math.round(availableHeight));
      const isCompact = normalizedWidth <= 860 || normalizedHeight <= 500;

      if (!isCompact) {
        return undefined;
      }

      return {
        isCompact: true,
        availableWidth: normalizedWidth,
        availableHeight: normalizedHeight,
        sourceLayoutId,
      };
    };
    const bRot = imageConfig?.boxRotation ?? 0;
    const bScale = imageConfig?.boxScale ?? 1;
    const currentImageBoxState = getCurrentImageBoxState();
    const bX = currentImageBoxState.boxX;
    const bY = currentImageBoxState.boxY;
    const boxWidth = currentImageBoxState.width;
    const boxHeight = currentImageBoxState.height;
    const isFloatingBox = imageConfig?.type === 'IMAGE_BOX' || imageConfig?.type === 'IMAGE_GLASS_CARD';
    
    const imageBoxStyle: React.CSSProperties = {
      border: imageConfig?.borderWidth && isFloatingBox && !isCutoutImage ? `${imageConfig.borderWidth}px solid ${imageConfig.borderColor || '#FFFFFF'}` : 'none',
      boxShadow: imageConfig?.hasShadow && imageConfig?.type === 'IMAGE_GLASS_CARD' ? `0 ${imageConfig.hasTornEdges ? '24px 60px' : '32px 88px'} ${imageConfig.hasTornEdges ? '-6px' : '-8px'} rgba(0,0,0,${imageConfig.hasTornEdges ? '0.14' : '0.58'}), 0 0 72px ${imageConfig.borderColor || theme.colors.accent}${imageConfig.hasTornEdges ? '10' : '28'}` : 'none',
      transform: isFloatingBox ? `translate(${bX}px, ${bY}px) scale(${bScale}) rotate(${bRot}deg)` : undefined,
      transformOrigin: 'center',
      width: imageConfig?.type === 'IMAGE_BOX' ? `${boxWidth}px` : undefined,
      height: imageConfig?.type === 'IMAGE_BOX' ? `${boxHeight}px` : undefined,
      flexShrink: 0
    };
    
    const contentWidthPercent = effectiveOptions.contentWidthPercent ?? 100;
    const adaptiveTextWidth = Math.max(260, Math.min(520, availableCanvasWidth * Math.min(0.52, (contentWidthPercent / 100) * 0.62)));
    const adaptiveBoxWidth = Math.max(240, Math.min(availableCanvasWidth * 0.48, boxWidth * Math.max(0.68, bScale)));
    const adaptiveGap = Math.max(32, Math.min(92, sectionGap + 8));
    const adaptiveHorizontalCompositionWidth = Math.min(
      availableCanvasWidth,
      adaptiveTextWidth + adaptiveBoxWidth + adaptiveGap,
    );
    const adaptiveVerticalCompositionWidth = Math.min(
      availableCanvasWidth,
      Math.max(adaptiveTextWidth, adaptiveBoxWidth),
    );
    const adaptiveHorizontalBoxHeight = Math.max(300, boxHeight * Math.max(0.68, bScale));
    const adaptiveVerticalBoxHeight = Math.max(240, boxHeight * Math.max(0.68, bScale));
    const imageBoxCursorClass = selectedImageBoxMode === 'image' ? 'cursor-grab' : 'cursor-move';
    const contentVerticalClass = getVerticalJustifyClass();
    const contentHorizontalClass = getHorizontalAlignClass();
    const contentSelfClass = getHorizontalSelfClass();
    const canvasVerticalItemsClass = getCanvasVerticalItemsClass();

    const renderInteractiveImageBox = (
      heightClassName?: string,
      options?: {
        lockFrame?: boolean;
        fit?: 'cover' | 'contain';
        frameClassName?: string;
        placeholderIcon?: React.ReactNode;
        dataAttributes?: Record<string, string>;
        viewportWidth?: number;
        viewportHeight?: number;
        transparentFrame?: boolean;
      },
    ) => {
      const resolvedFit = isCutoutImage ? 'contain' : (options?.fit || 'cover');
      const frameAllowsOverflow = isCutoutImage;
      const transparentFrame = Boolean(options?.transparentFrame) || frameAllowsOverflow;
      const roundedFrameClass = frameAllowsOverflow ? 'rounded-none' : 'rounded-[86px]';
      const selectedFrameClass = selectedImageBoxMode
        ? frameAllowsOverflow
          ? 'shadow-none'
          : 'ring-4 ring-brand/70 shadow-[0_0_0_1px_rgba(31,178,247,0.35)]'
        : transparentFrame
          ? 'shadow-none'
          : 'shadow-xl shadow-black/10';
      return (
        <div
          ref={imageBoxTargetRef}
          style={options?.lockFrame
            ? {
              ...imageBoxStyle,
              transform: 'none',
              width: '100%',
              height: '100%',
            }
            : imageBoxStyle}
          onMouseDown={(event) => {
            event.stopPropagation();
            setSelectedImageBoxMode((currentMode) => options?.lockFrame ? 'image' : (currentMode || 'box'));
          }}
          onDoubleClick={(event) => {
            event.stopPropagation();
            if (options?.lockFrame) {
              setSelectedImageBoxMode('image');
              return;
            }
            setSelectedImageBoxMode((currentMode) => currentMode === 'image' ? 'box' : 'image');
          }}
          className={`relative transition-shadow duration-200 ${transparentFrame ? 'bg-transparent' : 'bg-zinc-800'} ${roundedFrameClass} ${frameAllowsOverflow ? 'overflow-visible' : 'overflow-hidden'} ${selectedFrameClass} ${imageBoxCursorClass} ${heightClassName || ''} ${options?.frameClassName || ''}`}
          data-image-fit={resolvedFit}
          data-image-cutout={isCutoutImage ? 'true' : 'false'}
          data-image-overflow={frameAllowsOverflow ? 'visible' : 'hidden'}
          data-image-frame-transparent={transparentFrame ? 'true' : 'false'}
          data-image-frame-rounded={roundedFrameClass === 'rounded-none' ? 'false' : 'true'}
          {...(options?.dataAttributes || {})}
        >
          {imageConfig.url ? (renderImage("w-full h-full", resolvedFit, {}, {
            width: options?.lockFrame ? (options?.viewportWidth ?? boxWidth) : boxWidth,
            height: options?.lockFrame ? (options?.viewportHeight ?? boxHeight) : boxHeight,
          })) : (<div className="w-full h-full bg-black/40 flex items-center justify-center text-white/10">{options?.placeholderIcon || <Box size={100} />}</div>)}
          {selectedImageBoxMode && (
            <div className="absolute left-4 top-4 z-20 rounded-full bg-black/65 px-3 py-1.5 text-[9px] font-black uppercase tracking-[0.18em] text-white/85 backdrop-blur-md">
              {selectedImageBoxMode === 'image' ? 'Movendo Imagem' : 'Movendo Moldura'}
            </div>
          )}
        </div>
      );
    };

    const renderProcessedAreaBlocks = (
      area: NonNullable<ReturnType<typeof findSlideArea>>,
      options?: {
        defaultTextAlign?: 'left' | 'center' | 'right';
        colorOverride?: string;
        naturalHeight?: boolean;
        compactLayout?: CompactLayoutContext;
      },
    ) => {
      const directionClass = area.direction === 'row' ? 'flex-row' : 'flex-col';
      const justifyClass = area.justify === 'center'
        ? 'justify-center'
        : area.justify === 'end'
          ? 'justify-end'
          : area.justify === 'between'
            ? 'justify-between'
            : 'justify-start';
      const alignClass = area.align === 'center'
        ? 'items-center'
        : area.align === 'end'
          ? 'items-end'
          : area.align === 'stretch'
            ? 'items-stretch'
            : 'items-start';
      const processed = processAreaBlocks(
        slide.blocks.filter((block) => block.type !== 'IMAGE' && block.type !== 'SPACER'),
        area,
        1080,
        1350,
      );
      const areaInnerFrame = resolveAreaInnerFramePx(area, 1080, 1350);
      const compactLayout = options?.compactLayout
        || buildCompactLayoutContext(areaInnerFrame.width, areaInnerFrame.height, imageLayoutId);
      const renderedEntries: React.ReactNode[] = [];

      for (let processedIndex = 0; processedIndex < processed.processedBlocks.length; processedIndex += 1) {
        const entry = processed.processedBlocks[processedIndex];
        if (!entry) continue;

        const colorOverride = options?.colorOverride;
        const defaultTextAlign = options?.defaultTextAlign;
        const nextBlock: Block = {
          ...entry.block,
          options: {
            ...entry.block.options,
            color: colorOverride ?? entry.block.options?.color,
            textAlign: entry.block.options?.textAlign
              || (entry.block.options?.align as 'left' | 'center' | 'right' | undefined)
              || defaultTextAlign,
          },
        };

        if (nextBlock.type === 'BOX') {
          const groupStartIndex = processedIndex;
          const boxBlocks: Block[] = [nextBlock];

          while (
            processedIndex + 1 < processed.processedBlocks.length
            && processed.processedBlocks[processedIndex + 1]?.block.type === 'BOX'
          ) {
            const nextEntry = processed.processedBlocks[processedIndex + 1];
            boxBlocks.push({
              ...nextEntry.block,
              options: {
                ...nextEntry.block.options,
                color: colorOverride ?? nextEntry.block.options?.color,
                textAlign: nextEntry.block.options?.textAlign
                  || (nextEntry.block.options?.align as 'left' | 'center' | 'right' | undefined)
                  || defaultTextAlign,
              },
            });
            processedIndex += 1;
          }

          renderedEntries.push(
            <div
              key={`processed-box-group-${groupStartIndex}`}
              style={{
                width: '100%',
                marginTop: `${entry.marginTop}px`,
                overflow: 'visible',
                flexShrink: 0,
              }}
            >
              {renderBoxGroup(boxBlocks, groupStartIndex, {
                defaultWidthPercent: 100,
                defaultTextAlign: options?.defaultTextAlign ?? 'left',
                compactLayout,
              }, theme)}
            </div>,
          );
          continue;
        }

        renderedEntries.push(
          <div
            key={`processed-${processedIndex}`}
            style={{
              width: '100%',
              marginTop: `${entry.marginTop}px`,
              minHeight: options?.naturalHeight ? undefined : `${entry.allocatedHeight}px`,
              maxHeight: options?.naturalHeight ? undefined : `${entry.allocatedHeight}px`,
              overflow: options?.naturalHeight ? 'visible' : 'hidden',
              flexShrink: 0,
            }}
          >
            {renderBlock(
              nextBlock,
              theme,
              onEditIcon,
              false,
              0,
              processedIndex,
              undefined,
              {
                defaultWidthPercent: 100,
                defaultTextAlign: options?.defaultTextAlign ?? 'left',
                compactLayout,
              },
              onSelectBlock,
            )}
          </div>
        );
      }

      return (
        <div
          className={`w-full h-full flex ${directionClass} ${justifyClass} ${alignClass}`}
          data-area-id={area.id}
          data-area-justify={area.justify}
          data-area-align={area.align}
          style={contentOffsetStyle}
        >
          {renderedEntries}
        </div>
      );
    };

    const renderLayoutInternal = () => {
      const stageAreaLayout = slideComposition.imageLayoutId
        ? areaLayoutRegistry.get(slideComposition.imageLayoutId)
        : undefined;

      if (
        isBoxGridContent
        && !isStageLayout
        && imageConfig?.type !== 'IMAGE_BOX'
        && imageConfig?.type !== 'IMAGE_SPLIT_HALF'
      ) {
        return (
          <div className="relative h-full w-full flex flex-col justify-center items-center" style={{ ...contentPaddingStyle, ...contentOffsetStyle }}>
            {renderBlocks()}
          </div>
        );
      }
      if (
        slideComposition.imageLayoutId === 'IMAGE_STACK_BOX_TOP' ||
        slideComposition.imageLayoutId === 'IMAGE_STACK_BOX_BOTTOM'
      ) {
        const isImageOnTop = slideComposition.imageLayoutId === 'IMAGE_STACK_BOX_TOP';
        const hasStackImage = !!imageConfig?.url;
        const imageArea = stageAreaLayout ? findSlideArea(stageAreaLayout, 'image-area') : undefined;
        const contentArea = stageAreaLayout ? findSlideArea(stageAreaLayout, 'content-area') : undefined;

        if (!stageAreaLayout || !contentArea) {
          return <div className="relative h-full w-full" />;
        }

        const imageFrame = imageArea ? resolveAreaFramePx(imageArea, stageAreaLayout.slideWidth, stageAreaLayout.slideHeight) : null;
        const contentFrame = resolveAreaFramePx(contentArea, stageAreaLayout.slideWidth, stageAreaLayout.slideHeight);
        const contentInnerFrame = resolveAreaInnerFramePx(contentArea, stageAreaLayout.slideWidth, stageAreaLayout.slideHeight);
        const contentBoxBg = theme.colors.cardBg || theme.colors.accent;
        const contentTextColor = theme.colors.cardTextColor || theme.colors.hlTextColor || '#ffffff';
        const shellRadius = 86;

        const imageShell = (
          <div
            className={`absolute shrink-0 ${isCutoutImage ? 'overflow-visible z-30' : 'overflow-hidden'}`}
            style={{
              left: `${imageFrame?.left ?? 0}px`,
              top: `${imageFrame?.top ?? 0}px`,
              width: `${imageFrame?.width ?? 0}px`,
              height: `${imageFrame?.height ?? 0}px`,
              borderRadius: `${shellRadius}px`,
            }}
          >
            {renderInteractiveImageBox(`w-full h-full ${isCutoutImage ? '!rounded-none !bg-transparent shadow-none' : '!rounded-[86px]'} !border-0`, {
              lockFrame: true,
              viewportWidth: imageFrame?.width ?? boxWidth,
              viewportHeight: imageFrame?.height ?? boxHeight,
            })}
          </div>
        );

        const contentShell = (
          <div
            className="absolute shrink-0 overflow-hidden flex items-center justify-center"
            style={{
              left: `${contentFrame.left}px`,
              top: `${contentFrame.top}px`,
              width: `${contentFrame.width}px`,
              height: `${contentFrame.height}px`,
              borderRadius: `${shellRadius}px`,
              backgroundColor: contentBoxBg,
              color: contentTextColor,
              boxShadow: '0 28px 80px rgba(0,0,0,0.12)',
              paddingTop: `${contentArea.padding.top}px`,
              paddingRight: `${contentArea.padding.right}px`,
              paddingBottom: `${contentArea.padding.bottom}px`,
              paddingLeft: `${contentArea.padding.left}px`,
            }}
          >
            <div
              className="w-full h-full flex flex-col justify-center items-center"
              style={{
                color: contentTextColor,
                width: `${contentInnerFrame.width}px`,
                height: `${contentInnerFrame.height}px`,
                ...contentOffsetStyle,
              }}
            >
              {renderProcessedAreaBlocks(contentArea, { defaultTextAlign: 'center', colorOverride: contentTextColor, naturalHeight: true })}
            </div>
          </div>
        );

        return (
          <div className="relative h-full w-full">
            {isImageOnTop ? (
              <>
                {hasStackImage ? imageShell : null}
                {contentShell}
              </>
            ) : (
              <>
                {contentShell}
                {hasStackImage ? imageShell : null}
              </>
            )}
          </div>
        );
      }
      if (
        imageConfig?.type === 'IMAGE_BOX' &&
        imageLayoutId !== 'IMAGE_STAGE_LEFT' &&
        imageLayoutId !== 'IMAGE_STAGE_RIGHT' &&
        imageLayoutId !== 'IMAGE_STAGE_TOP' &&
        imageLayoutId !== 'IMAGE_STAGE_BOTTOM'
      ) {
          const pos = imageConfig.position || 'right';
          const isHorizontal = pos === 'left' || pos === 'right';
          if (isHorizontal) {
            const isRight = pos === 'right';
            const horizontalTextWidth = Math.max(240, Math.min(adaptiveTextWidth, availableCanvasWidth - adaptiveBoxWidth - adaptiveGap - 24));
            return (
              <div className={`relative h-full w-full flex ${canvasVerticalItemsClass} justify-center`} style={contentPaddingStyle}>
                <div
                  className={`w-full flex items-center ${isRight ? 'flex-row' : 'flex-row-reverse'}`}
                  style={{
                    maxWidth: `${adaptiveHorizontalCompositionWidth}px`,
                    gap: `${adaptiveGap}px`,
                  }}
                >
                  <div className="min-w-0 z-20 flex-shrink-0" style={{ width: `${horizontalTextWidth}px`, ...contentOffsetStyle }}>
                    {renderBlocks({
                      compactLayout: buildCompactLayoutContext(
                        horizontalTextWidth,
                        1350 - padding * 2,
                        imageLayoutId,
                      ),
                    })}
                  </div>
                  <div
                    className={`relative flex items-center justify-center shrink-0 ${isCutoutImage ? 'z-30' : 'z-10'}`}
                    style={{
                      width: `${adaptiveBoxWidth}px`,
                      height: `${adaptiveHorizontalBoxHeight}px`,
                    }}
                  >
                    {renderInteractiveImageBox()}
                  </div>
                </div>
              </div>
            );
          } else {
            const isBottom = pos === 'bottom';
            // Vertical boxes now use consistent width logic
            return (
              <div className={`relative h-full w-full flex ${canvasVerticalItemsClass} justify-center`} style={contentPaddingStyle}>
                <div
                  className={`w-full flex flex-col items-center ${isBottom ? 'flex-col' : 'flex-col-reverse'}`}
                  style={{
                    maxWidth: `${adaptiveVerticalCompositionWidth}px`,
                    gap: `${adaptiveGap}px`,
                  }}
                >
                  <div className="w-full flex flex-col justify-center z-20" style={contentOffsetStyle}>
                    {renderBlocks({
                      compactLayout: buildCompactLayoutContext(
                        adaptiveVerticalCompositionWidth,
                        1350 - padding * 2 - adaptiveVerticalBoxHeight - adaptiveGap,
                        imageLayoutId,
                      ),
                    })}
                  </div>
                  <div
                    className={`relative flex items-center justify-center shrink-0 ${isCutoutImage ? 'z-30' : 'z-10'}`}
                    style={{
                      width: `${adaptiveBoxWidth}px`,
                      height: `${adaptiveVerticalBoxHeight}px`,
                    }}
                  >
                    {renderInteractiveImageBox()}
                  </div>
                </div>
              </div>
            );
          }
      }
      if (
        isStageLayout
      ) {
        const imageArea = stageAreaLayout ? findSlideArea(stageAreaLayout, 'image-area') : undefined;
        const contentArea = stageAreaLayout ? findSlideArea(stageAreaLayout, 'content-area') : undefined;

        if (!stageAreaLayout || !contentArea || !imageArea) {
          return (
            <div className={`relative h-full w-full flex flex-col ${contentVerticalClass} ${contentHorizontalClass}`} style={contentPaddingStyle}>
              <div className={`w-full max-w-[820px] flex flex-col min-h-0 ${contentSelfClass}`} style={contentOffsetStyle}>
                {renderBlocks()}
              </div>
            </div>
          );
        }

        const imageFrame = resolveAreaFramePx(imageArea, stageAreaLayout.slideWidth, stageAreaLayout.slideHeight);
        const contentFrame = resolveAreaFramePx(contentArea, stageAreaLayout.slideWidth, stageAreaLayout.slideHeight);
        const contentInnerFrame = resolveAreaInnerFramePx(contentArea, stageAreaLayout.slideWidth, stageAreaLayout.slideHeight);
        const stageDirection = imageLayoutId === 'IMAGE_STAGE_LEFT'
          ? 'left'
          : imageLayoutId === 'IMAGE_STAGE_TOP'
            ? 'top'
            : imageLayoutId === 'IMAGE_STAGE_BOTTOM'
              ? 'bottom'
              : 'right';
        const isVerticalStage = stageDirection === 'top' || stageDirection === 'bottom';
        const stageTextAlign = effectiveOptions.contentHorizontalAlign || (isVerticalStage ? 'center' : 'left');
        const stageAreaAlign = stageTextAlign === 'center'
          ? 'center'
          : stageTextAlign === 'right'
            ? 'end'
            : 'start';
        const stageContentJustifyClass = stageTextAlign === 'center'
          ? 'justify-center'
          : stageTextAlign === 'right'
            ? 'justify-end'
            : 'justify-start';
        const stageContentItemsClass = stageTextAlign === 'center'
          ? 'items-center'
          : stageTextAlign === 'right'
            ? 'items-end'
            : 'items-start';
        const alignedContentArea = {
          ...contentArea,
          align: stageAreaAlign,
        };

        return (
          <div className="relative h-full w-full" data-stage-layout={stageDirection}>
            {debugMode && (
              <>
                <div
                  className="pointer-events-none absolute z-40 rounded-[28px] border-2 border-fuchsia-400/75"
                  style={{
                    left: `${imageFrame.left}px`,
                    top: `${imageFrame.top}px`,
                    width: `${imageFrame.width}px`,
                    height: `${imageFrame.height}px`,
                  }}
                >
                  <div className="absolute left-3 top-3 rounded-full bg-fuchsia-500/95 px-3 py-1 text-[9px] font-black uppercase tracking-[0.18em] text-white shadow-lg">
                    image-area
                  </div>
                </div>
                <div
                  className="pointer-events-none absolute z-40 rounded-[28px] border-2 border-cyan-400/80"
                  style={{
                    left: `${contentFrame.left}px`,
                    top: `${contentFrame.top}px`,
                    width: `${contentFrame.width}px`,
                    height: `${contentFrame.height}px`,
                  }}
                >
                  <div className="absolute left-3 top-3 rounded-full bg-cyan-400/95 px-3 py-1 text-[9px] font-black uppercase tracking-[0.18em] text-black shadow-lg">
                    content-area
                  </div>
                </div>
              </>
            )}
            <div
              className={`absolute flex items-center justify-center ${isCutoutImage ? 'z-30' : 'z-10'}`}
              style={{
                left: `${imageFrame.left}px`,
                top: `${imageFrame.top}px`,
                width: `${imageFrame.width}px`,
                height: `${imageFrame.height}px`,
              }}
              data-stage-image-area="true"
            >
              {renderInteractiveImageBox(`w-full h-full ${isCutoutImage ? '!rounded-none !bg-transparent shadow-none' : '!rounded-[86px]'} !border-0`, {
                lockFrame: true,
                fit: 'contain',
                placeholderIcon: <Layers size={100} />,
                dataAttributes: { 'data-stage-image-fit': 'contain' },
                viewportWidth: imageFrame.width,
                viewportHeight: imageFrame.height,
                transparentFrame: true,
              })}
            </div>
            <div
              className={`absolute z-20 flex items-center ${stageContentJustifyClass}`}
              style={{
                left: `${contentFrame.left}px`,
                top: `${contentFrame.top}px`,
                width: `${contentFrame.width}px`,
                height: `${contentFrame.height}px`,
              }}
              data-stage-content-area="true"
              data-stage-text-align={stageTextAlign}
            >
              <div
                className={`h-full flex flex-col justify-center ${stageContentItemsClass}`}
                style={{
                  width: `${contentInnerFrame.width}px`,
                  height: `${contentInnerFrame.height}px`,
                }}
              >
                {renderProcessedAreaBlocks(alignedContentArea, { defaultTextAlign: stageTextAlign, naturalHeight: true })}
              </div>
            </div>
          </div>
        );
      }
      if (imageConfig?.type === 'IMAGE_GLASS_CARD' || isGlassLayout) {
        const isDarkBox = imageConfig?.boxOverlay === 'dark';
        const glassPosition = imageLayoutId === 'IMAGE_GLASS_BOTTOM' || imageConfig?.position === 'bottom' ? 'bottom' : 'center';
        const overlayStrength = effectiveOptions.backgroundOverlayStrength ?? 0.42;
        const glassStrength = Math.min(1, Math.max(0, overlayStrength));
        const backgroundBlur = effectiveOptions.backgroundBlur ?? 12;
        const glassBlur = Math.min(40, Math.max(0, backgroundBlur));
        const glassComputedBlur = Math.round(16 + glassBlur * 0.85);
        const cardWidth = 720;
        const cardPaddingX = 56;
        const cardPaddingY = 64;
        const cardRadius = 58;
        const overlayGradient = isDarkBox
          ? 'linear-gradient(180deg, rgba(0,0,0,0.16) 0%, rgba(0,0,0,0.34) 100%)'
          : 'linear-gradient(180deg, rgba(0,0,0,0.08) 0%, rgba(0,0,0,0.22) 100%)';
        const darkGlassTopAlpha = roundAlpha(0.18 + glassStrength * 0.16);
        const darkGlassSheenAlpha = roundAlpha(0.08 + glassStrength * 0.08);
        const darkGlassMidAlpha = roundAlpha(0.54 + glassStrength * 0.20);
        const darkGlassBottomAlpha = roundAlpha(0.44 + glassStrength * 0.18);
        const lightGlassTopAlpha = roundAlpha(0.50 + glassStrength * 0.22);
        const lightGlassSheenAlpha = roundAlpha(0.34 + glassStrength * 0.12);
        const lightGlassMidAlpha = roundAlpha(0.24 + glassStrength * 0.22);
        const lightGlassBottomAlpha = roundAlpha(0.34 + glassStrength * 0.20);
        const cardBackground = isDarkBox
          ? `linear-gradient(180deg, rgba(255,255,255,${darkGlassTopAlpha}) 0%, rgba(255,255,255,${darkGlassSheenAlpha}) 10%, rgba(10,14,22,${darkGlassMidAlpha}) 44%, rgba(10,14,22,${darkGlassBottomAlpha}) 100%)`
          : `linear-gradient(180deg, rgba(255,255,255,${lightGlassTopAlpha}) 0%, rgba(255,255,255,${lightGlassSheenAlpha}) 10%, rgba(255,255,255,${lightGlassMidAlpha}) 44%, rgba(255,255,255,${lightGlassBottomAlpha}) 100%)`;
        const cardBorder = 'rgba(255,255,255,0.2)';
        const defaultCardTextPrimary = isDarkBox ? '#F7F8FA' : '#1E2430';
        const cardTextPrimary = effectiveOptions.text || effectiveOptions.hlTextColor || effectiveOptions.cardTextColor || defaultCardTextPrimary;
        const cardTextSecondary = effectiveOptions.cardTextColor
          ? `${effectiveOptions.cardTextColor}CC`
          : effectiveOptions.text
            ? `${effectiveOptions.text}CC`
            : isDarkBox
              ? 'rgba(247,248,250,0.74)'
              : 'rgba(30,36,48,0.76)';
        const cardAccent = isDarkBox ? '#FFFFFF' : (effectiveOptions.accent || '#334A8A');
        const buttonBackground = isDarkBox
          ? 'linear-gradient(145deg, rgba(255,255,255,0.18), rgba(255,255,255,0.1))'
          : 'linear-gradient(145deg, rgba(40,60,120,0.92), rgba(30,40,90,0.92))';
        const buttonText = effectiveOptions.cardTextColor || '#FFFFFF';
        const liquidSpecular = `linear-gradient(180deg, rgba(255,255,255,${roundAlpha(0.28 + glassStrength * 0.16)}) 0%, rgba(255,255,255,${roundAlpha(0.12 + glassStrength * 0.08)}) 18%, rgba(255,255,255,${roundAlpha(0.04 + glassStrength * 0.04)}) 36%, transparent 100%)`;
        const liquidRimLight = `linear-gradient(90deg, rgba(255,255,255,${roundAlpha(0.24 + glassStrength * 0.10)}) 0%, rgba(255,255,255,${roundAlpha(0.07 + glassStrength * 0.07)}) 18%, transparent 44%, transparent 56%, rgba(255,255,255,${roundAlpha(0.07 + glassStrength * 0.07)}) 82%, rgba(255,255,255,${roundAlpha(0.18 + glassStrength * 0.12)}) 100%)`;
        const liquidInternalBloom = `radial-gradient(ellipse at 20% 18%, rgba(255,255,255,${roundAlpha(0.14 + glassStrength * 0.08)}) 0%, rgba(255,255,255,${roundAlpha(0.05 + glassStrength * 0.05)}) 18%, transparent 52%), radial-gradient(ellipse at 82% 110%, rgba(255,255,255,${roundAlpha(0.10 + glassStrength * 0.06)}) 0%, rgba(255,255,255,${roundAlpha(0.03 + glassStrength * 0.03)}) 24%, transparent 58%)`;
        const liquidCaustic = isDarkBox
          ? `radial-gradient(circle at 76% 22%, rgba(255,255,255,${roundAlpha(0.10 + glassStrength * 0.08)}) 0%, transparent 34%)`
          : `radial-gradient(circle at 76% 22%, rgba(255,255,255,${roundAlpha(0.09 + glassStrength * 0.07)}) 0%, transparent 34%)`;
        const glassTheme = {
          ...theme,
          colors: {
            ...theme.colors,
            textPrimary: cardTextPrimary,
            textSecondary: cardTextSecondary,
            accent: cardAccent,
            highlight: cardAccent,
            hlBgColor: effectiveOptions.hlBgColor || (isDarkBox ? 'rgba(255,255,255,0.16)' : 'rgba(50,72,138,0.14)'),
            hlTextColor: effectiveOptions.hlTextColor || cardTextPrimary,
            cardBg: buttonBackground,
            cardTextColor: buttonText,
          },
        };

        return (
          <div className="relative h-full w-full">
            <div className="absolute inset-0 overflow-hidden z-0 bg-zinc-900">
              {imageConfig?.url ? renderImage("w-full h-full", "cover", {}, { width: 1080, height: 1350 }) : (
                <div className="w-full h-full bg-black/40 flex items-center justify-center text-white/10">
                  <ImageIcon size={100} />
                </div>
              )}
              <div
                className="absolute inset-0"
                style={{ background: overlayGradient }}
              />
            </div>
            <div
              className="absolute left-0 right-0 bottom-0 pointer-events-none"
              style={{
                height: '380px',
                background: 'linear-gradient(to top, rgba(0,0,0,0.26) 0%, rgba(0,0,0,0.10) 38%, transparent 68%)',
              }}
            />
            <div
              data-glass-layout={glassPosition}
              className={`relative z-10 h-full w-full flex justify-center px-20 ${glassPosition === 'bottom' ? 'items-end pb-28 pt-20' : 'items-center'}`}
            >
              <div
                data-glass-frame="true"
                className="relative transition-all duration-500"
                style={{
                  ...contentOffsetStyle,
                  width: '100%',
                  maxWidth: `${cardWidth}px`,
                  borderRadius: `${cardRadius}px`,
                  border: `1px solid ${cardBorder}`,
                  boxShadow: isDarkBox
                    ? `inset 0 1px 0 rgba(255,255,255,${roundAlpha(0.28 + glassStrength * 0.5)}), 0 28px 72px rgba(0,0,0,${roundAlpha(0.42 + glassStrength * 0.18)})`
                    : `inset 0 1px 0 rgba(255,255,255,${roundAlpha(0.42 + glassStrength * 0.4)}), 0 28px 72px rgba(0,0,0,${roundAlpha(0.16 + glassStrength * 0.18)})`,
                }}
              >
                <div
                  data-glass-style="liquid"
                  data-glass-clip="true"
                  data-glass-backdrop-host="true"
                  className="relative overflow-hidden"
                  style={{
                    padding: `${cardPaddingY}px ${cardPaddingX}px`,
                    borderRadius: `${cardRadius}px`,
                    clipPath: `inset(0 round ${cardRadius}px)`,
                    WebkitClipPath: `inset(0 round ${cardRadius}px)`,
                    backdropFilter: `blur(${glassComputedBlur}px) saturate(${isDarkBox ? '180%' : '140%'}) brightness(${isDarkBox ? '0.86' : '1.04'}) contrast(${isDarkBox ? '1.20' : '1.08'})`,
                    WebkitBackdropFilter: `blur(${glassComputedBlur}px) saturate(${isDarkBox ? '180%' : '140%'}) brightness(${isDarkBox ? '0.86' : '1.04'}) contrast(${isDarkBox ? '1.20' : '1.08'})`,
                    backgroundColor: 'rgba(255,255,255,0.01)',
                    contain: 'paint',
                    display: 'flex',
                    flexDirection: 'column',
                    gap: '20px',
                  }}
                >
                  {imageConfig?.url && (
                    <div
                      data-glass-materialized-blur="true"
                      className="absolute inset-[-72px] pointer-events-none"
                      style={{
                        filter: `blur(${Math.max(14, Math.round(glassComputedBlur * 0.72))}px) saturate(${isDarkBox ? '145%' : '120%'}) contrast(${isDarkBox ? '1.12' : '1.04'})`,
                        opacity: roundAlpha(isDarkBox ? 0.34 + glassStrength * 0.16 : 0.28 + glassStrength * 0.12),
                        transform: 'scale(1.08)',
                        transformOrigin: 'center',
                      }}
                    >
                      {renderImage("w-full h-full", "cover")}
                    </div>
                  )}
                  <div
                    data-glass-backdrop-surface="true"
                    data-glass-surface-strength={glassStrength}
                    data-glass-surface-blur={glassBlur}
                    data-glass-computed-blur={glassComputedBlur}
                    className="absolute inset-0 pointer-events-none"
                    style={{
                      borderRadius: `${cardRadius}px`,
                      clipPath: `inset(0 round ${cardRadius}px)`,
                      WebkitClipPath: `inset(0 round ${cardRadius}px)`,
                      backdropFilter: `blur(${glassComputedBlur}px) saturate(${isDarkBox ? '180%' : '140%'}) brightness(${isDarkBox ? '0.86' : '1.04'}) contrast(${isDarkBox ? '1.20' : '1.08'})`,
                      WebkitBackdropFilter: `blur(${glassComputedBlur}px) saturate(${isDarkBox ? '180%' : '140%'}) brightness(${isDarkBox ? '0.86' : '1.04'}) contrast(${isDarkBox ? '1.20' : '1.08'})`,
                      background: cardBackground,
                    }}
                  />
                  <div
                    className="absolute top-0 left-0 right-0 pointer-events-none overflow-hidden"
                    style={{
                      height: '96px',
                      borderRadius: `${cardRadius}px ${cardRadius}px 0 0`,
                    }}
                  >
                    <div
                      className="absolute inset-0 pointer-events-none"
                      style={{ background: liquidSpecular }}
                    />
                  </div>
                  <div
                    className="absolute inset-0 pointer-events-none"
                    style={{
                      borderRadius: `${cardRadius}px`,
                      background: liquidRimLight,
                      opacity: roundAlpha(0.82 + glassStrength * 0.16),
                    }}
                  />
                  <div
                    className="absolute inset-0 pointer-events-none"
                    style={{
                      borderRadius: `${cardRadius}px`,
                      background: liquidInternalBloom,
                      opacity: roundAlpha(0.76 + glassStrength * 0.18),
                    }}
                  />
                  <div
                    className="absolute inset-[-2px] pointer-events-none overflow-hidden"
                    style={{ borderRadius: `${cardRadius + 2}px` }}
                  >
                    <div
                      className="absolute inset-0 pointer-events-none"
                      style={{
                        background: liquidCaustic,
                        filter: 'blur(16px)',
                        opacity: roundAlpha(0.58 + glassStrength * 0.18),
                      }}
                    />
                  </div>
                  <div
                    className="absolute inset-[1px] pointer-events-none"
                    style={{
                      borderRadius: `${cardRadius - 1}px`,
                      border: isDarkBox ? '1px solid rgba(255,255,255,0.10)' : '1px solid rgba(255,255,255,0.20)',
                      boxShadow: isDarkBox
                        ? 'inset 0 22px 40px rgba(255,255,255,0.06), inset 0 -30px 52px rgba(0,0,0,0.30)'
                        : 'inset 0 22px 40px rgba(255,255,255,0.18), inset 0 -30px 52px rgba(0,0,0,0.10)',
                    }}
                  />
                  <div
                    className="relative z-10"
                    style={{
                      color: cardTextPrimary,
                    }}
                  >
                    {renderBlocks({
                      defaultWidthPercent: 100,
                      defaultTextAlign: 'left',
                      compactLayout: buildCompactLayoutContext(
                        cardWidth - cardPaddingX * 2,
                        glassPosition === 'bottom' ? 420 : 520,
                        imageLayoutId,
                      ),
                    }, glassTheme)}
                  </div>
                </div>
              </div>
            </div>
          </div>
        );
      }
      if (imageConfig?.type === 'IMAGE_SPLIT_HALF' || isSplitLayout) {
        const pos = imageConfig?.position || 'right';
        const isSideBySide = pos === 'left' || pos === 'right';
        const isVertical = pos === 'top' || pos === 'bottom';
        const isRightOrBottom = pos === 'right' || pos === 'bottom';
        if (isSideBySide) {
          const splitHorizontalPadding = isBoxGridContent ? 24 : 96;
          const splitContentWidth = 540 - splitHorizontalPadding * 2;
          const splitContentHeight = 1350 - (verticalAlign === 'top' ? verticalEdgeInset : padding) - (verticalAlign === 'bottom' ? verticalEdgeInset : padding);
          return (
            <div className={`relative h-full w-full flex ${isRightOrBottom ? 'flex-row' : 'flex-row-reverse'}`} style={{ backgroundColor: theme.colors.background }}>
              <div
                className={`relative flex-1 h-full flex flex-col ${contentVerticalClass} z-20 min-w-0`}
                data-split-content-compact={isBoxGridContent ? 'box-grid' : 'default'}
                style={{
                  paddingTop: verticalAlign === 'top' ? verticalEdgeInset : padding,
                  paddingBottom: verticalAlign === 'bottom' ? verticalEdgeInset : padding,
                  paddingLeft: splitHorizontalPadding,
                  paddingRight: splitHorizontalPadding,
                }}
              >
                {renderSplitAccentEdge(pos === 'right' ? 'right' : 'left')}
                <div className={`w-full ${contentSelfClass}`} style={{ maxWidth: `${Math.max(320, splitContentWidth)}px`, ...contentOffsetStyle }}>
                  {renderBlocks({
                    compactLayout: buildCompactLayoutContext(
                      splitContentWidth,
                      splitContentHeight,
                      imageLayoutId,
                    ),
                  })}
                </div>
              </div>
              <div className={`flex-1 h-full relative transition-all ${isCutoutImage ? 'overflow-visible z-30 bg-transparent border-0' : 'overflow-hidden z-10 bg-zinc-900 border-x border-white/5'}`}>
                {imageConfig?.url ? renderImage("w-full h-full", "cover", {}, { width: 540, height: 1350 }) : (<div className="w-full h-full bg-black/40 flex items-center justify-center text-white/10"><Layers size={100} /></div>)}
              </div>
            </div>
          );
        }
        if (isVertical) {
          const splitContentWidth = 1080 - padding * 2;
          const splitContentHeight = 675 - padding * 2;
          return (
            <div className={`relative h-full w-full flex flex-col ${isRightOrBottom ? 'flex-col' : 'flex-col-reverse'}`} style={{ backgroundColor: theme.colors.background }}>
              <div className={`relative flex-1 w-full flex flex-col ${contentVerticalClass} z-20`} style={contentPaddingStyle}>
                {renderSplitAccentEdge(pos === 'bottom' ? 'bottom' : 'top')}
                <div className={`max-w-[840px] w-full ${contentSelfClass}`} style={contentOffsetStyle}>
                  {renderBlocks({
                    compactLayout: buildCompactLayoutContext(
                      splitContentWidth,
                      splitContentHeight,
                      imageLayoutId,
                    ),
                  })}
                </div>
              </div>
              <div className={`w-full h-1/2 relative transition-all ${isCutoutImage ? 'overflow-visible z-30 bg-transparent border-0' : 'overflow-hidden z-10 border-y border-white/5'}`}>
                {imageConfig?.url ? renderImage("w-full h-full", "cover", {}, { width: 1080, height: 675 }) : (<div className="w-full h-full bg-black/40 flex items-center justify-center text-white/10"><Layers size={100} /></div>)}
              </div>
            </div>
          );
        }
      }

      if (
        imageLayoutId === 'IMAGE_STAGE_LEFT' ||
        imageLayoutId === 'IMAGE_STAGE_RIGHT' ||
        imageLayoutId === 'IMAGE_STAGE_TOP' ||
        imageLayoutId === 'IMAGE_STAGE_BOTTOM'
      ) {
        return renderLayoutInternal();
      }

      if (isWaveLayout) {
        const waveClipId = `waveClip-${index}`;
        const waveBoundaryPath = 'M0 814 C126 756 250 742 386 748 C566 758 724 754 874 710 C980 678 1034 642 1080 590';
        const wavePath = `${waveBoundaryPath} L1080 1350 L0 1350 Z`;
        const waveContentSafeAreaStyle: React.CSSProperties = {
          top: 116,
          left: 84,
          right: 84,
          height: 462,
          transform: `translateX(-20px) translate(${contentOffsetX}px, ${contentOffsetY}px) scale(${contentScale})`,
          transformOrigin: 'center',
        };
        const waveContentWidth = 100;

        return (
          <div data-wave-layout="bottom" className="relative h-full w-full overflow-hidden">
            <svg width="0" height="0" className="absolute">
              <defs>
                <clipPath id={waveClipId} clipPathUnits="userSpaceOnUse">
                  <path d={wavePath} />
                </clipPath>
              </defs>
            </svg>

            <div
              data-wave-image-mask="true"
              className="absolute inset-0 z-0 overflow-hidden"
              style={{
                clipPath: `url(#${waveClipId})`,
                WebkitClipPath: `url(#${waveClipId})`,
              }}
            >
              {imageConfig?.url ? renderImage("w-full h-full", "cover", {}, { width: 1080, height: 1350 }) : (
                <div className="w-full h-full bg-black/30 flex items-center justify-center text-white/20">
                  <ImageIcon size={100}/>
                </div>
              )}
              <div
                className="absolute inset-0 pointer-events-none"
                style={{
                  background: 'linear-gradient(180deg, transparent 36%, rgba(0,0,0,0.04) 100%)',
                }}
              />
            </div>

            <svg
              className="absolute inset-0 z-[1] pointer-events-none"
              viewBox="0 0 1080 1350"
              preserveAspectRatio="none"
              aria-hidden="true"
            >
              <path
                data-wave-boundary="true"
                d={waveBoundaryPath}
                fill="none"
                stroke={theme.colors.background}
                strokeWidth="8"
                strokeLinecap="round"
                opacity="0.92"
              />
            </svg>

            <div
              data-wave-content-safe-area="true"
              className="absolute z-10 flex flex-col items-center justify-center"
              style={waveContentSafeAreaStyle}
            >
              <div
                data-wave-content="true"
                data-wave-content-zone="top-safe"
                className="w-full h-full max-w-[900px] flex flex-col justify-center min-h-0 mx-auto text-center"
              >
                {renderBlocks({ defaultWidthPercent: waveContentWidth, defaultTextAlign: 'center' })}
              </div>
            </div>
          </div>
        );
      }
      
      const isFullBg = imageConfig?.type === 'IMAGE_BACKGROUND' || imageConfig?.type === 'IMAGE_SELECT' || imageLayoutId === 'IMAGE_BACKGROUND' || isFadeLayout;
      const isSocialPost = isChecklistContent && shouldUseChecklistShell(slide.blocks);
      const isSocialShell = isSocialPost || isHeroSocial;
      if (isFadeLayout) {
        const fadeSide = effectiveOptions.fadeSide || imageConfig?.position || 'left';
        const fadeStrength = Math.min(2, 0.55 + (effectiveOptions.fadeStrength ?? 0.38) * 1.45);
        const fadeBlur = effectiveOptions.fadeBlur ?? 0;
        const fadeColor = effectiveOptions.backgroundOverlayColor || effectiveOptions.black || '#050507';
        const layout = getDirectionalContentLayout(fadeSide);
        const effectiveFadeBlur = Math.max(4, fadeBlur * 1.1);
        const normalizedFadeStrength = Math.min(1, Math.max(0, fadeStrength / 2));
        const baseFadeMetrics = getFadeReadingMetrics(fadeSide, availableCanvasWidth);
        const fadeMetrics = {
          panelMaxWidth: baseFadeMetrics.panelMaxWidth,
          panelEdgeInset: baseFadeMetrics.panelEdgeInset,
          zoneCoverage: Math.min(0.8, baseFadeMetrics.zoneCoverage + normalizedFadeStrength * 0.06),
          zoneStrongStop: Math.max(0.24, baseFadeMetrics.zoneStrongStop - normalizedFadeStrength * 0.04),
          zoneFadeStop: Math.max(0.56, baseFadeMetrics.zoneFadeStop - normalizedFadeStrength * 0.08),
        };
        const fadeContentMaxWidth = getFadeContentMaxWidth(fadeSide, availableCanvasWidth);
        const readingZoneStrong = roundAlpha(Math.min(0.92, 0.74 + normalizedFadeStrength * 0.18));
        const readingZoneMid = roundAlpha(Math.min(0.72, 0.54 + normalizedFadeStrength * 0.18));
        const readingZoneSoft = roundAlpha(Math.min(0.34, 0.18 + normalizedFadeStrength * 0.16));
        const fadeReadingMask = fadeSide === 'right'
          ? 'linear-gradient(270deg, rgba(0,0,0,1) 0%, rgba(0,0,0,0.96) 24%, rgba(0,0,0,0.56) 46%, rgba(0,0,0,0.16) 64%, transparent 78%)'
          : fadeSide === 'left'
            ? 'linear-gradient(90deg, rgba(0,0,0,1) 0%, rgba(0,0,0,0.96) 24%, rgba(0,0,0,0.56) 46%, rgba(0,0,0,0.16) 64%, transparent 78%)'
            : fadeSide === 'top'
              ? 'linear-gradient(180deg, rgba(0,0,0,1) 0%, rgba(0,0,0,0.96) 24%, rgba(0,0,0,0.56) 46%, rgba(0,0,0,0.16) 64%, transparent 78%)'
              : 'linear-gradient(0deg, rgba(0,0,0,1) 0%, rgba(0,0,0,0.96) 24%, rgba(0,0,0,0.56) 46%, rgba(0,0,0,0.16) 64%, transparent 78%)';
        const readingZoneStyle: React.CSSProperties = fadeSide === 'right'
          ? {
            position: 'absolute',
            top: 0,
            right: 0,
            bottom: 0,
            width: `${Math.round(fadeMetrics.zoneCoverage * 100)}%`,
            background: `linear-gradient(270deg, ${hexToRgba(fadeColor, readingZoneStrong)} 0%, ${hexToRgba(fadeColor, readingZoneMid)} ${Math.round(fadeMetrics.zoneStrongStop * 100)}%, ${hexToRgba(fadeColor, readingZoneSoft)} ${Math.round(fadeMetrics.zoneFadeStop * 100)}%, transparent 100%)`,
          }
          : fadeSide === 'left'
            ? {
              position: 'absolute',
              top: 0,
              left: 0,
              bottom: 0,
              width: `${Math.round(fadeMetrics.zoneCoverage * 100)}%`,
              background: `linear-gradient(90deg, ${hexToRgba(fadeColor, readingZoneStrong)} 0%, ${hexToRgba(fadeColor, readingZoneMid)} ${Math.round(fadeMetrics.zoneStrongStop * 100)}%, ${hexToRgba(fadeColor, readingZoneSoft)} ${Math.round(fadeMetrics.zoneFadeStop * 100)}%, transparent 100%)`,
            }
            : fadeSide === 'top'
              ? {
                position: 'absolute',
                top: 0,
                left: 0,
                right: 0,
                height: `${Math.round(fadeMetrics.zoneCoverage * 100)}%`,
                background: `linear-gradient(180deg, ${hexToRgba(fadeColor, readingZoneStrong)} 0%, ${hexToRgba(fadeColor, readingZoneMid)} ${Math.round(fadeMetrics.zoneStrongStop * 100)}%, ${hexToRgba(fadeColor, readingZoneSoft)} ${Math.round(fadeMetrics.zoneFadeStop * 100)}%, transparent 100%)`,
              }
              : {
                position: 'absolute',
                left: 0,
                right: 0,
                bottom: 0,
                height: `${Math.round(fadeMetrics.zoneCoverage * 100)}%`,
                background: `linear-gradient(0deg, ${hexToRgba(fadeColor, readingZoneStrong)} 0%, ${hexToRgba(fadeColor, readingZoneMid)} ${Math.round(fadeMetrics.zoneStrongStop * 100)}%, ${hexToRgba(fadeColor, readingZoneSoft)} ${Math.round(fadeMetrics.zoneFadeStop * 100)}%, transparent 100%)`,
              };
        const readingZoneCompositeStyle: React.CSSProperties = {
          ...readingZoneStyle,
        };
        const readingZoneLuminosityStyle: React.CSSProperties = {
          ...readingZoneStyle,
          mixBlendMode: 'luminosity',
          opacity: 0.06,
        };
        const contrastVeilOpacity = Math.min(0.22, 0.10 + normalizedFadeStrength * 0.08);
        const panelInsetStyle: React.CSSProperties = fadeSide === 'right'
          ? { paddingRight: `${fadeMetrics.panelEdgeInset}px` }
          : fadeSide === 'left'
            ? { paddingLeft: `${fadeMetrics.panelEdgeInset}px` }
            : fadeSide === 'top'
              ? { paddingTop: `${fadeMetrics.panelEdgeInset}px` }
            : { paddingBottom: `${fadeMetrics.panelEdgeInset}px` };
        return (
          <div className="relative h-full w-full overflow-hidden">
            <div className="absolute inset-0 overflow-hidden z-0 w-full h-full">
              {imageConfig?.url ? renderImage("w-full h-full", "cover", {}, { width: 1080, height: 1350 }) : (
                <div className="w-full h-full bg-black/40 flex items-center justify-center text-white/10">
                  <ImageIcon size={100}/>
                </div>
              )}
              {imageConfig?.url && (
                <div
                  data-fade-image-grade="true"
                  className="absolute inset-0 pointer-events-none"
                  style={{
                    backdropFilter: 'saturate(1.18) contrast(1.08) brightness(1.02)',
                    WebkitBackdropFilter: 'saturate(1.18) contrast(1.08) brightness(1.02)',
                    opacity: 0.55,
                  }}
                />
              )}
              {imageConfig?.url && fadeBlur > 0 && (
                <div
                  data-fade-reading-blur="true"
                  className="absolute inset-0 pointer-events-none"
                  style={{
                    backdropFilter: `blur(${Math.max(1, effectiveFadeBlur * 0.2)}px) saturate(1.05) contrast(1.06) brightness(0.98)`,
                    WebkitBackdropFilter: `blur(${Math.max(1, effectiveFadeBlur * 0.2)}px) saturate(1.05) contrast(1.06) brightness(0.98)`,
                    maskImage: fadeReadingMask,
                    WebkitMaskImage: fadeReadingMask,
                    opacity: Math.min(0.18, 0.10 + normalizedFadeStrength * 0.08),
                  }}
                />
              )}
              <div
                data-fade-reading-desaturate="true"
                className="absolute inset-0 pointer-events-none"
                style={{
                  backdropFilter: 'saturate(1.02) contrast(1.04) brightness(0.96)',
                  WebkitBackdropFilter: 'saturate(1.02) contrast(1.04) brightness(0.96)',
                  maskImage: fadeReadingMask,
                  WebkitMaskImage: fadeReadingMask,
                  opacity: Math.min(0.1, 0.05 + normalizedFadeStrength * 0.05),
                }}
              />
              <div
                data-fade-reading-zone={fadeSide}
                className="pointer-events-none"
                style={readingZoneCompositeStyle}
              />
              <div
                data-fade-reading-luminosity={fadeSide}
                className="pointer-events-none"
                style={readingZoneLuminosityStyle}
              />
              <div
                className="absolute inset-0"
                style={{
                  background: getDirectionalGradient(fadeSide, fadeStrength, fadeColor),
                  mixBlendMode: 'multiply',
                  opacity: contrastVeilOpacity,
                }}
              />
            </div>
            <div className={`relative z-10 h-full w-full flex flex-col ${layout.wrapper.replace('justify-center', contentVerticalClass)}`} style={contentPaddingStyle}>
              <div
                className={`w-full flex flex-col justify-center min-h-0 ${layout.panel}`}
                style={{ maxWidth: `${fadeContentMaxWidth}px`, ...panelInsetStyle, ...contentOffsetStyle }}
              >
                {renderBlocks({
                  defaultWidthPercent: 100,
                  defaultTextAlign: fadeSide === 'left'
                    ? 'left'
                    : fadeSide === 'right'
                      ? 'right'
                      : 'center',
                  compactLayout: buildCompactLayoutContext(
                    fadeContentMaxWidth,
                    1350 - padding * 2,
                    imageLayoutId,
                  ),
                })}
              </div>
            </div>
          </div>
        );
      }

      const cinematicOverlayStrength = effectiveOptions.backgroundOverlayStrength ?? ((isHeroContent || isStatContent) ? 0.26 : 0);
      const cinematicBlur = effectiveOptions.backgroundBlur ?? 0;
      const cinematicOverlayColor = effectiveOptions.backgroundOverlayColor || '#1c1c20';
      const hasCinematicContent = isHeroContent || isStatContent;
      const backgroundDarkOverlayOpacity = imageConfig?.overlay === 'dark'
        ? roundAlpha(Math.min(hasCinematicContent ? 0.18 : 0.22, cinematicOverlayStrength * (hasCinematicContent ? 0.28 : 0.32)))
        : 0;
      const cinematicOverlayTopAlpha = roundAlpha(Math.min(0.66, 0.14 + cinematicOverlayStrength * 0.42));
      const cinematicOverlayBottomAlpha = roundAlpha(Math.min(0.82, 0.24 + cinematicOverlayStrength * 0.52));
      const cinematicBlurOpacity = roundAlpha(Math.min(0.28, cinematicOverlayStrength * 0.18));
      const preserveHighlights = effectiveOptions.preserveHighlights ?? 0.25;
      const hasBackgroundReadingIsland = false;
      const socialShellClass = isHeroSocial ? 'mx-auto text-left' : contentSelfClass;
      const socialLayoutContext = isHeroSocial
        ? { defaultWidthPercent: 100, defaultTextAlign: 'left' as const }
        : undefined;
      const socialPostBlocks = isHeroSocial
        ? slide.blocks.map(normalizeSocialPostBlock)
        : slide.blocks;
      const socialHighlightBg = theme.colors.hlBgColor || theme.colors.accent;
      const socialTheme = isSocialShell
        ? {
            ...theme,
            colors: {
              ...theme.colors,
              background: '#FFFFFF',
              textPrimary: '#141414',
              textSecondary: 'rgba(20,20,20,0.72)',
              cardBg: '#FFFFFF',
              cardTextColor: '#141414',
              hlBgColor: socialHighlightBg,
              hlTextColor: getContrastTextColor(socialHighlightBg, '#FFFFFF', '#141414'),
            },
          }
        : theme;
      const socialShellStyle = isSocialShell
        ? {
            backgroundColor: '#FFFFFF',
            border: '1px solid rgba(20,20,20,0.08)',
            boxShadow: '0 28px 88px rgba(0,0,0,0.18)',
          }
        : undefined;
      const isProfileMode = false;
      const profileGlassStrength = effectiveOptions.backgroundOverlayStrength ?? 0.32;
      const profileGlassBlur = effectiveOptions.backgroundBlur ?? 18;
      const profileFocusVisualStyles = isProfileMode
        ? getProfileFocusVisualStyles({
            white: effectiveOptions.white,
            strength: profileGlassStrength,
            blur: profileGlassBlur,
          })
        : null;
      const profileShellStyle = isProfileMode
        ? {
            ...profileFocusVisualStyles?.shell,
            boxShadow: undefined,
          }
        : undefined;

      return (
        <div className="relative h-full w-full overflow-hidden">
          {isFullBg && (
            <div className="absolute inset-0 overflow-hidden z-0 w-full h-full">
              {imageConfig?.url ? renderImage("w-full h-full", "cover", {}, { width: 1080, height: 1350 }) : (
                <div className="w-full h-full bg-black/40 flex items-center justify-center text-white/10">
                  <ImageIcon size={100}/>
                </div>
              )}
              {backgroundDarkOverlayOpacity > 0 && (
                <div
                  className="absolute inset-0"
                  style={{ backgroundColor: `rgba(0,0,0,${backgroundDarkOverlayOpacity})` }}
                />
              )}
              {hasCinematicContent && (
                <>
                  <div
                    data-background-image-grade="true"
                    className="absolute inset-0 pointer-events-none"
                    style={{
                      backdropFilter: 'saturate(1.08) contrast(1.12) brightness(0.96)',
                      WebkitBackdropFilter: 'saturate(1.08) contrast(1.12) brightness(0.96)',
                    }}
                  />
                  <div
                    className="absolute inset-0 pointer-events-none"
                    style={{
                      background: `linear-gradient(180deg, ${hexToRgba(cinematicOverlayColor, cinematicOverlayTopAlpha)} 0%, ${hexToRgba(cinematicOverlayColor, cinematicOverlayBottomAlpha)} 100%)`,
                    }}
                  />
                  <div
                    data-background-reading-veil="true"
                    className="absolute inset-0 pointer-events-none"
                    style={{
                      background: `radial-gradient(ellipse at center, ${hexToRgba(cinematicOverlayColor, Math.min(0.34, 0.10 + cinematicOverlayStrength * 0.34))} 0%, ${hexToRgba(cinematicOverlayColor, Math.min(0.18, 0.05 + cinematicOverlayStrength * 0.18))} 42%, transparent 72%)`,
                    }}
                  />
                  {cinematicBlur > 0 && (
                    <div
                      className="absolute inset-0 pointer-events-none"
                      style={{
                        backdropFilter: `blur(${cinematicBlur}px)`,
                        WebkitBackdropFilter: `blur(${cinematicBlur}px)`,
                        opacity: cinematicBlurOpacity,
                        maskImage: 'linear-gradient(180deg, rgba(0,0,0,0.8) 0%, rgba(0,0,0,0.55) 42%, rgba(0,0,0,0.22) 72%, transparent 100%)',
                        WebkitMaskImage: 'linear-gradient(180deg, rgba(0,0,0,0.8) 0%, rgba(0,0,0,0.55) 42%, rgba(0,0,0,0.22) 72%, transparent 100%)',
                      }}
                    />
                  )}
                </>
              )}
            </div>
          )}
          <div className={`relative z-10 h-full w-full flex flex-col ${contentVerticalClass} ${contentHorizontalClass}`} style={contentPaddingStyle}>
            {isProfileMode ? (
              <div className={`relative w-full max-w-[840px] ${contentSelfClass}`} style={contentOffsetStyle}>
                <div
                  className="absolute inset-0 rounded-[56px] pointer-events-none"
                  style={{
                    ...profileFocusVisualStyles?.shadow,
                    outline: debugMode ? '2px solid rgba(250,204,21,0.85)' : undefined,
                  }}
                />
                <div
                  className="relative overflow-hidden rounded-[56px] p-16 flex flex-col justify-center min-h-0"
                  style={{
                    ...profileShellStyle,
                    outline: debugMode ? '2px solid rgba(34,197,94,0.85)' : undefined,
                  }}
                >
                  <div
                    className="absolute inset-0 pointer-events-none"
                    style={{
                      background: 'linear-gradient(135deg, rgba(255,255,255,0.34), rgba(255,255,255,0.12) 34%, rgba(255,255,255,0.04) 64%, rgba(255,255,255,0.16) 100%)',
                      mixBlendMode: 'screen',
                    }}
                  />
                  <div
                    className="absolute inset-[1px] rounded-[54px] pointer-events-none"
                    style={{ border: '1px solid rgba(255,255,255,0.12)' }}
                  />
                  {renderBlocks()}
                </div>
              </div>
            ) : (
              <div
                data-hero-variant={isHeroSocial ? 'social' : 'default'}
                className={`w-full ${isHeroSocial ? 'max-w-[840px]' : 'max-w-[840px]'} flex flex-col justify-center min-h-0 ${socialShellClass} ${isSocialShell ? 'rounded-[44px] p-20' : ''}`}
                style={{ ...socialShellStyle, ...contentOffsetStyle }}
              >
                {renderBlocks(socialLayoutContext, socialTheme, socialPostBlocks)}
              </div>
            )}
          </div>
        </div>
      );
    };
    return (<div className="h-full w-full overflow-hidden">{renderLayoutInternal()}</div>);
  };

  const customFontsCSS = useMemo(() => {
    if (!customFonts || customFonts.length === 0) return '';
    return getPreferredFontsForInjection(customFonts, brandTheme?.paletteId)
      .map((font) => {
        const definition = getFontFaceDefinition(font);
        return `@font-face { font-family: '${definition.family}'; src: url('${definition.url}') ${definition.format}; font-display: swap; font-weight: ${definition.weight}; font-style: ${definition.style}; }`;
      })
      .join('\n');
  }, [brandTheme?.paletteId, customFonts]);

  const renderImageBoxGuides = () => {
    if (selectedImageBoxMode !== 'box') return null;

    const canvasCenterX = 540;
    const canvasCenterY = 675;
    const rectLeft = imageBoxGuideRect?.left ?? 0;
    const rectRight = imageBoxGuideRect ? imageBoxGuideRect.left + imageBoxGuideRect.width : 0;
    const rectTop = imageBoxGuideRect?.top ?? 0;
    const rectBottom = imageBoxGuideRect ? imageBoxGuideRect.top + imageBoxGuideRect.height : 0;
    const isSnappedX = !!imageBoxGuides?.isCenteredHorizontally;
    const isSnappedY = !!imageBoxGuides?.isCenteredVertically;
    const leftDistance = Math.max(0, Math.round(rectLeft));
    const rightDistance = Math.max(0, Math.round(1080 - rectRight));
    const topDistance = Math.max(0, Math.round(rectTop));
    const bottomDistance = Math.max(0, Math.round(1350 - rectBottom));

    const renderDistancePill = (label: string, style: React.CSSProperties) => (
      <div
        className="absolute px-3.5 py-2 rounded-full bg-black/78 text-[10px] font-black tracking-[0.14em] text-brand backdrop-blur-md border border-brand/35 shadow-[0_8px_24px_rgba(0,0,0,0.32)] min-w-[70px] text-center"
        style={style}
      >
        {label}
      </div>
    );

    return (
      <div className="absolute inset-0 pointer-events-none z-[55]">
        <div
          className={`absolute top-0 bottom-0 w-px transition-all ${isSnappedX ? 'bg-brand opacity-100' : 'bg-brand/25 opacity-70 border-l border-dashed border-brand/30'}`}
          style={{ left: `${canvasCenterX}px` }}
        />
        <div
          className={`absolute left-0 right-0 h-px transition-all ${isSnappedY ? 'bg-brand opacity-100' : 'bg-brand/25 opacity-70 border-t border-dashed border-brand/30'}`}
          style={{ top: `${canvasCenterY}px` }}
        />
        {(isSnappedX || isSnappedY) && (
          <div className="absolute w-[7px] h-[7px] rounded-full bg-brand -translate-x-1/2 -translate-y-1/2" style={{ left: `${canvasCenterX}px`, top: `${canvasCenterY}px` }} />
        )}
        {imageBoxGuideRect && (
          <>
            <div className="absolute h-px bg-brand/22" style={{ left: 0, width: `${rectLeft}px`, top: `${canvasCenterY}px` }} />
            <div className="absolute h-px bg-brand/22" style={{ left: `${rectRight}px`, right: 0, top: `${canvasCenterY}px` }} />
            <div className="absolute w-px bg-brand/22" style={{ top: 0, height: `${rectTop}px`, left: `${canvasCenterX}px` }} />
            <div className="absolute w-px bg-brand/22" style={{ top: `${rectBottom}px`, bottom: 0, left: `${canvasCenterX}px` }} />

            {renderDistancePill(`${leftDistance}px`, {
              left: `${Math.max(12, rectLeft / 2)}px`,
              top: `${canvasCenterY + 14}px`,
              transform: 'translateX(-50%)',
            })}
            {renderDistancePill(`${rightDistance}px`, {
              left: `${rectRight + Math.max(18, rightDistance / 2)}px`,
              top: `${canvasCenterY + 14}px`,
              transform: 'translateX(-50%)',
            })}
            {renderDistancePill(`${topDistance}px`, {
              left: `${canvasCenterX + 14}px`,
              top: `${Math.max(12, rectTop / 2)}px`,
              transform: 'translateY(-50%)',
            })}
            {renderDistancePill(`${bottomDistance}px`, {
              left: `${canvasCenterX + 14}px`,
              top: `${rectBottom + Math.max(18, bottomDistance / 2)}px`,
              transform: 'translateY(-50%)',
            })}
          </>
        )}
        {isSnappedX && imageBoxGuideRect && (
          <>
            <div className="absolute h-px bg-brand/60" style={{ left: 0, width: `${rectLeft}px`, top: `${canvasCenterY}px` }} />
            <div className="absolute h-px bg-brand/60" style={{ left: `${rectRight}px`, right: 0, top: `${canvasCenterY}px` }} />
          </>
        )}
        {isSnappedY && imageBoxGuideRect && (
          <>
            <div className="absolute w-px bg-brand/60" style={{ top: 0, height: `${rectTop}px`, left: `${canvasCenterX}px` }} />
            <div className="absolute w-px bg-brand/60" style={{ top: `${rectBottom}px`, bottom: 0, left: `${canvasCenterX}px` }} />
          </>
        )}
        {!!imageBoxGuides?.hasEqualHorizontalSpacing && imageBoxGuideRect && (
          <>
            <div className="absolute top-0 bottom-0 w-px border-l border-dashed border-brand/45" style={{ left: `${rectLeft}px` }} />
            <div className="absolute top-0 bottom-0 w-px border-l border-dashed border-brand/45" style={{ left: `${rectRight}px` }} />
          </>
        )}
        {!!imageBoxGuides?.hasEqualVerticalSpacing && imageBoxGuideRect && (
          <>
            <div className="absolute left-0 right-0 h-px border-t border-dashed border-brand/35" style={{ top: `${rectTop}px` }} />
            <div className="absolute left-0 right-0 h-px border-t border-dashed border-brand/35" style={{ top: `${rectBottom}px` }} />
          </>
        )}
      </div>
    );
  };

  return (
    <div
      ref={canvasRef}
      onMouseDownCapture={(event) => {
        const target = event.target as HTMLElement | null;
        const clickedInsideImageBox = !!(target && imageBoxTargetRef.current?.contains(target));
        const clickedMoveableControl = !!target?.closest('.moveable-control-box');

        if (!clickedInsideImageBox && !clickedMoveableControl) {
          setSelectedImageBoxMode(null);
        }
      }}
      style={{ backgroundColor: theme.colors.background, color: theme.colors.textPrimary, fontFamily: theme.typography.fontFamily }}
      className="relative w-[1080px] h-[1350px] flex flex-col shadow-2xl overflow-hidden shrink-0 select-auto"
    >
      <style dangerouslySetInnerHTML={{ __html: customFontsCSS }} />
      {slide.options?.backgroundImage && imageLayoutId !== 'IMAGE_NONE' && (
        <div className="absolute inset-0 z-0 w-full h-full pointer-events-none">
          <img src={slide.options.backgroundImage} className="w-full h-full object-cover" alt="" />
        </div>
      )}
      {renderTornPaperSVG()}
      {renderLayout()}
      {renderImageBoxGuides()}
      {imageConfig?.type === 'IMAGE_BOX' && selectedImageBoxMode && imageBoxTargetRef.current && (
        <Moveable
          target={imageBoxTargetRef}
          origin={false}
          draggable
          resizable={selectedImageBoxMode === 'box'}
          keepRatio={false}
          snappable={selectedImageBoxMode === 'box'}
          snapContainer={canvasRef.current || undefined}
          verticalGuidelines={[540]}
          horizontalGuidelines={[675]}
          snapThreshold={48}
          snapGap
          isDisplaySnapDigit={false}
          snapDirections={{ left: true, top: true, right: true, bottom: true, center: true, middle: true }}
          renderDirections={selectedImageBoxMode === 'box' ? ['nw', 'n', 'ne', 'w', 'e', 'sw', 's', 'se'] : []}
          throttleDrag={0}
          throttleResize={0}
          edge={false}
          onDragStart={(event: any) => {
            const currentState = getCurrentImageBoxState();
            if (!(event.target instanceof Element)) return;
            const targetBounds = event.target.getBoundingClientRect();
            const canvasBounds = canvasRef.current?.getBoundingClientRect();
            if (!canvasBounds) return;

            interactionStartRef.current = {
              naturalLeft: targetBounds.left - canvasBounds.left - currentState.boxX,
              naturalTop: targetBounds.top - canvasBounds.top - currentState.boxY,
              width: currentState.width,
              height: currentState.height,
            };
            snapLockRef.current = { x: false, y: false };
            event.set(selectedImageBoxMode === 'image'
              ? [currentState.imageX, currentState.imageY]
              : [currentState.boxX, currentState.boxY]);
          }}
          onDrag={(event: any) => {
            const startState = interactionStartRef.current;
            if (!startState) return;

            const baseState = getCurrentImageBoxState();
            const translatedX = event.beforeTranslate[0] / safeInteractionScale;
            const translatedY = event.beforeTranslate[1] / safeInteractionScale;
            if (selectedImageBoxMode === 'image') {
              scheduleImageBoxState({
                ...baseState,
                imageX: translatedX,
                imageY: translatedY,
              }, imageBoxGuides, imageBoxGuideRect);
              return;
            }

            const nextRect = {
              left: startState.naturalLeft + translatedX,
              top: startState.naturalTop + translatedY,
              width: baseState.width,
              height: baseState.height,
            };
            const guides = getImageBoxGuides(nextRect, { width: 1080, height: 1350 });
            const nextSnapLock = resolveImageBoxSnapLock(
              snapLockRef.current,
              guides,
              { x: 84, y: 84 },
              { x: 132, y: 132 },
            );
            snapLockRef.current = nextSnapLock;
            const nextDraft = {
              ...baseState,
              boxX: translatedX + (nextSnapLock.x ? (guides.snapX ?? 0) : 0),
              boxY: translatedY + (nextSnapLock.y ? (guides.snapY ?? 0) : 0),
            };
            scheduleImageBoxState(nextDraft, {
              ...guides,
              isCenteredHorizontally: nextSnapLock.x,
              isCenteredVertically: nextSnapLock.y,
              hasEqualHorizontalSpacing: nextSnapLock.x,
              hasEqualVerticalSpacing: nextSnapLock.y,
            }, {
              ...nextRect,
              left: nextRect.left + (nextSnapLock.x ? (guides.snapX ?? 0) : 0),
              top: nextRect.top + (nextSnapLock.y ? (guides.snapY ?? 0) : 0),
            });
          }}
          onDragEnd={() => {
            snapLockRef.current = { x: false, y: false };
            const latestDraft = flushPendingImageBoxState();
            if (!latestDraft) return;
            commitImageBoxDraft(latestDraft);
          }}
          onResizeStart={(event: any) => {
            const currentState = getCurrentImageBoxState();
            if (!(event.target instanceof Element)) return;
            const targetBounds = event.target.getBoundingClientRect();
            const canvasBounds = canvasRef.current?.getBoundingClientRect();
            if (!canvasBounds) return;

            interactionStartRef.current = {
              naturalLeft: targetBounds.left - canvasBounds.left - currentState.boxX,
              naturalTop: targetBounds.top - canvasBounds.top - currentState.boxY,
              width: currentState.width,
              height: currentState.height,
            };
            snapLockRef.current = { x: false, y: false };
            event.setOrigin?.(['50%', '50%']);
            event.dragStart?.set([currentState.boxX, currentState.boxY]);
          }}
          onResize={(event: any) => {
            if (selectedImageBoxMode !== 'box') return;
            const startState = interactionStartRef.current;
            if (!startState) return;

            const baseState = getCurrentImageBoxState();
            const resizedTranslateX = event.drag.beforeTranslate[0] / safeInteractionScale;
            const resizedTranslateY = event.drag.beforeTranslate[1] / safeInteractionScale;
            const clampedSize = clampImageBoxDimensions(
              {
                width: event.width,
                height: event.height,
              },
              {
                minWidth: 180,
                maxWidth: 860,
                minHeight: 220,
                maxHeight: 1120,
              },
            );
            const nextRect = {
              left: startState.naturalLeft + resizedTranslateX,
              top: startState.naturalTop + resizedTranslateY,
              width: clampedSize.width,
              height: clampedSize.height,
            };
            const guides = getImageBoxGuides(nextRect, { width: 1080, height: 1350 });
            const nextSnapLock = resolveImageBoxSnapLock(
              snapLockRef.current,
              guides,
              { x: 84, y: 84 },
              { x: 132, y: 132 },
            );
            snapLockRef.current = nextSnapLock;
            scheduleImageBoxState({
              ...baseState,
              width: clampedSize.width,
              height: clampedSize.height,
              boxX: resizedTranslateX + (nextSnapLock.x ? (guides.snapX ?? 0) : 0),
              boxY: resizedTranslateY + (nextSnapLock.y ? (guides.snapY ?? 0) : 0),
            }, {
              ...guides,
              isCenteredHorizontally: nextSnapLock.x,
              isCenteredVertically: nextSnapLock.y,
              hasEqualHorizontalSpacing: nextSnapLock.x,
              hasEqualVerticalSpacing: nextSnapLock.y,
            }, {
              ...nextRect,
              left: nextRect.left + (nextSnapLock.x ? (guides.snapX ?? 0) : 0),
              top: nextRect.top + (nextSnapLock.y ? (guides.snapY ?? 0) : 0),
            });
          }}
          onResizeEnd={() => {
            snapLockRef.current = { x: false, y: false };
            const latestDraft = flushPendingImageBoxState();
            if (!latestDraft) return;
            commitImageBoxDraft(latestDraft);
          }}
        />
      )}
      {renderFloatingOverlays()}
      {renderFXOverlays()}
      {debugMode && (
        <div className="pointer-events-none absolute left-6 top-6 z-[70] w-[420px] rounded-[24px] border border-amber-300/40 bg-black/88 p-4 shadow-2xl backdrop-blur-xl">
          <div className="mb-3 flex items-center justify-between gap-3">
            <span className="text-[10px] font-black uppercase tracking-[0.24em] text-amber-300">Canvas Debug</span>
            <span className="text-[10px] font-mono text-amber-100/70">slide {index + 1}</span>
          </div>
          <div className="space-y-1.5 text-[11px] leading-5 text-amber-50/90 font-mono">
            <div><span className="font-black text-amber-200">template</span>: {contentTemplateId}</div>
            <div><span className="font-black text-amber-200">imageLayout</span>: {imageLayoutId}</div>
            <div><span className="font-black text-amber-200">image.type</span>: {imageConfig?.type || 'NONE'}</div>
            <div><span className="font-black text-amber-200">image.position</span>: {imageConfig?.position || 'center'}</div>
            <div><span className="font-black text-amber-200">cutout</span>: {isCutoutImage ? 'true' : 'false'}</div>
            <div><span className="font-black text-amber-200">image.offset</span>: {imageConfig?.imageX ?? 0} / {imageConfig?.imageY ?? 0}</div>
            <div><span className="font-black text-amber-200">image.scale</span>: {imageConfig?.imageScale ?? 1}</div>
            <div><span className="font-black text-amber-200">cover.expected</span>: {debugExpectsCoverTransform ? 'true' : 'false'}</div>
            <div><span className="font-black text-amber-200">cover.metrics</span>: {debugCoverMetrics ? 'ready' : 'missing'}</div>
            {resolvedImageNaturalSize && (
              <div><span className="font-black text-amber-200">image.natural</span>: {resolvedImageNaturalSize.width}x{resolvedImageNaturalSize.height}</div>
            )}
            {debugCoverMetrics && (
              <>
                <div><span className="font-black text-amber-200">cover.rendered</span>: {debugCoverMetrics.renderedWidth}x{debugCoverMetrics.renderedHeight}</div>
                <div><span className="font-black text-amber-200">cover.maxOffset</span>: {debugCoverMetrics.maxOffsetX} / {debugCoverMetrics.maxOffsetY}</div>
                <div><span className="font-black text-amber-200">cover.offset</span>: {imageConfig?.imageX ?? 0} / {imageConfig?.imageY ?? 0}</div>
                <div><span className="font-black text-amber-200">cover.clamped</span>: {debugClampedImageX ?? 0} / {debugClampedImageY ?? 0}</div>
                <div><span className="font-black text-amber-200">cover.scale</span>: {imageConfig?.imageScale ?? 1}</div>
              </>
            )}
            <div><span className="font-black text-amber-200">blocks</span>:</div>
                <div className="rounded-2xl border border-white/8 bg-white/[0.04] px-3 py-2 text-[10px] leading-5 text-amber-50/85">
                  {debugBlockSummary.map((entry) => (
                    <div key={`debug-block-${entry.index}`}>
                      #{entry.index} {entry.type}
                      {entry.variant ? ` (${entry.variant})` : ''}
                      {entry.fontSize ? ` saved@${entry.fontSize}` : ''}
                    </div>
                  ))}
                </div>
          </div>
        </div>
      )}
    </div>
  )
}

export const SlideCanvas: React.FC<SlideCanvasProps> = (props) => (
  props.slide.cover ? <CoverSlideCanvas {...props} /> : <RegularSlideCanvas {...props} />
)
