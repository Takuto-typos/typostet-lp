import { test, beforeEach, afterEach } from 'node:test';
import assert from 'node:assert/strict';
import { setup, T0 } from './helpers/harness.js';
import { dropAnnounceMail, newsConfirmMail } from '../functions/_lib/mail.js';

const OK_MESSAGE = '確認のメールを送りました。メールのリンクから「登録する」を押すと、登録が終わります。';
const KEY = 'admin-secret-key';
let h;
beforeEach(() => {
  h = setup();
});
afterEach(() => h.restore());

const sub = (email, extra = {}) => ({ email, website: '', ...extra });

/** Resend calls carrying list mails, flattened, with headers. */
function listMails() {
  return h.calls.resend.flatMap((c) => (Array.isArray(c.body) ? c.body : [c.body]));
}

test('subscribe: new address gets a confirmation mail and is active only after the button', async () => {
  const res = await h.subscribe(sub(' Taro@Example.com ', { source: 'top' }), { confirm: false });
  assert.equal(res.status, 200);
  assert.deepEqual(await res.json(), { ok: true, message: OK_MESSAGE });
  let rows = await h.subscriberRows();
  assert.equal(rows.length, 1);
  assert.equal(rows[0].email, 'taro@example.com');
  assert.equal(rows[0].source, 'top');
  assert.equal(rows[0].confirmed_at, null);
  assert.equal(rows[0].created_at, T0);
  assert.match(rows[0].token, /^[A-Za-z0-9_-]{32}$/); // 192 bits

  const m = listMails();
  assert.equal(m.length, 1);
  assert.deepEqual(m[0].to, ['taro@example.com']);
  assert.equal(m[0].reply_to, 'info@typostet.com');
  assert.match(m[0].subject, /新着のお知らせの登録確認/);
  assert.ok(m[0].text.includes(`https://typostet.test/news/${rows[0].token}`));

  // not counted / not mailed until confirmed
  let page = await (await h.admin(`key=${KEY}`)).text();
  assert.match(page, /受け取り中 0 人/);

  // GET only shows the button; POST confirms
  const get = await h.news(rows[0].token, { method: 'GET' });
  assert.match(await get.text(), new RegExp(`<form method="post" action="/news/${rows[0].token}"`));
  assert.equal((await h.subscriberRows())[0].confirmed_at, null);
  h.clock.now += 30;
  const post = await h.news(rows[0].token);
  assert.equal(post.status, 200);
  assert.match(await post.text(), /登録しました/);
  rows = await h.subscriberRows();
  assert.equal(rows[0].confirmed_at, T0 + 30);
  page = await (await h.admin(`key=${KEY}`)).text();
  assert.match(page, /受け取り中 1 人/);
  assert.equal((await h.news('A'.repeat(32))).status, 404);
});

test('subscribe: form post redirects to #news', async () => {
  let res = await h.subscribe(sub('a@example.com'), { form: true });
  assert.equal(res.status, 303);
  assert.equal(res.headers.get('location'), '/?subscribe=ok#news');
  res = await h.subscribe(sub('not-an-email'), { form: true, ip: '203.0.113.51' });
  assert.equal(res.status, 303);
  assert.equal(res.headers.get('location'), '/?subscribe=error#news');
  res = await h.subscribe(sub('b@example.com'), { form: true, ip: '203.0.113.52', accept: 'application/json' });
  assert.equal(res.status, 200);
  assert.equal((await res.json()).ok, true);
});

test('subscribe: duplicate gets the same answer and no second mail (case-insensitive)', async () => {
  const first = await (await h.subscribe(sub('dup@example.com'))).json();
  const res = await h.subscribe(sub('DUP@example.com'), { ip: '203.0.113.60' });
  assert.equal(res.status, 200);
  assert.deepEqual(await res.json(), first);
  assert.equal((await h.subscriberRows()).length, 1);
  assert.equal(listMails().length, 1);
});

test('subscribe: invalid email and honeypot are rejected without storing anything', async () => {
  let res = await h.subscribe(sub('nope'));
  assert.equal(res.status, 422);
  let body = await res.json();
  assert.equal(body.ok, false);
  assert.equal(body.error, 'invalid');
  assert.ok(body.message);

  res = await h.subscribe(sub('bot@example.com', { website: 'http://spam' }), { ip: '203.0.113.61' });
  assert.equal(res.status, 400);
  body = await res.json();
  assert.equal(body.error, 'bad_request');

  res = await h.subscribe(sub(''), { ip: '203.0.113.62' });
  assert.equal(res.status, 422);

  assert.equal((await h.subscriberRows()).length, 0);
  assert.equal(listMails().length, 0);
});

