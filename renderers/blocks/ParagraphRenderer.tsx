
import React from 'react';
import { Block, Theme } from '../../types';
import { quoteFontFamily } from '../../utils/branding';
import { renderEmojiNodes, renderEmojiText } from '../../utils/emoji';
import { applyWidowProtection } from '../../utils/text-layout';

export function ParagraphRenderer({ block, theme }: { block: Block; theme: Theme }) {
  const content = applyWidowProtection((block.content as string) || '');
  const hasBgHighlight = content.includes('[[');
  const fontVariant = block.options?.fontVariant || 'padrão';

  const selectedFont = fontVariant === 'destaque' 
    ? (theme.typography.fontFamilySecondary || '"Instrument Serif", serif') 
    : theme.typography.fontFamily;

  // Ensure font family is quoted
  const safeFontFamily = quoteFontFamily(selectedFont, theme.typography.fontFamily);

  const style: React.CSSProperties = { 
    color: block.options?.color || theme.colors.textSecondary,
    fontFamily: safeFontFamily,
    fontWeight: 300,
    textWrap: 'pretty' as any,
    fontSize: block.options?.fontSize ? `${block.options.fontSize}px` : undefined,
    letterSpacing: block.options?.letterSpacing !== undefined ? `${block.options.letterSpacing}px` : undefined,
    lineHeight: block.options?.lineHeight !== undefined ? block.options.lineHeight : undefined,
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
      className={`w-full ${theme.typography.paragraph} ${hasBgHighlight ? '!leading-[1.6]' : '!leading-[1.3]'}`}
      style={{ ...style, textWrap: 'pretty' as any }}
      data-block-type="PARAGRAPH"
    >
      {renderRichText(content)}
    </p>
  );
}
