// GET  /confirm/:token -> page with a button (mail scanners that open links don't confirm anyone)
// POST /confirm/:token -> step 2 of a signup: count it, give it its position, send the receipt.
// A JSON client (Accept: application/json) gets the same shape the old one-step signup returned.

import { confirmSignup, findPending, SignupError } from '../_lib/drops.js';
import { sendMails } from '../_lib/mail.js';
import { messagePage } from '../_lib/page.js';
import { background, escapeHtml, html, isValidToken, json, nowSec } from '../_lib/util.js';

function gone() {
  return html(
    messagePage({
      title: 'このリンクは使えません',
      lines: [
        '有効期限(24時間)が過ぎたか、もう申込みを確定済みです。',
        '確定済みなら、受付のメールが届いています。届いていない場合は、もう一度申し込んでください。',
      ],
      linkHref: '/#join',
      linkLabel: '申込みのページへ',
    }),
    410,
  );
}

function buttonPage(token) {
  const form = `<form method="post" action="/confirm/${escapeHtml(token)}" style="margin-top:24px">
      <button type="submit" style="font:inherit;font-weight:700;padding:12px 24px;border:0;background:#92E5BD;color:#0c0c0c;border-radius:999px;cursor:pointer">申込みを確定する</button>
    </form>
    `;
  const page = messagePage({
    title: '申込みを確定します',
    lines: ['下のボタンを押すと、申込みが確定して順番が決まります。', '今の時点でお金はかかりません。'],
  });
  return page.replace('<p style="margin-top:32px">', `${form}<p style="margin-top:32px">`);
}

export async function onRequestGet({ env, params }) {
  const token = params.token;
  if (!isValidToken(token)) return gone();
  const pending = await findPending(env.DB, token, nowSec());
  if (!pending) return gone();
  return html(buttonPage(token));
}

export async function onRequestPost(context) {
  const { request, env, params } = context;
  const asJson = (request.headers.get('accept') || '').toLowerCase().includes('application/json');
  const token = params.token;
  const now = nowSec();

  const fail = (status, error, message) =>
    asJson
      ? json({ ok: false, error, message }, status)
      : html(messagePage({ title: '申込みを確定できませんでした', lines: [message] }), status);

  if (!isValidToken(token)) return asJson ? fail(410, 'gone', 'このリンクは使えません。') : gone();
  const pending = await findPending(env.DB, token, now);
  if (!pending) return asJson ? fail(410, 'gone', 'このリンクは使えません。') : gone();

  let r;
  try {
    r = await confirmSignup(env, pending, now);
  } catch (err) {
    if (err instanceof SignupError) return fail(err.status, err.code, err.message);
    console.error('signup confirm failed:', err?.message || err);
    return fail(500, 'server_error', '申込みを確定できませんでした。時間をおいて、もう一度メールのリンクを開いてください。');
  }
  await background(context, sendMails(env, r.mails));

  const { signup, waitingRank, drop, counts } = r;
  const message =
    signup.state === 'invited'
      ? `${drop.cap}人そろいました。お支払いのご案内をメールでお送りしました。`
      : signup.state === 'waiting'
        ? `補欠の${waitingRank}番目で申込みが確定しました。確認のメールをお送りしました。`
        : `${signup.position}番目で申込みが確定しました。確認のメールをお送りしました。`;

  if (asJson) {
    return json(
      {
        ok: true,
        state: signup.state,
        position: signup.position,
        waiting_rank: waitingRank,
        count: Math.min(counts.active, drop.cap),
        cap: drop.cap,
        waiting: counts.waiting,
        status: drop.status,
        message,
      },
      201,
    );
  }

  const lines =
    signup.state === 'invited'
      ? [message, 'メールのリンクから、7日以内にお支払いをお願いします。']
      : signup.state === 'waiting'
        ? [
            message,
            `今は${drop.cap}人の枠が埋まっています。お支払いの期限までに払わなかった方が出たら、順番にメールでご案内します。`,
            '繰り上げにならなかった場合、お金は一切かかりません。',
          ]
        : [message, `${drop.cap}人そろったら、お支払いのご案内をお送りします。今の時点でお金はかかりません。`];
  const title = signup.state === 'waiting' ? '補欠で申込みが確定しました' : '申込みが確定しました';
  return html(messagePage({ title, lines }));
}
