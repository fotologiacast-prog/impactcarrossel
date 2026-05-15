export type IconScaleContext = 'box' | 'card';

const ICON_SCALE_BY_CONTEXT: Record<IconScaleContext, number> = {
  box: 1.75,
  card: 2.2,
};

const ICON_MIN_SIZE_BY_CONTEXT: Record<IconScaleContext, number> = {
  box: 124,
  card: 72,
};

export const getIconScaleForContext = (context: IconScaleContext): number =>
  ICON_SCALE_BY_CONTEXT[context];

export const getIconMinSizeForContext = (context: IconScaleContext): number =>
  ICON_MIN_SIZE_BY_CONTEXT[context];
