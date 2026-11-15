#!/usr/bin/env node
'use strict';
// Favicon / icon ứng dụng từ LOGO CHÍNH THỨC, cùng ảnh xem trước bộ logo. Chạy sau scripts/build-logo-kit.py.
//   node scripts/build-logo-icons.js            ghi brand/logo/icons/ và brand/logo/xem-truoc.png
//   node scripts/build-logo-icons.js --kiem-tra so bản chữ sửa được với bản chuyển nét (phải trùng nhau)
// Chỉ sinh sẵn trong brand/: KHÔNG thay favicon đang dùng trên web.
const fs = require('fs');
const path = require('path');
const { execFileSync } = require('child_process');

const ROOT = path.join(__dirname, '..');
const LOGO = path.join(ROOT, 'brand', 'logo');
const ICONS = path.join(LOGO, 'icons');
const F = path.join(ROOT, 'public', 'fonts');
const b64 = (f) => fs.readFileSync(path.join(F, f)).toString('base64');
const CSS = [
  ...['vietnamese', 'latin', 'latin-ext'].map((s) => `@font-face{font-family:'Be Vietnam Pro';font-weight:600;src:url(data:font/woff2;base64,${b64(`be-vietnam-pro-${s}-600-normal.woff2`)})}`),
  ...['vietnamese', 'latin'].map((s) => `@font-face{font-family:'Playfair Display';font-weight:400 900;src:url(data:font/woff2;base64,${b64(`playfair-display-${s}-wght-normal.woff2`)})}`),
].join('\n');

