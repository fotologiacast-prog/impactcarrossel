import React from 'react';
import type { SlideDefinition, Theme } from '../types.ts';
import { quoteFontFamily } from '../utils/branding.ts';
import { getCoverMainTitleSize } from '../utils/covers/cover-sizing.ts';
import { getEmojiSizeForContext, renderEmojiNodes, renderEmojiText } from '../utils/emoji.tsx';
import { estimateLineCount } from '../utils/smart-text.ts';
import { getCoverContentLift } from '../utils/hero-layout-metrics.ts';

type CoverCanvasProps = {
  slide: Pick<SlideDefinition, 'cover' | 'options' | 'image'>;
  theme: Theme;
  options?: SlideDefinition['options'];
};

function CarouselCueIcon({ color }: { color: string }) {
  return (
    <svg
      aria-hidden="true"
      viewBox="0 0 365.502 365.502"
      style={{ width: '100%', height: '100%', display: 'block', fill: color }}
    >
      <path d="M357.638,54.682c-20.582-7.802-44.26-14.568-68.472-19.566c-46.579-9.617-92.092-12.033-122.918-6.624l8.47-13.046 c3.007-4.632,1.689-10.826-2.942-13.833c-4.633-3.007-10.825-1.689-13.833,2.942l-21.781,33.551 c-1.444,2.225-1.945,4.932-1.393,7.526c0.552,2.594,2.111,4.863,4.336,6.307l33.551,21.78c1.683,1.092,3.569,1.613,5.435,1.613 c3.274,0,6.482-1.605,8.398-4.556c3.007-4.632,1.689-10.825-2.942-13.833l-13.563-8.804c28.368-4.948,70.994-2.552,115.141,6.563 c23.192,4.788,45.816,11.248,65.427,18.681c1.166,0.442,2.364,0.652,3.542,0.652c4.036,0,7.838-2.461,9.352-6.459 C365.403,62.413,362.803,56.64,357.638,54.682z" />
      <path d="M309.165,112.351c-8.227-12.581-22.15-20.108-37.227-20.108c-8.649,0-17.057,2.508-24.313,7.252 c-4.657,3.045-8.791,7.024-12.123,11.578c-6.642-3.828-14.264-5.92-22.204-5.92c-8.633,0-17.028,2.505-24.277,7.245 c-5.144,3.362-9.408,7.54-12.714,12.211c-6.456-3.543-13.798-5.476-21.435-5.476c-8.649-0.001-17.058,2.507-24.316,7.253 c-3.557,2.326-6.717,5.103-9.418,8.241l-2.609-3.997L93.255,91.914l-8.74-13.388c-1.386-2.121-2.324-3.559-2.998-4.574 c-6.827-11.722-19.439-18.698-33.878-18.7c-9.101-0.001-18.365,2.779-26.086,7.828c-9.94,6.499-16.757,16.482-19.19,28.11 c-2.434,11.627-0.193,23.506,6.308,33.448c0.659,1.007,44.866,68.622,74.188,113.467c-10.707,13.547-14.534,34.107-3.233,52.498 c14.092,22.936,27.515,39.164,42.244,51.067c19.565,15.813,41.734,23.83,65.89,23.83c29.933,0,62.723-11.926,100.246-36.46 c42.421-27.737,65.637-60.728,69.002-98.058c2.364-26.219-5.643-54.234-23.155-81.017L309.165,112.351z M277.06,312.302 c-36.106,23.607-65.224,33.199-89.301,33.199c-42.512,0-69.307-29.905-91.094-65.368c-8.232-13.397-2.002-28.561,7.242-34.605 l15.773,24.124c1.081,1.652,2.266,2.102,3.222,2.102c0.799,0,1.438-0.314,1.724-0.5c0.629-0.411,2.438-2.084,0.453-5.12 c-1.916-2.928-99.67-152.439-99.67-152.439c-7.396-11.312-4.223-26.479,7.09-33.874c4.498-2.941,9.926-4.567,15.138-4.567 c6.813,0,13.254,2.78,16.749,9.032c0.031,0.034,49.123,75.246,61.203,93.747c0.025,0.039,0.037,0.082,0.063,0.121l2.527,3.865 c0.765,1.169,2.039,1.804,3.34,1.804c0.748,0,1.505-0.21,2.178-0.65c1.842-1.204,2.357-3.674,1.154-5.516l-0.654-0.999 c-7.111-11.274-3.895-26.208,7.305-33.531c4.132-2.702,8.775-3.993,13.369-3.993c7.983,0.001,15.811,3.903,20.506,11.084 l9.715,14.821c0.753,1.152,2.008,1.778,3.288,1.778c0.736,0,1.481-0.207,2.143-0.64c1.813-1.186,2.322-3.618,1.137-5.432 l-0.563-0.844c-6.732-10.299-1.426-24.031,8.869-30.761c4.124-2.697,8.754-3.985,13.332-3.984c7.979,0,15.8,3.914,20.5,11.102 l9.855,14.986c0.732,1.121,1.954,1.73,3.201,1.73c0.716,0,1.441-0.202,2.086-0.623c1.764-1.154,2.26-3.521,1.105-5.286 l-0.758-1.136c-6.125-9.366-0.686-23.173,9.281-29.69c4.131-2.701,8.775-3.992,13.368-3.992c7.983,0,15.811,3.902,20.507,11.082 l24.668,37.588C339.997,195.911,360.847,257.52,277.06,312.302z" />
    </svg>
  );
}

