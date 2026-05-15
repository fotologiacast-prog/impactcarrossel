
import React from 'react';
import { Block, Theme } from '../../types';
import * as Icons from 'lucide-react';
import { quoteFontFamily } from '../../utils/branding';
import { getEmojiSizeForContext, renderEmojiNodes, renderEmojiText } from '../../utils/emoji';
import { fitTextToConstraint } from '../../utils/text-fit';
import emojiRegex from 'emoji-regex/RGI_Emoji';
import type { BlockRenderLayoutContext } from '../block-layout-context';

const leadingEmojiRegex = emojiRegex();

const hexToRgba = (color: string, alpha: number) => {
  if (!color.startsWith('#')) return `rgba(0,0,0,${alpha})`;
  const raw = color.slice(1);
  const normalized = raw.length === 3
    ? raw.split('').map((char) => `${char}${char}`).join('')
    : raw;
  const r = Number.parseInt(normalized.slice(0, 2), 16);
  const g = Number.parseInt(normalized.slice(2, 4), 16);
  const b = Number.parseInt(normalized.slice(4, 6), 16);
  if ([r, g, b].some((channel) => Number.isNaN(channel))) return `rgba(0,0,0,${alpha})`;
  return `rgba(${r}, ${g}, ${b}, ${alpha})`;
};

