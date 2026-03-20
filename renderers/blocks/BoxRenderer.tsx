
import React from 'react';
import { Block, Theme } from '../../types';
import * as Icons from 'lucide-react';
import { quoteFontFamily } from '../../utils/branding';
import { renderEmojiNodes, renderEmojiText } from '../../utils/emoji';
import { fitTextToConstraint } from '../../utils/text-fit';

interface BoxRendererProps {
  block: Block;
  theme: Theme;
  isGridMember?: boolean;
  indexInGrid?: number;
  totalInGroup?: number;
  groupLayout?: 'auto' | 'row' | 'grid' | 'stack';
  onEditIcon?: (block: Block) => void;
}

export function BoxRenderer({ block, theme, isGridMember, indexInGrid = 0, totalInGroup = 1, groupLayout = 'auto', onEditIcon }: BoxRendererProps) {
  const rawText = ((block.content || '') as string);
  const iconName = block.options?.icon;
  const customIcon = block.options?.customIcon;
  const variant = block.options?.variant || 'default';
  const align = block.options?.align || (isGridMember ? 'center' : 'left');
  const hasBgHighlight = rawText.includes('[[');
  const customPadding = block.options?.padding;
  const fontVariant = block.options?.fontVariant || 'padrão';
  const textRef = React.useRef<HTMLDivElement>(null);
  const [availableBox, setAvailableBox] = React.useState({ width: 0, height: 0 });

  const selectedFont = fontVariant === 'destaque' 
    ? (theme.typography.fontFamilySecondary || '"Instrument Serif", serif') 
    : theme.typography.fontFamily;

  // Ensure font family is quoted
  const safeFontFamily = quoteFontFamily(selectedFont, theme.typography.fontFamily);

  const renderRichText = (input: string) => {
    let parts: (string | React.ReactNode)[] = [input];
    {
      const newParts: (string | React.ReactNode)[] = [];
      parts.forEach(part => {
        if (typeof part === 'string') {
          const split = part.split(/\[\[([\s\S]*?)\]\]/g);
          split.forEach((s, i) => {
            if (i % 2 === 1) {
              newParts.push(<span key={`bg-hl-${i}`} className="inline px-4 py-1 rounded-xl mx-1 font-black" style={{ backgroundColor: theme.colors.hlBgColor || '#fff', color: theme.colors.hlTextColor || '#000', WebkitBoxDecorationBreak: 'clone', boxDecorationBreak: 'clone' as any, fontFamily: safeFontFamily }}>{renderEmojiText(s, `bg-hl-${i}`)}</span>);
            } else if (s !== "") { newParts.push(s); }
          });
        } else { newParts.push(part); }
      });
      parts = newParts;
    }
    const finalParts: (string | React.ReactNode)[] = [];
    parts.forEach(part => {
      if (typeof part === 'string') {
        const split = part.split(/\*\*([\s\S]*?)\*\*/g);
        split.forEach((s, i) => {
          if (i % 2 === 1) { finalParts.push(<span key={`bold-${i}`} className="font-black" style={{ fontWeight: 900 }}>{renderEmojiText(s, `bold-${i}`)}</span>); }
          else if (s !== "") { finalParts.push(s); }
        });
      } else { finalParts.push(part); }
    });
    return renderEmojiNodes(finalParts, 'box');
  };

  const isOutlined = variant === 'outlined';
  const isPill = variant === 'pill';
  const shouldReverseIcon = !isGridMember && indexInGrid % 2 === 1;
  const opacity = theme.colors.cardOpacity !== undefined ? theme.colors.cardOpacity : 1;
  const isHeroBox = totalInGroup === 1;
  const isDualBox = totalInGroup === 2;
  const computedPadding =
    customPadding !== undefined
      ? `${customPadding}px`
      : isHeroBox
        ? '64px'
        : isDualBox
          ? '52px'
          : '40px';
  const computedRadius = isHeroBox ? '72px' : isDualBox ? '60px' : '48px';
  const computedFontSize = block.options?.fontSize
    ? block.options.fontSize
    : isHeroBox
      ? '54px'
      : isDualBox
        ? '42px'
        : '34px';
  const computedMinHeight = isHeroBox ? '360px' : isDualBox ? '280px' : '220px';
  const computedWidth = isGridMember ? '100%' : isHeroBox ? 'min(100%, 940px)' : '100%';
  const resolvedFontSize = typeof computedFontSize === 'number' ? computedFontSize : parseInt(computedFontSize, 10);
  const resolvedLineHeight = block.options?.lineHeight ?? (hasBgHighlight ? 1.62 : 1.28);
  const fitted = React.useMemo(() => fitTextToConstraint(rawText, {
    availableWidth: availableBox.width || (isHeroBox ? 760 : isDualBox ? 420 : 360),
    availableHeight: availableBox.height || resolvedFontSize * resolvedLineHeight * (isHeroBox ? 4 : 5),
    fontSize: resolvedFontSize,
    fontFamily: selectedFont,
    fontWeight: block.options?.fontWeight || 900,
    lineHeight: resolvedLineHeight,
    letterSpacing: block.options?.letterSpacing,
    maxLines: isHeroBox ? 4 : isDualBox ? 4 : 5,
    minFontSize: Math.max(24, Math.round(resolvedFontSize * 0.84)),
    overflow: 'shrink',
    role: 'box',
  }), [
    availableBox.height,
    availableBox.width,
    block.options?.fontWeight,
    block.options?.letterSpacing,
    isDualBox,
    isHeroBox,
    rawText,
    resolvedFontSize,
    resolvedLineHeight,
    selectedFont,
  ]);
  const text = fitted.formatted;

  React.useEffect(() => {
    const target = textRef.current;
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
  
  const bgColor = isOutlined ? 'transparent' : (block.options?.color ? `${block.options.color}20` : (theme.colors.cardBg || theme.colors.accent));
  const textColor = block.options?.color || theme.colors.cardTextColor || (isOutlined ? theme.colors.textPrimary : '#000000');

  const renderIcon = () => {
    const baseIconSize = isHeroBox ? 132 : isGridMember ? 88 : (isPill ? 50 : 120);
    const scaledIconSize = Math.round(resolvedFontSize * (isHeroBox ? 1.55 : isDualBox ? 1.42 : 1.34));
    const renderSize = Math.max(baseIconSize, scaledIconSize);
    
    if (customIcon) {
       if (customIcon.startsWith('<svg')) return (<div style={{ width: renderSize, height: renderSize }} className="flex items-center justify-center" dangerouslySetInnerHTML={{ __html: customIcon }} />);
       if (customIcon.startsWith('http') || customIcon.startsWith('data:image')) return <img src={customIcon} style={{ width: renderSize, height: renderSize }} className="object-contain rounded-xl" alt="icon" />;
       const IconFromCustom = (Icons as any)[customIcon];
       if (IconFromCustom) return <IconFromCustom size={renderSize} strokeWidth={1.5} />;
    }
    if (iconName) {
      const IconComponent = (Icons as any)[iconName];
      if (IconComponent) return <IconComponent size={renderSize} strokeWidth={1.5} />;
    }
    return null;
  };

  if (isPill) {
     return (
        <div className="relative w-full p-12 rounded-[100px] flex items-center transition-all overflow-hidden border border-white/5 shadow-2xl" style={{ backgroundColor: block.options?.color || '#FFFFFF', color: '#000000', textAlign: 'left', fontFamily: safeFontFamily }}>
           <div className="flex-1">
              <h4 className="text-[38px] font-black leading-tight tracking-tight mb-2">{renderRichText(text)}</h4>
              <p className="text-[24px] opacity-60 font-medium">Informação adicional aqui...</p>
           </div>
           <div className="w-16 h-16 rounded-full border-2 border-black/10 flex items-center justify-center shrink-0">
              <Icons.ArrowUpRight size={32} strokeWidth={2.5} />
           </div>
        </div>
     );
  }

  return (
    <div 
      className={`relative flex flex-col transition-all overflow-hidden justify-center ${isOutlined ? 'border-[4px]' : ''} ${isGridMember ? 'w-full h-full' : ''}`} 
      style={{ 
        padding: computedPadding,
        backgroundColor: bgColor, 
        opacity: isOutlined ? 1 : opacity, 
        borderColor: theme.colors.accent, 
        color: textColor, 
        textAlign: align === 'center' ? 'center' : 'left',
        fontFamily: safeFontFamily,
        borderRadius: computedRadius,
        minHeight: computedMinHeight,
        height: isGridMember ? '100%' : undefined,
        width: computedWidth,
        maxWidth: isHeroBox && groupLayout !== 'stack' ? '940px' : undefined,
        boxShadow: isHeroBox ? '0 34px 100px rgba(0,0,0,0.18)' : isDualBox ? '0 24px 64px rgba(0,0,0,0.14)' : '0 16px 42px rgba(0,0,0,0.12)',
      }}
    >
      <div className={`flex items-center gap-6 flex-1 ${align === 'center' ? 'flex-col justify-center' : (shouldReverseIcon ? 'flex-row-reverse' : 'flex-row')}`}>
        <div onClick={() => onEditIcon?.(block)} className="group relative cursor-pointer shrink-0">
          <div className="opacity-100 group-hover:opacity-70 transition-opacity">{renderIcon()}</div>
          <div className="absolute inset-[-15px] bg-brand/20 border-2 border-brand rounded-3xl opacity-0 group-hover:opacity-100 transition-all flex items-center justify-center scale-90 group-hover:scale-100">
             <Icons.Edit3 size={32} className="text-brand" />
          </div>
        </div>
        <div 
          ref={textRef}
          className={`${hasBgHighlight ? '!leading-[1.68]' : '!leading-[1.2]'} tracking-tight font-black min-w-0 w-full ${align === 'center' ? 'mt-4' : 'flex-1'}`}
          style={{
            fontSize: `${fitted.effectiveFontSize}px`,
            fontWeight: block.options?.fontWeight || 900,
            whiteSpace: 'pre-line',
            textWrap: undefined,
            lineHeight: resolvedLineHeight,
          }}
        >
          {renderRichText(text)}
        </div>
      </div>
    </div>
  );
}
