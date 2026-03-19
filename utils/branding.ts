import type { Block, BrandTheme, CustomFont, ProjectClientProfile, ProjectFX, SlideDefinition } from '../types';

const DEFAULT_WHITE = '#F5F3EE';
const DEFAULT_BLACK = '#141414';
const DEFAULT_BACKGROUND = '#0D0D0D';
const DEFAULT_ACCENT = '#1fb2f7';
const DEFAULT_PRIMARY_FONT = 'Inter';
const DEFAULT_SECONDARY_FONT = 'Instrument Serif';

type SlideOptions = SlideDefinition['options'];
type DirectionalSide = 'left' | 'right' | 'top' | 'bottom';
export type RgbColor = { r: number; g: number; b: number };

type BrandPresetLike = {
  id?: string;
  name?: string;
  colors?: string[];
  font_padrao?: string;
  font_destaque?: string;
  defaults?: {
    bg?: string;
    text?: string;
    accent?: string;
    cardBg?: string;
    hlBgColor?: string;
  };
};

const isNonEmptyString = (value: unknown): value is string =>
  typeof value === 'string' && value.trim().length > 0;

const normalizeHex = (value: string): string | null => {
  const input = value.trim();
  if (!input.startsWith('#')) return null;

  const raw = input.slice(1);
  if (/^[0-9a-fA-F]{3}$/.test(raw)) {
    return `#${raw
      .split('')
      .map((char) => `${char}${char}`)
      .join('')
      .toUpperCase()}`;
  }

  if (/^[0-9a-fA-F]{6}$/.test(raw)) {
    return `#${raw.toUpperCase()}`;
  }

  return null;
};

export const getRgbFromColor = (value?: string | null): [number, number, number] | null => {
  if (!isNonEmptyString(value)) return null;

  const normalizedHex = normalizeHex(value);
  if (normalizedHex) {
    return [
      parseInt(normalizedHex.slice(1, 3), 16),
      parseInt(normalizedHex.slice(3, 5), 16),
      parseInt(normalizedHex.slice(5, 7), 16),
    ];
  }

  const rgbMatch = value.match(/\d+(\.\d+)?/g);
  if (rgbMatch && rgbMatch.length >= 3) {
    return [
      Number(rgbMatch[0]),
      Number(rgbMatch[1]),
      Number(rgbMatch[2]),
    ];
  }

  return null;
};

export const getDirectionalSampleRegion = (
  side: DirectionalSide,
  width: number,
  height: number,
): { sx: number; sy: number; sw: number; sh: number } => {
  const regionWidth = Math.max(1, Math.round(width * (side === 'left' || side === 'right' ? 0.34 : 0.7)));
  const regionHeight = Math.max(1, Math.round(height * (side === 'top' || side === 'bottom' ? 0.34 : 0.44)));

  switch (side) {
    case 'right':
      return { sx: Math.max(0, width - regionWidth), sy: Math.round(height * 0.28), sw: regionWidth, sh: regionHeight };
    case 'top':
      return { sx: Math.round(width * 0.15), sy: 0, sw: regionWidth, sh: regionHeight };
    case 'bottom':
      return { sx: Math.round(width * 0.15), sy: Math.max(0, height - regionHeight), sw: regionWidth, sh: regionHeight };
    case 'left':
    default:
      return { sx: 0, sy: Math.round(height * 0.28), sw: regionWidth, sh: regionHeight };
  }
};

export const createDarkenedOverlayColor = (
  rgb: RgbColor,
  luminanceHint?: number,
): RgbColor => {
  const luminance = luminanceHint ?? getRelativeLuminance(`rgb(${rgb.r}, ${rgb.g}, ${rgb.b})`);
  const multiplier = luminance > 0.72 ? 0.28 : luminance > 0.52 ? 0.34 : luminance > 0.32 ? 0.42 : 0.52;

  return {
    r: Math.max(8, Math.min(255, Math.round(rgb.r * multiplier))),
    g: Math.max(8, Math.min(255, Math.round(rgb.g * multiplier))),
    b: Math.max(8, Math.min(255, Math.round(rgb.b * multiplier))),
  };
};

export const rgbToHex = (rgb: RgbColor): string =>
  `#${[rgb.r, rgb.g, rgb.b]
    .map((value) => Math.max(0, Math.min(255, value)).toString(16).padStart(2, '0'))
    .join('')
    .toUpperCase()}`;

const getRelativeLuminance = (value?: string | null): number => {
  const rgb = getRgbFromColor(value);
  if (!rgb) return 0;

  const [r, g, b] = rgb.map((channel) => {
    const normalized = channel / 255;
    return normalized <= 0.03928
      ? normalized / 12.92
      : ((normalized + 0.055) / 1.055) ** 2.4;
  });

  return 0.2126 * r + 0.7152 * g + 0.0722 * b;
};

