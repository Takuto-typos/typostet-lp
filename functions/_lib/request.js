// Request body helpers for the list endpoints (same rules as the signup endpoint).

const MAX_BODY = 8 * 1024;

/** JSON or form-encoded body -> plain object of strings; null if unreadable / too large. */
export async function readBody(request) {
  const len = Number(request.headers.get('content-length') || 0);
  if (len > MAX_BODY) return null;
  const type = (request.headers.get('content-type') || '').toLowerCase();
  try {
    if (type.includes('application/json')) {
      const text = await request.text();
      if (text.length > MAX_BODY) return null;
      const data = JSON.parse(text);
      return data && typeof data === 'object' && !Array.isArray(data) ? data : null;
    }
    if (type.includes('application/x-www-form-urlencoded') || type.includes('multipart/form-data')) {
      const form = await request.formData();
      const out = {};
      for (const [k, v] of form.entries()) if (typeof v === 'string') out[k] = v;
      return out;
    }
  } catch {
    return null;
  }
  return null;
}

export function wantsJson(request) {
  const type = (request.headers.get('content-type') || '').toLowerCase();
  const accept = (request.headers.get('accept') || '').toLowerCase();
  return type.includes('application/json') || accept.includes('application/json');
}
