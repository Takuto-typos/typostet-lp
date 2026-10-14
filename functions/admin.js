// GET /admin?key=...[&drop=uni-01][&format=csv][&view=subscribers]
// Read-only list of signups + 新着のお知らせ subscribers. Key compared in constant time with env.ADMIN_KEY.
// The only write action on the page is the "notify" form, which POSTs to /admin/notify.

import { messagePage } from './_lib/page.js';
import { SLEEVE_LABEL } from './_lib/pricing.js';
import { countActive, listSubscribers } from './_lib/subscribers.js';
import { escapeHtml, formatJst, html, isValidDropId, safeEqual } from './_lib/util.js';

const STATE_LABEL = {
  waiting: '補欠',
  reserved: '本申込み',
  invited: '支払い案内済み',
  paid: '支払い済み',
  expired: '期限切れ',
  cancelled: '中止',
};
const STATUS_LABEL = { open: '募集中', paying: '支払い受付中', made: '製作中', cancelled: '中止' };

const COLUMNS = [
  ['position', '順番'],
  ['state', '状態'],
  ['name', '名前'],
  ['email', 'メール'],
  ['size', 'サイズ'],
  ['number', '背番号'],
  ['back_name', '背中の名前'],
  ['number_pos', '番号の位置'],
  ['sleeve', '袖'],
  ['amount', '金額(送料別)'],
  ['created_at', '申込み'],
  ['invited_at', '支払い案内'],
  ['paid_at', '支払い'],
  ['expired_at', '期限切れ'],
  ['stripe_session_id', 'Stripe session'],
];

function display(key, row) {
  const v = row[key];
  if (v === null || v === undefined || v === '') return '';
  if (key === 'state') return STATE_LABEL[v] || v;
  if (key === 'sleeve') return SLEEVE_LABEL[v] || v;
  if (key.endsWith('_at')) return formatJst(v);
  return String(v);
}

/** CSV cell: quote, and neutralise spreadsheet formulas. */
function csvCell(value) {
  let s = String(value ?? '');
  if (/^[=+\-@\t\r]/.test(s)) s = `'${s}`;
  return `"${s.replace(/"/g, '""')}"`;
}

const SUB_COLUMNS = [
  ['email', 'メール'],
  ['created_at', '登録'],
  ['unsubscribed_at', '配信停止'],
  ['source', '登録元'],
];

function csvResponse(lines, filename) {
  return new Response(`\ufeff${lines.join('\r\n')}\r\n`, {
    headers: {
      'content-type': 'text/csv; charset=utf-8',
      'content-disposition': `attachment; filename="${filename}"`,
      'cache-control': 'no-store',
      'x-robots-tag': 'noindex, nofollow',
      'referrer-policy': 'no-referrer',
    },
  });
}

function denied() {
  return html(messagePage({ title: 'Not found', lines: [] }), 404);
}

