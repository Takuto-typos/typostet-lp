# functions/ — 20人集まったら作る (backend)

Cloudflare Pages Functions + D1. No framework, no runtime dependencies. Stripe and Resend are called with `fetch`.
Spec: `../../docs/specs/2026-10-14-20-drops.md`.

## Routes

| Route | File | What it does |
|---|---|---|
| `GET /api/drops/:id` | `api/drops/[id]/index.js` | `{ id, name, count, cap, waiting, deadline, status, price, shipping, options }`. Real numbers only. Runs housekeeping via `waitUntil`. |
| `POST /api/drops/:id/signup` | `api/drops/[id]/signup.js` | JSON or form-encoded. Fields: `email`, `name`, `size` (XS–XL), `number` (1–99), `back_name` (optional, A–Z a–z space . -, max 12), `sleeve` (`short`/`long`), honeypot `website` (must be empty). |
| `GET /pay/:token` | `pay/[token].js` | Creates (or reuses) a Stripe Checkout Session and 303-redirects. Otherwise a small explanation page. |
| `POST /api/stripe/webhook` | `api/stripe/webhook.js` | `checkout.session.completed` (+ `async_payment_succeeded`) → paid + thanks mail; all paid → drop `made`. |
| `GET /admin?key=...` | `admin.js` | Signup table. `&drop=uni-01`, `&format=csv` (UTF-8 BOM for Excel). Below it: 新着のお知らせ (active count, subscriber table, `&format=csv&view=subscribers`) and a notify form per `open` drop. |
| `POST /api/subscribe` | `api/subscribe.js` | 新着 stet を受け取る. JSON or form-encoded: `email`, honeypot `website`, optional `source` (`[a-z0-9_-]{1,40}`, e.g. `top`). |
| `GET /unsubscribe/:token` | `unsubscribe/[token].js` | Confirm page with a POST button (link prefetchers/scanners can't unsubscribe anyone). |
| `POST /unsubscribe/:token` | `unsubscribe/[token].js` | Sets `unsubscribed_at` →「配信を止めました」. Also the RFC 8058 one-click target. |
| `POST /admin/notify?key=...&drop=<id>` | `admin/notify.js` | Form field `confirm=<id>` required. Sends the new-drop announcement to every active subscriber who hasn't had it for that drop. `open` drops only. |

Shared code lives in `_lib/` (`drops.js` = state machine, `mail.js` = all 8 email templates + senders, `subscribers.js` = the お知らせ list, `request.js` = body parsing, `stripe.js`, `pricing.js`, `validate.js`, `util.js`, `page.js`).

### Signup responses (for the front-end)

- JSON request (or `Accept: application/json`): `201 { ok, state: "reserved"|"waiting", position, waiting_rank, count, cap, waiting, status, message }`.
  Errors: `{ ok:false, error, message, fields? }` with 400 (bad body / honeypot), 404, 409 (`duplicate`), 410 (`closed`/`cancelled`), 422 (`invalid`, per-field messages in `fields`), 429 (`rate_limited`).
- Plain HTML form post: `303` to `/?signup=reserved&n=7#drop`, `/?signup=waiting&n=2#drop`, or `/?signup=error&reason=duplicate#drop`.

### Subscribe responses (for the front-end)

- JSON request (or `Accept: application/json`): `200 { ok:true, message:"登録しました。新しいデザインが出たら、このアドレスにお知らせします。" }`.
  The answer is identical for a new address and one that is already on the list (no mail is sent the second time), so the form can't be used to check who is subscribed.
  Errors: `{ ok:false, error, message }` with 400 (`bad_request`: unreadable body / honeypot), 422 (`invalid` email), 429 (`rate_limited`), 500.
- Plain HTML form post: `303` to `/?subscribe=ok#news` or `/?subscribe=error#news`.

## 新着のお知らせ (mailing list)

- `subscribers`: one row per address (`email UNIQUE COLLATE NOCASE`, stored lower-cased), 192-bit random `token` for the unsubscribe link, `unsubscribed_at` NULL = active.
  New → insert + welcome mail. Already active → nothing. Unsubscribed → reactivated (same token, `created_at` kept) + welcome mail.
- `drop_notices (drop_id, subscriber_id)` PRIMARY KEY: a drop is announced to each person at most once. Rows are claimed with `INSERT OR IGNORE ... RETURNING` *before* each Resend batch call (≤100 mails), so two notify runs at the same time can't double-send; if Resend rejects a chunk, its claims are deleted and the run stops (press again to resume — only people still missing get it).
- Without `RESEND_API_KEY` (local dev) the notify run only prints the mails to the console and records nothing.
- Every list mail carries (特定電子メール法) 送信者名「TYP0stet(株式会社 Remoi)」, the address, info@typostet.com and the unsubscribe link `${SITE_URL}/unsubscribe/<token>`, plus `List-Unsubscribe: <...>` and `List-Unsubscribe-Post: List-Unsubscribe=One-Click` headers (RFC 8058; Gmail/Yahoo bulk-sender requirement).
- Rate limit: same rule as signup (5 per IP per 10 minutes), separate bucket. Invalid / honeypot attempts count too.
- To announce a drop: open `/admin?key=...`, type the drop id into the confirm box under 新着のお知らせ, press 送る. The result page shows how many went out.

## State machine

- `drops.status`: `open` → `paying` (cap reached) → `made` (all cap paid). `open` → `cancelled` if the deadline passes first.
- `signups.state`: `reserved` → `invited` → `paid` / `expired` (7 days unpaid). Over cap: `waiting` → `invited` (promoted in order). Drop cancelled: `reserved`/`waiting` → `cancelled`.
- Position and reserved/waiting are decided inside a single `INSERT ... SELECT` statement (atomic in D1), with `UNIQUE(drop_id, position)` and `UNIQUE(drop_id, email)` as backstops.
- Housekeeping (`housekeep()` in `_lib/drops.js`) is a list of conditional `UPDATE ... RETURNING` statements, so it is idempotent and each email goes out once per transition.
- Rate limit: 5 signup attempts per IP per 10 minutes (IP stored as SHA-256 hash in `rate_limits`, pruned after a day).

## Environment

| Name | Where | Notes |
|---|---|---|
| `DB` | `wrangler.toml` D1 binding | replace the placeholder `database_id` |
| `SITE_URL` | `wrangler.toml` `[vars]` | `https://typostet.com` |
| `STRIPE_SECRET_KEY` | secret | |
| `STRIPE_WEBHOOK_SECRET` | secret | `whsec_...` of the webhook endpoint |
| `RESEND_API_KEY` | secret | if missing, emails are printed to the console instead (local dev) |
| `ADMIN_KEY` | secret | long random string; `/admin` returns 404 if unset |

## Local development

```sh
# from lp/
cat > .dev.vars <<'VARS'
SITE_URL = "http://localhost:8788"
ADMIN_KEY = "local-admin"
STRIPE_WEBHOOK_SECRET = "whsec_local"
# STRIPE_SECRET_KEY = "sk_test_..."   # test-mode key only
VARS
npm run db:migrate:local      # wrangler d1 migrations apply typostet-drops --local (0001-0003)
npm run dev                   # wrangler pages dev .  -> http://localhost:8788
npm test                      # node:test + node:sqlite (Node >= 22.5), no install needed
```

`.dev.vars` is git-ignored. Stripe webhooks can be forwarded locally with `stripe listen --forward-to localhost:8788/api/stripe/webhook`.

## Going live (one-time)

1. `npx wrangler d1 create typostet-drops` → put the printed id into `wrangler.toml` `database_id`.
2. `npx wrangler d1 migrations apply typostet-drops --remote` (applies whatever is new, e.g. `0003_subscribers.sql` on a DB that already has 0001-0002)
3. Set secrets in Pages (Settings → Variables and Secrets, Production): `STRIPE_SECRET_KEY`, `STRIPE_WEBHOOK_SECRET`, `RESEND_API_KEY`, `ADMIN_KEY`.
4. Stripe Dashboard → Developers → Webhooks → add endpoint `https://typostet.com/api/stripe/webhook`, events `checkout.session.completed` and `checkout.session.async_payment_succeeded`. Copy its signing secret into `STRIPE_WEBHOOK_SECRET`.
5. Resend: verify `typostet.com` as a sending domain (sender is `hello@typostet.com`).
