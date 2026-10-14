// POST /api/subscribe — 新着 stet を受け取る
// Accepts JSON or form-encoded { email, website (honeypot), source? }.
// JSON clients get JSON; plain HTML form posts get a 303 back to /?subscribe=ok#news (or =error).
// The answer is the same whether or not the address was already on the list.

import { isRateLimited } from '../_lib/drops.js';
import { sendMails } from '../_lib/mail.js';
import { readBody, wantsJson } from '../_lib/request.js';
import { subscribe, validateSubscribe } from '../_lib/subscribers.js';
import { background, json, nowSec } from '../_lib/util.js';

export const SUBSCRIBED_MESSAGE = '登録しました。新しいデザインが出たら、このアドレスにお知らせします。';

export async function onRequestPost(context) {
  const { request, env } = context;
  const asJson = wantsJson(request);
  const now = nowSec();

  const respond = (status, payload) => {
    if (asJson) return json(payload, status);
    const q = payload.ok ? 'subscribe=ok' : 'subscribe=error';
    return new Response(null, { status: 303, headers: { location: `/?${q}#news`, 'cache-control': 'no-store' } });
  };

  // Separate bucket from the signup limit (same 5 per 10 minutes rule).
  const ip = request.headers.get('cf-connecting-ip') || '';
  if (await isRateLimited(env.DB, `subscribe:${ip}`, now)) {
    return respond(429, {
      ok: false,
      error: 'rate_limited',
      message: '短い時間に送信が続いています。10分ほどおいてもう一度お試しください。',
    });
  }

  const body = await readBody(request);
  if (!body) return respond(400, { ok: false, error: 'bad_request', message: '送信内容を読み取れませんでした。' });

  const v = validateSubscribe(body);
  if (!v.ok) {
    if (v.honeypot) return respond(400, { ok: false, error: 'bad_request', message: '送信できませんでした。' });
    return respond(422, { ok: false, error: 'invalid', message: 'メールアドレスを確認してください。' });
  }

  let result;
  try {
    result = await subscribe(env, v.value, now);
  } catch (err) {
    console.error('subscribe failed:', err?.message || err);
    return respond(500, { ok: false, error: 'server_error', message: '登録できませんでした。時間をおいてもう一度お試しください。' });
  }

  if (result.mail) await background(context, sendMails(env, [result.mail]));
  return respond(200, { ok: true, message: SUBSCRIBED_MESSAGE });
}
