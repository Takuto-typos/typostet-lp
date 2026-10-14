// POST /api/drops/:id/signup
// Accepts JSON or form-encoded. JSON clients get JSON; plain HTML form posts
// get a 303 redirect back to the top page with ?signup=... (see functions/README.md).

import { getCounts, getDrop, housekeep, insertSignup, isRateLimited, receiptMail, SignupError } from '../../../_lib/drops.js';
import { sendMails } from '../../../_lib/mail.js';
import { validateSignup } from '../../../_lib/validate.js';
import { background, isValidDropId, json, nowSec } from '../../../_lib/util.js';

const MAX_BODY = 8 * 1024;

async function readBody(request) {
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

function wantsJson(request) {
  const type = (request.headers.get('content-type') || '').toLowerCase();
  const accept = (request.headers.get('accept') || '').toLowerCase();
  return type.includes('application/json') || accept.includes('application/json');
}

export async function onRequestPost(context) {
  const { request, env, params } = context;
  const id = params.id;
  const asJson = wantsJson(request);
  const now = nowSec();

  const respond = (status, payload) => {
    if (asJson) return json(payload, status);
    const q = payload.ok
      ? `signup=${encodeURIComponent(payload.state)}&n=${encodeURIComponent(payload.state === 'waiting' ? payload.waiting_rank : payload.position)}`
      : `signup=error&reason=${encodeURIComponent(payload.error)}`;
    return new Response(null, { status: 303, headers: { location: `/?${q}#drop`, 'cache-control': 'no-store' } });
  };

  if (!isValidDropId(id)) return respond(404, { ok: false, error: 'not_found', message: 'このドロップは見つかりません。' });

  const ip = request.headers.get('cf-connecting-ip') || '';
  if (await isRateLimited(env.DB, ip, now)) {
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

  let result;
  try {
    result = await insertSignup(env.DB, drop, v.value, now);
  } catch (err) {
    if (err instanceof SignupError) return respond(err.status, { ok: false, error: err.code, message: err.message });
    console.error('signup insert failed:', err?.message || err);
    return respond(500, { ok: false, error: 'server_error', message: '申込みを保存できませんでした。時間をおいてもう一度お試しください。' });
  }

  const { signup, waitingRank } = result;

  // Apply transitions now (e.g. this was #20 -> status paying + invites),
  // send all emails in the background.
  const hk = await housekeep(env, id, now);
  const mails = [receiptMail(env, hk.drop || drop, signup, { waitingRank }), ...hk.mails];
  await background(context, sendMails(env, mails));

  const counts = await getCounts(env.DB, id);
  return respond(201, {
    ok: true,
    state: signup.state,
    position: signup.position,
    waiting_rank: waitingRank,
    count: Math.min(counts.active, drop.cap),
    cap: drop.cap,
    waiting: counts.waiting,
    status: hk.drop?.status || drop.status,
    message:
      signup.state === 'waiting'
        ? `補欠の${waitingRank}番目で受け付けました。確認のメールをお送りしました。`
        : `${signup.position}番目で受け付けました。確認のメールをお送りしました。`,
  });
}
