#!/usr/bin/env node
'use strict';
// Vẽ lại nhãn đăng ký cũ của Noben cho nét: giữ nguyên hình, màu, bố cục; chỉ sắp lại chữ (vector) theo TCCS.
//   node scripts/build-old-labels.js g7            → brand/nhan-cu/g7.png (×4, 6400 px) + g7.pdf (chữ vector)
// Đầu vào: brand/nhan-cu/<ten>.json (toạ độ theo ảnh gốc) và ảnh nhãn gốc trong kho CONG-TY-NOBEN.
// Nền: ảnh gốc phóng ×4 (Lanczos 4 thùy + unsharp, ImageMagick); khung chữ trắng, chữ, logo NOBEN vẽ lại bằng vector.
const fs = require('fs');
const path = require('path');
const { execFileSync } = require('child_process');

const ROOT = path.join(__dirname, '..');
const DIR = path.join(ROOT, 'brand', 'nhan-cu');
const CONG_TY = process.env.CONG_TY_NOBEN || path.join(ROOT, '..', 'CONG-TY-NOBEN');
const SCALE = 4;
const esc = (s) => String(s);

// Logo NOBEN cũ (hình thoi vàng, ô xanh, chữ trắng nghiêng) dựng lại bằng vector, hộp 100 × 100.
const LOGO = `<svg viewBox="0 0 100 100" xmlns="http://www.w3.org/2000/svg">
<defs><linearGradient id="lv" x1="0" y1="0" x2="0" y2="1"><stop offset="0" stop-color="#ffd92a"/><stop offset="1" stop-color="#ffc70a"/></linearGradient>
<linearGradient id="lx" x1="0" y1="0" x2="0" y2="1"><stop offset="0" stop-color="#4d8be0"/><stop offset="1" stop-color="#2f6cc2"/></linearGradient></defs>
<path d="M50 1 L99 50 L50 99 L1 50 Z" fill="url(#lv)" stroke="#9c9a52" stroke-width="0.9"/>
<path d="M50 5.5 L94.5 50 L50 94.5 L5.5 50 Z" fill="none" stroke="#e1b006" stroke-width="0.6"/>
<rect x="24" y="27" width="52" height="46" fill="url(#lx)"/>
<circle cx="50" cy="27.5" r="5.2" fill="#ffffff"/>
<text x="50" y="56.5" text-anchor="middle" font-family="'Liberation Sans', Arial, sans-serif" font-weight="700" font-style="italic" font-size="20.5" letter-spacing="0" fill="#ffffff" stroke="#173a73" stroke-width="1.5" paint-order="stroke" stroke-linejoin="round">NOBEN</text>
<path d="M38 77.5 Q50 80.5 62 77.5" fill="none" stroke="#ffffff" stroke-width="1"/><path d="M41 80.2 Q50 82.6 59 80.2" fill="none" stroke="#ffffff" stroke-width="0.8"/>
</svg>`;

function item(it) {
  switch (it.kieu) {
    case 'muc': return `<p class="muc">${esc(it.chu)}</p>`;
    case 'dam': return `<p class="dam">${esc(it.chu)}</p>`;
    case 'gach': return `<p class="gach">- ${esc(it.chu)}</p>`;
    case 'trong': return '<p class="trong"></p>';
    default: return `<p>${it.dam ? `<b>${esc(it.dam)}</b>` : ''}${esc(it.chu || '')}</p>`;
  }
}

