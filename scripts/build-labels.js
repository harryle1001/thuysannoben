#!/usr/bin/env node
'use strict';
// Sinh nhãn chỉnh sửa được cho mọi sản phẩm đang hiển thị trên web.
//   node scripts/build-labels.js                 SVG + PNG xem trước + PDF in thử + tờ tổng hợp
//   node scripts/build-labels.js --chi g7,kalimix   chỉ vài sản phẩm (theo slug)
//   node scripts/build-labels.js --khong-pdf     bỏ PDF (nhanh hơn)
//   node scripts/build-labels.js --kiem-tra      chỉ dàn trang + kiểm tra chữ tràn ở MỌI khổ, không ghi file
//   node scripts/build-labels.js --dung-ban-luu  áp thêm các thay đổi đã lưu ở /quan-tri/nhan (DATA_DIR/label-edits.json)
// Nội dung nhãn: brand/labels.json (sửa ở đây). Khổ nhãn: brand/label-spec.json.
// Cần Playwright + Chromium (dùng để đo chữ bằng phông thật, kiểm tra getBBox và xuất PNG/PDF).
const fs = require('fs');
const path = require('path');

const ROOT = path.join(__dirname, '..');
const BRAND = path.join(ROOT, 'brand');
const args = process.argv.slice(2);
const flag = (f) => args.includes(f);
const opt = (f) => { const i = args.indexOf(f); return i > -1 ? args[i + 1] : null; };
const OUT = path.resolve(opt('--out') || BRAND);

const HIDDEN = new Set(['flophen', 'flophenicol-40', 'zicotrim', 'prazi-s', 'de-zoo', 'bronopol', 'ben-xid-3000', 'ben-mkc-4000', 'aqua-tech', 'super-gold']);
const LAYERS = ['nen', 'dai-thuong-hieu', 'logo', 'ten-san-pham', 'cong-dung', 'huong-dan', 'thanh-phan', 'phap-ly', 'ma-vach', 'vung-an-toan'];
const DIEN = '[ĐIỀN]';
const CHIP = { 'gan-ruot': 'Gan ruột', 'mang-dom-den': 'Mang, đốm đen', 'mem-vo': 'Cứng vỏ', 'mau-nuoc': 'Màu nước', 'khi-doc': 'Khí độc', 'oxy-stress': 'Oxy, sốc', 'sat-trung': 'Sát trùng', 'tieu-hoa': 'Tiêu hóa' };

const readJson = (f) => JSON.parse(fs.readFileSync(f, 'utf8'));
const engine = require(path.join(ROOT, 'public', 'js', 'label-engine.js'));

// Đoán loại bao bì từ quy cách in trên nhãn gốc, nếu không có thì từ liều dùng.
function guessPack(p, quyCach) {
  const first = String(quyCach || '').toLowerCase().split(/[,;]/)[0];
  if (/(^|\s)(xô|xo|thùng)(\s|$)/.test(first)) return 'xo';
  if (/(^|\s)(chai|can|lít|lit)(\s|$)/.test(first)) return 'chai';
  if (first.trim()) return 'tui';
  const dose = (p.dose || []).join(' ');
  return /\d\s*ml\b|lít/i.test(dose) && !/kg\s*\//i.test(dose) ? 'chai' : 'tui';
}

function defaultLabel(p) {
  const chips = (p.symptoms || []).map((s) => CHIP[s]).filter(Boolean).slice(0, 3);
  return {
    slug: p.slug,
    nhom: p.category,
    bao_bi: guessPack(p, p.packaging),
    ten: p.name,
    phu_de: engine.plain(p.tagline),
    nhan_phu: chips,
    cong_dung: engine.list(p.uses),
    thanh_phan: engine.list(p.composition),
    huong_dan: engine.list(p.dose),
    quy_cach: engine.plain(p.packaging) || '',
    bao_quan: 'Nơi khô ráo, thoáng mát, tránh ánh nắng trực tiếp.',
    luu_y: 'Đọc kỹ hướng dẫn sử dụng trước khi dùng.',
    mau_nhan: null,
    phap_ly: { so_dang_ky: DIEN, nsx: DIEN, hsd: DIEN, khoi_luong_tinh: DIEN, ma_vach: DIEN },
    so_dang_ky_doc_tu_anh: null,
  };
}

