// File in túi bột (mẫu T), vector, chữ còn sửa được: mỗi sản phẩm một PDF 2 trang (mặt trước, mặt sau)
// theo khổ túi thật (kich-thuoc.json), tràn lề 3 mm, có dấu xén. Kèm file .html cùng tên để sửa bằng trình duyệt.
// Dùng lại nhãn đã dựng (out/nhan-tui-<FW>/<slug>-concept-t.html do tui.js tạo), không vẽ lại.
//   node tui-in.js [--chi slug1,slug2]   → out/in/tui-<ngang>x<cao>mm/<slug>.pdf
// Biến môi trường: DATA, TUI_OUT (nơi tui.js đã ghi), IN_OUT (thư mục ra).
const fs = require('fs'), path = require('path');
const { chromium } = require('playwright');
const D = __dirname, N = path.join(D, 'nhan');
const args = process.argv.slice(2), only = args.includes('--chi') ? new Set(args[args.indexOf('--chi') + 1].split(',')) : null;
const DATA = process.env.DATA ? path.resolve(process.env.DATA) : path.join(N, 'san-pham-son-ha.json');
const data = JSON.parse(fs.readFileSync(DATA, 'utf8')).san_pham.filter((p) => p.dang === 'goi' && (!only || only.has(p.slug)));
const KT = JSON.parse(fs.readFileSync(path.join(D, 'kich-thuoc.json'), 'utf8'));
const TUI = process.env.TUI_OUT ? path.resolve(process.env.TUI_OUT) : path.join(D, 'out', 'tui');
const OUT = process.env.IN_OUT ? path.resolve(process.env.IN_OUT) : path.join(D, 'out', 'in');
const src = fs.readFileSync(path.join(N, 'build.js'), 'utf8');
const grab = (a, b) => { const i = src.indexOf(a); return src.slice(i, src.indexOf(b, i) + b.length); };
const MAU = new Function(`${grab('const MAU_LOAI = {', '\n};')}\nreturn MAU_LOAI;`)();
const LOAI = new Function(`${grab('const LOAI = {', '\n};')}\nreturn LOAI;`)();
const NB_LOGO = fs.readFileSync(path.join(D, '..', '..', 'public', 'images', 'brand', 'logo-noben.svg'), 'utf8').replace(/^[\s\S]*?<svg /, '<svg ');
const PHI = 1.61803, B = 3, M = 6; // tràn lề, vùng dấu xén (mm)
(async () => {
  const br = await chromium.launch();
  const page = await br.newPage();
  for (const p of data) {
    const [W, H] = KT.tui[p.the_tich] || KT.tui_mac_dinh;
    const SEAL = H / PHI ** 5, BOT = H / PHI ** 7, CH = H - SEAL - BOT, FW = +(100 * W / CH).toFixed(1), k = CH / 100, u = SEAL / 18;
    const col = MAU[p.loai] || '#0c2a63';
    const html = fs.readFileSync(path.join(TUI, '..', `nhan-tui-${FW}`, `${p.slug}-concept-t.html`), 'utf8');
    await page.setContent(html, { waitUntil: 'load' });
    await page.evaluate(() => document.fonts.ready);
    const m = W / PHI ** 6, hd = CH / PHI ** 4, gap = m, colH = Math.min(CH - 2 * m - hd - m / PHI, W - 2 * m - gap), kb = colH / 100;
    await page.evaluate((o) => {
      const { W, H, B, M, SEAL, BOT, CH, FW, k, u, col, m, hd, gap, colH, kb, logo, ten, loai, PHI } = o;
      const vars = document.querySelector('.bleed').getAttribute('style') || '';
      const front = document.querySelector('.front'), sides = [...document.querySelectorAll('.side')];
      const TW = W + 2 * (B + M), TH = H + 2 * (B + M);
      const marks = () => { const x0 = M + B, y0 = M + B, x1 = x0 + W, y1 = y0 + H, L = M - 1, ln = (a, b, c, d) => `<line x1="${a}" y1="${b}" x2="${c}" y2="${d}" stroke="#000" stroke-width=".1"/>`;
        let s = ''; for (const x of [x0, x1]) s += ln(x, 0, x, L) + ln(x, TH - L, x, TH); for (const y of [y0, y1]) s += ln(0, y, L, y) + ln(TW - L, y, TW, y);
        return `<svg class="mk" viewBox="0 0 ${TW} ${TH}" style="position:absolute;inset:0;width:${TW}mm;height:${TH}mm">${s}</svg>`; };
      const seal = `<div class="t-seal" style="position:absolute;left:0;right:0;top:0;height:${B + SEAL}mm;background:${col}"></div>
<div style="position:absolute;left:0;right:0;top:${B + SEAL / PHI ** 2}mm;height:${SEAL / PHI ** 2}mm;background:repeating-linear-gradient(90deg,rgba(255,255,255,.18) 0 ${0.6 * u}mm,transparent ${0.6 * u}mm ${1.2 * u}mm)"></div>
<div style="position:absolute;left:0;right:0;top:${B + SEAL - SEAL / PHI ** 3}mm;border-top:${0.35 * u}mm dashed rgba(255,255,255,.9)"></div>
<div class="t-txt" style="position:absolute;left:${B + 4.6 * u}mm;top:${B + SEAL - SEAL / PHI ** 3 - 4.2 * u}mm;color:#fff;font:700 ${2.1 * u}mm BVP;letter-spacing:.08em">XÉ TẠI ĐÂY</div>
<div class="t-txt" style="position:absolute;right:${B + 4.6 * u}mm;top:${B + SEAL - SEAL / PHI ** 3 - 4.2 * u}mm;color:#fff;font:700 ${2.1 * u}mm BVP;letter-spacing:.08em">XÉ TẠI ĐÂY</div>
<div style="position:absolute;left:0;right:0;bottom:0;height:${BOT + B}mm;background:${col}"></div>
<div style="position:absolute;left:0;right:0;bottom:${B + BOT - BOT / PHI}mm;height:${BOT / PHI}mm;background:repeating-linear-gradient(90deg,rgba(255,255,255,.18) 0 ${0.6 * u}mm,transparent ${0.6 * u}mm ${1.2 * u}mm)"></div>`;
      const sheet = (inner) => `<div class="t-sheet" style="position:relative;width:${TW}mm;height:${TH}mm;background:#fff;page-break-after:always;overflow:hidden"><div class="t-bleed" style="position:absolute;left:${M}mm;top:${M}mm;width:${W + 2 * B}mm;height:${H + 2 * B}mm;overflow:hidden;background:#fff;${vars}">${seal}${inner}</div>${marks()}</div>`;
      const A = (n) => 100 / PHI ** n;
      document.body.innerHTML = sheet(`<div style="position:absolute;left:0;right:0;top:${B + SEAL + A(4) * k}mm;height:${A(3) * k}mm;background:${col}"></div>
<div id="t-front" style="position:absolute;left:${B}mm;top:${B + SEAL}mm;width:${FW}mm;height:100mm;transform:scale(${k});transform-origin:0 0"></div>`)
        + sheet(`<div style="position:absolute;left:${B + m}mm;right:${B + m}mm;top:${B + SEAL + m}mm;height:${hd}mm;display:flex;align-items:center;gap:${4.2 * u}mm;border-bottom:${0.35 * u}mm solid #0c2a63;color:#0c2a63;font-family:BVP">
<span style="display:block;width:${hd * 0.62}mm;height:${hd * 0.62}mm;flex:none">${logo.replace('<svg ', '<svg style="width:100%;height:100%" ')}</span><b style="font-size:${hd * 0.34}mm;letter-spacing:-.02em;flex:1">${ten}</b>
<span style="background:${col};color:#fff;font-weight:700;font-size:${2.4 * u}mm;letter-spacing:.06em;text-transform:uppercase;padding:${1.3 * u}mm ${2.6 * u}mm;border-radius:${u}mm;white-space:nowrap">${loai}</span></div>
<div id="t-l" style="position:absolute;left:${B + (W - colH - gap) / 2}mm;top:${B + SEAL + m + hd + m / PHI}mm;width:50mm;height:100mm;transform:scale(${kb});transform-origin:0 0"></div>
<div id="t-r" style="position:absolute;left:${B + (W - colH - gap) / 2 + colH / 2 + gap}mm;top:${B + SEAL + m + hd + m / PHI}mm;width:50mm;height:100mm;transform:scale(${kb});transform-origin:0 0"></div>`);
      front.style.width = FW + 'mm'; document.getElementById('t-front').appendChild(front);
      sides.forEach((s2, i) => { s2.style.width = '50mm'; document.getElementById(i ? 't-r' : 't-l').appendChild(s2); });
      document.documentElement.style.background = '#fff'; document.body.style.margin = '0';
      const st = document.createElement('style'); st.textContent = `@page{size:${TW}mm ${TH}mm;margin:0}`; document.head.appendChild(st);
      document.title = `Túi ${ten} ${W} × ${H} mm (tràn lề ${B} mm)`;
    }, { W, H, B, M, SEAL, BOT, CH, FW, k, u, col, m, hd, gap, colH, kb, logo: NB_LOGO, ten: p.ten, loai: LOAI[p.loai] || '', PHI });
    const dir = path.join(OUT, `tui-${W}x${H}mm`); fs.mkdirSync(dir, { recursive: true });
    fs.writeFileSync(path.join(dir, `${p.slug}.html`), await page.evaluate(() => '<!doctype html>' + document.documentElement.outerHTML));
    await page.pdf({ path: path.join(dir, `${p.slug}.pdf`), width: `${W + 2 * (B + M)}mm`, height: `${H + 2 * (B + M)}mm`, printBackground: true });
  }
  await br.close(); console.log('file in túi:', data.length, '→', path.relative(process.cwd(), OUT));
})();
