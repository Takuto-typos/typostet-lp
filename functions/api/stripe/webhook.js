// POST /api/stripe/webhook
// Events: checkout.session.completed (+ checkout.session.async_payment_succeeded)
// -> signup paid, thanks email; when all cap paid -> drop made.

import { getDrop, markMadeIfComplete } from '../../_lib/drops.js';
import { paidMail, sendMails } from '../../_lib/mail.js';
import { verifyStripeSignature } from '../../_lib/stripe.js';
import { background, json, nowSec } from '../../_lib/util.js';

const HANDLED = new Set(['checkout.session.completed', 'checkout.session.async_payment_succeeded']);

export async function onRequestPost(context) {
  const { request, env } = context;
  if (!env.STRIPE_WEBHOOK_SECRET) {
    console.error('STRIPE_WEBHOOK_SECRET is not set');
    return json({ error: 'not_configured' }, 500);
  }

  const payload = await request.text();
  const now = nowSec();
  const valid = await verifyStripeSignature(payload, request.headers.get('stripe-signature'), env.STRIPE_WEBHOOK_SECRET, now);
  if (!valid) return json({ error: 'invalid_signature' }, 400);

  let event;
  try {
    event = JSON.parse(payload);
  } catch {
    return json({ error: 'invalid_json' }, 400);
  }

  if (!HANDLED.has(event?.type)) return json({ received: true, ignored: event?.type || null });

  const session = event.data?.object || {};
  if (session.payment_status !== 'paid') return json({ received: true, pending: true });

  const signupId = Number(session.metadata?.signup_id);
  const token = session.client_reference_id;
  if (!Number.isInteger(signupId) || !token) return json({ received: true, unmatched: true });

  const prev = await env.DB.prepare('SELECT id, state FROM signups WHERE id = ? AND token = ?').bind(signupId, token).first();
  if (!prev) {
    console.error('webhook: no signup matches session', session.id);
    return json({ received: true, unmatched: true });
  }
  if (prev.state === 'expired') {
    // Paid after the 7-day window (Stripe Checkout can stay open up to 30 min past it).
    // We took the money, so honour it; the admin page shows it for a manual check.
    console.warn(`webhook: late payment for expired signup ${signupId}; marked paid, check /admin`);
  }

  const updated = await env.DB.prepare(
    `UPDATE signups SET state = 'paid', paid_at = ?, stripe_session_id = ?
     WHERE id = ? AND token = ? AND state IN ('invited','expired')
     RETURNING *`,
  )
    .bind(now, session.id || null, signupId, token)
    .first();

  if (updated) {
    await markMadeIfComplete(env.DB, updated.drop_id);
    const drop = await getDrop(env.DB, updated.drop_id);
    await background(context, sendMails(env, [paidMail(env, drop, updated)]));
  }

  return json({ received: true });
}
