'use strict';
// Nhãn sản phẩm cho trình chỉnh /quan-tri/nhan.
// Nội dung gốc: brand/labels.json + brand/label-spec.json (trong Git). Thay đổi lưu từ web nằm ở
// DATA_DIR/label-edits.json (không vào Git; có trong bản sao lưu hằng ngày). Muốn đưa vào bản in:
// node scripts/build-labels.js --dung-ban-luu
const fs = require('fs');
const path = require('path');
const data = require('./datadir');

const BRAND = path.join(__dirname, '..', 'brand');
const EDITS = () => data.file('label-edits.json');
const FIELDS_TEXT = ['ten', 'phu_de', 'nhom_hien_thi', 'quy_cach', 'bao_quan', 'luu_y'];
const FIELDS_LIST = ['nhan_phu', 'cong_dung', 'thanh_phan', 'huong_dan'];
const FIELDS_LEGAL = ['so_dang_ky', 'nsx', 'hsd', 'khoi_luong_tinh', 'ma_vach'];

const readJson = (f, fallback) => { try { return JSON.parse(fs.readFileSync(f, 'utf8')); } catch { return fallback; } };
let cache = null;
function base() {
  if (!cache) {
    const doc = readJson(path.join(BRAND, 'labels.json'), { san_pham: [] });
    cache = { spec: readJson(path.join(BRAND, 'label-spec.json'), { kho: {} }), labels: doc.san_pham || [] };
  }
  return cache;
}
const edits = () => readJson(EDITS(), {});

// Chỉ nhận các trường đã biết, chuỗi có giới hạn độ dài: không để dữ liệu lạ lọt vào file.
function clean(input, spec) {
  const str = (v, max) => String(v == null ? '' : v).replace(/[\u0000-\u0008\u000b-\u001f]/g, '').slice(0, max).trim();
  const out = {};
  for (const k of FIELDS_TEXT) if (k in input) out[k] = str(input[k], 300);
  for (const k of FIELDS_LIST) if (k in input) {
    const arr = Array.isArray(input[k]) ? input[k] : String(input[k] || '').split('\n');
    out[k] = arr.map((x) => str(x, 600)).filter(Boolean).slice(0, k === 'nhan_phu' ? 3 : 15);
  }
  if (input.phap_ly && typeof input.phap_ly === 'object') {
    out.phap_ly = {};
    for (const k of FIELDS_LEGAL) out.phap_ly[k] = str(input.phap_ly[k], 120) || '[ĐIỀN]';
  }
  if ('mau_nhan' in input) out.mau_nhan = /^#[0-9a-f]{6}$/i.test(String(input.mau_nhan || '')) ? String(input.mau_nhan).toLowerCase() : null;
  if ('bao_bi' in input && spec.kho[input.bao_bi]) out.bao_bi = input.bao_bi;
  return out;
}

function all() {
  const { spec, labels } = base();
  const e = edits();
  return {
    spec,
    labels: labels.map((l) => ({ ...l, ...(e[l.slug] ? e[l.slug].label : {}), slug: l.slug, _sua: e[l.slug] ? e[l.slug].at : null })),
    goc: labels,
  };
}

async function save(slug, input) {
  const { spec, labels } = base();
  if (!labels.some((l) => l.slug === slug)) return { ok: false, message: 'Không có sản phẩm này.' };
  const e = edits();
  e[slug] = { at: new Date().toISOString(), label: clean(input || {}, spec) };
  await data.writeJson(EDITS(), e, 1);
  return { ok: true, at: e[slug].at };
}

async function reset(slug) {
  const e = edits();
  if (!e[slug]) return { ok: true };
  delete e[slug];
  await data.writeJson(EDITS(), e, 1);
  return { ok: true };
}

module.exports = { all, save, reset, clean, _reload: () => { cache = null; } };
