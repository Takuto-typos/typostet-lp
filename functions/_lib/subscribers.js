// 新着 stet を受け取る: the drop-announcement mailing list.
//
// subscribers: one row per address (UNIQUE email COLLATE NOCASE). unsubscribed_at NULL = active.
// drop_notices: (drop_id, subscriber_id) PRIMARY KEY. A row is claimed with INSERT OR IGNORE ... RETURNING
// *before* the mail goes out, so two concurrent "notify" runs can never mail the same person twice
// for the same drop. If Resend rejects a chunk, that chunk's claims are deleted again.

import { dropAnnounceMail, sendBatch, welcomeMail } from './mail.js';
import { randomToken } from './util.js';

// Same shape as validate.js (signup).
const EMAIL_RE = /^[^\s@<>()",;:\\[\]]+@[^\s@<>()",;:\\[\]]+\.[^\s@<>()",;:\\[\]]+$/;
const SOURCE_RE = /^[a-z0-9_-]{1,40}$/i;

/** @returns {{ ok:true, value:{email, source} } | { ok:false, honeypot?:boolean }} */
export function validateSubscribe(input) {
  input = input || {};
  if (String(input.website ?? '').trim() !== '') return { ok: false, honeypot: true };
  const email = String(input.email ?? '').trim().toLowerCase();
  if (!email || email.length > 254 || !EMAIL_RE.test(email)) return { ok: false };
  const source = String(input.source ?? '').trim();
  return { ok: true, value: { email, source: SOURCE_RE.test(source) ? source.toLowerCase() : null } };
}

/**
 * Add (or reactivate) an address.
 * @returns {{ status: 'new'|'reactivated'|'active', subscriber, mail: object|null }}
 *   mail is the welcome mail to send (null when the address was already active).
 */
export async function subscribe(env, { email, source }, now) {
  const db = env.DB;
  const inserted = await db
    .prepare(
      `INSERT INTO subscribers (email, token, created_at, source) VALUES (?, ?, ?, ?)
       ON CONFLICT (email) DO NOTHING
       RETURNING *`,
    )
    .bind(email, randomToken(), now, source)
    .first();
  if (inserted) return { status: 'new', subscriber: inserted, mail: welcomeMail(env, inserted) };

  // Existing address: only a previously unsubscribed one changes (and gets a welcome mail).
  const reactivated = await db
    .prepare(
      `UPDATE subscribers SET unsubscribed_at = NULL, source = COALESCE(?, source)
       WHERE email = ? AND unsubscribed_at IS NOT NULL
       RETURNING *`,
    )
    .bind(source, email)
    .first();
  if (reactivated) {
    // created_at is kept (first sign-up); the idempotency key uses `now` so a later re-subscribe mails again.
    return { status: 'reactivated', subscriber: reactivated, mail: welcomeMail(env, { ...reactivated, unsubscribed_at: now }) };
  }
  return { status: 'active', subscriber: null, mail: null };
}

export async function findByToken(db, token) {
  return db.prepare('SELECT * FROM subscribers WHERE token = ?').bind(token).first();
}

/** Idempotent: keeps the first unsubscribed_at. Returns the row (or null if the token is unknown). */
export async function unsubscribe(db, token, now) {
  await db.prepare('UPDATE subscribers SET unsubscribed_at = ? WHERE token = ? AND unsubscribed_at IS NULL').bind(now, token).run();
  return findByToken(db, token);
}

export async function countActive(db) {
  return Number((await db.prepare('SELECT COUNT(*) AS n FROM subscribers WHERE unsubscribed_at IS NULL').first('n')) || 0);
}

export async function listSubscribers(db) {
  return (await db.prepare('SELECT * FROM subscribers ORDER BY created_at DESC, id DESC').all()).results || [];
}

/**
 * Announce a drop to every active subscriber who hasn't had it yet.
 * @returns {{ sent:number, pending:number, logged?:number, dryRun?:boolean, remaining?:number }}
 */
export async function notifyDrop(env, drop, now) {
  const db = env.DB;
  const targets =
    (
      await db
        .prepare(
          `SELECT s.* FROM subscribers s
           WHERE s.unsubscribed_at IS NULL
             AND NOT EXISTS (SELECT 1 FROM drop_notices n WHERE n.drop_id = ? AND n.subscriber_id = s.id)
           ORDER BY s.id`,
        )
        .bind(drop.id)
        .all()
    ).results || [];
  const mails = targets.map((s) => ({ ...dropAnnounceMail(env, drop, s), subscriberId: s.id }));

  const result = await sendBatch(env, mails, {
    // Claim each row first; only mails whose claim succeeded are sent.
    async beforeChunk(chunk) {
      const claimed = await db.batch(
        chunk.map((m) =>
          db
            .prepare('INSERT OR IGNORE INTO drop_notices (drop_id, subscriber_id, sent_at) VALUES (?, ?, ?) RETURNING subscriber_id')
            .bind(drop.id, m.subscriberId, now),
        ),
      );
      const ids = new Set(claimed.flatMap((r) => (r.results || []).map((x) => x.subscriber_id)));
      return chunk.filter((m) => ids.has(m.subscriberId));
    },
    async afterChunk(chunk, ok) {
      if (ok) return;
      await db.batch(
        chunk.map((m) =>
          db.prepare('DELETE FROM drop_notices WHERE drop_id = ? AND subscriber_id = ?').bind(drop.id, m.subscriberId),
        ),
      );
    },
  });
  return { ...result, pending: targets.length };
}
