// Price calculation. Always server-side; the browser never sends a price.

export function parseOptions(drop) {
  let raw = drop?.options;
  if (typeof raw === 'string') {
    try {
      raw = JSON.parse(raw);
    } catch {
      raw = {};
    }
  }
  raw = raw && typeof raw === 'object' ? raw : {};
  return {
    sizes: Array.isArray(raw.sizes) && raw.sizes.length ? raw.sizes : ['XS', 'S', 'M', 'L', 'XL'],
    sleeve: raw.sleeve && typeof raw.sleeve === 'object' ? raw.sleeve : { short: 0 },
    back_name: Number.isInteger(raw.back_name) ? raw.back_name : 0,
  };
}

/**
 * @param {object} drop   row from drops (price, shipping, options)
 * @param {object} choice { sleeve, back_name }
 * @returns {{ item:number, shipping:number, total:number }}
 */
export function calcPrice(drop, choice) {
  const opts = parseOptions(drop);
  let item = Number(drop.price);
  const sleeveExtra = opts.sleeve[choice.sleeve];
  if (!Number.isInteger(sleeveExtra)) throw new Error(`unknown sleeve: ${choice.sleeve}`);
  item += sleeveExtra;
  if (choice.back_name) item += opts.back_name;
  const shipping = Number(drop.shipping || 0);
  return { item, shipping, total: item + shipping };
}

export const SLEEVE_LABEL = { short: '半袖', long: '長袖' };
export const NUMBER_POS_LABEL = { hem: '番号は裾', chest: '番号は胸' };

/** Human readable summary used in emails and Stripe product name. */
export function describeChoice(s) {
  const parts = [`サイズ ${s.size}`, `背番号 ${s.number}`];
  if (s.number_pos) parts.push(NUMBER_POS_LABEL[s.number_pos] || s.number_pos);
  parts.push(SLEEVE_LABEL[s.sleeve] || s.sleeve);
  if (s.back_name) parts.push(`背中の名前 ${s.back_name}`);
  return parts.join(' / ');
}
