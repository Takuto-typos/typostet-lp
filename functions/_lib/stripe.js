// Minimal Stripe client over fetch + webhook signature verification (Web Crypto).

const STRIPE_API = 'https://api.stripe.com/v1';
export const SIGNATURE_TOLERANCE = 300; // seconds

/** Flatten nested objects/arrays into Stripe's form encoding: a[b][0][c]=v */
export function toForm(obj) {
  const params = new URLSearchParams();
  const walk = (value, key) => {
    if (value === undefined || value === null) return;
    if (Array.isArray(value)) {
      value.forEach((v, i) => walk(v, `${key}[${i}]`));
    } else if (typeof value === 'object') {
      for (const [k, v] of Object.entries(value)) walk(v, key ? `${key}[${k}]` : k);
    } else {
      params.append(key, String(value));
    }
  };
  walk(obj, '');
  return params;
}

export async function createCheckoutSession(env, params, fetchImpl = fetch) {
  if (!env.STRIPE_SECRET_KEY) throw new Error('STRIPE_SECRET_KEY is not set');
  const res = await fetchImpl(`${STRIPE_API}/checkout/sessions`, {
    method: 'POST',
    headers: {
      authorization: `Bearer ${env.STRIPE_SECRET_KEY}`,
      'content-type': 'application/x-www-form-urlencoded',
    },
    body: toForm(params).toString(),
  });
  const data = await res.json().catch(() => ({}));
  if (!res.ok) throw new Error(`stripe ${res.status}: ${data?.error?.message || 'unknown error'}`);
  return data;
}

function hexToBytes(hex) {
  if (!/^[0-9a-f]*$/i.test(hex) || hex.length % 2) return null;
  const out = new Uint8Array(hex.length / 2);
  for (let i = 0; i < out.length; i++) out[i] = parseInt(hex.substr(i * 2, 2), 16);
  return out;
}

function bytesEqual(a, b) {
  if (!a || !b || a.length !== b.length) return false;
  let diff = 0;
  for (let i = 0; i < a.length; i++) diff |= a[i] ^ b[i];
  return diff === 0;
}

export async function signPayload(secret, timestamp, payload) {
  const key = await crypto.subtle.importKey(
    'raw',
    new TextEncoder().encode(secret),
    { name: 'HMAC', hash: 'SHA-256' },
    false,
    ['sign'],
  );
  const sig = await crypto.subtle.sign('HMAC', key, new TextEncoder().encode(`${timestamp}.${payload}`));
  return [...new Uint8Array(sig)].map((b) => b.toString(16).padStart(2, '0')).join('');
}

/**
 * Verify a Stripe-Signature header.
 * @returns {Promise<boolean>}
 */
export async function verifyStripeSignature(payload, header, secret, nowSeconds, tolerance = SIGNATURE_TOLERANCE) {
  if (!header || !secret || typeof payload !== 'string') return false;
  let timestamp = null;
  const v1 = [];
  for (const part of String(header).split(',')) {
    const idx = part.indexOf('=');
    if (idx < 0) continue;
    const k = part.slice(0, idx).trim();
    const v = part.slice(idx + 1).trim();
    if (k === 't') timestamp = v;
    else if (k === 'v1') v1.push(v);
  }
  if (!timestamp || !/^\d+$/.test(timestamp) || !v1.length) return false;
  if (Math.abs(nowSeconds - Number(timestamp)) > tolerance) return false;

  const expected = hexToBytes(await signPayload(secret, timestamp, payload));
  let ok = false;
  for (const candidate of v1) {
    if (bytesEqual(expected, hexToBytes(candidate))) ok = true;
  }
  return ok;
}
