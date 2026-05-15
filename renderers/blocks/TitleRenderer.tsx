
import React from 'react';
import { Block, Theme } from '../../types';
import { quoteFontFamily } from '../../utils/branding';
import { getEmojiSizeForContext, renderEmojiNodes, renderEmojiText } from '../../utils/emoji';
import { fitTextToConstraint } from '../../utils/text-fit';

interface TitleRendererProps {
  block: Block;
  theme: Theme;
}

const resolveSemanticColor = (color: string | undefined, theme: Theme) => {
  if (color === 'accent') return theme.colors.accent;
  if (color === 'highlight') return theme.colors.highlight;
  if (color === 'text') return theme.colors.textPrimary;
  if (color === 'muted') return theme.colors.textSecondary;
  return color;
};

export function TitleRenderer({ block, theme }: TitleRendererProps) {
  const rawText = Array.isArray(block.content) ? block.content.join(' ') : (block.content || '') as string;
  const highlight = block.options?.highlight;
  const size = block.options?.size || 'md';
  const variant = block.options?.variant;
  const hasBgHighlight = rawText.includes('[[');
  const isSerifLegacy = block.options?.fontFamily === 'serif';
  const fontVariant = block.options?.fontVariant || 'destaque';
  const elementRef = React.useRef<HTMLHeadingElement>(null);
  const [availableWidth, setAvailableWidth] = React.useState(0);

  const sizeClasses = {
    sm: `text-[64px] font-black tracking-tight ${hasBgHighlight ? 'leading-[1.44]' : 'leading-[1.14]'}`,
    md: `${theme.typography.title} ${hasBgHighlight ? 'leading-[1.34]' : 'leading-[1.04]'}`,
    lg: `text-[180px] font-[1000] tracking-[-0.08em] ${hasBgHighlight ? 'leading-[1.18]' : 'leading-[0.9]'}`
  };

  const selectedFont = block.options?.fontFamily && block.options.fontFamily !== 'serif'
    ? block.options.fontFamily
    : fontVariant === 'destaque'
      ? (theme.typography.fontFamilySecondary || theme.typography.fontFamily)
      : theme.typography.fontFamily;
  const usingDedicatedSecondaryFont = fontVariant === 'destaque' && selectedFont !== theme.typography.fontFamily;
  const defaultFontWeight = (usingDedicatedSecondaryFont || isSerifLegacy || selectedFont.includes('Serif') || selectedFont.includes('Playfair')) ? 400 : 900;
  const resolvedFontSize = block.options?.fontSize || (size === 'sm' ? 64 : size === 'lg' ? 180 : 80);
  const resolvedLineHeight = block.options?.lineHeight ?? (size === 'sm' ? (hasBgHighlight ? 1.44 : 1.14) : size === 'lg' ? (hasBgHighlight ? 1.18 : 0.9) : (hasBgHighlight ? 1.34 : 1.04));
  const titleMaxLines = size === 'lg' ? 3 : 4;
  const disableAutoFit = block.options?.disableAutoFit === true;
  const fitted = React.useMemo(() => fitTextToConstraint(rawText, {
    availableWidth: availableWidth || 960,
    availableHeight: resolvedFontSize * resolvedLineHeight * titleMaxLines,
    fontSize: resolvedFontSize,
    fontFamily: selectedFont,
    fontWeight: block.options?.fontWeight || defaultFontWeight,
    lineHeight: resolvedLineHeight,
    letterSpacing: block.options?.letterSpacing,
    maxLines: titleMaxLines,
    minFontSize: Math.max(32, Math.round(resolvedFontSize * 0.7)),
    overflow: disableAutoFit ? 'reflow' : 'shrink',
    role: 'title',
    mode: block.options?.lineBreakMode,
    manualBreaks: block.options?.manualBreaks,
  }), [
    availableWidth,
    block.options?.fontWeight,
    block.options?.letterSpacing,
    block.options?.lineBreakMode,
    block.options?.manualBreaks,
    defaultFontWeight,
    disableAutoFit,
    rawText,
    resolvedFontSize,
    resolvedLineHeight,
    selectedFont,
    titleMaxLines,
  ]);
  const effectiveText = disableAutoFit ? rawText : fitted.formatted;
  const effectiveFontSize = disableAutoFit ? resolvedFontSize : fitted.effectiveFontSize;
  const text = effectiveText;
  const emojiSize = getEmojiSizeForContext('title');

  React.useEffect(() => {
    const target = elementRef.current;
    if (!target) return;

    const measure = () => setAvailableWidth(target.clientWidth || 0);
    measure();

    if (typeof ResizeObserver === 'undefined') return;
    const observer = new ResizeObserver(measure);
    observer.observe(target);
    return () => observer.disconnect();
  }, []);

  // Ensure font family is quoted if it's not already a generic family or complex string
  const safeFontFamily = quoteFontFamily(selectedFont, theme.typography.fontFamily);
  const highlightBackgroundColor = resolveSemanticColor(block.options?.highlightBackgroundColor || block.options?.backgroundColor, theme)
    || theme.colors.hlBgColor
    || theme.colors.accent;

  const style: React.CSSProperties = { 
    color: resolveSemanticColor(block.options?.color, theme) || theme.colors.textPrimary,
    textWrap: 'balance' as any,
    letterSpacing: block.options?.letterSpacing !== undefined ? `${block.options.letterSpacing}px` : undefined,
    textAlign: block.options?.textAlign || (block.options?.align as any) || 'left',
    fontFamily: isSerifLegacy ? '"Instrument Serif", serif' : safeFontFamily,
    fontWeight: block.options?.fontWeight || defaultFontWeight,
    fontSize: `${effectiveFontSize}px`,
    lineHeight: resolvedLineHeight,
    width: '100%'
  };

  const renderRichText = (input: string) => {
    let parts: (string | React.ReactNode)[] = [input];

    // Handle Background Accent Highlight [[...]]
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
                  className="inline px-6 py-[0.12em] rounded-2xl mx-1 font-black"
                  style={{ 
                    backgroundColor: highlightBackgroundColor,
                    color: theme.colors.hlTextColor || '#000',
                    WebkitBoxDecorationBreak: 'clone',
                    boxDecorationBreak: 'clone' as any,
                    fontFamily: safeFontFamily,
                    lineHeight: 1.04,
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

    // Handle Highlight (options.highlight)
    if (highlight && typeof highlight === 'string' && highlight.trim() !== '') {
      const newParts: (string | React.ReactNode)[] = [];
      parts.forEach(part => {
        if (typeof part === 'string') {
          const split = part.split(new RegExp(`(${highlight})`, 'gi'));
          split.forEach((s, i) => {
            if (s.toLowerCase() === highlight.toLowerCase()) {
              newParts.push(<span key={`hl-${i}`} style={{ color: theme.colors.highlight }}>{renderEmojiText(s, `hl-${i}`, emojiSize)}</span>);
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

    // Handle Markdown Bold **
    const finalParts: (string | React.ReactNode)[] = [];
    parts.forEach(part => {
      if (typeof part === 'string') {
        const split = part.split(/\*\*([\s\S]*?)\*\*/g);
        split.forEach((s, i) => {
          if (i % 2 === 1) {
            finalParts.push(<span key={`bold-${i}`} className="font-black">{renderEmojiText(s, `bold-${i}`, emojiSize)}</span>);
          } else if (s !== "") {
            finalParts.push(s);
          }
        });
      } else {
        finalParts.push(part);
      }
    });

    return renderEmojiNodes(finalParts, 'title', emojiSize);
  };

  if (variant === 'oval') {
     return (
        <div className="relative inline-flex items-center justify-center py-10 px-20 mb-6 w-full">
           <div className="absolute inset-0 border-[10px] rounded-[100%] border-white opacity-20 transform scale-[1.3] scale-y-[0.8]" />
           <h1 
              ref={elementRef}
              className={`w-full ${sizeClasses[size as keyof typeof sizeClasses]} uppercase relative z-10 italic`} 
              style={{ ...style, textAlign: 'center', whiteSpace: 'pre-line', textWrap: undefined }}
              data-block-type="TITLE"
              data-text-fit-disabled={disableAutoFit ? 'true' : undefined}
            >
              {renderRichText(text)}
            </h1>
        </div>
     );
  }

  return (
    <h1 
      ref={elementRef}
      className={`w-full ${sizeClasses[size as keyof typeof sizeClasses]}`} 
      style={{ ...style, whiteSpace: 'pre-line', textWrap: undefined }}
      data-block-type="TITLE"
      data-text-fit-disabled={disableAutoFit ? 'true' : undefined}
    >
      {renderRichText(text)}
    </h1>
  );
}
