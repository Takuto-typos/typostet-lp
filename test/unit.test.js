import { test } from 'node:test';
import assert from 'node:assert/strict';
import { calcPrice } from '../functions/_lib/pricing.js';
import { validateSignup } from '../functions/_lib/validate.js';
import { signPayload, toForm, verifyStripeSignature } from '../functions/_lib/stripe.js';
import { escapeHtml, formatJst, isoJst, randomToken, safeEqual } from '../functions/_lib/util.js';
import { cancelledMail, inviteMail, receiptMail } from '../functions/_lib/mail.js';

const drop = {
  id: 'uni-01',
  name: 'ユニ。 INK BLACK',
  price: 8800,
  shipping: 600,
  cap: 20,
  deadline: 1796050799,
  options: '{"sizes":["XS","S","M","L","XL"],"sleeve":{"short":0,"long":1000},"back_name":1000}',
};

test('price: base / long sleeve / back name / both', () => {
  assert.deepEqual(calcPrice(drop, { sleeve: 'short', back_name: null }), { item: 8800, shipping: 600, total: 9400 });
  assert.deepEqual(calcPrice(drop, { sleeve: 'long', back_name: null }), { item: 9800, shipping: 600, total: 10400 });
  assert.deepEqual(calcPrice(drop, { sleeve: 'short', back_name: 'TIG' }), { item: 9800, shipping: 600, total: 10400 });
  assert.deepEqual(calcPrice(drop, { sleeve: 'long', back_name: 'TIG' }), { item: 10800, shipping: 600, total: 11400 });
  assert.throws(() => calcPrice(drop, { sleeve: 'tank' }));
});

test('price: options are per drop', () => {
  const other = { ...drop, price: 6800, shipping: 0, options: '{"sleeve":{"short":0},"back_name":500}' };
  assert.deepEqual(calcPrice(other, { sleeve: 'short', back_name: 'A' }), { item: 7300, shipping: 0, total: 7300 });
  assert.throws(() => calcPrice(other, { sleeve: 'long' }));
});

const valid = { email: ' Taro@Example.com ', name: '山田 太郎', size: 'm', number: '7', back_name: 'TARO', sleeve: 'long', website: '' };

test('validation: accepts and normalises a valid signup', () => {
  const r = validateSignup(valid, drop);
  assert.equal(r.ok, true);
  assert.deepEqual(r.value, { email: 'taro@example.com', name: '山田 太郎', size: 'M', number: 7, back_name: 'TARO', sleeve: 'long', number_pos: 'hem' });
  assert.equal(validateSignup({ ...valid, number_pos: 'chest' }, drop).value.number_pos, 'chest');
  assert.equal(validateSignup({ ...valid, back_name: '' }, drop).value.back_name, null);
  assert.equal(validateSignup({ ...valid, back_name: 'J. Doe-X' }, drop).ok, true);
  assert.equal(validateSignup({ ...valid, number: 99 }, drop).ok, true);
  assert.equal(validateSignup({ ...valid, number: '1' }, drop).ok, true);
});

test('validation: rejects bad fields', () => {
  const bad = (patch, field) => {
    const r = validateSignup({ ...valid, ...patch }, drop);
    assert.equal(r.ok, false, JSON.stringify(patch));
    assert.ok(r.fields[field], `expected error on ${field} for ${JSON.stringify(patch)}`);
  };
  bad({ email: 'nope' }, 'email');
  bad({ email: '' }, 'email');
  bad({ email: 'a@b' }, 'email');
  bad({ name: '' }, 'name');
  bad({ name: 'x'.repeat(41) }, 'name');
  bad({ name: 'a\u0000b' }, 'name');
  bad({ size: 'XXL' }, 'size');
  bad({ number_pos: 'back' }, 'number_pos');
  bad({ number: '0' }, 'number');
  bad({ number: '100' }, 'number');
  bad({ number: '7a' }, 'number');
  bad({ number: '3.5' }, 'number');
  bad({ number: '' }, 'number');
  bad({ back_name: 'ABCDEFGHIJKLM' }, 'back_name');
  bad({ back_name: 'たろう' }, 'back_name');
  bad({ back_name: 'TARO7' }, 'back_name');
  bad({ back_name: '<b>' }, 'back_name');
  bad({ sleeve: 'tank' }, 'sleeve');
});