// labels.json luôn có đủ sản phẩm đang hiển thị: thêm sản phẩm mới, giữ nguyên nội dung đã sửa.
function loadLabels({ write = true } = {}) {
  const file = path.join(BRAND, 'labels.json');
  const products = readJson(path.join(ROOT, 'content', 'products.json')).filter((p) => !HIDDEN.has(p.slug));
  const doc = fs.existsSync(file) ? readJson(file) : { _ghi_chu: [], san_pham: [] };
  const bySlug = new Map(doc.san_pham.map((l) => [l.slug, l]));
  let added = 0;
  const list = products.map((p) => {
    if (bySlug.has(p.slug)) return bySlug.get(p.slug);
    added++;
    return defaultLabel(p);
  });
  doc.san_pham = list;
  if (added && write) fs.writeFileSync(file, JSON.stringify(doc, null, 2) + '\n');
  return { doc, list, added };
}

function applySavedEdits(list) {
  let dir = process.env.DATA_DIR;
  if (!dir) { try { dir = require(path.join(ROOT, 'src', 'datadir')).DIR; } catch { return 0; } }
  const f = path.join(dir, 'label-edits.json');
  if (!fs.existsSync(f)) return 0;
  const edits = readJson(f);
  let n = 0;
  for (const l of list) if (edits[l.slug] && edits[l.slug].label) { Object.assign(l, edits[l.slug].label, { slug: l.slug }); n++; }
  return n;
}

function fontCss() {
  const F = path.join(ROOT, 'public', 'fonts');
  const b64 = (f) => fs.readFileSync(path.join(F, f)).toString('base64');
  const VI = 'U+0102-0103,U+0110-0111,U+0128-0129,U+0168-0169,U+01A0-01A1,U+01AF-01B0,U+0300-0301,U+0303-0304,U+0308-0309,U+0323,U+0329,U+1EA0-1EF9,U+20AB';
  const faces = [];
  for (const w of [400, 600]) {
    faces.push(`@font-face{font-family:'Be Vietnam Pro';font-weight:${w};src:url(data:font/woff2;base64,${b64(`be-vietnam-pro-vietnamese-${w}-normal.woff2`)}) format('woff2');unicode-range:${VI}}`);
    faces.push(`@font-face{font-family:'Be Vietnam Pro';font-weight:${w};src:url(data:font/woff2;base64,${b64(`be-vietnam-pro-latin-ext-${w}-normal.woff2`)}) format('woff2');unicode-range:U+0100-02AF,U+1E00-1E9F,U+1EF2-1EFF,U+2020,U+20A0-20AB,U+20AD-20C0,U+2113,U+2C60-2C7F,U+A720-A7FF}`);
    faces.push(`@font-face{font-family:'Be Vietnam Pro';font-weight:${w};src:url(data:font/woff2;base64,${b64(`be-vietnam-pro-latin-${w}-normal.woff2`)}) format('woff2')}`);
  }
  faces.push(`@font-face{font-family:'Playfair Display';font-weight:400 900;src:url(data:font/woff2;base64,${b64('playfair-display-vietnamese-wght-normal.woff2')}) format('woff2');unicode-range:${VI}}`);
  faces.push(`@font-face{font-family:'Playfair Display';font-weight:400 900;src:url(data:font/woff2;base64,${b64('playfair-display-latin-wght-normal.woff2')}) format('woff2')}`);
  return faces.join('\n');
}

const SAMPLE = 'AĂÂBCDĐEÊGHIKLMNOÔƠPQRSTUƯVXY aăâđêôơư ÀẢÃÁẠẰẲẴẮẶẦẨẪẤẬÈẺẼÉẸỀỂỄẾỆÌỈĨÍỊÒỎÕÓỌỒỔỖỐỘỜỞỠỚỢÙỦŨÚỤỪỬỮỨỰỲỶỸÝỴ àảãáạằẳẵắặầẩẫấậèẻẽéẹềểễếệìỉĩíịòỏõóọồổỗốộờởỡớợùủũúụừửữứựỳỷỹýỵ 0123456789 ³²•·–';

