// Small fetch helpers for SWR and mutations. Errors carry the API's message.

export class ApiError extends Error {
  constructor(message: string, public status: number) {
    super(message);
  }
}

async function parse(res: Response) {
  let body: unknown = null;
  try {
    body = await res.json();
  } catch {
    // empty body
  }
  if (!res.ok || (body && typeof body === 'object' && 'success' in body && body.success === false)) {
    const b = (body ?? {}) as { message?: string; error?: string };
    throw new ApiError(b.message || b.error || `Request failed (${res.status})`, res.status);
  }
  return body;
}

export const fetcher = async <T>(url: string): Promise<T> => (await parse(await fetch(url))) as T;

export async function send<T = { success: boolean; message?: string }>(
  url: string,
  method: 'POST' | 'PATCH' | 'PUT' | 'DELETE',
  body?: unknown
): Promise<T> {
  const res = await fetch(url, {
    method,
    headers: body === undefined ? undefined : { 'Content-Type': 'application/json' },
    body: body === undefined ? undefined : JSON.stringify(body),
  });
  return (await parse(res)) as T;
}

export function errorMessage(e: unknown, fallback = 'Something went wrong. Please try again.'): string {
  return e instanceof Error && e.message ? e.message : fallback;
}
