// All emails for the 30-person drop flow + the 新着のお知らせ list, and the Resend senders.
// Copy rules: です・ます調 / 普通の話し言葉 / 短く / 煽らない / 絵文字なし.

import { calcPrice, describeChoice } from './pricing.js';
import { escapeHtml, formatJst, maskEmail, PAY_WINDOW, sha256Hex, siteUrl, yen } from './util.js';

export const FROM = 'TYP0stet <hello@typostet.com>';
const RESEND_URL = 'https://api.resend.com';

function footer(env) {
  return ['', '--', 'TYP0stet', siteUrl(env), 'このメールに返信すると、TYP0stet に届きます。'].join('\n');
}

function summary(drop, s) {
  const p = calcPrice(drop, s);
  return [
    '申込み内容',
    `・${drop.name}`,
    `・${describeChoice(s)}`,
    `・${yen(p.item)}(税込)+ 送料 ${yen(p.shipping)} = ${yen(p.total)}`,
  ].join('\n');
}

function payLink(env, s) {
  return `${siteUrl(env)}/pay/${s.token}`;
}

// Only our own links become clickable (never text a visitor typed, e.g. a name).
const OWN_LINK_RE = /(https?:\/\/(?:typostet\.com|typostet\.test|localhost(?::\d+)?)(?:\/[^\s<]*)?)/g;

/** Plain text -> minimal HTML (escaped, line breaks, our own links clickable). */
export function textToHtml(text) {
  const body = escapeHtml(text)
    .replace(OWN_LINK_RE, '<a href="$1">$1</a>')
    .replace(/\n/g, '<br>\n');
  return `<!doctype html><html lang="ja"><body style="font-family:-apple-system,'Hiragino Sans','Noto Sans JP',sans-serif;font-size:15px;line-height:1.8;color:#1a1a1a;max-width:560px;margin:0 auto;padding:24px;">${body}</body></html>`;
}

function build(env, to, subject, lines, idempotencyKey) {
  const text = [...lines, footer(env)].join('\n');
  return { to, subject, text, html: textToHtml(text), idempotencyKey };
}

// ---------------------------------------------------------------------------
// 0. 申込みの確認(ボタンを押したら申込みが確定して順番が決まる)。名前は入れない
// ---------------------------------------------------------------------------
export function confirmSignupMail(env, drop, pending) {
  const value = JSON.parse(pending.payload);
  return build(
    env,
    pending.email,
    `申込みの確認(${drop.name})`,
    [
      'TYP0stet です。',
      '',
      `${drop.name} の申込みを確定する前に、メールアドレスの確認をお願いします。`,
      '下のリンクを開いて「申込みを確定する」を押すと、申込みが確定して順番が決まります。',
      '',
      `${siteUrl(env)}/confirm/${pending.token}`,
      '',
      'リンクの有効期限は24時間です。',
      'このメールに心当たりがない場合は、何もしなくて大丈夫です。申込みにはなりません。',
      '',
      summary(drop, value),
    ],
    `confirm-${pending.id}-${pending.created_at}`,
  );
}

// ---------------------------------------------------------------------------
// 1. 受付(本申込み / 補欠)
// ---------------------------------------------------------------------------
export function receiptMail(env, drop, s, { waitingRank } = {}) {
  if (s.state === 'waiting') {
    return build(
      env,
      s.email,
      `補欠で受け付けました(${drop.name})`,
      [
        `${s.name} さん`,
        '',
        `${drop.name} の申込みを、補欠として受け付けました。`,
        `補欠の ${waitingRank || '-'} 番目です。`,
        '',
        `このドロップは ${drop.cap} 枚だけ作ります。再販はしません。`,
        `今は ${drop.cap} 人の枠が埋まっています。`,
        'お支払い期限までに支払わなかった方が出た場合、補欠の先頭から順に繰り上げて、このアドレスにご案内します。',
        '繰り上げにならなかった場合、お金は一切かかりません。',
        '',
        summary(drop, s),
      ],
      `receipt-${s.id}`,
    );
  }
  return build(
    env,
    s.email,
    `申込みを受け付けました(${drop.name} / ${s.position}番目)`,
    [
      `${s.name} さん`,
      '',
      `${drop.name} の申込みを受け付けました。`,
      `${s.position} 番目です。`,
      '',
      `このドロップは ${drop.cap} 枚だけ作ります。再販はしません。`,
      `${drop.cap} 人そろったら、お支払いのご案内をこのアドレスに送ります。`,
      '今の時点でお金はかかりません。',
      '',
      `締め切りは ${formatJst(drop.deadline)} です。`,
      `それまでに ${drop.cap} 人に届かなかった場合は中止して、お知らせをお送りします。その場合もお金はかかりません。`,
      '',
      summary(drop, s),
    ],
    `receipt-${s.id}`,
  );
}

