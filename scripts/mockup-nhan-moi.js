#!/usr/bin/env node
'use strict';
// Xuất nhãn MỚI (brand/nhan/<slug>.svg) ra PNG 4K, đúng khổ xén, có phông Be Vietnam Pro / Playfair Display,
// để làm texture cho scripts/mockup-3d-cu.js.
//   node scripts/mockup-nhan-moi.js <thư mục ra> [slug ...]
const fs = require('fs');
const path = require('path');
const ROOT = path.join(__dirname, '..');
const OUT = process.argv[2] || 'brand/mockup-4k/nhan';
const SLUGS = process.argv.slice(3).length ? process.argv.slice(3) : ['super-yucca', 'bio-aq', 'clear-12h', 'mix-79'];
const LONG = 4096; // cạnh dài (px)

function fontCss() {
  const F = path.join(ROOT, 'public', 'fonts');
  const b64 = (f) => fs.readFileSync(path.join(F, f)).toString('base64');
  const VI = 'U+0102-0103,U+0110-0111,U+0128-0129,U+0168-0169,U+01A0-01A1,U+01AF-01B0,U+0300-0301,U+0303-0304,U+0308-0309,U+0323,U+0329,U+1EA0-1EF9,U+20AB';
  const f = [];
  for (const w of [400, 600]) {
    f.push(`@font-face{font-family:'Be Vietnam Pro';font-weight:${w};src:url(data:font/woff2;base64,${b64(`be-vietnam-pro-vietnamese-${w}-normal.woff2`)}) format('woff2');unicode-range:${VI}}`);
    f.push(`@font-face{font-family:'Be Vietnam Pro';font-weight:${w};src:url(data:font/woff2;base64,${b64(`be-vietnam-pro-latin-ext-${w}-normal.woff2`)}) format('woff2');unicode-range:U+0100-02AF,U+1E00-1E9F,U+1EF2-1EFF,U+2020,U+20A0-20AB,U+20AD-20C0,U+2113,U+2C60-2C7F,U+A720-A7FF}`);
    f.push(`@font-face{font-family:'Be Vietnam Pro';font-weight:${w};src:url(data:font/woff2;base64,${b64(`be-vietnam-pro-latin-${w}-normal.woff2`)}) format('woff2')}`);
  }
  f.push(`@font-face{font-family:'Playfair Display';font-weight:400 900;src:url(data:font/woff2;base64,${b64('playfair-display-vietnamese-wght-normal.woff2')}) format('woff2');unicode-range:${VI}}`);
  f.push(`@font-face{font-family:'Playfair Display';font-weight:400 900;src:url(data:font/woff2;base64,${b64('playfair-display-latin-wght-normal.woff2')}) format('woff2')}`);
  return f.join('\n');
}

(async () => {
  const { chromium } = require('playwright');
  fs.mkdirSync(OUT, { recursive: true });
  const browser = await chromium.launch();
  const css = fontCss();
  for (const slug of SLUGS) {
    let svg = fs.readFileSync(path.join(ROOT, 'brand', 'nhan', slug + '.svg'), 'utf8').replace(/^<\?xml[^>]*>\s*/, '');
    const [tw, th] = svg.match(/data-trim="([\d.]+) ([\d.]+)"/).slice(1).map(Number);
    const k = LONG / Math.max(tw, th), W = Math.round(tw * k), H = Math.round(th * k);
    // chỉ lấy phần trong đường xén (bỏ tràn lề), phóng theo pixel
    svg = svg.replace(/<svg([^>]*?)\swidth="[^"]*"\s+height="[^"]*"\s+viewBox="[^"]*"/, `<svg$1 width="${W}" height="${H}" viewBox="0 0 ${tw} ${th}"`);
    const page = await browser.newPage({ viewport: { width: W, height: H } });
    await page.setContent(`<!doctype html><html><head><style>${css}html,body{margin:0}svg{display:block}</style></head><body>${svg}</body></html>`);
    await page.evaluate(async () => {
      await Promise.all(['400 20px "Be Vietnam Pro"', '600 20px "Be Vietnam Pro"', '800 20px "Playfair Display"'].map((f) => document.fonts.load(f, 'Ữ ệ')));
      await document.fonts.ready;
    });
    const ok = await page.evaluate(() => ['400 12px "Be Vietnam Pro"', '800 12px "Playfair Display"'].every((f) => document.fonts.check(f, 'Ữ')));
    if (!ok) throw new Error('Phông chưa nạp: ' + slug);
    await page.screenshot({ path: path.join(OUT, slug + '-nhan-4k.png'), clip: { x: 0, y: 0, width: W, height: H } });
    await page.close();
    console.log(slug, `${tw}×${th} mm ->`, W + '×' + H);
  }
  await browser.close();
})().catch((e) => { console.error(e); process.exit(1); });
