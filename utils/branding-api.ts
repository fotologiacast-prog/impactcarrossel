import { getSupabaseServer } from '../services/supabase-server.ts';
import type { Database, Json } from '../types_db.ts';
import { createBrandThemeFromPreset, getBrandPaletteSwatches, resolveFontPreference } from './branding.ts';

type ClientRow = Database['public']['Tables']['clients']['Row'];
type ClientColorRow = Database['public']['Tables']['client_colors']['Row'];
type ClientAssetRow = Database['public']['Tables']['client_assets']['Row'];

type FontAsset = {
  id: string;
  name: string;
  family: string;
  url: string;
};

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

    while (paletteColors.length < 5) {
      paletteColors.push(paletteColors[0] || '#000000');
    }

    const prefs = readJsonObject(client.preferences);
    const settings = readJsonObject(client.image_settings);

    const fontPadrao = resolveFontPreference(
      String(prefs.font_padrao || settings.font_padrao || 'Inter'),
      fetchedFonts,
    );
    const fontDestaque = resolveFontPreference(
      String(prefs.font_destaque || settings.font_destaque || 'Instrument Serif'),
      fetchedFonts,
    );

    const brandTheme = createBrandThemeFromPreset({
      id: client.id,
      name: client.name || 'Cliente Sem Nome',
      colors: paletteColors,
      font_padrao: fontPadrao,
      font_destaque: fontDestaque,
    });

    return {
      id: client.id,
      name: client.name || 'Cliente Sem Nome',
      colors: getBrandPaletteSwatches(brandTheme),
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
