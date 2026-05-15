export type CutoutImageLike = {
  url?: string;
  format?: 'png' | 'jpg';
  isCutout?: boolean;
  foregroundMode?: string;
  hasTornEdges?: boolean;
};

export const shouldTreatImageAsCutout = (image?: CutoutImageLike | null) => {
  if (!image) return false;

  return Boolean(
    image.isCutout ||
    image.foregroundMode === 'cutout' ||
    image.hasTornEdges ||
    image.url?.includes('rembg'),
  );
};

