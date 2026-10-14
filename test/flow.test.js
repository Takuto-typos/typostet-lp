import { test, beforeEach, afterEach } from 'node:test';
import assert from 'node:assert/strict';
import { checkoutCompleted, person, setup, T0 } from './helpers/harness.js';
import { insertSignup } from '../functions/_lib/drops.js';

const DAY = 86400;
let h;
beforeEach(() => {
  h = setup();
});
afterEach(() => h.restore());

test('GET /api/drops/:id returns real counts', async () => {
  let res = await h.getDrop();
  assert.equal(res.status, 200);
  let body = await res.json();
  assert.deepEqual(
    { count: body.count, cap: body.cap, waiting: body.waiting, status: body.status, deadline: body.deadline },
    { count: 0, cap: 20, waiting: 0, status: 'open', deadline: '2026-11-30T23:59:59+09:00' },
  );
  assert.equal(body.price, 8800);
  await h.fill(3);
  body = await (await h.getDrop()).json();
  assert.equal(body.count, 3);
  assert.equal((await h.getDrop('nope')).status, 404);
  assert.equal((await h.getDrop('../x')).status, 404);
});

test('signup: JSON and form-encoded; receipt mail sent', async () => {
  let res = await h.signup(person(1));
  assert.equal(res.status, 201);
  const body = await res.json();
  assert.equal(body.state, 'reserved');
  assert.equal(body.position, 1);
  assert.equal(body.count, 1);

  res = await h.signup(person(2), { form: true, ip: '198.51.100.99' });
  assert.equal(res.status, 303);
  assert.equal(res.headers.get('location'), '/?signup=reserved&n=2#drop');

  res = await h.signup(person(3), { form: true, ip: '198.51.100.98', accept: 'application/json' });
  assert.equal(res.status, 201);

  const m = h.mails();
  assert.equal(m.length, 3);
  assert.equal(m[0].to, 'user1@example.com');
  assert.match(m[0].subject, /申込みを受け付けました/);
  const row = (await h.signupRows())[0];
  assert.match(row.token, /^[A-Za-z0-9_-]{32}$/);
  assert.equal(row.amount, 8800);
});

test('signup: validation errors, honeypot, duplicate email', async () => {
  let res = await h.signup(person(1, { number: '100' }));
  assert.equal(res.status, 422);
  assert.ok((await res.json()).fields.number);

  res = await h.signup(person(1, { website: 'x' }), { ip: '10.0.0.2' });
  assert.equal(res.status, 400);

  res = await h.signup(person(1), { ip: '10.0.0.3' });
  assert.equal(res.status, 201);
  res = await h.signup(person(1, { email: 'USER1@example.com' }), { ip: '10.0.0.4' });
  assert.equal(res.status, 409);
  assert.match((await res.json()).message, /すでに申込み済み/);
  assert.equal((await h.signupRows()).length, 1);
});

test('signup: per-IP rate limit (5 per 10 minutes)', async () => {
  for (let i = 1; i <= 5; i++) assert.equal((await h.signup(person(i), { ip: '192.0.2.7' })).status, 201);
  const res = await h.signup(person(6), { ip: '192.0.2.7' });
  assert.equal(res.status, 429);
  assert.equal((await h.signup(person(6), { ip: '192.0.2.8' })).status, 201);
  h.clock.now += 601;
  assert.equal((await h.signup(person(7), { ip: '192.0.2.7' })).status, 201);
});