async function main() {
  const { chromium } = require('playwright');
  const browser = await chromium.launch();
  const logo = fs.readFileSync(path.join(LOGO, 'noben-logo.svg'), 'utf8');
  const dataUri = (svg) => 'data:image/svg+xml;base64,' + Buffer.from(svg).toString('base64');
  fs.mkdirSync(ICONS, { recursive: true });

  // favicon.svg = logo chính thức (thoi + chữ NOBEN), không đổi hình.
  fs.writeFileSync(path.join(ICONS, 'favicon.svg'), logo);
  const jobs = [
    { name: 'favicon-16.png', size: 16, bg: null, scale: 1 },
    { name: 'favicon-32.png', size: 32, bg: null, scale: 1 },
    { name: 'apple-touch-icon-180.png', size: 180, bg: '#ffffff', scale: 0.86 },
    { name: 'icon-192.png', size: 192, bg: '#ffffff', scale: 0.86 },
    { name: 'icon-512.png', size: 512, bg: '#ffffff', scale: 0.86 },
    { name: 'icon-maskable-512.png', size: 512, bg: '#ffffff', scale: 0.7 },
  ];
  for (const j of jobs) {
    const p = await browser.newPage({ viewport: { width: j.size, height: j.size }, deviceScaleFactor: 1 });
    const s = Math.round(j.size * j.scale);
    await p.setContent(`<style>html,body{margin:0;width:${j.size}px;height:${j.size}px;overflow:hidden;background:${j.bg || 'transparent'};display:grid;place-items:center}</style><img src="${dataUri(logo)}" width="${s}" height="${s}">`);
    await p.screenshot({ path: path.join(ICONS, j.name), omitBackground: !j.bg });
    await p.close();
  }
  try {
    execFileSync('convert', [path.join(ICONS, 'favicon-16.png'), path.join(ICONS, 'favicon-32.png'), path.join(ICONS, 'favicon.ico')]);
  } catch { console.log('Bỏ qua favicon.ico (không có ImageMagick)'); }
  fs.writeFileSync(path.join(ICONS, 'site.webmanifest'), JSON.stringify({
    name: 'Thủy sản Noben', short_name: 'Noben', theme_color: '#0b2347', background_color: '#ffffff', display: 'standalone',
    icons: [
      { src: '/icon-192.png', sizes: '192x192', type: 'image/png' },
      { src: '/icon-512.png', sizes: '512x512', type: 'image/png' },
      { src: '/icon-maskable-512.png', sizes: '512x512', type: 'image/png', purpose: 'maskable' },
    ],
  }, null, 2) + '\n');

  // Kiểm tra: bản chữ sửa được và bản chuyển nét phải trùng khít (cùng phông, cùng vị trí; chỉ cho phép lệch khử răng cưa ở mép chữ).
  let worst = 0;
  const page = await browser.newPage({ deviceScaleFactor: 1 });
  for (const f of fs.readdirSync(LOGO).filter((x) => x.endsWith('-chu.svg'))) {
    const a = fs.readFileSync(path.join(LOGO, f), 'utf8').replace(/^<\?xml[^>]*>/, '');
    const b = fs.readFileSync(path.join(LOGO, f.replace('-chu.svg', '-net.svg')), 'utf8').replace(/^<\?xml[^>]*>/, '');
    await page.setContent(`<style>${CSS}\nbody{margin:0;background:#888}svg{display:block;width:600px;height:auto}</style><div id=a>${a}</div><div id=b>${b}</div>`);
    await page.evaluate(() => document.fonts.ready);
    await page.waitForTimeout(150);
    const [ia, ib] = [await page.locator('#a svg').screenshot(), await page.locator('#b svg').screenshot()];
    const diff = await page.evaluate(async ([x, y]) => {
      const load = (s) => new Promise((r) => { const i = new Image(); i.onload = () => r(i); i.src = 'data:image/png;base64,' + s; });
      const [A, B] = await Promise.all([load(x), load(y)]);
      const c = document.createElement('canvas'); c.width = A.width; c.height = A.height;
      const g = c.getContext('2d');
      g.drawImage(A, 0, 0); const da = g.getImageData(0, 0, c.width, c.height).data;
      g.clearRect(0, 0, c.width, c.height); g.drawImage(B, 0, 0); const db = g.getImageData(0, 0, c.width, c.height).data;
      let bad = 0; for (let i = 0; i < da.length; i += 4) if (Math.abs(da[i] - db[i]) + Math.abs(da[i + 1] - db[i + 1]) + Math.abs(da[i + 2] - db[i + 2]) > 120) bad++;
      return bad / (da.length / 4);
    }, [ia.toString('base64'), ib.toString('base64')]);
    worst = Math.max(worst, diff);
    console.log(`${diff < 0.025 ? 'OK  ' : 'LỆCH'} ${f} ↔ bản chuyển nét: ${(diff * 100).toFixed(2)}% điểm ảnh khác`);
  }

  // Ảnh xem trước toàn bộ.
  const files = fs.readdirSync(LOGO).filter((x) => x.endsWith('.svg')).sort();
  const cell = (f) => {
    const dark = /trang|nen-toi/.test(f);
    return `<figure class="${dark ? 'd' : ''}"><img src="${dataUri(fs.readFileSync(path.join(LOGO, f), 'utf8'))}"><figcaption>${f}</figcaption></figure>`;
  };
  await page.setViewportSize({ width: 1400, height: 900 });
  await page.setContent(`<style>body{margin:0;padding:24px;font:13px sans-serif;background:#fff}.g{display:grid;grid-template-columns:repeat(4,1fr);gap:16px}figure{margin:0;border:1px solid #d6deea;border-radius:8px;padding:16px;display:grid;gap:8px;place-items:center}figure.d{background:#0b2347;color:#a9b9d6}img{max-width:100%;height:120px;object-fit:contain}</style><div class=g>${files.map(cell).join('')}</div>`);
  await page.waitForTimeout(300);
  await page.screenshot({ path: path.join(LOGO, 'xem-truoc.png'), fullPage: true });
  await browser.close();
  console.log(`Icon: ${fs.readdirSync(ICONS).join(', ')}`);
  if (worst >= 0.025) process.exitCode = 1;
}

main().catch((e) => { console.error(e); process.exit(1); });