async function openPage(browser, css) {
  const page = await browser.newPage();
  await page.setContent(`<!doctype html><meta charset="utf-8"><style>${css}\nhtml,body{margin:0;background:#fff}</style><body><div id="stage"></div></body>`);
  await page.addScriptTag({ content: fs.readFileSync(path.join(ROOT, 'public', 'js', 'label-engine.js'), 'utf8') });
  await page.evaluate(async (sample) => {
    const want = ['400 20px "Be Vietnam Pro"', '600 20px "Be Vietnam Pro"', '800 20px "Playfair Display"'];
    await Promise.all(want.map((f) => document.fonts.load(f, sample)));
    await document.fonts.ready;
  }, SAMPLE);
  const ok = await page.evaluate(() => ['400 12px "Be Vietnam Pro"', '600 12px "Be Vietnam Pro"', '800 12px "Playfair Display"'].every((f) => document.fonts.check(f, 'Ữ')));
  if (!ok) throw new Error('Không nạp được phông Be Vietnam Pro / Playfair Display');
  return page;
}

// Dàn trang trong trình duyệt (đo bằng phông thật).
async function layoutAll(page, jobs, spec, mark) {
  return page.evaluate(({ jobs, spec, mark }) => {
    const M = NobenLabel.canvasMeasurer(document);
    return jobs.map((j) => {
      const r = NobenLabel.layout(j.size, j.label, { measure: M, spec, mark });
      return { key: j.key, svg: r.svg, fit: r.fit, warnings: r.warnings };
    });
  }, { jobs, spec, mark });
}

// Kiểm tra một SVG: hợp lệ, đủ lớp, chữ không tràn khung / vùng an toàn, chữ các lớp không chồng nhau.
async function checkSvg(page, svg) {
  return page.evaluate((svg) => {
    const issues = [];
    const doc = new DOMParser().parseFromString(svg, 'image/svg+xml');
    if (doc.getElementsByTagName('parsererror').length) return ['SVG không hợp lệ (XML lỗi)'];
    const stage = document.getElementById('stage');
    stage.innerHTML = svg;
    const root = stage.querySelector('svg');
    const [W, H] = root.getAttribute('data-trim').split(' ').map(Number);
    const safe = Number(root.getAttribute('data-an-toan'));
    const TOL = 0.3;
    const want = ['nen', 'dai-thuong-hieu', 'logo', 'ten-san-pham', 'cong-dung', 'huong-dan', 'thanh-phan', 'phap-ly', 'ma-vach', 'vung-an-toan'];
    for (const id of want) if (!root.querySelector(`g[id="${id}"]`)) issues.push(`thiếu lớp ${id}`);
    if (!/mm$/.test(root.getAttribute('width'))) issues.push('kích thước không theo mm');
    const inside = (b, x, y, w, h) => b.x >= x - TOL && b.y >= y - TOL && b.x + b.width <= x + w + TOL && b.y + b.height <= y + h + TOL;
    const texts = [];
    for (const g of root.querySelectorAll('g[data-khung]')) {
      const [x, y, w, h] = g.getAttribute('data-khung').split(' ').map(Number);
      for (const t of g.querySelectorAll('text')) {
        const b = t.getBBox();
        if (!t.textContent.trim()) continue;
        texts.push({ id: g.id, b, t: t.textContent.slice(0, 40) });
        if (!inside(b, x, y, w, h)) issues.push(`chữ tràn khung lớp ${g.id}: "${t.textContent.slice(0, 40)}"`);
      }
    }
    for (const t of texts) if (!inside(t.b, safe, safe, W - 2 * safe, H - 2 * safe)) issues.push(`chữ ra ngoài vùng an toàn (${t.id}): "${t.t}"`);
    const lb = root.querySelector('g[id="logo"]').getBBox();
    if (lb.width && !inside(lb, safe, safe, W - 2 * safe, H - 2 * safe)) issues.push('logo ra ngoài vùng an toàn');
    for (let i = 0; i < texts.length; i++) for (let j = i + 1; j < texts.length; j++) {
      const a = texts[i], c = texts[j];
      if (a.id === c.id) continue;
      const ov = Math.min(a.b.x + a.b.width, c.b.x + c.b.width) - Math.max(a.b.x, c.b.x) > TOL && Math.min(a.b.y + a.b.height, c.b.y + c.b.height) - Math.max(a.b.y, c.b.y) > TOL;
      if (ov) issues.push(`chữ chồng nhau: ${a.id} "${a.t}" / ${c.id} "${c.t}"`);
    }
    stage.innerHTML = '';
    return issues;
  }, svg);
}