// ---------------------------------------------------------------------------
// 2. 30人そろいました・支払いのお願い
// ---------------------------------------------------------------------------
export function inviteMail(env, drop, s) {
  const due = Number(s.invited_at) + PAY_WINDOW;
  return build(
    env,
    s.email,
    `${drop.cap}人そろいました。お支払いのご案内です(${drop.name})`,
    [
      `${s.name} さん`,
      '',
      `${drop.name} の申込みが ${drop.cap} 人そろいました。製作に進みます。`,
      '下のリンクからお支払いをお願いします。あなた専用のリンクです。',
      '',
      payLink(env, s),
      '',
      `お支払い期限: ${formatJst(due)}`,
      '期限を過ぎると、枠は補欠の方に移ります。',
      '届け先の住所は、お支払いのページで入力してください(日本国内のみ)。',
      '',
      `${drop.cap} 枚だけ作ります。再販はしません。`,
      '',
      summary(drop, s),
    ],
    `invite-${s.id}-${s.invited_at}`,
  );
}

// ---------------------------------------------------------------------------
// 3. 繰り上げのお知らせ(補欠 -> 本申込み)
// ---------------------------------------------------------------------------
export function promotedMail(env, drop, s) {
  const due = Number(s.invited_at) + PAY_WINDOW;
  return build(
    env,
    s.email,
    `繰り上げのお知らせ(${drop.name})`,
    [
      `${s.name} さん`,
      '',
      `${drop.name} で枠がひとつ空いたので、補欠から繰り上げになりました。`,
      '下のリンクからお支払いをお願いします。あなた専用のリンクです。',
      '',
      payLink(env, s),
      '',
      `お支払い期限: ${formatJst(due)}`,
      '期限を過ぎると、枠は次の補欠の方に移ります。',
      '届け先の住所は、お支払いのページで入力してください(日本国内のみ)。',
      '',
      `${drop.cap} 枚だけ作ります。再販はしません。`,
      '',
      summary(drop, s),
    ],
    `promoted-${s.id}-${s.invited_at}`,
  );
}

// ---------------------------------------------------------------------------
// 4. 支払い期限が切れました
// ---------------------------------------------------------------------------
export function expiredMail(env, drop, s) {
  return build(
    env,
    s.email,
    `お支払い期限が過ぎました(${drop.name})`,
    [
      `${s.name} さん`,
      '',
      `${drop.name} のお支払い期限(${formatJst(Number(s.invited_at) + PAY_WINDOW)})が過ぎたため、今回の申込みは取り消しになりました。`,
      '枠は補欠の方に移ります。',
      'お金は一切いただいていません。',
      '',
      '申込みいただき、ありがとうございました。',
    ],
    `expired-${s.id}`,
  );
}

// ---------------------------------------------------------------------------
// 5. 中止のお知らせ
// ---------------------------------------------------------------------------
export function cancelledMail(env, drop, s) {
  return build(
    env,
    s.email,
    `中止のお知らせ(${drop.name})`,
    [
      `${s.name} さん`,
      '',
      `締め切りの ${formatJst(drop.deadline)} までに ${drop.cap} 人に届かなかったため、${drop.name} は中止します。`,
      'お金は一切いただいていません。お支払いの手続きも必要ありません。',
      '',
      '申込みいただき、ありがとうございました。',
    ],
    `cancelled-${s.id}`,
  );
}

// ---------------------------------------------------------------------------
// 6. 支払いありがとう
// ---------------------------------------------------------------------------
export function paidMail(env, drop, s) {
  return build(
    env,
    s.email,
    `お支払いありがとうございました(${drop.name})`,
    [
      `${s.name} さん`,
      '',
      'お支払いを確認しました。ありがとうございます。',
      'Stripe から届く領収のメールとは別に、これからの流れをお送りします。',
      '',
      `1. ${drop.cap} 人全員のお支払いがそろったら、製作に入ります。`,
      '2. 製作には約3〜4週間かかる予定です。',
      '3. 発送したら、このアドレスにお知らせします。',
      '',
      `${drop.cap} 枚だけ作ります。再販はしません。`,
      '',
      summary(drop, s),
    ],
    `paid-${s.id}`,
  );
}