export function BadgeRenderer({ block, theme, onEditIcon, layoutContext }: { block: Block; theme: Theme; onEditIcon?: (block: Block) => void; layoutContext?: BlockRenderLayoutContext }) {
  const rawText = (block.content as string) || '';
  const highlight = block.options?.highlight;
  const fontVariant = block.options?.fontVariant || 'padrão';
  const badgeRef = React.useRef<HTMLDivElement>(null);
  const [availableBox, setAvailableBox] = React.useState({ width: 0, height: 0 });
  const opacity = theme.colors.cardOpacity !== undefined ? theme.colors.cardOpacity : 1;

  const selectedFont = block.options?.fontFamily
    || (fontVariant === 'destaque'
      ? (theme.typography.fontFamilySecondary || '"Instrument Serif", serif')
      : theme.typography.fontFamily);
  const isCtaButton = block.options?.semanticRole === 'cta';
  const isCompactCtaButton = isCtaButton && Boolean(
    layoutContext?.compactLayout?.isCompact
    || (layoutContext?.compactLayout?.availableWidth && layoutContext.compactLayout.availableWidth < 560),
  );
  const resolvedFontSize = block.options?.fontSize || (isCtaButton ? 36 : 26);
  const resolvedLineHeight = block.options?.lineHeight ?? 1.3;
  const emojiSize = getEmojiSizeForContext('badge');
  const isDualPill = block.options?.variant === 'pill';
  const isLongTextPill = isDualPill && rawText.trim().length >= 44;
  const fitted = React.useMemo(() => fitTextToConstraint(rawText, {
    availableWidth: availableBox.width || (isCtaButton ? 620 : 420),
    availableHeight: availableBox.height || resolvedFontSize * resolvedLineHeight * (isCtaButton ? 3.2 : 2),
    fontSize: resolvedFontSize,
    fontFamily: selectedFont,
    fontWeight: block.options?.fontWeight || (fontVariant === 'destaque' ? 400 : 300),
    lineHeight: resolvedLineHeight,
    letterSpacing: block.options?.letterSpacing,
    maxLines: isCtaButton ? 3 : 2,
    minFontSize: Math.max(16, Math.round(resolvedFontSize * 0.78)),
    overflow: 'shrink',
    role: 'badge',
    mode: block.options?.lineBreakMode,
    manualBreaks: block.options?.manualBreaks,
  }), [
    availableBox.height,
    availableBox.width,
    block.options?.fontWeight,
    block.options?.letterSpacing,
    block.options?.lineBreakMode,
    block.options?.manualBreaks,
    fontVariant,
    rawText,
    resolvedFontSize,
    resolvedLineHeight,
    isCtaButton,
    selectedFont,
  ]);
  const text = fitted.formatted;
  const hasBgHighlight = text.includes('[[');

  React.useEffect(() => {
    const target = badgeRef.current;
    if (!target) return;

    const measure = () => {
      setAvailableBox({
        width: target.clientWidth || 0,
        height: target.clientHeight || 0,
      });
    };

    measure();

    if (typeof ResizeObserver === 'undefined') return;
    const observer = new ResizeObserver(measure);
    observer.observe(target);
    return () => observer.disconnect();
  }, []);

  // Ensure font family is quoted
  const safeFontFamily = quoteFontFamily(selectedFont, theme.typography.fontFamily);

  // Cor de texto personalizada ou fallback
  const manualTextColor = block.options?.color;
  const isSemanticHighlight = block.options?.semanticRole === 'highlight';
  const manualBackgroundColor = isSemanticHighlight ? undefined : block.options?.backgroundColor;
  const inlineHighlightBackgroundColor = block.options?.highlightBackgroundColor
    || (isSemanticHighlight ? block.options?.backgroundColor : undefined)
    || theme.colors.hlBgColor
    || '#fff';
  const textColor = manualTextColor || theme.colors.cardTextColor || '#000000';
  const badgeSurfaceColor = manualBackgroundColor || theme.colors.cardBg || theme.colors.highlight;
  const badgeAccentColor = manualBackgroundColor || theme.colors.accent;
  const splitLeadingEmoji = React.useMemo(() => {
    if (!isDualPill) return null;
    leadingEmojiRegex.lastIndex = 0;
    const match = leadingEmojiRegex.exec(rawText.trim());
    if (!match || match.index !== 0) return null;
    const icon = match[0];
    const label = rawText.trim().slice(icon.length).trim();
    if (!label) return null;
    return { icon, label };
  }, [isDualPill, rawText]);

  const iconBadgeLabel = React.useMemo(() => {
    if (!isDualPill || splitLeadingEmoji || !rawText.trim()) return null;
    if (!block.options?.icon && !block.options?.customIcon) return null;
    return rawText.trim();
  }, [block.options?.customIcon, block.options?.icon, isDualPill, rawText, splitLeadingEmoji]);
  const compactPillPadding = `${Math.max(12, Math.round(fitted.effectiveFontSize * 0.48))}px ${Math.max(26, Math.round(fitted.effectiveFontSize * 1.08))}px`;
  const compactPillRadius = Math.max(18, Math.round(fitted.effectiveFontSize * 0.72));
  const pillLabelText = splitLeadingEmoji?.label || iconBadgeLabel || rawText.trim();
  const pillLabelWidth = Math.max(
    180,
    Math.min(
      300,
      availableBox.width ? availableBox.width - Math.max(90, Math.round(fitted.effectiveFontSize * 3.3)) : 300,
    ),
  );
  const pillLabelFit = React.useMemo(() => fitTextToConstraint(pillLabelText, {
    availableWidth: pillLabelWidth,
    availableHeight: resolvedFontSize * resolvedLineHeight * 2.2,
    fontSize: resolvedFontSize,
    fontFamily: selectedFont,
    fontWeight: block.options?.fontWeight || (fontVariant === 'destaque' ? 400 : 300),
    lineHeight: resolvedLineHeight,
    letterSpacing: block.options?.letterSpacing,
    maxLines: 2,
    minFontSize: Math.max(18, Math.round(resolvedFontSize * 0.78)),
    overflow: 'shrink',
    role: 'badge',
    mode: block.options?.lineBreakMode,
    manualBreaks: block.options?.manualBreaks,
  }), [
    block.options?.fontWeight,
    block.options?.letterSpacing,
    block.options?.lineBreakMode,
    block.options?.manualBreaks,
    fontVariant,
    pillLabelText,
    pillLabelWidth,
    resolvedFontSize,
    resolvedLineHeight,
    selectedFont,
  ]);

  const renderIconMarker = (size: number) => {
    const customIcon = block.options?.customIcon;
    const iconName = block.options?.icon;
    if (customIcon) {
      if (customIcon.startsWith('<svg')) {
        return <div style={{ width: size, height: size }} dangerouslySetInnerHTML={{ __html: customIcon }} />;
      }
      if (customIcon.startsWith('http') || customIcon.startsWith('data:image')) {
        return <img src={customIcon} alt="icon" className="object-contain" style={{ width: size, height: size }} />;
      }
      const IconFromCustom = (Icons as any)[customIcon];
      if (IconFromCustom) return <IconFromCustom size={size} strokeWidth={2.2} />;
    }

    if (iconName) {
      const IconComponent = (Icons as any)[iconName];
      if (IconComponent) return <IconComponent size={size} strokeWidth={2.2} />;
    }

    return null;
  };

  const renderContent = () => {
    let parts: (string | React.ReactNode)[] = [text];

    // Background Accent Highlight [[...]]
    {
      const newParts: (string | React.ReactNode)[] = [];
      parts.forEach(part => {
        if (typeof part === 'string') {
          const split = part.split(/\[\[([\s\S]*?)\]\]/g);
          split.forEach((s, i) => {
            if (i % 2 === 1) {
              newParts.push(
                <span 
                  key={`bg-hl-${i}`} 
                  className="inline px-3 py-1 rounded-md mx-1 font-black"
                  style={{ 
                    backgroundColor: inlineHighlightBackgroundColor,
                    color: theme.colors.hlTextColor || '#000',
                    WebkitBoxDecorationBreak: 'clone',
                    boxDecorationBreak: 'clone' as any,
                    fontFamily: safeFontFamily
                  }}
                >
                  {renderEmojiText(s, `bg-hl-${i}`, emojiSize)}
                </span>
              );
            } else if (s !== "") {
              newParts.push(s);
            }
          });
        } else {
          newParts.push(part);
        }
      });
      parts = newParts;
    }

    // Highlight (options.highlight)
    {
      const highlightTerm = highlight;
      if (highlightTerm) {
        const newParts: (string | React.ReactNode)[] = [];
        parts.forEach(part => {
          if (typeof part === 'string') {
            const split = part.split(new RegExp(`(${highlightTerm})`, 'gi'));
            split.forEach((s, i) => {
              if (s.toLowerCase() === highlightTerm.toLowerCase()) {
                newParts.push(<span key={i} className="font-black">{renderEmojiText(s, `hl-${i}`, emojiSize)}</span>);
              } else if (s !== "") {
                newParts.push(s);
              }
            });
          } else {
            newParts.push(part);
          }
        });
        parts = newParts;
      }
    }

    return renderEmojiNodes(parts, 'badge', emojiSize);
  };

  if (isCtaButton) {
    const iconBubbleSize = isCompactCtaButton ? 70 : 92;
    const ctaText = splitLeadingEmoji?.label
      || iconBadgeLabel
      || (block.options?.lineBreakMode === 'manual' && block.options?.manualBreaks ? block.options.manualBreaks : rawText.trim());
    const ctaShadowColor = hexToRgba(badgeAccentColor, 0.3);
    const ctaTextColor = manualTextColor || theme.colors.cardTextColor || theme.colors.hlTextColor || '#ffffff';
    const ctaIconColor = manualBackgroundColor || theme.colors.accent;
    const ctaIconBg = theme.colors.background || '#ffffff';

    return (
      <div
        ref={badgeRef}
        className="relative flex w-full justify-center group"
        style={{
          opacity,
          marginTop: '18px',
          maxWidth: '100%',
        }}
      >
        {onEditIcon && (
          <button
            type="button"
            data-edit-icon-target="badge"
            onClick={() => onEditIcon(block)}
            className="absolute -top-3 left-1/2 z-20 flex h-9 w-9 -translate-x-1/2 items-center justify-center rounded-full border border-brand/40 bg-black/85 text-brand opacity-0 transition-opacity group-hover:opacity-100"
          >
            <Icons.Edit3 size={16} />
          </button>
        )}
        <div
          data-badge-cta-button="true"
          data-badge-cta-compact={isCompactCtaButton ? 'true' : 'false'}
          className="grid items-center"
          style={{
            width: isCompactCtaButton ? 'min(100%, 460px)' : 'min(100%, 820px)',
            minHeight: isCompactCtaButton ? '118px' : '132px',
            gridTemplateColumns: isCompactCtaButton ? '70px minmax(0, 1fr)' : '92px 1px minmax(0, 1fr)',
            columnGap: isCompactCtaButton ? '22px' : '30px',
            padding: isCompactCtaButton ? '26px 30px' : '28px 42px',
            borderRadius: isCompactCtaButton ? '30px' : '34px',
            background: manualBackgroundColor
              ? manualBackgroundColor
              : `linear-gradient(180deg, ${theme.colors.highlight || theme.colors.accent} 0%, ${theme.colors.accent} 100%)`,
            boxShadow: `0 28px 54px ${ctaShadowColor}, 0 10px 18px rgba(0,0,0,0.18)`,
            color: ctaTextColor,
            fontFamily: safeFontFamily,
          }}
        >
          <span
            className="flex items-center justify-center rounded-full"
            style={{
              width: `${iconBubbleSize}px`,
              height: `${iconBubbleSize}px`,
              backgroundColor: ctaIconBg,
              color: ctaIconColor,
              boxShadow: '0 14px 26px rgba(0,0,0,0.16)',
            }}
          >
            {splitLeadingEmoji
              ? renderEmojiText(splitLeadingEmoji.icon, 'badge-cta-icon-emoji', '1.65em')
              : renderIconMarker(44)}
          </span>
          <span
            aria-hidden="true"
            style={{
              width: '1px',
              height: '76%',
              backgroundColor: hexToRgba(ctaTextColor, 0.45),
              display: isCompactCtaButton ? 'none' : undefined,
            }}
          />
          <span
            className="font-black tracking-tight"
            style={{
              fontSize: `${isCompactCtaButton ? Math.min(fitted.effectiveFontSize, 36) : fitted.effectiveFontSize}px`,
              lineHeight: isCompactCtaButton ? 1.08 : 1.1,
              fontWeight: block.options?.fontWeight || 900,
              textAlign: 'left',
              minWidth: 0,
              textWrap: 'pretty' as React.CSSProperties['textWrap'],
              whiteSpace: block.options?.lineBreakMode === 'manual' ? 'pre-line' : 'normal',
              overflowWrap: 'break-word',
            }}
          >
            {renderEmojiNodes([ctaText], 'badge-cta-label', emojiSize)}
          </span>
        </div>
      </div>
    );
  }

  if (isLongTextPill && !splitLeadingEmoji && !iconBadgeLabel) {
    return (
      <div
        ref={badgeRef}
        className="relative flex w-full justify-center group"
        style={{
          opacity,
          maxWidth: '100%',
        }}
      >
        {onEditIcon && (
          <button
            type="button"
            data-edit-icon-target="badge"
            onClick={() => onEditIcon(block)}
            className="absolute -top-3 left-1/2 z-20 flex h-9 w-9 -translate-x-1/2 items-center justify-center rounded-full border border-brand/40 bg-black/85 text-brand opacity-0 transition-opacity group-hover:opacity-100"
          >
            <Icons.Edit3 size={16} />
          </button>
        )}
        <span
          data-badge-wide-pill="true"
          style={{
            display: 'block',
            width: 'min(100%, 420px)',
            backgroundColor: badgeSurfaceColor,
            color: textColor,
            fontFamily: safeFontFamily,
            fontWeight: block.options?.fontWeight || (fontVariant === 'destaque' ? 400 : 800),
            fontSize: `${resolvedFontSize}px`,
            lineHeight: block.options?.lineHeight ?? 1.16,
            padding: '18px 24px',
            borderRadius: `${Math.max(18, Math.round(resolvedFontSize * 0.72))}px`,
            textAlign: block.options?.textAlign || block.options?.align || 'center',
            whiteSpace: 'normal',
            overflowWrap: 'break-word',
            textWrap: 'pretty' as React.CSSProperties['textWrap'],
          }}
        >
          {renderEmojiNodes([rawText.trim()], 'badge-wide-pill', emojiSize)}
        </span>
      </div>
    );
  }

  return (
    <div 
      ref={badgeRef}
      className={isDualPill ? 'relative inline-flex items-center gap-2 max-w-full group' : `relative inline-block px-10 py-6 text-[26px] rounded-lg ${hasBgHighlight ? '!leading-[1.8]' : '!leading-[1.3]'} group`}
      style={{ 
        opacity: opacity,
        justifyContent: block.options?.align === 'center' ? 'center' : undefined,
        whiteSpace: 'pre-line',
        textWrap: undefined,
        maxWidth: '100%',
      }}
    >
      {onEditIcon && (
        <button
          type="button"
          data-edit-icon-target="badge"
          onClick={() => onEditIcon(block)}
          className="absolute -top-3 -left-3 z-20 flex h-9 w-9 items-center justify-center rounded-full border border-brand/40 bg-black/85 text-brand opacity-0 transition-opacity group-hover:opacity-100"
        >
          <Icons.Edit3 size={16} />
        </button>
      )}
      {splitLeadingEmoji || iconBadgeLabel ? (
        <span
          data-badge-pill-inline="true"
          className="inline-flex items-center gap-3"
          style={{
            backgroundColor: badgeSurfaceColor,
            color: textColor,
            fontFamily: safeFontFamily,
            fontWeight: block.options?.fontWeight || (fontVariant === 'destaque' ? 400 : 300),
            fontSize: `${fitted.effectiveFontSize}px`,
            lineHeight: resolvedLineHeight,
            padding: compactPillPadding,
            borderRadius: `${compactPillRadius}px`,
          }}
        >
          <span className="inline-flex items-center justify-center shrink-0" style={{ color: textColor }}>
            {splitLeadingEmoji
              ? renderEmojiText(splitLeadingEmoji.icon, 'badge-pill-icon-inline', '1.25em')
              : renderIconMarker(Math.max(24, Math.round(fitted.effectiveFontSize * 1.02)))}
          </span>
          <span
            data-badge-pill-label="true"
            style={{
              display: 'inline-block',
              maxWidth: `${pillLabelWidth}px`,
              whiteSpace: 'pre-line',
              textWrap: 'balance' as React.CSSProperties['textWrap'],
            }}
          >
            {renderEmojiNodes([pillLabelFit.formatted], 'badge-pill-label-inline', emojiSize)}
          </span>
        </span>
      ) : (
        <span
          className={`inline-block text-[26px] ${hasBgHighlight ? '!leading-[1.8]' : '!leading-[1.3]'}`}
          style={{ 
            backgroundColor: badgeSurfaceColor,
            color: textColor,
            fontFamily: safeFontFamily,
            fontWeight: block.options?.fontWeight || (fontVariant === 'destaque' ? 400 : 300),
            fontSize: `${fitted.effectiveFontSize}px`,
            lineHeight: resolvedLineHeight,
            padding: compactPillPadding,
            borderRadius: `${compactPillRadius}px`,
          }}
        >
          {renderContent()}
        </span>
      )}
    </div>
  );
}