export const normalizeFontFamilyName = (value?: string | null): string =>
  (value || '').toLowerCase().replace(/[^a-z0-9]/g, '');

export const quoteFontFamily = (value?: string | null, fallback?: string): string => {
  const resolved = (value || fallback || '').trim();
  if (!resolved) return fallback || '';

  return resolved.includes('"') || resolved.includes("'") || resolved.includes(',')
    ? resolved
    : `"${resolved}"`;
};

export const getContrastTextColor = (
  background?: string | null,
  lightColor: string = DEFAULT_WHITE,
  darkColor: string = DEFAULT_BLACK,
): string => (getRelativeLuminance(background) > 0.45 ? darkColor : lightColor);

export const resolveFontPreference = (
  preferredFont: string | undefined,
  fonts: Array<Pick<CustomFont, 'family' | 'name'>>,
): string => {
  if (!isNonEmptyString(preferredFont)) return DEFAULT_PRIMARY_FONT;

  const normalizedPreference = normalizeFontFamilyName(preferredFont);
  const matchedFont = fonts.find((font) => {
    const family = normalizeFontFamilyName(font.family);
    const name = normalizeFontFamilyName(font.name);

    return (
      family === normalizedPreference ||
      name === normalizedPreference ||
      family.includes(normalizedPreference) ||
      name.includes(normalizedPreference) ||
      normalizedPreference.includes(family) ||
      normalizedPreference.includes(name)
    );
  });

  return matchedFont?.family || preferredFont.trim();
};

const getUniqueColors = (colors: Array<string | undefined | null>): string[] => {
  const seen = new Set<string>();
  const result: string[] = [];

  colors.forEach((color) => {
    const normalized = isNonEmptyString(color) ? (normalizeHex(color) || color.trim()) : null;
    if (!normalized) return;
    const key = normalized.toLowerCase();
    if (seen.has(key)) return;
    seen.add(key);
    result.push(normalized);
  });

  return result;
};

export const createBrandThemeFromPreset = (
  preset: BrandPresetLike,
  fonts: Array<Pick<CustomFont, 'family' | 'name'>> = [],
): BrandTheme => {
  const colors = preset.colors || [];
  const white = DEFAULT_WHITE;
  const black = DEFAULT_BLACK;

  const background = preset.defaults?.bg || colors[0] || DEFAULT_BACKGROUND;
  const accent = preset.defaults?.accent || colors[2] || colors[1] || DEFAULT_ACCENT;
  const text = preset.defaults?.text || getContrastTextColor(background, white, black);
  const hlBgColor = preset.defaults?.hlBgColor || colors[3] || accent;
  const cardBg = preset.defaults?.cardBg || colors[4] || accent;

  return {
    paletteId: preset.id,
    colors: getUniqueColors(colors),
    background,
    text,
    accent,
    cardBg,
    cardTextColor: getContrastTextColor(cardBg, white, black),
    hlBgColor,
    hlTextColor: getContrastTextColor(hlBgColor, white, black),
    fontPadrão: resolveFontPreference(preset.font_padrao || DEFAULT_PRIMARY_FONT, fonts),
    fontDestaque: resolveFontPreference(preset.font_destaque || DEFAULT_SECONDARY_FONT, fonts),
    white,
    black,
  };
};

export const getBrandPaletteSwatches = (
  preset: BrandPresetLike | BrandTheme | undefined,
): string[] => {
  if (!preset) {
    return [DEFAULT_BACKGROUND, DEFAULT_WHITE, DEFAULT_ACCENT, DEFAULT_BLACK];
  }

  if ('paletteId' in preset || 'fontPadrão' in preset) {
    const brandTheme = preset as BrandTheme;
    return getUniqueColors([
      ...(brandTheme.colors || []),
      brandTheme.background,
      brandTheme.text,
      brandTheme.accent,
      brandTheme.hlBgColor,
      brandTheme.cardBg,
      brandTheme.white,
      brandTheme.black,
    ]);
  }

  const presetLike = preset as BrandPresetLike;
  const brandTheme = createBrandThemeFromPreset(presetLike);
  return getUniqueColors([
    ...(presetLike.colors || []),
    brandTheme.background,
    brandTheme.text,
    brandTheme.accent,
    brandTheme.hlBgColor,
    brandTheme.cardBg,
    brandTheme.white,
    brandTheme.black,
  ]);
};

