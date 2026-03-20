
import React from 'react';
import { Block, Theme } from '../../types';
import { quoteFontFamily } from '../../utils/branding';
import { renderEmojiNodes, renderEmojiText } from '../../utils/emoji';

interface ListRendererProps {
  block: Block;
  theme: Theme;
}

export function ListRenderer({ block, theme }: ListRendererProps) {
  const items = Array.isArray(block.content) ? block.content : [block.content];
  const isBox = block.options?.variant === 'box';
  const fontVariant = block.options?.fontVariant || 'padrão';

  const selectedFont = fontVariant === 'destaque' 
    ? (theme.typography.fontFamilySecondary || '"Instrument Serif", serif') 
    : theme.typography.fontFamily;

  // Ensure font family is quoted
  const safeFontFamily = quoteFontFamily(selectedFont, theme.typography.fontFamily);

  const commonStyle: React.CSSProperties = {
    fontSize: block.options?.fontSize ? `${block.options.fontSize}px` : undefined,
    letterSpacing: block.options?.letterSpacing !== undefined ? `${block.options.letterSpacing}px` : undefined,
    lineHeight: block.options?.lineHeight !== undefined ? block.options.lineHeight : undefined,
    textAlign: block.options?.textAlign || (block.options?.align as any) || 'left',
    color: block.options?.color || undefined,
    fontFamily: safeFontFamily,
    fontWeight: block.options?.fontWeight || (fontVariant === 'destaque' ? 400 : 300)
  };

  const renderRichText = (text: string, highlight?: string) => {
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
                  className="inline-block px-2 py-0.5 rounded-md mx-1 align-baseline font-black"
                  style={{ 
                    backgroundColor: theme.colors.hlBgColor || theme.colors.accent,
                    color: theme.colors.hlTextColor || '#000',
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

    // Highlight logic (options.highlight)
    if (highlight) {
      const newParts: (string | React.ReactNode)[] = [];
      parts.forEach(part => {
        if (typeof part === 'string') {
          const split = part.split(new RegExp(`(${highlight})`, 'gi'));
          split.forEach((s, i) => {
            if (s.toLowerCase() === highlight.toLowerCase()) {
              newParts.push(
                <span 
                  key={`hl-${i}`} 
                  className="font-black" 
                  style={{ fontWeight: 900, color: theme.colors.highlight }}
                >
                  {renderEmojiText(s, `hl-${i}`)}
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

    // Markdown Bold logic
    const finalParts: (string | React.ReactNode)[] = [];
    parts.forEach(part => {
      if (typeof part === 'string') {
        const split = part.split(/\*\*(.*?)\*\*/g);
        split.forEach((s, i) => {
          if (i % 2 === 1) {
            finalParts.push(
              <span 
                key={`bold-${i}`} 
                className="font-black" 
                style={{ fontWeight: 900, color: block.options?.color || theme.colors.textPrimary }}
              >
                  {renderEmojiText(s, `bold-${i}`)}
                </span>
              );
          } else if (s !== "") {
            finalParts.push(s);
          }
        });
      } else {
        finalParts.push(part);
      }
    });

    return renderEmojiNodes(finalParts, 'list');
  };
  
  return (
    <div 
      className={`flex flex-col ${isBox ? 'gap-3 w-full' : 'gap-4 mt-2 w-full'}`}
      style={{ textAlign: commonStyle.textAlign }}
      data-block-type="LIST"
    >
      {items.map((item, index) => {
        const text = item as string;
        const highlight = block.options?.highlight;
        const content = renderRichText(text, highlight);

        if (isBox) {
          return (
            <div 
              key={index} 
              className="w-full py-4 px-10 rounded-md text-[34px]" 
              style={{ 
                ...commonStyle,
                backgroundColor: theme.colors.highlight, 
                color: '#000', 
                fontWeight: 900,
                textAlign: 'center' 
              }}
            >
              {content}
            </div>
          );
        }

        return (
          <div key={index} className={`flex items-start gap-6 ${commonStyle.textAlign === 'center' ? 'justify-center' : (commonStyle.textAlign === 'right' ? 'justify-end' : 'justify-start')}`}>
            {commonStyle.textAlign !== 'right' && (
              <div 
                className="mt-[22px] w-3 h-3 rounded-full shrink-0" 
                style={{ 
                  backgroundColor: theme.colors.accent,
                  boxShadow: `0 0 10px ${theme.colors.accent}80` 
                }} 
              />
            )}
            <p 
              className={theme.typography.body} 
              style={{ 
                ...commonStyle, 
                color: commonStyle.color || theme.colors.textSecondary,
              }}
            >
              {content}
            </p>
            {commonStyle.textAlign === 'right' && (
              <div 
                className="mt-[22px] w-3 h-3 rounded-full shrink-0" 
                style={{ 
                  backgroundColor: theme.colors.accent,
                  boxShadow: `0 0 10px ${theme.colors.accent}80` 
                }} 
              />
            )}
          </div>
        );
      })}
    </div>
  );
}
