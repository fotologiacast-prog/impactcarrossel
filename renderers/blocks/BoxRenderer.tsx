
import React from 'react';
import { Block, Theme } from '../../types';
import * as Icons from 'lucide-react';
import { quoteFontFamily } from '../../utils/branding';
import { getEmojiSizeForContext, renderEmojiNodes, renderEmojiText } from '../../utils/emoji';
import { getIconMinSizeForContext, getIconScaleForContext } from '../../utils/icon-scale';
import { fitTextToConstraint } from '../../utils/text-fit';
import type { BlockRenderLayoutContext } from '../block-layout-context';

interface BoxRendererProps {
  block: Block;
  theme: Theme;
  isGridMember?: boolean;
  indexInGrid?: number;
  totalInGroup?: number;
  groupLayout?: 'auto' | 'row' | 'grid' | 'stack';
  onEditIcon?: (block: Block) => void;
  layoutContext?: BlockRenderLayoutContext;
  globalIndex?: number;
}

export function BoxRenderer({ block, theme, isGridMember, indexInGrid = 0, totalInGroup = 1, groupLayout = 'auto', onEditIcon, layoutContext, globalIndex }: BoxRendererProps) {
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
  const compactLayout = layoutContext?.compactLayout;
  const resolvedBoxFontSize = globalIndex !== undefined
    ? layoutContext?.resolvedBoxFontSizeByIndex?.[globalIndex]
    : undefined;
  const isCompactLayout = Boolean(compactLayout?.isCompact);
  const isCompactGrid = isCompactLayout && isGridMember && groupLayout === 'grid';
  const compactSourceLayoutId = compactLayout?.sourceLayoutId;
  const isSplitCompactGrid = isCompactGrid && compactSourceLayoutId?.startsWith('IMAGE_SPLIT_');
  const isSplitCompactStack = isCompactLayout && !isGridMember && groupLayout === 'stack' && compactSourceLayoutId?.startsWith('IMAGE_SPLIT_');
  const isSplitCompactCard = isSplitCompactStack;
  const widthCompactScale = compactLayout?.availableWidth
    ? Math.min(1, compactLayout.availableWidth / 860)
    : 1;
  const heightCompactScale = compactLayout?.availableHeight
    ? Math.min(1, compactLayout.availableHeight / 520)
    : 1;
  const compactScale = isCompactLayout
    ? Math.max(0.58, Math.min(widthCompactScale, heightCompactScale))
    : 1;
  const effectiveCompactScale = compactScale;
  const scaleCompact = (value: number, min: number) => (
    isCompactLayout ? Math.max(min, Math.round(value * effectiveCompactScale)) : value
  );
  const rebalanceCompactGridLabel = React.useCallback((value: string) => {
    const words = value.trim().split(/\s+/).filter(Boolean);
    if (!isCompactGrid || words.length < 2 || value.includes('\n')) return value;

    const midpoint = Math.ceil(words.length / 2);
    const firstLine = words.slice(0, midpoint).join(' ');
    const secondLine = words.slice(midpoint).join(' ');

    if (!firstLine || !secondLine) return value;
    return `${firstLine}\n${secondLine}`;
  }, [isCompactGrid]);
  const rebalanceSplitCompactCardLabel = React.useCallback((value: string) => {
    const words = value.trim().split(/\s+/).filter(Boolean);
    if (!isSplitCompactCard || words.length < 2 || value.includes('\n')) return value;

    if (words.length === 2) {
      return `${words[0]}\n${words[1]}`;
    }

    if (words.length === 3) {
      const optionA = `${words[0]} ${words[1]}\n${words[2]}`;
      const optionB = `${words[0]}\n${words[1]} ${words[2]}`;
      return optionA.length <= optionB.length ? optionA : optionB;
    }

    const midpoint = Math.ceil(words.length / 2);
    const firstLine = words.slice(0, midpoint).join(' ');
    const secondLine = words.slice(midpoint).join(' ');
    if (!firstLine || !secondLine) return value;
    return `${firstLine}\n${secondLine}`;
  }, [isSplitCompactCard]);

  const selectedFont = block.options?.fontFamily
    || (fontVariant === 'destaque'
      ? (theme.typography.fontFamilySecondary || '"Instrument Serif", serif')
      : theme.typography.fontFamily);
  const emojiSize = getEmojiSizeForContext('box');
  const isSemanticHighlight = block.options?.semanticRole === 'highlight';
  const inlineHighlightBackgroundColor = block.options?.highlightBackgroundColor
    || (isSemanticHighlight ? block.options?.backgroundColor : undefined)
    || theme.colors.hlBgColor
    || '#fff';

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
              newParts.push(<span key={`bg-hl-${i}`} className="inline px-4 py-1 rounded-xl mx-1 font-black" style={{ backgroundColor: inlineHighlightBackgroundColor, color: theme.colors.hlTextColor || '#000', WebkitBoxDecorationBreak: 'clone', boxDecorationBreak: 'clone' as any, fontFamily: safeFontFamily }}>{renderEmojiText(s, `bg-hl-${i}`, emojiSize)}</span>);
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
          if (i % 2 === 1) { finalParts.push(<span key={`bold-${i}`} className="font-black" style={{ fontWeight: 900 }}>{renderEmojiText(s, `bold-${i}`, emojiSize)}</span>); }
          else if (s !== "") { finalParts.push(s); }
        });
      } else { finalParts.push(part); }
    });
    return renderEmojiNodes(finalParts, 'box', emojiSize);
  };

  const isOutlined = variant === 'outlined';
  const isPill = variant === 'pill';
  const shouldReverseIcon = !isGridMember && !isCompactLayout && indexInGrid % 2 === 1;
  const opacity = theme.colors.cardOpacity !== undefined ? theme.colors.cardOpacity : 1;
  const isHeroBox = totalInGroup === 1;
  const isDualBox = totalInGroup === 2;
  const isMicroCard = isCompactGrid;
  const basePaddingValue = customPadding !== undefined
    ? customPadding
    : isHeroBox
      ? 72
      : isDualBox
        ? 58
        : 48;
  const baseRadiusValue = isHeroBox ? 76 : isDualBox ? 64 : 54;
  const baseFontSizeValue = block.options?.fontSize
    ? block.options.fontSize
    : isHeroBox
      ? 58
      : isDualBox
      ? 44
      : 36;
  const baseMinHeightValue = isHeroBox ? 384 : isDualBox ? 300 : 244;
  const splitMicroCardFontSize = Math.max(14, Math.min(22, Math.round(baseFontSizeValue * compactScale * 0.9)));
  const stageMicroCardFontSize = Math.max(13, Math.min(18, Math.round(baseFontSizeValue * compactScale * 0.76)));
  const microCardPadding = isSplitCompactGrid
    ? `${scaleCompact(22, 18)}px ${scaleCompact(18, 16)}px ${scaleCompact(20, 18)}px`
    : `${scaleCompact(18, 14)}px ${scaleCompact(15, 12)}px ${scaleCompact(16, 14)}px`;
  const microCardRadius = isSplitCompactGrid ? scaleCompact(36, 30) : scaleCompact(34, 28);
  const microCardFontSize = isSplitCompactGrid ? splitMicroCardFontSize : stageMicroCardFontSize;
  const microCardMinHeight = isSplitCompactGrid ? scaleCompact(156, 144) : scaleCompact(138, 128);
  const computedPadding = isMicroCard
    ? microCardPadding
    : isSplitCompactCard
    ? `${scaleCompact(22, 20)}px ${scaleCompact(16, 14)}px`
    : `${scaleCompact(basePaddingValue, 34)}px`;
  const computedRadius = `${isMicroCard ? microCardRadius : scaleCompact(baseRadiusValue, 40)}px`;
  const computedFontSize = isMicroCard
    ? microCardFontSize
    : isCompactLayout
    ? isSplitCompactStack
      ? baseFontSizeValue
      : scaleCompact(baseFontSizeValue, isHeroBox ? 42 : isDualBox ? 24 : 18)
    : baseFontSizeValue;
  const computedMinHeight = `${isMicroCard ? microCardMinHeight : isSplitCompactCard ? scaleCompact(196, 172) : scaleCompact(baseMinHeightValue, isHeroBox ? 240 : 180)}px`;
  const computedWidth = isGridMember ? '100%' : isHeroBox ? 'min(100%, 940px)' : '100%';
  const resolvedFontSize = typeof computedFontSize === 'number' ? computedFontSize : parseInt(computedFontSize, 10);
  const resolvedLineHeight = block.options?.lineHeight ?? (hasBgHighlight ? 1.62 : 1.28);
  const fallbackWidthConstraint = (() => {
    if (availableBox.width) return availableBox.width;
    if (isCompactLayout && compactLayout?.availableWidth) {
      if (groupLayout === 'grid') {
        return Math.max(140, Math.round((compactLayout.availableWidth - 24) / 2));
      }
      if (groupLayout === 'row') {
        return Math.max(160, Math.round((compactLayout.availableWidth - 24) / 2));
      }
      return Math.max(180, compactLayout.availableWidth);
    }
    return isHeroBox ? 760 : isDualBox ? 420 : 360;
  })();
  const fallbackHeightConstraint = (() => {
    if (availableBox.height) return availableBox.height;
    if (isCompactLayout && compactLayout?.availableHeight) {
      if (groupLayout === 'grid') {
        const rows = Math.max(1, Math.ceil(totalInGroup / 2));
        return Math.max(120, Math.round((compactLayout.availableHeight - (rows - 1) * 24) / rows));
      }
      if (groupLayout === 'row') {
        return Math.max(160, compactLayout.availableHeight);
      }
      return Math.max(140, compactLayout.availableHeight);
    }
    return resolvedFontSize * resolvedLineHeight * (isHeroBox ? 4 : 5);
  })();
  const effectiveFitWidth = (() => {
    const rawWidth = availableBox.width || fallbackWidthConstraint;
    if (isCompactGrid) {
      return Math.max(112, rawWidth - 18);
    }
    return rawWidth;
  })();
  const effectiveFitHeight = (() => {
    const rawHeight = availableBox.height || fallbackHeightConstraint;
    if (isCompactGrid) {
      return Math.max(88, rawHeight - 20);
    }
    return rawHeight;
  })();
  const balancedCompactCardText = React.useMemo(() => {
    if (block.options?.lineBreakMode === 'manual') return rawText;
    return isSplitCompactCard ? rebalanceSplitCompactCardLabel(rawText) : rawText;
  }, [block.options?.lineBreakMode, isSplitCompactCard, rawText, rebalanceSplitCompactCardLabel]);
  const fitted = React.useMemo(() => fitTextToConstraint(balancedCompactCardText, {
    availableWidth: effectiveFitWidth,
    availableHeight: effectiveFitHeight,
    fontSize: resolvedFontSize,
    fontFamily: selectedFont,
    fontWeight: block.options?.fontWeight || 900,
    lineHeight: resolvedLineHeight,
    letterSpacing: block.options?.letterSpacing,
    maxLines: isCompactGrid ? 4 : isHeroBox ? 4 : isDualBox ? 4 : 5,
    minFontSize: isCompactLayout
      ? Math.max(
          isCompactGrid ? 14 : isHeroBox ? 28 : isDualBox ? 22 : 18,
          Math.round(resolvedFontSize * (isCompactGrid ? 0.42 : isHeroBox ? 0.7 : isDualBox ? 0.64 : 0.56)),
        )
      : Math.max(24, Math.round(resolvedFontSize * 0.84)),
    overflow: 'shrink',
    role: isSplitCompactCard ? 'paragraph' : 'box',
    mode: isSplitCompactCard && block.options?.lineBreakMode !== 'manual' ? 'manual' : block.options?.lineBreakMode,
    manualBreaks: isSplitCompactCard && block.options?.lineBreakMode !== 'manual' ? balancedCompactCardText : block.options?.manualBreaks,
  }), [
    availableBox.height,
    availableBox.width,
    balancedCompactCardText,
    block.options?.fontWeight,
    block.options?.letterSpacing,
    block.options?.lineBreakMode,
    block.options?.manualBreaks,
    effectiveFitHeight,
    effectiveFitWidth,
    isDualBox,
    isCompactGrid,
    isHeroBox,
    isCompactLayout,
    resolvedFontSize,
    resolvedLineHeight,
    selectedFont,
  ]);
  const text = React.useMemo(() => {
    if (!isCompactGrid) return fitted.formatted;
    const formatted = fitted.formatted;
    if (formatted.includes('\n')) return formatted;
    if (formatted.trim().length <= 12) return formatted;
    return rebalanceCompactGridLabel(formatted);
  }, [fitted.formatted, isCompactGrid, rebalanceCompactGridLabel]);

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
  
  const explicitBackgroundColor = isSemanticHighlight ? undefined : block.options?.backgroundColor;
  const bgColor = isOutlined
    ? 'transparent'
    : explicitBackgroundColor || (block.options?.color ? `${block.options.color}20` : (theme.colors.cardBg || theme.colors.accent));
  const textColor = block.options?.color || theme.colors.cardTextColor || (isOutlined ? theme.colors.textPrimary : '#000000');

  const renderIcon = () => {
    const contextScale = getIconScaleForContext('box');
    const contextMin = getIconMinSizeForContext('box');
    const baseIconSize = isHeroBox ? 152 : isGridMember ? 108 : (isPill ? 60 : contextMin);
    const scaledIconSize = Math.round(
      resolvedFontSize * (isHeroBox ? contextScale + 0.22 : isDualBox ? contextScale + 0.08 : contextScale),
    );
    const renderSize = isMicroCard
      ? (isSplitCompactGrid ? Math.max(32, Math.round(microCardFontSize * 1.85)) : Math.max(28, Math.round(microCardFontSize * 2.0)))
      : isCompactLayout
      ? scaleCompact(
          Math.max(isHeroBox ? 104 : isDualBox ? 68 : (isCompactGrid ? 46 : 56), Math.round(scaledIconSize * (isCompactGrid ? 0.6 : 0.74))),
          isHeroBox ? 84 : (isCompactGrid ? 34 : 42),
        )
      : scaleCompact(Math.max(baseIconSize, scaledIconSize), isHeroBox ? 96 : 52);
    
    if (customIcon) {
       if (customIcon.startsWith('<svg')) return (<div style={{ width: renderSize, height: renderSize }} className="flex items-center justify-center" dangerouslySetInnerHTML={{ __html: customIcon }} />);
       if (customIcon.startsWith('http') || customIcon.startsWith('data:image')) return <img src={customIcon} style={{ width: renderSize, height: renderSize }} className="object-contain rounded-xl" alt="icon" />;
       const IconFromCustom = (Icons as any)[customIcon];
       if (IconFromCustom) return <IconFromCustom size={renderSize} strokeWidth={2.45} />;
    }
    if (iconName) {
      const IconComponent = (Icons as any)[iconName];
      if (IconComponent) return <IconComponent size={renderSize} strokeWidth={2.45} />;
    }
    return null;
  };

  if (isPill) {
     return (
        <div className="relative w-full p-12 rounded-[100px] flex items-center transition-all overflow-hidden border border-white/5 shadow-2xl" style={{ backgroundColor: explicitBackgroundColor || block.options?.color || '#FFFFFF', color: '#000000', textAlign: 'left', fontFamily: safeFontFamily }}>
           <div className="flex-1">
              <h4 className="text-[38px] font-black leading-tight tracking-tight mb-2">{renderRichText(text)}</h4>
              <p className="text-[24px] opacity-60 font-medium">Informação adicional aqui...</p>
           </div>
           <div className="w-16 h-16 rounded-full border-2 border-black/10 flex items-center justify-center shrink-0">
              <Icons.ArrowUpRight size={40} strokeWidth={2.5} />
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
        boxShadow: isHeroBox ? '0 42px 120px rgba(0,0,0,0.22)' : isDualBox ? '0 28px 72px rgba(0,0,0,0.16)' : '0 20px 52px rgba(0,0,0,0.14)',
      }}
      data-box-compact={isCompactLayout ? 'true' : 'false'}
      data-box-micro-card={isMicroCard ? 'true' : 'false'}
    >
      <div className={`flex items-center ${
        isMicroCard
          ? (isSplitCompactGrid ? 'gap-4' : 'gap-2.5')
          : isSplitCompactCard
            ? 'gap-5'
            : isCompactLayout
              ? 'gap-4'
              : 'gap-8'
      } flex-1 ${
        isMicroCard
          ? 'flex-col justify-between'
          : isSplitCompactCard
            ? 'flex-col justify-center'
            : align === 'center'
              ? 'flex-col justify-center'
              : (shouldReverseIcon ? 'flex-row-reverse' : 'flex-row')
      }`}>
        <div onClick={() => onEditIcon?.(block)} className={`group relative cursor-pointer shrink-0 ${isSplitCompactGrid ? 'mt-1' : isSplitCompactCard ? 'mt-2' : ''}`}>
          <div className="opacity-100 group-hover:opacity-70 transition-opacity">{renderIcon()}</div>
          <div className="absolute inset-[-15px] bg-brand/20 border-2 border-brand rounded-3xl opacity-0 group-hover:opacity-100 transition-all flex items-center justify-center scale-90 group-hover:scale-100">
             <Icons.Edit3 size={32} className="text-brand" />
          </div>
        </div>
        <div 
          ref={textRef}
          className={`${hasBgHighlight ? '!leading-[1.68]' : '!leading-[1.2]'} tracking-tight font-black min-w-0 w-full ${
            isMicroCard
              ? 'mt-0 flex-1 flex items-end justify-center text-center'
              : isSplitCompactCard
                ? 'mt-0 text-center'
                : align === 'center'
                  ? 'mt-4'
                  : 'flex-1'
          }`}
          style={{
            fontSize: `${resolvedBoxFontSize ?? fitted.effectiveFontSize}px`,
            fontWeight: isMicroCard ? Math.min(block.options?.fontWeight || 900, 800) : (block.options?.fontWeight || 900),
            whiteSpace: 'pre-line',
            overflowWrap: isCompactGrid ? 'anywhere' : undefined,
            wordBreak: isCompactGrid ? 'break-word' : undefined,
            textWrap: (isMicroCard || isSplitCompactCard) ? ('balance' as any) : undefined,
            lineHeight: isMicroCard ? (isSplitCompactGrid ? 1.12 : 1.08) : isSplitCompactCard ? 1.08 : resolvedLineHeight,
            textAlign: (isMicroCard || isSplitCompactCard) ? 'center' : undefined,
            minHeight: isMicroCard ? `${isSplitCompactGrid ? scaleCompact(54, 48) : scaleCompact(48, 42)}px` : undefined,
          }}
        >
          {renderRichText(text)}
        </div>
      </div>
    </div>
  );
}
