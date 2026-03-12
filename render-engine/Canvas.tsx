
import React, { useMemo } from 'react';
import { ValidatedSlide } from '../template-dsl/schema';
// Fix: TOKENS is the correct exported constant in the design-tokens file
import { TOKENS } from '../design-tokens/tokens';
import { BlockRenderer } from '../domain/blocks/BlockRenderer';
import { templateRegistry } from '../domain/templates/TemplateRegistry';

interface CanvasProps {
  slide: ValidatedSlide;
  canvasRef: React.RefObject<HTMLDivElement>;
}

export const Canvas: React.FC<CanvasProps> = ({ slide, canvasRef }) => {
  const templateDef = templateRegistry.get(slide.template);
  // Fix: Use the correctly imported TOKENS constant
  const theme = TOKENS;

  const themeVariables = useMemo(() => ({
    '--theme-bg': theme.colors.background,
    '--theme-text-primary': theme.colors.textPrimary,
    '--theme-text-secondary': theme.colors.textSecondary,
    '--theme-accent': theme.colors.accent,
    '--theme-muted': theme.colors.muted,
    '--theme-title-weight': theme.typography.titleWeight,
    '--theme-letter-spacing-title': theme.typography.letterSpacingTitle,
  } as React.CSSProperties), [theme]);

  const canvasStyle = useMemo(() => {
    // Note: theme.backgrounds is a Record, using 'dark' as default if 'default' is missing
    const defaultBg = theme.backgrounds.default || theme.backgrounds.dark;
    return {
      ...themeVariables,
      background: defaultBg?.type === 'GRADIENT' 
        ? defaultBg.value 
        : theme.colors.background,
      fontFamily: theme.typography.fontFamily,
    };
  }, [theme, themeVariables]);

  const renderContent = () => {
    if (!templateDef) {
      return (
        <div className="flex-1 flex items-center justify-center text-red-500 font-bold border-2 border-dashed border-red-500/20 rounded-3xl">
          CRITICAL ERROR: TEMPLATE NOT FOUND ({slide.template})
        </div>
      );
    }

    const { layoutType } = templateDef;

    const blocks = (
      <div className={theme.spacing.blockGap}>
        {slide.blocks.map((b, i) => <BlockRenderer key={i} block={b} theme={theme} />)}
      </div>
    );

    switch (layoutType) {
      case 'CENTERED':
        return (
          <div className="h-full flex flex-col justify-center">
            {blocks}
          </div>
        );
      case 'SPLIT_IMAGE_TOP': {
        const img = slide.blocks.find(b => b.type === 'IMAGE');
        const rest = slide.blocks.filter(b => b.type !== 'IMAGE');
        return (
          <div className="h-full flex flex-col">
            {img && <BlockRenderer block={img} theme={theme} />}
            <div className={`flex-1 ${theme.spacing.sectionGap}`}>
              <div className={theme.spacing.blockGap}>
                {rest.map((b, i) => <BlockRenderer key={i} block={b} theme={theme} />)}
              </div>
            </div>
          </div>
        );
      }
      case 'SPLIT_IMAGE_SIDE': {
        const img = slide.blocks.find(b => b.type === 'IMAGE');
        const rest = slide.blocks.filter(b => b.type !== 'IMAGE');
        return (
          <div className="h-full flex flex-col justify-center">
            <div className="flex-1 flex gap-12 overflow-hidden">
               <div className="flex-1 h-full flex flex-col">
                  {img && <BlockRenderer block={img} theme={theme} />}
               </div>
               <div className="flex-1 flex flex-col justify-center">
                  <div className={theme.spacing.blockGap}>
                    {rest.map((b, i) => <BlockRenderer key={i} block={b} theme={theme} />)}
                  </div>
               </div>
            </div>
          </div>
        );
      }
      case 'STACKED':
      default:
        return (
          <div className="h-full flex flex-col">
            <div className="flex-1">
              {blocks}
            </div>
          </div>
        );
    }
  };

  return (
    <div 
      ref={canvasRef}
      id="slide-canvas"
      style={canvasStyle}
      className={`relative w-[1080px] h-[1350px] ${theme.spacing.canvasPadding} flex flex-col shadow-[0_40px_100px_rgba(0,0,0,0.6)] shrink-0 overflow-hidden select-none`}
    >
      <div className="relative z-10 flex flex-col h-full">
        {renderContent()}
      </div>
    </div>
  );
};