test('#20 flips status to paying and invites all 20; #21 is waiting', async () => {
  const res = await h.fill(19);
  assert.ok(res.every((r) => r.status === 201));
  assert.equal((await h.dropRow()).status, 'open');
  h.calls.resend.length = 0;

  const r20 = await (await h.signup(person(20), { ip: '198.51.100.20' })).json();
  assert.equal(r20.position, 20);
  assert.equal(r20.status, 'paying');
  assert.equal((await h.dropRow()).status, 'paying');

  const rows = await h.signupRows();
  assert.equal(rows.length, 20);
  assert.ok(rows.every((r) => r.state === 'invited' && r.invited_at === T0));
  assert.deepEqual(rows.map((r) => r.position), Array.from({ length: 20 }, (_, i) => i + 1));

  // receipt for #20 + 20 invitations, sent through the batch endpoint
  assert.equal(h.calls.resend.length, 1);
  assert.match(h.calls.resend[0].url, /\/emails\/batch$/);
  const m = h.mails();
  assert.equal(m.length, 21);
  const invites = m.filter((x) => /お支払いのご案内/.test(x.subject));
  assert.equal(invites.length, 20);
  assert.equal(new Set(invites.map((x) => x.to)).size, 20);
  assert.match(invites[0].text, /https:\/\/typostet\.test\/pay\/[A-Za-z0-9_-]{32}/);
  assert.match(invites[0].text, /お支払い期限: 2026年10月27日 12:00/);

  // housekeeping again is a no-op (idempotent)
  h.calls.resend.length = 0;
  await h.getDrop();
  await h.getDrop();
  assert.equal(h.mails().length, 0);

  const r21 = await (await h.signup(person(21), { ip: '198.51.100.21' })).json();
  assert.equal(r21.state, 'waiting');
  assert.equal(r21.position, 21);
  assert.equal(r21.waiting_rank, 1);
  const body = await (await h.getDrop()).json();
  assert.equal(body.count, 20);
  assert.equal(body.waiting, 1);
  assert.match(h.mails()[0].subject, /補欠で受け付けました/);
});

test('ordering is race-safe: concurrent inserts never produce two #20s', async () => {
  const drop = await h.dropRow();
  const values = Array.from({ length: 30 }, (_, i) => ({
    email: `race${i}@example.com`, name: `R${i}`, size: 'S', number: 5, back_name: null, sleeve: 'short',
  }));
  const results = await Promise.all(values.map((v) => insertSignup(h.env.DB, drop, v, T0)));
  const positions = results.map((r) => r.signup.position).sort((a, b) => a - b);
  assert.deepEqual(positions, Array.from({ length: 30 }, (_, i) => i + 1));
  const reserved = results.filter((r) => r.signup.state === 'reserved');
  assert.equal(reserved.length, 20);
  assert.ok(reserved.every((r) => r.signup.position <= 20));
  assert.equal(results.filter((r) => r.signup.state === 'waiting').length, 10);
});

test('unpaid after 7 days -> expired; earliest waiting promoted', async () => {
  await h.fill(23); // 20 invited + 3 waiting
  const rows = await h.signupRows();
  // 18 pay
  for (const s of rows.slice(0, 18)) assert.equal((await h.webhook(checkoutCompleted(s))).status, 200);
  h.calls.resend.length = 0;

  h.clock.now = T0 + 7 * DAY - 1;
  await h.getDrop();
  assert.equal(h.mails().length, 0, 'nothing due yet');

  h.clock.now = T0 + 7 * DAY + 5;
  await h.getDrop();
  const after = await h.signupRows();
  assert.equal(after[18].state, 'expired');
  assert.equal(after[19].state, 'expired');
  assert.equal(after[20].state, 'invited');
  assert.equal(after[21].state, 'invited');
  assert.equal(after[22].state, 'waiting');
  assert.equal(after[20].invited_at, h.clock.now);

  const m = h.mails();
  assert.equal(m.filter((x) => /期限が過ぎました/.test(x.subject)).length, 2);
  const promoted = m.filter((x) => /繰り上げ/.test(x.subject));
  assert.deepEqual(promoted.map((x) => x.to).sort(), ['user21@example.com', 'user22@example.com']);

  // idempotent
  h.calls.resend.length = 0;
  await h.getDrop();
  assert.equal(h.mails().length, 0);
  const body = await (await h.getDrop()).json();
  assert.equal(body.count, 20);
  assert.equal(body.waiting, 1);

  // expired person's pay link explains
  const res = await h.pay(after[18].token);
  assert.equal(res.status, 410);
  assert.match(await res.text(), /お支払い期限が過ぎました/);
});

