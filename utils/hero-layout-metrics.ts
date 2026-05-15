export type HeroFadeSide = 'left' | 'right' | 'top' | 'bottom';
export type HeroVerticalAlign = 'top' | 'center' | 'bottom';

export const getCoverContentLift = ({
  hasBackgroundImage,
  hasForegroundImage,
  verticalAlign,
}: {
  hasBackgroundImage: boolean;
  hasForegroundImage: boolean;
  verticalAlign: HeroVerticalAlign;
}) => {
  if (!hasBackgroundImage || hasForegroundImage) return 0;
  if (verticalAlign !== 'bottom') return 0;
  return 56;
};

export const getFadeReadingMetrics = (
  side: HeroFadeSide,
  availableCanvasWidth: number,
) => {
  if (side === 'left' || side === 'right') {
    return {
      panelMaxWidth: Math.min(560, availableCanvasWidth * 0.54),
      panelEdgeInset: 72,
      zoneCoverage: 0.78,
      zoneStrongStop: 0.3,
      zoneFadeStop: 0.7,
    };
  }

  return {
    panelMaxWidth: Math.min(780, availableCanvasWidth * 0.74),
    panelEdgeInset: 42,
    zoneCoverage: 0.66,
    zoneStrongStop: 0.28,
    zoneFadeStop: 0.7,
  };
};
