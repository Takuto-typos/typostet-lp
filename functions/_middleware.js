// 公開フォルダ=リポジトリの直下なので、内部用のファイル(仕組みのコード・DB定義・テスト・設定・作業メモ)を
// サイトから読めないようにする。ページと画像はそのまま通す。
const BLOCK = [
  /^\/_invalid$/,
  /^\/(functions|migrations|test|scripts|node_modules|docs|\.wrangler|\.git|\.github)(\/|$)/i,
  /^\/(wrangler\.toml|package(-lock)?\.json|README\.md|\.dev\.vars|\.gitignore)$/i,
  /^\/_(stripe|gemini)[^/]*$/i,
  /\.(md|sql|toml|py|sh)$/i,
];
const ALLOW = new Set(['/llms.txt']);

export const onRequest = async ({ request, next, env }) => {
  // Decode %XX first: the asset server decodes paths too, so /%5Fstripe... must be checked as /_stripe...
  let path;
  try {
    path = decodeURIComponent(new URL(request.url).pathname);
  } catch {
    path = '/_invalid';
  }
  if (!ALLOW.has(path) && BLOCK.some(re => re.test(path))) {
    const notFound = await env.ASSETS.fetch(new URL('/404.html', request.url));
    return new Response(notFound.body, { status: 404, headers: { 'content-type': 'text/html; charset=utf-8' } });
  }
  return next();
};
