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

export default async function handler(req: any, res: any) {
  try {
    const { fetchClientResponse } = await import('../../utils/branding-api');
    res.status(200).json(await fetchClientResponse(String(req.query.id || '')));
  } catch (error: any) {
    console.error('Client API Error:', error);
    res.status(500).json({
      error: error?.message || 'Internal Server Error',
      details: serializeError(error),
    });
  }
}
