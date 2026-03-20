
import React, { useCallback, useEffect, useMemo, useRef, useState } from 'react'
import Moveable from 'react-moveable'
import { ValidatedSlide } from '../template-dsl/schema'
import { TOKENS } from '../design-tokens/tokens'
import { renderBlock } from './renderBlock'
import { templateRegistry } from '../domain/templates/TemplateRegistry'
import { Image as ImageIcon, Box, User, Layers, Package } from 'lucide-react'
import { Block, BrandTheme, CustomFont, ProjectFX } from '../types'
import {
  createDarkenedOverlayColor,
  getFontFaceDefinition,
  getDirectionalSampleRegion,
  getPreferredFontsForInjection,
  mergeSlideOptionsWithBrandTheme,
  quoteFontFamily,
  rgbToHex,
} from '../utils/branding'
import { getProfileFocusVisualStyles } from '../utils/profile-focus'
import {
  clampImageBoxDimensions,
  getImageBoxGuides,
  resolveImageBoxSnapLock,
  type ImageBoxGuides,
  type ImageBoxRect,
} from '../utils/image-box-interaction'

export const SlideCanvas: React.FC<{ 
  slide: ValidatedSlide, 
  index: number, 
  canvasRef: React.RefObject<HTMLDivElement>,
  onEditIcon?: (block: Block, index: number) => void,
  customFonts?: CustomFont[],
  brandTheme?: BrandTheme,
  projectFX?: ProjectFX,
  onUpdateImage?: (updates: { path: (string | number)[]; value: any }[]) => void,
  onSelectionChange?: (selection: { type: 'IMAGE_BOX'; mode: 'box' | 'image' } | null) => void,
  debugMode?: boolean,
}> = ({ slide, index, canvasRef, onEditIcon, customFonts, brandTheme, projectFX, onUpdateImage, onSelectionChange, debugMode = false }) => {
  const templateDef = templateRegistry.get(slide.template)
  const effectiveOptions = useMemo(
    () => mergeSlideOptionsWithBrandTheme(brandTheme, slide.options, projectFX),
    [brandTheme, projectFX, slide.options],
  )
  
  const theme = useMemo(() => {
    const baseTextSecondary = effectiveOptions.text
      ? `${effectiveOptions.text}CC`
      : TOKENS.colors.textSecondary
    
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

  if (!templateDef) return <div ref={canvasRef} className="w-[1080px] h-[1350px] bg-red-900 flex items-center justify-center text-white font-bold">ERROR: TEMPLATE NOT FOUND</div>

  const imageConfig = slide.image;
  const overlayImages = slide.overlayImages || [];
  const texture = slide.options?.texture;
  const fx = effectiveOptions.postFX;
  const [fadeSampleColor, setFadeSampleColor] = useState<string | null>(null);
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

  const blockGap = effectiveOptions.blockGap !== undefined ? effectiveOptions.blockGap : 24;
  const sectionGap = effectiveOptions.sectionGap !== undefined ? effectiveOptions.sectionGap : 48;
  const padding = effectiveOptions.padding !== undefined ? effectiveOptions.padding : 80;

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
    if (!pending) return;

    setImageBoxDraft(pending.draft);
    setImageBoxGuides(pending.guides);
    setImageBoxGuideRect(pending.rect);
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
    if (templateDef?.name !== 'FADE' || !imageConfig?.url) {
      setFadeSampleColor(null);
      return;
    }

    let cancelled = false;
    const img = new Image();
    img.crossOrigin = 'anonymous';
    img.referrerPolicy = 'no-referrer';

    img.onload = () => {
      if (cancelled) return;

      try {
        const sampleWidth = 96;
        const sampleHeight = 120;
        const canvas = document.createElement('canvas');
        canvas.width = sampleWidth;
        canvas.height = sampleHeight;
        const context = canvas.getContext('2d', { willReadFrequently: true });
        if (!context) {
          setFadeSampleColor(null);
          return;
        }

        context.drawImage(img, 0, 0, sampleWidth, sampleHeight);

        const region = getDirectionalSampleRegion(
          (effectiveOptions.fadeSide || imageConfig.position || 'left') as 'left' | 'right' | 'top' | 'bottom',
          sampleWidth,
          sampleHeight,
        );

        const { data } = context.getImageData(region.sx, region.sy, region.sw, region.sh);
        let r = 0;
        let g = 0;
        let b = 0;
        let count = 0;

        for (let index = 0; index < data.length; index += 4) {
          const alpha = data[index + 3];
          if (alpha === 0) continue;
          r += data[index];
          g += data[index + 1];
          b += data[index + 2];
          count += 1;
        }

        if (!count) {
          setFadeSampleColor(null);
          return;
        }

        const average = {
          r: Math.round(r / count),
          g: Math.round(g / count),
          b: Math.round(b / count),
        };

        setFadeSampleColor(rgbToHex(createDarkenedOverlayColor(average)));
      } catch {
        setFadeSampleColor(null);
      }
    };

    img.onerror = () => {
      if (!cancelled) setFadeSampleColor(null);
    };

    img.src = imageConfig.url;

    return () => {
      cancelled = true;
    };
  }, [effectiveOptions.fadeSide, imageConfig?.position, imageConfig?.url, templateDef?.name]);

  useEffect(() => {
    setImageBoxDraft(null);
    setImageBoxGuides(null);
    setImageBoxGuideRect(null);
    setSelectedImageBoxMode(null);
    snapLockRef.current = { x: false, y: false };
  }, [index, slide.template, imageConfig?.type, imageConfig?.url]);

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

  const renderImage = (className: string, fit: 'cover' | 'contain' = 'cover', extraStyle: React.CSSProperties = {}) => {
    if (!imageConfig?.url) return null;
    const imgScale = imageConfig.imageScale ?? 1;
    const imgRotation = imageConfig.imageRotation ?? 0;
    const currentBoxState = getCurrentImageBoxState();
    const imgX = currentBoxState.imageX;
    const imgY = currentBoxState.imageY;
    const opacity = imageConfig.backgroundOpacity ?? 1;
    const maskId = `tornMask-${index}`;
    const imageTransitionClass = imageConfig.type === 'IMAGE_BOX' && selectedImageBoxMode
      ? ''
      : 'transition-all duration-300 ease-out';
    return (
      <div className={`${className} ${imageTransitionClass}`} style={{ clipPath: imageConfig.hasTornEdges ? `url(#${maskId})` : 'none', ...extraStyle }}>
        <img src={imageConfig.url} className={`block w-full h-full ${fit === 'cover' ? 'object-cover' : 'object-contain'}`} style={{ objectPosition: `calc(50% + ${imgX}px) calc(50% + ${imgY}px)`, transform: `scale(${imgScale}) rotate(${imgRotation}deg)`, transformOrigin: 'center', opacity: opacity }} alt="" />
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

  const hasCenteredBox = slide.blocks.some((block) =>
    block.type === 'BOX' && ((block.options?.align || block.options?.textAlign) === 'center'),
  );
  const defaultTextAlign = hasCenteredBox ? 'center' as const : undefined;

  const renderBoxGroup = (boxBlocks: Block[], startIndex: number) => {
    const groupAlign = effectiveOptions.boxGroupAlign || 'left';
    const groupLayout = effectiveOptions.boxGroupLayout || 'auto';
    const total = boxBlocks.length;
    const resolvedLayout = groupLayout === 'auto'
      ? total === 1
        ? 'stack'
        : total === 2
          ? 'row'
          : 'grid'
      : groupLayout;
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
    const groupMaxWidth = total === 1
      ? '940px'
      : total === 2
        ? '980px'
        : '1040px';

    const renderBoxItem = (block: Block, localIndex: number, asGridMember: boolean) => (
      <React.Fragment key={`box-${startIndex + localIndex}`}>
        {renderBlock(
          block,
          theme,
          onEditIcon,
          asGridMember,
          localIndex,
          startIndex + localIndex,
          { totalInGroup: total, groupLayout: resolvedLayout },
          { defaultWidthPercent: effectiveOptions.contentWidthPercent, defaultTextAlign },
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

    if (resolvedLayout === 'stack') {
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

    if (resolvedLayout === 'row') {
      return (
        <div className={`w-full flex ${justifyClass}`}>
          <div className="grid grid-cols-2 gap-6 w-full auto-rows-fr items-stretch" style={{ maxWidth: groupMaxWidth }}>
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
        <div className="grid grid-cols-2 gap-6 w-full auto-rows-fr items-stretch" style={{ maxWidth: groupMaxWidth }}>
          {boxBlocks.map((block, localIndex) => {
            const shouldSpanFull = total === 3 && localIndex === 0;
            return (
              <div key={`box-grid-${startIndex + localIndex}`} className={`${shouldSpanFull ? 'col-span-2' : ''} h-full`}>
                {renderBlock(
                  block,
                  theme,
                  onEditIcon,
                  true,
                  localIndex,
                  startIndex + localIndex,
                  { totalInGroup: total, groupLayout: resolvedLayout },
                  { defaultWidthPercent: effectiveOptions.contentWidthPercent, defaultTextAlign },
                )}
              </div>
            );
          })}
        </div>
      </div>
    );
  };

  const renderBlocks = () => {
    const groups: React.ReactNode[] = [];

    for (let index = 0; index < slide.blocks.length; index += 1) {
      const currentBlock = slide.blocks[index];

      if (currentBlock.type === 'BOX') {
        const boxBlocks: Block[] = [];
        const startIndex = index;

        while (index < slide.blocks.length && slide.blocks[index].type === 'BOX') {
          boxBlocks.push(slide.blocks[index]);
          index += 1;
        }

        groups.push(
          <React.Fragment key={`box-group-${startIndex}`}>
            {renderBoxGroup(boxBlocks, startIndex)}
          </React.Fragment>,
        );

        index -= 1;
        continue;
      }

      groups.push(
        <React.Fragment key={index}>
          {renderBlock(
            currentBlock,
            theme,
            onEditIcon,
            false,
            0,
            index,
            undefined,
            { defaultWidthPercent: effectiveOptions.contentWidthPercent, defaultTextAlign },
          )}
        </React.Fragment>,
      );
    }

    return <div className="w-full relative z-30 flex flex-col" style={{ gap: `${blockGap}px` }}>{groups}</div>;
  };

  const renderFXOverlays = () => {
    const overlays: React.ReactNode[] = [];
    const fxId = `fx-${index}`;
    if (fx?.lightingIntensity && fx.lightingIntensity > 0) overlays.push(<div key="fx-lighting" className="absolute inset-0 pointer-events-none z-[42]" style={{ background: `radial-gradient(circle at 30% 20%, rgba(255,255,255,${fx.lightingIntensity * 0.15}), transparent 80%)`, mixBlendMode: 'screen' }} />);
    if (fx?.vignette && fx.vignette > 0) overlays.push(<div key="fx-vignette" className="absolute inset-0 pointer-events-none z-[48]" style={{ background: `radial-gradient(circle, transparent 40%, rgba(0,0,0,${fx.vignette * 0.6}) 100%)`, mixBlendMode: 'multiply' }} />);
    if (fx?.noiseAmount && fx.noiseAmount > 0) overlays.push(<div key="fx-noise" className="absolute inset-0 pointer-events-none z-[49]" style={{ opacity: fx.noiseAmount, mixBlendMode: (fx.noiseMode as any) || 'multiply' }}><svg width="100%" height="100%"><filter id={`${fxId}-noise`}><feTurbulence type="fractalNoise" baseFrequency="0.65" numOctaves="3" stitchTiles="stitch" /><feColorMatrix type="saturate" values="0" /></filter><rect width="100%" height="100%" filter={`url(#${fxId}-noise)`} fill="transparent" /></svg></div>);
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

  const getDirectionalGradient = (side: 'left' | 'right' | 'top' | 'bottom', strength: number, color: string) => {
    const normalizedStrength = Math.min(1, Math.max(0, strength / 2));
    const shadeStrong = hexToRgba(color, Math.min(0.72, 0.08 + normalizedStrength * 0.52));
    const shadeMid = hexToRgba(color, Math.min(0.42, 0.04 + normalizedStrength * 0.24));
    switch (side) {
      case 'right':
        return `linear-gradient(270deg, ${shadeStrong} 0%, ${shadeMid} 42%, transparent 82%)`;
      case 'top':
        return `linear-gradient(180deg, ${shadeStrong} 0%, ${shadeMid} 42%, transparent 82%)`;
      case 'bottom':
        return `linear-gradient(0deg, ${shadeStrong} 0%, ${shadeMid} 42%, transparent 82%)`;
      case 'left':
      default:
        return `linear-gradient(90deg, ${shadeStrong} 0%, ${shadeMid} 42%, transparent 82%)`;
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
    const horizontalAlign = effectiveOptions.contentHorizontalAlign || 'left';
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
    const horizontalAlign = effectiveOptions.contentHorizontalAlign || 'left';
    return horizontalAlign === 'center'
      ? 'mx-auto text-center'
      : horizontalAlign === 'right'
        ? 'ml-auto mr-0 text-right'
        : 'mr-auto ml-0 text-left';
  };

  const getDirectionalMask = (side: 'left' | 'right' | 'top' | 'bottom') => {
    switch (side) {
      case 'right':
        return 'linear-gradient(270deg, rgba(0,0,0,1) 0%, rgba(0,0,0,0.92) 24%, rgba(0,0,0,0.62) 52%, rgba(0,0,0,0.18) 78%, transparent 96%)';
      case 'top':
        return 'linear-gradient(180deg, rgba(0,0,0,1) 0%, rgba(0,0,0,0.92) 24%, rgba(0,0,0,0.62) 52%, rgba(0,0,0,0.18) 78%, transparent 96%)';
      case 'bottom':
        return 'linear-gradient(0deg, rgba(0,0,0,1) 0%, rgba(0,0,0,0.92) 24%, rgba(0,0,0,0.62) 52%, rgba(0,0,0,0.18) 78%, transparent 96%)';
      case 'left':
      default:
        return 'linear-gradient(90deg, rgba(0,0,0,1) 0%, rgba(0,0,0,0.92) 24%, rgba(0,0,0,0.62) 52%, rgba(0,0,0,0.18) 78%, transparent 96%)';
    }
  };

  const getFadeContentMaxWidth = (side: 'left' | 'right' | 'top' | 'bottom', availableCanvasWidth: number) => {
    if (side === 'left' || side === 'right') {
      return Math.min(460, availableCanvasWidth * 0.5);
    }
    return Math.min(820, availableCanvasWidth * 0.88);
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
    const availableCanvasWidth = Math.max(320, 1080 - padding * 2);
    const bRot = imageConfig?.boxRotation ?? 0;
    const bScale = imageConfig?.boxScale ?? 1;
    const currentImageBoxState = getCurrentImageBoxState();
    const bX = currentImageBoxState.boxX;
    const bY = currentImageBoxState.boxY;
    const boxWidth = currentImageBoxState.width;
    const boxHeight = currentImageBoxState.height;
    const isFloatingBox = imageConfig?.type === 'IMAGE_BOX' || imageConfig?.type === 'IMAGE_GLASS_CARD';
    
    const imageBoxStyle: React.CSSProperties = {
      border: imageConfig?.borderWidth && isFloatingBox ? `${imageConfig.borderWidth}px solid ${imageConfig.borderColor || '#FFFFFF'}` : 'none',
      boxShadow: imageConfig?.hasShadow && imageConfig?.type === 'IMAGE_GLASS_CARD' ? `0 ${imageConfig.hasTornEdges ? '30px 80px' : '40px 120px'} -20px rgba(0,0,0,${imageConfig.hasTornEdges ? '0.15' : '0.8'}), 0 0 100px ${imageConfig.borderColor || theme.colors.accent}${imageConfig.hasTornEdges ? '10' : '40'}` : 'none',
      transform: isFloatingBox ? `translate(${bX}px, ${bY}px) scale(${bScale}) rotate(${bRot}deg)` : undefined,
      transformOrigin: 'center',
      width: imageConfig?.type === 'IMAGE_BOX' ? `${boxWidth}px` : undefined,
      height: imageConfig?.type === 'IMAGE_BOX' ? `${boxHeight}px` : undefined,
      flexShrink: 0
    };
    
    const clarityIntensity = fx?.clarity || 0;
    const contentFilter = clarityIntensity > 0 ? `contrast(${1 + clarityIntensity * 0.25}) saturate(${1 + clarityIntensity * 0.15}) brightness(${1 - clarityIntensity * 0.05})` : 'none';
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

    const renderInteractiveImageBox = (heightClassName?: string) => (
      <div
        ref={imageBoxTargetRef}
        style={imageBoxStyle}
        onMouseDown={(event) => {
          event.stopPropagation();
          setSelectedImageBoxMode((currentMode) => currentMode || 'box');
        }}
        onDoubleClick={(event) => {
          event.stopPropagation();
          setSelectedImageBoxMode((currentMode) => currentMode === 'image' ? 'box' : 'image');
        }}
        className={`relative transition-shadow duration-200 bg-zinc-800 rounded-[50px] overflow-hidden border-4 ${selectedImageBoxMode ? 'border-brand/70 shadow-[0_0_0_1px_rgba(31,178,247,0.35)]' : 'border-white/10'} ${imageBoxCursorClass} ${heightClassName || ''}`}
      >
        {imageConfig.url ? (renderImage("w-full h-full", "cover")) : (<div className="w-full h-full bg-black/40 flex items-center justify-center text-white/10"><Box size={100} /></div>)}
        {selectedImageBoxMode && (
          <div className="absolute left-4 top-4 z-20 rounded-full bg-black/65 px-3 py-1.5 text-[9px] font-black uppercase tracking-[0.18em] text-white/85 backdrop-blur-md">
            {selectedImageBoxMode === 'image' ? 'Movendo Imagem' : 'Movendo Moldura'}
          </div>
        )}
      </div>
    );

    const renderLayoutInternal = () => {
      if (templateDef.name === 'CARD_BOX' || templateDef.name === 'BENTO_SHOWCASE') {
        return (
          <div className="relative h-full w-full flex flex-col justify-center items-center" style={{ padding: canvasPadding }}>
            {renderBlocks()}
          </div>
        );
      }
      if (imageConfig?.type === 'IMAGE_BOX') {
          const pos = imageConfig.position || 'right';
          const isHorizontal = pos === 'left' || pos === 'right';
          if (isHorizontal) {
            const isRight = pos === 'right';
            return (
              <div className={`relative h-full w-full flex ${canvasVerticalItemsClass} justify-center`} style={{ padding: canvasPadding }}>
                <div
                  className={`w-full flex items-center ${isRight ? 'flex-row' : 'flex-row-reverse'}`}
                  style={{
                    maxWidth: `${adaptiveHorizontalCompositionWidth}px`,
                    gap: `${adaptiveGap}px`,
                  }}
                >
                  <div className="min-w-0 z-20 flex-shrink-0" style={{ width: `${Math.max(240, Math.min(adaptiveTextWidth, availableCanvasWidth - adaptiveBoxWidth - adaptiveGap - 24))}px` }}>
                    {renderBlocks()}
                  </div>
                  <div
                    className="relative z-10 flex items-center justify-center shrink-0"
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
              <div className={`relative h-full w-full flex ${canvasVerticalItemsClass} justify-center`} style={{ padding: canvasPadding }}>
                <div
                  className={`w-full flex flex-col items-center ${isBottom ? 'flex-col' : 'flex-col-reverse'}`}
                  style={{
                    maxWidth: `${adaptiveVerticalCompositionWidth}px`,
                    gap: `${adaptiveGap}px`,
                  }}
                >
                  <div className="w-full flex flex-col justify-center z-20">
                    {renderBlocks()}
                  </div>
                  <div
                    className="relative z-10 flex items-center justify-center shrink-0"
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
      if (templateDef.name === 'PNG_STAGE') {
        return (
          <div className={`relative h-full w-full flex flex-col ${contentVerticalClass} ${contentHorizontalClass}`} style={{ padding: canvasPadding }}>
            <div className={`w-full max-w-[820px] flex flex-col min-h-0 ${contentSelfClass}`}>
              {renderBlocks()}
            </div>
          </div>
        );
      }
      if (imageConfig?.type === 'IMAGE_GLASS_CARD' || templateDef.name === 'GLASS_OVERLAY' || templateDef.name === 'PREMIUM_GLASS') {
        const isDarkBox = imageConfig?.boxOverlay === 'dark';
        const rawGlassStrength = effectiveOptions.backgroundOverlayStrength ?? (templateDef.name === 'PREMIUM_GLASS' ? 0.42 : 0.2);
        const glassStrength = templateDef.name === 'PREMIUM_GLASS'
          ? isDarkBox
            ? 0.12 + Math.pow(rawGlassStrength, 1.08) * 0.6
            : 0.18 + Math.pow(rawGlassStrength, 0.88) * 0.72
          : rawGlassStrength;
        const glassBlur = effectiveOptions.backgroundBlur ?? (templateDef.name === 'PREMIUM_GLASS' ? 24 : 20);
        const easedGlassBlur = templateDef.name === 'PREMIUM_GLASS'
          ? isDarkBox
            ? 14 + glassBlur * 0.72
            : 18 + glassBlur * 0.84
          : glassBlur;
        const glassBase = isDarkBox
          ? hexToRgba(effectiveOptions.black, Math.min(0.78, 0.18 + glassStrength * 0.46))
          : hexToRgba(effectiveOptions.white, Math.min(0.54, 0.12 + glassStrength * 0.34));
        const highlightGlow = isDarkBox
          ? 'linear-gradient(135deg, rgba(255,255,255,0.14), rgba(255,255,255,0.03) 45%, rgba(255,255,255,0.08) 100%)'
          : 'linear-gradient(135deg, rgba(255,255,255,0.48), rgba(255,255,255,0.2) 34%, rgba(255,255,255,0.1) 62%, rgba(255,255,255,0.28) 100%)';

        return (
          <div className="relative h-full w-full">
            <div className="absolute inset-0 overflow-hidden z-0 bg-zinc-900">
              {imageConfig?.url ? renderImage("w-full h-full", "cover") : (
                <div className="w-full h-full bg-black/40 flex items-center justify-center text-white/10">
                  <ImageIcon size={100} />
                </div>
              )}
              <div
                className="absolute inset-0"
                style={{
                  background: `radial-gradient(circle at 20% 15%, rgba(255,255,255,0.08), transparent 34%), linear-gradient(180deg, rgba(255,255,255,0.02), rgba(0,0,0,0.06))`,
                }}
              />
            </div>
          <div className={`relative z-10 h-full w-full flex flex-col ${contentVerticalClass} items-center`} style={{ padding: canvasPadding }}>
              <div
                style={{
                  ...imageBoxStyle,
                  width: '100%',
                  maxWidth: '860px',
                  background: glassBase,
                  backdropFilter: `blur(${easedGlassBlur}px) saturate(${templateDef.name === 'PREMIUM_GLASS' ? (isDarkBox ? 148 : 162) : 180}%)`,
                  WebkitBackdropFilter: `blur(${easedGlassBlur}px) saturate(${templateDef.name === 'PREMIUM_GLASS' ? (isDarkBox ? 148 : 162) : 180}%)`,
                  boxShadow: templateDef.name === 'PREMIUM_GLASS'
                    ? isDarkBox
                      ? '0 38px 110px rgba(0,0,0,0.3), inset 0 1px 0 rgba(255,255,255,0.18), inset 0 -1px 0 rgba(255,255,255,0.05)'
                      : '0 38px 110px rgba(0,0,0,0.22), inset 0 1px 0 rgba(255,255,255,0.34), inset 0 -1px 0 rgba(255,255,255,0.1)'
                    : '0 48px 140px rgba(0,0,0,0.32), inset 0 1px 0 rgba(255,255,255,0.28), inset 0 -1px 0 rgba(255,255,255,0.08)',
                }}
                className="relative overflow-hidden p-20 rounded-[88px] border border-white/25 transition-all duration-500"
              >
                <div className="absolute inset-0 pointer-events-none" style={{ background: highlightGlow, mixBlendMode: 'screen' }} />
                <div
                  className="absolute inset-[1px] rounded-[86px] pointer-events-none"
                  style={{ border: '1px solid rgba(255,255,255,0.12)' }}
                />
                <div className="relative z-10">{renderBlocks()}</div>
              </div>
            </div>
          </div>
        );
      }
      if (imageConfig?.type === 'IMAGE_SPLIT_HALF' || templateDef.name === 'ASPECT_EDITORIAL' || templateDef.name === 'SPLIT_EDITORIAL') {
        const pos = imageConfig?.position || 'right';
        const isSideBySide = pos === 'left' || pos === 'right';
        const isVertical = pos === 'top' || pos === 'bottom';
        const isRightOrBottom = pos === 'right' || pos === 'bottom';
        if (isSideBySide) return (<div className={`relative h-full w-full flex ${isRightOrBottom ? 'flex-row' : 'flex-row-reverse'}`} style={{ backgroundColor: theme.colors.background }}><div className={`relative flex-1 h-full flex flex-col ${contentVerticalClass} px-24 z-20 min-w-0`}>{renderSplitAccentEdge(pos === 'right' ? 'right' : 'left')}<div className={`w-full max-w-[840px] ${contentSelfClass}`}>{renderBlocks()}</div></div><div className="flex-1 h-full relative overflow-hidden bg-zinc-900 border-x border-white/5 z-10 transition-all">{imageConfig?.url ? renderImage("w-full h-full", "cover", { transform: `translate(${bX}px, ${bY}px) scale(${bScale}) rotate(${bRot}deg)` }) : (<div className="w-full h-full bg-black/40 flex items-center justify-center text-white/10"><Layers size={100} /></div>)}</div></div>); 
        if (isVertical) return (<div className={`relative h-full w-full flex flex-col ${isRightOrBottom ? 'flex-col' : 'flex-col-reverse'}`} style={{ backgroundColor: theme.colors.background }}><div className={`relative flex-1 w-full flex flex-col ${contentVerticalClass} z-20`} style={{ padding: canvasPadding }}>{renderSplitAccentEdge(pos === 'bottom' ? 'bottom' : 'top')}<div className={`max-w-[840px] w-full ${contentSelfClass}`}>{renderBlocks()}</div></div><div className="w-full h-1/2 overflow-hidden relative border-y border-white/5 z-10 transition-all">{imageConfig?.url ? renderImage("w-full h-full", "cover", { transform: `translate(${bX}px, ${bY}px) scale(${bScale}) rotate(${bRot}deg)` }) : (<div className="w-full h-full bg-black/40 flex items-center justify-center text-white/10"><Layers size={100} /></div>)}</div></div>); 
      }
      
      const isFullBg = imageConfig?.type === 'IMAGE_BACKGROUND' || imageConfig?.type === 'IMAGE_SELECT' || templateDef.name === 'MEGA_STATEMENT' || templateDef.name === 'CINEMATIC_BG' || templateDef.name === 'HERO_STATEMENT' || templateDef.name === 'FADE';
      const isSocialPost = templateDef.name === 'SOCIAL_CHECKLIST';
      if (templateDef.name === 'FADE') {
        const fadeSide = effectiveOptions.fadeSide || imageConfig?.position || 'left';
        const fadeStrength = Math.min(2, (effectiveOptions.fadeStrength ?? 0.38) * 2);
        const fadeBlur = effectiveOptions.fadeBlur ?? 0;
        const fadeColor = fadeSampleColor || effectiveOptions.backgroundOverlayColor || effectiveOptions.black || '#141414';
        const layout = getDirectionalContentLayout(fadeSide);
        const effectiveFadeBlur = Math.max(6, fadeBlur * 1.45);
        const normalizedFadeStrength = Math.min(1, Math.max(0, fadeStrength / 2));
        const fadeContentMaxWidth = getFadeContentMaxWidth(fadeSide, availableCanvasWidth);

        return (
          <div className="relative h-full w-full overflow-hidden">
            <div className="absolute inset-0 overflow-hidden z-0 w-full h-full">
              {imageConfig?.url ? renderImage("w-full h-full", "cover", { transform: `translate(${bX}px, ${bY}px) scale(${bScale}) rotate(${bRot}deg)` }) : (
                <div className="w-full h-full bg-black/40 flex items-center justify-center text-white/10">
                  <ImageIcon size={100}/>
                </div>
              )}
              {imageConfig?.url && fadeBlur > 0 && (
                <div
                  className="absolute inset-0"
                  style={{
                    maskImage: getDirectionalMask(fadeSide),
                    WebkitMaskImage: getDirectionalMask(fadeSide),
                    opacity: Math.min(0.74, 0.12 + normalizedFadeStrength * 0.34),
                  }}
                >
                  {renderImage("w-full h-full", "cover", {
                    transform: `translate(${bX}px, ${bY}px) scale(${bScale * 1.06}) rotate(${bRot}deg)`,
                    filter: `blur(${effectiveFadeBlur}px) brightness(${Math.max(0.42, 0.8 - normalizedFadeStrength * 0.16)}) saturate(${Math.max(0.88, 0.98 - normalizedFadeStrength * 0.04)})`,
                  })}
                </div>
              )}
              <div className="absolute inset-0" style={{ background: getDirectionalGradient(fadeSide, fadeStrength, fadeColor) }} />
            </div>
            <div className={`relative z-10 h-full w-full flex flex-col ${layout.wrapper.replace('justify-center', contentVerticalClass)}`} style={{ padding: canvasPadding }}>
              <div
                className={`w-full flex flex-col justify-center min-h-0 ${layout.panel}`}
                style={{ maxWidth: `${fadeContentMaxWidth}px` }}
              >
                {renderBlocks()}
              </div>
            </div>
          </div>
        );
      }

      const cinematicOverlayStrength = effectiveOptions.backgroundOverlayStrength ?? (templateDef.name === 'CINEMATIC_BG' ? 0.32 : 0);
      const cinematicBlur = effectiveOptions.backgroundBlur ?? (templateDef.name === 'CINEMATIC_BG' ? 0 : 0);
      const cinematicOverlayColor = effectiveOptions.backgroundOverlayColor || '#1c1c20';
      const preserveHighlights = effectiveOptions.preserveHighlights ?? 0.25;
      const socialShellStyle = isSocialPost
        ? {
            boxShadow: '0 34px 120px rgba(0,0,0,0.42)',
            backdropFilter: 'blur(10px)',
            WebkitBackdropFilter: 'blur(10px)',
          }
        : undefined;
      const isProfileMode = templateDef.name === 'PROFILE_FOCUS';
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
              {imageConfig?.url ? renderImage("w-full h-full", "cover", { transform: `translate(${bX}px, ${bY}px) scale(${bScale}) rotate(${bRot}deg)` }) : (
                <div className="w-full h-full bg-black/40 flex items-center justify-center text-white/10">
                  <ImageIcon size={100}/>
                </div>
              )}
              {imageConfig?.overlay === 'dark' && <div className="absolute inset-0 bg-black/60" />}
              {templateDef.name === 'CINEMATIC_BG' && (
                <>
                  <div
                    className="absolute inset-0"
                    style={{
                      background: `linear-gradient(180deg, ${hexToRgba(cinematicOverlayColor, Math.max(0.06, 0.1 + cinematicOverlayStrength * 0.16 - preserveHighlights * 0.04))} 0%, ${hexToRgba(cinematicOverlayColor, Math.max(0.14, 0.18 + cinematicOverlayStrength * 0.28 - preserveHighlights * 0.06))} 48%, ${hexToRgba(cinematicOverlayColor, Math.max(0.22, 0.28 + cinematicOverlayStrength * 0.34 - preserveHighlights * 0.08))} 100%)`,
                    }}
                  />
                  {cinematicBlur > 0 && (
                    <div
                      className="absolute inset-0"
                      style={{
                        backdropFilter: `blur(${cinematicBlur}px) saturate(${1 + (effectiveOptions.liftShadows ?? 0.2) * 0.2})`,
                        WebkitBackdropFilter: `blur(${cinematicBlur}px) saturate(${1 + (effectiveOptions.liftShadows ?? 0.2) * 0.2})`,
                        opacity: Math.min(0.42, 0.08 + cinematicOverlayStrength * 0.22),
                        maskImage: 'linear-gradient(180deg, rgba(0,0,0,0.8) 0%, rgba(0,0,0,0.55) 42%, rgba(0,0,0,0.22) 72%, transparent 100%)',
                        WebkitMaskImage: 'linear-gradient(180deg, rgba(0,0,0,0.8) 0%, rgba(0,0,0,0.55) 42%, rgba(0,0,0,0.22) 72%, transparent 100%)',
                      }}
                    />
                  )}
                </>
              )}
            </div>
          )}
          <div className={`relative z-10 h-full w-full flex flex-col ${contentVerticalClass} ${contentHorizontalClass}`} style={{ padding: canvasPadding }}>
            {isProfileMode ? (
              <div className={`relative w-full max-w-[840px] ${contentSelfClass}`}>
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
                className={`w-full max-w-[840px] flex flex-col justify-center min-h-0 ${contentSelfClass} ${isSocialPost ? 'border border-white/10 rounded-[40px] p-16 bg-white/5' : ''}`}
                style={socialShellStyle}
              >
                {renderBlocks()}
              </div>
            )}
          </div>
        </div>
      );
    };
    return (<div style={{ filter: contentFilter }} className="h-full w-full overflow-hidden">{renderLayoutInternal()}</div>);
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
      {slide.options?.backgroundImage && (
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
            if (selectedImageBoxMode === 'image') {
              scheduleImageBoxState({
                ...baseState,
                imageX: event.beforeTranslate[0],
                imageY: event.beforeTranslate[1],
              }, imageBoxGuides, imageBoxGuideRect);
              return;
            }

            const nextRect = {
              left: startState.naturalLeft + event.beforeTranslate[0],
              top: startState.naturalTop + event.beforeTranslate[1],
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
              boxX: event.beforeTranslate[0] + (nextSnapLock.x ? (guides.snapX ?? 0) : 0),
              boxY: event.beforeTranslate[1] + (nextSnapLock.y ? (guides.snapY ?? 0) : 0),
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
            flushPendingImageBoxState();
            const latestDraft = imageBoxDraftRef.current;
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
              left: startState.naturalLeft + event.drag.beforeTranslate[0],
              top: startState.naturalTop + event.drag.beforeTranslate[1],
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
              boxX: event.drag.beforeTranslate[0] + (nextSnapLock.x ? (guides.snapX ?? 0) : 0),
              boxY: event.drag.beforeTranslate[1] + (nextSnapLock.y ? (guides.snapY ?? 0) : 0),
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
            flushPendingImageBoxState();
            const latestDraft = imageBoxDraftRef.current;
            if (!latestDraft) return;
            commitImageBoxDraft(latestDraft);
          }}
        />
      )}
      {renderFloatingOverlays()}
      {renderFXOverlays()}
    </div>
  )
}
