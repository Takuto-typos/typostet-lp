// GET  /news/:token -> page with a 「登録する」 button (mail scanners that open links don't subscribe anyone)
// POST /news/:token -> confirm the address for 新着のお知らせ (or turn it back on after a stop)

import { messagePage } from '../_lib/page.js';
import { confirmSubscriber, findByToken } from '../_lib/subscribers.js';
import { escapeHtml, html, isValidToken, nowSec } from '../_lib/util.js';

function notFound() {
  return html(
    messagePage({ title: 'このリンクは使えません', lines: ['リンクが途中で切れていないか確かめてください。わからない場合は info@typostet.com までご連絡ください。'] }),
    404,
  );
}

function buttonPage(token) {
  const form = `<form method="post" action="/news/${escapeHtml(token)}" style="margin-top:24px">
      <button type="submit" style="font:inherit;font-weight:700;padding:12px 24px;border:0;background:#92E5BD;color:#0c0c0c;border-radius:999px;cursor:pointer">登録する</button>
    </form>
    `;
  const page = messagePage({
    title: '新着のお知らせに登録します',
    lines: ['下のボタンを押すと、新しいデザインが出たときに、このアドレスにお知らせが届きます。', '送るのは、新しいドロップが始まるときだけです。'],
  });
  return page.replace('<p style="margin-top:32px">', `${form}<p style="margin-top:32px">`);
}

const DONE = () =>
  html(
    messagePage({
      title: '登録しました',
      lines: ['新しいデザインが出たら、このアドレスにお知らせします。', '不要になったら、届いたメールの下のリンクから止められます。'],
    }),
  );

export async function onRequestGet({ env, params }) {
  const token = params.token;
  if (!isValidToken(token)) return notFound();
  const sub = await findByToken(env.DB, token);
  if (!sub) return notFound();
  if (sub.confirmed_at && !sub.unsubscribed_at) return DONE();
  return html(buttonPage(token));
}

export async function onRequestPost({ env, params }) {
  const token = params.token;
  if (!isValidToken(token)) return notFound();
  const sub = await confirmSubscriber(env.DB, token, nowSec());
  if (!sub) return notFound();
  return DONE();
}
