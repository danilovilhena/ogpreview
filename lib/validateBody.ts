import { NextRequest } from 'next/server';
import { z } from 'zod';

export const validateBody = async (
  requestSchema: z.ZodSchema,
  request: NextRequest,
): Promise<{ success: boolean; error?: string; body?: z.infer<typeof requestSchema>; status?: number }> => {
  let body;

  try {
    body = await request.json();
  } catch {
    return { success: false, error: 'Invalid request body', status: 400 };
  }

  const { success, data, error } = requestSchema.safeParse(body);
  if (!success) {
    return { success: false, error: `Validation error: ${error.issues.map((i) => i.message).join(', ')}`, status: 400 };
  }

  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  if (typeof data === 'object' && data !== null && 'key' in data && (data as any).key !== process.env.SCRAPE_SECRET) {
    return { success: false, error: 'Forbidden: Invalid authentication key', status: 403 };
  }

  return { success: true, body: data };
};