// ---------------------------------------------------------------------------
// 7-8. 新着 stet を受け取る(お知らせリスト)
// 特定電子メール法: 送信者名・住所・問い合わせ先・配信停止の方法を毎通に入れる。
// RFC 8058: List-Unsubscribe + List-Unsubscribe-Post でワンクリック停止。
// ---------------------------------------------------------------------------
export const SENDER_NAME = 'TYP0stet(株式会社 Remoi)';
export const SENDER_ADDRESS = '〒115-0045 東京都北区赤羽 1-59-8 日ノ出ビル 4F';
export const CONTACT_EMAIL = 'info@typostet.com';

export function unsubscribeUrl(env, sub) {
  return `${siteUrl(env)}/unsubscribe/${sub.token}`;
}

function listMail(env, sub, subject, lines, idempotencyKey) {
  const unsub = unsubscribeUrl(env, sub);
  const text = [
    ...lines,
    '',
    '--',
    SENDER_NAME,
    SENDER_ADDRESS,
    `お問い合わせ: ${CONTACT_EMAIL}`,
    siteUrl(env),
    '',
    'お知らせが不要になったら、こちらから止められます。',
    unsub,
  ].join('\n');
  return {
    to: sub.email,
    subject,
    text,
    html: textToHtml(text),
    idempotencyKey,
    headers: {
      'List-Unsubscribe': `<${unsub}>`,
      'List-Unsubscribe-Post': 'List-Unsubscribe=One-Click',
    },
  };
}

// 新着のお知らせの登録確認。ボタンを押すまで配信先に入れない(特定電子メール法の同意の確認)
export function newsConfirmMail(env, sub, now) {
  return build(
    env,
    sub.email,
    '新着のお知らせの登録確認(TYP0stet)',
    [
      'TYP0stet です。',
      '',
      '新着のお知らせの登録を受け付ける前に、メールアドレスの確認をお願いします。',
      '下のリンクを開いて「登録する」を押すと、登録が終わります。',
      '',
      `${siteUrl(env)}/news/${sub.token}`,
      '',
      'このメールに心当たりがない場合は、何もしなくて大丈夫です。登録されません。',
    ],
    `news-confirm-${sub.id}-${now}`,
  );
}

export function dropAnnounceMail(env, drop, sub) {
  return listMail(
    env,
    sub,
    `新しいデザインが出ました(${drop.name})`,
    [
      'TYP0stet です。',
      '',
      `新しいドロップ「${drop.name}」の申込みを始めました。`,
      `世界に${drop.cap}着だけ。再販はしません。`,
      `${drop.cap} 人そろったら作ります。そろうまで、お金はかかりません。`,
      '',
      `締め切り: ${formatJst(drop.deadline)}`,
      '',
      '申込みはこちらから。',
      `${siteUrl(env)}/#join`,
    ],
    `announce-${drop.id}-${sub.id}`,
  );
}

// ---------------------------------------------------------------------------
// Sender (Resend REST API). Without RESEND_API_KEY, prints to console (local dev).
// ---------------------------------------------------------------------------
function toResend(m) {
  const out = { from: FROM, reply_to: CONTACT_EMAIL, to: [m.to], subject: m.subject, text: m.text, html: m.html };
  if (m.headers) out.headers = m.headers;
  return out;
}

const sleep = (ms) => new Promise((r) => setTimeout(r, ms));

/** POST to Resend, retrying network errors, 429 and 5xx (3 tries). Returns the last Response. */
async function postResend(fetchImpl, path, headers, body) {
  let lastErr;
  for (let attempt = 0; attempt < 3; attempt++) {
    if (attempt) await sleep(600 * 3 ** (attempt - 1));
    try {
      const res = await fetchImpl(`${RESEND_URL}${path}`, { method: 'POST', headers, body });
      if (res.ok || (res.status < 500 && res.status !== 429)) return res;
      lastErr = new Error(`resend ${path} ${res.status}: ${(await res.text()).slice(0, 200)}`);
    } catch (err) {
      lastErr = err;
    }
  }
  throw lastErr;
}

