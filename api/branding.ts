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

export default async function handler(_req: any, res: any) {
  try {
    const { fetchBrandingResponse } = await import('../utils/branding-api.ts');
    res.status(200).json(await fetchBrandingResponse());
  } catch (error: any) {
    console.error('API Error:', error);
    res.status(500).json({
      error: error?.message || 'Internal Server Error',
      details: serializeError(error),
    });
  }
}
