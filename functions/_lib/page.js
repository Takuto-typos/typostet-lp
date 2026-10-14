// Tiny self-contained HTML page for /pay/:token explanations.
// Deliberately unstyled beyond basics so it doesn't depend on the site's CSS rebuild.

import { escapeHtml } from './util.js';

export function messagePage({ title, lines = [], linkHref = '/', linkLabel = 'TYP0stet トップへ' }) {
  const body = lines.map((l) => `<p>${escapeHtml(l)}</p>`).join('\n    ');
  return `<!doctype html>
<html lang="ja">
<head>
  <meta charset="utf-8">
  <meta name="viewport" content="width=device-width, initial-scale=1">
  <meta name="robots" content="noindex, nofollow">
  <title>${escapeHtml(title)} | TYP0stet</title>
  <style>
    body { font-family: -apple-system, "Hiragino Sans", "Noto Sans JP", sans-serif; line-height: 1.8; color: #1a1a1a; margin: 0; }
    main { max-width: 520px; margin: 0 auto; padding: 64px 24px; }
    h1 { font-size: 20px; margin: 0 0 24px; }
    p { margin: 0 0 12px; }
    a { color: #C7553E; }
  </style>
</head>
<body>
  <main>
    <h1>${escapeHtml(title)}</h1>
    ${body}
    <p style="margin-top:32px"><a href="${escapeHtml(linkHref)}">${escapeHtml(linkLabel)}</a></p>
  </main>
</body>
</html>`;
}
