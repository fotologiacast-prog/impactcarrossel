
import React from 'react';
import { Block, Theme } from '../types';
import { TitleRenderer } from "./blocks/TitleRenderer";
import { ParagraphRenderer } from "./blocks/ParagraphRenderer";
import { ListRenderer } from "./blocks/ListRenderer";
import { SpacerRenderer } from "./blocks/SpacerRenderer";
import { ImageRenderer } from "./blocks/ImageRenderer";
import { CardRenderer } from "./blocks/CardRenderer";
import { BadgeRenderer } from "./blocks/BadgeRenderer";
import { BoxRenderer } from "./blocks/BoxRenderer";
import { UserRenderer } from "./blocks/UserRenderer";

export function renderBlock(
  block: Block, 
  theme: Theme, 
  onEditIcon?: (block: Block, index: number) => void, 
  isGridMember?: boolean, 
  indexInGrid?: number, 
  globalIndex?: number,
  boxGroupContext?: {
    totalInGroup?: number;
    groupLayout?: 'auto' | 'row' | 'grid' | 'stack';
  },
  layoutContext?: {
    defaultWidthPercent?: number;
    defaultTextAlign?: 'left' | 'center' | 'right';
  }
) {
  const blockIdx = globalIndex ?? 0;
  const isTextualBlock = block.type === 'TITLE'
    || block.type === 'PARAGRAPH'
    || block.type === 'LIST'
    || block.type === 'CARD'
    || block.type === 'BADGE'
    || block.type === 'USER';
  const alignment = block.options?.textAlign
    || (block.options?.align as 'left' | 'center' | 'right' | undefined)
    || (isTextualBlock ? layoutContext?.defaultTextAlign : undefined)
    || 'left';
  const widthPercent = block.options?.widthPercent ?? layoutContext?.defaultWidthPercent;
  const shouldApplyWidth = widthPercent !== undefined && !Number.isNaN(widthPercent) && block.type !== 'SPACER' && block.type !== 'IMAGE';
  const shouldShrinkWrapContent = block.type === 'BOX' && !isGridMember && !shouldApplyWidth;

  const wrapperStyle: React.CSSProperties = {
    position: 'relative',
    width: '100%',
    height: block.type === 'BOX' && isGridMember ? '100%' : undefined,
    display: 'flex',
    flexDirection: isGridMember ? 'column' : undefined,
    justifyContent: alignment === 'center' ? 'center' : alignment === 'right' ? 'flex-end' : 'flex-start',
  };
  const innerJustifyContent = alignment === 'center'
    ? 'center'
    : alignment === 'right'
      ? 'flex-end'
      : 'flex-start';

  const content = (() => {
    switch (block.type) {
      case "TITLE":
        return <TitleRenderer block={block} theme={theme} />;
      case "PARAGRAPH":
        return <ParagraphRenderer block={block} theme={theme} />;
      case "LIST":
        return <ListRenderer block={block} theme={theme} />;
      case "SPACER":
        return <SpacerRenderer block={block} />;
      case "IMAGE":
        return <ImageRenderer block={block} />;
      case "CARD":
        return <CardRenderer block={block} theme={theme} onEditIcon={(b) => onEditIcon?.(b, blockIdx)} />;
      case "BADGE":
        return <BadgeRenderer block={block} theme={theme} />;
      case "BOX":
        return <BoxRenderer block={block} theme={theme} isGridMember={isGridMember} indexInGrid={indexInGrid} totalInGroup={boxGroupContext?.totalInGroup} groupLayout={boxGroupContext?.groupLayout} onEditIcon={(b) => onEditIcon?.(b, blockIdx)} />;
      case "USER":
        return <UserRenderer block={block} theme={theme} />;
      default:
        return null;
    }
  })();

  return (
    <div 
      style={wrapperStyle} 
      data-block-index={globalIndex} 
      className="render-block-wrapper"
    >
      <div
        style={
          shouldApplyWidth
            ? {
                width: `${widthPercent}%`,
                maxWidth: `${widthPercent}%`,
                height: block.type === 'BOX' && isGridMember ? '100%' : undefined,
                display: block.type === 'BOX' ? 'flex' : undefined,
                justifyContent: block.type === 'BOX' ? innerJustifyContent : undefined,
              }
            : shouldShrinkWrapContent
              ? {
                  width: 'fit-content',
                  maxWidth: '100%',
                }
            : {
                width: '100%',
                maxWidth: '100%',
                height: block.type === 'BOX' && isGridMember ? '100%' : undefined,
                display: block.type === 'BOX' ? 'flex' : undefined,
                justifyContent: block.type === 'BOX' ? innerJustifyContent : undefined,
              }
        }
      >
        {content}
      </div>
    </div>
  );
}
