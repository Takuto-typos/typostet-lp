// In-memory D1-compatible shim on top of node:sqlite (Node >= 22.5, run with --experimental-sqlite).
// Implements the subset of the D1 API used by functions/: prepare/bind/first/all/run, batch.
// (SQLite's own multi-statement runner is used for migrations; no shell / child_process involved.)

import { DatabaseSync } from 'node:sqlite';
import { readdirSync, readFileSync } from 'node:fs';
import { dirname, join } from 'node:path';
import { fileURLToPath } from 'node:url';

const MIGRATIONS = join(dirname(fileURLToPath(import.meta.url)), '..', '..', 'migrations');

const plain = (row) => (row ? { ...row } : null);

function runSql(sqlite, sql) {
  // DatabaseSync#exec runs SQL text in SQLite.
  sqlite['exec'](sql);
}

class Statement {
  constructor(sqlite, sql, params = []) {
    this.sqlite = sqlite;
    this.sql = sql;
    this.params = params;
  }
  bind(...params) {
    for (const p of params) {
      if (p === undefined) throw new Error('D1_TYPE_ERROR: Type undefined is not supported');
    }
    return new Statement(this.sqlite, this.sql, params);
  }
  _stmt() {
    return this.sqlite.prepare(this.sql);
  }
  async first(column) {
    const row = plain(this._stmt().get(...this.params));
    if (column) return row ? row[column] : null;
    return row;
  }
  async all() {
    const results = this._stmt().all(...this.params).map(plain);
    return { success: true, results, meta: {} };
  }
  async run() {
    return this._sync();
  }
  _sync() {
    const stmt = this._stmt();
    if (/^\s*select\b/i.test(this.sql) || /\breturning\b/i.test(this.sql)) {
      const results = stmt.all(...this.params).map(plain);
      return { success: true, results, meta: { changes: results.length } };
    }
    const r = stmt.run(...this.params);
    return { success: true, results: [], meta: { changes: r.changes, last_row_id: Number(r.lastInsertRowid) } };
  }
}

export class D1Shim {
  constructor() {
    this.sqlite = new DatabaseSync(':memory:');
  }
  prepare(sql) {
    return new Statement(this.sqlite, sql);
  }
  async batch(statements) {
    runSql(this.sqlite, 'BEGIN');
    try {
      const out = statements.map((s) => s._sync());
      runSql(this.sqlite, 'COMMIT');
      return out;
    } catch (err) {
      runSql(this.sqlite, 'ROLLBACK');
      throw err;
    }
  }
}

export function createDb({ seed = true } = {}) {
  const d1 = new D1Shim();
  for (const f of readdirSync(MIGRATIONS).filter((n) => n.endsWith('.sql')).sort()) {
    if (!seed && /seed/.test(f)) continue;
    runSql(d1.sqlite, readFileSync(join(MIGRATIONS, f), 'utf8'));
  }
  // テストは「定員20」の固定条件で流れを確かめる(本番の定員は seed の値。DROP 02 は 30)
  if (seed) runSql(d1.sqlite, "UPDATE drops SET cap = 20 WHERE id = 'uni-01';");
  return d1;
}
