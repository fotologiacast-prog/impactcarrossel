import { fetchBrandingResponse } from '../utils/branding-api.ts';

export default async function handler(_req: any, res: any) {
  try {
    res.status(200).json(await fetchBrandingResponse());
  } catch (error: any) {
    console.error('API Error:', error);
    res.status(500).json({
      error: error?.message || 'Internal Server Error',
      details: error,
    });
  }
}
