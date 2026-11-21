// Túi bột (mẫu T): dựng mặt trước và mặt sau túi từ nhãn đã in (nhan/out/<slug>-concept-t.png), không vẽ tay.
//   Mặt trước: phần giữa nhãn (61,8 mm) phóng 2× + mép hàn có viền màu, khấc xé, đường xé.
//   Mặt sau: hai mặt bên của nhãn (thành phần, công dụng, hướng dẫn sử dụng, pháp lý) xếp 2 cột.
//   node tui.js [--chi slug1,slug2]   → out/tui/<slug>-truoc.png, out/tui/<slug>-sau.png (cao 3840 px)
const fs = require('fs'), path = require('path');
const { chromium } = require('playwright');
const D = __dirname, N = path.join(D, 'nhan');
const args = process.argv.slice(2), only = args.includes('--chi') ? new Set(args[args.indexOf('--chi') + 1].split(',')) : null;
const LAB_DIR = process.env.NHAN_OUT ? path.resolve(process.env.NHAN_OUT) : path.join(N, 'out');
const data = JSON.parse(fs.readFileSync(process.env.DATA ? path.resolve(process.env.DATA) : path.join(N, 'san-pham-son-ha.json'), 'utf8')).san_pham.filter((p) => p.dang === 'goi' && (!only || only.has(p.slug)));
const src = fs.readFileSync(path.join(N, 'build.js'), 'utf8');
const grab = (a, b) => { const i = src.indexOf(a); return src.slice(i, src.indexOf(b, i) + b.length); };
const MAU = new Function(`${grab('const MAU_LOAI = {', '\n};')}\nreturn MAU_LOAI;`)();
const LOAI = new Function(`${grab('const LOAI = {', '\n};')}\nreturn LOAI;`)();
const NB_LOGO = fs.readFileSync(path.join(D, '..', '..', 'public', 'images', 'brand', 'logo-noben.svg'), 'utf8');
const F = path.join(N, 'fonts');
const face = (w, s) => `@font-face{font-family:BVP;font-weight:${w};src:url(data:font/woff2;base64,${fs.readFileSync(path.join(F, `be-vietnam-pro-${s}-${w}-normal.woff2`)).toString('base64')})}`;
const fonts = [500, 600, 700].flatMap((w) => ['latin', 'vietnamese'].map((s) => face(w, s))).join('');
const PHI = 1.61803, W = 123.6, LH = 200, SEAL = 200 / PHI ** 5, BOT = 200 / PHI ** 7, H = SEAL + LH + BOT;
const OUT = process.env.TUI_OUT ? path.resolve(process.env.TUI_OUT) : path.join(D, 'out', 'tui'); fs.mkdirSync(OUT, { recursive: true });
const sealCss = (col) => `
.seal{position:absolute;left:0;right:0;top:0;height:${SEAL}mm;background:${col}}
.rib{position:absolute;left:0;right:0;top:${SEAL / PHI ** 2}mm;height:${SEAL / PHI ** 2}mm;background:repeating-linear-gradient(90deg,rgba(255,255,255,.18) 0 .6mm,transparent .6mm 1.2mm)}
.tear{position:absolute;left:0;right:0;top:${SEAL - SEAL / PHI ** 3}mm;border-top:.35mm dashed rgba(255,255,255,.9)}
.n{position:absolute;top:${SEAL - SEAL / PHI ** 3 - 1.6}mm;width:0;height:0;border-top:1.6mm solid transparent;border-bottom:1.6mm solid transparent}
.n.l{left:0;border-left:3mm solid #fff}.n.r{right:0;border-right:3mm solid #fff}
.t{position:absolute;top:${SEAL - SEAL / PHI ** 3 - 4.2}mm;color:#fff;font-weight:700;font-size:2.1mm;letter-spacing:.08em}.t.l{left:4.6mm}.t.r{right:4.6mm}
.bot{position:absolute;left:0;right:0;bottom:0;height:${BOT}mm;background:${col}}
.bot::before{content:'';position:absolute;left:0;right:0;top:0;height:${BOT / PHI}mm;background:repeating-linear-gradient(90deg,rgba(255,255,255,.18) 0 .6mm,transparent .6mm 1.2mm)}`;
const seal = '<div class="seal"><div class="rib"></div></div><div class="tear"></div><div class="n l"></div><div class="n r"></div><div class="t l">✂ XÉ TẠI ĐÂY</div><div class="t r">XÉ TẠI ĐÂY</div><div class="bot"></div>';
(async () => {
  const b = await chromium.launch();
  const pxmm = 3840 / H;
  const page = await b.newPage({ viewport: { width: Math.round(W * pxmm), height: 3840 } });
  for (const p of data) {
    const col = MAU[p.loai] || '#0c2a63';
    const lab = `data:image/png;base64,${fs.readFileSync(path.join(LAB_DIR, `${p.slug}-concept-t.png`)).toString('base64')}`;
    const base = `*{margin:0;box-sizing:border-box}body{width:${W}mm;height:${H}mm;position:relative;background:#fff;font-family:BVP;color:#0c2a63;overflow:hidden;zoom:${pxmm / (96 / 25.4)}}${fonts}${sealCss(col)}`;
    // nhãn 161,8 mm: mặt trước 50–111,8 mm (background-position 50 %), hai mặt bên 0–50 mm (0 %) và 111,8–161,8 mm (100 %)
    const front = `<style>${base}.lab{position:absolute;left:0;top:${SEAL}mm;width:${W}mm;height:${LH}mm;background:url(${lab}) no-repeat;background-size:261.8% 100%;background-position:50% 0}</style>${seal}<div class="lab"></div>`;
    const colW = (W - 3 * 6.85) / 2;
    const back = `<style>${base}
.hd{position:absolute;left:6.85mm;right:6.85mm;top:${SEAL + 6.85}mm;height:${200 / PHI ** 4}mm;display:flex;align-items:center;gap:4.2mm;border-bottom:.35mm solid #0c2a63}
.hd svg{width:11mm;height:11mm;flex:none}.hd b{font-size:6.85mm;letter-spacing:-.02em;flex:1}
.hd span{background:${col};color:#fff;font-weight:700;font-size:2.4mm;letter-spacing:.06em;text-transform:uppercase;padding:1.3mm 2.6mm;border-radius:1mm;white-space:nowrap}
.cols{position:absolute;left:6.85mm;right:6.85mm;top:${SEAL + 6.85 + 200 / PHI ** 4 + 4.24}mm;display:grid;grid-template-columns:1fr 1fr;gap:6.85mm}
.cols div{height:${colW * 2}mm;background:url(${lab}) no-repeat;background-size:323.6% 100%}
.cols .l{background-position:0 0}.cols .r{background-position:100% 0}
.cols div{box-shadow:inset 1mm 0 0 #fff,inset -1mm 0 0 #fff}
.qk{position:absolute;left:6.85mm;width:${W - 13.7}mm;top:${SEAL + 6.85 + 200 / PHI ** 4 + 4.24 + colW * 2 + 3}mm;height:${23 * (W - 13.7) / 61.8}mm;background:url(${lab}) no-repeat;background-size:${161.8 * (W - 13.7) / 61.8}mm ${100 * (W - 13.7) / 61.8}mm;background-position:-${50 * (W - 13.7) / 61.8}mm -${77 * (W - 13.7) / 61.8}mm}
.ft{position:absolute;left:6.85mm;right:6.85mm;bottom:${BOT + 6.85}mm;display:flex;justify-content:space-between;align-items:flex-end;border-top:.35mm solid #0c2a63;padding-top:3mm;font-size:2.6mm;font-weight:600}
.ft em{font-style:normal;color:${col};font-weight:700;letter-spacing:.06em}</style>
${seal}<div class="hd">${NB_LOGO.replace('<svg ', '<svg ')}<b>${p.ten}</b><span>${LOAI[p.loai] || ''}</span></div>
<div class="cols"><div class="l"></div><div class="r"></div></div><div class="qk"></div>`;
    for (const [k, html] of [['truoc', front], ['sau', back]]) {
      await page.setContent(`<!doctype html><html><head><meta charset="utf-8"></head><body>${html}</body></html>`, { waitUntil: 'load' });
      await page.evaluate(() => document.fonts.ready);
      await page.screenshot({ path: path.join(OUT, `${p.slug}-${k}.png`) });
    }
  }
  await b.close(); console.log('túi:', data.length, '→', path.relative(process.cwd(), OUT));
})();