test('webhook: paid, thanks mail, all 20 paid -> made; bad signature rejected', async () => {
  await h.fill(20);
  const rows = await h.signupRows();
  h.calls.resend.length = 0;

  assert.equal((await h.webhook(checkoutCompleted(rows[0]), { secret: 'whsec_wrong' })).status, 400);
  assert.equal((await h.webhook(checkoutCompleted(rows[0]), { t: h.clock.now - 400 })).status, 400);
  assert.equal((await h.webhook(checkoutCompleted(rows[0]), { sig: 'garbage' })).status, 400);
  assert.equal((await h.signupRows())[0].state, 'invited');

  // token mismatch is ignored
  await h.webhook(checkoutCompleted(rows[0], { client_reference_id: 'x'.repeat(32) }));
  assert.equal((await h.signupRows())[0].state, 'invited');

  // unpaid session is ignored
  await h.webhook(checkoutCompleted(rows[0], { payment_status: 'unpaid' }));
  assert.equal((await h.signupRows())[0].state, 'invited');

  for (const s of rows) {
    const res = await h.webhook(checkoutCompleted(s));
    assert.equal(res.status, 200);
  }
  // duplicate delivery: no second mail
  await h.webhook(checkoutCompleted(rows[0]));

  const after = await h.signupRows();
  assert.ok(after.every((r) => r.state === 'paid' && r.paid_at === T0));
  assert.equal(after[0].stripe_session_id, `cs_test_paid_${rows[0].id}`);
  assert.equal((await h.dropRow()).status, 'made');
  const thanks = h.mails().filter((x) => /お支払いありがとうございました/.test(x.subject));
  assert.equal(thanks.length, 20);

  // other event types are acknowledged and ignored
  const res = await h.webhook({ id: 'evt_x', type: 'payment_intent.created', data: { object: {} } });
  assert.equal(res.status, 200);

  // made -> signups closed
  assert.equal((await h.signup(person(50), { ip: '10.9.9.9' })).status, 410);
});

test('deadline passes with fewer than 20 -> cancelled, everyone emailed, no money', async () => {
  await h.fill(5);
  h.calls.resend.length = 0;
  h.clock.now = 1796050799; // exactly the deadline
  await h.getDrop();
  assert.equal((await h.dropRow()).status, 'cancelled');
  const rows = await h.signupRows();
  assert.ok(rows.every((r) => r.state === 'cancelled'));
  const m = h.mails();
  assert.equal(m.length, 5);
  assert.ok(m.every((x) => /中止のお知らせ/.test(x.subject) && /お金は一切いただいていません/.test(x.text)));

  h.calls.resend.length = 0;
  await h.getDrop();
  assert.equal(h.mails().length, 0, 'idempotent');

  const res = await h.signup(person(9), { ip: '10.1.1.1' });
  assert.equal(res.status, 410);
  assert.equal((await h.pay(rows[0].token)).status, 410);
});

test('signups rejected after deadline even before housekeeping runs', async () => {
  h.clock.now = 1796050800;
  const res = await h.signup(person(1));
  assert.equal(res.status, 410);
});

test('/pay/:token creates a Stripe Checkout Session with server-side price', async () => {
  await h.signup(person(1, { sleeve: 'long', back_name: 'TIG', size: 'L', number: '10' }), { ip: '10.0.0.1' });
  const [first] = await h.signupRows();

  // before 20 -> explanation page, no Stripe call
  let res = await h.pay(first.token);
  assert.equal(res.status, 200);
  assert.match(await res.text(), /まだ人数がそろっていません/);
  assert.equal(h.calls.stripe.length, 0);

  await h.fill(19, 2);
  h.clock.now = T0 + 6 * DAY + 23 * 3600 + 1800; // 30 min before the pay deadline

  res = await h.pay(first.token);
  assert.equal(res.status, 303);
  assert.equal(res.headers.get('location'), 'https://checkout.stripe.test/c/1');
  assert.equal(h.calls.stripe.length, 1);
  const p = h.calls.stripe[0].params;
  assert.equal(h.calls.stripe[0].headers.authorization, 'Bearer sk_test_dummy');
  assert.equal(p.get('mode'), 'payment');
  assert.equal(p.get('line_items[0][price_data][currency]'), 'jpy');
  assert.equal(p.get('line_items[0][price_data][unit_amount]'), '10800');
  assert.match(p.get('line_items[0][price_data][product_data][name]'), /ユニ。 INK BLACK.*サイズ L.*背番号 10.*長袖.*背中の名前 TIG/);
  assert.equal(p.get('shipping_options[0][shipping_rate_data][fixed_amount][amount]'), '600');
  assert.equal(p.get('shipping_address_collection[allowed_countries][0]'), 'JP');
  assert.equal(p.get('customer_email'), 'user1@example.com');
  assert.equal(p.get('client_reference_id'), first.token);
  assert.equal(p.get('metadata[signup_id]'), String(first.id));
  assert.equal(p.get('metadata[drop_id]'), 'uni-01');
  assert.equal(p.get('success_url'), 'https://typostet.test/thank-you.html');
  assert.equal(p.get('cancel_url'), 'https://typostet.test/');
  // min(invite deadline, now+24h) but never below Stripe's 30 min minimum
  assert.equal(Number(p.get('expires_at')), h.clock.now + 31 * 60);

  // a second click reuses the open session
  res = await h.pay(first.token);
  assert.equal(res.status, 303);
  assert.equal(h.calls.stripe.length, 1);

  // paid -> explanation
  await h.webhook(checkoutCompleted(first));
  res = await h.pay(first.token);
  assert.equal(res.status, 200);
  assert.match(await res.text(), /お支払いは済んでいます/);
});