async function main() {
  const t0 = Date.now();
  const spec = readJson(path.join(BRAND, 'label-spec.json'));
  const { list, added } = loadLabels({ write: !flag('--kiem-tra') });
  if (added) console.log(`Thêm ${added} sản phẩm mới vào brand/labels.json`);
  if (flag('--dung-ban-luu')) console.log(`Áp ${applySavedEdits(list)} nhãn đã lưu trên web`);
  const only = opt('--chi') ? new Set(opt('--chi').split(',')) : null;
  const labels = list.filter((l) => !only || only.has(l.slug));
  const mark = fs.readFileSync(path.join(ROOT, 'public', 'images', 'brand', 'logo-noben.svg'), 'utf8');
  const checkOnly = flag('--kiem-tra');

  let chromium;
  try { ({ chromium } = require('playwright')); } catch { console.error('Cần Playwright: npm i -D playwright (hoặc dùng bản cài sẵn).'); process.exit(2); }
  const browser = await chromium.launch(process.env.PW_CHROMIUM ? { executablePath: process.env.PW_CHROMIUM } : {});
  const css = fontCss();
  const page = await openPage(browser, css);

  const jobs = [];
  for (const l of labels) {
    const kinds = checkOnly ? Object.keys(spec.kho) : [spec.kho[l.bao_bi] ? l.bao_bi : 'tui'];
    for (const k of kinds) jobs.push({ key: `${l.slug}@${k}`, size: spec.kho[k], label: l });
  }
  const results = await layoutAll(page, jobs, spec, mark);
  const report = [];
  let bad = 0;
  for (const r of results) {
    const issues = [...r.warnings.filter((w) => /^TRÀN/.test(w)), ...(await checkSvg(page, r.svg))];
    if (issues.length) bad++;
    report.push({ nhan: r.key, co_chu_pt: r.fit.body_pt, duoi_toi_thieu: r.fit.below_min, loi: issues });
  }

  if (!checkOnly) {
    for (const d of ['nhan', 'nhan-png', ...(flag('--khong-pdf') ? [] : ['nhan-pdf'])]) fs.mkdirSync(path.join(OUT, d), { recursive: true });
    const view = await browser.newPage({ viewport: { width: 800, height: 1400 }, deviceScaleFactor: 1 });
    await view.setContent(`<!doctype html><meta charset="utf-8"><style>${css}\nhtml,body{margin:0;background:#fff}#v svg{display:block;width:520px;height:auto}</style><div id="v"></div>`);
    await view.evaluate(async (s) => { await Promise.all(['400 20px "Be Vietnam Pro"', '600 20px "Be Vietnam Pro"', '800 20px "Playfair Display"'].map((f) => document.fonts.load(f, s))); }, SAMPLE);
    for (const r of results) {
      const slug = r.key.split('@')[0];
      fs.writeFileSync(path.join(OUT, 'nhan', `${slug}.svg`), `<?xml version="1.0" encoding="UTF-8"?>\n${r.svg}\n`);
      await view.evaluate((svg) => { document.getElementById('v').innerHTML = svg; }, engine.trimView(r.svg));
      await view.locator('#v svg').screenshot({ path: path.join(OUT, 'nhan-png', `${slug}.png`) });
      if (!flag('--khong-pdf')) {
        const m = /width="([\d.]+)mm" height="([\d.]+)mm"/.exec(r.svg);
        const pdf = await browser.newPage();
        await pdf.setContent(`<!doctype html><meta charset="utf-8"><style>${css}\n@page{size:${m[1]}mm ${m[2]}mm;margin:0}html,body{margin:0}svg{display:block}</style>${r.svg}`);
        await pdf.evaluate(() => document.fonts.ready);
        await pdf.pdf({ path: path.join(OUT, 'nhan-pdf', `${slug}.pdf`), width: `${m[1]}mm`, height: `${m[2]}mm`, printBackground: true, pageRanges: '1' });
        await pdf.close();
      }
    }
    await view.close();
    if (!flag('--khong-pdf') && !only) await summarySheet(browser, css, results, labels, spec);
    fs.writeFileSync(path.join(OUT, 'nhan-bao-cao.json'), JSON.stringify({ tao_luc: new Date().toISOString(), so_nhan: results.length, loi: bad, nhan: report }, null, 1) + '\n');
  }
  await browser.close();

  for (const r of report) if (r.loi.length) console.log(`LỖI ${r.nhan}: ${r.loi.join(' | ')}`);
  const small = report.filter((r) => r.co_chu_pt < 5.5);
  if (small.length) console.log(`Chú ý: ${small.length} nhãn phải dùng cỡ chữ < 5,5 pt: ${small.map((r) => `${r.nhan} (${r.co_chu_pt} pt)`).join(', ')}`);
  console.log(`${results.length} nhãn, ${bad} nhãn có lỗi, ${((Date.now() - t0) / 1000).toFixed(1)} s`);
  process.exitCode = bad ? 1 : 0;
  return { results: results.length, bad, report };
}

