-- 20人集まったら作る(drops)
-- All timestamps are unix epoch seconds (INTEGER). Display is done in JST by the app.

CREATE TABLE IF NOT EXISTS drops (
  id         TEXT PRIMARY KEY,                -- e.g. 'uni-01'
  name       TEXT NOT NULL,
  price      INTEGER NOT NULL,                -- base price, JPY tax incl.
  shipping   INTEGER NOT NULL DEFAULT 600,    -- JPY, flat
  options    TEXT NOT NULL DEFAULT '{}',      -- JSON: {"sizes":[...],"sleeve":{"short":0,"long":1000},"back_name":1000}
  cap        INTEGER NOT NULL DEFAULT 20,
  deadline   INTEGER NOT NULL,                -- epoch seconds
  status     TEXT NOT NULL DEFAULT 'open'
             CHECK (status IN ('open','paying','made','cancelled')),
  opened_at  INTEGER NOT NULL
);

CREATE TABLE IF NOT EXISTS signups (
  id                  INTEGER PRIMARY KEY AUTOINCREMENT,
  drop_id             TEXT NOT NULL REFERENCES drops(id),
  token               TEXT NOT NULL UNIQUE,
  email               TEXT NOT NULL,          -- stored lower-cased
  name                TEXT NOT NULL,
  size                TEXT NOT NULL,
  number              INTEGER NOT NULL,
  back_name           TEXT,
  sleeve              TEXT NOT NULL CHECK (sleeve IN ('short','long')),
  position            INTEGER NOT NULL,       -- 申込み順 (1-based)
  state               TEXT NOT NULL
                      CHECK (state IN ('waiting','reserved','invited','paid','expired','cancelled')),
  amount              INTEGER NOT NULL,       -- item price incl. options (JPY, excl. shipping)
  invited_at          INTEGER,
  paid_at             INTEGER,
  expired_at          INTEGER,
  cancelled_at        INTEGER,
  stripe_session_id   TEXT,
  checkout_url        TEXT,
  checkout_expires_at INTEGER,
  created_at          INTEGER NOT NULL,
  UNIQUE (drop_id, email),
  UNIQUE (drop_id, position)
);

CREATE INDEX IF NOT EXISTS idx_signups_drop_state ON signups (drop_id, state, position);

CREATE TABLE IF NOT EXISTS rate_limits (
  id         INTEGER PRIMARY KEY AUTOINCREMENT,
  ip_hash    TEXT NOT NULL,
  created_at INTEGER NOT NULL
);

CREATE INDEX IF NOT EXISTS idx_rate_limits_ip ON rate_limits (ip_hash, created_at);
