
import React from 'react';
import { Block, Theme } from '../../types';
import { quoteFontFamily } from '../../utils/branding';
import { getEmojiSizeForContext, renderEmojiNodes, renderEmojiText } from '../../utils/emoji';
import { fitTextToConstraint } from '../../utils/text-fit';

const resolveSemanticColor = (color: string | undefined, theme: Theme) => {
  if (color === 'accent') return theme.colors.accent;
  if (color === 'highlight') return theme.colors.highlight;
  if (color === 'text') return theme.colors.textPrimary;
  if (color === 'muted') return theme.colors.textSecondary;
  return color;
};

export function ParagraphRenderer({ block, theme }: { block: Block; theme: Theme }) {
  const rawContent = (block.content as string) || '';
  const fontVariant = block.options?.fontVariant || 'padrão';
  const semanticRole = block.options?.semanticRole;
  const elementRef = React.useRef<HTMLParagraphElement>(null);
  const [availableWidth, setAvailableWidth] = React.useState(0);
  const cleanHighlightLine = (text: string) =>
    text
      .replace(/\[\[|\]\]/g, ' ')
      .replace(/[ \t]+/g, ' ')
      .trim();
  const getManualHighlightLines = (text: string) =>
    text
      .replace(/\r\n?/g, '\n')
      .split(/\n+/)
      .map(cleanHighlightLine)
      .filter(Boolean);

  const selectedFont = block.options?.fontFamily
    || (fontVariant === 'destaque'
      ? (theme.typography.fontFamilySecondary || '"Instrument Serif", serif')
      : theme.typography.fontFamily);
  const resolvedFontSize = block.options?.fontSize || 29;
  const hasBgHighlight = rawContent.includes('[[');
  const isFullContentHighlight = /^\s*\[\[[\s\S]*\]\]\s*$/.test(block.options?.manualBreaks || rawContent);
  const shouldRenderHighlightStack = semanticRole === 'highlight' || isFullContentHighlight;
  const disableAutoFit = block.options?.disableAutoFit === true;
  const resolvedLineHeight = block.options?.lineHeight ?? (hasBgHighlight ? 1.48 : 1.38);
  const highlightFontWeight = Math.min(Number(block.options?.fontWeight || 700), 700);
  const resolvedFontWeight = shouldRenderHighlightStack
    ? highlightFontWeight
    : block.options?.fontWeight || 300;
  const manualHighlightLines = shouldRenderHighlightStack
    ? getManualHighlightLines(block.options?.manualBreaks || rawContent)
    : [];
  const sourceForFit = shouldRenderHighlightStack
    ? manualHighlightLines.join('\n')
    : rawContent;
  const fitted = React.useMemo(() => fitTextToConstraint(sourceForFit, {
    availableWidth: availableWidth || 960,
    availableHeight: resolvedFontSize * resolvedLineHeight * 6,
    fontSize: resolvedFontSize,
    fontFamily: selectedFont,
    fontWeight: resolvedFontWeight,
    lineHeight: resolvedLineHeight,
    letterSpacing: block.options?.letterSpacing,
    maxLines: 6,
    minFontSize: Math.max(18, Math.round(resolvedFontSize * 0.78)),
    overflow: disableAutoFit ? 'reflow' : 'shrink',
    role: shouldRenderHighlightStack ? 'card' : 'paragraph',
    mode: shouldRenderHighlightStack && manualHighlightLines.length > 1 ? 'manual' : block.options?.lineBreakMode,
    manualBreaks: shouldRenderHighlightStack
      ? manualHighlightLines.length > 1 ? manualHighlightLines.join('\n') : undefined
      : block.options?.manualBreaks,
  }), [
    availableWidth,
    block.options?.fontWeight,
    block.options?.letterSpacing,
    block.options?.lineBreakMode,
    block.options?.manualBreaks,
    disableAutoFit,
    resolvedFontSize,
    resolvedLineHeight,
    resolvedFontWeight,
    semanticRole,
    selectedFont,
    shouldRenderHighlightStack,
    sourceForFit,
    manualHighlightLines,
  ]);
  const content = disableAutoFit ? sourceForFit : fitted.formatted;
  const effectiveFontSize = disableAutoFit ? resolvedFontSize : fitted.effectiveFontSize;
  const emojiSize = getEmojiSizeForContext('paragraph');

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

  // Ensure font family is quoted
  const safeFontFamily = quoteFontFamily(selectedFont, theme.typography.fontFamily);
  const textAlign = block.options?.textAlign || (block.options?.align as any) || 'left';
  const highlightBackgroundColor = resolveSemanticColor(block.options?.highlightBackgroundColor || block.options?.backgroundColor, theme)
    || theme.colors.hlBgColor
    || theme.colors.accent;
  const highlightTextColor = resolveSemanticColor(block.options?.color, theme)
    || theme.colors.hlTextColor
    || '#000';

  if (shouldRenderHighlightStack) {
    const fittedHighlightLines = fitted.lines
      .flatMap((line) => line.split(/\n+/))
      .map(cleanHighlightLine)
      .filter(Boolean);
    const highlightLines = manualHighlightLines.length > 1
      ? manualHighlightLines
      : fittedHighlightLines.length > 0
        ? fittedHighlightLines
        : [sourceForFit].map(cleanHighlightLine).filter(Boolean);

    return (
      <p
        ref={elementRef}
        data-block-type="PARAGRAPH"
        data-paragraph-semantic-role="highlight"
        data-text-fit-disabled={disableAutoFit ? 'true' : undefined}
        className="w-full"
        style={{
          fontFamily: safeFontFamily,
          fontSize: `${effectiveFontSize}px`,
          fontWeight: highlightFontWeight,
          lineHeight: Math.max(1.16, resolvedLineHeight),
          letterSpacing: block.options?.letterSpacing !== undefined ? `${block.options.letterSpacing}px` : undefined,
          textAlign,
          color: highlightTextColor,
          whiteSpace: 'normal',
          wordBreak: 'normal',
          overflowWrap: 'break-word',
          textWrap: 'balance' as React.CSSProperties['textWrap'],
        }}
      >
        <span
          data-paragraph-highlight-stack="true"
          style={{
            display: 'inline-flex',
            flexDirection: 'column',
            gap: '0.22em',
            width: 'fit-content',
            maxWidth: '100%',
            alignItems: textAlign === 'center' ? 'center' : textAlign === 'right' ? 'flex-end' : 'flex-start',
            verticalAlign: 'top',
          }}
        >
          {highlightLines.map((line, index) => (
            <span
              key={`paragraph-highlight-line-${index}`}
              data-paragraph-highlight-line="true"
              style={{
                display: 'inline-block',
                width: 'fit-content',
                maxWidth: '100%',
                backgroundColor: highlightBackgroundColor,
                color: highlightTextColor,
                borderRadius: '8px',
                padding: '0.16em 0.38em',
                fontFamily: safeFontFamily,
                fontWeight: highlightFontWeight,
                textAlign,
                WebkitBoxDecorationBreak: 'clone',
                boxDecorationBreak: 'clone' as any,
              }}
            >
              {renderEmojiNodes([line], `paragraph-highlight-${index}`, emojiSize)}
            </span>
          ))}
        </span>
      </p>
    );
  }

  const style: React.CSSProperties = { 
    color: resolveSemanticColor(block.options?.color, theme) || theme.colors.textSecondary,
    fontFamily: safeFontFamily,
    fontWeight: block.options?.fontWeight || 300,
    textWrap: 'pretty' as any,
    fontSize: `${effectiveFontSize}px`,
    letterSpacing: block.options?.letterSpacing !== undefined ? `${block.options.letterSpacing}px` : undefined,
    lineHeight: resolvedLineHeight,
    textAlign,
    width: '100%'
  };

  const renderRichText = (text: string) => {
    let parts: (string | React.ReactNode)[] = [text];

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
                  className="inline px-2 py-0.5 rounded-md mx-1 font-black"
                  style={{ 
                    backgroundColor: highlightBackgroundColor,
                    color: highlightTextColor,
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

    // Handle Markdown Bold **
    const finalParts: (string | React.ReactNode)[] = [];
    parts.forEach(part => {
      if (typeof part === 'string') {
        const split = part.split(/\*\*([\s\S]*?)\*\*/g);
        split.forEach((s, i) => {
          if (i % 2 === 1) {
            finalParts.push(<span key={`bold-${i}`} className="font-black" style={{ fontWeight: 900 }}>{renderEmojiText(s, `bold-${i}`, emojiSize)}</span>);
          } else if (s !== "") {
            finalParts.push(s);
          }
        });
      } else {
        finalParts.push(part);
      }
    });

    return renderEmojiNodes(finalParts, 'paragraph', emojiSize);
  };

  return (
    <p
      ref={elementRef}
      className={`w-full ${theme.typography.paragraph} ${hasBgHighlight ? '!leading-[1.72]' : '!leading-[1.38]'}`}
      style={{ ...style, whiteSpace: 'pre-line', textWrap: undefined }}
      data-block-type="PARAGRAPH"
      data-paragraph-semantic-role={semanticRole}
      data-text-fit-disabled={disableAutoFit ? 'true' : undefined}
    >
      {renderRichText(content)}
    </p>
  );
}
