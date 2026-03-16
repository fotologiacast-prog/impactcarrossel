
import React from 'react';
import { Block, Theme } from '../../types';
import * as Icons from 'lucide-react';
import { quoteFontFamily } from '../../utils/branding';
import { renderEmojiNodes, renderEmojiText } from '../../utils/emoji';
import { formatTextForRender, resolveLineBreakMode } from '../../utils/text-layout';

interface CardRendererProps {
  block: Block;
  theme: Theme;
  onEditIcon?: (block: Block) => void;
}

export function CardRenderer({ block, theme, onEditIcon }: CardRendererProps) {
  const customIcon = block.options?.customIcon;
  const iconName = block.options?.icon;
  const lineBreakMode = resolveLineBreakMode(block.options?.lineBreakMode);
  const text = formatTextForRender(Array.isArray(block.content) ? block.content.join(' ') : (block.content || '') as string, lineBreakMode);
  const highlight = block.options?.highlight;
  const variant = block.options?.variant || 'default';
  const hasBgHighlight = text.includes('[[');
  const isAccent = variant === 'accent' || variant === 'box' || variant === 'default';
  const opacity = theme.colors.cardOpacity !== undefined ? theme.colors.cardOpacity : 1;
  const cardColor = theme.colors.cardBg || theme.colors.accent;
  const textColor = theme.colors.cardTextColor || (isAccent ? '#000000' : theme.colors.textPrimary);
  const fontVariant = block.options?.fontVariant || 'padrão';

  const selectedFont = fontVariant === 'destaque' 
    ? (theme.typography.fontFamilySecondary || '"Instrument Serif", serif') 
    : theme.typography.fontFamily;

  // Ensure font family is quoted
  const safeFontFamily = quoteFontFamily(selectedFont, theme.typography.fontFamily);

  const containerStyles: React.CSSProperties = {
    backgroundColor: isAccent ? cardColor : 'rgba(255,255,255,0.06)',
    opacity: isAccent ? opacity : 1,
    borderColor: isAccent ? 'transparent' : 'rgba(255,255,255,0.1)',
    borderWidth: '2px',
    color: textColor,
    borderRadius: '40px',
    textWrap: 'balance' as any,
    fontFamily: safeFontFamily
  };

  const renderRichContent = () => {
    let parts: (string | React.ReactNode)[] = [text];
    {
      const newParts: (string | React.ReactNode)[] = [];
      parts.forEach(part => {
        if (typeof part === 'string') {
          const split = part.split(/\[\[(.*?)\]\]/g);
          split.forEach((s, i) => {
            if (i % 2 === 1) {
              newParts.push(<span key={`bg-hl-${i}`} className="inline px-3 py-1 rounded-lg mx-1 font-black" style={{ backgroundColor: theme.colors.hlBgColor || (isAccent ? '#fff' : theme.colors.accent), color: theme.colors.hlTextColor || '#000', WebkitBoxDecorationBreak: 'clone', boxDecorationBreak: 'clone' as any, fontFamily: theme.typography.fontFamily }}>{renderEmojiText(s, `bg-hl-${i}`)}</span>);
            } else if (s !== "") { newParts.push(s); }
          });
        } else { newParts.push(part); }
      });
      parts = newParts;
    }
    if (highlight && typeof highlight === 'string' && highlight.trim() !== '') {
      const newParts: (string | React.ReactNode)[] = [];
      parts.forEach(part => {
        if (typeof part === 'string') {
          const split = part.split(new RegExp(`(${highlight})`, 'gi'));
          split.forEach((s, i) => {
            if (s.toLowerCase() === highlight.toLowerCase()) {
              newParts.push(<span key={`hl-${i}`} className="font-black" style={{ color: isAccent ? '#000' : theme.colors.highlight, fontWeight: 900 }}>{renderEmojiText(s, `hl-${i}`)}</span>);
            } else if (s !== "") { newParts.push(s); }
          });
        } else { newParts.push(part); }
      });
      parts = newParts;
    }
    const finalParts: (string | React.ReactNode)[] = [];
    parts.forEach(part => {
      if (typeof part === 'string') {
        const split = part.split(/\*\*(.*?)\*\*/g);
        split.forEach((s, i) => {
          if (i % 2 === 1) { finalParts.push(<span key={`bold-${i}`} className="font-black" style={{ fontWeight: 900 }}>{renderEmojiText(s, `bold-${i}`)}</span>); }
          else if (s !== "") { finalParts.push(s); }
        });
      } else { finalParts.push(part); }
    });
    return renderEmojiNodes(finalParts, 'card');
  };

  const renderIcon = () => {
    if (customIcon) {
       if (customIcon.startsWith('<svg')) return (<div className="w-12 h-12 flex items-center justify-center" dangerouslySetInnerHTML={{ __html: customIcon }} style={{ color: isAccent ? textColor : theme.colors.accent }} />);
       if (customIcon.startsWith('http') || customIcon.startsWith('data:image')) return <img src={customIcon} className="w-12 h-12 object-contain rounded-md" alt="icon" />;
       const IconFromCustom = (Icons as any)[customIcon];
       if (IconFromCustom) return <IconFromCustom size={48} strokeWidth={2} />;
    }
    const targetIconName = iconName || (variant === 'accent' || variant === 'default' ? 'Zap' : 'CircleDot');
    const IconComponent = (Icons as any)[targetIconName];
    if (IconComponent) return <IconComponent size={48} strokeWidth={2} />;
    return null;
  };

  return (
    <div className="relative flex items-center gap-8 p-10 w-full transition-all shadow-lg hover:translate-y-[-4px]" style={containerStyles}>
      <div onClick={() => onEditIcon?.(block)} className="group relative cursor-pointer shrink-0">
        <div className="opacity-80 group-hover:opacity-100 transition-opacity" style={{ color: isAccent ? textColor : theme.colors.accent }}>{renderIcon()}</div>
        <div className="absolute inset-[-10px] bg-brand/20 border-2 border-brand rounded-xl opacity-0 group-hover:opacity-100 transition-all flex items-center justify-center scale-90 group-hover:scale-100">
           <Icons.Edit3 size={20} className="text-brand" />
        </div>
      </div>
      <div 
        className={`flex-1 ${hasBgHighlight ? '!leading-[1.7]' : '!leading-[1.3]'} tracking-tight`} 
        style={{ 
          fontWeight: fontVariant === 'destaque' ? 400 : 300,
          fontSize: block.options?.fontSize ? `${block.options.fontSize}px` : '30px',
          whiteSpace: lineBreakMode === 'manual' ? 'pre-line' : 'normal',
          textWrap: lineBreakMode === 'manual' ? undefined : 'pretty'
        }}
      >
        {renderRichContent()}
      </div>
    </div>
  );
}
