import { createClient } from '@supabase/supabase-js';

const DEFAULT_WHITE = '#F5F3EE';
const DEFAULT_BLACK = '#141414';
const DEFAULT_BACKGROUND = '#0D0D0D';
const DEFAULT_ACCENT = '#1fb2f7';
const DEFAULT_PRIMARY_FONT = 'Inter';
const DEFAULT_SECONDARY_FONT = 'Instrument Serif';

const requireServerEnv = (key: string) => {
  const value = process.env[key];
  if (!value) {
    throw new Error(`Missing required server env: ${key}`);
  }
  return value;
};

const getSupabaseServer = () => {
  const supabaseUrl = requireServerEnv('SUPABASE_URL');
  const supabaseKey = process.env.SUPABASE_SERVICE_ROLE_KEY || process.env.SUPABASE_ANON_KEY;

  if (!supabaseKey) {
    throw new Error('Missing required server env: SUPABASE_SERVICE_ROLE_KEY or SUPABASE_ANON_KEY');
  }

  return createClient(supabaseUrl, supabaseKey, {
    auth: {
      persistSession: false,
      autoRefreshToken: false,
      detectSessionInUrl: false,
    },
  });
};

const serializeError = (error: unknown) => {
  if (error instanceof Error) {
    return {
      message: error.message,
      name: error.name,
      stack: error.stack,
    };
  }

  return {
    message: typeof error === 'string' ? error : 'Unknown serverless error',
    value: error,
  };
};

const getUniqueColors = (colors: Array<string | null | undefined>) =>
  Array.from(new Set(colors.filter((color): color is string => Boolean(color))));

const hexToRgb = (hex: string) => {
  const normalized = hex.replace('#', '').trim();
  const value = normalized.length === 3
    ? normalized.split('').map((char) => char + char).join('')
    : normalized;

  const parsed = Number.parseInt(value, 16);
  if (Number.isNaN(parsed)) {
    return null;
  }

  return {
    r: (parsed >> 16) & 255,
    g: (parsed >> 8) & 255,
    b: parsed & 255,
  };
};

const getLuminance = (hex: string) => {
  const rgb = hexToRgb(hex);
  if (!rgb) return 0;
  const [r, g, b] = [rgb.r, rgb.g, rgb.b].map((channel) => {
    const value = channel / 255;
    return value <= 0.03928 ? value / 12.92 : ((value + 0.055) / 1.055) ** 2.4;
  });
  return 0.2126 * r + 0.7152 * g + 0.0722 * b;
};

const getContrastTextColor = (background: string, white = DEFAULT_WHITE, black = DEFAULT_BLACK) =>
  getLuminance(background) > 0.42 ? black : white;

const normalizeFontFamilyName = (value?: string | null) =>
  (value || '').toLowerCase().replace(/[^a-z0-9]/g, '');

const resolveFontPreference = (preferred: string | null | undefined, fonts: Array<{ family: string; name: string }>) => {
  const normalized = normalizeFontFamilyName(preferred);
  const exactMatch = fonts.find((font) => normalizeFontFamilyName(font.family) === normalized);
  if (exactMatch) return exactMatch.family;

  const softMatch = fonts.find((font) =>
    normalizeFontFamilyName(font.family).includes(normalized)
    || normalized.includes(normalizeFontFamilyName(font.family)),
  );

  return softMatch?.family || preferred || DEFAULT_PRIMARY_FONT;
};

const createBrandThemeFromPreset = (preset: {
  colors?: string[];
  font_padrao?: string;
  font_destaque?: string;
}) => {
  const palette = getUniqueColors(preset.colors || []);
  const background = palette[0] || DEFAULT_BACKGROUND;
  const accent = palette[2] || palette[1] || palette[0] || DEFAULT_ACCENT;
  const white = DEFAULT_WHITE;
  const black = DEFAULT_BLACK;
  const text = getContrastTextColor(background, white, black);

  return {
    background,
    text,
    accent,
    cardBg: accent,
    hlBgColor: accent,
    white,
    black,
    fontPadrao: preset.font_padrao || DEFAULT_PRIMARY_FONT,
    fontDestaque: preset.font_destaque || DEFAULT_SECONDARY_FONT,
  };
};

const getBrandPaletteSwatches = (theme: {
  background: string;
  text: string;
  accent: string;
  hlBgColor: string;
  cardBg: string;
  white: string;
  black: string;
}) => getUniqueColors([
  theme.background,
  theme.text,
  theme.accent,
  theme.hlBgColor,
  theme.cardBg,
  theme.white,
  theme.black,
]);

const isFontAsset = (asset: any) => {
  const category = String(asset?.category || '').toLowerCase();
  const name = String(asset?.name || '').toLowerCase();
  const type = String(asset?.file_type || '').toLowerCase();

  return (
    category.includes('font')
    || type.includes('font')
    || type.includes('ttf')
    || type.includes('otf')
    || type.includes('woff')
    || name.endsWith('.ttf')
    || name.endsWith('.otf')
    || name.endsWith('.woff')
    || name.endsWith('.woff2')
  );
};

export default async function handler(_req: any, res: any) {
  try {
    const supabase = getSupabaseServer();
    const [{ data: clients, error: clientsError }, { data: colors, error: colorsError }, { data: assets, error: assetsError }] = await Promise.all([
      supabase.from('clients').select('*'),
      supabase.from('client_colors').select('*'),
      supabase.from('client_assets').select('*'),
    ]);

    if (clientsError) throw clientsError;
    if (colorsError) throw colorsError;
    if (assetsError) throw assetsError;

    const fonts = (assets || [])
      .filter(isFontAsset)
      .filter((asset: any) => asset?.id && asset?.name && asset?.url)
      .map((asset: any) => {
        const rawName = String(asset.name).split('.')[0];
        return {
          id: asset.id,
          name: rawName,
          family: rawName.trim(),
          url: asset.url,
        };
      });

    const presets = (clients || []).map((client: any) => {
      const paletteColors = (colors || [])
        .filter((color: any) => color.client_id === client.id)
        .map((color: any) => color.hex)
        .filter(Boolean);

      while (paletteColors.length < 5) {
        paletteColors.push(paletteColors[0] || '#000000');
      }

      const preferences = client?.preferences && typeof client.preferences === 'object' ? client.preferences : {};
      const imageSettings = client?.image_settings && typeof client.image_settings === 'object' ? client.image_settings : {};

      const fontPadrao = resolveFontPreference(
        String((preferences as any).font_padrao || (imageSettings as any).font_padrao || DEFAULT_PRIMARY_FONT),
        fonts,
      );
      const fontDestaque = resolveFontPreference(
        String((preferences as any).font_destaque || (imageSettings as any).font_destaque || DEFAULT_SECONDARY_FONT),
        fonts,
      );

      const theme = createBrandThemeFromPreset({
        colors: paletteColors,
        font_padrao: fontPadrao,
        font_destaque: fontDestaque,
      });

      return {
        id: client.id,
        name: client.name || 'Cliente Sem Nome',
        colors: getBrandPaletteSwatches(theme),
        font_padrao: fontPadrao,
        font_destaque: fontDestaque,
        profile_picture: client.profile_picture,
        instagram: client.instagram,
        defaults: {
          bg: theme.background,
          accent: theme.accent,
          text: theme.text,
          cardBg: theme.cardBg,
          hlBgColor: theme.hlBgColor,
        },
      };
    });

    res.status(200).json({
      clients: presets,
      fonts,
    });
  } catch (error: any) {
    console.error('API Error:', error);
    res.status(500).json({
      error: error?.message || 'Internal Server Error',
      details: serializeError(error),
    });
  }
}