test('/pay/:token expires_at is capped at 24h; unknown / malformed tokens 404', async () => {
  await h.fill(20);
  const [s] = await h.signupRows();
  await h.pay(s.token);
  assert.equal(Number(h.calls.stripe[0].params.get('expires_at')), T0 + DAY);
  assert.equal((await h.pay('A'.repeat(32))).status, 404);
  assert.equal((await h.pay('short')).status, 404);
  assert.equal((await h.pay("x'; DROP TABLE signups;--")).status, 404);
});

test('/pay/:token for waiting signup', async () => {
  await h.fill(21);
  const rows = await h.signupRows();
  const res = await h.pay(rows[20].token);
  assert.match(await res.text(), /まだ補欠です/);
});

test('/admin: key required, HTML escaped, CSV export', async () => {
  await h.signup(person(1, { name: '<script>alert(1)</script>' }), { ip: '10.0.0.1' });
  await h.signup(person(2, { name: '=HYPERLINK("x")' }), { ip: '10.0.0.2' });

  assert.equal((await h.admin('')).status, 404);
  assert.equal((await h.admin('key=wrong')).status, 404);

  let res = await h.admin('key=admin-secret-key');
  assert.equal(res.status, 200);
  const page = await res.text();
  assert.doesNotMatch(page, /<script>alert/);
  assert.match(page, /&lt;script&gt;alert\(1\)&lt;\/script&gt;/);
  assert.match(page, /user1@example\.com/);
  assert.equal(res.headers.get('x-robots-tag'), 'noindex, nofollow');

  res = await h.admin('key=admin-secret-key&format=csv&drop=uni-01');
  assert.match(res.headers.get('content-type'), /text\/csv/);
  const bytes = new Uint8Array(await res.arrayBuffer());
  assert.deepEqual([...bytes.slice(0, 3)], [0xef, 0xbb, 0xbf], 'UTF-8 BOM for Excel');
  const csv = new TextDecoder().decode(bytes);
  const lines = csv.trim().split('\r\n');
  assert.equal(lines.length, 3);
  assert.match(lines[0], /^"drop_id","position","state"/);
  assert.match(lines[2], /"'=HYPERLINK\(""x""\)"/);
});

test('admin disabled when ADMIN_KEY is unset', async () => {
  delete h.env.ADMIN_KEY;
  assert.equal((await h.admin('key=')).status, 404);
  assert.equal((await h.admin('key=undefined')).status, 404);
});

test('without RESEND_API_KEY emails are logged, not sent', async () => {
  h.restore();
  h = setup({ resend: false });
  const logs = [];
  const orig = console.log;
  console.log = (...a) => logs.push(a.join(' '));
  try {
    assert.equal((await h.signup(person(1))).status, 201);
  } finally {
    console.log = orig;
  }
  assert.equal(h.calls.resend.length, 0);
  assert.ok(logs.some((l) => l.includes('[mail:dev]') && l.includes('申込みを受け付けました')));
});
