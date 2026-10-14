// Checks for the holes found in the pre-launch review (2026-10-15).
import { test, beforeEach, afterEach } from 'node:test';
import assert from 'node:assert/strict';
import { checkoutCompleted, person, setup, T0 } from './helpers/harness.js';
import { createDb } from './helpers/d1.js';
import { sendMails, textToHtml } from '../functions/_lib/mail.js';
import { onRequest as middleware } from '../functions/_middleware.js';

const DAY = 86400;
let h;
beforeEach(() => {
  h = setup();
});
afterEach(() => h.restore());

test('fresh database from the real migrations: DROP 02 is 30 people, 13 sizes', async () => {
  const db = createDb({ realCap: true });
  const d = await db.prepare("SELECT * FROM drops WHERE id = 'uni-01'").first();
  assert.equal(d.cap, 30);
  assert.equal(d.status, 'open');
  assert.deepEqual(JSON.parse(d.options).sizes, ['120', '130', '140', '150', '160', 'SS', 'S', 'M', 'L', 'O', 'XO', '2XO', '3XO']);
  assert.equal(d.housekept_at, 0);
});

test('signups are only counted after the confirmation button; link expires after 24h', async () => {
  let res = await h.signup(person(1), { confirm: false });
  assert.equal(res.status, 202);
  assert.equal((await res.json()).state, 'pending');
  assert.equal((await (await h.getDrop()).json()).count, 0);
  const p = await h.env.DB.prepare('SELECT * FROM pending_signups').first();

  // GET shows the button only
  res = await h.confirm(p.token, { method: 'GET', json: false });
  assert.match(await res.text(), /申込みを確定する/);
  assert.equal((await h.signupRows()).length, 0);

  // after 24h the link no longer works
  h.clock.now += DAY + 1;
  res = await h.confirm(p.token);
  assert.equal(res.status, 410);
  assert.equal((await h.signupRows()).length, 0);

  // a fresh submit gives a new link that works
  await h.signup(person(1), { ip: '10.9.9.9' });
  assert.equal((await h.signupRows()).length, 1);
});

test('same answer for an address that already signed up (no way to check who ordered)', async () => {
  await h.signup(person(1));
  const res = await h.signup(person(1), { confirm: false, ip: '10.1.1.1' });
  assert.equal(res.status, 202);
  const again = await h.env.DB.prepare('SELECT token FROM pending_signups').first();
  const c = await h.confirm(again.token);
  assert.equal(c.status, 409);
  assert.equal((await h.signupRows()).length, 1);
});

test('names that look like links are refused; back names are stored in capitals', async () => {
  for (const name of ['https://evil.example/x', 'evil.com 至急', 'www.example']) {
    const res = await h.signup(person(1, { name }), { ip: `10.2.${name.length}.1` });
    assert.equal(res.status, 422, name);
  }
  await h.signup(person(2, { back_name: 'tig' }), { ip: '10.2.9.9' });
  assert.equal((await h.signupRows())[0].back_name, 'TIG');
});

test('mail HTML only links our own site, never text a visitor typed', () => {
  const out = textToHtml('テスト https://evil.example/x さん\nhttps://typostet.com/pay/abc');
  assert.ok(!out.includes('href="https://evil.example'));
  assert.ok(out.includes('href="https://typostet.com/pay/abc"'));
});

test('a free slot while paying: the newcomer is invited straight away, no "waitlist" mail', async () => {
  await h.fill(20); // cap 20 in tests -> paying, all invited
  const rows = await h.signupRows();
  for (const s of rows.slice(0, 19)) await h.webhook(checkoutCompleted(s));
  h.clock.now = T0 + 7 * DAY + 3600 + 61;
  await h.getDrop(); // #20 expires, nobody waiting
  assert.equal((await h.signupRows())[19].state, 'expired');

  h.calls.resend.length = 0;
  const r = await (await h.signup(person(21), { ip: '10.3.3.3' })).json();
  assert.equal(r.state, 'invited');
  const m = h.mails().filter((x) => x.to === 'user21@example.com');
  assert.ok(!m.some((x) => /補欠/.test(x.subject)), 'no waitlist mail');
  assert.ok(m.some((x) => /お支払い/.test(x.subject + x.text)));
});

test('unpaid invite is kept 1h after the 7 days (open Stripe sessions can still finish)', async () => {
  await h.fill(20);
  h.clock.now = T0 + 7 * DAY + 30 * 60;
  await h.getDrop();
  assert.ok((await h.signupRows()).every((s) => s.state === 'invited'));
});

test('after the deadline, a paying drop with nobody left to pay is made with those who paid', async () => {
  await h.fill(20);
  const rows = await h.signupRows();
  for (const s of rows.slice(0, 18)) await h.webhook(checkoutCompleted(s));
  const deadline = (await h.dropRow()).deadline;
  h.clock.now = deadline + 3600 * 24 * 8; // everyone else expired, nobody waiting
  await h.getDrop();
  h.clock.now += 61;
  await h.getDrop();
  assert.equal((await h.dropRow()).status, 'made');
});

test('pay page refuses once the drop is made', async () => {
  await h.fill(20);
  const rows = await h.signupRows();
  await h.env.DB.prepare("UPDATE drops SET status = 'made' WHERE id = 'uni-01'").run();
  const res = await h.pay(rows[0].token);
  assert.equal(res.status, 410);
  assert.match(await res.text(), /そろいました/);
});

test('a refused batch is sent one by one, so one bad address cannot lose everybody', async () => {
  const sent = [];
  const fakeFetch = async (url, init) => {
    if (url.endsWith('/emails/batch')) return new Response('{"message":"invalid to"}', { status: 422 });
    const body = JSON.parse(init.body);
    if (body.to[0] === 'bad@example.com') return new Response('bad', { status: 422 });
    sent.push(body.to[0]);
    return new Response('{}', { status: 200 });
  };
  const err = console.error;
  console.error = () => {};
  try {
    const mails = ['a@example.com', 'bad@example.com', 'c@example.com'].map((to) => ({ to, subject: 's', text: 't', html: 't' }));
    const r = await sendMails({ RESEND_API_KEY: 're_x' }, mails, fakeFetch);
    assert.equal(r.sent, 2);
  } finally {
    console.error = err;
  }
  assert.deepEqual(sent, ['a@example.com', 'c@example.com']);
});

test('internal files stay hidden even with %-encoded paths', async () => {
  const asset = { fetch: async () => new Response('404 page') };
  for (const p of ['/_stripe-live-products.json', '/%5Fstripe-live-products.json', '/README.m%64', '/wrangler.tom%6C', '/%6Digrations/0001_init.sql', '/%E0%A4%A', '/.github/workflows/housekeep.yml']) {
    const res = await middleware({ request: new Request(`https://x${p}`), next: async () => new Response('SECRET'), env: { ASSETS: asset } });
    assert.equal(res.status, 404, p);
  }
  const ok = await middleware({ request: new Request('https://x/llms.txt'), next: async () => new Response('fine'), env: { ASSETS: asset } });
  assert.equal(ok.status, 200);
});
