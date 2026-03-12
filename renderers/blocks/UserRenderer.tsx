
import React from 'react';
import { Block, Theme } from '../../types';
import { quoteFontFamily } from '../../utils/branding';
import { renderEmojiText } from '../../utils/emoji';

export function UserRenderer({ block, theme }: { block: Block; theme: Theme }) {
  const name = block.content as string || '';
  const handle = block.options?.handle || '@handle';
  const avatar = block.options?.avatar || 'https://images.unsplash.com/photo-1535713875002-d1d0cf377fde?auto=format&fit=crop&q=80&w=200';
  const hideName = block.options?.hideName;
  const isLarge = block.options?.size === 'lg';
  const nameColor = block.options?.nameColor || block.options?.color || theme.colors.textPrimary;
  
  // Font Size Logic: use fontSize if provided, otherwise fallback to legacy size classes
  const baseFontSize = block.options?.fontSize ? block.options.fontSize : (isLarge ? 32 : 20);
  const handleFontSize = baseFontSize * 0.75;

  // Ensure font family is quoted
  const selectedFont = theme.typography.fontFamily;
  const safeFontFamily = quoteFontFamily(selectedFont, theme.typography.fontFamily);

  return (
    <div 
      className={`flex items-center gap-6 mb-10 transition-all ${isLarge ? 'gap-8' : 'gap-4'}`}
      data-block-type="USER"
    >
      <div 
        className={`rounded-full overflow-hidden border-2 border-white/10 shrink-0 shadow-xl transition-all ${isLarge ? 'w-32 h-32' : 'w-16 h-16'}`}
      >
        <img src={avatar} alt={name} className="w-full h-full object-cover" />
      </div>
      <div className="flex flex-col justify-center" data-block-type="USER">
        {!hideName && (
          <span 
            className="font-black leading-none tracking-tight mb-1"
            style={{ fontSize: `${baseFontSize}px`, fontFamily: safeFontFamily, color: nameColor }}
            data-block-type="USER"
          >
            {renderEmojiText(name, 'user-name')}
          </span>
        )}
        <span 
          className="font-bold tracking-tight"
          style={{ 
            fontSize: `${handleFontSize}px`,
            color: block.options?.handleColor || theme.colors.accent,
            fontFamily: safeFontFamily
          }}
          data-block-type="USER"
        >
          {renderEmojiText(handle, 'user-handle')}
        </span>
      </div>
    </div>
  );
}
