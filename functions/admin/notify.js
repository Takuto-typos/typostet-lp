// POST /admin/notify?key=...&drop=<id>   (form field confirm=<id> required)
// Announces an open drop to every active subscriber who hasn't had it yet (Resend batch, 100 per call).
// Safe to run again: people already notified for this drop are skipped (drop_notices).

import { getDrop } from '../_lib/drops.js';
import { messagePage } from '../_lib/page.js';
import { readBody } from '../_lib/request.js';
import { notifyDrop } from '../_lib/subscribers.js';
import { html, isValidDropId, nowSec, safeEqual } from '../_lib/util.js';

function denied() {
  return html(messagePage({ title: 'Not found', lines: [] }), 404);
}

export async function onRequestPost({ request, env }) {
  if (!env.ADMIN_KEY) return denied();
  const url = new URL(request.url);
  const key = url.searchParams.get('key') || '';
  if (!(await safeEqual(key, env.ADMIN_KEY))) return denied();

  const back = `/admin?key=${encodeURIComponent(key)}`;
  const page = (status, title, lines) => html(messagePage({ title, lines, linkHref: back, linkLabel: '管理ページへ戻る' }), status);

  const id = url.searchParams.get('drop') || '';
  if (!isValidDropId(id)) return page(400, '送れませんでした', ['ドロップの指定がありません。']);
  const body = (await readBody(request)) || {};
  if (String(body.confirm ?? '').trim() !== id) {
    return page(400, '送れませんでした', [`確認のため、入力欄に「${id}」と入れてから押してください。`]);
  }

  const drop = await getDrop(env.DB, id);
  if (!drop) return page(404, '送れませんでした', [`${id} というドロップはありません。`]);
  if (drop.status !== 'open') {
    return page(409, '送れませんでした', [`${drop.name} は募集中ではありません(状態: ${drop.status})。`]);
  }

  const r = await notifyDrop(env, drop, nowSec());
  if (r.dryRun) {
    return page(200, '送っていません(テスト環境)', [
      `RESEND_API_KEY が未設定のため、${r.logged} 件をログに出しただけです。送った記録も残していません。`,
    ]);
  }
  const lines = [`${drop.name} のお知らせを ${r.sent} 件送りました。`];
  if (r.pending === 0) lines.push('送る相手はいませんでした(全員に送り済み、または登録者がいません)。');
  if (r.remaining) {
    lines.push(`送信に失敗したため、残り ${r.remaining} 件は送っていません。時間をおいてもう一度押すと、まだの人にだけ送ります。`);
  }
  return page(r.remaining ? 502 : 200, r.remaining ? '途中で止まりました' : '送りました', lines);
}
