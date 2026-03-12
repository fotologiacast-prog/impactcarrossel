export interface ImageBoxRect {
  left: number;
  top: number;
  width: number;
  height: number;
}

export interface CanvasSize {
  width: number;
  height: number;
}

export interface ImageBoxGuides {
  snapX: number | null;
  snapY: number | null;
  isCenteredHorizontally: boolean;
  isCenteredVertically: boolean;
  hasEqualHorizontalSpacing: boolean;
  hasEqualVerticalSpacing: boolean;
}

export interface ImageBoxDimensionLimits {
  minWidth: number;
  maxWidth: number;
  minHeight: number;
  maxHeight: number;
}

export interface ImageBoxSnapLock {
  x: boolean;
  y: boolean;
}

export const clampImageBoxDimensions = (
  dimensions: { width: number; height: number },
  limits: ImageBoxDimensionLimits,
) => ({
  width: Math.min(limits.maxWidth, Math.max(limits.minWidth, dimensions.width)),
  height: Math.min(limits.maxHeight, Math.max(limits.minHeight, dimensions.height)),
});

export const getImageBoxGuides = (
  rect: ImageBoxRect,
  canvas: CanvasSize,
  threshold = 42,
): ImageBoxGuides => {
  const rectCenterX = rect.left + rect.width / 2;
  const rectCenterY = rect.top + rect.height / 2;
  const canvasCenterX = canvas.width / 2;
  const canvasCenterY = canvas.height / 2;

  const deltaX = canvasCenterX - rectCenterX;
  const deltaY = canvasCenterY - rectCenterY;

  const isCenteredHorizontally = Math.abs(deltaX) <= threshold;
  const isCenteredVertically = Math.abs(deltaY) <= threshold;

  return {
    snapX: isCenteredHorizontally ? deltaX : null,
    snapY: isCenteredVertically ? deltaY : null,
    isCenteredHorizontally,
    isCenteredVertically,
    hasEqualHorizontalSpacing: isCenteredHorizontally,
    hasEqualVerticalSpacing: isCenteredVertically,
  };
};

export const resolveImageBoxSnapLock = (
  previous: ImageBoxSnapLock,
  guides: Pick<ImageBoxGuides, 'snapX' | 'snapY'>,
  acquireThreshold: { x: number; y: number },
  releaseThreshold: { x: number; y: number },
): ImageBoxSnapLock => {
  const snapXDistance = Math.abs(guides.snapX ?? Number.POSITIVE_INFINITY);
  const snapYDistance = Math.abs(guides.snapY ?? Number.POSITIVE_INFINITY);

  return {
    x: previous.x
      ? snapXDistance <= releaseThreshold.x
      : snapXDistance <= acquireThreshold.x,
    y: previous.y
      ? snapYDistance <= releaseThreshold.y
      : snapYDistance <= acquireThreshold.y,
  };
};
