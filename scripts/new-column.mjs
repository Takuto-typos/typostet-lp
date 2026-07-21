#!/usr/bin/env node
/**
 * new-column.mjs — TYP0stet Journal essay generator
 *
 * Usage:
 *   node scripts/new-column.mjs path/to/essay.md
 *
 * The markdown file must have YAML-ish frontmatter followed by body content.
 * See scripts/README.md for the full format spec.
 */

import { readFileSync, writeFileSync, mkdirSync, existsSync } from 'fs';
import { resolve, dirname } from 'path';
import { fileURLToPath } from 'url';

// ─── Paths ────────────────────────────────────────────────────────────────────

const __dir = dirname(fileURLToPath(import.meta.url));
const SITE_ROOT = resolve(__dir, '..');

// ─── CLI arg ─────────────────────────────────────────────────────────────────

const inputPath = process.argv[2];
if (!inputPath) {
  console.error('Usage: node scripts/new-column.mjs <path/to/essay.md>');
  process.exit(1);
}

const raw = readFileSync(resolve(inputPath), 'utf8');

// ─── Frontmatter parser ───────────────────────────────────────────────────────
// Expects:
//   ---
//   title: ...
//   slug: ...
//   description: ...
//   datePublished: YYYY-MM-DD
//   faq:
//     - q: ...
//       a: ...
//   ---
//   body content

function parseFrontmatter(src) {
  const match = src.match(/^---\n([\s\S]*?)\n---\n([\s\S]*)$/);
  if (!match) throw new Error('Frontmatter block not found. File must start with ---');

  const yamlBlock = match[1];
  const body = match[2].trim();

  const fm = {};

  // title
  const titleMatch = yamlBlock.match(/^title:\s*(.+)$/m);
  if (!titleMatch) throw new Error('Frontmatter missing: title');
  fm.title = titleMatch[1].trim();

  // slug
  const slugMatch = yamlBlock.match(/^slug:\s*(.+)$/m);
  if (!slugMatch) throw new Error('Frontmatter missing: slug');
  fm.slug = slugMatch[1].trim();

  // description
  const descMatch = yamlBlock.match(/^description:\s*(.+)$/m);
  if (!descMatch) throw new Error('Frontmatter missing: description');
  fm.description = descMatch[1].trim();

  // datePublished
  const dateMatch = yamlBlock.match(/^datePublished:\s*(.+)$/m);
  if (!dateMatch) throw new Error('Frontmatter missing: datePublished');
  fm.datePublished = dateMatch[1].trim();

  // faq — simple indented list under "faq:"
  fm.faq = [];
  const faqSection = yamlBlock.match(/^faq:\s*\n([\s\S]*?)(?=^\S|\Z)/m);
  if (faqSection) {
    const faqRaw = faqSection[1];
    const entries = faqRaw.split(/^\s*-\s+q:/m).slice(1);
    for (const entry of entries) {
      const qMatch = entry.match(/^(.+)/);
      const aMatch = entry.match(/^\s+a:\s*(.+)/m);
      if (qMatch && aMatch) {
        fm.faq.push({ q: qMatch[1].trim(), a: aMatch[1].trim() });
      }
    }
  }

  return { fm, body };
}

// ─── Body parser ─────────────────────────────────────────────────────────────
// Converts markdown-ish body to HTML snippet using the vol-0 conventions:
//   ## 01 Section heading  → <h2><span class="num">01</span>...</h2>
//   > blockquote text      → <blockquote>...</blockquote>
//   [LEAD] block           → <p class="lead">...</p>
//   [CLOSING] block        → <div class="closing">...</div>
//   blank-line-separated paragraphs → <p>...</p>

