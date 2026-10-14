// GET  /unsubscribe/:token  -> confirm page with a POST button (link prefetchers / scanners don't unsubscribe anyone)
// POST /unsubscribe/:token  -> unsubscribe. Also the RFC 8058 one-click target
//                              (List-Unsubscribe-Post: List-Unsubscribe=One-Click); the body is not required.

import { messagePage } from '../_lib/page.js';
import { findByToken, unsubscribe } from '../_lib/subscribers.js';
import { escapeHtml, html, isValidToken, nowSec } from '../_lib/util.js';

function notFound() {
  return html(
    messagePage({ title: 'このリンクは使えません', lines: ['リンクが途中で切れていないか確かめてください。わからない場合は info@typostet.com までご連絡ください。'] }),
    404,
  );
}

/** messagePage + a POST button placed above the "back to top" link. */
function confirmPage(token) {
  const form = `<form method="post" action="/unsubscribe/${escapeHtml(token)}" style="margin-top:24px">
      <button type="submit" style="font:inherit;padding:10px 20px;border:1px solid #1a1a1a;background:#1a1a1a;color:#fff;border-radius:4px;cursor:pointer">配信を止める</button>
    </form>
    `;
  const page = messagePage({
    title: '新着のお知らせを止めますか',
    lines: ['下のボタンを押すと、TYP0stet からの新着のお知らせが届かなくなります。'],
  });
  return page.replace('<p style="margin-top:32px">', `${form}<p style="margin-top:32px">`);
}

export async function onRequestGet({ env, params }) {
  const token = params.token;
  if (!isValidToken(token)) return notFound();
  const sub = await findByToken(env.DB, token);
  if (!sub) return notFound();
  if (sub.unsubscribed_at) {
    return html(messagePage({ title: '配信は止まっています', lines: ['新着のお知らせは、もう届きません。'] }));
  }
  return html(confirmPage(token));
}

export async function onRequestPost({ env, params }) {
  const token = params.token;
  if (!isValidToken(token)) return notFound();
  const sub = await unsubscribe(env.DB, token, nowSec());
  if (!sub) return notFound();
  return html(
    messagePage({
      title: '配信を止めました',
      lines: ['新着のお知らせは、もう届きません。', 'また受け取りたくなったら、サイトからもう一度登録できます。'],
    }),
  );
}
