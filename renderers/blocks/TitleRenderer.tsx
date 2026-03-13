
import React from 'react';
import { Block, Theme } from '../../types';
import { quoteFontFamily } from '../../utils/branding';
import { renderEmojiNodes, renderEmojiText } from '../../utils/emoji';
import { applyWidowProtection } from '../../utils/text-layout';

interface TitleRendererProps {
  block: Block;
  theme: Theme;
}

export function TitleRenderer({ block, theme }: TitleRendererProps) {
  const rawText = Array.isArray(block.content) ? block.content.join(' ') : (block.content || '') as string;
  const text = applyWidowProtection(rawText);
  const highlight = block.options?.highlight;
  const size = block.options?.size || 'md';
  const variant = block.options?.variant;
  const hasBgHighlight = text.includes('[[');
  const isSerifLegacy = block.options?.fontFamily === 'serif';
  const fontVariant = block.options?.fontVariant || 'padrão';

  const sizeClasses = {
    sm: `text-[64px] font-black tracking-tight ${hasBgHighlight ? 'leading-[1.2]' : 'leading-[1.1]'}`,
    md: `${theme.typography.title} ${hasBgHighlight ? 'leading-[1.15]' : 'leading-[0.95]'}`,
    lg: `text-[180px] font-[1000] tracking-[-0.08em] ${hasBgHighlight ? 'leading-[1.0]' : 'leading-[0.85]'}`
  };

  const selectedFont = fontVariant === 'destaque' 
    ? (theme.typography.fontFamilySecondary || '"Instrument Serif", serif') 
    : theme.typography.fontFamily;

  // Ensure font family is quoted if it's not already a generic family or complex string
  const safeFontFamily = quoteFontFamily(selectedFont, theme.typography.fontFamily);

  const style: React.CSSProperties = { 
    color: block.options?.color || theme.colors.textPrimary,
    textWrap: 'balance' as any,
    fontSize: block.options?.fontSize ? `${block.options.fontSize}px` : undefined,
    letterSpacing: block.options?.letterSpacing !== undefined ? `${block.options.letterSpacing}px` : undefined,
    lineHeight: block.options?.lineHeight !== undefined ? block.options.lineHeight : undefined,
    textAlign: block.options?.textAlign || (block.options?.align as any) || 'left',
    fontFamily: isSerifLegacy ? '"Instrument Serif", serif' : safeFontFamily,
    fontWeight: (fontVariant === 'destaque' || isSerifLegacy || selectedFont.includes('Serif') || selectedFont.includes('Playfair')) ? 400 : undefined,
    width: '100%'
  };

  const renderRichText = (input: string) => {
    let parts: (string | React.ReactNode)[] = [input];

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
                  className="inline px-6 py-1 rounded-2xl mx-1 font-black"
                  style={{ 
                    backgroundColor: theme.colors.hlBgColor || theme.colors.accent,
                    color: theme.colors.hlTextColor || '#000',
                    WebkitBoxDecorationBreak: 'clone',
                    boxDecorationBreak: 'clone' as any,
                    fontFamily: theme.typography.fontFamily // Use standard font for highlights usually
                  }}
                >
                  {renderEmojiText(s, `bg-hl-${i}`, '1.08em')}
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
              newParts.push(<span key={`hl-${i}`} style={{ color: theme.colors.highlight }}>{renderEmojiText(s, `hl-${i}`, '1.08em')}</span>);
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
            finalParts.push(<span key={`bold-${i}`} className="font-black">{renderEmojiText(s, `bold-${i}`, '1.08em')}</span>);
          } else if (s !== "") {
            finalParts.push(s);
          }
        });
      } else {
        finalParts.push(part);
      }
    });

    return renderEmojiNodes(finalParts, 'title', '1.08em');
  };

  if (variant === 'oval') {
     return (
        <div className="relative inline-flex items-center justify-center py-10 px-20 mb-6 w-full">
           <div className="absolute inset-0 border-[10px] rounded-[100%] border-white opacity-20 transform scale-[1.3] scale-y-[0.8]" />
           <h1 
              className={`w-full ${sizeClasses[size as keyof typeof sizeClasses]} uppercase relative z-10 italic`} 
              style={{ ...style, textAlign: 'center' }}
              data-block-type="TITLE"
            >
              {renderRichText(text)}
            </h1>
        </div>
     );
  }

  return (
    <h1 
      className={`w-full ${sizeClasses[size as keyof typeof sizeClasses]}`} 
      style={{ ...style, textWrap: 'balance' as any }}
      data-block-type="TITLE"
    >
      {renderRichText(text)}
    </h1>
  );
}