export function CoverCanvas({ slide, theme, options }: CoverCanvasProps) {
  const cover = slide.cover;

  if (!cover) return null;

  const mergedOptions = {
    ...(slide.options || {}),
    ...(options || {}),
  };

  const backgroundColor = mergedOptions.background || theme.colors.background;
  const accentColor = mergedOptions.accent || theme.colors.accent;
  const textColor = mergedOptions.text || theme.colors.textPrimary;
  const badgeBg = mergedOptions.cardBg || theme.colors.cardBg || '#FFFFFF';
  const badgeText = mergedOptions.cardTextColor || theme.colors.cardTextColor || theme.colors.black || '#1E1E1E';
  const bodyFont = quoteFontFamily(mergedOptions.fontPadrão, theme.typography.fontFamily);
  const titleFont = quoteFontFamily(
    mergedOptions.fontDestaque || mergedOptions.fontPadrão,
    theme.typography.fontFamilySecondary || theme.typography.fontFamily,
  );
  const imageConfig = slide.image;

  const mainText = cover.text.titleMain || cover.text.titleTop || '';
  const cueColor = `${textColor}A6`;
  const hasForegroundImage = Boolean(cover.images.foregroundImage);
  const foregroundMode = cover.images.foregroundMode || 'none';
  const contentAlign = mergedOptions.contentHorizontalAlign || 'center';
  const contentVerticalAlign = mergedOptions.contentVerticalAlign || 'bottom';
  const contentWidthPercent = Math.min(100, Math.max(20, mergedOptions.contentWidthPercent ?? 100));
  const padding = mergedOptions.padding ?? 80;
  const blockGap = mergedOptions.blockGap ?? 24;
  const sectionGap = mergedOptions.sectionGap ?? 48;
  const contentOffsetX = mergedOptions.contentOffsetX || 0;
  const contentOffsetY = mergedOptions.contentOffsetY || 0;
  const contentScale = mergedOptions.contentScale || 1;
  const eyebrowHasBgHighlight = Boolean(cover.text.eyebrow?.includes('[['));
  const titleTopHasBgHighlight = Boolean(cover.text.titleTop?.includes('[['));
  const mainHasBgHighlight = Boolean(mainText.includes('[['));
  const supportingHasBgHighlight = Boolean(cover.text.supportingLine?.includes('[['));
  const titleMainOptions = cover.textOptions?.titleMain;
  const resolvedMainFontSize = titleMainOptions?.fontSize ?? getCoverMainTitleSize(mainText);
  const resolvedMainWidthFactor = ((titleMainOptions?.widthPercent ?? 100) / 100) * (contentWidthPercent / 100);
  const estimatedMainWidth = Math.min(1080 - padding * 2, 760) * resolvedMainWidthFactor;
  const normalizedMainText = mainText.replace(/\[\[|\]\]|\*\*/g, '').trim();
  const estimatedMainLineCount = normalizedMainText
    ? estimateLineCount(normalizedMainText, resolvedMainFontSize, estimatedMainWidth, titleMainOptions?.fontWeight ?? 700)
    : 1;
  const autoMainIsMultiLine = !titleMainOptions?.fontSize && estimatedMainLineCount > 1;

  const resolveLayerFontFamily = (
    fontVariant: 'padrão' | 'destaque' | undefined,
    override?: string,
  ) => {
    if (override) {
      return quoteFontFamily(override, fontVariant === 'destaque' ? titleFont : bodyFont);
    }

    return fontVariant === 'destaque' ? titleFont : bodyFont;
  };

  const getCoverLayerOptions = (key: keyof NonNullable<SlideDefinition['cover']>['text']) => cover.textOptions?.[key];
  const resolveTextAlign = (layerAlign?: 'left' | 'center' | 'right') => layerAlign || contentAlign;

  const resolveWidthPercent = (layerWidth?: number) => {
    const baseWidth = (layerWidth ?? 100) / 100;
    return `${Math.max(20, Math.min(100, contentWidthPercent * baseWidth))}%`;
  };

  const resolveLayerStyle = (
    key: keyof NonNullable<SlideDefinition['cover']>['text'],
    defaults: {
      fontSize: number;
      fontWeight: number;
      lineHeight: number;
      color: string;
      letterSpacing: string | number;
      maxWidth: number;
      fontVariant: 'padrão' | 'destaque';
    },
  ) => {
    const layerOptions = getCoverLayerOptions(key);
    return {
      fontFamily: resolveLayerFontFamily(layerOptions?.fontVariant || defaults.fontVariant, layerOptions?.fontFamily),
      fontSize: layerOptions?.fontSize ?? defaults.fontSize,
      fontWeight: layerOptions?.fontWeight ?? defaults.fontWeight,
      lineHeight: layerOptions?.lineHeight ?? defaults.lineHeight,
      color: layerOptions?.color ?? defaults.color,
      letterSpacing: layerOptions?.letterSpacing ?? defaults.letterSpacing,
      textAlign: resolveTextAlign(layerOptions?.textAlign),
      width: resolveWidthPercent(layerOptions?.widthPercent),
      maxWidth: Math.min(1080 - padding * 2, defaults.maxWidth),
    };
  };

  const eyebrowStyle = resolveLayerStyle('eyebrow', {
    fontSize: 28,
    fontWeight: 300,
    lineHeight: eyebrowHasBgHighlight ? 1.48 : 1.22,
    color: 'rgba(255,255,255,0.86)',
    letterSpacing: 0,
    maxWidth: 620,
    fontVariant: 'padrão',
  });
  const titleTopStyle = resolveLayerStyle('titleTop', {
    fontSize: 52,
    fontWeight: 400,
    lineHeight: titleTopHasBgHighlight ? 1.26 : 0.96,
    color: textColor,
    letterSpacing: '-0.025em',
    maxWidth: 620,
    fontVariant: 'destaque',
  });
  const titleMainStyle = resolveLayerStyle('titleMain', {
    fontSize: resolvedMainFontSize,
    fontWeight: 700,
    lineHeight: titleMainOptions?.lineHeight ?? (mainHasBgHighlight ? 1.12 : autoMainIsMultiLine ? 0.96 : 0.88),
    color: textColor,
    letterSpacing: '-0.055em',
    maxWidth: 760,
    fontVariant: 'destaque',
  });
  const supportingStyle = resolveLayerStyle('supportingLine', {
    fontSize: 24,
    fontWeight: 350,
    lineHeight: supportingHasBgHighlight ? 1.56 : 1.28,
    color: 'rgba(255,255,255,0.76)',
    letterSpacing: '-0.01em',
    maxWidth: 620,
    fontVariant: 'padrão',
  });

  const contentJustify =
    contentVerticalAlign === 'top' ? 'flex-start'
    : contentVerticalAlign === 'center' ? 'center'
    : 'flex-end';
  const contentLift = getCoverContentLift({
    hasBackgroundImage: Boolean(cover.images.backgroundImage),
    hasForegroundImage,
    verticalAlign: contentVerticalAlign,
  });
  const groupAlignItems =
    contentAlign === 'left' ? 'flex-start'
    : contentAlign === 'right' ? 'flex-end'
    : 'center';
  const cueResolvedColor = imageConfig?.borderColor || cueColor;
  const backgroundX = cover.images.backgroundX ?? 0;
  const backgroundY = cover.images.backgroundY ?? 0;
  const backgroundScale = cover.images.backgroundScale ?? 1;
  const backgroundBlur = (cover.images.backgroundBlur ?? 0) + (mergedOptions.backgroundBlur ?? 0);
  const overlayStrength = mergedOptions.backgroundOverlayStrength ?? 0.82;
  const darkOverlayBottom = Math.max(0, Math.min(0.92, overlayStrength));
  const darkOverlayMid = Math.max(0, Math.min(0.62, overlayStrength * 0.42));
  const darkOverlayTop = Math.max(0, Math.min(0.12, overlayStrength * 0.04));
  const topShadeAlpha = Math.max(0, Math.min(0.08, overlayStrength * 0.045));
  const foregroundContainerWidth = imageConfig?.width ?? 760;
  const foregroundContainerHeight = imageConfig?.height ?? 980;
  const foregroundBoxX = imageConfig?.boxX ?? 0;
  const foregroundBoxY = imageConfig?.boxY ?? 0;
  const foregroundBoxScale = imageConfig?.boxScale ?? 1;
  const foregroundBoxRotation = imageConfig?.boxRotation ?? 0;
  const foregroundImageX = imageConfig?.imageX ?? 0;
  const foregroundImageY = imageConfig?.imageY ?? 0;
  const foregroundImageScale = imageConfig?.imageScale ?? 1;
  const foregroundImageRotation = imageConfig?.imageRotation ?? 0;
  const foregroundOpacity = imageConfig?.backgroundOpacity ?? (foregroundMode === 'soft-overlay' ? 0.5 : 0.98);
  const backgroundZoneBlur = Math.max(0, backgroundBlur);
  const hasProfileIdentity = Boolean(
    cover.profile.avatar
    || cover.profile.handle
    || cover.profile.displayName
    || cover.profile.meta,
  );
  const profileBadgeAlignSelf =
    groupAlignItems === 'flex-start' ? 'flex-start'
    : groupAlignItems === 'flex-end' ? 'flex-end'
    : 'center';

  const renderCoverRichText = (
    input: string,
    context: 'title' | 'paragraph',
    config: {
      fontFamily: string;
      highlightBg: string;
      highlightText: string;
      highlightRadius: string;
      highlightPadding: string;
      highlightWeight?: number;
    },
  ) => {
    let parts: Array<string | React.ReactNode> = [input];
    const emojiSize = getEmojiSizeForContext(context);

    {
      const nextParts: Array<string | React.ReactNode> = [];
      parts.forEach((part) => {
        if (typeof part !== 'string') {
          nextParts.push(part);
          return;
        }

        const split = part.split(/\[\[([\s\S]*?)\]\]/g);
        split.forEach((segment, index) => {
          if (index % 2 === 1) {
            nextParts.push(
              <span
                key={`cover-bg-hl-${context}-${index}`}
                className="inline mx-1"
                style={{
                  backgroundColor: config.highlightBg,
                  color: config.highlightText,
                  borderRadius: config.highlightRadius,
                  padding: config.highlightPadding,
                  WebkitBoxDecorationBreak: 'clone',
                  boxDecorationBreak: 'clone' as any,
                  fontFamily: config.fontFamily,
                  fontWeight: config.highlightWeight ?? 900,
                }}
              >
                {renderEmojiText(segment, `cover-bg-hl-${context}-${index}`, emojiSize)}
              </span>,
            );
          } else if (segment !== '') {
            nextParts.push(segment);
          }
        });
      });
      parts = nextParts;
    }

    const finalParts: Array<string | React.ReactNode> = [];
    parts.forEach((part) => {
      if (typeof part !== 'string') {
        finalParts.push(part);
        return;
      }

      const split = part.split(/\*\*([\s\S]*?)\*\*/g);
      split.forEach((segment, index) => {
        if (index % 2 === 1) {
          finalParts.push(
            <span key={`cover-bold-${context}-${index}`} style={{ fontWeight: 900 }}>
              {renderEmojiText(segment, `cover-bold-${context}-${index}`, emojiSize)}
            </span>,
          );
        } else if (segment !== '') {
          finalParts.push(segment);
        }
      });
    });

    return renderEmojiNodes(finalParts, `cover-${context}`, emojiSize);
  };

  return (
    <div
      style={{
        position: 'relative',
        width: 1080,
        height: 1350,
        overflow: 'hidden',
        fontFamily: bodyFont,
        background: backgroundColor,
      }}
    >
      <div
        style={{
          position: 'absolute',
          inset: 0,
          background: cover.images.backgroundImage
            ? `url(${cover.images.backgroundImage})`
            : backgroundColor,
          backgroundPosition: `calc(50% + ${backgroundX}px) calc(50% + ${backgroundY}px)`,
          backgroundSize: `${backgroundScale * 100}%`,
          backgroundRepeat: 'no-repeat',
        }}
      />

      {backgroundZoneBlur > 0 && cover.images.backgroundImage ? (
        <>
          <div
            style={{
              position: 'absolute',
              inset: 0,
              background: `url(${cover.images.backgroundImage})`,
              backgroundPosition: `calc(50% + ${backgroundX}px) calc(50% + ${backgroundY}px)`,
              backgroundSize: `${backgroundScale * 100}%`,
              backgroundRepeat: 'no-repeat',
              filter: `blur(${Math.max(1, backgroundZoneBlur * 0.42)}px)`,
              WebkitMaskImage: 'linear-gradient(to top, rgba(0,0,0,1) 0%, rgba(0,0,0,0.92) 18%, rgba(0,0,0,0.56) 30%, rgba(0,0,0,0.12) 40%, transparent 48%)',
              maskImage: 'linear-gradient(to top, rgba(0,0,0,1) 0%, rgba(0,0,0,0.92) 18%, rgba(0,0,0,0.56) 30%, rgba(0,0,0,0.12) 40%, transparent 48%)',
              pointerEvents: 'none',
            }}
          />
          <div
            style={{
              position: 'absolute',
              inset: 0,
              background: `url(${cover.images.backgroundImage})`,
              backgroundPosition: `calc(50% + ${backgroundX}px) calc(50% + ${backgroundY}px)`,
              backgroundSize: `${backgroundScale * 100}%`,
              backgroundRepeat: 'no-repeat',
              filter: `blur(${Math.max(1, backgroundZoneBlur * 0.78)}px)`,
              WebkitMaskImage: 'linear-gradient(to top, rgba(0,0,0,1) 0%, rgba(0,0,0,0.98) 12%, rgba(0,0,0,0.82) 24%, rgba(0,0,0,0.3) 34%, transparent 42%)',
              maskImage: 'linear-gradient(to top, rgba(0,0,0,1) 0%, rgba(0,0,0,0.98) 12%, rgba(0,0,0,0.82) 24%, rgba(0,0,0,0.3) 34%, transparent 42%)',
              pointerEvents: 'none',
            }}
          />
        </>
      ) : null}

      {hasForegroundImage && foregroundMode !== 'none' && (
        <div
          style={{
            position: 'absolute',
            inset: 0,
            zIndex: 2,
            pointerEvents: 'none',
            display: 'flex',
            alignItems: 'flex-end',
            justifyContent: 'center',
            padding: `${padding + 30}px ${padding}px 0`,
          }}
        >
          <div
            style={{
              display: 'block',
              width: foregroundContainerWidth,
              height: foregroundContainerHeight,
              maxWidth: '100%',
              transform: `translate(${foregroundBoxX}px, ${foregroundBoxY}px) scale(${foregroundBoxScale}) rotate(${foregroundBoxRotation}deg)`,
              transformOrigin: 'center bottom',
            }}
          >
            <img
              src={cover.images.foregroundImage}
              alt=""
              style={{
                display: 'block',
                width: '100%',
                height: '100%',
                objectFit: 'contain',
                objectPosition: `calc(50% + ${foregroundImageX}px) calc(100% + ${foregroundImageY}px)`,
                transform: `scale(${foregroundImageScale}) rotate(${foregroundImageRotation}deg)`,
                transformOrigin: 'center bottom',
                opacity: foregroundOpacity,
                filter: foregroundMode === 'soft-overlay'
                  ? 'drop-shadow(0 24px 64px rgba(0,0,0,0.22)) saturate(0.98)'
                  : 'drop-shadow(0 24px 64px rgba(0,0,0,0.28))',
              }}
            />
          </div>
        </div>
      )}

      {cover.effects.darkOverlay && (
        <div
          style={{
            position: 'absolute',
            inset: 0,
            background:
              `linear-gradient(to top, rgba(0,0,0,${darkOverlayBottom}) 0%, rgba(0,0,0,${darkOverlayMid}) 42%, rgba(0,0,0,${darkOverlayTop}) 72%, rgba(0,0,0,0) 100%)`,
          }}
        />
      )}

      {cover.effects.topShade && (
        <div
          style={{
            position: 'absolute',
            inset: 0,
            background:
              `linear-gradient(to bottom, rgba(0,0,0,${topShadeAlpha}) 0%, rgba(0,0,0,0.02) 8%, transparent 16%)`,
          }}
        />
      )}

      {cover.effects.bottomGlow && (
        <div
          style={{
            position: 'absolute',
            left: '-8%',
            right: '-8%',
            bottom: '-12%',
            height: '28%',
            background: `radial-gradient(circle at center, ${accentColor}66 0%, ${accentColor}22 36%, transparent 72%)`,
            filter: 'blur(30px)',
            pointerEvents: 'none',
            zIndex: 1,
          }}
        />
      )}

      <div
        aria-label="Próximo slide"
        style={{
          position: 'absolute',
          right: 42,
          top: '50%',
          transform: 'translateY(-50%)',
          width: 42,
          height: 42,
          zIndex: 4,
          opacity: 0.82,
          pointerEvents: 'none',
        }}
      >
        <CarouselCueIcon color={cueResolvedColor} />
      </div>

      <div
        data-cover-content-lift={contentLift > 0 ? 'true' : 'false'}
        style={{
          position: 'relative',
          zIndex: 3,
          width: '100%',
          height: '100%',
          padding: `${Math.max(24, padding - 6)}px ${Math.max(24, padding - 2)}px ${Math.max(32, padding + 12)}px`,
          boxSizing: 'border-box',
          display: 'flex',
          flexDirection: 'column',
          justifyContent: contentJustify,
          alignItems: groupAlignItems,
          gap: sectionGap,
          transform: `translate(${contentOffsetX}px, ${contentOffsetY - contentLift}px) scale(${contentScale})`,
          transformOrigin: 'center',
        }}
      >
        {hasProfileIdentity && (
          <div
            style={{
              display: 'inline-flex',
              alignItems: 'center',
              gap: 12,
              alignSelf: profileBadgeAlignSelf,
              background: badgeBg,
              color: badgeText,
              borderRadius: 999,
              padding: '10px 18px 10px 10px',
              marginBottom: 20,
              boxShadow: '0 10px 24px rgba(0,0,0,0.22)',
            }}
          >
            {cover.profile.avatar ? (
              <img
                src={cover.profile.avatar}
                alt={cover.profile.handle || cover.profile.displayName || 'Avatar'}
                style={{
                  width: 42,
                  height: 42,
                  borderRadius: '50%',
                  objectFit: 'cover',
                  flexShrink: 0,
                }}
              />
            ) : null}

            <div
              style={{
                display: 'flex',
                flexDirection: 'column',
                lineHeight: 1.05,
              }}
            >
              {(cover.profile.displayName || cover.profile.handle) ? (
                <span
                  style={{
                    fontFamily: bodyFont,
                    fontSize: 15,
                    fontWeight: 700,
                  }}
                >
                  {cover.profile.displayName || cover.profile.handle}
                </span>
              ) : null}

              {(cover.profile.handle && cover.profile.displayName) || cover.profile.meta ? (
                <span
                  style={{
                    fontFamily: bodyFont,
                    fontSize: 12,
                    opacity: 0.62,
                  }}
                >
                  {[cover.profile.displayName ? cover.profile.handle : undefined, cover.profile.meta]
                    .filter(Boolean)
                    .join(' · ')}
                </span>
              ) : null}
            </div>
          </div>
        )}

        <div
          style={{
            width: '100%',
            display: 'flex',
            flexDirection: 'column',
            alignItems: groupAlignItems,
            gap: blockGap,
          }}
        >
          {cover.text.eyebrow ? (
            <div
              style={{
                ...eyebrowStyle,
                marginBottom: 0,
                textWrap: 'balance',
              }}
            >
              {renderCoverRichText(cover.text.eyebrow, 'paragraph', {
                fontFamily: bodyFont,
                highlightBg: mergedOptions.hlBgColor || theme.colors.hlBgColor || accentColor,
                highlightText: mergedOptions.hlTextColor || theme.colors.hlTextColor || '#000000',
                highlightRadius: '10px',
                highlightPadding: '0.1em 0.42em',
              })}
            </div>
          ) : null}

          {cover.text.titleTop ? (
            <h2
              style={{
                ...titleTopStyle,
                margin: 0,
                opacity: 0.94,
                textWrap: 'balance',
              }}
            >
              {renderCoverRichText(cover.text.titleTop, 'title', {
                fontFamily: titleFont,
                highlightBg: mergedOptions.hlBgColor || theme.colors.hlBgColor || accentColor,
                highlightText: mergedOptions.hlTextColor || theme.colors.hlTextColor || '#000000',
                highlightRadius: '18px',
                highlightPadding: '0.1em 0.34em',
                highlightWeight: 700,
              })}
            </h2>
          ) : null}

          {mainText ? (
            <h1
              style={{
                ...titleMainStyle,
                margin: cover.text.titleTop
                  ? `${autoMainIsMultiLine ? 12 : 2}px 0 0`
                  : `${autoMainIsMultiLine && cover.text.eyebrow ? 8 : 2}px 0 0`,
                textShadow: cover.effects.textShadow ? '0 10px 26px rgba(0,0,0,0.18)' : 'none',
                textWrap: 'balance',
              }}
            >
              {renderCoverRichText(mainText, 'title', {
                fontFamily: titleFont,
                highlightBg: mergedOptions.hlBgColor || theme.colors.hlBgColor || accentColor,
                highlightText: mergedOptions.hlTextColor || theme.colors.hlTextColor || '#000000',
                highlightRadius: '24px',
                highlightPadding: '0.08em 0.28em',
                highlightWeight: 900,
              })}
            </h1>
          ) : null}

          {cover.text.supportingLine ? (
            <div
              style={{
                ...supportingStyle,
                marginTop: 0,
                textWrap: 'balance',
              }}
            >
              {renderCoverRichText(cover.text.supportingLine, 'paragraph', {
                fontFamily: bodyFont,
                highlightBg: mergedOptions.hlBgColor || theme.colors.hlBgColor || accentColor,
                highlightText: mergedOptions.hlTextColor || theme.colors.hlTextColor || '#000000',
                highlightRadius: '10px',
                highlightPadding: '0.1em 0.42em',
              })}
            </div>
          ) : null}
        </div>
      </div>
    </div>
  );
}