async function sendOne(fetchImpl, headers, m) {
  const res = await postResend(
    fetchImpl,
    '/emails',
    m.idempotencyKey ? { ...headers, 'idempotency-key': m.idempotencyKey } : headers,
    JSON.stringify(toResend(m)),
  );
  if (!res.ok) throw new Error(`resend ${res.status}: ${(await res.text()).slice(0, 200)}`);
}

export async function sendMails(env, mails, fetchImpl = fetch) {
  const list = (mails || []).filter(Boolean);
  if (!list.length) return { sent: 0 };

  if (!env.RESEND_API_KEY) {
    for (const m of list) {
      console.log(`[mail:dev] to=${m.to}\nsubject: ${m.subject}\n${m.text}\n`);
    }
    return { sent: 0, logged: list.length };
  }

  const headers = {
    authorization: `Bearer ${env.RESEND_API_KEY}`,
    'content-type': 'application/json',
  };
  let sent = 0;
  const failed = [];
  if (list.length === 1) {
    try {
      await sendOne(fetchImpl, headers, list[0]);
      sent = 1;
    } catch (err) {
      failed.push([list[0], err]);
    }
  } else {
    // Batch endpoint (max 100 per call) keeps us under Resend's per-second rate limit.
    // If a whole batch is refused (e.g. one bad address), send that chunk one by one so
    // a single problem can't lose everybody's mail (the 30 payment links go out together).
    for (let i = 0; i < list.length; i += 100) {
      const chunk = list.slice(i, i + 100);
      let ok = false;
      try {
        const res = await postResend(fetchImpl, '/emails/batch', headers, JSON.stringify(chunk.map(toResend)));
        ok = res.ok;
        if (!ok) console.error(`resend batch ${res.status}: ${(await res.text()).slice(0, 200)}`);
      } catch (err) {
        console.error('resend batch failed:', err?.message || err);
      }
      if (ok) {
        sent += chunk.length;
        continue;
      }
      for (const m of chunk) {
        try {
          await sendOne(fetchImpl, headers, m);
          sent += 1;
        } catch (err) {
          failed.push([m, err]);
        }
      }
    }
  }
  for (const [m, err] of failed) {
    console.error('mail send failed:', err?.message || err, `${maskEmail(m.to)} "${m.subject}"`);
  }
  return { sent };
}

/**
 * Send a list through Resend's batch endpoint, chunk by chunk (max 100 each), and report
 * per chunk so the caller can record exactly what went out. Unlike sendMails, failures are
 * returned (not just logged), and the batch endpoint is used even for a single mail.
 * Without RESEND_API_KEY nothing is sent: mails are printed and `dryRun: true` is returned.
 * @param {(chunk:object[]) => Promise<object[]>} [beforeChunk] may narrow the chunk (e.g. claim rows); returns the mails to send
 * @param {(chunk:object[], ok:boolean) => Promise<void>} [afterChunk]
 */
export async function sendBatch(env, mails, { beforeChunk, afterChunk, fetchImpl = fetch } = {}) {
  const list = (mails || []).filter(Boolean);
  if (!env.RESEND_API_KEY) {
    for (const m of list) console.log(`[mail:dev] to=${m.to}\nsubject: ${m.subject}\n${m.text}\n`);
    return { sent: 0, logged: list.length, dryRun: true };
  }
  let sent = 0;
  for (let i = 0; i < list.length; i += 100) {
    let chunk = list.slice(i, i + 100);
    if (beforeChunk) chunk = (await beforeChunk(chunk)) || [];
    if (!chunk.length) continue;
    let ok = false;
    try {
      const headers = { authorization: `Bearer ${env.RESEND_API_KEY}`, 'content-type': 'application/json' };
      const keys = chunk.map((m) => m.idempotencyKey).filter(Boolean);
      if (keys.length === chunk.length) headers['idempotency-key'] = `batch-${await sha256Hex(keys.join('|'))}`;
      const res = await fetchImpl(`${RESEND_URL}/emails/batch`, {
        method: 'POST',
        headers,
        body: JSON.stringify(chunk.map(toResend)),
      });
      if (!res.ok) throw new Error(`resend batch ${res.status}: ${(await res.text()).slice(0, 200)}`);
      ok = true;
      sent += chunk.length;
    } catch (err) {
      console.error('list mail send failed:', err?.message || err, `${chunk.length} mails`);
    }
    if (afterChunk) await afterChunk(chunk, ok);
    if (!ok) return { sent, remaining: list.length - i };
  }
  return { sent, remaining: 0 };
}
