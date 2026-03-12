import express from 'express';
import { createServer as createViteServer } from 'vite';
import path from 'path';
import { fileURLToPath } from 'url';
import { fetchBrandingResponse, fetchClientResponse } from './utils/branding-api.ts';

const __dirname = path.dirname(fileURLToPath(import.meta.url));

async function startServer() {
  const app = express();
  const PORT = 3000;

  // API Route to fetch branding data
  app.get('/api/branding', async (req, res) => {
    try {
      res.json(await fetchBrandingResponse());
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
      res.json(await fetchClientResponse(req.params.id));
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
