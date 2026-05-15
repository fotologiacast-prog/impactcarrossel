
import React from 'react';
import emojiRegex from 'emoji-regex/RGI_Emoji';
import * as Icons from 'lucide-react';
import { Block, Theme } from '../../types';
import { quoteFontFamily } from '../../utils/branding';
import { getEmojiSizeForContext, renderEmojiNodes, renderEmojiText } from '../../utils/emoji';
import type { BlockRenderLayoutContext } from '../block-layout-context';

interface ListRendererProps {
  block: Block;
  theme: Theme;
  onEditIcon?: (block: Block, itemIndex: number) => void;
  layoutContext?: BlockRenderLayoutContext;
}

const leadingEmojiPattern = emojiRegex();

const hasLeadingEmoji = (value: string) => {
  leadingEmojiPattern.lastIndex = 0;
  const match = leadingEmojiPattern.exec(value.trim());
  return Boolean(match && match.index === 0);
};

const splitLeadingEmoji = (value: string) => {
  leadingEmojiPattern.lastIndex = 0;
  const trimmed = value.trim();
  const match = leadingEmojiPattern.exec(trimmed);
  if (!match || match.index !== 0) return null;

  const icon = match[0];
  const label = trimmed.slice(icon.length).trim();
  if (!label) return null;

  return { icon, label };
};

const isCompactChecklistLabel = (value: string) => {
  const trimmed = value.trim();
  if (!trimmed) return false;
  const wordCount = trimmed.split(/\s+/).length;
  return wordCount <= 4 && trimmed.length <= 28;
};

const isCompactDefaultLabel = (value: string) => {
  const trimmed = value.trim();
  if (!trimmed) return false;
  const wordCount = trimmed.split(/\s+/).length;
  return wordCount <= 3 && trimmed.length <= 24;
};

const parseEditorialChecklistItem = (value: string) => {
  const match = value.match(/^\s*\*\*([^*]+?)\*\*\s*[:\-–—]?\s*([\s\S]+?)\s*$/);
  if (!match) return null;

  const title = match[1]?.trim().replace(/[:\-–—]+$/g, '').trim();
  const description = match[2]?.trim();
  if (!title || !description || description.length < 6) return null;

  return { title, description };
};

const hexToRgba = (color: string, alpha: number) => {
  if (!color.startsWith('#')) return `rgba(255,255,255,${alpha})`;
  const raw = color.slice(1);
  const normalized = raw.length === 3
    ? raw.split('').map((char) => `${char}${char}`).join('')
    : raw;
  const r = Number.parseInt(normalized.slice(0, 2), 16);
  const g = Number.parseInt(normalized.slice(2, 4), 16);
  const b = Number.parseInt(normalized.slice(4, 6), 16);
  if ([r, g, b].some((channel) => Number.isNaN(channel))) {
    return `rgba(255,255,255,${alpha})`;
  }
  return `rgba(${r}, ${g}, ${b}, ${alpha})`;
};

