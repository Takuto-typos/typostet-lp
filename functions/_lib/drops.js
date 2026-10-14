// Core state machine for "20人集まったら作る".
//
// drops.status:   open -> paying -> made          (open -> cancelled if deadline passes)
// signups.state:  reserved -> invited -> paid
//                 reserved -> invited -> expired  (7 days unpaid; slot goes to waitlist head)
//                 waiting  -> invited -> ...      (promotion)
//                 reserved|waiting -> cancelled   (drop cancelled)
//
// Every transition is a single conditional UPDATE ... RETURNING, so concurrent
// requests can never apply the same transition twice (idempotent housekeeping)
// and every email is sent at most once per transition.

import { calcPrice } from './pricing.js';
import { cancelledMail, expiredMail, inviteMail, promotedMail, receiptMail } from './mail.js';
import { DAY, PAY_WINDOW, randomToken, sha256Hex } from './util.js';

export const ACTIVE_STATES = "('reserved','invited','paid')";
export const RATE_LIMIT_MAX = 5;
export const RATE_LIMIT_WINDOW = 10 * 60;

export async function getDrop(db, id) {
  return db.prepare('SELECT * FROM drops WHERE id = ?').bind(id).first();
}

export async function getCounts(db, dropId) {
  const row = await db
    .prepare(
      `SELECT
         SUM(CASE WHEN state IN ${ACTIVE_STATES} THEN 1 ELSE 0 END) AS active,
         SUM(CASE WHEN state = 'waiting' THEN 1 ELSE 0 END) AS waiting,
         SUM(CASE WHEN state = 'paid' THEN 1 ELSE 0 END) AS paid
       FROM signups WHERE drop_id = ?`,
    )
    .bind(dropId)
    .first();
  return {
    active: Number(row?.active || 0),
    waiting: Number(row?.waiting || 0),
    paid: Number(row?.paid || 0),
  };
}

/**
 * Records this attempt and returns true if the IP is over the limit.
 * Stores only a SHA-256 hash of the IP.
 */
export async function isRateLimited(db, ip, now) {
  const ipHash = await sha256Hex(`typostet-drops:${ip || 'unknown'}`);
  const since = now - RATE_LIMIT_WINDOW;
  const [, countRes] = await db.batch([
    db.prepare('INSERT INTO rate_limits (ip_hash, created_at) VALUES (?, ?)').bind(ipHash, now),
    db.prepare('SELECT COUNT(*) AS n FROM rate_limits WHERE ip_hash = ? AND created_at > ?').bind(ipHash, since),
  ]);
  const n = Number(countRes?.results?.[0]?.n || 0);
  return n > RATE_LIMIT_MAX;
}

export class SignupError extends Error {
  constructor(code, status, message) {
    super(message);
    this.code = code;
    this.status = status;
  }
}

/**
 * Insert a signup. Position and reserved/waiting are decided inside ONE SQL
 * statement (INSERT ... SELECT), which SQLite/D1 executes atomically, so two
 * simultaneous requests can never both become #20. UNIQUE(drop_id, position)
 * is a second safety net.
 */
export async function insertSignup(db, drop, value, now) {
  const price = calcPrice(drop, value);
  const token = randomToken();
  let row;
  try {
    row = await db
      .prepare(
        `INSERT INTO signups
           (drop_id, token, email, name, size, number, back_name, sleeve, position, state, amount, created_at)
         SELECT d.id, ?, ?, ?, ?, ?, ?, ?,
           COALESCE((SELECT MAX(position) FROM signups WHERE drop_id = d.id), 0) + 1,
           CASE WHEN d.status = 'open'
                 AND (SELECT COUNT(*) FROM signups WHERE drop_id = d.id AND state IN ${ACTIVE_STATES}) < d.cap
                THEN 'reserved' ELSE 'waiting' END,
           ?, ?
         FROM drops d
         WHERE d.id = ? AND d.status IN ('open','paying') AND d.deadline > ?
         RETURNING *`,
      )
      .bind(
        token,
        value.email,
        value.name,
        value.size,
        value.number,
        value.back_name,
        value.sleeve,
        price.item,
        now,
        drop.id,
        now,
      )
      .first();
  } catch (err) {
    const msg = String(err?.message || err);
    if (/UNIQUE constraint failed/i.test(msg) && /email/i.test(msg)) {
      throw new SignupError('duplicate', 409, 'このメールアドレスは、このドロップにすでに申込み済みです。');
    }
    if (/UNIQUE constraint failed/i.test(msg) && /position/i.test(msg)) {
      throw new SignupError('busy', 503, '混み合っています。少し時間をおいてもう一度お試しください。');
    }
    throw err;
  }
  if (!row) throw new SignupError('closed', 410, 'このドロップの申込みは締め切りました。');

  let waitingRank = null;
  if (row.state === 'waiting') {
    const r = await db
      .prepare("SELECT COUNT(*) AS n FROM signups WHERE drop_id = ? AND state = 'waiting' AND position <= ?")
      .bind(drop.id, row.position)
      .first();
    waitingRank = Number(r?.n || 0);
  }
  return { signup: row, waitingRank };
}