test('validation: honeypot', () => {
  const r = validateSignup({ ...valid, website: 'http://spam' }, drop);
  assert.equal(r.ok, false);
  assert.equal(r.honeypot, true);
});

test('stripe signature: valid, wrong secret, tampered, stale, future, garbage', async () => {
  const secret = 'whsec_abc';
  const payload = '{"id":"evt_1"}';
  const t = 1_800_000_000;
  const sig = await signPayload(secret, t, payload);
  assert.equal(await verifyStripeSignature(payload, `t=${t},v1=${sig}`, secret, t + 10), true);
  assert.equal(await verifyStripeSignature(payload, `t=${t},v1=deadbeef,v1=${sig}`, secret, t), true, 'any v1 may match');
  assert.equal(await verifyStripeSignature(payload, `t=${t},v1=${sig}`, 'whsec_other', t), false);
  assert.equal(await verifyStripeSignature(payload + ' ', `t=${t},v1=${sig}`, secret, t), false);
  assert.equal(await verifyStripeSignature(payload, `t=${t},v1=${sig}`, secret, t + 301), false);
  assert.equal(await verifyStripeSignature(payload, `t=${t},v1=${sig}`, secret, t - 301), false);
  assert.equal(await verifyStripeSignature(payload, `t=${t},v1=${sig}`, secret, t + 300), true);
  assert.equal(await verifyStripeSignature(payload, `v1=${sig}`, secret, t), false);
  assert.equal(await verifyStripeSignature(payload, '', secret, t), false);
  assert.equal(await verifyStripeSignature(payload, `t=${t},v0=${sig}`, secret, t), false);
});

test('toForm flattens nested params Stripe-style', () => {
  const f = toForm({ a: 1, b: { c: 'x', d: [{ e: 2 }] }, skip: undefined });
  assert.equal(f.toString(), 'a=1&b%5Bc%5D=x&b%5Bd%5D%5B0%5D%5Be%5D=2');
});

test('util: tokens, escaping, time formatting, safeEqual', async () => {
  const t = randomToken();
  assert.match(t, /^[A-Za-z0-9_-]{32}$/); // 24 bytes = 192 bits
  assert.notEqual(randomToken(), t);
  assert.equal(escapeHtml(`<a href="x">'&`), '&lt;a href=&quot;x&quot;&gt;&#39;&amp;');
  assert.equal(formatJst(1796050799), '2026年11月30日 23:59');
  assert.equal(isoJst(1796050799), '2026-11-30T23:59:59+09:00');
  assert.equal(await safeEqual('abc', 'abc'), true);
  assert.equal(await safeEqual('abc', 'abd'), false);
  assert.equal(await safeEqual('abc', null), false);
});

test('mail copy: no exclamation marks / emoji, required facts present', () => {
  const env = { SITE_URL: 'https://typostet.com' };
  const s = { id: 1, token: 'tok_abcdefghijklmnopqrstuvwx', email: 'a@example.com', name: 'A', size: 'M', number: 7, sleeve: 'long', back_name: 'TIG', position: 3, state: 'reserved', invited_at: 1792000000 };
  const mails = [
    receiptMail(env, drop, s),
    receiptMail(env, drop, { ...s, state: 'waiting' }, { waitingRank: 2 }),
    inviteMail(env, drop, s),
    cancelledMail(env, drop, s),
  ];
  for (const m of mails) {
    assert.doesNotMatch(m.text + m.subject, /[!！]/);
    assert.doesNotMatch(m.text + m.subject, /\p{Extended_Pictographic}/u);
    assert.match(m.html, /^<!doctype html>/);
  }
  assert.match(mails[0].text, /20 枚だけ作ります。再販はしません。/);
  assert.match(mails[2].text, /https:\/\/typostet\.com\/pay\/tok_abcdefghijklmnopqrstuvwx/);
  assert.match(mails[2].text, /¥10,800\(税込\)\+ 送料 ¥600 = ¥11,400/);
  assert.match(mails[3].text, /お金は一切いただいていません/);
});
