
import React from 'react';
import { Block, Theme } from '../../types';
import { quoteFontFamily } from '../../utils/branding';
import { renderEmojiNodes, renderEmojiText } from '../../utils/emoji';
import { fitTextToConstraint } from '../../utils/text-fit';

export function BadgeRenderer({ block, theme }: { block: Block; theme: Theme }) {
  const rawText = (block.content as string) || '';
  const highlight = block.options?.highlight;
  const fontVariant = block.options?.fontVariant || 'padrão';
  const badgeRef = React.useRef<HTMLDivElement>(null);
  const [availableBox, setAvailableBox] = React.useState({ width: 0, height: 0 });
  const opacity = theme.colors.cardOpacity !== undefined ? theme.colors.cardOpacity : 1;

  const selectedFont = fontVariant === 'destaque' 
    ? (theme.typography.fontFamilySecondary || '"Instrument Serif", serif') 
    : theme.typography.fontFamily;
  const resolvedFontSize = block.options?.fontSize || 26;
  const resolvedLineHeight = block.options?.lineHeight ?? 1.3;
  const fitted = React.useMemo(() => fitTextToConstraint(rawText, {
    availableWidth: availableBox.width || 420,
    availableHeight: availableBox.height || resolvedFontSize * resolvedLineHeight * 2,
    fontSize: resolvedFontSize,
    fontFamily: selectedFont,
    fontWeight: block.options?.fontWeight || (fontVariant === 'destaque' ? 400 : 300),
    lineHeight: resolvedLineHeight,
    letterSpacing: block.options?.letterSpacing,
    maxLines: 2,
    minFontSize: Math.max(16, Math.round(resolvedFontSize * 0.78)),
    overflow: 'shrink',
    role: 'badge',
  }), [
    availableBox.height,
    availableBox.width,
    block.options?.fontWeight,
    block.options?.letterSpacing,
    fontVariant,
    rawText,
    resolvedFontSize,
    resolvedLineHeight,
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
  const textColor = theme.colors.cardTextColor || '#000000';

  const renderContent = () => {
    let parts: (string | React.ReactNode)[] = [text];

    // Background Accent Highlight [[...]]
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
                  className="inline px-3 py-1 rounded-md mx-1 font-black"
                  style={{ 
                    backgroundColor: theme.colors.hlBgColor || '#fff',
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
                newParts.push(<span key={i} className="font-black">{renderEmojiText(s, `hl-${i}`)}</span>);
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

    return renderEmojiNodes(parts, 'badge');
  };

  return (
    <div 
      ref={badgeRef}
      className={`inline-block px-10 py-6 text-[26px] rounded-lg ${hasBgHighlight ? '!leading-[1.8]' : '!leading-[1.3]'}`}
      style={{ 
        backgroundColor: theme.colors.cardBg || theme.colors.highlight, 
        opacity: opacity,
        color: textColor,
        whiteSpace: 'pre-line',
        textWrap: undefined,
        maxWidth: '100%',
        fontFamily: safeFontFamily,
        fontWeight: block.options?.fontWeight || (fontVariant === 'destaque' ? 400 : 300),
        fontSize: `${fitted.effectiveFontSize}px`,
        lineHeight: resolvedLineHeight,
      }}
    >
      {renderContent()}
    </div>
  );
}
