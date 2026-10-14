// GET /api/drops/:id -> { count, cap, waiting, deadline, status, ... }
// Real numbers only. Runs housekeeping in the background, at most once a minute per drop.

import { getCounts, getDrop, housekeep } from '../../../_lib/drops.js';
import { sendMails } from '../../../_lib/mail.js';
import { parseOptions } from '../../../_lib/pricing.js';
import { background, isoJst, isValidDropId, json, nowSec } from '../../../_lib/util.js';

const HOUSEKEEP_EVERY = 60; // seconds

export async function onRequestGet(context) {
  const { env, params } = context;
  const id = params.id;
  if (!isValidDropId(id)) return json({ error: 'not_found' }, 404);

  const drop = await getDrop(env.DB, id);
  if (!drop) return json({ error: 'not_found' }, 404);

  const counts = await getCounts(env.DB, id);

  // Page views don't need to housekeep every time: claim a slot once a minute.
  // (Signups and the Stripe webhook still apply their own transitions immediately.)
  await background(
    context,
    (async () => {
      const now = nowSec();
      const claimed = await env.DB
        .prepare('UPDATE drops SET housekept_at = ? WHERE id = ? AND housekept_at <= ? RETURNING id')
        .bind(now, id, now - HOUSEKEEP_EVERY)
        .first();
      if (!claimed) return;
      const { mails } = await housekeep(env, id, now);
      await sendMails(env, mails);
    })(),
  );

  const opts = parseOptions(drop);
  return json({
    id: drop.id,
    name: drop.name,
    count: Math.min(counts.active, drop.cap),
    cap: drop.cap,
    waiting: counts.waiting,
    deadline: isoJst(drop.deadline),
    status: drop.status,
    price: drop.price,
    shipping: drop.shipping,
    options: { sizes: opts.sizes, sleeve: opts.sleeve, back_name: opts.back_name },
  });
}
