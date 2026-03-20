
import React from 'react';
import { Block, Theme } from '../../types';
import { quoteFontFamily } from '../../utils/branding';
import { renderEmojiNodes, renderEmojiText } from '../../utils/emoji';
import { fitTextToConstraint } from '../../utils/text-fit';

export function ParagraphRenderer({ block, theme }: { block: Block; theme: Theme }) {
  const rawContent = (block.content as string) || '';
  const fontVariant = block.options?.fontVariant || 'padrão';
  const elementRef = React.useRef<HTMLParagraphElement>(null);
  const [availableWidth, setAvailableWidth] = React.useState(0);

  const selectedFont = fontVariant === 'destaque' 
    ? (theme.typography.fontFamilySecondary || '"Instrument Serif", serif') 
    : theme.typography.fontFamily;
  const resolvedFontSize = block.options?.fontSize || 32;
  const resolvedLineHeight = block.options?.lineHeight ?? 1.3;
  const fitted = React.useMemo(() => fitTextToConstraint(rawContent, {
    availableWidth: availableWidth || 840,
    availableHeight: resolvedFontSize * resolvedLineHeight * 6,
    fontSize: resolvedFontSize,
    fontFamily: selectedFont,
    fontWeight: block.options?.fontWeight || 300,
    lineHeight: resolvedLineHeight,
    letterSpacing: block.options?.letterSpacing,
    maxLines: 6,
    minFontSize: Math.max(18, Math.round(resolvedFontSize * 0.78)),
    overflow: 'shrink',
    role: 'paragraph',
  }), [
    availableWidth,
    block.options?.fontWeight,
    block.options?.letterSpacing,
    rawContent,
    resolvedFontSize,
    resolvedLineHeight,
    selectedFont,
  ]);
  const content = fitted.formatted;
  const hasBgHighlight = content.includes('[[');

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

  const style: React.CSSProperties = { 
    color: block.options?.color || theme.colors.textSecondary,
    fontFamily: safeFontFamily,
    fontWeight: block.options?.fontWeight || 300,
    textWrap: 'pretty' as any,
    fontSize: `${fitted.effectiveFontSize}px`,
    letterSpacing: block.options?.letterSpacing !== undefined ? `${block.options.letterSpacing}px` : undefined,
    lineHeight: resolvedLineHeight,
    textAlign: block.options?.textAlign || (block.options?.align as any) || 'left',
    width: '100%'
  };

  const renderRichText = (text: string) => {
    let parts: (string | React.ReactNode)[] = [text];

    // Handle Background Accent Highlight [[...]]
    {
      const newParts: (string | React.ReactNode)[] = [];
      parts.forEach(part => {
        if (typeof part === 'string') {
          const split = part.split(/\[\[(.*?)\]\]/g);
          split.forEach((s, i) => {
            if (i % 2 === 1) {
              newParts.push(
                <span 
                  key={`bg-hl-${i}`} 
                  className="inline px-2 py-0.5 rounded-md mx-1 font-black"
                  style={{ 
                    backgroundColor: theme.colors.hlBgColor || theme.colors.accent,
                    color: theme.colors.hlTextColor || '#000',
                    WebkitBoxDecorationBreak: 'clone',
                    boxDecorationBreak: 'clone' as any,
                    fontFamily: theme.typography.fontFamily
                  }}
                >
                  {renderEmojiText(s, `bg-hl-${i}`)}
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
        const split = part.split(/\*\*(.*?)\*\*/g);
        split.forEach((s, i) => {
          if (i % 2 === 1) {
            finalParts.push(<span key={`bold-${i}`} className="font-black" style={{ fontWeight: 900 }}>{renderEmojiText(s, `bold-${i}`)}</span>);
          } else if (s !== "") {
            finalParts.push(s);
          }
        });
      } else {
        finalParts.push(part);
      }
    });

    return renderEmojiNodes(finalParts, 'paragraph');
  };

  return (
    <p
      ref={elementRef}
      className={`w-full ${theme.typography.paragraph} ${hasBgHighlight ? '!leading-[1.6]' : '!leading-[1.3]'}`}
      style={{ ...style, whiteSpace: 'pre-line', textWrap: undefined }}
      data-block-type="PARAGRAPH"
    >
      {renderRichText(content)}
    </p>
  );
}
