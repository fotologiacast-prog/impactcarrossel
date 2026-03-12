
import React from 'react';
import { Block, Theme } from '../../types';

interface FooterRendererProps {
  block: Block;
  theme: Theme;
}

export function FooterRenderer({ block, theme }: FooterRendererProps) {
  return (
    <footer
      className={theme.typography.small}
      style={{ 
        color: theme.colors.muted,
        fontFamily: theme.typography.fontFamily 
      }}
    >
      {block.content as string}
    </footer>
  );
}
