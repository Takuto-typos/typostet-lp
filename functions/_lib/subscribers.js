// 新着 stet を受け取る: the drop-announcement mailing list.
//
// subscribers: one row per address (UNIQUE email COLLATE NOCASE).
// Active = confirmed_at set (the owner pressed the button in the confirmation mail) AND unsubscribed_at NULL.
// drop_notices: (drop_id, subscriber_id) PRIMARY KEY. A row is claimed with INSERT OR IGNORE ... RETURNING
// *before* the mail goes out, so two concurrent "notify" runs can never mail the same person twice
// for the same drop. If Resend rejects a chunk, that chunk's claims are deleted again.

import { dropAnnounceMail, newsConfirmMail, sendBatch } from './mail.js';
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

const ACTIVE = 'confirmed_at IS NOT NULL AND unsubscribed_at IS NULL';

/**
 * Register an address, or re-send the confirmation for one that isn't active.
 * Nothing changes until the owner presses the button (confirmSubscriber).
 * @returns {{ status: 'pending'|'active', subscriber, mail: object|null }}
 *   mail is the confirmation mail to send (null when the address is already active).
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
  if (inserted) return { status: 'pending', subscriber: inserted, mail: newsConfirmMail(env, inserted, now) };

  const row = await db.prepare('SELECT * FROM subscribers WHERE email = ?').bind(email).first();
  if (!row) return { status: 'active', subscriber: null, mail: null };
  if (row.confirmed_at && !row.unsubscribed_at) return { status: 'active', subscriber: null, mail: null };
  if (source) await db.prepare('UPDATE subscribers SET source = ? WHERE id = ?').bind(source, row.id).run();
  return { status: 'pending', subscriber: row, mail: newsConfirmMail(env, row, now) };
}

/** The button in the confirmation mail. Also re-activates an address that had stopped. */
export async function confirmSubscriber(db, token, now) {
  await db
    .prepare('UPDATE subscribers SET confirmed_at = ?, unsubscribed_at = NULL WHERE token = ? AND NOT (' + ACTIVE + ')')
    .bind(now, token)
    .run();
  return findByToken(db, token);
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
  return Number((await db.prepare(`SELECT COUNT(*) AS n FROM subscribers WHERE ${ACTIVE}`).first('n')) || 0);
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
           WHERE s.confirmed_at IS NOT NULL AND s.unsubscribed_at IS NULL
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
