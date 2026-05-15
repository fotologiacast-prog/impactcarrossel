export type PendingImageTarget =
  | 'template'
  | 'background'
  | 'overlay'
  | 'cover-background'
  | 'cover-foreground';

export type PendingImageDraft = {
  dataUrl: string;
  target: PendingImageTarget;
  slideIndex: number;
  overlayId?: string;
  isCutout?: boolean;
};

export type OptimizeImageOptions = {
  target: PendingImageTarget;
  maxDimension?: number;
  quality?: number;
};

export type ImageDimensions = {
  width: number;
  height: number;
};

export const estimateDataUrlBytes = (dataUrl: string) => {
  const [, payload = ''] = dataUrl.split(',', 2);
  if (!payload) return 0;

  const normalized = payload.trim();
  const padding = normalized.endsWith('==') ? 2 : normalized.endsWith('=') ? 1 : 0;
  return Math.max(0, Math.floor((normalized.length * 3) / 4) - padding);
};

export const formatImageBytes = (bytes: number) => {
  if (bytes <= 0) return '0 B';
  if (bytes < 1024) return `${bytes} B`;
  if (bytes < 1024 * 1024) return `${(bytes / 1024).toFixed(1)} KB`;
  return `${(bytes / (1024 * 1024)).toFixed(2)} MB`;
};

export const detectImageFormatFromDataUrl = (dataUrl: string): 'png' | 'jpg' => (
  /^data:image\/png(?:;|,)/i.test(dataUrl) ? 'png' : 'jpg'
);

export const detectImageHasTransparency = async (sourceDataUrl: string): Promise<boolean> => {
  if (typeof window === 'undefined') {
    return false;
  }

  if (!/^data:image\/(?:png|webp)(?:;|,)/i.test(sourceDataUrl)) {
    return false;
  }

  const image = await new Promise<HTMLImageElement>((resolve, reject) => {
    const nextImage = new Image();
    nextImage.onload = () => resolve(nextImage);
    nextImage.onerror = () => reject(new Error('Falha ao carregar imagem para detectar transparência.'));
    nextImage.src = sourceDataUrl;
  });

  const naturalWidth = image.naturalWidth || image.width || 1;
  const naturalHeight = image.naturalHeight || image.height || 1;
  const sampleMax = 320;
  const scale = Math.min(1, sampleMax / Math.max(naturalWidth, naturalHeight));
  const sampleWidth = Math.max(1, Math.round(naturalWidth * scale));
  const sampleHeight = Math.max(1, Math.round(naturalHeight * scale));
  const canvas = document.createElement('canvas');
  canvas.width = sampleWidth;
  canvas.height = sampleHeight;

  const context = canvas.getContext('2d', { willReadFrequently: true });
  if (!context) {
    return false;
  }

  context.clearRect(0, 0, sampleWidth, sampleHeight);
  context.drawImage(image, 0, 0, sampleWidth, sampleHeight);

  const pixels = context.getImageData(0, 0, sampleWidth, sampleHeight).data;
  for (let index = 3; index < pixels.length; index += 4) {
    if (pixels[index] < 250) {
      return true;
    }
  }

  return false;
};

export const loadImageDimensions = async (sourceUrl: string): Promise<ImageDimensions> => {
  if (typeof window === 'undefined') {
    throw new Error('loadImageDimensions requires a browser environment.');
  }

  const image = await new Promise<HTMLImageElement>((resolve, reject) => {
    const nextImage = new Image();
    nextImage.onload = () => resolve(nextImage);
    nextImage.onerror = () => reject(new Error('Falha ao carregar imagem para ler dimensões.'));
    nextImage.src = sourceUrl;
  });

  return {
    width: image.naturalWidth || image.width || 1,
    height: image.naturalHeight || image.height || 1,
  };
};

export const getOptimizationConfig = (target: PendingImageTarget) => {
  if (target === 'overlay') {
    return {
      maxDimension: 1800,
      quality: 0.9,
      mimeType: 'image/webp',
    } as const;
  }

  return {
    maxDimension: 2400,
    quality: 0.88,
    mimeType: 'image/webp',
  } as const;
};

const clampDimensions = (width: number, height: number, maxDimension: number) => {
  if (width <= maxDimension && height <= maxDimension) {
    return { width, height };
  }

  const aspect = width / Math.max(1, height);
  if (aspect >= 1) {
    return {
      width: maxDimension,
      height: Math.max(1, Math.round(maxDimension / aspect)),
    };
  }

  return {
    width: Math.max(1, Math.round(maxDimension * aspect)),
    height: maxDimension,
  };
};

export const optimizeImageDataUrl = async (
  sourceDataUrl: string,
  options: OptimizeImageOptions,
): Promise<string> => {
  if (typeof window === 'undefined') {
    return sourceDataUrl;
  }

  const config = getOptimizationConfig(options.target);
  const maxDimension = options.maxDimension ?? config.maxDimension;
  const quality = options.quality ?? config.quality;

  const image = await new Promise<HTMLImageElement>((resolve, reject) => {
    const nextImage = new Image();
    nextImage.onload = () => resolve(nextImage);
    nextImage.onerror = () => reject(new Error('Falha ao carregar imagem para otimização.'));
    nextImage.src = sourceDataUrl;
  });

  const naturalWidth = image.naturalWidth || image.width;
  const naturalHeight = image.naturalHeight || image.height;
  const nextSize = clampDimensions(naturalWidth, naturalHeight, maxDimension);

  const canvas = document.createElement('canvas');
  canvas.width = nextSize.width;
  canvas.height = nextSize.height;

  const context = canvas.getContext('2d');
  if (!context) {
    return sourceDataUrl;
  }

  context.clearRect(0, 0, canvas.width, canvas.height);
  context.drawImage(image, 0, 0, canvas.width, canvas.height);

  const blob = await new Promise<Blob | null>((resolve) => {
    canvas.toBlob(
      (nextBlob) => resolve(nextBlob),
      config.mimeType,
      quality,
    );
  });

  if (!blob) {
    return sourceDataUrl;
  }

  return await new Promise<string>((resolve, reject) => {
    const reader = new FileReader();
    reader.onloadend = () => resolve(reader.result as string);
    reader.onerror = () => reject(new Error('Falha ao converter imagem otimizada.'));
    reader.readAsDataURL(blob);
  });
};
