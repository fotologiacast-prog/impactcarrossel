
import React from 'react';
import { Block, Theme } from '../../types';
import { TOKENS } from '../../design-tokens/tokens';

interface BlockRendererProps {
  block: Block;
  theme: Theme;
}

const HighlightedText: React.FC<{ text: string; highlight?: string; className: string; theme: Theme }> = ({ text, highlight, className, theme }) => {
  if (!highlight) return <h2 className={className} style={{ fontFamily: theme.typography.fontFamily }}>{text}</h2>;
  const parts = text.split(new RegExp(`(${highlight})`, 'gi'));
  return (
    <h2 className={className} style={{ fontFamily: theme.typography.fontFamily }}>
      {parts.map((part, i) => 
        part.toLowerCase() === highlight.toLowerCase() 
          ? <span key={i} style={{ color: TOKENS.colors.accent }}>{part}</span>
          : part
      )}
    </h2>
  );
};

export const BlockRenderer: React.FC<BlockRendererProps> = ({ block, theme }) => {
  const style = { fontFamily: theme.typography.fontFamily };

  switch (block.type) {
    case 'TITLE':
      return (
        <div className="mb-4">
          <HighlightedText 
            text={block.content as string} 
            highlight={block.options?.highlight} 
            className={block.options?.variant === 'accent' ? TOKENS.typography.hero : TOKENS.typography.title}
            theme={theme}
          />
        </div>
      );
    case 'PARAGRAPH':
      return <p className={`${TOKENS.typography.paragraph} mb-6`} style={style}>{block.content}</p>;
    case 'LIST':
      return (
        <ul className={`${theme.spacing.blockGap} mb-8`}>
          {(block.content as string[]).map((item, i) => (
            <li key={i} className="flex items-start gap-6">
              <span 
                className={`mt-4 h-3 w-3 shrink-0 rounded-full bg-[var(--theme-accent)] shadow-[0_0_15px_var(--theme-accent)]`} 
              />
              <p className={TOKENS.typography.body} style={style}>{item}</p>
            </li>
          ))}
        </ul>
      );
    case 'SPACER':
      return <div className="h-16" />;
    case 'IMAGE':
      return (
        <div className={`w-full flex-grow overflow-hidden rounded-3xl bg-white/5 border border-white/5 mb-8`}>
          <img src={block.content as string} alt="" className="w-full h-full object-cover" />
        </div>
      );
    default: return null;
  }
};
