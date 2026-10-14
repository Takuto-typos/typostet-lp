// Small shared helpers. No dependencies.

export const DAY = 24 * 60 * 60;
export const PAY_WINDOW = 7 * DAY; // 支払い期限 = 案内から7日

export function nowSec() {
  return Math.floor(Date.now() / 1000);
}

export function json(data, status = 200, headers = {}) {
  return new Response(JSON.stringify(data), {
    status,
    headers: {
      'content-type': 'application/json; charset=utf-8',
      'cache-control': 'no-store',
      ...headers,
    },
  });
}

export function html(body, status = 200, headers = {}) {
  return new Response(body, {
    status,
    headers: {
      'content-type': 'text/html; charset=utf-8',
      'cache-control': 'no-store',
      'x-robots-tag': 'noindex, nofollow',
      'referrer-policy': 'no-referrer',
      ...headers,
    },
  });
}

const HTML_ESCAPES = { '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;', "'": '&#39;' };
export function escapeHtml(value) {
  if (value === null || value === undefined) return '';
  return String(value).replace(/[&<>"']/g, (c) => HTML_ESCAPES[c]);
}

/** URL-safe random token. 24 bytes = 192 bits. */
export function randomToken(bytes = 24) {
  const buf = new Uint8Array(bytes);
  crypto.getRandomValues(buf);
  let bin = '';
  for (const b of buf) bin += String.fromCharCode(b);
  return btoa(bin).replace(/\+/g, '-').replace(/\//g, '_').replace(/=+$/, '');
}

export async function sha256Hex(text) {
  const digest = await crypto.subtle.digest('SHA-256', new TextEncoder().encode(text));
  return [...new Uint8Array(digest)].map((b) => b.toString(16).padStart(2, '0')).join('');
}

/** Constant-time comparison of two strings (compares SHA-256 digests so length leaks nothing). */
export async function safeEqual(a, b) {
  if (typeof a !== 'string' || typeof b !== 'string') return false;
  const enc = new TextEncoder();
  const [da, db] = await Promise.all([
    crypto.subtle.digest('SHA-256', enc.encode(a)),
    crypto.subtle.digest('SHA-256', enc.encode(b)),
  ]);
  const x = new Uint8Array(da);
  const y = new Uint8Array(db);
  let diff = 0;
  for (let i = 0; i < x.length; i++) diff |= x[i] ^ y[i];
  return diff === 0;
}

/** "taro@example.com" -> "t***@example.com" for logs. */
export function maskEmail(email) {
  const s = String(email || '');
  const at = s.indexOf('@');
  if (at < 1) return '***';
  return `${s[0]}***${s.slice(at)}`;
}

/** epoch seconds -> "2026年11月30日 23:59" (JST). */
export function formatJst(sec) {
  if (sec === null || sec === undefined) return '';
  const d = new Date((Number(sec) + 9 * 3600) * 1000);
  const p = (n) => String(n).padStart(2, '0');
  return `${d.getUTCFullYear()}年${d.getUTCMonth() + 1}月${d.getUTCDate()}日 ${p(d.getUTCHours())}:${p(d.getUTCMinutes())}`;
}

/** epoch seconds -> "2026-11-30T23:59:59+09:00". */
export function isoJst(sec) {
  if (sec === null || sec === undefined) return null;
  const d = new Date((Number(sec) + 9 * 3600) * 1000);
  return d.toISOString().replace(/\.\d{3}Z$/, '+09:00');
}

export function yen(n) {
  return `¥${Number(n).toLocaleString('en-US')}`;
}

export function siteUrl(env) {
  return String(env.SITE_URL || 'https://typostet.com').replace(/\/+$/, '');
}

export function isValidDropId(id) {
  return typeof id === 'string' && /^[a-z0-9-]{1,40}$/.test(id);
}

export function isValidToken(token) {
  return typeof token === 'string' && /^[A-Za-z0-9_-]{20,64}$/.test(token);
}

/** Run promise in background if waitUntil exists, else await it. */
export async function background(ctx, promise) {
  const guarded = Promise.resolve(promise).catch((err) => console.error('background task failed:', err?.message || err));
  if (ctx && typeof ctx.waitUntil === 'function') ctx.waitUntil(guarded);
  else await guarded;
}
