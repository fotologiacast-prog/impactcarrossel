import { getSupabaseServer } from '../services/supabase-server';
import type { Database, Json } from '../types_db';
import { createBrandThemeFromPreset, getBrandPaletteSwatches, resolveFontPreference } from './branding';

type ClientRow = Database['public']['Tables']['clients']['Row'];
type ClientColorRow = Database['public']['Tables']['client_colors']['Row'];
type ClientAssetRow = Database['public']['Tables']['client_assets']['Row'];

type FontAsset = {
  id: string;
  name: string;
  family: string;
  url: string;
};

const getUniqueColors = (colors: Array<string | null | undefined>) =>
  Array.from(new Set(colors.filter((color): color is string => Boolean(color))));

type BrandingResponse = {
  clients: Array<{
    id: string;
    name: string;
    colors: string[];
    font_padrao: string;
    font_destaque: string;
    profile_picture: string | null;
    instagram: string | null;
    defaults: {
      bg: string;
      accent: string;
      text: string;
      cardBg: string;
      hlBgColor: string;
    };
  }>;
  fonts: FontAsset[];
};

const readJsonObject = (value: Json | null | undefined): Record<string, unknown> => {
  if (!value || typeof value !== 'object' || Array.isArray(value)) {
    return {};
  }

  return value as Record<string, unknown>;
};

const readStringPreference = (
  source: Record<string, unknown>,
  keys: string[],
): string | undefined => {
  for (const key of keys) {
    const value = source[key];
    if (typeof value === 'string' && value.trim()) {
      return value.trim();
    }
  }

  return undefined;
};

const isFontAsset = (asset: ClientAssetRow): boolean => {
  const category = (asset.category || '').toLowerCase();
  const name = (asset.name || '').toLowerCase();
  const type = (asset.file_type || '').toLowerCase();

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

const toFontAssets = (assets: ClientAssetRow[]): FontAsset[] =>
  assets
    .filter(isFontAsset)
    .filter((asset): asset is ClientAssetRow & { id: string; name: string; url: string } => Boolean(asset.id && asset.name && asset.url))
    .map((asset) => {
      const rawName = asset.name.split('.')[0];
      return {
        id: asset.id,
        name: rawName,
        family: rawName.trim(),
        url: asset.url,
      };
    });

const getClientFontFallbacks = (assets: ClientAssetRow[], clientId: string) => {
  const uniqueFonts = new Map<string, FontAsset>();
  toFontAssets(assets.filter((asset) => asset.client_id === clientId)).forEach((font) => {
    const key = font.family.trim().toLowerCase();
    if (!uniqueFonts.has(key)) {
      uniqueFonts.set(key, font);
    }
  });

  const fonts = Array.from(uniqueFonts.values());

  return {
    primary: fonts[0]?.family,
    secondary: fonts[1]?.family || fonts[0]?.family,
  };
};

export const buildBrandingResponse = ({
  clients,
  colors,
  assets,
}: {
  clients: ClientRow[];
  colors: ClientColorRow[];
  assets: ClientAssetRow[];
}): BrandingResponse => {
  const fetchedFonts = toFontAssets(assets);

  const clientPresets = clients.map((client) => {
    const clientColors = colors.filter((color) => color.client_id === client.id);
    const paletteColors = clientColors.map((color) => color.hex).filter(Boolean) as string[];
    const fontFallbacks = getClientFontFallbacks(assets, client.id);

    while (paletteColors.length < 5) {
      paletteColors.push(paletteColors[0] || '#000000');
    }

    const prefs = readJsonObject(client.preferences);
    const settings = readJsonObject(client.image_settings);

    const fontPadrao = resolveFontPreference(
      readStringPreference(prefs, ['font_padrao', 'fontPadrao', 'fontPadrão', 'fonte_padrao', 'fontePadrao'])
        || readStringPreference(settings, ['font_padrao', 'fontPadrao', 'fontPadrão', 'fonte_padrao', 'fontePadrao'])
        || fontFallbacks.primary
        || 'Inter',
      fetchedFonts,
    );
    const fontDestaque = resolveFontPreference(
      readStringPreference(prefs, ['font_destaque', 'fontDestaque', 'fonte_destaque', 'fonteDestaque'])
        || readStringPreference(settings, ['font_destaque', 'fontDestaque', 'fonte_destaque', 'fonteDestaque'])
        || fontFallbacks.secondary
        || 'Instrument Serif',
      fetchedFonts,
    );

    const brandTheme = createBrandThemeFromPreset({
      id: client.id,
      name: client.name || 'Cliente Sem Nome',
      colors: paletteColors,
      font_padrao: fontPadrao,
      font_destaque: fontDestaque,
    }, fetchedFonts);

    return {
      id: client.id,
      name: client.name || 'Cliente Sem Nome',
      colors: getUniqueColors([
        ...paletteColors,
        ...getBrandPaletteSwatches(brandTheme),
      ]),
      font_padrao: fontPadrao,
      font_destaque: fontDestaque,
      profile_picture: client.profile_picture,
      instagram: client.instagram,
      defaults: {
        bg: brandTheme.background,
        accent: brandTheme.accent,
        text: brandTheme.text,
        cardBg: brandTheme.cardBg,
        hlBgColor: brandTheme.hlBgColor,
      },
    };
  });

  return {
    clients: clientPresets,
    fonts: fetchedFonts,
  };
};

export const buildClientResponse = (client: Pick<ClientRow, 'id' | 'name' | 'profile_picture' | 'instagram'>) => ({
  id: client.id,
  name: client.name,
  profile_picture: client.profile_picture,
  instagram: client.instagram,
});

export const fetchBrandingResponse = async (): Promise<BrandingResponse> => {
  const supabaseServer = getSupabaseServer();
  const [{ data: clients, error: clientsError }, { data: colors, error: colorsError }, { data: assets, error: assetsError }] = await Promise.all([
    supabaseServer.from('clients').select('*'),
    supabaseServer.from('client_colors').select('*'),
    supabaseServer.from('client_assets').select('*'),
  ]);

  if (clientsError) {
    throw clientsError;
  }
  if (colorsError) {
    throw colorsError;
  }
  if (assetsError) {
    throw assetsError;
  }

  return buildBrandingResponse({
    clients: clients || [],
    colors: colors || [],
    assets: assets || [],
  });
};

export const fetchClientResponse = async (id: string) => {
  const supabaseServer = getSupabaseServer();
  const { data: client, error } = await supabaseServer
    .from('clients')
    .select('id, name, profile_picture, instagram')
    .eq('id', id)
    .single();

  if (error) {
    throw error;
  }

  return buildClientResponse(client);
};
