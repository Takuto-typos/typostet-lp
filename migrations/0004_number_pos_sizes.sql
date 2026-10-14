-- 番号の位置(裾 hem / 胸 chest)を申込みごとに選べるようにする
ALTER TABLE signups ADD COLUMN number_pos TEXT NOT NULL DEFAULT 'hem';

-- DROP 02 のサイズを業者(Elements K-series)の 120〜3XO に合わせる
UPDATE drops
   SET options = json_set(options, '$.sizes', json('["120","130","140","150","160","SS","S","M","L","O","XO","2XO","3XO"]'))
 WHERE id = 'uni-01';
