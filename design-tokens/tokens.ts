
import { Theme } from '../types';

export const TOKENS: Theme = {
  name: 'InstaRender Editorial',
  
  typography: {
    fontFamily: "'Inter', sans-serif",
    hero: 'text-[100px] leading-[0.9] font-[900] tracking-[-0.05em]',
    title: 'text-[92px] leading-[0.95] font-[900] tracking-[-0.04em]',
    paragraph: 'text-[32px] leading-[1.3] font-light opacity-90', 
    body: 'text-[34px] leading-[1.2] font-light tracking-tight', 
    small: 'text-[22px] font-medium opacity-70',
    titleWeight: 900,
    letterSpacingTitle: '-0.05em'
  },

  colors: {
    background: '#0D0D0D',
    textPrimary: '#F5F3EE',
    textSecondary: 'rgba(245, 243, 238, 0.82)',
    accent: '#EAB308', 
    highlight: '#EAB308',
    muted: 'rgba(245, 243, 238, 0.5)'
  },

  spacing: {
    canvasPadding: 'px-36 py-48', // Slightly reduced top/bottom padding
    blockGap: 'space-y-6',
    sectionGap: 'mt-12'          // Reduced from mt-24
  },

  backgrounds: {
    dark: { type: 'SOLID', value: '#0D0D0D' },
    light: { type: 'SOLID', value: '#E5E5E5' },
    gradient: { type: 'GRADIENT', value: 'radial-gradient(circle at center, #1A1A1A, #0D0D0D)' }
  }
};
