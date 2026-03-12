import express from 'express';
import { createServer as createViteServer } from 'vite';
import { supabase } from './services/supabase';
import path from 'path';
import { fileURLToPath } from 'url';
import { createBrandThemeFromPreset, getBrandPaletteSwatches, resolveFontPreference } from './utils/branding';

const __dirname = path.dirname(fileURLToPath(import.meta.url));

async function startServer() {
  const app = express();
  const PORT = 3000;

  // API Route to fetch branding data
  app.get('/api/branding', async (req, res) => {
    try {
      // 1. Fetch Clients
      const { data: clients, error: clientsError } = await supabase
        .from('clients')
        .select('*');
      if (clientsError) throw clientsError;

      // 2. Fetch Colors
      const { data: colors, error: colorsError } = await supabase
        .from('client_colors')
        .select('*');
      if (colorsError) throw colorsError;

      // 3. Fetch Assets (Fonts) - Fetch all and filter in code to be safe
      const { data: allAssets, error: assetsError } = await supabase
        .from('client_assets')
        .select('*');
      
      if (assetsError) throw assetsError;

      // Filter for fonts
      const fontAssets = (allAssets || []).filter(asset => {
        const cat = (asset.category || '').toLowerCase();
        const name = (asset.name || '').toLowerCase();
        const type = (asset.file_type || '').toLowerCase();
        
        return cat.includes('font') || 
               type.includes('font') || 
               type.includes('ttf') || 
               type.includes('otf') || 
               type.includes('woff') ||
               name.endsWith('.ttf') || 
               name.endsWith('.otf') || 
               name.endsWith('.woff') || 
               name.endsWith('.woff2');
      });

      console.log(`Found ${fontAssets.length} font assets out of ${allAssets?.length} total assets.`);

      // Process Fonts
      const fetchedFonts = fontAssets
        .filter(a => a.url && a.name)
        .map(asset => {
          // Clean up the name but keep spaces for readability. 
          // We now quote font names in CSS, so spaces are safe.
          const rawName = asset.name!.split('.')[0];
          const cleanFamily = rawName.trim(); 
          return {
            id: asset.id,
            name: rawName, // Keep original name for display label
            family: cleanFamily,
            url: asset.url!
          };
        });

      // Process Presets
      const clientPresets = clients.map(client => {
        const clientColors = colors.filter(c => c.client_id === client.id);
        const paletteColors = clientColors.map(c => c.hex).filter(Boolean) as string[];
        
        while (paletteColors.length < 5) {
           paletteColors.push(paletteColors[0] || '#000000');
        }

        const prefs = client.preferences as any || {};
        const settings = client.image_settings as any || {};
        
        const fontPadrao = resolveFontPreference(
          prefs.font_padrao || settings.font_padrao || 'Inter',
          fetchedFonts,
        );
        const fontDestaque = resolveFontPreference(
          prefs.font_destaque || settings.font_destaque || 'Instrument Serif',
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

      res.json({
        clients: clientPresets,
        fonts: fetchedFonts
      });

    } catch (error: any) {
      console.error('API Error:', error);
      res.status(500).json({ 
        error: error.message || 'Internal Server Error',
        details: error 
      });
    }
  });

  app.get('/api/client/:id', async (req, res) => {
    try {
      const { id } = req.params;
      const { data: client, error } = await supabase
        .from('clients')
        .select('id, name, profile_picture, instagram')
        .eq('id', id)
        .single();

      if (error) throw error;

      res.json(client);
    } catch (error: any) {
      console.error('Client API Error:', error);
      res.status(500).json({
        error: error.message || 'Internal Server Error',
        details: error,
      });
    }
  });

  // Vite middleware for development
  if (process.env.NODE_ENV !== 'production') {
    const vite = await createViteServer({
      server: { middlewareMode: true },
      appType: 'spa',
    });
    app.use(vite.middlewares);
  } else {
    // Production: Serve static files from dist
    app.use(express.static(path.resolve(__dirname, 'dist')));
    app.get('*', (req, res) => {
      res.sendFile(path.resolve(__dirname, 'dist', 'index.html'));
    });
  }

  app.listen(PORT, '0.0.0.0', () => {
    console.log(`Server running on http://localhost:${PORT}`);
  });
}

startServer();