test('subscribe: per-IP rate limit (5 per 10 minutes), separate from signup', async () => {
  for (let i = 1; i <= 5; i++) assert.equal((await h.subscribe(sub(`r${i}@example.com`), { ip: '192.0.2.9' })).status, 200);
  const res = await h.subscribe(sub('r6@example.com'), { ip: '192.0.2.9' });
  assert.equal(res.status, 429);
  assert.equal((await res.json()).error, 'rate_limited');
  // signups from the same IP are not affected by the subscribe bucket
  const s = await h.signup(
    { email: 'x@example.com', name: 'X', size: 'M', number: '7', sleeve: 'short', website: '' },
    { ip: '192.0.2.9' },
  );
  assert.equal(s.status, 201);
  h.clock.now += 601;
  assert.equal((await h.subscribe(sub('r6@example.com'), { ip: '192.0.2.9' })).status, 200);
});

test('subscribe: unsubscribed address gets a new confirmation; reactivated only by the button', async () => {
  await h.subscribe(sub('back@example.com'));
  const [row] = await h.subscriberRows();
  await h.unsubscribe(row.token, { method: 'POST' });
  assert.ok((await h.subscriberRows())[0].unsubscribed_at);
  h.calls.resend.length = 0;

  h.clock.now += 3600;
  const res = await h.subscribe(sub('back@example.com', { source: 'footer' }), { ip: '203.0.113.70', confirm: false });
  assert.deepEqual(await res.json(), { ok: true, message: OK_MESSAGE });
  assert.ok((await h.subscriberRows())[0].unsubscribed_at, 'someone else typing the address does not turn it back on');
  await h.news(row.token);
  const [after] = await h.subscriberRows();
  assert.equal(after.unsubscribed_at, null);
  assert.equal(after.token, row.token); // old unsubscribe links keep working
  assert.equal(after.created_at, T0);
  assert.equal(after.source, 'footer');
  assert.equal(listMails().length, 1);
  assert.match(listMails()[0].subject, /新着のお知らせの登録確認/);
});

test('unsubscribe: GET only shows a confirm form; POST unsubscribes; unknown token 404', async () => {
  await h.subscribe(sub('u@example.com'));
  const [row] = await h.subscriberRows();

  let res = await h.unsubscribe(row.token);
  assert.equal(res.status, 200);
  const page = await res.text();
  assert.match(page, new RegExp(`<form method="post" action="/unsubscribe/${row.token}"`));
  assert.match(page, /配信を止める/);
  assert.equal((await h.subscriberRows())[0].unsubscribed_at, null);

  h.clock.now += 10;
  res = await h.unsubscribe(row.token, { method: 'POST' });
  assert.equal(res.status, 200);
  assert.match(await res.text(), /配信を止めました/);
  assert.equal((await h.subscriberRows())[0].unsubscribed_at, T0 + 10);

  // idempotent; first timestamp kept
  h.clock.now += 10;
  res = await h.unsubscribe(row.token, { method: 'POST' });
  assert.equal(res.status, 200);
  assert.equal((await h.subscriberRows())[0].unsubscribed_at, T0 + 10);
  assert.match(await (await h.unsubscribe(row.token)).text(), /配信は止まっています/);

  assert.equal((await h.unsubscribe('A'.repeat(32))).status, 404);
  assert.equal((await h.unsubscribe('A'.repeat(32), { method: 'POST' })).status, 404);
  assert.equal((await h.unsubscribe('../etc')).status, 404);
});

test('unsubscribe: RFC 8058 one-click POST works', async () => {
  await h.subscribe(sub('one@example.com'));
  const [row] = await h.subscriberRows();
  const res = await h.unsubscribe(row.token, { method: 'POST', oneClick: true });
  assert.equal(res.status, 200);
  assert.ok((await h.subscriberRows())[0].unsubscribed_at);
});