export const mergeSlideOptionsWithBrandTheme = (
  brandTheme?: BrandTheme | null,
  slideOptions?: SlideOptions,
  projectFX?: ProjectFX | null,
): NonNullable<SlideOptions> & Pick<BrandTheme, 'white' | 'black'> => {
  const white = brandTheme?.white || DEFAULT_WHITE;
  const black = brandTheme?.black || DEFAULT_BLACK;
  const mergedPostFX = {
    ...(projectFX || {}),
    ...(slideOptions?.postFX || {}),
  };

  const merged = {
    ...(brandTheme || {}),
    ...(slideOptions || {}),
    postFX: Object.keys(mergedPostFX).length > 0 ? mergedPostFX : undefined,
  };

  const background = merged.background || DEFAULT_BACKGROUND;
  const accent = merged.accent || DEFAULT_ACCENT;
  const text = merged.text || getContrastTextColor(background, white, black);
  const cardBg = merged.cardBg || accent;
  const hlBgColor = merged.hlBgColor || accent;
  const inheritedPrimaryFont = isNonEmptyString(slideOptions?.fontPadrão)
    ? slideOptions?.fontPadrão
    : brandTheme?.fontPadrão;
  const inheritedSecondaryFont = isNonEmptyString(slideOptions?.fontDestaque)
    ? slideOptions?.fontDestaque
    : brandTheme?.fontDestaque;

  return {
    ...merged,
    background,
    accent,
    text,
    cardBg,
    cardTextColor: merged.cardTextColor || getContrastTextColor(cardBg, white, black),
    hlBgColor,
    hlTextColor: merged.hlTextColor || getContrastTextColor(hlBgColor, white, black),
    fontPadrão: inheritedPrimaryFont || DEFAULT_PRIMARY_FONT,
    fontDestaque: inheritedSecondaryFont || DEFAULT_SECONDARY_FONT,
    backgroundOverlayColor: merged.backgroundOverlayColor || black,
    white,
    black,
  };
};

export const applyBrandThemeToSlides = (
  slides: SlideDefinition[],
  previousTheme?: Pick<BrandTheme, 'fontPadrão' | 'fontDestaque'> | null,
): SlideDefinition[] =>
  slides.map((slide) => {
    if (!slide.options) return slide;

    const nextOptions = { ...slide.options };
    let changed = false;

    const inheritedPrimary = normalizeFontFamilyName(previousTheme?.fontPadrão || DEFAULT_PRIMARY_FONT);
    const inheritedSecondary = normalizeFontFamilyName(previousTheme?.fontDestaque || DEFAULT_SECONDARY_FONT);

    if (isNonEmptyString(nextOptions.fontPadrão) && normalizeFontFamilyName(nextOptions.fontPadrão) === inheritedPrimary) {
      delete nextOptions.fontPadrão;
      changed = true;
    }
    if (!isNonEmptyString(nextOptions.fontPadrão) && 'fontPadrão' in nextOptions) {
      delete nextOptions.fontPadrão;
      changed = true;
    }

    if (isNonEmptyString(nextOptions.fontDestaque) && normalizeFontFamilyName(nextOptions.fontDestaque) === inheritedSecondary) {
      delete nextOptions.fontDestaque;
      changed = true;
    }
    if (!isNonEmptyString(nextOptions.fontDestaque) && 'fontDestaque' in nextOptions) {
      delete nextOptions.fontDestaque;
      changed = true;
    }

    if (!changed) return slide;

    return {
      ...slide,
      options: nextOptions,
    };
  });

const formatInstagramHandle = (value?: string | null): string | undefined => {
  if (!isNonEmptyString(value)) return undefined;
  const normalized = value.trim().replace(/^@+/, '');
  return normalized ? `@${normalized}` : undefined;
};

const syncUserBlockWithClient = (block: Block, client: ProjectClientProfile): Block => {
  const nextHandle = formatInstagramHandle(client.instagram) || block.options?.handle;
  const nextAvatar = client.profilePicture || block.options?.avatar;

  const hasChanges =
    block.content !== client.name ||
    block.options?.handle !== nextHandle ||
    block.options?.avatar !== nextAvatar;

  if (!hasChanges) return block;

  return {
    ...block,
    content: client.name,
    options: {
      ...block.options,
      handle: nextHandle,
      avatar: nextAvatar,
    },
  };
};

export const applyProjectClientToSlide = (
  slide: SlideDefinition,
  client?: ProjectClientProfile | null,
): SlideDefinition => {
  if (!client) return slide;

  let changed = false;

  const nextBlocks = slide.blocks.map((block) => {
    if (block.type !== 'USER') return block;

    const nextBlock = syncUserBlockWithClient(block, client);
    if (nextBlock !== block) changed = true;
    return nextBlock;
  });

  const shouldUseProfilePictureInImage =
    isNonEmptyString(client.profilePicture) &&
    (slide.template === 'PROFILE_FOCUS' || slide.template === 'SOCIAL_CHECKLIST') &&
    !!slide.image;

  const nextImage =
    shouldUseProfilePictureInImage && slide.image?.url !== client.profilePicture
      ? {
          ...slide.image,
          url: client.profilePicture || slide.image?.url,
        }
      : slide.image;

  if (nextImage !== slide.image) changed = true;

  if (!changed) return slide;

  return {
    ...slide,
    blocks: nextBlocks,
    image: nextImage,
  };
};
