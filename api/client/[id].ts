import { fetchClientResponse } from '../../utils/branding-api.ts';

export default async function handler(req: any, res: any) {
  try {
    res.status(200).json(await fetchClientResponse(String(req.query.id || '')));
  } catch (error: any) {
    console.error('Client API Error:', error);
    res.status(500).json({
      error: error?.message || 'Internal Server Error',
      details: error,
    });
  }
}