// Tờ tổng hợp A4: 8 nhãn mỗi trang để xem nhanh.
async function summarySheet(browser, css, results, labels, spec) {
  const byslug = Object.fromEntries(labels.map((l) => [l.slug, l]));
  const cells = results.map((r, i) => {
    const slug = r.key.split('@')[0];
    const l = byslug[slug];
    const k = spec.kho[l.bao_bi] || spec.kho.tui;
    return `<figure>${engine.trimView(r.svg).replace(/width="[\d.]+mm" height="[\d.]+mm"/, '').replace(/nb-/g, `nb${i}-`)}<figcaption><b>${slug}</b> · ${k.ten} ${k.w}×${k.h} mm · chữ ${String(r.fit.body_pt).replace('.', ',')} pt</figcaption></figure>`;
  });
  const pages = [];
  for (let i = 0; i < cells.length; i += 8) pages.push(`<section>${i === 0 ? `<h1>Nhãn Noben – tờ tổng hợp (${results.length} sản phẩm, bản in thử)</h1>` : ''}<div class="grid">${cells.slice(i, i + 8).join('')}</div></section>`);
  const p = await browser.newPage();
  await p.setContent(`<!doctype html><meta charset="utf-8"><style>${css}
@page{size:A4 portrait;margin:8mm}
html,body{margin:0;font-family:'Be Vietnam Pro',sans-serif;color:#13213a}
h1{font-size:11pt;margin:0 0 3mm;font-weight:600}
section{page-break-after:always;height:281mm;display:flex;flex-direction:column}
.grid{display:grid;grid-template-columns:repeat(4,1fr);grid-auto-rows:1fr;gap:4mm;flex:1}
figure{margin:0;display:flex;flex-direction:column;align-items:center;min-height:0}
figure svg{flex:1;min-height:0;width:100%;height:auto;max-height:118mm;box-shadow:0 0 0 .2mm #c7d3e6}
figcaption{font-size:6pt;margin-top:1mm;text-align:center;color:#4a5b78}
</style>${pages.join('')}`);
  await p.evaluate(() => document.fonts.ready);
  await p.pdf({ path: path.join(OUT, 'nhan-tong-hop.pdf'), format: 'A4', printBackground: true });
  await p.close();
}

if (require.main === module) main().catch((e) => { console.error(e); process.exit(1); });
module.exports = { loadLabels, defaultLabel, guessPack, LAYERS, main };
