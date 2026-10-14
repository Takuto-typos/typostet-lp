// トップページの「今○人」と申込みフォーム。数字は API の実数だけを出す(取れなければ「–」のまま)。
(() => {
  const DROP = 'uni-01';
  // 初期値。API が返す値(DB の値)が届いたら、そちらで上書きする
  const CAP = 30;
  const PRICE = { base: 8800, long: 1000, name: 1000, ship: 600 };
  const DEADLINE = new Date('2026-11-30T23:59:59+09:00');
  const $ = id => document.getElementById(id);
  const yen = n => '¥' + n.toLocaleString('ja-JP');

  // 点30個
  const dots = $('dots');
  for (let i = 0; i < CAP; i++) dots.appendChild(document.createElement('i'));
  const paint = n => [...dots.children].forEach((d, i) => d.classList.toggle('on', i < n));

  // 締め切りまでの日数
  const days = Math.ceil((DEADLINE - Date.now()) / 86400000);
  if (days > 0) $('left').textContent = ` ─ あと ${days}日`;

  const STATUS = {
    open: '募集中',
    paying: '30人そろいました・お支払い受付中',
    made: '製作中',
    cancelled: '中止しました',
  };

  const form = $('form');
  const setCta = (main, sub) => {
    const cta = $('cta');
    cta.textContent = main;
    if (sub) { const s = document.createElement('small'); s.textContent = sub; cta.appendChild(s); }
  };

  function render(d) {
    if (Number.isInteger(d.price)) PRICE.base = d.price;
    if (Number.isInteger(d.shipping)) PRICE.ship = d.shipping;
    if (Number.isInteger(d.options?.sleeve?.long)) PRICE.long = d.options.sleeve.long;
    if (Number.isInteger(d.options?.back_name)) PRICE.name = d.options.back_name;
    calc();
    const n = Math.min(d.count ?? 0, CAP);
    $('count').textContent = n;
    // 1つずつ埋める(控えめに)
    let i = 0;
    const step = () => { paint(++i); if (i < n) setTimeout(step, 60); };
    if (n > 0) step();
    $('status').textContent = STATUS[d.status] || STATUS.open;
    $('rec-02').textContent = d.status === 'open' ? `募集中 ${n}/${CAP}` : (STATUS[d.status] || '');
    if (d.status && d.status !== 'open') {
      if (d.status === 'paying') {
        setCta('補欠で申し込む', 'まだお金はかかりません');
      } else {
        setCta('受付は終わりました');
        $('cta').removeAttribute('href');
        $('form').hidden = true;
      }
    }
  }

  fetch(`/api/drops/${DROP}`, { headers: { accept: 'application/json' } })
    .then(r => (r.ok ? r.json() : Promise.reject(r.status)))
    .then(render)
    .catch(() => { /* 取れなければ「–」のまま。嘘の数字は出さない */ });

  // 合計金額
  function calc() {
    const f = new FormData(form);
    let t = PRICE.base + PRICE.ship;
    if (f.get('sleeve') === 'long') t += PRICE.long;
    if ((f.get('back_name') || '').trim()) t += PRICE.name;
    $('total').textContent = yen(t);
  }
  form.addEventListener('input', calc);
  calc();

  // 送信
  form.addEventListener('submit', async e => {
    e.preventDefault();
    const err = $('err');
    err.textContent = '';
    const f = new FormData(form);
    const num = Number(f.get('number'));
    const bn = (f.get('back_name') || '').trim();
    if (!form.email.checkValidity() || !form.email.value) return (err.textContent = 'メールアドレスを確かめてください。');
    if (!String(f.get('name') || '').trim()) return (err.textContent = 'お名前を入れてください。');
    if (!f.get('size')) return (err.textContent = 'サイズを選んでください。');
    if (!Number.isInteger(num) || num < 1 || num > 99) return (err.textContent = '背番号は1〜99で入れてください。');
    if (bn && !/^[A-Za-z .\-]{1,12}$/.test(bn)) return (err.textContent = '背中の名前は英字12文字までです。');
    if (!f.get('agree')) return (err.textContent = '表記とプライバシーポリシーを読んだら、チェックを入れてください。');

    const btn = $('submit');
    btn.disabled = true;
    btn.textContent = '送っています…';
    try {
      const body = {
        email: f.get('email'), name: f.get('name'), size: f.get('size'), number: num,
        sleeve: f.get('sleeve'), number_pos: f.get('number_pos') || 'hem', back_name: bn.toUpperCase(), website: f.get('website') || '',
      };
      const r = await fetch(`/api/drops/${DROP}/signup`, {
        method: 'POST', headers: { 'content-type': 'application/json', accept: 'application/json' }, body: JSON.stringify(body),
      });
      const d = await r.json().catch(() => ({}));
      if (!r.ok) throw new Error((d.fields && Object.values(d.fields)[0]) || d.message || 'うまく送れませんでした。時間をおいてもう一度お試しください。');

      // まだ確定していない。届いたメールのリンクから「申込みを確定する」を押すと順番が決まる
      form.hidden = true;
      const res = $('result');
      $('r-eyebrow').textContent = 'あと1歩です';
      $('r-pos').textContent = 'メールを見てください';
      $('r-pos').classList.add('txt');
      $('r-msg').textContent = `${form.email.value} に確認のメールを送りました。メールのリンクから「申込みを確定する」を押すと、申込みが確定して順番が決まります。届かないときは迷惑メールのフォルダも見てみてください。`;
      res.classList.add('show');
      res.focus();
    } catch (x) {
      err.textContent = x.message;
      btn.disabled = false;
      btn.textContent = '申し込む';
    }
  });

  // 新着 stet を受け取る
  const nf = $('news-form');
  nf.addEventListener('submit', async e => {
    e.preventDefault();
    const msg = $('news-msg');
    if (!nf.email.value || !nf.email.checkValidity()) { msg.textContent = 'メールアドレスを確かめてください。'; return; }
    const b = nf.querySelector('button');
    b.disabled = true;
    try {
      const r = await fetch('/api/subscribe', {
        method: 'POST', headers: { 'content-type': 'application/json', accept: 'application/json' },
        body: JSON.stringify({ email: nf.email.value, website: nf.website.value, source: 'top' }),
      });
      const d = await r.json().catch(() => ({}));
      if (!r.ok) throw new Error(d.message || 'うまく送れませんでした。時間をおいてもう一度お試しください。');
      nf.hidden = true;
      msg.classList.add('ok');
      msg.textContent = d.message || '登録しました。新しいデザインが出たら、このアドレスにお知らせします。';
    } catch (x) {
      msg.textContent = x.message;
      b.disabled = false;
    }
  });

  // スクロールで出す(控えめ)
  const io = 'IntersectionObserver' in window && new IntersectionObserver(es => es.forEach(e => {
    if (e.isIntersecting) { e.target.classList.add('in'); io.unobserve(e.target); }
  }), { rootMargin: '0px 0px -10% 0px' });
  document.querySelectorAll('.rv').forEach(el => (io ? io.observe(el) : el.classList.add('in')));
})();
