// GET /pay/:token
// invited & within 7 days -> create (or reuse) a Stripe Checkout Session and 303 to it.
// Otherwise explain the situation in a small Japanese page.

import { getDrop } from '../_lib/drops.js';
import { messagePage } from '../_lib/page.js';
import { calcPrice, describeChoice } from '../_lib/pricing.js';
import { createCheckoutSession } from '../_lib/stripe.js';
import { DAY, html, isValidToken, nowSec, PAY_WINDOW, siteUrl } from '../_lib/util.js';

const STRIPE_MIN_EXPIRY = 30 * 60 + 60; // Stripe requires >= 30 min; add 1 min of slack.

const PAGES = {
  not_found: {
    status: 404,
    title: 'このリンクは見つかりません',
    lines: ['リンクが途中で切れていないか、メールのリンクをもう一度確かめてください。'],
  },
  paid: {
    status: 200,
    title: 'お支払いは済んでいます',
    lines: ['お支払いを確認済みです。ありがとうございます。', '製作と発送の流れは、メールでお知らせします。'],
  },
  expired: {
    status: 410,
    title: 'お支払い期限が過ぎました',
    lines: ['お支払い期限が過ぎたため、この申込みは取り消しになりました。', 'お金は一切いただいていません。'],
  },
  waiting: {
    status: 200,
    title: 'まだ補欠です',
    lines: ['今は補欠として受け付けています。', '繰り上げになったら、メールでお支払いのご案内をお送りします。'],
  },
  reserved: {
    status: 200,
    title: 'まだ人数がそろっていません',
    lines: ['申込みは受け付けています。', '人数がそろったら、メールでお支払いのご案内をお送りします。今はお金はかかりません。'],
  },
  cancelled: {
    status: 410,
    title: 'このドロップは中止になりました',
    lines: ['締め切りまでに人数がそろわなかったため、中止になりました。', 'お金は一切いただいていません。'],
  },
  full: {
    status: 410,
    title: '30着そろいました',
    lines: ['このドロップは、ほかの方のお支払いで枠が埋まりました。', 'お金は一切いただいていません。'],
  },
  error: {
    status: 502,
    title: 'お支払いのページを開けませんでした',
    lines: ['時間をおいて、もう一度メールのリンクを開いてください。', '続くようでしたら、メールに返信してお知らせください。'],
  },
};

function page(key) {
  const p = PAGES[key];
  return html(messagePage({ title: p.title, lines: p.lines }), p.status);
}

export async function onRequestGet(context) {
  const { env, params } = context;
  const token = params.token;
  if (!isValidToken(token)) return page('not_found');

  const s = await env.DB.prepare('SELECT * FROM signups WHERE token = ?').bind(token).first();
  if (!s) return page('not_found');
  if (s.state !== 'invited') return page(PAGES[s.state] ? s.state : 'not_found');

  const now = nowSec();
  const due = Number(s.invited_at) + PAY_WINDOW;
  if (due <= now) return page('expired');

  const drop = await getDrop(env.DB, s.drop_id);
  if (!drop) return page('not_found');
  if (drop.status === 'cancelled') return page('cancelled');
  if (drop.status === 'made') return page('full');

  // Reuse an open session so repeated clicks don't create parallel checkouts.
  if (s.checkout_url && Number(s.checkout_expires_at) > now + 120) {
    return new Response(null, { status: 303, headers: { location: s.checkout_url, 'cache-control': 'no-store' } });
  }

  const price = calcPrice(drop, s);
  const expiresAt = Math.max(Math.min(due, now + DAY), now + STRIPE_MIN_EXPIRY);
  const base = siteUrl(env);

  let session;
  try {
    session = await createCheckoutSession(env, {
      mode: 'payment',
      locale: 'ja',
      customer_email: s.email,
      client_reference_id: s.token,
      expires_at: expiresAt,
      success_url: `${base}/thank-you.html`,
      cancel_url: `${base}/`,
      line_items: [
        {
          quantity: 1,
          price_data: {
            currency: 'jpy',
            unit_amount: price.item,
            product_data: {
              name: `${drop.name}(${describeChoice(s)})`,
              description: `${drop.cap}枚限定・再販なし`,
            },
          },
        },
      ],
      shipping_address_collection: { allowed_countries: ['JP'] },
      shipping_options: [
        {
          shipping_rate_data: {
            type: 'fixed_amount',
            display_name: '送料(全国一律)',
            fixed_amount: { amount: price.shipping, currency: 'jpy' },
          },
        },
      ],
      phone_number_collection: { enabled: true },
      metadata: { signup_id: String(s.id), drop_id: s.drop_id },
      payment_intent_data: { metadata: { signup_id: String(s.id), drop_id: s.drop_id } },
    });
  } catch (err) {
    console.error('checkout session create failed:', err?.message || err, `signup=${s.id}`);
    return page('error');
  }

  await env.DB.prepare(
    "UPDATE signups SET stripe_session_id = ?, checkout_url = ?, checkout_expires_at = ? WHERE id = ? AND state = 'invited'",
  )
    .bind(session.id, session.url, session.expires_at || expiresAt, s.id)
    .run();

  return new Response(null, { status: 303, headers: { location: session.url, 'cache-control': 'no-store' } });
}
