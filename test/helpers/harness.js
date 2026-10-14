// Test harness: env with D1 shim, fetch mock for Stripe/Resend, fake clock, handler invokers.

import { createDb } from './d1.js';
import { onRequestGet as getDropHandler } from '../../functions/api/drops/[id]/index.js';
import { onRequestPost as signupHandler } from '../../functions/api/drops/[id]/signup.js';
import { onRequestGet as confirmGetHandler, onRequestPost as confirmPostHandler } from '../../functions/confirm/[token].js';
import { onRequestGet as newsGetHandler, onRequestPost as newsPostHandler } from '../../functions/news/[token].js';
import { onRequestGet as payHandler } from '../../functions/pay/[token].js';
import { onRequestPost as webhookHandler } from '../../functions/api/stripe/webhook.js';
import { onRequestGet as adminHandler } from '../../functions/admin.js';
import { onRequestPost as notifyHandler } from '../../functions/admin/notify.js';
import { onRequestPost as subscribeHandler } from '../../functions/api/subscribe.js';
import { onRequestGet as unsubscribeGetHandler, onRequestPost as unsubscribePostHandler } from '../../functions/unsubscribe/[token].js';
import { signPayload } from '../../functions/_lib/stripe.js';

export const T0 = Date.parse('2026-10-20T12:00:00+09:00') / 1000;

