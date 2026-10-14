-- ページを開くたびの整理処理を1分に1回までにする(最後に走った時刻)
ALTER TABLE drops ADD COLUMN housekept_at INTEGER NOT NULL DEFAULT 0;

-- 古い連投記録の削除で全件を見ないように
CREATE INDEX IF NOT EXISTS rate_limits_created_at ON rate_limits (created_at);

-- 申込みは「確認メールのボタンを押したら」数える。押されるまではここに置いておく(24時間で消す)
CREATE TABLE IF NOT EXISTS pending_signups (
  id         INTEGER PRIMARY KEY AUTOINCREMENT,
  drop_id    TEXT NOT NULL REFERENCES drops(id),
  token      TEXT NOT NULL UNIQUE,           -- 確認リンク用 192-bit random
  email      TEXT NOT NULL,                  -- stored lower-cased
  payload    TEXT NOT NULL,                  -- 検証済みの入力(JSON)
  created_at INTEGER NOT NULL,
  UNIQUE (drop_id, email)
);

-- 新着のお知らせも、確認メールのボタンを押した人にだけ送る(NULL = まだ確認していない)
ALTER TABLE subscribers ADD COLUMN confirmed_at INTEGER;
