import { parseOptions } from './pricing.js';

const EMAIL_RE = /^[^\s@<>()",;:\\[\]]+@[^\s@<>()",;:\\[\]]+\.[^\s@<>()",;:\\[\]]+$/;
const BACK_NAME_RE = /^[A-Za-z .-]{1,12}$/;
// Control characters (C0, DEL, C1) and bidi overrides are rejected in names.
const BAD_CHARS_RE = /[\u0000-\u001f\u007f-\u009f‪-‮⁦-⁩]/;
// Names are printed in our mails, so no links: reject anything that looks like a URL or domain.
const URLISH_RE = /(:\/\/|www\.|[a-z0-9-]\.(com|net|org|jp|io|co|me|info|xyz|app|dev|link|site|top|ru|cn)\b|\/\/)/i;

function str(v) {
  if (v === null || v === undefined) return '';
  return String(v);
}

/**
 * Validate a signup payload against a drop's options.
 * @returns {{ ok:true, value:object } | { ok:false, fields:object, honeypot?:boolean }}
 */
export function validateSignup(input, drop) {
  const opts = parseOptions(drop);
  const fields = {};
  input = input || {};

  if (str(input.website).trim() !== '') {
    return { ok: false, honeypot: true, fields: { website: '送信できませんでした。' } };
  }

  const email = str(input.email).trim().toLowerCase();
  if (!email || email.length > 254 || !EMAIL_RE.test(email)) {
    fields.email = 'メールアドレスを確認してください。';
  }

  const name = str(input.name).trim().replace(/\s+/g, ' ');
  if (!name) fields.name = 'お名前を入力してください。';
  else if (name.length > 40 || BAD_CHARS_RE.test(name)) fields.name = 'お名前は40文字までで入力してください。';
  else if (URLISH_RE.test(name)) fields.name = 'お名前にURLやアドレスは入れられません。';

  const size = str(input.size).trim().toUpperCase();
  if (!opts.sizes.includes(size)) fields.size = 'サイズを選んでください。';

  const numRaw = str(input.number).trim();
  const number = /^\d{1,2}$/.test(numRaw) ? Number(numRaw) : NaN;
  if (!Number.isInteger(number) || number < 1 || number > 99) {
    fields.number = '背番号は1〜99の数字で入力してください。';
  }

  let backName = str(input.back_name).trim().replace(/\s+/g, ' ');
  if (backName === '') backName = null;
  else if (!BACK_NAME_RE.test(backName)) {
    fields.back_name = '背中の名前は英字12文字まで(スペース・ピリオド・ハイフン可)で入力してください。';
  } else {
    backName = backName.toUpperCase(); // 背中の名前は大文字で作る
  }

  const sleeve = str(input.sleeve || 'short').trim().toLowerCase();
  if (!(sleeve in opts.sleeve) || !['short', 'long'].includes(sleeve)) {
    fields.sleeve = '袖の長さを選んでください。';
  }

  // 番号の位置: 裾(hem)か胸(chest)。古いフォームから来た場合は裾
  const numberPos = str(input.number_pos || 'hem').trim().toLowerCase();
  if (!['hem', 'chest'].includes(numberPos)) fields.number_pos = '番号の位置を選んでください。';

  if (Object.keys(fields).length) return { ok: false, fields };
  return { ok: true, value: { email, name, size, number, back_name: backName, sleeve, number_pos: numberPos } };
}