function bodyToHtml(body) {
  // Split into lines for processing
  const lines = body.split('\n');
  const blocks = [];
  let current = [];

  function flush() {
    if (current.length > 0) {
      blocks.push(current.join('\n').trim());
      current = [];
    }
  }

  for (const line of lines) {
    if (line.trim() === '') {
      flush();
    } else {
      current.push(line);
    }
  }
  flush();

  let inClosing = false;
  let closingParagraphs = [];
  const htmlParts = [];
  let leadDone = false;

  for (const block of blocks) {
    // [LEAD] marker
    if (block.startsWith('[LEAD]')) {
      const text = block.replace(/^\[LEAD\]\s*/, '').trim();
      const inner = inlineHtml(text);
      htmlParts.push(`  <p class="lead">\n    ${inner}\n  </p>\n`);
      leadDone = true;
      continue;
    }

    // [CLOSING] marker — collect subsequent paragraphs into closing div
    if (block.startsWith('[CLOSING]')) {
      inClosing = true;
      const text = block.replace(/^\[CLOSING\]\s*/, '').trim();
      if (text) closingParagraphs.push(text);
      continue;
    }

    // [BLOCKQUOTE] marker
    if (block.startsWith('[BLOCKQUOTE]')) {
      const text = block.replace(/^\[BLOCKQUOTE\]\s*/, '').trim();
      htmlParts.push(`  <blockquote>\n    ${inlineHtml(text)}\n  </blockquote>\n`);
      continue;
    }

    // ## section heading
    if (block.startsWith('## ')) {
      if (inClosing) {
        htmlParts.push(renderClosing(closingParagraphs));
        closingParagraphs = [];
        inClosing = false;
      }
      const heading = block.replace(/^##\s*/, '');
      // Expect "01 Title text" or "[01 Title text]"
      const numMatch = heading.match(/^(\d+)\s+(.*)/);
      if (numMatch) {
        const num = numMatch[1];
        const title = inlineHtml(numMatch[2]);
        htmlParts.push(
          `  <h2><span class="num">${num}</span>${title}</h2>\n`
        );
      } else {
        htmlParts.push(`  <h2>${inlineHtml(heading)}</h2>\n`);
      }
      continue;
    }

    // > blockquote (markdown style)
    if (block.startsWith('> ')) {
      const text = block.replace(/^> /, '').trim();
      htmlParts.push(`  <blockquote>\n    ${inlineHtml(text)}\n  </blockquote>\n`);
      continue;
    }

    // Closing paragraph accumulator
    if (inClosing) {
      closingParagraphs.push(block);
      continue;
    }

    // Normal paragraph
    htmlParts.push(`  <p>\n    ${inlineHtml(block)}\n  </p>\n`);
  }

  // Flush closing if still open
  if (inClosing && closingParagraphs.length > 0) {
    htmlParts.push(renderClosing(closingParagraphs));
  }

  return htmlParts.join('\n');
}

function renderClosing(paragraphs) {
  const paras = paragraphs
    .map(p => `    <p>\n      ${inlineHtml(p)}\n    </p>`)
    .join('\n');
  return `  <div class="closing">\n${paras}\n    <p class="sig">─ tig</p>\n  </div>\n`;
}

// Inline: *em* → <em>...</em>, line breaks within a paragraph preserved as <br>
function inlineHtml(text) {
  return text
    .replace(/\*([^*]+)\*/g, '<em>$1</em>')
    .replace(/\n/g, '<br>\n    ');
}

// ─── JSON-LD builder ─────────────────────────────────────────────────────────

function buildJsonLd(fm) {
  const faqEntities = fm.faq.map(({ q, a }) => ({
    '@type': 'Question',
    name: q,
    acceptedAnswer: { '@type': 'Answer', text: a },
  }));

  const graph = [
    {
      '@type': 'Article',
      headline: fm.title,
      url: `https://typostet.com/magazine/${fm.slug}/`,
      description: fm.description,
      datePublished: fm.datePublished,
      dateModified: fm.datePublished,
      inLanguage: 'ja',
      image: 'https://typostet.com/img/og-image.png',
      author: { '@type': 'Person', name: 'tig' },
      publisher: {
        '@type': 'Organization',
        name: 'TYP0stet',
        logo: {
          '@type': 'ImageObject',
          url: 'https://typostet.com/assets/brand/wordmark/tentative-final-light.svg',
        },
      },
      isPartOf: {
        '@type': 'Blog',
        name: 'Journal ─ 失敗論のコラム',
        url: 'https://typostet.com/magazine/',
      },
    },
  ];

  if (faqEntities.length > 0) {
    graph.push({ '@type': 'FAQPage', mainEntity: faqEntities });
  }

  return JSON.stringify({ '@context': 'https://schema.org', '@graph': graph }, null, 2);
}

// ─── HTML template ────────────────────────────────────────────────────────────
// Reproduces the exact chrome from magazine/perfection/index.html

function buildPage(fm, articleHtml) {
  const jsonLd = buildJsonLd(fm);
  // Format date for display: YYYY-MM-DD → YYYY.MM.DD
  const displayDate = fm.datePublished.replace(/-/g, '.');

  return `<!doctype html>
<html lang="ja">
<head>
<meta charset="utf-8">
<meta name="viewport" content="width=device-width, initial-scale=1, viewport-fit=cover">
<meta name="theme-color" content="#F1E8D5">

<title>${escHtml(fm.title)} ─ TYP0stet Journal</title>
<meta name="description" content="${escHtml(fm.description)}">

<link rel="canonical" href="https://typostet.com/magazine/${fm.slug}/">

<meta property="og:type" content="article">
<meta property="og:url" content="https://typostet.com/magazine/${fm.slug}/">
<meta property="og:title" content="${escHtml(fm.title)}">
<meta property="og:description" content="${escHtml(fm.description)}">
<meta property="og:image" content="https://typostet.com/img/og-image.png">

<meta name="twitter:card" content="summary_large_image">
<meta name="twitter:site" content="@typostet481">

<link rel="icon" type="image/svg+xml" href="/assets/brand/monogram/tentative-final.svg">
<link rel="icon" type="image/x-icon" href="/favicon.ico">

<script type="application/ld+json">
${jsonLd}
<\/script>

<link rel="preconnect" href="https://fonts.googleapis.com">
<link rel="preconnect" href="https://fonts.gstatic.com" crossorigin>
<link href="https://fonts.googleapis.com/css2?family=Shippori+Mincho:wght@500;600;700;800&family=IBM+Plex+Sans+JP:wght@300;400;500&family=IBM+Plex+Mono:ital,wght@0,400;0,500;1,400&family=Inconsolata:wght@400;700;900&family=Klee+One:wght@400;600&display=swap" rel="stylesheet">

<style>
  :root {
    --bone: #F1E8D5;
    --bone-deep: #E9DFC5;
    --ink: #0E0E0E;
    --mint: #92E5BD;
    --olive: #5E6638;
    --terracotta: #C7553E;
    --rule: rgba(14, 14, 14, 0.12);
    --muted: rgba(14, 14, 14, 0.55);

    --serif: "Shippori Mincho", "Hiragino Mincho ProN", serif;
    --sans:  "IBM Plex Sans JP", "Helvetica Neue", Arial, sans-serif;
    --mono:  "IBM Plex Mono", ui-monospace, Menlo, monospace;
    --num:   "Inconsolata", ui-monospace, Menlo, monospace;
    --hand-jp: "Klee One", serif;
  }

  * { box-sizing: border-box; margin: 0; padding: 0; }
  html { scroll-behavior: smooth; -webkit-text-size-adjust: 100%; }
  body {
    background: var(--bone); color: var(--ink);
    font-family: var(--sans); line-height: 1.75;
    -webkit-font-smoothing: antialiased;
  }
  img { display: block; max-width: 100%; height: auto; }
  a { color: inherit; text-decoration: none; }
  button { font-family: inherit; cursor: pointer; }

  .site-header {
    position: sticky; top: 0; z-index: 40;
    background: rgba(241, 232, 213, 0.92);
    backdrop-filter: saturate(180%) blur(8px);
    -webkit-backdrop-filter: saturate(180%) blur(8px);
    border-bottom: 1px solid var(--rule);
  }
  .site-header__inner {
    max-width: 1320px; margin: 0 auto;
    padding: 10px 28px;
    display: flex; align-items: center; justify-content: space-between; gap: 32px;
  }
  .site-header__brand img { width: 140px; }
  .site-nav { display: flex; gap: 28px; font-family: var(--mono); font-size: 12px; letter-spacing: 0.14em; text-transform: uppercase; }
  .site-nav a { padding: 6px 0; border-bottom: 1px solid transparent; transition: border-color 200ms ease, opacity 200ms ease; opacity: 0.7; }
  .site-nav a:hover { border-bottom-color: var(--ink); opacity: 1; }
  .site-nav a.is-current { opacity: 1; border-bottom-color: var(--ink); }
  .site-nav a.cart-link { display: none; font-style: italic; font-weight: 400; letter-spacing: 0.06em; text-transform: lowercase; opacity: 0.92; }
  .nav-toggle { display: none; background: none; border: none; padding: 8px; font-family: var(--mono); font-size: 18px; }

  .article-hero {
    padding: 80px 28px 60px;
    border-bottom: 1px solid var(--rule);
  }
  .article-hero__layout {
    max-width: 1080px; margin: 0 auto;
    display: grid;
    grid-template-columns: 1fr 1fr;
    gap: 56px;
    align-items: center;
  }
  .article-hero__image {
    aspect-ratio: 4 / 5;
    background: var(--bone-deep);
    border: 1px solid var(--rule);
    overflow: hidden;
    display: flex; align-items: center; justify-content: center;
  }
  .article-hero__image img {
    width: 100%; height: 100%; object-fit: cover; display: block;
  }
  .article-hero__text {
    text-align: left;
  }
  .article-hero p.eyebrow {
    font-family: var(--mono); font-size: 11px; letter-spacing: 0.22em;
    color: var(--muted); text-transform: uppercase;
    margin-bottom: 24px;
  }
  .article-hero p.eyebrow .vol {
    font-family: var(--num); font-weight: 700;
    color: var(--mint); letter-spacing: 0.04em;
    font-size: 16px; vertical-align: -0.05em;
    margin-right: 8px;
  }
  .article-hero h1 {
    font-family: var(--serif); font-weight: 700;
    font-size: clamp(32px, 4.4vw, 52px);
    line-height: 1.22;
    margin-bottom: 22px;
    letter-spacing: 0.01em;
    word-break: keep-all;
    overflow-wrap: anywhere;
  }
  .article-hero h1 em {
    font-style: normal;
    font-family: var(--hand-jp);
    color: var(--mint);
  }
  .article-hero p.sub {
    font-family: var(--serif); font-size: 17px; line-height: 1.85;
    color: var(--muted);
  }

  .article-meta {
    max-width: 760px; margin: 0 auto;
    padding: 32px 28px;
    border-bottom: 1px solid var(--rule);
    font-family: var(--mono); font-size: 11px;
    letter-spacing: 0.18em; text-transform: uppercase;
    color: var(--muted);
    display: flex; gap: 24px; flex-wrap: wrap;
  }

  article.column {
    max-width: 720px; margin: 0 auto;
    padding: 64px 28px 32px;
    font-family: var(--serif);
    font-size: 17px; line-height: 2.05;
    color: var(--ink);
  }
  article.column .lead {
    font-size: 19px; line-height: 2.05;
    margin-bottom: 56px;
    border-left: 3px solid var(--mint);
    padding-left: 20px;
    color: var(--ink);
  }
  article.column h2 {
    font-family: var(--serif); font-weight: 700;
    font-size: clamp(22px, 3vw, 28px);
    line-height: 1.4;
    margin: 56px 0 22px;
    padding-top: 32px;
    border-top: 1px solid var(--rule);
    letter-spacing: 0.01em;
  }
  article.column h2 .num {
    font-family: var(--num); font-weight: 700;
    color: var(--mint);
    font-size: 0.7em;
    letter-spacing: 0;
    margin-right: 14px;
    vertical-align: 0.05em;
  }
  article.column h2 em {
    font-style: normal; font-family: var(--hand-jp); color: var(--terracotta);
  }
  article.column p { margin-bottom: 22px; }
  article.column p em {
    font-style: normal;
    background: linear-gradient(180deg, transparent 64%, rgba(146,229,189,0.36) 64%);
    padding: 0 2px;
  }
  article.column blockquote {
    margin: 40px 0;
    padding: 28px 32px;
    background: var(--bone-deep);
    border-left: 3px solid var(--terracotta);
    font-family: var(--serif); font-size: 18px; line-height: 1.9;
    color: var(--ink);
    font-weight: 600;
  }
  article.column .closing {
    margin-top: 72px;
    padding: 48px 32px;
    background: var(--bone-deep);
    border: 1px solid var(--rule);
  }
  article.column .closing p {
    font-size: 16px; line-height: 2;
  }
  article.column .sig {
    margin-top: 24px;
    font-family: var(--hand-jp); font-size: 22px;
    color: var(--ink);
    text-align: right;
  }

  .next-block {
    max-width: 760px; margin: 64px auto 0;
    padding: 0 28px;
  }
  .next-block__inner {
    background: var(--ink); color: var(--bone);
    padding: 40px 32px;
  }
  .next-block__inner h3 {
    font-family: var(--serif); font-style: italic; font-weight: 600;
    font-size: 22px; margin-bottom: 14px;
  }
  .next-block__inner h3 em {
    font-style: normal; font-family: var(--hand-jp); color: var(--mint);
  }
  .next-block__inner p {
    font-family: var(--serif); font-size: 14px; line-height: 1.95;
    color: rgba(244,237,223,0.78);
    margin-bottom: 12px;
  }
  .next-block__cta {
    display: inline-flex; align-items: center; gap: 12px;
    margin-top: 18px;
    padding: 14px 22px;
    background: var(--mint); color: var(--ink);
    font-family: var(--mono); font-size: 12px;
    letter-spacing: 0.14em; text-transform: uppercase;
    font-weight: 500;
  }

  .related-block {
    max-width: 760px; margin: 64px auto;
    padding: 0 28px;
    text-align: center;
  }
  .related-block a {
    font-family: var(--mono); font-size: 12px;
    letter-spacing: 0.14em; text-transform: uppercase;
    color: var(--muted);
    border-bottom: 1px solid var(--rule);
    padding-bottom: 3px;
    transition: color 200ms ease, border-color 200ms ease;
  }
  .related-block a:hover { color: var(--ink); border-color: var(--ink); }

  .site-footer {
    background: var(--bone);
    border-top: 1px solid var(--rule);
    padding: 64px 28px 28px;
    margin-top: 72px;
  }
  .site-footer__inner {
    max-width: 1320px; margin: 0 auto;
    display: flex; justify-content: space-between; align-items: center; gap: 24px;
    flex-wrap: wrap;
  }
  .site-footer__copy {
    font-family: var(--mono); font-size: 11px; letter-spacing: 0.14em;
    color: var(--muted);
  }
  .site-footer__nav {
    display: flex; gap: 22px;
    font-family: var(--mono); font-size: 11px; letter-spacing: 0.14em;
    color: var(--muted); text-transform: uppercase;
  }
  .site-footer__nav a:hover { color: var(--ink); }
  .site-footer__social {
    display: flex; gap: 16px;
    font-family: var(--mono); font-size: 11px;
    letter-spacing: 0.14em; text-transform: uppercase;
    color: var(--muted);
    align-items: center;
  }
  .site-footer__social a {
    display: inline-flex; align-items: center; justify-content: center;
    width: 28px; height: 28px;
    color: var(--muted);
    transition: color 200ms ease, transform 200ms ease;
  }
  .site-footer__social a:hover { color: var(--ink); transform: translateY(-1px); }
  .social-icon { width: 18px; height: 18px; display: block; }
  .site-footer__hashtag {
    font-family: var(--hand-jp); font-size: 13px;
    color: var(--mint); letter-spacing: 0.02em;
    text-transform: none;
  }

  @media (max-width: 720px) {
    .site-header__inner { padding: 10px 18px; }
    .site-header__brand img { width: 108px; }
    .site-nav {
      display: none;
      position: absolute; top: 100%; left: 0; right: 0;
      flex-direction: column; gap: 6px;
      background: var(--bone); padding: 18px 24px 24px;
      border-bottom: 1px solid var(--rule);
    }
    .site-nav.is-open { display: flex; }
    .nav-toggle { display: inline-flex; }
    .article-hero { padding: 56px 22px 40px; }
    .article-hero__layout {
      grid-template-columns: 1fr;
      gap: 32px;
    }
    .article-hero__image { max-width: 70%; margin: 0 auto; }
    .article-hero h1 { font-size: clamp(26px, 7vw, 38px); }
    article.column { padding: 48px 22px 28px; font-size: 16px; line-height: 2; }
    article.column .lead { font-size: 17px; padding-left: 16px; }
    article.column h2 { font-size: 22px; margin: 44px 0 18px; padding-top: 24px; }
    article.column blockquote { padding: 20px 22px; font-size: 16px; }
    .next-block { padding: 0 22px; }
    .next-block__inner { padding: 32px 24px; }
    .related-block { padding: 0 22px; }
  }

  /* --- 4:81 floating time widget --- */
  .time-widget {
    position: fixed; bottom: 24px; right: 24px;
    background: var(--ink); color: var(--bone);
    padding: 10px 16px; border-radius: 999px;
    display: inline-flex; align-items: baseline; gap: 10px;
    font-family: var(--mono); font-size: 11px;
    letter-spacing: 0.18em; text-transform: uppercase;
    z-index: 50;
    box-shadow: 0 6px 20px rgba(14,14,14,0.18);
  }
  .time-widget .num {
    font-family: var(--num); font-size: 14px; font-weight: 700;
    letter-spacing: 0;
    color: var(--mint);
  }
  .time-widget .num .colon { animation: stet-blink 1.06s steps(2, end) infinite; }
  @keyframes stet-blink { 50% { opacity: 0.2; } }
  @media (max-width: 720px) {
    .time-widget { bottom: 16px; right: 16px; padding: 8px 12px; font-size: 10px; }
  }

  /* Cotton fabric texture overlay (subtle) */
  body::after {
    content: '';
    position: fixed;
    inset: 0;
    pointer-events: none;
    z-index: 9999;
    background-image: url("data:image/svg+xml;charset=utf-8,%3Csvg xmlns='http://www.w3.org/2000/svg' width='220' height='220'%3E%3Cfilter id='n'%3E%3CfeTurbulence type='fractalNoise' baseFrequency='0.72' numOctaves='2' stitchTiles='stitch'/%3E%3CfeColorMatrix values='0 0 0 0 0.16 0 0 0 0 0.13 0 0 0 0 0.09 0 0 0 0.32 0'/%3E%3C/filter%3E%3Crect width='100%25' height='100%25' filter='url(%23n)'/%3E%3C/svg%3E");
    opacity: 0.5;
    mix-blend-mode: multiply;
  }

  .site-footer__voice {
    font-family: var(--hand-jp);
    font-size: 13px;
    color: var(--mint);
    letter-spacing: 0.02em;
    margin-left: 14px;
    opacity: 0.92;
  }
  @media (max-width: 720px) {
    .site-footer__voice { display: block; margin: 8px 0 0 0; }
  }
</style>
</head>
<body>

<header class="site-header">
  <div class="site-header__inner">
    <a href="/" class="site-header__brand" aria-label="TYP0stet home">
      <img src="/assets/brand/wordmark/tentative-final-light.svg" alt="TYP0stet">
    </a>
    <nav class="site-nav" id="site-nav" aria-label="primary">
      <a href="/#stet">Shop</a>
      <a href="/#objects">Objects</a>
      <a href="/magazine/" class="is-current">Magazine</a>
      <a href="/manifest.html">Manifesto</a>
      <a href="/about.html">About</a>
      <a href="#cart" class="cart-link" aria-label="Cart">cart</a>
    </nav>
    <button class="nav-toggle" aria-label="menu" aria-controls="site-nav" aria-expanded="false">&#8801;</button>
  </div>
</header>

<section class="article-hero">
  <div class="article-hero__layout">
    <div class="article-hero__image">
      <img src="/img/magazine/placeholders/portrait.svg" alt="Journal ─ ${escHtml(fm.title)}">
    </div>
    <div class="article-hero__text">
      <p class="eyebrow"><span class="vol">Journal</span>TYP0stet ─ failure 論</p>
      <h1>${escHtml(fm.title)}</h1>
      <p class="sub">${escHtml(fm.description)}</p>
    </div>
  </div>
</section>

<div class="article-meta">
  <span>${displayDate}</span>
  <span>Author: tig</span>
  <span>Journal</span>
  <span>Read ~7 min</span>
</div>

<article class="column">

${articleHtml}
</article>

<section class="next-block">
  <div class="next-block__inner">
    <h3>Journal: <em>failure 論のコラム</em></h3>
    <p>TYP0stet の思想を、言葉で続ける。間違いを、誇りに変える方法を、月に一度書く。</p>
    <p>公開のタイミングは、Newsletter で告知します。</p>
    <a href="/magazine/" class="next-block__cta">&#8592; Journal index</a>
  </div>
</section>

<div class="related-block">
  <a href="/magazine/">&#8592; Journal index に戻る</a>
</div>

<footer class="site-footer">
  <div class="site-footer__inner">
    <span class="site-footer__copy">&#169; 2026 TYP0stet ─ Remoi, K.K.</span><span class="site-footer__voice" aria-hidden="true">今日も、出かけよう。</span>
    <nav class="site-footer__nav">
      <a href="/manifest.html">Manifesto</a>
      <a href="/about.html">About</a>
      <a href="/terms.html">Terms</a>
      <a href="/privacy.html">Privacy</a>
      <a href="/tokutei.html">特定商取引</a>
    </nav>
    <div class="site-footer__social">
      <a href="https://instagram.com/typostet" target="_blank" rel="noopener" aria-label="Instagram">
        <svg class="social-icon" viewBox="0 0 24 24" aria-hidden="true" focusable="false">
          <rect x="3" y="3" width="18" height="18" rx="5" fill="none" stroke="currentColor" stroke-width="1.6"/>
          <circle cx="12" cy="12" r="4.5" fill="none" stroke="currentColor" stroke-width="1.6"/>
          <circle cx="17.5" cy="6.5" r="1.1" fill="currentColor"/>
        </svg>
      </a>
      <a href="https://x.com/typostet481" target="_blank" rel="noopener" aria-label="X">
        <svg class="social-icon" viewBox="0 0 24 24" aria-hidden="true" focusable="false">
          <path fill="currentColor" d="M18.244 2.25h3.308l-7.227 8.26 8.502 11.24H16.17l-5.214-6.817L4.99 21.75H1.68l7.73-8.835L1.254 2.25H8.08l4.713 6.231zm-1.161 17.52h1.833L7.084 4.126H5.117z"/>
        </svg>
      </a>
      <a href="https://note.com/typostet" target="_blank" rel="noopener" aria-label="note">
        <svg class="social-icon" viewBox="0 0 24 24" aria-hidden="true" focusable="false">
          <circle cx="12" cy="12" r="9.5" fill="none" stroke="currentColor" stroke-width="1.6"/>
          <path fill="none" stroke="currentColor" stroke-width="1.7" stroke-linecap="round" stroke-linejoin="round" d="M8 8.2v7.6M8 10.4c0.95-1.05 2.3-1.6 3.5-1.6c1.4 0 2.5 1.05 2.5 2.55v6.45"/>
        </svg>
      </a>
      <span class="site-footer__hashtag">#TYP0stet</span>
    </div>
  </div>
</footer>

<a class="time-widget" href="/manifest.html" aria-label="Stet time 4:81">
  <span>Stet Time</span>
  <span class="num">4<span class="colon">:</span>81</span>
</a>

<script>
  const toggle = document.querySelector('.nav-toggle');
  const nav = document.getElementById('site-nav');
  if (toggle && nav) {
    toggle.addEventListener('click', () => {
      const open = nav.classList.toggle('is-open');
      toggle.setAttribute('aria-expanded', String(open));
    });
  }
<\/script>

</body>
</html>`;
}

function escHtml(str) {
  return String(str)
    .replace(/&/g, '&amp;')
    .replace(/</g, '&lt;')
    .replace(/>/g, '&gt;')
    .replace(/"/g, '&quot;');
}

// ─── Sitemap updater ──────────────────────────────────────────────────────────

function updateSitemap(slug, date) {
  const sitemapPath = resolve(SITE_ROOT, 'sitemap.xml');
  let xml = readFileSync(sitemapPath, 'utf8');

  const newUrl = `https://typostet.com/magazine/${slug}/`;
  if (xml.includes(newUrl)) {
    console.log(`  sitemap: ${newUrl} already present, skipping`);
    return;
  }

  const entry = `  <url>\n    <loc>${newUrl}</loc>\n    <lastmod>${date}</lastmod>\n    <changefreq>monthly</changefreq>\n    <priority>0.8</priority>\n  </url>\n`;
  xml = xml.replace('</urlset>', entry + '</urlset>');
  writeFileSync(sitemapPath, xml, 'utf8');
  console.log(`  sitemap: added ${newUrl}`);
}

// ─── Magazine hub updater ─────────────────────────────────────────────────────

function updateMagazineHub(fm) {
  const hubPath = resolve(SITE_ROOT, 'magazine', 'index.html');
  let html = readFileSync(hubPath, 'utf8');

  const newCard = `
      <a class="column-card" href="/magazine/${fm.slug}/">
        <div class="column-card__image">
          <img src="/img/magazine/placeholders/portrait.svg" alt="Journal ─ ${escHtml(fm.title)}">
        </div>
        <div class="column-card__body">
          <div class="column-card__vol">Journal</div>
          <h3 class="column-card__title">${escHtml(fm.title)}</h3>
          <p class="column-card__excerpt">
            ${escHtml(fm.description)}
          </p>
          <div class="column-card__meta">
            <span>${fm.datePublished.replace(/-/g, '.')}</span>
            <span>tig</span>
          </div>
        </div>
      </a>
`;

  // Insert before the first existing column-card
  if (html.includes(newCard.trim())) {
    console.log('  magazine hub: card already present, skipping');
    return;
  }

  html = html.replace(
    /(\s*<div class="column-list">)/,
    `$1\n${newCard}`
  );

  writeFileSync(hubPath, html, 'utf8');
  console.log(`  magazine hub: added card for /${fm.slug}/`);
}

// ─── Main ─────────────────────────────────────────────────────────────────────

console.log(`\nTYP0stet Journal generator`);
console.log(`Input: ${inputPath}\n`);

const { fm, body } = parseFrontmatter(raw);
console.log(`  title: ${fm.title}`);
console.log(`  slug:  ${fm.slug}`);
console.log(`  date:  ${fm.datePublished}`);
console.log(`  faq:   ${fm.faq.length} items`);

const articleHtml = bodyToHtml(body);
const fullPage = buildPage(fm, articleHtml);

// Write essay page
const outDir = resolve(SITE_ROOT, 'magazine', fm.slug);
mkdirSync(outDir, { recursive: true });
const outPath = resolve(outDir, 'index.html');
writeFileSync(outPath, fullPage, 'utf8');
console.log(`\n  wrote: magazine/${fm.slug}/index.html`);

// Update sitemap
updateSitemap(fm.slug, fm.datePublished);

// Update magazine hub
updateMagazineHub(fm);

console.log('\nDone.\n');