export function ListRenderer({ block, theme, onEditIcon, layoutContext }: ListRendererProps) {
  const items = Array.isArray(block.content) ? block.content : [block.content];
  const variant = block.options?.variant || 'default';
  const isBox = variant === 'box';
  const isChecklist = variant === 'check-list';
  const isNumbered = variant === 'numbered';
  const compactLayout = layoutContext?.compactLayout;
  const isCompactLayout = Boolean(compactLayout?.isCompact);
  const widthCompactScale = compactLayout?.availableWidth
    ? Math.min(1, compactLayout.availableWidth / 760)
    : 1;
  const heightCompactScale = compactLayout?.availableHeight
    ? Math.min(1, compactLayout.availableHeight / 500)
    : 1;
  const compactScale = isCompactLayout
    ? Math.max(0.78, Math.min(widthCompactScale, heightCompactScale))
    : 1;
  const scaleCompact = (value: number, min: number) => (
    isCompactLayout ? Math.max(min, Math.round(value * compactScale)) : value
  );
  const fontVariant = block.options?.fontVariant || 'padrão';
  const resolvedFontSize = block.options?.fontSize || (isBox ? 34 : 28);
  const resolvedLineHeight = block.options?.lineHeight ?? (isBox ? 1.3 : 1.35);
  const markerSize = Math.max(10, Math.round(resolvedFontSize * 0.2));
  const markerOffset = Math.max(
    4,
    Math.round((resolvedFontSize * resolvedLineHeight - markerSize) / 2),
  );
  const emojiSize = isBox ? '1.3em' : getEmojiSizeForContext('list');
  const accentTextColor = theme.colors.cardTextColor || theme.colors.hlTextColor || '#000';
  const itemIcons = block.options?.itemIcons || [];
  const itemCustomIcons = block.options?.itemCustomIcons || [];
  const checklistLabels = isChecklist
    ? items.map((entry) => {
        const value = String(entry || '');
        const leading = hasLeadingEmoji(value) ? splitLeadingEmoji(value) : null;
        return leading?.label || value;
      })
    : [];
  const uniformChecklistBoost = isChecklist && checklistLabels.length > 0 && checklistLabels.every(isCompactChecklistLabel);
  const baseChecklistTextSize = uniformChecklistBoost
    ? Math.max(36, Math.round(resolvedFontSize * 1.5))
    : Math.max(32, Math.round(resolvedFontSize * 1.2));
  const checklistTextSize = scaleCompact(baseChecklistTextSize, 30);
  const checklistLineHeight = isCompactLayout
    ? (uniformChecklistBoost ? 1.08 : 1.14)
    : (uniformChecklistBoost ? 1.12 : 1.18);
  const baseChecklistMarkerSize = uniformChecklistBoost
    ? Math.max(60, Math.round(baseChecklistTextSize * 1.7))
    : Math.max(48, Math.round(baseChecklistTextSize * 1.55));
  const checklistMarkerSize = scaleCompact(baseChecklistMarkerSize, 48);
  const baseChecklistMarkerFontSize = uniformChecklistBoost
    ? Math.max(24, Math.round(baseChecklistTextSize * 0.9))
    : Math.max(22, Math.round(baseChecklistTextSize * 0.88));
  const checklistMarkerFontSize = `${scaleCompact(baseChecklistMarkerFontSize, 22)}px`;
  const baseChecklistMarkerIconSize = uniformChecklistBoost
    ? Math.max(48, Math.round(baseChecklistTextSize * 1.12))
    : Math.max(46, Math.round(baseChecklistTextSize * 1.04));
  const checklistMarkerIconSize = scaleCompact(baseChecklistMarkerIconSize, 40);
  const baseChecklistRowMinHeight = uniformChecklistBoost
    ? Math.max(92, Math.round(baseChecklistTextSize * 2.15))
    : Math.max(78, Math.round(baseChecklistTextSize * 1.95));
  const checklistRowMinHeight = scaleCompact(baseChecklistRowMinHeight, 76);
  const baseChecklistMarkerSlotSize = uniformChecklistBoost
    ? Math.max(44, Math.round(baseChecklistTextSize * 1.12))
    : Math.max(36, Math.round(baseChecklistTextSize * 0.96));
  const checklistMarkerSlotSize = scaleCompact(baseChecklistMarkerSlotSize, 34);
  const checklistInlinePadding = isCompactLayout ? scaleCompact(26, 20) : 34;
  const checklistBlockPadding = isCompactLayout ? scaleCompact(12, 10) : 14;
  const checklistSideRailSize = isCompactLayout
    ? scaleCompact(50, 42)
    : Math.max(checklistMarkerSize, 74);
  const checklistColumnGap = isCompactLayout ? scaleCompact(10, 8) : 14;
  const surfaceColor = block.options?.backgroundColor || theme.colors.accent;
  const surfaceGradient = `linear-gradient(180deg, ${block.options?.backgroundColor || theme.colors.highlight} 0%, ${surfaceColor} 100%)`;
  const surfaceTextColor = block.options?.color || accentTextColor;
  const inlineHighlightBackgroundColor = block.options?.highlightBackgroundColor
    || (block.options?.semanticRole === 'highlight' ? block.options?.backgroundColor : undefined)
    || theme.colors.hlBgColor
    || theme.colors.accent;
  const surfaceGlow = hexToRgba(surfaceColor, 0.22);
  const surfaceBorder = hexToRgba(surfaceColor, 0.44);
  const surfaceHighlight = hexToRgba(surfaceTextColor, 0.16);

  const selectedFont = block.options?.fontFamily
    || (fontVariant === 'destaque'
      ? (theme.typography.fontFamilySecondary || '"Instrument Serif", serif')
      : theme.typography.fontFamily);

  // Ensure font family is quoted
  const safeFontFamily = quoteFontFamily(selectedFont, theme.typography.fontFamily);

  const commonStyle: React.CSSProperties = {
    fontSize: `${resolvedFontSize}px`,
    letterSpacing: block.options?.letterSpacing !== undefined ? `${block.options.letterSpacing}px` : undefined,
    lineHeight: resolvedLineHeight,
    textAlign: block.options?.textAlign || (block.options?.align as any) || ((isChecklist || isBox) ? 'center' : 'left'),
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
          const split = part.split(/\[\[([\s\S]*?)\]\]/g);
          split.forEach((s, i) => {
            if (i % 2 === 1) {
              newParts.push(
                <span 
                  key={`bg-hl-${i}`} 
                  className="inline-block px-2 py-0.5 rounded-md mx-1 align-baseline font-black"
                  style={{ 
                    backgroundColor: inlineHighlightBackgroundColor,
                    color: theme.colors.hlTextColor || '#000',
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
                  {renderEmojiText(s, `hl-${i}`, emojiSize)}
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
        const split = part.split(/\*\*([\s\S]*?)\*\*/g);
        split.forEach((s, i) => {
          if (i % 2 === 1) {
            finalParts.push(
                <span
                key={`bold-${i}`} 
                className="font-black" 
                style={{ fontWeight: 900, color: block.options?.color || theme.colors.textPrimary }}
              >
                  {renderEmojiText(s, `bold-${i}`, emojiSize)}
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

    return renderEmojiNodes(finalParts, 'list', emojiSize);
  };

  const renderLucideMarker = (
    iconName?: string,
    size = 18,
    color = accentTextColor,
    strokeWidth = 2.4,
  ) => {
    if (!iconName) return null;
    const IconComponent = (Icons as any)[iconName];
    if (!IconComponent) return null;
    return <IconComponent size={size} strokeWidth={strokeWidth} color={color} />;
  };

  const renderCustomMarker = (customIcon: string | undefined, size: number, color: string) => {
    if (!customIcon) return null;
    if (customIcon.startsWith('<svg')) {
      return <div style={{ width: size, height: size, color }} dangerouslySetInnerHTML={{ __html: customIcon }} />;
    }
    if (customIcon.startsWith('http') || customIcon.startsWith('data:image')) {
      return <img src={customIcon} alt="icon" className="object-contain rounded-md" style={{ width: size, height: size }} />;
    }
    return renderLucideMarker(customIcon, size, color);
  };

  const renderItemMarker = (
    index: number,
    size: number,
    color: string,
    fallbackIconName?: string,
    strokeWidth = 2.4,
  ) => {
    const customIcon = itemCustomIcons[index];
    const iconName = itemIcons[index];
    return renderCustomMarker(customIcon, size, color)
      || renderLucideMarker(iconName, size, color, strokeWidth)
      || renderLucideMarker(fallbackIconName, size, color, strokeWidth);
  };

  const editorialChecklistItems = (isChecklist || isBox)
    ? items.map((item) => parseEditorialChecklistItem(String(item || '')))
    : [];
  const shouldRenderEditorialChecklist = (
    (isChecklist || isBox)
    && editorialChecklistItems.length >= 2
    && editorialChecklistItems.every(Boolean)
  );

  if (shouldRenderEditorialChecklist) {
    const titleSize = scaleCompact(Math.max(30, Math.round(resolvedFontSize * 1.2)), 25);
    const descriptionSize = scaleCompact(Math.max(23, Math.round(resolvedFontSize * 0.92)), 20);
    const iconBubbleSize = scaleCompact(96, 76);
    const iconSize = scaleCompact(54, 42);

    return (
      <div
        className="flex flex-col w-full"
        style={{
          gap: `${scaleCompact(22, 16)}px`,
          textAlign: commonStyle.textAlign,
        }}
        data-block-type="LIST"
        data-list-compact={isCompactLayout ? 'true' : 'false'}
        data-checklist-editorial="true"
      >
        {editorialChecklistItems.map((entry, index) => {
          if (!entry) return null;

          return (
            <div
              key={`editorial-checklist-${index}`}
              className="relative w-full mx-auto grid items-center overflow-hidden"
              data-checklist-editorial-item="true"
              style={{
                maxWidth: isCompactLayout ? '100%' : '860px',
                gridTemplateColumns: `${scaleCompact(128, 96)}px 1px minmax(0, 1fr)`,
                columnGap: `${scaleCompact(28, 18)}px`,
                padding: `${scaleCompact(30, 22)}px ${scaleCompact(34, 24)}px`,
                borderRadius: '30px',
                background: block.options?.backgroundColor
                  ? `linear-gradient(180deg, ${hexToRgba(block.options.backgroundColor, 0.18)} 0%, ${hexToRgba(block.options.backgroundColor, 0.08)} 100%)`
                  : `linear-gradient(180deg, ${hexToRgba(theme.colors.accent, 0.14)} 0%, ${hexToRgba(theme.colors.accent, 0.08)} 100%)`,
                border: `1px solid ${hexToRgba(surfaceColor, 0.18)}`,
                boxShadow: `0 20px 44px ${hexToRgba(surfaceColor, 0.12)}`,
              }}
            >
              <div
                data-edit-icon-target={onEditIcon ? 'list-item' : undefined}
                data-edit-icon-index={onEditIcon ? String(index) : undefined}
                onClick={onEditIcon ? () => onEditIcon(block, index) : undefined}
                className="flex items-center justify-center rounded-full"
                style={{
                  width: `${iconBubbleSize}px`,
                  height: `${iconBubbleSize}px`,
                  justifySelf: 'center',
                  backgroundColor: surfaceColor,
                  color: surfaceTextColor,
                  cursor: onEditIcon ? 'pointer' : undefined,
                  boxShadow: `0 18px 36px ${hexToRgba(surfaceColor, 0.26)}`,
                }}
              >
                {renderItemMarker(index, iconSize, surfaceTextColor, 'Check', 2.65)}
              </div>

              <div
                aria-hidden="true"
                style={{
                  width: '1px',
                  height: '74%',
                  backgroundColor: hexToRgba(surfaceColor, 0.22),
                }}
              />

              <div className="min-w-0" style={{ textAlign: 'left' }}>
                <div
                  data-checklist-editorial-title="true"
                  className="font-black tracking-tight"
                  style={{
                    color: surfaceColor,
                    fontFamily: safeFontFamily,
                    fontSize: `${titleSize}px`,
                    lineHeight: 1.08,
                    fontWeight: 900,
                    textWrap: 'balance' as React.CSSProperties['textWrap'],
                  }}
                >
                  {index + 1}. {renderEmojiText(entry.title, `editorial-checklist-title-${index}`, emojiSize)}
                </div>
                <div
                  data-checklist-editorial-description="true"
                  style={{
                    color: block.options?.color || theme.colors.textPrimary,
                    fontFamily: safeFontFamily,
                    fontSize: `${descriptionSize}px`,
                    lineHeight: 1.18,
                    fontWeight: 500,
                    marginTop: `${scaleCompact(8, 5)}px`,
                    textWrap: 'pretty' as React.CSSProperties['textWrap'],
                  }}
                >
                  {renderRichText(entry.description, block.options?.highlight)}
                </div>
              </div>
            </div>
          );
        })}
      </div>
    );
  }
  
  return (
    <div 
      className={`flex flex-col ${isBox ? 'gap-4 w-full items-center' : 'gap-4 mt-2 w-full'}`}
      style={{ textAlign: commonStyle.textAlign }}
      data-block-type="LIST"
      data-list-compact={isCompactLayout ? 'true' : 'false'}
    >
      {items.map((item, index) => {
        const text = item as string;
        const highlight = block.options?.highlight;
        const startsWithEmoji = hasLeadingEmoji(text);
        const leadingEmoji = startsWithEmoji ? splitLeadingEmoji(text) : null;
        const content = renderRichText(leadingEmoji?.label || text, highlight);

        if (isBox) {
          return (
            <div 
              key={index} 
              className="relative w-full overflow-hidden rounded-[24px]" 
              style={{ 
                maxWidth: isCompactLayout ? '100%' : '760px',
                minHeight: `${scaleCompact(Math.max(88, Math.round(resolvedFontSize * 2.35)), 74)}px`,
                background: surfaceGradient,
                boxShadow: `0 20px 42px ${hexToRgba(surfaceColor, 0.2)}`,
                border: `1px solid ${surfaceBorder}`,
              }}
            >
              <div
                className="absolute inset-x-0 top-0 pointer-events-none"
                style={{
                  height: '46%',
                  background: `linear-gradient(180deg, ${surfaceHighlight} 0%, transparent 100%)`,
                }}
              />
              <div
                className={`relative z-10 flex items-center justify-center ${isCompactLayout ? 'gap-4 px-8 py-4' : 'gap-6 px-10 py-5'}`}
                style={{
                  minHeight: `${scaleCompact(Math.max(88, Math.round(resolvedFontSize * 2.35)), 74)}px`,
                }}
              >
              <div
                data-edit-icon-target={onEditIcon ? 'list-item' : undefined}
                data-edit-icon-index={onEditIcon ? String(index) : undefined}
                onClick={onEditIcon ? () => onEditIcon(block, index) : undefined}
                className="relative shrink-0 flex items-center justify-center"
                style={{
                    width: `${scaleCompact(Math.max(58, Math.round(resolvedFontSize * 1.68)), 46)}px`,
                    height: `${scaleCompact(Math.max(58, Math.round(resolvedFontSize * 1.68)), 46)}px`,
                    color: surfaceTextColor,
                    cursor: onEditIcon ? 'pointer' : undefined,
                    filter: `drop-shadow(0 0 18px ${surfaceGlow})`,
                  }}
                >
                  {renderItemMarker(index, scaleCompact(Math.max(40, Math.round(resolvedFontSize * 1.36)), 34), surfaceTextColor, 'Check', 2.8)}
                </div>
                <p
                  className={theme.typography.body}
                  style={{
                    ...commonStyle,
                    color: surfaceTextColor,
                    fontSize: `${scaleCompact(Math.max(32, resolvedFontSize + 4), 30)}px`,
                    lineHeight: 1.1,
                    fontWeight: 900,
                    textAlign: 'center',
                  }}
                >
                  {content}
                </p>
              </div>
            </div>
          );
        }

        if (isNumbered) {
          return (
            <div
              key={index}
              className="flex items-start gap-4 rounded-[24px] px-5 py-4"
              style={{
                backgroundColor: `${theme.colors.textPrimary}08`,
                border: `1px solid ${theme.colors.textPrimary}12`,
              }}
            >
              <div
                className="shrink-0 flex items-center justify-center rounded-[18px] leading-none"
                style={{
                  width: `${Math.max(50, Math.round(resolvedFontSize * 1.9))}px`,
                  minWidth: `${Math.max(50, Math.round(resolvedFontSize * 1.9))}px`,
                  height: `${Math.max(50, Math.round(resolvedFontSize * 1.9))}px`,
                  backgroundColor: theme.colors.accent,
                  color: accentTextColor,
                  fontSize: `${Math.max(18, Math.round(resolvedFontSize * 0.62))}px`,
                  fontWeight: 900,
                  letterSpacing: '0.06em',
                  fontVariantNumeric: 'tabular-nums',
                }}
              >
                {String(index + 1).padStart(2, '0')}
              </div>
              <p
                className={theme.typography.body}
                style={{
                  ...commonStyle,
                  color: commonStyle.color || theme.colors.textSecondary,
                  flex: 1,
                }}
              >
                {content}
              </p>
            </div>
          );
        }

        if (isChecklist) {
          const isRightAlignedChecklist = commonStyle.textAlign === 'right';
          return (
            <div
              key={index}
              className="relative w-full mx-auto grid items-center rounded-[24px] overflow-hidden"
              data-checklist-row-layout="balanced"
              style={{
                maxWidth: isCompactLayout ? '100%' : '760px',
                gridTemplateColumns: `${checklistSideRailSize}px minmax(0, 1fr) ${checklistSideRailSize}px`,
                columnGap: `${checklistColumnGap}px`,
                padding: `${checklistBlockPadding}px ${checklistInlinePadding}px`,
                background: surfaceGradient,
                color: surfaceTextColor,
                minHeight: `${checklistRowMinHeight}px`,
                boxShadow: `0 20px 42px ${hexToRgba(surfaceColor, 0.22)}`,
                border: `1px solid ${surfaceBorder}`,
              }}
            >
              <div
                className="absolute inset-x-0 top-0 pointer-events-none"
                style={{
                  height: '46%',
                  background: `linear-gradient(180deg, ${surfaceHighlight} 0%, transparent 100%)`,
                }}
              />
              <div
                data-edit-icon-target={onEditIcon ? 'list-item' : undefined}
                data-edit-icon-index={onEditIcon ? String(index) : undefined}
                onClick={onEditIcon ? () => onEditIcon(block, index) : undefined}
                className="relative z-10 shrink-0 flex items-center justify-center"
                style={{
                  gridColumn: isRightAlignedChecklist ? 3 : 1,
                  justifySelf: isRightAlignedChecklist ? 'end' : 'start',
                  width: `${checklistSideRailSize}px`,
                  height: `${checklistMarkerSlotSize}px`,
                  marginTop: '0px',
                  color: surfaceTextColor,
                  fontSize: checklistMarkerFontSize,
                  fontWeight: 900,
                  lineHeight: 1,
                  overflow: 'visible',
                  cursor: onEditIcon ? 'pointer' : undefined,
                  filter: `drop-shadow(0 0 16px ${surfaceGlow})`,
                }}
              >
                {renderItemMarker(index, checklistMarkerIconSize, surfaceTextColor, 'Check', 2.8)}
              </div>
              <p
                className={theme.typography.body}
                style={{
                  ...commonStyle,
                  gridColumn: 2,
                  minWidth: 0,
                  fontSize: `${checklistTextSize}px`,
                  lineHeight: checklistLineHeight,
                  color: commonStyle.color || surfaceTextColor,
                  fontWeight: Math.max(Number(commonStyle.fontWeight || 700), uniformChecklistBoost ? 800 : 700),
                  textAlign: 'center',
                  textWrap: 'balance' as React.CSSProperties['textWrap'],
                  overflowWrap: 'break-word',
                }}
              >
                {content}
              </p>
            </div>
          );
        }

        return (
          (() => {
            const compactDefault = !startsWithEmoji && isCompactDefaultLabel(text);
            const baseDefaultTextSize = compactDefault
              ? Math.max(34, Math.round(resolvedFontSize * 1.22))
              : resolvedFontSize;
            const defaultTextSize = scaleCompact(baseDefaultTextSize, compactDefault ? 28 : 24);
            const defaultLineHeight = compactDefault ? (isCompactLayout ? 1.18 : 1.22) : resolvedLineHeight;
            const defaultMarkerSize = compactDefault
              ? scaleCompact(Math.max(18, Math.round(baseDefaultTextSize * 0.53)), 16)
              : markerSize;
            const defaultMarkerOffset = compactDefault
              ? Math.max(10, Math.round((defaultTextSize * defaultLineHeight - defaultMarkerSize) / 2))
              : markerOffset;
            return (
          <div key={index} className={`flex items-start gap-6 ${commonStyle.textAlign === 'center' ? 'justify-center' : (commonStyle.textAlign === 'right' ? 'justify-end' : 'justify-start')}`}>
            {commonStyle.textAlign !== 'right' && !startsWithEmoji && (
              <div 
                data-edit-icon-target={onEditIcon ? 'list-item' : undefined}
                data-edit-icon-index={onEditIcon ? String(index) : undefined}
                onClick={onEditIcon ? () => onEditIcon(block, index) : undefined}
                className="rounded-full shrink-0 flex items-center justify-center" 
                style={{ 
                  width: `${defaultMarkerSize}px`,
                  height: `${defaultMarkerSize}px`,
                  marginTop: `${defaultMarkerOffset}px`,
                  cursor: onEditIcon ? 'pointer' : undefined,
                }} 
              >
                {renderItemMarker(index, compactDefault ? 18 : 16, theme.colors.accent)}
              </div>
            )}
            <p 
              className={theme.typography.body} 
              style={{ 
                ...commonStyle, 
                fontSize: `${defaultTextSize}px`,
                lineHeight: defaultLineHeight,
                fontWeight: Math.max(Number(commonStyle.fontWeight || 300), compactDefault ? 500 : 300),
                color: commonStyle.color || theme.colors.textSecondary,
              }}
            >
              {content}
            </p>
            {commonStyle.textAlign === 'right' && !startsWithEmoji && (
              <div 
                data-edit-icon-target={onEditIcon ? 'list-item' : undefined}
                data-edit-icon-index={onEditIcon ? String(index) : undefined}
                onClick={onEditIcon ? () => onEditIcon(block, index) : undefined}
                className="rounded-full shrink-0 flex items-center justify-center" 
                style={{ 
                  width: `${defaultMarkerSize}px`,
                  height: `${defaultMarkerSize}px`,
                  marginTop: `${defaultMarkerOffset}px`,
                  cursor: onEditIcon ? 'pointer' : undefined,
                }} 
              >
                {renderItemMarker(index, compactDefault ? 18 : 16, theme.colors.accent)}
              </div>
            )}
          </div>
            );
          })()
        );
      })}
    </div>
  );
}
