export type CoverTransformInput = {
  viewportWidth: number;
  viewportHeight: number;
  imageWidth: number;
  imageHeight: number;
  scale?: number;
};

export type CoverTransformMetrics = {
  renderedWidth: number;
  renderedHeight: number;
  maxOffsetX: number;
  maxOffsetY: number;
};

export const resolveCoverTransformMetrics = ({
  viewportWidth,
  viewportHeight,
  imageWidth,
  imageHeight,
  scale = 1,
}: CoverTransformInput): CoverTransformMetrics => {
  const safeViewportWidth = Math.max(1, viewportWidth);
  const safeViewportHeight = Math.max(1, viewportHeight);
  const safeImageWidth = Math.max(1, imageWidth);
  const safeImageHeight = Math.max(1, imageHeight);
  const safeScale = Math.max(0.01, scale);
  const coverScale = Math.max(
    safeViewportWidth / safeImageWidth,
    safeViewportHeight / safeImageHeight,
  );
  const renderedWidth = Math.round(safeImageWidth * coverScale);
  const renderedHeight = Math.round(safeImageHeight * coverScale);
  const scaledRenderedWidth = renderedWidth * safeScale;
  const scaledRenderedHeight = renderedHeight * safeScale;

  return {
    renderedWidth,
    renderedHeight,
    maxOffsetX: Math.max(0, Math.round((scaledRenderedWidth - safeViewportWidth) / 2)),
    maxOffsetY: Math.max(0, Math.round((scaledRenderedHeight - safeViewportHeight) / 2)),
  };
};

export const clampCoverTranslation = (value: number, maxOffset: number) => (
  Math.max(-maxOffset, Math.min(maxOffset, value))
);

export const clampCoverTranslationRange = (
  value: number,
  minOffset: number,
  maxOffset: number,
) => Math.max(minOffset, Math.min(maxOffset, value));