/**
 * Idempotent housekeeping for one drop. Applies all due transitions and
 * returns the emails to send (caller sends them, usually via waitUntil).
 */
export async function housekeep(env, dropId, now) {
  const db = env.DB;
  const mails = [];
  let drop = await getDrop(db, dropId);
  if (!drop) return { drop: null, mails };

  // 1) cap reached while open -> paying
  if (drop.status === 'open') {
    await db
      .prepare(
        `UPDATE drops SET status = 'paying'
         WHERE id = ? AND status = 'open'
           AND (SELECT COUNT(*) FROM signups WHERE drop_id = ? AND state IN ${ACTIVE_STATES}) >= cap`,
      )
      .bind(dropId, dropId)
      .run();
  }

  // 1b) paying -> invite every reserved signup (exactly once each)
  const invited = await db
    .prepare(
      `UPDATE signups SET state = 'invited', invited_at = ?
       WHERE drop_id = ? AND state = 'reserved'
         AND (SELECT status FROM drops WHERE id = ?) = 'paying'
       RETURNING *`,
    )
    .bind(now, dropId, dropId)
    .all();

  // 2) deadline passed while still open (= fewer than cap) -> cancelled
  const cancelledDrop = await db
    .prepare(`UPDATE drops SET status = 'cancelled' WHERE id = ? AND status = 'open' AND deadline <= ? RETURNING id`)
    .bind(dropId, now)
    .all();
  const cancelled = await db
    .prepare(
      `UPDATE signups SET state = 'cancelled', cancelled_at = ?
       WHERE drop_id = ? AND state IN ('reserved','waiting')
         AND (SELECT status FROM drops WHERE id = ?) = 'cancelled'
       RETURNING *`,
    )
    .bind(now, dropId, dropId)
    .all();

  // 3) invited and unpaid for 7 days -> expired
  const expired = await db
    .prepare(
      `UPDATE signups SET state = 'expired', expired_at = ?
       WHERE drop_id = ? AND state = 'invited' AND invited_at <= ?
         AND (SELECT status FROM drops WHERE id = ?) = 'paying'
       RETURNING *`,
    )
    .bind(now, dropId, now - PAY_WINDOW, dropId)
    .all();

  // 4) free slots -> promote earliest waiting. The LIMIT is computed inside the
  //    same statement so concurrent runs cannot over-fill the cap.
  const promoted = await db
    .prepare(
      `UPDATE signups SET state = 'invited', invited_at = ?
       WHERE id IN (
         SELECT id FROM signups
         WHERE drop_id = ? AND state = 'waiting'
         ORDER BY position
         LIMIT COALESCE((
           SELECT MAX(0, d.cap - (SELECT COUNT(*) FROM signups s WHERE s.drop_id = d.id AND s.state IN ${ACTIVE_STATES}))
           FROM drops d WHERE d.id = ? AND d.status = 'paying'
         ), 0)
       )
       RETURNING *`,
    )
    .bind(now, dropId, dropId)
    .all();

  // 5) all cap paid -> made (normally done by the webhook; repeated here for safety)
  await markMadeIfComplete(db, dropId);

  // housekeeping of the rate-limit table
  await db.prepare('DELETE FROM rate_limits WHERE created_at < ?').bind(now - DAY).run();

  drop = await getDrop(db, dropId);
  for (const s of invited.results || []) mails.push(inviteMail(env, drop, s));
  for (const s of cancelled.results || []) mails.push(cancelledMail(env, drop, s));
  for (const s of expired.results || []) mails.push(expiredMail(env, drop, s));
  for (const s of promoted.results || []) mails.push(promotedMail(env, drop, s));

  return {
    drop,
    mails,
    changed: {
      invited: (invited.results || []).length,
      cancelledDrop: (cancelledDrop.results || []).length > 0,
      cancelled: (cancelled.results || []).length,
      expired: (expired.results || []).length,
      promoted: (promoted.results || []).length,
    },
  };
}

export async function markMadeIfComplete(db, dropId) {
  const res = await db
    .prepare(
      `UPDATE drops SET status = 'made'
       WHERE id = ? AND status = 'paying'
         AND (SELECT COUNT(*) FROM signups WHERE drop_id = ? AND state = 'paid') >= cap
       RETURNING id`,
    )
    .bind(dropId, dropId)
    .all();
  return (res.results || []).length > 0;
}

export { receiptMail };