test('notify: sends once per subscriber per drop, skips unsubscribed, uses batch', async () => {
  for (let i = 1; i <= 3; i++) await h.subscribe(sub(`n${i}@example.com`), { ip: `203.0.113.${80 + i}` });
  await h.subscribe(sub('never-confirmed@example.com'), { ip: '203.0.113.79', confirm: false });
  const rows = await h.subscriberRows();
  await h.unsubscribe(rows[1].token, { method: 'POST' });
  h.calls.resend.length = 0;

  let res = await h.notify(`key=${KEY}&drop=uni-01`, { confirm: 'uni-01' });
  assert.equal(res.status, 200);
  assert.match(await res.text(), /2 件送りました/);
  assert.equal(h.calls.resend.length, 1);
  assert.match(h.calls.resend[0].url, /\/emails\/batch$/);
  const m = listMails();
  assert.deepEqual(m.map((x) => x.to[0]).sort(), ['n1@example.com', 'n3@example.com']);
  assert.match(m[0].subject, /新しいデザインが出ました/);
  assert.match(m[0].text, /世界に20着だけ。再販はしません。/);
  assert.match(m[0].text, /https:\/\/typostet\.test\/#join/);
  assert.equal(m[0].headers['List-Unsubscribe-Post'], 'List-Unsubscribe=One-Click');
  const notices = (await h.env.DB.prepare('SELECT * FROM drop_notices ORDER BY subscriber_id').all()).results;
  assert.deepEqual(notices.map((n) => [n.drop_id, n.subscriber_id]), [['uni-01', rows[0].id], ['uni-01', rows[2].id]]);

  // second run: nobody left
  h.calls.resend.length = 0;
  res = await h.notify(`key=${KEY}&drop=uni-01`, { confirm: 'uni-01' });
  assert.equal(res.status, 200);
  assert.match(await res.text(), /0 件送りました/);
  assert.equal(h.calls.resend.length, 0);

  // a new subscriber gets it on the next run, only them
  await h.subscribe(sub('n4@example.com'), { ip: '203.0.113.99' });
  h.calls.resend.length = 0;
  res = await h.notify(`key=${KEY}&drop=uni-01`, { confirm: 'uni-01' });
  assert.match(await res.text(), /1 件送りました/);
  assert.deepEqual(listMails().map((x) => x.to[0]), ['n4@example.com']);
});

test('notify: chunks of at most 100 per batch call', async () => {
  const stmt = h.env.DB.prepare('INSERT INTO subscribers (email, token, created_at, confirmed_at) VALUES (?, ?, ?, ?)');
  await h.env.DB.batch(Array.from({ length: 205 }, (_, i) => stmt.bind(`bulk${i}@example.com`, `tok_${String(i).padStart(30, '0')}`, T0, T0)));
  const res = await h.notify(`key=${KEY}&drop=uni-01`, { confirm: 'uni-01' });
  assert.match(await res.text(), /205 件送りました/);
  assert.deepEqual(h.calls.resend.map((c) => c.body.length), [100, 100, 5]);
});

test('notify: failed batch is not recorded, so a retry sends it', async () => {
  await h.subscribe(sub('f@example.com'));
  h.calls.resend.length = 0;
  const okFetch = globalThis.fetch;
  globalThis.fetch = async () => new Response('boom', { status: 500 });
  let res = await h.notify(`key=${KEY}&drop=uni-01`, { confirm: 'uni-01' });
  assert.equal(res.status, 502);
  assert.equal((await h.env.DB.prepare('SELECT COUNT(*) AS n FROM drop_notices').first('n')), 0);
  globalThis.fetch = okFetch;
  res = await h.notify(`key=${KEY}&drop=uni-01`, { confirm: 'uni-01' });
  assert.match(await res.text(), /1 件送りました/);
});

test('notify: wrong key 404, missing/wrong confirm rejected, non-open drop rejected', async () => {
  await h.subscribe(sub('k@example.com'));
  h.calls.resend.length = 0;
  assert.equal((await h.notify('key=wrong&drop=uni-01', { confirm: 'uni-01' })).status, 404);
  assert.equal((await h.notify('drop=uni-01', { confirm: 'uni-01' })).status, 404);
  let res = await h.notify(`key=${KEY}&drop=uni-01`);
  assert.equal(res.status, 400);
  assert.match(await res.text(), /確認のため/);
  assert.equal((await h.notify(`key=${KEY}&drop=uni-01`, { confirm: 'uni-02' })).status, 400);
  assert.equal((await h.notify(`key=${KEY}&drop=nope`, { confirm: 'nope' })).status, 404);
  await h.env.DB.prepare("UPDATE drops SET status = 'cancelled' WHERE id = 'uni-01'").run();
  assert.equal((await h.notify(`key=${KEY}&drop=uni-01`, { confirm: 'uni-01' })).status, 409);
  assert.equal(h.calls.resend.length, 0);

  delete h.env.ADMIN_KEY;
  assert.equal((await h.notify('key=&drop=uni-01', { confirm: 'uni-01' })).status, 404);
});

test('notify: without RESEND_API_KEY nothing is sent or recorded', async () => {
  await h.subscribe(sub('dev@example.com'));
  delete h.env.RESEND_API_KEY;
  const log = console.log;
  console.log = () => {};
  try {
    const res = await h.notify(`key=${KEY}&drop=uni-01`, { confirm: 'uni-01' });
    assert.match(await res.text(), /RESEND_API_KEY が未設定/);
  } finally {
    console.log = log;
  }
  assert.equal((await h.env.DB.prepare('SELECT COUNT(*) AS n FROM drop_notices').first('n')), 0);
});

test('/admin: subscribers section, notify form for open drops, CSV', async () => {
  await h.subscribe(sub('a&b@example.com'));
  await h.subscribe(sub('s1@example.com'), { ip: '203.0.113.90' });
  await h.subscribe(sub('s2@example.com'), { ip: '203.0.113.91' });
  const rows = await h.subscriberRows();
  await h.unsubscribe(rows[2].token, { method: 'POST' });

  let res = await h.admin(`key=${KEY}`);
  const page = await res.text();
  assert.match(page, /受け取り中 2 人 \/ 全 3 件/);
  assert.match(page, /action="\/admin\/notify\?key=admin-secret-key&amp;drop=uni-01"/);
  assert.match(page, /name="confirm"/);
  assert.match(page, /s2@example\.com/);
  assert.ok(page.includes('a&amp;b@example.com'));
  assert.ok(!page.includes('a&b@'));

  res = await h.admin(`key=${KEY}&format=csv&view=subscribers`);
  assert.match(res.headers.get('content-type'), /text\/csv/);
  assert.match(res.headers.get('content-disposition'), /subscribers\.csv/);
  const bytes = new Uint8Array(await res.arrayBuffer());
  assert.deepEqual([...bytes.slice(0, 3)], [0xef, 0xbb, 0xbf], 'UTF-8 BOM for Excel');
  const csv = new TextDecoder().decode(bytes);
  assert.ok(csv.startsWith('"email","created_at","confirmed_at","unsubscribed_at","source"'));
  assert.match(csv, /"s1@example\.com","2026年10月20日 12:00","2026年10月20日 12:00","",""/);

  assert.equal((await h.admin('key=wrong&format=csv&view=subscribers')).status, 404);
});

test('list mail copy: unsubscribe link, sender, address, contact; no "!" or emoji', () => {
  const env = { SITE_URL: 'https://typostet.com/' };
  const s = { id: 7, email: 'a@example.com', token: 'T'.repeat(32), created_at: T0, unsubscribed_at: null };
  const drop = { id: 'uni-01', name: 'ユニ。 INK BLACK', cap: 30, deadline: 1796050799 };
  const c = newsConfirmMail(env, s, T0);
  assert.ok(c.text.includes(`https://typostet.com/news/${'T'.repeat(32)}`));
  assert.ok(!/[!！]/.test(`${c.subject}\n${c.text}`));
  for (const m of [dropAnnounceMail(env, drop, s)]) {
    const all = `${m.subject}\n${m.text}`;
    assert.ok(m.text.includes(`https://typostet.com/unsubscribe/${'T'.repeat(32)}`));
    assert.ok(m.text.includes('TYP0stet(株式会社 Remoi)'));
    assert.ok(m.text.includes('〒115-0045 東京都北区赤羽 1-59-8 日ノ出ビル 4F'));
    assert.ok(m.text.includes('info@typostet.com'));
    assert.ok(!/[!！]/.test(all), 'no exclamation marks');
    assert.ok(!/\p{Extended_Pictographic}/u.test(all), 'no emoji');
    assert.equal(m.headers['List-Unsubscribe'], `<https://typostet.com/unsubscribe/${'T'.repeat(32)}>`);
    assert.ok(m.html.includes(`href="https://typostet.com/unsubscribe/${'T'.repeat(32)}"`));
  }
  const a = dropAnnounceMail(env, drop, s);
  assert.match(a.text, /世界に30着だけ。再販はしません。/);
  assert.match(a.text, /締め切り: 2026年11月30日 23:59/);
  assert.match(a.text, /https:\/\/typostet\.com\/#join/);
  assert.match(a.subject, /ユニ。 INK BLACK/);
});
