// POST /api/drops/:id/signup  (step 1 of 2)
// Accepts JSON or form-encoded. Checks the form, keeps it as a pending signup and mails a
// confirmation link. The signup is only counted (and gets its position) when the button on
// /confirm/:token is pressed, so nobody can fill the 30 slots with other people's addresses.
// The answer is the same for every valid address (no way to tell who has already signed up).
// JSON clients get JSON; plain HTML form posts get a 303 back to /?signup=pending#join.

import { getDrop, isRateLimited, savePending } from '../../../_lib/drops.js';
import { confirmSignupMail, sendMails } from '../../../_lib/mail.js';
import { readBody, wantsJson } from '../../../_lib/request.js';
import { validateSignup } from '../../../_lib/validate.js';
import { background, isValidDropId, json, nowSec } from '../../../_lib/util.js';

export const PENDING_MESSAGE = '確認のメールを送りました。メールのリンクから「申込みを確定する」を押すと、申込みが確定します。';

export async function onRequestPost(context) {
  const { request, env, params } = context;
  const id = params.id;
  const asJson = wantsJson(request);
  const now = nowSec();

  const respond = (status, payload) => {
    if (asJson) return json(payload, status);
    const q = payload.ok ? 'signup=pending' : `signup=error&reason=${encodeURIComponent(payload.error)}`;
    return new Response(null, { status: 303, headers: { location: `/?${q}#join`, 'cache-control': 'no-store' } });
  };

  if (!isValidDropId(id)) return respond(404, { ok: false, error: 'not_found', message: 'このドロップは見つかりません。' });

  const ip = request.headers.get('cf-connecting-ip') || '';
  if (await isRateLimited(env.DB, ip, now, env.ADMIN_KEY)) {
    return respond(429, {
      ok: false,
      error: 'rate_limited',
      message: '短い時間に申込みが続いています。10分ほどおいてもう一度お試しください。',
    });
  }

  const drop = await getDrop(env.DB, id);
  if (!drop) return respond(404, { ok: false, error: 'not_found', message: 'このドロップは見つかりません。' });
  if (drop.status === 'cancelled') {
    return respond(410, { ok: false, error: 'cancelled', message: 'このドロップは中止になりました。' });
  }
  if (drop.status === 'made' || drop.deadline <= now) {
    return respond(410, { ok: false, error: 'closed', message: 'このドロップの申込みは締め切りました。' });
  }

  const body = await readBody(request);
  if (!body) return respond(400, { ok: false, error: 'bad_request', message: '送信内容を読み取れませんでした。' });

  const v = validateSignup(body, drop);
  if (!v.ok) {
    if (v.honeypot) return respond(400, { ok: false, error: 'bad_request', message: '送信できませんでした。' });
    return respond(422, { ok: false, error: 'invalid', message: '入力内容を確認してください。', fields: v.fields });
  }

  let pending;
  try {
    pending = await savePending(env.DB, drop.id, v.value, now);
  } catch (err) {
    console.error('pending signup save failed:', err?.message || err);
    return respond(500, { ok: false, error: 'server_error', message: '申込みを保存できませんでした。時間をおいてもう一度お試しください。' });
  }

  await background(context, sendMails(env, [confirmSignupMail(env, drop, pending)]));
  return respond(202, { ok: true, state: 'pending', message: PENDING_MESSAGE });
}