export function setup({ resend = true } = {}) {
  const env = {
    DB: createDb(),
    SITE_URL: 'https://typostet.test',
    ADMIN_KEY: 'admin-secret-key',
    STRIPE_SECRET_KEY: 'sk_test_dummy',
    STRIPE_WEBHOOK_SECRET: 'whsec_test_dummy',
  };
  if (resend) env.RESEND_API_KEY = 're_test_dummy';

  const clock = { now: T0 };
  const realNow = Date.now;
  Date.now = () => clock.now * 1000;

  const calls = { resend: [], stripe: [] };
  let sessionSeq = 0;
  const realFetch = globalThis.fetch;
  globalThis.fetch = async (url, init = {}) => {
    const u = String(url);
    if (u.startsWith('https://api.resend.com/')) {
      const body = JSON.parse(init.body);
      calls.resend.push({ url: u, headers: init.headers, body });
      const n = Array.isArray(body) ? body.length : 1;
      return new Response(JSON.stringify({ data: Array.from({ length: n }, (_, i) => ({ id: `m${i}` })) }), { status: 200 });
    }
    if (u.startsWith('https://api.stripe.com/')) {
      const params = new URLSearchParams(init.body);
      calls.stripe.push({ url: u, headers: init.headers, params });
      sessionSeq += 1;
      return new Response(
        JSON.stringify({
          id: `cs_test_${sessionSeq}`,
          url: `https://checkout.stripe.test/c/${sessionSeq}`,
          expires_at: Number(params.get('expires_at')),
        }),
        { status: 200 },
      );
    }
    throw new Error(`unexpected fetch ${u}`);
  };

  const restore = () => {
    Date.now = realNow;
    globalThis.fetch = realFetch;
  };

  async function invoke(handler, request, params = {}) {
    const pending = [];
    const res = await handler({ request, env, params, waitUntil: (p) => pending.push(p) });
    await Promise.all(pending);
    return res;
  }

  /** All emails sent so far, flattened: [{to, subject, text}] */
  function mails() {
    return calls.resend.flatMap((c) => (Array.isArray(c.body) ? c.body : [c.body])).map((m) => ({ to: m.to[0], subject: m.subject, text: m.text }));
  }

  const api = {
    env,
    clock,
    calls,
    mails,
    restore,
    async getDrop(id = 'uni-01') {
      return invoke(getDropHandler, new Request(`https://x/api/drops/${id}`), { id });
    },
    /**
     * Full signup as a person does it: submit the form, then press the button in the
     * confirmation mail. Returns the confirm response (JSON), or the submit response if
     * the submit was refused. Pass { confirm: false } to only submit.
     */
    async signup(fields, opts = {}) {
      const res = await api.submit(fields, opts);
      if (opts.confirm === false || res.status !== 202) return res;
      const email = String(fields.email || '').trim().toLowerCase();
      const p = await env.DB.prepare('SELECT token FROM pending_signups WHERE email = ? ORDER BY id DESC').bind(email).first();
      return api.confirm(p.token);
    },
    async confirm(token, { method = 'POST', json = true } = {}) {
      const handler = method === 'POST' ? confirmPostHandler : confirmGetHandler;
      const headers = json ? { accept: 'application/json' } : {};
      return invoke(handler, new Request(`https://x/confirm/${token}`, { method, headers }), { token });
    },
    async news(token, { method = 'POST' } = {}) {
      const handler = method === 'POST' ? newsPostHandler : newsGetHandler;
      return invoke(handler, new Request(`https://x/news/${token}`, { method }), { token });
    },
    async submit(fields, { id = 'uni-01', ip = '203.0.113.1', form = false, accept } = {}) {
      const headers = { 'cf-connecting-ip': ip };
      let body;
      if (form) {
        headers['content-type'] = 'application/x-www-form-urlencoded';
        body = new URLSearchParams(fields).toString();
      } else {
        headers['content-type'] = 'application/json';
        body = JSON.stringify(fields);
      }
      if (accept) headers.accept = accept;
      return invoke(signupHandler, new Request(`https://x/api/drops/${id}/signup`, { method: 'POST', headers, body }), { id });
    },
    async pay(token) {
      return invoke(payHandler, new Request(`https://x/pay/${token}`), { token });
    },
    async webhook(event, { secret = env.STRIPE_WEBHOOK_SECRET, t = clock.now, sig } = {}) {
      const payload = JSON.stringify(event);
      const header = sig ?? `t=${t},v1=${await signPayload(secret, t, payload)}`;
      return invoke(
        webhookHandler,
        new Request('https://x/api/stripe/webhook', { method: 'POST', headers: { 'stripe-signature': header }, body: payload }),
      );
    },
    async admin(query) {
      return invoke(adminHandler, new Request(`https://x/admin?${query}`));
    },
    /**
     * Subscribe as a person does it: submit, then press the button in the confirmation mail.
     * Returns the submit response. Pass { confirm: false } to only submit.
     */
    async subscribe(fields, opts = {}) {
      const res = await api.subscribeSubmit(fields, opts);
      if (opts.confirm === false || !(res.status === 200 || res.status === 303)) return res;
      const email = String(fields.email || '').trim().toLowerCase();
      const row = await env.DB.prepare('SELECT token FROM subscribers WHERE email = ?').bind(email).first();
      if (row) await api.news(row.token);
      return res;
    },
    async subscribeSubmit(fields, { ip = '203.0.113.50', form = false, accept } = {}) {
      const headers = { 'cf-connecting-ip': ip };
      let body;
      if (form) {
        headers['content-type'] = 'application/x-www-form-urlencoded';
        body = new URLSearchParams(fields).toString();
      } else {
        headers['content-type'] = 'application/json';
        body = JSON.stringify(fields);
      }
      if (accept) headers.accept = accept;
      return invoke(subscribeHandler, new Request('https://x/api/subscribe', { method: 'POST', headers, body }));
    },
    async unsubscribe(token, { method = 'GET', oneClick = false } = {}) {
      const init = { method };
      if (oneClick) {
        init.headers = { 'content-type': 'application/x-www-form-urlencoded' };
        init.body = 'List-Unsubscribe=One-Click';
      }
      const handler = method === 'POST' ? unsubscribePostHandler : unsubscribeGetHandler;
      return invoke(handler, new Request(`https://x/unsubscribe/${token}`, init), { token });
    },
    async notify(query, fields = {}) {
      return invoke(
        notifyHandler,
        new Request(`https://x/admin/notify?${query}`, {
          method: 'POST',
          headers: { 'content-type': 'application/x-www-form-urlencoded' },
          body: new URLSearchParams(fields).toString(),
        }),
      );
    },
    async subscriberRows() {
      return (await env.DB.prepare('SELECT * FROM subscribers ORDER BY id').all()).results;
    },
    async signupRows(id = 'uni-01') {
      return (await env.DB.prepare('SELECT * FROM signups WHERE drop_id = ? ORDER BY position').bind(id).all()).results;
    },
    async dropRow(id = 'uni-01') {
      return env.DB.prepare('SELECT * FROM drops WHERE id = ?').bind(id).first();
    },
    /** n valid signups, each from a different IP to stay under the rate limit. */
    async fill(n, start = 1) {
      const out = [];
      for (let i = start; i < start + n; i++) {
        const res = await api.signup(person(i), { ip: `198.51.100.${i}` });
        out.push(res);
      }
      return out;
    },
  };
  return api;
}

export function person(i, extra = {}) {
  return {
    email: `user${i}@example.com`,
    name: `テスト ${i}`,
    size: 'M',
    number: String((i % 99) + 1),
    sleeve: 'short',
    back_name: '',
    website: '',
    ...extra,
  };
}

export function checkoutCompleted(signup, overrides = {}) {
  return {
    id: `evt_${signup.id}`,
    type: 'checkout.session.completed',
    data: {
      object: {
        id: `cs_test_paid_${signup.id}`,
        payment_status: 'paid',
        client_reference_id: signup.token,
        metadata: { signup_id: String(signup.id), drop_id: signup.drop_id },
        ...overrides,
      },
    },
  };
}
