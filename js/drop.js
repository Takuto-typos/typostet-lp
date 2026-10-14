// トップページの「今○人」と申込みフォーム。数字は API の実数だけを出す(取れなければ「–」のまま)。
(() => {
  const DROP = 'uni-01';
  const CAP = 20;
  const PRICE = { base: 8800, long: 1000, name: 1000, ship: 600 };
  const DEADLINE = new Date('2026-11-30T23:59:59+09:00');
  const $ = id => document.getElementById(id);
  const yen = n => '¥' + n.toLocaleString('ja-JP');

  // 点20個
  const dots = $('dots');
  for (let i = 0; i < CAP; i++) dots.appendChild(document.createElement('i'));
  const paint = n => [...dots.children].forEach((d, i) => d.classList.toggle('on', i < n));

  // 締め切りまでの日数
  const days = Math.ceil((DEADLINE - Date.now()) / 86400000);
  if (days > 0) $('left').textContent = ` ─ あと ${days}日`;

  const STATUS = {
    open: '募集中',
    paying: '20人そろいました・お支払い受付中',
    made: '製作中',
    cancelled: '中止しました',
  };

  const setCta = (main, sub) => {
    const cta = $('cta');
    cta.textContent = main;
    if (sub) { const s = document.createElement('small'); s.textContent = sub; cta.appendChild(s); }
  };

  function render(d) {
    const n = Math.min(d.count ?? 0, CAP);
    $('count').textContent = n;
    // 1つずつ埋める(控えめに)
    let i = 0;
    const step = () => { paint(++i); if (i < n) setTimeout(step, 60); };
    if (n > 0) step();
    $('status').textContent = STATUS[d.status] || STATUS.open;
    $('rec-01').textContent = d.status === 'open' ? `募集中 ${n}/${CAP}` : (STATUS[d.status] || '');
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
  const form = $('form');
  const calc = () => {
    const f = new FormData(form);
    let t = PRICE.base + PRICE.ship;
    if (f.get('sleeve') === 'long') t += PRICE.long;
    if ((f.get('back_name') || '').trim()) t += PRICE.name;
    $('total').textContent = yen(t);
  };
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
        sleeve: f.get('sleeve'), back_name: bn.toUpperCase(), website: f.get('website') || '',
      };
      const r = await fetch(`/api/drops/${DROP}/signup`, {
        method: 'POST', headers: { 'content-type': 'application/json', accept: 'application/json' }, body: JSON.stringify(body),
      });
      const d = await r.json().catch(() => ({}));
      if (!r.ok) throw new Error((d.fields && Object.values(d.fields)[0]) || d.message || 'うまく送れませんでした。時間をおいてもう一度お試しください。');

      const pos = d.position ?? d.signup?.position;
      const waiting = (d.state ?? d.signup?.state) === 'waiting';
      form.hidden = true;
      const res = $('result');
      if (waiting) {
        $('r-eyebrow').textContent = '補欠で受け付けました';
        $('r-pos').textContent = d.waiting_rank ? `補欠 ${d.waiting_rank}番目` : '補欠';
        $('r-msg').textContent = 'お支払いの期限までに払わなかった方が出たら、順番にメールでご案内します。';
      } else {
        $('r-pos').textContent = pos ? `${pos}番目` : '';
        $('r-msg').textContent = '確認のメールを送りました。20人そろったら、お支払いのご案内をお送りします。';
      }
      res.classList.add('show');
      res.focus();
      fetch(`/api/drops/${DROP}`).then(r => r.json()).then(render).catch(() => {});
    } catch (x) {
      err.textContent = x.message;
      btn.disabled = false;
      btn.textContent = '申し込む';
    }
  });

  // スクロールで出す(控えめ)
  const io = 'IntersectionObserver' in window && new IntersectionObserver(es => es.forEach(e => {
    if (e.isIntersecting) { e.target.classList.add('in'); io.unobserve(e.target); }
  }), { rootMargin: '0px 0px -10% 0px' });
  document.querySelectorAll('.rv').forEach(el => (io ? io.observe(el) : el.classList.add('in')));
})();
