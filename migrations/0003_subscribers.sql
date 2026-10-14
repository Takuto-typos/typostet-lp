-- 新着 stet を受け取る(新しいドロップのお知らせメール)
-- All timestamps are unix epoch seconds (INTEGER).

CREATE TABLE IF NOT EXISTS subscribers (
  id              INTEGER PRIMARY KEY AUTOINCREMENT,
  email           TEXT NOT NULL UNIQUE COLLATE NOCASE,  -- stored lower-cased
  token           TEXT NOT NULL UNIQUE,                 -- unsubscribe token, 192-bit random
  created_at      INTEGER NOT NULL,
  unsubscribed_at INTEGER,                              -- NULL = active
  source          TEXT                                  -- where the form was (e.g. 'top')
);

CREATE INDEX IF NOT EXISTS idx_subscribers_active ON subscribers (unsubscribed_at, id);

-- One row per (drop, person) once the announcement went out: a drop is announced to each person at most once.
CREATE TABLE IF NOT EXISTS drop_notices (
  drop_id       TEXT NOT NULL REFERENCES drops(id),
  subscriber_id INTEGER NOT NULL REFERENCES subscribers(id),
  sent_at       INTEGER NOT NULL,
  PRIMARY KEY (drop_id, subscriber_id)
);
