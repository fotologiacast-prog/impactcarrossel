
import React from 'react';
import { Block, Theme } from '../../types';
import { quoteFontFamily } from '../../utils/branding';
import { renderEmojiNodes, renderEmojiText } from '../../utils/emoji';
import { formatTextForRender, resolveLineBreakMode } from '../../utils/text-layout';

export function BadgeRenderer({ block, theme }: { block: Block; theme: Theme }) {
  const lineBreakMode = resolveLineBreakMode(block.options?.lineBreakMode);
  const text = formatTextForRender((block.content as string) || '', lineBreakMode);
  const highlight = block.options?.highlight;
  const hasBgHighlight = text.includes('[[');
  const opacity = theme.colors.cardOpacity !== undefined ? theme.colors.cardOpacity : 1;
  const fontVariant = block.options?.fontVariant || 'padrão';

  const selectedFont = fontVariant === 'destaque' 
    ? (theme.typography.fontFamilySecondary || '"Instrument Serif", serif') 
    : theme.typography.fontFamily;

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
      className={`inline-block px-10 py-6 text-[26px] rounded-lg ${hasBgHighlight ? '!leading-[1.8]' : '!leading-[1.3]'}`}
      style={{ 
        backgroundColor: theme.colors.cardBg || theme.colors.highlight, 
        opacity: opacity,
        color: textColor,
        whiteSpace: lineBreakMode === 'manual' ? 'pre-line' : 'normal',
        textWrap: lineBreakMode === 'manual' ? undefined : 'balance' as any,
        maxWidth: '100%',
        fontFamily: safeFontFamily,
        fontWeight: fontVariant === 'destaque' ? 400 : 300
      }}
    >
      {renderContent()}
    </div>
  );
}
