export type ImagePreviewFrame = {
  width: number;
  height: number;
  coverRect?: {
    left: number;
    top: number;
    width: number;
    height: number;
  };
};

type ResolveImagePreviewFrameInput = {
  imageLayoutId?: string | null;
  imageWidth?: number;
  imageHeight?: number;
};

export const resolveImagePreviewFrame = ({
  imageLayoutId,
  imageWidth = 540,
  imageHeight = 850,
}: ResolveImagePreviewFrameInput): ImagePreviewFrame => {
  if (!imageLayoutId || imageLayoutId === 'IMAGE_NONE' || imageLayoutId === 'IMAGE_BACKGROUND') {
    return { width: 1080, height: 1350 };
  }

  if (imageLayoutId === 'IMAGE_FADE_LEFT' || imageLayoutId === 'IMAGE_FADE_RIGHT' || imageLayoutId === 'IMAGE_FADE_TOP' || imageLayoutId === 'IMAGE_FADE_BOTTOM') {
    return { width: 1080, height: 1350 };
  }

  if (imageLayoutId === 'IMAGE_WAVE_BOTTOM') {
    return { width: 1080, height: 1350 };
  }

  if (
    imageLayoutId === 'IMAGE_SPLIT_LEFT' ||
    imageLayoutId === 'IMAGE_SPLIT_RIGHT' ||
    imageLayoutId === 'IMAGE_STAGE_LEFT' ||
    imageLayoutId === 'IMAGE_STAGE_RIGHT'
  ) {
    return { width: 540, height: 1350 };
  }

  if (
    imageLayoutId === 'IMAGE_SPLIT_TOP' ||
    imageLayoutId === 'IMAGE_SPLIT_BOTTOM' ||
    imageLayoutId === 'IMAGE_STAGE_TOP' ||
    imageLayoutId === 'IMAGE_STAGE_BOTTOM'
  ) {
    return { width: 1080, height: 675 };
  }

  if (imageLayoutId === 'IMAGE_BOX_RIGHT') {
    return { width: imageWidth, height: imageHeight };
  }

  if (imageLayoutId === 'IMAGE_BOX_BOTTOM') {
    return { width: imageWidth, height: imageHeight };
  }

  if (imageLayoutId === 'IMAGE_GLASS_CARD' || imageLayoutId === 'IMAGE_GLASS_BOTTOM') {
    return { width: 1080, height: 1350 };
  }

  return { width: 1080, height: 1350 };
};