function html(spec, bg) {
  const [W, H] = spec.kich_thuoc_goc;
  const boxes = spec.khung.map((k, i) => `<div class="khung" id="k${i}" style="left:${k.x}px;top:${k.y}px;width:${k.w}px;height:${k.h}px;border-radius:${k.r}px${k.bo_duoi === false ? ` ${k.r}px 0 0` : ''}"><div class="nd">${k.noi_dung.map(item).join('')}</div></div>`).join('');
  const logos = (spec.logo || []).map((l) => `<div class="logo" style="left:${l.x}px;top:${l.y}px;width:${l.s}px;height:${l.s}px">${LOGO}</div>`).join('');
  const c = spec.cong_ty;
  const cty = c ? `<div class="cty" style="left:${c.x}px;top:${c.y}px;width:${c.w}px"><p class="ten">${esc(c.ten)}</p>${c.dong.map((d) => `<p>${esc(d)}</p>`).join('')}</div>` : '';
  return `<!doctype html><meta charset="utf-8"><style>
@page{size:${W}px ${H}px;margin:0}
html,body{margin:0;width:${W}px;height:${H}px;overflow:hidden}
#nhan{position:relative;width:${W}px;height:${H}px;background:url(${bg}) 0 0/100% 100% no-repeat}
.khung{position:absolute;background:#fff;box-sizing:border-box;padding:16px 14px 10px 15px;overflow:hidden}
.nd{font-family:'Liberation Sans',Arial,sans-serif;color:#1d1d1b;font-size:var(--fs,17.5px);line-height:1.41}
.nd p{margin:0}
.nd .muc{margin-top:.82em;text-transform:uppercase;font-size:1.03em}
.nd .dam{font-weight:700}
.nd .gach{padding-left:.55em;text-indent:-.55em;text-align:justify}
.nd .trong{height:1.41em}
.nd b{font-weight:700}
.logo{position:absolute}.logo svg{width:100%;height:100%;display:block}
.cty{position:absolute;font-family:'Liberation Sans',Arial,sans-serif;color:#111}
.cty p{margin:0;white-space:nowrap;transform-origin:0 0;transform:scaleX(.74);font-size:13.5px;line-height:1.45;width:135%}
.cty .ten{font-weight:700;font-size:21px;line-height:1.25;transform:scaleX(.8);width:125%;margin-bottom:2px}
</style><div id="nhan">${boxes}${logos}${cty}</div>`;
}

async function main() {
  const name = process.argv[2] || 'g7';
  const spec = JSON.parse(fs.readFileSync(path.join(DIR, `${name}.json`), 'utf8'));
  const src = path.join(CONG_TY, spec.goc.replace(/^CONG-TY-NOBEN\//, ''));
  const work = path.join(DIR, '_work'); fs.mkdirSync(work, { recursive: true });
  const bgFile = path.join(work, `${name}-nen-4x.jpg`);
  execFileSync('convert', [src, '-colorspace', 'RGB', '-filter', 'Lanczos', '-define', 'filter:lobes=4', '-resize', `${SCALE * 100}%`, '-colorspace', 'sRGB', '-unsharp', '0x2.4+0.9+0.02', '-quality', '95', bgFile]);
  const bg = 'data:image/jpeg;base64,' + fs.readFileSync(bgFile).toString('base64');
  const { chromium } = require('playwright');
  const browser = await chromium.launch();
  const [W, H] = spec.kich_thuoc_goc;
  const page = await browser.newPage({ viewport: { width: W, height: H }, deviceScaleFactor: SCALE });
  await page.setContent(html(spec, bg));
  await page.evaluate(() => document.fonts.ready);
  // Thu cỡ chữ từng khung cho vừa (không cắt nội dung)
  const fit = await page.evaluate(() => [...document.querySelectorAll('.khung')].map((k) => {
    let fs = 17.5; const nd = k.querySelector('.nd');
    const room = () => k.clientHeight - 26;
    while (nd.scrollHeight > room() && fs > 11) { fs -= 0.25; nd.style.setProperty('--fs', fs + 'px'); }
    return fs;
  }));
  await page.screenshot({ path: path.join(DIR, `${name}.png`), type: 'png' });
  await page.pdf({ path: path.join(DIR, `${name}.pdf`), width: `${W}px`, height: `${H}px`, printBackground: true, pageRanges: '1' });
  await browser.close();
  console.log(`${name}: ${W * SCALE}×${H * SCALE} px, cỡ chữ khung: ${fit.map((f) => f + 'px').join(', ')}`);
}

main().catch((e) => { console.error(e); process.exit(1); });