export async function onRequestGet(context) {
  const { request, env } = context;
  if (!env.ADMIN_KEY) return denied();

  const url = new URL(request.url);
  const key = url.searchParams.get('key') || '';
  if (!(await safeEqual(key, env.ADMIN_KEY))) return denied();

  const drops = (await env.DB.prepare('SELECT * FROM drops ORDER BY opened_at DESC').all()).results || [];
  const requested = url.searchParams.get('drop');
  const drop = (isValidDropId(requested) && drops.find((d) => d.id === requested)) || drops[0];
  const rows = drop
    ? (await env.DB.prepare('SELECT * FROM signups WHERE drop_id = ? ORDER BY position').bind(drop.id).all()).results || []
    : [];

  const subscribers = await listSubscribers(env.DB);
  const isCsv = url.searchParams.get('format') === 'csv';

  if (isCsv && url.searchParams.get('view') === 'subscribers') {
    const lines = [SUB_COLUMNS.map(([k]) => k).map(csvCell).join(',')];
    for (const r of subscribers) lines.push(SUB_COLUMNS.map(([k]) => display(k, r)).map(csvCell).join(','));
    return csvResponse(lines, 'subscribers.csv');
  }

  if (isCsv) {
    const lines = [['drop_id', ...COLUMNS.map(([k]) => k)].map(csvCell).join(',')];
    for (const r of rows) lines.push([drop.id, ...COLUMNS.map(([k]) => display(k, r))].map(csvCell).join(','));
    return csvResponse(lines, `${drop ? drop.id : 'signups'}.csv`);
  }

  const counts = {};
  for (const r of rows) counts[r.state] = (counts[r.state] || 0) + 1;
  const keyParam = encodeURIComponent(key);
  const dropLinks = drops
    .map((d) => {
      const href = `/admin?key=${keyParam}&drop=${encodeURIComponent(d.id)}`;
      const label = `${d.id}(${STATUS_LABEL[d.status] || d.status})`;
      return d.id === drop?.id ? `<strong>${escapeHtml(label)}</strong>` : `<a href="${escapeHtml(href)}">${escapeHtml(label)}</a>`;
    })
    .join(' / ');

  const head = COLUMNS.map(([, label]) => `<th>${escapeHtml(label)}</th>`).join('');
  const body = rows
    .map((r) => `<tr class="s-${escapeHtml(r.state)}">${COLUMNS.map(([k]) => `<td>${escapeHtml(display(k, r))}</td>`).join('')}</tr>`)
    .join('\n');
  const summary = Object.entries(counts)
    .map(([s, n]) => `${STATE_LABEL[s] || s} ${n}`)
    .join(' / ');
  const activeCount = await countActive(env.DB);
  const noticeCounts = {};
  for (const r of (await env.DB.prepare('SELECT drop_id, COUNT(*) AS n FROM drop_notices GROUP BY drop_id').all()).results || []) {
    noticeCounts[r.drop_id] = Number(r.n);
  }
  const notifyForms = drops
    .filter((d) => d.status === 'open')
    .map((d) => {
      const action = `/admin/notify?key=${keyParam}&drop=${encodeURIComponent(d.id)}`;
      return `<form method="post" action="${escapeHtml(action)}" class="notify">
  <strong>${escapeHtml(d.name)}</strong>(${escapeHtml(d.id)} / 送り済み ${escapeHtml(noticeCounts[d.id] || 0)} 人)
  確認のため「${escapeHtml(d.id)}」と入力: <input name="confirm" autocomplete="off" required pattern="${escapeHtml(d.id)}" placeholder="${escapeHtml(d.id)}">
  <button type="submit">登録者にお知らせを送る</button>
</form>`;
    })
    .join('\n');
  const subHead = SUB_COLUMNS.map(([, label]) => `<th>${escapeHtml(label)}</th>`).join('');
  const subBody = subscribers
    .map((r) => `<tr class="${r.unsubscribed_at ? 's-expired' : ''}">${SUB_COLUMNS.map(([k]) => `<td>${escapeHtml(display(k, r))}</td>`).join('')}</tr>`)
    .join('\n');
  const subCsvHref = `/admin?key=${keyParam}&format=csv&view=subscribers`;

  const csvHref = drop ? `/admin?key=${keyParam}&drop=${encodeURIComponent(drop.id)}&format=csv` : '';

  return html(`<!doctype html>
<html lang="ja">
<head>
<meta charset="utf-8">
<meta name="viewport" content="width=device-width, initial-scale=1">
<meta name="robots" content="noindex, nofollow">
<title>admin | TYP0stet drops</title>
<style>
  body { font-family: -apple-system, "Hiragino Sans", sans-serif; font-size: 13px; margin: 16px; color: #1a1a1a; }
  table { border-collapse: collapse; width: 100%; }
  th, td { border: 1px solid #ddd; padding: 4px 6px; text-align: left; white-space: nowrap; }
  th { background: #f4f4f4; position: sticky; top: 0; }
  .s-paid td { background: #eef8ee; }
  .s-expired td, .s-cancelled td { color: #999; }
  .s-waiting td { background: #fafafa; }
  .wrap { overflow-x: auto; }
  h2 { margin-top: 40px; font-size: 16px; }
  form.notify { margin: 8px 0; padding: 8px; border: 1px solid #ddd; }
  .note { color: #666; }
</style>
</head>
<body>
<h1>${escapeHtml(drop ? drop.name : 'drops')}</h1>
<p>${dropLinks}</p>
${
  drop
    ? `<p>状態: ${escapeHtml(STATUS_LABEL[drop.status] || drop.status)} / 定員 ${escapeHtml(drop.cap)} / 締め切り ${escapeHtml(formatJst(drop.deadline))}</p>
<p>${escapeHtml(summary || '申込みはまだありません')}</p>
<p><a href="${escapeHtml(csvHref)}">CSV をダウンロード</a></p>`
    : '<p>ドロップがありません。</p>'
}
<div class="wrap"><table><thead><tr>${head}</tr></thead><tbody>
${body}
</tbody></table></div>

<h2 id="subscribers">新着のお知らせ</h2>
<p>受け取り中 ${escapeHtml(activeCount)} 人 / 全 ${escapeHtml(subscribers.length)} 件(配信停止を含む) / <a href="${escapeHtml(subCsvHref)}">CSV をダウンロード</a></p>
${notifyForms || '<p>募集中のドロップがないので、お知らせは送れません。</p>'}
<p class="note">お知らせは、受け取り中の人のうち、そのドロップのお知らせをまだ受け取っていない人にだけ送ります。何度押しても二重には届きません。</p>
<div class="wrap"><table><thead><tr>${subHead}</tr></thead><tbody>
${subBody}
</tbody></table></div>
</body>
</html>`);
}
