// Túi bột (mẫu T) theo khổ túi thật trong kich-thuoc.json. Không vẽ tay: dựng lại nhãn với mặt trước rộng đúng tỷ lệ túi,
// rồi ghép mép hàn (viền màu, khấc xé, đường xé). Mặt sau lấy hai mặt bên của nhãn (thành phần, công dụng, hướng dẫn, pháp lý).
//   node tui.js [--chi slug1,slug2]   → out/tui/<slug>-truoc.png, <slug>-sau.png (cao 3000 px)
// Biến môi trường: DATA (file dữ liệu), TUI_OUT (thư mục ra).
const fs = require('fs'), path = require('path');
const { execFileSync } = require('child_process');
const { chromium } = require('playwright');
const D = __dirname, N = path.join(D, 'nhan');
const args = process.argv.slice(2), only = args.includes('--chi') ? new Set(args[args.indexOf('--chi') + 1].split(',')) : null;
const DATA = process.env.DATA ? path.resolve(process.env.DATA) : path.join(N, 'san-pham-son-ha.json');
const data = JSON.parse(fs.readFileSync(DATA, 'utf8')).san_pham.filter((p) => p.dang === 'goi' && (!only || only.has(p.slug)));
const KT = JSON.parse(fs.readFileSync(path.join(D, 'kich-thuoc.json'), 'utf8'));
const src = fs.readFileSync(path.join(N, 'build.js'), 'utf8');
const grab = (a, b) => { const i = src.indexOf(a); return src.slice(i, src.indexOf(b, i) + b.length); };
const MAU = new Function(`${grab('const MAU_LOAI = {', '\n};')}\nreturn MAU_LOAI;`)();
const LOAI = new Function(`${grab('const LOAI = {', '\n};')}\nreturn LOAI;`)();
const NB_LOGO = fs.readFileSync(path.join(D, '..', '..', 'public', 'images', 'brand', 'logo-noben.svg'), 'utf8');
const F = path.join(N, 'fonts');
const face = (w, s) => `@font-face{font-family:BVP;font-weight:${w};src:url(data:font/woff2;base64,${fs.readFileSync(path.join(F, `be-vietnam-pro-${s}-${w}-normal.woff2`)).toString('base64')})}`;
const fonts = [500, 600, 700].flatMap((w) => ['latin', 'vietnamese'].map((s) => face(w, s))).join('');
const PHI = 1.61803;
const OUT = process.env.TUI_OUT ? path.resolve(process.env.TUI_OUT) : path.join(D, 'out', 'tui'); fs.mkdirSync(OUT, { recursive: true });
// khổ túi và các phần theo φ của chiều cao: mép hàn trên H/φ⁵, mép hàn đáy H/φ⁷
const dims = (p) => { const [W, H] = KT.tui[p.the_tich] || KT.tui_mac_dinh; const SEAL = H / PHI ** 5, BOT = H / PHI ** 7, CH = H - SEAL - BOT; return { W, H, SEAL, BOT, CH, FW: +(100 * W / CH).toFixed(1) }; };
// 1) dựng nhãn riêng cho từng bề ngang mặt trước
const groups = {};
for (const p of data) { const d = dims(p); (groups[d.FW] = groups[d.FW] || []).push(p.slug); }
const labDir = (fw) => path.join(OUT, '..', `nhan-tui-${fw}`);
for (const [fw, slugs] of Object.entries(groups)) {
  execFileSync('node', [path.join(N, 'build.js'), '--chi', slugs.join(','), '--concept', 't'], { stdio: 'ignore', env: { ...process.env, DATA, LABEL_H: '100', FRONT_W: fw, SIDE_W: '50', OUT_DIR: labDir(fw), DPI: process.env.DPI || '600' } });
}
const sealCss = (col, d) => { const u = d.SEAL / 18; return `
.seal{position:absolute;left:0;right:0;top:0;height:${d.SEAL}mm;background:${col}}
.rib{position:absolute;left:0;right:0;top:${d.SEAL / PHI ** 2}mm;height:${d.SEAL / PHI ** 2}mm;background:repeating-linear-gradient(90deg,rgba(255,255,255,.18) 0 ${0.6 * u}mm,transparent ${0.6 * u}mm ${1.2 * u}mm)}
.tear{position:absolute;left:0;right:0;top:${d.SEAL - d.SEAL / PHI ** 3}mm;border-top:${0.35 * u}mm dashed rgba(255,255,255,.9)}
.n{position:absolute;top:${d.SEAL - d.SEAL / PHI ** 3 - 1.6 * u}mm;width:0;height:0;border-top:${1.6 * u}mm solid transparent;border-bottom:${1.6 * u}mm solid transparent}
.n.l{left:0;border-left:${3 * u}mm solid #fff}.n.r{right:0;border-right:${3 * u}mm solid #fff}
.t{position:absolute;top:${d.SEAL - d.SEAL / PHI ** 3 - 4.2 * u}mm;color:#fff;font-weight:700;font-size:${2.1 * u}mm;letter-spacing:.08em}.t.l{left:${4.6 * u}mm}.t.r{right:${4.6 * u}mm}
.bot{position:absolute;left:0;right:0;bottom:0;height:${d.BOT}mm;background:${col}}
.bot::before{content:'';position:absolute;left:0;right:0;top:0;height:${d.BOT / PHI}mm;background:repeating-linear-gradient(90deg,rgba(255,255,255,.18) 0 ${0.6 * u}mm,transparent ${0.6 * u}mm ${1.2 * u}mm)}`; };
const seal = '<div class="seal"><div class="rib"></div></div><div class="tear"></div><div class="n l"></div><div class="n r"></div><div class="t l">✂ XÉ TẠI ĐÂY</div><div class="t r">XÉ TẠI ĐÂY</div><div class="bot"></div>';
(async () => {
  const b = await chromium.launch();
  for (const p of data) {
    const d = dims(p), col = MAU[p.loai] || '#0c2a63', pxmm = 3000 / d.H, u = d.SEAL / 18;
    const page = await b.newPage({ viewport: { width: Math.round(d.W * pxmm), height: 3000 } });
    const lab = `data:image/png;base64,${fs.readFileSync(path.join(labDir(d.FW), `${p.slug}-concept-t.png`)).toString('base64')}`;
    const LW = 100 + d.FW; // bề ngang nhãn (mm nhãn): 50 | FW | 50
    const base = `*{margin:0;box-sizing:border-box}body{width:${d.W}mm;height:${d.H}mm;position:relative;background:#fff;font-family:BVP;color:#0c2a63;overflow:hidden;zoom:${pxmm / (96 / 25.4)}}${fonts}${sealCss(col, d)}`;
    const front = `<style>${base}.lab{position:absolute;left:0;top:${d.SEAL}mm;width:${d.W}mm;height:${d.CH}mm;background:url(${lab}) no-repeat;background-size:${LW / d.FW * 100}% 100%;background-position:50% 0}</style>${seal}<div class="lab"></div>`;
    // mặt sau: tiêu đề + hai cột (mỗi cột là một mặt bên 50 × 100 của nhãn), phóng lớn nhất có thể
    const m = d.W / PHI ** 6, hd = d.CH / PHI ** 4, gap = m;
    const colH = Math.min(d.CH - 2 * m - hd - m / PHI, (d.W - 2 * m - gap)), colW = colH / 2;
    const back = `<style>${base}
.hd{position:absolute;left:${m}mm;right:${m}mm;top:${d.SEAL + m}mm;height:${hd}mm;display:flex;align-items:center;gap:${4.2 * u}mm;border-bottom:${0.35 * u}mm solid #0c2a63}
.hd svg{width:${hd * 0.62}mm;height:${hd * 0.62}mm;flex:none}.hd b{font-size:${hd * 0.34}mm;letter-spacing:-.02em;flex:1}
.hd span{background:${col};color:#fff;font-weight:700;font-size:${2.4 * u}mm;letter-spacing:.06em;text-transform:uppercase;padding:${1.3 * u}mm ${2.6 * u}mm;border-radius:${u}mm;white-space:nowrap}
.cols{position:absolute;left:0;right:0;top:${d.SEAL + m + hd + m / PHI}mm;display:flex;justify-content:center;gap:${gap}mm}
.cols div{width:${colW}mm;height:${colH}mm;background:url(${lab}) no-repeat;background-size:${LW / 50 * 100}% 100%;box-shadow:inset ${colW * 0.02}mm 0 0 #fff,inset -${colW * 0.02}mm 0 0 #fff}
.cols .l{background-position:0 0}.cols .r{background-position:100% 0}</style>
${seal}<div class="hd">${NB_LOGO}<b>${p.ten}</b><span>${LOAI[p.loai] || ''}</span></div>
<div class="cols"><div class="l"></div><div class="r"></div></div>`;
    for (const [k, html] of [['truoc', front], ['sau', back]]) {
      await page.setContent(`<!doctype html><html><head><meta charset="utf-8"></head><body>${html}</body></html>`, { waitUntil: 'load' });
      await page.evaluate(() => document.fonts.ready);
      await page.screenshot({ path: path.join(OUT, `${p.slug}-${k}.png`) });
    }
    await page.close();
  }
  await b.close(); console.log('túi:', data.length, '→', path.relative(process.cwd(), OUT));
})();
