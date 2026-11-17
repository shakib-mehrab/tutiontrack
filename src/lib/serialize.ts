/**
 * Recursively converts Firestore Timestamps and Dates into ISO strings so API
 * responses are plain JSON.
 */
export function serializeTimestamps<T = unknown>(obj: T): T {
  return walk(obj) as T;
}

function walk(obj: unknown): unknown {
  if (obj === null || obj === undefined) return obj;
  if (obj instanceof Date) return obj.toISOString();

  if (typeof obj === 'object') {
    const ts = obj as Record<string, unknown>;
    if (typeof ts.toDate === 'function') {
      return (ts.toDate as () => Date)().toISOString();
    }
    if (ts._seconds !== undefined || (ts.seconds !== undefined && ts.nanoseconds !== undefined)) {
      const seconds = (ts._seconds ?? ts.seconds) as number;
      return new Date(seconds * 1000).toISOString();
    }
    if (Array.isArray(obj)) return obj.map(walk);

    const out: Record<string, unknown> = {};
    for (const key of Object.keys(ts)) out[key] = walk(ts[key]);
    return out;
  }

  return obj;
}
